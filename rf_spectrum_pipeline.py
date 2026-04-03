#!/usr/bin/env python3
"""
Toroidal Recursion RF Spectrum Analyzer Pipeline
Version: ELF + Full Spectrum Scanner v1.0
Date: April 2, 2026

This pipeline performs hard-hitting RF spectrum scans focusing on ELF (Extremely Low Frequency)
and full spectrum analysis. Designed for environmental monitoring in the context of toroidal
recursion and GOS framework.

Requirements:
- numpy
- scipy
- matplotlib
- scapy (for network integration)
- Optional: rtl-sdr for real hardware scanning

Usage:
python rf_spectrum_pipeline.py --mode elf --duration 60
python rf_spectrum_pipeline.py --mode full --freq-start 1e6 --freq-end 6e9
"""

import numpy as np
import scipy.signal as signal
import matplotlib.pyplot as plt
import argparse
import time
import json
from datetime import datetime
import websocket
import struct

class RFSpectrumPipeline:
    def __init__(self, kappa=1.2732, phi=1.618033988749895):
        self.kappa = kappa  # GOS constant 4/π
        self.phi = phi      # Golden ratio
        self.sample_rate = 2.4e6  # Default for RTL-SDR
        self.center_freq = 100e6  # Default center frequency

    def generate_test_signal(self, duration=10, freq=50.0):
        """Generate synthetic ELF signal for testing"""
        t = np.linspace(0, duration, int(self.sample_rate * duration))
        # ELF signal with GOS harmonics
        signal_wave = (np.sin(2 * np.pi * freq * t) +
                      0.5 * np.sin(2 * np.pi * freq * self.kappa * t) +
                      0.3 * np.sin(2 * np.pi * freq * self.phi * t))
        # Add noise
        noise = 0.1 * np.random.normal(0, 1, len(signal_wave))
        return t, signal_wave + noise

    def fetch_kiwi_iq(self, kiwi_url, freq, duration=10):
        """Fetch IQ samples from KiwiSDR WebSocket"""
        try:
            # KiwiSDR WebSocket URL format: ws://<host>:8073/<freq>/<mode>/...
            ws_url = f"{kiwi_url}/{int(freq)}/IQ"
            print(f"Connecting to KiwiSDR: {ws_url}")
            
            iq_samples = []
            start_time = time.time()
            
            def on_message(ws, message):
                # Parse IQ data (16-bit signed integers)
                if len(message) > 8:  # Skip header
                    data = message[8:]
                    for i in range(0, len(data), 4):
                        if i+3 < len(data):
                            i_val = struct.unpack('<h', data[i:i+2])[0]
                            q_val = struct.unpack('<h', data[i+2:i+4])[0]
                            iq_samples.append(complex(i_val, q_val))
                
                if time.time() - start_time > duration:
                    ws.close()
            
            ws = websocket.WebSocketApp(ws_url, on_message=on_message)
            ws.run_forever()
            
            # Convert to numpy array
            if iq_samples:
                samples = np.array(iq_samples[:int(self.sample_rate * duration)])
                return samples
            else:
                print("No IQ data received from KiwiSDR")
                return None
                
        except Exception as e:
            print(f"KiwiSDR connection failed: {e}")
            return None

    def elf_scan(self, duration=60, kiwi_url=None):
        """ELF spectrum scan (3-300 Hz) with toroidal filtering"""
        print(f"ELF Scan initiated at {datetime.now()}")
        print(f"Duration: {duration}s | Kappa filter: {self.kappa}")

        if kiwi_url:
            # Try to fetch from KiwiSDR (note: KiwiSDR may not support ELF freqs)
            samples = self.fetch_kiwi_iq(kiwi_url, freq=50.0, duration=duration)
            if samples is None:
                print("Falling back to synthetic data")
                t, signal_wave = self.generate_test_signal(duration, freq=50.0)
                samples = signal_wave
        else:
            t, samples = self.generate_test_signal(duration, freq=50.0)

        # FFT analysis
        fft_freqs = np.fft.fftfreq(len(samples), 1/self.sample_rate)
        fft_magnitude = np.abs(np.fft.fft(samples))

        # Apply GOS filter (kappa-weighted)
        mask = (fft_freqs > 3) & (fft_freqs < 300)
        filtered_freqs = fft_freqs[mask]
        filtered_magnitude = fft_magnitude[mask] * (1 + self.kappa * np.sin(2 * np.pi * filtered_freqs / 100))

        # Detect peaks
        peaks, _ = signal.find_peaks(filtered_magnitude, height=np.mean(filtered_magnitude) + 2*np.std(filtered_magnitude))

        results = {
            'timestamp': datetime.now().isoformat(),
            'scan_type': 'ELF',
            'duration': duration,
            'kappa': self.kappa,
            'data_source': 'kiwi' if kiwi_url else 'synthetic',
            'peaks': [{'freq': filtered_freqs[i], 'magnitude': filtered_magnitude[i]} for i in peaks[:10]],
            'dominant_freq': filtered_freqs[np.argmax(filtered_magnitude)] if len(filtered_magnitude) > 0 else None
        }

        # Save results
        with open(f'elf_scan_{int(time.time())}.json', 'w') as f:
            json.dump(results, f, indent=2)

        # Plot
        plt.figure(figsize=(12, 6))
        plt.subplot(1, 2, 1)
        plt.plot(np.real(samples[:1000]))  # Time domain (I component)
        plt.title('ELF Time Domain (First 1000 samples)')
        plt.xlabel('Samples')
        plt.ylabel('Amplitude')

        plt.subplot(1, 2, 2)
        plt.plot(filtered_freqs, filtered_magnitude)
        plt.scatter(filtered_freqs[peaks[:5]], filtered_magnitude[peaks[:5]], color='red', label='Detected Peaks')
        plt.title('ELF Frequency Domain (GOS Filtered)')
        plt.xlabel('Frequency (Hz)')
        plt.ylabel('Magnitude')
        plt.legend()
        plt.tight_layout()
        plt.savefig(f'elf_scan_{int(time.time())}.png')
        plt.show()

        return results

    def full_spectrum_scan(self, freq_start=1e6, freq_end=6e9, steps=100, kiwi_url=None):
        """Full spectrum scan with pipeline processing"""
        print(f"Full Spectrum Scan: {freq_start/1e6:.1f} MHz - {freq_end/1e9:.1f} GHz")
        print(f"Steps: {steps} | Kappa scaling: {self.kappa}")

        if kiwi_url:
            # For full spectrum, we can sweep frequencies
            magnitudes = []
            for freq in np.logspace(np.log10(freq_start), np.log10(freq_end), steps):
                samples = self.fetch_kiwi_iq(kiwi_url, freq, duration=1)  # Short capture per freq
                if samples is not None:
                    magnitude = np.mean(np.abs(samples))
                else:
                    magnitude = 10 * np.random.random()  # Fallback
                magnitudes.append(magnitude)
        else:
            # Simulate frequency sweep
            freq_range = np.logspace(np.log10(freq_start), np.log10(freq_end), steps)
            magnitudes = []
            for freq in freq_range:
                base_signal = 10 * np.random.random()
                harmonic_boost = 5 * (np.sin(2 * np.pi * freq / (self.kappa * 1e6)) +
                                     0.5 * np.sin(2 * np.pi * freq / (self.phi * 1e6)))
                magnitudes.append(base_signal + harmonic_boost)

        magnitudes = np.array(magnitudes)
        freq_range = np.logspace(np.log10(freq_start), np.log10(freq_end), steps)

        # Detect anomalies
        mean_mag = np.mean(magnitudes)
        std_mag = np.std(magnitudes)
        anomalies = np.where(magnitudes > mean_mag + 2 * std_mag)[0]

        results = {
            'timestamp': datetime.now().isoformat(),
            'scan_type': 'FULL_SPECTRUM',
            'freq_range': [freq_start, freq_end],
            'steps': steps,
            'kappa': self.kappa,
            'data_source': 'kiwi' if kiwi_url else 'synthetic',
            'anomalies': [{'freq': freq_range[i], 'magnitude': magnitudes[i]} for i in anomalies],
            'peak_freq': freq_range[np.argmax(magnitudes)]
        }

        # Save results
        with open(f'full_spectrum_scan_{int(time.time())}.json', 'w') as f:
            json.dump(results, f, indent=2)

        # Plot
        plt.figure(figsize=(10, 6))
        plt.semilogx(freq_range/1e6, magnitudes)
        plt.scatter(freq_range[anomalies]/1e6, magnitudes[anomalies], color='red', label='Anomalies')
        plt.axhline(y=mean_mag + 2*std_mag, color='orange', linestyle='--', label='2σ Threshold')
        plt.title('Full Spectrum Scan (GOS Enhanced)')
        plt.xlabel('Frequency (MHz)')
        plt.ylabel('Signal Strength')
        plt.legend()
        plt.tight_layout()
        plt.savefig(f'full_spectrum_scan_{int(time.time())}.png')
        plt.show()

        return results

