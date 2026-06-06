// UPDATE BLAST — RE: follow-up to every contact in all 7 campaigns
// Russell Brunson / Dan Kennedy copywriting:
//   - Pattern interrupt open
//   - Short punchy paragraphs
//   - Escalation hook
//   - Single CTA → forensic evidence site
//   - P.S. closes the deal

const SITE_URL = "https://echokappa.com/forensic-evidence";

// ── English update body (Brunson/Kennedy style) ────────────────────────────
export const UPDATE_BODY_EN = `You heard from me recently.

I told you about an organized surveillance operation targeting a U.S./British-Canadian citizen in Jacó, Costa Rica.

Here's the update:

It hasn't stopped.

Since that first email, the operation has escalated. Drones are still running. Physical monitoring continues around the clock. Network intrusion attempts are ongoing. Every one of these events is timestamped, logged, and verified.

I built a live forensic intelligence platform that captures everything as it happens — signal captures, network packet logs, satellite correlations, drone recordings with FFT acoustic analysis.

The full case is now public.

No login. No paywall. No spin.

→ ${SITE_URL}

What you'll find there:

23 documented violations across 4 jurisdictions (U.S. federal, Costa Rican Código Penal, international aviation, IACHR).

18 months of forensic documentation.

21 identified actors — named, sourced, cross-referenced.

Real-time signal intelligence updated continuously.

The primary suspect holds sole-source maintenance contracts for the backup generator systems at Juan Santamaría International Airport (SJO), Costa Rica's national power grid (ICE), and the CCSS national hospital network. CISA has published four CVEs against the exact hardware he services — including unauthenticated remote shutdown via open Modbus port. That's public record. It's all on the site.

The site is live. The operation is active. The clock is running.

→ ${SITE_URL}

Samuel Wotton
Jacó, Puntarenas, Costa Rica
+506 6377-3099 | hello@echokappa.com

P.S. The evidence platform includes SHA-256 verified packet captures, KiwiSDR RF spectrum recordings, drone video with FFT analysis, and Costa Rican Registro Nacional procurement records. Every item independently verifiable. If this case is in your jurisdiction or area of interest — the documentation is already there waiting for you.`;

// ── Spanish update body (CR authorities / judicial contacts) ────────────────
export const UPDATE_BODY_ES = `Usted recibió una comunicación de mi parte recientemente.

Le informé sobre una operación de vigilancia organizada en contra de un ciudadano extranjero en Jacó, Puntarenas.

Actualización urgente:

La operación no ha cesado.

Desde ese primer correo, las actividades han continuado y escalado. Vuelos de drones documentados. Monitoreo físico rotativo las 24 horas. Intentos de intrusión de red. Todo con marca de tiempo, registrado y verificado.

He construido una plataforma forense en tiempo real que captura la evidencia a medida que ocurre — capturas de señal, registros de red, correlaciones satelitales, grabaciones de drones con análisis FFT.

El expediente completo es ahora público.

Sin registro. Sin filtros.

→ ${SITE_URL}

Lo que encontrará en esa página:

23 infracciones documentadas en 4 jurisdicciones (Código Penal CR, derecho federal EE.UU., aviación internacional, CIDH).

18 meses de documentación forense.

21 actores identificados — con nombre, fuente y referencias cruzadas.

Inteligencia de señales en tiempo real actualizada continuamente.

El sospechoso principal mantiene contratos de monopolio para los sistemas de generadores de respaldo del Aeropuerto Internacional Juan Santamaría (SJO), la red eléctrica nacional (ICE) y los hospitales de la CCSS. La agencia CISA de EE.UU. ha publicado cuatro CVEs contra exactamente ese hardware — incluyendo apagado remoto sin autenticación vía puerto Modbus abierto. Es registro público. Todo está en el sitio.

La plataforma está activa. La operación continúa. El expediente crece cada día.

→ ${SITE_URL}

Samuel Wotton
Jacó, Puntarenas, Costa Rica
+506 6377-3099 | hello@echokappa.com

P.D. La plataforma incluye capturas de paquetes verificadas con SHA-256, grabaciones de espectro RF (KiwiSDR), video de drones con análisis FFT, y registros de contratación del Registro Nacional de Costa Rica. Cada elemento es verificable de forma independiente. El expediente está disponible para revisión inmediata.`;

// ── Spanish subject prefix detection ──────────────────────────────────────
export const SPANISH_CATEGORIES = new Set([
  "CR-LAW", "CR-JUDICIAL", "CR-SPECTRUM",
]);

export function isSpanishContact(category?: string, subject?: string): boolean {
  if (category && SPANISH_CATEGORIES.has(category)) return true;
  if (subject) {
    const s = subject.toLowerCase();
    if (s.startsWith("urgente") || s.startsWith("denuncia") || s.includes("código penal") || s.includes("ley 9048")) return true;
  }
  return false;
}
