"""
OMEGA TRACKER - Nano-Oscillation Morse Analysis
================================================
Analyzes detected oscillations for Morse code patterns.
Applies Crookes correlation to determine if patterns are structured.

Historical Context:
-------------------
William Crookes (1832-1919), Victorian physicist and spiritualist, 
believed electromagnetic phenomena could bridge physical and mental realms.
His work with Crookes tubes led to X-ray and cathode ray discoveries.
He was fascinated by the telegraph (Morse code) as a means of 
"communication across the veil."

This module looks for structured patterns in detected RF/audio
oscillations that might indicate deliberate encoding - whether from
natural sources, surveillance equipment, or unknown phenomena.

Target Frequencies from Previous Analysis:
- 97.01 Hz: Drone signature (persistent)
- 44.2 Hz: Recurring spectral peak (likely PRF)
- 8-16 Hz: Low frequency oscillation cluster
- 46.87 Hz: Theoretical PRF candidate

Usage:
------
python analyze_morse_oscillations.py [recording_path]
"""

import sys
import json
import numpy as np
from pathlib import Path
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# Morse Code Dictionary (inline to avoid circular imports)
MORSE_CODE = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
    '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
    '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
    '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
    '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
    '--..': 'Z', '.----': '1', '..---': '2', '...--': '3',
    '....-': '4', '.....': '5', '-....': '6', '--...': '7',
    '---..': '8', '----.': '9', '-----': '0',
}


class MorseDecoder:
    """Lightweight Morse decoder"""
    def __init__(self, wpm: float = 15.0):
        self.wpm = wpm
        self.unit_ms = (60 * 1000) / (50 * wpm)
        self.dit_max_ms = self.unit_ms * 2
        
    def decode_pattern(self, pattern: str):
        """Decode Morse pattern to text"""
        if not pattern:
            return "", 0.0
        
        words = pattern.split("   ")
        decoded_words = []
        total_chars = 0
        matched_chars = 0
        
        for word in words:
            chars = word.split(" ")
            decoded_chars = []
            for char in chars:
                char = char.strip()
                if not char:
                    continue
                total_chars += 1
                if char in MORSE_CODE:
                    decoded_chars.append(MORSE_CODE[char])
                    matched_chars += 1
                else:
                    decoded_chars.append('?')
            if decoded_chars:
                decoded_words.append(''.join(decoded_chars))
        
        decoded_text = ' '.join(decoded_words)
        confidence = matched_chars / total_chars if total_chars > 0 else 0.0
        return decoded_text, confidence


def load_existing_analysis(analysis_path: str) -> dict:
    """Load the existing audio_analysis_results.json"""
    with open(analysis_path, 'r') as f:
        return json.load(f)


def extract_oscillation_timing(spectral_data: dict) -> list:
    """
    Extract timing patterns from spectral data.
    Look for peaks that appear/disappear as potential keying.
    """
    segments = spectral_data.get("spectral", {}).get("segments", [])
    
    # Track specific frequencies across time
    freq_timelines = {}
    
    for segment in segments:
        time_range = segment.get("time", "")
        peaks = segment.get("top_peaks", [])
        
        for freq, power in peaks:
            freq_key = round(freq, 1)  # Round to 0.1 Hz
            if freq_key not in freq_timelines:
                freq_timelines[freq_key] = []
            
            freq_timelines[freq_key].append({
                "time": time_range,
                "power": float(power)
            })
    
    return freq_timelines


def analyze_44hz_keying(freq_timelines: dict) -> dict:
    """
    The 44.2 Hz signal appears consistently. 
    Analyze its power variations as potential keying.
    """
    # Find 44.x Hz entries
    target_freqs = [f for f in freq_timelines.keys() if 43.5 <= f <= 45.0]
    
    if not target_freqs:
        return {"detected": False, "reason": "44 Hz not found"}
    
    # Merge 44.x entries
    combined = []
    for freq in target_freqs:
        combined.extend(freq_timelines[freq])
    
    # Sort by time
    combined.sort(key=lambda x: x["time"])
    
    # Extract power levels
    powers = [x["power"] for x in combined]
    
    if not powers:
        return {"detected": False, "reason": "No power data"}
    
    # Calculate threshold for "on" vs "off"
    median_power = np.median(powers)
    threshold = median_power * 0.7  # 70% of median
    
    # Create binary pattern
    binary = ['1' if p > threshold else '0' for p in powers]
    binary_str = ''.join(binary)
    
    # Look for runs (potential dits and dahs)
    runs = []
    current_run = {'value': binary[0], 'length': 1}
    
    for bit in binary[1:]:
        if bit == current_run['value']:
            current_run['length'] += 1
        else:
            runs.append(current_run)
            current_run = {'value': bit, 'length': 1}
    runs.append(current_run)
    
    # Classify runs as dit/dah
    on_runs = [r for r in runs if r['value'] == '1']
    if len(on_runs) < 3:
        return {"detected": False, "reason": "Insufficient ON runs"}
    
    on_lengths = [r['length'] for r in on_runs]
    median_on = np.median(on_lengths)
    
    # Convert to Morse
    morse_pattern = ""
    for run in runs:
        if run['value'] == '1':
            if run['length'] <= median_on:
                morse_pattern += '.'
            else:
                morse_pattern += '-'
        else:
            if run['length'] > 3:
                morse_pattern += ' '  # Character gap
    
    # Try to decode
    decoder = MorseDecoder()
    decoded, confidence = decoder.decode_pattern(morse_pattern)
    
    return {
        "detected": True,
        "frequency": "44.2 Hz",
        "binary_pattern": binary_str,
        "morse_pattern": morse_pattern,
        "decoded": decoded,
        "confidence": confidence,
        "run_analysis": {
            "total_runs": len(runs),
            "on_runs": len(on_runs),
            "median_on_length": float(median_on)
        }
    }


