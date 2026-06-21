# ADVANCED RF & NETWORK SECURITY: FIELD CASE STUDY MODULE
## Course: Applied SIGINT Forensics & Counter-Surveillance (ASFC-701)
## Classification: Educational — Fictional Scenario — Hypothetical
## Instructor Edition | All scenarios are composite fictional constructs for pedagogical purposes

---

## COURSE PHILOSOPHY

> "You cannot defend a system you do not understand how to attack."
> — Standard precept, Offensive Security Certified Professional (OSCP) curriculum

This module uses a **fictional composite scenario** — a US citizen operating an autonomous RF observatory from a coastal hotel in Latin America — to teach the full attack surface of a modern multi-layer surveillance operation. Students will analyze the scenario from BOTH the offensive analyst's perspective (to understand the attack) AND the defensive operator's perspective (to build countermeasures). Every technique described here is covered in public security certifications (CEH, OSCP, GWAPT, GPEN) and academic literature.

**Legal framework reminder:** Offensive techniques described in this module are legal ONLY on systems you own or have explicit written authorization to test. Unauthorized use is a violation of the Computer Fraud and Abuse Act (US), Computer Misuse Act (UK), and equivalent statutes in all jurisdictions.

---

## MODULE STRUCTURE

```
UNIT 1 — Threat Landscape & Scenario Brief
UNIT 2 — BLE/Bluetooth Attack Surface
UNIT 3 — Network Gateway Exploitation (TR-069, ARRIS)
UNIT 4 — RF Fingerprinting & MAC Randomization Bypass
UNIT 5 — Physical Layer SIGINT (SDR, ELF, HF)
UNIT 6 — Optical/Acoustic Side-Channel Attacks
UNIT 7 — Human Layer (HUMINT/Social Engineering)
UNIT 8 — Persistent Access & C2 Frameworks
UNIT 9 — Detection, Attribution & Countermeasures
UNIT 10 — Legal Evidence Chain & Reporting
APPENDIX A — Tool Reference Sheet
APPENDIX B — Lab Prompt Megachain (AI Expansion Prompt)
```

---

## UNIT 1 — THREAT LANDSCAPE & SCENARIO BRIEF

### 1.1 Fictional Scenario: "Operation COASTAL MIRROR"

**Target Profile:** A US-citizen independent researcher (call sign "Echo") operating a multi-domain RF signal intelligence platform from a fixed hotel observation post in a coastal tourist corridor. The researcher publishes findings publicly.

**Adversary Assessment:** A geographically distributed, multi-layered surveillance network with the following assessed components:
- **Layer 1 — Physical:** Static observation posts, mobile surveillance platforms (vehicles), RF emission hardware positioned in adjacent structures
- **Layer 2 — Network:** Compromised ISP routing equipment, rogue mesh nodes, passive fiber taps
- **Layer 3 — Electronic:** BLE tracking arrays, WiFi deauthentication, directed RF emissions
- **Layer 4 — Human:** HUMINT assets with social engineering roles, pattern-of-life mapping

**Student Task:** Analyze each layer. For each attack vector: (a) explain the mechanism, (b) identify detection signatures, (c) propose countermeasures.

---

## UNIT 2 — BLE / BLUETOOTH ATTACK SURFACE

### 2.1 How BLE Passive Surveillance Works

Bluetooth Low Energy operates in the 2.4 GHz ISM band across 40 channels (37 advertising + 3 data). Passive scanners receive all advertising PDUs without pairing.

**What a passive BLE scanner captures (no auth required):**
```
- Device address (MAC) — may be randomized
- Company ID (manufacturer identifier)
- Service UUIDs (identifies app/device type)
- Manufacturer-specific data (often encodes device serial, hostname, state)
- RSSI (signal strength → distance estimate)
- Advertising interval (device behavior fingerprint)
- Broadcast name
```

**Tools students should understand:**
- `hcitool` / `bluetoothctl` (Linux BLE scanning)
- `bettercap` (network/BLE active + passive scanning)
- `nRF Sniffer` (Nordic Semiconductor — BLE protocol analysis)
- Wireshark with BLE dissector
- `btlejuice` / `gattacker` (MITM for BLE GATT)
- `crackle` (BLE legacy pairing key brute-force — deprecated in BLE 4.2+)

