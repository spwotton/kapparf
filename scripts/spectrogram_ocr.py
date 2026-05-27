#!/usr/bin/env python3
"""
Spectrogram OCR + Morse detector.
Runs Tesseract on every KiwiSDR/capture PNG to extract:
  - axis labels, frequency annotations, station call signs visible on the waterfall
  - text overlays from KiwiSDR UI (S-meter, station ID, time)
Then runs a Morse decoder on the horizontal energy-bar pattern.

Outputs:
  pipeline_results/spectrogram_ocr_<ts>.json
"""
import os, sys, json, glob, re
from pathlib import Path
from datetime import datetime
import numpy as np
from PIL import Image, ImageOps, ImageFilter
import pytesseract

OUT = Path("pipeline_results"); OUT.mkdir(exist_ok=True)
TS  = datetime.now().strftime("%Y%m%d_%H%M%S")

# Morse table (reverse lookup)
MORSE = {
    ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F",
    "--.": "G", "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L",
    "--": "M", "-.": "N", "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R",
    "...": "S", "-": "T", "..-": "U", "...-": "V", ".--": "W", "-..-": "X",
    "-.--": "Y", "--..": "Z",
    "-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",
    ".....":"5","-....":"6","--...":"7","---..":"8","----.":"9",
}

def ocr_image(path):
    """Run tesseract with two pass strategies on a spectrogram."""
    try:
        img = Image.open(path).convert("RGB")
    except Exception as e:
        return {"error": f"open_fail:{e}"}
    W, H = img.size
    # Pass 1: full image, default
    txt_default = pytesseract.image_to_string(img, config="--psm 6")
    # Pass 2: invert + threshold (white-on-black spectrograms work better inverted)
    g = ImageOps.grayscale(img)
    inv = ImageOps.invert(g)
    bw = inv.point(lambda p: 255 if p > 128 else 0)
    txt_inv = pytesseract.image_to_string(bw, config="--psm 6")
    # Pass 3: bottom strip (axis labels and time markers usually live there)
    bot = img.crop((0, int(H*0.85), W, H))
    bot_g = ImageOps.grayscale(bot)
    txt_bot = pytesseract.image_to_string(bot_g, config="--psm 6")
    # Extract candidate freq labels
    combined = "\n".join([txt_default, txt_inv, txt_bot])
    freq_hits = re.findall(r"(\d{2,6}(?:\.\d+)?)\s*(?:kHz|MHz|Hz)", combined, re.IGNORECASE)
    callsign_hits = re.findall(r"\b[A-Z]{1,2}\d[A-Z]{1,3}\b", combined)
    return {
        "width": W, "height": H,
        "text_default": txt_default.strip(),
        "text_inverted": txt_inv.strip(),
        "text_bottom_strip": txt_bot.strip(),
        "freq_labels": list(set(freq_hits))[:50],
        "candidate_callsigns": list(set(callsign_hits))[:20],
    }

def detect_morse(path):
    """Detect horizontal energy bars in spectrogram as potential Morse.
    Heuristic: scan middle row band, find contiguous bright spans, classify by length."""
    try:
        img = Image.open(path).convert("L")
    except Exception:
        return None
    a = np.array(img, dtype=np.float32)
    H, W = a.shape
    # Use middle 40% vertical band, sum columns
    band = a[int(H*0.30):int(H*0.70), :]
    col_intensity = band.mean(axis=0)
    # Normalize
    if col_intensity.max() - col_intensity.min() < 5:
        return {"detected": False, "reason": "no_contrast"}
    norm = (col_intensity - col_intensity.min()) / (col_intensity.max() - col_intensity.min() + 1e-9)
    # Threshold
    thresh = np.percentile(norm, 80)  # top 20% bright cols
    binary = norm > thresh
    # Run-length encode
    runs = []
    i = 0
    while i < len(binary):
        j = i
        while j < len(binary) and binary[j] == binary[i]:
            j += 1
        runs.append((bool(binary[i]), j - i))
        i = j
    if len(runs) < 4:
        return {"detected": False, "reason": "too_few_runs"}
    on_runs  = [n for v, n in runs if v]
    off_runs = [n for v, n in runs if not v]
    if not on_runs:
        return {"detected": False, "reason": "no_on_runs"}
    # Classify on-runs as dot/dash by median split
    med_on  = float(np.median(on_runs))
    med_off = float(np.median(off_runs)) if off_runs else med_on
    dot_max = med_on * 1.8
    classified = []
    for v, n in runs:
        if v:
            classified.append("." if n <= dot_max else "-")
        else:
            # Letter gap ~ 3*dot, word gap ~ 7*dot
            if n > med_off * 4: classified.append(" / ")
            elif n > med_off * 1.8: classified.append(" ")
    pattern = "".join(classified).strip()
    # Decode tokens
    decoded_words = []
    for word in pattern.split(" / "):
        letters = []
        for sym in word.split(" "):
            sym = sym.strip()
            if sym in MORSE:
                letters.append(MORSE[sym])
            elif sym:
                letters.append(f"?{sym}?")
        decoded_words.append("".join(letters))
    decoded = " ".join(decoded_words).strip()
    return {
        "detected": True,
        "on_count": len(on_runs),
        "off_count": len(off_runs),
        "median_on_px": med_on,
        "median_off_px": med_off,
        "pattern_preview": pattern[:200],
        "decoded_preview": decoded[:200],
        "decoded_full_len": len(decoded),
    }

def main():
    targets = []
    for pattern in [
        "captures/*.png",
        "kiwisdr_screenshots/*.png",
        "signal_forensics/**/*.png",
        "kiwi_captures/**/*.png",
    ]:
        targets.extend(glob.glob(pattern, recursive=True))
    targets = sorted(set(targets))
    print(f"[ocr] processing {len(targets)} spectrogram images")
    results = []
    for i, t in enumerate(targets, 1):
        print(f"  [{i:3d}/{len(targets)}] {os.path.basename(t)}")
        rec = {"file": t}
        try:
            rec["ocr"] = ocr_image(t)
        except Exception as e:
            rec["ocr_error"] = str(e)
        try:
            rec["morse"] = detect_morse(t)
        except Exception as e:
            rec["morse_error"] = str(e)
        results.append(rec)
    out = {
        "generated_at": datetime.now().isoformat(),
        "image_count": len(results),
        "results": results,
    }
    path = OUT / f"spectrogram_ocr_{TS}.json"
    path.write_text(json.dumps(out, indent=2))
    print(f"[ocr] wrote {path}")

if __name__ == "__main__":
    main()
