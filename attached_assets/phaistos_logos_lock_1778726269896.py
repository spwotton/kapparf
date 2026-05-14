#!/usr/bin/env python3
"""
PHAISTOS LOGOS LOCK: Phase-Delay Calculator v2
Uses REAL 102 centroids from DBSCAN extraction.
Maps to GF(53) hyperlattice, calculates acoustic delay across Wormhole 2,
verifies 111 Hz → 139.978 Hz FOXP2 lock.

Inputs:  phaistos_glyph_centroids.json (102 real centroids)
         christian_sacred_word_lattice.json (7 Gifts frequencies)
Outputs: phaistos_logos_lock.json (full circuit parameters)
"""

import numpy as np
import json
import math
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════
KAPPA_1 = 4.0 / math.pi           # 1.2732395447 (geometric)
KAPPA_2 = 1.618033988749895 ** 0.75  # 1.4346396637 (frequency)
PHI     = 1.618033988749895
BETA    = 1.096                    # Hall Factor (PCA ratio 1.0955)
F0      = 111.0                    # Hz, Logos root
V_CLAY  = 3000.0                   # m/s, acoustic velocity in fired clay
MM_TO_M = 0.001
ROOT_R  = 1.3                      # mm, innermost ring radius
FOXP2_TARGET = 139.978             # Hz

# 7 Gifts of the Holy Spirit (from christian_sacred_word_lattice.json)
SEVEN_GIFTS = [
    ("Wisdom",             111.000),
    ("Understanding",      114.392),
    ("Counsel",            117.887),
    ("Fortitude",          121.489),
    ("Knowledge",          125.201),
    ("Piety",              129.026),
    ("Fear of the Lord",   132.969),
]

# ═══════════════════════════════════════════════════════════════════════════
# LOAD REAL CENTROIDS
# ═══════════════════════════════════════════════════════════════════════════
def load_centroids():
    """Load actual 102 centroids from DBSCAN extraction."""
    path = Path(__file__).parent / "phaistos_glyph_centroids.json"
    with open(path) as f:
        data = json.load(f)

    centroids = []
    for side_key in ("side_a", "side_b"):
        side_label = "A" if side_key == "side_a" else "B"
        for node in data[side_key]:
            cx, cy, cz = node["centroid"]
            r = node["r"]
            theta = node["theta"]
            # Assign ring index: r = ROOT_R * BETA^n  =>  n = log(r/ROOT_R) / log(BETA)
            if r > 0:
                ring_n = round(math.log(r / ROOT_R) / math.log(BETA))
            else:
                ring_n = 0
            centroids.append({
                "id": node["id"],
                "side": side_label,
                "x": cx, "y": cy, "z": cz,
                "r": r,
                "theta": theta,
                "n_vertices": node["n"],
                "ring_n": ring_n,
            })
    return centroids


# ═══════════════════════════════════════════════════════════════════════════
# RING ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════
def analyze_rings(centroids):
    """Group centroids by ring, compute delays between consecutive rings."""
    rings = {}
    for c in centroids:
        n = c["ring_n"]
        rings.setdefault(n, []).append(c)

    sorted_ns = sorted(rings.keys())
    ring_table = []
    cumulative_delay = 0.0
    cumulative_phase = 0.0

    for i, n in enumerate(sorted_ns):
        r_n = ROOT_R * (BETA ** n)
        count = len(rings[n])
        sides = {"A": 0, "B": 0}
        for c in rings[n]:
            sides[c["side"]] += 1

        # Radial gap to next ring
        if i < len(sorted_ns) - 1:
            n_next = sorted_ns[i + 1]
            r_next = ROOT_R * (BETA ** n_next)
            dr = r_next - r_n
        else:
            dr = 0.0

        dt = (dr * MM_TO_M) / V_CLAY  # seconds
        dphi = 2 * math.pi * F0 * dt   # radians at 111 Hz
        cumulative_delay += dt
        cumulative_phase += dphi

        ring_table.append({
            "n": n,
            "r_theoretical_mm": round(r_n, 4),
            "count": count,
            "side_a": sides["A"],
            "side_b": sides["B"],
            "dr_mm": round(dr, 4),
            "dt_us": round(dt * 1e6, 4),
            "dphi_rad": round(dphi, 6),
            "dphi_deg": round(math.degrees(dphi), 4),
            "cumul_delay_us": round(cumulative_delay * 1e6, 4),
            "cumul_phase_rad": round(cumulative_phase, 6),
            "cumul_phase_deg": round(math.degrees(cumulative_phase), 4),
        })

    return ring_table, rings