def analyze_low_freq_cluster(freq_timelines: dict) -> dict:
    """
    Analyze the 8-16 Hz cluster for patterns.
    This range is interesting as it overlaps with brain wave frequencies.
    """
    cluster_freqs = [f for f in freq_timelines.keys() if 7.0 <= f <= 17.0]
    
    if not cluster_freqs:
        return {"detected": False}
    
    # Count frequency appearances
    appearance_counts = {f: len(freq_timelines[f]) for f in cluster_freqs}
    
    # Most persistent frequencies
    sorted_freqs = sorted(appearance_counts.items(), key=lambda x: -x[1])
    
    # Check if certain frequencies appear at "dit" vs "dah" timing
    freq_powers = {}
    for freq in cluster_freqs[:5]:  # Top 5 frequencies
        powers = [x["power"] for x in freq_timelines[freq]]
        freq_powers[freq] = {
            "mean": float(np.mean(powers)),
            "std": float(np.std(powers)),
            "appearances": len(powers)
        }
    
    return {
        "detected": True,
        "frequency_range": "8-16 Hz (Alpha/Theta overlap)",
        "top_frequencies": sorted_freqs[:5],
        "frequency_analysis": freq_powers,
        "interpretation": "Low-frequency cluster may indicate entrainment attempt"
    }


def analyze_drone_signature(analysis_data: dict) -> dict:
    """
    The 97 Hz drone signature - is it modulated?
    """
    drone = analysis_data.get("analyses", {}).get("drone", {})
    
    if not drone.get("detected"):
        return {"detected": False}
    
    freq = drone.get("frequency", 0)
    
    # 97 Hz is interesting - it's close to:
    # - 100 Hz mains harmonic (50 Hz countries)
    # - 96.67 Hz = 580/6 (possible timing reference)
    # - Infrasonic resonance patterns
    
    return {
        "detected": True,
        "frequency": freq,
        "analysis": {
            "mains_offset": abs(freq - 100),
            "is_power_harmonic": abs(freq - 100) < 5,
            "possible_sources": [
                "Switching power supply (drone motor)",
                "AC coupling artifact",
                "Deliberate carrier for subliminal modulation"
            ]
        },
        "recommendation": "Analyze amplitude modulation for embedded signals"
    }


def crookes_synthesis(results: dict) -> dict:
    """
    Apply Crookes-style synthesis:
    - Look for patterns that transcend random noise
    - Check for symbolic coherence
    - Evaluate structural entropy
    """
    
    score = 0.0
    findings = []
    
    # 44 Hz keying analysis
    if results["44hz_keying"]["detected"]:
        conf = results["44hz_keying"]["confidence"]
        score += conf * 0.3
        if conf > 0.3:
            findings.append(f"44 Hz shows keying pattern: {results['44hz_keying']['decoded']}")
    
    # Low frequency cluster
    if results["low_freq_cluster"]["detected"]:
        top_freqs = results["low_freq_cluster"]["top_frequencies"]
        if len(top_freqs) >= 3:
            score += 0.2
            findings.append(f"Persistent low-freq cluster: {[f[0] for f in top_freqs[:3]]} Hz")
    
    # Drone signature
    if results["drone"]["detected"]:
        freq = results["drone"]["frequency"]
        if abs(freq - 97) < 1:
            score += 0.15
            findings.append(f"Stable drone signature at {freq:.2f} Hz")
    
    # Check for repeating patterns
    all_decoded = ""
    if "44hz_keying" in results and results["44hz_keying"].get("decoded"):
        all_decoded += results["44hz_keying"]["decoded"] + " "
    
    # Look for repeated symbols
    if all_decoded:
        from collections import Counter
        chars = Counter(all_decoded.replace(" ", ""))
        if chars:
            most_common = chars.most_common(1)[0]
            if most_common[1] > 2:
                score += 0.1
                findings.append(f"Repeated symbol '{most_common[0]}' x{most_common[1]}")
    
    # Crookes interpretation
    if score > 0.6:
        interpretation = "HIGHLY STRUCTURED - Evidence of deliberate encoding"
    elif score > 0.4:
        interpretation = "MODERATELY STRUCTURED - Patterns present, unclear origin"
    elif score > 0.2:
        interpretation = "WEAKLY STRUCTURED - Some non-random features"
    else:
        interpretation = "MOSTLY RANDOM - Typical noise characteristics"
    
    return {
        "crookes_score": float(score),
        "interpretation": interpretation,
        "findings": findings,
        "william_crookes_note": (
            "Crookes believed structured patterns in EM noise indicated "
            "non-physical causation. Modern analysis: structured patterns may "
            "indicate equipment malfunction, deliberate encoding, or "
            "consciousness-correlated phenomena."
        )
    }


