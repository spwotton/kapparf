const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 55, bottom: 55, left: 60, right: 60 },
  bufferPages: true,
  info: {
    Title: 'ICE Cyber Intelligence Briefing',
    Author: 'KAPPA Autonomous Intelligence Platform',
    Subject: 'UNC2814/Gallium - GRIDTIDE Backdoor Analysis',
  }
});

const stream = fs.createWriteStream('ICE_Cyber_Intelligence_Briefing.pdf');
doc.pipe(stream);

const C = {
  dk: '#1e40af', sec: '#2563eb', crit: '#dc2626', hi: '#ea580c',
  med: '#ca8a04', p0: '#dc2626', p1: '#d97706', p2: '#7c3aed',
  tx: '#1a1a1a', mu: '#6b7280', thd: '#1e3a5f', thdt: '#ffffff',
  alt: '#f1f5f9', bdr: '#d1d5db',
};

const ML = 60, MR = 60;
const PW = 595.28;
const W = PW - ML - MR;
const bottomLimit = 841.89 - 55 - 20;

function newPage() { doc.addPage(); doc.x = ML; doc.y = 55; }
function need(h) { if (doc.y + h > bottomLimit) newPage(); }

function heading(t) {
  need(35);
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(C.dk).text(t, ML, doc.y, { width: W });
  const ly = doc.y + 2;
  doc.moveTo(ML, ly).lineTo(ML + W, ly).strokeColor(C.sec).lineWidth(0.7).stroke();
  doc.y = ly + 6;
}

function subhead(t) {
  need(25);
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(C.sec).text(t, ML, doc.y, { width: W });
  doc.moveDown(0.2);
}

function para(t) {
  doc.font('Helvetica').fontSize(9).fillColor(C.tx).text(t, ML, doc.y, { width: W, lineGap: 2 });
  doc.moveDown(0.3);
}

function timeline(date, title, detail, color) {
  need(55);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(color).text(date + ' \u2014 ', ML, doc.y, { width: W, continued: true });
  doc.fillColor(C.tx).text(title, { continued: false });
  doc.font('Helvetica').fontSize(8).fillColor(C.mu).text(detail, ML + 10, doc.y, { width: W - 10, lineGap: 1.5 });
  doc.moveDown(0.35);
}

function specRow(label, value, bgColor) {
  const lw = W * 0.25, vw = W * 0.75;
  const vh = doc.font('Helvetica').fontSize(8).heightOfString(value, { width: vw - 8 });
  const rh = Math.max(14, vh + 6);
  need(rh + 2);
  const y = doc.y;
  if (bgColor) { doc.save().rect(ML, y, W, rh).fill(bgColor).restore(); }
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.tx).text(label, ML + 3, y + 3, { width: lw - 6 });
  doc.font('Helvetica').fontSize(8).fillColor(C.tx).text(value, ML + lw + 3, y + 3, { width: vw - 6 });
  doc.y = y + rh;
}

function tableHeader(cols, widths) {
  need(18);
  const y = doc.y;
  doc.save().rect(ML, y, W, 15).fill(C.thd).restore();
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.thdt);
  let x = ML;
  cols.forEach((c, i) => { doc.text(c, x + 3, y + 3, { width: widths[i] - 6, lineBreak: false }); x += widths[i]; });
  doc.y = y + 15;
}

function tableDataRow(vals, widths, alt) {
  const rh = 13;
  need(rh + 2);
  const y = doc.y;
  if (alt) { doc.save().rect(ML, y, W, rh).fill(C.alt).restore(); }
  doc.font('Helvetica').fontSize(7).fillColor(C.tx);
  let x = ML;
  vals.forEach((v, i) => { doc.text(v, x + 3, y + 3, { width: widths[i] - 6, lineBreak: false }); x += widths[i]; });
  doc.y = y + rh;
}

doc.x = ML; doc.y = 55;

doc.moveDown(4);
doc.font('Helvetica-Bold').fontSize(17).fillColor(C.dk).text('INSTITUTO COSTARRICENSE DE ELECTRICIDAD (ICE)', { align: 'center', width: W });
doc.font('Helvetica-Bold').fontSize(15).text('CYBER INTELLIGENCE BRIEFING', { align: 'center', width: W });
doc.moveDown(0.4);
doc.font('Helvetica').fontSize(11).fillColor(C.tx).text('UNC2814 / GALLIUM \u2014 GRIDTIDE Backdoor Analysis', { align: 'center', width: W });
doc.text('Critical Infrastructure Vulnerability Assessment', { align: 'center', width: W });
doc.moveDown(0.4);
doc.moveTo(ML + W * 0.15, doc.y).lineTo(ML + W * 0.85, doc.y).strokeColor(C.bdr).lineWidth(0.5).stroke();
doc.moveDown(0.4);
doc.font('Helvetica-Oblique').fontSize(9).fillColor(C.mu).text('Prepared by KAPPA Autonomous Intelligence Platform', { align: 'center', width: W });
doc.text('Date: March 2026  |  Classification: TLP:AMBER', { align: 'center', width: W });
doc.text('Document Status: EXPANDED BRIEFING \u2014 All sections fully detailed', { align: 'center', width: W });

