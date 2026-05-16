#!/usr/bin/env python3
"""
OUTDOOR RECORDING ANALYSIS - CORRELATED WITH PCAP
==================================================
Analyzing 20-minute audio recording from Jan 17, 2026 ~11:55 PM
Concurrent with Wireshark capture
Looking for:
- Ultrasonic signatures
- RF-related audio artifacts
- Drone/UAV acoustic signatures
- V2K carrier frequencies
- Anomalous patterns correlating with network spikes
"""

import numpy as np
import warnings
warnings.filterwarnings('ignore')

# Try different audio loading methods
try:
    import librosa
    import soundfile as sf
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False

from scipy import signal
from scipy.fft import fft, fftfreq
from collections import defaultdict
import json
from datetime import datetime

RECORDING_PATH = r"C:\Users\echo\Downloads\LLM\ToroidalRecursion\Recording.m4a"

# Known frequencies of interest
FREQUENCIES_OF_INTEREST = {
    # V2K/Neuromodulation
    "V2K_CARRIER_LOW": (450, 500, "Microwave auditory effect carrier (low)"),
    "V2K_CARRIER_MID": (2400, 2500, "WiFi band / V2K modulation"),
    
    # Drone signatures
    "DRONE_MOTOR_1": (100, 200, "Brushless motor fundamental"),
    "DRONE_MOTOR_2": (200, 400, "Motor harmonics"),
    "DRONE_PROP": (50, 100, "Propeller blade pass"),
    
    # RF interference
    "POWER_LINE": (60, 60, "60Hz mains hum"),
    "POWER_HARMONIC_2": (120, 120, "2nd harmonic"),
    "POWER_HARMONIC_3": (180, 180, "3rd harmonic"),
    
    # Ultrasonic (if captured)
    "ULTRASONIC_LOW": (18000, 20000, "Near-ultrasonic"),
    "ULTRASONIC_MID": (20000, 22000, "Low ultrasonic"),
    
    # Suspicious
    "SCHUMANN": (7.83, 7.83, "Schumann resonance"),
    "GAMMA_BRAIN": (40, 40, "Gamma brainwave freq"),
    "THETA_BRAIN": (6, 8, "Theta brainwave range"),
}

def load_audio(path):
    """Load audio file using multiple methods"""
    print(f"📂 Loading: {path}")
    
    try:
        # Try soundfile first (fastest)
        y, sr = sf.read(path)
        if len(y.shape) > 1:
            y = y.mean(axis=1)  # Convert to mono
        print(f"   ✓ Loaded via soundfile: {len(y)} samples @ {sr} Hz")
        print(f"   Duration: {len(y)/sr:.1f} seconds ({len(y)/sr/60:.1f} minutes)")
        return y, sr
    except Exception as e1:
        print(f"   soundfile failed: {e1}")
        
    try:
        # Try librosa (handles m4a via audioread)
        y, sr = librosa.load(path, sr=None, mono=True)
        print(f"   ✓ Loaded via librosa: {len(y)} samples @ {sr} Hz")
        print(f"   Duration: {len(y)/sr:.1f} seconds ({len(y)/sr/60:.1f} minutes)")
        return y, sr
    except Exception as e2:
        print(f"   librosa failed: {e2}")
        
    raise RuntimeError("Could not load audio file")

