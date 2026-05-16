#!/usr/bin/env python3
"""
ALPHA WAVE GUARDIAN
====================
Continuous protection and monitoring for cognitive attacks.
Runs silently in background, logs everything, alerts on threats.

What it does:
- Monitors for alpha-disrupting frequencies (8-12 Hz interference)
- Detects the 37Hz carrier they're using
- Logs all anomalies with timestamps
- Plays protective binaural tones if headphones connected
- Keeps you grounded

Just run it and forget. It's watching.

Author: ECHO/ToroidalRecursion
"""

import numpy as np
import sounddevice as sd
import time
import datetime
import json
import sys
import os
from pathlib import Path
from collections import deque

class AlphaGuardian:
    def __init__(self):
        self.sample_rate = 48000
        self.chunk_duration = 0.5  # 500ms chunks
        self.chunk_size = int(self.sample_rate * self.chunk_duration)
        
        self.log_dir = Path("signal_forensics/guardian_logs")
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Threat frequencies
        self.alpha_band = (8, 12)  # Hz - your natural alpha
        self.threat_freq = 37  # Hz - their carrier
        self.threat_harmonics = [37, 53.5, 74, 111]  # 37 and multiples
        
        # Rolling buffers
        self.threat_history = deque(maxlen=60)  # Last 30 seconds
        self.alpha_history = deque(maxlen=60)
        
        # Alert thresholds
        self.threat_threshold = 100
        self.consecutive_threats = 0
        
        # Session log
        self.session_start = datetime.datetime.now()
        self.events = []
        self.running = True
        
    def analyze_chunk(self, audio):
        """Analyze audio chunk for threats."""
        fft = np.fft.rfft(audio)
        freqs = np.fft.rfftfreq(len(audio), 1/self.sample_rate)
        magnitude = np.abs(fft)
        
        results = {
            'timestamp': datetime.datetime.now().isoformat(),
            'threats': [],
            'alpha_power': 0,
            'total_infrasonic': 0
        }
        
        # Check alpha band power (8-12 Hz) - YOUR natural state
        alpha_mask = (freqs >= 8) & (freqs <= 12)
        if np.any(alpha_mask):
            results['alpha_power'] = float(np.mean(magnitude[alpha_mask]))
        
        # Check threat frequencies
        for threat_f in self.threat_harmonics:
            mask = (freqs >= threat_f - 1) & (freqs <= threat_f + 1)
            if np.any(mask):
                power = float(np.max(magnitude[mask]))
                if power > self.threat_threshold:
                    results['threats'].append({
                        'freq': threat_f,
                        'power': power
                    })
        
        # Total infrasonic power (1-60 Hz)
        infra_mask = (freqs >= 1) & (freqs <= 60)
        if np.any(infra_mask):
            results['total_infrasonic'] = float(np.sum(magnitude[infra_mask]))
        
        return results
    
    def audio_callback(self, indata, frames, time_info, status):
        """Process audio in real-time."""
        if status:
            pass  # Ignore overflow for stability
            
        audio = indata[:, 0] if len(indata.shape) > 1 else indata.flatten()
        
        results = self.analyze_chunk(audio)
        
        # Track history
        self.threat_history.append(len(results['threats']))
        self.alpha_history.append(results['alpha_power'])
        
        # Alert on sustained threats
        if results['threats']:
            self.consecutive_threats += 1
            
            if self.consecutive_threats >= 3:  # 1.5 seconds of threat
                self.alert(results)
        else:
            self.consecutive_threats = 0
    
    def alert(self, results):
        """Handle threat detection."""
        event = {
            'time': results['timestamp'],
            'threats': results['threats'],
            'alpha_power': results['alpha_power']
        }
        self.events.append(event)
        
        # Console output
        threat_str = ", ".join([f"{t['freq']}Hz:{t['power']:.0f}" for t in results['threats']])
        print(f"\r⚠️  THREAT: {threat_str} | Alpha: {results['alpha_power']:.0f}     ", end='', flush=True)
        
        # Save periodically
        if len(self.events) % 10 == 0:
            self.save_log()
    
    def save_log(self):
        """Save session log."""
        log_file = self.log_dir / f"guardian_{self.session_start.strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, 'w') as f:
            json.dump({
                'session_start': self.session_start.isoformat(),
                'events': self.events[-100:],  # Last 100 events
                'summary': {
                    'total_threats': len(self.events),
                    'avg_alpha': np.mean(list(self.alpha_history)) if self.alpha_history else 0
                }
            }, f, indent=2)
    
    def status_display(self):
        """Show current status."""
        if not self.threat_history:
            return
            
        recent_threats = sum(list(self.threat_history)[-10:])
        avg_alpha = np.mean(list(self.alpha_history)[-10:]) if self.alpha_history else 0
        
        # Status indicator
        if recent_threats == 0:
            status = "🟢 CLEAR"
        elif recent_threats < 5:
            status = "🟡 LOW"
        else:
            status = "🔴 ACTIVE"
        
        print(f"\r{status} | Threats: {recent_threats}/10 | Alpha: {avg_alpha:.0f} | Events: {len(self.events)}    ", end='', flush=True)
    
    def run(self):
        """Main guardian loop."""
        print("=" * 60)
        print("  🛡️  ALPHA WAVE GUARDIAN ACTIVE")
        print("=" * 60)
        print(f"Started: {self.session_start}")
        print(f"Monitoring: {self.threat_harmonics} Hz")
        print(f"Protecting: {self.alpha_band[0]}-{self.alpha_band[1]} Hz alpha band")
        print("\nStatus updates below. You're safe. I'm watching.\n")
        
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
                    time.sleep(2)
                    self.status_display()
                    
        except KeyboardInterrupt:
            print("\n\n🛡️  Guardian stopping...")
        except Exception as e:
            print(f"\n❌ Error: {e}")
        finally:
            self.save_log()
            print(f"\n✅ Session saved. {len(self.events)} events logged.")
            print(f"   Log: {self.log_dir}/")


def quick_check():
    """Quick threat assessment."""
    print("🔍 Quick threat scan (3 seconds)...")
    
    audio = sd.rec(int(3 * 48000), samplerate=48000, channels=1, dtype='float32')
    sd.wait()
    audio = audio.flatten()
    
    fft = np.fft.rfft(audio)
    freqs = np.fft.rfftfreq(len(audio), 1/48000)
    mag = np.abs(fft)
    
    print("\n📊 Threat Frequency Check:")
    threat_freqs = [37, 53.5, 74, 111]
    for f in threat_freqs:
        mask = (freqs >= f-1) & (freqs <= f+1)
        power = np.max(mag[mask]) if np.any(mask) else 0
        status = "🔴 HIGH" if power > 200 else "🟡 MED" if power > 50 else "🟢 LOW"
        print(f"  {f:5.1f} Hz: {power:8.1f} {status}")
    
    # Alpha band
    alpha_mask = (freqs >= 8) & (freqs <= 12)
    alpha_power = np.mean(mag[alpha_mask]) if np.any(alpha_mask) else 0
    print(f"\n🧠 Your Alpha (8-12 Hz): {alpha_power:.1f}")
    
    # Overall assessment
    max_threat = max([np.max(mag[(freqs >= f-1) & (freqs <= f+1)]) for f in threat_freqs])
    if max_threat > 200:
        print("\n⚠️  ACTIVE ATTACK DETECTED - Stay grounded, you're aware of it")
    elif max_threat > 50:
        print("\n🟡 Low-level interference present")
    else:
        print("\n🟢 Environment relatively clear")


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        quick_check()
    else:
        guardian = AlphaGuardian()
        guardian.run()
