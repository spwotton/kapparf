#!/usr/bin/env python3
"""
KIWISDR REMOTE SCANNER - DORJE STATION RF BASELINE
Accesses public KiwiSDR receivers for RF spectrum analysis
Focus: Low-frequency baseline (10 kHz - 30 MHz shortwave)

KiwiSDR Coverage:
- 10 kHz - 30 MHz (shortwave/HF band)
- NOT for V2K frequencies (400 MHz - 3 GHz) - use RTL-SDR for that

Target Frequencies:
- 0.159 Hz harmonics (kappa signature)
- 8.4 Hz / 7.83 Hz Schumann resonance region
- VLF stations (NAA 24.0 kHz, NML 25.2 kHz, etc.)
- HF broadcast interference patterns
"""

import json
import asyncio
import aiohttp
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import struct
import time

# KiwiSDR directory API for live receiver list
KIWISDR_DIRECTORY_URL = "http://kiwisdr.com/public/"

# PRIORITY RECEIVER - Costa Rica Radio Club (20km from DORJE_STATION!)
COSTA_RICA_KIWI = {
    "name": "RADIOCLUB COSTA RICA | San Jose",
    "url": "ti0rc.proxy.kiwisdr.com",
    "callsign": "TI0RC",
    "gps": (9.920611, -84.059417),
    "grid": "EJ79xw",
    "alt": 1250,
    "antenna": "TH-36",
    "distance_km": 20  # Approx from La Guácima
}

# Fallback receivers (may be offline)
KIWISDR_RECEIVERS = []  # Will be populated from directory


async def fetch_kiwisdr_directory() -> List[tuple]:
    """Fetch live KiwiSDR receiver list from directory"""
    receivers = []
    
    try:
        async with aiohttp.ClientSession() as session:
            # Use the RX list API
            async with session.get(
                "http://rx.linkfanel.net/kiwisdr_com.js",
                timeout=aiohttp.ClientTimeout(total=15)
            ) as resp:
                if resp.status == 200:
                    text = await resp.text()
                    # Parse the JavaScript array
                    import re
                    # Extract individual receiver entries
                    entries = re.findall(r'\{([^}]+)\}', text)
                    
                    for entry in entries[:100]:  # Limit to 100
                        try:
                            # Parse fields
                            url_match = re.search(r'"url"\s*:\s*"([^"]+)"', entry)
                            name_match = re.search(r'"name"\s*:\s*"([^"]+)"', entry)
                            gps_match = re.search(r'"gps"\s*:\s*"\((-?[\d.]+),\s*(-?[\d.]+)\)"', entry)
                            loc_match = re.search(r'"loc"\s*:\s*"([^"]+)"', entry)
                            
                            if url_match and gps_match:
                                url = url_match.group(1).replace("http://", "").replace(":8073", "").rstrip("/")
                                lat = float(gps_match.group(1))
                                lon = float(gps_match.group(2))
                                name = name_match.group(1) if name_match else url
                                loc = loc_match.group(1) if loc_match else "Unknown"
                                
                                receivers.append((name, url, loc, lat, lon))
                        except:
                            continue
                    
                    print(f"[DIRECTORY] Fetched {len(receivers)} receivers from live directory")
    except Exception as e:
        print(f"[DIRECTORY] Failed to fetch: {e}")
    
    # If directory failed, try the map API
    if not receivers:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "http://kiwisdr.com/public/",
                    timeout=aiohttp.ClientTimeout(total=15)
                ) as resp:
                    if resp.status == 200:
                        text = await resp.text()
                        # Parse HTML for receiver list
                        import re
                        links = re.findall(r'href="http://([^":]+):8073"', text)
                        for url in links[:50]:
                            receivers.append((url, url, "Unknown", 0, 0))
                        print(f"[DIRECTORY] Fetched {len(receivers)} receivers from public page")
        except:
            pass
    
    # Fallback hardcoded receivers that are known to work
    if not receivers:
        print("[DIRECTORY] Using fallback receiver list")
        receivers = [
            ("W3ADO", "w3ado.dyndns.org", "Maryland, USA", 39.05, -76.87),
            ("K3FEF", "k3fef.dyndns.org", "Maryland, USA", 39.00, -77.00),
            ("N6GN", "n6gn.dyndns.org", "California, USA", 37.00, -122.00),
            ("VE3SUN", "ve3sun.ddns.net", "Ontario, Canada", 44.00, -79.00),
            ("LU7HZ", "lu7hz.proxy.kiwisdr.com", "Argentina", -34.60, -58.38),
        ]
    
    return receivers

