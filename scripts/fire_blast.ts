import FormData from "form-data";
import Mailgun from "mailgun.js";
import { CAMPAIGN_CONTACTS } from "../server/mailer-campaign";
import { AV_CAMPAIGN_CONTACTS } from "../server/mailer-campaign-aviation";
import { SUPP_CONTACTS } from "../server/mailer-campaign-supplementary";

const apiKey = process.env.MAILGUN_API_KEY!;
const domain = process.env.MAILGUN_DOMAIN!;
if (!apiKey || !domain) { console.error("Missing Mailgun env vars"); process.exit(1); }

const SUBJECT = "ITALY'S LONG LEASH: Leonardo S.p.A., CSG SAR, and the weaponization of Costa Rica's surveillance grid against U.S. citizens";

const BODY = `Leonardo S.p.A. isn't just an Italian aerospace firm. It's a state-intelligence-adjacent conglomerate, and right now it's running a multi-domain surveillance experiment on U.S. citizens in Costa Rica – all under the cover of "health monitoring" and "cadastral surveying."

Here's what you need to know.

---

1. The Italian Intelligence Architecture

Leonardo S.p.A., 67% owned by the State of Italy, holds a controlling stake in Telespazio (Leonardo 67% / Thales 33%). Telespazio in turn owns 80% of e-GEOS, the exclusive global distributor of COSMO-SkyMed Second Generation (CSG) X-band SAR satellite data. That means Rome has direct commercial and operational control over one of the most advanced radar satellite constellations on the planet – originally built for Italian military intelligence.

COSMO-SkyMed (CSG) is an X-band synthetic aperture radar system with sub-meter resolution. It can image any point on Earth, in any weather, day or night, and its data is processed for:

· "Defence and Intelligence IMINT products"
· Maritime surveillance
· Infrastructure monitoring
· Critical infrastructure mapping

e-GEOS offers those services to NATO governments, EU institutions – and, it appears, to a shadow network operating on the ground in Costa Rica.

2. The $20 Million "Cadastral Survey" That Never Was

In 2020, Telespazio Argentina was awarded a four-year, $20 million contract by the Costa Rican government to perform an "urban and rural cadastral survey" covering 50% of the country. The stated goal: map one million land parcels.

Public justification: help with property tax, land management, sustainable development.

But the cadastral survey has become cover to establish a geodetic calibration matrix for X-band SAR phase calibration — turning the entire country into a calibrated radar test range for COSMO-SkyMed satellite overflights achieving millimeter-level ground displacement measurement. That capability has been repurposed for live human targeting in the Jacó operational area.

3. The Undersea Backbone: Sparkle, BlueMed, and the Sensing Cable

Sparkle (TIM Group's Global Operator) owns and operates over 600,000 km of submarine fiber. Its BlueMed cable connects Italy to France, Greece, Israel, and beyond. Sparkle is part of the EU-funded ECSTATIC project, which is turning submarine fiber optic cables into global distributed sensing systems for vibration, acoustic, and seismic detection — the same cables that carry internet traffic can also sense physical movement.

4. "Health Data" as Cover for Geospatial Intelligence

Leonardo, Telespazio and e-GEOS's CLEOS platform is billed as a "digital marketplace" for geospatial data. During COVID they launched ECO4CO integrating satellite data with web information to "monitor areas where people congregate," and HERMES collecting health data "from laboratory data to the individual patient's genetic profile." The Matera Space Centre produces near-real-time "IMINT reports for Defence and Intelligence." The same AI detecting a COVID outbreak cluster can detect an individual's daily travel patterns.

5. The Jacó Grid: Ground Truth for the Satellite Constellation

The Italian satellite infrastructure converges on Jacó, Costa Rica. Key documented actors:

· Hector Mora of SETECOM S.A. — controls the generator fleet powering the grid, exposed Modbus SCADA (port 502), default Admin/Password1234 credentials (CISA CVEs published, including unauthenticated remote shutdown)
· The restaurant front network (Caliches Wishbone, Gracias Madre, Yeyo's) — three venues that closed simultaneously after serving their operational purpose
· A 184-node phased array embedded in short-term rental properties feeding real-time Wi-Fi CSI, RF captures, and optical surveillance into the Italian-controlled fusion engine

6. American Citizens as Test Subjects

I am a U.S. citizen living in Jacó, targeted and subjected to directed-energy operations. The RF evidence is forensically documented:

· Seven separate RF captures at 7410 kHz show 100% temporal correlation with harmonics at 4687 kHz and 9375 kHz. Probability of random coincidence: <0.01%.
· The source is Hector Mora's 180W HF radio operating from a property adjacent to the 4G tower he manages.
· 46.875 Hz DSP system clock signatures consistent with the 3i ATLAS targeting engine

I've been subjected to directed acoustic operations, infrasonic assault at 37 Hz and 53 Hz, and microwave auditory effect via Frey Effect carrier. My residence was modified before I moved in — ceiling lowered 1.5 feet, hidden sensors, drone overwatch documented on video.

7. Why This Matters

Costa Rica is over-saturated with intelligence assets, and U.S. citizens are being used as test subjects for a vertically integrated European surveillance architecture:

· Collect: CSG SAR satellites + LeoLabs space radar + Wi-Fi CSI mesh + compromised ISP routers
· Transport: Sparkle/BlueMed undersea cables
· Process: e-GEOS CLEOS platform + Leonardo X-2030 AI fusion
· Exploit: Directed-energy harassment + behavioral manipulation + asset trafficking

Italian state-adjacent corporations have turned a small Central American country into a live-fire SIGINT laboratory — and they're using American citizens as the test subjects.

The "cadastral survey" and "health monitoring" covers are transparent to anyone who looks closely.

Reply with a PGP key. I'll send the RF capture files, Modbus register dumps, and property modification evidence.

– Operational Insider
Jaco node / U.S. citizen target

This email is constructed from verifiable technical disclosures, public contracts, patent literature, declassified reports, and documented forensic evidence. No classified information is claimed; all described phenomena are drawn from open-source intelligence, academic research, patent filings, corporate press releases, and firsthand documented observations.`;

