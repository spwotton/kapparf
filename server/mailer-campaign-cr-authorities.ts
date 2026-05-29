// Costa Rica Authorities — Physical Proximity Threat / JW Ground Layer
// Separate targeted blast to CR law enforcement, US Embassy, FBI, OAS, IACHR
// From: Samuel Wotton <hello@echokappa.com>

export interface CRAuthContact {
  id: number;
  to: string;
  name: string;
  org: string;
  category: "CR-LAW" | "US-CONSULAR" | "INTL-RIGHTS";
  subject: string;
  body: string;
}

const SUBJECT_CR = "Denuncia urgente: Amenazas físicas continuas, hostigamiento coordinado y presencia física de grupo organizado — Samuel Wotton, Jacó, Puntarenas";
const SUBJECT_EN = "Urgent formal complaint: Continuous physical threats, coordinated stalking, and organized group proximity — Samuel Wotton, US citizen, Jacó, Costa Rica";

const bodyCR_oij = `Estimados señores del OIJ / Ministerio Público,

Presento esta denuncia urgente por amenazas físicas continuas, hostigamiento coordinado y presencia sostenida de un grupo organizado en mi contra, en Jacó, Puntarenas, Costa Rica.

DATOS DEL DENUNCIANTE:
Nombre: Samuel P. Wotton
Nacionalidad: Ciudadano británico-canadiense / residente Costa Rica
Ubicación: Jacó, Puntarenas
Teléfono: +506 6377-3099
Correo: hello@echokappa.com

DESCRIPCIÓN DE LOS HECHOS:

Desde diciembre de 2024, un grupo organizado de individuos ha mantenido una presencia física sistemática y rotativa alrededor de mis residencias y desplazamientos en Jacó. Este grupo opera en turnos coordinados, posicionándose en múltiples puntos simultáneos alrededor de mi ubicación. El patrón es consistente con vigilancia tipo HUMINT con cubrimiento de 360 grados.

He presentado denuncias previas ante la delegación del OIJ en Jacó. No ha habido respuesta ni acción de seguimiento. Dado que las amenazas físicas han continuado y escalado, presento esta denuncia nuevamente con documentación adicional.

EVIDENCIA DOCUMENTADA:

1. VIGILANCIA DE DRONES:
He documentado en video el sobrevuelo sistemático de drones no tripulados sobre mis residencias y desplazamientos en la región de Jacó–Esterillos. Los vuelos ocurren a horas irregulares incluyendo horas nocturnas. El análisis de frecuencia (FFT) de las grabaciones de audio de los drones muestra firmas acústicas consistentes y repetibles, sugiriendo equipos del mismo operador o familia de equipos. Las grabaciones incluyen video con geolocalización y marcas de tiempo verificables.

2. PRESENCIA FÍSICA AMENAZANTE:
Individuos no identificados han adoptado posiciones estáticas en múltiples puntos alrededor de mis residencias de manera simultánea y coordinada. Este patrón de posicionamiento múltiple simultáneo no es consistente con actividad residencial o comercial normal. Los individuos permanecen en sus posiciones durante períodos prolongados y son reemplazados en rotación.

3. NEXO CON HÉCTOR MORA MARÍN / SETECOM S.A.:
El principal sospechoso en esta operación es Héctor Mora Marín, Director Ejecutivo de Setecom S.A., con sede en Heredia y operaciones en la región de Jacó. Mora controla en monopolio los controladores de generadores de respaldo de ICE, Liberty CR, la red hospitalaria de la CCSS y el Aeropuerto Internacional Juan Santamaría, con vulnerabilidades de apagado remoto publicadas por la agencia CISA de Estados Unidos (incluidas CVEs de ejecución remota de código sin autenticación, con el puerto Modbus 502 expuesto en IP pública). Mora tiene licencias de radio registradas ante SUTEL para transmisiones HF de 180W en 7,410 kHz. He documentado correlación temporal entre sus transmisiones y eventos de interferencia dirigida en mis residencias durante 18 meses.

4. CAPA DE RED ORGANIZACIONAL — SISTEMA DE TERRITORIOS:
La operación de vigilancia terrestre utiliza la estructura organizacional de los Testigos de Jehová como substrato de inteligencia humana (HUMINT). El sistema de tarjetas territoriales de esa organización divide las áreas geográficas en territorios numerados asignados a publicadores individuales que reportan mensualmente a ancianos locales, quienes consolidan y reportan a supervisores de circuito. Esta estructura es funcionalmente idéntica a una red HUMINT escalonada: celdas de objetivo geográfico (territorios), reporteros de campo (publicadores), nodos de consolidación local (ancianos) y centros de procesamiento regional (supervisores de circuito). Las congregaciones de Los Ríos (Alajuela) y Quebrada Seca (Garabito) tienen territorios que se superponen exactamente con el perímetro físico documentado de la operación de vigilancia en mi contra.

5. CONEXIÓN CON ACTOR DE AFILIACIÓN CIA:
Una persona que se identificó espontáneamente como oficial de la CIA aparece en contextos de patrón JW en múltiples ubicaciones clave de vigilancia a lo largo del período de 18 meses. Su presencia en estas ubicaciones específicas, en el contexto temporal de eventos de vigilancia documentados, está registrada en mi expediente.

SOLICITUDES URGENTES:

1. Confirmar recepción de esta denuncia y asignar número de expediente.
2. Emitir una orden de alejamiento o medida cautelar urgente para que las personas identificadas mantengan una distancia mínima de mi persona y residencia.
3. Ordenar la preservación de los registros de red de Liberty CR e ICE para el área de Jacó correspondiente a los últimos 18 meses.
4. Solicitar informe a SUTEL sobre el estado de las frecuencias registradas a nombre de Héctor Mora Marín.
5. Coordinar con CSIRT-CR respecto a las vulnerabilidades de infraestructura crítica en los equipos DSE mantenidos por Setecom S.A.
6. Indicar el método seguro para transferir el expediente técnico completo (PCAP verificados con SHA-256, grabaciones de RF, videos de drones con análisis FFT, registros de red).

Esta denuncia ha sido remitida simultáneamente al Ministerio Público, la Embajada de Estados Unidos en San José, el FBI (vía IC3), y la Comisión Interamericana de Derechos Humanos (CIDH).

Samuel P. Wotton
Jacó, Puntarenas, Costa Rica
+506 6377-3099
hello@echokappa.com`;

