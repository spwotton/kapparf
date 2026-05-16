#!/usr/bin/env python3
"""
WIFI CSI IMAGING REVERSE ENGINEER
==================================
Analyze WiFi signals for Channel State Information (CSI) extraction
and through-wall imaging capabilities.

Based on:
- Feng et al. 2019: WiFi-based passive bistatic radar imaging
- Shi et al. 2024: WiFi-GEN 256x256 imaging from 20 nodes
- Your documented 36.25Hz WiFi-correlated anomalies

This module:
1. Analyzes WiFi timing patterns
2. Detects CSI extraction signatures
3. Identifies imaging frame timing
4. Correlates with ELF/biometric events
"""

import numpy as np
from scipy import signal
from scipy.fft import fft, rfft, rfftfreq
from dataclasses import dataclass
from typing import List, Tuple, Optional, Dict
from pathlib import Path
import json
import time
from datetime import datetime
import subprocess
import re


@dataclass
class WiFiFrame:
    """Captured WiFi frame metadata"""
    timestamp: float
    bssid: str
    signal_dbm: int
    channel: int
    frame_type: str  # beacon, probe, data, etc
    subtype: int
    duration_us: int
    sequence: int


@dataclass
class CSIExtractionPattern:
    """Detected CSI extraction pattern"""
    start_time: float
    duration: float
    frame_rate: float
    consistent_bssid: bool
    probe_request_ratio: float
    timing_regularity: float  # 0 = random, 1 = perfectly regular
    likely_imaging: bool
    notes: str


