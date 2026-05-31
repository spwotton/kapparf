// Russia-side escalation blast — Samuel Wotton — May 31, 2026
import Mailgun from "mailgun.js";

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN || "echokappa.com";
if (!apiKey) { console.error("MAILGUN_API_KEY not set"); process.exit(1); }

const EVIDENCE_URL = "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev/evidence/DENUNCIA_SAM_WOTTON_20260530.html";

const SUBJECT_MEDIA = "TIPS — Russian National Conducting Drone Surveillance & Death Threats Against U.S. Citizen in Costa Rica";
const SUBJECT_EMBASSY = "Formal Notification — Russian National Under Investigation for Harassment & Death Threats, Jacó, Costa Rica";
const SUBJECT_NGO = "URGENT — Russian National Implicated in 17-Month Harassment Campaign & Death Threats Against U.S. Citizen in Costa Rica";

const CORE = `
Samuel Wotton — U.S. Citizen (Passport 5230633969, DOB June 28 1990)
Location: Hotel Pochote Grande, Jacó, Garabito, Puntarenas, Costa Rica
Contact: spwotton@gmail.com | +506 6377-3099
Date: May 31, 2026

────────────────────────────────────────────
SUMMARY
────────────────────────────────────────────

I am a U.S. citizen residing in Jacó, Costa Rica, who has been subjected to
17+ months of documented multi-vector surveillance and harassment by a Russian
national, culminating tonight in an explicit death threat.

RUSSIAN NATIONAL INVOLVED:
A Russian national ("J") — who lived with me for approximately 6 months in 2023
in Jacó — now resides approximately 12 km south in Esterillos Oeste. He operates
multiple high-capability commercial drones with no visible legitimate income.
Drone surveillance activity has been tracked from Playa Hermosa to Esterillos
Oeste, consistent with persistent monitoring of my location and movements.

TONIGHT'S DEATH THREAT (May 31, 2026):
Following my submission of formal intelligence reports to the U.S. Embassy, the
Intelligence Community Inspector General, and the House Permanent Select
Committee on Intelligence, I received a verbal threat: "You just made the
biggest mistake of your life." I was subsequently told I would be killed.

The timing — immediately after emailing intelligence agencies — confirms that my
communications are being intercepted in real time (documented via PCAP network
analysis).

DOCUMENTED EVIDENCE:
- Drone surveillance logs with GPS tracking
- RF spectrum anomalies: unlicensed macro-antenna infrastructure in the Jacó area
- ELF signals at 50 Hz (foreign standard) vs Costa Rica's 60 Hz grid
- PCAP network forensics: HiPerConTracer probes, ePDG Liberty routing, Samsung
  DTIgnite telemetry, 06:30 daily traffic spikes — all consistent with active
  device monitoring
- 17-month timeline of incidents

Full bilingual forensic dossier (EN/ES):
${EVIDENCE_URL}

I am requesting investigation, exposure, and any available protection.
Reports have been simultaneously filed with: FBI Legal Attaché San José,
DEA Costa Rica, State Dept. Diplomatic Security, OIJ Delitos Informáticos,
Fiscalía General Costa Rica, and ICIG.

Samuel Wotton
Jacó, Costa Rica | May 31, 2026
`;

const EMBASSY_BODY = `
To the Embassy of the Russian Federation,

I am writing to formally notify you that a Russian national residing in
Costa Rica (Esterillos Oeste, Puntarenas province) is under investigation by
Costa Rican and U.S. federal authorities in connection with a sustained
17-month harassment and surveillance campaign against a U.S. citizen, and has
issued an explicit death threat as of May 31, 2026.

This notification is being provided in the interest of transparency and to
create a formal diplomatic record. The Russian national in question operated
drone surveillance equipment, unlicensed RF infrastructure, and demonstrated
real-time access to my private electronic communications.

This matter has been reported to the U.S. Embassy San José, FBI Legal Attaché,
DEA, State Dept. Diplomatic Security, the Intelligence Community Inspector
General, and Costa Rican federal judicial authorities (OIJ, Fiscalía General).

Full forensic documentation:
${EVIDENCE_URL}

Samuel Wotton
U.S. Citizen | Passport 5230633969
Hotel Pochote Grande, Jacó, Costa Rica
spwotton@gmail.com | +506 6377-3099
`;

