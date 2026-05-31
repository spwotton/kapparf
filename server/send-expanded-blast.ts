// EXPANDED BLAST — doubling the whistleblower distribution
// Samuel Wotton — May 31 / June 1, 2026
import Mailgun from "mailgun.js";

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN || "echokappa.com";
if (!apiKey) { console.error("MAILGUN_API_KEY not set"); process.exit(1); }

const EVIDENCE_URL = "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev/evidence/DENUNCIA_SAM_WOTTON_20260530.html";

const SUBJECT = "INVESTIGATION TIP — Russian National, Drone Surveillance & RF Infrastructure Targeting U.S. Citizen in Jacó, Costa Rica | 17 Months Documented Evidence";

const BODY = `TO: Editorial / Tips / Investigations
FROM: Samuel Wotton, U.S. Citizen
DATE: May 31 / June 1, 2026

This is an unsolicited investigative tip involving documented surveillance operations
by a Russian national against a U.S. citizen in Costa Rica over 17+ months.

────────────────────────────────────────────
THE STORY IN BRIEF
────────────────────────────────────────────

LOCATION: Jacó, Garabito, Puntarenas, Costa Rica
SUBJECT: Samuel Wotton, U.S. Citizen (spwotton@gmail.com | +506 6377-3099)
PERPETRATOR: Russian national ("J"), ~12km south at Esterillos Oeste,
  operates multiple high-capability drones, no legitimate income source

WHAT IS DOCUMENTED (17+ months):
• Persistent drone surveillance across multiple residences in the Jacó corridor
• Unlicensed macro-antenna RF infrastructure operating at 50 Hz
  (foreign standard — Costa Rica uses 60 Hz) in the Jacó area
• Network forensics (PCAP): HiPerConTracer probes, ePDG Liberty routing,
  06:30 daily traffic spikes, real-time email interception confirmed
• Possible Italian defense-sector involvement (Leonardo S.p.A. / CSG SAR
  surveillance technology) linked to local infrastructure
• Russian national previously lived with subject for ~6 months in 2023;
  now operates independently with sophisticated surveillance equipment
• Death threat received May 31, 2026 immediately after subject filed
  reports with FBI, ICIG, and House Intelligence Committee (HPSCI)
• Strong indications of a honey trap operation via a Costa Rican ex-girlfriend
  who had extended intimate access to the subject

EVIDENCE ALREADY FILED WITH:
FBI Legal Attaché San José, DEA Costa Rica, State Dept. Diplomatic Security,
ICIG (Intelligence Community Inspector General), HPSCI, Fiscalía General
Costa Rica, OIJ Delitos Informáticos, MICITT, UN Human Rights Costa Rica,
Senate Select Committee on Intelligence (SSCI)

FULL FORENSIC DOSSIER (bilingual EN/ES, publicly accessible):
${EVIDENCE_URL}

────────────────────────────────────────────
WHY THIS MATTERS
────────────────────────────────────────────

This case documents what appears to be an active Russian intelligence operation
running out of a beach town in Costa Rica — using drone surveillance, RF
infrastructure, network intrusion, and human assets (honey trap) against a
U.S. citizen with no apparent geopolitical profile. If this is happening to
an ordinary American expat in Jacó, it is almost certainly not unique.

The Italian defense angle (Leonardo S.p.A. / CSG SAR) adds a second layer:
documented in our SIGINT platform's analysis of the local antenna infrastructure
and correlated with the Italy's Long Leash investigative report already
distributed to 300+ journalists and oversight bodies.

────────────────────────────────────────────
CONTACT
────────────────────────────────────────────

Samuel Wotton
Hotel Pochote Grande, Jacó, Costa Rica
spwotton@gmail.com | +506 6377-3099
Evidence: ${EVIDENCE_URL}
`;

interface C { id: number; to: string; org: string; }

