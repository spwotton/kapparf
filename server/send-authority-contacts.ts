// Authority contacts sender — FBI tip / US Embassy / OIJ / Fiscalía
// Samuel Wotton — 3 June 2026
// Usage: tsx server/send-authority-contacts.ts
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
    id: 1,
    to: "ic3.gov@tips",  // IC3 is a web form — flagged below
    org: "FBI Internet Crime Complaint Center (IC3)",
    subject: "US Citizen Abroad — 18-Month Electronic Harassment / Possible Foreign Interference — Costa Rica",
    body: `To Whom It May Concern,

I am a United States citizen (Samuel P. Wotton, spwotton@gmail.com) currently located at Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica. I am writing to formally report an 18-month campaign of documented electronic harassment, unauthorized computer access, and RF-based physical harassment.

SUMMARY OF DOCUMENTED EVIDENCE:

1. NETWORK INFILTRATION
   - PCAP analysis: unauthorized devices on LAN; high-volume anomalous traffic on port 8009 (screen-mirroring/cast control)
   - Connection throttling: 196 packets (~19 KB) in 3.5 min vs. ~3,791 packets in comparable windows
   - ISP-level TR-069/CWMP (port 7547) management-plane injection; forced router reset 30 Jan 2026
   - ~402,228 packets to 200+ external IPs including threat-intelligence-flagged hosts

2. CRITICAL INFRASTRUCTURE EXPOSURE
   - Setecom S.A. (IP 190.106.77.194, FortiGate 60F serial FGT60FTK21083818): exclusive national distributor of Deep Sea Electronics (DSE) generator controllers covering ICE (national electric utility), Liberty network, public hospitals, and San José airport radar backup power
   - Port 502 (Modbus, unauthenticated) publicly exposed
   - Four CISA-published CVEs on deployed models including remote code execution and unauthenticated shutdown

3. RADIO-FREQUENCY EVIDENCE (48 kHz recording, 17 Jan 2026)
   - 46.875 Hz: DSP master-clock hardware fingerprint (48,000 ÷ 1,024), +79–89 dB SNR
   - 97.01 Hz: continuous sub-audio carrier
   - 44.2 Hz: rotational/propeller signature consistent with UAV
   - 8.95–15.4 Hz: infrasound range
   - 50 Hz ELF anomaly: inconsistent with Costa Rica's 60 Hz grid — foreign-sourced hardware

4. ACTOR NETWORK
   - Víctor Antonio Ríos Solís: former Mayor of Garabito (confirmed, TSE case 1260-M-2001; La Gaceta N.º 249, 1998); legal rep, Bakewell INC S.A. — municipal infrastructure access including maritime-zone land
   - Héctor Eduardo Mora Marín (alias hmora67): Executive Director, Setecom S.A. — technical access to ICS infrastructure; modified equipment at my residence
   - Jorge Jiménez Navarro: formerly Kyndryl Senior Lead Network Services (Sep 2021–May 2024), currently Technical Success Manager at Zscaler — cloud/ISP-level MITM capability; was property manager at my prior residence

5. DEATH THREAT received 31 May 2026, approximately 24 hours after first formal disclosure filing.

Full forensic dossier: ${EVIDENCE_URL}

I request review by the appropriate FBI division covering US citizens abroad and/or foreign interference in critical infrastructure, and guidance on available protective measures.

Respectfully,
Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
3 June 2026`,
  },
  {
    id: 2,
    to: "acssanjose@state.gov",
    org: "US Embassy San José — American Citizen Services",
    subject: "American Citizen Services Request — Ongoing Harassment / Safety Concern — Jacó, Costa Rica",
    body: `Dear American Citizen Services,

I am a US citizen (Samuel P. Wotton, spwotton@gmail.com) residing in Costa Rica, currently at Hotel Pochote Grande, Jacó, Puntarenas. I am writing to request consular assistance and to formally document an ongoing safety concern.

Over the past 18 months I have experienced a documented campaign of electronic harassment, network infiltration, and RF-based physical interference involving identified Costa Rican nationals with ties to critical infrastructure.

IMMEDIATE CONCERNS:
- Death threat received evening of 31 May 2026, approximately 24 hours after submitting a formal disclosure filing
- Local law enforcement has not provided adequate response to prior reports
- I am currently without legal representation in Costa Rica

KEY DOCUMENTED FACTS:
- Setecom S.A. (Héctor Eduardo Mora Marín) holds exclusive national contracts for Deep Sea Electronics generator controllers across Costa Rica's critical national infrastructure — hospitals, ICE, Liberty, SJO airport radar backup. Four CISA-published CVEs including RCE and unauthenticated shutdown. Port 502 (Modbus) publicly exposed.
- Jorge Jiménez Navarro (Zscaler Technical Success Manager; formerly Kyndryl) was property manager at my prior residence and has documented cloud/ISP-level MITM capability.
- Formal denuncia filed simultaneously with OIJ (Delitos Informáticos) and Fiscalía Adjunta contra la Delincuencia Organizada.
- Also reported to FBI via IC3.

Full forensic dossier: ${EVIDENCE_URL}

REQUESTS:
1. Registration or update in the Smart Traveler Enrollment Program (STEP)
2. List of Embassy-recommended attorneys with criminal / cybercrime experience in Costa Rica
3. Documentation that this complaint has been received by the Embassy, for use in legal proceedings
4. Guidance on formal escalation channels if local OIJ/Fiscalía do not act

I can be reached at spwotton@gmail.com or +506 6377-3099.

Respectfully,
Samuel P. Wotton
US Citizen | spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
3 June 2026`,
  },
  {
    id: 3,
    to: "oij@poder-judicial.go.cr",
    org: "OIJ — Organismo de Investigación Judicial (Delitos Informáticos)",
    subject: "Denuncia Penal — Acceso no autorizado, interceptación de telecomunicaciones, acoso electrónico — Art. 196 bis, 229 bis, 230 CP; Ley 8754; Ley 8968",
    body: `Estimado OIJ — Sección de Delitos Informáticos,

Mi nombre es Samuel P. Wotton, ciudadano estadounidense (spwotton@gmail.com), actualmente en Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica.

Presento denuncia penal por una campaña sostenida de 18 meses de acoso electrónico, acceso no autorizado a mis sistemas informáticos, interceptación de telecomunicaciones y vigilancia coordinada, bajo los siguientes artículos del Código Penal (reformado por Ley 9048): Arts. 196, 196 bis, 197, 229 bis, 230; Ley 8754 (Delincuencia Organizada); Ley 8968 (Protección de Datos).

SUJETOS DENUNCIADOS:
1. Héctor Eduardo Mora Marín (alias hmora67) — Director Ejecutivo, Setecom S.A. (IP 190.106.77.194; FortiGate 60F serial FGT60FTK21083818). Distribuidor exclusivo nacional de controladores DSE con 4 CVEs publicados por CISA (incluyendo RCE y apagado no autenticado); puerto Modbus 502 expuesto públicamente. Modificó equipos en mi residencia anterior en Breakwater Point, Jacó.
2. Jorge Jiménez Navarro — ex-Kyndryl Senior Lead Network Services (sep 2021–may 2024), actualmente Technical Success Manager en Zscaler. Administrador de la propiedad en mi residencia anterior en La Guácima. Capacidad de MITM a nivel cloud/ISP documentada.
3. Víctor Antonio Ríos Solís — ex-Alcalde de Garabito 1998–2002 (confirmado, TSE expediente 1260-M-2001; La Gaceta N.º 249, 23 dic 1998); representante legal de Bakewell INC S.A. — acceso a infraestructura municipal incluyendo Zona Marítimo Terrestre.
4. Genesis Daniela Peralta Márquez (alias berninnimaria) — vector inicial del conflicto; cuentas falsas coordinadas.

EVIDENCIA DISPONIBLE:
- Archivos PCAP (capturas de 115 min y capturas en vivo)
- Análisis espectral JSON (grabación 21 min, 48 kHz, 17 enero 2026) — firma de clock DSP 46.875 Hz; anomalía ELF 50 Hz inconsistente con red costarricense de 60 Hz
- Informes de correlación de red e inteligencia de amenazas (VirusTotal / Shodan)
- Transcripción de entrenamiento Setecom DSE WebNet documentando credenciales por defecto y explotación Modbus
- Avisos CISA para los modelos DSE afectados

Solicito: (1) admisión de esta denuncia, (2) las acciones investigativas detalladas incluyendo barrido forense de RF (0–100 Hz), análisis forense de red de infraestructura Setecom, y entrevistas a los sujetos, y (3) medidas cautelares urgentes — recibí una amenaza de muerte el 31 de mayo de 2026.

Dossier forense completo: ${EVIDENCE_URL}

Atentamente,
Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
3 de junio de 2026`,
  },
  {
    id: 4,
    to: "fiscaliaorganizada@ministeriopublico.go.cr",
    org: "Fiscalía Adjunta contra la Delincuencia Organizada",
    subject: "Denuncia — Delincuencia organizada / acoso electrónico sostenido — Ley 8754; Arts. 196 bis, 229 bis, 230 CP",
    body: `Estimada Fiscalía Adjunta contra la Delincuencia Organizada,

Soy Samuel P. Wotton, ciudadano estadounidense (spwotton@gmail.com), actualmente en Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica.

Presento denuncia bajo Ley 8754 (Ley contra la Delincuencia Organizada) en conjunto con los artículos 196 bis, 229 bis y 230 del Código Penal (reformado por Ley 9048) y la Ley 8968.

La campaña documentada durante 18 meses involucra al menos tres actores coordinados con roles técnicos diferenciados:

1. Acceso a infraestructura crítica: Héctor Eduardo Mora Marín / Setecom S.A. — distribuidor exclusivo nacional de controladores DSE para ICE, Liberty, hospitales públicos y respaldo de radar del aeropuerto SJO; 4 CVEs CISA publicados; puerto Modbus 502 expuesto.
2. Capacidad cloud/ISP: Jorge Jiménez Navarro (Zscaler) — ex-Kyndryl, administrador de propiedad en mi residencia anterior; capacidad MITM documentada a nivel de backbone.
3. Conexiones municipales/políticas: Víctor Antonio Ríos Solís — ex-Alcalde de Garabito (TSE expediente 1260-M-2001); Bakewell INC S.A. (Urbanización Los Ríos, Quebrada Seca).

Esta estructura de tres actores con roles complementarios y coordinación sostenida durante 18 meses satisface el umbral del grupo estructurado bajo Ley 8754.

Solicito adicionalmente que se investiguen las actividades financieras de Bakewell INC S.A. en relación con esta denuncia.

Presento esta denuncia simultáneamente ante el OIJ Sección de Delitos Informáticos, la Embajada de EE.UU. en San José y el FBI.

URGENTE: recibí amenaza de muerte el 31 de mayo de 2026. Solicito medidas cautelares de manera inmediata.

Dossier forense completo: ${EVIDENCE_URL}

Atentamente,
Samuel P. Wotton
spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
3 de junio de 2026`,
  },
];

console.log(`\n📨 AUTHORITY CONTACTS — ${CONTACTS.length} targets\n`);

let ok = 0, fail = 0;
for (const c of CONTACTS) {
  // IC3 is a web form, not an email address — skip and flag
  if (c.id === 1) {
    console.log(`⚠  [${c.id}] ${c.org} — IC3 is a web form, not email. File manually at: https://www.ic3.gov`);
    console.log(`   FBI Legal Attaché San José (actual email): sanjose@ic.fbi.gov`);
    // Send to the FBI Legal Attaché instead
    c.to = "sanjose@ic.fbi.gov";
  }
  try {
    await client.messages.create(domain, {
      from: sender,
      to: [c.to],
      subject: c.subject,
      text: c.body,
    });
    console.log(`✓ [${c.id}] ${c.org} → ${c.to}`);
    ok++;
  } catch (e: any) {
    const msg = e?.response?.body?.message || e?.message || String(e);
    console.error(`✗ [${c.id}] ${c.org} → ${c.to}: ${msg}`);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 500));
}

console.log(`\nResult: ${ok} sent, ${fail} failed out of ${CONTACTS.length}\n`);
