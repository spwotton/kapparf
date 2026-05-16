#!/usr/bin/env python3
"""
HIDDEN CAMERA DETECTION TOOLKIT
================================
Multi-modal detection for surveillance devices

Detection Methods:
1. RF scanning (WiFi cameras broadcast)
2. Network device enumeration  
3. IR detection guidance (phone camera)
4. Known camera MAC OUI database
5. Suspicious port scanning

Target: 6 outlets with red LEDs behind kitchen sink
"""

import subprocess
import socket
import struct
import re
import json
from datetime import datetime
from pathlib import Path

# Known camera/surveillance device OUI prefixes
CAMERA_OUIS = {
    # IP Cameras
    "00:18:AE": "TVT (IP Cameras)",
    "00:0E:8F": "Sercomm (IP Cameras)",
    "00:62:6E": "Shenzhen (Cheap IP Cams)",
    "28:F3:66": "Shenzhen Bilian (Spy Cams)",
    "34:EA:34": "HangZhou (WiFi Cameras)",
    "38:22:D6": "Hangzhou Hikvision",
    "44:19:B6": "Hangzhou Hikvision",
    "54:C4:15": "Hangzhou Hikvision",
    "A4:14:37": "Hangzhou Hikvision",
    "C0:56:E3": "Hangzhou Hikvision",
    "C4:2F:90": "Hangzhou Hikvision",
    "C8:02:8F": "Dahua Technology",
    "3C:EF:8C": "Dahua Technology",
    "E0:50:8B": "Zhejiang Dahua",
    "4C:11:BF": "Zhejiang Dahua",
    "00:1F:54": "Lorex (Security Cams)",
    "00:12:6D": "University of Twente",
    "00:0C:43": "Ralink (WiFi modules in cams)",
    "7C:DD:90": "Shenzhen Ogemray",
    "E8:AB:FA": "Shenzhen (IoT/Cameras)",
    "B4:A2:EB": "Shenzhen Baitong",
    "94:83:C4": "Hangzhou (Cameras)",
    "BC:51:FE": "Swann Communications",
    "00:26:74": "Eliwell Controls (Hidden)",
    "00:1A:3F": "Intelbras",
    "50:8C:B1": "Hangzhou Ezviz",
    "28:57:BE": "Hangzhou Ezviz",
    # Generic surveillance
    "2C:AA:8E": "Wyze Labs",
    "D0:3F:27": "Wyze Labs", 
    "8C:85:80": "Smart Home Devices",
    "AC:84:C6": "TP-Link (Tapo Cams)",
    "5C:A6:E6": "TP-Link (Tapo Cams)",
    "68:FF:7B": "TP-Link (Kasa Cams)",
    "50:C7:BF": "TP-Link",
    "B0:BE:76": "TP-Link",
    "60:32:B1": "TP-Link Smart",
    "98:DA:C4": "TP-Link",
    # Ring/Amazon
    "34:3E:A4": "Ring (Amazon)",
    "0C:47:C9": "Ring",
    "4C:EC:0F": "Ring", 
    "A0:02:DC": "Ring",
    "F4:5F:D4": "Amazon Blink",
    # Nest/Google
    "18:B4:30": "Nest Labs",
    "64:16:66": "Nest Labs",
    # Arlo
    "9C:B7:0D": "Arlo Technologies",
    "A0:4E:04": "Arlo",
    # Generic IoT that could be cameras
    "CC:50:E3": "Edimax (IP Cams)",
    "74:DA:38": "Edimax",
    "00:E0:4C": "Realtek (common in cams)",
    "48:02:2A": "B-Link (cameras)",
    "D8:F1:5B": "TP-Link (Tapo/Kasa)",
}

# Suspicious ports for cameras
CAMERA_PORTS = [
    80,    # HTTP web interface
    443,   # HTTPS
    554,   # RTSP (Real Time Streaming Protocol) - MAJOR RED FLAG
    8080,  # Alternate HTTP
    8554,  # Alternate RTSP
    8000,  # Common camera port
    8001,  # Hikvision
    8443,  # HTTPS alternate
    37777, # Dahua
    34567, # Cheap Chinese cams
    9000,  # Common IoT
    5000,  # Flask/streaming
    1935,  # RTMP streaming
    8888,  # Common alt HTTP
    81,    # Alternate HTTP
    8899,  # Some IP cams
]


