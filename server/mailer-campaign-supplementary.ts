// Supplementary campaign — contacts extracted from S-Band liability mapping doc + OIJ dossier
// Categories:
//   SUPP-AIRLINE   — regulatory/legal depts of airlines (not safety@ already sent)
//   SUPP-AUTHORITY — LMA, MS Amlin, ALPA EAS, IFALPA CAR/SAM, ITU, DHL, product.safety@airbus
//   SUPP-LEGAL     — litigation firms, digital rights NGOs, aircraft lessors, DSE manufacturer
//   SUPP-PODCAST   — security / defense / aviation podcasts
//   SUPP-CORPORATE — whistleblower/compliance channels (IBM/Kyndryl, Zscaler)
//   SUPP-LAW-EN    — CR law enforcement, Ministerio Público, CSIRT, UIF, US Embassy, FDLE
// From: Samuel Wotton <hello@echokappa.com>

export interface SuppContact {
  id: number;
  to: string;
  name: string;
  org: string;
  category: "SUPP-AIRLINE" | "SUPP-AUTHORITY" | "SUPP-LEGAL" | "SUPP-PODCAST" | "SUPP-CORPORATE" | "SUPP-LAW-EN";
  subject: string;
  body: string;
}

// ── SUPP-AIRLINE: Regulatory / Legal depts ────────────────────────────────────

const bodyAirlineReg = `To the Regulatory Affairs / Legal Department,

I am writing to formally notify your airline's regulatory affairs team of a disclosed and unmitigated vulnerability in the backup power infrastructure at Aeropuerto Internacional Juan Santamaría (SJO/MROC), Costa Rica, which I believe falls within your regulatory compliance and legal risk monitoring obligations.

The backup generator systems at SJO are serviced exclusively by Setecom S.A. (Jacó, Puntarenas, Costa Rica), the sole national distributor of Deep Sea Electronics (DSE) generator controllers. The US Cybersecurity and Infrastructure Security Agency (CISA) has published four CVEs against the exact DSE models in service at SJO, including unauthenticated remote shutdown capability via Modbus TCP. The director of Setecom posted YouTube training sessions in which the default access credentials (Admin / Password1234) for these controllers are clearly visible. Modbus port 502 on Setecom's public IP address is open and unauthenticated at the time of writing — independently verifiable via Shodan or direct probe.

This notification is relevant to your regulatory affairs function because:

1. Under SMS (Safety Management System) obligations imposed by ICAO Annex 19 and applicable national regulations, carriers are required to maintain awareness of declared hazards at airports they serve. A disclosed CISA vulnerability in critical backup power infrastructure at a served airport may constitute a declared hazard requiring SMS documentation.

2. To the extent your airline's legal team monitors operational liability exposure, the constructive notice created by public CISA CVE filings — combined with no confirmed remediation from Costa Rican authorities — creates a potential liability posture that your legal department may wish to assess.

3. This notification has been simultaneously submitted to ICAO, IATA, FAA, EASA, the UK CAA, Transport Canada, Lloyd's of London, and aviation trade press.

I have eighteen months of forensic documentation on the operator (Setecom S.A.) available for review under standard confidentiality arrangements. The documentation includes packet captures, RF recordings, and network logs showing this operator engaging in unauthorized electronic access in the same geographic region as the airport infrastructure they service.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── SUPP-AUTHORITY: New authority contacts ────────────────────────────────────

const bodyAuthority2 = `To the Aviation Safety / Regulatory Division,

I am submitting a supplementary notification of a disclosed and unmitigated vulnerability at Aeropuerto Internacional Juan Santamaría (SJO/MROC), Costa Rica, for your records.

Setecom S.A. (Jacó, Puntarenas) is the sole national distributor and maintenance contractor for Deep Sea Electronics (DSE) backup generator controllers deployed at SJO, as well as ICE (Costa Rica national grid), Liberty telecom, and CCSS hospital networks. The US Cybersecurity and Infrastructure Security Agency (CISA) has published four CVEs against these exact DSE models, including unauthenticated remote generator shutdown via Modbus TCP. Default credentials (Admin / Password1234) were posted by the director on YouTube. Modbus port 502 on Setecom's public IP is open and unauthenticated — verifiable independently in real time.

Additionally, I have eighteen months of forensic documentation linking the director of Setecom to sustained unauthorized electronic access operations in Jacó, Costa Rica — including packet captures, RF recordings, and network logs. This documentation has been filed with Costa Rican authorities (OIJ, CSIRT-CR, MICITT, SUTEL, DIS, Ministerio Público, AERIS, DGAC) without confirmed remediation.

This matter has been submitted simultaneously to ICAO, IATA, FAA, EASA, the UK CAA, Transport Canada, Eurocontrol, Airlines for America, Airports Council International, and Lloyd's of London.

I am available to provide the full technical dossier upon request.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── SUPP-LEGAL: Litigation firms, NGOs, aircraft lessors, DSE ────────────────

