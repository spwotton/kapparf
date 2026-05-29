// One-shot campaign sender — runs directly in Node with process.env secrets.
// Usage: node scripts/fire-campaign.mjs [--dry-run]
//
// Reads MAILGUN_API_KEY and MAILGUN_DOMAIN from environment.
// Sends all CAMPAIGN_CONTACTS with 350ms stagger, prints result table.

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const isDryRun = process.argv.includes("--dry-run");

// ── env check ──────────────────────────────────────────────────────────────
const API_KEY = process.env.MAILGUN_API_KEY;
const DOMAIN  = process.env.MAILGUN_DOMAIN;
const FROM_NAME  = "Samuel Wotton";
const FROM_EMAIL = "hello@ekhokappa.com";

if (!API_KEY || !DOMAIN) {
  console.error("FATAL: MAILGUN_API_KEY and MAILGUN_DOMAIN must be set.");
  process.exit(1);
}

// ── load contacts via ts-node / tsx interop ────────────────────────────────
// We transpile on the fly using tsx (already installed as a dev dep)
import { register } from "tsx/esm/api";
register();

// Now we can import TypeScript directly
const { CAMPAIGN_CONTACTS } = await import("../server/mailer-campaign.ts");

// ── mailgun client ─────────────────────────────────────────────────────────
const FormData = (await import("form-data")).default;
const Mailgun  = (await import("mailgun.js")).default;
const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: API_KEY });
const sender = `${FROM_NAME} <${FROM_EMAIL}>`;

// ── send loop ──────────────────────────────────────────────────────────────
const total   = CAMPAIGN_CONTACTS.length;
const results = [];

console.log(`\n${isDryRun ? "DRY RUN — " : ""}Sending ${total} emails from ${sender}\n`);
console.log("─".repeat(80));

for (let i = 0; i < CAMPAIGN_CONTACTS.length; i++) {
  const c = CAMPAIGN_CONTACTS[i];
  const progress = `[${String(i + 1).padStart(2, " ")}/${total}]`;

  if (isDryRun) {
    console.log(`${progress} DRY  → ${c.to.padEnd(52)} (${c.org})`);
    results.push({ id: c.id, to: c.to, org: c.org, category: c.category, ok: true, detail: "dry-run" });
    continue;
  }

  process.stdout.write(`${progress} SEND → ${c.to.padEnd(52)} (${c.org}) … `);

  try {
    const res = await client.messages.create(DOMAIN, {
      from:    sender,
      to:      [c.to],
      subject: c.subject,
      text:    c.body,
    });
    const mgId = res.id || "(no id)";
    console.log(`✓  ${mgId}`);
    results.push({ id: c.id, to: c.to, org: c.org, category: c.category, ok: true, detail: mgId });
  } catch (err) {
    const detail = err?.response?.body?.message || err?.message || String(err);
    console.log(`✗  ${detail}`);
    results.push({ id: c.id, to: c.to, org: c.org, category: c.category, ok: false, detail });
  }

  // 350ms stagger — stays well within Mailgun rate limits
  if (i < CAMPAIGN_CONTACTS.length - 1) {
    await new Promise(r => setTimeout(r, 350));
  }
}

// ── summary ────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(80));
const sent   = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok).length;
console.log(`\nResult: ${sent} sent, ${failed} failed, ${total} total\n`);

if (failed > 0) {
  console.log("Failed addresses:");
  results.filter(r => !r.ok).forEach(r => {
    console.log(`  [${r.id}] ${r.to} — ${r.detail}`);
  });
}
