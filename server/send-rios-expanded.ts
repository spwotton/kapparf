// Expanded Ríos Solís / Russian intelligence notification — all targets
// Samuel Wotton — 7 June 2026
// Usage: tsx server/send-rios-expanded.ts
import Mailgun from "mailgun.js";

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN || "echokappa.com";
if (!apiKey) { console.error("MAILGUN_API_KEY not set"); process.exit(1); }

const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: apiKey });
const sender = "Samuel Wotton <hello@echokappa.com>";

const EVIDENCE_URL = "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev/evidence/DENUNCIA_SAM_WOTTON_20260530.html";

const RIOS_PROFILE = `VERIFIED SUBJECT: VÍCTOR ANTONIO RÍOS SOLÍS
- Role: Former Alcalde (Mayor), Cantón de Garabito (governs Jacó Beach)
- Tenure: Elected 19 November 1998 — La Gaceta N.º 249, 23 December 1998
- Conflict of interest: His brother Jorge Johnny Ríos Solís held the Zona Marítimo Terrestre (ZMT) administration post since 18 March 1983 — the 200-metre coastal strip covering all Jacó beachfront land
- Source: TSE case 1260-M-2001 (tse.go.cr/juris/municipales/1260-M-2001.HTM)
- Current role: Legal representative, Bakewell INC S.A. (Urbanización Los Ríos, Quebrada Seca)`;

const THREE_LAYER = `THREE-LAYER OPERATION STRUCTURE:
1. LAND LAYER — Ríos Solís family: former mayoral control + maritime zone administration = physical access to coastal infrastructure in Jacó
2. CRITICAL INFRASTRUCTURE LAYER — Héctor Eduardo Mora Marín (alias hmora67), Executive Director Setecom S.A.: exclusive national contracts covering ICE (electric utility), Liberty telecom, public hospitals, San José airport radar backup; CISA-published CVEs; Modbus port 502 unauthenticated
3. CLOUD/ISP LAYER — Jorge Jiménez Navarro (formerly Kyndryl Senior Lead Network Services, currently Zscaler Technical Success Manager): cloud-proxy MITM capability; property manager at my prior residence`;

const RF_EVIDENCE = `RF/SIGINT EVIDENCE (48 kHz recording, 17 January 2026):
- 46.875 Hz: DSP master-clock fingerprint (48,000 ÷ 1,024) — hardware identification
- 97.01 Hz: continuous sub-audio carrier
- 44.2 Hz: rotational/propeller signature consistent with UAV
- 50 Hz ELF anomaly: inconsistent with Costa Rica's 60 Hz mains — foreign-sourced hardware
- PCAP: 402,228 packets to 200+ external IPs; unauthorized devices on LAN; port 8009 screen-mirroring control; TR-069/CWMP management-plane injection`;

const DUAL_AGENCY = `DUAL-AGENCY CONCERN:
The primary subject is alleged to operate simultaneously with Jehovah's Witnesses organizational networks — which function in Latin America as documented cover for U.S. intelligence-linked civilian HUMINT collection — AND with Russian-intelligence-aligned actors. The documented coordination of a U.S.-citizen surveillance operation by an individual with apparent dual access to both Western and Russian intelligence ecosystems represents a significant counterintelligence concern warranting investigation by both sides.`;

const FILINGS = `EXISTING FORMAL FILINGS (as of 7 June 2026):
OIJ Sección de Delitos Informáticos · Fiscalía Adjunta Delincuencia Organizada · FBI Legal Attaché San José · U.S. Embassy American Citizen Services · ICIG · HPSCI · SSCI · SOUTHCOM · DIA · DOJ National Security Division · HSI · OFAC`;

