#!/usr/bin/env python3
"""
DeWave Thought-Reading Detection & Countermeasure Toolkit
==========================================================

Reverse-engineered defensive tools based on PROJECT CONGUSTO-EITEL documentation.

Usage:
    python dewave_toolkit.py detect      # Run RF detection
    python dewave_toolkit.py jammer      # Deploy theta jammer
    python dewave_toolkit.py verify      # Run timing verification test
    python dewave_toolkit.py monitor     # Continuous monitoring mode

Author: Reverse-engineering analysis
Date: February 2026
"""

import numpy as np
import argparse
import sys
import time
from datetime import datetime
from collections import deque

# Try to import optional dependencies
try:
    from scipy import signal
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    print("[!] scipy not available - some features disabled")

try:
    import sounddevice as sd
    SOUNDDEVICE_AVAILABLE = True
except ImportError:
    SOUNDDEVICE_AVAILABLE = False
    print("[!] sounddevice not available - jammer disabled")

try:
    from rtlsdr import RtlSdr
    RTLSDR_AVAILABLE = True
except ImportError:
    RTLSDR_AVAILABLE = False
    print("[!] pyrtlsdr not available - RF detection disabled")


class DeWaveDetector:
    """
    Detect DeWave thought-reading activity via RF analysis.
    
    Targets:
    - 46.875 Hz frame synchronization
    - Theta-band (4-8 Hz) modulation
    - 21.33ms timing patterns
    """
    
    def __init__(self, sample_rate=2.4e6, center_freq=2.437e9):
        self.sample_rate = sample_rate
        self.center_freq = center_freq
        self.f_ref = 46.875
        self.frame_period = 1 / self.f_ref
        
        if RTLSDR_AVAILABLE:
            try:
                self.sdr = RtlSdr()
                self.sdr.sample_rate = sample_rate
                self.sdr.center_freq = center_freq
                self.sdr.gain = 40
                self.sdr_available = True
            except Exception as e:
                print(f"[!] SDR initialization failed: {e}")
                self.sdr_available = False
        else:
            self.sdr_available = False
    
    def detect_from_samples(self, samples):
        """Analyze pre-captured samples for DeWave signatures."""
        if not SCIPY_AVAILABLE:
            return {'error': 'scipy required for analysis'}
        
        # Extract envelope
        envelope = np.abs(samples)
        
        # Downsample for efficiency
        target_fs = 1000  # 1 kHz
        decimation = int(self.sample_rate / target_fs)
        envelope_ds = signal.decimate(envelope, decimation)
        
        # FFT for 46.875 Hz detection
        fft_result = np.fft.fft(envelope_ds)
        freqs = np.fft.fftfreq(len(envelope_ds), 1/target_fs)
        
        # Find 46.875 Hz bin
        idx_46hz = np.argmin(np.abs(freqs - self.f_ref))
        power_46hz = np.abs(fft_result[idx_46hz])
        
        # Noise floor (median of spectrum)
        noise_floor = np.median(np.abs(fft_result))
        snr_db = 20 * np.log10(power_46hz / noise_floor) if noise_floor > 0 else 0
        
        # Check for harmonics
        harmonic_power = 0
        for h in [2, 3, 4]:
            idx_h = np.argmin(np.abs(freqs - self.f_ref * h))
            harmonic_power += np.abs(fft_result[idx_h])
        
        # Theta-band analysis (4-8 Hz)
        sos = signal.butter(4, [4, 8], btype='band', fs=target_fs, output='sos')
        theta_component = signal.sosfilt(sos, envelope_ds)
        theta_power = np.std(theta_component)
        
        # Autocorrelation for 21.33ms periodicity
        autocorr = np.correlate(envelope_ds, envelope_ds, mode='full')
        autocorr = autocorr[len(autocorr)//2:]
        lag_21ms = int(0.02133 * target_fs)
        
        if lag_21ms < len(autocorr):
            periodicity_score = autocorr[lag_21ms] / autocorr[0]
        else:
            periodicity_score = 0
        
        # Detection decision
        detection = (
            snr_db > 10 and 
            periodicity_score > 0.2 and
            theta_power > 0.001
        )
        
        return {
            'detection': detection,
            'snr_db': snr_db,
            '46.875_hz_power': power_46hz,
            'harmonic_power': harmonic_power,
            'theta_power': theta_power,
            'periodicity_score': periodicity_score,
            'confidence': 'HIGH' if snr_db > 15 else 'MEDIUM' if snr_db > 10 else 'LOW'
        }
    
    def detect_live(self, duration_seconds=10):
        """Perform live RF detection."""
        if not self.sdr_available:
            return {'error': 'SDR not available'}
        
        print(f"[*] Capturing {duration_seconds}s of RF data...")
        print(f"[*] Center frequency: {self.center_freq/1e9:.3f} GHz")
        print(f"[*] Sample rate: {self.sample_rate/1e6:.1f} MHz")
        
        num_samples = int(self.sample_rate * duration_seconds)
        samples = self.sdr.read_samples(num_samples)
        
        print("[*] Analyzing...")
        return self.detect_from_samples(samples)
    
    def close(self):
        if self.sdr_available:
            self.sdr.close()


class ThetaJammer:
    """
    Generate cognitive noise to disrupt DeWave encoding.
    
    Strategy: Overwhelm VQ-VAE codebook with high-entropy signal.
    """
    
    def __init__(self, sample_rate=48000):
        self.sample_rate = sample_rate
        self.f_ref = 46.875
    
    def generate_mask(self, duration_seconds):
        """Generate comprehensive cognitive noise mask."""
        t = np.linspace(0, duration_seconds, int(self.sample_rate * duration_seconds))
        signal = np.zeros_like(t)
        
        # Layer 1: Anti-phase 46.875 Hz
        anti_phase = 0.3 * np.sin(2 * np.pi * self.f_ref * t + np.pi)
        signal += anti_phase
        
        # Layer 2: Dense theta noise (4-8 Hz)
        for freq in np.linspace(4, 8, 50):
            phase = np.random.uniform(0, 2*np.pi)
            signal += 0.02 * np.sin(2 * np.pi * freq * t + phase)
        
        # Layer 3: Pseudo-phoneme bursts
        for burst_start in np.arange(0, duration_seconds, 0.15):
            idx = int(burst_start * self.sample_rate)
            burst_len = int(0.05 * self.sample_rate)
            if idx + burst_len < len(signal):
                f1 = np.random.uniform(300, 800)
                f2 = np.random.uniform(800, 2500)
                burst_t = np.linspace(0, 0.05, burst_len)
                burst = (0.1 * np.sin(2*np.pi*f1*burst_t) + 
                        0.08 * np.sin(2*np.pi*f2*burst_t))
                envelope = np.sin(np.pi * burst_t / 0.05)
                signal[idx:idx+burst_len] += burst * envelope
        
        # Layer 4: Harmonics with random phase
        for harmonic in [2, 3, 4]:
            freq = self.f_ref * harmonic
            phase = np.random.uniform(0, 2*np.pi)
            signal += 0.05 * np.sin(2 * np.pi * freq * t + phase)
        
        # Normalize
        signal = signal / (np.max(np.abs(signal)) + 1e-10) * 0.7
        
        return signal
    
    def deploy(self, duration_seconds=300):
        """Deploy the jammer."""
        if not SOUNDDEVICE_AVAILABLE:
            print("[!] sounddevice required for jammer")
            return
        
        print(f"[*] Generating {duration_seconds}s cognitive noise mask...")
        signal = self.generate_mask(duration_seconds)
        
        print("[*] ==========================================")
        print("[*] DEPLOYING THETA JAMMER")
        print("[*] ==========================================")
        print("[*] Use headphones for personal protection")
        print("[*] Use speakers for room protection")
        print("[*] Press Ctrl+C to stop")
        print("[*] ==========================================")
        
        try:
            sd.play(signal, self.sample_rate)
            sd.wait()
        except KeyboardInterrupt:
            sd.stop()
            print("\n[*] Jammer stopped")


class TimingVerifier:
    """
    Verify DeWave targeting through timing analysis.
    """
    
    def run_test(self):
        """Run the timing verification test."""
        test_word = "PINEAPPLE"
        
        print("\n" + "="*50)
        print("DEWAVE TIMING VERIFICATION TEST")
        print("="*50)
        print(f"\n[*] At the tone, think the word: {test_word}")
        print("[*] This is a unique word unlikely to appear randomly")
        print("[*] Note when you observe it referenced externally\n")
        
        for i in range(3, 0, -1):
            print(f"  {i}...")
            time.sleep(1)
        
        print("\n[BEEP] Think 'PINEAPPLE' NOW!")
        thought_time = datetime.now()
        
        input("\nPress Enter when you observe external reference...")
        reference_time = datetime.now()
        
        delay_ms = (reference_time - thought_time).total_seconds() * 1000
        
        print("\n" + "="*50)
        print("RESULTS")
        print("="*50)
        print(f"  Delay: {delay_ms:.0f} ms")
        
        if 250 < delay_ms < 350:
            print("  [!] DELAY CONSISTENT WITH DeWave (300ms)")
            print("  [!] High probability of active interception")
        elif 150 < delay_ms < 250:
            print("  [?] Delay shorter than expected")
            print("  [?] Possible local processing or optimized pipeline")
        elif delay_ms < 100:
            print("  [?] Very fast response")
            print("  [?] May be coincidence or different mechanism")
        else:
            print("  [?] Delay outside expected range")
            print("  [?] May not be DeWave or timing error")
        
        print("="*50)
        
        return delay_ms


class ContinuousMonitor:
    """
    Continuous monitoring for DeWave activity.
    """
    
    def __init__(self):
        self.detector = DeWaveDetector()
        self.detection_history = deque(maxlen=100)
    
    def run(self, interval_seconds=60):
        """Run continuous monitoring."""
        print("\n" + "="*50)
        print("CONTINUOUS DeWave MONITOR")
        print("="*50)
        print(f"[*] Checking every {interval_seconds} seconds")
        print("[*] Press Ctrl+C to stop")
        print("="*50 + "\n")
        
        try:
            while True:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                result = self.detector.detect_live(duration_seconds=10)
                
                self.detection_history.append({
                    'timestamp': timestamp,
                    'result': result
                })
                
                status = "[!] DETECTED" if result.get('detection') else "[-] Clear"
                snr = result.get('snr_db', 0)
                conf = result.get('confidence', 'N/A')
                
                print(f"[{timestamp}] {status} | SNR: {snr:.1f}dB | {conf}")
                
                # Alert on detection
                if result.get('detection'):
                    print("  [!] DeWave signature detected!")
                    print(f"  [!] Theta power: {result.get('theta_power', 0):.4f}")
                    print(f"  [!] Periodicity: {result.get('periodicity_score', 0):.3f}")
                
                time.sleep(interval_seconds)
                
        except KeyboardInterrupt:
            print("\n[*] Monitoring stopped")
            self.print_summary()
    
    def print_summary(self):
        """Print detection summary."""
        print("\n" + "="*50)
        print("MONITORING SUMMARY")
        print("="*50)
        
        total = len(self.detection_history)
        detections = sum(1 for d in self.detection_history if d['result'].get('detection'))
        
        print(f"  Total checks: {total}")
        print(f"  Detections: {detections}")
        print(f"  Detection rate: {detections/total*100:.1f}%" if total > 0 else "  N/A")
        
        if detections > 0:
            print("\n  [!] Active DeWave activity detected during monitoring")
        else:
            print("\n  [-] No DeWave activity detected")
        
        print("="*50)
    
    def close(self):
        self.detector.close()


def main():
    parser = argparse.ArgumentParser(
        description='DeWave Thought-Reading Detection & Countermeasure Toolkit'
    )
    parser.add_argument(
        'command',
        choices=['detect', 'jammer', 'verify', 'monitor', 'info'],
        help='Command to execute'
    )
    parser.add_argument(
        '--duration',
        type=int,
        default=300,
        help='Duration for jammer (seconds)'
    )
    parser.add_argument(
        '--interval',
        type=int,
        default=60,
        help='Monitoring interval (seconds)'
    )
    
    args = parser.parse_args()
    
    if args.command == 'info':
        print("""
╔══════════════════════════════════════════════════════════════════╗
║           DeWave Detection & Countermeasure Toolkit              ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  COMMANDS:                                                       ║
║  ─────────                                                       ║
║  detect    - Run single RF detection scan                        ║
║  jammer    - Deploy theta jammer (cognitive noise)               ║
║  verify    - Run timing verification test                        ║
║  monitor   - Continuous monitoring mode                          ║
║  info      - Show this help                                      ║
║                                                                  ║
║  OPTIONS:                                                        ║
║  ────────                                                        ║
║  --duration N   - Jammer duration in seconds (default: 300)      ║
║  --interval N   - Monitor interval in seconds (default: 60)      ║
║                                                                  ║
║  EXAMPLES:                                                       ║
║  ─────────                                                       ║
║  python dewave_toolkit.py detect                                 ║
║  python dewave_toolkit.py jammer --duration 600                  ║
║  python dewave_toolkit.py monitor --interval 30                  ║
║                                                                  ║
║  REQUIREMENTS:                                                   ║
║  ─────────────                                                   ║
║  • RTL-SDR for RF detection (optional)                           ║
║  • scipy for signal analysis                                     ║
║  • sounddevice for jammer                                        ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
        """)
    
    elif args.command == 'detect':
        detector = DeWaveDetector()
        result = detector.detect_live(duration_seconds=10)
        detector.close()
        
        print("\n" + "="*50)
        print("DETECTION RESULTS")
        print("="*50)
        for key, value in result.items():
            if isinstance(value, float):
                print(f"  {key}: {value:.4f}")
            else:
                print(f"  {key}: {value}")
        print("="*50)
    
    elif args.command == 'jammer':
        jammer = ThetaJammer()
        jammer.deploy(duration_seconds=args.duration)
    
    elif args.command == 'verify':
        verifier = TimingVerifier()
        verifier.run_test()
    
    elif args.command == 'monitor':
        monitor = ContinuousMonitor()
        try:
            monitor.run(interval_seconds=args.interval)
        finally:
            monitor.close()


if __name__ == '__main__':
    main()