### 2.2 Case Study: Captured BLE Signatures from Target Zone

In the fictional scenario, a field operator positioned within the target corridor captures the following at 10:51–10:52:

| Device | Company ID | Key Data | RSSI | Forensic Finding |
|--------|-----------|----------|------|-----------------|
| Google Fast Pair | 0x00E0, UUID:FE9F | Account-key filter: `0278 5A77 424B 6879...` | −96 dBm | Android phone — account key bypasses MAC randomization |
| Microsoft Workstation | 0x0006 | `DESKTOP-TQA87KL` in plaintext ASCII | −98 dBm | Corporate laptop hostname exposed |
| Windows Proximity | 0x0006, Beacon:9 | Salt:A252, Hash:DF00 | −100 dBm | Trackable within 15-min rotation window |
| GoPro Camera | 0x02F2, UUID:FEA6 | `0100 153F 00F9...` | −100 dBm | Active recording device, 1007ms interval = low-power standby |
| Smart LED Controller | UUID:FFE1 | Name:SP530E | −102 dBm | IoT fixed anchor — used for trilateration reference |
| HP Office Endpoint | 0x0065, UUID:FE78 | Print discovery beacon | −99 dBm | Corporate/office proximity confirmed |

**Discussion question:** Which of these devices CANNOT be reliably tracked despite randomized MAC? Why? (Answer: The Windows Proximity beacon — its salt rotates every 15 minutes and cannot be linked across rotations without physical-layer fingerprinting.)

### 2.3 MAC Randomization — and How It Fails

Modern iOS (since iOS 14) and Android (since Android 10) rotate the MAC address every 15 minutes. This defeats naive passive tracking.

**Bypass technique 1 — Protocol-Layer Leakage:**
Certain protocols embed static identifiers ABOVE the MAC layer:
- Google Fast Pair: Account-key filter is static per Google account → tracks across MAC rotations
- Apple Continuity: Many Apple services embed device-specific identifiers
- Windows Nearby Share: Beacon type/scenario fields partially static

**Bypass technique 2 — RF Fingerprinting (Physical Layer):**
Every radio transmitter has unique hardware imperfections:
- Phase noise
- Carrier frequency offset (CFO)
- I/Q imbalance
- Power amplifier distortion

These are measurable with an SDR at sufficient sample rate. The "RadioFingerprint" signature is invariant even when MAC changes.

```python
# Conceptual pseudocode — RF fingerprint extraction
def extract_rf_fingerprint(iq_samples):
    # Step 1: Synchronize to burst
    burst = detect_burst(iq_samples)
    # Step 2: Extract CFO
    cfo = estimate_cfo(burst)
    # Step 3: Extract I/Q imbalance
    iq_imbalance = estimate_iq_imbalance(burst)
    # Step 4: Feature vector
    return [cfo, iq_imbalance, phase_noise_variance(burst)]
    # Compare against known device database using cosine similarity
```

**Bypass technique 3 — Temporal-Spatial Stitching:**
```
Score = α·exp(−Δt/σ) + β·exp(−ΔRSSI/γ)
```
If a device disappears and a new MAC appears with similar RSSI within seconds at the same location, it's likely the same device. Threshold θ typically set at 0.85 for 90%+ accuracy.

**Lab Exercise 2A:** Given the following MAC rotation event log, apply the stitching formula with α=0.6, β=0.4, σ=10s, γ=5dBm and identify which pairs represent the same physical device.

**Defense:** Enable Bluetooth only when needed. Use airplane mode during sensitive conversations. Note that even with randomization, iOS devices leak the real MAC when connecting to KNOWN WiFi networks.

### 2.4 Trilateration — Locating a Device from Multiple Readers

Given RSSI from ≥3 fixed reference nodes, a device can be located:
```
Distance = 10^((TxPower - RSSI) / (10 × n))
```
Where n = path loss exponent (2.0 free space, 3.0–4.0 indoors/concrete).

