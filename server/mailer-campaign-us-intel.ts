// US Intelligence / Oversight Campaign — Russian Nationals in Costa Rica
// Sam Wotton — May 31, 2026
// From: Samuel Wotton <hello@echokappa.com>

export interface USIntelContact {
  id: number;
  to: string;
  org: string;
  category: "US-EMBASSY" | "US-INTEL-OIG" | "US-CONGRESS" | "CR-JUDICIAL" | "CR-SPECTRUM";
  subject: string;
  body: string;
}

const EVIDENCE_URL = "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev/evidence/DENUNCIA_SAM_WOTTON_20260530.html";

const THREAT_ADDENDUM = `
CRITICAL UPDATE — LOGGED MAY 31, 2026:
Immediately after sending the first two formal reports today, I received a direct
verbal threat: "You just made the biggest mistake of your life."

This threat is significant not as intimidation, but as evidence: it demonstrates
that the surveillance network monitoring me has REAL-TIME visibility into my
electronic communications — including outgoing emails sent from my device on the
hotel network. This is consistent with active network-layer interception (documented
via PCAP analysis) and confirms that the surveillance infrastructure is still
operational as of this moment.

This threat has been logged in the formal evidence record.
`;

const bodyEmbassy = `To the American Citizens Services Officer,
U.S. Embassy San José, Costa Rica:

I am Samuel Philip Wotton, a U.S. citizen (DOB June 28, 1990; passport 5230633969),
currently located at Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica.
Phone: +506 6377-3099 | Email: spwotton@gmail.com

I am writing to formally report organized surveillance of a U.S. citizen by Russian
nationals operating in Costa Rica, and to request urgent consular assistance.

SITUATION SUMMARY:
For 17 months across 12+ addresses in Jacó I have been subjected to coordinated
surveillance including drone overflights, RF signal infrastructure, and network
intrusion — all documented with forensic-grade evidence. I am under active threat
to my life as of May 30, 2026.

RUSSIAN NATIONAL — PRIMARY SUBJECT ("J"):
In 2023 I lived with a Russian national known as "J" for approximately six months
in Jacó. He currently resides in Esterillos Oeste, Costa Rica (~12 km south of Jacó)
and operates multiple high-capability drones with no identifiable legitimate income
source. I have tracked drone flight paths from Playa Hermosa toward his known
residence. Multiple independent sources have confirmed Russian national involvement
in the operation against me.

${THREAT_ADDENDUM}

PRIOR REPORTING — NO RESPONSE:
I have submitted reports via FBI Tips, IC3, and the Embassy duty officer line on
multiple occasions over 17 months without acknowledgment or follow-up.

I am requesting:
1. Opening of a formal ACS welfare/protection case
2. Referral to the Embassy Regional Security Officer
3. Coordination with FBI Legal Attaché (Panama City, covers Costa Rica)

Full forensic evidence: ${EVIDENCE_URL}

Samuel Philip Wotton | spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Costa Rica`;

const bodyICIG = `To the Intelligence Community Inspector General Hotline:

I am Samuel Philip Wotton, U.S. citizen (passport 5230633969, DOB June 28, 1990),
currently at Hotel Pochote Grande, Jacó, Costa Rica.
Contact: spwotton@gmail.com | +506 6377-3099

I am reporting active Russian-national involvement in a 17-month surveillance and
harassment campaign against me — a U.S. citizen — in Jacó and surrounding areas
of Costa Rica.

RUSSIAN NATIONAL SUBJECT ("J"):
A Russian national I lived with for approximately six months in 2023 in Jacó now
resides in Esterillos Oeste, Costa Rica. He operates multiple high-capability
commercial drones inconsistent with any identifiable civilian income. I have tracked
drone flight paths originating near Playa Hermosa and terminating toward his
residence. Multiple independent sources have confirmed Russian national involvement.

DOCUMENTED SURVEILLANCE INFRASTRUCTURE (photographed):
- Military-pattern RF camouflage netting on residential balconies, Urbanización
  Los Ríos, Jacó — concealment of active high-power RF transmission hardware
- LiFi injection points (IEEE 802.11bb) — optical data transmission through windows
- Dipole antennas (HF/VHF) in residential settings
- ELF signal at 50 Hz detected (Costa Rica operates at 60 Hz — foreign hardware)

DOCUMENTED NETWORK INTRUSION (PCAP analysis):
- ePDG Liberty Latin America anomalous routing
- HiPerConTracer probes
- Anomalous 06:30 traffic spikes
- Samsung DTIgnite / Facebook Netseer telemetry exfiltration

${THREAT_ADDENDUM}

PRIOR REPORTING — NO RESPONSE IN 17 MONTHS:
FBI Tips, IC3, U.S. Embassy San José duty officer, State Department — no
acknowledgment received from any channel.

I am requesting referral to the appropriate counterintelligence element with
jurisdiction over Russian national activity in Central America.

Full forensic evidence: ${EVIDENCE_URL}

Samuel Philip Wotton | spwotton@gmail.com | +506 6377-3099`;

