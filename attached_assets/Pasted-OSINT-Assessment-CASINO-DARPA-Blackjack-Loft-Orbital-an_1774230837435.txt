OSINT Assessment: CASINO, DARPA Blackjack, Loft Orbital, and Ground Operations in Latin America
Executive summary
Public documentation supports a programmatic relationship among (1) the U.S. acquisition ecosystem that evolved from SMC into SSC, (2) DARPA’s proliferated-LEO tech demonstrations (Blackjack), and (3) SDA’s operational proliferated architecture (PWSA/NDSA). The relationship is best evidenced by (a) SSC’s CASINO-linked hybrid demonstration work with commercial imagery satellites (PredaSAR) explicitly tied to DARPA Blackjack, (b) DARPA’s own statements about the Blackjack architecture and contractors, and (c) SDA awards that build the operational transport/tracking layers and the associated ground “Operations & Integration” segment. 

On “ground ops,” the strongest public evidence points to a shift away from building dedicated government ground-station footprints and toward leasing/connecting to commercial antennas via market-style orchestration (e.g., Joint Antenna Marketplace) and cloud-native services (TREx). This model intrinsically implies global access and can route contacts through commercial facilities—including in Latin America—without a dedicated “program-branded” site. 

In Latin America specifically, public sources show at least four categories of “ground” infrastructure relevant to these architectures:

Commercial TT&C/mission ground stations (e.g., KSAT and SSC sites in Chile, plus ATLAS’s Chile site). 
Cloud-managed ground-station services (e.g., AWS Ground Station antenna location in Punta Arenas, and Microsoft’s Azure Orbital partner model). 
Commercial SSA sensors (not TT&C, but strategically relevant): LeoLabs’ S-band Costa Rica Space Radar publicly announced as operational. 
Major Latin American teleports (Italian-linked via Telespazio/Leonardo) that host LEO gateways and provide teleport services (e.g., Maricá, Brazil; ARSAT Benavidez, Argentina). 
For Loft Orbital, public documentation supports multiple U.S. government touchpoints: participation in SSC’s STEP 2.0 IDIQ pool; prior SBIR/Phase II work associated with SMC; and participation (via Loft Federal) on the Ball/Microsoft team for SDA’s NExT experimental testbed, including Azure Orbital ground-station integration. 

No public procurement, lease, license, or MOU records found in open sources tie CASINO/Blackjack/PWSA ground infrastructure to Jehovah’s Witnesses or LDS organizations in Latin America or Costa Rica. This report treats any such linkage as unverified absent documentary evidence. (Details on records searched are provided below.) 

Program offices and architecture
Organizational lineage and acquisition roles
The acquisition structure that matters here is the shift from the U.S. Air Force’s Space and Missile Systems Center (SMC) to the U.S. Space Force Space Systems Command (SSC). Public U.S. Space Force reporting describes SSC as a redesignation/stand-up of SMC at Los Angeles AFB and identifies SSC’s acquisition mission scope. 

The R&D-to-operations pathway relevant to proliferated LEO “mesh” architectures is visible across:

Defense Advanced Research Projects Agency’s Blackjack program (tech demos and risk-reduction flights). 
Space Development Agency awards for Transport/Tracking layers and the Tranche 1 ground O&I segment (operations, integration, and ground centers). 
SSC’s commercial-augmentation approach (CASINO) and its alignment with hybrid demonstrations (PredaSAR + Blackjack). 
Program roles comparison table
Program / construct	Lead org (public)	Purpose (public)	“On the ground” implications (what is publicly evidenced)
CASINO (Commercially Augmented Space Inter-Networked Operations)	SSC program office (CASINO) referenced in SSC media release; DIU-facilitated cloud demos referenced by Microsoft	Hybrid government–commercial architecture concepts; accelerated data access/processing; demos of direct-to-cloud pipelines	Evidence emphasizes cloud/ground processing and leveraging commercial satellites + commercial providers rather than building bespoke foreign ground sites. 
DARPA Blackjack	DARPA	Demonstrate elements for a “global high-speed network in LEO,” resilient and persistent coverage	Risk-reduction flights include optical links and autonomy; ground integration appears via mission operations and commercial ground-station connectivity in later transition work. 
SDA PWSA / NDSA (Transport + Tracking layers)	SDA	Iterative tranches of optically-interconnected satellites (Transport) plus missile warning/tracking (Tracking)	Public contracting includes a dedicated ground Operations & Integration contract (Tranche 1) and references to government-owned contractor-operated ground ops centers (in the U.S.). 
JAM + TREx (cloud-native antenna orchestration)	SSC with NRL; tied to SDA support	Connect satellite ops centers to commercial & government antennas “worldwide”; TREx transitioned into SSC prototype	Strongly suggests “ground ops” as software + orchestration, enabling rapid use of antennas in many geographies (including Latin America) without a program-specific base. 