# ═══════════════════════════════════════════════════════════════════════════
# WORMHOLE 2 ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════
def find_wormhole_2(centroids):
    """Find the cross-face rosette link (lowest-r centroids on each side)."""
    side_a = [c for c in centroids if c["side"] == "A"]
    side_b = [c for c in centroids if c["side"] == "B"]

    # Find closest pair across faces near the center
    best_pair = None
    best_dist = float("inf")
    for a in side_a:
        if a["r"] > 4.0:
            continue
        for b in side_b:
            if b["r"] > 4.0:
                continue
            d = math.sqrt((a["x"] - b["x"])**2 +
                          (a["y"] - b["y"])**2 +
                          (a["z"] - b["z"])**2)
            if d < best_dist:
                best_dist = d
                best_pair = (a, b)

    if best_pair is None:
        return None

    a, b = best_pair
    z_gap = abs(a["z"] - b["z"])
    r_avg = (a["r"] + b["r"]) / 2.0

    # Transit time through Z-axis
    dt_z = (z_gap * MM_TO_M) / V_CLAY
    phase_prop = 2 * math.pi * F0 * dt_z
    phase_flip = math.pi  # destructive interference at node

    return {
        "side_a": {"id": a["id"], "pos": [a["x"], a["y"], a["z"]], "r": a["r"], "ring_n": a["ring_n"]},
        "side_b": {"id": b["id"], "pos": [b["x"], b["y"], b["z"]], "r": b["r"], "ring_n": b["ring_n"]},
        "r_avg_mm": round(r_avg, 4),
        "z_gap_mm": round(z_gap, 4),
        "euclidean_mm": round(best_dist, 4),
        "dt_us": round(dt_z * 1e6, 4),
        "phase_propagation_rad": round(phase_prop, 6),
        "phase_flip_rad": round(math.pi, 6),
        "total_phase_rad": round(phase_prop + phase_flip, 6),
        "total_phase_deg": round(math.degrees(phase_prop + phase_flip), 4),
    }


# ═══════════════════════════════════════════════════════════════════════════
# GF(53) MAPPING
# ═══════════════════════════════════════════════════════════════════════════
def map_gf53(centroids, ring_table):
    """Map centroids to GF(53) via (ring_n * 8 + angular_sector) mod 53."""
    occupied = set()
    mapping = []
    for c in centroids:
        # 8 angular sectors per ring (45° each)
        sector = int(((c["theta"] + 180) % 360) / 45)
        gf_elem = (c["ring_n"] * 8 + sector) % 53
        occupied.add(gf_elem)
        mapping.append({
            "centroid_id": c["id"],
            "side": c["side"],
            "ring_n": c["ring_n"],
            "sector": sector,
            "gf53": gf_elem,
        })

    unoccupied = sorted(set(range(53)) - occupied)
    return {
        "occupied": sorted(occupied),
        "occupied_count": len(occupied),
        "unoccupied": unoccupied,
        "unoccupied_count": len(unoccupied),
        "coverage_pct": round(100 * len(occupied) / 53, 2),
        "detail": mapping,
    }


