#!/usr/bin/env python3
import csv
import json
from pathlib import Path

BASELINE = Path("satellite_window_sweep_2026-03-06_resilient.json")
HIGHCOV = Path("satellite_window_sweep_2026-03-06_highcov_2min.json")

OUT_BASE = Path("satellite_window_sweep_2026-03-06_resilient_timeline.csv")
OUT_HIGH = Path("satellite_window_sweep_2026-03-06_highcov_2min_timeline.csv")
OUT_DIFF = Path("satellite_window_sweep_2026-03-06_diff_summary.csv")


def load_json(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_timeline(data: dict, output_csv: Path):
    rows = []
    for target in data.get("targets", []):
        name = target.get("name", "")
        const = target.get("const", "")
        passes = target.get("passes", [])
        sample_count = target.get("sample_count", 0)
        for idx, p in enumerate(passes, start=1):
            rows.append({
                "target": name,
                "const": const,
                "pass_index": idx,
                "start": p.get("start", ""),
                "end": p.get("end", ""),
                "peak_time": p.get("peak_time", ""),
                "peak_el": p.get("peak_el", ""),
                "sample_count": sample_count,
            })

    rows.sort(key=lambda r: (r["target"], r["pass_index"]))
    with output_csv.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "target",
                "const",
                "pass_index",
                "start",
                "end",
                "peak_time",
                "peak_el",
                "sample_count",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)
    return rows


def aggregate_by_target(data: dict):
    agg = {}
    for target in data.get("targets", []):
        name = target.get("name", "")
        const = target.get("const", "")
        passes = target.get("passes", [])
        peak = max((p.get("peak_el", 0) for p in passes), default=0)
        agg[name] = {
            "const": const,
            "pass_count": len(passes),
            "peak_el": float(peak),
            "sample_count": int(target.get("sample_count", 0)),
        }
    return agg


def write_diff(baseline: dict, highcov: dict, output_csv: Path):
    b = aggregate_by_target(baseline)
    h = aggregate_by_target(highcov)

    names = sorted(set(b.keys()) | set(h.keys()))
    rows = []
    for name in names:
        b_row = b.get(name, {"const": "", "pass_count": 0, "peak_el": 0.0, "sample_count": 0})
        h_row = h.get(name, {"const": "", "pass_count": 0, "peak_el": 0.0, "sample_count": 0})
        rows.append(
            {
                "target": name,
                "const": h_row["const"] or b_row["const"],
                "baseline_passes": b_row["pass_count"],
                "highcov_passes": h_row["pass_count"],
                "delta_passes": h_row["pass_count"] - b_row["pass_count"],
                "baseline_peak_el": round(b_row["peak_el"], 2),
                "highcov_peak_el": round(h_row["peak_el"], 2),
                "delta_peak_el": round(h_row["peak_el"] - b_row["peak_el"], 2),
                "baseline_samples": b_row["sample_count"],
                "highcov_samples": h_row["sample_count"],
                "delta_samples": h_row["sample_count"] - b_row["sample_count"],
                "new_in_highcov": int(name not in b and name in h),
            }
        )

    rows.sort(key=lambda r: (r["new_in_highcov"], r["delta_passes"], r["highcov_peak_el"]), reverse=True)

    with output_csv.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "target",
                "const",
                "baseline_passes",
                "highcov_passes",
                "delta_passes",
                "baseline_peak_el",
                "highcov_peak_el",
                "delta_peak_el",
                "baseline_samples",
                "highcov_samples",
                "delta_samples",
                "new_in_highcov",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    return rows


def main():
    baseline = load_json(BASELINE)
    highcov = load_json(HIGHCOV)

    base_rows = write_timeline(baseline, OUT_BASE)
    high_rows = write_timeline(highcov, OUT_HIGH)
    diff_rows = write_diff(baseline, highcov, OUT_DIFF)

    print(f"Wrote: {OUT_BASE} ({len(base_rows)} rows)")
    print(f"Wrote: {OUT_HIGH} ({len(high_rows)} rows)")
    print(f"Wrote: {OUT_DIFF} ({len(diff_rows)} rows)")

    baseline_targets = baseline.get("counts", {}).get("targets_with_visibility", 0)
    highcov_targets = highcov.get("counts", {}).get("targets_with_visibility", 0)
    print(f"Baseline targets_with_visibility: {baseline_targets}")
    print(f"Highcov  targets_with_visibility: {highcov_targets}")


if __name__ == "__main__":
    main()