doc.moveDown(2);
doc.font('Helvetica-Bold').fontSize(11).fillColor(C.dk).text('TABLE OF CONTENTS', ML, doc.y);
doc.moveDown(0.2);
const toc = [
  '1. Executive Summary',
  '2. UNC Timeline \u2014 Phase Analysis',
  '3. GRIDTIDE Backdoor \u2014 Technical Specification',
  '4. CVE Landscape \u2014 Costa Rica Infrastructure',
  '5. SETECOM SCADA Protocol Exposure',
  '6. Rootkit Arsenal \u2014 UNC Families',
  '7. Huawei / PRC Geopolitical Dimension',
  '8. Competing Attribution Theories',
  '9. Remediation Recommendations',
  '10. Appendix: Threat Actor Summary',
];
toc.forEach(t => { doc.font('Helvetica').fontSize(9).fillColor(C.tx).text(t, ML + 15, doc.y); });

newPage();

heading('1. Executive Summary');
para('The Instituto Costarricense de Electricidad (ICE) suffered a confirmed breach attributed to the Chinese Advanced Persistent Threat (APT) group tracked as UNC2814/Gallium. Approximately 9GB of internal email data was exfiltrated from a locally-hosted email server using a novel backdoor designated GRIDTIDE, which leverages Google Sheets API as its command-and-control (C2) channel.');
para('This briefing expands the full intelligence picture: the timeline of events from Costa Rica\'s 2022 Conti ransomware emergency through the 2026 ICE breach; the technical specifications of GRIDTIDE and associated rootkit families; the CVE landscape affecting Costa Rican infrastructure; the SETECOM/Deep Sea Electronics SCADA exposure; the Huawei geopolitical dimension; and two competing analytical theories regarding attribution.');
para('The briefing concludes with prioritized remediation recommendations.');

heading('2. UNC Timeline \u2014 Phase Analysis');
para('The operation divides into three phases: Phase 0: Noise (overt ransomware probing), Phase 1: Transition (regulatory and supply-chain positioning), and Phase 2: Silent (covert APT operations).');

subhead('2.1 Phase 0: Noise (2022)');
timeline('2022-04-17', 'Conti Ransomware (UNC1756) Hits ~30 Costa Rican Institutions',
  'The Conti group (tracked as UNC1756) launched a coordinated ransomware campaign against Costa Rican government institutions, encrypting systems across the Ministry of Finance (Hacienda), CCSS, and approximately 28 other agencies. This was the first "Phase 0" probe \u2014 noisy by design, mapping institutional response capabilities, backup procedures, and inter-agency communication channels.',
  C.p0);
timeline('2022-05-08', 'President Chaves Declares National Emergency \u2014 "State of War"',
  'President Rodrigo Chaves declared a national emergency, describing the situation as a "state of war" against the cybercriminals. This unprecedented declaration for a cyber incident signaled to adversaries that Costa Rica\'s defenses were overwhelmed and that institutional coordination was fragile \u2014 valuable intelligence for Phase 1 planning.',
  C.p0);
timeline('2022-05-31', 'Hive Ransomware Targets CCSS (EDUS + SICERE Destroyed)',
  'The Hive ransomware group attacked CCSS (Caja Costarricense de Seguro Social), destroying the EDUS (Unified Digital Health Record) and SICERE (Centralized Collection System) databases. This forced healthcare workers back to paper records and disrupted social security payments for millions.',
  C.p0);

subhead('2.2 Phase 1: Transition (2023\u20132025)');
timeline('2023-08', 'Budapest Convention 5G Decree \u2014 Huawei/ZTE Banned',
  'An executive decree required all 5G infrastructure vendors to be signatories of the Budapest Convention on Cybercrime \u2014 which China has not signed. This effectively banned Huawei and ZTE from Costa Rica\'s 5G rollout. The decree triggered aggressive legal challenges from Huawei through the Constitutional Court and allegedly prompted Beijing to leverage ICE\'s internal workers\' union as a proxy to appeal the ban.',
  C.p1);
