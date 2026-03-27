#!/usr/bin/env python3
"""
Marconi Spark Correlator: Damped Wave Detector
===============================================

Detects "spark-like" RF pulses buried in noise using Marconi's historical
coherer principle. Modern equivalent: stacking/folding spectral data over
21.333 ms windows (the period of 46.875 Hz).

Deploy alongside Tube-SDR for enhanced detection of coherent pulse trains
hidden beneath wideband noise.

Usage:
    python marconi_spark_correlator.py --input iq_data.npy --period 21.333
"""

import numpy as np
import scipy.signal as signal
from dataclasses import dataclass
from typing import Tuple, List, Dict, Optional
import argparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class CoherenConfig:
    """Marconi Coherence Detector configuration."""
    sample_rate: float = 48000.0  # Standard audio/SDR sample rate
    target_freq: float = 46.875  # Heartbeat frequency (Hz)
    period_ms: float = 21.333  # Period: 1 / 46.875 Hz in milliseconds
    fft_size: int = 4096
    num_stacks: int = 100  # Number of periods to accumulate
    coherence_threshold: float = 0.5  # Min correlation for detection


class MarconiCoherer:
    """
    Modern digital equivalent of Marconi's coherer receiver.
    
    Principle: Stack (fold and integrate) spectrum over multiple identical
    time windows. Random noise averages to zero; coherent signals accumulate
    constructively.
    """
    
    def __init__(self, config: CoherenConfig):
        self.config = config
        self.period_samples = int((config.period_ms / 1000.0) * config.sample_rate)
        logger.info(f"Coherence period: {config.period_ms:.3f} ms = {self.period_samples} samples")
    
    def boxcar_average(self, signal_data: np.ndarray,
                      num_periods: int) -> np.ndarray:
        """
        Stack (fold) signal over N coherence periods.
        
        If signal contains a pulse at exactly period T:
          - Coherent component aligns perfectly → constructive interference
          - Random noise adds incoherently → averages to ~0
        
        Args:
            signal_data: Time-domain signal
            num_periods: Number of periods to stack
            
        Returns:
            Averaged waveform showing coherent pulse train
        """
        n_samples_needed = num_periods * self.period_samples
        
        if len(signal_data) < n_samples_needed:
            logger.warning(f"Signal length {len(signal_data)} < required {n_samples_needed}")
            num_periods = len(signal_data) // self.period_samples
        
        # Reshape into matrix: [num_periods, period_samples]
        trimmed = signal_data[:num_periods * self.period_samples]
        matrix = trimmed.reshape((num_periods, self.period_samples))
        
        # Average across periods (coherent components survive)
        averaged = np.mean(matrix, axis=0)
        
        return averaged, matrix
    
    def detect_damped_waves(self, signal_data: np.ndarray) -> Dict:
        """
        Detect damped wave signatures (spark-like bursts).
        
        A damped wave: sharp rise + exponential decay
        Repetition: exactly one per heartbeat period (21.333 ms)
        
        Args:
            signal_data: Time-domain signal
            
        Returns:
            Detection dictionary with metrics
        """
        # Step 1: Boxcar averaging
        averaged, matrix = self.boxcar_average(
            signal_data,
            self.config.num_stacks
        )
        
        # Step 2: Compute coherence metrics
        # Coherence = (stacked energy) / (expected noise energy)
        noise_floor = np.median(np.abs(matrix))
        peak_amplitude = np.max(np.abs(averaged))
        coherence = peak_amplitude / (noise_floor + 1e-12)
        
        # Step 3: Detect damping signature
        # Find energy decay slope
        smoothed = signal.savgol_filter(averaged, 51, 3)
        decay_rate = np.polyfit(np.arange(len(smoothed)), smoothed, 1)[0]
        
        # Step 4: Find pulse edges (rise/fall times)
        threshold = noise_floor + (peak_amplitude - noise_floor) * 0.5
        crossings = np.where(np.diff(np.sign(averaged - threshold)))[0]
        
        if len(crossings) >= 2:
            pulse_width = (crossings[-1] - crossings[0]) / self.config.sample_rate * 1000
        else:
            pulse_width = 0
        
        return {
            'averaged_waveform': averaged,
            'stacked_matrix': matrix,
            'peak_amplitude': float(peak_amplitude),
            'noise_floor': float(noise_floor),
            'coherence': float(coherence),
            'decay_rate': float(decay_rate),
            'pulse_width_ms': float(pulse_width),
            'detection': coherence > self.config.coherence_threshold
        }
    
    def frequency_domain_stack(self, signal_data: np.ndarray) -> Dict:
        """
        Alternative: Stacking in frequency domain (PSD).
        
        Reveals harmonic structure of the pulse train.
        
        Args:
            signal_data: Time-domain signal
            
        Returns:
            Frequency-domain detection metrics
        """
        # Compute PSD in chunks
        psd_stack = []
        
        for i in range(self.config.num_stacks):
            start = i * self.period_samples
            end = start + self.period_samples
            
            if end > len(signal_data):
                break
            
            chunk = signal_data[start:end]
            freqs, psd = signal.welch(chunk, fs=self.config.sample_rate,
                                     nperseg=self.config.fft_size)
            psd_stack.append(psd)
        
        psd_stack = np.array(psd_stack)
        psd_mean = np.mean(psd_stack, axis=0)
        psd_std = np.std(psd_stack, axis=0)
        
        # Find harmonics of 46.875 Hz
        harmonics = []
        for n in range(1, 20):
            harmonic_freq = n * self.config.target_freq
            if harmonic_freq > self.config.sample_rate / 2:
                break
            
            harmonic_idx = np.argmin(np.abs(freqs - harmonic_freq))
            power = psd_mean[harmonic_idx]
            snr = power / (psd_std[harmonic_idx] + 1e-12)
            
            harmonics.append({
                'order': n,
                'frequency': float(harmonic_freq),
                'power': float(power),
                'snr': float(snr)
            })
        
        return {
            'frequencies': freqs,
            'mean_psd': psd_mean,
            'std_psd': psd_std,
            'harmonics': harmonics
        }


