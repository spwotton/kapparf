#!/usr/bin/env python3
"""
HISTORICAL RF CORRELATION ENGINE
================================
Correlates current RF observations with historical patterns and context.

Historical Sources:
1. William Eitel (1900s) - Morse code timing, T/53 patterns
2. Funkschau 1968 - German tube electronics, capacitive proximity
3. Hector Mora - 180W HF radio transceiver (Costa Rica)
4. KiwiSDR TI0RC - Radio Club Costa Rica (~20km from DORJE_STATION)

The T/53 Theory:
- Base period T ≈ 6.27 seconds (rotational period)
- Sub-sample duration: T/53 ≈ 0.118 seconds
- Morse dot = 1 unit (0.118s)
- Morse dash = 3 units (0.354s)
- Word gap = 7 units (0.826s)

Author: OMEGA PROTOCOL
Date: January 2026
"""

import numpy as np
from scipy import signal
from scipy.fft import fft, rfft, rfftfreq
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional, Any
from pathlib import Path
from datetime import datetime
import json
from collections import defaultdict

# ==============================================================================
# CONSTANTS
# ==============================================================================

# T/53 Morse Timing Constants
T_BASE = 6.27  # Base rotational period (seconds)
T_53 = T_BASE / 53  # ≈ 0.118 seconds

# Morse Code Dictionary
MORSE_CODE = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
    '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
    '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
    '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
    '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
    '--..': 'Z', '.----': '1', '..---': '2', '...--': '3',
    '....-': '4', '.....': '5', '-....': '6', '--...': '7',
    '---..': '8', '----.': '9', '-----': '0'
}

# KiwiSDR Target Frequencies (from CR_KIWI_SCAN.py)
KIWI_FREQUENCIES = {
    # VLF Stations (10-30 kHz) - military/navigation
    "NAA_Cutler": 24000,        # US Navy, Maine
    "NML_La_Moure": 25200,      # US Navy, North Dakota  
    "NAU_Aguada": 40800,        # US Navy, Puerto Rico (closest to CR!)
    "NPM_Hawaii": 21400,        # US Navy, Hawaii
    
    # LF Time Signals
    "WWVB": 60000,              # NIST time signal
    
    # HF Chinese stations to monitor
    "Firedrake_6900": 6900000,  # Chinese jamming frequency
    "Firedrake_7280": 7280000,
    "CNR1_6175": 6175000,       # China National Radio
    "CNR1_9580": 9580000,
    "CRI_9790": 9790000,        # China Radio International
    
    # 53 Hz harmonics in KiwiSDR range
    "53Hz_x200": 10600,         # 53 * 200 = 10,600 Hz
    "53Hz_x250": 13250,         # 53 * 250 = 13,250 Hz
    "53Hz_x500": 26500,         # 53 * 500 = 26,500 Hz
    
    # 7.83 Hz (Schumann) harmonics
    "Schumann_x1500": 11745,    # 7.83 * 1500 ≈ 11,745 Hz
    "Schumann_x2000": 15660,    # 7.83 * 2000 ≈ 15,660 Hz
    
    # Russian navigation
    "VLF_Alpha": 11905,         # Russian Alpha nav
    "VLF_Omega": 10200,         # Omega (discontinued but freq still used)
}

# Funkschau 1968 Context
FUNKSCHAU_1968_CONTEXT = {
    "issues": ["Funkschau-1968-17", "Funkschau-1968-20"],
    "publication": "Franzis-Verlag, München",
    "date": "September 1968",
    "topics": [
        "Phasenmessungen mit dem Oszillografen",
        "Kapazitive Annäherungsschalter",  # Capacitive proximity switches
        "Beat-Elektronik",  # Beat electronics
        "Kompatible AM-Demodulationsverfahren",
        "Z-Dioden integration",
        "Permacolor Farbbildröhren"  # Color CRT tubes
    ],
    "relevance": "Analog surveillance methodology - capacitive proximity = through-wall detection"
}

# William Eitel Context
WILLIAM_EITEL_CONTEXT = {
    "era": "1900s",
    "contribution": "Vacuum tube development, Eitel-McCullough (Eimac)",
    "relevance": "Morse code timing precision, RF power amplification",
    "pattern_type": "T/53 rotational timing",
    "note": "Eitel tubes used in early radar and surveillance equipment"
}