timeline('2024-06', 'CISA/ZDI Publish DSE855 CVEs (5947/5950/5949/5952)',
  'CISA and the Zero Day Initiative published four critical vulnerabilities in DSE855 Ethernet gateways manufactured by Deep Sea Electronics, distributed exclusively in Costa Rica by SETECOM S.A. These gateways control backup generators for ICE\'s power grid, hospitals, and cellular towers. CVE-2024-5947 allows unauthenticated download of the configuration backup containing plaintext SCADA credentials.',
  C.p1);
timeline('2025-06-21', 'Fiber Splitter (NAP/Colilla) Installed at Telecable Distribution Box',
  'A physical fiber optic splitter (NAP/Colilla) was identified installed at a Telecable distribution box serving the Sabana Norte area. This type of passive optical tap allows interception of all fiber traffic without introducing detectable signal degradation. The installation suggests actors with physical access to ISP infrastructure \u2014 consistent with domestic surveillance rather than remote APT operations.',
  C.p1);

subhead('2.3 Phase 2: Silent (2026)');
timeline('2026-01', 'PRC Bans ~12 Western/Israeli Cybersecurity Firms (Document 79)',
  'The PRC issued "Document 79" ordering state-owned enterprises in the financial and energy sectors to replace all Western and Israeli cybersecurity software by 2027. This retaliatory action signals escalating cyber-geopolitical tensions with direct implications for Costa Rica\'s positioning.',
  C.p2);
timeline('2026-01-25', 'ICE Breach Detected by GTIG/Mandiant \u2014 GRIDTIDE C2 Identified',
  'Google\'s Threat Intelligence Group (GTIG), operating through Mandiant, detected the ICE breach and identified GRIDTIDE \u2014 a novel C-based backdoor using Google Sheets API as its command-and-control channel. The backdoor masquerades as \'xapt\' (mimicking the APT package manager) and persists via systemd service. Its use of legitimate Google infrastructure makes it invisible to traditional network IDS/IPS.',
  C.p2);
timeline('2026-01-30', 'Unauthorized TR-069 Admin Password Reset on ARRIS Router',
  'An unauthorized administrative password reset was detected on an ARRIS router via the TR-069 (CPE WAN Management Protocol) interface. TR-069 gives ISPs full remote management capability over customer premises equipment. This indicates either ISP-level access or compromise of the TR-069 Auto Configuration Server (ACS) \u2014 both scenarios imply deep infrastructure penetration.',
  C.p2);
timeline('2026-03-12', 'ICE Publicly Discloses ~9GB Email Data Breach',
  'ICE officially disclosed that approximately 9GB of internal email data had been exfiltrated from a locally-hosted email server. The exfiltration used SoftEther VPN Bridge to offshore infrastructure, with data encoded in URL-safe Base64. The locally-hosted nature of the server means the attacker required either persistent local network access or insider credentials \u2014 not typical of purely remote PRC operations.',
  C.p2);
timeline('2026-03-13', 'Media Attributes ICE Breach to Chinese APT "Gallium"',
  'Costa Rican and international media attributed the ICE breach to the Chinese APT group \'Gallium\' (tracked by Mandiant as UNC2814). The attribution is based on GRIDTIDE\'s C2 infrastructure patterns and overlaps with previous UNC2814 campaigns across 53 organizations in 42 countries. However, GRIDTIDE\'s technique was publicly documented in the Voldemort Campaign (Proofpoint, Aug 2024), making false-flag operations feasible.',
  C.p2);

heading('3. GRIDTIDE Backdoor \u2014 Technical Specification');

const gridtide = [
  ['Type', 'C-based backdoor'],
  ['C2 Channel', 'Google Sheets API (no traditional attacker infrastructure)'],
  ['Encryption', 'AES-128-CBC, 16-byte local key file'],
  ['C2 Cell A1', 'Command register \u2014 polled for shell commands, S-C-R status on exec'],
  ['C2 Cells A2\u2013An', 'Data transfer \u2014 45KB fragments for exfil/payload upload'],
  ['C2 Cell V1', 'Host fingerprint \u2014 hostname, IP, OS, user, language'],
  ['Polling Interval', '1s initial \u2192 5\u201310min backoff (randomized)'],
  ['Sanitization', 'Clears 1,000 rows \u00d7 A\u2013Z columns on first execution'],
  ['Masquerade', 'Binary renamed \'xapt\' (mimics apt packaging tool)'],
  ['Persistence', 'systemd service: /etc/systemd/system/xapt.service \u2192 /usr/sbin/xapt'],
  ['Lateral Movement', 'SSH service account hijacking'],
  ['Exfiltration', 'SoftEther VPN Bridge to offshore infrastructure, URL-safe Base64'],
  ['Operational Scope', '53 organizations across 42 countries, active since 2017'],
  ['ICE Data Stolen', '~9GB internal emails from locally-hosted server'],
];