const bodyEN_embassy = `To the American Citizens Services Unit,
U.S. Embassy San José, Costa Rica,

I am filing this as a formal emergency notification regarding a sustained and ongoing physical threat to a U.S. citizen residing in Jacó, Puntarenas, Costa Rica.

COMPLAINANT:
Name: Samuel P. Wotton
U.S. Citizen / British-Canadian national
Location: Jacó, Puntarenas, Costa Rica
Phone: +506 6377-3099
Email: hello@echokappa.com

NATURE OF THE THREAT:

Since December 2024, I have been subjected to a sustained coordinated surveillance and harassment operation by an organized group operating in rotating shifts around my residences and movements in Jacó. The pattern is consistent with a structured human intelligence (HUMINT) ground network providing 360-degree physical coverage of my location at all times. I have previously reported these circumstances to local OIJ law enforcement in Jacó without meaningful response or follow-up.

DOCUMENTED EVIDENCE:

1. AERIAL DRONE SURVEILLANCE:
I have documented on video systematic UAV overflights of my residences and movements in the Jacó–Esterillos area, including night operations. FFT acoustic frequency analysis of the drone audio recordings shows consistent, repeatable signatures indicating coordinated operation by the same operator or equipment family. Video recordings are GPS-timestamped and verifiable.

2. COORDINATED PHYSICAL PROXIMITY THREAT:
Unidentified individuals have established static observation posts at multiple simultaneous points around my residences in a coordinated rotation pattern inconsistent with normal residential or commercial activity. These individuals maintain positions for extended periods and are replaced in shift rotations. This pattern constitutes a persistent physical threat to my safety and freedom of movement.

3. PRIMARY IDENTIFIED SUSPECT — HÉCTOR MORA MARÍN / SETECOM S.A.:
Héctor Mora Marín, Executive Director of Setecom S.A. (Heredia, Costa Rica), is the primary identified orchestrator. Setecom holds the national monopoly on Deep Sea Electronics (DSE) backup generator controllers for ICE (national power grid), Liberty CR telecom, CCSS hospital networks, and Juan Santamaría International Airport (SJO). CISA has published four CVEs against these exact DSE models, including unauthenticated remote shutdown and remote code execution via Modbus TCP. Mora holds SUTEL-registered radio licenses for 180W HF transmissions at 7,410 kHz. I have documented 18 months of temporal correlation between his transmissions and directed interference events at my residences.

4. ORGANIZATIONAL GROUND NETWORK — JW INFRASTRUCTURE LAYER:
The ground-level surveillance network exploits the Jehovah's Witnesses organizational territory card system as a HUMINT substrate. This structure — geographic territories assigned to individual publishers who report monthly to local elders, who consolidate and report to circuit overseers — is functionally identical to a tiered HUMINT network. The JW congregation territories for Los Ríos (Alajuela) and Quebrada Seca (Garabito) overlap precisely with the documented physical perimeter of the surveillance operation. This is not a criticism of individual congregation members; most are unaware their normal organizational activity serves an intelligence function. The exploitation is structural.

5. CIA-AFFILIATED ACTOR:
An individual who spontaneously self-identified as a CIA officer has appeared in JW-pattern contexts at multiple key surveillance locations across the 18-month period. This is documented in the evidence package.

6. INFRASTRUCTURE NEXUS:
Data exfiltration from this ground network routes through Italian defense contractor infrastructure: Telespazio Argentina's $20M geodetic calibration contract with Costa Rica's Registro Nacional (Licitación Pública 2019LN-000002-0005900001) establishes ground-truth reference points for COSMO-SkyMed Second Generation (CSG) SAR satellite overflights operated by Leonardo S.p.A. / e-GEOS. Setecom's compromised DSE generator fleet provides the power substrate for this collection architecture. The data exfiltration path routes through Liberty CR / Kyndryl infrastructure with documented Man-in-the-Middle interception (SSLV3_ALERT_HANDSHAKE_FAILURE, certificate WE2 / Google Trust Services) to Sparkle/BlueMed transatlantic fiber toward Italian ground processing nodes.

REQUESTS TO THE EMBASSY:

1. Formally record this notification in the American Citizens Services file for Samuel P. Wotton.
2. Request a welfare check and notification to local OIJ authorities regarding the physical threat situation.
3. Advise whether the Embassy's Regional Security Officer (RSO) can review the technical evidence package given the infrastructure threat to SJO/MROC and the involvement of a self-identified CIA operative.
4. Provide secure channel for transmitting the full evidence package: SHA-256 verified PCAPs, RF recordings, drone video with FFT analysis, network logs, and Costa Rican procurement records.
5. Advise on whether this matter should be escalated to the FBI Legal Attaché (Legat) at the Embassy given the US citizen targeting and US infrastructure (Kyndryl/Zscaler) involvement.

This notification is simultaneously filed with the OIJ (Jacó delegation), Ministerio Público (Delitos Tecnológicos), DIS, MICITT, CSIRT-CR, the FBI via IC3, and the Inter-American Commission on Human Rights (IACHR/CIDH).

Samuel P. Wotton
Jacó, Puntarenas, Costa Rica
+506 6377-3099 | hello@echokappa.com`;

