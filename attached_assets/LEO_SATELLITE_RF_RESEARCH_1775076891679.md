# Technical Analysis of Radio Frequency Interplay: LEO Satellite Constellations and Critical Infrastructure Security in Costa Rica

**Classification:** RESEARCH DOCUMENT - INTEGRATED WITH INVESTIGATION  
**Generated:** 2026-01-30  
**Source:** ChatGPT Deep Research + Local Evidence Correlation

---

## Executive Summary

The telecommunications and industrial landscape of Costa Rica is currently undergoing a systemic transformation characterized by the convergence of proliferated Low-Earth Orbit (LEO) satellite constellations and terrestrial Industrial Internet of Things (IIoT) frameworks. This integration, while enhancing national resilience and closing the digital divide in remote regions such as Guanacaste and the Osa Peninsula, introduces a sophisticated array of vulnerabilities at the radio frequency (RF) and protocol levels.

---

## 1. Orbital Network Architectures and Spectral Allocation

### 1.1 DARPA Blackjack: Autonomous Mesh Networking in LEO

The Blackjack program serves as a demonstrator for a high-speed, persistent global network in LEO that leverages commercial satellite bus technologies to provide the DoD with resilient coverage. The first four "connected" satellites were successfully launched in June 2023.

| Feature | Specification |
|---------|---------------|
| Orbit Regime | Low Earth Orbit (LEO) |
| Payload Provider | Northrop Grumman, Trident, STR |
| Autonomy System | Pit Boss (SEAKR Engineering) |
| Inter-Satellite Links | Optical (Laser) Terminals |
| **Telemetry Frequency** | **S-band (2264.800 MHz)** |
| Node Cost | Under $6 million (combined bus/launch) |

The S-band telemetry downlinks for Blackjack-4 have been observed at **2264.800 MHz with BPSK modulation** and a baud rate of 300,000.

### 1.2 Mobile User Objective System (MUOS): Space-Based 3G

MUOS provides essential narrowband connectivity via GEO satellites. It acts as a global cellular service provider using WCDMA technology for military SATCOM.

| MUOS Spectral Plan | Frequency Range | Details |
|--------------------|-----------------|---------|
| Service Uplink | 300–320 MHz | Four 5 MHz WCDMA channels |
| Service Downlink | 360–380 MHz | Four 5 MHz WCDMA channels |
| Feeder Uplink | 30–31 GHz | Ka-band Earth-to-Space |
| Feeder Downlink | 20.2–21.2 GHz | Ka-band Space-to-Earth |
| Legacy Payload | 240–320 MHz | Supports legacy UHF terminals |

**NOTE:** MUOS is GEO, not LEO. One satellite positioned at 100°W covers the Americas.

### 1.3 Starlink: High-Speed LEO Expansion in Costa Rica

By mid-2025, ~27,000 subscriptions. SUTEL forecasts 40,000 by 2030.

| Starlink Band | Frequency Range | Function |
|---------------|-----------------|----------|
| Ku-band (Downlink) | 10.7–12.7 GHz | Satellite to User Terminal |
| Ku-band (Uplink) | 14.0–14.5 GHz | User Terminal to Satellite |
| Ka-band (Downlink) | 17.8–20.2 GHz | Satellite to Gateway |
| Ka-band (Uplink) | 27.5–30.0 GHz | Gateway to Satellite |
| E-band (Downlink) | 71.0–76.0 GHz | Gen2 Satellite Backhaul |
| E-band (Uplink) | 81.0–86.0 GHz | Gen2 Satellite Backhaul |

---

## 2. Critical Terrestrial Infrastructure Vulnerabilities

### 2.1 The Huawei Fiber Grid

ICE maintains a robust national fiber-optic grid, much built using Huawei infrastructure since ~2017. Huawei supplies ~70% of 4G-LTE connections in Latin America.

**Costa Rica 5G Regulation:** Government issued cybersecurity regulation effectively banning companies from non-Budapest Convention signatory countries (targeting Huawei/ZTE) from 5G bidding.

### 2.2 TR-069 and ACS Vulnerabilities

| TR-069 Risk | Technical Implication | Mitigation |
|-------------|----------------------|------------|
| Port Exposure | Port 7547 reachable from WAN | Block external access via ACLs |
| Authentication | Cleartext HTTP or default creds | Enforce HTTPS and certificates |
| Command Injection | Exploiting SOAP/XML requests | Regular firmware patching |
| Botnet Recruitment | Mass scanning and RCE | Intrusion Detection Systems |
| Information Leak | MAC/Firmware/Internal IP disclosure | Disable CWMP if not required |