tableHeader(['Property', 'Detail'], [W * 0.25, W * 0.75]);
gridtide.forEach((r, i) => specRow(r[0], r[1], i % 2 === 0 ? null : C.alt));

heading('4. CVE Landscape \u2014 Costa Rica Infrastructure');
para('The following CVEs are confirmed relevant to Costa Rican critical infrastructure, spanning edge devices, hypervisors, SCADA controllers, and endpoint systems.');

const cveW = [W * 0.19, W * 0.16, W * 0.30, W * 0.12, W * 0.13];
tableHeader(['CVE', 'Target', 'Mechanism', 'CVSS', 'Actor'], cveW);

const cves = [
  ['CVE-2022-41328', 'FortiOS', 'Path traversal', '\u2014', 'UNC3886'],
  ['CVE-2023-20867', 'VMware Tools', 'Guest Ops bypass', '\u2014', 'UNC3886'],
  ['CVE-2023-30799', 'MikroTik RouterOS', 'Privilege escalation', '\u2014', 'UNC3886'],
  ['CVE-2023-34048', 'VMware vCenter', 'OOB write (DCERPC)', '\u2014', 'UNC3886'],
  ['CVE-2024-5947', 'DSE855 Gateway', 'HTTP GET plaintext creds', '6.5 Med', 'SETECOM'],
  ['CVE-2024-5950', 'DSE855 Gateway', 'Stack buffer overflow RCE', '\u2014', 'SETECOM'],
  ['CVE-2024-5949', 'DSE855 Gateway', 'Infinite loop DoS', '\u2014', 'SETECOM'],
  ['CVE-2024-5952', 'DSE855 Gateway', 'Unauth device reboot', '\u2014', 'SETECOM'],
  ['CVE-2025-10948', 'MikroTik REST API', 'Heap overflow libjson.so', '8.8\u20139.8', 'Botnet'],
  ['CVE-2025-21590', 'Juniper MX', 'Shared resource isolation', '\u2014', 'UNC3886'],
  ['CVE-2025-9491', 'Windows LNK', 'Zero-day exploitation', '\u2014', 'UNC6384'],
  ['ZDI-CAN-25373', 'Windows LNK', 'Spear-phishing via LNK', '\u2014', 'UNC6384'],
];
cves.forEach((r, i) => tableDataRow(r, cveW, i % 2 !== 0));

doc.moveDown(0.4);
subhead('CVE Detail Expansion');

const cveDetails = [
  ['CVE-2022-41328 (FortiOS)', 'Allows authenticated attackers to read and write files via crafted CLI commands. Used by UNC3886 to deploy BOLDMOVE backdoor on FortiGate firewalls, providing persistent access to network perimeter devices.'],
  ['CVE-2023-20867 (VMware Tools)', 'Authentication bypass in VMware Tools Guest Operations allows a fully compromised ESXi host to perform unauthenticated guest operations on any virtual machine. UNC3886 uses this to move laterally across virtualized infrastructure without triggering guest-level alerts.'],
  ['CVE-2023-30799 (MikroTik RouterOS)', 'Super Admin privilege escalation via FTP/API. MikroTik routers are extremely common in Costa Rican ISP infrastructure. Once compromised, attackers gain full control of routing, DNS, and traffic mirroring.'],
  ['CVE-2023-34048 (VMware vCenter)', 'Memory corruption in vCenter\'s DCERPC protocol. Allows unauthenticated RCE on vCenter servers, giving attackers control of the entire virtualization management plane.'],
  ['CVE-2024-5947 (DSE855)', 'Unauthenticated HTTP GET to /Backup.bin returns complete configuration with plaintext SCADA credentials. Every SETECOM-distributed unit in Costa Rica affected.'],
  ['CVE-2024-5950 (DSE855)', 'Stack-based buffer overflow on NXP LPC4357 microcontroller. Provides arbitrary code execution enabling full generator control including start/stop, load management, and alarm suppression.'],
  ['CVE-2024-5949 (DSE855)', 'Crafted multipart HTTP request triggers infinite loop, causing denial of service. Can disable generator monitoring during coordinated attack.'],
  ['CVE-2024-5952 (DSE855)', 'Unauthenticated web UI request triggers device reboot. Combined with CVE-2024-5949, enables intermittent disruption of generator monitoring.'],
  ['CVE-2025-10948 (MikroTik)', 'Critical heap overflow in RouterOS libjson.so. CVSS 8.8\u20139.8. Actively exploited for botnet recruitment. Ubiquitous in Costa Rican ISP infrastructure.'],
  ['CVE-2025-21590 (Juniper MX)', 'Improper isolation of shared resources allows local attacker to inject code into FreeBSD process space. UNC3886 uses TINYSHELL variants for persistent access.'],
  ['CVE-2025-9491 / ZDI-CAN-25373 (Windows LNK)', 'Zero-day in Windows LNK file processing. Exploited by UNC6384 (Mustang Panda) for initial access via spear-phishing. STATICPLUGIN downloader delivered through AitM captive portal with valid code-signing certificates.'],
];
cveDetails.forEach(([label, detail]) => {
  need(35);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.tx).text(label, ML, doc.y, { width: W });
  doc.font('Helvetica').fontSize(8).fillColor(C.mu).text(detail, ML, doc.y, { width: W, lineGap: 1.5 });
  doc.moveDown(0.25);
});