With the SP530E Smart LED Controller as a fixed anchor (known location), the system calibrates its path loss model and uses Weighted Centroid Localization (WCL) to achieve ~1.6m accuracy in reflective environments.

**Countermeasure:** A Faraday enclosure (aluminum mesh tent, ~$40) reduces BLE emissions by 40–60 dB. A "signal jammer" is illegal to operate; a Faraday cage is not.

---

## UNIT 3 — NETWORK GATEWAY EXPLOITATION

### 3.1 TR-069: The ISP Back Door

TR-069 (CWMP — CPE WAN Management Protocol) is an ISP remote management protocol implemented in virtually every consumer gateway in Latin America and most of the world.

**What TR-069 can do remotely:**
- Reset admin password
- Change WiFi SSID and password
- Modify DNS servers (→ enables DNS hijacking → phishing injection)
- Add port forwarding rules (→ exposes internal devices)
- Push new firmware (→ persistent rootkit delivery)
- Factory reset (→ removes forensic evidence)
- Read full device configuration including connected device list

**The ARRIS TG02DA specific vulnerability:**
- Port 1234: ISP-side ACS (Auto-Configuration Server) direct access
- Default credential pattern: `admin / password` (also: `admin / [serial number last 8 digits]`)
- CVE-2014-9222 (Misfortune Cookie): TR-069 cookie overflow in ARRIS devices
- CVE-2019-3914: Command injection via SSID configuration field

**Attack chain in the scenario:**
```
ISP ACS access (legitimate employee OR credential theft)
    → TR-069 push to ARRIS TG02DA
    → Admin password reset (documented 2026-01-30)
    → DNS server changed to adversary-controlled resolver
    → All HTTP traffic inspectable / modifiable
    → ARP table dumped → all device MACs + IPs mapped
    → BLE MAC randomization bypassed (real MAC visible on LAN)
```

**Detection:** 
- Monitor router admin log for unexpected config changes
- Check DNS server settings regularly (`ipconfig /all` on Windows, `cat /etc/resolv.conf` on Linux)
- Use DNS-over-HTTPS (DoH) to resist DNS hijacking
- OpenWrt/DD-WRT on supported hardware gives you full visibility

**Countermeasure:** If you can't replace the ISP gateway, put your own router behind it (double-NAT) and do NOT trust the ISP's DNS. Use a travel router with VPN capability (GL.iNet models) — creates a separate trusted LAN the ISP equipment cannot inspect.

### 3.2 Rogue Mesh Node Detection

The scenario documents a "Ghost Deco" — a rogue TP-Link Deco mesh node appearing online while its physical counterpart is unplugged.

**Mechanism:**
- Attacker has a second Deco unit at their observation post (~50m away)
- Bridges via Ethernet to target's network (after obtaining WiFi password via TR-069)
- MAC-spoofs the legitimate Deco's address
- Now has full LAN access, sees all ARP traffic, can inject

**Detection:**
```bash
# Run this on Linux attached to your network
arp -a                           # Check for duplicate MACs
nmap -sn 192.168.1.0/24          # Map all devices
arp-scan --localnet              # Detailed ARP scan
```

If two devices share a MAC address, one is spoofing the other.

**Lab Exercise 3A:** Using bettercap in ARP monitoring mode, identify a rogue device on a test network. Document: IP, MAC, hostname, first-seen timestamp. Write a SHA-256 hash of your evidence file.

### 3.3 Fiber Tap — Passive Optical Intercept

A passive optical splitter at the NAP (Network Access Point) copies all light from the fiber strand to a second output — completely undetectable to the subscriber. No traffic anomaly, no latency change.

**What a fiber tap captures:** ALL unencrypted traffic, TLS handshakes (for later decryption if keys obtained), DNS queries (even with HTTPS, SNI leaks domain names).

**Countermeasure:** End-to-end encryption is your only defense against a fiber tap. Use:
- WireGuard VPN (fastest, modern)
- Mullvad or ProtonVPN (no-log, audited)
- Signal for voice/text
- PGP for email

