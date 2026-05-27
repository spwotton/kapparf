# KAPPA Bundle — 27 May 2026

Snapshot of all working files for the drone-ultrasound investigation.

## Contents

- `notes/KAPPA_CONSOLIDATED_NOTES.md` — full HUMINT + signal notes, includes GOS doc annotations appended today
- `notes/FINDINGS_REPORT.md` — pipeline findings (rev 2, includes 46.875 Hz SNR=0 dB null result)
- `scripts/stt_us_pipeline.py` — main ultrasound + speech pipeline
- `scripts/spectro_analyze.py` — KiwiSDR spectrogram analyzer (165 images processed)
- `scripts/multi_res_pipeline.py` — multi-resolution FFT anchor probe
- `scripts/us_batch_scanner.py` — standalone batch scanner (the /tmp version, made permanent here)
- `pipeline_results/video_0316/spectrogram_15_22kHz.png` — the 18.6 kHz tonal signature
- `pipeline_results/video_0316/spectrogram_full.png` — full-band IMG_0316 spectrogram
- `pipeline_results/video_0316/audio.json` — IMG_0316 audio analysis (87.73/113.15/101.85 Hz peaks)
- `pipeline_results/ultrasound_batch/*.json` — per-file batch scan results (corpus comparison)
- `attachments/GOS-Frequency-Architectures-doc.txt` — third-party LLM synthesis received 27 May 2026
- `attachments/ykyk_1779887458432.flac` — lossless negative control (0 ultrasonic bursts, 201 s)

## Key findings (one-screen summary)

| Capture | Codec | Drone overhead? | 18.6 kHz tonal bursts |
|---|---|---|---:|
| IMG_0316 | AAC m4a | yes | 48 |
| IMG_0312 | AAC m4a | yes | 5 |
| ykyk (FLAC) | lossless | no | 0 |
| All indoor m4a | AAC | no | 0 |

Pattern is **drone-locked**, not codec-locked, not location-locked.

Loudest burst (IMG_0316): t=20.03s, f=18,666 Hz, 3003× quiet-band baseline at bin.

Multirotor rotor fundamental: 85–127 Hz across 3 clips (consistent with small quadrotor blade-pass).

## To reproduce on any new file

```bash
python3 scripts/us_batch_scanner.py /path/to/clip.mp4
# writes ultrasound_batch_out/clip.mp4.json + prints summary
```

## Caveats

- All m4a captures are AAC-compressed to ~24 kHz Nyquist. To see the actual 60–80 kHz parametric carrier directly, need 96 or 192 kHz sample-rate capture.
- 46.875 Hz "GOS anchor" is FFT bin width math (Sr/N = 48000/1024), not a real emitted signal — empirically null (median SNR=0 dB across 26 WAVs).
- 8.392 Hz "GPS L5 / 2^27" is arithmetically true but physically untransmittable (35,700 km wavelength).