const bodyHPSCI = `Ms. Kohli,

I am writing to request that this be passed to the appropriate HPSCI committee
staff for review.

I am Samuel Philip Wotton, U.S. citizen (passport 5230633969), currently in Jacó,
Costa Rica. I am reporting active surveillance by Russian nationals — including
drone operations and RF intelligence infrastructure — spanning 17 months across
12+ locations, with active life threats as of May 30, 2026.

PRIMARY RUSSIAN SUBJECT:
A Russian national known as "J," whom I lived with for six months in 2023 in Jacó,
currently resides in Esterillos Oeste, Costa Rica and operates multiple surveillance
drones with no identifiable legitimate income source. I tracked drone flight paths
from Playa Hermosa toward his known residence on multiple occasions.

${THREAT_ADDENDUM}

I have reported to the FBI, IC3, State Department, and the U.S. Embassy San José
for 17 months. I have received zero responses or acknowledgments. I am escalating
to this committee as the oversight body for exactly this type of counterintelligence
matter involving Russian nationals targeting U.S. citizens abroad.

Evidence package: ${EVIDENCE_URL}

Samuel Philip Wotton | spwotton@gmail.com | +506 6377-3099
Hotel Pochote Grande, Jacó, Costa Rica`;

const bodyFiscalGeneral = `Señor Fiscal General Carlo Israel Díaz Sánchez:

Me dirijo a usted directamente dado que el caso que reporto excede la capacidad
de respuesta local e involucra elementos transnacionales con posible nexo a
inteligencia extranjera.

DENUNCIANTE: Samuel Philip Wotton, ciudadano estadounidense
Pasaporte: 5230633969 | Fecha de nacimiento: 28 junio 1990
Ubicación: Hotel Pochote Grande, Jacó, Puntarenas
Contacto: +506 6377-3099 | spwotton@gmail.com

HECHOS:
- 17 meses de hostigamiento organizado en 12+ ubicaciones en Jacó
- Red de vigilancia con infraestructura de RF ilegal documentada y fotografiada
  (Urbanización Los Ríos: camuflaje militar, LiFi, antenas dipolo)
- Nacional ruso conocido como "J", residente actual de Esterillos Oeste, con
  múltiples drones de alta capacidad — operaciones documentadas
- Rutas de drones trazadas desde Playa Hermosa hacia Esterillos Oeste (domicilio
  conocido del sujeto)
- Intrusión de red documentada en PCAP (ePDG Liberty, HiPerConTracer, ELF 50 Hz)
- Amenazas activas a la vida recibidas el 30 mayo 2026

ACTUALIZACIÓN CRÍTICA — 31 MAYO 2026:
Inmediatamente después de enviar los primeros reportes formales hoy, recibí una
amenaza verbal directa: "Cometiste el mayor error de tu vida."

Esta amenaza demuestra que la red de vigilancia tiene visibilidad en tiempo real
de mis comunicaciones electrónicas — confirmando intercepción activa de red,
consistente con el análisis PCAP documentado.

Denuncia previa ante CICO/OIJ (22 octubre 2025) — sin respuesta.

Informe forense completo: ${EVIDENCE_URL}

Samuel Philip Wotton | spwotton@gmail.com`;

const bodyOIJCyber = `Sección de Delitos Informáticos, OIJ San José:

Samuel Wotton, ciudadano estadounidense (pasaporte 5230633969).
Hotel Pochote Grande, Jacó | +506 6377-3099 | spwotton@gmail.com

Reporto evidencia técnica de crímenes informáticos activos y vigilancia por
parte de nacionales rusos en Jacó, Costa Rica.

SUJETO RUSO PRINCIPAL ("J"):
Nacional ruso con quien conviví ~6 meses en 2023 en Jacó, actualmente residente
en Esterillos Oeste. Opera múltiples drones de alta capacidad. He trazado rutas
de vuelo desde Playa Hermosa hacia su domicilio conocido.

EVIDENCIA TÉCNICA:
1. INTRUSIÓN DE RED (PCAP): picos 06:30, sondas HiPerConTracer, enrutamiento
   ePDG Liberty, telemetría Samsung DTIgnite, rastreo Facebook Netseer.
2. LiFi: puntos de inyección IEEE 802.11bb en Los Ríos — transmisión de datos
   por luz visible/IR, evade detección RF estándar.
3. DRONES: grabaciones acústicas forenses, firmas DJI Mini 2 identificadas.
4. ELF 50 Hz: Costa Rica opera en 60 Hz — equipo importado de 50 Hz activo.
5. CAMUFLAJE RF MILITAR: fotografiado en balcones residenciales de Los Ríos.

AMENAZA RECIBIDA HOY (31 MAYO 2026):
Tras enviar reportes formales esta tarde: "Cometiste el mayor error de tu vida."
Demuestra intercepción en tiempo real de mis comunicaciones electrónicas.

Expediente forense completo: ${EVIDENCE_URL}

Samuel Philip Wotton`;