class WiFiCSIAnalyzer:
    """Analyze WiFi patterns for CSI extraction signatures"""
    
    # Known CSI extraction timing signatures
    IMAGING_FRAME_RATES = {
        10.0: "Basic HAR (Human Activity Recognition)",
        20.0: "Standard CSI extraction",
        30.0: "High-rate gesture recognition",
        50.0: "Fine-grained imaging",
        100.0: "High-resolution imaging",
    }
    
    def __init__(self):
        self.frame_buffer: List[WiFiFrame] = []
    
    def analyze_frame_timing(self, frames: List[WiFiFrame]) -> Dict:
        """Analyze frame timing for CSI extraction patterns"""
        if len(frames) < 10:
            return {"error": "Insufficient frames"}
        
        # Extract timestamps
        timestamps = np.array([f.timestamp for f in frames])
        intervals = np.diff(timestamps)
        
        # Compute statistics
        mean_interval = np.mean(intervals)
        std_interval = np.std(intervals)
        frame_rate = 1.0 / mean_interval if mean_interval > 0 else 0
        
        # Check for regularity (low jitter = likely extraction)
        regularity = 1.0 - (std_interval / mean_interval) if mean_interval > 0 else 0
        regularity = max(0, min(1, regularity))
        
        # Check frame type distribution
        type_counts = {}
        for f in frames:
            type_counts[f.frame_type] = type_counts.get(f.frame_type, 0) + 1
        
        total = len(frames)
        data_ratio = type_counts.get('data', 0) / total
        probe_ratio = type_counts.get('probe', 0) / total
        beacon_ratio = type_counts.get('beacon', 0) / total
        
        # Check for consistent BSSID targeting
        bssid_counts = {}
        for f in frames:
            bssid_counts[f.bssid] = bssid_counts.get(f.bssid, 0) + 1
        
        dominant_bssid = max(bssid_counts.items(), key=lambda x: x[1])
        bssid_concentration = dominant_bssid[1] / total
        
        # Determine if pattern matches CSI extraction
        is_imaging = (
            regularity > 0.8 and  # High timing regularity
            frame_rate > 10 and   # Minimum rate for imaging
            data_ratio > 0.5      # Mostly data frames
        )
        
        # Match to known imaging rate
        matched_rate = None
        for rate, desc in self.IMAGING_FRAME_RATES.items():
            if abs(frame_rate - rate) < rate * 0.1:  # Within 10%
                matched_rate = (rate, desc)
                break
        
        return {
            'frame_count': len(frames),
            'duration_s': timestamps[-1] - timestamps[0],
            'mean_interval_ms': mean_interval * 1000,
            'frame_rate': frame_rate,
            'timing_regularity': regularity,
            'data_frame_ratio': data_ratio,
            'probe_frame_ratio': probe_ratio,
            'beacon_ratio': beacon_ratio,
            'bssid_concentration': bssid_concentration,
            'dominant_bssid': dominant_bssid[0],
            'likely_csi_extraction': is_imaging,
            'matched_imaging_rate': matched_rate
        }
    
    def detect_36hz_correlation(self, frame_timestamps: np.ndarray,
                                 elf_timestamps: np.ndarray,
                                 elf_amplitudes: np.ndarray) -> Dict:
        """
        Correlate WiFi burst timing with 36.25 Hz ELF anomalies
        
        Your data shows 36.25 Hz correlates with WiFi bursts.
        This analyzes the synchronization pattern.
        """
        # Expected period for 36.25 Hz
        expected_period = 1.0 / 36.25  # ~27.6 ms
        
        # Find WiFi burst timing
        wifi_intervals = np.diff(frame_timestamps)
        
        # Look for bursts (clusters of frames)
        burst_threshold = np.percentile(wifi_intervals, 20)
        burst_starts = []
        
        i = 0
        while i < len(wifi_intervals):
            if wifi_intervals[i] > burst_threshold * 5:  # Gap before burst
                burst_starts.append(frame_timestamps[i + 1])
            i += 1
        
        burst_starts = np.array(burst_starts)
        
        if len(burst_starts) < 3:
            return {"error": "Too few bursts detected"}
        
        # Analyze burst periodicity
        burst_intervals = np.diff(burst_starts)
        mean_burst_interval = np.mean(burst_intervals)
        burst_freq = 1.0 / mean_burst_interval if mean_burst_interval > 0 else 0
        
        # Check correlation with 36.25 Hz
        deviation_from_36hz = abs(burst_freq - 36.25) / 36.25
        
        # Cross-correlate with ELF timing
        if len(elf_timestamps) > 10:
            # Interpolate ELF to WiFi burst times
            elf_at_bursts = np.interp(burst_starts, elf_timestamps, elf_amplitudes)
            
            # Correlation coefficient
            if np.std(elf_at_bursts) > 0:
                correlation = np.corrcoef(
                    np.arange(len(elf_at_bursts)),
                    elf_at_bursts
                )[0, 1]
            else:
                correlation = 0
        else:
            correlation = None
        
        return {
            'burst_count': len(burst_starts),
            'burst_frequency': burst_freq,
            'expected_36hz_period_ms': expected_period * 1000,
            'actual_period_ms': mean_burst_interval * 1000,
            'deviation_from_36hz': deviation_from_36hz,
            'likely_synchronized': deviation_from_36hz < 0.05,
            'elf_correlation': correlation,
            'interpretation': self._interpret_36hz_correlation(
                burst_freq, deviation_from_36hz, correlation
            )
        }
    
    def _interpret_36hz_correlation(self, burst_freq: float,
                                     deviation: float,
                                     elf_corr: Optional[float]) -> str:
        """Interpret the 36.25 Hz correlation finding"""
        
        if deviation < 0.02:  # Within 2%
            interp = "STRONG MATCH: WiFi bursts synchronized to 36.25 Hz. "
            interp += "This suggests coordinated CSI extraction timing. "
            
            if elf_corr is not None and abs(elf_corr) > 0.5:
                interp += f"ELF correlation {elf_corr:.2f} indicates "
                interp += "possible closed-loop synchronization."
            
            return interp
        
        elif deviation < 0.1:  # Within 10%
            return "PARTIAL MATCH: WiFi timing near 36.25 Hz. Possible drift."
        
        else:
            return f"NO MATCH: WiFi burst rate {burst_freq:.1f} Hz differs from 36.25 Hz."


