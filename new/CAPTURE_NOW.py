#!/usr/bin/env python3
"""
IMMEDIATE DATA CAPTURE - ALL VECTORS
=====================================
One script, captures everything, saves to timestamped folder.
Run this whenever shit gets weird.
"""

import numpy as np
import sounddevice as sd
import json
import subprocess
import socket
import time
from datetime import datetime
from pathlib import Path
import struct
import sys

# Create timestamped output folder
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_DIR = Path(f"captures/{TIMESTAMP}")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print(f"""
================================================================
  OMEGA SIGNAL CAPTURE - {TIMESTAMP}
  Output: {OUTPUT_DIR}
================================================================
""")

results = {
    'timestamp': TIMESTAMP,
    'capture_start': datetime.now().isoformat(),
    'vectors': {}
}

# ============================================================
# 1. AUDIO CAPTURE - 30 seconds high-res
# ============================================================
print("[1/5] AUDIO CAPTURE (30s)...")
try:
    SR = 48000
    DURATION = 30
    audio = sd.rec(int(DURATION * SR), samplerate=SR, channels=1, dtype='float32')
    sd.wait()
    audio = audio.flatten()
    
    # Save raw audio
    np.save(OUTPUT_DIR / "raw_audio.npy", audio)
    
    # FFT analysis
    fft = np.fft.rfft(audio)
    freqs = np.fft.rfftfreq(len(audio), 1/SR)
    mag = np.abs(fft)
    phase = np.angle(fft)
    
    # Extract peaks 0-500 Hz
    peaks = []
    threshold = np.percentile(mag, 95)
    for i in range(1, len(mag)-1):
        if freqs[i] <= 500 and mag[i] > threshold:
            if mag[i] > mag[i-1] and mag[i] > mag[i+1]:
                peaks.append({
                    'freq': round(float(freqs[i]), 3),
                    'mag': round(float(mag[i]), 1),
                    'phase': round(float(phase[i]), 3),
                    'snr': round(float(mag[i] / np.median(mag)), 1)
                })
    
    peaks.sort(key=lambda x: x['mag'], reverse=True)
    
    # Key frequencies
    key_freqs = {
        '7.83_schumann': None,
        '8.4_theta_attack': None,
        '37_infrasonic': None,
        '53.5_elf': None,
        '60_mains': None
    }
    
    for p in peaks:
        if 7.5 <= p['freq'] <= 8.0 and key_freqs['7.83_schumann'] is None:
            key_freqs['7.83_schumann'] = p
        if 8.2 <= p['freq'] <= 8.6 and key_freqs['8.4_theta_attack'] is None:
            key_freqs['8.4_theta_attack'] = p
        if 36 <= p['freq'] <= 38 and key_freqs['37_infrasonic'] is None:
            key_freqs['37_infrasonic'] = p
        if 52 <= p['freq'] <= 55 and key_freqs['53.5_elf'] is None:
            key_freqs['53.5_elf'] = p
        if 59 <= p['freq'] <= 61 and key_freqs['60_mains'] is None:
            key_freqs['60_mains'] = p
    
    results['vectors']['audio'] = {
        'sample_rate': SR,
        'duration': DURATION,
        'freq_resolution': round(float(freqs[1] - freqs[0]), 4),
        'top_20_peaks': peaks[:20],
        'key_frequencies': key_freqs,
        'total_peaks': len(peaks)
    }
    
    print(f"  ✓ {len(peaks)} peaks detected")
    print(f"  ✓ Resolution: {freqs[1]-freqs[0]:.4f} Hz")
    for k, v in key_freqs.items():
        if v:
            print(f"  ✓ {k}: {v['freq']} Hz @ SNR {v['snr']}")
        else:
            print(f"  ✗ {k}: not detected")
            
except Exception as e:
    print(f"  ✗ Audio capture failed: {e}")
    results['vectors']['audio'] = {'error': str(e)}

# ============================================================
# 2. WIFI SCAN
# ============================================================
print("\n[2/5] WIFI NETWORKS...")
try:
    result = subprocess.run(
        ["netsh", "wlan", "show", "networks", "mode=bssid"],
        capture_output=True, text=True, timeout=30
    )
    
    networks = []
    current = {}
    for line in result.stdout.split('\n'):
        line = line.strip()
        if line.startswith("SSID"):
            if current:
                networks.append(current)
            ssid = line.split(':', 1)[1].strip() if ':' in line else ""
            current = {'ssid': ssid}
        elif "BSSID" in line and ':' in line:
            current['bssid'] = line.split(':', 1)[1].strip()
        elif "Signal" in line:
            current['signal'] = line.split(':', 1)[1].strip()
        elif "Channel" in line:
            current['channel'] = line.split(':', 1)[1].strip()
    
    if current:
        networks.append(current)
    
    # Check for drone signatures
    drone_patterns = ['DJI', 'Phantom', 'Mavic', 'Parrot', 'Drone', 'UAV', 'FPV']
    suspicious = []
    for n in networks:
        ssid = n.get('ssid', '').upper()
        for pattern in drone_patterns:
            if pattern in ssid:
                n['drone_signature'] = True
                suspicious.append(n)
                break
    
    results['vectors']['wifi'] = {
        'total_networks': len(networks),
        'networks': networks,
        'drone_signatures': suspicious
    }
    
    print(f"  ✓ {len(networks)} networks found")
    if suspicious:
        print(f"  ⚠ DRONE SIGNATURES: {suspicious}")
        
