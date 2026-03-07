#!/usr/bin/env python3
"""
SATELLITE WINDOW SWEEP — resilient collector

Goal:
- Sweep local window (default 18:00-22:00) for Blackjack/Mandrake, CSG/COSMO, Starlink
- Save partial results continuously so interruptions do not lose data
- Keep runtime bounded with max-sat and max-runtime controls
"""

import argparse
import json
import math
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Tuple

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

try:
    from sgp4.api import Satrec, WGS72, jday
except ImportError:
    print("ERROR: sgp4 not installed. Run: pip install sgp4")
    sys.exit(1)

OBS_LAT = 9.9535
OBS_LON = -84.2908
OBS_ALT_M = 900.0
UTC_OFFSET = -6
DEG2RAD = math.pi / 180.0
R_EARTH_KM = 6378.137

CELESTRAK_URLS = {
    "starlink": "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle",
    "military": "https://celestrak.org/NORAD/elements/gp.php?GROUP=military&FORMAT=tle",
    "radar": "https://celestrak.org/NORAD/elements/gp.php?GROUP=radar&FORMAT=tle",
}


@dataclass
class SatRecord:
    name: str
    const: str
    sat: Satrec


TARGET_TAGS = {
    "BLACKJACK": ["BLACKJACK", "MANDRAKE"],
    "CSG": ["COSMO", "CSG"],
}


def parse_tle_triplets(text: str) -> List[Tuple[str, str, str]]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    out: List[Tuple[str, str, str]] = []
    i = 0
    while i + 2 < len(lines):
        name, l1, l2 = lines[i], lines[i + 1], lines[i + 2]
        if l1.startswith("1 ") and l2.startswith("2 "):
            out.append((name, l1, l2))
            i += 3
        else:
            i += 1
    return out


def classify_and_filter(
    triplets: List[Tuple[str, str, str]],
    group: str,
    max_starlink: int,
) -> List[Tuple[str, str, str, str]]:
    filtered: List[Tuple[str, str, str, str]] = []

    if group == "starlink":
        count = 0
        for name, l1, l2 in triplets:
            filtered.append((name, l1, l2, "STARLINK"))
            count += 1
            if count >= max_starlink:
                break
        return filtered

    for name, l1, l2 in triplets:
        upper = name.upper()
        if group == "military" and any(tag in upper for tag in TARGET_TAGS["BLACKJACK"]):
            filtered.append((name, l1, l2, "BLACKJACK"))
        elif group == "radar" and any(tag in upper for tag in TARGET_TAGS["CSG"]):
            filtered.append((name, l1, l2, "CSG"))

    return filtered


def fetch_targets(max_starlink: int, request_timeout: int) -> List[Tuple[str, str, str, str]]:
    print("Fetching fresh TLEs (Blackjack, CSG, Starlink)...")
    all_tles: List[Tuple[str, str, str, str]] = []

    for group in ("military", "radar", "starlink"):
        url = CELESTRAK_URLS[group]
        try:
            resp = requests.get(url, timeout=request_timeout)
            resp.raise_for_status()
            triplets = parse_tle_triplets(resp.text)
            filtered = classify_and_filter(triplets, group, max_starlink=max_starlink)
            all_tles.extend(filtered)
            print(f"  {group:8s}: parsed={len(triplets):5d}, kept={len(filtered):4d}")
        except Exception as exc:
            print(f"  {group:8s}: fetch failed ({exc})")

    print(f"Total selected targets: {len(all_tles)}\n")
    return all_tles