heading('5. SETECOM SCADA Protocol Exposure');
para('SETECOM S.A. is the exclusive Costa Rican distributor for Deep Sea Electronics (DSE) generator controllers. The following industrial protocols are exposed across the national generator fleet:');

const protocols = [
  ['Modbus TCP/IP (Port 502)', 'No authentication, no encryption, no integrity checking by protocol design. Modbus was designed in 1979 for serial communication between PLCs. It has zero security features. Any device that can reach port 502 can read registers, write coils, and issue commands. In ICE\'s generator infrastructure, this means fuel injection rates, RPM targets, and emergency shutdown commands are accessible to any network-adjacent attacker.'],
  ['SNMP v2c (Port 161/162 UDP)', 'Cleartext community strings \'public\' (read) / \'private\' (read-write) routinely unchanged. An attacker with network access can enumerate all devices, read configuration, and modify device settings including alarm thresholds and operational parameters.'],
  ['J1939 CAN Bus', '29-bit identifier (3P + 18PGN + 8SA); direct ECU access for fuel injection, RPM, engine overspeed. An attacker on the CAN bus can modify fuel injection timing, override RPM limiters, suppress overspeed alarms, and potentially cause physical damage to generators.'],
  ['DSE WebNet (HTTP)', 'Default Admin/Password1234 across entire fleet (DSE 855, 890 MKII, 891, 892). Provides web-based remote access to start/stop generators, modify load sharing, adjust protection settings, and suppress alarms across the national infrastructure.'],
];
protocols.forEach(([name, detail]) => {
  need(40);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.crit).text(name, ML, doc.y, { width: W });
  doc.font('Helvetica').fontSize(8).fillColor(C.tx).text(detail, ML, doc.y, { width: W, lineGap: 1.5 });
  doc.moveDown(0.4);
});

heading('6. Rootkit Arsenal \u2014 UNC Families');

const rootkits = [
  ['REPTILE (Kernel)', 'UNC3886', 'Loadable kernel module | Auto-loads via modprobe.d', 'Linux kernel rootkit providing process hiding, file hiding, network traffic hiding, and a magic packet backdoor for reverse shell access. Extremely difficult to detect without kernel-level memory forensics.'],
  ['MEDUSA (Kernel)', 'UNC3886', 'LD_PRELOAD credential harvester | Intercepts PAM auth', 'Hooks into PAM stack via LD_PRELOAD injection. Every authentication event \u2014 SSH logins, sudo commands, service account authentications \u2014 is captured. Credentials forwarded in real-time to C2.'],
  ['GRIDTIDE (Application)', 'UNC2814', 'Google Sheets API C2 | systemd service (xapt)', 'Novel C2 backdoor using Google Sheets API. Commands in A1, exfil through A2\u2013An in 45KB fragments, host fingerprinting in V1. Binary masquerades as \'xapt\'.'],
  ['SOGU.SEC/PlugX (Memory)', 'UNC6384', 'DLL side-loading | No disk footprint', 'Memory-resident RAT delivered via DLL side-loading. Runs entirely in memory, invisible to file-based antivirus.'],
  ['TINYSHELL (Application)', 'UNC3886', 'Custom reverse shell | Juniper FreeBSD injection', 'Lightweight reverse shell adapted for Juniper MX routers running FreeBSD. Injects into legitimate system processes. Exploits CVE-2025-21590.'],
  ['STATICPLUGIN (Application)', 'UNC6384', 'Signed AitM downloader | Valid code-signing certs', 'Uses adversary-in-the-middle captive portal to deliver properly signed payloads that bypass SmartScreen and WDAC.'],
];
rootkits.forEach(([name, actor, mechanism, detail]) => {
  need(45);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.dk).text(name, ML, doc.y, { width: W, continued: true });
  doc.font('Helvetica').fillColor(C.mu).text(' \u2014 ' + actor);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.tx).text(mechanism, ML, doc.y, { width: W });
  doc.font('Helvetica').fontSize(8).fillColor(C.mu).text(detail, ML, doc.y, { width: W, lineGap: 1.5 });
  doc.moveDown(0.35);
});