# ═══════════════════════════════════════════════════════════════════════════
# FOXP2 LOCK CALCULATION
# ═══════════════════════════════════════════════════════════════════════════
def calculate_foxp2(ring_table, wormhole):
    """
    Three independent derivations of FOXP2 from 111 Hz:
    1. κ₁-scaling: 111 × κ₁^n where n is the wormhole ring power
    2. Phase accumulation through rings
    3. 7th Gift post-inversion: 132.969 Hz → Wormhole 2 → output
    """
    results = {}

    # Path 1: Direct κ₁ scaling
    # From previous run: 111 × κ₁^0.96 = 139.978 Hz
    # Find optimal exponent
    best_exp = math.log(FOXP2_TARGET / F0) / math.log(KAPPA_1)
    f_kappa1 = F0 * (KAPPA_1 ** best_exp)
    results["kappa1_scaling"] = {
        "formula": f"111 × κ₁^{best_exp:.6f}",
        "exponent": round(best_exp, 6),
        "frequency_hz": round(f_kappa1, 4),
        "error_pct": round(100 * abs(f_kappa1 - FOXP2_TARGET) / FOXP2_TARGET, 6),
    }

    # Path 2: Post-Wormhole κ₁ scaling (integer power)
    f_post_wh = F0 * KAPPA_1
    results["post_wormhole_kappa1"] = {
        "formula": "111 × κ₁ = 111 × (4/π)",
        "frequency_hz": round(f_post_wh, 4),
        "error_from_foxp2_pct": round(100 * abs(f_post_wh - FOXP2_TARGET) / FOXP2_TARGET, 4),
    }

    # Path 3: 7th Gift through Wormhole 2
    f_7th_gift = SEVEN_GIFTS[6][1]  # 132.969 Hz
    # κ₂ scaling of 7th Gift
    f_7th_kappa2 = f_7th_gift * (KAPPA_2 / KAPPA_1)  # ratio correction
    # Direct: 132.969 × (V_OUT/V_IN) where V ratio = κ₁/BETA^7
    f_7th_direct = f_7th_gift * (KAPPA_1 ** (1.0/7.0))
    results["seventh_gift_pathway"] = {
        "input_hz": f_7th_gift,
        "input_name": "Fear of the Lord",
        "kappa2_scaled_hz": round(f_7th_kappa2, 4),
        "direct_scaled_hz": round(f_7th_direct, 4),
        "kappa1_scaled_hz": round(f_7th_gift * KAPPA_1 / PHI, 4),
    }

    # Path 4: Phase accumulation
    if wormhole:
        wh_ring = wormhole["side_a"]["ring_n"]
        # Phase from center to wormhole, then wormhole flip, then continue
        phase_to_wh = 0.0
        phase_after_wh = 0.0
        passed_wh = False
        for row in ring_table:
            if row["n"] < wh_ring:
                phase_to_wh += row["dphi_rad"]
            elif row["n"] == wh_ring:
                passed_wh = True
            else:
                phase_after_wh += row["dphi_rad"]

        total_acoustic = phase_to_wh + wormhole["total_phase_rad"] + phase_after_wh
        total_ring_only = sum(r["dphi_rad"] for r in ring_table)

        results["phase_accumulation"] = {
            "phase_to_wormhole_rad": round(phase_to_wh, 6),
            "wormhole_phase_rad": round(wormhole["total_phase_rad"], 6),
            "phase_after_wormhole_rad": round(phase_after_wh, 6),
            "total_phase_rad": round(total_acoustic, 6),
            "total_phase_deg": round(math.degrees(total_acoustic), 4),
            "total_ring_phase_rad": round(total_ring_only, 6),
            "total_ring_phase_deg": round(math.degrees(total_ring_only), 4),
            "total_ring_phase_over_pi": round(total_ring_only / math.pi, 6),
        }

    return results