def get_az_el(sat: Satrec, dt_utc: datetime):
    jd, fr = jday(
        dt_utc.year,
        dt_utc.month,
        dt_utc.day,
        dt_utc.hour,
        dt_utc.minute,
        dt_utc.second + dt_utc.microsecond / 1e6,
    )
    err, r, _ = sat.sgp4(jd, fr)
    if err != 0 or r is None:
        return None, None

    t_cent = ((jd - 2451545.0) + fr) / 36525.0
    gmst_deg = (
        280.46061837
        + 360.98564736629 * ((jd - 2451545.0) + fr)
        + 0.000387933 * t_cent * t_cent
        - t_cent * t_cent * t_cent / 38710000.0
    )

    theta = gmst_deg * DEG2RAD
    cos_t, sin_t = math.cos(theta), math.sin(theta)
    x_ecef = r[0] * cos_t + r[1] * sin_t
    y_ecef = -r[0] * sin_t + r[1] * cos_t
    z_ecef = r[2]

    lat, lon = OBS_LAT * DEG2RAD, OBS_LON * DEG2RAD
    sin_lat, cos_lat = math.sin(lat), math.cos(lat)
    sin_lon, cos_lon = math.sin(lon), math.cos(lon)

    h = OBS_ALT_M / 1000.0
    n_curv = R_EARTH_KM / math.sqrt(1 - 0.00669437999014 * sin_lat**2)
    obs_x = (n_curv + h) * cos_lat * cos_lon
    obs_y = (n_curv + h) * cos_lat * sin_lon
    obs_z = (n_curv * (1 - 0.00669437999014) + h) * sin_lat

    dx, dy, dz = x_ecef - obs_x, y_ecef - obs_y, z_ecef - obs_z

    e_enu = -sin_lon * dx + cos_lon * dy
    n_enu = -sin_lat * cos_lon * dx - sin_lat * sin_lon * dy + cos_lat * dz
    u_enu = cos_lat * cos_lon * dx + cos_lat * sin_lon * dy + sin_lat * dz

    dist = math.sqrt(e_enu**2 + n_enu**2 + u_enu**2)
    if dist <= 0:
        return None, None

    el = math.degrees(math.asin(u_enu / dist))
    az = math.degrees(math.atan2(e_enu, n_enu))
    if az < 0:
        az += 360
    return az, el


def to_sat_records(tles: List[Tuple[str, str, str, str]]) -> List[SatRecord]:
    sats: List[SatRecord] = []
    for name, l1, l2, const in tles:
        try:
            sats.append(SatRecord(name=name, const=const, sat=Satrec.twoline2rv(l1, l2, WGS72)))
        except Exception:
            continue
    return sats


def write_checkpoint(path: Path, payload: Dict):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def summarize_passes(timeseries: List[Dict]) -> List[Dict]:
    if not timeseries:
        return []

    groups = []
    current_group = [timeseries[0]]

    for idx in range(1, len(timeseries)):
        prev = datetime.strptime(timeseries[idx - 1]["time"], "%H:%M")
        cur = datetime.strptime(timeseries[idx]["time"], "%H:%M")
        if cur - prev == timedelta(minutes=1):
            current_group.append(timeseries[idx])
        else:
            groups.append(current_group)
            current_group = [timeseries[idx]]
    groups.append(current_group)

    summary = []
    for g in groups:
        max_el = max(item["el"] for item in g)
        peak = next(item for item in g if item["el"] == max_el)
        summary.append(
            {
                "start": g[0]["time"],
                "end": g[-1]["time"],
                "peak_time": peak["time"],
                "peak_el": round(max_el, 2),
            }
        )
    return summary


