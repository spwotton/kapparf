// URGENT — Death threat escalation blast
// Samuel Wotton — May 31, 2026
import Mailgun from "mailgun.js";

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN || "echokappa.com";
if (!apiKey) { console.error("MAILGUN_API_KEY not set"); process.exit(1); }

const EVIDENCE_URL = "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev/evidence/DENUNCIA_SAM_WOTTON_20260530.html";

const SUBJECT = "URGENT — U.S. Citizen Under Active Death Threat in Jacó, Costa Rica — Samuel Wotton";

const BODY = `TO: Law Enforcement / Diplomatic Security / Oversight
FROM: Samuel Wotton, U.S. Citizen
DATE: May 31, 2026
RE: Active death threat — immediate attention requested

─────────────────────────────────────────────
SITUATION SUMMARY
─────────────────────────────────────────────

I am a U.S. citizen (Passport 5230633969, DOB June 28 1990) currently residing at:

  Hotel Pochote Grande
  Jacó, Garabito, Puntarenas, Costa Rica
  Contact: spwotton@gmail.com | +506 6377-3099

I am writing to report that I have received an explicit death threat tonight
(May 31, 2026) and am requesting urgent intervention.

─────────────────────────────────────────────
TONIGHT'S DEATH THREAT — MAY 31, 2026
─────────────────────────────────────────────

Earlier this evening (~19:10 local time) I received a verbal threat:
"You just made the biggest mistake of your life."

Subsequently — within the same evening — I was explicitly told I would be killed.

These threats came immediately after I began sending formal intelligence reports
to U.S. Embassy San José, the Intelligence Community Inspector General (ICIG),
the House Permanent Select Committee on Intelligence (HPSCI), and Costa Rican
judicial authorities regarding 17+ months of documented surveillance harassment.

The timing is not coincidental. It demonstrates that my electronic communications
are being intercepted in real time — consistent with documented network-layer
packet analysis showing active monitoring of my device traffic on the hotel
network.

─────────────────────────────────────────────
BACKGROUND — 17 MONTHS OF DOCUMENTED HARASSMENT
─────────────────────────────────────────────

Since approximately January 2025, I have been subjected to a sustained,
multi-vector harassment and surveillance campaign in Jacó, Costa Rica involving:

1. RUSSIAN NATIONAL INVOLVEMENT
   A Russian national ("J") who lived with me for approximately 6 months in 2023
   in Jacó now resides in Esterillos Oeste (~12 km south). He operates multiple
   high-capability commercial drones with no legitimate income source. Drone
   activity has been tracked from Playa Hermosa to Esterillos Oeste consistent
   with surveillance patterns over my movements.

2. DRONE SURVEILLANCE
   Persistent drone overflights targeting my location across multiple residences
   and hotels throughout the Jacó corridor.

3. RF INFRASTRUCTURE
   Anomalous unlicensed macro-antenna infrastructure documented in the area,
   operating outside Costa Rican MICITT licensing. ELF signal anomalies (50 Hz
   vs. Costa Rica's 60 Hz standard) have been captured in scan data, suggesting
   foreign-origin equipment.

4. NETWORK INTRUSION
   Packet capture (PCAP) analysis documents: 06:30 daily traffic spikes,
   HiPerConTracer probes, ePDG Liberty routing, Facebook Netseer tracking,
   Samsung DTIgnite telemetry — all consistent with active device monitoring.

5. CORRUPT LOCAL ENFORCEMENT
   I have reason to believe local Fuerza Pública in the Garabito/Jacó area
   may be compromised. I am therefore bypassing local police entirely and
   escalating directly to federal and international authorities.

─────────────────────────────────────────────
FORMAL EVIDENCE RECORD
─────────────────────────────────────────────

A complete bilingual forensic dossier (Spanish/English) is available at:

  ${EVIDENCE_URL}

This includes: network forensics, RF scan data, ELF spectrogram analysis,
satellite correlation data, full timeline of events, and all logged threats.

─────────────────────────────────────────────
WHAT I AM REQUESTING
─────────────────────────────────────────────

1. Urgent welfare check and contact from U.S. Embassy San José ACS unit
2. FBI investigation into the Russian national and surveillance infrastructure
3. Coordination with OIJ (Costa Rica federal investigative police) — NOT
   local Fuerza Pública
4. Any protective measures available to a U.S. citizen abroad under active threat

I am available immediately at:
  Phone: +506 6377-3099
  Email: spwotton@gmail.com
  Location: Hotel Pochote Grande, Jacó, Costa Rica

─────────────────────────────────────────────

This communication is being simultaneously sent to multiple U.S. government
agencies, Costa Rican federal authorities, and media outlets as a safety measure.
The full evidence record is publicly accessible at the URL above.

Samuel Wotton
U.S. Citizen | Passport 5230633969
Jacó, Costa Rica | May 31, 2026
`;

const CONTACTS = [
  { id: 4001, to: "legatsanjose@fbi.gov",     org: "FBI Legal Attaché — San José" },
  { id: 4002, to: "sanjose.country@dea.gov",  org: "DEA Costa Rica Country Office" },
  { id: 4003, to: "DS-TIP@state.gov",         org: "State Dept. Diplomatic Security — TIP" },
  { id: 4004, to: "hchr@hchr.or.cr",          org: "UN Human Rights — Costa Rica" },
  { id: 4005, to: "acssanjose@state.gov",     org: "U.S. Embassy San José — ACS (re-alert)" },
];

const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: apiKey });
const sender = "Samuel Wotton <hello@echokappa.com>";

console.log(`\n🚨 DEATH THREAT ALERT BLAST — ${CONTACTS.length} targets\n`);

let ok = 0, fail = 0;
for (const c of CONTACTS) {
  try {
    const r = await client.messages.create(domain, {
      from: sender, to: [c.to], subject: SUBJECT, text: BODY,
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
