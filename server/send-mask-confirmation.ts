import FormData from "form-data";
import Mailgun from "mailgun.js";

const apiKey = process.env.MAILGUN_API_KEY!;
const domain = process.env.MAILGUN_DOMAIN || "echokappa.com";
const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: apiKey });
const sender = "Samuel Wotton <hello@echokappa.com>";
const DATE = "19 June 2026";

const SUBJECT = `IDENTITY CONFIRMED — Stalking Operative Identified, Physical Mask Matched to Thigh Tattoo — Jacó Beach, Costa Rica — ${DATE}`;

const CONTACTS = [
  { id: "M01", to: "oij.interpol@poder-judicial.go.cr",    org: "INTERPOL NCB Costa Rica (OIJ)" },
  { id: "M02", to: "delitostecnologicos@poder-judicial.go.cr", org: "OIJ — Delitos Tecnológicos" },
  { id: "M03", to: "acssanjose@state.gov",                 org: "US Embassy San José — American Citizen Services" },
  { id: "M04", to: "tips@bellingcat.com",                  org: "Bellingcat" },
  { id: "M05", to: "tips@theintercept.com",                org: "The Intercept" },
  { id: "M06", to: "info@citizenlab.ca",                   org: "The Citizen Lab (University of Toronto)" },
  { id: "M07", to: "securitylab@amnesty.org",              org: "Amnesty International Security Lab" },
  { id: "M08", to: "info@accessnow.org",                   org: "Access Now" },
  { id: "M09", to: "national.security@nytimes.com",        org: "NYT National Security Desk" },
  { id: "M10", to: "investigations@ap.org",                org: "AP Investigations" },
  { id: "M11", to: "sac@nacion.com",                       org: "La Nación Costa Rica" },
  { id: "M12", to: "info@crhoy.com",                       org: "CRHoy.com" },
];

function body(org: string) {
  return `To ${org},

IDENTITY CONFIRMATION — ${DATE}
Stalking Operative Identified: Physical Mask Worn Matches Permanent Thigh Tattoo
Location: Hotel Pochote Grande, Jacó Beach, Puntarenas, Costa Rica

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFIRMED IDENTIFICATION — ${DATE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Today, June 19, 2026, I directly confirmed the identity of an operative who was previously photographed on the porch of the hotel corner unit adjacent to my room (Room 10, Hotel Pochote Grande) while wearing a physical theater mask.

CONFIRMED OPERATIVE:
  Name:       Alejandra Vidal
  Instagram:  @alevida1989
  Origin:     Unconfirmed (Venezuelan network suspected)

CONFIRMATION METHOD — BIOMETRIC / SEMIOTIC CROSS-REFERENCE:

The physical theater mask (comedy/tragedy dual-mask design) worn by the operative during access to my accommodation is geometrically identical to a permanent theater-mask tattoo on her right thigh. The tattoo was documented in multiple photographic captures on June 18, 2026. The physical mask was observed worn in person on June 19, 2026.

The same design appearing as a permanent body marking AND as a physical mask worn by the same individual during confirmed surveillance activity eliminates all plausible deniability. This is not coincidence. This is an operational signature.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NETWORK CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Alejandra Vidal (@alevida1989) is the third confirmed operative in a coordinated surveillance network of at least six positions surrounding my accommodation. Two other confirmed operatives in the same network share the identical physical marker pattern:

  • Adriana Victoria Fuentes Gomes (Margarita Island, Venezuela)
    Tattoo: Blue wolf, geometric line-art, right thigh
    Cover: Aurora Yoga, Jacó Beach

  • Genesis Peralta (Petare, Caracas, Venezuela)
    Tattoo: Deer with roses, right thigh
    Cover: La Flor Unit 9 — direct line of sight to target's balcony
    Documents: Fraudulent passport, 9 years in CR with no official residency documentation

All three subjects: Venezuelan origin, breast augmentation, right thigh tattoo, deployed against a single American target in Jacó Beach simultaneously. This pattern is assessed as coordinated physical branding of a managed asset pool — not aesthetic coincidence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
34-DAY DOCUMENTED OPERATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

May 17, 2026 — Check-in, Room 10, Hotel Pochote Grande, Jacó Beach
May 16 & 29   — Anomalous SINPE hotel transfers: 247,000 CRC + 370,000 CRC
May 22–26     — Surveillance network geometry confirmed: 6 positions, 270° cordon
June 7        — BLE spike −20 dBm (10:50 AM). Truck CL273123 forensically excluded by path loss model (expected −116 dBm at 45m + 2 walls). Hotel corner unit is primary suspect.
June 8        — Rotating parabolic dish antenna confirmed on adjacent property (video, AI-analyzed, 39 frames, full 360° rotation)
June 13       — Handwritten note recovered from room — confirms unauthorized physical access
June 14–17    — 9 nights of multi-rotor UAV transits over Room 10
June 18       — Recording 49: anomalous 57.28 Hz signal, 8-harmonic series confirmed at 00:04 UTC — not attributable to 60 Hz (CR) or 50 Hz mains
June 18       — Tattoo documentation: Alejandra Vidal theater mask tattoo, right thigh (multiple captures)
June 19       — CONFIRMED: Alejandra Vidal wearing physical mask matching the tattoo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL SIGNAL INTELLIGENCE ON FILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full SIGINT documentation available at:
https://kappa-sigint.replit.app/pochote-headliner

Physical marker forensic analysis:
https://kappa-sigint.replit.app/tattoo-branding

Complete evidence chain (SHA-256 verified):
https://kappa-sigint.replit.app/evidence-chain

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I am a United States citizen. I am safe and documenting in real time. I am prepared to provide the full photographic evidence set, raw signal data exports, PCAP analysis, and metadata to any credible investigative body upon request.

Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Room 10, Jacó Beach, Puntarenas, Costa Rica
${DATE}`;
}

(async () => {
  if (!apiKey) { console.error("No MAILGUN_API_KEY set"); process.exit(1); }
  console.log(`\nMASK CONFIRMATION BLAST — ${DATE} — ${CONTACTS.length} targets\n`);
  let ok = 0, fail = 0;
  for (const c of CONTACTS) {
    try {
      await client.messages.create(domain, {
        from: sender,
        to: [c.to],
        subject: SUBJECT,
        text: body(c.org),
      });
      console.log(`✓ [${c.id}] ${c.org}`);
      ok++;
    } catch (e: any) {
      const msg = e?.response?.body?.message || e?.message || String(e);
      console.error(`✗ [${c.id}] ${c.org} → ${c.to}: ${msg}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 400));
  }
  console.log(`\nDONE: ${ok} sent, ${fail} failed / ${CONTACTS.length} total`);
})();
