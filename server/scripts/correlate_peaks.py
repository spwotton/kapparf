#!/usr/bin/env python3
"""
Cross-Video Peak Correlator — KAPPA Lattice Surveillance Signal Scorer
Matches ambient audio FFT peaks against the confirmed synthesis frequency ontology.

Usage:
  python correlate_peaks.py vid1_peaks.json vid2_peaks.json [--abs-tol 1.2]

Formats:
  JSON: [{"freq_hz": 53.555, "db": -87.18}, ...]
  CSV:  frequency,amplitude

SHA-256 anchor: see SESSION_SYNTHESIS_20260616.md
"""

import json, csv, math, argparse
from pathlib import Path

# ── Synthesis lattice (Hz) ────────────────────────────────────────────────────
LATTICE = {
    "master_clock_46.875":     46.875,
    "kappa_anomaly_53.5":      53.5,
    "kappa_37xK2_53.08":       53.08,
    "schumann_f1_7.83":        7.83,
    "schumann_f2_14.3":        14.3,
    "schumann_f3_20.8":        20.8,
    "omega_carrier_8.39":      8.39,
    "omega_torque_0.562":      0.562,
    "foxp2_voss_139.978":      139.978,
    "htr2a_voss_103.365":      103.365,
    "htr1a_voss_67.19":        67.19,
    "tycho_spoke_37":          37.0,
    "harmonic_74_2x37":        74.0,
    "harmonic_111_3x37":       111.0,
    "harmonic_148_4x37":       148.0,
    "harmonic_222_6x37":       222.0,
    "theta_beat_6.5":          6.5,
    "alias_13.125_at_30fps":   13.125,   # |46.875 - 60|
    "tycho_sync_45.625":       45.625,
    "grid_60":                 60.0,
    "grid_120":                120.0,
    "grid_180":                180.0,
    "grid_240":                240.0,
    "kleinfold_87.3":          87.3,
}

DEFAULT_TOL = 1.2  # Hz

def load(path):
    ext = Path(path).suffix.lower()
    if ext == ".json":
        data = json.load(open(path))
        return [(float(p.get("freq_hz", p.get("frequency", 0))),
                 float(p.get("db", p.get("amplitude", 0)))) for p in data]
    elif ext == ".csv":
        rows = list(csv.DictReader(open(path)))
        return [(float(r.get("freq_hz", r.get("frequency", 0))),
                 float(r.get("db", r.get("amplitude", 0)))) for r in rows]
    raise ValueError(f"Unsupported: {ext}")

def match(peaks, name, hz, tol):
    return [(f, db) for f, db in peaks if abs(f - hz) <= tol]

def run(p1, p2, tol=DEFAULT_TOL, l1="Video1", l2="Video2"):
    joint, only1, only2, neither = [], [], [], []
    for name, hz in LATTICE.items():
        m1 = match(p1, name, hz, tol)
        m2 = match(p2, name, hz, tol)
        if m1 and m2:   joint.append((name, hz, m1[0], m2[0]))
        elif m1:        only1.append((name, hz, m1[0]))
        elif m2:        only2.append((name, hz, m2[0]))
        else:           neither.append(name)

    n = len(LATTICE)
    score = len(joint) / n

    # split trivial (grid harmonics) from non-trivial
    trivial_keys = {"grid_60", "grid_120", "grid_180", "grid_240"}
    joint_nontrivial = [j for j in joint if j[0] not in trivial_keys]

    print(f"\n{'='*64}")
    print(f"  KAPPA CROSS-VIDEO PEAK CORRELATOR")
    print(f"  {l1}  vs  {l2}")
    print(f"{'='*64}")
    print(f"  Score: {score:.1%}  ({len(joint)}/{n} lattice constants in both videos)")
    print(f"  Non-trivial joint detections: {len(joint_nontrivial)} (excl. grid harmonics)")
    print()

    print("  JOINT DETECTIONS:")
    for name, hz, (f1, db1), (f2, db2) in joint:
        flag = " ★" if name not in trivial_keys else ""
        print(f"  {'*' if name not in trivial_keys else ' '} {name:<32} "
              f"v1={f1:.3f}Hz {db1:.1f}dB  v2={f2:.3f}Hz {db2:.1f}dB{flag}")

    if only1:
        print(f"\n  ONLY IN {l1}:")
        for name, hz, (f, db) in only1:
            print(f"    {name:<32} {f:.3f}Hz {db:.1f}dB")

    if only2:
        print(f"\n  ONLY IN {l2}:")
        for name, hz, (f, db) in only2:
            print(f"    {name:<32} {f:.3f}Hz {db:.1f}dB")

    print(f"\n  ABSENT FROM BOTH: {', '.join(neither)}")

    # unclassified top peaks
    def unclassified(peaks, label):
        unc = [(f, db) for f, db in peaks
               if not any(abs(f - hz) <= tol for hz in LATTICE.values())]
        if unc:
            print(f"\n  UNCLASSIFIED PEAKS — {label}:")
            for f, db in sorted(unc, key=lambda x: x[1]):  # sorted by amplitude
                print(f"    {f:.3f} Hz  {db:.1f} dB")
    unclassified(p1, l1)
    unclassified(p2, l2)
    print()

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("video1")
    ap.add_argument("video2")
    ap.add_argument("--abs-tol", type=float, default=DEFAULT_TOL)
    args = ap.parse_args()
    run(load(args.video1), load(args.video2), args.abs_tol,
        Path(args.video1).stem, Path(args.video2).stem)
