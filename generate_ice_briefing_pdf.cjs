const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 72, bottom: 72, left: 60, right: 60 },
  info: {
    Title: 'ICE Cyber Intelligence Briefing',
    Author: 'KAPPA Autonomous Intelligence Platform',
    Subject: 'UNC2814/Gallium - GRIDTIDE Backdoor Analysis',
  }
});

const stream = fs.createWriteStream('ICE_Cyber_Intelligence_Briefing.pdf');
doc.pipe(stream);

const COLORS = {
  darkBlue: '#1e40af',
  sectionBlue: '#2563eb',
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  phase0: '#dc2626',
  phase1: '#d97706',
  phase2: '#7c3aed',
  text: '#1a1a1a',
  muted: '#6b7280',
  bg: '#f8fafc',
  tableBorder: '#d1d5db',
  tableHeader: '#1e3a5f',
  tableHeaderText: '#ffffff',
  tableAlt: '#f1f5f9',
};

const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;

let pageNum = 0;
let addingPage = false;

function addHeaderFooter() {
  const savedX = doc.x;
  const savedY = doc.y;

  const hY = 20;
  doc.fontSize(7).fillColor(COLORS.muted).font('Helvetica');
  doc.text('ICE CYBER INTELLIGENCE BRIEFING', doc.page.margins.left, hY, { width: W / 2, align: 'left', lineBreak: false });
  doc.text('CLASSIFICATION: TLP:AMBER', doc.page.margins.left + W / 2, hY, { width: W / 2, align: 'right', lineBreak: false });
  doc.moveTo(doc.page.margins.left, hY + 12).lineTo(doc.page.margins.left + W, hY + 12).strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();

  pageNum++;
  const fY = doc.page.height - 40;
  doc.moveTo(doc.page.margins.left, fY - 5).lineTo(doc.page.margins.left + W, fY - 5).strokeColor(COLORS.tableBorder).lineWidth(0.3).stroke();
  doc.fontSize(7).fillColor(COLORS.muted);
  doc.text(String(pageNum), doc.page.margins.left, fY, { width: W, align: 'center', lineBreak: false });
  doc.text('KAPPA Intelligence Platform', doc.page.margins.left, fY, { width: W, align: 'right', lineBreak: false });

  doc.x = savedX;
  doc.y = savedY;
}

doc.on('pageAdded', () => {
  if (addingPage) return;
  addingPage = true;
  addHeaderFooter();
  addingPage = false;
});

function checkSpace(needed) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom - 20) {
    doc.addPage();
  }
}

function sectionTitle(text) {
  checkSpace(40);
  doc.moveDown(0.8);
  doc.fontSize(14).fillColor(COLORS.darkBlue).font('Helvetica-Bold').text(text);
  doc.moveTo(doc.page.margins.left, doc.y + 2).lineTo(doc.page.margins.left + W, doc.y + 2).strokeColor(COLORS.sectionBlue).lineWidth(0.8).stroke();
  doc.moveDown(0.5);
}

function subSectionTitle(text) {
  checkSpace(30);
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor(COLORS.sectionBlue).font('Helvetica-Bold').text(text);
  doc.moveDown(0.3);
}

function bodyText(text) {
  doc.fontSize(9).fillColor(COLORS.text).font('Helvetica').text(text, { lineGap: 2, paragraphGap: 4 });
}

function boldLabel(label, value) {
  checkSpace(15);
  doc.fontSize(9).fillColor(COLORS.text);
  const startX = doc.x;
  doc.font('Helvetica-Bold').text(label + ': ', { continued: true });
  doc.font('Helvetica').text(value);
}

function timelineEntry(date, title, detail, color) {
  checkSpace(60);
  doc.fontSize(9).fillColor(color).font('Helvetica-Bold').text(date, { continued: true });
  doc.fillColor(COLORS.text).text(' \u2014 ' + title);
  doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica').text(detail, { lineGap: 1.5 });
  doc.moveDown(0.4);
}

function tableRow(doc, cols, widths, opts = {}) {
  const { bold, bg, headerBg, fontSize: fs } = opts;
  const startX = doc.page.margins.left;
  const rowH = 14;
  const textH = (fs || 7.5);

  let maxLines = 1;
  const measured = cols.map((c, i) => {
    const h = doc.fontSize(textH).font(bold ? 'Helvetica-Bold' : 'Helvetica').heightOfString(c, { width: widths[i] - 6 });
    const lines = Math.ceil(h / (textH + 2));
    if (lines > maxLines) maxLines = lines;
    return lines;
  });

  const actualH = Math.max(rowH, maxLines * (textH + 3) + 4);
  checkSpace(actualH + 5);

  let x = startX;
  cols.forEach((c, i) => {
    if (headerBg) {
      doc.save().rect(x, doc.y, widths[i], actualH).fill(headerBg).restore();
      doc.fontSize(textH).font('Helvetica-Bold').fillColor(COLORS.tableHeaderText);
    } else if (bg) {
      doc.save().rect(x, doc.y, widths[i], actualH).fill(bg).restore();
      doc.fontSize(textH).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(COLORS.text);
    } else {
      doc.fontSize(textH).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(COLORS.text);
    }
    doc.text(c, x + 3, doc.y + 2, { width: widths[i] - 6, height: actualH });
    x += widths[i];
  });
  doc.y += actualH;
}

