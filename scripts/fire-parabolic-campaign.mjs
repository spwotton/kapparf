// Parabolic Antenna Campaign — June 2026
// Usage: node scripts/fire-parabolic-campaign.mjs [--dry-run]

const isDryRun = process.argv.includes("--dry-run");

const API_KEY   = process.env.MAILGUN_API_KEY;
const DOMAIN    = process.env.MAILGUN_DOMAIN;
const FROM_NAME = "Samuel Wotton";
const FROM_EMAIL = "hello@echokappa.com";

if (!API_KEY || !DOMAIN) {
  console.error("FATAL: MAILGUN_API_KEY and MAILGUN_DOMAIN must be set.");
  process.exit(1);
}

import { register } from "tsx/esm/api";
register();

const { PARABOLIC_CONTACTS } = await import("../server/mailer-campaign-parabolic.ts");

const FormData = (await import("form-data")).default;
const Mailgun  = (await import("mailgun.js")).default;
const mg       = new Mailgun(FormData);
const client   = mg.client({ username: "api", key: API_KEY });
const sender   = `${FROM_NAME} <${FROM_EMAIL}>`;

const total   = PARABOLIC_CONTACTS.length;
const results = [];

console.log(`\n${isDryRun ? "DRY RUN — " : ""}Parabolic Antenna Campaign: ${total} emails from ${sender}`);
console.log(`Domain: ${DOMAIN}\n`);
console.log("─".repeat(100));

// Category summary
const cats = [...new Set(PARABOLIC_CONTACTS.map(c => c.category))];
for (const cat of cats) {
  const n = PARABOLIC_CONTACTS.filter(c => c.category === cat).length;
  console.log(`  ${cat.padEnd(12)} ${n} contacts`);
}
console.log("─".repeat(100));

for (let i = 0; i < PARABOLIC_CONTACTS.length; i++) {
  const c        = PARABOLIC_CONTACTS[i];
  const progress = `[${String(i + 1).padStart(3, " ")}/${total}]`;
  const tag      = c.category.padEnd(10);

  if (isDryRun) {
    console.log(`${progress} ${tag}  ${c.org.padEnd(45)}  ${c.to}`);
    results.push({ ...c, ok: true, detail: "dry-run" });
    continue;
  }

  process.stdout.write(`${progress} ${tag}  ${c.to.padEnd(55)} … `);

  try {
    const res = await client.messages.create(DOMAIN, {
      from:    sender,
      to:      [c.to],
      subject: c.subject,
      text:    c.body,
    });
    console.log(`✓  ${res.id || ""}`);
    results.push({ ...c, ok: true, detail: res.id });
  } catch (err) {
    const detail = err?.response?.body?.message || err?.message || String(err);
    console.log(`✗  ${detail}`);
    results.push({ ...c, ok: false, detail });
  }

  if (i < PARABOLIC_CONTACTS.length - 1) {
    await new Promise(r => setTimeout(r, 350));
  }
}

console.log("\n" + "─".repeat(100));
if (!isDryRun) {
  const sent   = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`\nResult: ${sent} sent, ${failed} failed, ${total} total\n`);
  if (failed > 0) {
    console.log("Failed:");
    results.filter(r => !r.ok).forEach(r => {
      console.log(`  ${r.to} — ${r.detail}`);
    });
  }
} else {
  console.log(`\nDRY RUN complete — ${total} contacts listed above, no emails sent.\n`);
}
