#!/usr/bin/env python3
"""
Tube-SDR Demodulator: Virtual Eitel Triode (VET) Signal Extractor
=====================================================================

Applies William Eitel's high-gain tube saturation principles to digital
signal processing, revealing hidden 46.875 Hz carriers in RF environments.

Deploy on KiwiSDR or local RTL-SDR devices to detect 46.875 Hz modulation
artifacts hidden within standard AM/FM carriers.

Usage:
    python tube_sdr_demodulator.py --frequency 1000 --sample-rate 48000 --gain 1000
"""

import numpy as np
import scipy.signal as signal
from dataclasses import dataclass
from typing import Tuple, Optional
import argparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class VETConfig:
    """Virtual Eitel Triode configuration parameters."""
    gain: float = 1000.0  # High-gain approximating tube saturation
    carrier_freq: float = 1000.0  # Tuned carrier frequency (Hz)
    target_freq: float = 46.875  # Target ghost signal frequency
    sample_rate: float = 48000.0  # Audio/SDR sample rate
    fft_size: int = 4096
    bandpass_width: float = 5.0  # ±5 Hz around target frequency


class VirtualEitelTriode:
    """
    Non-linear DSP filter modeling vacuum tube saturation.
    
    Mechanism: Applies soft-clipping tanh(G*x[n]) to compress high-amplitude
    noise while amplifying weak coherent signals in the "toe" region.
    """
    
    def __init__(self, config: VETConfig):
        self.config = config
        self.buffer = np.array([])
        
    def saturate(self, iq_data: np.ndarray) -> np.ndarray:
        """
        Apply tube saturation transfer function.
        
        Args:
            iq_data: Complex I/Q samples from SDR
            
        Returns:
            Saturated (clipped) complex signal
        """
        # Apply gain then soft clipping
        magnitude = np.abs(iq_data)
        phase = np.angle(iq_data)
        
        # Soft clipping via tanh (simulates anode characteristic)
        saturated_mag = np.tanh(self.config.gain * magnitude)
        
        # Reconstruct complex signal
        saturated = saturated_mag * np.exp(1j * phase)
        return saturated
    
    def remove_carrier(self, saturated_signal: np.ndarray) -> np.ndarray:
        """
        Remove fundamental carrier via DC removal after saturation.
        Leaves intermodulation products and harmonics.
        
        Args:
            saturated_signal: Saturated complex signal
            
        Returns:
            Carrier-removed harmonics
        """
        harmonics = saturated_signal - np.mean(saturated_signal)
        return harmonics
    
    def extract_harmonics(self, iq_data: np.ndarray) -> np.ndarray:
        """
        Complete saturation extraction pipeline.
        
        Args:
            iq_data: Raw I/Q samples
            
        Returns:
            Harmonic-enriched signal
        """
        saturated = self.saturate(iq_data)
        harmonics = self.remove_carrier(saturated)
        return harmonics


