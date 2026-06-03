// US Escalation Blast #2 — beyond FBI, additional oversight + enforcement
// Samuel Wotton — 3 June 2026
// Usage: tsx server/send-us-escalation-2.ts
import Mailgun from "mailgun.js";

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN || "echokappa.com";
if (!apiKey) { console.error("MAILGUN_API_KEY not set"); process.exit(1); }

const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: apiKey });
const sender = "Samuel Wotton <hello@echokappa.com>";

const EVIDENCE_URL = "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev/evidence/DENUNCIA_SAM_WOTTON_20260530.html";

const CORE = `
FROM: Samuel Wotton, U.S. Citizen
EMAIL: spwotton@gmail.com
PHONE: +506 6377-3099
LOCATION: Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
DATE: 3 June 2026

────────────────────────────────────────────
SITUATION
────────────────────────────────────────────

I am a U.S. citizen who has been subjected to an 18-month documented campaign of
electronic harassment, network infiltration, RF-based physical interference, and
coordinated surveillance in Costa Rica. A formal denuncia penal has been filed
with Costa Rica's OIJ (Sección de Delitos Informáticos) and the Fiscalía
Adjunta contra la Delincuencia Organizada. A complaint was filed with the FBI
Legal Attaché San José and the U.S. Embassy ACS on 3 June 2026.

I am escalating to additional U.S. oversight bodies because after 18 months and
multiple filings, I have received no protective action.

────────────────────────────────────────────
KEY DOCUMENTED FACTS
────────────────────────────────────────────

1. CRITICAL INFRASTRUCTURE VULNERABILITY (CISA-documented)
   Setecom S.A. (Director: Héctor Eduardo Mora Marín, alias hmora67) holds the
   exclusive national contract to distribute and service Deep Sea Electronics
   (DSE) generator controllers across Costa Rica's critical infrastructure:
   ICE national electric utility, Liberty network, public hospitals, and San José
   airport radar backup power. Four CISA-published CVEs affect the deployed
   models — including remote code execution and unauthenticated shutdown.
   Modbus port 502 is publicly exposed and unauthenticated on IP 190.106.77.194
   (FortiGate 60F serial FGT60FTK21083818). This is not a theoretical risk;
   the same individual modified electrical equipment at my residence.

2. CLOUD/ISP-LEVEL NETWORK COMPROMISE
   Jorge Jiménez Navarro — formerly Kyndryl Senior Lead Network Services
   (September 2021–May 2024), currently Technical Success Manager at Zscaler —
   was also the property manager at my residence in La Guácima, Alajuela.
   PCAP analysis documents Service-Worker injection and script injection from
   his property. He has direct access to the Zscaler cloud-proxy backbone.

3. NETWORK FORENSIC EVIDENCE (PCAP)
   - Unauthorized devices on LAN with spoofed MACs
   - Port 8009 (Chromecast/cast control): persistent unauthorized sessions,
     screen mirroring, remote wake events
   - Connection throttling: 196 packets (~19 KB) in 3.5 minutes vs ~3,791
     packets in comparable windows — active interception confirmed
   - ~402,228 packets to 200+ external IPs including threat-intelligence-flagged hosts
   - ISP-level TR-069/CWMP (port 7547) management-plane injection;
     forced router reset documented 30 January 2026

4. RF EVIDENCE (48 kHz recording, 17 January 2026)
   - 46.875 Hz: DSP master-clock hardware fingerprint (48,000 ÷ 1,024), +79–89 dB SNR
   - 97.01 Hz: continuous sub-audio carrier consistent with UAV/drone operation
   - 44.2 Hz: rotational/propeller signature
   - 8.95–15.4 Hz: infrasound range (documented physiological effects)
   - 50 Hz ELF anomaly: foreign-standard frequency inconsistent with Costa Rica's
     60 Hz national grid — confirms foreign-sourced hardware on Costa Rican soil

5. MUNICIPAL/POLITICAL NEXUS
   Víctor Antonio Ríos Solís — confirmed former Mayor of Garabito canton
   (1998–2002, TSE case 1260-M-2001; La Gaceta N.º 249, 23 Dec 1998) and
   legal representative of Bakewell INC S.A. (Urbanización Los Ríos, Quebrada
   Seca) — provides the municipal infrastructure and Zona Marítimo Terrestre
   access layer for this operation.

6. DEATH THREAT
   On the evening of 31 May 2026 — approximately 24 hours after submitting my
   first formal disclosure filings — I received an explicit verbal death threat:
   "You just made the biggest mistake of your life." The timing confirms that my
   communications are being intercepted in real time, consistent with the PCAP
   evidence.

────────────────────────────────────────────
FULL FORENSIC DOSSIER
────────────────────────────────────────────

${EVIDENCE_URL}

All evidence available for delivery with SHA-256 chain-of-custody documentation:
PCAP files, spectral analysis JSON, network correlation reports, Setecom DSE
training transcripts, CISA advisories for affected models, timeline documentation.

────────────────────────────────────────────
REQUEST
────────────────────────────────────────────

I am requesting that this matter be reviewed, that any relevant agency-to-agency
coordination occur, and that available protective measures for a U.S. citizen
abroad be considered.

Samuel Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
3 June 2026
`;