Public contracts and major contractors
CASINO and the SSC–commercial hybrid demonstration
SSC publicly stated it awarded a $2 million contract to PredaSAR (Terran Orbital) for an on-orbit cooperative demonstration involving PredaSAR and a “joint SSC, AFRL, and DARPA Blackjack satellite constellation.” In the same SSC release, the CASINO program office is described as coordinating the demonstration. 

SSC further states that the demonstration hinges on deploying government-developed optical inter-satellite links hosted on PredaSAR satellites to facilitate high-speed transfer, creating a government–commercial hybrid architecture that allows a government constellation to use data from commercial ISR satellites. 

Separately, Microsoft describes a DIU selection of Microsoft + Ball Aerospace to demonstrate agile cloud processing in support of CASINO, including a concept of transforming “what a ground station looks like” and piping data directly into cloud systems. 

Microsoft’s Azure blog later summarizes CASINO program office demonstrations and describes simulated OPIR data flows processed with cloud/edge components. 

DARPA Blackjack contractor roles, as publicly described
DARPA’s own Blackjack risk-reduction update explicitly lists key architectural and contractor decisions:

Bus providers were evaluated from multiple vendors; DARPA states it selected SEAKR as primary performer for “Pit Boss,” the on‑orbit autonomy system, and awarded a contract to Lockheed Martin as satellite integrator. 
DARPA also lists candidate payload areas (OPIR, RF, PNT, optical ISLs, EO/IR) and associated industry participants. 
A DARPA risk reduction note also references a “data fusion experiment” intended for an upcoming Loft Orbital mission, which is relevant because it anchors Loft Orbital to Blackjack-era experimentation in DARPA’s own text (without implying anything about geography). 

SDA PWSA / NDSA awards that shape the operational ground segment
SDA’s awards provide the clearest “official paper trail” for proliferated-LEO operationalization:

Tranche 0 Transport Layer: SDA publishes firm-fixed-price contract awards of $94,036,666 to York Space Systems and $187,542,461 to Lockheed Martin (with OISL interoperability paths). 
Tranche 1 Transport Layer: SDA states it awarded three prototype agreements worth ~ $1.8B to York Space Systems, Lockheed Martin Space, and Northrop Grumman to build portions of a 126‑vehicle mesh network, “ready for launch by September 2024.” 
Tranche 1 Tracking Layer: SDA states it awarded two prototype agreements “over $1.3B” for 28 satellites (L3Harris and Northrop Grumman), including approximate values ($700M and $617M, respectively) and notes that satellites will be flown out of SDA O&I centers at Grand Forks AFB and Redstone Arsenal (U.S.). 
Tranche 1 Operations & Integration (ground): SDA states General Dynamics Mission Systems received $324,516,613 (base + options) to establish the Tranche 1 ground O&I segment, including operation center sustainment. 
GAO reporting (January 2026) provides additional, high-value detail on ground: it describes scope/requirements issues in the Tranche 1 ground segment and reports that the Tranche 1 ground segment value grew, and that DoD modified the contract for additional work and later added major funding for Tranche 2 ground segment needs. 

Loft Orbital’s documented U.S. government touchpoints
Publicly documented Loft Orbital touchpoints relevant to the requested scope include:

SMC-era SBIR Phase II: Reporting indicates Loft Orbital received $750,000 in Phase II funding for a satellite “data processor” prototype under SMC (with matching private funds described in the same reporting). 
SSC STEP 2.0 awardee pool: SSC states STEP 2.0 is a 10‑year multi-award IDIQ with a $237M ceiling; third‑party reporting and SSC-linked coverage list “Loft Orbital Federal LLC” among awardees (the SSC release provides the program structure; the vendor list is also reported in defense press). 
SDA NExT experimental testbed: Ball’s release states a team including Ball Aerospace, “Loft Federal,” and Microsoft will deliver 10 experimental SDA payloads under NExT; reporting notes Microsoft will provide Azure Orbital Ground Station and Azure Government cloud components. 
Azure Orbital integration: Microsoft’s Azure Space blog explicitly describes Loft Orbital as an Azure Orbital Ground Station customer and describes testing/onboarding with KSAT + Microsoft ground stations. 
NASA task-order example (not SSC/DARPA/SDA, but requested under “government contracts”): Loft Orbital Federal announced a NASA Flight Opportunities task order for integration, launch, and on‑orbit ops supporting the RadPC project (official NASA TechPort also tracks RadPC). 
Contractor/role comparison table
Contractor	Publicly documented role(s) relevant to this request	Public contract/award evidence	Notes on uncertainty/classification
Kratos Technology & Training Solutions	SSC Ground Management & Integration (GMI) for Resilient MWT MEO launch/ops (ground segment services)	SSC states OTA valued $446.8M awarded Mar 17, 2026 for Epoch 1/2 launches & operations. 
Program details (system architecture specifics, site routing) likely partially classified; SSC release is high-level. 
Parsons Corporation	Blackjack mission operations / ground system services during transition from DARPA to SDA; connectivity to commercial ground stations cited	Public release mirrors describe $30M award/novation Dec 22, 2025 expanding a prior $11M 2021 Blackjack award and emphasizing mission ops + ground-station connectivity. 
Site-by-site ground provider usage is not enumerated publicly. 
SEAKR Engineering	“Pit Boss” autonomy system primary performer (DARPA-stated); additional contract reporting exists	DARPA states Pit Boss PDR completed and SEAKR selected as primary performer; also notes Lockheed as integrator. 
Specific hardware/software implementation details not fully public. 
Blue Canyon Technologies	Satellite bus candidate (DARPA‑stated); later milestones reported by manufacturer	DARPA states buses evaluated from Airbus, Blue Canyon, and Telesat. 
Downselect and satellite counts are described across multiple sources; some are non‑government. 
CACI International	Optical inter-satellite links via SA Photonics acquisition; Mandrake II OISL demos referenced as supporting Blackjack + SDA layers	CACI describes Mandrake II as joint risk-reduction with DARPA/SDA/AFRL and claims OISL demo milestone; notes SA Photonics acquisition. 
Optical terminal deployments and crypto/interop details can be sensitive; company statement is the public basis. 
York Space Systems	SDA Tranche 0 Transport and Tranche 1 Transport performer	SDA publishes $94,036,666 Tranche 0 Transport award; also lists York as one of three Tranche 1 Transport performers (~$1.8B total). 
Tranche 1 amounts are published as aggregate “~$1.8B” across 3 performers. 
Lockheed Martin Corporation	Blackjack integrator (DARPA-stated); SDA Tranche 0 Transport awardee; Tranche 1 Transport performer	DARPA states integrator award; SDA publishes $187,542,461 Tranche 0 Transport award; listed as Tranche 1 performer. 
As above, some interfaces/mission specifics undisclosed. 
L3Harris Technologies	SDA Tranche 1 Tracking Layer prime team	SDA states prototype agreement approx. $700M for Tranche 1 Tracking Layer. 
Payload sensitivity for missile warning/tracking is expected. 
Northrop Grumman	SDA Tranche 1 Transport performer; SDA Tranche 1 Tracking Layer prime team	SDA lists NG as Tranche 1 Transport performer and Tracking Layer awardee (~$617M). 
See above. 
Loft Orbital Solutions	Referenced in DARPA Blackjack risk‑reduction context (data fusion experiment); SBIR/Phase II work associated with SMC; STEP 2.0 awardee pool via Loft Federal; SDA NExT team member via Loft Federal	DARPA risk‑reduction update mentions Loft Orbital mission; SMC-related Phase II reporting; SSC STEP2.0 structure; SDA NExT team reporting and Azure Orbital integration. 
“Loft Federal” is distinct branding/entity for U.S. government work; site operations are customer‑dependent. 

Ground segment operations and Latin America infrastructure
Why Latin American “ground ops” can exist without dedicated SSC/DARPA sites
The operational pattern visible in public documents is “network orchestration” more than “foreign basing.” Two sources illustrate this trend:

GAO describes heavy demand on the Satellite Control Network and notes the Space Force has explored commercial antennas and those of other federal agencies to address capacity. 
SSC/NRL describe a secure, cloud-based marketplace and service transition (JAM + TREx) explicitly designed to connect satellite operations centers with antennas “worldwide.” 
This makes program-to-country linkage difficult via OSINT: a constellation can use a commercial antenna in Chile (or elsewhere) through a marketplace contract without the public record ever saying “this is a CASINO site.”