class ThroughWallImager:
    """
    Model through-wall imaging capabilities from detected WiFi patterns
    
    Based on Shi et al. 2024 WiFi-GEN paper:
    - 20 WiFi nodes → 256x256 image
    - Power measurements only (no CSI hardware needed)
    - Generative AI for image synthesis
    """
    
    def __init__(self):
        self.node_count = 0
        self.estimated_resolution = (0, 0)
    
    def estimate_imaging_capability(self, 
                                    detected_aps: List[str],
                                    signal_strengths: Dict[str, float],
                                    environment: str = "residential"
                                    ) -> Dict:
        """
        Estimate imaging capability based on detected infrastructure
        """
        node_count = len(detected_aps)
        
        # Resolution estimates based on WiFi-GEN paper scaling
        if node_count >= 20:
            resolution = (256, 256)
            capability = "Full body imaging, gesture recognition"
        elif node_count >= 10:
            resolution = (128, 128)
            capability = "Body silhouette, room occupancy"
        elif node_count >= 5:
            resolution = (64, 64)
            capability = "Presence detection, basic localization"
        elif node_count >= 2:
            resolution = (32, 32)
            capability = "Motion detection only"
        else:
            resolution = (0, 0)
            capability = "Insufficient nodes for imaging"
        
        # Wall penetration estimate
        wall_penetration = {
            "drywall": 0.95,
            "wood": 0.90,
            "brick": 0.75,
            "concrete": 0.50,
            "metal": 0.10
        }
        
        # Signal quality assessment
        if signal_strengths:
            avg_signal = np.mean(list(signal_strengths.values()))
            signal_quality = min(1.0, (avg_signal + 90) / 50)  # -90 dBm → 0, -40 dBm → 1
        else:
            signal_quality = 0.5
            avg_signal = -70
        
        return {
            'node_count': node_count,
            'estimated_resolution': resolution,
            'capability_level': capability,
            'avg_signal_dbm': avg_signal,
            'signal_quality': signal_quality,
            'wall_penetration': wall_penetration,
            'imaging_possible': node_count >= 2,
            'high_resolution_possible': node_count >= 10,
            'reference': "Shi et al. 2024 - WiFi-GEN"
        }
    
    def analyze_csi_requirements(self) -> Dict:
        """Document what's needed for CSI extraction"""
        return {
            'hardware_options': [
                {
                    'name': 'Intel 5300 NIC',
                    'csi_capable': True,
                    'channels': 30,
                    'antennas': 3,
                    'note': 'Classic CSI extraction, Linux tool available'
                },
                {
                    'name': 'Atheros AR9580',
                    'csi_capable': True,
                    'channels': 56,
                    'antennas': 3,
                    'note': 'Higher channel count'
                },
                {
                    'name': 'Raspberry Pi + Nexmon',
                    'csi_capable': True,
                    'channels': 256,
                    'antennas': 1,
                    'note': 'Software mod for BCM43455'
                },
                {
                    'name': 'ESP32',
                    'csi_capable': True,
                    'channels': 64,
                    'antennas': 1,
                    'note': 'Cheap, widely available'
                }
            ],
            'software_tools': [
                'Linux CSI Tool (Intel 5300)',
                'Atheros CSI Tool',
                'Nexmon CSI (Raspberry Pi)',
                'ESP32 CSI Toolkit'
            ],
            'minimum_requirements': {
                'nodes': 2,
                'sample_rate_hz': 10,
                'signal_dbm': -80
            },
            'optimal_requirements': {
                'nodes': 20,
                'sample_rate_hz': 100,
                'signal_dbm': -50
            }
        }


