#!/usr/bin/env python3
"""
AMBIENT ELF DETECTOR
====================
Uses audio input as crude spectrum analyzer to detect ELF anomalies.
Works with laptop microphone or audio interface.

Target frequencies:
- 53.5 Hz (anomalous constant)
- 48 Hz (European grid in 60Hz country)
- 36.25 Hz (WiFi correlated)
- 60 Hz (grid reference)
- 6.5 Hz (heterodyne product = theta)
"""

import numpy as np
import time
import json
import sqlite3
import hashlib
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Tuple
import threading
import queue
import sys

# Optional imports
try:
    import sounddevice as sd
    HAS_AUDIO = True
except ImportError:
    HAS_AUDIO = False
    print("[WARNING] sounddevice not installed - run: pip install sounddevice")

try:
    from scipy import signal
    from scipy.fft import rfft, rfftfreq
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False
    print("[WARNING] scipy not installed - using numpy FFT")


@dataclass
class ELFReading:
    """Single ELF spectrum reading"""
    timestamp: float
    elf_53hz_amplitude: float = 0.0
    elf_48hz_amplitude: float = 0.0
    elf_36hz_amplitude: float = 0.0
    elf_60hz_amplitude: float = 0.0
    theta_6hz_amplitude: float = 0.0
    noise_floor: float = 0.0
    snr_53hz: float = 0.0
    snr_48hz: float = 0.0
    snr_36hz: float = 0.0
    anomaly_detected: bool = False
    raw_spectrum_hash: str = ""