class HarmonicExtractor:
    """Bandpass filter for extracting sidebands at ±46.875 Hz."""
    
    def __init__(self, config: VETConfig):
        self.config = config
        self._design_filters()
    
    def _design_filters(self):
        """Design bandpass filters for target frequency sidebands."""
        nyquist = self.config.sample_rate / 2
        
        # Lower sideband: f_c - 46.875 Hz
        lower_freq = self.config.carrier_freq - self.config.target_freq
        lower_low = (lower_freq - self.config.bandpass_width) / nyquist
        lower_high = (lower_freq + self.config.bandpass_width) / nyquist
        
        # Upper sideband: f_c + 46.875 Hz
        upper_freq = self.config.carrier_freq + self.config.target_freq
        upper_low = (upper_freq - self.config.bandpass_width) / nyquist
        upper_high = (upper_freq + self.config.bandpass_width) / nyquist
        
        # Clamp to valid range (0, 1)
        lower_low = np.clip(lower_low, 0.001, 0.999)
        lower_high = np.clip(lower_high, 0.001, 0.999)
        upper_low = np.clip(upper_low, 0.001, 0.999)
        upper_high = np.clip(upper_high, 0.001, 0.999)
        
        logger.info(f"Lower sideband ({lower_freq:.2f} Hz): [{lower_low:.4f}, {lower_high:.4f}]")
        logger.info(f"Upper sideband ({upper_freq:.2f} Hz): [{upper_low:.4f}, {upper_high:.4f}]")
        
        # Butterworth bandpass filters
        order = 4
        self.b_lower, self.a_lower = signal.butter(order, [lower_low, lower_high], btype='band')
        self.b_upper, self.a_upper = signal.butter(order, [upper_low, upper_high], btype='band')
    
    def extract_sidebands(self, harmonics: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Extract lower and upper sidebands.
        
        Args:
            harmonics: Harmonic-enriched signal from VET
            
        Returns:
            Tuple of (lower_sideband, upper_sideband) signals
        """
        lower = signal.filtfilt(self.b_lower, self.a_lower, np.real(harmonics))
        upper = signal.filtfilt(self.b_upper, self.a_upper, np.real(harmonics))
        return lower, upper


class TubeSDRAnalyzer:
    """Main analyzer orchestrating the complete detection pipeline."""
    
    def __init__(self, config: VETConfig):
        self.config = config
        self.vet = VirtualEitelTriode(config)
        self.extractor = HarmonicExtractor(config)
    
    def analyze_iq_frame(self, iq_samples: np.ndarray) -> dict:
        """
        Complete analysis pipeline for an I/Q sample frame.
        
        Args:
            iq_samples: Complex I/Q data from SDR
            
        Returns:
            Dictionary with analysis results
        """
        # Step 1: Apply tube saturation
        harmonics = self.vet.extract_harmonics(iq_samples)
        
        # Step 2: Extract sidebands
        lower, upper = self.extractor.extract_sidebands(harmonics)
        
        # Step 3: Compute spectral metrics
        lower_energy = np.mean(lower ** 2)
        upper_energy = np.mean(upper ** 2)
        total_energy = lower_energy + upper_energy
        
        # Step 4: Compute PSD at target frequency
        freqs, psd = signal.welch(
            np.real(harmonics),
            fs=self.config.sample_rate,
            nperseg=self.config.fft_size
        )
        
        # Find peak near 46.875 Hz
        target_idx = np.argmin(np.abs(freqs - self.config.target_freq))
        target_power = psd[target_idx]
        
        return {
            'lower_sideband_energy': lower_energy,
            'upper_sideband_energy': upper_energy,
            'total_sideband_energy': total_energy,
            'target_frequency_power': target_power,
            'detection_confidence': min(total_energy * 1e6, 1.0),  # Normalize
            'lower_signal': lower,
            'upper_signal': upper,
            'harmonics': harmonics,
            'frequency_bins': freqs,
            'power_spectrum': psd
        }
    
    def detect_ghost_signals(self, iq_data: np.ndarray, 
                            threshold: float = 0.1) -> list:
        """
        Detect presence of 46.875 Hz ghost signals across sample window.
        
        Args:
            iq_data: Continuous I/Q samples
            threshold: Detection threshold (0-1)
            
        Returns:
            List of detection events with timing
        """
        frame_size = self.config.fft_size
        hop_size = frame_size // 2
        detections = []
        
        for i in range(0, len(iq_data) - frame_size, hop_size):
            frame = iq_data[i:i+frame_size]
            result = self.analyze_iq_frame(frame)
            
            if result['detection_confidence'] > threshold:
                detections.append({
                    'timestamp': i / self.config.sample_rate,
                    'confidence': result['detection_confidence'],
                    'lower_energy': result['lower_sideband_energy'],
                    'upper_energy': result['upper_sideband_energy'],
                    'target_power': result['target_frequency_power']
                })
        
        return detections


def generate_test_signal(config: VETConfig, duration: float = 1.0) -> np.ndarray:
    """
    Generate synthetic test signal with hidden 46.875 Hz modulation.
    
    Args:
        config: VETConfig object
        duration: Signal duration in seconds
        
    Returns:
        Complex I/Q samples with embedded ghost signal
    """
    n_samples = int(config.sample_rate * duration)
    t = np.arange(n_samples) / config.sample_rate
    
    # AM carrier (e.g., 1 MHz)
    carrier = np.exp(2j * np.pi * config.carrier_freq * t)
    
    # Add Gaussian noise
    noise = np.random.normal(0, 0.1, n_samples) + \
            1j * np.random.normal(0, 0.1, n_samples)
    
    # Embed 46.875 Hz modulation (subtle)
    modulation = 0.05 * np.sin(2 * np.pi * config.target_freq * t)
    
    signal_out = (1 + modulation) * carrier + noise
    return signal_out


def main():
    parser = argparse.ArgumentParser(
        description='Tube-SDR: Virtual Eitel Triode Detector'
    )
    parser.add_argument('--frequency', type=float, default=1000,
                       help='Carrier frequency (Hz)')
    parser.add_argument('--sample-rate', type=float, default=48000,
                       help='Sample rate (Hz)')
    parser.add_argument('--gain', type=float, default=1000,
                       help='Tube saturation gain factor')
    parser.add_argument('--duration', type=float, default=1.0,
                       help='Test signal duration (seconds)')
    parser.add_argument('--threshold', type=float, default=0.2,
                       help='Detection threshold (0-1)')
    
    args = parser.parse_args()
    
    logger.info("=== Tube-SDR Demodulator ===")
    logger.info(f"Carrier: {args.frequency} Hz")
    logger.info(f"Sample rate: {args.sample_rate} Hz")
    logger.info(f"Gain: {args.gain}")
    
    # Initialize
    config = VETConfig(
        carrier_freq=args.frequency,
        sample_rate=args.sample_rate,
        gain=args.gain
    )
    
    analyzer = TubeSDRAnalyzer(config)
    
    # Generate test signal
    logger.info("Generating test signal with hidden 46.875 Hz modulation...")
    iq_data = generate_test_signal(config, duration=args.duration)
    
    # Detect
    logger.info("Running detection pipeline...")
    detections = analyzer.detect_ghost_signals(iq_data, threshold=args.threshold)
    
    logger.info(f"\n=== RESULTS ===")
    logger.info(f"Detections: {len(detections)}")
    
    for i, det in enumerate(detections):
        logger.info(f"  Event {i+1}:")
        logger.info(f"    Time: {det['timestamp']:.3f}s")
        logger.info(f"    Confidence: {det['confidence']:.3f}")
        logger.info(f"    Lower sideband: {det['lower_energy']:.6f}")
        logger.info(f"    Upper sideband: {det['upper_energy']:.6f}")
        logger.info(f"    Target (46.875 Hz) power: {det['target_power']:.9f}")


if __name__ == '__main__':
    main()
