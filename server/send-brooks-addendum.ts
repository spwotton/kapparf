// ADDENDUM — Israel Brooks newly identified, 7 June 2026
// Sends follow-up to all Ríos expanded targets + Russian Embassy Managua
// Usage: tsx server/send-brooks-addendum.ts
import Mailgun from "mailgun.js";

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN || "echokappa.com";
if (!apiKey) { console.error("MAILGUN_API_KEY not set"); process.exit(1); }

const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: apiKey });
const sender = "Samuel Wotton <hello@echokappa.com>";

const EVIDENCE_URL = "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev/evidence/DENUNCIA_SAM_WOTTON_20260530.html";
const DATE = "7 June 2026";

const BROOKS_BLOCK = `NEWLY IDENTIFIED SUBJECT — OBSERVED TODAY (${DATE}):

Name: Israel Brooks
Location: Jacó Beach, Puntarenas, Costa Rica
Observed: ${DATE}

Physical observation at location:
- Operating what appears to be a large directional boom and dish apparatus — consistent with active RF collection or directional microwave/acoustic surveillance equipment
- Multiple individuals present at perimeter filming over the fence — consistent with a coordinated surveillance team, not casual observers
- Observed in proximity to known surveillance activity zone

This is the first confirmed visual identification of Israel Brooks as an active participant in the ongoing operation. The equipment described (boom + dish array + perimeter filming team) is consistent with mobile SIGINT/HUMINT collection infrastructure previously documented at this location via RF analysis.`;

const SUBJECT_ADDENDUM = `ADDENDUM — New Subject Identified: Israel Brooks — Jacó, Costa Rica — ${DATE}`;

// All prior recipients
const CONTACTS = [
  { id: "A01", to: "embrus@cablenet.com.ni",               org: "Russian Embassy — Managua, Nicaragua" },
  { id: "A02", to: "mail@costarica.mid.ru",                org: "Russian Embassy — San José, Costa Rica" },
  { id: "A03", to: "tips@bellingcat.com",                  org: "Bellingcat" },
  { id: "A04", to: "tips@meduza.io",                       org: "Meduza" },
  { id: "A05", to: "editor@theins.ru",                     org: "The Insider Russia" },
  { id: "A06", to: "info@4freerussia.org",                 org: "Free Russia Foundation" },
  { id: "A07", to: "oij.interpol@poder-judicial.go.cr",   org: "INTERPOL NCB Costa Rica (OIJ)" },
  { id: "A08", to: "security@intelligence.senate.gov",    org: "SSCI" },
];

function buildBody(org: string): string {
  return `To ${org},

This is an addendum to my notification of ${DATE} regarding the documented surveillance operation in Jacó Beach, Costa Rica.

${BROOKS_BLOCK}

OPERATIONAL CONTEXT:
This observation adds a fourth directly identified actor to the documented network (joining Víctor Antonio Ríos Solís, Héctor Eduardo Mora Marín, and Jorge Jiménez Navarro). The presence of boom/dish collection equipment and a perimeter filming team indicates the operation remains active and has escalated to visible mobile surveillance infrastructure.

The timing — same day as my prior notifications to your organization and others — may not be coincidental. The deployment of visible equipment may represent a response to the disclosure campaign or an escalation intended to intimidate.

I am continuing to document all observations in real time via the KAPPA SIGINT platform.

Full forensic dossier: ${EVIDENCE_URL}

Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
${DATE}`;
}

console.log(`\n📨 BROOKS ADDENDUM — ${CONTACTS.length} targets\n`);

let ok = 0, fail = 0;
for (const c of CONTACTS) {
  try {
    await client.messages.create(domain, {
      from: sender,
      to: [c.to],
      subject: SUBJECT_ADDENDUM,
      text: buildBody(c.org),
    });
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