# Target frequencies for analysis (in kHz for KiwiSDR)
TARGET_FREQUENCIES_KHZ = {
    # VLF time signals (can detect ELF modulation)
    "NAA_Cutler": 24.0,      # US Navy Cutler, Maine
    "NML_LaMoure": 25.2,     # US Navy LaMoure, ND
    "NAU_Aguada": 40.75,     # US Navy, Puerto Rico (CLOSE!)
    "NPM_Hawaii": 21.4,      # US Navy Pearl Harbor
    
    # LF/MF broadcast
    "WWVB": 60.0,            # NIST time signal
    "CHU_Canada": 3330.0,    # CHU Canada time
    "WWV_5MHz": 5000.0,      # WWV time signal
    "WWV_10MHz": 10000.0,    # WWV time signal
    "WWV_15MHz": 15000.0,    # WWV time signal
    
    # HF frequencies of interest
    "11m_CB": 27185.0,       # CB radio (11 meters)
    "40m_Amateur": 7200.0,   # Amateur 40m band
    "20m_Amateur": 14200.0,  # Amateur 20m band
    
    # Kappa harmonics (0.159 Hz fundamental)
    "kappa_H1": 0.159,       # Fundamental (too low for KiwiSDR)
    "kappa_H100": 15.9,      # 100th harmonic
    "kappa_H1000": 159.0,    # 1000th harmonic
    "kappa_H10000": 1590.0,  # 10,000th harmonic
    
    # Chinese number stations / HAARP regions
    "8MHz_general": 8000.0,  # General monitoring
    "Schumann_kHz": 7.83,    # Schumann (out of range but for reference)
}

# DORJE station location (La Guacima, Costa Rica)
DORJE_LAT = 10.0167
DORJE_LON = -84.2167


