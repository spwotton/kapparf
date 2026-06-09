import FormData from "form-data";
import Mailgun from "mailgun.js";

const apiKey = process.env.MAILGUN_API_KEY!;
const domain = process.env.MAILGUN_DOMAIN || "echokappa.com";

const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: apiKey });
const sender = "Samuel Wotton <hello@echokappa.com>";
const DATE = "8 June 2026";
const PAGE_URL = "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev/pochote-incident";
const DOSSIER_URL = "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev/evidence/DENUNCIA_SAM_WOTTON_20260530.html";
const SUBJECT = `CRITICAL ESCALATION — Rotating Antenna Confirmed, Personnel Photographed, Observer Threatened — Jacó Beach, Costa Rica — ${DATE}`;

const CONTACTS = [
  { id: "B01", to: "embrus@cablenet.com.ni",             org: "Russian Embassy — Managua, Nicaragua" },
  { id: "B02", to: "mail@costarica.mid.ru",              org: "Russian Embassy — San José, Costa Rica" },
  { id: "B03", to: "tips@bellingcat.com",                org: "Bellingcat" },
  { id: "B04", to: "tips@meduza.io",                     org: "Meduza" },
  { id: "B05", to: "editor@theins.ru",                   org: "The Insider Russia" },
  { id: "B06", to: "info@4freerussia.org",               org: "Free Russia Foundation" },
  { id: "B07", to: "oij.interpol@poder-judicial.go.cr", org: "INTERPOL NCB Costa Rica (OIJ)" },
  { id: "B08", to: "security@intelligence.senate.gov",  org: "SSCI — Senate Select Committee on Intelligence" },
  { id: "B09", to: "tips@theintercept.com",             org: "The Intercept" },
  { id: "B10", to: "info@citizenlab.ca",                org: "The Citizen Lab (UofT)" },
  { id: "B11", to: "securitylab@amnesty.org",           org: "Amnesty International Security Lab" },
  { id: "B12", to: "info@accessnow.org",                org: "Access Now" },
  { id: "B13", to: "info@crhoy.com",                    org: "CRHoy.com" },
  { id: "B14", to: "sac@nacion.com",                    org: "La Nación Costa Rica" },
  { id: "B15", to: "national.security@nytimes.com",     org: "NYT National Security" },
  { id: "B16", to: "investigations@ap.org",             org: "AP Investigations" },
];

function body(org: string) {
  return `To ${org},

ADDENDUM — ${DATE} — Critical Escalation: Jacó Beach, Costa Rica

This is a follow-up to previous communications regarding the ongoing surveillance operation at Hotel Pochote Grande, Jacó Beach, Costa Rica. Today's new evidence escalates this matter considerably.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW EVIDENCE CONFIRMED — ${DATE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ROTATING PARABOLIC DISH ANTENNA — VIDEO CONFIRMED

I filmed a rotating parabolic dish antenna at the yoga place property directly behind Hotel Pochote Grande — direct line of sight to my balcony. AI forensic vision (qwen/qwen3-vl-32b-instruct, 39 enhanced frames) confirmed: "A dark, curved, dish-like object consistently visible in the center-right background... shape shifts elongated→compact→rounded — consistent with rotation."

2. STATIONARY SURVEILLANCE OPERATIVE CONFIRMED AT POST

A second clip (83 frames, 8.3 seconds) shows one individual maintaining a fixed position to the right of the antenna throughout the entire recording. AI vision: "Stationary or minimally mobile throughout entire clip. Slight lateral shifts only. Maintaining fixed post adjacent to antenna."

3. THREE OPERATIVES PHOTOGRAPHED — AT LEAST TWO LOOKING DIRECTLY AT MY CAMERA

I photographed two individuals through the foliage at the antenna post (IMG_0697, IMG_0696). AI forensic analysis of 3–4× upscaled enhanced crops:

  LEFT FIGURE: Male, 20s–30s. Short dark crew cut (military/tactical grooming standard). Horizontal-stripe upper garment consistent with uniform or tactical vest overlay. Red-orange shoulder structure consistent with tactical harness or strap.

  RIGHT FIGURE: Male, 25–45. Neat dark hair, white collar shirt. Eyes appear DIRECTLY ORIENTED TOWARD THE CAMERA.

  IMG_0696 INDIVIDUAL: Male, 25–45. Forward-leaning posture, peering through foliage. HIGHLY PROBABLE HANDHELD DEVICE at chest or eye level — phone, camera, or binoculars. DIRECT GAZE confirmed. This is consistent with counter-photography — they detected the observer and were photographing back within the same window.

4. WIFI DEAUTHENTICATION ATTACK TIMED TO FILMING

At 4:45 PM CST — the moment I attempted to upload this footage — I experienced the most severe deauthentication attack to date. Zero uploads succeeded. iPhone overheated. My KAPPA Signal Intelligence score collapsed from 93.12 (CRITICAL) to 17.31 in 13 minutes — a 76-point drop correlated exactly with deauth onset. A deauth attack requires no encryption bypass, leaves no standard log trace, and is executable from 50–200m with consumer hardware. It is illegal under Costa Rica Law 9048 and the Budapest Convention on Cybercrime.

5. ACTIVE THREATS — ONGOING RIGHT NOW DURING THIS DOCUMENTATION SESSION

I am being continuously threatened in real-time as I write this communication. These threats are concurrent with the moment the surveillance team detected my camera. Under Costa Rica Penal Code Article 195 (criminal threats) and Article 274 (obstruction of justice / witness intimidation), these constitute independent criminal acts.

6. SURVEILLANCE PERSONNEL CONFIRMED INSIDE MY HOTEL

In addition to the external antenna post and the mobile BLE vehicle (Toyota CL-273123, owner HERNANDEZ FERNANDEZ ESTEBAN — documented in prior communications), adversarial personnel are now confirmed INSIDE Hotel Pochote Grande itself, in the opposite corner from my room.

This creates a full-envelope geometry: external antenna post (direct line of sight from balcony) + internal hotel assets (opposite corner) = bilateral coverage with no blind angle. The operation has entered its confrontational phase.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL FORENSIC DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Complete editorial forensic report with all evidence images, AI vision analysis, timeline, and 8 formal findings:
${PAGE_URL}

Full dossier (HTML, SHA-256 integrity verified):
${DOSSIER_URL}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEGAL VIOLATIONS DOCUMENTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Costa Rica Law 9048 — WiFi deauth attacks, unauthorized RF interference
  Costa Rica Ley 8968 — surveillance without consent, unlawful data collection
  Costa Rica Penal Code Art. 195 — criminal threats against observer
  Costa Rica Penal Code Art. 196–197 — violation of private communications
  Costa Rica Penal Code Art. 274 — witness intimidation during active documentation
  SUTEL — unauthorized directional transmitter, no frequency license
  Budapest Convention on Cybercrime — deauthentication attack

This is an active, multi-asset, coordinated surveillance and harassment operation against a U.S. citizen on Costa Rican soil. The operation is now in its confrontational phase.

Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó Beach, Puntarenas, Costa Rica
${DATE}`;
}

(async () => {
  if (!apiKey) { console.error("No MAILGUN_API_KEY"); process.exit(1); }
  console.log(`\nPOCHOTE ESCALATION ADDENDUM — ${CONTACTS.length} targets\n`);
  let ok = 0, fail = 0;
  for (const c of CONTACTS) {
    try {
      const r: any = await client.messages.create(domain, {
        from: sender, to: [c.to], subject: SUBJECT, text: body(c.org),
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