const CONTACTS = [
  // ── Russian diplomatic ──────────────────────────────────────────────────────
  {
    id: 9001,
    to: "mail@costarica.mid.ru",
    org: "Russian Embassy — San José, Costa Rica (direct)",
    subject: "FORMAL NOTIFICATION — Russian National Activity Against U.S. Citizen, Jacó, Costa Rica",
    body: `To the Embassy of the Russian Federation in Costa Rica,

I am Samuel P. Wotton, a United States citizen residing at Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica. I write to formally notify the Embassy of documented activities by Russian-aligned actors in your consular jurisdiction.

${RIOS_PROFILE}

${THREE_LAYER}

${RF_EVIDENCE}

${DUAL_AGENCY}

I received a death threat on 31 May 2026, approximately 24 hours after my first formal disclosure filing with Costa Rican and U.S. authorities.

I am notifying the Russian Embassy directly because the coordination structure involves actors with apparent ties to Russian intelligence networks operating in Central America. I request that the Embassy acknowledge receipt and advise whether this matter falls within any treaty-based notification obligation.

${FILINGS}

Full forensic dossier: ${EVIDENCE_URL}

Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
7 June 2026`,
  },
  // ── Investigative journalists ───────────────────────────────────────────────
  {
    id: 9002,
    to: "tips@bellingcat.com",
    org: "Bellingcat — open-source intelligence / Russian intelligence tracking",
    subject: "STORY TIP — Russian-Linked Operation Against U.S. Citizen in Costa Rica: RF Evidence + 3-Layer Network",
    body: `To the Bellingcat editorial team,

I am submitting a documented tip regarding what appears to be a coordinated Russian-intelligence-linked operation targeting a U.S. citizen in Jacó, Costa Rica over 18 months.

WHY THIS IS A BELLINGCAT STORY:
- Documented RF/SIGINT evidence of hardware with foreign (50 Hz) electrical signature in a 60 Hz country
- Verified actor network including a former municipal mayor with simultaneous land/coastal-zone control
- Critical infrastructure exposure: national-level generator controller contracts with unauthenticated Modbus access
- A dual-agency dimension: primary subject alleged to operate across both Jehovah's Witnesses organizational networks (historically documented as intelligence-adjacent in Latin America) AND Russian-aligned intelligence structures — a significant counterintelligence anomaly
- Death threat received 31 May 2026, 24 hours after first formal filing

${RIOS_PROFILE}

${THREE_LAYER}

${RF_EVIDENCE}

This case has all the hallmarks of a documented foreign influence operation: layered infrastructure access, RF harassment, ISP-level MITM, and a coordinated local actor network. The dual-agency angle in particular — simultaneous Western and Russian intelligence adjacency — is unusual and potentially significant.

Full forensic dossier: ${EVIDENCE_URL}
I am available for interview.

Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica`,
  },
  {
    id: 9003,
    to: "tips@meduza.io",
    org: "Meduza — investigative journalism, FSB/GRU operations abroad",
    subject: "TIP — Russian Intelligence Activity Against U.S. Citizen, Costa Rica: RF SIGINT + Dual-Agency Actor",
    body: `To the Meduza editorial team,

I am a U.S. citizen (Samuel P. Wotton) documenting an 18-month campaign of RF-based harassment, network infiltration, and physical surveillance in Jacó Beach, Costa Rica, conducted through a verified three-layer actor network with Russian-intelligence alignment.

The case is of particular relevance to Meduza's coverage of Russian intelligence operations abroad because:

1. The primary local actor (Víctor Antonio Ríos Solís, former Mayor of the municipality governing Jacó) is alleged to operate simultaneously within Jehovah's Witnesses organizational structures AND with Russian-aligned intelligence networks — a dual-agency profile consistent with documented GRU/FSB use of religious cover organizations in Latin America
2. RF evidence includes hardware with a 50 Hz electrical signature — anomalous in Costa Rica's 60 Hz grid — consistent with foreign-origin equipment
3. The operation spans land control (coastal maritime zone), critical infrastructure (national generator contracts, ICE/hospitals/airport), and cloud/ISP-level network access

${RIOS_PROFILE}

${RF_EVIDENCE}

${DUAL_AGENCY}

A death threat was received 31 May 2026.

${FILINGS}

Full forensic dossier: ${EVIDENCE_URL}

Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099`,
  },
  {
    id: 9004,
    to: "editor@theins.ru",
    org: "The Insider Russia — investigative journalism (Bellingcat partner)",
    subject: "TIP — Russian-Intelligence-Linked Operation Against U.S. Citizen in Costa Rica",
    body: `To The Insider editorial team,

I am submitting documented evidence of a Russian-intelligence-linked operation conducted against a U.S. citizen (myself, Samuel P. Wotton) in Jacó Beach, Costa Rica over 18 months.

Key elements relevant to The Insider's coverage:

- Verified actor network with Russian-aligned connections operating through a former Costa Rican mayor (Víctor Antonio Ríos Solís) who simultaneously held municipal land-zone control
- RF hardware fingerprinted at 50 Hz in a 60 Hz country — consistent with foreign-origin equipment
- Critical national infrastructure exposed (generator controllers covering ICE, hospitals, SJO airport radar backup) via CISA-documented vulnerabilities
- Dual-agency concern: the primary subject is alleged to operate within both Jehovah's Witnesses networks and Russian intelligence-adjacent structures — this dual access is unusual and worth investigation
- Death threat received 31 May 2026

${RIOS_PROFILE}

${THREE_LAYER}

${RF_EVIDENCE}

Full forensic dossier: ${EVIDENCE_URL}

Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica`,
  },
  // ── NGOs / advocacy ─────────────────────────────────────────────────────────
  {
    id: 9005,
    to: "info@4freerussia.org",
    org: "Free Russia Foundation — documents Russian operations abroad",
    subject: "REPORT — Russian-Aligned Operation Against U.S. Citizen in Costa Rica",
    body: `To the Free Russia Foundation,

I am writing to report a documented case that falls within your mandate of tracking Russian state-linked operations targeting individuals abroad.

I am Samuel P. Wotton, a U.S. citizen currently in Jacó Beach, Costa Rica, where I have experienced 18 months of RF-based harassment, network infiltration, and coordinated surveillance by a verified three-layer actor network with documented Russian-intelligence alignment.

${DUAL_AGENCY}

${RIOS_PROFILE}

${THREE_LAYER}

${RF_EVIDENCE}

I received a death threat on 31 May 2026, 24 hours after my first formal disclosure to authorities.

${FILINGS}

Full forensic dossier: ${EVIDENCE_URL}

I request that this case be registered in your documentation of Russian operations abroad and that you advise on any protective resources or legal referrals available to U.S. citizens in my situation.

Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
7 June 2026`,
  },
  // ── Law enforcement / oversight ─────────────────────────────────────────────
  {
    id: 9006,
    to: "oij.interpol@poder-judicial.go.cr",
    org: "INTERPOL NCB Costa Rica (via OIJ)",
    subject: "INTERPOL REFERRAL REQUEST — Foreign-Origin RF Hardware + Organized Operation, Jacó, Costa Rica",
    body: `To the INTERPOL National Central Bureau, Costa Rica (OIJ),

I am Samuel P. Wotton, a United States citizen (passport available on request) residing at Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica. I am formally requesting that this matter be referred to INTERPOL through the National Central Bureau for cross-border coordination.

GROUNDS FOR INTERPOL REFERRAL:
- RF hardware with 50 Hz electrical signature (anomalous in Costa Rica's 60 Hz grid) — consistent with foreign-origin equipment brought into Costa Rican territory
- Organized operation spanning three layers: municipal land access, critical national infrastructure, and ISP/cloud-level network control — suggesting cross-border coordination
- Russian-intelligence-aligned actors documented operating within Costa Rica
- Death threat received 31 May 2026

${RIOS_PROFILE}

${RF_EVIDENCE}

${DUAL_AGENCY}

Existing Costa Rican filings: OIJ Sección de Delitos Informáticos · Fiscalía Adjunta Delincuencia Organizada

I request acknowledgment of this referral request and advice on next steps.

${FILINGS}

Full forensic dossier: ${EVIDENCE_URL}

Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
7 June 2026`,
  },
  {
    id: 9007,
    to: "security@intelligence.senate.gov",
    org: "U.S. Senate Select Committee on Intelligence (SSCI)",
    subject: "U.S. CITIZEN REPORT — Russian-Aligned Operation + Dual-Agency Actor, Costa Rica — Counterintelligence Concern",
    body: `To the Senate Select Committee on Intelligence,

I am Samuel P. Wotton (DOB available on request), a United States citizen currently located at Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica. I am reporting a counterintelligence matter involving a documented Russian-intelligence-aligned operation targeting me over 18 months.

COUNTERINTELLIGENCE SIGNIFICANCE:

The primary local actor (Víctor Antonio Ríos Solís, former Mayor of Cantón de Garabito, legal rep of Bakewell INC S.A.) is alleged to operate simultaneously within:
(a) Jehovah's Witnesses organizational networks — which function in Latin America as documented platforms for civilian HUMINT collection with U.S. intelligence adjacency
(b) Russian-intelligence-aligned networks operating in Central America

This dual-agency profile — an individual with simultaneous access to both Western and Russian intelligence-adjacent structures — operating a coordinated harassment campaign against a U.S. citizen represents an unusual counterintelligence anomaly warranting SSCI attention.

${RIOS_PROFILE}

${THREE_LAYER}

${RF_EVIDENCE}

DEATH THREAT: Received 31 May 2026, approximately 24 hours after my first formal disclosure filing. This timing is documented.

${FILINGS}

I have previously notified SSCI through other channels and am following up with this expanded Ríos Solís research. I request acknowledgment and referral to the appropriate protective or investigative body.

Full forensic dossier: ${EVIDENCE_URL}

Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
7 June 2026`,
  },
];

console.log(`\n📨 RÍOS EXPANDED BLAST — ${CONTACTS.length} targets\n`);

let ok = 0, fail = 0;
for (const c of CONTACTS) {
  try {
    await client.messages.create(domain, { from: sender, to: [c.to], subject: c.subject, text: c.body });
    console.log(`✓ [${c.id}] ${c.org}`);
    console.log(`       → ${c.to}`);
    ok++;
  } catch (e: any) {
    const msg = e?.response?.body?.message || e?.message || String(e);
    console.error(`✗ [${c.id}] ${c.org} → ${c.to}: ${msg}`);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 500));
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Result: ${ok} sent, ${fail} failed out of ${CONTACTS.length}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