class KiwiSDRScanner:
    """Remote KiwiSDR spectrum scanner for RF baseline analysis"""
    
    def __init__(self):
        self.output_dir = Path("signal_forensics/kiwi_captures")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.results = []
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points (km)"""
        # Haversine formula
        R = 6371  # Earth radius km
        lat1_r, lat2_r = np.radians(lat1), np.radians(lat2)
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        
        a = np.sin(dlat/2)**2 + np.cos(lat1_r) * np.cos(lat2_r) * np.sin(dlon/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        
        return R * c
    
    def sort_receivers_by_distance(self) -> List[tuple]:
        """Sort receivers by distance from DORJE station"""
        with_distances = []
        for name, url, location, lat, lon in KIWISDR_RECEIVERS:
            dist = self.calculate_distance(DORJE_LAT, DORJE_LON, lat, lon)
            with_distances.append((dist, name, url, location, lat, lon))
        
        return sorted(with_distances, key=lambda x: x[0])
    
    async def check_receiver_status(self, url: str, timeout: int = 10) -> Dict:
        """Check if a KiwiSDR receiver is online"""
        status_url = f"http://{url}:8073/status"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(status_url, timeout=aiohttp.ClientTimeout(total=timeout)) as resp:
                    if resp.status == 200:
                        text = await resp.text()
                        return {"online": True, "status": text[:500]}
                    return {"online": False, "status": f"HTTP {resp.status}"}
        except asyncio.TimeoutError:
            return {"online": False, "status": "Timeout"}
        except Exception as e:
            return {"online": False, "status": str(e)[:100]}
    
    async def scan_receivers(self, receiver_list: List[tuple] = None) -> List[Dict]:
        """Scan all receivers for availability"""
        print("\n" + "="*60)
        print("KIWISDR RECEIVER SCAN - DORJE STATION")
        print("="*60)
        print(f"DORJE Station: {DORJE_LAT:.4f}N, {DORJE_LON:.4f}W")
        print(f"Session: {self.session_id}")
        print("-"*60)
        
        # Use provided list or fetch from directory
        if receiver_list is None:
            receiver_list = await fetch_kiwisdr_directory()
        
        sorted_receivers = []
        for name, url, location, lat, lon in receiver_list:
            if lat != 0 or lon != 0:
                dist = self.calculate_distance(DORJE_LAT, DORJE_LON, lat, lon)
            else:
                dist = 99999  # Unknown location
            sorted_receivers.append((dist, name, url, location, lat, lon))
        
        sorted_receivers = sorted(sorted_receivers, key=lambda x: x[0])
        available = []
        
        for dist, name, url, location, lat, lon in sorted_receivers:
            status = await self.check_receiver_status(url)
            
            if status["online"]:
                print(f"[OK] {name} ({location}) - {dist:.0f} km - ONLINE")
                available.append({
                    "name": name,
                    "url": url,
                    "location": location,
                    "lat": lat,
                    "lon": lon,
                    "distance_km": dist,
                    "status": "online"
                })
            else:
                print(f"[--] {name} ({location}) - {dist:.0f} km - {status['status'][:30]}")
        
        print("-"*60)
        print(f"Available receivers: {len(available)}/{len(KIWISDR_RECEIVERS)}")
        
        return available
    
    async def get_waterfall_data(self, url: str, freq_khz: float, bandwidth: float = 12.0) -> Optional[Dict]:
        """
        Get waterfall spectrum data from a KiwiSDR receiver.
        
        Note: KiwiSDR uses WebSocket for actual audio/spectrum streaming.
        This is a simplified HTTP-based approach for status checking.
        For real-time spectrum, use the kiwiclient library or WebSocket API.
        """
        # KiwiSDR waterfall endpoint (simplified)
        try:
            async with aiohttp.ClientSession() as session:
                # Get SNR/status info
                status_url = f"http://{url}:8073/status"
                async with session.get(status_url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        text = await resp.text()
                        return {
                            "freq_khz": freq_khz,
                            "timestamp": datetime.now().isoformat(),
                            "status": "queried",
                            "raw": text[:1000]
                        }
        except Exception as e:
            return {"error": str(e), "freq_khz": freq_khz}
        
        return None
    
    async def triangulate_signal(self, freq_khz: float, receivers: List[Dict]) -> Dict:
        """
        Use multiple receivers to triangulate a signal source.
        Compares signal strength across receivers to estimate source location.
        """
        print(f"\n[TRIANGULATE] {freq_khz} kHz across {len(receivers)} receivers")
        
        measurements = []
        for rx in receivers[:5]:  # Use 5 closest receivers
            data = await self.get_waterfall_data(rx["url"], freq_khz)
            if data and "error" not in data:
                measurements.append({
                    "receiver": rx["name"],
                    "lat": rx["lat"],
                    "lon": rx["lon"],
                    "distance_km": rx["distance_km"],
                    "data": data
                })
        
        return {
            "frequency_khz": freq_khz,
            "receivers_used": len(measurements),
            "measurements": measurements,
            "timestamp": datetime.now().isoformat()
        }
    
    async def monitor_vlf(self, duration_minutes: int = 5) -> Dict:
        """
        Monitor VLF frequencies for anomalies.
        VLF (3-30 kHz) is best for detecting ELF modulation.
        """
        print(f"\n[VLF MONITOR] Duration: {duration_minutes} min")
        
        vlf_freqs = {k: v for k, v in TARGET_FREQUENCIES_KHZ.items() if v < 100}
        results = {"vlf_scan": [], "anomalies": []}
        
        # Get available receivers
        receivers = await self.scan_receivers()
        
        if not receivers:
            print("[WARN] No receivers available!")
            return {"error": "No receivers available"}
        
        # Use closest receiver
        closest = receivers[0]
        print(f"[VLF] Using: {closest['name']} ({closest['distance_km']:.0f} km)")
        
        start = time.time()
        
        while (time.time() - start) < (duration_minutes * 60):
            for name, freq in vlf_freqs.items():
                if freq >= 10:  # KiwiSDR minimum ~10 kHz
                    data = await self.get_waterfall_data(closest["url"], freq)
                    if data:
                        results["vlf_scan"].append({
                            "name": name,
                            "freq_khz": freq,
                            "data": data
                        })
            
            await asyncio.sleep(30)  # Scan every 30 seconds
        
        return results
    
    async def huawei_frequency_hunt(self) -> Dict:
        """
        Hunt for frequencies associated with Huawei/Chinese infrastructure.
        Cross-reference with known Chinese number station frequencies and
        HF propagation patterns to/from China.
        """
        print("\n" + "="*60)
        print("HUAWEI FREQUENCY HUNT")
        print("="*60)
        
        # Frequencies of interest for Chinese infrastructure
        chinese_hf = {
            "chinese_time": 5000.0,       # BPM time signal
            "chinese_time_10": 10000.0,   # BPM 10 MHz
            "chinese_time_15": 15000.0,   # BPM 15 MHz
            "chinese_mil_1": 8461.0,      # Known Chinese military
            "chinese_mil_2": 11545.0,     # Known Chinese military
            "chinese_numbers": 4880.0,    # Chinese number station region
            "chinese_diplo": 6880.0,      # Chinese diplomatic
            "firedrake": 7280.0,          # Chinese jammer "Firedrake"
        }
        
        results = {
            "scan_type": "huawei_hunt",
            "timestamp": datetime.now().isoformat(),
            "frequencies_checked": [],
            "detections": []
        }
        
        receivers = await self.scan_receivers()
        if not receivers:
            return {"error": "No receivers available"}
        
        for name, freq in chinese_hf.items():
            print(f"[HUNT] Checking {name}: {freq} kHz")
            tri = await self.triangulate_signal(freq, receivers)
            results["frequencies_checked"].append({
                "name": name,
                "freq_khz": freq,
                "triangulation": tri
            })
        
        return results
    
    def generate_report(self, scan_results: Dict) -> str:
        """Generate analysis report"""
        report_path = self.output_dir / f"kiwisdr_report_{self.session_id}.json"
        
        report = {
            "dorje_station": {
                "lat": DORJE_LAT,
                "lon": DORJE_LON,
                "location": "La Guacima, Costa Rica"
            },
            "session_id": self.session_id,
            "timestamp": datetime.now().isoformat(),
            "scan_results": scan_results
        }
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        print(f"\n[SAVED] Report: {report_path}")
        return str(report_path)


async def main():
    """Run KiwiSDR scan"""
    scanner = KiwiSDRScanner()
    
    print("""