Latin America sites and providers explicitly documented in public sources
NASA selects KSAT Punta Arenas station for KA-band support - KSAT -  Kongsberg Satellite Services
SSC Space advances optical communications with new ground station ready in  Santiago, Chile
Costa Rica now home to world-class space radar
Costa Rica inaugura radar para resguardar satélites de basura espacial  peligrosa | La Nación

Ground station and SSA site comparison table
Provider / network	Latin America site (publicly documented)	Capability notes (public)	Primary public evidence
Kongsberg Satellite Services	Punta Arenas	NASA’s public ground systems chapter lists KSAT Punta Arenas supporting S/X band with 11.5 m assets. 
Amazon Web Services	Punta Arenas (AWS Ground Station antenna location)	AWS documentation lists “Punta Arenas 1” antenna location (Chile) mapped to South America (São Paulo) region. 
Swedish Space Corporation	Santiago	SSC’s station page provides site coordinates and operational context; NASA lists SSC Santiago supporting S band (9m/12m/13m). 
European mission usage (agency–operator relationship)	Santiago Station operated by SSC Chile	European Space Agency states the station is operated by SSC Chile and provides S-band tracking plus L- and X-band receive for ESA missions. 
ATLAS Space Operations	Longovilo, Chile (station announced by ATLAS)	ATLAS press release lists Longovilo, Chile as a new ground station site added to its network. 
LeoLabs	Filadelfia de Carrillo	LeoLabs press release PDF states its Costa Rica Space Radar is “fully operational” and describes a phased-array radar providing coverage relevant to LEO SSA; local reporting notes location in Guanacaste and describes small-object detection. 
Telespazio (Italy/Latin America)	Maricá Teleport; plus Argentina teleport operations moved to ARSAT Benavidez	Telespazio describes Maricá as an advanced teleport that can host LEO/GEO infrastructures and EO ground stations; also states it will transfer its satellite teleport to ARSAT’s Benavidez teleport/data center. 
RBC Signals	Not publicly enumerated (network is partner/aggregator model)	RBC describes a global network that aggregates capacity; public materials typically do not list a complete station roster. 

What is verifiable about Costa Rica in this ecosystem
Verifiable, public “ground” infrastructure in Costa Rica relevant to space operations is presently strongest for SSA, not TT&C:

LeoLabs’ Costa Rica Space Radar is publicly described as operational and positioned as a commercial SSA data source. 
This does not establish a direct SSC/DARPA/SDA program ground station in Costa Rica; it establishes a commercial sensor that (like other commercial SSA providers) could have customers spanning government and commercial sectors. 
Italian ground-segment actors: Telespazio and Leonardo
What Telespazio/Leonardo operate in Latin America (publicly documented)
Leonardo S.p.A. describes Telespazio as a key satellite-services provider operating “through an international network of control centres and teleports.” 

Telespazio’s own Latin America page explicitly states offices in multiple countries (including Costa Rica) and references “a network of space centers and satellite teleports in Brazil and Argentina.” 

Two concrete Latin American “ground” assets in their ecosystem are:

Maricá Teleport (Brazil): Telespazio describes this 150,000 m² site as capable of hosting multiple earth stations and LEO/GEO infrastructures, including oneWeb gateway hosting. 
Argentina Teleport relocation to ARSAT Benavidez: Telespazio states it will transfer a satellite teleport from Barracas to ARSAT’s teleport and data center in Benavidez (Buenos Aires province). 
Relevance to SSC/DARPA/SDA ground ops
From an OSINT standpoint, Telespazio/Leonardo matter because they are a teleport and ground-systems operator in Latin America with facilities that can host LEO gateways and provide secure hosting. 

However, in the specific scope of CASINO / Blackjack / SDA PWSA, this research did not identify any public contract award, lease, license, or MOU explicitly tying those U.S. programs’ mission operations to Telespazio’s Latin American teleports. The plausible reasons are mundane and common in space contracting:

Ground-station usage can be routed via marketplaces/aggregators (JAM, GSaaS providers) where the public record lists the U.S. integrator but not every downstream teleport. 
Mission-specific links, especially for missile tracking / national security payloads, may be classified or distribution-limited even when the program existence is unclassified. 
About “post‑WWII / post‑Nazi” framing
It is accurate that many aerospace/defense institutions in Europe and the United States have deep historical roots spanning the Cold War and earlier eras. That said, historical lineage alone is not evidence of a present-day operational link, and this report relies only on publicly documented contracts, agreements, and facility disclosures.