addHeaderFooter();

doc.moveDown(3);
doc.fontSize(18).fillColor(COLORS.darkBlue).font('Helvetica-Bold').text('INSTITUTO COSTARRICENSE DE ELECTRICIDAD (ICE)', { align: 'center' });
doc.fontSize(16).text('CYBER INTELLIGENCE BRIEFING', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).fillColor(COLORS.text).font('Helvetica').text('UNC2814 / GALLIUM \u2014 GRIDTIDE Backdoor Analysis', { align: 'center' });
doc.text('Critical Infrastructure Vulnerability Assessment', { align: 'center' });
doc.moveDown(0.5);
doc.moveTo(doc.page.margins.left + W * 0.15, doc.y).lineTo(doc.page.margins.left + W * 0.85, doc.y).strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();
doc.moveDown(0.5);
doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica-Oblique').text('Prepared by KAPPA Autonomous Intelligence Platform', { align: 'center' });
doc.text('Date: March 2026  |  Classification: TLP:AMBER', { align: 'center' });
doc.text('Document Status: EXPANDED BRIEFING \u2014 All sections fully detailed', { align: 'center' });

doc.moveDown(2);
doc.fontSize(11).fillColor(COLORS.darkBlue).font('Helvetica-Bold').text('TABLE OF CONTENTS');
doc.moveDown(0.3);
const toc = [
  '1. Executive Summary',
  '2. UNC Timeline \u2014 Phase Analysis',
  '   2.1 Phase 0: Noise (2022)',
  '   2.2 Phase 1: Transition (2023\u20132025)',
  '   2.3 Phase 2: Silent (2026)',
  '3. GRIDTIDE Backdoor \u2014 Technical Specification',
  '4. CVE Landscape \u2014 Costa Rica Infrastructure',
  '5. SETECOM SCADA Protocol Exposure',
  '6. Rootkit Arsenal \u2014 UNC Families',
  '7. Huawei / PRC Geopolitical Dimension',
  '8. Competing Attribution Theories',
  '9. Remediation Recommendations',
  '10. Appendix: Threat Actor Summary',
];
toc.forEach(t => doc.fontSize(9).fillColor(COLORS.text).font('Helvetica').text(t));

doc.addPage();

sectionTitle('1. Executive Summary');
bodyText('The Instituto Costarricense de Electricidad (ICE) suffered a confirmed breach attributed to the Chinese Advanced Persistent Threat (APT) group tracked as UNC2814/Gallium. Approximately 9GB of internal email data was exfiltrated from a locally-hosted email server using a novel backdoor designated GRIDTIDE, which leverages Google Sheets API as its command-and-control (C2) channel.');
doc.moveDown(0.3);
bodyText('This briefing expands the full intelligence picture: the timeline of events from Costa Rica\'s 2022 Conti ransomware emergency through the 2026 ICE breach; the technical specifications of GRIDTIDE and associated rootkit families; the CVE landscape affecting Costa Rican infrastructure; the SETECOM/Deep Sea Electronics SCADA exposure; the Huawei geopolitical dimension; and two competing analytical theories regarding attribution.');
doc.moveDown(0.3);
bodyText('The briefing concludes with prioritized remediation recommendations.');

sectionTitle('2. UNC Timeline \u2014 Phase Analysis');
bodyText('The operation can be divided into three phases: Phase 0: Noise (overt ransomware probing), Phase 1: Transition (regulatory and supply-chain positioning), and Phase 2: Silent (covert APT operations).');

subSectionTitle('2.1 Phase 0: Noise (2022)');
timelineEntry('2022-04-17', 'Conti Ransomware (UNC1756) hits ~30 Costa Rican Institutions',
  'The Conti group (tracked as UNC1756) launched a coordinated ransomware campaign against Costa Rican government institutions, encrypting systems across the Ministry of Finance (Hacienda), CCSS, and approximately 28 other agencies. This was the first "Phase 0" probe \u2014 noisy by design, mapping institutional response capabilities, backup procedures, and inter-agency communication channels.',
  COLORS.phase0);

timelineEntry('2022-05-08', 'President Chaves Declares National Emergency \u2014 "State of War"',
  'President Rodrigo Chaves declared a national emergency, describing the situation as a "state of war" against the cybercriminals. This unprecedented declaration for a cyber incident signaled to adversaries that Costa Rica\'s defenses were overwhelmed and that institutional coordination was fragile \u2014 valuable intelligence for Phase 1 planning.',
  COLORS.phase0);