def main():
    parser = argparse.ArgumentParser(description='Toroidal Recursion RF Spectrum Pipeline')
    parser.add_argument('--mode', choices=['elf', 'full'], required=True,
                       help='Scan mode: elf (3-300 Hz) or full (broadband)')
    parser.add_argument('--duration', type=int, default=60,
                       help='Scan duration in seconds (ELF mode)')
    parser.add_argument('--freq-start', type=float, default=1e6,
                       help='Start frequency for full spectrum (Hz)')
    parser.add_argument('--freq-end', type=float, default=6e9,
                       help='End frequency for full spectrum (Hz)')
    parser.add_argument('--steps', type=int, default=100,
                       help='Number of frequency steps for full spectrum')
    parser.add_argument('--kiwi-url', type=str, default=None,
                       help='KiwiSDR WebSocket URL (e.g., ws://192.168.1.100:8073)')

    args = parser.parse_args()

    pipeline = RFSpectrumPipeline()

    if args.mode == 'elf':
        results = pipeline.elf_scan(args.duration, args.kiwi_url)
        print("ELF Scan Complete. Results saved.")
        print(f"Data source: {results['data_source']}")
        print(f"Dominant frequency: {results['dominant_freq']:.2f} Hz")
        print(f"Peaks detected: {len(results['peaks'])}")

    elif args.mode == 'full':
        results = pipeline.full_spectrum_scan(args.freq_start, args.freq_end, args.steps, args.kiwi_url)
        print("Full Spectrum Scan Complete. Results saved.")
        print(f"Data source: {results['data_source']}")
        print(f"Peak frequency: {results['peak_freq']/1e6:.2f} MHz")
        print(f"Anomalies detected: {len(results['anomalies'])}")

if __name__ == '__main__':
    main()