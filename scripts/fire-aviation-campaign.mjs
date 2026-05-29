// Aviation + JW accountability campaign sender
// Usage: node scripts/fire-aviation-campaign.mjs [--dry-run]

const isDryRun = process.argv.includes("--dry-run");

const API_KEY    = process.env.MAILGUN_API_KEY;
const DOMAIN     = process.env.MAILGUN_DOMAIN;
const FROM_NAME  = "Samuel Wotton";
const FROM_EMAIL = "hello@ekhokappa.com";

if (!API_KEY || !DOMAIN) {
  console.error("FATAL: MAILGUN_API_KEY and MAILGUN_DOMAIN must be set.");
  process.exit(1);
}

import { register } from "tsx/esm/api";
register();

const { AV_CAMPAIGN_CONTACTS } = await import("../server/mailer-campaign-aviation.ts");

const FormData = (await import("form-data")).default;
const Mailgun  = (await import("mailgun.js")).default;
const mg       = new Mailgun(FormData);
const client   = mg.client({ username: "api", key: API_KEY });
const sender   = `${FROM_NAME} <${FROM_EMAIL}>`;

const total   = AV_CAMPAIGN_CONTACTS.length;
const results = [];

console.log(`\n${isDryRun ? "DRY RUN — " : ""}Aviation + JW campaign: ${total} emails from ${sender}\n`);
console.log("─".repeat(90));

for (let i = 0; i < AV_CAMPAIGN_CONTACTS.length; i++) {
  const c        = AV_CAMPAIGN_CONTACTS[i];
  const progress = `[${String(i + 1).padStart(3, " ")}/${total}]`;
  const tag      = c.category.padEnd(12);

  if (isDryRun) {
    console.log(`${progress} ${tag}  ${c.to}`);
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

  if (i < AV_CAMPAIGN_CONTACTS.length - 1) {
    await new Promise(r => setTimeout(r, 350));
  }
}

console.log("\n" + "─".repeat(90));
const sent   = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok).length;
console.log(`\nResult: ${sent} sent, ${failed} failed, ${total} total\n`);

// Category breakdown
const cats = [...new Set(results.map(r => r.category))].sort();
for (const cat of cats) {
  const catResults = results.filter(r => r.category === cat);
  const catSent    = catResults.filter(r => r.ok).length;
  console.log(`  ${cat.padEnd(14)} ${catSent}/${catResults.length}`);
}

if (failed > 0) {
  console.log("\nFailed:");
  results.filter(r => !r.ok).forEach(r => {
    console.log(`  [${r.id}] ${r.to} — ${r.detail}`);
  });
}
