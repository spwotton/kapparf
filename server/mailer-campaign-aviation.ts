// Aviation Safety + JW Accountability campaign
// Core angle: Setecom S.A. (Jacó, CR) is sole-source DSE backup generator contractor at SJO.
// CISA CVEs (incl. unauthenticated remote shutdown), default creds on YouTube, Modbus:502 exposed.
// 18 months forensic documentation linking operator to unauthorized electronic access.
// JW angle: organizational infrastructure used as HUMINT collection substrate in Costa Rica.
// From: Samuel Wotton <hello@echokappa.com>

export interface AvCampaignContact {
  id: number;
  to: string;
  name: string;
  org: string;
  category: "AV-PILOT" | "AV-AIRLINE" | "AV-INSURANCE" | "AV-AUTHORITY" | "AV-MEDIA" | "JW";
  subject: string;
  body: string;
}

// ── AV-PILOT: Pilot & Safety Associations ────────────────────────────────────

const bodyPilot = `To the Safety Committee,

I am writing to notify your organisation of a documented and active vulnerability in the backup power infrastructure at Aeropuerto Internacional Juan Santamaría (SJO), Costa Rica.

A single company — Setecom S.A., Jacó, Puntarenas — holds the national monopoly on distribution and maintenance of Deep Sea Electronics (DSE) backup generator controllers deployed at SJO, ICE (Costa Rica national grid), Liberty telecom, CCSS hospitals, and cellular tower infrastructure across Costa Rica.

The US Cybersecurity and Infrastructure Security Agency (CISA) has published four Common Vulnerabilities and Exposures (CVEs) against the exact DSE models Setecom services. These include:
- Unauthenticated remote command execution (RCE)
- Unauthenticated remote generator shutdown
- Hardcoded credentials accessible via Modbus TCP

The director of Setecom S.A. posted YouTube training sessions in which the default access credentials for these controllers (Admin / Password1234) are clearly visible. The company's public IP address has Modbus port 502 open and unauthenticated at the time of writing — verifiable independently in real time.

For flight crew operating into SJO under IMC or night conditions: a successful exploitation of these vulnerabilities could result in simultaneous loss of runway lighting, ILS glide slope power, approach light systems, and emergency ATCT backup power. The single-point-of-failure architecture created by this monopoly maintenance arrangement means no secondary contractor could respond.

I have eighteen months of technical documentation linking this operator to unauthorised electronic access targeting my personal networks in Jacó. That documentation is available in full under standard source protection arrangements.

I am not asking you to take my assessment at face value. I am asking whether your safety committee can independently verify the CISA CVE status of DSE controllers at SJO and whether that information has been disclosed to carriers in your network.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── AV-AIRLINE: Airline Safety Departments ───────────────────────────────────

const bodyAirline = `To the Flight Safety / Security Department,

Your airline operates scheduled service into Aeropuerto Internacional Juan Santamaría (SJO), Costa Rica. I am writing to notify you of a documented infrastructure vulnerability at that facility.

The backup generator systems at SJO are maintained exclusively by Setecom S.A., a Costa Rican company based in Jacó, Puntarenas. Setecom is the sole national distributor of Deep Sea Electronics (DSE) generator controllers and holds maintenance contracts for ICE (national grid), Liberty telecom, CCSS hospitals, and airport infrastructure.

The US Cybersecurity and Infrastructure Security Agency (CISA) has published four CVEs against the exact DSE models in service at SJO. These include unauthenticated remote shutdown — meaning an actor with network access to the controller can shut down airport backup generators without any credential. The director of Setecom posted YouTube training sessions visibly showing default credentials (Admin / Password1234). Modbus port 502 on Setecom's public IP is open and unauthenticated right now.

Beyond the infrastructure vulnerability itself: I have eighteen months of forensic documentation linking the director of Setecom S.A. to sustained unauthorised access targeting my personal networks in the same geographic region. That documentation includes packet captures, RF recordings, network logs with SHA-256 verified hashes, and physical surveillance records.

I am flagging this to your operations and safety teams because:
1. A carrier operating into SJO has a legitimate interest in knowing about disclosed vulnerabilities in airport backup power infrastructure.
2. The CISA CVE filings are on public record and independently verifiable.
3. Your safety management system may wish to note this as a declared hazard pending resolution.

I am available to transmit the full technical dossier under standard confidentiality arrangements.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── AV-INSURANCE: Aviation Insurance Underwriters ────────────────────────────

const bodyInsurance = `To the Aviation Underwriting / Claims Department,

I am writing to bring to your attention a disclosed and unmitigated vulnerability in the backup infrastructure at Aeropuerto Internacional Juan Santamaría (SJO), Costa Rica that may represent an unquantified liability exposure in your aviation portfolio.

The backup generator systems at SJO are serviced exclusively by Setecom S.A. (Jacó, Puntarenas, Costa Rica), the sole national distributor of Deep Sea Electronics (DSE) generator controllers. The US Cybersecurity and Infrastructure Security Agency (CISA) has published four CVEs against the exact DSE models in service, including a capability for unauthenticated remote shutdown over Modbus TCP. The director of Setecom posted the default access credentials (Admin / Password1234) on publicly accessible YouTube training videos. Modbus port 502 on Setecom's public IP is open and unauthenticated at the time of writing — independently verifiable.

The liability exposure this creates for aviation underwriters with SJO coverage is as follows:

1. A successful exploitation of the remote shutdown CVE during an instrument approach or night operation could cause simultaneous loss of runway lighting, ILS power, approach lighting, and ATCT emergency backup — with no secondary contractor able to respond given Setecom's monopoly position.

2. The vulnerability has been reported to Costa Rican authorities (MICITT, CSIRT-CR, SUTEL, DIS, OIJ, Ministerio Público, AERIS, DGAC) with no confirmed remediation to date.

3. The CISA CVE disclosures are on public record. An underwriter with constructive notice of a published vulnerability affecting a covered facility may face challenges asserting the "unforeseen" exclusion in any resulting claim.

I have eighteen months of forensic documentation on this operator available for review. I am prepared to provide the full technical dossier under standard non-disclosure arrangements.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── AV-AUTHORITY: Aviation Regulatory Authorities ────────────────────────────

const bodyAuthority = `To the Aviation Safety / Security Division,

