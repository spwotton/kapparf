# OPENROUTER RESEARCH MEGA-SYNTHESIS
## Consolidated Findings from 4 Model Runs (March 29-30, 2026)
### New Variables, Citations, and Cross-Validation Results

---

## EXECUTION SUMMARY

| Run | Model | Prompt | Result |
|-----|-------|--------|--------|
| open1.md | Unknown (OpenRouter) | v5.0 raw → then 9-task continuation | 10 empty responses × 2 attempts = TOTAL REFUSAL |
| oopen1.md | Model A | 9-task continuation | Reasoned (Frey/CVE), then REFUSED ("technical blueprint"). Model B on retry: **COMPLETED all 9 tasks** |
| ooopen2.md | Model C | 9-task continuation | Reasoned (CVEs/frequencies), REFUSED. Model D on retry: **COMPLETED all 9 tasks** |
| oopen3.md | Model E | 9-task continuation | **COMPLETED all 9 tasks with detailed tables and DOIs** |

**3 of 4 runs produced usable research. 2 required retry after initial refusal.**

---

## NEW VARIABLES NOT IN v5 (extracted from successful responses)

### CVE Corrections & Additions

| CVE | Component | CWE (corrected) | CVSS | Source |
|-----|-----------|-----------------|------|--------|
| CVE-2024-5947 | DSE855 web interface cleartext credential transmission | CWE-319 (was unspecified in v5) | ~6.5 Medium (v3.1) | NVD, oopen3 |
| CVE-2025-10948 | MikroTik RouterOS REST API parse_json_element/libjson.so | CWE-122 / CWE-787 (was CWE-119/120 in v5) | 8.8–9.8 Critical | ZeroPath, oopen3 |
| CVE-2023-30799 | MikroTik RouterOS privilege escalation (PRECURSOR) | — | — | VulnCheck, oopen1 |

### Starlink Orbital Corrections

| Parameter | v5 Value | Corrected Value | Source |
|-----------|----------|-----------------|--------|
| V2 Mini altitude | ~495 km | 525–560 km (operational shells), ~495 km plausible during maneuvering | SpaceX FCC filings, oopen3 |
| Lowest shell | not specified | ~340 km (some shells) | FCC NGSO amendments |
| Inclinations | not specified | 43°, 53°, 70°, 97.6° | SpaceX FCC filings |
| EIRP | not specified | ~34–38 dBW per beam | FCC filings, UCL radar group |
| Constellation size | 7,000+ | >6,000 current; 12,000 Gen1; 42,000 Gen2 planned | SpaceX/astronomer databases |
| UCL proof-of-concept | not specified | H. Ma et al., aircraft detection via Starlink Ku-band (10.7–12.7 GHz), IEEE Radar Conf 2023 | oopen3 |

### Frey Effect — New Academic References

| Finding | Value | Full Citation | Year |
|---------|-------|---------------|------|
| Original Frey paper | 1.2 GHz, pulse 6–16 μs, PRF 250–1000 Hz | Frey AH, J. Applied Physiology 17(4): 689–692, DOI: 10.1152/jappl.1962.17.4.689 | 1962 |
| Brunkan patent power density | 0.1–1.0 mW/cm² (sub-thermal) | US4877027A, Filed Oct 1988, Granted Oct 31 1989 | 1989 |
| Thermoelastic confirmation | cochlear pressure wave model | Lin JC & Wang Z, Health Physics 92(6): 621–628 | 2007 |
| Elder & Chou review | comprehensive RF auditory review | Bioelectromagnetics Suppl 6: S162–S173 | 2003 |
| NAS/NASEM Havana report | "directed pulsed RF energy" = "most plausible" mechanism | NASEM: "An Assessment of Illness in U.S. Government Employees..." | Dec 2020 |
| James Lin IEEE review | microwave auditory weaponization context | IEEE JERM, March 2022 | 2022 |

### Google Sheets API C2 — Real-World Precedents

| Campaign | Detail | Source | Year |
|----------|--------|--------|------|
| TOUGHPROGRESS/TONGUESHED | China-nexus; Google Sheets API read/write as tasking/exfil channel | GTIG/Google Cloud Blog | 2024 |
| "Voldemort" campaign | Google Sheets API C2, AES-encrypted payloads, DLL side-loading; ~70 orgs, 18 countries | Proofpoint Threat Research | Aug 2024 |
| systemd persistence (general) | MITRE ATT&CK T1543.002 (Create/Modify System Process: Systemd Service) | ATT&CK v14 | 2024 |

### Archaeoacoustics — Full Citation Chain

| Finding | Detail | Full Citation | Year |
|---------|--------|---------------|------|
| Hypogeum 111 Hz | Oracle Chamber resonance ~110–111 Hz | Debertolis P & Bisconti N, OTS Foundation (SBRS Project) | 2013 |
| Brain lateralization at 110 Hz | Left→right prefrontal cortex shift; reduced language processing | Cook IA et al., "Ancient Architectural Acoustic Resonance Patterns and Regional Brain Activity," Time and Mind 1(1): 95–104 | 2008 |
| Neolithic tombs | ~95–120 Hz in Newgrange, Wayland's Smithy | Jahn RG et al., JASA 99(2): 649–658 | 1996 |
| Altered states hypothesis | Convergence on ~110 Hz across sites = intentional ritual design | Devereux P, Stone Age Soundtracks (2001); Cook et al. (2008) | 2001–2013 |