def main():
    """Main analysis pipeline"""
    print("=" * 70)
    print("OMEGA TRACKER - Nano-Oscillation Morse Analysis")
    print("Crookes Correlation Protocol v1.0")
    print("=" * 70)
    
    # Find analysis file
    analysis_path = Path(__file__).parent / "audio_analysis_results.json"
    recording_path = Path(__file__).parent / "Recording.m4a"
    
    if len(sys.argv) > 1:
        if sys.argv[1].endswith('.json'):
            analysis_path = Path(sys.argv[1])
        else:
            recording_path = Path(sys.argv[1])
    
    results = {}
    
    # Load existing analysis
    if analysis_path.exists():
        print(f"\n📊 Loading existing analysis: {analysis_path.name}")
        analysis_data = load_existing_analysis(str(analysis_path))
        
        print(f"   Duration: {analysis_data.get('duration_sec', 0):.1f} seconds")
        print(f"   File: {Path(analysis_data.get('file', '')).name}")
        
        # Extract frequency timelines
        freq_timelines = extract_oscillation_timing(analysis_data)
        print(f"   Tracked frequencies: {len(freq_timelines)}")
        
        # Run analyses
        print("\n" + "=" * 70)
        print("ANALYSIS PHASE")
        print("=" * 70)
        
        # 44 Hz keying analysis
        print("\n🔍 Analyzing 44.2 Hz signal for keying patterns...")
        results["44hz_keying"] = analyze_44hz_keying(freq_timelines)
        if results["44hz_keying"]["detected"]:
            print(f"   Binary pattern: {results['44hz_keying']['binary_pattern'][:50]}...")
            print(f"   Morse pattern: {results['44hz_keying']['morse_pattern']}")
            print(f"   Decoded: '{results['44hz_keying']['decoded']}'")
            print(f"   Confidence: {results['44hz_keying']['confidence']:.2f}")
        else:
            print(f"   Result: {results['44hz_keying']['reason']}")
        
        # Low frequency cluster
        print("\n🔍 Analyzing 8-16 Hz cluster...")
        results["low_freq_cluster"] = analyze_low_freq_cluster(freq_timelines)
        if results["low_freq_cluster"]["detected"]:
            print(f"   Top frequencies: {results['low_freq_cluster']['top_frequencies'][:5]}")
        
        # Drone signature
        print("\n🔍 Analyzing 97 Hz drone signature...")
        results["drone"] = analyze_drone_signature(analysis_data)
        if results["drone"]["detected"]:
            print(f"   Frequency: {results['drone']['frequency']:.2f} Hz")
            print(f"   Mains offset: {results['drone']['analysis']['mains_offset']:.2f} Hz")
    else:
        print(f"⚠️ Analysis file not found: {analysis_path}")
    
    # Full recording analysis - skip for now to avoid import issues
    # Direct audio analysis would require soundfile library
    if False and recording_path.exists():
        print("\n" + "=" * 70)
        print("DIRECT RECORDING ANALYSIS")
        print("=" * 70)
        
        try:
            correlator = SDRMorseCorrelator()
            
            # Analyze for Morse patterns at key frequencies
            print("\n🎤 Analyzing recording for Morse patterns...")
            morse_results = correlator.analyze_recording(
                str(recording_path),
                target_frequencies=[97.0, 44.2, 46.87, 8.4]
            )
            
            results["direct_analysis"] = morse_results
            
            # Show any detected events
            for freq_key, analysis in morse_results.get("analyses", {}).items():
                events = analysis.get("morse_events", [])
                if events:
                    print(f"\n   📻 {freq_key}: {len(events)} Morse event(s) detected")
                    for event in events[:3]:
                        print(f"      Pattern: {event['pattern'][:30]}...")
                        print(f"      Decoded: '{event['decoded']}'")
            
        except Exception as e:
            print(f"   Recording analysis error: {e}")
            results["direct_analysis"] = {"error": str(e)}
    
    # Crookes Synthesis
    print("\n" + "=" * 70)
    print("CROOKES SYNTHESIS")
    print("=" * 70)
    
    crookes = crookes_synthesis(results)
    results["crookes_synthesis"] = crookes
    
    print(f"\n📡 Crookes Score: {crookes['crookes_score']:.3f}")
    print(f"   Interpretation: {crookes['interpretation']}")
    
    if crookes['findings']:
        print("\n   Key Findings:")
        for finding in crookes['findings']:
            print(f"   ✓ {finding}")
    
    print(f"\n   Historical Note: {crookes['william_crookes_note']}")
    
    # Save results
    output_path = Path(__file__).parent / "morse_oscillation_analysis.json"
    with open(output_path, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "results": results
        }, f, indent=2, default=str)
    
    print(f"\n💾 Results saved to: {output_path}")
    print("=" * 70)
    
    return results


if __name__ == "__main__":
    main()
