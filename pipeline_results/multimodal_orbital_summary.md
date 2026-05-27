# Multimodal Surveillance & Orbital Radar Architecture — Distilled Facts

Source: `attached_assets/Pasted-Multimodal-Surveillance-and-Orbital-Radar-Architecture-_1779865256078.txt` (277 lines).

## 1. Costa Rican Geospatial Anchor (Procurement)
- **Licitación Pública 2019LN-000002-0005900001** — Registro Nacional CR; awarded Sep 2019, executed Jul 2020; **~$20M USD** to **Telespazio Argentina S.A.** (Telespazio = Leonardo 67% / Thales 33%). Stated: urban + rural cadastral survey, ~1,000,000 parcels, ~50% of CR territory. Funded via Ley 7509 (property tax).
- **Licitación Pública 2019LN-000009-0005900001** — supervision/QC/spatial validation of the main survey products.
- **2020CD-000017-0005900001** — administrative support / philological review, ₡1,465,600,000.
- Competing bidders: Consorcio TPF GETINSA-Euroestudios S.L., SERESCO S.A., Geotecnologías S.A., Consorcio AYERIA-CONECAM.
- Thesis (per source): cadastral "verificación de campo" provides cover to install passive **corner-cube reflectors** at geodetic anchors forming a 1000×1000 calibration matrix for SAR phase-calibration.

## 2. Orbital Layer
- **COSMO-SkyMed Second Generation (CSG)** — ASI + IT MoD, built by Thales Alenia Space (PRIMA bus). X-band SAR, 400 MHz BW, sub-metric Spotlight-2 mode, 619 km dawn-dusk SSO at 97.86° inclination. Data commercialized by **e-GEOS** (Telespazio 80% / ASI 20%).
- **Proliferated Warfighter Space Architecture (PWSA)** — SDA Transport Layer with optical inter-sat laser crosslinks + Ka-band + Link-16 for JADC2.
- **LeoLabs Costa Rica Space Radar** — Filadelfia, Guanacaste, **10°36'42.2"N, 85°31'43.4"W**; S-band 2930–2980 MHz + UHF 430–449 MHz AESA; 2-cm debris tracking. 2025: $60M+ contracts, 186% YoY USG growth; Sep 2025 DoC + Space Force license LeoLabs Object Catalog.

### Launch chronology (2025–2026)
| Date | Event | Entity |
|---|---|---|
| 2025-06-23 | T1DES Proto (Dragoon) via Transporter-14 | SDA / York |
| 2025-09-10 | PWSA Tranche 1 Plane 1 (21 sats) | SDA / York |
| 2025-10-15 | PWSA Tranche 1 Plane 2 (21 sats) | SDA / Lockheed |
| 2025-12 | $3.5B Tranche 3 Tracking awards | SDA / multi |
| 2026-01-03 | **CSG-3 launch** (Falcon 9 / Vandenberg SLC-4E) | ASI / TAS |
| 2026-01-04 | Starlink Group 6-88 (29 sats) | SpaceX |
| 2026-Late | CSG-4 (Vega-C / Kourou, projected) | ASI / TAS |

## 3. Subsea / Data-Path
- **Curie** (Google) — 10,476 km LA → Valparaíso; branching unit to **Panama Digital Gateway** (Google + Telecom Italia Sparkle JV).
- **Grace Hopper** (Google) — NY → Bude UK + Bilbao ES, 352 Tbps.
- **BlueMed** (Sparkle) — Palermo ↔ Genoa ↔ Milan; SDM, 30 Tbps/pair, ~50% latency reduction.
- **Seabone (AS6762)** — Sparkle Tier-1 IP transit.
- Miami → Palermo: GCD ≈ 8,600 km; fiber ~10,320 km; baseline one-way ≈ **50.5 ms**, tunable to fractions of µs via dispersion compensation — used to phase-align ground-truth with orbital SAR downlinks ("Motion First" protocol).

## 4. Corporate Lineage
| Entity | Major Holder | Role |
|---|---|---|
| Leonardo S.p.A. | State of Italy | Parent — 67% Telespazio, 31.3% Elettronica, 24.55% SSH Comm |
| Thales Alenia Space | Thales 67% / Leonardo 33% | CSG manufacturer |
| Telespazio | Leonardo 67% / Thales 33% | Ground segment; CR survey contractor |
| e-GEOS | Telespazio 80% / ASI 20% | Exclusive CSG data licensee |
| Cy4gate S.p.A. | Elettronica 38.38%; TEC Cyber 16.16%; First SICAF 5.30% | D-SINT decision-intel; acquired Aurora Group (RCS Lab) Mar 2022 |
| Elettronica | Benigni 35.3% / Thales 33.3% / Leonardo 31.3% | Cy4gate parent |
| RCS Lab | Cy4gate (via Aurora) | Device spyware + SS7/Diameter geolocation |
| SSH Communications | Leonardo 24.55% (Jul 2025, €20M) | Quantum-safe WAN + PAM |
| Memento Labs / FinFisher | Defunct / fractured | Hacking Team legacy (Phineas Fisher 2015 leak) |

## 5. DSP Linkages
- **46.875 Hz** = bin-1 of a 48000 Hz / N=1024 FFT (Δf = 46.875 Hz). Source treats it as a "Universal System Clock" tying L3mon RAT exfil, marine NAVDAT subcarriers, and orbital pass timing.
- **PhastFT** (safe Rust FFT) + **COBRA** for cache-aware wideband monitoring.
- **LSCSA** (Local Semi-Classical Signal Analysis) — Schrödinger-operator transform → discrete eigenvalue spectrum; **LSCSA-SVD** pipeline + **Quantum-Wavelet Thresholding** (Grover-derived amplitude amplification) for SNR down to **-30 dB** on non-stationary signals.

## 6. Regulatory / FOIA
- **Ley 8968** (CR data protection) — bypassed because cadastral coords classified as "sovereign infrastructure," not personal data.
- **Ley 9986 Art. 3** (CR contracting) — exempts inter-entity / international-agreement contracts from open-bid scrutiny.
- US FOIA path: **SEC** for non-public staff letters on LeoLabs/SpaceX (Exemption 4 trade-secret risk); **FCC** SCL-MOD for Curie/Panama branch.

## 7. Cross-references to KAPPA corpus
- LeoLabs Filadelfia (10.6117°N, 85.5287°W) — should be added to KAPPA infrastructure layer alongside Tacacorí Array.
- CSG X-band SAR overpasses + sun-sync 619 km / 97.86° → can be cross-checked against CelesTrak TLEs already in KAPPA collectors.
- BlueMed Palermo hub + Sparkle Seabone → useful as a traceroute target from any CR-hosted KAPPA node for latency-anomaly detection.
- Cy4gate D-SINT + RCS Lab SS7 → matches the SS7/Diameter telecom-signaling indicators already noted in Network Analysis HUMINT cluster.