timelineEntry('2022-05-31', 'Hive Ransomware Targets CCSS (EDUS + SICERE Destroyed)',
  'The Hive ransomware group attacked CCSS (Caja Costarricense de Seguro Social), destroying the EDUS (Unified Digital Health Record) and SICERE (Centralized Collection System) databases. This forced healthcare workers back to paper records and disrupted social security payments for millions.',
  COLORS.phase0);

subSectionTitle('2.2 Phase 1: Transition (2023\u20132025)');
timelineEntry('2023-08', 'Budapest Convention 5G Decree \u2014 Huawei/ZTE Banned',
  'An executive decree required all 5G infrastructure vendors to be signatories of the Budapest Convention on Cybercrime \u2014 which China has not signed. This effectively banned Huawei and ZTE from Costa Rica\'s 5G rollout. The decree triggered aggressive legal challenges from Huawei through the Constitutional Court and allegedly prompted Beijing to leverage ICE\'s internal workers\' union as a proxy to appeal the ban.',
  COLORS.phase1);

timelineEntry('2024-06', 'CISA/ZDI Publish DSE855 CVEs (5947/5950/5949/5952)',
  'CISA and the Zero Day Initiative published four critical vulnerabilities in DSE855 Ethernet gateways manufactured by Deep Sea Electronics, distributed exclusively in Costa Rica by SETECOM S.A. These gateways control backup generators for ICE\'s power grid, hospitals, and cellular towers. CVE-2024-5947 allows unauthenticated download of the configuration backup containing plaintext SCADA credentials.',
  COLORS.phase1);

timelineEntry('2025-06-21', 'Fiber Splitter (NAP/Colilla) Installed at Telecable Distribution Box',
  'A physical fiber optic splitter (NAP/Colilla) was identified installed at a Telecable distribution box serving the Sabana Norte area. This type of passive optical tap allows interception of all fiber traffic without introducing detectable signal degradation. The installation suggests actors with physical access to ISP infrastructure \u2014 a capability consistent with domestic surveillance rather than remote APT operations.',
  COLORS.phase1);

subSectionTitle('2.3 Phase 2: Silent (2026)');
timelineEntry('2026-01', 'PRC Bans ~12 Western/Israeli Cybersecurity Firms (Document 79)',
  'The PRC issued "Document 79" ordering state-owned enterprises in the financial and energy sectors to replace all Western and Israeli cybersecurity software by 2027. This retaliatory action \u2014 following the Budapest Convention decree and other Western tech restrictions \u2014 signals escalating cyber-geopolitical tensions.',
  COLORS.phase2);

timelineEntry('2026-01-25', 'ICE Breach Detected by GTIG/Mandiant \u2014 GRIDTIDE C2 Identified',
  'Google\'s Threat Intelligence Group (GTIG), operating through Mandiant, detected the ICE breach and identified GRIDTIDE \u2014 a novel C-based backdoor using Google Sheets API as its command-and-control channel. The backdoor masquerades as \'xapt\' (mimicking the APT package manager) and persists via systemd service. Its use of legitimate Google infrastructure makes it invisible to traditional network IDS/IPS.',
  COLORS.phase2);

timelineEntry('2026-01-30', 'Unauthorized TR-069 Admin Password Reset on ARRIS Router',
  'An unauthorized administrative password reset was detected on an ARRIS router via the TR-069 (CPE WAN Management Protocol) interface. TR-069 gives ISPs full remote management capability over customer premises equipment. This event indicates either ISP-level access or compromise of the TR-069 Auto Configuration Server (ACS) \u2014 both scenarios imply deep infrastructure penetration.',
  COLORS.phase2);

timelineEntry('2026-03-12', 'ICE Publicly Discloses ~9GB Email Data Breach',
  'ICE officially disclosed that approximately 9GB of internal email data had been exfiltrated from a locally-hosted email server. The exfiltration used SoftEther VPN Bridge to offshore infrastructure, with data encoded in URL-safe Base64. The locally-hosted nature of the server means the attacker required either persistent local network access or insider credentials \u2014 not typical of purely remote PRC operations.',
  COLORS.phase2);

timelineEntry('2026-03-13', 'Media Attributes ICE Breach to Chinese APT "Gallium"',
  'Costa Rican and international media attributed the ICE breach to the Chinese APT group \'Gallium\' (tracked by Mandiant as UNC2814). The attribution is based on GRIDTIDE\'s C2 infrastructure patterns and overlaps with previous UNC2814 campaigns across 53 organizations in 42 countries. However, GRIDTIDE\'s technique was publicly documented in the Voldemort Campaign (Proofpoint, Aug 2024), making false-flag operations feasible.',
  COLORS.phase2);

sectionTitle('3. GRIDTIDE Backdoor \u2014 Technical Specification');

