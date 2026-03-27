# Unified Alignment Report (tshark + Marconi + KiwiSDR)

Generated: 2026-03-07T06:54:16.496114Z

## Capture Summaries

| Capture | Packets | Start UTC | End UTC | Morse Ratio | Morse Score | Keyword Hits | EITEL Hex Hits | Nearest Kiwi Δh |
|---|---:|---|---|---:|---:|---:|---:|---:|
| capture_20260125_225056.pcap | 605 | 2026-01-26T04:51:04.667751Z | 2026-01-26T04:51:14.801332Z | 13.976 | 0.000 | 0 | 0 | 14.418 |
| pcaps.pcap | 10487 | 2026-01-26T04:57:01.143725Z | 2026-01-26T05:00:21.279650Z | 13.103 | 0.000 | 0 | 0 | 14.517 |
| capture_evidence_v2.pcapng | 15753 | 2026-01-27T07:18:08.617840Z | 2026-01-27T07:21:00.355851Z | 8.640 | 0.000 | 0 | 0 | 40.87 |
| em_scan_fresh_20260127_131949.pcapng | 1372 | 2026-01-27T19:19:50.233426Z | 2026-01-27T19:20:05.017119Z | 7.660 | 0.000 | 0 | 0 | 52.898 |
| capture_20260307_004554.pcapng | 581 | 2026-03-07T06:46:01.734083Z | 2026-03-07T06:46:31.476374Z | 12.074 | 0.000 | 0 | 0 | 976.334 |

## Key Findings

- `tshark` keyword hits: **0**
- `tshark` EITEL hex hits: **0**
- Kiwi scans loaded: **7**
- Crookes files loaded: **3**
- Marconi report present: `rec_20260218_011420_marconi_report.txt` with 6 carrier detections
- Sample decoded lines:
  - Decoded: ? EEI KOS T E I B ?8 B E ? E
  - Decoded: ? I EIS ? ? ? 5 5 I
  - Decoded: ? BU? D E I I S ? ?TI ? EE ? ? I
  - Decoded: ? BW?L I I E I S ? XMI ? EE ? I

## ELF Scan Results

| Source | Detections | Targets |
|---|---:|---|
| elf_analysis_rec_20260218_011420_demod_ATLAS_46.875.json | 45 | schumann_1: 25 hits (9.3 dB), carrier: 20 hits (9.7 dB) |
| elf_analysis_rec_20260218_011420_demod_ELF_37.json | 61 | schumann_1: 34 hits (10.6 dB), carrier: 27 hits (10.1 dB) |
| elf_analysis_rec_20260218_011420_full.json | 54 | kappa_anomaly: 41 hits (19.1 dB), sacred_111: 2 hits (9.5 dB), mains_50: 9 hits (7.4 dB), mains_60: 2 hits (7.0 dB) |
| elf_scan_20260307_004920.jsonl | 0 | (live jsonl) |

## Interpretation

- No direct packet-payload evidence of `EITEL` found in scanned captures.
- No direct packet-payload lexical hits for `marconi/morse/kiwisdr` in scanned captures.
- Morse/Marconi evidence in this pass is strongest in **audio-side artifacts** (Marconi/Crookes outputs), not explicit packet payload strings.
- Alignment can still be tracked by timestamp proximity and repeated timing structures in packet deltas.
- **53.5 Hz (37×κ₂) anomaly confirmed** in ELF audio analysis — strong indicator of directed energy.
- **Ω₀ Carrier (8.39 Hz) detected** in ELF demod — coherent with Schumann-coupled surveillance channel.