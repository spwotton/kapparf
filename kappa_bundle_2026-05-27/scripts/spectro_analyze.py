#!/usr/bin/env python3
"""Fast spectrogram analyzer — no tesseract dependency.
- Filename metadata extraction (freq + mode + UTC)
- Morse run-length detector per image (multiple rows)
- Carrier-line detector (columns with sustained high energy = continuous tones)
- Per-image energy distribution (bottom/mid/top thirds)
"""
import json, os, re, time, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import numpy as np
from PIL import Image

TARGETS = [t for t in Path("pipeline_results/ocr_targets_sdr.txt").read_text().strip().split("\n") if t.strip()]
OUT = Path(f"pipeline_results/spectro_{time.strftime('%Y%m%d_%H%M%S')}.json")

FNAME_KIWI = re.compile(r"(\d+)kHz_([a-z]+)_(\d{8})_(\d{6})", re.I)
FNAME_CAPTURE = re.compile(r"kiwi_(\w+?)_(\d+)_?(\d+)?_(\d{10,13})", re.I)

def analyze_one(path):
    out = {"file": path, "ok": False}
    try:
        if not os.path.exists(path) or os.path.getsize(path) < 500:
            out["err"] = "missing_or_tiny"; return out
        m = FNAME_KIWI.search(os.path.basename(path))
        if m:
            out["meta"] = {"type": "kiwiui", "freq_kHz": int(m.group(1)),
                           "mode": m.group(2), "utc_date": m.group(3),
                           "utc_time": m.group(4)}
        else:
            m2 = FNAME_CAPTURE.search(os.path.basename(path))
            if m2:
                out["meta"] = {"type": "capture", "band": m2.group(1),
                               "range_start_mhz": int(m2.group(2)),
                               "range_end_mhz": int(m2.group(3)) if m2.group(3) else None,
                               "epoch_ms": int(m2.group(4))}
        img = Image.open(path).convert("L")
        # crop to waterfall area: skip top 200 (UI) and bottom 30 if KiwiSDR-style
        if "kiwisdr_screenshots" in path or "captures" in path:
            crop_top = 200 if img.height > 400 else 50
            img = img.crop((80, crop_top, img.width, img.height - 30))
        arr = np.array(img, dtype=np.float32)
        # downscale if huge
        if arr.shape[1] > 1400:
            step = arr.shape[1] // 1400
            arr = arr[:, ::step]
        out["dim"] = list(arr.shape)
        out["mean"] = float(arr.mean())
        out["std"] = float(arr.std())
        # Energy distribution across freq axis (columns)
        col_means = arr.mean(axis=0)
        col_thr = col_means.mean() + 1.5 * col_means.std()
        carrier_cols = np.flatnonzero(col_means > col_thr)
        # group consecutive carrier columns into "lines"
        carriers = []
        if len(carrier_cols) > 0:
            gaps = np.diff(carrier_cols)
            split_pts = np.flatnonzero(gaps > 3)
            groups = np.split(carrier_cols, split_pts + 1)
            for g in groups:
                if len(g) >= 2:
                    carriers.append({"col_start": int(g[0]), "col_end": int(g[-1]),
                                     "frac_x": round(float(g.mean()) / arr.shape[1], 4),
                                     "energy_db_above_mean": round(float(col_means[g].mean() - col_means.mean()), 2)})
        out["carrier_lines"] = carriers[:20]
        out["n_carriers"] = len(carriers)
        # Morse detection across N horizontal rows
        morse_hits = []
        thr = arr.mean() + arr.std() * 0.7
        n_rows_sample = min(20, arr.shape[0])
        rows_to_check = np.linspace(0, arr.shape[0]-1, n_rows_sample).astype(int)
        for row in rows_to_check:
            line = (arr[row] > thr).astype(np.int8)
            if line.sum() < 4: continue
            changes = np.diff(line, prepend=line[0]^1)
            idx = np.flatnonzero(changes)
            if len(idx) < 6: continue
            runs = np.diff(np.concatenate([idx, [len(line)]]))
            vals = line[idx]
            on_runs = runs[vals == 1]
            on_runs = on_runs[on_runs >= 2]
            if len(on_runs) >= 5:
                med = float(np.median(on_runs))
                if med > 0:
                    ratios = on_runs / med
                    dots = int((ratios < 1.8).sum())
                    dashes = int(((ratios >= 2.2) & (ratios < 4.5)).sum())
                    if dots >= 3 and dashes >= 3:
                        seq = "".join("." if r < 1.8 else ("-" if r < 4.5 else "?")
                                      for r in ratios.tolist())
                        morse_hits.append({"row": int(row), "seq": seq[:60],
                                           "dots": dots, "dashes": dashes,
                                           "med_px": round(med, 1),
                                           "n_runs": int(len(on_runs))})
        out["morse"] = morse_hits[:5]
        out["n_morse_rows"] = len(morse_hits)
        # Vertical / horizontal energy split (top/mid/bot thirds — coarse temporal)
        h = arr.shape[0]
        out["energy_thirds_db"] = [
            round(float(arr[:h//3].mean()), 2),
            round(float(arr[h//3:2*h//3].mean()), 2),
            round(float(arr[2*h//3:].mean()), 2),
        ]
        out["ok"] = True
        return out
    except Exception as e:
        out["err"] = str(e)[:200]
        return out

def main():
    print(f"[spectro] {len(TARGETS)} targets -> {OUT}", flush=True)
    results = []
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(analyze_one, t): t for t in TARGETS}
        for i, fut in enumerate(as_completed(futs), 1):
            try: r = fut.result(timeout=15)
            except Exception as e: r = {"file": futs[fut], "ok": False, "err": f"fut:{e}"}
            results.append(r)
            if i % 10 == 0 or i == len(TARGETS):
                print(f"  {i:4d}/{len(TARGETS)} {time.time()-t0:5.1f}s", flush=True)
    json.dump(results, open(OUT, "w"), indent=2)
    ok = sum(1 for r in results if r.get("ok"))
    with_morse = sum(1 for r in results if r.get("morse"))
    with_carriers = sum(1 for r in results if r.get("n_carriers", 0) > 0)
    total_carriers = sum(r.get("n_carriers", 0) for r in results)
    total_morse_rows = sum(r.get("n_morse_rows", 0) for r in results)
    print(f"[spectro] DONE ok={ok}/{len(results)} morse_files={with_morse} ({total_morse_rows} rows) carrier_files={with_carriers} ({total_carriers} lines) in {time.time()-t0:.1f}s")
    print(f"[spectro] wrote {OUT}")

if __name__ == "__main__":
    main()