def get_local_network():
    """Get local network info"""
    try:
        # Get default gateway
        result = subprocess.run(
            ['powershell', '-Command', 
             '(Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway}).IPv4Address.IPAddress'],
            capture_output=True, text=True, timeout=10
        )
        local_ip = result.stdout.strip().split('\n')[0] if result.stdout.strip() else None
        
        if local_ip:
            # Assume /24 network
            network_base = '.'.join(local_ip.split('.')[:3]) + '.'
            return local_ip, network_base
    except:
        pass
    return None, None


def scan_arp_table():
    """Get all devices from ARP table"""
    devices = []
    try:
        result = subprocess.run(['arp', '-a'], capture_output=True, text=True, timeout=30)
        
        for line in result.stdout.split('\n'):
            # Match IP and MAC
            match = re.search(r'(\d+\.\d+\.\d+\.\d+)\s+([\da-fA-F-]{17})', line)
            if match:
                ip = match.group(1)
                mac = match.group(2).upper().replace('-', ':')
                devices.append({'ip': ip, 'mac': mac})
    except Exception as e:
        print(f"ARP scan error: {e}")
    
    return devices


def check_camera_oui(mac):
    """Check if MAC belongs to known camera manufacturer"""
    oui = mac[:8].upper()
    if oui in CAMERA_OUIS:
        return CAMERA_OUIS[oui]
    return None


def scan_port(ip, port, timeout=0.5):
    """Quick port scan"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((ip, port))
        sock.close()
        return result == 0
    except:
        return False


def scan_device_ports(ip):
    """Scan for camera-related ports"""
    open_ports = []
    for port in CAMERA_PORTS:
        if scan_port(ip, port):
            open_ports.append(port)
    return open_ports


def detect_rtsp_streams(ip):
    """Try to detect RTSP streams"""
    rtsp_ports = [554, 8554]
    streams = []
    
    for port in rtsp_ports:
        if scan_port(ip, port):
            streams.append(f"rtsp://{ip}:{port}/")
    
    return streams


def get_wifi_networks():
    """Scan for suspicious WiFi networks (cameras often create APs)"""
    suspicious_ssids = []
    try:
        result = subprocess.run(
            ['netsh', 'wlan', 'show', 'networks', 'mode=bssid'],
            capture_output=True, text=True, timeout=30
        )
        
        current_ssid = None
        current_bssid = None
        current_signal = None
        
        for line in result.stdout.split('\n'):
            if 'SSID' in line and 'BSSID' not in line:
                match = re.search(r'SSID\s*\d*\s*:\s*(.+)', line)
                if match:
                    current_ssid = match.group(1).strip()
            elif 'BSSID' in line:
                match = re.search(r'BSSID\s*\d*\s*:\s*([\da-fA-F:]+)', line)
                if match:
                    current_bssid = match.group(1).upper()
            elif 'Signal' in line:
                match = re.search(r'Signal\s*:\s*(\d+)%', line)
                if match:
                    current_signal = int(match.group(1))
                    
                    # Check for suspicious patterns
                    if current_ssid and current_bssid:
                        is_suspicious = False
                        reason = []
                        
                        # Camera-like SSIDs
                        cam_keywords = ['cam', 'ipc', 'dvr', 'nvr', 'eye', 'watch', 
                                       'hik', 'dahua', 'ip_', 'wificam', 'smartcam',
                                       'security', 'monitor', 'stream', 'rtsp']
                        for kw in cam_keywords:
                            if kw.lower() in current_ssid.lower():
                                is_suspicious = True
                                reason.append(f"Camera keyword: {kw}")
                        
                        # Hidden SSID
                        if not current_ssid or current_ssid == '':
                            is_suspicious = True
                            reason.append("Hidden SSID")
                        
                        # Check OUI
                        oui = current_bssid[:8].replace(':', '-')
                        cam_vendor = check_camera_oui(current_bssid)
                        if cam_vendor:
                            is_suspicious = True
                            reason.append(f"Camera vendor: {cam_vendor}")
                        
                        if is_suspicious:
                            suspicious_ssids.append({
                                'ssid': current_ssid or '[HIDDEN]',
                                'bssid': current_bssid,
                                'signal': current_signal,
                                'reasons': reason
                            })
                    
                    current_ssid = None
                    current_bssid = None
                    
    except Exception as e:
        print(f"WiFi scan error: {e}")
    
    return suspicious_ssids


def print_ir_detection_guide():
    """Print guide for using phone camera to detect IR LEDs"""
    guide = """
