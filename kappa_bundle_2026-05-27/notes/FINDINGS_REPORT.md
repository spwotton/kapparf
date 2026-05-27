# KAPPA SDR Pipeline — Session Findings Report
**Generated:** 2026-05-27 07:25 UTC (rev 2 — accuracy fixes from architect review)
**Corpus:** 164/165 real spectrograms + 26 real WAVs. Zero synthetic data.

---

## 1. Multi-Resolution FFT (real audio)
- **Script:** `scripts/multi_res_pipeline.py`
- **Output:** `pipeline_results/multi_res_20260527_065550.json` (161 KB, 26 WAVs)
- **Windows configured:** N = 256 / 1024 / 4096 / 16384 / 65536 → bin widths 187.5 / 46.875 / 11.72 / 2.93 / 0.732 Hz **at 48 kHz**.
- **⚠ Sample-rate heterogeneity (not resampled this pass):** 21 files @ 48 kHz, 3 @ 8 kHz, 1 @ 44.1 kHz, 1 @ 96 kHz. Bin widths are only the spec-exact values for the 48 kHz cohort; the other 5 files have proportionally scaled bin widths. Next pass should resample everything to 48 kHz before FFT for cross-corpus comparability.
- **Anchors probed per file: 27** (not 8 as previously stated): DSP chain (`dsp_46.875`, x2, x3), kappa (127.324, 1273.24), klein (223.875, 2238.75), schumann_7.83, vestibular_37/38, carrier_53, grid_60, elf_24.2, drone_jan_97, drone_may_107.7, biomotor_354, frey F2/F3 (2004, 2511), EHF speech (17859, 18035), AUBREY genes (FOXP2 139.978, HTR2A 176.591, APOE 111.57, CLOCK 119.73, MSTN 40.364, PIEZO1 55.44, ATP2C2 183.42).
- **⚠ Anchor detection is unfiltered:** `peak_near()` returns the local max in tolerance with no SNR/prominence gate. `dsp_46.875` shows up in 26/26 files because it is *probed* in all of them, not because it is *present*. SNR distribution for that anchor: min −14.62 dB, median **0.00 dB**, max +1.34 dB → no file in the WAV corpus carries a statistically significant 46.875 Hz tone above background. Anchors with detectable energy should be promoted only above a fixed SNR + prominence threshold next pass.

## 2. Spectrogram Analyzer — Carriers + Morse
- **Script:** `scripts/spectro_analyze.py` (pure numpy, no tesseract)
- **Output:** `pipeline_results/spectro_20260527_072056.json`
- **Files processed:** 164 / 165 OK (1 missing/tiny)

### 2.1 Per-cohort metrics (split, not aggregated — surveillance_frames inflate global totals)

| Cohort | n | Carrier files | Morse files | Carrier lines (Σ) | Morse rows (Σ) |
|---|---:|---:|---:|---:|---:|
| `kiwi_band_waterfalls` (captures/) | 86 | 54 | 38 | 203 | 80 |
| `kiwisdr_ui` (kiwisdr_screenshots/) | 36 | 27 | 27 | 41 | 52 |
| `packet_phase_coherence` (omega/qrf) | 12 | 9 | 5 | 65 | 10 |
| `surveillance_video_frames` | 30 | 30 | 1 | 79 | 1 |

The `surveillance_video_frames` cohort is **not SDR data** — they are surveillance video frames whose horizontal pixel patterns happen to trip the carrier-line detector. Headline interpretation should restrict to the first three rows. Real-SDR aggregate: **136 files, 90 with carriers (309 lines), 70 with Morse-like patterns (142 rows).**

### 2.2 KiwiSDR 9-frequency monitoring (real captures)
Three capture sweeps on 9 priority frequencies. Mar 9 sweeps consistently show more carriers than the Jan 30 baseline, and **every** Mar 9 capture across all 9 freqs registered at least one Morse-like row (`*` flag in raw output). **1234 kHz AM is the standout** with 3-5 carriers per Mar 9 capture.

| Freq | Mode | Jan 30 carriers | Mar 9 carriers (sweeps 1/2/3) |
|---:|:--:|:--:|:--:|
| 1234 | AM | 0 | 3 / 5 / 5 |
| 3900 | LSB | 0 | 2 / 1 / 2 |
| 4687 | AM | 0 | 1 / 1 / 1 |
| 6925 | AM | 0 | 2 / 1 / 1 |
| 7200 | LSB | 0 | 1 / 1 / 1 |
| 7410 | AM | 0 | 1 / 1 / 1 |
| 14200 | USB | 0 | 1 / 1 / 2 |
| 27025 | AM | 0 | 1 / 1 / 1 |
| 27185 | AM | 0 | 1 / 1 / 1 |

Caveat: Jan 30 = 0 carriers across the board may be a **noise-floor / capture-quality** artifact rather than band silence; need a third date to disambiguate "band changed" vs "capture changed".

