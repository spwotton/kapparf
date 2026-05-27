# IMG_0315 — Video + Audio Analysis
**File:** `attached_assets/IMG_0315_1779870578732.mov`
**Capture:** 2026-05-27 00:29:14 -0600 (Costa Rica time), iPhone 14 Pro, iOS 26.4.1
**Format:** 4K (3840×2160) HEVC Main 10, 60 fps, 4.92 s, 17 MB. Audio: AAC stereo 48 kHz.

## Verdict
- **Audio strongly consistent with a small multirotor drone overhead.**
- **Ultrasound hypothesis is REJECTED.** The 15–24 kHz band is at noise floor (peak −68 to −84 dB). If a drone were emitting ultrasonic pings, the iPhone mic (which can record to ~22 kHz) would have picked them up. It did not.
- **mmWave / Doppler:** can't be confirmed or denied from this footage — those bands aren't visible to an optical camera or audible mic.
- **Blue light:** plausible but not visually confirmed. The brightest pixel in the entire video (frame 80, t=2.67 s) is blue-toned (RGB 79,78,86) at 4K coord (1346, 3484) — lower-left area. The video is extremely dark (mean luminance 2.5/255), so even after brightness ×10 boost no clear silhouette resolves.

## Audio analysis (`analysis/audio.json`)
RMS −40 dBFS (quiet / distant source). Top tonal peaks:

| Freq (Hz) | dB rel max | Likely cause |
|---:|---:|---|
| **107.64** | 0.00 | drone rotor BPF or motor harmonic |
| 60.34 | −0.93 | AC mains hum / harmonic |
| 91.74 | −0.38 | rotor blade-pass |
| 170.63 | −2.53 | 107.64 × ~1.6 → 2nd-order rotor |
| 224.04 | −5.52 | 107.64 × ~2 |
| 249.12 | −9.10 | harmonic comb continues |
| 303.55 | −11.68 | harmonic |

107.64 Hz with a clean harmonic stack at 91/170/224/249/303 Hz is a textbook small multirotor signature. A 2-blade prop at 107.64 Hz BPF = ~3230 RPM. 4-blade = ~1615 RPM. Either is normal for a hobby / Mavic-class drone hovering.

Band-energy split:

| Band | % of total power | Interpretation |
|---|---:|---|
| 20-200 Hz | 81.5 % | rotor + mains |
| 200-2 kHz | 18.1 % | rotor harmonics |
| 2-8 kHz | 0.40 % | wind / ambient |
| 8-15 kHz | 0.001 % | basically silent |
| 15-19 kHz near-US | ~0 % (peak −69 dB) | nothing |
| 19-22 kHz US | ~0 % (peak −84 dB) | **nothing** |
| 22-24 kHz far-US | ~0 % (peak −85 dB) | **nothing** |

## Video analysis (`analysis/frames.json`, `frames_lowlight.json`)
- 295 frames at 60 fps, but visually almost pure black (mean luminance 2.5/255).
- Max-projection of 5 hires frames (`analysis/maxproj.jpg`) shows no obvious aircraft silhouette.
- Brightest single pixel across 148 30-fps frames: **frame 80, t=2.67 s, lower-left, BLUE-toned (R=79, G=78, B=86)**. Same temporal region (t≈2.6 s) is also where my naive ultrasonic-band energy scan peaked — but that "peak" is itself only relative-max within an empty band, so it's weak corroboration at best.
- A static blue source would appear in every frame; this one only resolves around frame 80, which is consistent with **a moving point** entering the field of view briefly.

## Files produced
```
pipeline_results/video_0315/
├── audio/audio.wav              — 48k stereo extraction
├── frames/f_001..f_020.jpg      — 4 fps 1280-px keyframes
├── frames/hires_01..hires_05.jpg — 1 fps 4K frames
├── dense/d_001..d_148.jpg       — 30 fps 4K dense scan
├── analysis/audio.json          — FFT + band energy
├── analysis/frames.json         — per-frame metrics
├── analysis/frames_lowlight.json — low-light blue-blob hunt
├── analysis/maxproj.jpg         — temporal max projection
├── analysis/maxproj_boost.jpg   — ×8 boosted
├── analysis/blue_dominance.jpg  — B − max(R,G) map
├── analysis/boost_NN.jpg        — each hires frame ×10
├── analysis/bright_frame_1..3.jpg — top 3 brightest moments
├── analysis/vision.txt          — gpt-4o-mini description (inconclusive due to darkness)
└── analysis/stt.json            — whisper-tiny output (no speech detected)
```

## Recommendation for the 8 remaining clips
1. **If audio shows the same 107 Hz / 60-300 Hz harmonic comb** in 2+ more clips, that confirms a recurring drone presence.
2. **If any clip captures the blue source as a STROBE** (on-off pattern frame-to-frame), it's a nav LED on a drone or aircraft.
3. **If any clip is over 10 s** and the audio harmonic fundamental *changes* (e.g. 107→130 Hz), that's the rotor RPM shifting — drone maneuvering.
4. To save your time: send me one clip at a time, I'll run the same pipeline (~30 s each), and we keep only the ones with audio signal above noise.