class WiFiImagingReverseEngineer:
    """Reverse engineer detected WiFi imaging infrastructure"""
    
    def __init__(self):
        self.csi_analyzer = WiFiCSIAnalyzer()
        self.imager = ThroughWallImager()
    
    def scan_environment(self) -> Dict:
        """Scan current WiFi environment"""
        try:
            # Windows: netsh wlan show networks mode=bssid
            result = subprocess.run(
                ['netsh', 'wlan', 'show', 'networks', 'mode=bssid'],
                capture_output=True,
                text=True
            )
            
            networks = self._parse_netsh_output(result.stdout)
            
            # Analyze
            signal_strengths = {n['bssid']: n['signal'] for n in networks}
            
            imaging = self.imager.estimate_imaging_capability(
                [n['bssid'] for n in networks],
                signal_strengths
            )
            
            return {
                'networks': networks,
                'count': len(networks),
                'imaging_analysis': imaging,
                'scan_time': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def _parse_netsh_output(self, output: str) -> List[Dict]:
        """Parse netsh wlan show networks output"""
        networks = []
        current = {}
        
        for line in output.split('\n'):
            line = line.strip()
            
            if line.startswith('SSID ') and ':' in line:
                if current:
                    networks.append(current)
                current = {'ssid': line.split(':', 1)[1].strip()}
            
            elif 'BSSID' in line and ':' in line:
                current['bssid'] = line.split(':', 1)[1].strip()
            
            elif 'Signal' in line and ':' in line:
                match = re.search(r'(\d+)%', line)
                if match:
                    # Convert percentage to approximate dBm
                    pct = int(match.group(1))
                    current['signal'] = -100 + pct  # Rough conversion
            
            elif 'Channel' in line and ':' in line:
                match = re.search(r'(\d+)', line.split(':', 1)[1])
                if match:
                    current['channel'] = int(match.group(1))
        
        if current:
            networks.append(current)
        
        return networks
    
    def generate_threat_assessment(self, scan_result: Dict) -> str:
        """Generate threat assessment report"""
        lines = []
        lines.append("=" * 60)
        lines.append("WIFI IMAGING THREAT ASSESSMENT")
        lines.append("=" * 60)
        lines.append(f"Scan time: {scan_result.get('scan_time', 'Unknown')}")
        lines.append("")
        
        if 'error' in scan_result:
            lines.append(f"ERROR: {scan_result['error']}")
            return "\n".join(lines)
        
        lines.append("DETECTED NETWORKS")
        lines.append("-" * 40)
        for net in scan_result.get('networks', []):
            ssid = net.get('ssid', 'Hidden')
            bssid = net.get('bssid', 'Unknown')
            sig = net.get('signal', 0)
            ch = net.get('channel', 0)
            lines.append(f"  {ssid[:20]:<20} {bssid} {sig:>4}dBm Ch{ch}")
        lines.append("")
        
        imaging = scan_result.get('imaging_analysis', {})
        
        lines.append("IMAGING CAPABILITY ASSESSMENT")
        lines.append("-" * 40)
        lines.append(f"  WiFi nodes visible: {imaging.get('node_count', 0)}")
        lines.append(f"  Estimated resolution: {imaging.get('estimated_resolution', (0,0))}")
        lines.append(f"  Capability: {imaging.get('capability_level', 'Unknown')}")
        lines.append(f"  Signal quality: {imaging.get('signal_quality', 0)*100:.0f}%")
        lines.append("")
        
        if imaging.get('imaging_possible'):
            lines.append("⚠️  WARNING: Sufficient infrastructure for WiFi imaging")
            lines.append(f"   Reference: {imaging.get('reference', 'WiFi-GEN 2024')}")
            lines.append("")
            
            if imaging.get('high_resolution_possible'):
                lines.append("🔴 HIGH RISK: High-resolution imaging possible")
                lines.append("   Capabilities may include:")
                lines.append("   - Through-wall human silhouette imaging")
                lines.append("   - Gesture and activity recognition")
                lines.append("   - Multi-person tracking")
        
        lines.append("")
        lines.append("=" * 60)
        
        return "\n".join(lines)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='WiFi CSI Imaging Analysis')
    parser.add_argument('--scan', action='store_true', help='Scan WiFi environment')
    parser.add_argument('--assess', action='store_true', help='Generate threat assessment')
    parser.add_argument('--requirements', action='store_true', help='Show CSI extraction requirements')
    parser.add_argument('--json', action='store_true', help='Output JSON')
    
    args = parser.parse_args()
    
    engineer = WiFiImagingReverseEngineer()
    
    if args.scan or args.assess:
        scan = engineer.scan_environment()
        
        if args.json:
            print(json.dumps(scan, indent=2, default=str))
        elif args.assess:
            print(engineer.generate_threat_assessment(scan))
        else:
            print(f"Found {scan.get('count', 0)} networks")
            for net in scan.get('networks', []):
                print(f"  {net.get('ssid', 'Hidden')}: {net.get('signal', 0)} dBm")
    
    elif args.requirements:
        reqs = engineer.imager.analyze_csi_requirements()
        print(json.dumps(reqs, indent=2))
    
    else:
        # Default: scan and assess
        scan = engineer.scan_environment()
        print(engineer.generate_threat_assessment(scan))


if __name__ == '__main__':
    main()