const gridtideRows = [
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

const gCols = [W * 0.25, W * 0.75];
doc.y += 5;
let gY = doc.y;
doc.save().rect(doc.page.margins.left, gY, W, 14).fill(COLORS.tableHeader).restore();
doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.tableHeaderText);
doc.text('Property', doc.page.margins.left + 3, gY + 3, { width: gCols[0] - 6 });
doc.text('Detail', doc.page.margins.left + gCols[0] + 3, gY + 3, { width: gCols[1] - 6 });
doc.y = gY + 14;

gridtideRows.forEach((row, i) => {
  const bgColor = i % 2 === 0 ? '#ffffff' : COLORS.tableAlt;
  const textH = 8;
  const detailH = doc.fontSize(textH).font('Helvetica').heightOfString(row[1], { width: gCols[1] - 6 });
  const rowH = Math.max(14, detailH + 6);
  checkSpace(rowH + 2);
  const rY = doc.y;
  doc.save().rect(doc.page.margins.left, rY, W, rowH).fill(bgColor).restore();
  doc.fontSize(textH).font('Helvetica-Bold').fillColor(COLORS.text);
  doc.text(row[0], doc.page.margins.left + 3, rY + 3, { width: gCols[0] - 6 });
  doc.fontSize(textH).font('Helvetica').fillColor(COLORS.text);
  doc.text(row[1], doc.page.margins.left + gCols[0] + 3, rY + 3, { width: gCols[1] - 6 });
  doc.y = rY + rowH;
});

sectionTitle('4. CVE Landscape \u2014 Costa Rica Infrastructure');
bodyText('The following CVEs are confirmed relevant to Costa Rican critical infrastructure, spanning edge devices, hypervisors, SCADA controllers, and endpoint systems.');
doc.moveDown(0.3);

const cves = [
  { cve: 'CVE-2022-41328', target: 'FortiOS', mechanism: 'Path traversal', cvss: '\u2014', actor: 'UNC3886', detail: 'Allows authenticated attackers to read and write files via crafted CLI commands. Used by UNC3886 to deploy BOLDMOVE backdoor on FortiGate firewalls, providing persistent access to network perimeter devices.' },
  { cve: 'CVE-2023-20867', target: 'VMware Tools', mechanism: 'Guest Operations bypass', cvss: '\u2014', actor: 'UNC3886', detail: 'Authentication bypass in VMware Tools Guest Operations allows a fully compromised ESXi host to perform unauthenticated guest operations on any virtual machine. UNC3886 uses this to move laterally across virtualized infrastructure without triggering guest-level alerts.' },
  { cve: 'CVE-2023-30799', target: 'MikroTik RouterOS', mechanism: 'Privilege escalation', cvss: '\u2014', actor: 'UNC3886', detail: 'Super Admin privilege escalation via FTP/API. MikroTik routers are extremely common in Costa Rican ISP infrastructure. Once compromised, attackers gain full control of routing, DNS, and traffic mirroring.' },
  { cve: 'CVE-2023-34048', target: 'VMware vCenter', mechanism: 'OOB write (DCERPC)', cvss: '\u2014', actor: 'UNC3886', detail: 'Memory corruption in vCenter\'s DCERPC protocol. Allows unauthenticated RCE on vCenter servers, giving attackers control of the entire virtualization management plane.' },
  { cve: 'CVE-2024-5947', target: 'DSE855 Gateway', mechanism: 'HTTP GET plaintext creds', cvss: '6.5 Med', actor: 'SETECOM', detail: 'Unauthenticated HTTP GET to /Backup.bin returns complete configuration with plaintext SCADA credentials. Every SETECOM-distributed unit in Costa Rica affected.' },
  { cve: 'CVE-2024-5950', target: 'DSE855 Gateway', mechanism: 'Stack buffer overflow RCE', cvss: '\u2014', actor: 'SETECOM', detail: 'Stack-based buffer overflow on NXP LPC4357 microcontroller. Provides arbitrary code execution enabling full generator control.' },
  { cve: 'CVE-2024-5949', target: 'DSE855 Gateway', mechanism: 'Infinite loop DoS', cvss: '\u2014', actor: 'SETECOM', detail: 'Crafted multipart HTTP request triggers infinite loop, causing denial of service. Can disable generator monitoring during coordinated attack.' },
  { cve: 'CVE-2024-5952', target: 'DSE855 Gateway', mechanism: 'Unauth device reboot', cvss: '\u2014', actor: 'SETECOM', detail: 'Unauthenticated web UI request triggers device reboot. Combined with CVE-2024-5949, enables intermittent disruption.' },
  { cve: 'CVE-2025-10948', target: 'MikroTik REST API', mechanism: 'Heap overflow libjson.so', cvss: '8.8\u20139.8', actor: 'Botnet', detail: 'Critical heap overflow in RouterOS libjson.so. Actively exploited for botnet recruitment. Ubiquitous in Costa Rican ISP infrastructure.' },
  { cve: 'CVE-2025-21590', target: 'Juniper MX', mechanism: 'Shared resource isolation', cvss: '\u2014', actor: 'UNC3886', detail: 'Allows local attacker to inject code into FreeBSD process space. UNC3886 uses TINYSHELL variants for persistent access.' },
  { cve: 'CVE-2025-9491', target: 'Windows LNK', mechanism: 'Zero-day exploitation', cvss: '\u2014', actor: 'UNC6384', detail: 'Zero-day in Windows LNK processing. Exploited by Mustang Panda for initial access via spear-phishing.' },
  { cve: 'ZDI-CAN-25373', target: 'Windows LNK', mechanism: 'Spear-phishing via LNK', cvss: '\u2014', actor: 'UNC6384', detail: 'Mustang Panda crafted LNK campaigns. STATICPLUGIN downloader delivered through AitM captive portal with valid code-signing certs.' },
];