# Hector Mora Context
HECTOR_MORA_CONTEXT = {
    "equipment": "180W HF radio transceiver",
    "origin": "China (purchased online with public review)",
    "location": "Costa Rica (SETECOM S.A.)",
    "frequency_range": "1.8 - 30 MHz (HF amateur bands)",
    "relevance": "Local RF environment baseline, SIGINT vector",
    "note": "HF capable of ionospheric skip for covert long-range comms",
    "osint": "Hector Mora Marin left product review on Chinese HF radio - 180W model",
    "employer": "SETECOM S.A. (DSE certified technician)",
    "aliases": ["HMORA67", "H Mora", "Hector Mora M"]
}


# ==============================================================================
# DATA STRUCTURES
# ==============================================================================

@dataclass
class HistoricalPattern:
    """A pattern from historical RF analysis"""
    source: str
    pattern_type: str
    frequency_hz: float
    timing_signature: List[float]
    confidence: float
    first_observed: datetime
    notes: str


@dataclass
class MorseSequence:
    """Decoded Morse code sequence"""
    raw_timing: List[float]
    symbols: str  # dots and dashes
    decoded_text: str
    confidence: float
    t53_correlation: float


@dataclass
class RFCorrelation:
    """Correlation between current and historical RF patterns"""
    current_pattern: np.ndarray
    historical_source: str
    correlation_coefficient: float
    matched_frequencies: List[float]
    significance: str
    timestamp: datetime


# ==============================================================================
# PATTERN DETECTORS
# ==============================================================================

class T53PatternDetector:
    """
    Detect T/53 ≈ 0.118s timing patterns in RF data
    
    Based on pcap_morse_decoder.py theory:
    - Dot (dit) = 1 unit = 0.118s
    - Dash (dah) = 3 units = 0.354s
    - Letter gap = 3 units
    - Word gap = 7 units = 0.826s
    """
    
    TOLERANCE = 0.02  # 20ms timing tolerance
    
    def __init__(self):
        self.sequences: List[MorseSequence] = []
    
    def analyze_timing(self, deltas: np.ndarray) -> Dict[str, Any]:
        """Analyze inter-event timing for T/53 patterns"""
        results = {
            'dot_matches': 0,
            'dash_matches': 0,
            'word_gap_matches': 0,
            'total_events': len(deltas) + 1,
            'harmonics': defaultdict(int),
            'sequence': [],
            't53_score': 0.0
        }
        
        if len(deltas) == 0:
            return results
        
        for delta in deltas:
            ratio = delta / T_53
            
            if abs(ratio - 1.0) < self.TOLERANCE * 10:  # dot
                results['dot_matches'] += 1
                results['sequence'].append('.')
                results['harmonics'][1] += 1
            elif abs(ratio - 3.0) < self.TOLERANCE * 10:  # dash
                results['dash_matches'] += 1
                results['sequence'].append('-')
                results['harmonics'][3] += 1
            elif abs(ratio - 7.0) < self.TOLERANCE * 10:  # word gap
                results['word_gap_matches'] += 1
                results['sequence'].append(' ')
                results['harmonics'][7] += 1
            else:
                # Check for any harmonic
                closest = round(ratio)
                if closest > 0 and abs(ratio - closest) < 0.5:
                    results['harmonics'][closest] += 1
        
        # Calculate T/53 score (how well the timing matches Morse code)
        morse_matches = results['dot_matches'] + results['dash_matches'] + results['word_gap_matches']
        if len(deltas) > 0:
            results['t53_score'] = morse_matches / len(deltas)
        
        return results
    
    def decode_sequence(self, timing_results: Dict) -> Optional[MorseSequence]:
        """Attempt to decode Morse from timing pattern"""
        sequence_str = ''.join(timing_results['sequence'])
        
        if len(sequence_str) < 3:
            return None
        
        # Split into letters by spaces or gaps
        words = sequence_str.split('   ')  # Word gap = space
        decoded = []
        
        for word in words:
            letters = word.split(' ')  # Letter gap = single space
            for letter in letters:
                if letter in MORSE_CODE:
                    decoded.append(MORSE_CODE[letter])
            decoded.append(' ')
        
        decoded_text = ''.join(decoded).strip()
        
        return MorseSequence(
            raw_timing=timing_results.get('raw_deltas', []),
            symbols=sequence_str,
            decoded_text=decoded_text,
            confidence=timing_results['t53_score'],
            t53_correlation=timing_results['t53_score']
        )