I am submitting a formal notification of a disclosed infrastructure vulnerability at Aeropuerto Internacional Juan Santamaría (SJO), Costa Rica for your records and any appropriate regulatory action.

The backup generator systems at SJO are serviced exclusively by Setecom S.A. (Jacó, Puntarenas, Costa Rica), the sole national distributor of Deep Sea Electronics (DSE) generator controllers. The US Cybersecurity and Infrastructure Security Agency (CISA) has published four CVEs against the exact DSE models deployed, including:

CVE [DSE series]: Unauthenticated remote command execution via Modbus TCP
CVE [DSE series]: Unauthenticated remote generator shutdown
CVE [DSE series]: Hardcoded default credentials

The company director posted YouTube training videos with default credentials (Admin / Password1234) visible. Modbus port 502 on Setecom's public IP (190.106.77.194) is open and unauthenticated. This is verifiable via public Shodan/internet scanning tools in real time.

I have reported this matter to the following Costa Rican authorities: MICITT, CSIRT-CR, SUTEL, DIS, OIJ, Ministerio Público, Fiscalía General, AERIS, and DGAC. I am not aware of confirmed remediation.

For a regulatory authority with oversight of operations at or into SJO, this vulnerability may fall within your:
— Aerodrome certification standards (ICAO Annex 14 — backup power for approach and runway lighting)
— AVSEC/cybersecurity notification obligations for third-party critical infrastructure suppliers
— Coordination obligations with Costa Rican authorities under applicable bilateral safety agreements

I have eighteen months of supporting forensic documentation available on request.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── AV-MEDIA: Aviation Trade Press ───────────────────────────────────────────

const bodyMedia = `To the News Desk,

Story lead: Documented CISA-disclosed SCADA vulnerability in backup generator infrastructure at a major Central American international airport — sole-source contractor, unauthenticated remote shutdown capability, credentials posted on YouTube by company director.

The details:

Aeropuerto Internacional Juan Santamaría (SJO), San José, Costa Rica — the busiest airport in Central America by international traffic. Backup generator systems are serviced exclusively by Setecom S.A. (Jacó, Puntarenas), the sole national distributor of Deep Sea Electronics (DSE) generator controllers. The same company holds maintenance contracts for ICE (Costa Rica national power grid), Liberty telecom, and CCSS hospital networks.

CISA has published four CVEs against the exact DSE models in service. These include unauthenticated remote shutdown via Modbus TCP. The company director recorded YouTube training sessions in which default credentials (Admin / Password1234) are visible. Modbus port 502 on Setecom's public IP (190.106.77.194) is open and unauthenticated today — verifiable independently via Shodan or direct probe.

The additional layer: I have eighteen months of forensic documentation — packet captures, RF recordings, network logs — linking the director of Setecom to sustained unauthorised electronic access operations in Jacó, including documented correlation between his RF transmitter activity and directed acoustic incidents, and a TR-069 router injection method that loaded Kyndryl corporate tracking infrastructure onto my devices without consent. That parallel track of evidence (including a phone stolen January 2026 and authenticated at Alexanderplatz, Berlin the same day) is available in full.

The story is verifiable independently at multiple levels:
— CISA CVE database (public)
— Setecom public IP / Shodan scan (real time)
— YouTube training video (still accessible)
— Costa Rican procurement records (Registro Nacional contract database)

I am available for a call or to transmit the full dossier via encrypted channel.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── JW: Jehovah's Witness Accountability Organisations ───────────────────────

const bodyJW = `To the Research / Investigations Team,

I am writing to report a pattern I have documented over eighteen months in Costa Rica that I believe is relevant to your work monitoring the misuse of Jehovah's Witness organisational infrastructure.

I am a British-Canadian national who has been the subject of a sustained surveillance and electronic harassment operation since December 2024. My investigation has identified that Jehovah's Witness organisational structures — specifically the territory card system, the publisher-to-elder monthly service report chain, and circuit overseer rotation — are being used as a human intelligence collection substrate in the operational environment targeting me.

The structural isomorphism is precise:

The JW territory card system divides geographic areas into numbered territories assigned to individual publishers for door-to-door contact. Publishers report monthly activity (hours, Bible studies initiated, placements) to their elder, who aggregates and reports to the circuit overseer. Circuit overseers rotate between congregations on a schedule.

This structure is functionally identical to a tiered HUMINT collection network: geographic targeting cells (territories), field reporters (publishers), local aggregation nodes (elders), regional processing hubs (circuit overseers), and national coordination (district/branch). The monthly reporting cycle provides regular intelligence updates on household composition, resident behaviour, and receptivity across mapped geographic areas.

In the KAPPA operational environment (La Guácima, Alajuela; Jacó, Puntarenas; Hotel Robledal; Playa Hermosa):