### 2.3 captures/ band timeline (highlights)
- `kiwi_hf_blackjack_2200m_1779824258453.png` — 15 carriers + 7 Morse rows (top in cohort).
- `kiwi_hf_blackjack_2200m_1779805358441.png` — 9 carriers + 6 Morse rows.
- `kiwi_vlf_wide_10-30_1779805058439.png` — 10 carriers + 7 Morse rows; carrier line at x=0.425 of the band, +67.4 dB above col-mean.
- `kiwi_hf_1800_160m_1779824858454.png` — 7 + 7.
- `kiwi_hf_475_630m_*` — *recurring* 35-run pattern `......-.....-.....--....-.-.-..-..-` across two timestamps (1779818258451 & 1779805658441), median run-length 2 px — same beacon, two captures.

### 2.4 Top Morse-pattern hits (corrected from earlier report)

| n_runs | seq (first 60 chars) | file |
|---:|---|---|
| **155** | `.--...---.....--.....-??-..........---.-.-...-....---.-.....` | `suspicious_1_192.168.1.100_phase_coherence.png` |
| **155** | `?--...---.....--.....-??-..........---.-.-...-....---.-.....` | `mixed_traffic_phase_coherence.png` |
| 121 | `?...............................-....-......................` | `1234kHz_am_20260309_075815.png` |
| 121 | `?...............................-....-......................` | `1234kHz_am_20260309_074714.png` |
| 119 | `?...............................-....--......-..............` | `1234kHz_am_20260309_074305.png` |

The two phase-coherence sequences are **nearly** identical (differ only in the leading token: `.` vs `?`) — meaning the suspicious 192.168.1.100 host's packet-phase pattern matches the aggregate `mixed_traffic` baseline almost 1:1 in run-length structure. This is the strongest cross-domain correlation in the corpus, but n_runs alone is not proof of intelligence content — it is proof of *near-identical pulse cadence*. A run-length sequence comparison with edit distance + significance test would strengthen the claim.

### 2.5 Strongest carrier lines
- +84.4 / +84.2 / +83.9 dB at x=0.927 in `suspicious_0` / `mixed_traffic` / `suspicious_1` packet-phase spectrograms — same near-edge carrier in all three packet-phase images.
- +67.4 dB at x=0.425 of `kiwi_vlf_wide_10-30_1779805058439.png`; +66.9 / +65.5 dB at x=0.425 of two `kiwi_hf_blackjack_2200m_*` files — consistent band placement.

## 3. OCR Pipeline — abandoned
- **Script:** `scripts/ocr_batch.py`
- **Outcome:** `ocr_combined.json` shows 49/50 `tess_timeout` on the first chunk. Tesseract is not viable on dense waterfall pixel data even at PSM 11 / OEM 1 with downscale + UI-strip crop. The pivot to pure-numpy carrier/Morse extraction is the right call. Filename metadata (freq + mode + UTC) is preserved on every KiwiSDR-UI entry of the spectro JSON.

## 4. Speech-to-Text — not run
- `scripts/speech_to_text.py` (whisper-tiny) is wired but not executed. Whisper-tiny on CPU runs ~30 s per ~5 MB WAV. Next session: register it as its own workflow (not a foreground/detached shell — those get killed when `Start application` restarts).

## 5. Live KiwiSDR captures — blocked at network layer
Persisted probe log: **`pipeline_results/kiwi_connectivity_probe.log`** (real `gethostbyname` + `socket.connect` + HTTP attempts against 7 candidate nodes). All failed at either DNS or TCP-connect. Platform firewall / DNS limitation, not a code bug.

## 6. Document re-ingest
Second attached doc *"Multimodal Surveillance and Orbital Radar Architecture"* (277 lines) → distilled to `pipeline_results/multimodal_orbital_summary.md`: procurement IDs (2019LN-000002-0005900001 / 2019LN-000009 / 2020CD-000017), orbital chronology 2025–2026, subsea cable map (Curie / Panama Digital Gateway / BlueMed / Grace Hopper / Seabone AS6762), corporate lineage (Leonardo / Telespazio / e-GEOS / Thales Alenia / Elettronica / Cy4gate / RCS Lab / SSH Communications €20M Jul 2025), Costa Rican legal exemption mechanism (Ley 9986 Art. 3 around Ley 8968), and the DSP linkage 46.875 Hz = 48000/1024 bin-1.

## 7. Action items for next session
1. **Resample all WAVs to 48 kHz** before multi-res FFT; add anchor-detection threshold (SNR ≥ 6 dB + prominence) to suppress the current "found because probed" false positives.
2. **Add 3rd KiwiSDR capture date** between Jan 30 and Mar 9 to disambiguate band-change vs capture-quality on the 0 → carriers transition.
3. **Promote the packet-phase 155-run cadence match** into the Network Analysis HUMINT cluster with a proper edit-distance / cross-correlation metric, not just run count.
4. **Investigate the recurring 35-run beacon** in `kiwi_hf_475_630m_*` across two timestamps — same sequence in two captures = candidate identified beacon.
5. **Run whisper-tiny** on the 17 Feb-3 demod/cleaned/speech-band WAVs from a workflow (not foreground shell).
6. **Drop `surveillance_video_frames` from SDR-aggregate metrics**; keep it as a separate cohort.