const cveCols = [W * 0.18, W * 0.15, W * 0.27, W * 0.12, W * 0.13, W * 0.15];
doc.y += 3;
let cveY = doc.y;
doc.save().rect(doc.page.margins.left, cveY, W, 14).fill(COLORS.tableHeader).restore();
doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.tableHeaderText);
let cx = doc.page.margins.left;
['CVE', 'Target', 'Mechanism', 'CVSS', 'Actor'].forEach((h, i) => {
  doc.text(h, cx + 2, cveY + 3, { width: cveCols[i] - 4 });
  cx += cveCols[i];
});
doc.y = cveY + 14;

cves.forEach((cve, i) => {
  const bgColor = i % 2 === 0 ? '#ffffff' : COLORS.tableAlt;
  const rowH = 13;
  checkSpace(rowH + 2);
  const rY = doc.y;
  doc.save().rect(doc.page.margins.left, rY, W, rowH).fill(bgColor).restore();
  doc.fontSize(6.5).font('Helvetica').fillColor(COLORS.text);
  let x = doc.page.margins.left;
  [cve.cve, cve.target, cve.mechanism, cve.cvss, cve.actor].forEach((val, j) => {
    doc.text(val, x + 2, rY + 3, { width: cveCols[j] - 4 });
    x += cveCols[j];
  });
  doc.y = rY + rowH;
});

doc.moveDown(0.5);
subSectionTitle('CVE Detail Expansion');
cves.forEach(cve => {
  checkSpace(40);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.text).text(cve.cve + ' (' + cve.target + '):', { continued: false });
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted).text(cve.detail, { lineGap: 1.5 });
  doc.moveDown(0.3);
});

sectionTitle('5. SETECOM SCADA Protocol Exposure');
bodyText('SETECOM S.A. is the exclusive Costa Rican distributor for Deep Sea Electronics (DSE) generator controllers. The following industrial protocols are exposed across the national generator fleet:');
doc.moveDown(0.3);

const protocols = [
  { protocol: 'Modbus TCP/IP', port: '502', vuln: 'No authentication, no encryption, no integrity checking by protocol design. Any device that can reach port 502 can read registers, write coils, and issue commands. In ICE\'s generator infrastructure, this means fuel injection rates, RPM targets, and emergency shutdown commands are accessible to any network-adjacent attacker.' },
  { protocol: 'SNMP v2c', port: '161/162 UDP', vuln: 'Cleartext community strings \'public\' (read) / \'private\' (read-write) routinely unchanged. An attacker with network access can enumerate all devices, read configuration, and modify device settings including alarm thresholds and operational parameters.' },
  { protocol: 'J1939 CAN Bus', port: '\u2014', vuln: '29-bit identifier (3P + 18PGN + 8SA); direct ECU access. An attacker on the CAN bus can modify fuel injection timing, override RPM limiters, suppress overspeed alarms, and potentially cause physical damage to generators.' },
  { protocol: 'DSE WebNet', port: 'HTTP', vuln: 'Default Admin/Password1234 across entire fleet (DSE 855, 890 MKII, 891, 892). Provides web-based remote access to start/stop generators, modify load sharing, adjust protection settings, and suppress alarms across the national infrastructure.' },
];

protocols.forEach((p, i) => {
  checkSpace(45);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.critical).text(p.protocol + (p.port !== '\u2014' ? ' (Port ' + p.port + ')' : ''));
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(p.vuln, { lineGap: 1.5 });
  doc.moveDown(0.4);
});

sectionTitle('6. Rootkit Arsenal \u2014 UNC Families');