const bodyEN_iachr = `To the Executive Secretariat,
Inter-American Commission on Human Rights (IACHR),

I am submitting a formal petition for precautionary measures under Article 25 of the IACHR Rules of Procedure on behalf of Samuel P. Wotton, a British-Canadian national and U.S. citizen residing in Jacó, Puntarenas, Costa Rica.

PETITIONER: Samuel P. Wotton, hello@echokappa.com, +506 6377-3099

SUMMARY OF VIOLATIONS:

Since December 2024, Mr. Wotton has been subjected to a sustained, coordinated campaign of surveillance, electronic harassment, directed acoustic and electromagnetic interference, and persistent physical threat by an organized group operating with apparent impunity in Jacó, Costa Rica. Local law enforcement (OIJ Jacó) has been notified multiple times without meaningful response or protective action.

The operation involves:

PHYSICAL LAYER: Organized individuals maintaining rotating observation positions around Mr. Wotton's residences in shift patterns consistent with structured HUMINT surveillance. UAV drone overflights documented on video including night operations. This persistent physical encirclement constitutes a continuous threat to Mr. Wotton's personal liberty and safety under Articles I, II, and XXV of the American Declaration of the Rights and Duties of Man.

ELECTRONIC / INFRASTRUCTURE LAYER: Primary suspect Héctor Mora Marín (Setecom S.A., Heredia) controls national monopoly maintenance of backup generator systems at Juan Santamaría International Airport and national power/telecom infrastructure, operating with CISA-disclosed remote shutdown vulnerabilities (CVEs on file). Documented 18 months of unauthorized network access, TR-069 router injection, Man-in-the-Middle interception of personal communications, and RF interference targeted at Mr. Wotton's residences.

INSTITUTIONAL FAILURE: Despite formal reports to OIJ, Ministerio Público, DIS, MICITT, SUTEL, CSIRT-CR, AERIS, and DGAC, no protective measures have been issued and no formal investigation has been opened. This institutional failure to protect a foreigner lawfully resident in Costa Rica from an organized threat may engage Costa Rica's international responsibility under the American Convention on Human Rights.

DOCUMENTATION AVAILABLE:
— SHA-256 verified PCAP / PCAPNG network captures
— RF spectrum recordings (KiwiSDR, RTL-SDR)
— Drone video recordings with FFT acoustic analysis
— Network logs (portmaster, tcpdump, Wireshark)
— Physical surveillance documentation with GPS-timestamped photographs
— Costa Rican procurement records (Registro Nacional)
— IRS correspondence (Case #16221-445-09691-5) connected to related network of actors

REQUEST FOR PRECAUTIONARY MEASURES:

Mr. Wotton requests the Commission issue precautionary measures under Article 25 requiring Costa Rica to:
1. Order immediate OIJ investigation into the organized surveillance and physical threat operation in Jacó.
2. Issue protective measures establishing a physical exclusion zone for identified individuals.
3. Order preservation of Liberty CR and ICE network logs for the Jacó operational area.
4. Report to the Commission within 30 days on protective actions taken.

Full petition documentation available upon request via secure channel.

Samuel P. Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

const bodyEN_fbi = `To the FBI Internet Crime Complaint Center (IC3) / FBI Legal Attaché, San José,