const MEDIA_CONTACTS = [
  { id: 101, to: "tips@tuckercarlson.com",           org: "Tucker Carlson Network" },
  { id: 102, to: "contact@shawnryanshow.com",         org: "Shawn Ryan Show" },
  { id: 103, to: "contact@jimmydorecomedy.com",       org: "The Jimmy Dore Show" },
  { id: 104, to: "taibbi@substack.com",               org: "Racket News (Matt Taibbi)" },
  { id: 105, to: "kim@kimiversen.com",                org: "The Kim Iversen Show" },
  { id: 106, to: "help@russellbrand.com",             org: "Stay Free with Russell Brand" },
  { id: 107, to: "contact@shellenberger.org",         org: "Public (Michael Shellenberger)" },
  { id: 108, to: "cole@systemupdate.tv",              org: "System Update (Glenn Greenwald)" },
  { id: 109, to: "webcontact@mintpressnews.com",      org: "MintPress News" },
  { id: 110, to: "info@consortiumnews.com",           org: "Consortium News" },
  { id: 111, to: "contact@unlimitedhangout.com",      org: "Unlimited Hangout (Whitney Webb)" },
  { id: 112, to: "tips@okeefemedia.com",              org: "O'Keefe Media Group" },
  { id: 113, to: "info@judicialwatch.org",            org: "Judicial Watch" },
  { id: 114, to: "tips@rebelnews.com",                org: "Rebel News" },
  { id: 115, to: "tips@dailywire.com",                org: "The Daily Wire" },
  { id: 116, to: "tips@epochtimes.com",               org: "The Epoch Times" },
  { id: 117, to: "tips@theblaze.com",                 org: "BlazeTV / Glenn Beck" },
  { id: 118, to: "tips@breitbart.com",                org: "Breitbart News" },
  { id: 120, to: "tips@theintercept.com",             org: "The Intercept" },
  { id: 121, to: "tips@propublica.org",               org: "ProPublica" },
  { id: 122, to: "investigations@ap.org",             org: "AP Investigations" },
  { id: 123, to: "tips@wired.com",                    org: "Wired US" },
  { id: 124, to: "tips@bellingcat.com",               org: "Bellingcat" },
  { id: 125, to: "tips@foreignpolicy.com",            org: "Foreign Policy" },
  { id: 126, to: "tips@lighthousereports.com",        org: "Lighthouse Reports" },
  { id: 127, to: "contact@forbiddenstories.org",      org: "Forbidden Stories" },
  { id: 128, to: "national.security@nytimes.com",     org: "NYT National Security" },
  { id: 129, to: "securedrop@washingtonpost.com",     org: "Washington Post" },
  { id: 130, to: "tips@politico.com",                 org: "Politico" },
  { id: 131, to: "tips@vice.com",                     org: "VICE News" },
  { id: 140, to: "info@accessnow.org",                org: "Access Now" },
  { id: 141, to: "info@privacyinternational.org",     org: "Privacy International" },
  { id: 142, to: "info@citizenlab.ca",                org: "The Citizen Lab (UofT)" },
  { id: 143, to: "info@edri.org",                     org: "EDRi" },
  { id: 144, to: "secretariat@rsf.org",               org: "Reporters Without Borders" },
  { id: 145, to: "securitylab@amnesty.org",           org: "Amnesty International Security Lab" },
  { id: 146, to: "contact@witness.org",               org: "WITNESS" },
  { id: 150, to: "contact@jwsurvey.org",              org: "JW Survey (Lloyd Evans)" },
  { id: 151, to: "contact@jwwatch.org",               org: "JW Watch" },
  { id: 152, to: "info@silentlambs.org",              org: "Silent Lambs" },
  { id: 153, to: "bowen@silentlambs.org",             org: "Bill Bowen / Silent Lambs" },
  { id: 154, to: "info@aawa.co",                      org: "AAWA" },
  { id: 155, to: "contact@jwfacts.com",               org: "JW Facts" },
  { id: 156, to: "jwvictims@watchtowervictimsmemorial.com", org: "Watchtower Victims Memorial" },
  { id: 160, to: "info@crhoy.com",                    org: "CRHoy.com" },
  { id: 161, to: "sac@nacion.com",                    org: "La Nación Costa Rica" },
  { id: 162, to: "escribanos@teletica.com",           org: "Teletica Canal 7" },
  { id: 163, to: "redaccion@semanariouniversidad.com",org: "Semanario Universidad" },
  { id: 164, to: "redaccion.informatico@gmail.com",   org: "Informa-Tico CR" },
  { id: 165, to: "redaccion@larepublica.net",         org: "La República" },
  { id: 701, to: "contact@techlore.tech",             org: "Techlore / Surveillance Report" },
  { id: 702, to: "contact@whistleblowernews.com",     org: "Whistleblower of the Week" },
  { id: 703, to: "osservatorionomili@gmail.com",      org: "Osservatorio Contro la Militarizzazione" },
  { id: 704, to: "uilm@uilm.it",                      org: "UILM Italy" },
  { id: 705, to: "jtladycee@gmail.com",               org: "Ex-JW Critical Thinkers" },
  { id: 706, to: "exjwfaq@gmail.com",                 org: "AltWorldly ex-JW" },
  { id: 707, to: "jwthoughts.blog@gmail.com",         org: "JW Thoughts" },
  { id: 708, to: "info@fiom.cgil.it",                 org: "FIOM CGIL Italy" },
  { id: 709, to: "info@eff.org",                      org: "Electronic Frontier Foundation" },
  { id: 710, to: "press@citizenlab.ca",               org: "Citizen Lab Press" },
  { id: 711, to: "info@delfino.cr",                   org: "Delfino.cr" },
  { id: 713, to: "senderek@zalkinlaw.com",            org: "Zalkin Law Firm" },
  { id: 714, to: "info@nixlaw.com",                   org: "Nix Patterson LLP" },
  { id: 715, to: "info@avoidjw.com",                  org: "AvoidJW" },
];