const rootkits = [
  { family: 'REPTILE', layer: 'Kernel', mechanism: 'Loadable kernel module', actor: 'UNC3886', persistence: 'Auto-loads via modprobe.d', detail: 'Linux kernel rootkit providing process hiding, file hiding, network traffic hiding, and a magic packet backdoor for reverse shell access. Extremely difficult to detect without kernel-level memory forensics.' },
  { family: 'MEDUSA', layer: 'Kernel', mechanism: 'LD_PRELOAD credential harvester', actor: 'UNC3886', persistence: 'Intercepts PAM auth', detail: 'Hooks into PAM stack via LD_PRELOAD injection. Every authentication event \u2014 SSH logins, sudo commands, service account authentications \u2014 is captured. Credentials forwarded in real-time to C2.' },
  { family: 'GRIDTIDE', layer: 'Application', mechanism: 'Google Sheets API C2', actor: 'UNC2814', persistence: 'systemd service (xapt)', detail: 'Novel C2 backdoor using Google Sheets API. Commands in A1, exfil through A2\u2013An in 45KB fragments, host fingerprinting in V1. Binary masquerades as \'xapt\' to mimic apt package manager.' },
  { family: 'SOGU.SEC/PlugX', layer: 'Memory', mechanism: 'DLL side-loading', actor: 'UNC6384', persistence: 'No disk footprint', detail: 'Memory-resident RAT delivered via DLL side-loading. Runs entirely in memory, invisible to file-based antivirus.' },
  { family: 'TINYSHELL', layer: 'Application', mechanism: 'Custom reverse shell', actor: 'UNC3886', persistence: 'Juniper FreeBSD injection', detail: 'Lightweight reverse shell adapted for Juniper MX routers running FreeBSD. Injects into legitimate system processes. Exploits CVE-2025-21590 for initial injection.' },
  { family: 'STATICPLUGIN', layer: 'Application', mechanism: 'Signed AitM downloader', actor: 'UNC6384', persistence: 'Valid code-signing certs', detail: 'Uses adversary-in-the-middle captive portal to deliver properly signed payloads that bypass SmartScreen and WDAC.' },
];

rootkits.forEach((r, i) => {
  checkSpace(45);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.darkBlue).text(r.family + ' (' + r.layer + ' layer)', { continued: true });
  doc.font('Helvetica').fillColor(COLORS.muted).text(' \u2014 ' + r.actor);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.text).text('Mechanism: ', { continued: true });
  doc.font('Helvetica').text(r.mechanism + '  |  Persistence: ' + r.persistence);
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted).text(r.detail, { lineGap: 1.5 });
  doc.moveDown(0.4);
});

sectionTitle('7. Huawei / PRC Geopolitical Dimension');

const huaweiItems = [
  { item: 'Budapest Convention 5G Decree (Aug 2023)', type: 'Regulatory', detail: 'Executive decree mandating all 5G vendors be Budapest Convention signatories \u2014 effectively banning Huawei and ZTE' },
  { item: 'ICE Internal Workers\' Front Proxy', type: 'Influence', detail: 'Beijing reportedly leveraged ICE internal union to appeal 5G ban in lower courts, stalling deployment and creating institutional friction' },
  { item: 'Chinese Embassy Rejection', type: 'Diplomatic', detail: 'Embassy publicly rejected ICE breach accusations, demanded technical evidence from Costa Rican authorities' },
  { item: 'Document 79 Directive', type: 'Retaliatory', detail: 'PRC ordered SOEs in financial/energy sectors to replace all Western cybersecurity software by 2027' },
  { item: 'Huawei Legal Appeals', type: 'Legal', detail: 'Huawei initiated aggressive legal appeals through Costa Rican Constitutional Court to challenge 5G exclusion' },
  { item: 'US $25M Cybersecurity Grant', type: 'Countermeasure', detail: 'US State Department committed $25M to assist Costa Rica in building defenses \u2014 direct counter to PRC influence' },
  { item: 'Supply Chain Gap', type: 'Vulnerability', detail: 'US-funded SOC monitors application layer while underlying edge devices (MikroTik, DSE) remain PRC-accessible at Tier-0' },
];

huaweiItems.forEach((h, i) => {
  checkSpace(30);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text).text(h.item, { continued: true });
  doc.font('Helvetica').fillColor(COLORS.muted).text(' [' + h.type + ']');
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(h.detail, { lineGap: 1.5 });
  doc.moveDown(0.3);
});

sectionTitle('8. Competing Attribution Theories');

subSectionTitle('Theory A: Gallium Attribution is a Cover');
const theoryA = [
  'The breach timing coincides precisely with domestic surveillance activity against individuals who documented infrastructure vulnerabilities.',
  'Attributing to a Chinese APT deflects attention from internal security failures and potential misuse of monitoring infrastructure.',
  'GRIDTIDE\'s Google Sheets C2 technique is well-documented since 2024 \u2014 a convenient off-the-shelf attribution vector.',
  'The 5G ban and Huawei legal battles create a pre-built geopolitical narrative that makes "China did it" the path of least resistance.',
  'Physical surveillance indicators (fiber splitters, TR-069 resets, EVOPRO room monitoring) suggest domestic actors with physical access, not remote APT operations.',
  '9GB email exfiltration from a locally-hosted server requires either insider access or persistent local network presence \u2014 not typical of PRC remote operations.',
];
theoryA.forEach((p, i) => {
  checkSpace(20);
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text((i + 1) + '. ' + p, { lineGap: 1.5, indent: 15 });
  doc.moveDown(0.15);
});