const CONTACTS: C[] = [
  // ── ORGANIZED CRIME & LATAM INVESTIGATIVE ──────────────────────────────────
  { id: 6001, to: "contact@insightcrime.org",      org: "InSight Crime — Latin America Organized Crime" },
  { id: 6002, to: "tips@occrp.org",                org: "OCCRP — Organized Crime & Corruption Reporting Project" },
  { id: 6003, to: "contact@icij.org",              org: "ICIJ — International Consortium Investigative Journalists" },
  { id: 6004, to: "tips@globalwitness.org",         org: "Global Witness" },
  { id: 6005, to: "connectas@connectas.org",        org: "CONNECTAS — Latin America Investigative Network" },
  { id: 6006, to: "redaccion@elfaro.net",           org: "El Faro — Central America Investigative" },
  { id: 6007, to: "info@larepublica.net",           org: "La República Costa Rica" },
  { id: 6008, to: "tips@univision.com",             org: "Univision Investiga" },
  { id: 6009, to: "opinion@ticotimes.net",          org: "The Tico Times — English CR press" },
  { id: 6010, to: "redaccion@ameliarueda.com",      org: "Amelia Rueda — CR digital media" },
  { id: 6011, to: "redaccion@crhoy.com",            org: "CRHoy — Costa Rica news" },
  { id: 6012, to: "tips@laprensalibre.cr",          org: "La Prensa Libre Costa Rica" },
  { id: 6013, to: "info@monitoreodemedios.cr",      org: "Monitoreodemedios.cr" },
  { id: 6014, to: "info@semanarioelpais.com",       org: "Semanario El País Costa Rica" },
  { id: 6015, to: "redaccion@diarioextra.com",      org: "Diario Extra Costa Rica" },

  // ── US MILITARY / INTELLIGENCE OVERSIGHT ──────────────────────────────────
  { id: 6020, to: "pa@southcom.mil",                org: "U.S. Southern Command (SOUTHCOM) Public Affairs" },
  { id: 6021, to: "ofac_feedback@treasury.gov",     org: "OFAC / U.S. Treasury — sanctions enforcement" },
  { id: 6022, to: "nctc@nctc.gov",                  org: "National Counterterrorism Center (NCTC)" },
  { id: 6023, to: "dia-pao@dia.mil",                org: "Defense Intelligence Agency (DIA)" },
  { id: 6024, to: "contact@intelligence.senate.gov",org: "SSCI Staff — Senate Intelligence (alternate)" },
  { id: 6025, to: "hfac@mail.house.gov",            org: "House Foreign Affairs Committee" },
  { id: 6026, to: "contact@foreign.senate.gov",     org: "Senate Foreign Relations Committee" },
  { id: 6027, to: "sasc.information@armed-services.senate.gov", org: "Senate Armed Services Committee" },

  // ── EUROPEAN INTELLIGENCE ADJACENT / RUSSIA-TRACKING ────────────────────
  { id: 6030, to: "press@kapo.ee",                  org: "KAPO — Estonian Internal Security Service (most active on Russian ops)" },
  { id: 6031, to: "tips@re-check.ru",               org: "Re:Check — Russian fact-checking / disinfo tracking" },
  { id: 6032, to: "redaction@theins.press",         org: "The Insider Press (alternate address)" },
  { id: 6033, to: "contact@gulagunet.com",          org: "Gulagu.net — Russian rights / intelligence whistleblowers" },
  { id: 6034, to: "info@irf.ru",                    org: "Institute for Russian Federation Studies" },
  { id: 6035, to: "editor@4freerussia.org",         org: "Forum for Free Russia" },
  { id: 6036, to: "info@ilga-europe.org",           org: "ILGA-Europe (documents Russian state actors in Europe)" },

  // ── MAJOR INTERNATIONAL PRESS ─────────────────────────────────────────────
  { id: 6040, to: "tips@reuters.com",               org: "Reuters Investigates" },
  { id: 6041, to: "tips@bloomberg.com",             org: "Bloomberg Investigative" },
  { id: 6042, to: "tips@ft.com",                    org: "Financial Times Tips" },
  { id: 6043, to: "tips@theguardian.com",           org: "The Guardian Tips" },
  { id: 6044, to: "tips@bbc.com",                   org: "BBC News Tips" },
  { id: 6045, to: "investigations@aljazeera.net",   org: "Al Jazeera Investigative Unit" },
  { id: 6046, to: "tips@deutschewelle.de",          org: "Deutsche Welle Tips" },
  { id: 6047, to: "tips@spiegel.de",                org: "Der Spiegel Tips" },
  { id: 6048, to: "tips@lemonde.fr",                org: "Le Monde Investigations" },
  { id: 6049, to: "tips@liberation.fr",             org: "Libération Tips" },
  { id: 6050, to: "investigacion@elpais.com",       org: "El País Investigación" },
  { id: 6051, to: "tips@corriere.it",               org: "Corriere della Sera Tips (Italian angle)" },
  { id: 6052, to: "tips@repubblica.it",             org: "La Repubblica Tips (Italian angle)" },
  { id: 6053, to: "redazione@ilfattoquotidiano.it", org: "Il Fatto Quotidiano (Italian investigative)" },
  { id: 6054, to: "tips@expatica.com",              org: "Expatica — expat community reach" },
  { id: 6055, to: "tips@cnn.com",                   org: "CNN Tips" },
  { id: 6056, to: "tips@nbcnews.com",               org: "NBC News Investigations" },
  { id: 6057, to: "tips@cbsnews.com",               org: "CBS News Investigations" },
  { id: 6058, to: "tips@abcnews.com",               org: "ABC News Tips" },
  { id: 6059, to: "tips@msnbc.com",                 org: "MSNBC Tips" },
  { id: 6060, to: "tips@usatoday.com",              org: "USA Today Investigations" },
  { id: 6061, to: "tips@latimes.com",               org: "Los Angeles Times Tips" },
  { id: 6062, to: "tips@bostonglobe.com",           org: "Boston Globe Tips" },
  { id: 6063, to: "tips@chicagotribune.com",        org: "Chicago Tribune Tips" },
  { id: 6064, to: "tips@rollingstone.com",          org: "Rolling Stone Investigations" },
  { id: 6065, to: "tips@thedailybeast.com",         org: "The Daily Beast Tips" },
  { id: 6066, to: "tips@motherjones.com",           org: "Mother Jones Investigations" },
  { id: 6067, to: "tips@thenation.com",             org: "The Nation Tips" },
  { id: 6068, to: "tips@harpers.org",               org: "Harper's Magazine Tips" },
  { id: 6069, to: "tips@nymag.com",                 org: "New York Magazine Tips" },
  { id: 6070, to: "tips@newyorker.com",             org: "The New Yorker Tips" },
  { id: 6071, to: "tips@vanityfair.com",            org: "Vanity Fair Tips" },
  { id: 6072, to: "tips@theatlantic.com",           org: "The Atlantic Tips" },
  { id: 6073, to: "tips@slate.com",                 org: "Slate Tips" },
  { id: 6074, to: "tips@salon.com",                 org: "Salon Tips" },
  { id: 6075, to: "tips@rawstory.com",              org: "Raw Story Tips" },
  { id: 6076, to: "tips@dailykos.com",              org: "Daily Kos Tips" },
  { id: 6077, to: "tips@huffpost.com",              org: "HuffPost Tips" },
  { id: 6078, to: "tips@axios.com",                 org: "Axios Investigations" },
  { id: 6079, to: "tips@buzzfeednews.com",          org: "BuzzFeed News Tips" },

  // ── THINK TANKS / POLICY ──────────────────────────────────────────────────
  { id: 6080, to: "info@carnegieendowment.org",     org: "Carnegie Endowment for International Peace" },
  { id: 6081, to: "contact@wilsoncenter.org",       org: "Wilson Center — Latin America Program" },
  { id: 6082, to: "media@freedomhouse.org",         org: "Freedom House" },
  { id: 6083, to: "media@hrw.org",                  org: "Human Rights Watch" },
  { id: 6084, to: "info@transparency.org",          org: "Transparency International" },
  { id: 6085, to: "info@ned.org",                   org: "National Endowment for Democracy" },
  { id: 6086, to: "info@csis.org",                  org: "Center for Strategic and International Studies (CSIS)" },
  { id: 6087, to: "info@rand.org",                  org: "RAND Corporation" },
  { id: 6088, to: "info@atlanticcouncil.org",       org: "Atlantic Council — Russia program" },
  { id: 6089, to: "info@fpri.org",                  org: "Foreign Policy Research Institute" },

  // ── LEGAL / WHISTLEBLOWER ─────────────────────────────────────────────────
  { id: 6090, to: "info@whistleblower.org",         org: "Government Accountability Project" },
  { id: 6091, to: "info@whistlebloweraid.org",      org: "Whistleblower Aid" },
  { id: 6092, to: "contact@nwc.org",                org: "National Whistleblower Center" },
  { id: 6093, to: "tips@projectongovernment.org",   org: "Project On Government Oversight (POGO)" },
  { id: 6094, to: "info@publicintegrity.org",       org: "Center for Public Integrity" },
  { id: 6095, to: "contact@maplight.org",           org: "MapLight Investigations" },

  // ── DIGITAL RIGHTS / SURVEILLANCE ────────────────────────────────────────
  { id: 6096, to: "press@torproject.org",           org: "Tor Project (surveillance documentation)" },
  { id: 6097, to: "info@privacyinternational.org",  org: "Privacy International (already in blast — reinforcement)" },
  { id: 6098, to: "press@accessnow.org",            org: "Access Now (already in blast — reinforcement)" },
  { id: 6099, to: "info@apc.org",                   org: "Association for Progressive Communications (APC)" },
  { id: 6100, to: "info@article19.org",             org: "Article 19 — freedom of expression" },

  // ── EXPAT / COSTA RICA COMMUNITY ─────────────────────────────────────────
  { id: 6101, to: "info@arcr.cr",                   org: "ARCR — Association of Residents of Costa Rica" },
  { id: 6102, to: "editor@qcostarica.com",          org: "Q Costa Rica — English-language CR news" },
  { id: 6103, to: "info@costaricastar.com",         org: "Costa Rica Star — expat news" },
  { id: 6104, to: "tips@bestplacesintheworldtoretire.com", org: "Best Places in the World to Retire (large expat audience)" },
];

const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: apiKey });
const sender = "Operational Insider <hello@echokappa.com>";

console.log(`\n📡 EXPANDED BLAST — ${CONTACTS.length} new targets\n`);

let ok = 0, fail = 0;
for (const c of CONTACTS) {
  try {
    const r = await client.messages.create(domain, {
      from: sender, to: [c.to], subject: SUBJECT,
      text: `[${c.org}]\n\n${BODY}`,
    });
    console.log(`✓ [${c.id}] ${c.org} → ${c.to}`);
    ok++;
  } catch (e: any) {
    const msg = e?.response?.body?.message || e?.message || String(e);
    console.error(`✗ [${c.id}] ${c.org} → ${c.to}: ${msg}`);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 350));
}

console.log(`\nResult: ${ok} sent, ${fail} failed out of ${CONTACTS.length}\n`);