const bodyMICITT = `Viceministerio de Telecomunicaciones, MICITT:

Denuncia urgente por operación de infraestructura de radiofrecuencia ilegal en
Urbanización Los Ríos, Jacó, Garabito, con nexo a nacionales rusos.

Denunciante: Samuel Wotton | +506 6377-3099 | spwotton@gmail.com
Ubicación: Hotel Pochote Grande, Jacó

INFRAESTRUCTURA ILEGAL DOCUMENTADA:
- Inyección LiFi (IEEE 802.11bb) sin licencia SUTEL conocida
- Camuflaje RF de patrón militar en balcones residenciales
- Antenas dipolo HF/VHF — redes de comunicación cerradas
- Señal ELF 50 Hz (anomalía en red costarricense de 60 Hz)

NEXO CON NACIONAL RUSO:
El sujeto principal ("J"), nacional ruso residente en Esterillos Oeste, opera
drones de vigilancia documentados. Esta infraestructura podría estar vinculada
a operaciones de inteligencia extranjera en territorio costarricense.

ACTUALIZACIÓN 31 MAYO 2026: Amenaza recibida tras enviar reportes formales,
confirmando intercepción activa de comunicaciones.

Fotografía de camuflaje RF: ${EVIDENCE_URL}
Informe técnico completo: ${EVIDENCE_URL}

Samuel Philip Wotton | spwotton@gmail.com`;

export const US_INTEL_CONTACTS: USIntelContact[] = [
  {
    id: 3001,
    to: "acssanjose@state.gov",
    org: "U.S. Embassy San José — American Citizens Services",
    category: "US-EMBASSY",
    subject: "EMERGENCY — U.S. Citizen Under Active Russian-Linked Surveillance — Jacó, Costa Rica — New Death Threat Today",
    body: bodyEmbassy,
  },
  {
    id: 3002,
    to: "ICIGHotline@dni.gov",
    org: "Intelligence Community Inspector General",
    category: "US-INTEL-OIG",
    subject: "Foreign Intelligence Activity Against U.S. Citizen — Russian Nationals — Costa Rica — Comms Interception Confirmed",
    body: bodyICIG,
  },
  {
    id: 3003,
    to: "Nora.Kohli@mail.house.gov",
    org: "HPSCI — House Permanent Select Committee on Intelligence",
    category: "US-CONGRESS",
    subject: "For Committee Attention — U.S. Citizen Targeted by Russian Nationals — Costa Rica — 17 Months No Agency Response",
    body: bodyHPSCI,
  },
  {
    id: 3004,
    to: "fgeneral@poder-judicial.go.cr",
    org: "Fiscalía General de la República — Costa Rica",
    category: "CR-JUDICIAL",
    subject: "URGENTE — Conocimiento del Fiscal General — Nacionales rusos, vigilancia transnacional, amenaza activa — Jacó",
    body: bodyFiscalGeneral,
  },
  {
    id: 3005,
    to: "fiscalia.general@ministeriopublico.go.cr",
    org: "Fiscalía General — Ministerio Público Costa Rica (backup)",
    category: "CR-JUDICIAL",
    subject: "URGENTE — Nacional ruso, infraestructura SIGINT ilegal, amenaza a la vida — Jacó, Garabito",
    body: bodyFiscalGeneral,
  },
  {
    id: 3006,
    to: "invest_informaticas@poder-judicial.go.cr",
    org: "OIJ Sección de Delitos Informáticos — San José",
    category: "CR-JUDICIAL",
    subject: "URGENTE — Intrusión de red, LiFi, drones, nacionales rusos — Ciudadano extranjero bajo amenaza — Jacó",
    body: bodyOIJCyber,
  },
  {
    id: 3007,
    to: "micitt@micitt.go.cr",
    org: "MICITT — Viceministerio de Telecomunicaciones",
    category: "CR-SPECTRUM",
    subject: "Denuncia urgente — Infraestructura RF ilegal, LiFi sin licencia, nexo con nacional ruso — Los Ríos, Jacó",
    body: bodyMICITT,
  },
  {
    id: 3008,
    to: "cicooij@poder-judicial.go.cr",
    org: "OIJ CICO — Centro de Información Confidencial",
    category: "CR-JUDICIAL",
    subject: "URGENTE — Seguimiento a denuncia oct 2025 — Nacional ruso activo, amenaza vida, intercepción comunicaciones",
    body: bodyOIJCyber,
  },
];