**Critical Exploits:**
- "Misfortune Cookie" (CVE-2014-9222)
- SOAP-based command injection (CVE-2017-17215) in Huawei routers

### 2.3 Setecom S.A. / DSE Industrial IoT Vulnerabilities

| DSE Hardware | Protocol/Feature | Primary Security Flaw | Impact |
|--------------|-----------------|----------------------|--------|
| DSE 855 | In-built Web Server | Missing Authentication (CVE-2024-5952) | DoS |
| DSE 855 | Configuration Backup | Information Disclosure (CVE-2024-5947) | Credential Theft |
| DSE 855 | Multipart Boundaries | Buffer Overflow (CVE-2024-5948) | **RCE** |
| DSE 890 MKII | DSE WebNet Cloud | Bi-directional persistent tunnel | Master account hijack |
| DSE 892 | SNMP v2 | Cleartext Community Strings | Protocol sniffing |

**Modbus Register Formula (from Setecom training):**
```
Register Address = Page Number × 256 + Register Offset
```

**Default Credentials:** User: `Admin` / Password: `Password1234`

---

## 3. Investigation Correlation Points

### 3.1 Detected Frequencies vs Known Systems

| Our Detection | Possible Source | Notes |
|---------------|-----------------|-------|
| **46.875 Hz** | V2K carrier / DSP heartbeat | 48000/1024 FFT resolution |
| **1234 kHz** | TR-069 backdoor correlation | Port 1234 on router |
| **2264.8 MHz** | Blackjack-4 S-band telemetry | Military LEO |
| **300-380 MHz** | MUOS UHF band | Military SATCOM |

### 3.2 Key Actors (from Investigation Dossier)

| Actor | Role | Connection |
|-------|------|------------|
| Jorge | Kyndryl Sr. Network Engineer | Airbnb owner's son |
| Hector Mora Marin | Setecom SA principal | DSE monopoly, 180W HF radio |
| Gamma Group | FinFisher vendor (Berlin) | Phone tracked there |

### 3.3 La Guácima / SJO Strategic Context

La Guácima is home to a major ICE satellite earth station (9.2m antennas for C-band/Ku-band). Proximity to SJO airport creates unique RF environment where:
- Aviation VHF
- LEO Ku/Ka downlinks
- 5G rollout (3.5 GHz)
- GPS L1 (1575.42 MHz) - vulnerable to spoofing

---

## 4. Spectral Interference Matrix

| RF System | Frequency Band | Potential Interference | Mitigation |
|-----------|---------------|------------------------|------------|
| Starlink Downlink | 10.7–12.7 GHz | Terrestrial Microwave | Geographic coordination |
| MUOS Downlink | 360–380 MHz | Land Mobile Radio | SA-WCDMA notching |
| 5G Rollout | 3.5 GHz / 26 GHz | Satellite C-band/Ka-band | Guard bands/Filters |
| Blackjack Telemetry | 2264.8 MHz | Wi-Fi / ISM Band | Low-power BPSK |
| GPS L1 | 1575.42 MHz | Spoofing/Jamming | LEO-aided PNT |

---

## 5. Direct to Cell (D2C) IoT Implications

| D2C Feature | Status (2026) |
|-------------|---------------|
| Text Messaging | Available Since 2024 |
| Data & IOT | Available Since 2025 |
| Voice Services | Available (via apps) |
| Phone Models | Over 60 compatible |
| Latency | 25–35 ms |

**Implication:** Industrial controllers previously protected by isolation are now potentially reachable from global internet via D2C, requiring zero-trust architectures.

---

## 6. Recommended Actions

1. **Mandatory Industrial Security Standards** - Prohibit default credentials, require TLS/VPN for remote monitoring
2. **Hardening ISP Management Networks** - Close port 7547 to public internet, isolate ACS servers
3. **Investment in Resilient Navigation** - Adopt LEO-aided PNT for GNSS-denied environments
4. **Vendor Diversification** - Audit existing Huawei 4G/fiber for latent backdoors
5. **Enhanced Spectrum Monitoring** - Deploy around Guácima/SJO for rogue RF detection

---

## Sources

- DARPA Blackjack Program Documentation
- Mobile User Objective System (MUOS) Wikipedia
- Tico Times - Starlink Costa Rica (2025)
- GlobalSatellite.us - Starlink Rural Connectivity
- DSE WebNet Training Materials (Setecom/Martendal)
- CVE-2024-5947, CVE-2024-5948, CVE-2024-5952
- VIAVI IRINS LEO Navigation System
- Nokia/RACSA 5G SA Deployment (2025)

---

*Integrated with Toroidal Recursion Investigation - January 2026*