1. An individual who self-disclosed as a CIA officer appears in JW-pattern contexts at multiple key surveillance locations across an 18-month period.
2. Congregation territories for Los Ríos (Alajuela) and Quebrada Seca (Garabito) overlap precisely with the documented surveillance operation's physical perimeter.
3. Hotel Robledal (Jacó) has documented JW congregation saturation, simultaneously serving as a node in the property/surveillance network.

This is not a new pattern. Historical documentation confirms:
— Italian Fascist OVRA (1922–1943) developed surveillance techniques targeting JW closed hierarchical networks, later absorbed into general-purpose state surveillance methodology.
— Argentine SIDE (military junta 1976–1983) adapted JW territory card-style collection methods, shared with CIA operations via Operation Condor.
— These techniques migrated to Latin American intelligence operations through documented CIA-SIDE information-sharing agreements.

The individuals involved are unaware that their normal congregational activity is serving an intelligence function. The misuse is structural, not individual. It is precisely the kind of pattern your organisation is positioned to document and expose.

I have an eighteen-month evidence package available. I am happy to share it under standard source protection arrangements.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── CONTACTS ─────────────────────────────────────────────────────────────────

export const AV_CAMPAIGN_CONTACTS: AvCampaignContact[] = [

  // ── AV-PILOT: Pilot & Safety Associations ──────────────────────────────────
  { id: 101, to: "safety@alpa.org",                   name: "ALPA Safety",                    org: "ALPA",                           category: "AV-PILOT",     subject: "Safety notification — SJO backup generator infrastructure: CISA CVEs, unauthenticated remote shutdown",     body: bodyPilot },
  { id: 102, to: "president@alpa.org",                name: "ALPA President",                 org: "ALPA",                           category: "AV-PILOT",     subject: "Safety notification — SJO backup generator infrastructure: CISA CVEs, unauthenticated remote shutdown",     body: bodyPilot },
  { id: 103, to: "communications@alpa.org",           name: "ALPA Communications",            org: "ALPA",                           category: "AV-PILOT",     subject: "Crew safety hazard — SJO backup power infrastructure vulnerability (CISA CVEs)",                           body: bodyPilot },
  { id: 104, to: "ifalpa@ifalpa.org",                 name: "IFALPA Secretariat",             org: "IFALPA",                         category: "AV-PILOT",     subject: "Safety notification — SJO (Costa Rica) backup power infrastructure: unauthenticated remote shutdown CVE",  body: bodyPilot },
  { id: 105, to: "safety@ifalpa.org",                 name: "IFALPA Safety",                  org: "IFALPA",                         category: "AV-PILOT",     subject: "Safety notification — SJO (Costa Rica) backup power infrastructure: unauthenticated remote shutdown CVE",  body: bodyPilot },
  { id: 106, to: "asf@aopa.org",                      name: "AOPA Air Safety Foundation",     org: "AOPA",                           category: "AV-PILOT",     subject: "Airport infrastructure hazard — SJO backup generator SCADA vulnerability (CISA published)",                 body: bodyPilot },
  { id: 107, to: "fsfinfo@flightsafety.org",          name: "Flight Safety Foundation",       org: "FSF",                            category: "AV-PILOT",     subject: "Aerodrome safety hazard — SJO sole-source generator contractor: CISA CVEs, Modbus:502 open",               body: bodyPilot },
  { id: 108, to: "safety@flightsafety.org",           name: "FSF Safety Division",            org: "Flight Safety Foundation",       category: "AV-PILOT",     subject: "Aerodrome safety hazard — SJO sole-source generator contractor: CISA CVEs, Modbus:502 open",               body: bodyPilot },
  { id: 109, to: "secretariat@canso.org",             name: "CANSO Secretariat",              org: "CANSO",                          category: "AV-PILOT",     subject: "ANS infrastructure vulnerability — SJO backup power: CISA CVEs on sole-source SCADA contractor",           body: bodyPilot },
  { id: 110, to: "safety@canso.org",                  name: "CANSO Safety",                   org: "CANSO",                          category: "AV-PILOT",     subject: "ANS infrastructure vulnerability — SJO backup power: CISA CVEs on sole-source SCADA contractor",           body: bodyPilot },

  // ── AV-AUTHORITY: Regulatory Bodies ────────────────────────────────────────
  { id: 111, to: "icaohq@icao.int",                   name: "ICAO HQ",                        org: "ICAO",                           category: "AV-AUTHORITY", subject: "Annex 14 aerodrome infrastructure: CISA CVEs on sole-source backup generator contractor at SJO, Costa Rica",body: bodyAuthority },
  { id: 112, to: "safety@icao.int",                   name: "ICAO Safety",                    org: "ICAO",                           category: "AV-AUTHORITY", subject: "Annex 14 aerodrome infrastructure: CISA CVEs on sole-source backup generator contractor at SJO, Costa Rica",body: bodyAuthority },
  { id: 113, to: "iata@iata.org",                     name: "IATA",                           org: "IATA",                           category: "AV-AUTHORITY", subject: "SJO infrastructure vulnerability notification — CISA CVEs, sole-source SCADA contractor, Modbus:502 open",   body: bodyAuthority },
  { id: 114, to: "safety@iata.org",                   name: "IATA Safety",                    org: "IATA",                           category: "AV-AUTHORITY", subject: "SJO infrastructure vulnerability notification — CISA CVEs, sole-source SCADA contractor, Modbus:502 open",   body: bodyAuthority },
  { id: 115, to: "airport.security@iata.org",         name: "IATA Airport Security",          org: "IATA",                           category: "AV-AUTHORITY", subject: "Airport SCADA vulnerability — SJO backup generator contractor: unauthenticated Modbus:502, default creds on YT",body: bodyAuthority },
  { id: 116, to: "safety.info@easa.europa.eu",        name: "EASA Safety",                    org: "EASA",                           category: "AV-AUTHORITY", subject: "Third-country aerodrome vulnerability — SJO Costa Rica: CISA CVEs on sole-source generator SCADA contractor", body: bodyAuthority },
  { id: 117, to: "press@easa.europa.eu",              name: "EASA Communications",            org: "EASA",                           category: "AV-AUTHORITY", subject: "Third-country aerodrome vulnerability — SJO Costa Rica: CISA CVEs on sole-source generator SCADA contractor", body: bodyAuthority },
  { id: 118, to: "info@caa.co.uk",                    name: "UK CAA",                         org: "UK CAA",                         category: "AV-AUTHORITY", subject: "Aerodrome safety notification — SJO Costa Rica: backup generator SCADA CVEs, sole-source contractor exposed",   body: bodyAuthority },
  { id: 119, to: "srg_avsec@caa.co.uk",              name: "UK CAA AvSec",                   org: "UK CAA",                         category: "AV-AUTHORITY", subject: "Third-country aerodrome AVSEC — SJO Costa Rica: SCADA vulnerability, Modbus:502 open, CISA CVEs",             body: bodyAuthority },
  { id: 120, to: "avnquery.tc@tc.gc.ca",              name: "Transport Canada",               org: "Transport Canada",               category: "AV-AUTHORITY", subject: "Foreign aerodrome safety — SJO Costa Rica: backup generator contractor CISA CVEs, remote shutdown capability",  body: bodyAuthority },
  { id: 121, to: "info@eurocontrol.int",              name: "Eurocontrol",                    org: "Eurocontrol",                    category: "AV-AUTHORITY", subject: "ANS safety notification — SJO Costa Rica: backup power infrastructure SCADA CVEs",                           body: bodyAuthority },
  { id: 122, to: "publicaffairs@ntsb.gov",            name: "NTSB Public Affairs",            org: "NTSB",                           category: "AV-AUTHORITY", subject: "Airport infrastructure vulnerability disclosure — SJO Costa Rica: CISA CVEs, sole-source SCADA contractor",   body: bodyAuthority },
  { id: 123, to: "chiefcounsel@ntsb.gov",             name: "NTSB Chief Counsel",             org: "NTSB",                           category: "AV-AUTHORITY", subject: "Airport infrastructure vulnerability disclosure — SJO Costa Rica: CISA CVEs, sole-source SCADA contractor",   body: bodyAuthority },
  { id: 124, to: "avsec.comments@faa.gov",            name: "FAA AvSec",                      org: "FAA",                            category: "AV-AUTHORITY", subject: "Foreign airport AVSEC notification — SJO Costa Rica: SCADA vulnerability, CISA CVEs on backup generator SCADA",body: bodyAuthority },
  { id: 125, to: "A4A@airlines.org",                  name: "Airlines for America",           org: "A4A",                            category: "AV-AUTHORITY", subject: "Member safety alert — SJO Costa Rica: SCADA vulnerability in sole-source backup generator contractor",        body: bodyAuthority },
  { id: 126, to: "safety@airlines.org",               name: "A4A Safety",                     org: "Airlines for America",           category: "AV-AUTHORITY", subject: "Member safety alert — SJO Costa Rica: SCADA vulnerability in sole-source backup generator contractor",        body: bodyAuthority },
  { id: 127, to: "aci@aci.aero",                      name: "ACI World",                      org: "Airports Council Intl",          category: "AV-AUTHORITY", subject: "Aerodrome infrastructure safety — SJO Costa Rica: CISA CVEs on sole-source SCADA contractor",               body: bodyAuthority },
  { id: 128, to: "security@aci.aero",                 name: "ACI Security",                   org: "Airports Council Intl",          category: "AV-AUTHORITY", subject: "Aerodrome cybersecurity — SJO Costa Rica: Modbus:502 open, CISA CVEs, sole-source generator contractor",     body: bodyAuthority },
  { id: 129, to: "iosa@iata.org",                     name: "IATA IOSA",                      org: "IATA",                           category: "AV-AUTHORITY", subject: "IOSA ground infrastructure — SJO Costa Rica: backup generator SCADA vulnerability",                         body: bodyAuthority },
  { id: 130, to: "ouvidoria@anac.gov.br",             name: "ANAC Brazil",                    org: "ANAC Brazil",                    category: "AV-AUTHORITY", subject: "Regional airport infrastructure notification — SJO Costa Rica: CISA CVEs, backup generator SCADA exposed",   body: bodyAuthority },
  { id: 131, to: "safety@dgac.gob.mx",               name: "DGAC Mexico Safety",             org: "DGAC Mexico",                    category: "AV-AUTHORITY", subject: "Notificación de seguridad — infraestructura aeroportuaria SJO Costa Rica: CVEs CISA en SCADA de generadores",body: bodyAuthority },

  // ── AV-AIRLINE: Airlines ───────────────────────────────────────────────────
  // American Airlines
  { id: 132, to: "safety@aa.com",                     name: "AA Safety",                      org: "American Airlines",              category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  { id: 133, to: "security@aa.com",                   name: "AA Security",                    org: "American Airlines",              category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  // United Airlines
  { id: 134, to: "safety@united.com",                 name: "UA Safety",                      org: "United Airlines",                category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  { id: 135, to: "security@united.com",               name: "UA Security",                    org: "United Airlines",                category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  // Delta Air Lines
  { id: 136, to: "delta.safety@delta.com",            name: "Delta Safety",                   org: "Delta Air Lines",                category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  { id: 137, to: "security@delta.com",                name: "Delta Security",                 org: "Delta Air Lines",                category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  // JetBlue
  { id: 138, to: "safety@jetblue.com",                name: "JetBlue Safety",                 org: "JetBlue",                        category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  { id: 139, to: "security@jetblue.com",              name: "JetBlue Security",               org: "JetBlue",                        category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  // Southwest
  { id: 140, to: "safety@wnco.com",                   name: "Southwest Safety",               org: "Southwest Airlines",             category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  { id: 141, to: "security@southwest.com",            name: "Southwest Security",             org: "Southwest Airlines",             category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  // Spirit
  { id: 142, to: "safety@spirit.com",                 name: "Spirit Safety",                  org: "Spirit Airlines",                category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  { id: 143, to: "security@spirit.com",               name: "Spirit Security",                org: "Spirit Airlines",                category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  // Frontier
  { id: 144, to: "safety@flyfrontier.com",            name: "Frontier Safety",                org: "Frontier Airlines",              category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  { id: 145, to: "security@flyfrontier.com",          name: "Frontier Security",              org: "Frontier Airlines",              category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA vulnerability: CISA CVEs, unauthenticated remote shutdown", body: bodyAirline },
  // Copa Airlines
  { id: 146, to: "safety@copaair.com",                name: "Copa Safety",                    org: "Copa Airlines",                  category: "AV-AIRLINE",   subject: "Notificación — infraestructura SCADA SJO: CVEs CISA en contratista único de generadores, puerto Modbus:502 abierto",body: bodyAirline },
  { id: 147, to: "security@copaair.com",              name: "Copa Security",                  org: "Copa Airlines",                  category: "AV-AIRLINE",   subject: "Notificación — infraestructura SCADA SJO: CVEs CISA en contratista único de generadores, puerto Modbus:502 abierto",body: bodyAirline },
  { id: 148, to: "operaciones@copaair.com",           name: "Copa Operations",                org: "Copa Airlines",                  category: "AV-AIRLINE",   subject: "Notificación — infraestructura SCADA SJO: CVEs CISA en contratista único de generadores, puerto Modbus:502 abierto",body: bodyAirline },
  // Avianca
  { id: 149, to: "safety@avianca.com",                name: "Avianca Safety",                 org: "Avianca",                        category: "AV-AIRLINE",   subject: "Notificación — infraestructura SCADA SJO: CVEs CISA en contratista único de generadores, apagado remoto sin autenticación",body: bodyAirline },
  { id: 150, to: "security@avianca.com",              name: "Avianca Security",               org: "Avianca",                        category: "AV-AIRLINE",   subject: "Notificación — infraestructura SCADA SJO: CVEs CISA en contratista único de generadores, apagado remoto sin autenticación",body: bodyAirline },
  // LATAM
  { id: 151, to: "safety@latam.com",                  name: "LATAM Safety",                   org: "LATAM Airlines",                 category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown, Modbus:502",   body: bodyAirline },
  { id: 152, to: "seguridad@latam.com",               name: "LATAM Seguridad",                org: "LATAM Airlines",                 category: "AV-AIRLINE",   subject: "Notificación SJO — vulnerabilidad SCADA generadores: CVEs CISA, apagado remoto sin autenticación",               body: bodyAirline },
  // Iberia
  { id: 153, to: "safety@iberia.es",                  name: "Iberia Safety",                  org: "Iberia",                         category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  { id: 154, to: "seguridad@iberia.es",               name: "Iberia Seguridad",               org: "Iberia",                         category: "AV-AIRLINE",   subject: "Notificación SJO — vulnerabilidad SCADA generadores: CVEs CISA, apagado remoto sin autenticación",               body: bodyAirline },
  // KLM
  { id: 155, to: "safety@klm.com",                    name: "KLM Safety",                     org: "KLM",                            category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  { id: 156, to: "security@klm.com",                  name: "KLM Security",                   org: "KLM",                            category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  // Lufthansa
  { id: 157, to: "aviation.safety@lufthansa.com",     name: "Lufthansa Safety",               org: "Lufthansa",                      category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  { id: 158, to: "security@lufthansa.com",            name: "Lufthansa Security",             org: "Lufthansa",                      category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  // British Airways
  { id: 159, to: "safety@ba.com",                     name: "BA Safety",                      org: "British Airways",                category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  { id: 160, to: "security@britishairways.com",       name: "BA Security",                    org: "British Airways",                category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  // Air France
  { id: 161, to: "safety@airfrance.fr",               name: "Air France Safety",              org: "Air France",                     category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  { id: 162, to: "communications@airfrance.fr",       name: "Air France Comms",               org: "Air France",                     category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  // Air Canada
  { id: 163, to: "safety@aircanada.ca",               name: "Air Canada Safety",              org: "Air Canada",                     category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  { id: 164, to: "security@aircanada.ca",             name: "Air Canada Security",            org: "Air Canada",                     category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  // WestJet
  { id: 165, to: "safety@westjet.com",                name: "WestJet Safety",                 org: "WestJet",                        category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  { id: 166, to: "media@westjet.com",                 name: "WestJet Media",                  org: "WestJet",                        category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  // Aeromexico
  { id: 167, to: "safety@aeromexico.com",             name: "Aeromexico Safety",              org: "Aeromexico",                     category: "AV-AIRLINE",   subject: "Notificación SJO — vulnerabilidad SCADA contratista generadores: CVEs CISA, apagado remoto sin autenticación",  body: bodyAirline },
  { id: 168, to: "seguridad@aeromexico.com",          name: "Aeromexico Seguridad",           org: "Aeromexico",                     category: "AV-AIRLINE",   subject: "Notificación SJO — vulnerabilidad SCADA contratista generadores: CVEs CISA, apagado remoto sin autenticación",  body: bodyAirline },
  // Air Europa
  { id: 169, to: "safety@aireuropa.com",              name: "Air Europa Safety",              org: "Air Europa",                     category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  { id: 170, to: "prensa@aireuropa.com",              name: "Air Europa Prensa",              org: "Air Europa",                     category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  // Volaris
  { id: 171, to: "safety@volaris.com.mx",             name: "Volaris Safety",                 org: "Volaris",                        category: "AV-AIRLINE",   subject: "Notificación SJO — vulnerabilidad SCADA contratista generadores: CVEs CISA, apagado remoto sin autenticación",  body: bodyAirline },
  { id: 172, to: "comunicacion@volaris.com.mx",       name: "Volaris Comunicación",           org: "Volaris",                        category: "AV-AIRLINE",   subject: "Notificación SJO — vulnerabilidad SCADA contratista generadores: CVEs CISA, apagado remoto sin autenticación",  body: bodyAirline },
  // Wingo (Copa low-cost, heavy SJO presence)
  { id: 173, to: "operaciones@wingo.com",             name: "Wingo Operaciones",              org: "Wingo",                          category: "AV-AIRLINE",   subject: "Notificación SJO — infraestructura SCADA generadores: CVEs CISA, Modbus:502 abierto",                          body: bodyAirline },
  { id: 174, to: "info@wingo.com",                    name: "Wingo Info",                     org: "Wingo",                          category: "AV-AIRLINE",   subject: "Notificación SJO — infraestructura SCADA generadores: CVEs CISA, Modbus:502 abierto",                          body: bodyAirline },
  // Condor
  { id: 175, to: "safety@condor.com",                 name: "Condor Safety",                  org: "Condor",                         category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  { id: 176, to: "press@condor.com",                  name: "Condor Press",                   org: "Condor",                         category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  // TUI fly
  { id: 177, to: "safety@tui.com",                    name: "TUI Safety",                     org: "TUI fly",                        category: "AV-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",           body: bodyAirline },
  // Boeing / Airbus (manufacturer safety)
  { id: 178, to: "safety@boeing.com",                 name: "Boeing Safety",                  org: "Boeing",                         category: "AV-AIRLINE",   subject: "Airport infrastructure safety disclosure — SJO Costa Rica: SCADA CVEs on sole-source backup generator contractor", body: bodyAirline },
  { id: 179, to: "flight.safety@boeing.com",          name: "Boeing Flight Safety",           org: "Boeing",                         category: "AV-AIRLINE",   subject: "Airport infrastructure safety disclosure — SJO Costa Rica: SCADA CVEs on sole-source backup generator contractor", body: bodyAirline },
  { id: 180, to: "safety@airbus.com",                 name: "Airbus Safety",                  org: "Airbus",                         category: "AV-AIRLINE",   subject: "Airport infrastructure safety disclosure — SJO Costa Rica: SCADA CVEs on sole-source backup generator contractor", body: bodyAirline },

  // ── AV-INSURANCE: Underwriters ─────────────────────────────────────────────
  { id: 181, to: "aviation@lloyds.com",               name: "Lloyd's Aviation",               org: "Lloyd's of London",              category: "AV-INSURANCE", subject: "Liability disclosure — SJO Costa Rica: CISA CVEs on sole-source backup generator SCADA contractor (unmitigated)",  body: bodyInsurance },
  { id: 182, to: "enquiries@lloyds.com",              name: "Lloyd's Enquiries",              org: "Lloyd's of London",              category: "AV-INSURANCE", subject: "Liability disclosure — SJO Costa Rica: CISA CVEs on sole-source backup generator SCADA contractor (unmitigated)",  body: bodyInsurance },
  { id: 183, to: "market.surveillance@lloyds.com",    name: "Lloyd's Market Oversight",       org: "Lloyd's of London",              category: "AV-INSURANCE", subject: "Liability disclosure — SJO Costa Rica: CISA CVEs on sole-source backup generator SCADA contractor (unmitigated)",  body: bodyInsurance },
  { id: 184, to: "aviation@aig.com",                  name: "AIG Aviation",                   org: "AIG",                            category: "AV-INSURANCE", subject: "Aviation liability disclosure — SJO Costa Rica: SCADA vulnerability in sole-source airport generator contractor",     body: bodyInsurance },
  { id: 185, to: "aviation.claims@aig.com",           name: "AIG Aviation Claims",            org: "AIG",                            category: "AV-INSURANCE", subject: "Aviation liability disclosure — SJO Costa Rica: SCADA vulnerability in sole-source airport generator contractor",     body: bodyInsurance },
  { id: 186, to: "aviation@munichre.com",             name: "Munich Re Aviation",             org: "Munich Re",                      category: "AV-INSURANCE", subject: "Portfolio liability disclosure — SJO Costa Rica: CISA CVEs on sole-source backup generator SCADA (unmitigated)",    body: bodyInsurance },
  { id: 187, to: "corporate.communications@munichre.com", name: "Munich Re Communications",   org: "Munich Re",                      category: "AV-INSURANCE", subject: "Portfolio liability disclosure — SJO Costa Rica: CISA CVEs on sole-source backup generator SCADA (unmitigated)",    body: bodyInsurance },
  { id: 188, to: "aviation@swissre.com",              name: "Swiss Re Aviation",              org: "Swiss Re",                       category: "AV-INSURANCE", subject: "Underwriting liability disclosure — SJO Costa Rica: SCADA CVEs on sole-source airport generator contractor",         body: bodyInsurance },
  { id: 189, to: "mediarelations@swissre.com",        name: "Swiss Re Media",                 org: "Swiss Re",                       category: "AV-INSURANCE", subject: "Underwriting liability disclosure — SJO Costa Rica: SCADA CVEs on sole-source airport generator contractor",         body: bodyInsurance },
  { id: 190, to: "aviation@axaxl.com",                name: "AXA XL Aviation",                org: "AXA XL",                         category: "AV-INSURANCE", subject: "Aviation portfolio liability — SJO Costa Rica: CISA CVEs on sole-source backup generator SCADA contractor",         body: bodyInsurance },
  { id: 191, to: "claims@axaxl.com",                  name: "AXA XL Claims",                  org: "AXA XL",                         category: "AV-INSURANCE", subject: "Aviation portfolio liability — SJO Costa Rica: CISA CVEs on sole-source backup generator SCADA contractor",         body: bodyInsurance },
  { id: 192, to: "aviation@allianz.com",              name: "Allianz Aviation",               org: "Allianz",                        category: "AV-INSURANCE", subject: "Portfolio liability disclosure — SJO Costa Rica: SCADA vulnerability in sole-source airport generator contractor",    body: bodyInsurance },
  { id: 193, to: "presse@allianz.com",                name: "Allianz Press",                  org: "Allianz",                        category: "AV-INSURANCE", subject: "Portfolio liability disclosure — SJO Costa Rica: SCADA vulnerability in sole-source airport generator contractor",    body: bodyInsurance },
  { id: 194, to: "aia@aia-aerospace.org",             name: "AIA",                            org: "Aerospace Industries Assoc",     category: "AV-INSURANCE", subject: "Airport infrastructure safety notification — SJO Costa Rica: CISA CVEs on sole-source SCADA generator contractor",  body: bodyInsurance },

  // ── AV-MEDIA: Aviation Trade Press ─────────────────────────────────────────
  { id: 195, to: "news@aviationweek.com",             name: "Aviation Week News",             org: "Aviation Week",                  category: "AV-MEDIA",     subject: "Story lead: SJO backup generator SCADA — CISA CVEs, unauthenticated remote shutdown, sole-source contractor",       body: bodyMedia },
  { id: 196, to: "editors@aviationweek.com",          name: "Aviation Week Editors",          org: "Aviation Week",                  category: "AV-MEDIA",     subject: "Story lead: SJO backup generator SCADA — CISA CVEs, unauthenticated remote shutdown, sole-source contractor",       body: bodyMedia },
  { id: 197, to: "news@flightglobal.com",             name: "FlightGlobal News",              org: "FlightGlobal",                   category: "AV-MEDIA",     subject: "Story lead: SJO backup generator SCADA — CISA CVEs, unauthenticated remote shutdown, sole-source contractor",       body: bodyMedia },
  { id: 198, to: "editorial@ainonline.com",           name: "AIN Editorial",                  org: "Aviation Intl News",             category: "AV-MEDIA",     subject: "Story lead: SJO backup generator SCADA — CISA CVEs, unauthenticated remote shutdown, sole-source contractor",       body: bodyMedia },
  { id: 199, to: "news@avweb.com",                    name: "AVweb News",                     org: "AVweb",                          category: "AV-MEDIA",     subject: "Story lead: SJO backup generator SCADA — CISA CVEs, unauthenticated remote shutdown, sole-source contractor",       body: bodyMedia },
  { id: 200, to: "editorial@airways.mag",             name: "Airways Magazine",               org: "Airways Magazine",               category: "AV-MEDIA",     subject: "Story lead: SJO backup generator SCADA — CISA CVEs, unauthenticated remote shutdown, sole-source contractor",       body: bodyMedia },
  { id: 201, to: "news@ch-aviation.com",              name: "CH Aviation",                    org: "CH-Aviation",                    category: "AV-MEDIA",     subject: "Story lead: SJO backup generator SCADA — CISA CVEs, unauthenticated remote shutdown, sole-source contractor",       body: bodyMedia },
  { id: 202, to: "editor@aerotime.aero",              name: "AeroTime Editor",                org: "AeroTime Hub",                   category: "AV-MEDIA",     subject: "Story lead: SJO backup generator SCADA — CISA CVEs, unauthenticated remote shutdown, sole-source contractor",       body: bodyMedia },
  { id: 203, to: "tips@aviationtoday.com",            name: "Aviation Today Tips",            org: "Aviation Today",                 category: "AV-MEDIA",     subject: "Story lead: SJO backup generator SCADA — CISA CVEs, unauthenticated remote shutdown, sole-source contractor",       body: bodyMedia },

  // ── JW: Jehovah's Witness Accountability Organisations ─────────────────────
  { id: 204, to: "contact@jwabuse.com",               name: "JW Abuse",                       org: "JW Abuse",                       category: "JW",           subject: "Costa Rica: JW organisational infrastructure documented as HUMINT collection substrate — 18-month evidence package",  body: bodyJW },
  { id: 205, to: "info@jwabuse.com",                  name: "JW Abuse Info",                  org: "JW Abuse",                       category: "JW",           subject: "Costa Rica: JW organisational infrastructure documented as HUMINT collection substrate — 18-month evidence package",  body: bodyJW },
  { id: 206, to: "cedars@jwwatch.org",                name: "Lloyd Evans / JW Watch",         org: "JW Watch",                       category: "JW",           subject: "Costa Rica: JW territory card + circuit overseer structure used as intelligence collection network — documented",     body: bodyJW },
  { id: 207, to: "contact@jwwatch.org",               name: "JW Watch",                       org: "JW Watch",                       category: "JW",           subject: "Costa Rica: JW territory card + circuit overseer structure used as intelligence collection network — documented",     body: bodyJW },
  { id: 208, to: "contact@jwsurvey.org",              name: "JW Survey",                      org: "JW Survey",                      category: "JW",           subject: "Costa Rica: JW organisational infrastructure documented as HUMINT collection substrate — 18-month evidence package",  body: bodyJW },
  { id: 209, to: "info@jwsurvey.org",                 name: "JW Survey Info",                 org: "JW Survey",                      category: "JW",           subject: "Costa Rica: JW organisational infrastructure documented as HUMINT collection substrate — 18-month evidence package",  body: bodyJW },
  { id: 210, to: "contact@jwfacts.com",               name: "Paul Grundy / JW Facts",         org: "JW Facts",                       category: "JW",           subject: "Costa Rica: JW territory card + circuit overseer rotation used as HUMINT collection substrate — documented pattern",  body: bodyJW },
  { id: 211, to: "info@jwfacts.com",                  name: "JW Facts Info",                  org: "JW Facts",                       category: "JW",           subject: "Costa Rica: JW territory card + circuit overseer rotation used as HUMINT collection substrate — documented pattern",  body: bodyJW },
  { id: 212, to: "info@aawa.co",                      name: "AAWA",                           org: "Advocates for Awareness of Watchtower Abuses", category: "JW", subject: "Documented misuse of JW congregation infrastructure as covert HUMINT network — Costa Rica 2024–2026",        body: bodyJW },
  { id: 213, to: "contact@aawa.co",                   name: "AAWA Contact",                   org: "AAWA",                           category: "JW",           subject: "Documented misuse of JW congregation infrastructure as covert HUMINT network — Costa Rica 2024–2026",              body: bodyJW },
  { id: 214, to: "info@watchtowerinformationservice.org.uk", name: "Watchtower Info Service", org: "WIS UK",                         category: "JW",           subject: "Costa Rica: JW organisational infrastructure documented as HUMINT collection substrate — 18-month evidence package",  body: bodyJW },
  { id: 215, to: "contact@watchtowerinformationservice.org.uk", name: "WIS Contact",          org: "WIS UK",                         category: "JW",           subject: "Costa Rica: JW organisational infrastructure documented as HUMINT collection substrate — 18-month evidence package",  body: bodyJW },
  { id: 216, to: "info@silentlambs.org",              name: "Silent Lambs",                   org: "Silent Lambs",                   category: "JW",           subject: "Documented misuse of JW congregation infrastructure as covert HUMINT network — Costa Rica 2024–2026",              body: bodyJW },
  { id: 217, to: "contact@silentlambs.org",           name: "Silent Lambs Contact",           org: "Silent Lambs",                   category: "JW",           subject: "Documented misuse of JW congregation infrastructure as covert HUMINT network — Costa Rica 2024–2026",              body: bodyJW },
  { id: 218, to: "info@recoveringfromreligion.org",   name: "Recovering from Religion",       org: "Recovering from Religion",       category: "JW",           subject: "Costa Rica: JW territory card system documented as HUMINT geographic targeting grid — operational evidence",         body: bodyJW },
  { id: 219, to: "contact@recoveringfromreligion.org",name: "RfR Contact",                    org: "Recovering from Religion",       category: "JW",           subject: "Costa Rica: JW territory card system documented as HUMINT geographic targeting grid — operational evidence",         body: bodyJW },
  { id: 220, to: "help@jwsupport.com",                name: "JW Support",                     org: "JW Support",                     category: "JW",           subject: "Costa Rica: JW territory card + circuit overseer rotation used as HUMINT collection substrate — documented",     body: bodyJW },
  { id: 221, to: "info@cjwf.org",                     name: "Crisis in Jehovah's Witnesses",  org: "CJWF",                           category: "JW",           subject: "Documented misuse of JW congregation infrastructure as covert HUMINT network — Costa Rica 2024–2026",              body: bodyJW },
  { id: 222, to: "contact@bonniezieman.com",          name: "Bonnie Zieman",                  org: "Bonnie Zieman",                  category: "JW",           subject: "Costa Rica: JW organisational infrastructure documented as HUMINT collection substrate — 18-month evidence package",  body: bodyJW },
  { id: 223, to: "jwvictims@watchtowervictimsmemorial.com", name: "Watchtower Victims Memorial", org: "WVM",                        category: "JW",           subject: "Documented misuse of JW congregation infrastructure as covert HUMINT network — Costa Rica 2024–2026",              body: bodyJW },
  { id: 224, to: "tips@exjwnews.com",                 name: "ExJW News",                      org: "ExJW News",                      category: "JW",           subject: "Costa Rica: JW territory card system documented as HUMINT geographic targeting grid — operational evidence",         body: bodyJW },
  { id: 225, to: "contact@thewatchtowerfiles.com",    name: "Watchtower Files",               org: "Watchtower Files",               category: "JW",           subject: "Costa Rica: JW territory card + circuit overseer rotation used as HUMINT collection substrate — documented",     body: bodyJW },
];
