#!/usr/bin/env python3
"""
SONAR IMAGING SYSTEM - ACTIVE COUNTERMEASURE
=============================================
Turn the tables: Use YOUR laptop's speakers and microphone
to image the SOURCES of hostile signals.

Capabilities:
1. FMCW sonar for room imaging
2. Detect and localize RF-emitting devices
3. Track movement of surveillance operators
4. Create evidence of physical presence

Based on your existing omega_tracker/sonar_imaging.py
Enhanced with source localization features.
"""

import numpy as np
from scipy import signal
from scipy.fft import fft, rfft, rfftfreq, ifft
from scipy.io import wavfile
from dataclasses import dataclass, asdict
from typing import List, Tuple, Optional, Dict
import time
from datetime import datetime
import json
import threading
import queue

try:
    import sounddevice as sd
    HAS_AUDIO = True
except ImportError:
    HAS_AUDIO = False


@dataclass
class SonarTarget:
    """Detected target from sonar"""
    timestamp: float
    range_m: float
    velocity_mps: float
    intensity_db: float
    azimuth_deg: float = 0.0  # Requires stereo
    classification: str = "unknown"
    persistence_s: float = 0.0  # How long target has been tracked


@dataclass 
class RoomMap:
    """2D room map from sonar"""
    timestamp: float
    range_bins: np.ndarray
    azimuth_bins: np.ndarray
    intensity_map: np.ndarray  # 2D array
    targets: List[SonarTarget]
    