const bodyLegal = `To the Investigations / Legal Intake Team,

I am writing to bring to your attention a matter that I believe falls squarely within your organisation's documented area of legal action.

I am a British-Canadian national who has been the subject of a sustained electronic surveillance and harassment operation in Costa Rica since December 2024. Over eighteen months I have assembled a forensic evidence package that establishes the following:

INFRASTRUCTURE LAYER (OT):
Setecom S.A. (Jacó, Puntarenas, Costa Rica) holds a national monopoly on Deep Sea Electronics (DSE) backup generator controllers deployed at Juan Santamaría International Airport (SJO), ICE (national power grid), Liberty telecom, and CCSS hospitals. CISA has published four CVEs against these models including unauthenticated remote shutdown via Modbus TCP. The director posted default credentials on YouTube. Modbus port 502 is publicly exposed.

INFRASTRUCTURE LAYER (IT):
Packet captures document TR-069 CWMP protocol exploitation via an ARRIS TG02DA gateway — the ISP-level backdoor port was used to push malicious configurations to my router. The data exfiltration path routes through Kyndryl and Zscaler zero-trust infrastructure — US-based servers — creating a Computer Fraud and Abuse Act (CFAA) jurisdictional hook via US infrastructure.

HUMINT LAYER:
Jehovah's Witness organizational infrastructure (territory card system, publisher-to-elder reporting chain, circuit overseer rotation) is functioning as a ground-level human intelligence collection substrate in the operational environment. The pattern matches documented historical precedents (Italian Fascist OVRA, Argentine SIDE).

FINANCIAL LAYER:
Timeshare operations (Jaco Vacations, Michael Greenwald) linked to inflated construction costs and shell account financial flows. An IRS-flagged identity theft case (Control #16221-445-09691-5) connected to the same network of actors.

EVIDENCE PACKAGE INCLUDES:
— SHA-256 verified network packet captures (PCAP/PCAPNG)
— RF recordings with KiwiSDR spectrum data
— Network logs (portmaster, Wireshark, tcpdump)
— Physical surveillance documentation
— Costa Rican procurement records (Registro Nacional)
— Correlation of Setecom's FOIA-confirmed ICE fiber invoices

The jurisdictional framework most relevant to your work:
— CFAA (US): Kyndryl/Zscaler/Google Trust Services US infrastructure used for MitM attacks
— GDPR (EU): JW WUKONG-pattern surveillance of non-consenting individuals by a body whose data practices the ECJ has already ruled violate EU privacy law
— UK Human Rights Act: Leigh Day's FinFisher/Gamma Group precedent applies directly

I am prepared to transmit the full evidence package under standard source protection arrangements and am available for a secure call.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── SUPP-PODCAST: Security / Defense / Aviation podcast pitches ───────────────

const bodyPodcast = `Hi [Name],

Story pitch — I think this is exactly the kind of documented, technically verifiable infrastructure story your audience wants.

The short version: a sole-source maintenance contractor for backup generator systems at a major Central American international airport (Juan Santamaría / SJO, Costa Rica) has four CISA-disclosed CVEs on the exact hardware they service, including unauthenticated remote shutdown via Modbus TCP. The company director posted default credentials (Admin / Password1234) on YouTube. Modbus port 502 on their public IP is open right now — you can verify it yourself via Shodan in about 30 seconds.

The longer version is more interesting: the same contractor (Setecom S.A., Jacó, Costa Rica) is also the sole national distributor for this hardware across the Costa Rican power grid (ICE), the national hospital network (CCSS), and major telecom infrastructure (Liberty CR). Single point of failure across the entire country's critical infrastructure, run by a company with publicly exposed SCADA credentials.

The additional layer: I have eighteen months of forensic documentation — packet captures, RF spectrum recordings, network logs — linking the director of this company to sustained unauthorised access operations targeting my personal networks in the same town where he operates his infrastructure business. The documentation includes:

— TR-069 CWMP exploitation via an ARRIS TG02DA gateway (ISP-level backdoor)
— Kyndryl/Zscaler zero-trust architecture used as a MitM interception layer
— 46.875 Hz signal anomalies consistent with OFDM ultrasonic subcarrier use
— Correlation between Setecom's FOIA-confirmed ICE fiber invoices and the surveillance infrastructure

I also have a secondary thread involving Jehovah's Witness organisational structures being used as a HUMINT collection substrate — a pattern with documented historical precedents in Italian Fascist and Argentine military intelligence operations — but that can wait for a second conversation.

Everything I'm describing is independently verifiable. The CISA CVEs are public. The Shodan data is real-time. The YouTube credential video is still accessible.

I'm happy to do a call, share the evidence package under standard source protection, or send whatever format works best for your team.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── SUPP-CORPORATE: Internal compliance / whistleblower channels ──────────────

const bodyCorporate = `To the Compliance / Whistleblower Team,

I am filing this notice through your official compliance channel regarding the documented use of your organisation's infrastructure in what I believe constitutes an unauthorized network access and electronic surveillance operation in Costa Rica.

Over eighteen months I have assembled forensic documentation — SHA-256 verified packet captures, network logs, and RF recordings — that establishes the following:

Your organisation's infrastructure (specifically: Kyndryl-managed network backhaul and Zscaler zero-trust certificate authority services) is present in the traffic path of what I have documented as a man-in-the-middle interception operation targeting my personal devices in Jacó, Puntarenas, Costa Rica.

The specific indicators in my packet captures include:
— Zscaler and Kyndryl IP ranges appearing in certificate chain data on traffic that should route to standard internet endpoints
— TR-069 CWMP protocol commands consistent with router configuration injection arriving from ISP-level infrastructure
— Correlation between Liberty CR (ISP) network events and Kyndryl-routed traffic at anomalous times

This activity appears to be executed by or through Setecom S.A. (Jacó, Puntarenas), a Costa Rican ISP subcontractor with CISA-disclosed SCADA vulnerabilities (unauthenticated Modbus TCP remote shutdown on backup generator controllers) and a documented history of unauthorised network access. The operator has FOIA-confirmed ICE fiber contracts covering the Jacó operational area.

I am not asserting that your organisation has authorised or directed this activity. I am filing this through your compliance channel so that your internal security and legal teams can investigate whether your infrastructure is being misused by a downstream partner or subcontractor.

I am available to provide the full technical evidence package upon request.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── SUPP-LAW-EN: CR law enforcement, US Embassy, FDLE ────────────────────────

const bodyLawEn = `Estimados señores / Dear Officers,