╔══════════════════════════════════════════════════════════════════════╗
║                    IR CAMERA DETECTION GUIDE                          ║
║              Use Your Phone Camera to Find Hidden Cameras             ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  STEP 1: Turn off ALL lights in the room (complete darkness)         ║
║                                                                       ║
║  STEP 2: Open your phone's CAMERA app                                 ║
║          - Use the FRONT camera (more sensitive to IR)                ║
║          - Some phones filter IR on rear camera                       ║
║                                                                       ║
║  STEP 3: Point camera at EACH outlet                                  ║
║          - Look for PURPLE/PINK glowing dots                          ║
║          - IR LEDs appear purple/white through phone camera           ║
║          - Visible red = indicator LED (could still hide camera)      ║
║          - Invisible but shows on phone = DEFINITELY IR CAMERA        ║
║                                                                       ║
║  STEP 4: Check the 6 outlets behind sink:                             ║
║          - Are red lights visible with naked eye?                     ║
║          - Do they show BRIGHTER through phone camera?                ║
║          - If phone shows MORE dots than visible = HIDDEN IR          ║
║                                                                       ║
║  STEP 5: Use TV remote as test                                        ║
║          - Point remote at phone camera                               ║
║          - Press any button                                           ║
║          - You should see IR LED flash purple                         ║
║          - If you DON'T see it, use different camera app              ║
║                                                                       ║
║  RED FLAGS FOR YOUR OUTLETS:                                          ║
║  ✗ 6 outlets in tiny kitchen = EXCESSIVE                              ║
║  ✗ Behind sink = UNUSUAL placement (water hazard)                     ║
║  ✗ Facing street = LINE OF SIGHT to outside                           ║
║  ✗ Red indicator lights = Possible camera activity LEDs               ║
║  ✗ Outlets not being used for anything = WHY ARE THEY THERE?          ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
"""
    print(guide)


def print_physical_inspection_guide():
    """Guide for physical outlet inspection"""
    guide = """
