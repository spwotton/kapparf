---
name: Tesseract on SDR waterfall images
description: Why tesseract hangs on dense spectrogram pixel data and how to work around it
---

**Rule:** Tesseract OCR with PSM 6/11/12 hangs (>>8 s, often >30 s) on dense SDR waterfall/spectrogram PNGs that have no UI text overlay. The legacy OEM is even worse than `--oem 1` (LSTM only).

**Why:** PSM modes that look for blocks/sparse text iterate the layout analyzer over every high-contrast pixel cluster in the waterfall, which is effectively noise. Adding a `tessedit_char_whitelist` makes it slower, not faster.

**How to apply:**
- For KiwiSDR UI screenshots: crop top ~180 px (control bar) + left ~80 px (freq axis) before OCR; the dense waterfall middle has no recoverable text.
- For pure waterfall captures with no UI: skip tesseract entirely. Use filename metadata + pure-numpy carrier/Morse detection.
- Always wrap tesseract in `subprocess.run(..., timeout=8)` because hung tesseract processes survive Pool/Executor teardown.
- Pre-downscale to ≤1200 px width via PIL before handing to tesseract.
