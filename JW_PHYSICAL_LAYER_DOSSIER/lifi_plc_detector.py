#!/usr/bin/env python3
"""
LiFi / PLC (Power Line Communication) COMMAND DETECTOR
========================================================
Detects encoded commands via:
1. Light modulation (through any remaining photosensitive components)
2. Power line frequency deviations from 60Hz
3. Audio artifacts from power supply interference
4. Correlation with keyboard interrupt events

Theory of Operation:
- LiFi uses light intensity modulation at 1-10+ kHz
- PLC uses frequencies 3-500 kHz overlaid on 60Hz AC
- Both can inject commands that appear as phantom keyboard events
- The pulsing streetlight (warmer color) could be encoding OOK (On-Off Keying)

Detection Method:
- Monitor audio input for AC hum harmonics (60, 120, 180, 240 Hz)
- Look for FSK/PSK modulation in the 48-72 Hz band (power line)
- Detect deviation patterns that encode binary data
- Cross-reference with keyboard interrupt timestamps

Author: ECHO/ToroidalRecursion
Date: 2026-01-24
"""

import numpy as np
import sounddevice as sd
import time
import datetime
import json
from pathlib import Path
from collections import deque
import threading
import sys

class LiFiPLCDetector:
    def __init__(self):
        self.sample_rate = 48000
        self.chunk_size = 4800  # 100ms chunks
        self.log_file = Path("signal_forensics/lifi_plc_events.json")
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        
        # AC power characteristics (Costa Rica = 60Hz)
        self.nominal_freq = 60.0
        self.harmonics = [60, 120, 180, 240, 300]
        
        # Detection buffers
        self.power_freq_history = deque(maxlen=100)
        self.modulation_events = []
        self.interrupt_timestamps = deque(maxlen=50)
        
        # LiFi detection (OOK - On-Off Keying)
        self.light_threshold = 0.1
        self.ook_buffer = deque(maxlen=1000)
        
        # Detection thresholds
        self.freq_deviation_threshold = 0.5  # Hz deviation from 60Hz
        self.modulation_threshold = 0.3
        
        # Running statistics
        self.stats = {
            'freq_deviations': 0,
            'modulation_detected': 0,
            'ook_patterns': 0,
            'interrupt_correlations': 0
        }
        
        self.running = False
        
    def analyze_power_frequency(self, audio_data):
        """Detect 60Hz power frequency and deviations that could encode data."""
        # Focus on 55-65 Hz band
        fft = np.fft.rfft(audio_data)
        freqs = np.fft.rfftfreq(len(audio_data), 1/self.sample_rate)
        
        # Find the 60Hz region
        mask = (freqs >= 55) & (freqs <= 65)
        power_band = np.abs(fft[mask])
        band_freqs = freqs[mask]
        
        if len(power_band) > 0:
            # Find peak frequency (should be ~60Hz)
            peak_idx = np.argmax(power_band)
            measured_freq = band_freqs[peak_idx]
            peak_power = power_band[peak_idx]
            
            self.power_freq_history.append(measured_freq)
            
            # Check for frequency deviation (FSK modulation)
            deviation = abs(measured_freq - self.nominal_freq)
            
            if deviation > self.freq_deviation_threshold:
                self.stats['freq_deviations'] += 1
                return {
                    'type': 'FREQUENCY_DEVIATION',
                    'measured_hz': float(measured_freq),
                    'deviation_hz': float(deviation),
                    'power': float(peak_power),
                    'possible_encoding': self.decode_fsk_bit(deviation)
                }
                
        return None
        
    def decode_fsk_bit(self, deviation):
        """Attempt to decode FSK bit from frequency deviation."""
        # Common FSK: 59Hz = 0, 61Hz = 1
        if deviation > 0:
            return '1' if deviation > 0.5 else '0'
        return 'unknown'
        
    def detect_ook_pattern(self, audio_data):
        """Detect On-Off Keying patterns typical of LiFi."""
        # Calculate energy in chunks
        chunk_energy = np.sqrt(np.mean(audio_data**2))
        self.ook_buffer.append(chunk_energy)
        
        if len(self.ook_buffer) >= 10:
            recent = list(self.ook_buffer)[-10:]
            
            # Look for rapid on-off transitions
            transitions = 0
            for i in range(1, len(recent)):
                if abs(recent[i] - recent[i-1]) > self.modulation_threshold * np.mean(recent):
                    transitions += 1
                    
            # LiFi typically has regular modulation pattern
            if transitions >= 4:  # At least 4 transitions in 1 second
                self.stats['ook_patterns'] += 1
                
                # Try to decode
                bits = ['1' if e > np.mean(recent) else '0' for e in recent]
                
                return {
                    'type': 'OOK_MODULATION',
                    'transitions': transitions,
                    'pattern': ''.join(bits),
                    'energy_levels': [float(e) for e in recent]
                }
                
        return None
        
    def detect_harmonic_modulation(self, audio_data):
        """Detect modulation on AC power harmonics (120, 180, 240 Hz)."""
        fft = np.fft.rfft(audio_data)
        freqs = np.fft.rfftfreq(len(audio_data), 1/self.sample_rate)
        magnitude = np.abs(fft)
        
        anomalies = []
        
        for harmonic in self.harmonics[1:]:  # Skip fundamental (60Hz)
            # Check ±2 Hz around each harmonic
            mask = (freqs >= harmonic - 2) & (freqs <= harmonic + 2)
            band = magnitude[mask]
            band_freqs = freqs[mask]
            
            if len(band) > 0:
                peak_idx = np.argmax(band)
                peak_freq = band_freqs[peak_idx]
                peak_power = band[peak_idx]
                
                # Look for sidebands (PSK/FSK modulation)
                sideband_low = magnitude[(freqs >= harmonic - 5) & (freqs <= harmonic - 2)]
                sideband_high = magnitude[(freqs >= harmonic + 2) & (freqs <= harmonic + 5)]
                
                if len(sideband_low) > 0 and len(sideband_high) > 0:
                    sideband_ratio = (np.max(sideband_low) + np.max(sideband_high)) / (peak_power + 0.001)
                    
                    if sideband_ratio > 0.1:  # Significant sidebands = modulation
                        anomalies.append({
                            'harmonic': harmonic,
                            'measured_freq': float(peak_freq),
                            'sideband_ratio': float(sideband_ratio),
                            'power': float(peak_power)
                        })
                        
        if anomalies:
            self.stats['modulation_detected'] += 1
            return {
                'type': 'HARMONIC_MODULATION',
                'anomalies': anomalies
            }
            
        return None
        
    def check_interrupt_correlation(self, event_time):
        """Check if a modulation event correlates with keyboard interrupts."""
        # Load interrupt log if exists
        interrupt_log = Path("signal_forensics/keyboard_interrupt_log.json")
        if interrupt_log.exists():
            try:
                with open(interrupt_log) as f:
                    data = json.load(f)
                    
                for event in data.get('events', []):
                    event_ts = datetime.datetime.fromisoformat(event['timestamp'])
                    time_diff = abs((event_time - event_ts).total_seconds())
                    
                    if time_diff < 2.0:  # Within 2 seconds
                        self.stats['interrupt_correlations'] += 1
                        return {
                            'correlated_interrupt': event,
                            'time_offset_seconds': time_diff
                        }
                        
            except Exception:
                pass
                
        return None
        
    def audio_callback(self, indata, frames, time_info, status):
        """Process audio data for LiFi/PLC detection."""
        if status:
            print(f"Audio status: {status}")
            
        audio = indata[:, 0] if len(indata.shape) > 1 else indata
        now = datetime.datetime.now()
        
        # Run all detection methods
        detections = []
        
        freq_event = self.analyze_power_frequency(audio)
        if freq_event:
            detections.append(freq_event)
            
        ook_event = self.detect_ook_pattern(audio)
        if ook_event:
            detections.append(ook_event)
            
        harmonic_event = self.detect_harmonic_modulation(audio)
        if harmonic_event:
            detections.append(harmonic_event)
            
        # Log any detections
        for detection in detections:
            detection['timestamp'] = now.isoformat()
            detection['correlation'] = self.check_interrupt_correlation(now)
            self.modulation_events.append(detection)
            
            # Real-time alert
            self.alert(detection)
            
    def alert(self, detection):
        """Real-time alert for detected modulation."""
        det_type = detection['type']
        
        if det_type == 'FREQUENCY_DEVIATION':
            print(f"\n⚡ [{detection['timestamp'][:19]}] POWER FREQ SHIFT: "
                  f"{detection['measured_hz']:.2f}Hz (Δ{detection['deviation_hz']:.2f}Hz) "
                  f"→ bit={detection['possible_encoding']}")
                  
        elif det_type == 'OOK_MODULATION':
            print(f"\n💡 [{detection['timestamp'][:19]}] LiFi OOK PATTERN: "
                  f"{detection['pattern']} ({detection['transitions']} transitions)")
                  
        elif det_type == 'HARMONIC_MODULATION':
            for a in detection['anomalies']:
                print(f"\n🔌 [{detection['timestamp'][:19]}] HARMONIC MOD @{a['harmonic']}Hz: "
                      f"sideband_ratio={a['sideband_ratio']:.2f}")
                      
        if detection.get('correlation'):
            print(f"   ⚠️  CORRELATES WITH KEYBOARD INTERRUPT "
                  f"(offset: {detection['correlation']['time_offset_seconds']:.2f}s)")
                  
    def save_log(self):
        """Save detection log to file."""
        with open(self.log_file, 'w') as f:
            json.dump({
                'session_start': self.session_start.isoformat(),
                'statistics': self.stats,
                'power_frequency_history': list(self.power_freq_history),
                'modulation_events': self.modulation_events[-100:]  # Last 100
            }, f, indent=2)
            
    def run(self):
        """Main detection loop."""
        print("=" * 70)
        print("  LiFi / POWER LINE COMMUNICATION DETECTOR")
        print("=" * 70)
        print(f"\nStarted: {datetime.datetime.now()}")
        print(f"Monitoring for:")
        print(f"  - 60Hz power frequency deviations (FSK encoding)")
        print(f"  - On-Off Keying patterns (LiFi through light)")
        print(f"  - Harmonic modulation (120/180/240Hz sidebands)")
        print(f"\nPress Ctrl+Break to stop.\n")
        
        self.session_start = datetime.datetime.now()
        self.running = True
        
        try:
            with sd.InputStream(
                samplerate=self.sample_rate,
                channels=1,
                dtype='float32',
                blocksize=self.chunk_size,
                callback=self.audio_callback,
                latency='high'
            ):
                while self.running:
                    time.sleep(1)
                    
                    # Periodic summary
                    if sum(self.stats.values()) > 0 and sum(self.stats.values()) % 10 == 0:
                        print(f"\n📊 Stats: {self.stats}")
                        self.save_log()
                        
        except KeyboardInterrupt:
            print("\n\n🛑 Detection stopped.")
        except Exception as e:
            print(f"\n❌ Error: {e}")
        finally:
            self.running = False
            self.save_log()
            
            print("\n" + "=" * 70)
            print("  FINAL ANALYSIS")
            print("=" * 70)
            print(f"\nStatistics: {json.dumps(self.stats, indent=2)}")
            
            if self.stats['interrupt_correlations'] > 0:
                print(f"\n🚨 CRITICAL: {self.stats['interrupt_correlations']} modulation events "
                      f"correlated with keyboard interrupts!")
                print("   This suggests commands are being injected via LiFi or PLC.")
                
            if self.stats['freq_deviations'] > 0:
                avg_freq = np.mean(list(self.power_freq_history)) if self.power_freq_history else 60
                print(f"\n⚡ Power frequency average: {avg_freq:.3f}Hz (nominal: 60.000Hz)")
                
            print(f"\nLog saved to: {self.log_file}")