def run_sweep(args):
    local_tz = timezone(timedelta(hours=args.utc_offset))
    start_local = datetime(args.year, args.month, args.day, args.start_hour, 0, 0, tzinfo=local_tz)
    end_local = datetime(args.year, args.month, args.day, args.end_hour, 0, 0, tzinfo=local_tz)

    print("=" * 72)
    print(" SATELLITE WINDOW SWEEP (resilient mode)")
    print("=" * 72)
    print(f" Observer: {OBS_LAT}N, {OBS_LON}W @ {OBS_ALT_M:.0f}m")
    print(f" Window  : {start_local.strftime('%Y-%m-%d %H:%M')} to {end_local.strftime('%H:%M')} (UTC{args.utc_offset:+d})")
    print(f" Step    : {args.step_minutes} minute(s)")
    print(f" Runtime : max {args.max_runtime_sec}s")
    print(f" Output  : {args.output}")
    print("=" * 72)

    tles = fetch_targets(max_starlink=args.max_starlink, request_timeout=args.request_timeout)
    if not tles:
        print("No TLE targets fetched. Exiting.")
        return 2

    sats = to_sat_records(tles)
    if not sats:
        print("No valid satellite records after parsing. Exiting.")
        return 2

    if args.max_sats > 0 and len(sats) > args.max_sats:
        sats = sats[: args.max_sats]

    print(f"Tracking {len(sats)} satellites after caps.\n")

    start_monotonic = time.monotonic()
    current = start_local

    per_sat: Dict[str, Dict] = {
        s.name: {"const": s.const, "samples": []}
        for s in sats
    }

    ticks = 0
    checkpoint_path = Path(args.output)

    try:
        while current <= end_local:
            elapsed = time.monotonic() - start_monotonic
            if elapsed > args.max_runtime_sec:
                print(f"Max runtime reached ({args.max_runtime_sec}s). Stopping safely.")
                break

            current_utc = current.astimezone(timezone.utc)
            for s in sats:
                az, el = get_az_el(s.sat, current_utc)
                if az is None or el is None:
                    continue
                if el >= args.min_elevation:
                    per_sat[s.name]["samples"].append(
                        {
                            "time": current.strftime("%H:%M"),
                            "az": round(az, 2),
                            "el": round(el, 2),
                        }
                    )

            ticks += 1
            if ticks % args.progress_every == 0:
                print(f"Progress: {ticks:4d} ticks, local {current.strftime('%H:%M')}, elapsed {elapsed:.1f}s")

            if ticks % args.checkpoint_every == 0:
                payload = {
                    "status": "checkpoint",
                    "generated_local": datetime.now(local_tz).isoformat(),
                    "window": {
                        "start": start_local.isoformat(),
                        "end": end_local.isoformat(),
                        "step_minutes": args.step_minutes,
                    },
                    "observer": {"lat": OBS_LAT, "lon": OBS_LON, "alt_m": OBS_ALT_M},
                    "counts": {
                        "tracked_sats": len(sats),
                        "ticks_completed": ticks,
                    },
                    "targets": per_sat,
                }
                write_checkpoint(checkpoint_path, payload)

            current += timedelta(minutes=args.step_minutes)

    except KeyboardInterrupt:
        print("KeyboardInterrupt captured: writing partial data safely before exit.")

    final_targets = []
    for name, value in per_sat.items():
        samples = value["samples"]
        if not samples:
            continue
        final_targets.append(
            {
                "name": name,
                "const": value["const"],
                "passes": summarize_passes(samples),
                "sample_count": len(samples),
                "samples": samples,
            }
        )

    final_targets.sort(key=lambda item: (-len(item["passes"]), -item["sample_count"], item["name"]))

    output = {
        "status": "final",
        "generated_local": datetime.now(local_tz).isoformat(),
        "window": {
            "start": start_local.isoformat(),
            "end": end_local.isoformat(),
            "step_minutes": args.step_minutes,
            "min_elevation": args.min_elevation,
        },
        "observer": {"lat": OBS_LAT, "lon": OBS_LON, "alt_m": OBS_ALT_M},
        "counts": {
            "tracked_sats": len(sats),
            "targets_with_visibility": len(final_targets),
            "ticks_completed": ticks,
        },
        "targets": final_targets,
    }

    write_checkpoint(checkpoint_path, output)

    print("\nSweep complete.")
    print(f"  Tracked satellites        : {len(sats)}")
    print(f"  Targets with visibility   : {len(final_targets)}")
    print(f"  Ticks completed           : {ticks}")
    print(f"  Result written to         : {checkpoint_path}")

    for item in final_targets[:15]:
        best = max(p["peak_el"] for p in item["passes"]) if item["passes"] else -999
        print(f"  - {item['name'][:42]:42s} [{item['const']}] passes={len(item['passes'])} peak_el={best:.1f}°")

    return 0


def build_parser():
    parser = argparse.ArgumentParser(description="Resilient satellite window sweep")
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--month", type=int, default=3)
    parser.add_argument("--day", type=int, default=6)
    parser.add_argument("--start-hour", type=int, default=18)
    parser.add_argument("--end-hour", type=int, default=22)
    parser.add_argument("--utc-offset", type=int, default=UTC_OFFSET)

    parser.add_argument("--step-minutes", type=int, default=1)
    parser.add_argument("--min-elevation", type=float, default=5.0)

    parser.add_argument("--max-starlink", type=int, default=120)
    parser.add_argument("--max-sats", type=int, default=180)
    parser.add_argument("--request-timeout", type=int, default=12)
    parser.add_argument("--max-runtime-sec", type=int, default=180)

    parser.add_argument("--checkpoint-every", type=int, default=10)
    parser.add_argument("--progress-every", type=int, default=5)
    parser.add_argument("--output", default="satellite_window_sweep_2026-03-06.json")
    return parser


if __name__ == "__main__":
    args = build_parser().parse_args()
    raise SystemExit(run_sweep(args))