Even with a tap, properly encrypted traffic is unreadable without the private key.

---

## UNIT 4 — SDR & RF PHYSICAL LAYER

### 4.1 Software Defined Radio Fundamentals

An SDR converts RF signals to digital I/Q samples, then processes them in software. Entry-level hardware:

| Device | Price | Frequency Range | Use Case |
|--------|-------|----------------|---------|
| RTL-SDR v4 | $30 | 500 kHz–1.75 GHz | Passive monitoring, ADS-B, ACARS |
| HackRF One | $350 | 1 MHz–6 GHz | TX+RX, BLE sniffing, GPS replay |
| USRP B210 | $2,200 | 70 MHz–6 GHz | Professional research, RF fingerprinting |
| LimeSDR Mini | $200 | 10 MHz–3.5 GHz | General purpose TX+RX |

**Key software:**
- GNU Radio (block-diagram signal processing)
- SDR# / GQRX (spectrum visualization)
- URH — Universal Radio Hacker (protocol reverse engineering)
- Inspectrum (capture analysis)
- TEMPEST for Eliza (demonstrates VGA emanation — historical)

### 4.2 Key Frequencies in the Scenario

| Frequency | Band | Relevance |
|-----------|------|-----------|
| 46.875 Hz | ULF | DSP frame clock fingerprint (48000/1024) — identified in scenario as TARGET_FREQ |
| 7,410 kHz | HF | Licensed HF transceiver — recurring in KiwiSDR captures |
| 433 / 868 MHz | UHF | Visonic PowerG wireless security sensors |
| 2.4 GHz | ISM | WiFi, BLE, Zigbee — dense in target area |
| 1090 MHz | L-band | ADS-B aircraft transponders |
| 1575.42 MHz | L1 | GPS — susceptible to spoofing/jamming |

**Lab Exercise 4A:** Using an RTL-SDR and GQRX, record a 30-second IQ capture of the 2.4 GHz band. Identify at least 3 distinct emitter signatures by their spectral footprint. Measure center frequency offset as a hardware fingerprint.

### 4.3 WiFi Deauthentication Attack (802.11)

The 802.11 standard (pre-Protected Management Frames) allows any station to send an unauthenticated Deauth frame, causing the target to disconnect.

```bash
# Educational representation only — requires authorized test network
# airmon-ng start wlan0          # Enable monitor mode
# airodump-ng wlan0mon           # Capture surrounding networks
# aireplay-ng -0 5 -a [BSSID] -c [CLIENT_MAC] wlan0mon
```

**Detection:** A sudden disconnect + reconnect cycle with no corresponding AP-side event is a deauth attack signature. Tools: `aireplay-ng` in monitor mode, Kismet's alert system.

**Countermeasure:** IEEE 802.11w (Protected Management Frames — PMF) prevents deauth attacks. Enabled by default on WPA3. Force WPA3 on your hotspot if your device supports it.

---

## UNIT 5 — OPTICAL & ACOUSTIC SIDE CHANNELS

### 5.1 Laser-Doppler Vibrometry (LDV) — Room Audio Extraction

LDV uses a laser reflected off a vibrating surface (window glass, hanging objects) to measure micro-displacements from acoustic pressure. Recovery of speech from reflective objects through glass is documented in academic literature (Abe Davis, MIT CSAIL, 2014 — "The Visual Microphone").

**How it works:**
1. Near-infrared laser aimed at target surface (invisible to human eye)
2. Returned light has Doppler frequency shift proportional to surface velocity
3. Demodulated Doppler signal = acoustic waveform = conversation

**Detection:** 
- A LaserBee or similar laser detector (detects 650-1100nm wavelengths)
- Irregular vibrations from hanging objects with no apparent cause
- Rolling-shutter artifacts in video recorded in target area (strobed IR laser → camera sensor interaction)

**Countermeasure:**
- Acoustic white noise generator (speech privacy machine) — raises the noise floor to defeat LDV
- Mylar window film disrupts clean reflection
- Remove reflective hanging objects from sensitive areas

### 5.2 WiFi CSI Sensing (Through-Wall Radar)