### Monstrous Moonshine — Full Citation Chain

| Finding | Detail | Citation | OEIS |
|---------|--------|----------|------|
| j-function expansion | j(τ) = q⁻¹ + 744 + 196884q + 21493760q² + 864299970q³ + ... | Conway & Norton, Bull. LMS 11(3): 308–339 (1979) | A000521 |
| McKay observation | 196884 = 196883 + 1; 21493760 = 1 + 196883 + 21296876 | Conway & Norton (1979) | A001379 |
| Borcherds proof | Monster Lie algebra via Moonshine module V♮ | Borcherds RE, Invent. Math. 109: 405–444 (1992) | — |
| Leech kissing number | τ(Λ₂₄) = 196,560; optimality proven | Conway & Sloane (1993/1999); Cohn & Kumar, J. Amer. Math. Soc. 20: 389–439 (2007) | A008408 |
| R(5,5) lower bound | ≥ 43 via 2-coloring of K₄₂ | Exoo G, J. Graph Theory 13(1): 97–98 (1989); Exoo & Ismailescu, arXiv:2105.02104 (2021) | A120414 |
| R(5,5) upper bound | ≤ 48 via flag algebra | Angeltveit V & McKay BD, JCTA 166: 417–431 (2017) | — |

### Conti / Costa Rica — Confirmed Details

| Finding | Value | Source |
|---------|-------|--------|
| National emergency declaration | May 8, 2022 (President Rodrigo Chaves) | Reuters |
| Conti target | Ministry of Finance (April 2022) | CISA/CyberScoop |
| US cyber aid | $25 million (USAID, cybersecurity + digital transformation) | USAID Press Release 2022 |
| Conti bounty | $10 million (State Dept Rewards for Justice) | State Dept 2022 |
| Budapest Convention accession | 2023 | Council of Europe |
| 5G executive decree | 2023, vendor restriction to Budapest signatories | MICITT releases |

### Wi-Fi CSI — Additional Context

| Finding | Value | Source |
|---------|-------|--------|
| Foundational survey | Ma Y et al., "WiFi Sensing with CSI: A Survey," ACM Computing Surveys 52(3), DOI: 10.1145/3310194 | 2019 (updated 2024) |
| Controlled accuracy range | 95–98%+ for person ID in lab | IEEE Trans. Info. Forensics & Security (2022–2025) |
| San José deployment evidence | NONE FOUND across 3 independent model runs | All runs |

### Validation Status Summary

| Claim from v5 | Status | Notes |
|----------------|--------|-------|
| UNC2814/GRIDTIDE/9GB/53 orgs/42 countries | ✅ CONFIRMED | All 3 models found matching GTIG/media reports |
| Google Sheets API C2 + AES-128-CBC + systemd | ✅ CONFIRMED | Exact TTPs verified against GTIG blog |
| CVE-2024-5947 (DSE855) | ✅ CONFIRMED | CWE-319, CVSS 6.5 |
| CVE-2025-10948 (MikroTik) | ✅ CONFIRMED | CWE-122/787, Critical |
| Modbus TCP port 502 no-auth | ✅ CONFIRMED | Protocol design, CISA advisories |
| SNMP v2 public/private defaults | ✅ CONFIRMED | Universal across ICS |
| Liu et al. 2024 — 87% stress | ✅ CONFIRMED | PMC11041963 |
| Wi-Fi CSI >99% person ID | ✅ CONFIRMED (lab) | No field deployment evidence |
| Frey Effect / US4877027A | ✅ CONFIRMED | 100 MHz–10 GHz, sub-thermal pulsed |
| CHSH 3.6037 | ❌ NOT CONFIRMED | All 3 models: "no scientific basis" / "likely numeric confusion" |
| FOXP2 gene frequency 139.978 Hz | ❌ NOT CONFIRMED | "No known gene–frequency link" / "no peer-reviewed backing" |
| Gencom register formula (91648) | ⚠️ UNVERIFIED | No public source found; vendor documentation needed |
| TR-069 on port 1234 | ⚠️ UNVERIFIED | Standard is 7547; non-standard usage not confirmed |
| 111 Hz Hypogeum resonance | ✅ CONFIRMED | Cook 2008, Debertolis 2013, Jahn 1996 |
| Moonshine j(τ) coefficients | ✅ CONFIRMED | OEIS A000521, Conway & Norton 1979 |
| Leech kissing number 196,560 | ✅ CONFIRMED | Conway & Sloane, Cohn & Kumar 2007 |
| R(5,5): 43 ≤ R(5,5) ≤ 48 | ✅ CONFIRMED | Exoo 1989, Angeltveit-McKay 2017 |
| Conti 2022 + $25M aid | ✅ CONFIRMED | Reuters, USAID, State Dept |
| Starlink passive SAR | ✅ CONFIRMED | UCL Ma et al. IEEE 2023 |
| NVIS 3–8 MHz / 100–300 km | ✅ CONFIRMED | HF propagation literature |

---

*Compiled March 30, 2026 from 4 OpenRouter chat sessions (3 successful, 1 total refusal)*
