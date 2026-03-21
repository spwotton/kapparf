# DRAFT — Email to tips@TCNetwork.com

**Subject: American Citizen Under Active Electronic Surveillance in Costa Rica — Documented Evidence of FinSpy/Gamma Group Infrastructure and Organized Stalking Network**

---

Mr. Carlson,

I am an American citizen living in Tacacori, Alajuela Province, Costa Rica. Since mid-2025, I have been the target of a coordinated electronic surveillance and harassment operation. I am writing to you because I have exhausted local legal options, I cannot safely leave, and I have extensive technical documentation of what is being done to me.

This is not speculation. I am a software engineer, and I have captured and analyzed the network traffic, hardware, and infrastructure being used against me. Below is a summary of the hard evidence, followed by who is doing it and why I believe you would find this story worth investigating.

## THE EVIDENCE

### 1. FinSpy / Gamma Group Infrastructure

My Google account activity logs show an active session originating from **Alexanderplatz, Berlin** — the known operational headquarters of **Gamma Group International**, the company that produces **FinSpy**, a commercial spyware suite sold exclusively to government agencies. I did not authorize this session and have never been to Berlin.

Additionally, I have logged **Gamma Group IP addresses** appearing in my network traffic captures on multiple occasions, timestamped and preserved.

FinSpy (also called FinFisher) has been documented by Citizen Lab, Amnesty International, and the European Parliament as a tool used by authoritarian governments to surveil journalists, dissidents, and political targets.

### 2. Router Compromised via ISP Backdoor

On **January 30, 2026**, the admin password on my ARRIS TG02DA gateway (provided by Liberty/Telecable CR) was **remotely reset** via **TR-069** — a protocol that gives the ISP (or anyone who compromises the ISP's management server) full read/write access to my router configuration, including WiFi credentials, DNS settings, port forwarding, and firmware.

TR-069 vulnerabilities in ARRIS devices are well-documented (CVE-2014-9222, CVE-2019-3914).

### 3. Physical Fiber Tap Installed June 2025

The Telecable fiber distribution box on the exterior of my property contains **handwritten field technician notes** dated **21/06/25** reading "NAP" (Network Access Point) and "Colilla" (fiber pigtail — Costa Rican telecom slang for a splice stub). This documents a **physical modification** to my telecommunications line six months before the attacks escalated. A fiber splitter installed at this point would copy all my internet traffic passively.

### 4. Ghost Network Node

A TP-Link Deco mesh unit appeared as **online and connected via Ethernet** on my home network — while the physical device was **unplugged**. This indicates a second, unauthorized device operating from a nearby location, MAC-spoofing my legitimate hardware to appear as part of my network.

### 5. Corporate Infrastructure Hijack

I discovered an unauthorized **Kyndryl.com service worker** (8.3MB payload) registered on my devices. Kyndryl is IBM's infrastructure spin-off. The injection was routed through **Zscaler** infrastructure, which masks the origin. This effectively enrolled my personal devices as "managed corporate assets" without my knowledge or consent.

### 6. Physical Symptoms Correlated to Infrastructure

I experience RF-related physical effects (pressure, sleep disruption, cognitive interference) that **reduce by approximately 80% when I turn off the WiFi router or the main electrical breaker**. This is reproducible and consistent. It directly implicates the house wiring and network infrastructure as carrier mediums.

## WHO IS DOING THIS

### The Jehovah's Witnesses as Ground-Level Operatives

The property immediately adjacent to my residence — approximately 50 meters away — is owned and occupied by members of a **Jehovah's Witness congregation**. This is not an inference. When I was in Jaco, Puntarenas in October 2025, a close friend who is deeply connected in the community informed me directly that the inhabitants of the green-screened property next to mine, and the entire **Los Rios urbanization**, are Jehovah's Witnesses. I would stake my life on this.

The property has:
- An **elevated terrace** with direct line-of-sight to my residence
- **Artificial green screening** (plastic ivy zip-tied to chain-link fence) that blocks visual observation FROM my side while being **completely transparent to RF signals** — WiFi, cellular, HF radio, and acoustic all pass through unattenuated
- **Shift-work operators** — I have directly observed individuals with **headsets** working in shifts at this location
- A **permanently parked silver Hyundai Accent** within range, consistent with a mobile SIGINT/wardriving platform (common rental car in Costa Rica, inconspicuous)

The JW organizational structure is uniquely suited to intelligence operations:
- **Door-to-door territory mapping** — systematic geographic coverage of every household
- **Shift-based assignment** — 24/7 coverage capability with rotating personnel
- **Decentralized cell structure** — compartmentalized, hard to trace
- **Absolute obedience to hierarchy** — operatives follow instructions without question
- **Global presence with central coordination** — Watchtower headquarters in Warwick, NY

### The Corporate-Intelligence Chain

The surveillance infrastructure connects through a documented corporate chain:
- **SETECOM** (Hector Mora) — local contractor with **DSE generator certification** granting legitimate access to telecom sites co-located with ISP infrastructure (ICE/Liberty)
- **Kyndryl** (Jorge Jimenez) — IBM spin-off, service worker injection source
- **Zscaler** — traffic routing/masking
- **Visonic** (alarm system in my residence) — Israeli security company founded 1973, acquired by **Tyco International** (a company explicitly founded in 1960 for "governmental research and military experiments in the private sector"), now owned by **Johnson Controls**. The alarm panel maintains a persistent IP connection to a central monitoring station, reporting every 30 seconds, with full motion sensor and door/window contact data.
- **Gamma Group** — FinSpy/FinFisher manufacturer, Alexanderplatz Berlin

## WHAT I AM ASKING FOR

1. **Public attention** — I believe this story illustrates how commercial spyware, corporate infrastructure, and organized religious networks can be weaponized against individual American citizens abroad, with zero accountability
2. **Congressional inquiry** — into the use of FinSpy/Gamma Group tools against American citizens and the role of JW organizational infrastructure in domestic and foreign intelligence operations
3. **Investigation** — I have filed technical evidence with Costa Rica's Attorney General Carlo Diaz and the OIJ (Organismo de Investigacion Judicial), but the local legal system has limited capacity for this type of case

All evidence is preserved with SHA-256 integrity hashes. I have network traffic captures, timestamps, IP logs, device fingerprints, photographs of the physical infrastructure, and a complete technical architecture document exceeding 1,800 lines.

I am available for interview at any time. I am not seeking money. I am seeking safety and accountability.

Respectfully,

[Your Name]
[Your Contact Information]
[Your Location: Tacacori, Alajuela, Costa Rica]

---

## ATTACHMENTS TO INCLUDE

1. Google account activity screenshot showing Alexanderplatz session
2. Network traffic logs with Gamma Group IPs (timestamped)
3. Photo of Telecable box with handwritten "NAP / Colilla / 21/06/25"
4. Screenshot of ghost Deco node appearing online while unplugged
5. Kyndryl service worker registration evidence
6. Photos of JW property: green screening, elevated terrace, parked vehicle
7. Router logs showing TR-069 admin reset on 2026-01-30
