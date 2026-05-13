#!/usr/bin/env python3
"""
BIOMETRIC-RF CORRELATOR
========================
Cross-correlates physiological data with RF/ELF anomalies to detect
behavioral modification attempts.

Integrates:
- HRV from smartphone camera (r-PPG style)
- ELF spectrum analysis
- Network traffic patterns
- Environmental sensors

Evidence-grade timestamped logging for forensic documentation.
"""

import asyncio
import json
import time
import hashlib
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Tuple
import struct
import threading
import queue

# Optional imports with fallbacks
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    print("[WARN] numpy not available - limited analysis")

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False
    print("[WARN] opencv not available - no camera PPG")

try:
    import sounddevice as sd
    HAS_AUDIO = True
except ImportError:
    HAS_AUDIO = False
    print("[WARN] sounddevice not available - no audio ELF capture")

try:
    import scapy.all as scapy
    HAS_SCAPY = True
except ImportError:
    HAS_SCAPY = False
    print("[WARN] scapy not available - limited network analysis")


@dataclass
class BiometricSample:
    """Single biometric measurement with full provenance"""
    timestamp: float  # Unix timestamp UTC
    source: str       # 'camera_ppg', 'audio_elf', 'manual', 'smartwatch'
    
    # HRV metrics
    heart_rate: Optional[float] = None
    rmssd: Optional[float] = None  # Root mean square of successive differences
    sdnn: Optional[float] = None   # Standard deviation NN intervals
    lf_hf_ratio: Optional[float] = None  # Sympathetic/parasympathetic balance
    
    # Stress indicators
    stress_index: Optional[float] = None  # Computed stress score 0-100
    coherence: Optional[float] = None     # Heart-brain coherence metric
    
    # Raw signal quality
    signal_quality: Optional[float] = None  # 0-1 confidence
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class RFSample:
    """RF/ELF measurement"""
    timestamp: float
    source: str  # 'audio_fft', 'sdr', 'spectrum_analyzer'
    
    # Frequency domain
    peak_frequencies: List[float] = None  # Hz
    peak_amplitudes: List[float] = None   # dB
    
    # Specific anomaly detection
    elf_53hz_present: bool = False
    elf_53hz_amplitude: Optional[float] = None
    elf_48hz_present: bool = False
    elf_36hz_present: bool = False
    
    # Heterodyne products
    beat_frequencies: List[float] = None
    
    # Network correlation
    wifi_burst_detected: bool = False
    
    def to_dict(self) -> dict:
        d = asdict(self)
        # Convert None lists to empty lists for JSON
        for k in ['peak_frequencies', 'peak_amplitudes', 'beat_frequencies']:
            if d[k] is None:
                d[k] = []
        return d


@dataclass
class NetworkSample:
    """Network activity snapshot"""
    timestamp: float
    
    # Traffic metrics
    packets_per_second: float = 0
    bytes_per_second: float = 0
    
    # Anomaly indicators
    unusual_destinations: List[str] = None
    encrypted_ratio: float = 0
    dns_queries: List[str] = None
    
    # Timing patterns
    burst_detected: bool = False
    beacon_interval_ms: Optional[float] = None
    
    def to_dict(self) -> dict:
        d = asdict(self)
        for k in ['unusual_destinations', 'dns_queries']:
            if d[k] is None:
                d[k] = []
        return d


@dataclass
class CorrelationEvent:
    """Detected correlation between biometric and RF/network events"""
    timestamp: float
    event_type: str  # 'hrv_elf_correlation', 'stress_network_burst', etc.
    
    # Correlation metrics
    correlation_coefficient: float
    lag_seconds: float  # Time offset between cause and effect
    confidence: float   # 0-1
    
    # Evidence
    biometric_sample_id: int
    rf_sample_id: Optional[int] = None
    network_sample_id: Optional[int] = None
    
    description: str = ""
    
    def to_dict(self) -> dict:
        return asdict(self)