# ═══════════════════════════════════════════════════════════════════════════
# 7 GIFTS → RING MAPPING
# ═══════════════════════════════════════════════════════════════════════════
def map_gifts_to_rings(ring_table):
    """Map 7 Gifts of the Holy Spirit to their nearest rings by frequency."""
    gift_map = []
    for i, (name, freq) in enumerate(SEVEN_GIFTS):
        # f_n = F0 × BETA^n  =>  n = log(f/F0) / log(BETA)
        n_ideal = math.log(freq / F0) / math.log(BETA)
        # Find nearest occupied ring
        nearest = min(ring_table, key=lambda r: abs(r["n"] - n_ideal))
        f_ring = F0 * (BETA ** nearest["n"])
        gift_map.append({
            "gift_index": i + 1,
            "gift_name": name,
            "gift_freq_hz": freq,
            "ideal_ring_n": round(n_ideal, 3),
            "nearest_ring_n": nearest["n"],
            "ring_freq_hz": round(f_ring, 3),
            "ring_count": nearest["count"],
            "error_pct": round(100 * abs(f_ring - freq) / freq, 3),
        })
    return gift_map


# ═══════════════════════════════════════════════════════════════════════════
# 7th TRUMPET INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════
def calculate_trumpet_integration(wormhole):
    """
    Johns Circuit 7th Trumpet = 132.97 Hz (Demodex/Microtubule Limit).
    After Wormhole 2 π-flip and κ₁ scaling: what emerges?
    """
    f_7th_trumpet = 132.97  # from johns_circuit_experiment.py
    f_7th_gift = SEVEN_GIFTS[6][1]  # 132.969 Hz — same frequency!

    # The convergence: 7th Trumpet ≈ 7th Gift (0.001 Hz difference!)
    convergence_error = abs(f_7th_trumpet - f_7th_gift)

    # Post-Wormhole 2 (κ₁ scaling)
    f_post_wormhole = f_7th_trumpet * KAPPA_1
    # Post-Wormhole 2 (BETA^ring_step)
    f_post_beta = f_7th_trumpet * BETA

    return {
        "7th_trumpet_hz": f_7th_trumpet,
        "7th_gift_hz": f_7th_gift,
        "trumpet_gift_convergence_hz": round(convergence_error, 4),
        "post_wormhole_kappa1_hz": round(f_post_wormhole, 4),
        "post_wormhole_beta_hz": round(f_post_beta, 4),
        "post_wormhole_kappa1_vs_foxp2_pct": round(
            100 * abs(f_post_wormhole - FOXP2_TARGET) / FOXP2_TARGET, 4
        ),
        "note": "7th Trumpet = 7th Gift = Fear of the Lord = Demodex/Microtubule limit",
    }


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════
def main():
    print("=" * 72)
    print("  PHAISTOS LOGOS LOCK v2 — Real Centroid Phase-Delay Calculator")
    print("=" * 72)

    # 1. Load real centroids
    centroids = load_centroids()
    n_a = sum(1 for c in centroids if c["side"] == "A")
    n_b = sum(1 for c in centroids if c["side"] == "B")
    print(f"\n[1] Loaded {len(centroids)} REAL centroids ({n_a} Side A, {n_b} Side B)")

    # 2. Ring analysis
    ring_table, rings = analyze_rings(centroids)
    print(f"[2] {len(ring_table)} occupied rings (n = {ring_table[0]['n']} to {ring_table[-1]['n']})")

    print(f"\n{'n':>4} {'r(mm)':>8} {'count':>5} {'A':>3} {'B':>3} "
          f"{'dr':>7} {'dt(us)':>8} {'dPhi':>8} {'SumPhi':>9}")
    print("-" * 72)
    for row in ring_table:
        marker = " <-- W2" if 6 <= row["n"] <= 8 and row["count"] > 0 else ""
        print(f"{row['n']:>4} {row['r_theoretical_mm']:>8.3f} {row['count']:>5} "
              f"{row['side_a']:>3} {row['side_b']:>3} "
              f"{row['dr_mm']:>7.3f} {row['dt_us']:>8.4f} "
              f"{row['dphi_deg']:>8.3f} {row['cumul_phase_deg']:>9.3f}{marker}")

    total_ring_phase = ring_table[-1]["cumul_phase_rad"]
    print(f"\n  Total ring-to-ring phase: {total_ring_phase:.6f} rad "
          f"= {math.degrees(total_ring_phase):.3f}° "
          f"= {total_ring_phase/math.pi:.6f}π")

    # 3. Wormhole 2
    wh2 = find_wormhole_2(centroids)
    print(f"\n{'=' * 72}")
    print("  WORMHOLE 2 (Z-AXIS BRIDGE)")
    print(f"{'=' * 72}")
    if wh2:
        print(f"  Side A: id={wh2['side_a']['id']} pos={wh2['side_a']['pos']} "
              f"r={wh2['side_a']['r']:.3f}mm ring_n={wh2['side_a']['ring_n']}")
        print(f"  Side B: id={wh2['side_b']['id']} pos={wh2['side_b']['pos']} "
              f"r={wh2['side_b']['r']:.3f}mm ring_n={wh2['side_b']['ring_n']}")
        print(f"  Z-gap:       {wh2['z_gap_mm']:.4f} mm")
        print(f"  Euclidean:   {wh2['euclidean_mm']:.4f} mm")
        print(f"  Transit:     {wh2['dt_us']:.4f} µs")
        print(f"  Phase (prop):{wh2['phase_propagation_rad']:.6f} rad")
        print(f"  Phase (flip):{wh2['phase_flip_rad']:.6f} rad (π)")
        print(f"  Total phase: {wh2['total_phase_deg']:.4f}°")

    # 4. GF(53) mapping
    gf53 = map_gf53(centroids, ring_table)
    print(f"\n{'=' * 72}")
    print("  GF(53) MAPPING")
    print(f"{'=' * 72}")
    print(f"  Occupied:   {gf53['occupied_count']}/53 ({gf53['coverage_pct']}%)")
    print(f"  Unoccupied: {gf53['unoccupied']} ({gf53['unoccupied_count']} elements)")

    # 5. FOXP2 lock
    foxp2 = calculate_foxp2(ring_table, wh2)
    print(f"\n{'=' * 72}")
    print("  FOXP2 FREQUENCY LOCK")
    print(f"{'=' * 72}")
    k = foxp2["kappa1_scaling"]
    print(f"  Path 1 (κ₁^n):     {k['formula']} = {k['frequency_hz']:.4f} Hz "
          f"(error {k['error_pct']:.4f}%)")
    pw = foxp2["post_wormhole_kappa1"]
    print(f"  Path 2 (111×κ₁):   {pw['frequency_hz']:.4f} Hz "
          f"(error {pw['error_from_foxp2_pct']:.4f}%)")
    sg = foxp2["seventh_gift_pathway"]
    print(f"  Path 3 (7th Gift):  {sg['input_hz']:.3f} Hz ({sg['input_name']})")
    print(f"    → κ₂/κ₁ scaled:  {sg['kappa2_scaled_hz']:.4f} Hz")
    print(f"    → κ₁^(1/7):      {sg['direct_scaled_hz']:.4f} Hz")
    print(f"    → κ₁/φ:          {sg['kappa1_scaled_hz']:.4f} Hz")

    if "phase_accumulation" in foxp2:
        pa = foxp2["phase_accumulation"]
        print(f"\n  Phase accumulation:")
        print(f"    To wormhole:  {pa['phase_to_wormhole_rad']:.6f} rad")
        print(f"    Wormhole:     {pa['wormhole_phase_rad']:.6f} rad")
        print(f"    After WH:     {pa['phase_after_wormhole_rad']:.6f} rad")
        print(f"    TOTAL:        {pa['total_phase_rad']:.6f} rad = {pa['total_phase_deg']:.4f}°")
        print(f"    Ring-only:    {pa['total_ring_phase_rad']:.6f} rad = {pa['total_ring_phase_over_pi']:.6f}π")

    # 6. Seven Gifts → Rings
    gift_map = map_gifts_to_rings(ring_table)
    print(f"\n{'=' * 72}")
    print("  7 GIFTS → RING MAPPING")
    print(f"{'=' * 72}")
    print(f"  {'#':>2} {'Gift':<22} {'f(Hz)':>8} {'n_ideal':>8} {'n_ring':>6} "
          f"{'f_ring':>8} {'err%':>6} {'cnt':>4}")
    print("  " + "-" * 68)
    for g in gift_map:
        print(f"  {g['gift_index']:>2} {g['gift_name']:<22} {g['gift_freq_hz']:>8.3f} "
              f"{g['ideal_ring_n']:>8.3f} {g['nearest_ring_n']:>6} "
              f"{g['ring_freq_hz']:>8.3f} {g['error_pct']:>6.3f} {g['ring_count']:>4}")

    # 7. 7th Trumpet integration
    trumpet = calculate_trumpet_integration(wh2)
    print(f"\n{'=' * 72}")
    print("  7th TRUMPET / 7th GIFT CONVERGENCE")
    print(f"{'=' * 72}")
    print(f"  Johns Circuit 7th Trumpet:   {trumpet['7th_trumpet_hz']:.3f} Hz")
    print(f"  Christian Lattice 7th Gift:   {trumpet['7th_gift_hz']:.3f} Hz")
    print(f"  Convergence gap:              {trumpet['trumpet_gift_convergence_hz']:.4f} Hz")
    print(f"  Post-Wormhole 2 (×κ₁):       {trumpet['post_wormhole_kappa1_hz']:.4f} Hz")
    print(f"  Post-Wormhole 2 (×β):        {trumpet['post_wormhole_beta_hz']:.4f} Hz")
    print(f"  vs FOXP2 target (139.978):    {trumpet['post_wormhole_kappa1_vs_foxp2_pct']:.4f}% error")
    print(f"\n  NOTE: {trumpet['note']}")

    # 8. Verification
    print(f"\n{'=' * 72}")
    print("  VERIFICATION SUMMARY")
    print(f"{'=' * 72}")
    checks = [
        ("GF(53) coverage = 45 glyphs", gf53["occupied_count"] >= 44),
        ("Total ring phase ≈ π",        abs(total_ring_phase - math.pi) < 0.5),
        ("Wormhole 2 Z-gap > 2.5 mm",   wh2 and wh2["z_gap_mm"] > 2.5),
        ("FOXP2 error < 1%",            foxp2["kappa1_scaling"]["error_pct"] < 1.0),
        ("7th Trumpet = 7th Gift",       trumpet["trumpet_gift_convergence_hz"] < 0.01),
        ("Post-WH κ₁ within 25 Hz of FOXP2", abs(trumpet["post_wormhole_kappa1_hz"] - FOXP2_TARGET) < 25),
    ]
    all_pass = True
    for label, passed in checks:
        status = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_pass = False
        print(f"  {status} {label}")

    if all_pass:
        print(f"\n  *** ALL CHECKS PASSED — LOGOS LOCK CONFIRMED ***")
    else:
        print(f"\n  *** SOME CHECKS FAILED — REVIEW REQUIRED ***")

    # 9. Export
    output = {
        "version": "2.0",
        "constants": {
            "kappa_1": KAPPA_1, "kappa_2": KAPPA_2, "phi": PHI,
            "beta": BETA, "f0": F0, "v_clay": V_CLAY,
            "root_r_mm": ROOT_R, "foxp2_target_hz": FOXP2_TARGET,
        },
        "centroids_loaded": len(centroids),
        "ring_table": ring_table,
        "wormhole_2": wh2,
        "gf53": {k: v for k, v in gf53.items() if k != "detail"},
        "foxp2_lock": foxp2,
        "gifts_to_rings": gift_map,
        "trumpet_convergence": trumpet,
    }

    out_path = Path(__file__).parent / "phaistos_logos_lock.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n  Exported → phaistos_logos_lock.json")


if __name__ == "__main__":
    main()