def analyze_spectrum(y, sr, segment_duration=60):
    """Analyze frequency spectrum in segments"""
    print(f"\n🔬 SPECTRAL ANALYSIS (FFT)")
    
    segment_samples = int(segment_duration * sr)
    n_segments = len(y) // segment_samples
    
    results = {
        "segments": [],
        "frequency_detections": defaultdict(list)
    }
    
    for i in range(n_segments):
        start = i * segment_samples
        end = start + segment_samples
        segment = y[start:end]
        
        # Compute FFT
        N = len(segment)
        yf = np.abs(fft(segment))[:N//2]
        xf = fftfreq(N, 1/sr)[:N//2]
        
        # Normalize
        yf = yf / N
        
        # Find peaks
        peaks, properties = signal.find_peaks(yf, height=np.max(yf)*0.01, distance=10)
        peak_freqs = xf[peaks]
        peak_mags = yf[peaks]
        
        # Top 10 peaks
        top_idx = np.argsort(peak_mags)[-10:][::-1]
        top_peaks = [(peak_freqs[j], peak_mags[j]) for j in top_idx]
        
        segment_time = f"{i*segment_duration/60:.1f}-{(i+1)*segment_duration/60:.1f} min"
        
        results["segments"].append({
            "time": segment_time,
            "top_peaks": top_peaks
        })
        
        # Check frequencies of interest
        for name, (f_low, f_high, desc) in FREQUENCIES_OF_INTEREST.items():
            mask = (xf >= f_low) & (xf <= f_high)
            if np.any(mask):
                power = np.max(yf[mask])
                if power > np.mean(yf) * 5:  # Significant
                    results["frequency_detections"][name].append({
                        "segment": segment_time,
                        "power": float(power),
                        "description": desc
                    })
    
    return results

def detect_drone_signature(y, sr):
    """Look for characteristic drone motor sounds"""
    print(f"\n🚁 DRONE ACOUSTIC SIGNATURE DETECTION")
    
    # Drone motors typically have strong harmonics at 100-400 Hz
    # with characteristic "buzz" modulation
    
    # Bandpass filter for drone frequencies
    nyquist = sr / 2
    low = 50 / nyquist
    high = min(500 / nyquist, 0.99)
    
    try:
        b, a = signal.butter(4, [low, high], btype='band')
        filtered = signal.filtfilt(b, a, y)
    except:
        print("   ⚠️ Could not apply drone bandpass filter")
        return None
    
    # Compute envelope
    envelope = np.abs(signal.hilbert(filtered))
    
    # Look for periodic modulation (blade pass)
    # Typical quadcopter: 4 blades × 4 motors × ~100Hz = ~1600 blade passes/sec
    
    # Autocorrelation to find periodicity
    autocorr = np.correlate(envelope[:sr*5], envelope[:sr*5], mode='same')
    autocorr = autocorr[len(autocorr)//2:]
    
    # Find peaks in autocorrelation (periodic signals)
    peaks, _ = signal.find_peaks(autocorr, distance=int(sr/500))
    
    if len(peaks) > 3:
        periods = np.diff(peaks) / sr
        avg_period = np.mean(periods)
        freq = 1 / avg_period if avg_period > 0 else 0
        
        print(f"   Detected periodic component: {freq:.1f} Hz")
        
        if 50 < freq < 500:
            print(f"   ⚠️  POSSIBLE DRONE MOTOR SIGNATURE at {freq:.1f} Hz")
            return {"detected": True, "frequency": freq}
    
    print(f"   ✓ No clear drone signature detected")
    return {"detected": False}

def detect_rf_artifacts(y, sr):
    """Look for RF interference patterns in audio"""
    print(f"\n📡 RF INTERFERENCE DETECTION")
    
    # RF interference often manifests as:
    # 1. Clicks/pops at regular intervals
    # 2. Heterodyne beats (mixing products)
    # 3. Mains hum pickup (60Hz and harmonics)
    
    results = {}
    
    # Check for 60Hz hum
    f_res = sr / len(y)
    if f_res < 60:
        idx_60 = int(60 / f_res)
        spectrum = np.abs(fft(y[:sr*10]))
        
        # Power at 60Hz vs average
        hum_power = spectrum[idx_60]
        avg_power = np.mean(spectrum[1:1000])
        
        hum_ratio = hum_power / avg_power if avg_power > 0 else 0
        
        if hum_ratio > 10:
            print(f"   🔌 STRONG 60Hz HUM detected (ratio: {hum_ratio:.1f}x)")
            print(f"      This suggests proximity to power lines or electronic devices")
            results["60hz_hum"] = {"detected": True, "ratio": float(hum_ratio)}
        else:
            print(f"   ✓ No significant 60Hz hum")
            results["60hz_hum"] = {"detected": False}
    
    # Check for clicks/pops (digital interference)
    diff = np.abs(np.diff(y))
    threshold = np.mean(diff) + 5 * np.std(diff)
    clicks = np.where(diff > threshold)[0]
    
    if len(clicks) > 100:
        # Check if clicks are periodic
        click_intervals = np.diff(clicks) / sr
        if len(click_intervals) > 10:
            avg_interval = np.mean(click_intervals)
            std_interval = np.std(click_intervals)
            
            if std_interval < avg_interval * 0.5:  # Regular
                print(f"   ⚠️  PERIODIC CLICKS detected ({1/avg_interval:.1f} Hz)")
                print(f"      Could be: RF pulse train, digital beacon, interference")
                results["periodic_clicks"] = {
                    "detected": True,
                    "frequency": float(1/avg_interval),
                    "count": len(clicks)
                }
    
    return results

def correlate_with_pcap_times(y, sr):
    """Attempt to correlate audio events with PCAP timing"""
    print(f"\n⏱️ TIME CORRELATION ANALYSIS")
    
    # Calculate energy in windows
    window_size = int(sr * 1)  # 1 second windows
    hop = window_size // 2
    
    energies = []
    for i in range(0, len(y) - window_size, hop):
        window = y[i:i+window_size]
        energy = np.sum(window**2)
        time_sec = i / sr
        energies.append((time_sec, energy))
    
    energies = np.array(energies)
    
    # Find sudden energy changes (events)
    energy_diff = np.abs(np.diff(energies[:, 1]))
    threshold = np.mean(energy_diff) + 3 * np.std(energy_diff)
    events = np.where(energy_diff > threshold)[0]
    
    print(f"   Found {len(events)} significant audio events")
    
    if len(events) > 0:
        print(f"\n   TOP AUDIO EVENTS (by energy change):")
        sorted_events = sorted(events, key=lambda i: energy_diff[i], reverse=True)[:10]
        for i, idx in enumerate(sorted_events):
            time = energies[idx, 0]
            mins = int(time // 60)
            secs = time % 60
            print(f"      {i+1}. Time: {mins:02d}:{secs:05.2f} - Energy spike")
    
    return events

def analyze_ultrasonic(y, sr):
    """Check for ultrasonic content (if sample rate allows)"""
    print(f"\n🔊 ULTRASONIC ANALYSIS")
    
    nyquist = sr / 2
    print(f"   Max detectable frequency: {nyquist:.0f} Hz")
    
    if nyquist < 18000:
        print(f"   ⚠️  Sample rate too low for ultrasonic analysis")
        return None
    
    # High-pass filter above 15kHz
    try:
        low = 15000 / nyquist
        b, a = signal.butter(4, low, btype='high')
        ultrasonic = signal.filtfilt(b, a, y)
        
        # Energy in ultrasonic band
        ultra_energy = np.sum(ultrasonic**2)
        total_energy = np.sum(y**2)
        
        ratio = ultra_energy / total_energy if total_energy > 0 else 0
        
        print(f"   Ultrasonic energy ratio: {ratio*100:.2f}%")
        
        if ratio > 0.01:
            print(f"   ⚠️  SIGNIFICANT ULTRASONIC CONTENT DETECTED")
            
            # Find dominant ultrasonic frequency
            N = len(ultrasonic)
            yf = np.abs(fft(ultrasonic))[:N//2]
            xf = fftfreq(N, 1/sr)[:N//2]
            
            mask = xf > 15000
            peak_idx = np.argmax(yf[mask])
            peak_freq = xf[mask][peak_idx]
            
            print(f"   Dominant ultrasonic frequency: {peak_freq:.0f} Hz")
            return {"detected": True, "ratio": float(ratio), "peak_freq": float(peak_freq)}
    except Exception as e:
        print(f"   Error in ultrasonic analysis: {e}")
    
    return {"detected": False}

def main():
    print("="*70)
    print("    🎤 OUTDOOR RECORDING FORENSIC ANALYSIS")
    print("    Timestamp: Jan 17, 2026 ~23:55 (concurrent with PCAP)")
    print("="*70)
    
    try:
        y, sr = load_audio(RECORDING_PATH)
    except Exception as e:
        print(f"❌ Failed to load audio: {e}")
        print("\nTrying alternative approach with pydub...")
        
        # Try pydub as fallback
        try:
            from pydub import AudioSegment
            audio = AudioSegment.from_file(RECORDING_PATH, format="m4a")
            y = np.array(audio.get_array_of_samples()).astype(np.float32)
            y = y / np.max(np.abs(y))  # Normalize
            sr = audio.frame_rate
            if audio.channels == 2:
                y = y.reshape((-1, 2)).mean(axis=1)
            print(f"   ✓ Loaded via pydub: {len(y)} samples @ {sr} Hz")
        except Exception as e2:
            print(f"❌ pydub also failed: {e2}")
            return
    
    results = {
        "file": RECORDING_PATH,
        "timestamp": "2026-01-17 23:55",
        "duration_sec": len(y) / sr,
        "sample_rate": sr,
        "analyses": {}
    }
    
    # Run analyses
    results["analyses"]["drone"] = detect_drone_signature(y, sr)
    results["analyses"]["rf"] = detect_rf_artifacts(y, sr)
    results["analyses"]["ultrasonic"] = analyze_ultrasonic(y, sr)
    
    # Spectral analysis
    spectral = analyze_spectrum(y, sr)
    results["analyses"]["spectral"] = spectral
    
    # Time correlation
    correlate_with_pcap_times(y, sr)
    
    # Summary
    print("\n" + "="*70)
    print("                    ANALYSIS SUMMARY")
    print("="*70)
    
    print(f"\n📊 RECORDING STATS:")
    print(f"   Duration: {len(y)/sr/60:.1f} minutes")
    print(f"   Sample rate: {sr} Hz")
    print(f"   Samples: {len(y):,}")
    
    print(f"\n🎯 KEY FINDINGS:")
    
    if results["analyses"]["drone"] and results["analyses"]["drone"].get("detected"):
        freq = results["analyses"]["drone"]["frequency"]
        print(f"   🚁 DRONE SIGNATURE: {freq:.1f} Hz periodic component")
    else:
        print(f"   🚁 Drone: Not detected")
    
    if results["analyses"]["rf"]:
        if results["analyses"]["rf"].get("60hz_hum", {}).get("detected"):
            print(f"   🔌 60Hz HUM: Strong (electrical interference present)")
        if results["analyses"]["rf"].get("periodic_clicks", {}).get("detected"):
            freq = results["analyses"]["rf"]["periodic_clicks"]["frequency"]
            print(f"   ⚡ PERIODIC CLICKS: {freq:.1f} Hz (possible RF beacon)")
    
    if results["analyses"]["ultrasonic"] and results["analyses"]["ultrasonic"].get("detected"):
        freq = results["analyses"]["ultrasonic"]["peak_freq"]
        print(f"   🔊 ULTRASONIC: Peak at {freq:.0f} Hz")
    else:
        print(f"   🔊 Ultrasonic: Not significant")
    
    # Show frequency detections
    if spectral["frequency_detections"]:
        print(f"\n   📡 FREQUENCIES OF INTEREST:")
        for name, detections in spectral["frequency_detections"].items():
            info = FREQUENCIES_OF_INTEREST.get(name, (0, 0, name))
            print(f"      {name}: {len(detections)} detections - {info[2]}")
    
    # Save results
    with open("audio_analysis_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n📄 Results saved to audio_analysis_results.json")

if __name__ == "__main__":
    main()