class TubeElectronicsDetector:
    """
    Detect signatures consistent with vintage tube electronics
    
    Based on Funkschau 1968 articles:
    - Capacitive proximity switches
    - Beat-frequency oscillators
    - AM demodulation patterns
    """
    
    # Tube heater harmonics (typically 50/60Hz based)
    HEATER_FREQUENCIES = [50, 60, 100, 120, 150, 180]
    
    # Beat frequency oscillator signatures
    BFO_FREQUENCIES = [455000, 500000, 1000000]  # Common IF frequencies
    
    def __init__(self):
        self.detected_signatures: List[HistoricalPattern] = []
    
    def analyze_spectrum(self, spectrum: np.ndarray, sample_rate: float) -> Dict[str, Any]:
        """Analyze spectrum for tube electronics signatures"""
        freqs = rfftfreq(len(spectrum) * 2 - 1, 1/sample_rate)
        
        results = {
            'heater_hum_score': 0.0,
            'bfo_score': 0.0,
            'capacitive_score': 0.0,
            'total_score': 0.0,
            'detected_frequencies': []
        }
        
        if len(spectrum) == 0:
            return results
        
        noise_floor = np.median(np.abs(spectrum))
        
        # Check heater hum harmonics
        for freq in self.HEATER_FREQUENCIES:
            idx = np.argmin(np.abs(freqs - freq))
            if idx < len(spectrum) and np.abs(spectrum[idx]) > noise_floor * 3:
                results['heater_hum_score'] += 0.15
                results['detected_frequencies'].append(freq)
        
        # Look for AM demodulation artifacts
        # Typical AM IF = 455 kHz, look for lower harmonics
        for freq in [455, 910, 1365]:  # IF harmonics
            idx = np.argmin(np.abs(freqs - freq))
            if idx < len(spectrum) and np.abs(spectrum[idx]) > noise_floor * 2:
                results['bfo_score'] += 0.1
                results['detected_frequencies'].append(freq)
        
        # Capacitive proximity switch frequency range (typically 1-10 MHz oscillator)
        # Look for unstable oscillation signatures
        cap_range = (freqs > 100) & (freqs < 10000)
        if np.any(cap_range):
            cap_spectrum = np.abs(spectrum[cap_range[:len(spectrum)]])
            # High variance in this range suggests capacitive modulation
            if np.std(cap_spectrum) / np.mean(cap_spectrum) > 0.5:
                results['capacitive_score'] = 0.3
        
        results['total_score'] = min(1.0, 
            results['heater_hum_score'] + 
            results['bfo_score'] + 
            results['capacitive_score']
        )
        
        return results


class KiwiSDRCorrelator:
    """
    Correlate with KiwiSDR TI0RC observations
    
    Radio Club Costa Rica, ~20km from observation point
    Frequency range: 10 kHz - 30 MHz
    """
    
    def __init__(self, kiwi_host: str = "ti0rc.proxy.kiwisdr.com"):
        self.host = kiwi_host
        self.port = 8073
        self.captures: List[Dict] = []
    
    def check_frequency(self, freq_hz: float) -> Optional[str]:
        """Check if frequency matches a known monitored station"""
        for name, target_freq in KIWI_FREQUENCIES.items():
            if abs(freq_hz - target_freq) < 100:  # 100 Hz tolerance
                return name
        return None
    
    def correlate_spectrum(self, spectrum: np.ndarray, freqs: np.ndarray) -> List[Dict]:
        """Find matches with monitored frequencies"""
        matches = []
        
        for name, target_freq in KIWI_FREQUENCIES.items():
            if target_freq < freqs[-1]:  # Within our frequency range
                idx = np.argmin(np.abs(freqs - target_freq))
                if idx < len(spectrum):
                    power = np.abs(spectrum[idx])
                    matches.append({
                        'station': name,
                        'frequency': target_freq,
                        'power': float(power),
                        'detected': power > np.median(np.abs(spectrum)) * 2
                    })
        
        return [m for m in matches if m['detected']]