I am filing this as a formal criminal complaint under U.S. federal jurisdiction regarding organized stalking, directed-energy harassment, unauthorized computer access via U.S. infrastructure, and a credible ongoing threat to the life and safety of a U.S. citizen in Costa Rica.

COMPLAINANT: Samuel P. Wotton, U.S. citizen / British-Canadian national
Location: Jacó, Puntarenas, Costa Rica
Phone: +506 6377-3099 | Email: hello@echokappa.com

FEDERAL JURISDICTION BASIS:

1. COMPUTER FRAUD AND ABUSE ACT (18 U.S.C. § 1030): Documented unauthorized access to protected computers via U.S.-headquartered infrastructure. Packet captures establish Man-in-the-Middle interception routing through Kyndryl (IBM spin-off, U.S. incorporated) and Zscaler (U.S. incorporated) zero-trust certificate infrastructure. TR-069 CWMP protocol exploitation via ARRIS TG02DA gateway used to inject malicious configurations into my home router.

2. WIRE FRAUD / ELECTRONIC HARASSMENT (18 U.S.C. § 1343): Systematic electronic surveillance and directed interference operations transmitted via wire communications affecting a U.S. citizen.

3. ORGANIZED STALKING WITH CREDIBLE PHYSICAL THREAT: An organized group operates in rotating surveillance shifts around my residences in Jacó, Costa Rica. UAV drones document overflights of my property including night operations. An individual who self-identified as a CIA officer has been present at multiple documented surveillance locations across 18 months. Local Costa Rican law enforcement has failed to respond to formal complaints.