Verification of alleged local links and religious-organization inquiry
Research question and constraint
You asked for verifiable links—contracts, leases, licenses, MOUs—between SSC/SMC (or successor SSC), DARPA/SDA (Blackjack/CASINO), and local entities in Latin America, including Costa Rica, with attention to possible connections to Jehovah’s Witnesses or LDS organizations.

This section is intentionally conservative: it reports only what is corroborated by public documentation and explicitly avoids claims about individuals or religious organizations without records.

Public records and databases searched
This OSINT pass used the following public sources and searches (non-exhaustive, but targeted to your request):

U.S. government official releases (program and contracting): SSC newsroom; DARPA program pages; SDA awards pages; USSPACECOM agreement releases; GAO reports. 
GAO audits for ground segment and SCN capacity discussions. 
SAM.gov (limited OSINT visibility): located an NRL TREx-related listing; also performed open-web queries for religious-organization names without finding relevant SSC/DARPA/SDA leases or awards. 
USASpending.gov (open-web verification): spot-checked for contract presence (useful for positive confirmation; negative results are not conclusive). 
Company / operator disclosures (press releases / facility pages): AWS antenna location documentation; SSC Space ground station pages; LeoLabs PR; Telespazio/Leonardo PR. 
Result: no verifiable JW/LDS linkage found in public procurement/lease records
Across the sources above, this research found:

No publicly documented SSC/DARPA/SDA contract award, lease, license, or MOU that identifies a Jehovah’s Witnesses or LDS organization (or affiliated legal entity) as a ground-station provider, lessee/lessor, or program partner for CASINO/Blackjack/PWSA in Latin America or Costa Rica.
No such linkage is present in the primary SSC/DARPA/SDA program descriptions and awards pages cited throughout this report. 
Important constraint: Absence of evidence in public procurement indexing is not proof of non-existence. Some operational arrangements can route through prime contractors, resellers, or classified tasking; some local property/telecom licensing sources are not fully open or searchable without in-country registry access.

Timeline of key events and contracts
2019-03
U.S.–BrazilTechnologySafeguardsAgreement signed(entered into force2019-12)
2019-09
DIU selects Microsoft+ Ball for CASINOcloud processingdemos
2020-05
DARPA publishesBlackjackrisk-reduction plan;Pit Boss performer +integrator identified
2020-06
SDA highlightsoptical terminaltesting; Blackjackcited among keydemos
2020-08
SDA awards Tranche0 Transport contracts(York; Lockheed)
2021-04
LeoLabs announcesCosta Rica SpaceRadar operational
2021-12
SSC awards $2MPredaSAR hybridarchitecture demotied to DARPABlackjack (CASINOoffice coordinates)
2022-02
SDA awards ~ $1.8Bfor Tranche 1Transport Layer(York; Lockheed;Northrop)
2022-05
SDA awards $324.5MTranche 1 Operations& Integration(ground) contract toGeneral DynamicsMission Systems
2022-07
SDA awards > $1.3Bfor Tranche 1Tracking Layer(L3Harris; Northrop)
2023-04
USSPACECOM signsSSA agreement withPeru(CONIDA/Peruvian AirForce)
2024-04
USSPACECOM signsSSA agreement withUruguay; liaisonofficer arrangementwith Brazil
2025-05
SSC announces STEP2.0 $237M ceilingIDIQ pool (incl. LoftFederal amongawardees)
2025-11
SSC conducts JAMdemo transferringNRL TREx intooperationalprototype
2025-12
Parsonscontract/novationsupports transition ofBlackjack mission opsto SDA
2026-01
GAO reports majorintegration/ground-segmentcost growth risks forSDA missile-warningconstellation
2026-03
SSC awards $446.8MOTA to Kratos forMEO missilewarning/trackingground management& integration
Key public milestones relevant to CASINO / Blackjack / PWSA and Latin America ground ops


Show code
Timeline sources: SSC/PredaSAR CASINO demo release. 
 US–Brazil TSA treaty record. 
 Microsoft DIU/CASINO blog. 
 DARPA Blackjack risk-reduction update. 
 SDA Tranche 0/1/ground awards. 
 LeoLabs radar announcement and local reporting. 
 USSPACECOM SSA/liaison agreements. 
 SSC STEP 2.0. 
 SSC JAM/TREx transfer + NRL. 
 GAO missile warning satellites report. 
 SSC Kratos OTA. 