class HectorMoraCorrelator:
    """
    Correlate with Hector Mora's 180W HF radio patterns
    
    HF range: 1.8 - 30 MHz
    Power: 180W (capable of ionospheric skip)
    """
    
    HF_BANDS = {
        "160m": (1800000, 2000000),
        "80m": (3500000, 4000000),
        "40m": (7000000, 7300000),
        "30m": (10100000, 10150000),
        "20m": (14000000, 14350000),
        "17m": (18068000, 18168000),
        "15m": (21000000, 21450000),
        "12m": (24890000, 24990000),
        "10m": (28000000, 29700000),
    }
    
    def __init__(self):
        self.baseline_power: Dict[str, float] = {}
    
    def detect_hf_activity(self, spectrum: np.ndarray, freqs: np.ndarray) -> List[Dict]:
        """Detect HF band activity"""
        activity = []
        
        for band_name, (low, high) in self.HF_BANDS.items():
            if low < freqs[-1]:
                band_mask = (freqs >= low) & (freqs <= high)
                if np.any(band_mask[:len(spectrum)]):
                    band_power = np.mean(np.abs(spectrum[band_mask[:len(spectrum)]]))
                    
                    # Compare to baseline
                    baseline = self.baseline_power.get(band_name, band_power)
                    deviation = (band_power - baseline) / baseline if baseline > 0 else 0
                    
                    if abs(deviation) > 0.5:  # >50% change from baseline
                        activity.append({
                            'band': band_name,
                            'power': float(band_power),
                            'deviation': float(deviation),
                            'anomaly': deviation > 0
                        })
                    
                    # Update baseline (moving average)
                    self.baseline_power[band_name] = 0.9 * baseline + 0.1 * band_power
        
        return activity


# ==============================================================================
# MASTER CORRELATOR
# ==============================================================================