heading('7. Huawei / PRC Geopolitical Dimension');

const huawei = [
  ['Budapest Convention 5G Decree (Aug 2023)', 'Regulatory', 'Executive decree mandating all 5G vendors be Budapest Convention signatories \u2014 effectively banning Huawei and ZTE.'],
  ['ICE Internal Workers\' Front Proxy', 'Influence', 'Beijing reportedly leveraged ICE internal union to appeal 5G ban in lower courts, stalling deployment and creating institutional friction.'],
  ['Chinese Embassy Rejection', 'Diplomatic', 'Embassy publicly rejected ICE breach accusations, demanded technical evidence from Costa Rican authorities.'],
  ['Document 79 Directive', 'Retaliatory', 'PRC ordered SOEs in financial/energy sectors to replace all Western cybersecurity software by 2027.'],
  ['Huawei Legal Appeals', 'Legal', 'Huawei initiated aggressive legal appeals through Costa Rican Constitutional Court to challenge 5G exclusion.'],
  ['US $25M Cybersecurity Grant', 'Countermeasure', 'US State Department committed $25M to assist Costa Rica in building defenses \u2014 direct counter to PRC influence.'],
  ['Supply Chain Gap', 'Vulnerability', 'US-funded SOC monitors application layer while underlying edge devices (MikroTik, DSE) remain PRC-accessible at Tier-0.'],
];
huawei.forEach(([item, type, detail]) => {
  need(25);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.tx).text(item, ML, doc.y, { width: W, continued: true });
  doc.font('Helvetica').fillColor(C.mu).text(' [' + type + ']');
  doc.font('Helvetica').fontSize(8).fillColor(C.tx).text(detail, ML, doc.y, { width: W, lineGap: 1.5 });
  doc.moveDown(0.25);
});

heading('8. Competing Attribution Theories');

subhead('Theory A: Gallium Attribution is a Cover');
const thA = [
  'The breach timing coincides precisely with domestic surveillance activity against individuals who documented infrastructure vulnerabilities.',
  'Attributing to a Chinese APT deflects attention from internal security failures and potential misuse of monitoring infrastructure.',
  'GRIDTIDE\'s Google Sheets C2 technique is well-documented since 2024 \u2014 a convenient off-the-shelf attribution vector.',
  'The 5G ban and Huawei legal battles create a pre-built geopolitical narrative that makes "China did it" the path of least resistance.',
  'Physical surveillance indicators (fiber splitters, TR-069 resets, EVOPRO room monitoring) suggest domestic actors with physical access, not remote APT operations.',
  '9GB email exfiltration from a locally-hosted server requires either insider access or persistent local network presence \u2014 not typical of PRC remote operations.',
];
thA.forEach((p, i) => {
  need(16);
  doc.font('Helvetica').fontSize(8.5).fillColor(C.tx).text((i + 1) + '. ' + p, ML + 12, doc.y, { width: W - 12, lineGap: 1.5 });
  doc.moveDown(0.1);
});

