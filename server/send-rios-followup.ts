// Follow-up to Russian Embassy Nicaragua — Ríos Solís research update
// Samuel Wotton — 3 June 2026
// Usage: tsx server/send-rios-followup.ts
import Mailgun from "mailgun.js";

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN || "echokappa.com";
if (!apiKey) { console.error("MAILGUN_API_KEY not set"); process.exit(1); }

const mg = new Mailgun(FormData);
const client = mg.client({ username: "api", key: apiKey });
const sender = "Samuel Wotton <hello@echokappa.com>";

const EVIDENCE_URL = "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev/evidence/DENUNCIA_SAM_WOTTON_20260530.html";

const CONTACTS = [
  {
    id: 8001,
    to: "embrus@cablenet.com.ni",
    org: "Russian Embassy — Managua, Nicaragua (accredited to Central America)",
    subject: "FOLLOW-UP — Updated Research: Former Mayor Víctor Antonio Ríos Solís, Maritime Zone Land Control, Jacó, Costa Rica",
    body: `To the Embassy of the Russian Federation, Managua,

This is a follow-up to my notification of 31 May 2026 regarding the documented surveillance campaign against me in Jacó, Costa Rica.

I am writing to provide newly verified research identifying the municipal and land-control layer of the operation.

────────────────────────────────────────────
NEWLY VERIFIED: VÍCTOR ANTONIO RÍOS SOLÍS
────────────────────────────────────────────

VERIFIED IDENTITY:
- Full name: Víctor Antonio Ríos Solís
- Role: Former Alcalde (Mayor) of the Cantón de Garabito, which governs Jacó
- Tenure: Elected 19 November 1998 (Sesión Ordinaria N.º 40, artículo VII, inciso A)
- Source: La Gaceta N.º 249, 23 December 1998 (official Costa Rican government gazette)
- Current role: Legal representative, Bakewell INC S.A.

VERIFIED LEGAL PROCEEDINGS:
- TSE (Tribunal Supremo de Elecciones) case 1260-M-2001 filed challenging his appointment
- Ground: his brother, Jorge Johnny Ríos Solís, was the Encargado de la Zona Marítimo Terrestre (Head of Maritime-Terrestrial Zone administration) for the Municipalidad de Garabito — a position held since 18 March 1983
- Source: tse.go.cr/juris/municipales/1260-M-2001.HTM

SIGNIFICANCE — MARITIME ZONE CONTROL:
The Zona Marítimo Terrestre (ZMT) is the 200-meter coastal strip along all of Costa Rica's coastline, administered at the municipal level. It includes the beach and beachfront land in Jacó. The Ríos Solís family simultaneously held the mayoral office AND direct administrative control of this coastal land zone — creating exclusive leverage over coastal property access, development permits, and physical infrastructure in the precise area where the documented RF operations and physical surveillance occurred.

CORPORATE NEXUS:
Bakewell INC S.A. — of which Víctor Antonio Ríos Solís is the legal representative — developed Urbanización Los Ríos in Quebrada Seca. This represents a continuation of the same municipal land-access leverage in a private corporate vehicle after his mayoral term ended.

────────────────────────────────────────────
CONNECTION TO BROADER OPERATION
────────────────────────────────────────────

The three-layer structure of the operation is now fully documented:

1. MUNICIPAL/LAND LAYER — Ríos Solís family: former mayoral control + maritime zone administration = physical access to coastal infrastructure in Jacó
2. CRITICAL INFRASTRUCTURE LAYER — Héctor Eduardo Mora Marín / Setecom S.A.: exclusive national contracts covering ICE, Liberty, hospitals, SJO airport radar backup; CISA-documented ICS vulnerabilities; Modbus port 502 publicly exposed
3. CLOUD/ISP LAYER — Jorge Jiménez Navarro (Zscaler / ex-Kyndryl): cloud-proxy MITM capability; property manager at my prior residence

This structure — land control, infrastructure access, network access — operating in a coordinated manner over 18 months against a single U.S. citizen constitutes a documented organized operation under Costa Rica's Ley 8754.

────────────────────────────────────────────
STATUS OF FORMAL FILINGS
────────────────────────────────────────────

As of 3 June 2026, formal complaints have been submitted to:
- OIJ Sección de Delitos Informáticos (Costa Rica)
- Fiscalía Adjunta contra la Delincuencia Organizada (Costa Rica)
- FBI Legal Attaché San José
- U.S. Embassy American Citizen Services, San José
- ICIG, HPSCI, SSCI, SOUTHCOM, DIA, DOJ National Security Division, HSI, OFAC

Full forensic dossier: ${EVIDENCE_URL}

Samuel Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
3 June 2026`,
  },
];

console.log(`\n📨 RÍOS FOLLOW-UP — ${CONTACTS.length} target\n`);

let ok = 0, fail = 0;
for (const c of CONTACTS) {
  try {
    await client.messages.create(domain, { from: sender, to: [c.to], subject: c.subject, text: c.body });
    console.log(`✓ [${c.id}] ${c.org} → ${c.to}`);
    ok++;
  } catch (e: any) {
    const msg = e?.response?.body?.message || e?.message || String(e);
    console.error(`✗ [${c.id}] ${c.org} → ${c.to}: ${msg}`);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 400));
}

console.log(`\nResult: ${ok} sent, ${fail} failed out of ${CONTACTS.length}\n`);