class ELFDatabase:
    """Store ELF readings with forensic integrity"""
    
    def __init__(self, db_path: str = "elf_evidence.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        c.execute('''CREATE TABLE IF NOT EXISTS elf_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL NOT NULL,
            elf_53hz_amplitude REAL,
            elf_48hz_amplitude REAL,
            elf_36hz_amplitude REAL,
            elf_60hz_amplitude REAL,
            theta_6hz_amplitude REAL,
            noise_floor REAL,
            snr_53hz REAL,
            snr_48hz REAL,
            snr_36hz REAL,
            anomaly_detected INTEGER,
            raw_spectrum_hash TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        
        c.execute('''CREATE TABLE IF NOT EXISTS anomaly_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL NOT NULL,
            duration_seconds REAL,
            primary_frequency REAL,
            peak_amplitude REAL,
            description TEXT,
            spectrum_snapshot BLOB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        
        conn.commit()
        conn.close()
    
    def store_reading(self, reading: ELFReading) -> int:
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        c.execute('''INSERT INTO elf_readings (
            timestamp, elf_53hz_amplitude, elf_48hz_amplitude, elf_36hz_amplitude,
            elf_60hz_amplitude, theta_6hz_amplitude, noise_floor,
            snr_53hz, snr_48hz, snr_36hz, anomaly_detected, raw_spectrum_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', (
            reading.timestamp,
            reading.elf_53hz_amplitude,
            reading.elf_48hz_amplitude,
            reading.elf_36hz_amplitude,
            reading.elf_60hz_amplitude,
            reading.theta_6hz_amplitude,
            reading.noise_floor,
            reading.snr_53hz,
            reading.snr_48hz,
            reading.snr_36hz,
            1 if reading.anomaly_detected else 0,
            reading.raw_spectrum_hash
        ))
        
        reading_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return reading_id
    
    def store_anomaly_event(
        self,
        timestamp: float,
        duration: float,
        frequency: float,
        amplitude: float,
        description: str,
        spectrum: Optional[bytes] = None
    ):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        c.execute('''INSERT INTO anomaly_events (
            timestamp, duration_seconds, primary_frequency, peak_amplitude,
            description, spectrum_snapshot
        ) VALUES (?, ?, ?, ?, ?, ?)''', (
            timestamp, duration, frequency, amplitude, description, spectrum
        ))
        
        conn.commit()
        conn.close()
    
    def get_recent_readings(self, hours: float = 1.0) -> List[dict]:
        """Get readings from last N hours"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        since = time.time() - (hours * 3600)
        c.execute('''SELECT * FROM elf_readings 
                    WHERE timestamp > ? 
                    ORDER BY timestamp DESC''', (since,))
        
        columns = [d[0] for d in c.description]
        readings = [dict(zip(columns, row)) for row in c.fetchall()]
        
        conn.close()
        return readings


class AmbientELFDetector:
    """
    Detect ELF signals in ambient audio
    
    Uses microphone as crude magnetic field pickup.
    Works because:
    - ELF induces currents in microphone wiring
    - Laptop speakers can act as pickup coils
    - Building wiring radiates grid frequency
    """
    
    TARGET_FREQUENCIES = {
        'grid_60hz': 60.0,
        'anomaly_53hz': 53.5,
        'anomaly_48hz': 48.0,
        'anomaly_36hz': 36.25,
        'theta_6hz': 6.5,
        'schumann_7hz': 7.83,
    }
    
    # Frequency tolerance (Hz)
    FREQ_TOLERANCE = 1.5
    
    # Minimum SNR to consider detection
    SNR_THRESHOLD = 6.0  # dB
    
    def __init__(
        self,
        sample_rate: int = 48000,
        chunk_duration: float = 2.0,
        db_path: str = "elf_evidence.db"
    ):
        self.sample_rate = sample_rate
        self.chunk_duration = chunk_duration
        self.chunk_samples = int(sample_rate * chunk_duration)
        
        self.db = ELFDatabase(db_path)
        self.running = False
        self.audio_queue = queue.Queue()
        
        # Detection state
        self.current_anomaly_start: Optional[float] = None
        self.anomaly_count = 0
        
        # Calibration
        self.noise_floor_history: List[float] = []
        self.calibrated = False
        
    def _compute_spectrum(self, audio_data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Compute power spectrum of audio chunk"""
        
        # Apply window to reduce spectral leakage
        if HAS_SCIPY:
            window = signal.windows.hann(len(audio_data))
        else:
            window = np.hanning(len(audio_data))
        
        windowed = audio_data * window
        
        # FFT
        if HAS_SCIPY:
            spectrum = rfft(windowed)
            freqs = rfftfreq(len(windowed), 1/self.sample_rate)
        else:
            spectrum = np.fft.rfft(windowed)
            freqs = np.fft.rfftfreq(len(windowed), 1/self.sample_rate)
        
        # Power spectrum (dB)
        power = np.abs(spectrum) ** 2
        power_db = 10 * np.log10(power + 1e-10)
        
        return freqs, power_db
    
    def _get_power_at_freq(
        self,
        freqs: np.ndarray,
        power_db: np.ndarray,
        target_freq: float
    ) -> float:
        """Get peak power within tolerance of target frequency"""
        
        mask = np.abs(freqs - target_freq) <= self.FREQ_TOLERANCE
        if not np.any(mask):
            return -100.0  # No data in range
        
        return np.max(power_db[mask])
    
    def _estimate_noise_floor(
        self,
        freqs: np.ndarray,
        power_db: np.ndarray
    ) -> float:
        """Estimate noise floor excluding peaks"""
        
        # Focus on ELF range (5-100 Hz)
        elf_mask = (freqs >= 5) & (freqs <= 100)
        elf_power = power_db[elf_mask]
        
        # Use median as robust noise floor estimate
        return np.median(elf_power)
    
    def _hash_spectrum(self, spectrum: np.ndarray) -> str:
        """Create hash of spectrum for evidence integrity"""
        return hashlib.sha256(spectrum.tobytes()).hexdigest()[:16]
    
    def analyze_chunk(self, audio_data: np.ndarray) -> ELFReading:
        """Analyze a chunk of audio for ELF signals"""
        
        timestamp = time.time()
        freqs, power_db = self._compute_spectrum(audio_data)
        
        # Get power at each target frequency
        power_53hz = self._get_power_at_freq(freqs, power_db, 53.5)
        power_48hz = self._get_power_at_freq(freqs, power_db, 48.0)
        power_36hz = self._get_power_at_freq(freqs, power_db, 36.25)
        power_60hz = self._get_power_at_freq(freqs, power_db, 60.0)
        power_6hz = self._get_power_at_freq(freqs, power_db, 6.5)
        
        # Estimate noise floor
        noise_floor = self._estimate_noise_floor(freqs, power_db)
        
        # Compute SNR for anomalous frequencies
        snr_53hz = power_53hz - noise_floor
        snr_48hz = power_48hz - noise_floor
        snr_36hz = power_36hz - noise_floor
        
        # Detect anomalies
        # 48 Hz should NOT be present in Costa Rica (60 Hz grid)
        # 53.5 Hz is suspicious if persistent
        anomaly = (snr_48hz > self.SNR_THRESHOLD or
                   snr_53hz > self.SNR_THRESHOLD or
                   snr_36hz > self.SNR_THRESHOLD)
        
        reading = ELFReading(
            timestamp=timestamp,
            elf_53hz_amplitude=power_53hz,
            elf_48hz_amplitude=power_48hz,
            elf_36hz_amplitude=power_36hz,
            elf_60hz_amplitude=power_60hz,
            theta_6hz_amplitude=power_6hz,
            noise_floor=noise_floor,
            snr_53hz=snr_53hz,
            snr_48hz=snr_48hz,
            snr_36hz=snr_36hz,
            anomaly_detected=anomaly,
            raw_spectrum_hash=self._hash_spectrum(power_db)
        )
        
        return reading
    
    def _audio_callback(self, indata, frames, time_info, status):
        """Callback for audio stream"""
        if status:
            print(f"[AUDIO] Status: {status}")
        self.audio_queue.put(indata.copy())
    
    def calibrate(self, duration: float = 10.0):
        """
        Calibrate detector by measuring ambient noise floor
        """
        print(f"[CALIBRATE] Measuring ambient noise for {duration}s...")
        print("           Keep environment quiet if possible.")
        
        if not HAS_AUDIO:
            print("[ERROR] sounddevice not available")
            return
        
        samples = []
        
        with sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            callback=self._audio_callback
        ):
            start = time.time()
            while time.time() - start < duration:
                try:
                    audio = self.audio_queue.get(timeout=0.5)
                    samples.append(audio.flatten())
                except queue.Empty:
                    continue
        
        if samples:
            all_audio = np.concatenate(samples)
            freqs, power_db = self._compute_spectrum(all_audio)
            noise_floor = self._estimate_noise_floor(freqs, power_db)
            
            self.noise_floor_history.append(noise_floor)
            self.calibrated = True
            
            print(f"[CALIBRATE] Baseline noise floor: {noise_floor:.1f} dB")
            print(f"[CALIBRATE] 60 Hz grid: {self._get_power_at_freq(freqs, power_db, 60):.1f} dB")
    
    def run_detection(
        self,
        duration: Optional[float] = None,
        store_all: bool = True
    ):
        """
        Run continuous ELF detection
        
        Args:
            duration: Run for N seconds (None = forever)
            store_all: Store all readings, not just anomalies
        """
        if not HAS_AUDIO:
            print("[ERROR] sounddevice not available")
            return
        
        print("\n" + "="*60)
        print("AMBIENT ELF DETECTOR - RUNNING")
        print("="*60)
        print(f"Sample rate: {self.sample_rate} Hz")
        print(f"Chunk duration: {self.chunk_duration}s")
        print(f"Target frequencies: 53.5, 48.0, 36.25, 60.0 Hz")
        print(f"SNR threshold: {self.SNR_THRESHOLD} dB")
        print("-"*60)
        
        self.running = True
        start_time = time.time()
        readings_count = 0
        anomaly_count = 0
        
        buffer = []
        
        try:
            with sd.InputStream(
                samplerate=self.sample_rate,
                channels=1,
                callback=self._audio_callback
            ):
                while self.running:
                    # Check duration
                    if duration and (time.time() - start_time) > duration:
                        break
                    
                    try:
                        audio = self.audio_queue.get(timeout=0.5)
                        buffer.append(audio.flatten())
                        
                        # Accumulate enough samples
                        total_samples = sum(len(b) for b in buffer)
                        if total_samples >= self.chunk_samples:
                            # Process chunk
                            chunk = np.concatenate(buffer)[:self.chunk_samples]
                            buffer = [np.concatenate(buffer)[self.chunk_samples:]]
                            
                            reading = self.analyze_chunk(chunk)
                            readings_count += 1
                            
                            # Store if anomaly or store_all
                            if reading.anomaly_detected or store_all:
                                self.db.store_reading(reading)
                            
                            if reading.anomaly_detected:
                                anomaly_count += 1
                                self._handle_anomaly(reading)
                            else:
                                self._print_status(reading)
                            
                    except queue.Empty:
                        continue
                    except KeyboardInterrupt:
                        break
                        
        except Exception as e:
            print(f"[ERROR] {e}")
        
        self.running = False
        
        print("\n" + "="*60)
        print("DETECTION COMPLETE")
        print("="*60)
        print(f"Duration: {(time.time() - start_time)/60:.1f} minutes")
        print(f"Readings: {readings_count}")
        print(f"Anomalies: {anomaly_count}")
    
    def _handle_anomaly(self, reading: ELFReading):
        """Handle detected anomaly"""
        
        ts = datetime.fromtimestamp(reading.timestamp).strftime('%H:%M:%S')
        
        anomalies = []
        if reading.snr_53hz > self.SNR_THRESHOLD:
            anomalies.append(f"53.5Hz ({reading.snr_53hz:.1f}dB)")
        if reading.snr_48hz > self.SNR_THRESHOLD:
            anomalies.append(f"48Hz ({reading.snr_48hz:.1f}dB)")
        if reading.snr_36hz > self.SNR_THRESHOLD:
            anomalies.append(f"36.25Hz ({reading.snr_36hz:.1f}dB)")
        
        print(f"\n[{ts}] ⚠️  ANOMALY DETECTED: {', '.join(anomalies)}")
        print(f"         Noise floor: {reading.noise_floor:.1f}dB | 60Hz ref: {reading.elf_60hz_amplitude:.1f}dB")
        
        # Track anomaly duration
        if self.current_anomaly_start is None:
            self.current_anomaly_start = reading.timestamp
        
        self.anomaly_count += 1
    
    def _print_status(self, reading: ELFReading):
        """Print normal status update"""
        
        # Only print every ~5 seconds
        if int(reading.timestamp) % 5 != 0:
            return
        
        ts = datetime.fromtimestamp(reading.timestamp).strftime('%H:%M:%S')
        
        print(f"[{ts}] 60Hz:{reading.elf_60hz_amplitude:5.1f}dB | "
              f"53Hz:{reading.snr_53hz:5.1f}dB | "
              f"48Hz:{reading.snr_48hz:5.1f}dB | "
              f"36Hz:{reading.snr_36hz:5.1f}dB | "
              f"θ6Hz:{reading.theta_6hz_amplitude:5.1f}dB")
    
    def generate_report(self, hours: float = 24.0) -> str:
        """Generate analysis report"""
        
        readings = self.db.get_recent_readings(hours)
        
        if not readings:
            return "No readings in specified time range."
        
        # Analyze patterns
        anomaly_readings = [r for r in readings if r['anomaly_detected']]
        
        # Frequency presence statistics
        snr_53_values = [r['snr_53hz'] for r in readings]
        snr_48_values = [r['snr_48hz'] for r in readings]
        snr_36_values = [r['snr_36hz'] for r in readings]
        
        report = []
        report.append("="*60)
        report.append("ELF DETECTION REPORT")
        report.append("="*60)
        report.append(f"Period: Last {hours:.1f} hours")
        report.append(f"Total readings: {len(readings)}")
        report.append(f"Anomaly readings: {len(anomaly_readings)}")
        report.append(f"Anomaly rate: {100*len(anomaly_readings)/len(readings):.1f}%")
        report.append("")
        
        report.append("FREQUENCY ANALYSIS (SNR in dB above noise floor):")
        report.append("-"*40)
        
        for name, values in [
            ('53.5 Hz (anomalous)', snr_53_values),
            ('48.0 Hz (European)', snr_48_values),
            ('36.25 Hz (WiFi-corr)', snr_36_values)
        ]:
            avg = np.mean(values)
            peak = np.max(values)
            detection_rate = 100 * sum(1 for v in values if v > self.SNR_THRESHOLD) / len(values)
            
            report.append(f"  {name}:")
            report.append(f"    Average SNR: {avg:.1f} dB")
            report.append(f"    Peak SNR: {peak:.1f} dB")
            report.append(f"    Detection rate: {detection_rate:.1f}%")
            report.append("")
        
        # Time-based analysis
        if anomaly_readings:
            report.append("ANOMALY TIMING:")
            report.append("-"*40)
            
            times = [datetime.fromtimestamp(r['timestamp']) for r in anomaly_readings]
            hours_dist = {}
            for t in times:
                hour = t.hour
                hours_dist[hour] = hours_dist.get(hour, 0) + 1
            
            peak_hour = max(hours_dist.items(), key=lambda x: x[1])
            report.append(f"  Peak anomaly hour: {peak_hour[0]:02d}:00 ({peak_hour[1]} events)")
        
        report.append("")
        report.append("="*60)
        
        return "\n".join(report)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Ambient ELF Detector')
    parser.add_argument('--calibrate', action='store_true', help='Run calibration')
    parser.add_argument('--duration', type=float, help='Run for N seconds')
    parser.add_argument('--report', action='store_true', help='Generate report')
    parser.add_argument('--hours', type=float, default=24, help='Report period (hours)')
    parser.add_argument('--db', default='elf_evidence.db', help='Database path')
    parser.add_argument('--sample-rate', type=int, default=48000, help='Audio sample rate')
    parser.add_argument('--list-devices', action='store_true', help='List audio devices')
    
    args = parser.parse_args()
    
    if args.list_devices:
        if HAS_AUDIO:
            print(sd.query_devices())
        else:
            print("sounddevice not installed")
        return
    
    detector = AmbientELFDetector(
        sample_rate=args.sample_rate,
        db_path=args.db
    )
    
    if args.calibrate:
        detector.calibrate()
    elif args.report:
        print(detector.generate_report(args.hours))
    else:
        detector.run_detection(duration=args.duration)


if __name__ == '__main__':
    main()