I am filing this as a formal criminal and regulatory complaint regarding a sustained electronic surveillance and harassment operation in Costa Rica, supported by eighteen months of forensic documentation.

COMPLAINANT: Samuel P. Wotton, British-Canadian national, Jacó, Puntarenas, Costa Rica. Phone: +506 6377-3099. Email: hello@echokappa.com.

PRIMARY SUSPECT: Héctor Mora Marín, Director, Setecom S.A. (Jacó, Puntarenas, Costa Rica). Setecom holds national distribution and maintenance contracts for Deep Sea Electronics (DSE) backup generator controllers deployed at ICE (national power grid), Liberty telecom, CCSS hospitals, and Juan Santamaría International Airport (SJO).

DOCUMENTED OFFENCES:

1. UNAUTHORIZED COMPUTER ACCESS (Art. 229bis, 230 Código Penal CR):
Packet capture evidence documents TR-069 CWMP protocol exploitation via ARRIS TG02DA gateway to push malicious router configurations. Network logs establish correlation between Setecom/Liberty CR ISP events and anomalous device behaviour on my personal networks over 14+ months.

2. CRITICAL INFRASTRUCTURE VULNERABILITY (Ley 9048, Art. 229ter):
CISA has published four CVEs against the exact DSE hardware Setecom services, including unauthenticated remote generator shutdown. Modbus port 502 on Setecom's public IP (190.106.77.194) is open and unauthenticated. The director posted default credentials (Admin / Password1234) on YouTube. This constitutes a documented, unmitigated threat to national critical infrastructure.

3. HARASSMENT / DIRECTED ACOUSTIC INTERFERENCE (Art. 123bis, 197 Código Penal CR):
RF spectrum recordings document anomalous emissions consistent with directed acoustic / ultrasonic array activity from properties proximate to my residence. These recordings are time-correlated with personal interference events over the documented period.

