#!/usr/bin/env python3
"""Run OCR on a single chunk of TARGETS (offset, count), append to results JSON."""
import sys, json, time, os
sys.path.insert(0, os.path.dirname(__file__))
from concurrent.futures import ThreadPoolExecutor, as_completed
from ocr_batch import ocr_one, TARGETS

OUT = "pipeline_results/ocr_combined.json"

def main():
    offset = int(sys.argv[1])
    count = int(sys.argv[2])
    chunk = TARGETS[offset:offset+count]
    # load existing
    if os.path.exists(OUT):
        results = json.load(open(OUT))
    else:
        results = []
    done_files = {r["file"] for r in results}
    chunk = [c for c in chunk if c not in done_files]
    if not chunk:
        print(f"[chunk {offset}+{count}] all already done"); return
    print(f"[chunk {offset}+{count}] processing {len(chunk)} files", flush=True)
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(ocr_one, t): t for t in chunk}
        for i, fut in enumerate(as_completed(futs), 1):
            try: r = fut.result(timeout=20)
            except Exception as e: r = {"file": futs[fut], "ok": False, "err": f"fut:{e}"}
            results.append(r)
            if i % 5 == 0 or i == len(chunk):
                print(f"  {i}/{len(chunk)} {time.time()-t0:.1f}s", flush=True)
    json.dump(results, open(OUT, "w"))
    ok = sum(1 for r in results if r.get("ok"))
    txt = sum(1 for r in results if r.get("text_len", 0) > 5)
    mor = sum(1 for r in results if r.get("morse"))
    print(f"[chunk] total={len(results)} ok={ok} text>5={txt} morse={mor} in {time.time()-t0:.1f}s")

if __name__ == "__main__":
    main()
