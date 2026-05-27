#!/usr/bin/env python3
"""Fast parallel OCR + Morse detector across all real SDR/spectrogram images.
- Pre-resize via PIL to <=1200px wide -> tmp PNG
- Single tesseract pass, PSM 6, OEM 1 (LSTM), 5s timeout
- 6-worker ThreadPool, checkpoint every 20 files
"""
import json, os, sys, time, subprocess, re, tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import numpy as np
from PIL import Image

_targets_file = "pipeline_results/ocr_targets_sdr.txt" if os.path.exists("pipeline_results/ocr_targets_sdr.txt") else "pipeline_results/ocr_targets.txt"
TARGETS = [t for t in Path(_targets_file).read_text().strip().split("\n") if t.strip()]
OUT = Path(f"pipeline_results/ocr_batch_{time.strftime('%Y%m%d_%H%M%S')}.json")
CKPT = Path("pipeline_results/ocr_batch_ckpt.json")

FREQ_RE = re.compile(r"\b\d{1,5}(?:[.,]\d+)?\s?[kMG]?Hz\b", re.I)
TIME_RE = re.compile(r"\b\d{1,2}:\d{2}(?::\d{2})?\b")
DB_RE   = re.compile(r"-?\d{1,3}\s?dB[m]?", re.I)
DATE_RE = re.compile(r"\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b")

FNAME_KIWI = re.compile(r"(\d+)kHz_([a-z]+)_(\d{8})_(\d{6})", re.I)

def ocr_one(path):
    out = {"file": path, "ok": False}
    try:
        if not os.path.exists(path) or os.path.getsize(path) < 500:
            out["err"] = "missing_or_tiny"; return out
        # filename metadata (always free, always real)
        m = FNAME_KIWI.search(os.path.basename(path))
        if m:
            out["fname_meta"] = {"freq_kHz": int(m.group(1)), "mode": m.group(2),
                                 "date": m.group(3), "time_utc": m.group(4)}
        # preprocess: open, downscale, convert to L
        img = Image.open(path).convert("L")
        # For KiwiSDR-style UI screenshots, crop the top 180px (control bar with freq/labels)
        # and the left 80px (freq axis), avoiding the dense waterfall middle
        is_kiwi_ui = "kiwisdr_screenshots" in path or "kiwi_capture" in path or m
        if is_kiwi_ui and img.height > 250:
            top = img.crop((0, 0, img.width, 180))
            left = img.crop((0, 180, 80, img.height))
            # stack vertically
            stacked = Image.new("L", (max(top.width, left.width), top.height + left.height), 255)
            stacked.paste(top, (0, 0))
            stacked.paste(left, (0, top.height))
            img = stacked
        if img.width > 1200:
            scale = 1200 / img.width
            img = img.resize((1200, int(img.height * scale)))
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            tmp_path = f.name
        try:
            img.save(tmp_path, "PNG")
            r = subprocess.run(
                ["tesseract", tmp_path, "-", "--psm", "11", "--oem", "1"],
                capture_output=True, text=True, timeout=8)
            text = (r.stdout or "").strip()
        finally:
            try: os.unlink(tmp_path)
            except: pass
        # Morse run-length on the pixel array
        morse_hits = []
        try:
            arr = np.array(img)
            if arr.shape[0] > 400:
                arr = arr[::max(1, arr.shape[0]//400)]
            thr = arr.mean() + arr.std() * 0.7
            for row in range(0, arr.shape[0], max(arr.shape[0]//8, 1)):
                line = (arr[row] > thr).astype(np.int8)
                # RLE
                changes = np.diff(line, prepend=line[0]^1)
                idx = np.flatnonzero(changes)
                if len(idx) < 6: continue
                runs = np.diff(np.concatenate([idx, [len(line)]]))
                vals = line[idx]
                on_runs = runs[vals == 1]
                on_runs = on_runs[on_runs >= 2]
                if len(on_runs) >= 4:
                    med = float(np.median(on_runs))
                    if med > 0:
                        ratios = on_runs / med
                        dots = int((ratios < 1.8).sum())
                        dashes = int(((ratios >= 2.2) & (ratios < 4.5)).sum())
                        if dots >= 3 and dashes >= 2:
                            seq = "".join("." if r < 1.8 else ("-" if r < 4.5 else "?")
                                          for r in ratios.tolist())
                            morse_hits.append({"row": int(row), "seq": seq[:50],
                                               "dots": dots, "dashes": dashes,
                                               "med_px": round(med, 1)})
        except Exception as e:
            out["morse_err"] = str(e)[:80]
        out["ok"] = True
        out["text_len"] = len(text)
        out["text_sample"] = text[:300] if text else ""
        out["freqs"] = FREQ_RE.findall(text)[:15]
        out["times"] = TIME_RE.findall(text)[:10]
        out["dbs"]   = DB_RE.findall(text)[:10]
        out["dates"] = ["-".join(m) for m in DATE_RE.findall(text)][:5]
        out["morse"] = morse_hits[:5]
        return out
    except subprocess.TimeoutExpired:
        out["err"] = "tess_timeout"
        return out
    except Exception as e:
        out["err"] = str(e)[:120]
        return out

def main():
    print(f"[ocr] {len(TARGETS)} targets -> {OUT}", flush=True)
    results = []
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(ocr_one, t): t for t in TARGETS}
        for i, fut in enumerate(as_completed(futs), 1):
            try:
                r = fut.result(timeout=30)
            except Exception as e:
                r = {"file": futs[fut], "ok": False, "err": f"future:{e}"}
            results.append(r)
            if i % 5 == 0 or i == len(TARGETS):
                dt = time.time() - t0
                rate = i/dt if dt > 0 else 0
                eta = (len(TARGETS)-i)/rate if rate > 0 else 0
                ok = sum(1 for x in results if x.get("ok"))
                print(f"  [{i:4d}/{len(TARGETS)}] ok={ok} {dt:6.1f}s {rate:4.1f}/s ETA {eta:5.0f}s",
                      flush=True)
            if i % 20 == 0:
                CKPT.write_text(json.dumps(results))
    OUT.write_text(json.dumps(results, indent=2))
    ok = sum(1 for r in results if r.get("ok"))
    with_text = sum(1 for r in results if r.get("text_len", 0) > 5)
    with_freq = sum(1 for r in results if r.get("freqs"))
    with_morse = sum(1 for r in results if r.get("morse"))
    print(f"[ocr] DONE ok={ok}/{len(results)} text>5={with_text} freqs={with_freq} morse={with_morse} in {time.time()-t0:.1f}s",
          flush=True)
    print(f"[ocr] wrote {OUT}", flush=True)

if __name__ == "__main__":
    main()