interface Contact {
  id: number;
  to: string;
  org: string;
  subject: string;
  body: string;
}

const CONTACTS: Contact[] = [
  // Russian investigative media — cover GRU/FSB operations
  {
    id: 5001,
    to: "tips@theins.ru",
    org: "The Insider (Russia) — Roman Dobrokhotov",
    subject: SUBJECT_MEDIA,
    body: `The Insider investigates Russian intelligence operations globally.\n\n${CORE}`,
  },
  {
    id: 5002,
    to: "tip@istories.media",
    org: "iStories (Important Stories) — Russia",
    subject: SUBJECT_MEDIA,
    body: `iStories investigates Russian government operations abroad.\n\n${CORE}`,
  },
  {
    id: 5003,
    to: "tips@meduza.io",
    org: "Meduza — Independent Russian Investigative Outlet",
    subject: SUBJECT_MEDIA,
    body: `Meduza covers Russian state operations and persons of interest.\n\n${CORE}`,
  },
  // Anti-corruption / Russian national tracking
  {
    id: 5004,
    to: "info@freerussia.org",
    org: "Free Russia Foundation — Washington D.C.",
    subject: SUBJECT_NGO,
    body: `Free Russia Foundation documents Russian state actors operating abroad.\n\n${CORE}`,
  },
  {
    id: 5005,
    to: "info@dossier.center",
    org: "The Dossier Center (Khodorkovsky) — tracks Russian intelligence abroad",
    subject: SUBJECT_NGO,
    body: `The Dossier Center investigates Russian intelligence personnel operating outside Russia.\n\n${CORE}`,
  },
  // Russian embassies — formal notification for diplomatic record
  {
    id: 5006,
    to: "embrus@cablenet.com.ni",
    org: "Russian Embassy — Managua, Nicaragua (accredited to Central America)",
    subject: SUBJECT_EMBASSY,
    body: EMBASSY_BODY,
  },
  // SSCI — Senate intelligence oversight
  {
    id: 5007,
    to: "intelligence@intelligence.senate.gov",
    org: "U.S. Senate Select Committee on Intelligence (SSCI)",
    subject: "URGENT — U.S. Citizen Under Death Threat from Russian National in Costa Rica",
    body: `To the Senate Select Committee on Intelligence,\n\nI am a U.S. citizen under active death threat in Costa Rica from a Russian national with apparent ties to organized surveillance infrastructure. This matter has been reported to the FBI Legal Attaché, DEA, ICIG, and State Dept. Diplomatic Security. I am requesting congressional awareness and oversight.\n\n${CORE}`,
  },
  // Bellingcat Russia desk (Christo Grozev successor team)
  {
    id: 5008,
    to: "tips@bellingcat.com",
    org: "Bellingcat — Russia/GRU desk (re-send with Russian angle emphasized)",
    subject: SUBJECT_MEDIA,
    body: `Bellingcat has documented GRU and FSB operations globally. This case involves a Russian national in Costa Rica conducting drone surveillance and issuing death threats against a U.S. citizen.\n\n${CORE}`,
  },
];

const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: apiKey });
const sender = "Samuel Wotton <hello@echokappa.com>";

console.log(`\n🚨 RUSSIA ESCALATION BLAST — ${CONTACTS.length} targets\n`);

let ok = 0, fail = 0;
for (const c of CONTACTS) {
  try {
    const r = await client.messages.create(domain, {
      from: sender, to: [c.to], subject: c.subject, text: c.body,
    });
    console.log(`✓ [${c.id}] ${c.org} → ${c.to}  msgId=${r.id}`);
    ok++;
  } catch (e: any) {
    const msg = e?.response?.body?.message || e?.message || String(e);
    console.error(`✗ [${c.id}] ${c.org} → ${c.to}: ${msg}`);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 500));
}

console.log(`\nResult: ${ok} sent, ${fail} failed out of ${CONTACTS.length}\n`);