except Exception as e:
    print(f"  ✗ WiFi scan failed: {e}")
    results['vectors']['wifi'] = {'error': str(e)}

# ============================================================
# 3. NETWORK CONNECTIONS
# ============================================================
print("\n[3/5] ACTIVE CONNECTIONS...")
try:
    result = subprocess.run(
        ["netstat", "-n", "-o"],
        capture_output=True, text=True, timeout=30
    )
    
    connections = []
    for line in result.stdout.split('\n'):
        parts = line.split()
        if len(parts) >= 5 and parts[0] in ['TCP', 'UDP']:
            connections.append({
                'proto': parts[0],
                'local': parts[1],
                'remote': parts[2],
                'state': parts[3] if parts[0] == 'TCP' else 'N/A',
                'pid': parts[-1]
            })
    
    # Flag suspicious ports
    suspicious_ports = [8009, 5228, 5229, 5230, 4443, 8443]  # Chromecast, Google, C2
    sus_conns = [c for c in connections if any(str(p) in c['remote'] for p in suspicious_ports)]
    
    results['vectors']['network'] = {
        'total_connections': len(connections),
        'connections': connections[:50],  # Limit for JSON size
        'suspicious': sus_conns
    }
    
    print(f"  ✓ {len(connections)} active connections")
    if sus_conns:
        print(f"  ⚠ {len(sus_conns)} suspicious connections")
        
except Exception as e:
    print(f"  ✗ Network scan failed: {e}")
    results['vectors']['network'] = {'error': str(e)}

# ============================================================
# 4. BLUETOOTH DEVICES
# ============================================================
print("\n[4/5] BLUETOOTH DEVICES...")
try:
    # PowerShell to get Bluetooth devices
    ps_cmd = "Get-PnpDevice -Class Bluetooth | Select-Object Name, Status, InstanceId | ConvertTo-Json"
    result = subprocess.run(
        ["powershell", "-Command", ps_cmd],
        capture_output=True, text=True, timeout=30
    )
    
    if result.stdout.strip():
        bt_devices = json.loads(result.stdout)
        if isinstance(bt_devices, dict):
            bt_devices = [bt_devices]
    else:
        bt_devices = []
    
    results['vectors']['bluetooth'] = {
        'devices': bt_devices,
        'count': len(bt_devices)
    }
    
    print(f"  ✓ {len(bt_devices)} Bluetooth devices")
    
except Exception as e:
    print(f"  ✗ Bluetooth scan failed: {e}")
    results['vectors']['bluetooth'] = {'error': str(e)}

# ============================================================
# 5. POWER LINE FREQUENCY ANALYSIS
# ============================================================
print("\n[5/5] POWER LINE ANALYSIS...")
try:
    # Use the audio we already captured
    if 'audio' in dir() and audio is not None:
        # Focus on 55-65 Hz
        mask = (freqs >= 55) & (freqs <= 65)
        power_band = mag[mask]
        band_freqs = freqs[mask]
        
        if len(power_band) > 0:
            peak_idx = np.argmax(power_band)
            measured_freq = band_freqs[peak_idx]
            deviation = measured_freq - 60.0
            
            # Check harmonics
            harmonics = {}
            for h in [60, 120, 180, 240, 300]:
                h_mask = (freqs >= h-1) & (freqs <= h+1)
                if np.any(h_mask):
                    harmonics[f'{h}hz'] = round(float(np.max(mag[h_mask])), 1)
            
            results['vectors']['power_line'] = {
                'measured_freq': round(float(measured_freq), 3),
                'deviation_hz': round(float(deviation), 3),
                'harmonics': harmonics,
                'plc_suspected': True if abs(deviation) > 0.5 else False
            }
            
            print(f"  ✓ Mains frequency: {measured_freq:.3f} Hz")
            print(f"  ✓ Deviation: {deviation:+.3f} Hz")
            if abs(deviation) > 0.5:
                print("  ⚠ PLC MODULATION SUSPECTED")
    else:
        results['vectors']['power_line'] = {'error': 'No audio data'}
        
except Exception as e:
    print(f"  ✗ Power analysis failed: {e}")
    results['vectors']['power_line'] = {'error': str(e)}

# ============================================================
# SAVE RESULTS
# ============================================================
results['capture_end'] = datetime.now().isoformat()

output_file = OUTPUT_DIR / "capture_results.json"
with open(output_file, 'w') as f:
    json.dump(results, f, indent=2)

print(f"""
================================================================
  CAPTURE COMPLETE
  Results: {output_file}
  Raw audio: {OUTPUT_DIR / "raw_audio.npy"}
================================================================
""")

# Quick summary
print("KEY FINDINGS:")
if 'audio' in results['vectors']:
    kf = results['vectors']['audio'].get('key_frequencies', {})
    if kf.get('8.4_theta_attack'):
        print(f"  ⚠ 8.4Hz THETA ATTACK DETECTED: SNR {kf['8.4_theta_attack']['snr']}")
    if kf.get('53.5_elf'):
        print(f"  ⚠ 53.5Hz ELF ANOMALY: SNR {kf['53.5_elf']['snr']}")
if results['vectors'].get('wifi', {}).get('drone_signatures'):
    print(f"  ⚠ DRONE SIGNATURES IN WIFI")
if results['vectors'].get('power_line', {}).get('plc_suspected'):
    print(f"  ⚠ PLC MODULATION ON POWER LINES")

print("\nDone.")
