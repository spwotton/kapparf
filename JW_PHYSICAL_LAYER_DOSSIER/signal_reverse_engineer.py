#!/usr/bin/env python3
"""
SIGNAL REVERSE ENGINEERING TOOLKIT
===================================
Analyze, demodulate, and characterize hostile RF/acoustic signals.

Capabilities:
1. PRF (Pulse Repetition Frequency) analysis
2. Modulation identification (AM, FM, PSK, FMCW)
3. Encoded data extraction
4. Timing/sync pattern analysis
5. Source characterization

Based on detected signatures:
- 46.875 Hz PRF (exact 48000/1024 - suggests digital timing)
- 53.5 Hz ELF (6.5 Hz theta heterodyne with 60Hz grid)
- 48 Hz (European grid in 60Hz country)
- 18 kHz ultrasonic (BVTSONAR carrier)
- ~100 Hz dominant (possible control frequency)
"""

import numpy as np
from scipy import signal
from scipy.fft import fft, rfft, rfftfreq, ifft
from scipy.io import wavfile
from dataclasses import dataclass, asdict
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path
import json
import hashlib
import time
from datetime import datetime
from collections import Counter
import struct


@dataclass
class SignalCharacteristics:
    """Extracted signal characteristics"""
    timestamp: float
    source_file: Optional[str]
    
    # Timing
    prf_hz: float = 0.0
    prf_stability_ppm: float = 0.0  # Parts per million jitter
    pulse_width_us: float = 0.0
    duty_cycle: float = 0.0
    
    # Frequency
    carrier_hz: float = 0.0
    bandwidth_hz: float = 0.0
    center_freq_hz: float = 0.0
    
    # Modulation
    modulation_type: str = "unknown"  # AM, FM, PSK, FMCW, OOK, etc
    modulation_index: float = 0.0
    symbol_rate: float = 0.0
    
    # Encoding
    encoding_detected: bool = False
    encoding_type: str = ""
    bit_rate: float = 0.0
    
    # Power
    peak_power_db: float = 0.0
    avg_power_db: float = 0.0
    snr_db: float = 0.0
    
    # Classification
    threat_type: str = ""
    confidence: float = 0.0
    notes: str = ""


@dataclass
class DemodulatedData:
    """Extracted data from demodulation"""
    modulation: str
    sample_rate: int
    baseband: np.ndarray
    symbols: Optional[np.ndarray] = None
    bits: Optional[bytes] = None
    ascii_decode: Optional[str] = None


