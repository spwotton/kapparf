#!/usr/bin/env python3
"""
SURVEILLANCE EVENT LOGGER
===========================
Quick timestamped logging of observations for evidence collection.

Usage:
  python event_logger.py "Dogs barking, 6 drones overhead, UberEats delivery"
  python event_logger.py --list        # Show recent events
  python event_logger.py --correlate   # Correlate with signal data

Author: ECHO/ToroidalRecursion
Date: 2026-01-25
"""

import sys
import json
import datetime
import numpy as np
from pathlib import Path

EVENT_LOG = Path("signal_forensics/surveillance_events.json")
EVENT_LOG.parent.mkdir(parents=True, exist_ok=True)

def load_events():
    if EVENT_LOG.exists():
        with open(EVENT_LOG) as f:
            return json.load(f)
    return {"events": []}

def save_events(data):
    with open(EVENT_LOG, 'w') as f:
        json.dump(data, f, indent=2)

def log_event(description):
    """Log a surveillance observation with timestamp and audio snapshot."""
    data = load_events()
    
    # Quick audio snapshot
    audio_snapshot = None
    try:
        import sounddevice as sd
        audio = sd.rec(int(1 * 48000), samplerate=48000, channels=1, dtype='float32')
        sd.wait()
        audio = audio.flatten()
        
        fft = np.fft.rfft(audio)
        freqs = np.fft.rfftfreq(len(audio), 1/48000)
        mag = np.abs(fft)
        
        # Get top infrasonic peaks
        infra_peaks = []
        for i in range(len(freqs)):
            if 1 <= freqs[i] <= 60 and mag[i] > np.max(mag) * 0.1:
                infra_peaks.append({"freq": float(freqs[i]), "mag": float(mag[i])})
        
        audio_snapshot = {
            "infrasonic_peaks": sorted(infra_peaks, key=lambda x: x['mag'], reverse=True)[:10],
            "total_energy": float(np.sum(mag)),
            "max_freq": float(freqs[np.argmax(mag)])
        }
    except Exception as e:
        audio_snapshot = {"error": str(e)}
    
    event = {
        "timestamp": datetime.datetime.now().isoformat(),
        "description": description,
        "audio_snapshot": audio_snapshot
    }
    
    data["events"].append(event)
    save_events(data)
    
    print(f"\n✅ Event logged at {event['timestamp']}")
    print(f"   Description: {description}")
    if audio_snapshot and "infrasonic_peaks" in audio_snapshot:
        peaks = audio_snapshot['infrasonic_peaks'][:5]
        peak_strs = [f"{p['freq']:.1f}Hz" for p in peaks]
        print(f"   Top infrasonic: {peak_strs}")
    
    return event

def list_events(count=20):
    """List recent events."""
    data = load_events()
    events = data["events"][-count:]
    
    print(f"\n{'='*70}")
    print(f"  SURVEILLANCE EVENT LOG - Last {len(events)} events")
    print(f"{'='*70}\n")
    
    for e in events:
        ts = e["timestamp"][:19]
        desc = e["description"][:60]
        print(f"[{ts}] {desc}")
        
        if "audio_snapshot" in e and "infrasonic_peaks" in e["audio_snapshot"]:
            peaks = e["audio_snapshot"]["infrasonic_peaks"][:3]
            if peaks:
                peak_str = ", ".join([f"{p['freq']:.1f}Hz" for p in peaks])
                print(f"              ↳ Infrasonic: {peak_str}")
    
    print(f"\nTotal events: {len(data['events'])}")

def correlate_events():
    """Correlate events with signal data."""
    data = load_events()
    
    # Load ELF and other signal logs if they exist
    elf_log = Path("signal_forensics/lifi_plc_events.json")
    interrupt_log = Path("signal_forensics/keyboard_interrupt_log.json")
    
    print(f"\n{'='*70}")
    print(f"  EVENT CORRELATION ANALYSIS")
    print(f"{'='*70}\n")
    
    correlations = []
    
    for event in data["events"]:
        event_time = datetime.datetime.fromisoformat(event["timestamp"])
        
        # Check for infrasonic anomalies during event
        if "audio_snapshot" in event and "infrasonic_peaks" in event["audio_snapshot"]:
            peaks = event["audio_snapshot"]["infrasonic_peaks"]
            
            # Look for suspicious frequencies
            for peak in peaks:
                freq = peak["freq"]
                # 53.5Hz = 37 × κ₂ (documented anomaly)
                if 52 <= freq <= 55:
                    correlations.append({
                        "event": event["description"][:40],
                        "time": event["timestamp"],
                        "finding": f"53Hz ELF anomaly detected ({freq:.1f}Hz)",
                        "significance": "HIGH"
                    })
                # 36.25Hz WiFi-correlated
                elif 35 <= freq <= 38:
                    correlations.append({
                        "event": event["description"][:40],
                        "time": event["timestamp"],
                        "finding": f"36Hz WiFi-correlated frequency ({freq:.1f}Hz)",
                        "significance": "MEDIUM"
                    })
    
    if correlations:
        print(f"Found {len(correlations)} correlations:\n")
        for c in correlations:
            print(f"  [{c['significance']}] {c['time'][:19]}")
            print(f"         Event: {c['event']}")
            print(f"         Finding: {c['finding']}\n")
    else:
        print("No significant correlations found yet.")
        print("Continue logging events to build pattern database.")
    
    return correlations


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python event_logger.py 'description of observation'")
        print("  python event_logger.py --list")
        print("  python event_logger.py --correlate")
        sys.exit(1)
    
    arg = sys.argv[1]
    
    if arg == "--list":
        list_events()
    elif arg == "--correlate":
        correlate_events()
    else:
        # Join all args as description
        description = " ".join(sys.argv[1:])
        log_event(description)