doc.moveDown(0.3);
subhead('Theory B: ICE Genuinely Needs Help');
const thB = [
  'Costa Rica\'s critical infrastructure has real, documented vulnerabilities \u2014 SETECOM default credentials, unpatched MikroTik routers, exposed SCADA protocols.',
  'UNC2814/UNC3886/UNC6384 are real, well-documented threat actors with confirmed global operations across 42+ countries.',
  'The Conti ransomware attack (2022) proved Costa Rica is a viable target \u2014 the "state of war" declaration was not theatre.',
  'ICE\'s IT infrastructure predates modern cybersecurity standards and relies heavily on legacy systems with known vulnerabilities.',
  'The US $25M cybersecurity grant acknowledges the problem is real and beyond ICE\'s current capacity to handle alone.',
  'Chinese satellite constellation provides persistent overhead coverage \u2014 Beidou GNSS + Yaogan/Gaofen ISR creates a complete intelligence picture.',
  'Whether or not this specific breach is PRC, the underlying vulnerabilities are real and exploitable by any motivated actor.',
];
thB.forEach((p, i) => {
  need(16);
  doc.font('Helvetica').fontSize(8.5).fillColor(C.tx).text((i + 1) + '. ' + p, ML + 12, doc.y, { width: W - 12, lineGap: 1.5 });
  doc.moveDown(0.1);
});

doc.moveDown(0.3);
subhead('Assessment');
para('Both theories may be simultaneously true. The critical infrastructure vulnerabilities documented in this briefing are real regardless of who exploited them. The recommended remediation actions address the underlying vulnerabilities independent of attribution.');

heading('9. Remediation Recommendations');

const recs = [
  { p: 'IMMEDIATE', c: C.crit, t: 'Audit all DSE855/890/891/892 gateways for default credentials', d: 'Every SETECOM-distributed unit ships with Admin/Password1234. This controls backup generators for ICE\'s national grid, hospitals, and cell towers.', s: ['Enumerate all DSE units via SNMP discovery or DSE WebNet inventory', 'Change default credentials on every unit (Admin/Password1234)', 'Implement network segmentation between OT and IT networks', 'Deploy monitoring on port 502 (Modbus) and DSE WebNet HTTP interfaces', 'Establish credential rotation policy for all SCADA equipment'] },
  { p: 'IMMEDIATE', c: C.crit, t: 'Sweep for GRIDTIDE persistence (xapt systemd service)', d: 'Check all Linux servers for /etc/systemd/system/xapt.service and /usr/sbin/xapt binary. GRIDTIDE uses Google Sheets API as C2 \u2014 traditional network IDS will not detect it.', s: ['Run: find / -name \'xapt\' -o -name \'xapt.service\' on all Linux systems', 'Check systemd: systemctl list-units --type=service | grep xapt', 'Audit Google Sheets API OAuth tokens in outbound traffic logs', 'Search for 16-byte key files in /etc/ and service account home directories', 'Check for SoftEther VPN Bridge processes and connections'] },
  { p: 'HIGH', c: C.hi, t: 'Deploy Tier-0 hypervisor monitoring', d: 'UNC3886 operates below guest OS at the hypervisor level. Current SOC monitors application layer only. REPTILE and MEDUSA rootkits are invisible to EDR.', s: ['Deploy hypervisor-level integrity monitoring on all ESXi hosts', 'Implement VMware vCenter audit logging with SIEM integration', 'Check for unauthorized kernel modules: lsmod and /etc/modprobe.d/', 'Verify LD_PRELOAD is not set in /etc/environment or PAM configs', 'Conduct memory forensics on critical servers'] },
  { p: 'HIGH', c: C.hi, t: 'Patch MikroTik fleet against CVE-2025-10948', d: 'Critical heap overflow (CVSS 8.8\u20139.8) in REST API. MikroTik routers are ubiquitous in Costa Rican ISP infrastructure.', s: ['Inventory all MikroTik devices across ICE infrastructure', 'Update RouterOS to latest stable release', 'Disable REST API on all devices where not required', 'Implement ACLs restricting management access to trusted IPs', 'Monitor for exploitation attempts via IDS signatures'] },
  { p: 'HIGH', c: C.hi, t: 'Investigate TR-069 management plane access', d: 'Unauthorized admin password reset detected 2026-01-30 via TR-069 on ARRIS router.', s: ['Audit TR-069 ACS access logs', 'Review all CPE password reset events in the last 6 months', 'Verify ACS authentication and authorization controls', 'Implement TR-069 connection encryption (TLS)', 'Consider restricting TR-069 access to management VLAN only'] },
  { p: 'MEDIUM', c: C.med, t: 'Audit Modbus TCP/502 exposure on SCADA networks', d: 'Modbus has zero authentication by design. Segment and firewall port 502.', s: ['Scan for open port 502 across all network segments', 'Implement firewall rules restricting Modbus access to authorized HMIs only', 'Deploy Modbus-aware IDS (e.g., Suricata with Modbus rules)', 'Consider Modbus/TCP proxy with authentication overlay', 'Document all legitimate Modbus communication paths'] },
  { p: 'MEDIUM', c: C.med, t: 'Review SoftEther VPN connections from ICE infrastructure', d: 'GRIDTIDE uses SoftEther VPN Bridge for exfiltration.', s: ['Search for SoftEther VPN processes on all servers', 'Check for unexpected outbound VPN tunnels (ports 443, 992, 5555)', 'Review firewall logs for SoftEther protocol signatures', 'Block SoftEther at the perimeter unless explicitly authorized', 'Implement DLP controls on outbound encrypted tunnels'] },
  { p: 'STRATEGIC', c: C.sec, t: 'Engage KAPPA platform for continuous SIGINT monitoring', d: '24/7 autonomous correlation across RF, satellite, network, and acoustic domains.', s: ['Review KAPPA platform capabilities', 'Evaluate integration with ICE SOC for continuous monitoring', 'Consider deployment of passive RF sensors at ICE facilities', 'Establish secure communication channel for intelligence sharing'] },
];