class EvidenceDatabase:
    """SQLite database for forensic-grade evidence storage"""
    
    def __init__(self, db_path: str = "biometric_evidence.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.lock = threading.Lock()
        self._init_schema()
    
    def _init_schema(self):
        cursor = self.conn.cursor()
        
        # Biometric samples
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS biometric_samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                timestamp_iso TEXT NOT NULL,
                source TEXT NOT NULL,
                heart_rate REAL,
                rmssd REAL,
                sdnn REAL,
                lf_hf_ratio REAL,
                stress_index REAL,
                coherence REAL,
                signal_quality REAL,
                raw_json TEXT,
                hash TEXT NOT NULL
            )
        ''')
        
        # RF samples
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS rf_samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                timestamp_iso TEXT NOT NULL,
                source TEXT NOT NULL,
                peak_frequencies TEXT,
                peak_amplitudes TEXT,
                elf_53hz_present INTEGER,
                elf_53hz_amplitude REAL,
                elf_48hz_present INTEGER,
                elf_36hz_present INTEGER,
                beat_frequencies TEXT,
                wifi_burst_detected INTEGER,
                raw_json TEXT,
                hash TEXT NOT NULL
            )
        ''')
        
        # Network samples
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS network_samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                timestamp_iso TEXT NOT NULL,
                packets_per_second REAL,
                bytes_per_second REAL,
                unusual_destinations TEXT,
                encrypted_ratio REAL,
                dns_queries TEXT,
                burst_detected INTEGER,
                beacon_interval_ms REAL,
                raw_json TEXT,
                hash TEXT NOT NULL
            )
        ''')
        
        # Correlation events
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS correlation_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                timestamp_iso TEXT NOT NULL,
                event_type TEXT NOT NULL,
                correlation_coefficient REAL,
                lag_seconds REAL,
                confidence REAL,
                biometric_sample_id INTEGER,
                rf_sample_id INTEGER,
                network_sample_id INTEGER,
                description TEXT,
                raw_json TEXT,
                hash TEXT NOT NULL,
                FOREIGN KEY (biometric_sample_id) REFERENCES biometric_samples(id),
                FOREIGN KEY (rf_sample_id) REFERENCES rf_samples(id),
                FOREIGN KEY (network_sample_id) REFERENCES network_samples(id)
            )
        ''')
        
        # Session metadata
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time REAL NOT NULL,
                end_time REAL,
                notes TEXT,
                location TEXT,
                hardware_config TEXT
            )
        ''')
        
        self.conn.commit()
    
    def _compute_hash(self, data: dict) -> str:
        """SHA-256 hash of data for integrity verification"""
        json_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(json_str.encode()).hexdigest()
    
    def store_biometric(self, sample: BiometricSample) -> int:
        """Store biometric sample, return ID"""
        with self.lock:
            data = sample.to_dict()
            hash_val = self._compute_hash(data)
            iso_time = datetime.fromtimestamp(sample.timestamp, tz=timezone.utc).isoformat()
            
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO biometric_samples 
                (timestamp, timestamp_iso, source, heart_rate, rmssd, sdnn, 
                 lf_hf_ratio, stress_index, coherence, signal_quality, raw_json, hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                sample.timestamp, iso_time, sample.source,
                sample.heart_rate, sample.rmssd, sample.sdnn,
                sample.lf_hf_ratio, sample.stress_index, sample.coherence,
                sample.signal_quality, json.dumps(data), hash_val
            ))
            self.conn.commit()
            return cursor.lastrowid
    
    def store_rf(self, sample: RFSample) -> int:
        """Store RF sample, return ID"""
        with self.lock:
            data = sample.to_dict()
            hash_val = self._compute_hash(data)
            iso_time = datetime.fromtimestamp(sample.timestamp, tz=timezone.utc).isoformat()
            
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO rf_samples
                (timestamp, timestamp_iso, source, peak_frequencies, peak_amplitudes,
                 elf_53hz_present, elf_53hz_amplitude, elf_48hz_present, elf_36hz_present,
                 beat_frequencies, wifi_burst_detected, raw_json, hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                sample.timestamp, iso_time, sample.source,
                json.dumps(sample.peak_frequencies or []),
                json.dumps(sample.peak_amplitudes or []),
                int(sample.elf_53hz_present), sample.elf_53hz_amplitude,
                int(sample.elf_48hz_present), int(sample.elf_36hz_present),
                json.dumps(sample.beat_frequencies or []),
                int(sample.wifi_burst_detected),
                json.dumps(data), hash_val
            ))
            self.conn.commit()
            return cursor.lastrowid
    
    def store_network(self, sample: NetworkSample) -> int:
        """Store network sample, return ID"""
        with self.lock:
            data = sample.to_dict()
            hash_val = self._compute_hash(data)
            iso_time = datetime.fromtimestamp(sample.timestamp, tz=timezone.utc).isoformat()
            
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO network_samples
                (timestamp, timestamp_iso, packets_per_second, bytes_per_second,
                 unusual_destinations, encrypted_ratio, dns_queries, burst_detected,
                 beacon_interval_ms, raw_json, hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                sample.timestamp, iso_time,
                sample.packets_per_second, sample.bytes_per_second,
                json.dumps(sample.unusual_destinations or []),
                sample.encrypted_ratio,
                json.dumps(sample.dns_queries or []),
                int(sample.burst_detected), sample.beacon_interval_ms,
                json.dumps(data), hash_val
            ))
            self.conn.commit()
            return cursor.lastrowid
    
    def store_correlation(self, event: CorrelationEvent) -> int:
        """Store correlation event, return ID"""
        with self.lock:
            data = event.to_dict()
            hash_val = self._compute_hash(data)
            iso_time = datetime.fromtimestamp(event.timestamp, tz=timezone.utc).isoformat()
            
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO correlation_events
                (timestamp, timestamp_iso, event_type, correlation_coefficient,
                 lag_seconds, confidence, biometric_sample_id, rf_sample_id,
                 network_sample_id, description, raw_json, hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                event.timestamp, iso_time, event.event_type,
                event.correlation_coefficient, event.lag_seconds, event.confidence,
                event.biometric_sample_id, event.rf_sample_id, event.network_sample_id,
                event.description, json.dumps(data), hash_val
            ))
            self.conn.commit()
            return cursor.lastrowid
    
    def get_recent_biometric(self, seconds: float = 300) -> List[dict]:
        """Get biometric samples from last N seconds"""
        cutoff = time.time() - seconds
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT * FROM biometric_samples WHERE timestamp > ? ORDER BY timestamp DESC
        ''', (cutoff,))
        columns = [d[0] for d in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    def get_recent_rf(self, seconds: float = 300) -> List[dict]:
        """Get RF samples from last N seconds"""
        cutoff = time.time() - seconds
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT * FROM rf_samples WHERE timestamp > ? ORDER BY timestamp DESC
        ''', (cutoff,))
        columns = [d[0] for d in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


class CameraPPG:
    """Extract heart rate from webcam using remote photoplethysmography"""
    
    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self.running = False
        self.sample_queue = queue.Queue()
        
        # PPG signal buffer
        self.signal_buffer = []
        self.time_buffer = []
        self.buffer_seconds = 30
        self.fps = 30
        
    def _extract_green_channel_mean(self, frame) -> Optional[float]:
        """Extract mean green channel value from face region"""
        if not HAS_CV2 or not HAS_NUMPY:
            return None
            
        # Convert to RGB
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Simple face detection using Haar cascade
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) == 0:
            return None
        
        # Use largest face
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        
        # Extract forehead region (top 30% of face)
        forehead = rgb[y:y+int(h*0.3), x:x+w]
        
        if forehead.size == 0:
            return None
        
        # Mean green channel (most sensitive to blood volume changes)
        return float(np.mean(forehead[:, :, 1]))
    
    def _compute_hrv_metrics(self, signal: List[float], times: List[float]) -> dict:
        """Compute HRV metrics from PPG signal"""
        if not HAS_NUMPY or len(signal) < self.fps * 10:
            return {}
        
        signal = np.array(signal)
        times = np.array(times)
        
        # Bandpass filter 0.7-4 Hz (42-240 BPM)
        from scipy import signal as sig
        fs = self.fps
        low = 0.7 / (fs / 2)
        high = 4.0 / (fs / 2)
        
        try:
            b, a = sig.butter(2, [low, high], btype='band')
            filtered = sig.filtfilt(b, a, signal)
        except:
            return {}
        
        # Find peaks (heartbeats)
        peaks, _ = sig.find_peaks(filtered, distance=fs*0.4)  # Min 0.4s between beats
        
        if len(peaks) < 5:
            return {}
        
        # Inter-beat intervals
        ibi = np.diff(times[peaks]) * 1000  # Convert to ms
        
        # Heart rate
        hr = 60000 / np.mean(ibi)
        
        # RMSSD
        successive_diffs = np.diff(ibi)
        rmssd = np.sqrt(np.mean(successive_diffs ** 2))
        
        # SDNN
        sdnn = np.std(ibi)
        
        # Compute stress index (simplified Baevsky)
        # Higher = more stress
        mode_ibi = np.median(ibi)
        amo = len(ibi[np.abs(ibi - mode_ibi) < 50]) / len(ibi) * 100
        stress_index = amo / (2 * mode_ibi / 1000 * (np.max(ibi) - np.min(ibi)))
        
        return {
            'heart_rate': hr,
            'rmssd': rmssd,
            'sdnn': sdnn,
            'stress_index': min(100, stress_index),  # Cap at 100
            'signal_quality': min(1.0, len(peaks) / (len(signal) / fs * 1.2))
        }
    
    def capture_loop(self):
        """Main capture loop - run in thread"""
        if not HAS_CV2:
            print("[ERROR] OpenCV required for camera PPG")
            return
        
        cap = cv2.VideoCapture(self.camera_index)
        cap.set(cv2.CAP_PROP_FPS, self.fps)
        
        self.running = True
        last_sample_time = 0
        
        while self.running:
            ret, frame = cap.read()
            if not ret:
                continue
            
            now = time.time()
            
            # Extract PPG signal
            green_mean = self._extract_green_channel_mean(frame)
            if green_mean is not None:
                self.signal_buffer.append(green_mean)
                self.time_buffer.append(now)
                
                # Trim buffer to last N seconds
                cutoff = now - self.buffer_seconds
                while self.time_buffer and self.time_buffer[0] < cutoff:
                    self.signal_buffer.pop(0)
                    self.time_buffer.pop(0)
            
            # Compute HRV every 5 seconds
            if now - last_sample_time >= 5:
                metrics = self._compute_hrv_metrics(self.signal_buffer, self.time_buffer)
                if metrics:
                    sample = BiometricSample(
                        timestamp=now,
                        source='camera_ppg',
                        **metrics
                    )
                    self.sample_queue.put(sample)
                last_sample_time = now
            
            # Small delay to prevent CPU saturation
            time.sleep(0.01)
        
        cap.release()
    
    def start(self):
        """Start capture in background thread"""
        thread = threading.Thread(target=self.capture_loop, daemon=True)
        thread.start()
        return thread
    
    def stop(self):
        """Stop capture"""
        self.running = False
    
    def get_samples(self) -> List[BiometricSample]:
        """Get all queued samples"""
        samples = []
        while not self.sample_queue.empty():
            samples.append(self.sample_queue.get())
        return samples


class AudioELFDetector:
    """Detect ELF signals using audio interface as crude spectrum analyzer"""
    
    def __init__(self, sample_rate: int = 48000, device: int = None):
        self.sample_rate = sample_rate
        self.device = device
        self.running = False
        self.sample_queue = queue.Queue()
        
        # Target frequencies to monitor
        self.target_freqs = {
            'grid_60hz': 60.0,
            'anomaly_53hz': 53.5,
            'anomaly_48hz': 48.0,
            'anomaly_36hz': 36.25,
            'theta_6hz': 6.5,  # Heterodyne product
        }
        
        # Detection thresholds (relative to noise floor)
        self.threshold_db = 10
        
    def _analyze_spectrum(self, audio_data) -> RFSample:
        """Analyze audio spectrum for ELF anomalies"""
        if not HAS_NUMPY:
            return RFSample(timestamp=time.time(), source='audio_fft')
        
        # FFT
        n = len(audio_data)
        fft_result = np.fft.rfft(audio_data)
        freqs = np.fft.rfftfreq(n, 1/self.sample_rate)
        magnitudes = np.abs(fft_result)
        
        # Convert to dB
        magnitudes_db = 20 * np.log10(magnitudes + 1e-10)
        
        # Noise floor (median)
        noise_floor = np.median(magnitudes_db)
        
        # Find peaks
        peak_indices = []
        peak_freqs = []
        peak_amps = []
        
        for name, target_freq in self.target_freqs.items():
            # Find bin closest to target
            idx = np.argmin(np.abs(freqs - target_freq))
            
            # Check if significantly above noise floor
            if magnitudes_db[idx] > noise_floor + self.threshold_db:
                peak_indices.append(idx)
                peak_freqs.append(float(freqs[idx]))
                peak_amps.append(float(magnitudes_db[idx]))
        
        # Detect specific anomalies
        elf_53hz = any(abs(f - 53.5) < 1 for f in peak_freqs)
        elf_53hz_amp = next((a for f, a in zip(peak_freqs, peak_amps) if abs(f - 53.5) < 1), None)
        elf_48hz = any(abs(f - 48.0) < 1 for f in peak_freqs)
        elf_36hz = any(abs(f - 36.25) < 1 for f in peak_freqs)
        
        # Compute beat frequencies
        beat_freqs = []
        if elf_53hz and 60.0 in [round(f) for f in peak_freqs]:
            beat_freqs.append(6.5)  # 60 - 53.5
        if elf_48hz and elf_53hz:
            beat_freqs.append(5.5)  # 53.5 - 48
        
        return RFSample(
            timestamp=time.time(),
            source='audio_fft',
            peak_frequencies=peak_freqs,
            peak_amplitudes=peak_amps,
            elf_53hz_present=elf_53hz,
            elf_53hz_amplitude=elf_53hz_amp,
            elf_48hz_present=elf_48hz,
            elf_36hz_present=elf_36hz,
            beat_frequencies=beat_freqs
        )
    
    def capture_loop(self):
        """Main audio capture loop"""
        if not HAS_AUDIO or not HAS_NUMPY:
            print("[ERROR] sounddevice and numpy required for audio ELF detection")
            return
        
        self.running = True
        chunk_duration = 2  # seconds per FFT
        chunk_samples = int(self.sample_rate * chunk_duration)
        
        def audio_callback(indata, frames, time_info, status):
            if status:
                print(f"[AUDIO] {status}")
            self.audio_buffer = np.append(self.audio_buffer, indata[:, 0])
        
        self.audio_buffer = np.array([])
        
        with sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            device=self.device,
            callback=audio_callback
        ):
            while self.running:
                if len(self.audio_buffer) >= chunk_samples:
                    # Analyze chunk
                    chunk = self.audio_buffer[:chunk_samples]
                    self.audio_buffer = self.audio_buffer[chunk_samples:]
                    
                    sample = self._analyze_spectrum(chunk)
                    self.sample_queue.put(sample)
                
                time.sleep(0.1)
    
    def start(self):
        """Start capture in background thread"""
        thread = threading.Thread(target=self.capture_loop, daemon=True)
        thread.start()
        return thread
    
    def stop(self):
        self.running = False
    
    def get_samples(self) -> List[RFSample]:
        samples = []
        while not self.sample_queue.empty():
            samples.append(self.sample_queue.get())
        return samples


class CorrelationEngine:
    """Detect correlations between biometric and RF/network events"""
    
    def __init__(self, db: EvidenceDatabase):
        self.db = db
        
        # Correlation parameters
        self.max_lag_seconds = 30  # Maximum time offset to check
        self.min_correlation = 0.5  # Minimum correlation coefficient
        self.window_seconds = 300  # Analysis window
    
    def analyze(self) -> List[CorrelationEvent]:
        """Analyze recent data for correlations"""
        events = []
        
        # Get recent data
        bio_samples = self.db.get_recent_biometric(self.window_seconds)
        rf_samples = self.db.get_recent_rf(self.window_seconds)
        
        if len(bio_samples) < 5 or len(rf_samples) < 5:
            return events
        
        # Check for HRV-ELF correlation
        events.extend(self._check_hrv_elf_correlation(bio_samples, rf_samples))
        
        # Check for stress-53Hz correlation
        events.extend(self._check_stress_53hz_correlation(bio_samples, rf_samples))
        
        return events
    
    def _check_hrv_elf_correlation(self, bio: List[dict], rf: List[dict]) -> List[CorrelationEvent]:
        """Check if HRV changes correlate with 53Hz ELF presence"""
        events = []
        
        if not HAS_NUMPY:
            return events
        
        # Extract time series
        bio_times = np.array([s['timestamp'] for s in bio])
        bio_stress = np.array([s['stress_index'] or 0 for s in bio])
        
        rf_times = np.array([s['timestamp'] for s in rf])
        rf_53hz = np.array([1 if s['elf_53hz_present'] else 0 for s in rf])
        
        # Interpolate to common time base
        common_times = np.linspace(
            max(bio_times.min(), rf_times.min()),
            min(bio_times.max(), rf_times.max()),
            100
        )
        
        bio_interp = np.interp(common_times, bio_times, bio_stress)
        rf_interp = np.interp(common_times, rf_times, rf_53hz)
        
        # Cross-correlation
        corr = np.correlate(bio_interp - bio_interp.mean(), 
                           rf_interp - rf_interp.mean(), 
                           mode='full')
        corr = corr / (len(bio_interp) * bio_interp.std() * rf_interp.std() + 1e-10)
        
        # Find peak correlation
        peak_idx = np.argmax(np.abs(corr))
        peak_corr = corr[peak_idx]
        lag_samples = peak_idx - len(bio_interp) + 1
        lag_seconds = lag_samples * (common_times[1] - common_times[0])
        
        if abs(peak_corr) >= self.min_correlation:
            events.append(CorrelationEvent(
                timestamp=time.time(),
                event_type='hrv_elf_53hz_correlation',
                correlation_coefficient=float(peak_corr),
                lag_seconds=float(lag_seconds),
                confidence=min(1.0, abs(peak_corr)),
                biometric_sample_id=bio[0]['id'],
                rf_sample_id=rf[0]['id'],
                description=f"Stress index correlates with 53Hz ELF (r={peak_corr:.3f}, lag={lag_seconds:.1f}s)"
            ))
        
        return events
    
    def _check_stress_53hz_correlation(self, bio: List[dict], rf: List[dict]) -> List[CorrelationEvent]:
        """Check if stress spikes follow 53Hz detection"""
        events = []
        
        # Find 53Hz onset events
        prev_53hz = False
        for i, sample in enumerate(rf):
            if sample['elf_53hz_present'] and not prev_53hz:
                # 53Hz just started - check for stress increase in next 30s
                onset_time = sample['timestamp']
                
                # Find biometric samples in window
                window_bio = [b for b in bio 
                             if onset_time <= b['timestamp'] <= onset_time + 30]
                
                if len(window_bio) >= 2:
                    stress_before = bio[max(0, i-1)]['stress_index'] or 0
                    stress_after = max(b['stress_index'] or 0 for b in window_bio)
                    stress_delta = stress_after - stress_before
                    
                    if stress_delta > 10:  # Significant stress increase
                        events.append(CorrelationEvent(
                            timestamp=time.time(),
                            event_type='stress_spike_after_53hz_onset',
                            correlation_coefficient=stress_delta / 100,
                            lag_seconds=0,
                            confidence=min(1.0, stress_delta / 30),
                            biometric_sample_id=window_bio[0]['id'],
                            rf_sample_id=sample['id'],
                            description=f"Stress increased by {stress_delta:.1f} points after 53Hz onset"
                        ))
            
            prev_53hz = sample['elf_53hz_present']
        
        return events


class BiometricCorrelator:
    """Main orchestration class"""
    
    def __init__(self, db_path: str = "biometric_evidence.db"):
        self.db = EvidenceDatabase(db_path)
        self.ppg = CameraPPG() if HAS_CV2 else None
        self.elf = AudioELFDetector() if HAS_AUDIO else None
        self.correlation_engine = CorrelationEngine(self.db)
        
        self.running = False
        
    def start(self):
        """Start all capture systems"""
        print("[CORRELATOR] Starting biometric-RF correlation system...")
        print(f"[CORRELATOR] Database: {self.db.db_path}")
        
        self.running = True
        
        # Start capture threads
        if self.ppg:
            print("[CORRELATOR] Starting camera PPG capture...")
            self.ppg.start()
        else:
            print("[CORRELATOR] Camera PPG not available (install opencv-python)")
        
        if self.elf:
            print("[CORRELATOR] Starting audio ELF detection...")
            self.elf.start()
        else:
            print("[CORRELATOR] Audio ELF not available (install sounddevice)")
        
        # Main loop
        try:
            while self.running:
                # Collect samples
                if self.ppg:
                    for sample in self.ppg.get_samples():
                        sample_id = self.db.store_biometric(sample)
                        if sample.stress_index and sample.stress_index > 50:
                            print(f"[BIO] HR={sample.heart_rate:.0f} Stress={sample.stress_index:.0f}")
                
                if self.elf:
                    for sample in self.elf.get_samples():
                        sample_id = self.db.store_rf(sample)
                        if sample.elf_53hz_present:
                            print(f"[RF] 53Hz DETECTED @ {sample.elf_53hz_amplitude:.1f}dB")
                        if sample.beat_frequencies:
                            print(f"[RF] Beat frequencies: {sample.beat_frequencies}")
                
                # Run correlation analysis
                events = self.correlation_engine.analyze()
                for event in events:
                    event_id = self.db.store_correlation(event)
                    print(f"[CORRELATION] {event.event_type}: {event.description}")
                
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n[CORRELATOR] Shutting down...")
        
        self.stop()
    
    def stop(self):
        """Stop all systems"""
        self.running = False
        if self.ppg:
            self.ppg.stop()
        if self.elf:
            self.elf.stop()
        print("[CORRELATOR] Stopped")
    
    def generate_report(self, hours: float = 24) -> dict:
        """Generate summary report"""
        seconds = hours * 3600
        
        bio = self.db.get_recent_biometric(seconds)
        rf = self.db.get_recent_rf(seconds)
        
        report = {
            'period_hours': hours,
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'biometric_samples': len(bio),
            'rf_samples': len(rf),
            'elf_53hz_detections': sum(1 for s in rf if s.get('elf_53hz_present')),
            'elf_48hz_detections': sum(1 for s in rf if s.get('elf_48hz_present')),
            'high_stress_periods': sum(1 for s in bio if (s.get('stress_index') or 0) > 70),
            'correlations_detected': 0  # TODO: Query correlation_events
        }
        
        if bio:
            stress_vals = [s['stress_index'] for s in bio if s['stress_index']]
            if stress_vals:
                report['avg_stress'] = sum(stress_vals) / len(stress_vals)
                report['max_stress'] = max(stress_vals)
        
        return report


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Biometric-RF Correlator')
    parser.add_argument('--db', default='biometric_evidence.db', help='Database path')
    parser.add_argument('--report', action='store_true', help='Generate report and exit')
    parser.add_argument('--hours', type=float, default=24, help='Report period in hours')
    
    args = parser.parse_args()
    
    correlator = BiometricCorrelator(args.db)
    
    if args.report:
        report = correlator.generate_report(args.hours)
        print(json.dumps(report, indent=2))
    else:
        correlator.start()


if __name__ == '__main__':
    main()