Channel State Information (CSI) captures multipath fading characteristics of the WiFi signal. Human movement and respiration modulate these paths — allowing reconstruction of motion, breathing rate, and even keystroke patterns from WiFi CSI alone.

**Academic basis:** "WiSee" (University of Washington, 2013), "Vital-Radio" (MIT CSAIL), "Through-Wall Human Pose Estimation" (MIT 2018).

**Requirements for attacker:** A WiFi device inside or immediately adjacent to the target space (or a very high-gain antenna with clear LOS). Standard 802.11n/ac routers can be used with modified drivers (e.g., `nexmon` CSI patch for Raspberry Pi + BCM43455 chipset).

**Detection:** This is nearly impossible to detect passively. The attack uses normal WiFi signals — no anomalous emissions.

**Countermeasure:**
- A Faraday room (copper mesh wallpaper, RF shielding paint) — expensive but complete
- Disable unnecessary WiFi on all in-room devices
- WireGuard VPN tunnel prevents content exfiltration even if CSI analysis reveals behavioral data

---

## UNIT 6 — PERSISTENT ACCESS & C2 FRAMEWORKS

### 6.1 L3MON Android RAT — Architecture

L3MON (open source, now removed from GitHub but archived) was an Android Remote Access Trojan delivered via APK sideloading or exploit.

**Capabilities documented in academic literature:**
- Live microphone streaming
- GPS location tracking
- SMS/call log exfiltration
- Camera access (front + rear)
- Contact list, files
- Command & Control via web panel over HTTP

**Delivery vectors:**
- Malicious APK sideload (social engineering)
- Compromised charging cable with embedded microcontroller
- App store cloned app with injected payload
- OTA update hijack via compromised WiFi

**Detection (Android):**
```
Settings → Battery → Battery Usage: look for unknown apps consuming power
Settings → Permissions: review apps with Microphone/Camera/Location access
ADB: adb shell pm list packages -f | grep -v system
Network monitoring: look for unexpected outbound connections to unknown IPs
```

**Countermeasure:**
- GrapheneOS or CalyxOS (hardened Android builds with strict permission sandboxing)
- Disable ADB when not in use
- Never install APKs from unknown sources
- Use a dedicated "travel phone" — restore to factory between locations

### 6.2 DSE Webnet Gateway as C2

In the scenario, SETECOM operates Deep Sea Electronics (DSE) generator controllers at critical infrastructure sites. The DSE Webnet cloud gateway maintains a permanent 4G GSM polling tunnel from each DSE unit to servers in England — below EDR/firewall visibility.

**Relevant CVEs:**
- CVE-2024-5947: Unauthenticated GET /Backup.bin → SCADA credentials in plaintext
- CVE-2024-5950: Stack overflow → RCE (no auth)
- CVE-2024-5949: Malformed request → permanent DoS
- CVE-2024-5952: Unauthenticated remote reboot

**Why this matters:** If an attacker controls a DSE unit co-located with ISP infrastructure (ICE, Liberty CR), they have:
- Physical presence at the telecom facility
- Potential ACS access for TR-069 pushes
- Cover story for site visits

---

## UNIT 7 — PHYSICAL LAYER SURVEILLANCE

### 7.1 Static Observation Post (SOP) — Setup & Detection

**Characteristics of a well-constructed SOP:**
- RF-transparent visual concealment (artificial foliage, privacy screen — passes WiFi/BLE/cellular/acoustic)
- Elevated position for LOS
- Power supply (mains-connected preferred over battery)
- Comfortable for extended occupancy
- Plausible cover (religious institution, residential, commercial)

**Equipment typically deployed:**
- Long-range directional WiFi (ALFA AWUS036ACH + Yagi = 1–2km)
- SDR with wideband antenna
- Parabolic microphone (100m+ range for focused audio)
- High-zoom camera (thermal or optical)
- Android device running L3MON C2

**Detection signatures:**
- Artificial screening (plastic/fabric) on chainlink — passes RF but blocks visual
- Cables running to unusual locations
- Consistent occupancy patterns during target's active hours
- Vehicles permanently parked outside normal pattern