doc.moveDown(0.3);
subSectionTitle('Theory B: ICE Genuinely Needs Help');
const theoryB = [
  'Costa Rica\'s critical infrastructure has real, documented vulnerabilities \u2014 SETECOM default credentials, unpatched MikroTik routers, exposed SCADA protocols.',
  'UNC2814/UNC3886/UNC6384 are real, well-documented threat actors with confirmed global operations across 42+ countries.',
  'The Conti ransomware attack (2022) proved Costa Rica is a viable target \u2014 the "state of war" declaration was not theatre.',
  'ICE\'s IT infrastructure predates modern cybersecurity standards and relies heavily on legacy systems with known vulnerabilities.',
  'The US $25M cybersecurity grant acknowledges the problem is real and beyond ICE\'s current capacity to handle alone.',
  'Chinese satellite constellation provides persistent overhead coverage \u2014 Beidou GNSS + Yaogan/Gaofen ISR creates a complete intelligence picture.',
  'Whether or not this specific breach is PRC, the underlying vulnerabilities are real and exploitable by any motivated actor.',
];
theoryB.forEach((p, i) => {
  checkSpace(20);
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text((i + 1) + '. ' + p, { lineGap: 1.5, indent: 15 });
  doc.moveDown(0.15);
});

doc.moveDown(0.3);
subSectionTitle('Assessment');
bodyText('Both theories may be simultaneously true. The critical infrastructure vulnerabilities documented in this briefing are real regardless of who exploited them. The recommended remediation actions address the underlying vulnerabilities independent of attribution.');

sectionTitle('9. Remediation Recommendations');

const recs = [
  { priority: 'IMMEDIATE', title: 'Audit all DSE855/890/891/892 gateways for default credentials', detail: 'Every SETECOM-distributed unit ships with Admin/Password1234. This controls backup generators for ICE\'s national grid, hospitals, and cell towers.', steps: ['Enumerate all DSE units via SNMP discovery or DSE WebNet inventory', 'Change default credentials on every unit', 'Implement network segmentation between OT and IT networks', 'Deploy monitoring on port 502 (Modbus) and DSE WebNet HTTP interfaces', 'Establish credential rotation policy for all SCADA equipment'] },
  { priority: 'IMMEDIATE', title: 'Sweep for GRIDTIDE persistence (xapt systemd service)', detail: 'Check all Linux servers for /etc/systemd/system/xapt.service and /usr/sbin/xapt binary. GRIDTIDE uses Google Sheets API as C2 \u2014 traditional network IDS will not detect it.', steps: ['Run: find / -name \'xapt\' -o -name \'xapt.service\' on all Linux systems', 'Check systemd: systemctl list-units --type=service | grep xapt', 'Audit Google Sheets API OAuth tokens in outbound traffic logs', 'Search for 16-byte key files in /etc/ and service account home directories', 'Check for SoftEther VPN Bridge processes and connections'] },
  { priority: 'HIGH', title: 'Deploy Tier-0 hypervisor monitoring', detail: 'UNC3886 operates below guest OS at the hypervisor level. Current SOC monitors application layer only. REPTILE and MEDUSA rootkits are invisible to EDR.', steps: ['Deploy hypervisor-level integrity monitoring on all ESXi hosts', 'Implement VMware vCenter audit logging with SIEM integration', 'Check for unauthorized kernel modules: lsmod and /etc/modprobe.d/', 'Verify LD_PRELOAD is not set in /etc/environment or PAM configs', 'Conduct memory forensics on critical servers'] },
  { priority: 'HIGH', title: 'Patch MikroTik fleet against CVE-2025-10948', detail: 'Critical heap overflow (CVSS 8.8\u20139.8) in REST API. MikroTik routers are ubiquitous in Costa Rican ISP infrastructure.', steps: ['Inventory all MikroTik devices across ICE infrastructure', 'Update RouterOS to latest stable release', 'Disable REST API on all devices where not required', 'Implement ACLs restricting management access to trusted IPs', 'Monitor for exploitation attempts via IDS signatures'] },
  { priority: 'HIGH', title: 'Investigate TR-069 management plane access', detail: 'Unauthorized admin password reset detected 2026-01-30 via TR-069 on ARRIS router.', steps: ['Audit TR-069 ACS access logs', 'Review all CPE password reset events in the last 6 months', 'Verify ACS authentication and authorization controls', 'Implement TR-069 connection encryption (TLS)', 'Consider restricting TR-069 access to management VLAN only'] },
  { priority: 'MEDIUM', title: 'Audit Modbus TCP/502 exposure on SCADA networks', detail: 'Modbus has zero authentication by design. Segment and firewall port 502.', steps: ['Scan for open port 502 across all network segments', 'Implement firewall rules restricting Modbus access to authorized HMIs only', 'Deploy Modbus-aware IDS (e.g., Suricata with Modbus rules)', 'Consider Modbus/TCP proxy with authentication overlay', 'Document all legitimate Modbus communication paths'] },
  { priority: 'MEDIUM', title: 'Review SoftEther VPN connections from ICE infrastructure', detail: 'GRIDTIDE uses SoftEther VPN Bridge for exfiltration.', steps: ['Search for SoftEther VPN processes on all servers', 'Check for unexpected outbound VPN tunnels (ports 443, 992, 5555)', 'Review firewall logs for SoftEther protocol signatures', 'Block SoftEther at the perimeter unless explicitly authorized', 'Implement DLP controls on outbound encrypted tunnels'] },
  { priority: 'STRATEGIC', title: 'Engage KAPPA platform for continuous SIGINT monitoring', detail: '24/7 autonomous correlation across RF, satellite, network, and acoustic domains.', steps: ['Review KAPPA platform capabilities', 'Evaluate integration with ICE SOC for continuous monitoring', 'Consider deployment of passive RF sensors at ICE facilities', 'Establish secure communication channel for intelligence sharing'] },
];