class PulseTrainAnalyzer:
    """High-level analyzer for complete RF pulse train forensics."""
    
    def __init__(self, config: CoherenConfig):
        self.config = config
        self.coherer = MarconiCoherer(config)
    
    def analyze_waveform(self, signal_data: np.ndarray) -> Dict:
        """
        Complete waveform analysis pipeline.
        
        Args:
            signal_data: Raw signal (I or Q channel)
            
        Returns:
            Comprehensive analysis dictionary
        """
        # Time-domain analysis
        time_result = self.coherer.detect_damped_waves(signal_data)
        
        # Frequency-domain analysis
        freq_result = self.coherer.frequency_domain_stack(signal_data)
        
        # Combined assessment
        detection = time_result['detection'] or \
                   any(h['snr'] > 3.0 for h in freq_result['harmonics'])
        
        return {
            'time_domain': time_result,
            'frequency_domain': freq_result,
            'overall_detection': detection,
            'confidence': min(
                (time_result['coherence'] + 
                 np.mean([h['snr'] for h in freq_result['harmonics']])) / 2,
                1.0
            )
        }
    
    def report(self, analysis: Dict):
        """Pretty-print analysis results."""
        logger.info("\n=== MARCONI SPARK CORRELATOR REPORT ===\n")
        
        time_d = analysis['time_domain']
        logger.info("TIME-DOMAIN ANALYSIS:")
        logger.info(f"  Peak Amplitude: {time_d['peak_amplitude']:.6f}")
        logger.info(f"  Noise Floor: {time_d['noise_floor']:.6f}")
        logger.info(f"  Coherence Score: {time_d['coherence']:.3f}")
        logger.info(f"  Decay Rate: {time_d['decay_rate']:.6f}")
        logger.info(f"  Pulse Width: {time_d['pulse_width_ms']:.3f} ms")
        
        freq_d = analysis['frequency_domain']
        harmonics = freq_d['harmonics']
        
        logger.info("\nFREQUENCY-DOMAIN HARMONICS (46.875 Hz series):")
        for h in harmonics[:5]:  # Show first 5
            logger.info(f"  f{h['order']} ({h['frequency']:.2f} Hz): "
                       f"Power={h['power']:.6f}, SNR={h['snr']:.2f}dB")
        
        logger.info(f"\nOVERALL DETECTION: {'YES' if analysis['overall_detection'] else 'NO'}")
        logger.info(f"Confidence: {analysis['confidence']:.1%}")


def generate_spark_train(config: CoherenConfig, 
                         duration: float = 1.0) -> np.ndarray:
    """
    Generate synthetic spark-like pulse train at 46.875 Hz repetition.
    
    Args:
        config: CoherenConfig
        duration: Signal duration (seconds)
        
    Returns:
        Complex pulse train signal
    """
    n_samples = int(config.sample_rate * duration)
    t = np.arange(n_samples) / config.sample_rate
    signal_out = np.zeros(n_samples)
    
    # Damped wave generator
    period_samples = config.period_samples
    num_pulses = n_samples // period_samples
    decay_tau = period_samples * 0.3  # Decay time constant
    
    for pulse_idx in range(num_pulses):
        pulse_start = pulse_idx * period_samples
        pulse_end = pulse_start + period_samples
        
        if pulse_end > n_samples:
            break
        
        # Damped sinusoid: e^(-t/tau) * sin(2*pi*f*t)
        pulse_t = np.arange(period_samples) / config.sample_rate
        damping = np.exp(-pulse_t * config.sample_rate / decay_tau)
        oscillation = np.sin(2 * np.pi * 100 * pulse_t)  # 100 Hz carrier
        
        pulse = 0.1 * damping * oscillation
        signal_out[pulse_start:pulse_end] += pulse
    
    # Add noise
    noise = np.random.normal(0, 0.02, n_samples)
    signal_out += noise
    
    return signal_out


def main():
    parser = argparse.ArgumentParser(
        description='Marconi Spark Correlator: Damped Wave Detector'
    )
    parser.add_argument('--sample-rate', type=float, default=48000,
                       help='Sample rate (Hz)')
    parser.add_argument('--period', type=float, default=21.333,
                       help='Heartbeat period (ms)')
    parser.add_argument('--duration', type=float, default=2.0,
                       help='Test signal duration (seconds)')
    parser.add_argument('--num-stacks', type=int, default=100,
                       help='Number of periods to stack')
    parser.add_argument('--threshold', type=float, default=0.5,
                       help='Coherence detection threshold')
    
    args = parser.parse_args()
    
    logger.info("=== Marconi Spark Correlator ===")
    logger.info(f"Sample rate: {args.sample_rate} Hz")
    logger.info(f"Heartbeat period: {args.period} ms")
    
    config = CoherenConfig(
        sample_rate=args.sample_rate,
        period_ms=args.period,
        num_stacks=args.num_stacks,
        coherence_threshold=args.threshold
    )
    
    analyzer = PulseTrainAnalyzer(config)
    
    # Generate synthetic pulse train
    logger.info(f"Generating {args.duration}s synthetic spark train...")
    test_signal = generate_spark_train(config, duration=args.duration)
    
    # Analyze
    logger.info("Running Marconi coherence detection...")
    analysis = analyzer.analyze_waveform(test_signal)
    
    # Report
    analyzer.report(analysis)


if __name__ == '__main__':
    main()
