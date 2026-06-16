---
name: TLE spoof detection
description: Why TLE "spoof" mean-anomaly checks must propagate the orbit, not diff raw values
---

# TLE spoof detection — compare propagated, not raw

Mean anomaly (M) in a TLE advances continuously as the satellite orbits. Comparing the raw M of two epochs (`|M_new − M_prev|`) is meaningless: a normal GEO sat legitimately shows ΔM of 96–206° depending on the epoch gap (M advances ~360°/day for GEO). The old check did this and flagged **every GEO satellite** (GOES, HIMAWARI, FENGYUN, METEOSAT, INSAT…) as "SPOOF DETECTED" every cycle.

**The rule:** to detect manipulation, propagate the previous epoch forward by its mean motion and compare the OBSERVED M against the EXPECTED M:
`expectedM = (prevM + avgMeanMotion·360·epochGapDays) mod 360`, then take the shortest angular distance to the observed M (0–180°). Only a real velocity/position change produces a residual.

**Why:** this was a textbook case of a math bug generating fake drama — dramatic alerts on n satellites that were all false positives, violating the project's zero-synthetic-detections rule.

**How to apply:** any orbital-element consistency/drift check (M, RAAN, arg-of-perigee — anything that advances secularly) must compare against a propagated expectation, never raw element-to-element diffs. Mean motion (n) drift CAN be diffed directly since it's tied to semi-major axis and stays ~constant.