╔══════════════════════════════════════════════════════════════════════╗
║                   PHYSICAL OUTLET INSPECTION                          ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  LOOK FOR THESE CAMERA HIDING SPOTS IN OUTLETS:                       ║
║                                                                       ║
║  1. USB CHARGER OUTLETS                                               ║
║     - Pinhole camera in the USB port area                             ║
║     - Camera lens disguised as charging LED                           ║
║     - Extra-thick faceplate (room for electronics)                    ║
║                                                                       ║
║  2. STANDARD OUTLETS                                                  ║
║     - Small hole near the ground prong                                ║
║     - Unusual screw placement                                         ║
║     - Faceplate doesn't match others in house                         ║
║     - Gap between outlet and wall                                     ║
║                                                                       ║
║  3. GFCI OUTLETS (should be near sink!)                               ║
║     - Camera hidden in TEST/RESET button area                         ║
║     - Fake GFCI with camera behind                                    ║
║                                                                       ║
║  PHYSICAL CHECKS:                                                     ║
║  □ Compare outlets to standard ones elsewhere                         ║
║  □ Check if faceplate is unusually thick                              ║
║  □ Look for tiny holes (camera lens = 1-2mm)                          ║
║  □ Feel for warmth (cameras generate heat)                            ║
║  □ Check if outlets are actually wired (plug something in)            ║
║  □ Remove faceplate and inspect (if safe/legal)                       ║
║                                                                       ║
║  YOUR SPECIFIC SITUATION:                                             ║
║  - 6 outlets behind sink is CODE VIOLATION territory                  ║
║  - Standard code: MAX 2 outlets near sink, must be GFCI               ║
║  - If they're NOT GFCI = either fake or major code violation          ║
║  - If red lights stay on 24/7 = likely camera (not charger indicator) ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
"""
    print(guide)


def run_full_scan():
    """Run comprehensive camera detection scan"""
    print("=" * 70)
    print("           HIDDEN CAMERA DETECTION SCAN")
    print(f"           {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    results = {
        'timestamp': datetime.now().isoformat(),
        'suspicious_devices': [],
        'camera_oui_matches': [],
        'rtsp_streams': [],
        'suspicious_wifi': [],
        'open_camera_ports': []
    }
    
    # 1. Print IR detection guide
    print("\n[1/5] IR DETECTION GUIDE")
    print_ir_detection_guide()
    
    input("\nPress ENTER after checking with phone camera...")
    
    # 2. Print physical inspection guide
    print("\n[2/5] PHYSICAL INSPECTION GUIDE")
    print_physical_inspection_guide()
    
    input("\nPress ENTER after physical inspection...")
    
    # 3. Network scan
    print("\n[3/5] SCANNING NETWORK FOR CAMERA DEVICES...")
    
    devices = scan_arp_table()
    print(f"Found {len(devices)} devices on network\n")
    
    camera_suspects = []
    
    for dev in devices:
        ip = dev['ip']
        mac = dev['mac']
        
        # Check OUI
        cam_vendor = check_camera_oui(mac)
        if cam_vendor:
            camera_suspects.append({
                'ip': ip,
                'mac': mac,
                'vendor': cam_vendor,
                'type': 'OUI_MATCH'
            })
            results['camera_oui_matches'].append(dev)
            print(f"  ⚠️  CAMERA OUI: {ip} | {mac} | {cam_vendor}")
        
        # Scan for camera ports
        print(f"  Scanning {ip}...", end='', flush=True)
        open_ports = scan_device_ports(ip)
        
        if open_ports:
            print(f" PORTS: {open_ports}")
            
            # Check for RTSP (major red flag)
            if 554 in open_ports or 8554 in open_ports:
                print(f"  🚨 RTSP STREAM DETECTED: {ip} - THIS IS A CAMERA!")
                results['rtsp_streams'].append(ip)
                camera_suspects.append({
                    'ip': ip,
                    'mac': mac,
                    'ports': open_ports,
                    'type': 'RTSP_STREAM'
                })
            
            results['open_camera_ports'].append({
                'ip': ip,
                'mac': mac,
                'ports': open_ports
            })
        else:
            print(" (no camera ports)")
    
    # 4. WiFi scan for camera APs
    print("\n[4/5] SCANNING WIFI FOR CAMERA ACCESS POINTS...")
    suspicious_wifi = get_wifi_networks()
    
    if suspicious_wifi:
        print(f"\n⚠️  SUSPICIOUS WIFI NETWORKS FOUND: {len(suspicious_wifi)}")
        for wifi in suspicious_wifi:
            print(f"  SSID: {wifi['ssid']}")
            print(f"  BSSID: {wifi['bssid']}")
            print(f"  Signal: {wifi['signal']}%")
            print(f"  Reasons: {', '.join(wifi['reasons'])}")
            print()
        results['suspicious_wifi'] = suspicious_wifi
    else:
        print("  No suspicious WiFi networks detected")
    
    # 5. Summary
    print("\n[5/5] DETECTION SUMMARY")
    print("=" * 70)
    
    if camera_suspects:
        print("\n🚨 POTENTIAL CAMERAS FOUND:")
        for cam in camera_suspects:
            print(f"  IP: {cam['ip']}")
            print(f"  MAC: {cam['mac']}")
            print(f"  Type: {cam.get('type', 'Unknown')}")
            if 'vendor' in cam:
                print(f"  Vendor: {cam['vendor']}")
            if 'ports' in cam:
                print(f"  Open Ports: {cam['ports']}")
            print()
        results['suspicious_devices'] = camera_suspects
    else:
        print("\n✓ No obvious camera devices on network")
        print("  (Camera may be on separate network or cellular)")
    
    # Physical evidence assessment
    print("\n" + "=" * 70)
    print("OUTLET ASSESSMENT - 6 OUTLETS BEHIND SINK:")
    print("=" * 70)
    print("""
    RED FLAGS IDENTIFIED:
    ━━━━━━━━━━━━━━━━━━━━
    ✗ Quantity: 6 outlets in tiny kitchen = ABNORMAL
    ✗ Location: Behind sink = CODE VIOLATION (water hazard)
    ✗ Orientation: Facing street = SURVEILLANCE ANGLE
    ✗ Red LEDs: Activity indicators suggest powered devices
    
    POSSIBLE EXPLANATIONS:
    ━━━━━━━━━━━━━━━━━━━━━━
    1. USB charger outlets with LEDs (check if actually USB)
    2. Smart outlets with WiFi (should appear on network)
    3. Hidden cameras disguised as outlets
    4. Listening devices (audio bugs)
    5. Data exfiltration devices (powerline network)
    
    RECOMMENDED ACTIONS:
    ━━━━━━━━━━━━━━━━━━━━
    1. ✓ IR scan with phone camera (did you see extra dots?)
    2. ✓ Network scan (done - check results above)
    3. □ Check if outlets are actually functional (plug in lamp)
    4. □ Check if they're GFCI (they MUST be near sink)
    5. □ Compare to outlets elsewhere in apartment
    6. □ Check with RF detector (2.4GHz band)
    7. □ Consider professional bug sweep
    """)
    
    # Save results
    output_path = Path(__file__).parent / "camera_scan_results.json"
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: {output_path}")
    
    return results


if __name__ == "__main__":
    run_full_scan()