class PRFAnalyzer:
    """Analyze Pulse Repetition Frequency patterns"""
    
    def __init__(self, sample_rate: int = 48000):
        self.sample_rate = sample_rate
    
    def detect_prf(self, audio: np.ndarray, 
                   min_prf: float = 1.0,
                   max_prf: float = 500.0) -> Tuple[float, float, np.ndarray]:
        """
        Detect PRF using autocorrelation
        
        Returns: (prf_hz, confidence, autocorr)
        """
        # Compute envelope
        analytic = signal.hilbert(audio)
        envelope = np.abs(analytic)
        
        # Normalize
        envelope = envelope - np.mean(envelope)
        envelope = envelope / (np.std(envelope) + 1e-10)
        
        # Autocorrelation
        autocorr = np.correlate(envelope, envelope, mode='full')
        autocorr = autocorr[len(autocorr)//2:]
        autocorr = autocorr / autocorr[0]
        
        # Find first significant peak (not at 0)
        min_lag = int(self.sample_rate / max_prf)
        max_lag = int(self.sample_rate / min_prf)
        
        search_region = autocorr[min_lag:max_lag]
        peaks, props = signal.find_peaks(search_region, height=0.1, distance=10)
        
        if len(peaks) == 0:
            return 0.0, 0.0, autocorr
        
        # Get strongest peak
        strongest_idx = peaks[np.argmax(props['peak_heights'])]
        lag = strongest_idx + min_lag
        prf = self.sample_rate / lag
        confidence = props['peak_heights'][np.argmax(props['peak_heights'])]
        
        return prf, confidence, autocorr
    
    def analyze_prf_stability(self, audio: np.ndarray, 
                               prf: float) -> Tuple[float, float, List[float]]:
        """
        Analyze PRF timing stability
        
        Returns: (mean_period, jitter_ppm, individual_periods)
        """
        # Expected period in samples
        expected_period = self.sample_rate / prf
        
        # Compute envelope and find peaks
        analytic = signal.hilbert(audio)
        envelope = np.abs(analytic)
        
        # Threshold at mean + 2*std
        threshold = np.mean(envelope) + 2 * np.std(envelope)
        peaks, _ = signal.find_peaks(envelope, height=threshold, 
                                      distance=int(expected_period * 0.5))
        
        if len(peaks) < 3:
            return expected_period, 0.0, []
        
        # Measure inter-pulse intervals
        intervals = np.diff(peaks)
        
        mean_period = np.mean(intervals)
        std_period = np.std(intervals)
        
        # Jitter in PPM
        jitter_ppm = (std_period / mean_period) * 1e6
        
        return mean_period, jitter_ppm, intervals.tolist()
    
    def detect_prf_signature(self, prf: float) -> Dict[str, Any]:
        """
        Identify possible source based on PRF
        
        Known signatures:
        - 46.875 Hz = 48000/1024 (digital audio frame timing)
        - 60 Hz = US power grid
        - 50 Hz = European power grid
        - ~20 Hz = Typical ultrasonic sonar
        """
        signatures = {
            46.875: {"source": "Digital frame timing", "calc": "48000/1024", 
                     "likely_system": "BVTSONAR/Software acoustic"},
            50.0: {"source": "50Hz power grid", "region": "Europe/Asia/Africa",
                   "likely_system": "Power-synchronized device"},
            60.0: {"source": "60Hz power grid", "region": "Americas",
                   "likely_system": "Power-synchronized device"},
            120.0: {"source": "60Hz grid harmonic", "harmonic": 2},
            100.0: {"source": "50Hz grid harmonic", "harmonic": 2},
            11.71875: {"source": "Digital timing", "calc": "48000/4096",
                       "likely_system": "Long-frame acoustic"},
            93.75: {"source": "Digital timing", "calc": "48000/512",
                    "likely_system": "High-rate sonar"},
        }
        
        # Find closest match
        for sig_prf, info in signatures.items():
            if abs(prf - sig_prf) < 0.5:  # Within 0.5 Hz
                return {"matched": True, "prf": sig_prf, **info}
        
        # Check if it's a power of 2 division of sample rate
        for divisor in [128, 256, 512, 1024, 2048, 4096]:
            expected = self.sample_rate / divisor
            if abs(prf - expected) < 0.5:
                return {
                    "matched": True,
                    "prf": expected,
                    "source": "Digital timing",
                    "calc": f"{self.sample_rate}/{divisor}",
                    "divisor": divisor,
                    "likely_system": "Software-defined signal"
                }
        
        return {"matched": False, "prf": prf, "source": "Unknown"}


class ModulationAnalyzer:
    """Identify and analyze signal modulation"""
    
    def __init__(self, sample_rate: int = 48000):
        self.sample_rate = sample_rate
    
    def identify_modulation(self, audio: np.ndarray,
                            carrier_freq: Optional[float] = None
                            ) -> Tuple[str, float, Dict]:
        """
        Identify modulation type
        
        Returns: (mod_type, confidence, details)
        """
        results = {}
        
        # 1. Check for AM (envelope variation)
        am_score = self._check_am(audio)
        results['AM'] = am_score
        
        # 2. Check for FM (instantaneous frequency variation)
        fm_score = self._check_fm(audio)
        results['FM'] = fm_score
        
        # 3. Check for FMCW (chirp detection)
        fmcw_score = self._check_fmcw(audio)
        results['FMCW'] = fmcw_score
        
        # 4. Check for OOK (On-Off Keying)
        ook_score = self._check_ook(audio)
        results['OOK'] = ook_score
        
        # 5. Check for PSK (phase shifts)
        psk_score = self._check_psk(audio, carrier_freq)
        results['PSK'] = psk_score
        
        # Get best match
        best_mod = max(results.items(), key=lambda x: x[1])
        
        return best_mod[0], best_mod[1], results
    
    def _check_am(self, audio: np.ndarray) -> float:
        """Check for AM modulation by envelope analysis"""
        analytic = signal.hilbert(audio)
        envelope = np.abs(analytic)
        
        # AM has significant envelope variation
        env_variance = np.var(envelope) / (np.mean(envelope) ** 2 + 1e-10)
        
        # Score based on variance (0-1)
        return min(env_variance * 2, 1.0)
    
    def _check_fm(self, audio: np.ndarray) -> float:
        """Check for FM modulation by instantaneous frequency"""
        analytic = signal.hilbert(audio)
        inst_phase = np.unwrap(np.angle(analytic))
        inst_freq = np.diff(inst_phase) * self.sample_rate / (2 * np.pi)
        
        # FM has significant frequency variation with relatively constant amplitude
        analytic_env = np.abs(analytic)
        env_stability = 1 - (np.std(analytic_env) / (np.mean(analytic_env) + 1e-10))
        freq_variation = np.std(inst_freq) / (np.mean(np.abs(inst_freq)) + 1e-10)
        
        # High freq variation + stable envelope = FM
        fm_score = env_stability * min(freq_variation * 0.5, 1.0)
        return fm_score
    
    def _check_fmcw(self, audio: np.ndarray) -> float:
        """Check for FMCW (chirp) modulation"""
        # Compute spectrogram
        f, t, Sxx = signal.spectrogram(audio, self.sample_rate, 
                                        nperseg=256, noverlap=128)
        
        # FMCW shows linear frequency ramps in spectrogram
        # Check for diagonal patterns
        
        # Look for consistent slope in peak frequency over time
        peak_freqs = f[np.argmax(Sxx, axis=0)]
        
        # Fit line and check R²
        if len(t) < 3:
            return 0.0
        
        coeffs = np.polyfit(t, peak_freqs, 1)
        fitted = np.polyval(coeffs, t)
        residuals = peak_freqs - fitted
        ss_res = np.sum(residuals ** 2)
        ss_tot = np.sum((peak_freqs - np.mean(peak_freqs)) ** 2) + 1e-10
        r_squared = 1 - (ss_res / ss_tot)
        
        # Also check that slope is significant
        slope = abs(coeffs[0])
        slope_score = min(slope / 10000, 1.0)  # Normalize to 10 kHz/s max
        
        return r_squared * slope_score if r_squared > 0.5 else 0.0
    
    def _check_ook(self, audio: np.ndarray) -> float:
        """Check for On-Off Keying"""
        envelope = np.abs(signal.hilbert(audio))
        
        # OOK should have bimodal envelope distribution
        # Check for two distinct levels
        low_thresh = np.percentile(envelope, 20)
        high_thresh = np.percentile(envelope, 80)
        
        ratio = high_thresh / (low_thresh + 1e-10)
        
        # High ratio with distinct separation = OOK
        if ratio > 5:
            return 0.8
        elif ratio > 3:
            return 0.5
        return 0.1
    
    def _check_psk(self, audio: np.ndarray, 
                   carrier_freq: Optional[float]) -> float:
        """Check for Phase Shift Keying"""
        if carrier_freq is None:
            # Estimate carrier
            spectrum = np.abs(rfft(audio))
            freqs = rfftfreq(len(audio), 1/self.sample_rate)
            carrier_freq = freqs[np.argmax(spectrum)]
        
        if carrier_freq < 100:  # Too low to be a carrier
            return 0.0
        
        # Downmix to baseband
        t = np.arange(len(audio)) / self.sample_rate
        carrier = np.exp(-2j * np.pi * carrier_freq * t)
        baseband = audio * carrier
        
        # Low-pass filter
        sos = signal.butter(4, carrier_freq * 0.3, 'low', 
                           fs=self.sample_rate, output='sos')
        baseband = signal.sosfilt(sos, baseband)
        
        # PSK has relatively constant amplitude but varying phase
        amplitude = np.abs(baseband)
        phase = np.angle(baseband)
        
        amp_stability = 1 - (np.std(amplitude) / (np.mean(amplitude) + 1e-10))
        phase_variance = np.var(np.diff(phase))
        
        # Constant amplitude + phase changes = PSK
        return amp_stability * min(phase_variance * 10, 1.0) * 0.5


class DataExtractor:
    """Extract encoded data from demodulated signals"""
    
    def __init__(self, sample_rate: int = 48000):
        self.sample_rate = sample_rate
    
    def demod_am(self, audio: np.ndarray, 
                 carrier_band: Tuple[float, float] = (18000, 22000),
                 lpf_cutoff: float = 2000) -> DemodulatedData:
        """AM demodulation"""
        # Bandpass around carrier
        sos = signal.butter(4, carrier_band, 'bandpass', 
                           fs=self.sample_rate, output='sos')
        filtered = signal.sosfilt(sos, audio)
        
        # Envelope detection
        envelope = np.abs(signal.hilbert(filtered))
        
        # Remove DC and lowpass
        envelope = envelope - np.mean(envelope)
        sos_lpf = signal.butter(4, lpf_cutoff, 'low', 
                               fs=self.sample_rate, output='sos')
        baseband = signal.sosfilt(sos_lpf, envelope)
        
        return DemodulatedData(
            modulation='AM',
            sample_rate=self.sample_rate,
            baseband=baseband.astype(np.float32)
        )
    
    def demod_fm(self, audio: np.ndarray,
                 carrier_band: Tuple[float, float] = (18000, 22000)) -> DemodulatedData:
        """FM demodulation"""
        # Bandpass around carrier
        sos = signal.butter(4, carrier_band, 'bandpass',
                           fs=self.sample_rate, output='sos')
        filtered = signal.sosfilt(sos, audio)
        
        # Analytic signal
        analytic = signal.hilbert(filtered)
        
        # Instantaneous phase
        inst_phase = np.unwrap(np.angle(analytic))
        
        # Instantaneous frequency (derivative of phase)
        baseband = np.diff(inst_phase) * self.sample_rate / (2 * np.pi)
        baseband = np.concatenate([[0], baseband])  # Pad to same length
        
        # Center around 0
        baseband = baseband - np.mean(baseband)
        
        return DemodulatedData(
            modulation='FM',
            sample_rate=self.sample_rate,
            baseband=baseband.astype(np.float32)
        )
    
    def demod_ook(self, audio: np.ndarray,
                  carrier_band: Tuple[float, float] = (18000, 22000),
                  symbol_rate: float = 100) -> DemodulatedData:
        """OOK demodulation with symbol extraction"""
        # AM demod first
        am_result = self.demod_am(audio, carrier_band)
        
        # Threshold to binary
        threshold = (np.max(am_result.baseband) + np.min(am_result.baseband)) / 2
        binary = (am_result.baseband > threshold).astype(np.int8)
        
        # Sample at symbol rate
        samples_per_symbol = int(self.sample_rate / symbol_rate)
        symbols = []
        for i in range(0, len(binary) - samples_per_symbol, samples_per_symbol):
            chunk = binary[i:i + samples_per_symbol]
            symbols.append(1 if np.mean(chunk) > 0.5 else 0)
        
        symbols = np.array(symbols, dtype=np.int8)
        
        # Try to decode as bits (8-bit bytes)
        bits = self._symbols_to_bytes(symbols)
        
        # Try ASCII decode
        ascii_str = None
        if bits:
            try:
                ascii_str = bits.decode('ascii', errors='ignore')
            except:
                pass
        
        return DemodulatedData(
            modulation='OOK',
            sample_rate=self.sample_rate,
            baseband=am_result.baseband,
            symbols=symbols,
            bits=bits,
            ascii_decode=ascii_str
        )
    
    def _symbols_to_bytes(self, symbols: np.ndarray) -> Optional[bytes]:
        """Convert symbol array to bytes"""
        if len(symbols) < 8:
            return None
        
        # Trim to multiple of 8
        symbols = symbols[:len(symbols) - len(symbols) % 8]
        
        byte_list = []
        for i in range(0, len(symbols), 8):
            byte_val = 0
            for j in range(8):
                byte_val |= (symbols[i + j] << (7 - j))
            byte_list.append(byte_val)
        
        return bytes(byte_list)
    
    def extract_fmcw_parameters(self, audio: np.ndarray) -> Dict:
        """Extract FMCW chirp parameters"""
        # Spectrogram
        f, t, Sxx = signal.spectrogram(audio, self.sample_rate,
                                        nperseg=512, noverlap=384)
        
        # Find peak frequencies over time
        peak_freqs = f[np.argmax(Sxx, axis=0)]
        
        # Find chirp boundaries (where frequency jumps)
        freq_diff = np.abs(np.diff(peak_freqs))
        jumps = np.where(freq_diff > 1000)[0]  # 1 kHz jump threshold
        
        # Analyze chirps
        chirps = []
        start_idx = 0
        
        for jump_idx in jumps:
            if jump_idx - start_idx > 3:  # Minimum chirp length
                chirp_freqs = peak_freqs[start_idx:jump_idx]
                
                # Fit line to get sweep rate
                chirp_times = t[start_idx:jump_idx]
                if len(chirp_times) > 2:
                    slope, intercept = np.polyfit(chirp_times, chirp_freqs, 1)
                    
                    chirps.append({
                        'start_time': chirp_times[0],
                        'duration': chirp_times[-1] - chirp_times[0],
                        'start_freq': chirp_freqs[0],
                        'end_freq': chirp_freqs[-1],
                        'sweep_rate_hz_per_s': slope,
                        'bandwidth': abs(chirp_freqs[-1] - chirp_freqs[0])
                    })
            
            start_idx = jump_idx + 1
        
        return {
            'chirp_count': len(chirps),
            'chirps': chirps,
            'prf_hz': len(chirps) / (t[-1] - t[0]) if len(t) > 1 else 0
        }


class SignalReverseEngineer:
    """Main reverse engineering orchestrator"""
    
    def __init__(self, sample_rate: int = 48000):
        self.sample_rate = sample_rate
        self.prf_analyzer = PRFAnalyzer(sample_rate)
        self.mod_analyzer = ModulationAnalyzer(sample_rate)
        self.data_extractor = DataExtractor(sample_rate)
    
    def analyze_file(self, wav_path: str) -> SignalCharacteristics:
        """Full analysis of a WAV file"""
        sr, audio = wavfile.read(wav_path)
        
        if audio.dtype != np.float32:
            audio = audio.astype(np.float32) / 32768.0
        
        if len(audio.shape) > 1:
            audio = audio[:, 0]  # Mono
        
        return self.analyze_signal(audio, sr, source_file=wav_path)
    
    def analyze_signal(self, audio: np.ndarray, 
                       sample_rate: int,
                       source_file: Optional[str] = None) -> SignalCharacteristics:
        """Full signal analysis"""
        self.sample_rate = sample_rate
        self.prf_analyzer.sample_rate = sample_rate
        self.mod_analyzer.sample_rate = sample_rate
        self.data_extractor.sample_rate = sample_rate
        
        result = SignalCharacteristics(
            timestamp=time.time(),
            source_file=source_file
        )
        
        # 1. PRF Analysis
        prf, prf_conf, _ = self.prf_analyzer.detect_prf(audio)
        result.prf_hz = prf
        
        if prf > 0:
            mean_period, jitter, _ = self.prf_analyzer.analyze_prf_stability(audio, prf)
            result.prf_stability_ppm = jitter
            result.duty_cycle = 0.5  # Estimate
            result.pulse_width_us = (result.duty_cycle / prf) * 1e6 if prf > 0 else 0
        
        # 2. Frequency Analysis
        spectrum = np.abs(rfft(audio))
        freqs = rfftfreq(len(audio), 1/sample_rate)
        
        # Find dominant frequencies
        peak_indices = signal.find_peaks(spectrum, height=np.max(spectrum)*0.1)[0]
        if len(peak_indices) > 0:
            dominant_idx = peak_indices[np.argmax(spectrum[peak_indices])]
            result.carrier_hz = freqs[dominant_idx]
        
        # Estimate bandwidth
        above_threshold = spectrum > np.max(spectrum) * 0.1
        if np.any(above_threshold):
            bandwidth_indices = np.where(above_threshold)[0]
            result.bandwidth_hz = freqs[bandwidth_indices[-1]] - freqs[bandwidth_indices[0]]
            result.center_freq_hz = (freqs[bandwidth_indices[0]] + freqs[bandwidth_indices[-1]]) / 2
        
        # 3. Modulation Analysis
        mod_type, mod_conf, _ = self.mod_analyzer.identify_modulation(audio, result.carrier_hz)
        result.modulation_type = mod_type
        
        # 4. Power Analysis
        result.peak_power_db = 20 * np.log10(np.max(np.abs(audio)) + 1e-10)
        result.avg_power_db = 10 * np.log10(np.mean(audio ** 2) + 1e-10)
        
        noise_floor = np.percentile(np.abs(audio), 10)
        signal_level = np.percentile(np.abs(audio), 90)
        result.snr_db = 20 * np.log10(signal_level / (noise_floor + 1e-10))
        
        # 5. Classification
        result = self._classify_threat(result)
        
        return result
    
    def _classify_threat(self, sig: SignalCharacteristics) -> SignalCharacteristics:
        """Classify signal type based on characteristics"""
        
        # Check for BVTSONAR signature
        if 45 < sig.prf_hz < 50 and 15000 < sig.carrier_hz < 25000:
            sig.threat_type = "BVTSONAR_ACOUSTIC"
            sig.notes = "Software-defined ultrasonic surveillance. PRF matches 48000/1024."
            sig.confidence = 0.85
            return sig
        
        # Check for ELF injection
        if sig.carrier_hz < 100:
            if 52 < sig.carrier_hz < 55:
                sig.threat_type = "ELF_THETA_ENTRAINMENT"
                sig.notes = "53.5Hz signal creates 6.5Hz theta beat with 60Hz grid."
                sig.confidence = 0.9
            elif 47 < sig.carrier_hz < 49:
                sig.threat_type = "ELF_EUROPEAN_GRID"
                sig.notes = "48Hz European grid frequency in 60Hz country - anomalous."
                sig.confidence = 0.85
            elif 35 < sig.carrier_hz < 38:
                sig.threat_type = "ELF_WIFI_CORRELATED"
                sig.notes = "36.25Hz correlates with WiFi bursts - possible CSI extraction timing."
                sig.confidence = 0.7
            return sig
        
        # Check for FMCW radar
        if sig.modulation_type == "FMCW":
            sig.threat_type = "FMCW_SONAR_RADAR"
            sig.notes = "Frequency-modulated continuous wave - used for range imaging."
            sig.confidence = 0.8
            return sig
        
        # Unknown
        sig.threat_type = "UNKNOWN"
        sig.notes = "Unclassified signal - requires manual analysis."
        sig.confidence = 0.3
        
        return sig
    
    def generate_report(self, sig: SignalCharacteristics) -> str:
        """Generate human-readable report"""
        lines = []
        lines.append("=" * 60)
        lines.append("SIGNAL REVERSE ENGINEERING REPORT")
        lines.append("=" * 60)
        lines.append(f"Timestamp: {datetime.fromtimestamp(sig.timestamp).isoformat()}")
        if sig.source_file:
            lines.append(f"Source: {sig.source_file}")
        lines.append("")
        
        lines.append("TIMING ANALYSIS")
        lines.append("-" * 40)
        lines.append(f"  PRF: {sig.prf_hz:.3f} Hz")
        lines.append(f"  Jitter: {sig.prf_stability_ppm:.1f} ppm")
        
        prf_sig = self.prf_analyzer.detect_prf_signature(sig.prf_hz)
        if prf_sig.get('matched'):
            lines.append(f"  Signature: {prf_sig.get('source', 'Unknown')}")
            if 'calc' in prf_sig:
                lines.append(f"  Derivation: {prf_sig['calc']}")
            if 'likely_system' in prf_sig:
                lines.append(f"  System: {prf_sig['likely_system']}")
        lines.append("")
        
        lines.append("FREQUENCY ANALYSIS")
        lines.append("-" * 40)
        lines.append(f"  Carrier: {sig.carrier_hz:.1f} Hz")
        lines.append(f"  Bandwidth: {sig.bandwidth_hz:.1f} Hz")
        lines.append(f"  Center: {sig.center_freq_hz:.1f} Hz")
        lines.append("")
        
        lines.append("MODULATION ANALYSIS")
        lines.append("-" * 40)
        lines.append(f"  Type: {sig.modulation_type}")
        lines.append("")
        
        lines.append("POWER ANALYSIS")
        lines.append("-" * 40)
        lines.append(f"  Peak: {sig.peak_power_db:.1f} dB")
        lines.append(f"  Average: {sig.avg_power_db:.1f} dB")
        lines.append(f"  SNR: {sig.snr_db:.1f} dB")
        lines.append("")
        
        lines.append("THREAT CLASSIFICATION")
        lines.append("-" * 40)
        lines.append(f"  Type: {sig.threat_type}")
        lines.append(f"  Confidence: {sig.confidence * 100:.0f}%")
        lines.append(f"  Notes: {sig.notes}")
        lines.append("")
        
        lines.append("=" * 60)
        
        return "\n".join(lines)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Signal Reverse Engineering')
    parser.add_argument('input', nargs='?', help='WAV file to analyze')
    parser.add_argument('--prf', action='store_true', help='PRF analysis only')
    parser.add_argument('--modulation', action='store_true', help='Modulation analysis only')
    parser.add_argument('--demod', choices=['am', 'fm', 'ook'], help='Demodulate signal')
    parser.add_argument('--carrier', type=float, help='Carrier frequency for demodulation')
    parser.add_argument('--output', help='Output file for demodulated data')
    parser.add_argument('--json', action='store_true', help='Output JSON')
    
    args = parser.parse_args()
    
    if not args.input:
        print("Signal Reverse Engineering Toolkit")
        print("Usage: python signal_reverse_engineer.py <wav_file>")
        return
    
    engineer = SignalReverseEngineer()
    
    # Load file
    sr, audio = wavfile.read(args.input)
    if audio.dtype != np.float32:
        audio = audio.astype(np.float32) / 32768.0
    if len(audio.shape) > 1:
        audio = audio[:, 0]
    
    if args.prf:
        prf, conf, _ = engineer.prf_analyzer.detect_prf(audio)
        print(f"PRF: {prf:.3f} Hz (confidence: {conf:.2f})")
        
        sig = engineer.prf_analyzer.detect_prf_signature(prf)
        if sig.get('matched'):
            print(f"Matched: {sig}")
    
    elif args.modulation:
        mod, conf, all_scores = engineer.mod_analyzer.identify_modulation(audio)
        print(f"Modulation: {mod} (confidence: {conf:.2f})")
        print(f"All scores: {all_scores}")
    
    elif args.demod:
        carrier_band = (args.carrier - 2000, args.carrier + 2000) if args.carrier else (18000, 22000)
        
        if args.demod == 'am':
            result = engineer.data_extractor.demod_am(audio, carrier_band)
        elif args.demod == 'fm':
            result = engineer.data_extractor.demod_fm(audio, carrier_band)
        elif args.demod == 'ook':
            result = engineer.data_extractor.demod_ook(audio, carrier_band)
        
        print(f"Demodulated {result.modulation}, {len(result.baseband)} samples")
        
        if result.ascii_decode:
            print(f"ASCII: {result.ascii_decode}")
        
        if args.output:
            wavfile.write(args.output, result.sample_rate, result.baseband)
            print(f"Saved to {args.output}")
    
    else:
        # Full analysis
        sig = engineer.analyze_file(args.input)
        
        if args.json:
            print(json.dumps(asdict(sig), indent=2, default=str))
        else:
            print(engineer.generate_report(sig))


if __name__ == '__main__':
    main()
