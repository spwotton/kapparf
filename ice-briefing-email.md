**To:** Dirección de Tecnologías de Información, Instituto Costarricense de Electricidad (ICE)
**From:** Samuel Wotton — Project KAPPA / ciajw.com
**Subject:** Independent SIGINT Analysis of ICE Infrastructure Vulnerabilities — Briefing & Offer of Assistance
**Date:** April 1, 2026

---

Estimados señores,

My name is Samuel Wotton. I operate an independent multi-domain signal intelligence platform called KAPPA from Sabana Norte, San José — specifically from Aparthotel Suites Cristina, which is right next door to your offices. I'm writing because I've compiled an intelligence briefing that may be of value to your security team in light of the recent breach disclosure.

## What I Found

Over the past several months, my platform has been passively collecting and correlating signal data across RF, satellite, network, and acoustic domains in the San José metropolitan area. In the course of this work, I've documented several findings relevant to ICE's infrastructure:

1. **SETECOM/DSE Gateway Default Credentials** — Every DSE 855, 890 MKII, 891, and 892 gateway distributed by SETECOM S.A. ships with the credentials Admin/Password1234. These units control backup generators for ICE's national power grid, Liberty telecom infrastructure, hospitals, and cellular towers. This is an immediate critical vulnerability.

2. **GRIDTIDE C2 Detection Indicators** — The backdoor attributed to UNC2814 uses Google Sheets API as its command-and-control channel, which means traditional IDS/IPS will not detect it. I've compiled specific filesystem, persistence, and network indicators your SOC team can use to sweep your systems.

3. **12 Confirmed CVEs** — Including CVE-2025-10948 (MikroTik REST API heap overflow, CVSS 8.8-9.8) which is actively being exploited in Costa Rican ISP infrastructure, and four DSE855 CVEs published by CISA/ZDI in 2024.

4. **Tier-0 Visibility Gap** — The US-funded SOC (Mandiant/Google SecOps) monitors application-layer traffic, but UNC3886 operates at the hypervisor level — below guest OS, invisible to all EDR solutions. The median dwell time for these operations is 122 days.

5. **Modbus TCP/502 Exposure** — Your SCADA networks use protocols with zero authentication by design. Any device on the network can issue commands to generators, fuel systems, and RPM controllers.

## Two Perspectives

I've prepared a full briefing that examines the breach from two analytical angles:

- **Perspective A:** The Gallium attribution may be covering domestic activity. Physical indicators I've documented (fiber splitters, TR-069 resets, room-level monitoring infrastructure) suggest actors with local physical access.

- **Perspective B:** ICE genuinely faces a sophisticated PRC-linked threat, and the underlying vulnerabilities are real regardless of who exploited them.

Both perspectives converge on the same conclusion: the remediation steps are identical. Secure the SCADA systems. Patch the routers. Audit the hypervisors.

## The Full Briefing

The complete intelligence briefing — including the prioritized action plan, CVE chain, GRIDTIDE detection guidance, Chinese satellite tracking data, and malware arsenal documentation — is available at:

**https://ciajw.com** (navigate to Operations → ICE Briefing)

## My Offer

I'm literally next door at Suites Cristina in Sabana Norte. If your team would like to discuss any of these findings, review the raw data, or explore how KAPPA's continuous monitoring capabilities could support your security operations, I'm available to meet at your convenience.

The KAPPA platform provides 24/7 autonomous correlation across:
- RF spectrum monitoring via 33 KiwiSDR nodes (71 frequency targets)
- Satellite constellation tracking (Beidou, Yaogan, Gaofen ISR)
- Network forensics — TR-069, PCAP analysis, MAC fingerprinting
- External data feeds — USGS seismic, NOAA space weather, WWLLN lightning
- Automated evidence chain with SHA-256 integrity hashing

I built this because I care about what's happening here. The vulnerabilities are real, and I'd rather help fix them than just document them.

Atentamente,

**Samuel Wotton**
Project KAPPA / Project Echo
ciajw.com
Aparthotel Suites Cristina, Sabana Norte, San José, Costa Rica
10.0514°N, 84.2187°W