recs.forEach((rec, i) => {
  checkSpace(60);
  const priorityColor = rec.priority === 'IMMEDIATE' ? COLORS.critical : rec.priority === 'HIGH' ? COLORS.high : rec.priority === 'MEDIUM' ? COLORS.medium : COLORS.sectionBlue;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(priorityColor).text('[' + rec.priority + '] ', { continued: true });
  doc.fillColor(COLORS.text).text((i + 1) + '. ' + rec.title);
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted).text(rec.detail, { lineGap: 1.5 });
  rec.steps.forEach((step, j) => {
    checkSpace(12);
    doc.fontSize(7.5).font('Helvetica').fillColor(COLORS.text).text('    ' + String.fromCharCode(97 + j) + '. ' + step);
  });
  doc.moveDown(0.4);
});

sectionTitle('10. Appendix: Threat Actor Summary');

const actors = [
  ['UNC1756', 'Conti Group', 'Ransomware (Phase 0)', '2022 Costa Rica emergency'],
  ['UNC2814', 'Gallium', 'GRIDTIDE C2, SoftEther exfil', 'ICE breach, 53 orgs / 42 countries'],
  ['UNC3886', '\u2014', 'Hypervisor rootkits, edge device persistence', 'FortiOS, VMware, MikroTik, Juniper'],
  ['UNC6384', 'Mustang Panda', 'Spear-phishing, memory-resident RATs', 'Windows LNK zero-days, STATICPLUGIN'],
];

const aCols = [W * 0.15, W * 0.18, W * 0.32, W * 0.35];
let aY = doc.y + 3;
doc.save().rect(doc.page.margins.left, aY, W, 14).fill(COLORS.tableHeader).restore();
doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLORS.tableHeaderText);
let ax = doc.page.margins.left;
['Designation', 'Also Known As', 'Primary TTPs', 'CR Relevance'].forEach((h, i) => {
  doc.text(h, ax + 2, aY + 3, { width: aCols[i] - 4 });
  ax += aCols[i];
});
doc.y = aY + 14;

actors.forEach((row, i) => {
  const bgColor = i % 2 === 0 ? '#ffffff' : COLORS.tableAlt;
  const rowH = 14;
  checkSpace(rowH + 2);
  const rY = doc.y;
  doc.save().rect(doc.page.margins.left, rY, W, rowH).fill(bgColor).restore();
  doc.fontSize(7).font('Helvetica').fillColor(COLORS.text);
  let x = doc.page.margins.left;
  row.forEach((val, j) => {
    doc.text(val, x + 2, rY + 3, { width: aCols[j] - 4 });
    x += aCols[j];
  });
  doc.y = rY + rowH;
});

doc.moveDown(3);
doc.moveTo(doc.page.margins.left + W * 0.2, doc.y).lineTo(doc.page.margins.left + W * 0.8, doc.y).strokeColor(COLORS.tableBorder).lineWidth(0.3).stroke();
doc.moveDown(0.5);
doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica-Oblique');
doc.text('End of Briefing \u2014 KAPPA Autonomous Intelligence Platform', { align: 'center' });
doc.text('Classification: TLP:AMBER \u2014 Distribution restricted to ICE authorized personnel', { align: 'center' });

doc.end();

stream.on('finish', () => {
  const stats = fs.statSync('ICE_Cyber_Intelligence_Briefing.pdf');
  console.log('PDF generated: ICE_Cyber_Intelligence_Briefing.pdf (' + (stats.size / 1024).toFixed(1) + ' KB)');
});