interface Contact { id: number; to: string; org: string; subject: string; body: string; }

const CONTACTS: Contact[] = [
  {
    id: 7001,
    to: "hsi.tipline@ice.dhs.gov",
    org: "Homeland Security Investigations (HSI) — Foreign Operations / Transnational Crime",
    subject: "HSI Tip — U.S. Citizen Under Active Threat, Foreign Surveillance Infrastructure, Costa Rica",
    body: `To HSI Foreign Operations,\n\nI am filing this tip regarding a documented foreign surveillance operation targeting a U.S. citizen in Costa Rica, involving cloud/ISP-level network compromise (Zscaler backbone) and foreign-standard RF hardware operating on Costa Rican soil.\n${CORE}`,
  },
  {
    id: 7002,
    to: "NSDD@usdoj.gov",
    org: "DOJ National Security Division",
    subject: "Report — Foreign Surveillance Operation Against U.S. Citizen in Costa Rica — Cloud/ICS Infrastructure Compromise",
    body: `To the National Security Division,\n\nI am reporting a documented operation against a U.S. citizen in Costa Rica that involves both ICS/critical-infrastructure vulnerabilities (CISA-documented CVEs) and cloud-proxy-level network access by an individual with current employment at Zscaler.\n${CORE}`,
  },
  {
    id: 7003,
    to: "icwatch@intelligencecommunityig.gov",
    org: "ICIG — Intelligence Community Inspector General",
    subject: "Re-Submission / Escalation — U.S. Citizen, Foreign Surveillance Operation, Costa Rica — 18 Months Undocumented",
    body: `To the Intelligence Community Inspector General,\n\nI am re-submitting and escalating my previous complaint. 18 months of documented electronic surveillance, network intrusion, and RF-based harassment against a U.S. citizen in Costa Rica has produced no protective action. A death threat was received 31 May 2026.\n${CORE}`,
  },
  {
    id: 7004,
    to: "hpsci@mail.house.gov",
    org: "HPSCI — House Permanent Select Committee on Intelligence",
    subject: "Congressional Report — U.S. Citizen Under Foreign Surveillance / Death Threat, Costa Rica — ICS/Cloud Compromise",
    body: `To the House Permanent Select Committee on Intelligence,\n\nI am writing to bring to the Committee's attention a documented foreign surveillance operation against a U.S. citizen in Costa Rica, involving CISA-documented ICS vulnerabilities in critical national infrastructure and a cloud-proxy (Zscaler) compromise. After 18 months and multiple filings to federal agencies, I have received no protective action. A death threat was received 31 May 2026.\n${CORE}`,
  },
  {
    id: 7005,
    to: "pa@southcom.mil",
    org: "U.S. Southern Command (SOUTHCOM) Public Affairs",
    subject: "SOUTHCOM — U.S. Citizen Under Threat, Foreign RF Infrastructure on Costa Rican Soil, 50 Hz Foreign-Standard Hardware",
    body: `To U.S. Southern Command,\n\nI am a U.S. citizen in Costa Rica reporting documented foreign-standard RF infrastructure (50 Hz, inconsistent with Costa Rica's 60 Hz grid) operating in the Jacó/Garabito area of Puntarenas province, linked to a coordinated 18-month surveillance campaign against me. This is a SOUTHCOM-area-of-responsibility matter.\n${CORE}`,
  },
  {
    id: 7006,
    to: "dia-pao@dia.mil",
    org: "Defense Intelligence Agency (DIA)",
    subject: "DIA — Foreign Intelligence Activity Report — Costa Rica — Foreign RF Infrastructure, ICS Compromise, U.S. Citizen Target",
    body: `To the Defense Intelligence Agency,\n\nI am reporting what appears to be a foreign intelligence operation running out of the Pacific coast of Costa Rica (Jacó/Esterillos Oeste corridor), involving foreign-standard RF hardware, ICS compromise of critical national infrastructure, and 18 months of documented surveillance against a U.S. citizen.\n${CORE}`,
  },
  {
    id: 7007,
    to: "contact@intelligence.senate.gov",
    org: "SSCI — Senate Select Committee on Intelligence",
    subject: "SSCI — U.S. Citizen Under Active Death Threat, Foreign Surveillance Operation, Costa Rica — 18 Months No Action",
    body: `To the Senate Select Committee on Intelligence,\n\nI am escalating to the Committee after 18 months of documented foreign surveillance, network compromise, and RF harassment in Costa Rica have produced no response from federal agencies. A death threat was received 31 May 2026, the day after my first formal filings.\n${CORE}`,
  },
  {
    id: 7008,
    to: "hfac@mail.house.gov",
    org: "House Foreign Affairs Committee",
    subject: "House Foreign Affairs — U.S. Citizen Abroad, Costa Rica — Foreign Surveillance, Death Threat, No Federal Response",
    body: `To the House Foreign Affairs Committee,\n\nI am a U.S. citizen in Costa Rica writing to request congressional attention. After 18 months of documented electronic harassment and surveillance by identified actors — including a person with current Zscaler cloud-proxy access and another holding CISA-documented ICS vulnerabilities across Costa Rica's critical infrastructure — I received a death threat on 31 May 2026. Federal agencies have not provided any protective response.\n${CORE}`,
  },
  {
    id: 7009,
    to: "contact@foreign.senate.gov",
    org: "Senate Foreign Relations Committee",
    subject: "Senate Foreign Relations — U.S. Citizen Under Threat in Costa Rica — Foreign Surveillance / Infrastructure Compromise",
    body: `To the Senate Foreign Relations Committee,\n\nI am a U.S. citizen in Costa Rica requesting the Committee's attention regarding a documented foreign surveillance operation, an active death threat (31 May 2026), and CISA-documented ICS vulnerabilities in Costa Rica's critical national infrastructure that appear to be actively exploited.\n${CORE}`,
  },
  {
    id: 7010,
    to: "ofac_feedback@treasury.gov",
    org: "OFAC / U.S. Treasury — Sanctions & Financial Intelligence",
    subject: "OFAC — Possible Sanctions-Adjacent Activity — Foreign-Sourced RF Hardware, Real Estate Nexus, Costa Rica",
    body: `To the Office of Foreign Assets Control,\n\nI am reporting a potential financial intelligence matter connected to an 18-month documented surveillance operation in Costa Rica. Specifically: (1) foreign-standard RF hardware (50 Hz, inconsistent with Costa Rica's 60 Hz grid) operating without license, (2) a real estate development company (Bakewell INC S.A., Urbanización Los Ríos, Quebrada Seca) linked to a former municipal official who coordinated the operation, warranting possible financial investigation.\n${CORE}`,
  },
];

console.log(`\n🇺🇸 US ESCALATION BLAST #2 — ${CONTACTS.length} targets\n`);

let ok = 0, fail = 0;
for (const c of CONTACTS) {
  try {
    await client.messages.create(domain, { from: sender, to: [c.to], subject: c.subject, text: c.body });
    console.log(`✓ [${c.id}] ${c.org} → ${c.to}`);
    ok++;
  } catch (e: any) {
    const msg = e?.response?.body?.message || e?.message || String(e);
    console.error(`✗ [${c.id}] ${c.org} → ${c.to}: ${msg}`);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 400));
}

console.log(`\nResult: ${ok} sent, ${fail} failed out of ${CONTACTS.length}\n`);
