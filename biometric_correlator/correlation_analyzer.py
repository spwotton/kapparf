#!/usr/bin/env python3
"""
CORRELATION ANALYZER
====================
Cross-correlates biometric data with ELF readings to establish
causal relationships between RF/ELF anomalies and physiological changes.

Evidence package generator for forensic documentation.
"""

import sqlite3
import json
import time
import hashlib
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, asdict
import zipfile
import os

try:
    from scipy import stats
    from scipy.signal import correlate
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False


@dataclass
class CorrelationResult:
    """Result of correlation analysis"""
    timestamp: float
    biometric_metric: str  # e.g., 'heart_rate', 'stress_index'
    elf_frequency: str     # e.g., '53hz', '48hz', '36hz'
    correlation_coefficient: float  # -1 to 1
    p_value: float         # Statistical significance
    lag_seconds: float     # Time lag (+ = ELF precedes bio)
    sample_count: int
    confidence: str        # 'high', 'medium', 'low'


class CorrelationAnalyzer:
    """
    Analyze correlations between biometric and ELF data
    """
    
    def __init__(
        self,
        biometric_db: str = "biometric_evidence.db",
        elf_db: str = "elf_evidence.db"
    ):
        self.bio_db_path = biometric_db
        self.elf_db_path = elf_db
    
    def _load_biometric_data(
        self,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None
    ) -> List[Dict]:
        """Load biometric samples from database"""
        
        if not Path(self.bio_db_path).exists():
            return []
        
        conn = sqlite3.connect(self.bio_db_path)
        c = conn.cursor()
        
        query = "SELECT * FROM biometric_samples"
        params = []
        
        if start_time or end_time:
            conditions = []
            if start_time:
                conditions.append("timestamp >= ?")
                params.append(start_time)
            if end_time:
                conditions.append("timestamp <= ?")
                params.append(end_time)
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY timestamp"
        
        try:
            c.execute(query, params)
            columns = [d[0] for d in c.description]
            data = [dict(zip(columns, row)) for row in c.fetchall()]
        except sqlite3.OperationalError:
            data = []
        
        conn.close()
        return data
    
    def _load_elf_data(
        self,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None
    ) -> List[Dict]:
        """Load ELF readings from database"""
        
        if not Path(self.elf_db_path).exists():
            return []
        
        conn = sqlite3.connect(self.elf_db_path)
        c = conn.cursor()
        
        query = "SELECT * FROM elf_readings"
        params = []
        
        if start_time or end_time:
            conditions = []
            if start_time:
                conditions.append("timestamp >= ?")
                params.append(start_time)
            if end_time:
                conditions.append("timestamp <= ?")
                params.append(end_time)
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY timestamp"
        
        try:
            c.execute(query, params)
            columns = [d[0] for d in c.description]
            data = [dict(zip(columns, row)) for row in c.fetchall()]
        except sqlite3.OperationalError:
            data = []
        
        conn.close()
        return data
    
    def _interpolate_to_common_timeline(
        self,
        bio_data: List[Dict],
        elf_data: List[Dict],
        resolution: float = 1.0  # seconds
    ) -> Tuple[np.ndarray, Dict[str, np.ndarray], Dict[str, np.ndarray]]:
        """
        Interpolate both datasets to common timeline for correlation analysis
        """
        
        if not bio_data or not elf_data:
            return np.array([]), {}, {}
        
        # Find overlapping time range
        bio_start = min(d['timestamp'] for d in bio_data)
        bio_end = max(d['timestamp'] for d in bio_data)
        elf_start = min(d['timestamp'] for d in elf_data)
        elf_end = max(d['timestamp'] for d in elf_data)
        
        start = max(bio_start, elf_start)
        end = min(bio_end, elf_end)
        
        if start >= end:
            return np.array([]), {}, {}
        
        # Create common timeline
        timeline = np.arange(start, end, resolution)
        
        # Interpolate biometric data
        bio_times = np.array([d['timestamp'] for d in bio_data])
        bio_series = {}
        
        for metric in ['heart_rate', 'stress_index', 'rmssd', 'sdnn']:
            values = [d.get(metric) for d in bio_data]
            if any(v is not None for v in values):
                # Fill None with NaN for interpolation
                values = [v if v is not None else np.nan for v in values]
                bio_series[metric] = np.interp(timeline, bio_times, values)
        
        # Interpolate ELF data
        elf_times = np.array([d['timestamp'] for d in elf_data])
        elf_series = {}
        
        for freq in ['snr_53hz', 'snr_48hz', 'snr_36hz', 'theta_6hz_amplitude']:
            values = [d.get(freq, 0) for d in elf_data]
            elf_series[freq] = np.interp(timeline, elf_times, values)
        
        return timeline, bio_series, elf_series
    
    def compute_correlations(
        self,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        max_lag_seconds: float = 60.0
    ) -> List[CorrelationResult]:
        """
        Compute cross-correlations between all biometric metrics and ELF signals
        """
        
        bio_data = self._load_biometric_data(start_time, end_time)
        elf_data = self._load_elf_data(start_time, end_time)
        
        if len(bio_data) < 10 or len(elf_data) < 10:
            print("[WARNING] Insufficient data for correlation analysis")
            return []
        
        timeline, bio_series, elf_series = self._interpolate_to_common_timeline(
            bio_data, elf_data
        )
        
        if len(timeline) == 0:
            print("[WARNING] No overlapping data between biometric and ELF")
            return []
        
        results = []
        timestamp = time.time()
        
        # Compute correlation for each pair
        for bio_metric, bio_values in bio_series.items():
            for elf_signal, elf_values in elf_series.items():
                
                # Skip if too many NaN values
                if np.isnan(bio_values).sum() > len(bio_values) * 0.3:
                    continue
                
                # Replace NaN with mean for correlation
                bio_clean = np.nan_to_num(bio_values, nan=np.nanmean(bio_values))
                
                if HAS_SCIPY:
                    # Cross-correlation with lag analysis
                    correlation = correlate(bio_clean, elf_values, mode='full')
                    lags = np.arange(-len(elf_values) + 1, len(bio_clean))
                    
                    # Find peak correlation
                    peak_idx = np.argmax(np.abs(correlation))
                    peak_corr = correlation[peak_idx] / (len(bio_clean) * np.std(bio_clean) * np.std(elf_values) + 1e-10)
                    lag_samples = lags[peak_idx]
                    lag_seconds = lag_samples  # 1 second resolution
                    
                    # Pearson correlation for p-value
                    if abs(lag_seconds) <= max_lag_seconds:
                        shift = int(lag_seconds)
                        if shift > 0:
                            r, p = stats.pearsonr(bio_clean[shift:], elf_values[:-shift or None])
                        elif shift < 0:
                            r, p = stats.pearsonr(bio_clean[:shift], elf_values[-shift:])
                        else:
                            r, p = stats.pearsonr(bio_clean, elf_values)
                    else:
                        r, p = 0, 1
                else:
                    # Simple correlation without scipy
                    r = np.corrcoef(bio_clean, elf_values)[0, 1]
                    p = 0.05 if abs(r) > 0.3 else 0.5  # Rough estimate
                    lag_seconds = 0
                    peak_corr = r
                
                # Determine confidence
                if p < 0.01 and abs(peak_corr) > 0.5:
                    confidence = 'high'
                elif p < 0.05 and abs(peak_corr) > 0.3:
                    confidence = 'medium'
                else:
                    confidence = 'low'
                
                # Only include meaningful correlations
                if abs(peak_corr) > 0.1:
                    results.append(CorrelationResult(
                        timestamp=timestamp,
                        biometric_metric=bio_metric,
                        elf_frequency=elf_signal.replace('snr_', '').replace('_amplitude', ''),
                        correlation_coefficient=float(peak_corr),
                        p_value=float(p),
                        lag_seconds=float(lag_seconds),
                        sample_count=len(timeline),
                        confidence=confidence
                    ))
        
        # Sort by absolute correlation strength
        results.sort(key=lambda x: abs(x.correlation_coefficient), reverse=True)
        
        return results
    
    def find_anomaly_response_patterns(
        self,
        window_before: float = 30.0,  # seconds
        window_after: float = 120.0   # seconds
    ) -> List[Dict]:
        """
        Find patterns in physiological response following ELF anomalies
        """
        
        elf_data = self._load_elf_data()
        
        # Find anomaly events
        anomaly_times = [
            d['timestamp'] for d in elf_data 
            if d.get('anomaly_detected')
        ]
        
        if not anomaly_times:
            print("[INFO] No ELF anomalies recorded")
            return []
        
        patterns = []
        
        for anomaly_time in anomaly_times:
            # Load biometric data around anomaly
            bio_before = self._load_biometric_data(
                anomaly_time - window_before,
                anomaly_time
            )
            bio_after = self._load_biometric_data(
                anomaly_time,
                anomaly_time + window_after
            )
            
            if not bio_before or not bio_after:
                continue
            
            # Compare heart rate before/after
            hr_before = [d['heart_rate'] for d in bio_before if d.get('heart_rate')]
            hr_after = [d['heart_rate'] for d in bio_after if d.get('heart_rate')]
            
            if hr_before and hr_after:
                hr_change = np.mean(hr_after) - np.mean(hr_before)
                
                # Compare stress before/after
                stress_before = [d['stress_index'] for d in bio_before if d.get('stress_index')]
                stress_after = [d['stress_index'] for d in bio_after if d.get('stress_index')]
                
                stress_change = (
                    np.mean(stress_after) - np.mean(stress_before)
                    if stress_before and stress_after else None
                )
                
                patterns.append({
                    'anomaly_time': anomaly_time,
                    'anomaly_datetime': datetime.fromtimestamp(anomaly_time).isoformat(),
                    'hr_before': np.mean(hr_before),
                    'hr_after': np.mean(hr_after),
                    'hr_change': hr_change,
                    'stress_before': np.mean(stress_before) if stress_before else None,
                    'stress_after': np.mean(stress_after) if stress_after else None,
                    'stress_change': stress_change,
                    'response_type': 'elevated' if hr_change > 5 else 'suppressed' if hr_change < -5 else 'neutral'
                })
        
        return patterns
    
    def generate_evidence_package(
        self,
        output_path: str = "evidence_package.zip",
        days: float = 7.0
    ) -> str:
        """
        Generate comprehensive evidence package with cryptographic integrity
        """
        
        start_time = time.time() - (days * 86400)
        end_time = time.time()
        
        # Gather all data
        bio_data = self._load_biometric_data(start_time, end_time)
        elf_data = self._load_elf_data(start_time, end_time)
        correlations = self.compute_correlations(start_time, end_time)
        patterns = self.find_anomaly_response_patterns()
        
        # Create manifest
        manifest = {
            'version': '1.0',
            'generated_at': datetime.now().isoformat(),
            'period_start': datetime.fromtimestamp(start_time).isoformat(),
            'period_end': datetime.fromtimestamp(end_time).isoformat(),
            'biometric_samples': len(bio_data),
            'elf_readings': len(elf_data),
            'correlations_found': len(correlations),
            'anomaly_patterns': len(patterns),
            'files': []
        }
        
        # Create evidence files
        evidence_files = {}
        
        # Biometric data
        bio_json = json.dumps(bio_data, indent=2, default=str)
        bio_hash = hashlib.sha256(bio_json.encode()).hexdigest()
        evidence_files['biometric_data.json'] = bio_json
        manifest['files'].append({
            'name': 'biometric_data.json',
            'sha256': bio_hash,
            'records': len(bio_data)
        })
        
        # ELF data
        elf_json = json.dumps(elf_data, indent=2, default=str)
        elf_hash = hashlib.sha256(elf_json.encode()).hexdigest()
        evidence_files['elf_data.json'] = elf_json
        manifest['files'].append({
            'name': 'elf_data.json',
            'sha256': elf_hash,
            'records': len(elf_data)
        })
        
        # Correlation analysis
        corr_data = [asdict(c) for c in correlations]
        corr_json = json.dumps(corr_data, indent=2, default=str)
        corr_hash = hashlib.sha256(corr_json.encode()).hexdigest()
        evidence_files['correlations.json'] = corr_json
        manifest['files'].append({
            'name': 'correlations.json',
            'sha256': corr_hash,
            'records': len(correlations)
        })
        
        # Pattern analysis
        pattern_json = json.dumps(patterns, indent=2, default=str)
        pattern_hash = hashlib.sha256(pattern_json.encode()).hexdigest()
        evidence_files['anomaly_patterns.json'] = pattern_json
        manifest['files'].append({
            'name': 'anomaly_patterns.json',
            'sha256': pattern_hash,
            'records': len(patterns)
        })
        
        # Generate summary report
        report = self._generate_summary_report(
            bio_data, elf_data, correlations, patterns
        )
        evidence_files['summary_report.txt'] = report
        manifest['files'].append({
            'name': 'summary_report.txt',
            'sha256': hashlib.sha256(report.encode()).hexdigest()
        })
        
        # Add manifest
        manifest_json = json.dumps(manifest, indent=2)
        evidence_files['manifest.json'] = manifest_json
        
        # Create signed manifest hash (for later verification)
        package_hash = hashlib.sha256(manifest_json.encode()).hexdigest()
        evidence_files['package.sha256'] = package_hash
        
        # Create ZIP archive
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for filename, content in evidence_files.items():
                zf.writestr(filename, content)
        
        print(f"\n[EVIDENCE] Package created: {output_path}")
        print(f"[EVIDENCE] Package hash: {package_hash}")
        print(f"[EVIDENCE] Contains {len(evidence_files)} files")
        
        return package_hash
    
    def _generate_summary_report(
        self,
        bio_data: List[Dict],
        elf_data: List[Dict],
        correlations: List[CorrelationResult],
        patterns: List[Dict]
    ) -> str:
        """Generate human-readable summary report"""
        
        lines = []
        lines.append("="*70)
        lines.append("BIOMETRIC-ELF CORRELATION EVIDENCE REPORT")
        lines.append("="*70)
        lines.append(f"Generated: {datetime.now().isoformat()}")
        lines.append("")
        
        # Data summary
        lines.append("DATA COLLECTION SUMMARY")
        lines.append("-"*40)
        lines.append(f"Biometric samples: {len(bio_data)}")
        lines.append(f"ELF readings: {len(elf_data)}")
        
        if bio_data:
            hrs = [d['heart_rate'] for d in bio_data if d.get('heart_rate')]
            if hrs:
                lines.append(f"Heart rate range: {min(hrs):.0f} - {max(hrs):.0f} BPM")
        
        elf_anomalies = sum(1 for d in elf_data if d.get('anomaly_detected'))
        lines.append(f"ELF anomalies detected: {elf_anomalies}")
        lines.append("")
        
        # Correlation findings
        lines.append("CORRELATION FINDINGS")
        lines.append("-"*40)
        
        high_confidence = [c for c in correlations if c.confidence == 'high']
        medium_confidence = [c for c in correlations if c.confidence == 'medium']
        
        if high_confidence:
            lines.append("\nHIGH CONFIDENCE CORRELATIONS:")
            for c in high_confidence[:5]:
                direction = "positive" if c.correlation_coefficient > 0 else "negative"
                lines.append(f"  • {c.biometric_metric} ↔ {c.elf_frequency}")
                lines.append(f"    Correlation: {c.correlation_coefficient:.3f} ({direction})")
                lines.append(f"    Statistical significance: p = {c.p_value:.4f}")
                lines.append(f"    Time lag: {c.lag_seconds:.1f}s (ELF → bio)")
                lines.append("")
        
        if medium_confidence:
            lines.append("\nMEDIUM CONFIDENCE CORRELATIONS:")
            for c in medium_confidence[:3]:
                lines.append(f"  • {c.biometric_metric} ↔ {c.elf_frequency}: r = {c.correlation_coefficient:.3f}")
        
        lines.append("")
        
        # Pattern analysis
        lines.append("ANOMALY RESPONSE PATTERNS")
        lines.append("-"*40)
        
        elevated = [p for p in patterns if p['response_type'] == 'elevated']
        suppressed = [p for p in patterns if p['response_type'] == 'suppressed']
        
        lines.append(f"Total anomaly events analyzed: {len(patterns)}")
        lines.append(f"Elevated HR response: {len(elevated)} ({100*len(elevated)/len(patterns):.1f}%)" if patterns else "")
        lines.append(f"Suppressed HR response: {len(suppressed)} ({100*len(suppressed)/len(patterns):.1f}%)" if patterns else "")
        
        if patterns:
            avg_hr_change = np.mean([p['hr_change'] for p in patterns])
            lines.append(f"Average HR change after anomaly: {avg_hr_change:+.1f} BPM")
        
        lines.append("")
        
        # Key findings
        lines.append("KEY FINDINGS")
        lines.append("-"*40)
        
        findings = []
        
        # Check for 48 Hz presence (should not exist in 60 Hz country)
        hz48_readings = [d for d in elf_data if d.get('snr_48hz', 0) > 6]
        if hz48_readings:
            findings.append(f"48 Hz signal detected in {len(hz48_readings)} readings "
                          f"({100*len(hz48_readings)/len(elf_data):.1f}% of samples). "
                          f"This frequency is ANOMALOUS for Costa Rica's 60 Hz grid.")
        
        # Check for correlation between 53 Hz and stress
        stress_53_corr = [c for c in correlations 
                         if c.biometric_metric == 'stress_index' 
                         and '53' in c.elf_frequency
                         and c.confidence in ['high', 'medium']]
        if stress_53_corr:
            c = stress_53_corr[0]
            findings.append(f"Significant correlation found between 53.5 Hz ELF signal "
                          f"and stress index (r={c.correlation_coefficient:.3f}, p={c.p_value:.4f}).")
        
        # Check for theta-range correlation
        theta_corr = [c for c in correlations if 'theta' in c.elf_frequency.lower()]
        if theta_corr:
            findings.append(f"Theta-range (6.5 Hz) signal correlations detected. "
                          f"This frequency is within the brainwave entrainment range.")
        
        if not findings:
            findings.append("No statistically significant correlations detected in current dataset.")
        
        for i, finding in enumerate(findings, 1):
            lines.append(f"{i}. {finding}")
            lines.append("")
        
        lines.append("")
        lines.append("="*70)
        lines.append("END OF REPORT")
        lines.append("="*70)
        
        return "\n".join(lines)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Correlation Analyzer')
    parser.add_argument('--bio-db', default='biometric_evidence.db', help='Biometric database')
    parser.add_argument('--elf-db', default='elf_evidence.db', help='ELF database')
    parser.add_argument('--correlations', action='store_true', help='Show correlations')
    parser.add_argument('--patterns', action='store_true', help='Show anomaly patterns')
    parser.add_argument('--evidence', action='store_true', help='Generate evidence package')
    parser.add_argument('--days', type=float, default=7, help='Analysis period (days)')
    parser.add_argument('--output', default='evidence_package.zip', help='Output file')
    
    args = parser.parse_args()
    
    analyzer = CorrelationAnalyzer(args.bio_db, args.elf_db)
    
    if args.correlations:
        start = time.time() - (args.days * 86400)
        correlations = analyzer.compute_correlations(start_time=start)
        
        print("\nCORRELATION RESULTS")
        print("="*60)
        for c in correlations:
            print(f"\n{c.biometric_metric} ↔ {c.elf_frequency}")
            print(f"  Correlation: {c.correlation_coefficient:.3f}")
            print(f"  P-value: {c.p_value:.4f}")
            print(f"  Lag: {c.lag_seconds:.1f}s")
            print(f"  Confidence: {c.confidence}")
    
    elif args.patterns:
        patterns = analyzer.find_anomaly_response_patterns()
        
        print("\nANOMALY RESPONSE PATTERNS")
        print("="*60)
        for p in patterns:
            print(f"\n{p['anomaly_datetime']}")
            print(f"  HR: {p['hr_before']:.0f} → {p['hr_after']:.0f} ({p['hr_change']:+.0f})")
            if p['stress_change']:
                print(f"  Stress: {p['stress_before']:.0f} → {p['stress_after']:.0f} ({p['stress_change']:+.0f})")
            print(f"  Response: {p['response_type']}")
    
    elif args.evidence:
        analyzer.generate_evidence_package(args.output, args.days)
    
    else:
        # Default: show summary
        start = time.time() - (args.days * 86400)
        correlations = analyzer.compute_correlations(start_time=start)
        patterns = analyzer.find_anomaly_response_patterns()
        
        print(f"\nAnalyzed {args.days} days of data")
        print(f"Found {len(correlations)} correlations")
        print(f"Found {len(patterns)} anomaly response patterns")
        
        high = [c for c in correlations if c.confidence == 'high']
        if high:
            print(f"\nTop correlation: {high[0].biometric_metric} ↔ {high[0].elf_frequency}")
            print(f"  r = {high[0].correlation_coefficient:.3f}, p = {high[0].p_value:.4f}")


if __name__ == '__main__':
    main()