class HistoricalRFCorrelator:
    """
    Master correlator combining all historical RF sources
    
    Sources:
    1. William Eitel - T/53 Morse timing
    2. Funkschau 1968 - Tube electronics signatures
    3. Hector Mora - HF radio baseline
    4. KiwiSDR TI0RC - Costa Rica RF monitoring
    """
    
    def __init__(self):
        self.t53_detector = T53PatternDetector()
        self.tube_detector = TubeElectronicsDetector()
        self.kiwi_correlator = KiwiSDRCorrelator()
        self.hf_correlator = HectorMoraCorrelator()
        
        self.all_correlations: List[RFCorrelation] = []
    
    def full_analysis(self, 
                      timing_deltas: Optional[np.ndarray] = None,
                      spectrum: Optional[np.ndarray] = None,
                      freqs: Optional[np.ndarray] = None,
                      sample_rate: float = 48000) -> Dict[str, Any]:
        """
        Perform full historical correlation analysis
        
        Args:
            timing_deltas: Inter-event timing for Morse analysis
            spectrum: Frequency spectrum for signature detection
            freqs: Frequency axis for spectrum
            sample_rate: Sample rate for spectral analysis
        
        Returns:
            Comprehensive correlation results
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'sources': {},
            'correlations': [],
            'summary': {
                'total_matches': 0,
                'highest_confidence': 0.0,
                'primary_source': None
            }
        }
        
        # 1. William Eitel - T/53 Morse timing
        if timing_deltas is not None and len(timing_deltas) > 0:
            t53_results = self.t53_detector.analyze_timing(timing_deltas)
            morse = self.t53_detector.decode_sequence(t53_results)
            
            results['sources']['william_eitel'] = {
                'context': WILLIAM_EITEL_CONTEXT,
                'analysis': t53_results,
                'decoded_morse': morse.decoded_text if morse else None,
                'confidence': t53_results['t53_score']
            }
            
            if t53_results['t53_score'] > 0.3:
                results['correlations'].append({
                    'source': 'william_eitel',
                    'type': 't53_morse',
                    'confidence': t53_results['t53_score'],
                    'significance': 'Covert Morse channel detected'
                })
                results['summary']['total_matches'] += 1
        
        # 2. Funkschau 1968 - Tube electronics
        if spectrum is not None and len(spectrum) > 0:
            tube_results = self.tube_detector.analyze_spectrum(spectrum, sample_rate)
            
            results['sources']['funkschau_1968'] = {
                'context': FUNKSCHAU_1968_CONTEXT,
                'analysis': tube_results,
                'confidence': tube_results['total_score']
            }
            
            if tube_results['total_score'] > 0.3:
                results['correlations'].append({
                    'source': 'funkschau_1968',
                    'type': 'tube_electronics',
                    'confidence': tube_results['total_score'],
                    'significance': 'Vintage surveillance electronics signature'
                })
                results['summary']['total_matches'] += 1
        
        # 3. Hector Mora - HF radio
        if spectrum is not None and freqs is not None:
            hf_activity = self.hf_correlator.detect_hf_activity(spectrum, freqs)
            
            results['sources']['hector_mora'] = {
                'context': HECTOR_MORA_CONTEXT,
                'analysis': {'hf_activity': hf_activity},
                'confidence': len(hf_activity) / 9  # 9 HF bands
            }
            
            if hf_activity:
                results['correlations'].append({
                    'source': 'hector_mora',
                    'type': 'hf_radio_activity',
                    'confidence': len(hf_activity) / 9,
                    'significance': 'HF band anomaly (ionospheric skip possible)',
                    'bands': [a['band'] for a in hf_activity]
                })
                results['summary']['total_matches'] += 1
        
        # 4. KiwiSDR TI0RC - Costa Rica monitoring
        if spectrum is not None and freqs is not None:
            kiwi_matches = self.kiwi_correlator.correlate_spectrum(spectrum, freqs)
            
            results['sources']['kiwisdr_ti0rc'] = {
                'context': {
                    'host': self.kiwi_correlator.host,
                    'location': 'Radio Club Costa Rica',
                    'distance_km': 20
                },
                'analysis': {'matches': kiwi_matches},
                'confidence': len(kiwi_matches) / len(KIWI_FREQUENCIES)
            }
            
            if kiwi_matches:
                for match in kiwi_matches:
                    results['correlations'].append({
                        'source': 'kiwisdr_ti0rc',
                        'type': 'frequency_match',
                        'confidence': 0.7,
                        'significance': f"Matched {match['station']} at {match['frequency']} Hz",
                        'station': match['station']
                    })
                results['summary']['total_matches'] += 1
        
        # Compute summary
        if results['correlations']:
            max_conf = max(c['confidence'] for c in results['correlations'])
            results['summary']['highest_confidence'] = max_conf
            best = max(results['correlations'], key=lambda x: x['confidence'])
            results['summary']['primary_source'] = best['source']
        
        return results
    
    def export_report(self, output_path: Path) -> None:
        """Export correlation report as JSON"""
        report = {
            'generated': datetime.now().isoformat(),
            'total_correlations': len(self.all_correlations),
            'historical_context': {
                'william_eitel': WILLIAM_EITEL_CONTEXT,
                'funkschau_1968': FUNKSCHAU_1968_CONTEXT,
                'hector_mora': HECTOR_MORA_CONTEXT,
                'kiwisdr': {
                    'host': 'ti0rc.proxy.kiwisdr.com',
                    'frequencies': {k: v for k, v in list(KIWI_FREQUENCIES.items())[:10]}
                }
            },
            'correlations': [
                {
                    'source': c.historical_source,
                    'coefficient': c.correlation_coefficient,
                    'significance': c.significance,
                    'timestamp': c.timestamp.isoformat()
                }
                for c in self.all_correlations[-100:]  # Last 100
            ]
        }
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"[HISTORICAL RF] Report saved to {output_path}")


# ==============================================================================
# DEMO
# ==============================================================================

def demo_historical_correlation():
    """Demonstrate historical RF correlation"""
    print("=" * 70)
    print("HISTORICAL RF CORRELATION ENGINE")
    print("=" * 70)
    
    correlator = HistoricalRFCorrelator()
    
    # Generate test data
    print("\n[DEMO] Generating test data...")
    
    # Fake timing deltas with some T/53 patterns
    timing_deltas = np.array([
        0.118, 0.118, 0.354,  # ..-  = U
        0.354, 0.118, 0.354,  # -.-  = K
        0.826,  # word gap
        0.118, 0.118, 0.118,  # ... = S
    ] + list(np.random.uniform(0.1, 0.5, 20)))
    
    # Fake spectrum with heater hum
    n_samples = 4096
    sample_rate = 48000
    freqs = rfftfreq(n_samples, 1/sample_rate)
    spectrum = np.random.randn(len(freqs)) * 0.1
    
    # Add 60Hz harmonics
    for freq in [60, 120, 180]:
        idx = np.argmin(np.abs(freqs - freq))
        if idx < len(spectrum):
            spectrum[idx] += 5.0
    
    print("\n[DEMO] Running full analysis...")
    results = correlator.full_analysis(
        timing_deltas=timing_deltas,
        spectrum=spectrum,
        freqs=freqs,
        sample_rate=sample_rate
    )
    
    print("\n" + "=" * 70)
    print("RESULTS:")
    print("=" * 70)
    print(f"  Total matches: {results['summary']['total_matches']}")
    print(f"  Highest confidence: {results['summary']['highest_confidence']:.2%}")
    print(f"  Primary source: {results['summary']['primary_source']}")
    
    print("\n  Correlations found:")
    for corr in results['correlations']:
        print(f"    - {corr['source']}: {corr['significance']}")
        print(f"      Confidence: {corr['confidence']:.2%}")
    
    # Export report
    output_path = Path(__file__).parent.parent / "historical_rf_report.json"
    
    # Save analysis results
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n[DEMO] Report saved to {output_path}")
    
    return results


if __name__ == "__main__":
    demo_historical_correlation()