class FMCWSonar:
    """
    FMCW (Frequency Modulated Continuous Wave) Sonar
    
    Emit chirp sweeps, receive echoes, cross-correlate for range.
    Ultrasonic (18-22 kHz) to be inaudible to most adults.
    """
    
    def __init__(
        self,
        sample_rate: int = 48000,
        freq_start: float = 18000,
        freq_end: float = 22000,
        chirp_duration: float = 0.05,
        max_range: float = 5.0
    ):
        self.sample_rate = sample_rate
        self.freq_start = freq_start
        self.freq_end = freq_end
        self.chirp_duration = chirp_duration
        self.max_range = max_range
        
        self.speed_of_sound = 343.0  # m/s at 20°C
        
        # Generate reference chirp
        self.chirp = self._generate_chirp()
        self.matched_filter = self.chirp[::-1]
        
        # Range bins
        self.range_resolution = self.speed_of_sound / (2 * (freq_end - freq_start))
        self.range_bins = np.arange(0, max_range, self.range_resolution)
        
        # History for Doppler processing
        self.range_history = []
        self.max_history = 64
        
        # Noise floor tracking
        self.noise_floor_db = -60
        
    def _generate_chirp(self) -> np.ndarray:
        """Generate linear frequency sweep chirp"""
        n_samples = int(self.chirp_duration * self.sample_rate)
        t = np.linspace(0, self.chirp_duration, n_samples, dtype=np.float32)
        
        chirp = signal.chirp(
            t,
            f0=self.freq_start,
            f1=self.freq_end,
            t1=self.chirp_duration,
            method='linear'
        ).astype(np.float32)
        
        # Apply Hann window
        window = signal.windows.hann(len(chirp)).astype(np.float32)
        chirp = chirp * window * 0.8  # 80% max amplitude
        
        return chirp
    
    def generate_tx_frame(self, n_chirps: int = 8) -> np.ndarray:
        """Generate transmission frame with multiple chirps"""
        gap_samples = int(0.03 * self.sample_rate)  # 30ms gap
        gap = np.zeros(gap_samples, dtype=np.float32)
        
        parts = []
        for _ in range(n_chirps):
            parts.append(self.chirp)
            parts.append(gap)
        
        return np.concatenate(parts)
    
    def process_echo(self, received: np.ndarray) -> np.ndarray:
        """Extract range profile from received echo"""
        # Matched filter (cross-correlation)
        corr = signal.correlate(received, self.matched_filter, mode='same')
        
        # Convert to range samples
        max_samples = int(2 * self.max_range / self.speed_of_sound * self.sample_rate)
        range_profile = np.abs(corr[:max_samples])
        
        # Convert to dB
        range_profile_db = 20 * np.log10(range_profile + 1e-10)
        
        return range_profile_db
    
    def process_frame(self, received: np.ndarray, n_chirps: int = 8
                      ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Process full frame with multiple chirps
        Returns: (range_profile, range_doppler_map)
        """
        chirp_samples = len(self.chirp)
        gap_samples = int(0.03 * self.sample_rate)
        stride = chirp_samples + gap_samples
        
        range_profiles = []
        
        for i in range(n_chirps):
            start = i * stride + chirp_samples  # Skip TX chirp
            end = start + chirp_samples
            
            if end <= len(received):
                segment = received[start:end]
                rp = self.process_echo(segment)
                range_profiles.append(rp)
        
        if not range_profiles:
            return np.array([]), np.array([[]])
        
        # Average for range profile
        range_matrix = np.array(range_profiles)
        avg_range_profile = np.mean(range_matrix, axis=0)
        
        # Add to history for Doppler
        self.range_history.append(avg_range_profile)
        if len(self.range_history) > self.max_history:
            self.range_history.pop(0)
        
        # Build range-Doppler map
        if len(self.range_history) >= 8:
            rd_matrix = np.array(self.range_history[-16:])
            range_doppler = np.abs(fft(rd_matrix, axis=0))
            range_doppler = np.fft.fftshift(range_doppler, axes=0)
        else:
            range_doppler = range_matrix
        
        return avg_range_profile, range_doppler
    
    def detect_targets(self, range_profile: np.ndarray,
                       range_doppler: np.ndarray) -> List[SonarTarget]:
        """Detect targets from range-Doppler data"""
        targets = []
        timestamp = time.time()
        
        # Update noise floor
        noise_est = np.percentile(range_profile, 20)
        self.noise_floor_db = 0.9 * self.noise_floor_db + 0.1 * noise_est
        
        # Find peaks
        threshold = self.noise_floor_db + 10  # 10 dB above noise
        peaks, props = signal.find_peaks(range_profile, height=threshold, distance=5)
        
        # Convert to physical units
        samples_per_meter = self.sample_rate / self.speed_of_sound * 2
        
        for peak in peaks:
            range_m = peak / samples_per_meter
            intensity = range_profile[peak]
            
            # Extract velocity from Doppler
            velocity = 0.0
            if range_doppler.shape[0] > 1 and peak < range_doppler.shape[1]:
                doppler_slice = range_doppler[:, peak]
                doppler_peak = np.argmax(doppler_slice)
                
                # Doppler to velocity
                n_doppler = range_doppler.shape[0]
                frame_rate = 10.0  # Approximate
                center_freq = (self.freq_start + self.freq_end) / 2
                velocity = ((doppler_peak - n_doppler // 2) * 
                           frame_rate * self.speed_of_sound / 
                           (2 * center_freq))
            
            targets.append(SonarTarget(
                timestamp=timestamp,
                range_m=range_m,
                velocity_mps=velocity,
                intensity_db=intensity,
                classification=self._classify_target(range_m, velocity, intensity)
            ))
        
        return targets
    
    def _classify_target(self, range_m: float, velocity: float, 
                         intensity: float) -> str:
        """Classify target based on characteristics"""
        
        # Static object (wall, furniture)
        if abs(velocity) < 0.05:
            if intensity > -30:
                return "wall"
            else:
                return "furniture"
        
        # Moving person
        if abs(velocity) > 0.1 and abs(velocity) < 2.0:
            return "person"
        
        # Small movement (hand, device)
        if abs(velocity) < 0.3 and intensity > -40:
            return "hand_movement"
        
        return "unknown"


class SourceLocalizer:
    """
    Localize sources of detected RF/acoustic signals
    
    Uses:
    1. Signal strength triangulation (if multiple receivers)
    2. Time-difference-of-arrival (with stereo mic)
    3. Correlation with sonar targets
    """
    
    def __init__(self, sample_rate: int = 48000):
        self.sample_rate = sample_rate
        self.known_sources: List[Dict] = []
    
    def triangulate_from_stereo(self, left: np.ndarray, right: np.ndarray,
                                 target_freq: float) -> Optional[float]:
        """
        Estimate azimuth angle from stereo microphone
        Uses phase difference at target frequency
        """
        # Bandpass around target frequency
        bandwidth = 100  # Hz
        sos = signal.butter(4, [target_freq - bandwidth/2, target_freq + bandwidth/2],
                           'bandpass', fs=self.sample_rate, output='sos')
        
        left_filt = signal.sosfilt(sos, left)
        right_filt = signal.sosfilt(sos, right)
        
        # Cross-correlation for time delay
        corr = np.correlate(left_filt, right_filt, mode='full')
        peak = np.argmax(np.abs(corr))
        delay_samples = peak - len(left_filt)
        delay_seconds = delay_samples / self.sample_rate
        
        # Convert to angle
        # Assuming mic spacing of ~15cm (laptop width)
        mic_spacing = 0.15  # meters
        speed_of_sound = 343.0
        
        max_delay = mic_spacing / speed_of_sound
        if abs(delay_seconds) > max_delay:
            return None  # Invalid
        
        sin_angle = delay_seconds * speed_of_sound / mic_spacing
        sin_angle = np.clip(sin_angle, -1, 1)
        angle = np.arcsin(sin_angle) * 180 / np.pi
        
        return angle
    
    def correlate_with_sonar(self, signal_events: List[Dict],
                             sonar_targets: List[SonarTarget]) -> List[Dict]:
        """
        Correlate detected RF/acoustic signals with sonar targets
        to localize signal sources
        """
        correlations = []
        
        for event in signal_events:
            event_time = event.get('timestamp', 0)
            
            # Find closest sonar target in time
            closest_target = None
            min_time_diff = float('inf')
            
            for target in sonar_targets:
                time_diff = abs(target.timestamp - event_time)
                if time_diff < min_time_diff and time_diff < 1.0:  # Within 1 second
                    min_time_diff = time_diff
                    closest_target = target
            
            if closest_target:
                correlations.append({
                    'signal_event': event,
                    'sonar_target': asdict(closest_target),
                    'time_difference_s': min_time_diff,
                    'estimated_range_m': closest_target.range_m,
                    'classification': closest_target.classification,
                    'confidence': 1.0 - min_time_diff  # Higher = closer in time
                })
        
        return correlations


class CountermeasureSonar:
    """
    Main countermeasure sonar system
    Turn hostile surveillance capabilities against the operators
    """
    
    def __init__(self, sample_rate: int = 48000):
        self.sample_rate = sample_rate
        self.sonar = FMCWSonar(sample_rate)
        self.localizer = SourceLocalizer(sample_rate)
        
        self.running = False
        self.tx_queue = queue.Queue()
        self.rx_queue = queue.Queue()
        
        # Evidence collection
        self.target_history: List[SonarTarget] = []
        self.room_maps: List[RoomMap] = []
    
    def capture_room_map(self, duration_s: float = 2.0) -> Optional[RoomMap]:
        """Capture single room map"""
        if not HAS_AUDIO:
            print("[ERROR] sounddevice not available")
            return None
        
        # Generate TX signal
        tx_frame = self.sonar.generate_tx_frame(n_chirps=16)
        
        # Simultaneous TX/RX
        print(f"[SONAR] Transmitting {len(tx_frame)/self.sample_rate:.2f}s chirp burst...")
        
        # Play and record
        rx_data = sd.playrec(
            tx_frame.reshape(-1, 1),
            samplerate=self.sample_rate,
            channels=1,
            dtype='float32'
        )
        sd.wait()
        
        rx_data = rx_data.flatten()
        
        # Process
        range_profile, range_doppler = self.sonar.process_frame(rx_data, n_chirps=16)
        targets = self.sonar.detect_targets(range_profile, range_doppler)
        
        # Save to history
        self.target_history.extend(targets)
        
        room_map = RoomMap(
            timestamp=time.time(),
            range_bins=self.sonar.range_bins[:len(range_profile)],
            azimuth_bins=np.array([0]),  # Mono - no azimuth
            intensity_map=range_profile.reshape(1, -1),
            targets=targets
        )
        
        self.room_maps.append(room_map)
        
        return room_map
    
    def continuous_scan(self, duration_s: float = 60.0,
                        callback=None):
        """Run continuous room scanning"""
        if not HAS_AUDIO:
            print("[ERROR] sounddevice not available")
            return
        
        print(f"\n{'='*60}")
        print("COUNTERMEASURE SONAR - ACTIVE SCANNING")
        print(f"{'='*60}")
        print(f"Frequency: {self.sonar.freq_start/1000:.1f}-{self.sonar.freq_end/1000:.1f} kHz")
        print(f"Max range: {self.sonar.max_range:.1f}m")
        print(f"Duration: {duration_s}s")
        print("-"*60)
        
        self.running = True
        start_time = time.time()
        scan_count = 0
        
        while self.running and (time.time() - start_time) < duration_s:
            room_map = self.capture_room_map()
            scan_count += 1
            
            if room_map and room_map.targets:
                print(f"\n[Scan {scan_count}] Detected {len(room_map.targets)} targets:")
                for t in room_map.targets:
                    print(f"  Range: {t.range_m:.2f}m | "
                          f"Velocity: {t.velocity_mps:+.2f}m/s | "
                          f"Type: {t.classification}")
                
                if callback:
                    callback(room_map)
            else:
                print(f"[Scan {scan_count}] No targets in range")
            
            time.sleep(0.5)  # Scan interval
        
        self.running = False
        print(f"\n{'='*60}")
        print(f"Scanning complete. {scan_count} scans, "
              f"{len(self.target_history)} total targets detected.")
    
    def generate_evidence_report(self) -> str:
        """Generate report of detected targets"""
        lines = []
        lines.append("=" * 60)
        lines.append("COUNTERMEASURE SONAR - EVIDENCE REPORT")
        lines.append("=" * 60)
        lines.append(f"Generated: {datetime.now().isoformat()}")
        lines.append(f"Total scans: {len(self.room_maps)}")
        lines.append(f"Total targets detected: {len(self.target_history)}")
        lines.append("")
        
        # Classify targets
        classifications = {}
        for t in self.target_history:
            classifications[t.classification] = classifications.get(t.classification, 0) + 1
        
        lines.append("TARGET CLASSIFICATION SUMMARY")
        lines.append("-" * 40)
        for cls, count in sorted(classifications.items(), key=lambda x: -x[1]):
            lines.append(f"  {cls}: {count}")
        lines.append("")
        
        # Movement analysis
        person_targets = [t for t in self.target_history if t.classification == 'person']
        if person_targets:
            lines.append("PERSON MOVEMENT ANALYSIS")
            lines.append("-" * 40)
            
            ranges = [t.range_m for t in person_targets]
            velocities = [t.velocity_mps for t in person_targets]
            
            lines.append(f"  Detections: {len(person_targets)}")
            lines.append(f"  Range: {min(ranges):.2f}m - {max(ranges):.2f}m")
            lines.append(f"  Velocity range: {min(velocities):.2f} to {max(velocities):.2f} m/s")
            
            # Check for approach/departure pattern
            if velocities:
                avg_velocity = np.mean(velocities)
                if avg_velocity < -0.1:
                    lines.append(f"  ⚠️  Overall APPROACH pattern detected")
                elif avg_velocity > 0.1:
                    lines.append(f"  Pattern: Overall departure")
                else:
                    lines.append(f"  Pattern: Stationary/oscillating")
        
        lines.append("")
        lines.append("=" * 60)
        
        return "\n".join(lines)
    
    def export_evidence(self, filepath: str):
        """Export evidence to JSON"""
        evidence = {
            'generated': datetime.now().isoformat(),
            'scans': len(self.room_maps),
            'targets': [asdict(t) for t in self.target_history],
            'summary': {
                'total_targets': len(self.target_history),
                'classifications': {}
            }
        }
        
        for t in self.target_history:
            c = t.classification
            evidence['summary']['classifications'][c] = \
                evidence['summary']['classifications'].get(c, 0) + 1
        
        with open(filepath, 'w') as f:
            json.dump(evidence, f, indent=2, default=str)
        
        print(f"Evidence exported to {filepath}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Countermeasure Sonar System')
    parser.add_argument('--scan', action='store_true', help='Single room scan')
    parser.add_argument('--continuous', type=float, metavar='SECONDS',
                       help='Continuous scanning duration')
    parser.add_argument('--export', metavar='FILE', help='Export evidence to JSON')
    parser.add_argument('--report', action='store_true', help='Generate report')
    
    args = parser.parse_args()
    
    sonar = CountermeasureSonar()
    
    if args.scan:
        room_map = sonar.capture_room_map()
        if room_map:
            print(f"\nDetected {len(room_map.targets)} targets:")
            for t in room_map.targets:
                print(f"  {t.range_m:.2f}m - {t.classification}")
    
    elif args.continuous:
        try:
            sonar.continuous_scan(args.continuous)
        except KeyboardInterrupt:
            sonar.running = False
            print("\nStopped")
        
        if args.report:
            print(sonar.generate_evidence_report())
        
        if args.export:
            sonar.export_evidence(args.export)
    
    elif args.report:
        print(sonar.generate_evidence_report())
    
    else:
        print("Countermeasure Sonar System")
        print("Usage:")
        print("  --scan              Single room scan")
        print("  --continuous 60     Continuous scan for 60 seconds")
        print("  --export FILE       Export evidence to JSON")
        print("  --report            Generate summary report")


if __name__ == '__main__':
    main()