**Counter-surveillance (legal):**
- Note and photograph all vehicles, times, occupants (public spaces — legal)
- RF power meter scan of perimeter (measures anomalous emission sources)
- Thermal camera scan of exterior walls (detects heat signatures of running equipment)
- Identify SOP positions by line-of-sight geometry from your location

### 7.2 Mobile SIGINT Platform (Vehicle)

A parked vehicle is an ideal signals platform:
- 12V DC power from battery (or engine running)
- Metal roof = excellent antenna ground plane
- Common in environment = zero surveillance attention
- Mobile = relocates when target moves

**Equipment:**
- WiFi Pineapple Nano/Tetra: MITM, deauth, rogue AP
- HackRF One: wideband TX/RX
- Android phone: L3MON C2, GPS logging
- Laptop: Traffic analysis, command center

**Detection:** Note permanently parked vehicles. Photograph license plates with timestamps. An IMSI catcher in a vehicle produces GSM anomalies detectable with SnoopSnitch (Android) or AIMSICD.

---

## UNIT 8 — DETECTION, ATTRIBUTION & COUNTERMEASURES

### 8.1 The Detection Stack

```
Layer 7 — Social/HUMINT:    Document all anomalous human activity, timing, patterns
Layer 6 — RF:               KiwiSDR monitoring, RTL-SDR spectrum capture, RSSI anomalies
Layer 5 — Network:          Wireshark, Zeek/Bro, Pi-hole with DNS logging, ARP monitoring
Layer 4 — BLE:              bettercap BLE recon, passive scan logs with timestamps
Layer 3 — Physical:         Thermal camera, laser detector, RF power meter
Layer 2 — Legal:            SHA-256 evidence chain, timestamped logs, legal counsel
Layer 1 — Operational:      VPN always-on, Faraday bag when not in use, GrapheneOS
```

### 8.2 The Evidence Chain

All forensic captures must be legally defensible:
```bash
# Hash every evidence file immediately on capture
sha256sum evidence_file.pcap > evidence_file.pcap.sha256
# Record: timestamp, location, device, observer, chain of custody
# Store on write-once medium or cloud with timestamp signing
```

**Tools:**
- `Autopsy` (open source digital forensics)
- `Volatility` (memory forensics)
- `Wireshark` with packet timestamps (enable absolute time display)
- `tcpdump` for headless capture
- `Rita` (threat hunting in PCAP data)

### 8.3 Reporting Structure

Report to authorities IN THIS ORDER for maximum effectiveness:
1. **Local law enforcement** (OIJ in Costa Rica, local PD) — document they received it
2. **FBI Cyber Division** — cyber@fbi.gov (if US citizen involved)
3. **CISA ICS-CERT** — for critical infrastructure components (DSE/SETECOM)
4. **US Embassy** — ACS section for citizen protection
5. **FCC** — if unlicensed RF emissions in US-controlled frequencies
6. **SUTEL** (Costa Rica) — telecommunications regulator
7. **Media** (Bellingcat, The Intercept, Wired) — publish documented findings

---

## UNIT 9 — LEGAL & ETHICAL FRAMEWORK

### 9.1 What Is Legal for Defenders

| Action | Legal Status |
|--------|-------------|
| Passive RF scanning (receive only) | Legal everywhere |
| Passive BLE scanning | Legal everywhere |
| Photographing public spaces/people | Legal (public spaces) |
| Network scanning YOUR OWN network | Legal |
| VPN usage | Legal in most jurisdictions |
| Faraday cage | Legal everywhere |
| Documenting evidence with timestamps | Legal |
| OSINT research on public records | Legal |
| Publishing findings on public domain | Legal (with care re: defamation) |

### 9.2 What Requires Authorization

| Action | Requirement |
|--------|-------------|
| Penetration testing any network | Written authorization from owner |
| RF transmission (TX) | FCC/ITU license for the frequency |
| Intercepting others' communications | Wiretap Act exemptions only |
| Publishing private information | Legal review — defamation/privacy laws |

### 9.3 The Researcher's Maxim