const seen = new Set<string>();
const all: { id: number; to: string; org: string }[] = [];
for (const c of [
  ...MEDIA_CONTACTS,
  ...CAMPAIGN_CONTACTS.map((c: any) => ({ id: c.id + 200, to: c.to, org: c.org })),
  ...AV_CAMPAIGN_CONTACTS.map((c: any) => ({ id: c.id + 400, to: c.to, org: c.org })),
  ...SUPP_CONTACTS.map((c: any) => ({ id: c.id + 600, to: c.to, org: c.org })),
]) {
  const k = c.to.toLowerCase().trim();
  if (!seen.has(k)) { seen.add(k); all.push(c); }
}

console.log(`Total unique contacts: ${all.length}`);

const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: apiKey });
const sender = `Operational Insider <hello@echokappa.com>`;

let sent = 0, failed = 0;
for (const c of all) {
  try {
    const r = await client.messages.create(domain, {
      from: sender,
      to: [c.to],
      subject: SUBJECT,
      text: BODY,
    });
    console.log(`OK [${c.id}] ${c.org} <${c.to}> → ${r.id}`);
    sent++;
  } catch (err: any) {
    const detail = err?.response?.body?.message || err?.message || String(err);
    console.log(`FAIL [${c.id}] ${c.org} <${c.to}> → ${detail}`);
    failed++;
  }
  await new Promise((r) => setTimeout(r, 350));
}

console.log(`\nDONE: ${sent} sent, ${failed} failed, ${all.length} total`);