4. IDENTITY THEFT / TAX FRAUD (IRS Case #16221-445-09691-5):
US IRS correspondence documents fraudulent tax filings using my identifying information, connected to the same network of actors.

SECONDARY SUBJECTS:
— Michael Greenwald (Jaco Vacations) — alleged coordination of surveillance-enabled property network; US nexus via Florida Keys assets
— Pablo Pasti Mora — alleged logistics/transport coordination
— Marjorie Alfaro / Jairo Alfaro — alleged facilitation via Liberty CR network infrastructure
— Jeff Porter (self-disclosed CIA affiliation) — present at multiple documented surveillance locations across the 18-month period

EVIDENCE AVAILABLE:
— SHA-256 verified PCAP / PCAPNG network captures
— RF spectrum recordings (KiwiSDR, RTL-SDR)
— Network logs (portmaster, tcpdump, Wireshark exports)
— Physical surveillance documentation with GPS-timestamped photographs
— Costa Rican procurement records (Registro Nacional contract database)
— FOIA-produced ICE fiber invoices linking Setecom to relevant geographic infrastructure
— IRS correspondence (Case #16221-445-09691-5)
— YouTube video (still accessible) showing default credentials

REQUESTS:
1. Confirm receipt and provide expediente number and point of contact.
2. Advise secure method for evidence package transfer.
3. Evaluate whether preservation orders for Liberty CR / ICE network logs are warranted.
4. Advise on CSIRT-CR referral procedure for the CISA CVE / Modbus exposure at SJO.

This complaint has been simultaneously submitted to MICITT, CSIRT-CR, SUTEL, DIS, AERIS, DGAC, the US Embassy San José, and the FBI (via IC3).

Samuel Wotton
Jacó, Puntarenas, Costa Rica
+506 6377-3099 | hello@echokappa.com`;

// ── DSE: Direct to the hardware manufacturer ──────────────────────────────────

const bodyDSE = `To the Quality, Health & Safety / Product Security Team,

I am writing to formally notify Deep Sea Electronics (DSE) that your backup generator controller products — specifically the models deployed by your Costa Rican sole-distributor Setecom S.A. — are operating with unmitigated CISA-disclosed vulnerabilities in critical national infrastructure, including Juan Santamaría International Airport (SJO), ICE (Costa Rica national power grid), CCSS hospital networks, and Liberty telecom.

CISA has published four CVEs against DSE controller series. These include unauthenticated remote shutdown capability via Modbus TCP. Setecom S.A. (Jacó, Puntarenas), your sole national distributor, has Modbus port 502 open and unauthenticated on their public IP (190.106.77.194) at the time of writing — verifiable via Shodan in real time. The company director posted YouTube training sessions in which the default credentials (Admin / Password1234) are clearly visible. These credentials have not been changed on deployed units.

I am notifying DSE directly because:
1. Your products are being operated in a manner that violates your own security guidance and may violate your ISO 45001 safety mandates.
2. The deployment locations include safety-critical aviation, hospital, and power grid infrastructure.
3. Your sole national distributor for Costa Rica is documented as having engaged in unauthorized electronic access operations in the region — creating serious questions about the security posture of their entire maintained portfolio.
4. Your organisation may have notification obligations to CISA and other regulators regarding the remediation status of your known CVEs.

I have eighteen months of forensic documentation available and am prepared to transmit the full technical dossier upon request.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`;

// ── CONTACTS ──────────────────────────────────────────────────────────────────

export const SUPP_CONTACTS: SuppContact[] = [

  // ── SUPP-AIRLINE: Regulatory / Legal / Additional depts ───────────────────
  { id: 301, to: "regulatory@aa.com",              name: "AA Regulatory",            org: "American Airlines",       category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO backup generator SCADA: CISA CVEs, unauthenticated remote shutdown (constructive notice)", body: bodyAirlineReg },
  { id: 302, to: "corporate.security@aa.com",      name: "AA Corp Security",         org: "American Airlines",       category: "SUPP-AIRLINE",    subject: "Airport SCADA security — SJO backup generator contractor: CISA CVEs, Modbus:502 exposed, default creds on YouTube",   body: bodyAirlineReg },
  { id: 303, to: "flightsafety@delta.com",         name: "Delta Flight Safety",      org: "Delta Air Lines",         category: "SUPP-AIRLINE",    subject: "SJO SMS notification — backup generator SCADA: CISA CVEs, sole-source contractor, unauthenticated remote shutdown",   body: bodyAirlineReg },
  { id: 304, to: "legal@delta.com",                name: "Delta Legal",              org: "Delta Air Lines",         category: "SUPP-AIRLINE",    subject: "Legal / liability notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",        body: bodyAirlineReg },
  { id: 305, to: "regulatory@united.com",          name: "UA Regulatory",            org: "United Airlines",         category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO backup generator SCADA: CISA CVEs, constructive notice for SMS filing",                  body: bodyAirlineReg },
  { id: 306, to: "safety@alaskaair.com",           name: "Alaska Safety",            org: "Alaska Airlines",         category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 307, to: "regulatory@alaskaair.com",       name: "Alaska Regulatory",        org: "Alaska Airlines",         category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 308, to: "corpcom@jetblue.com",            name: "JetBlue Corp Comms",       org: "JetBlue",                 category: "SUPP-AIRLINE",    subject: "Airport infrastructure disclosure — SJO backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",          body: bodyAirlineReg },
  { id: 309, to: "corporate.affairs@wnco.com",     name: "Southwest Corp Affairs",   org: "Southwest Airlines",      category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 310, to: "regulatory@wnco.com",            name: "Southwest Regulatory",     org: "Southwest Airlines",      category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 311, to: "legal@spirit.com",               name: "Spirit Legal",             org: "Spirit Airlines",         category: "SUPP-AIRLINE",    subject: "Legal notification — SJO backup generator SCADA: CISA CVEs, constructive notice for liability assessment",            body: bodyAirlineReg },
  { id: 312, to: "corporate@flyfrontier.com",      name: "Frontier Corporate",       org: "Frontier Airlines",       category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 313, to: "safety@suncountry.com",          name: "Sun Country Safety",       org: "Sun Country Airlines",    category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 314, to: "regulatory@suncountry.com",      name: "Sun Country Regulatory",   org: "Sun Country Airlines",    category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 315, to: "regulatory@aircanada.ca",        name: "Air Canada Regulatory",    org: "Air Canada",              category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 316, to: "corporate.security@westjet.com", name: "WestJet Corp Security",    org: "WestJet",                 category: "SUPP-AIRLINE",    subject: "Airport security disclosure — SJO backup generator SCADA: CISA CVEs, Modbus:502 open, sole-source contractor",        body: bodyAirlineReg },
  { id: 317, to: "safety@airtransat.com",          name: "Air Transat Safety",       org: "Air Transat",             category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 318, to: "legal@airtransat.com",           name: "Air Transat Legal",        org: "Air Transat",             category: "SUPP-AIRLINE",    subject: "Legal notification — SJO backup generator SCADA: CISA CVEs, constructive notice for liability assessment",            body: bodyAirlineReg },
  { id: 319, to: "safety@sunwing.ca",              name: "Sunwing Safety",           org: "Sunwing Airlines",        category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 320, to: "regulatory@sunwing.ca",          name: "Sunwing Regulatory",       org: "Sunwing Airlines",        category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 321, to: "regulatory@avianca.com",         name: "Avianca Regulatory",       org: "Avianca",                 category: "SUPP-AIRLINE",    subject: "Notificación regulatoria — SJO SCADA: CVEs CISA en contratista único de generadores, aviso constructivo",            body: bodyAirlineReg },
  { id: 322, to: "regulatory@copaair.com",         name: "Copa Regulatory",          org: "Copa Airlines",           category: "SUPP-AIRLINE",    subject: "Notificación regulatoria — SJO SCADA: CVEs CISA en contratista único de generadores, aviso constructivo",            body: bodyAirlineReg },
  { id: 323, to: "regulatory@aeromexico.com",      name: "Aeromexico Regulatory",    org: "Aeromexico",              category: "SUPP-AIRLINE",    subject: "Notificación regulatoria — SJO SCADA: CVEs CISA en contratista único de generadores, aviso constructivo",            body: bodyAirlineReg },
  { id: 324, to: "safety@arajet.com",              name: "Arajet Safety",            org: "Arajet",                  category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 325, to: "regulatory@arajet.com",          name: "Arajet Regulatory",        org: "Arajet",                  category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 326, to: "regulatory@latam.com",           name: "LATAM Regulatory",         org: "LATAM Airlines",          category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 327, to: "regulatory@iberia.es",           name: "Iberia Regulatory",        org: "Iberia",                  category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 328, to: "regulatory@airfrance.fr",        name: "Air France Regulatory",    org: "Air France",              category: "SUPP-AIRLINE",    subject: "Notification réglementaire — SJO SCADA: CVEs CISA sur contractant unique générateurs, avis constructif",            body: bodyAirlineReg },
  { id: 329, to: "safety@dlh.de",                  name: "Lufthansa DLH Safety",     org: "Lufthansa Group",         category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 330, to: "regulatory@dlh.de",              name: "Lufthansa DLH Regulatory", org: "Lufthansa Group",         category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 331, to: "regulatory@klm.com",             name: "KLM Regulatory",           org: "KLM",                     category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 332, to: "regulatory@ba.com",              name: "BA Regulatory",            org: "British Airways",         category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 333, to: "safety@edelweiss.com",           name: "Edelweiss Safety",         org: "Edelweiss Air",           category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 334, to: "regulatory@edelweiss.com",       name: "Edelweiss Regulatory",     org: "Edelweiss Air",           category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 335, to: "regulatory@condor.com",          name: "Condor Regulatory",        org: "Condor",                  category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 336, to: "safety@iberojet.com",            name: "Iberojet Safety",          org: "Iberojet",                category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 337, to: "regulatory@iberojet.com",        name: "Iberojet Regulatory",      org: "Iberojet",                category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 338, to: "safety@tuifly.com",              name: "TUI fly Safety",           org: "TUI fly",                 category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 339, to: "regulatory@tuifly.com",          name: "TUI fly Regulatory",       org: "TUI fly",                 category: "SUPP-AIRLINE",    subject: "Regulatory notification — SJO SCADA vulnerability: CISA CVEs on sole-source backup generator contractor",            body: bodyAirlineReg },
  { id: 340, to: "seguridad@sansa.com",            name: "SANSA Seguridad",          org: "SANSA (CR domestic)",     category: "SUPP-AIRLINE",    subject: "Notificación SJO — infraestructura SCADA generadores: CVEs CISA, Modbus:502 abierto, contratista único",            body: bodyAirlineReg },
  { id: 341, to: "operaciones@sansa.com",          name: "SANSA Operaciones",        org: "SANSA (CR domestic)",     category: "SUPP-AIRLINE",    subject: "Notificación SJO — infraestructura SCADA generadores: CVEs CISA, Modbus:502 abierto, contratista único",            body: bodyAirlineReg },
  { id: 342, to: "safety@greenairways.com",        name: "CR Green Airways Safety",  org: "Costa Rica Green Airways", category: "SUPP-AIRLINE",   subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },
  { id: 343, to: "seguridad@aerobell.com",         name: "Aerobell Seguridad",       org: "Aerobell",                category: "SUPP-AIRLINE",    subject: "Notificación SJO — infraestructura SCADA generadores: CVEs CISA, Modbus:502 abierto, contratista único",            body: bodyAirlineReg },
  { id: 344, to: "aviation.safety@dhl.com",        name: "DHL Aero Expreso Safety",  org: "DHL Aero Expreso",        category: "SUPP-AIRLINE",    subject: "SJO infrastructure notification — backup generator SCADA: CISA CVEs, unauthenticated remote shutdown",               body: bodyAirlineReg },

  // ── SUPP-AUTHORITY: New authority / underwriter contacts ──────────────────
  { id: 345, to: "lma@lmalloyds.com",              name: "LMA Aviation Committee",   org: "Lloyd's Market Association", category: "SUPP-AUTHORITY", subject: "Material risk disclosure — SJO Costa Rica: CISA CVEs on sole-source backup generator SCADA contractor (unmitigated)", body: bodyAuthority2 },
  { id: 346, to: "aviation.claims@msamlin.com",    name: "MS Amlin Aviation",        org: "MS Amlin",                category: "SUPP-AUTHORITY",  subject: "Aviation risk disclosure — SJO Costa Rica: CISA CVEs on sole-source backup generator SCADA contractor",               body: bodyAuthority2 },
  { id: 347, to: "EASec@alpa.org",                 name: "ALPA Engineering & Air Safety", org: "ALPA",              category: "SUPP-AUTHORITY",  subject: "Engineering safety notification — SJO SJO backup power SCADA: CISA CVEs, sole-source contractor, Modbus:502 exposed",   body: bodyAuthority2 },
  { id: 348, to: "houhq@ifalpa.org",               name: "IFALPA CAR/SAM Region",    org: "IFALPA",                  category: "SUPP-AUTHORITY",  subject: "CAR/SAM region safety — SJO backup power infrastructure: CISA CVEs on sole-source SCADA contractor",                  body: bodyAuthority2 },
  { id: 349, to: "brmail@itu.int",                 name: "ITU Radiocommunication Bureau", org: "ITU",               category: "SUPP-AUTHORITY",  subject: "Spectrum sovereignty notification — S-Band interference + SCADA vulnerability at SJO/MROC, Costa Rica",               body: bodyAuthority2 },
  { id: 350, to: "product.safety@airbus.com",      name: "Airbus Product Safety",    org: "Airbus SE",               category: "SUPP-AUTHORITY",  subject: "Airport infrastructure safety — SJO Costa Rica: SCADA CVEs on sole-source backup generator contractor",               body: bodyAuthority2 },

  // ── SUPP-LEGAL: Litigation firms, digital rights NGOs, aircraft lessors, DSE
  { id: 351, to: "carrie.decell@knightcolumbia.org", name: "Carrie DeCell / Knight Institute", org: "Knight First Amendment Institute", category: "SUPP-LEGAL", subject: "CFAA-jurisdictional surveillance case — Kyndryl/Zscaler US infrastructure used in Costa Rica MitM operation", body: bodyLegal },
  { id: 352, to: "iaduwa@leighday.co.uk",          name: "Ida Aduwa / Leigh Day",    org: "Leigh Day (UK)",          category: "SUPP-LEGAL",      subject: "Potential FinFisher-pattern case — corporate surveillance via Setecom/Kyndryl, Costa Rica, 18-month evidence package",  body: bodyLegal },
  { id: 353, to: "press@eff.org",                  name: "EFF Media",                org: "Electronic Frontier Foundation", category: "SUPP-LEGAL", subject: "TR-069 router exploitation + Kyndryl/Zscaler MitM — 18-month forensic case, Costa Rica, CFAA hooks",                body: bodyLegal },
  { id: 354, to: "inquiries@citizenlab.ca",        name: "Citizen Lab",              org: "Citizen Lab (U of Toronto)", category: "SUPP-LEGAL",   subject: "Commercial spyware / infrastructure abuse pattern — Costa Rica, 18-month forensic evidence, requesting technical review",  body: bodyLegal },
  { id: 355, to: "info@noyb.eu",                   name: "noyb / Max Schrems",       org: "noyb",                    category: "SUPP-LEGAL",      subject: "GDPR case: JW WUKONG-pattern surveillance via congregation infrastructure + ECJ data collection ruling leverage",        body: bodyLegal },
  { id: 356, to: "legal@accessnow.org",            name: "Access Now Legal",         org: "Access Now",              category: "SUPP-LEGAL",      subject: "Digital security case — targeted electronic surveillance via infrastructure monopoly, Costa Rica, 18-month evidence",     body: bodyLegal },
  { id: 357, to: "help@accessnow.org",             name: "Access Now Helpline",      org: "Access Now",              category: "SUPP-LEGAL",      subject: "Digital security helpline — targeted surveillance operation, Costa Rica, seeking technical review + legal intake",         body: bodyLegal },
  { id: 358, to: "info@privacyinternational.org",  name: "Privacy International",    org: "Privacy International",   category: "SUPP-LEGAL",      subject: "Surveillance abuse case — hidden data ecosystem via telecom infrastructure + JW HUMINT layer, Costa Rica",               body: bodyLegal },
  { id: 359, to: "greg.andres@davispolk.com",      name: "Greg Andres / Davis Polk", org: "Davis Polk & Wardwell",   category: "SUPP-LEGAL",      subject: "CFAA-jurisdictional case — Kyndryl/Zscaler/Google Trust Services US infrastructure in MitM surveillance operation",      body: bodyLegal },
  { id: 360, to: "jpizzirusso@hausfeld.com",       name: "James Pizzirusso / Hausfeld", org: "Hausfeld LLP",         category: "SUPP-LEGAL",      subject: "Cyber surveillance / biometric privacy case — 18-month forensic package, US infrastructure hooks, Costa Rica",           body: bodyLegal },
  { id: 361, to: "contact@aercap.com",             name: "AerCap",                   org: "AerCap",                  category: "SUPP-LEGAL",      subject: "Fleet liability disclosure — SJO Costa Rica: CISA CVEs on sole-source backup generator SCADA contractor (unmitigated)",  body: bodyLegal },
  { id: 362, to: "jmcginley@aercap.com",           name: "Joseph McGinley / AerCap IR", org: "AerCap",              category: "SUPP-LEGAL",      subject: "Fleet risk disclosure — SJO Costa Rica: unmitigated SCADA CVEs on sole-source backup generator contractor",               body: bodyLegal },
  { id: 363, to: "info@airleasecorp.com",          name: "Air Lease Corporation",    org: "Air Lease Corp",          category: "SUPP-LEGAL",      subject: "Fleet risk disclosure — SJO Costa Rica: unmitigated SCADA CVEs on sole-source backup generator contractor",               body: bodyLegal },
  { id: 364, to: "timothy.ross@bocaviation.com",   name: "Timothy Ross / BOC Aviation", org: "BOC Aviation",        category: "SUPP-LEGAL",      subject: "Fleet ESG risk — SJO Costa Rica: CISA CVEs on sole-source airport backup generator SCADA contractor",                    body: bodyLegal },
  { id: 365, to: "support@deepseaelectronics.com", name: "DSE Quality / Safety",     org: "Deep Sea Electronics",    category: "SUPP-LEGAL",      subject: "ISO 45001 / CISA CVE remediation notification — Setecom S.A. (Costa Rica) operating your hardware with exposed Modbus:502", body: bodyDSE },
  { id: 366, to: "icrt@theguardian.com",           name: "The Guardian ICRT",        org: "The Guardian",            category: "SUPP-LEGAL",      subject: "Security vulnerability disclosure — SJO airport SCADA + 18-month surveillance forensics, Costa Rica",                      body: bodyLegal },
  { id: 367, to: "nonprofitexplorer@propublica.org", name: "ProPublica Tech Desk",   org: "ProPublica",              category: "SUPP-LEGAL",      subject: "Investigative tip — SCADA vulnerability at SJO + corporate surveillance infrastructure, 18-month forensic package",       body: bodyLegal },

  // ── SUPP-PODCAST: Security / Defence / Aviation podcasts ──────────────────
  { id: 368, to: "jack@darknetdiaries.com",        name: "Jack Rhysider",            org: "Darknet Diaries",         category: "SUPP-PODCAST",    subject: "Story pitch: sole-source airport SCADA contractor, 4 CISA CVEs, default creds on YouTube, 18-month forensic case",       body: bodyPodcast },
  { id: 369, to: "patrick@risky.biz",              name: "Patrick Gray",             org: "Risky Business",          category: "SUPP-PODCAST",    subject: "Story pitch: airport SCADA monopoly contractor, CISA CVEs, Modbus:502 open, Kyndryl/Zscaler MitM layer",               body: bodyPodcast },
  { id: 370, to: "clickhere@theintercept.com",     name: "Click Here / The Intercept", org: "The Intercept",        category: "SUPP-PODCAST",    subject: "Story pitch: directed energy / surveillance infrastructure case, Costa Rica, 18-month forensic package",                 body: bodyPodcast },
  { id: 371, to: "securitynow@twit.tv",            name: "Security Now",             org: "TWiT / Security Now",     category: "SUPP-PODCAST",    subject: "Story pitch: 46.875 Hz OFDM subcarrier, airport SCADA CVEs, 18-month forensic case — Costa Rica",                       body: bodyPodcast },
  { id: 372, to: "podcast@privacyinternational.org", name: "PI Podcast",             org: "Privacy International",   category: "SUPP-PODCAST",    subject: "Story pitch: surveillance via infrastructure monopoly + JW HUMINT layer, 18-month forensic case, Costa Rica",            body: bodyPodcast },
  { id: 373, to: "ran@malicious.life",             name: "Ran Levi",                 org: "Malicious Life",          category: "SUPP-PODCAST",    subject: "Story pitch: LEO radar warfare testbed / airport SCADA CVEs — first documented infrastructure surveillance case, CR",    body: bodyPodcast },
  { id: 374, to: "modem@wired.com",                name: "Wired Modem",              org: "Wired",                   category: "SUPP-PODCAST",    subject: "Story pitch: airport SCADA monopoly, 4 CISA CVEs, Kyndryl/Zscaler MitM layer, 18-month forensic case, Costa Rica",      body: bodyPodcast },
  { id: 375, to: "shawn@vigilance.media",          name: "Shawn Ryan",               org: "Shawn Ryan Show",         category: "SUPP-PODCAST",    subject: "Story pitch: directed energy / surveillance infrastructure + CIA-JW HUMINT network, 18-month forensic case, CR",         body: bodyPodcast },
  { id: 376, to: "warzone@thedrive.com",           name: "The War Zone",             org: "The War Zone / The Drive", category: "SUPP-PODCAST",   subject: "Story pitch: SCADA vulnerability at SJO + S-Band interference in MROC approach corridor, 18-month forensic case",       body: bodyPodcast },
  { id: 377, to: "podcast@aviationweek.com",       name: "Aviation Week Podcast",    org: "Aviation Week",           category: "SUPP-PODCAST",    subject: "Story pitch: SJO backup generator SCADA — 4 CISA CVEs, sole-source contractor, Modbus:502 open, 18 months documented",  body: bodyPodcast },

  // ── SUPP-CORPORATE: Whistleblower / compliance channels ───────────────────
  { id: 378, to: "whistleblower@kyndryl.com",      name: "Kyndryl Whistleblower",    org: "Kyndryl",                 category: "SUPP-CORPORATE",  subject: "Compliance report: Kyndryl infrastructure appearing in MitM traffic captures, Jacó, Puntarenas, Costa Rica",            body: bodyCorporate },
  { id: 379, to: "trustww@us.ibm.com",             name: "IBM Trust / Compliance",   org: "IBM",                     category: "SUPP-CORPORATE",  subject: "Compliance report: IBM/Kyndryl infrastructure in MitM traffic captures, Costa Rica, 18-month forensic documentation",    body: bodyCorporate },
  { id: 380, to: "ethics@ibm.com",                 name: "IBM Ethics",               org: "IBM",                     category: "SUPP-CORPORATE",  subject: "Ethics report: IBM/Kyndryl infrastructure appearing in unauthorized surveillance traffic, Costa Rica",                    body: bodyCorporate },
  { id: 381, to: "compliance@zscaler.com",         name: "Zscaler Compliance",       org: "Zscaler",                 category: "SUPP-CORPORATE",  subject: "Compliance report: Zscaler zero-trust infrastructure in MitM traffic captures, Jacó, Costa Rica",                        body: bodyCorporate },
  { id: 382, to: "rschlossman@zscaler.com",        name: "Robert Schlossman / Zscaler CLO", org: "Zscaler",          category: "SUPP-CORPORATE",  subject: "CLO notification: Zscaler infrastructure documented in unauthorized MitM surveillance traffic, Costa Rica",              body: bodyCorporate },

  // ── SUPP-LAW-EN: CR law enforcement, US Embassy, FDLE ────────────────────
  { id: 383, to: "oij_denuncias@poder-judicial.go.cr",  name: "OIJ Denuncias",        org: "OIJ Costa Rica",         category: "SUPP-LAW-EN",    subject: "Denuncia formal: acceso no autorizado, infraestructura crítica, acoso electrónico — Setecom S.A. / Héctor Mora Marín",   body: bodyLawEn },
  { id: 384, to: "secfi_oij@poder-judicial.go.cr",      name: "OIJ Sección Fraude Informático", org: "OIJ Costa Rica", category: "SUPP-LAW-EN",  subject: "Denuncia: delitos informáticos, TR-069 exploit, Setecom S.A. — paquete forense 18 meses disponible",                    body: bodyLawEn },
  { id: 385, to: "cicooij@poder-judicial.go.cr",        name: "OIJ CICO",             org: "OIJ Costa Rica",         category: "SUPP-LAW-EN",    subject: "Denuncia confidencial: acceso no autorizado, infraestructura crítica, Setecom S.A., Jacó, Puntarenas",                   body: bodyLawEn },
  { id: 386, to: "csirt@micitt.go.cr",                  name: "CSIRT-CR",             org: "MICITT / CSIRT-CR",      category: "SUPP-LAW-EN",    subject: "Vulnerabilidad crítica activa: Setecom S.A. — CVEs CISA, Modbus:502 abierto, contratista único SJO/ICE/CCSS/Liberty",    body: bodyLawEn },
  { id: 387, to: "fgeneral@poder-judicial.go.cr",       name: "Fiscalía General",     org: "Ministerio Público CR",  category: "SUPP-LAW-EN",    subject: "Denuncia formal: delitos informáticos, acoso electrónico, vulnerabilidad infraestructura crítica — Setecom S.A.",         body: bodyLawEn },
  { id: 388, to: "oatri-mp@poder-judicial.go.cr",       name: "MP Relaciones Internacionales", org: "Ministerio Público CR", category: "SUPP-LAW-EN", subject: "Denuncia transnacional: red de vigilancia, acceso no autorizado, nexo EE.UU.–Costa Rica — 18 meses documentado",  body: bodyLawEn },
  { id: 389, to: "alj-fiscalia@poder-judicial.go.cr",   name: "Fiscalía Alajuela",    org: "Ministerio Público CR",  category: "SUPP-LAW-EN",    subject: "Denuncia local: acceso no autorizado, acoso electrónico, La Guácima / Jacó — paquete forense disponible",                body: bodyLawEn },
  { id: 390, to: "remip@migracion.go.cr",               name: "Migración REMIP",      org: "Migración Costa Rica",   category: "SUPP-LAW-EN",    subject: "Consulta movimientos migratorios: Genesis Daniela Peralta Márquez (venezolana, 9+ años CR sin registro de entrada)",     body: bodyLawEn },
  { id: 391, to: "certificacionesmm@migracion.go.cr",   name: "Migración Certificaciones", org: "Migración CR",      category: "SUPP-LAW-EN",    subject: "Solicitud certificación movimientos migratorios — Genesis D. Peralta Márquez, Pablo Pasti Mora",                          body: bodyLawEn },
  { id: 392, to: "contraloriadeservicios@migracion.go.cr", name: "Migración Contraloría", org: "Migración CR",       category: "SUPP-LAW-EN",    subject: "Queja formal: obstaculización verificación estatus migratorio en caso de denuncia activa",                               body: bodyLawEn },
  { id: 393, to: "notificaciones-uif@icd.go.cr",        name: "UIF-ICD",              org: "ICD / UIF Costa Rica",   category: "SUPP-LAW-EN",    subject: "Reporte UIF: actividad financiera sospechosa, lavado de dinero, cuentas shell — red Setecom/Jaco Vacations",             body: bodyLawEn },
  { id: 394, to: "icd-uif@icd.go.cr",                   name: "ICD UIF",              org: "ICD Costa Rica",         category: "SUPP-LAW-EN",    subject: "Reporte actividad financiera sospechosa: shell accounts, inflación de costos construcción, red Jacó/Alajuela",           body: bodyLawEn },
  { id: 395, to: "acssanjose@state.gov",                 name: "US Embassy ACS",       org: "US Embassy San José",    category: "SUPP-LAW-EN",    subject: "American Citizen Services: formal report — sustained electronic surveillance, infrastructure abuse, Costa Rica",          body: bodyLawEn },
  { id: 396, to: "OIGReportFraud@fdle.state.fl.us",     name: "FDLE OIG Fraud",       org: "Florida Dept of Law Enforcement", category: "SUPP-LAW-EN", subject: "Florida nexus: Michael Greenwald (Jaco Vacations) Florida Keys assets — CR surveillance network, IRS fraud",     body: bodyLawEn },
];