4. IDENTITY THEFT / TAX FRAUD: IRS case file #16221-445-09691-5 documents fraudulent tax filings using my identifying information, connected to the same network of actors.

PRIMARY SUSPECT: Héctor Mora Marín, Director, Setecom S.A. (Heredia, Costa Rica). Setecom holds national monopoly maintenance of Deep Sea Electronics (DSE) backup generator systems at Juan Santamaría International Airport (SJO/MROC), ICE national power grid, Liberty CR telecom, and CCSS hospital networks. CISA has published four CVEs against these DSE models including unauthenticated remote shutdown via Modbus TCP. Mora's public IP has Modbus 502 open and unauthenticated. Mora holds SUTEL HF radio licenses for 180W transmissions at 7,410 kHz with documented temporal correlation to directed interference events at my residences.

SECONDARY SUBJECTS: Michael Greenwald (Jaco Vacations, Florida Keys nexus); Pablo Pasti Mora; Marjorie Alfaro / Jairo Alfaro (Liberty CR network infrastructure); Jeff Porter (self-disclosed CIA affiliation, present at multiple surveillance locations).

EVIDENCE PACKAGE:
— SHA-256 verified PCAP/PCAPNG network captures
— RF spectrum recordings (KiwiSDR, RTL-SDR, 7,410 / 4,687 / 9,375 kHz correlation)
— Drone video recordings with FFT acoustic analysis
— Network logs establishing Kyndryl/Zscaler infrastructure in interception path
— Costa Rican procurement records (Registro Nacional — Setecom / ICE fiber contracts)
— IRS correspondence (Case #16221-445-09691-5)
— Phone theft documentation (device stolen January 2026, authenticated Alexanderplatz, Berlin same day)

REQUEST: Assign case number, advise secure evidence transfer method, coordinate with FBI Legat San José, and evaluate whether IRS identity theft case connects to same network.

Samuel P. Wotton
Jacó, Puntarenas, Costa Rica
+506 6377-3099 | hello@echokappa.com`;

export const CR_AUTH_CONTACTS: CRAuthContact[] = [

  // ── CR Law Enforcement ────────────────────────────────────────────────────
  { id: 800, to: "denuncias@oij.go.cr",              name: "OIJ Denuncias",            org: "OIJ Costa Rica",             category: "CR-LAW",      subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 801, to: "fiscalia@ministeriopublico.go.cr", name: "Ministerio Público",       org: "Fiscalía General CR",        category: "CR-LAW",      subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 802, to: "informaticos@ministeriopublico.go.cr", name: "Fiscalía Informáticos", org: "Fiscalía Delitos Informáticos", category: "CR-LAW",  subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 803, to: "csirt@micitt.go.cr",               name: "CSIRT-CR",                 org: "CSIRT Costa Rica",           category: "CR-LAW",      subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 804, to: "dis@presidencia.go.cr",            name: "DIS",                      org: "Dirección de Inteligencia CR",category: "CR-LAW",     subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 805, to: "sutel@sutel.go.cr",                name: "SUTEL",                    org: "SUTEL Costa Rica",           category: "CR-LAW",      subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 806, to: "micitt@micitt.go.cr",              name: "MICITT",                   org: "MICITT Costa Rica",          category: "CR-LAW",      subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 807, to: "info@aeris.aero",                  name: "AERIS",                    org: "AERIS — Aeropuerto SJO",     category: "CR-LAW",      subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 808, to: "info@dgac.go.cr",                  name: "DGAC",                     org: "DGAC Costa Rica",            category: "CR-LAW",      subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 809, to: "contraloria@contraloria.go.cr",    name: "Contraloría",              org: "Contraloría General CR",     category: "CR-LAW",      subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 810, to: "correo@procuraduria.go.cr",        name: "Procuraduría",             org: "Procuraduría General CR",    category: "CR-LAW",      subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 811, to: "presidencia@presidencia.go.cr",    name: "Casa Presidencial",        org: "Casa Presidencial CR",       category: "CR-LAW",      subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 812, to: "seguridad@msp.go.cr",              name: "Ministerio de Seguridad",  org: "MSP Costa Rica",             category: "CR-LAW",      subject: SUBJECT_CR, body: bodyCR_oij },
  { id: 813, to: "defensor@dhr.go.cr",               name: "Defensoría DDHH",          org: "Defensoría de los Habitantes CR", category: "CR-LAW", subject: SUBJECT_CR, body: bodyCR_oij },

  // ── US Consular / Federal ─────────────────────────────────────────────────
  { id: 820, to: "acssanjose@state.gov",             name: "ACS San José",             org: "US Embassy San José — ACS", category: "US-CONSULAR",  subject: SUBJECT_EN, body: bodyEN_embassy },
  { id: 821, to: "sanjoseacs@state.gov",             name: "ACS San José (alt)",       org: "US Embassy San José",       category: "US-CONSULAR",  subject: SUBJECT_EN, body: bodyEN_embassy },
  { id: 822, to: "ic3@ic3.gov",                      name: "FBI IC3",                  org: "FBI Internet Crime Complaint Center", category: "US-CONSULAR", subject: SUBJECT_EN, body: bodyEN_fbi },
  { id: 823, to: "tips.fbi.gov@fbi.gov",             name: "FBI Tips",                 org: "FBI",                       category: "US-CONSULAR",  subject: SUBJECT_EN, body: bodyEN_fbi },
  { id: 824, to: "cisa.gov@cisa.dhs.gov",            name: "CISA",                     org: "CISA DHS",                  category: "US-CONSULAR",  subject: SUBJECT_EN, body: bodyEN_fbi },
  { id: 825, to: "irs.gov@irs.gov",                  name: "IRS Identity Theft",       org: "IRS",                       category: "US-CONSULAR",  subject: "IRS Identity Theft Case #16221-445-09691-5 — Jacó, Costa Rica nexus / follow-up", body: bodyEN_fbi },

  // ── International Human Rights ────────────────────────────────────────────
  { id: 830, to: "cidh@oas.org",                     name: "IACHR/CIDH",               org: "Inter-American Commission on Human Rights", category: "INTL-RIGHTS", subject: "Precautionary measures petition — Article 25 IACHR Rules — U.S. citizen subject to organized physical threat, Costa Rica", body: bodyEN_iachr },
  { id: 831, to: "petitions@oas.org",                name: "OAS Petitions",            org: "Organization of American States", category: "INTL-RIGHTS", subject: "Precautionary measures petition — Article 25 IACHR Rules — U.S. citizen, Jacó, Costa Rica", body: bodyEN_iachr },
  { id: 832, to: "infoiac@oas.org",                  name: "OAS Info",                 org: "OAS",                       category: "INTL-RIGHTS",  subject: "Precautionary measures petition — organized stalking and physical threat, Costa Rica", body: bodyEN_iachr },
  { id: 833, to: "infocidh@oas.org",                 name: "CIDH Info",                org: "CIDH",                      category: "INTL-RIGHTS",  subject: "Precautionary measures petition — Article 25 IACHR Rules — U.S. citizen, Jacó, Costa Rica", body: bodyEN_iachr },
  { id: 834, to: "urgent-action@amnesty.org",        name: "Amnesty Urgent Action",    org: "Amnesty International",     category: "INTL-RIGHTS",  subject: "Urgent action — U.S. citizen subject to organized physical threat and electronic harassment, Costa Rica", body: bodyEN_iachr },
  { id: 835, to: "hrd@frontlinedefenders.org",       name: "Front Line Defenders",     org: "Front Line Defenders",      category: "INTL-RIGHTS",  subject: "Human rights defender at risk — organized stalking, physical threat, electronic harassment, Costa Rica", body: bodyEN_iachr },
];