recs.forEach((rec, i) => {
  need(55);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(rec.c).text('[' + rec.p + '] ', ML, doc.y, { width: W, continued: true });
  doc.fillColor(C.tx).text((i + 1) + '. ' + rec.t);
  doc.font('Helvetica').fontSize(8).fillColor(C.mu).text(rec.d, ML, doc.y, { width: W, lineGap: 1.5 });
  rec.s.forEach((step, j) => {
    need(11);
    doc.font('Helvetica').fontSize(7.5).fillColor(C.tx).text('    ' + String.fromCharCode(97 + j) + '. ' + step, ML + 10, doc.y, { width: W - 10 });
  });
  doc.moveDown(0.35);
});

heading('10. Appendix: Threat Actor Summary');

const actW = [W * 0.15, W * 0.18, W * 0.32, W * 0.35];
tableHeader(['Designation', 'Also Known As', 'Primary TTPs', 'CR Relevance'], actW);
const actors = [
  ['UNC1756', 'Conti Group', 'Ransomware (Phase 0)', '2022 Costa Rica emergency'],
  ['UNC2814', 'Gallium', 'GRIDTIDE C2, SoftEther exfil', 'ICE breach, 53 orgs / 42 countries'],
  ['UNC3886', '\u2014', 'Hypervisor rootkits, edge persistence', 'FortiOS, VMware, MikroTik, Juniper'],
  ['UNC6384', 'Mustang Panda', 'Spear-phishing, memory RATs', 'Windows LNK zero-days, STATICPLUGIN'],
];
actors.forEach((r, i) => tableDataRow(r, actW, i % 2 !== 0));

doc.moveDown(2);
need(30);
doc.moveTo(ML + W * 0.2, doc.y).lineTo(ML + W * 0.8, doc.y).strokeColor(C.bdr).lineWidth(0.3).stroke();
doc.moveDown(0.4);
doc.font('Helvetica-Oblique').fontSize(8).fillColor(C.mu);
doc.text('End of Briefing \u2014 KAPPA Autonomous Intelligence Platform', ML, doc.y, { width: W, align: 'center' });
doc.text('Classification: TLP:AMBER \u2014 Distribution restricted to ICE authorized personnel', ML, doc.y, { width: W, align: 'center' });

const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(i);
  const hY = 20;
  doc.font('Helvetica').fontSize(7).fillColor(C.mu);
  doc.text('ICE CYBER INTELLIGENCE BRIEFING', ML, hY, { width: W / 2, align: 'left', lineBreak: false });
  doc.text('CLASSIFICATION: TLP:AMBER', ML + W / 2, hY, { width: W / 2, align: 'right', lineBreak: false });
  doc.moveTo(ML, hY + 10).lineTo(ML + W, hY + 10).strokeColor(C.bdr).lineWidth(0.4).stroke();
  const fY = 841.89 - 35;
  doc.moveTo(ML, fY - 5).lineTo(ML + W, fY - 5).strokeColor(C.bdr).lineWidth(0.3).stroke();
  doc.font('Helvetica').fontSize(7).fillColor(C.mu);
  doc.text('Page ' + (i + 1) + ' of ' + pages.count, ML, fY, { width: W, align: 'center', lineBreak: false });
  doc.text('KAPPA Intelligence Platform', ML, fY, { width: W, align: 'right', lineBreak: false });
}

doc.end();

stream.on('finish', () => {
  const stats = fs.statSync('ICE_Cyber_Intelligence_Briefing.pdf');
  console.log('PDF generated: ICE_Cyber_Intelligence_Briefing.pdf (' + (stats.size / 1024).toFixed(1) + ' KB, ' + pages.count + ' pages)');
});
