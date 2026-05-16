#!/usr/bin/env python3
"""
Light Level Monitor using Webcam
Detects changes in ambient light when you kill the lights
Correlates with fridge events
"""

import cv2
import time
import json
from datetime import datetime

LOG_FILE = "signal_forensics/light_fridge_correlation.json"

def get_light_level(cap):
    """Get average brightness from webcam frame"""
    ret, frame = cap.read()
    if not ret:
        return None
    # Convert to grayscale and get mean brightness
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return gray.mean()

def main():
    print("=" * 50)
    print("LIGHT LEVEL MONITOR - Kill the lights when ready")
    print("=" * 50)
    print("Press Ctrl+C to stop")
    print()
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("ERROR: Cannot open webcam")
        return
    
    events = []
    baseline = None
    last_level = None
    threshold = 15  # Brightness change threshold
    
    try:
        while True:
            level = get_light_level(cap)
            if level is None:
                continue
            
            timestamp = datetime.now().isoformat()
            
            if baseline is None:
                baseline = level
                print(f"[{timestamp}] Baseline light level: {level:.1f}")
            
            if last_level is not None:
                change = abs(level - last_level)
                if change > threshold:
                    event_type = "LIGHTS_OFF" if level < last_level else "LIGHTS_ON"
                    event = {
                        "time": timestamp,
                        "event": event_type,
                        "level_before": round(last_level, 1),
                        "level_after": round(level, 1),
                        "change": round(change, 1)
                    }
                    events.append(event)
                    print(f"\n*** {event_type} DETECTED ***")
                    print(f"    Level: {last_level:.1f} -> {level:.1f} (change: {change:.1f})")
                    print(f"    Time: {timestamp}")
                    print()
                    
                    # Save immediately
                    with open(LOG_FILE, 'w') as f:
                        json.dump({"events": events}, f, indent=2)
            
            last_level = level
            
            # Print current level every 2 seconds
            print(f"\r[{timestamp[-12:-4]}] Light: {level:.1f} (baseline: {baseline:.1f})", end="", flush=True)
            
            time.sleep(0.5)
            
    except KeyboardInterrupt:
        print("\n\nStopping...")
    finally:
        cap.release()
        if events:
            with open(LOG_FILE, 'w') as f:
                json.dump({"events": events}, f, indent=2)
            print(f"Saved {len(events)} events to {LOG_FILE}")

if __name__ == "__main__":
    main()