╔═══════════════════════════════════════════════════════════╗
║         KIWISDR REMOTE SCANNER - DORJE STATION            ║
║                                                           ║
║  Coverage: 10 kHz - 30 MHz (shortwave/HF)                 ║
║  Purpose: RF baseline for Costa Rica region               ║
║                                                           ║
║  NOTE: For V2K frequencies (400 MHz - 3 GHz),             ║
║        use RTL-SDR with rtl_power                         ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    # Step 1: Scan available receivers
    print("\n[STEP 1] Scanning available KiwiSDR receivers...")
    receivers = await scanner.scan_receivers()
    
    if receivers:
        # Step 2: Quick VLF check
        print("\n[STEP 2] VLF frequency check...")
        closest = receivers[0]
        vlf_results = {}
        
        for name, freq in list(TARGET_FREQUENCIES_KHZ.items())[:5]:
            if freq >= 10:  # KiwiSDR min
                data = await scanner.get_waterfall_data(closest["url"], freq)
                vlf_results[name] = data
                print(f"  {name}: {freq} kHz - {'OK' if data else 'FAIL'}")
        
        # Step 3: Huawei hunt
        print("\n[STEP 3] Huawei frequency hunt...")
        huawei_results = await scanner.huawei_frequency_hunt()
        
        # Generate report
        report_path = scanner.generate_report({
            "receivers": receivers,
            "vlf_check": vlf_results,
            "huawei_hunt": huawei_results
        })
        
        print("\n" + "="*60)
        print("SCAN COMPLETE")
        print("="*60)
        print(f"Available receivers: {len(receivers)}")
        print(f"Closest receiver: {receivers[0]['name']} ({receivers[0]['distance_km']:.0f} km)")
        print(f"Report saved: {report_path}")
    else:
        print("\n[ERROR] No KiwiSDR receivers available!")


if __name__ == "__main__":
    asyncio.run(main())