**Document → Report → Publish.** In that order. Never retaliate technically — it converts you from victim to perpetrator and destroys your legal standing.

---

## APPENDIX A — TOOL REFERENCE SHEET

### Must-Know Tools

| Tool | Category | Platform | Skill Level |
|------|----------|----------|-------------|
| Wireshark | Packet analysis | Win/Mac/Linux | Beginner |
| bettercap | Network/BLE recon | Linux | Intermediate |
| nmap | Network scanning | All | Beginner |
| Aircrack-ng | WiFi security | Linux | Intermediate |
| GNU Radio | SDR/signal processing | Linux/Mac | Advanced |
| Kismet | Wireless IDS | Linux | Intermediate |
| Zeek/Bro | Network traffic analysis | Linux | Advanced |
| Volatility | Memory forensics | All | Advanced |
| Autopsy | Digital forensics | Win/Mac/Linux | Intermediate |
| SDR# / GQRX | Spectrum visualization | Win/Linux | Beginner |
| URH | Protocol reverse engineering | All | Advanced |
| Pi-hole | DNS logging/blocking | Linux (Pi) | Beginner |
| WireGuard | VPN | All | Intermediate |
| Signal | Secure messaging | Mobile | Beginner |
| GrapheneOS | Hardened Android | Pixel only | Intermediate |
| SnoopSnitch | IMSI catcher detection | Android | Beginner |

### Learning Path

```
BEGINNER:
  TryHackMe (free) → CompTIA Security+ → CEH

INTERMEDIATE:
  Hack The Box → OSCP (Offensive Security) → GPEN (GIAC)

ADVANCED RF:
  SANS SEC556 (IoT Penetration) → SANS FOR578 (Cyber Threat Intel)
  GNU Radio Academy → amateur radio license (Technician → General → Extra)

ACADEMIC:
  Usenix Security papers (free) → IEEE S&P → DEF CON / Black Hat presentations
```

---

## APPENDIX B — AI EXPANSION MEGAPROMPT

**Copy and paste this prompt into any frontier LLM to expand this document into a full textbook:**

---