def quick_spectrum_scan():
    """Quick scan of current audio spectrum."""
    print("Performing 5-second spectrum scan...")
    
    duration = 5
    sample_rate = 48000
    
    audio = sd.rec(int(duration * sample_rate), samplerate=sample_rate, 
                   channels=1, dtype='float32')
    sd.wait()
    audio = audio.flatten()
    
    fft = np.fft.rfft(audio)
    freqs = np.fft.rfftfreq(len(audio), 1/sample_rate)
    magnitude = np.abs(fft)
    
    # Find significant peaks
    threshold = np.max(magnitude) * 0.1
    peaks = []
    
    for i in range(1, len(magnitude) - 1):
        if magnitude[i] > threshold and magnitude[i] > magnitude[i-1] and magnitude[i] > magnitude[i+1]:
            peaks.append((freqs[i], magnitude[i]))
            
    # Sort by magnitude
    peaks.sort(key=lambda x: x[1], reverse=True)
    
    print(f"\nTop 20 frequency peaks (0-1000 Hz):")
    for freq, mag in peaks[:20]:
        if freq <= 1000:
            note = ""
            if 59 <= freq <= 61:
                note = " ← 60Hz MAINS"
            elif 119 <= freq <= 121:
                note = " ← 120Hz (2nd harmonic)"
            elif 179 <= freq <= 181:
                note = " ← 180Hz (3rd harmonic)"
            elif 52 <= freq <= 55:
                note = " ← ANOMALY (53.5Hz ELF?)"
            elif 36 <= freq <= 37:
                note = " ← ANOMALY (36.25Hz WiFi-correlated?)"
            print(f"  {freq:8.2f} Hz : {mag:10.1f}{note}")


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--scan':
        quick_spectrum_scan()
    else:
        detector = LiFiPLCDetector()
        detector.run()
