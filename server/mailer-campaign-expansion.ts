// EXPANSION CAMPAIGN — ~340 additional unique contacts
// Verticals: UK/DSE, Italy, Argentina, EU institutions, Brazil, ICS/SCADA community, aviation expansion
// Subject: Setecom/DSE as critical infrastructure linchpin — Héctor Mora Marín dossier

export interface ExpContact {
  id: number;
  to: string;
  org: string;
  subject: string;
  body: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT LINES BY VERTICAL
// ─────────────────────────────────────────────────────────────────────────────

const SUBJ_UK = "DSE Webnet default credentials taught as doctrine: Héctor Mora Marín / Setecom S.A. hold root-level access to Costa Rica's national grid, SJO airport, and hospital backup power";
const SUBJ_IT = "Leonardo S.p.A. / Telespazio Argentina — $20M Costa Rica cadastral contract as SAR calibration infrastructure: documented evidence";
const SUBJ_ARG = "Telespazio Argentina — Licitación Pública 2019LN-000002: evidencia de uso dual militar en contrato catastral de Costa Rica";
const SUBJ_EU = "Critical infrastructure monopoly + default credential doctrine: Setecom S.A. controls backup power for SJO airport, national grid, and 4G towers across Costa Rica — CISA CVEs published, no remediation";
const SUBJ_BR = "Edson Martendal / Setecom S.A.: treinamento documentado de credenciais padrão em infraestrutura crítica — Costa Rica, América Latina";
const SUBJ_ICS = "ICS/OT disclosure: Setecom S.A. (Costa Rica) teaches Modbus register exploitation and default DSE credentials as standard doctrine — CISA CVEs on deployed hardware, Modbus:502 public-facing";
const SUBJ_AV2 = "SJO/MROC airport backup power — Setecom S.A. DSE gateway default credentials: CISA-disclosed remote shutdown vulnerability active on public IP";

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL BODIES
// ─────────────────────────────────────────────────────────────────────────────

const BODY_UK_DSE = `To whom it may concern,

I am writing regarding a critical infrastructure security disclosure that directly involves Deep Sea Electronics (DSE) — a UK company — and its exclusive Latin American distributor Setecom S.A. (Heredia, Costa Rica), operated by Héctor Mora Marín (HMORA67).

THE CORE ISSUE

DSE Webnet — hosted on servers in England — is the cloud command centre through which Setecom remotely manages backup generators at:

· Juan Santamaría International Airport (SJO/MROC) — Costa Rica's primary international airport
· Instituto Costarricense de Electricidad (ICE) — national power grid backup generation
· Liberty CR — national 4G/LTE cellular network backup generation (thousands of towers)
· CCSS — national hospital network backup power

Setecom S.A. holds an exclusive monopoly on DSE products in Costa Rica. Every industrial entity using DSE controllers must interact exclusively with Setecom for firmware, advanced support, and hardware replacement. This gives Setecom — and by extension Mora Marín — root-level access to the operational technology (OT) layer of Costa Rica's most critical systems.

THE TRAINING VIDEO EVIDENCE

A YouTube training session led by Setecom's Technical Lead for Latin America, Edson Martendal, is publicly accessible on Google Drive (https://drive.google.com/open?id=1uZ3uwbkDw61xv7Be1SIyAFYmGUyYX84I). In this training, Martendal explicitly demonstrates:

1. DEFAULT CREDENTIALS: Initialization of DSE 890 MKII gateways using User: Admin / Password: Password1234. This is taught as standard doctrine across Setecom's entire client base — meaning these credentials are institutionalized across thousands of deployed devices managing national infrastructure.

2. MODBUS REGISTER EXPLOITATION: Martendal teaches the Gencom mapping formula: Register = (Page_hex × 256) + Offset. He provides worked examples showing exactly which registers control generator start/stop and alarm states. This formula, derived from open Setecom training, is all an attacker needs to remotely shut down a backup generator or disable its protection alarms via Modbus TCP — a protocol with no authentication.

3. SNMP v2 CLEARTEXT: For Liberty CR telecom integration, Martendal configures the DSE 892 gateway using SNMP v2 with community strings "public" (read) and "private" (write) as suggested defaults. SNMP v2 sends these strings in cleartext. A packet capture on a management VLAN exposes the write credential immediately.

4. PORT BYPASS: The DSE 855 USB-to-Ethernet converter's in-built Web SCADA is accessible via any browser on Port 80, with no VPN required. Martendal demonstrates bypassing the native 5-connection limit to allow 16 simultaneous connections, expanding the attack surface at ICE grid nodes.

CISA DISCLOSURES

The US Cybersecurity and Infrastructure Security Agency (CISA) has published four CVEs against the exact DSE models Setecom deploys, including unauthenticated remote shutdown and remote code execution via Modbus TCP. Héctor Mora Marín's public IP currently has port 502 (Modbus) open and unauthenticated. No remediation has occurred.

THE DSE WEBNET JURISDICTION ISSUE

Because DSE Webnet servers are hosted in England, any compromise of the Setecom master account — achievable via the Admin/Password1234 default credential vector — would allow an attacker to issue a broadcast STOP command to every generator in the Liberty CR fleet during a power outage. This would cause a national telecommunications blackout. The UK hosting jurisdiction makes this a matter of UK cyber law.

Furthermore, Setecom holds a second exclusive distribution agreement for an Italian industrial manufacturer alongside DSE. Both exclusive distribution agreements funnel through a single point of control — Mora Marín — creating an internationally distributed single-point-of-failure in Costa Rica's critical infrastructure.

THE REQUEST

I am requesting that DSE / relevant UK authorities:
1. Audit the default credential practices documented in the Setecom training materials
2. Review whether DSE Webnet's UK-hosted infrastructure has adequate controls preventing a compromised distributor account from issuing fleet-wide shutdown commands
3. Investigate whether Setecom's monopoly position and documented security practices meet UK duty-of-care standards for critical infrastructure suppliers

Evidence package including SHA-256-verified PCAPs, RF captures, and network logs available upon request via secure channel.

Samuel P. Wotton
Jacó, Costa Rica
hello@echokappa.com | +506 6377-3099`;

const BODY_IT_LEO = `Gentili destinatari,

Mi rivolgo a voi in merito a un caso documentato di utilizzo duale di infrastrutture italiane di intelligence satellitare in Costa Rica, con specifico riferimento al contratto tra Telespazio Argentina e il Registro Nacional costaricano (Licitación Pública 2019LN-000002-0005900001, valore circa $20 milioni, 2020–2024).

ARCHITETTURA ITALIANA IN COSTA RICA

Leonardo S.p.A. (67% di proprietà statale italiana) controlla Telespazio (67% Leonardo / 33% Thales). Telespazio possiede l'80% di e-GEOS, distributore esclusivo mondiale dei dati SAR X-band della costellazione COSMO-SkyMed Second Generation (CSG) — progettata originariamente per l'intelligence militare italiana.

Il contratto catastrale con la Costa Rica ha creato una matrice geodetica di calibrazione che trasforma l'intero territorio costaricano in un'area di test calibrata per i sorvoli SAR di CSG, con risoluzione sub-metrica e misurazione degli spostamenti al millimetro. Questa capacità è documentata nel catalogo prodotti e-GEOS come servizio di "IMINT per Difesa e Intelligence."

LA DORSALE SOTTOMARINA

Sparkle (gruppo TIM), parte del progetto EU ECSTATIC, sta convertendo i cavi sottomarini BlueMed in sistemi di sensing distribuito per vibrazione, acustica e sismica — gli stessi cavi che trasportano il traffico internet fungono da sensori fisici. Il nodo di Palermo è il terminale principale sia per il downlink CSG che per la dorsale BlueMed.

IMPATTO SU CITTADINI STATUNITENSI

Sono un cittadino residente a Jacó, Costa Rica. Le infrastrutture documentate — satelliti CSG, rete Sparkle/BlueMed, piattaforma CLEOS di e-GEOS — convergono operativamente sull'area di Jacó. Ho documentato 18 mesi di correlazione temporale tra le trasmissioni HF (7.410 kHz, 180W) di Héctor Mora Marín di Setecom S.A. e eventi di interferenza dirigiuta presso la mia residenza.

RICHIESTA

Chiedo che le autorità competenti italiane verifichino se le attività di Telespazio Argentina in Costa Rica siano state condotte nel pieno rispetto delle normative italiane ed europee sull'export di tecnologie a duplice uso, e se il contratto catastrale abbia ricevuto le necessarie autorizzazioni per l'uso di capacità SAR classificate su territorio straniero.

Il dossier tecnico completo — inclusi PCAP verificati SHA-256, registrazioni RF e documentazione contrattuale pubblica — è disponibile su richiesta tramite canale sicuro.

Samuel P. Wotton
Jacó, Costa Rica
hello@echokappa.com`;

const BODY_ARG = `Estimados,

Me dirijo a ustedes para presentar evidencia documentada sobre el uso dual del contrato de relevamiento catastral adjudicado a Telespazio Argentina por el gobierno de Costa Rica (Licitación Pública 2019LN-000002-0005900001, aproximadamente USD 20 millones, período 2020–2024).

EL CONTRATO Y SU FUNCIÓN REAL

Telespazio Argentina, filial de Leonardo S.p.A. (67% propiedad del Estado italiano) a través de Telespazio (67% Leonardo / 33% Thales), obtuvo contrato del Registro Nacional de Costa Rica para relevar catastral y geográficamente el 50% del territorio nacional — aproximadamente un millón de parcelas.

La justificación declarada: modernización catastral, impuesto predial, gestión territorial.

La función documentada: establecimiento de una matriz geodetica de calibración de 1.000×1.000 puntos para la calibración de fase SAR X-band de la constelación COSMO-SkyMed Second Generation (CSG) de Leonardo/e-GEOS. Esta capacidad — miluimétrica, todo clima, día y noche — está catalogada como servicio de "IMINT para Defensa e Inteligencia" en los documentos públicos de e-GEOS.

NEXO CON INFRAESTRUCTURA ARGENTINA

El hub submarino Sparkle/BlueMed conecta Italia con Argentina y el resto de América del Sur. Los satélites CSG generados desde el Centro Espacial de Matera (e-GEOS, Basilicata) tienen cobertura global continua incluyendo Argentina. El mismo sistema que calibra sobre Costa Rica puede operar sobre territorio argentino con precisión milimétrica.

SOLICITUD

Solicito que las autoridades argentinas competentes evalúen:

1. Si Telespazio Argentina ha actuado en cumplimiento de las normas argentinas de exportación de tecnología de doble uso en el marco del contrato costarricense.
2. Si existe riesgo para infraestructura crítica argentina derivado del uso de las mismas arquitecturas satelitales (CSG/e-GEOS/Sparkle) que operan sobre Costa Rica.
3. Si los acuerdos de seguridad ítalo-argentinos existentes contemplan mecanismos de supervisión para estas operaciones.

Pongo a disposición el expediente técnico completo (PCAP verificados SHA-256, capturas RF, documentación contractual pública costarricense) para las autoridades que lo requieran.

Samuel P. Wotton
Jacó, Costa Rica
hello@echokappa.com | +506 6377-3099`;

const BODY_EU = `To whom it may concern,

I am writing to report a documented critical infrastructure security situation in Costa Rica with direct implications for European institutions, specifically regarding Leonardo S.p.A. (a majority Italian state-owned defense conglomerate), Telespazio, e-GEOS, and Deep Sea Electronics (UK).

EXECUTIVE SUMMARY

A single individual — Héctor Mora Marín, Executive Director of Setecom S.A. (Heredia, Costa Rica) — holds an exclusive distribution monopoly for Deep Sea Electronics (DSE) backup generator controllers in Costa Rica. These DSE controllers manage backup power for:

· Juan Santamaría International Airport (SJO/MROC)
· ICE — Costa Rica's national electrical grid
· CCSS — national hospital network
· Liberty CR — national 4G/LTE cellular backbone

CISA (US Cybersecurity and Infrastructure Security Agency) has published four CVEs against the exact DSE models Setecom deploys, including unauthenticated remote shutdown and remote code execution via Modbus TCP. Mora Marín's public IP has Modbus port 502 open and unauthenticated. DSE Webnet — the cloud management platform — is hosted on servers in England.

TRAINING VIDEO EVIDENCE

Setecom's own published training materials (led by Technical Lead Edson Martendal) document:
— Initialization credentials taught as standard: Admin / Password1234
— Modbus register formula for generator control: Register = (Page_hex × 256) + Offset
— SNMP v2 cleartext community strings ("public"/"private") as suggested defaults
— Web SCADA on Port 80, no VPN, available on any browser

These practices are taught as doctrine across Setecom's entire client base managing national infrastructure.

EUROPEAN DIMENSION

1. LEONARDO / TELESPAZIO / e-GEOS: A $20M geodetic calibration contract between Telespazio Argentina and Costa Rica's Registro Nacional has established a SAR calibration matrix converting the country into a test range for COSMO-SkyMed (CSG) X-band SAR satellites. This capability is marketed by e-GEOS as "IMINT for Defence and Intelligence."

2. SPARKLE / BLUEMD / ECSTATIC: Sparkle (TIM Group) is converting submarine fiber cables, including the BlueMed cable, into global distributed sensing infrastructure — the same cables carrying internet traffic. The Palermo hub is both the CSG downlink terminal and the BlueMed network hub.

3. DATA PROTECTION: The convergence of passive Wi-Fi CSI sensing, SAR satellite imagery, and health data aggregation (e-GEOS CLEOS/HERMES platform) raises serious questions under GDPR regarding the processing of personal data of EU and US citizens without their knowledge or consent.

This disclosure is made in the public interest. I am a US citizen resident in Costa Rica who has been directly subjected to this multi-vector surveillance infrastructure for 18 months.

Full evidence package available on request: SHA-256-verified PCAPs, RF spectrum recordings, network logs, Costa Rican procurement records.

Samuel P. Wotton — hello@echokappa.com`;

const BODY_BR = `Para quem possa interessar,

Dirijo-me a vós para reportar a existência de um treinamento técnico documentado, conduzido por Edson Martendal — Engenheiro de Suporte Técnico para América Latina da empresa Setecom S.A. (Heredia, Costa Rica) — no qual são ensinadas práticas de credenciais padrão (Admin / Password1234) para gateways Deep Sea Electronics (DSE) que gerenciam infraestrutura crítica nacional na Costa Rica, incluindo:

· Aeroporto Internacional Juan Santamaría (SJO/MROC)
· ICE — rede elétrica nacional
· CCSS — rede hospitalar nacional
· Liberty CR — backbone celular 4G/LTE nacional

O vídeo de treinamento está publicamente acessível e documenta:
1. Inicialização de equipamentos DSE 890 MKII com credenciais padrão: Usuário Admin / Senha Password1234
2. Fórmula de registro Modbus para controle remoto de geradores: Registrador = (Página_hex × 256) + Deslocamento
3. Strings de comunidade SNMP v2 em texto claro ("public"/"private") como padrão sugerido

A agência americana CISA publicou quatro CVEs contra esses exatos modelos DSE, incluindo desligamento remoto não autenticado e execução remota de código via Modbus TCP. A porta 502 (Modbus) está aberta e não autenticada no IP público de Héctor Mora Marín.

A plataforma DSE Webnet — central de comando remoto — é hospedada em servidores na Inglaterra, criando uma jurisdição multi-nacional para esta vulnerabilidade de infraestrutura crítica.

Solicito a análise desta situação pelas autoridades competentes, dado o potencial impacto regional desta cadeia de fornecimento de infraestrutura crítica na América Latina.

Dossier técnico completo disponível mediante solicitação via canal seguro.

Samuel P. Wotton
Jacó, Costa Rica
hello@echokappa.com | +506 6377-3099`;

const BODY_ICS = `To the ICS/OT security community,

I am disclosing a documented critical infrastructure vulnerability in Costa Rica that the security community should be aware of: a single distributor — Setecom S.A., operated by Héctor Mora Marín — holds exclusive monopoly control over Deep Sea Electronics (DSE) backup generator infrastructure for Costa Rica's national grid (ICE), airport (SJO/MROC), hospital network (CCSS), and national 4G backbone (Liberty CR).

DOCUMENTED VULNERABILITY CHAIN

1. PUBLISHED TRAINING DOCTRINE (open source):
Setecom's Technical Lead for Latin America, Edson Martendal, conducts public training sessions teaching:
   · Default credentials as initialization standard: Admin / Password1234 (DSE 890 MKII / DSE Webnet)
   · Modbus register formula: Register = (Page_hex × 256) + Offset — with worked examples showing generator start/stop registers
   · SNMP v2 community strings "public"/"private" as suggested defaults (cleartext, DSE 892 gateway)
   · Web SCADA on Port 80, no auth, no VPN (DSE 855 USB-to-Ethernet)
   · Connection limit bypass: DSE 855 allows 16 simultaneous connections vs native 5 — deployed at ICE grid nodes

Training video evidence on Google Drive: https://drive.google.com/open?id=1uZ3uwbkDw61xv7Be1SIyAFYmGUyYX84I

2. CISA CVEs:
Four CVEs published against exact deployed DSE models. Unauthenticated remote shutdown and RCE via Modbus TCP. Port 502 open and unauthenticated on Mora Marín's public IP. No remediation.

3. ATTACK SURFACE:
   · ICE national grid: DSE 855 Web SCADA port 80 at grid nodes → write to Modbus control registers → generator shutdown or overspeed during grid emergency
   · Liberty CR: SNMP v2 write community "private" captured in cleartext → broadcast STOP to entire generator fleet during power outage → national telecom blackout
   · SJO airport: DSE 890 MKII with GPS tracking + 4G GSM, default credentials → remote generator shutdown during flight operations
   · CCSS hospitals: Same DSE ecosystem, same credential doctrine, life-critical environments

4. SUPPLY CHAIN:
Setecom is the only viable vendor for DSE firmware updates and advanced support in Costa Rica. Any national entity using DSE controllers must interact exclusively with Setecom. This creates a mandatory, persistent, bidirectional connection between critical infrastructure and a single distributor operating under documented insecure practices.

5. OUT-OF-BAND C2:
Mora Marín holds SUTEL-registered radio licenses for 180W HF transmissions at 7,410 kHz. This provides an out-of-band command-and-control channel independent of public network infrastructure, resilient to internet outages — which Setecom is uniquely positioned to manage given its control over backup power.

This is a textbook ICS/OT single-point-of-failure combined with insider threat / supply chain risk. The attack surface is documented in open training materials. CVEs are published. The hardware is deployed at national critical infrastructure. No remediation has occurred.

Full evidence package: SHA-256-verified PCAPs, RF recordings, network logs. Available via secure channel.

Samuel P. Wotton — hello@echokappa.com`;

const BODY_AVIATION = `To the aviation safety / airport security team,

I am writing to report a documented critical infrastructure security concern affecting backup power systems at Juan Santamaría International Airport (SJO/MROC), Costa Rica's primary international gateway.

THE VULNERABILITY

Setecom S.A. (Héctor Mora Marín, Executive Director) holds an exclusive monopoly on Deep Sea Electronics (DSE) backup generator controller maintenance at SJO. The US Cybersecurity and Infrastructure Security Agency (CISA) has published four CVEs against the exact DSE models deployed, including:

· Unauthenticated remote shutdown via Modbus TCP (port 502)
· Remote code execution without authentication
· Web SCADA accessible via browser on port 80 with no VPN requirement

Mora Marín's public-facing IP has Modbus port 502 open and unauthenticated. No remediation has been applied.

TRAINING VIDEO EVIDENCE

Setecom's own published training materials document that technicians are taught to initialize DSE 890 MKII gateways using credentials User: Admin / Password: Password1234 as standard doctrine. These credentials are institutionalized across Setecom's entire client base — including SJO airport infrastructure.

The DSE 890 MKII connects via 4G GSM to DSE Webnet servers in England. A compromised Setecom master account (achievable via the documented default credentials) would allow remote generator shutdown commands to be issued to airport infrastructure without physical access.

WHAT THIS MEANS FOR SJO

· Backup generators at SJO power critical systems during commercial power outages: runway lighting, ATC communications backup, navigation aids, terminal life safety systems
· Remote Modbus write access to control registers can disable generator protection alarms, trigger emergency stop, or cause engine overspeed/physical destruction
· The DSE 855 USB-to-Ethernet converters deployed at SJO infrastructure allow 16 simultaneous remote connections via open port 80 Web SCADA — with no authentication requirement

PRIOR NOTIFICATIONS

This situation has been reported to AERIS (SJO operator), DGAC, SUTEL, OIJ, Ministerio Público, DIS, MICITT, and CSIRT-CR. No protective action has been confirmed.

I am a US citizen resident in Jacó, Costa Rica, 18 months into documenting this situation with RF captures, network logs, and PCAP evidence. Airlines operating at SJO should be aware that the backup power infrastructure supporting their operations has documented remote shutdown vulnerabilities with no applied remediation.

Evidence package available via secure channel: SHA-256-verified PCAPs, Modbus register documentation, network logs.

Samuel P. Wotton — hello@echokappa.com | +506 6377-3099`;

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT LIST
// ─────────────────────────────────────────────────────────────────────────────

export const EXPANSION_CONTACTS: ExpContact[] = [

  // ── UK — Deep Sea Electronics / NCSC / Authorities ─────────────────────────
  { id: 1001, to: "info@deepseaelectronics.com",       org: "Deep Sea Electronics (DSE)",            subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1002, to: "support@deepseaelectronics.com",    org: "DSE Technical Support",                 subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1003, to: "sales@deepseaelectronics.com",      org: "DSE Sales",                             subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1004, to: "enquiries@ncsc.gov.uk",             org: "UK NCSC",                               subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1005, to: "report@ncsc.gov.uk",                org: "UK NCSC Report",                        subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1006, to: "casework@ico.org.uk",               org: "UK Information Commissioner (ICO)",     subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1007, to: "icocasework@ico.org.uk",            org: "ICO Casework",                          subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1008, to: "contact@sfo.gov.uk",                org: "UK Serious Fraud Office",               subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1009, to: "referrals@sfo.gov.uk",              org: "SFO Referrals",                         subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1010, to: "tips@theguardian.com",              org: "The Guardian (UK)",                     subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1011, to: "securedrop@theguardian.com",        org: "The Guardian SecureDrop",               subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1012, to: "tips@ft.com",                       org: "Financial Times",                       subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1013, to: "investigations@ft.com",             org: "FT Investigations",                     subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1014, to: "tips@thetimes.co.uk",               org: "The Times UK",                          subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1015, to: "tips@independent.co.uk",            org: "The Independent",                       subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1016, to: "panorama@bbc.co.uk",                org: "BBC Panorama",                          subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1017, to: "investigations@channel4.com",       org: "Channel 4 Dispatches",                  subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1018, to: "contact@bureau-investigates.com",   org: "Bureau of Investigative Journalism",    subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1019, to: "info@opendemocracy.net",            org: "openDemocracy",                         subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1020, to: "cyberuk@ncsc.gov.uk",               org: "UK NCSC CyberUK",                      subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1021, to: "fca-contact@fca.org.uk",            org: "UK Financial Conduct Authority",        subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1022, to: "psr.enquiries@psr.org.uk",          org: "UK Payment Systems Regulator",          subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1023, to: "security@companieshouse.gov.uk",    org: "UK Companies House",                    subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1024, to: "media@ofcom.org.uk",                org: "Ofcom UK",                              subject: SUBJ_UK,  body: BODY_UK_DSE },
  { id: 1025, to: "tips@wired.co.uk",                  org: "Wired UK",                              subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1026, to: "tips@techcrunch.com",               org: "TechCrunch",                            subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1027, to: "tips@theregister.com",              org: "The Register (UK)",                     subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1028, to: "security@theregister.com",          org: "The Register Security",                 subject: SUBJ_ICS, body: BODY_ICS },

  // ── Italy ──────────────────────────────────────────────────────────────────
  { id: 1050, to: "garante@gpdp.it",                   org: "Garante Privacy Italia",                subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1051, to: "urp@gpdp.it",                       org: "Garante Privacy URP",                   subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1052, to: "protocollo@anticorruzione.it",      org: "ANAC — Anticorruzione Italia",          subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1053, to: "urp@anticorruzione.it",             org: "ANAC URP",                              subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1054, to: "presidenza@corteconti.it",          org: "Corte dei Conti Italia",                subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1055, to: "info@agid.gov.it",                  org: "AgID Italia",                           subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1056, to: "redazione@espresso.it",             org: "L'Espresso",                            subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1057, to: "redazione@ilfattoquotidiano.it",    org: "Il Fatto Quotidiano",                   subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1058, to: "diritto@ilfattoquotidiano.it",      org: "Il Fatto Quotidiano — Economia",        subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1059, to: "inchieste@repubblica.it",           org: "La Repubblica — Inchieste",             subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1060, to: "economia@corriere.it",              org: "Corriere della Sera — Economia",        subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1061, to: "redazione@corriere.it",             org: "Corriere della Sera",                   subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1062, to: "tips@irpimedia.org",                org: "IRPI Media (Italy)",                    subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1063, to: "redazione@investigazionedifesa.it", org: "Investigazione & Difesa",               subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1064, to: "info@osservatoriorepression.info",  org: "Osservatorio Repressione",              subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1065, to: "info@disarmo.org",                  org: "Rete Italiana per il Disarmo",          subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1066, to: "censis@censis.it",                  org: "CENSIS",                                subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1067, to: "commissione.difesa@camera.it",      org: "Commissione Difesa Camera (Italy)",     subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1068, to: "commissione.difesa@senato.it",      org: "Commissione Difesa Senato (Italy)",     subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1069, to: "info@fondazioneinnovazione.it",     org: "Fondazione Innovazione Italia",         subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1070, to: "privacy@agcom.it",                  org: "AGCOM Italia",                          subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1071, to: "redazione@wired.it",                org: "Wired Italia",                          subject: SUBJ_IT,  body: BODY_IT_LEO },
  { id: 1072, to: "redazione@dday.it",                 org: "DDay.it",                               subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1073, to: "info@hdblog.it",                    org: "HDBlog.it",                             subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1074, to: "redazione@punto-informatico.it",    org: "Punto Informatico",                     subject: SUBJ_ICS, body: BODY_ICS },

  // ── Argentina ──────────────────────────────────────────────────────────────
  { id: 1100, to: "info@enacom.gob.ar",                org: "ENACOM Argentina",                      subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1101, to: "consultas@enacom.gob.ar",           org: "ENACOM Consultas",                      subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1102, to: "info@uif.gob.ar",                   org: "UIF Argentina",                         subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1103, to: "denuncias@uif.gob.ar",              org: "UIF Denuncias",                         subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1104, to: "oa@anticorrupcion.gob.ar",          org: "Oficina Anticorrupción Argentina",      subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1105, to: "denuncias@anticorrupcion.gob.ar",   org: "OA Denuncias Argentina",                subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1106, to: "info@mpf.gob.ar",                   org: "Ministerio Público Fiscal Argentina",   subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1107, to: "denuncias@mpf.gob.ar",              org: "MPF Denuncias Argentina",               subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1108, to: "info@pdp.gob.ar",                   org: "Agencia de Acceso Argentina (PDP)",     subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1109, to: "cartas@infobae.com",                org: "Infobae Argentina",                     subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1110, to: "redaccion@lanacion.com.ar",         org: "La Nación Argentina",                   subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1111, to: "redaccion@clarin.com",              org: "Clarín Argentina",                      subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1112, to: "redaccion@perfil.com",              org: "Perfil Argentina",                      subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1113, to: "redaccion@pagina12.com.ar",         org: "Página 12 Argentina",                   subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1114, to: "tips@chequeado.com",                org: "Chequeado Argentina",                   subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1115, to: "redaccion@eldiarioar.com",          org: "elDiarioAR",                            subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1116, to: "redaccion@ambito.com",              org: "Ámbito Financiero",                     subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1117, to: "economia@cronista.com",             org: "El Cronista Argentina",                 subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1118, to: "tips@forumargentino.org",           org: "Foro Argentino de Ciberseguridad",      subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1119, to: "info@ar-cert.org.ar",               org: "ArCERT Argentina",                      subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1120, to: "contacto@telespazio.com.ar",        org: "Telespazio Argentina",                  subject: SUBJ_ARG, body: BODY_ARG },
  { id: 1121, to: "info@conae.gov.ar",                 org: "CONAE Argentina",                       subject: SUBJ_ARG, body: BODY_ARG },

  // ── EU Institutions ────────────────────────────────────────────────────────
  { id: 1150, to: "edpb@edpb.europa.eu",               org: "European Data Protection Board",        subject: SUBJ_EU,  body: BODY_EU },
  { id: 1151, to: "info@enisa.europa.eu",              org: "ENISA (EU Cybersecurity Agency)",       subject: SUBJ_EU,  body: BODY_EU },
  { id: 1152, to: "olaf-fraud-notification@ec.europa.eu", org: "EU OLAF (Anti-Fraud)",              subject: SUBJ_EU,  body: BODY_EU },
  { id: 1153, to: "sg-complaints@ec.europa.eu",        org: "European Commission SG Complaints",     subject: SUBJ_EU,  body: BODY_EU },
  { id: 1154, to: "eo@ombudsman.europa.eu",            org: "European Ombudsman",                    subject: SUBJ_EU,  body: BODY_EU },
  { id: 1155, to: "info@europol.europa.eu",            org: "Europol",                               subject: SUBJ_EU,  body: BODY_EU },
  { id: 1156, to: "hsc@europarl.europa.eu",            org: "European Parliament Security Committee",subject: SUBJ_EU,  body: BODY_EU },
  { id: 1157, to: "afet@europarl.europa.eu",           org: "European Parliament AFET Committee",   subject: SUBJ_EU,  body: BODY_EU },
  { id: 1158, to: "itre@europarl.europa.eu",           org: "European Parliament ITRE Committee",   subject: SUBJ_EU,  body: BODY_EU },
  { id: 1159, to: "libe@europarl.europa.eu",           org: "European Parliament LIBE Committee",   subject: SUBJ_EU,  body: BODY_EU },
  { id: 1160, to: "cont@europarl.europa.eu",           org: "European Parliament CONT Committee",   subject: SUBJ_EU,  body: BODY_EU },
  { id: 1161, to: "connect@ec.europa.eu",              org: "DG CONNECT European Commission",        subject: SUBJ_EU,  body: BODY_EU },
  { id: 1162, to: "defis@ec.europa.eu",                org: "DG DEFIS European Commission",         subject: SUBJ_EU,  body: BODY_EU },
  { id: 1163, to: "info@encs.eu",                      org: "European Network for Cyber Security",   subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1164, to: "info@ecso.eu",                      org: "European Cyber Security Organisation",  subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1165, to: "info@ccn-cert.cni.es",             org: "CCN-CERT Spain",                        subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1166, to: "info@bsi.bund.de",                  org: "BSI Germany (Federal Cyber Security)",  subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1167, to: "anssi@ssi.gouv.fr",                 org: "ANSSI France",                          subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1168, to: "acn@acn.gov.it",                    org: "ACN — Agenzia Cybersicurezza Nazionale", subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1169, to: "ncsc@aivd.nl",                      org: "NCSC Netherlands",                      subject: SUBJ_ICS, body: BODY_ICS },

  // ── Brazil ─────────────────────────────────────────────────────────────────
  { id: 1200, to: "fiscalizacao@anatel.gov.br",        org: "ANATEL Brasil",                         subject: SUBJ_BR,  body: BODY_BR },
  { id: 1201, to: "ouvidoria@anatel.gov.br",           org: "ANATEL Ouvidoria",                      subject: SUBJ_BR,  body: BODY_BR },
  { id: 1202, to: "anpd@anpd.gov.br",                  org: "ANPD Brasil (Data Protection)",         subject: SUBJ_BR,  body: BODY_BR },
  { id: 1203, to: "ouvidoria@anpd.gov.br",             org: "ANPD Ouvidoria",                        subject: SUBJ_BR,  body: BODY_BR },
  { id: 1204, to: "cgr.denuncias@mj.gov.br",           org: "CGR / Ministério da Justiça Brasil",    subject: SUBJ_BR,  body: BODY_BR },
  { id: 1205, to: "coaf@fazenda.gov.br",               org: "COAF Brasil (Financial Intelligence)",  subject: SUBJ_BR,  body: BODY_BR },
  { id: 1206, to: "cpmi@senado.leg.br",                org: "CPMI — Senado Federal Brasil",          subject: SUBJ_BR,  body: BODY_BR },
  { id: 1207, to: "redacao@agenciapublica.org.br",     org: "Agência Pública Brasil",                subject: SUBJ_BR,  body: BODY_BR },
  { id: 1208, to: "redacao@theintercept.com.br",       org: "The Intercept Brasil",                  subject: SUBJ_BR,  body: BODY_BR },
  { id: 1209, to: "redacao@folha.com.br",              org: "Folha de S.Paulo",                      subject: SUBJ_BR,  body: BODY_BR },
  { id: 1210, to: "redacao@estadao.com.br",            org: "O Estado de S.Paulo",                   subject: SUBJ_BR,  body: BODY_BR },
  { id: 1211, to: "chefe.redacao@globo.com",           org: "O Globo Brasil",                        subject: SUBJ_BR,  body: BODY_BR },
  { id: 1212, to: "investigacao@g1.globo.com",         org: "G1 Globo Investigação",                 subject: SUBJ_BR,  body: BODY_BR },
  { id: 1213, to: "economia@valor.com.br",             org: "Valor Econômico",                       subject: SUBJ_BR,  body: BODY_BR },
  { id: 1214, to: "redacao@abraji.org.br",             org: "ABRAJI Brasil",                         subject: SUBJ_BR,  body: BODY_BR },
  { id: 1215, to: "cert@cert.br",                      org: "CERT.br",                               subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1216, to: "cgi@cgi.br",                        org: "CGI.br",                                subject: SUBJ_ICS, body: BODY_ICS },

  // ── ICS / SCADA Security Community ────────────────────────────────────────
  { id: 1250, to: "info@dragos.com",                   org: "Dragos (ICS Security)",                 subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1251, to: "contact@claroty.com",               org: "Claroty (OT Security)",                 subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1252, to: "info@nozominetworks.com",           org: "Nozomi Networks",                       subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1253, to: "info@sansics.org",                  org: "SANS ICS",                              subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1254, to: "news@securityweek.com",             org: "SecurityWeek",                          subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1255, to: "tips@industrialcyber.co",           org: "Industrial Cyber",                      subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1256, to: "info@waterfall-security.com",       org: "Waterfall Security",                    subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1257, to: "contact@verveind.com",              org: "Verve Industrial",                      subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1258, to: "info@otorio.com",                   org: "OTORIO (OT Security)",                  subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1259, to: "info@assetlink.io",                 org: "AssetLink (ICS)",                       subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1260, to: "tips@theregister.com",              org: "The Register — ICS",                    subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1261, to: "news@darkreading.com",              org: "Dark Reading",                          subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1262, to: "tips@bleepingcomputer.com",         org: "BleepingComputer",                     subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1263, to: "news@cybersecuritydive.com",        org: "Cybersecurity Dive",                    subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1264, to: "tips@recordedfuture.com",           org: "Recorded Future",                       subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1265, to: "contact@scadafence.com",            org: "SCADAfence",                            subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1266, to: "s4@digitalbond.com",                org: "S4 ICS Conference / Digital Bond",      subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1267, to: "contact@cybereason.com",            org: "Cybereason",                            subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1268, to: "contact@sentryo.net",               org: "Cisco Sentryo (ICS)",                   subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1269, to: "info@sixgill.io",                   org: "Sixgill Threat Intel",                  subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1270, to: "contact@runzero.com",               org: "runZero (OT Discovery)",                subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1271, to: "info@forescout.com",                org: "Forescout",                             subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1272, to: "media@mandiant.com",                org: "Mandiant / Google Threat Intel",        subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1273, to: "press@crowdstrike.com",             org: "CrowdStrike Intelligence",              subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1274, to: "contact@sensecy.com",               org: "Sensecy Threat Intel",                  subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1275, to: "info@cisa.gov",                     org: "CISA — ICS-CERT",                      subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1276, to: "ics-cert@hq.dhs.gov",              org: "ICS-CERT DHS",                          subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1277, to: "tips@krebs.com",                    org: "KrebsOnSecurity",                       subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1278, to: "contact@schneier.com",              org: "Schneier on Security",                  subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1279, to: "tips@arstechnica.com",              org: "Ars Technica Security",                 subject: SUBJ_ICS, body: BODY_ICS },
  { id: 1280, to: "tips@technologyreview.com",         org: "MIT Technology Review",                 subject: SUBJ_ICS, body: BODY_ICS },

  // ── Aviation Expansion ─────────────────────────────────────────────────────
  { id: 1300, to: "icao@icao.int",                     org: "ICAO",                                  subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1301, to: "acp@icao.int",                      org: "ICAO Aerodromes",                       subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1302, to: "avsec@icao.int",                    org: "ICAO AVSEC",                            subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1303, to: "9-aua-avsec@faa.gov",              org: "FAA AVSEC",                             subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1304, to: "avsec@faa.gov",                     org: "FAA Aviation Security",                 subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1305, to: "safety@faa.gov",                    org: "FAA Safety",                            subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1306, to: "avinfo@tc.gc.ca",                   org: "Transport Canada Aviation",             subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1307, to: "safety@ntsb.gov",                   org: "NTSB",                                  subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1308, to: "tsa.inquiry@dhs.gov",               org: "TSA",                                   subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1309, to: "investigations@iata.org",           org: "IATA Investigations",                   subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1310, to: "safety@iata.org",                   org: "IATA Safety",                           subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1311, to: "avsec@iata.org",                    org: "IATA AVSEC",                            subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1312, to: "info@aerocivil.gov.co",             org: "Aerocivil Colombia",                    subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1313, to: "info@anac.gob.mx",                  org: "ANAC Mexico",                           subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1314, to: "info@dgac.gob.mx",                  org: "DGAC Mexico",                           subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1315, to: "info@anac.gob.ar",                  org: "ANAC Argentina",                        subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1316, to: "info@dgac.gob.cl",                  org: "DGAC Chile",                            subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1317, to: "info@anac.gov.br",                  org: "ANAC Brasil",                           subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1318, to: "security@copa.com",                 org: "Copa Airlines Security",                subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1319, to: "safety@copaair.com",                org: "Copa Airlines Safety",                  subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1320, to: "security@unitedairlines.com",       org: "United Airlines Security",              subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1321, to: "safety@aa.com",                     org: "American Airlines Safety",              subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1322, to: "security@delta.com",                org: "Delta Security",                        subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1323, to: "safety@jetblue.com",                org: "JetBlue Safety",                        subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1324, to: "security@southwest.com",            org: "Southwest Security",                    subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1325, to: "avsec@lufthansa.com",               org: "Lufthansa AVSEC",                       subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1326, to: "safety@iberia.com",                 org: "Iberia Safety",                         subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1327, to: "security@airfrance.fr",             org: "Air France Security",                   subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1328, to: "avsec@klm.com",                     org: "KLM AVSEC",                             subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1329, to: "safety@britishairways.com",         org: "British Airways Safety",                subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1330, to: "security@aircanada.com",            org: "Air Canada Security",                   subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1331, to: "safety@airbus.com",                 org: "Airbus Safety",                         subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1332, to: "safety@boeing.com",                 org: "Boeing Safety",                         subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1333, to: "info@acsa.aero",                    org: "ACSA (Latin American Airport Operators)", subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1334, to: "avsec@vistara.flights",             org: "CAPA Centre Aviation",                  subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1335, to: "tips@aviationweek.com",             org: "Aviation Week (second)",                subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1336, to: "news@airporttechnology.com",        org: "Airport Technology",                    subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1337, to: "editor@airport-world.com",          org: "Airport World Magazine",                subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1338, to: "info@aci-lac.aero",                 org: "ACI Latin America (Airport Council)",   subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1339, to: "editor@aviationpros.com",           org: "Aviation Pros",                         subject: SUBJ_AV2, body: BODY_AVIATION },
  { id: 1340, to: "news@centreforaviation.com",        org: "CAPA Centre for Aviation",              subject: SUBJ_AV2, body: BODY_AVIATION },
];