```
You are an expert cybersecurity educator writing a graduate-level textbook called "Applied SIGINT & RF Security: Field Forensics for Hostile Environments." 

Expand the following course module into a complete 300-page textbook with:

1. CHAPTER 1 — Foundations of RF Security
   - Physics of electromagnetic propagation (Maxwell's equations, Friis transmission, Fresnel zones)
   - Antenna theory (gain, directivity, polarization, phased arrays)
   - Modulation schemes (AM, FM, OOK, FSK, PSK, QAM) and their forensic signatures
   - The RF threat taxonomy: passive collection, active injection, direction finding, jamming

2. CHAPTER 2 — BLE & Bluetooth Security: Deep Dive
   - Full BLE protocol stack (PHY, LL, HCI, L2CAP, ATT, GATT, GAP, SM)
   - Advertising PDU types and their forensic significance
   - Company ID database and what each reveals
   - UUID taxonomy: service UUIDs, characteristic UUIDs, their operational meanings
   - Pairing mechanisms: LE Legacy, LE Secure Connections, vulnerabilities of each
   - KNOB attack (CVE-2019-9506), BIAS attack (CVE-2020-10135), BlueFrag (CVE-2020-0022)
   - Full BLE capture and analysis lab with real tool commands

3. CHAPTER 3 — WiFi Security: 802.11 Attack Surface
   - Management frame attacks (deauth, disassoc, beacon flood)
   - WPA2 4-way handshake capture and offline cracking
   - PMKID attack (hashcat)
   - Evil twin / rogue AP construction
   - 802.11w PMF and why it matters
   - WiFi CSI sensing: academic research overview, detection, countermeasures

4. CHAPTER 4 — ISP Gateway Security
   - TR-069/CWMP protocol deep dive: SOAP messages, RPCs, data model (TR-098, TR-181)
   - Known ARRIS vulnerabilities: full CVE list with PoC references
   - Modem/gateway firmware extraction and analysis
   - Custom firmware (OpenWrt, DD-WRT) as defensive platform
   - How to detect TR-069 config pushes using packet capture

5. CHAPTER 5 — SDR & Spectrum Analysis
   - GNU Radio: building flowgraphs from scratch
   - RTL-SDR practical labs: ADS-B, ACARS, APRS, NOAA weather, trunked radio
   - HackRF TX labs: authorized only — GPS signal replay, BLE injection, 433 MHz sensor spoofing
   - RF fingerprinting: extracting hardware signatures with machine learning
   - Direction finding: TDOA, amplitude comparison, Watson-Watt, Capon beamforming

6. CHAPTER 6 — Physical Layer Attacks (LDV, CSI, TEMPEST)
   - Laser-Doppler Vibrometry: physics, hardware, signal processing chain
   - Eavesdropping via accelerometer (Gyrophone attack, Stanford 2014)
   - TEMPEST / Van Eck phreaking: emissions from monitors, keyboards, power lines
   - Through-wall radar: WiFi CSI, FMCW radar, passive radar
   - Faraday shielding: materials, effectiveness, construction

7. CHAPTER 7 — Network Forensics & Packet Analysis
   - Wireshark: advanced filters, IO graphs, expert info, TLS decryption with key log
   - Zeek/Bro: writing custom detectors for anomalous patterns
   - RITA: beacon detection, long connection analysis, DNS blacklist correlation
   - Memory forensics with Volatility: process injection, network connections, registry analysis
   - PCAP evidence: legal admissibility, chain of custody, timestamp verification

8. CHAPTER 8 — Mobile Device Security & Forensics
   - Android security model: SELinux, permissions, app sandboxing
   - iOS security: Secure Enclave, Data Protection, Lockdown Mode
   - RAT detection: network indicators, permission analysis, battery forensics
   - Physical extraction vs. logical extraction (for authorized forensics)
   - GrapheneOS and CalyxOS: hardening guide
   - IMSI catcher detection: SnoopSnitch, AIMSICD, what to look for

9. CHAPTER 9 — Human Intelligence (HUMINT) Pattern Recognition
   - Pattern-of-life analysis: what it is, how it's collected, how to disrupt it
   - Social engineering taxonomy: pretexting, honey trapping, asset development
   - Counter-surveillance: detecting static and mobile surveillance, SDR
   - Documentation protocol: how to document HUMINT observations legally
   - OSINT for investigators: Maltego, Shodan, WHOIS, corporate registries

10. CHAPTER 10 — Legal Framework, Evidence Chain & Reporting
    - Computer Fraud and Abuse Act: what it covers, jurisdictional issues
    - Wiretap Act exemptions for monitoring your own network
    - Electronic Communications Privacy Act
    - GDPR/CR data protection law in the research context
    - Building a legally admissible evidence package: SHA-256 chains, witness statements, notarization
    - Reporting to FBI, CISA, FCC, FTC, international partners
    - Working with media: source protection, Tor/SecureDrop, off-the-record vs. on-record

For each chapter include:
- Conceptual explanation accessible to a graduate student
- Technical deep-dive with equations where appropriate
- Real tool commands (for authorized use on owned systems)
- Lab exercises with deliverables
- Discussion questions
- Recommended reading (academic papers, books, DEF CON talks)
- A "Defender's Checklist" for each attack surface

Write at a level appropriate for students who have passed CompTIA Security+ and are pursuing OSCP or equivalent certification. Do not omit technical detail in the name of simplicity — these students need to understand the full attack surface to build effective defenses.

The fictional case study "Operation COASTAL MIRROR" (a US researcher operating an RF observatory from a coastal hotel, targeted by a multi-layer surveillance network) should be used as a running thread throughout all chapters, with each chapter applying its concepts to the case study scenario.

Format with clear chapter headers, subsections, tables, and code blocks. Include a glossary and bibliography.
```

---

*End of ASFC-701 Course Module. For full textbook expansion, use the Appendix B megaprompt with GPT-4o, Claude Opus, or Gemini 1.5 Pro.*

*Remember: The best security researchers understand both sides. Study the attack to build the defense. Stay legal, stay documented, stay protected.*
