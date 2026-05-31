// One-shot sender — runs standalone, does not need the Express server
// Usage: tsx server/send-us-intel-now.ts
import Mailgun from "mailgun.js";
import { US_INTEL_CONTACTS } from "./mailer-campaign-us-intel";

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN || "echokappa.com";

if (!apiKey) { console.error("MAILGUN_API_KEY not set"); process.exit(1); }

const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: apiKey });
const sender = "Samuel Wotton <hello@echokappa.com>";

console.log(`Sending to ${US_INTEL_CONTACTS.length} targets...`);

let ok = 0, fail = 0;
for (const c of US_INTEL_CONTACTS) {
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

console.log(`\nDone: ${ok} sent, ${fail} failed out of ${US_INTEL_CONTACTS.length}`);
