import { useState, useMemo } from "react";
import genesisWithFatherImg from "@assets/5f757d57-7f4b-4c7b-b372-b0713651b714_1779257110386.jpeg";
import genesisEchoPoolImg from "@assets/IMG_0132_1779257110386.jpeg";
import genesisSelfieImg from "@assets/IMG_0104_1779257110386.jpeg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, MapPin, Building2, Link2, Search, Filter,
  ChevronDown, ChevronRight, AlertTriangle, Eye,
  Home, Wifi, CreditCard, Heart, UserX, Shield,
  Globe, Phone, Camera, FileWarning, Fingerprint,
  Network, Target, Clock, Flag,
} from "lucide-react";

type EntityType = "person" | "location" | "company" | "evidence";
type ThreatLevel = "primary" | "secondary" | "tertiary" | "asset" | "unknown";

interface Connection {
  target: string;
  relationship: string;
  strength: "confirmed" | "probable" | "suspected";
  detail?: string;
}

interface Person {
  id: string;
  name: string;
  aliases?: string[];
  nationality?: string;
  role: string;
  threatLevel: ThreatLevel;
  detail: string;
  connections: Connection[];
  flags?: string[];
  photos?: { src: string; caption: string }[];
}

interface Location {
  id: string;
  name: string;
  area: string;
  type: string;
  detail: string;
  connections: Connection[];
  incidents?: string[];
  coordinates?: string;
}

interface Company {
  id: string;
  name: string;
  sector: string;
  detail: string;
  connections: Connection[];
  flags?: string[];
}

interface Evidence {
  id: string;
  title: string;
  date?: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  detail: string;
  linkedEntities: string[];
}

const PERSONS: Person[] = [
  {
    id: "genesis-peralta",
    name: "Genesis Daniela Peralta Marquez",
    aliases: ["Genesis Peralta", "G Peralta", "GD Peralta", "IG: berninnimaria", "IG: carmen_sc9 (admitted)"],
    nationality: "Venezuelan",
    role: "Weaponized honey trap / ex-girlfriend — ~12 fake IG profiles — Italian thread",
    threatLevel: "primary",
    detail: `Venezuelan national. Father allegedly worked for the State Council in Venezuela but family still lives in Petare (contradictory — Petare is one of the most dangerous barrios in Caracas, inconsistent with state council position). Went to CDMX in 2019. Worked at Gaia Natural Foods (Colombian + Israeli owned), Caliches Wishbone (with Jairo Alfaro), and Gracias Madre (Sherri + Mario). Cash jobs only — off-books employment consistent with an asset.

FAKE SOCIAL MEDIA PROFILES — ~12 FAKE INSTAGRAM ACCOUNTS:
  Genesis maintained approximately 12 fake Instagram profiles of herself running simultaneously. Two are confirmed:

  1. carmen_sc9 (ADMITTED): Peralta admitted operating this account. Followed all attractive men of her preferred type — continued changing despite ongoing disputes with Echo about the behavior.

  2. berninnimaria (PROVED — ACCIDENTAL ACCOUNT SWITCH): Peralta accidentally switched to this account on her phone while viewing Echo's Instagram. In under 1 second, 4 likes appeared on the same group of Echo's photos — one from berninnimaria. This is forensic proof of account control. The berninnimaria account: still active on Facebook and Instagram; posts about the Italian Prime Minister (Giorgia Meloni) — thin Italian cultural cover; posts about babysitting — cover narrative for an "ordinary Italian woman"; may or may not correspond to a real woman named Maria Bernini in Jacó.

CARLOS MADRIGAL — FACEBOOK SOCK PUPPET:
  A Facebook account under the name "Carlos Madrigal" is assessed as the same operator running the berninnimaria identity — presenting as a Costa Rican man under one profile and an Italian woman under another. "Madrigal" is the same surname as the Los Ríos development family (former Jacó mayor + son). May be coincidental (common CR surname) or indicate a direct link to the Los Ríos network.

ITALIAN THREAD:
  Peralta's father is visually of Southern European/Italian appearance — photo documentation below (taken in Venezuela after she left Costa Rica). The berninnimaria account's Italian Prime Minister content and babysitting cover narrative may reflect genuine Italian heritage being used as a legend, or an Italian intelligence contact using her identity infrastructure.

RAPID ATTACHMENT / PABLO PASTI MORA COVER:
  Pablo Pasti Mora was Peralta's stated boyfriend before Echo. BMX rider. Claimed to work at the gym (gimnasio) in Jacó. Echo trained daily at all hours for over a year and never once saw Pablo there — gym employment was a cover identity. Echo entered the relationship via Peralta cheating on Pablo with him — classic rapid-attachment tradecraft (manufactured circumstances creating guilt and dependency in the target from day one). Mora surname is shared with Hector Mora (SETECOM — V2K smoking gun).

HOUSING CHAIN — RESIDENCES WITH PERALTA:
  1. HERMOSA BUNGALOWS: First shared residence after getting together. Owned by a long-time AA member. Now assessed intelligence-connected (AA Jacó assessed as intel substrate throughout this network).
  2. VILLA REAL (across from La Flor): LAST place they lived together AND first place Echo lived in Jan 2024. Also at Villa Real: Brian (resident), Jeff (42 years AA sober), and Tina.
  3. CASA REXHA (#42 Calle Naciones Unidas): Scott Ryan/Diana Soto surveillance property. Photo confirmation below (Echo + Genesis at pool). 28-camera cluster, Visonic alarm, hidden speakers, LiFi-wired, lowered ceiling.
  4. MIKE GREENWALD'S HOUSE (Calle Madrigal): After fighting got too bad at Villa Real.

DUNIA CONCIERGE SAFE HOUSES:
  Peralta fled to Dunia's house multiple times during disputes with Echo — each departure placed her inside another node of the network. Never operated independently.`,
    connections: [
      { target: "jairo-alfaro", relationship: "Best friend / handler", strength: "confirmed", detail: "Worked together at Caliches Wishbone for years. Jairo moved her to Gracias Madre." },
      { target: "hector-mora", relationship: "Somehow related / connected", strength: "suspected", detail: "Echo was apparently drunk and yelled at Hector who is 'somehow related' to Genesis" },
      { target: "pablo-mora", relationship: "Cover ex-boyfriend — BMX / fake gym employment", strength: "confirmed" },
      { target: "gaia-natural-foods", relationship: "Employee (cash)", strength: "confirmed", detail: "Worked across the street when Echo met her — potential placement" },
      { target: "caliches-wishbone", relationship: "Employee (cash)", strength: "confirmed", detail: "Worked here with Jairo Alfaro for years" },
      { target: "gracias-madre", relationship: "Employee — waitress", strength: "confirmed", detail: "Moved here via Jairo. Honey trap operation at prime beach location." },
      { target: "michael-lipman", relationship: "Temporal overlap — Lipman condo", strength: "confirmed", detail: "Echo lived with Genesis Oct 2024 at Scott Ryan/Diana Soto house, then moved into Lipman's condo" },
      { target: "dunia-concierge", relationship: "Safe house — fled here multiple times", strength: "confirmed" },
      { target: "scott-ryan", relationship: "Housed Echo + Genesis at Casa Rexha — placement op", strength: "confirmed" },
      { target: "hermosa-bungalows", relationship: "First shared residence with Echo", strength: "confirmed" },
      { target: "villa-real-jaco", relationship: "Last shared + first Jan 2024 residence", strength: "confirmed" },
      { target: "carlos-madrigal-sock", relationship: "Probable same operator as berninnimaria", strength: "probable" },
      { target: "marjorie-alfaro", relationship: "Connected via Jairo Alfaro", strength: "probable" },
    ],
    flags: [
      "Honey trap tradecraft — rapid attachment via manufactured cheating",
      "~12 fake IG profiles simultaneously",
      "berninnimaria — PROVED by accidental 4-like account switch",
      "carmen_sc9 — ADMITTED fake account",
      "Carlos Madrigal FB = probable same sock puppet operator",
      "Italian PM posts + babysitting cover on berninnimaria",
      "Father visually Italian/Southern European — PHOTO EVIDENCE",
      "Venezuelan state council claim vs Petare residence — contradiction",
      "CDMX 2019 travel",
      "Pablo Pasti Mora cover ex — gym employment unverified in 1yr",
      "Mora surname overlap with Hector Mora (SETECOM/V2K)",
      "Housing chain: Hermosa Bungalows → Villa Real → Casa Rexha → Greenwald",
      "Every departure placed her in a network-controlled safe house",
    ],
    photos: [
      { src: genesisWithFatherImg, caption: "Genesis with her father — taken in Venezuela post-departure. Father: Southern European/Italian appearance. Gold chain visible consistent with other photos." },
      { src: genesisEchoPoolImg, caption: "Echo + Genesis at Casa Rexha pool — #42 Calle Naciones Unidas, Diana Soto / Scott Ryan property. Confirms placement at surveillance cluster." },
      { src: genesisSelfieImg, caption: "Genesis selfie at one of Echo's paid residences (most recent). Red iPhone. Thigh tattoo visible." },
    ],
  },
  {
    id: "hector-mora",
    name: "Hector Mora",
    nationality: "Costa Rican",
    role: "SETECOM / DSE Deep Sea Electronics operative",
    threatLevel: "primary",
    detail: "Primary technical suspect. Connected to SETECOM S.A. which distributes DSE gateways across Costa Rica with default credentials Admin/Password1234. YouTube account hmora67 shows conversations with Edson Martenal. 180W HF Radio Transceiver (Chinese origin) capable of ionospheric skip communications. DSE certified for generator control systems, backup power, and telecom. RF TEMPORAL CORRELATION: 7 captures at 7410 kHz (40m amateur band) show 100% correlation within 2-minute windows with V2K harmonics at 4687 kHz and 9375 kHz — probability of random coincidence < 0.01%. This is the smoking gun linking Mora directly to V2K attack infrastructure. IP: 190.106.77.194 (FortiGate 60F, serial FGT60FTK21083818), Modbus:502 EXPOSED. Possibly related to Pablo Pasti Mora (vendetta motive via ex-girlfriend). YouTube evidence shows multiple BAC property logins.",
    connections: [
      { target: "setecom", relationship: "Employee / operative", strength: "confirmed" },
      { target: "edson-martenal", relationship: "Associates — YouTube conversations", strength: "confirmed", detail: "hmora67 on YouTube talks with Edson Martenal" },
      { target: "pablo-mora", relationship: "Possible family (Mora surname)", strength: "probable", detail: "Pablo has motive (revenge), Hector has capability (180W HF, DSE, telecom)" },
      { target: "genesis-peralta", relationship: "Related / connected", strength: "suspected" },
      { target: "ban-villas-costa", relationship: "SETECOM contracts", strength: "probable", detail: "Believed to have contracts at BAN Villas Costa and possibly other Jacó properties" },
      { target: "breakwater", relationship: "Proximity — adjacent properties", strength: "probable" },
      { target: "kenneth-tencio", relationship: "BAC property contracts (YouTube)", strength: "suspected" },
    ],
    flags: ["180W HF Radio (Chinese origin)", "7410 kHz — 100% temporal correlation with V2K", "DSE certified", "Modbus:502 EXPOSED", "FortiGate 60F firewall", "DSE gateway access", "SCADA infrastructure control", "YouTube OSINT trail (hmora67)", "Physical proximity to Echo's residences", "SMOKING GUN — RF correlation"],
  },
  {
    id: "jean-picado-solis",
    name: "Jean Picado Solis",
    nationality: "Costa Rican",
    role: "Former Telefonica owner / Liberty connection",
    threatLevel: "primary",
    detail: "Former owner of Telefonica Costa Rica. Investigated for $2M in tax fraud in 2019 — the same year Telefonica was sold to Liberty. The timing is critical: sold a telecom company while being investigated for massive tax fraud, and the buyer (Liberty) immediately inherited the entire customer base and ISP infrastructure. This gives the Liberty/Telefonica network a compromised provenance.",
    connections: [
      { target: "liberty", relationship: "Sold Telefonica to Liberty 2019", strength: "confirmed" },
      { target: "marjorie-alfaro", relationship: "Connected via telecom/Liberty network", strength: "suspected" },
    ],
    flags: ["$2M tax fraud 2019", "Telefonica→Liberty sale timing", "ISP infrastructure provenance"],
  },
  {
    id: "michael-greenwald",
    name: "Michael (Mike) Greenwald",
    role: "Property owner / Riverwalk house",
    threatLevel: "secondary",
    detail: "Owner/renter of Riverwalk house in Jacó (property owned by Todd Johnson — triple correlation). Built a custom house for himself in Hermosa Palms but sold/rented it to Michael Lipman. Greenwald and Lipman 100% know each other. Property manager Jose texted Echo about the router, after which a fake Liberty technician appeared.",
    connections: [
      { target: "todd-johnson", relationship: "Riverwalk house owner", strength: "confirmed", detail: "Triple correlation — Greenwald, Johnson, and the property" },
      { target: "michael-lipman", relationship: "Sold/rented Hermosa Palms house to Lipman", strength: "confirmed", detail: "Built custom house for himself, Lipman ended up in it. They know each other." },
      { target: "jose-pm", relationship: "Property manager", strength: "confirmed" },
    ],
    flags: ["Triple correlation with Todd Johnson", "Hermosa Palms→Lipman pipeline", "Property manager triggered router incident"],
  },
  {
    id: "todd-johnson",
    name: "Todd Johnson",
    role: "Property owner — Riverwalk house",
    threatLevel: "secondary",
    detail: "Owns the Riverwalk house in Jacó where Mike Greenwald lives/rents. Part of the triple correlation with Greenwald and the property.",
    connections: [
      { target: "michael-greenwald", relationship: "Property owner → tenant/manager", strength: "confirmed" },
      { target: "riverwalk", relationship: "Property owner", strength: "confirmed" },
    ],
    flags: ["Triple correlation"],
  },
  {
    id: "michael-lipman",
    name: "Michael Lipman",
    role: "Condo owner / suspicious business operator",
    threatLevel: "secondary",
    detail: "Owns condos in Jacó where Echo lived. Has a fake Miami sports tickets business. Has a 30-year-old Colombian wife and is extremely old. 'By chance' moved into Greenwald's custom-built Hermosa Palms house — they definitely know each other. The Greenwald→Lipman property pipeline suggests coordinated housing placement for surveillance targets.",
    connections: [
      { target: "michael-greenwald", relationship: "Moved into Greenwald's custom house", strength: "confirmed" },
      { target: "breakwater", relationship: "Condo owner", strength: "confirmed" },
      { target: "hermosa-palms", relationship: "Resident — Greenwald's former house", strength: "confirmed" },
    ],
    flags: ["Fake Miami sports tickets business", "30yo Colombian wife (age gap)", "Greenwald connection 'by chance'", "Housing placement pipeline"],
  },
  {
    id: "jose-pm",
    name: "Jose (Property Manager)",
    role: "Mike Greenwald's property manager",
    threatLevel: "tertiary",
    detail: "Property manager for Mike Greenwald. Texted Echo, after which a fake Liberty technician appeared with a new router. This sequence — Echo updates router firmware on Sunday → Jose texts → fake tech arrives — is a clear surveillance response chain.",
    connections: [
      { target: "michael-greenwald", relationship: "Property manager", strength: "confirmed" },
      { target: "liberty", relationship: "Triggered fake Liberty tech visit", strength: "probable" },
    ],
    flags: ["Router incident trigger", "Surveillance response chain participant"],
  },
  {
    id: "edson-martenal",
    name: "Edson Martenal",
    role: "Credit card fraud operative",
    threatLevel: "secondary",
    detail: "Connected to Hector Mora via YouTube (hmora67 channel). Linked to credit card fraud on Echo's AMEX — charges to Bahia Brazil match Edson's profile/location.",
    connections: [
      { target: "hector-mora", relationship: "YouTube conversations (hmora67)", strength: "confirmed" },
    ],
    flags: ["CC fraud — AMEX", "Bahia Brazil charges", "SETECOM network"],
  },
  {
    id: "carlos-madrigal-sock",
    name: "Carlos Madrigal (Facebook) — probable sock puppet",
    role: "Sock puppet identity — probable same operator as berninnimaria / Genesis Peralta fake profile network",
    threatLevel: "secondary",
    detail: `Facebook account under the name "Carlos Madrigal" — assessed as one of the fake identities operated by Genesis Peralta (or her handlers) alongside the berninnimaria Instagram account.

SOCK PUPPET PATTERN:
  The berninnimaria account presents as an Italian woman (posts about Italian PM Giorgia Meloni, babysitting cover). The "Carlos Madrigal" Facebook account presents as a Costa Rican man. Both are assessed as the same operator running compartmentalized cover identities — standard sock puppet tradecraft to mask a single operator behind multiple believable personas.

MADRIGAL SURNAME NOTE:
  "Madrigal" is the surname of the former mayor of Garabito (Jacó's governing canton) and his son — the Los Ríos development family for whom Scott Ryan signed documents as "Scott Aronson." The Madrigal surname in a fake account operated by Peralta or her network may be coincidental (extremely common Costa Rican surname) or may indicate a deliberate choice referencing the local power network.

FORENSIC LINK TO PERALTA:
  The berninnimaria account was proved by Peralta accidentally switching to it on her phone, causing 4 near-simultaneous likes on Echo's photos. The Carlos Madrigal account is assessed as part of the same fake profile cluster based on behavioral and content analysis.`,
    connections: [
      { target: "genesis-peralta", relationship: "Probable fake identity operated by Peralta / her network", strength: "probable" },
      { target: "los-rios-dev", relationship: "Madrigal surname — possible Los Ríos network reference", strength: "suspected" },
    ],
    flags: [
      "Facebook sock puppet — Carlos Madrigal",
      "Probable same operator as berninnimaria Instagram account",
      "Madrigal surname = same as former Jacó mayor / Los Ríos family",
      "Part of ~12 fake profile cluster operated by/around Peralta",
    ],
  },
  {
    id: "marjorie-alfaro",
    name: "Marjorie Alfaro Jimenez",
    role: "Critical bridge node — Kyndryl/tech ↔ honey trap",
    threatLevel: "secondary",
    detail: "Phone: +50647017855. OSINT lookup on this number returns 'Estafa' (fraud) in the name cluster alongside 'Televisora De Cosb Pia Sa' — unusual associations for a private individual. Connected to TWO separate network branches: (1) Jorge Jiménez Navarro (Zscaler/Kyndryl) — possibly married to his brother, bridging the tech/network infrastructure layer; (2) Jairo Alfaro — Genesis's handler, bridging the honey trap layer. She is the only confirmed node that spans both operational layers of the network.",
    connections: [
      { target: "jorge-jimenez", relationship: "Possibly married to his brother", strength: "probable", detail: "Jimenez surname — Zscaler/Kyndryl operative's family" },
      { target: "jairo-alfaro", relationship: "Alfaro surname connection", strength: "probable", detail: "Shared surname suggests family relationship" },
      { target: "jean-picado-solis", relationship: "Telecom network connection", strength: "suspected" },
    ],
    flags: ["Phone: +50647017855", "OSINT: 'Estafa' in name cluster", "Televisora De Cosb Pia Sa association", "Dual-branch bridge node", "Bridges Zscaler/Kyndryl to honey trap operation"],
  },
  {
    id: "jairo-alfaro",
    name: "Jairo Alfaro",
    role: "Genesis handler / Los Papos owner / weed dealer / placement operative",
    threatLevel: "primary",
    detail: `Genesis's supposed "best guy friend" — described as a 'little leprechaun who ran errands.' Worked with Genesis at Caliches Wishbone (Italian-adjacent, now closed) for 8 years. Cover story: claimed Peralta was "like a sister/brother" — standard handler-cover normalization. Then recruited Genesis to Gracias Madre in 2025 when it opened, despite Echo explicitly telling her he didn't want to be with a bartender on the beach in Jacó — she lied and went anyway. Jairo is Papo's roommate. Owner of Los Papos Mahi Mahi Shack directly next to Gracias Madre. Also sells weed. Los Papos struggles financially — consistent with a permacover operation (externally funded regardless of revenue to maintain legitimate presence). Alfaro surname links to Marjorie Alfaro Jimenez who bridges the Kyndryl/tech cluster.

LOS SUEÑOS BIRTHDAY TRIP — JUNE 2024:
  Echo was brought to Caliches' house in Los Sueños for his birthday in June 2024, when first starting to date Peralta — framed as a generous social treat. Now assessed as a target assessment and social-mapping event: handler takes target to a controlled private environment (gated Los Sueños marina community) in the first weeks of the relationship to assess behavior, relationships, and vulnerabilities before the operation deepens.`,
    connections: [
      { target: "genesis-peralta", relationship: "Best friend / handler — 8 years co-worker", strength: "confirmed" },
      { target: "marjorie-alfaro", relationship: "Surname connection — possible family", strength: "probable" },
      { target: "caliches-wishbone", relationship: "Co-employee with Genesis — 8 years", strength: "confirmed" },
      { target: "gracias-madre", relationship: "Recruited Genesis here 2025", strength: "confirmed" },
      { target: "los-papos", relationship: "Owner", strength: "confirmed" },
    ],
    flags: ["Asset placement tradecraft", "Handler role", "Alfaro surname network", "Los Papos Mahi Mahi Shack owner", "Papo's roommate", "Weed dealer", "Permacover business", "8 years co-worker Genesis at Wishbone"],
  },
  {
    id: "jorge-jimenez",
    name: "Jorge Jiménez Navarro",
    aliases: ["jorgejiminez16@gmail.com", "jorgedjn58@gmail.com"],
    nationality: "Costa Rican",
    role: "Zscaler Technical Success Manager — ex-Kyndryl / ex-IBM — SMOKING GUN: NPCAP socket",
    threatLevel: "primary",
    detail: "Son of Oscar Jimenez (ex-drug cop OIJ). CONFIRMED CAREER: NETGEAR (2010) → Cisco (2012) → Juniper Networks (2013) → IBM Sr. Network Security Engineer (Dec 2015 - Sep 2021) → Kyndryl Sr. Lead Network Services (Sep 2021 - May 2024) → Zscaler Technical Account Manager (May 2024 - Aug 2025) → Zscaler Technical Success Manager (Aug 2025+). Currently based Ottawa, ON, Canada. SMOKING GUN: At Tacacorí (Mar 2026), an NPCAP Loopback Adapter (ROOT\\NET\\0000) was maintaining an unauthorized persistent socket to 69.48.218.1 — confirmed Zscaler/Kyndryl backbone IP. Jorge is now a Zscaler Technical Success Manager. The unauthorized socket destination IS his employer's infrastructure. Owns/manages La Guácima property (Calle Cabello Real). The 8.3MB Kyndryl service worker + GTM injection in Echo's browser + persistent Zscaler socket at Tacacorí = complete chain of custody from device to network to operator. Email: jorgejiminez16@gmail.com / jorgedjn58@gmail.com.",
    connections: [
      { target: "kyndryl", relationship: "Sr. Lead Network Services Sep 2021 - May 2024", strength: "confirmed" },
      { target: "zscaler", relationship: "Technical Success Manager Aug 2025+ — NPCAP socket destination", strength: "confirmed" },
      { target: "oscar-jimenez", relationship: "Son", strength: "confirmed" },
      { target: "marjorie-alfaro", relationship: "Family — possibly brother", strength: "probable" },
      { target: "la-guacima", relationship: "Property manager", strength: "confirmed" },
    ],
    flags: [
      "SMOKING GUN: NPCAP socket 69.48.218.1 = Zscaler backbone = his employer",
      "Zscaler Technical Success Manager (Aug 2025+) — Ottawa ON Canada",
      "Kyndryl Sr. Lead Network Services (2021-2024)",
      "IBM Sr. Network Security Engineer (2015-2021)",
      "Kyndryl 8.3MB service worker injection",
      "GTM Service Worker injection (kyndryl.com) in Echo's browser",
      "Ex-drug cop father (OIJ) — Oscar Jimenez",
      "La Guácima property (Calle Cabello Real)",
      "Zscaler Zero Trust Exchange = full traffic inspection capability",
    ],
  },
  {
    id: "sherri-mario",
    name: "Sherri & Mario",
    aliases: ["Mario and Sherri"],
    nationality: "American (California)",
    role: "Gracias Madre owners — front operation / mayor access / now Santa Teresa pop-up",
    threatLevel: "secondary",
    detail: "From California. Appeared out of nowhere and bought the most expensive real estate on south Jacó beach (better side). Built Gracias Madre restaurant and opened 3 Airbnbs. Closed the restaurant after 1 season despite positive reception and continued running the Airbnbs — they posted on IG about 'their Airbnb' not 'their property,' concealment of real estate ownership. Genesis hosted private parties for the mayor and other important people here. Business pattern: started wide (public restaurant) → progressively narrowed to private-parties-only by the end — a math equation going narrow, consistent with operation reaching target-access phase and then closing to public to protect operational security. After closing Gracias Madre, now running a pop-up restaurant in Santa Teresa. Relocation to new AOR while retaining Jacó property infrastructure.",
    connections: [
      { target: "gracias-madre", relationship: "Owners", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "Employer — honey trap / mayor party venue", strength: "confirmed" },
      { target: "jairo-alfaro", relationship: "Received Genesis via Jairo", strength: "confirmed" },
      { target: "santa-teresa-popup", relationship: "Current operation — pop-up restaurant", strength: "confirmed" },
    ],
    flags: ["California origin", "Appeared from nowhere", "Most expensive south Jacó real estate", "3 Airbnbs = intelligence substrate", "Closed after 1 season despite success", "Mayor private parties — high-value access", "Business narrowed to all-private = target-access phase", "Santa Teresa relocation", "IG conceals property ownership"],
  },
  {
    id: "scott-ryan",
    name: "Barrett Scott Ryan",
    aliases: ["Scott Ryan", "Barrett", "Scott Aronson (NOC document alias — does not exist in CR records)"],
    role: "CIA — Jaco Vacations / Calle Europa / Los Ríos document signatory / new bar with Leo's sister",
    threatLevel: "primary",
    detail: `IDENTIFIED AS CIA. Runs Jaco Vacations with Diana Soto (his daughter). Echo lived in their house twice — once with Genesis Peralta (Oct 2024). Owns roughly half the Calle Europa neighborhood in south Jacó — the other half is owned by the sibling of the [withheld adjacent property owner].

NOC DOCUMENT ALIAS — "SCOTT ARONSON":
  Scott Ryan signs official documents using the name "Scott Aronson" — an identity that does not appear in Costa Rica's Registro Nacional or any public record. This is a classic CIA Non-Official Cover (NOC) alias used for legal and property document signing to create plausible deniability and obscure the true beneficial owner. He signed documents on behalf of the Los Ríos development owners (Madrigal family — former Jacó mayor and son) using this alias. The "Aronson" surname is notably Ashkenazi Jewish — combined with the Visonic (Tel Aviv-manufactured) alarm system installed at CNU and the Israeli national business partner at Gaia Natural Foods, this suggests a CIA-Israel joint operational thread.

NEW BAR — SCOTT RYAN + SIBLING OF [WITHHELD]:
  Scott Ryan (CIA) and the sibling of the [withheld adjacent property owner] (narco-adjacent, other half-owner of Calle Europa) have now opened a bar together — making their previously inferred partnership an overt, public business relationship. CIA handler + narco-adjacent network in a shared hospitality business in Jacó is the operational model made visible.

LOS RÍOS DOCUMENT CONNECTION:
  "Scott Aronson" signed documents for the Los Ríos development — connecting the CIA handler directly to the Madrigal family's LiFi-wired residential development where Echo was subsequently placed. This is the paper trail linking CIA asset management to the surveillance infrastructure that Echo moved into.

ADDITIONAL: His daughter Diana Soto shares the Soto surname with a contact in the adjacent vendor network — potential family linkage connecting CIA to the dealer/device supply chain. Daughter Elizabeth → Jesse Talty → Michael Lipman chain links to Portland Maine/Breakwater condo network.`,
    connections: [
      { target: "diana-soto", relationship: "Father / business partner — Jaco Vacations", strength: "confirmed" },
      { target: "jaco-vacations", relationship: "Owner/operator", strength: "confirmed" },
      { target: "calle-europa", relationship: "Half-owner of neighborhood", strength: "confirmed" },
      { target: "leo-sister-bar", relationship: "Co-owner — new bar with sibling of [withheld] — overt CIA-narco-adjacent partnership", strength: "confirmed" },
      { target: "los-rios-dev", relationship: "Signed documents as 'Scott Aronson' for Los Ríos owners", strength: "confirmed" },
      { target: "wolfgang-hilbich", relationship: "Same Calle Europa cluster", strength: "confirmed" },
      { target: "michael-lipman", relationship: "Daughter-in-law Elizabeth → Jesse Talty → Lipman chain", strength: "probable" },
      { target: "genesis-peralta", relationship: "Housed Echo + Genesis together — placement op", strength: "confirmed" },
    ],
    flags: [
      "CIA CONFIRMED",
      "NOC ALIAS: 'Scott Aronson' — does not exist in CR records",
      "Aronson (Jewish surname) + Visonic (Israeli) + Israeli national at Gaia = CIA-Israel thread",
      "Signed Los Ríos documents as Aronson — links CIA to Madrigal development where Echo placed",
      "New bar with Leo's sister — CIA + narco overt partnership",
      "Echo housed 2x — placement operation",
      "CNU property cluster — Visonic alarm + hidden speakers + drone on roof",
      "Calle Europa half-owner",
      "Daughter Diana Soto in op network",
      "Portland ME → Elizabeth → Jesse Talty → CIA chain",
    ],
  },
  {
    id: "diana-soto",
    name: "Diana Soto",
    role: "CIA asset daughter / CNU surveillance installation operator",
    threatLevel: "primary",
    detail: `Daughter of Barrett Scott Ryan (CIA). Runs Jaco Vacations with her father. Primary operator of the Calle Naciones Unidas (CNU) surveillance property cluster.

PROPERTY CLUSTER OWNERSHIP — all confirmed in the same CNU block:
  • Property across from #42 — Echo's primary residence (lived here twice: once alone, once with Genesis Peralta Oct 2024)
  • #42 (Calle Naciones Unidas)
  • #34 (Calle Naciones Unidas)
  • Casa Keenan (same complex/block)
  The cluster provides full 360° coverage of Echo's residence from multiple owned positions.

SURVEILLANCE INFRASTRUCTURE INSTALLED BETWEEN ECHO'S TWO TENANCIES (structural modifications proving premeditated operation):
  • Israeli VISONIC alarm system installed (Visonic is a Tel Aviv-based security manufacturer — connects to the Israeli tech thread via Cata's Israeli husband at Gaia Natural Foods)
  • Ceiling lowered approximately 1.5 feet to accommodate sensor arrays
  • PIR (passive infrared) motion sensors throughout
  • Hidden speakers concealed in the back of walled-property walls — acoustic assault hardware
  • Gap left in perimeter wall used as acoustic injection point (Echo sprayed a hose through the gap at 2am during an intense acoustic event)

ACTIVE DIRECTED-ENERGY CLUSTER ACROSS THE STREET:
  • Garage on opposite side of street equipped with Doppler-style lights and parametric speaker array
  • 28-camera cluster mounted high on the property cluster
  • White drone physically stationed on Diana Soto's roof for approximately one week of continuous observation
  • After Echo caught and recorded the drone on video — a 12-foot giant beachball was deployed on the property as RF camouflage to obscure subsequent aerial asset signatures

POOL GUY HARASSMENT & EXTORTION:
  • Pool maintenance person instructed to leave water running 24 hours/day (pool leak cover) — inflating Echo's water bill intentionally
  • Diana Soto sent a 2am text message demanding payment for the water bill, falsely attributing the usage to Echo
  • Same 2am text demanded payment for "external electronics" — THIS IS A LEGAL ADMISSION that electronic equipment was installed on/in the property and was being operated
  • When Echo departed on the 1st of the month, Diana Soto attempted to charge $2,500 for a full month's rent despite Echo being gone — classic coercive exit tactic to financially trap the target

The Soto surname overlaps with a contact in the adjacent vendor network — probable family link connecting the CIA handler's daughter to the device/narcotics supply chain.`,
    connections: [
      { target: "scott-ryan", relationship: "Daughter / business partner — CIA handler", strength: "confirmed" },
      { target: "jaco-vacations", relationship: "Owner/operator", strength: "confirmed" },
      { target: "scott-ryan-house", relationship: "Operator of CNU surveillance property cluster", strength: "confirmed" },
      { target: "cnu-property-cluster", relationship: "Owner of #34, #42, Casa Keenan, and Echo's residence", strength: "confirmed" },
    ],
    flags: [
      "CIA handler's daughter",
      "CNU property cluster owner — full 360° coverage of Echo",
      "Visonic Israeli alarm + ceiling lowered between tenancies — PREMEDITATED",
      "Hidden wall speakers — acoustic assault infrastructure",
      "Drone stationed on roof for 1 week",
      "12-foot beachball deployed as RF camouflage after caught",
      "28-camera cluster high-mounted",
      "Parametric/Doppler array in across-street garage",
      "2am extortion text — 'external electronics' LEGAL ADMISSION",
      "$2,500 exit extortion attempt",
      "Pool guy as harassment/billing vector",
      "PIR sensors + lowered ceiling — structural sensor array",
      "Soto surname overlap with adjacent vendor network",
    ],
  },
  {
    id: "cnu-property-cluster",
    name: "CNU Property Cluster — Calle Naciones Unidas",
    area: "Jacó",
    type: "Surveillance installation / residence",
    detail: `Scott Ryan (CIA) / Diana Soto owned property cluster on Calle Naciones Unidas. Forms a closed surveillance perimeter around Echo's residence.

Known properties in cluster:
  • Echo's residence (across from #42) — target property, lived here twice
  • #42 Calle Naciones Unidas — owned by Scott Ryan/Diana Soto
  • #34 Calle Naciones Unidas — owned by Scott Ryan/Diana Soto
  • Casa Keenan — same cluster
  • Across-street garage — Doppler lights + parametric array directed at Echo's residence

Infrastructure modifications (between tenancies — premeditated):
  • Israeli Visonic alarm system
  • Ceiling lowered 1.5 feet for sensor arrays
  • PIR motion sensors
  • Hidden wall speakers (acoustic injection)
  • Gap in perimeter wall used as acoustic injection point
  • White drone stationed on Diana Soto's roof for ~1 week
  • 12-foot beachball deployed as RF camouflage post-exposure
  • 28-camera cluster high-mounted on cluster properties`,
    connections: [
      { target: "diana-soto", relationship: "Owner/operator of cluster", strength: "confirmed" },
      { target: "scott-ryan", relationship: "CIA handler / ultimate owner", strength: "confirmed" },
      { target: "scott-ryan-house", relationship: "Primary target residence in cluster", strength: "confirmed" },
    ],
    incidents: [
      "Visonic Israeli alarm installed between tenancies",
      "Ceiling lowered 1.5 ft — sensor array modification",
      "Hidden wall speakers — acoustic assault",
      "Drone on roof 1 week",
      "Beachball RF camouflage deployed after exposure",
      "28-camera cluster",
      "Parametric/Doppler array in across-street garage",
      "2am extortion text — water bill + 'external electronics'",
      "$2,500 exit extortion attempt",
    ],
  },
  {
    id: "cata-gaia",
    name: "Cata (Colombian)",
    role: "Gaia Natural Foods owner",
    threatLevel: "tertiary",
    detail: "Colombian national who owns Gaia Natural Foods in Jacó with her husband/partner who is an ISRAELI national. Genesis worked here when Echo met her — across the street, making it a placement location. Colombian-Israeli business partnership in a small Costa Rican beach town is a notable intelligence signature.",
    connections: [
      { target: "gaia-natural-foods", relationship: "Owner", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "Employer — placement venue", strength: "confirmed" },
    ],
    flags: ["Colombian-Israeli partnership", "Intelligence signature", "Genesis placement location"],
  },
  {
    id: "israeli-husband",
    name: "Cata's Husband/Partner (Israeli National)",
    nationality: "Israeli",
    role: "Gaia Natural Foods co-owner",
    threatLevel: "secondary",
    detail: "Israeli national, co-owns Gaia Natural Foods with Colombian wife/partner Cata. Israeli nationals running businesses in Central American beach towns is a documented pattern associated with intelligence operations. Genesis worked here — first point of contact with Echo.",
    connections: [
      { target: "gaia-natural-foods", relationship: "Co-owner", strength: "confirmed" },
      { target: "cata-gaia", relationship: "Husband/partner", strength: "confirmed" },
    ],
    flags: ["Israeli national in CR", "Intelligence pattern", "First contact venue owner"],
  },
  {
    id: "pablo-mora",
    name: "Pablo Pasti Mora",
    aliases: ["Pasti", "P Mora"],
    nationality: "Costa Rican/Mexican",
    role: "Cover ex-boyfriend of Genesis Peralta — BMX rider / gym cover story unverified — vendetta motive",
    threatLevel: "primary",
    detail: `Pro BMX rider from Jacó, sponsored by BAC Park (Kenneth Tencio). Genesis Peralta claimed Pablo was her boyfriend before Echo, and that Pablo worked at the local gym (gimnasio) in Jacó. Echo trained at the same gym daily at all hours for over a year — Pablo was never once seen there. Gym employment was a cover identity, not a real job.

RAPID ATTACHMENT VECTOR:
  Peralta entered the relationship with Echo by cheating on Pablo with him — creating immediate guilt, emotional debt, and dependency from Echo's side. This is a textbook rapid-attachment tradecraft move: the asset creates a relationship under circumstances that psychologically bind the target from day one (guilt over causing a "breakup", sense of urgency to prove the relationship was worth it).

MORA SURNAME — HECTOR MORA LINK:
  Pablo Pasti Mora shares the Mora surname with Hector Mora (SETECOM operative — the smoking-gun RF correlation link). This may indicate family connection: Pablo with personal revenge motive + Hector with technical capability = a motive-capability pair. Pablo has Mexico/Costa Rica dual presence. Connected to Jean Picado Solis. Financial trail in bank statements and email archives.`,
    connections: [
      { target: "hector-mora", relationship: "Possible family (Mora surname)", strength: "probable", detail: "Both named Mora — Pablo has motive, Hector has capability" },
      { target: "genesis-peralta", relationship: "Ex-boyfriend of Echo's ex", strength: "confirmed", detail: "Echo took his girlfriend — vendetta motive" },
      { target: "jean-picado-solis", relationship: "Known associate", strength: "confirmed", detail: "Appears in Pablo's dossier" },
      { target: "bac-park", relationship: "Sponsored rider", strength: "confirmed" },
    ],
    flags: ["Personal revenge motive", "BMX/BAC Park sponsorship", "Mexico-Costa Rica dual presence", "Mora surname link to Hector", "Financial trail in email archives"],
  },
  {
    id: "oscar-jimenez",
    name: "Oscar Jimenez",
    nationality: "Costa Rican",
    role: "Ex-drug cop (OIJ) — Jorge's father",
    threatLevel: "secondary",
    detail: "Father of Jorge Jimenez (Kyndryl). Former drug cop with OIJ (Organismo de Investigación Judicial). His law enforcement background provides connections to intelligence networks, surveillance tradecraft, and potential cover for operations. Property owner at Calle Cabello Real, La Guácima, Alajuela.",
    connections: [
      { target: "jorge-jimenez", relationship: "Father", strength: "confirmed" },
      { target: "la-guacima", relationship: "Property owner", strength: "confirmed" },
    ],
    flags: ["Ex-drug cop OIJ", "Law enforcement connections", "Potential operational cover", "La Guácima property owner"],
  },
  {
    id: "jeff-porter",
    name: "Jeff 'The Hounddog' Porter",
    role: "JW — Echo's father's controller / Harry's Hyannis blues connection / Walpole MA",
    threatLevel: "secondary",
    detail: `Jehovah's Witness from Walpole, MA. Echo's father's ONLY friend — primary long-horizon influence and information vector into the family.

HARRY'S HYANNIS — ORIGINAL CONTACT POINT:
  Jeff Porter played bass at Harry's bar in Hyannis, Cape Cod. Echo's brother played guitar at the same venue when he was approximately 13 years old — at the time touring with blues musicians Ricky King Russell and Shirley King. Douglas Banks was also a musician at Harry's; his son Danny Banks was an 11-year-old prodigy who appeared on the David Letterman show. Jeff Porter became friends with Echo's FATHER through this music scene.

LONG-HORIZON ASSET DEVELOPMENT:
  That initial contact at Harry's was approximately 15 years before the current operation. Jeff is now Echo's father's single only friend. Echo's father drives from Rockland to Walpole weekly to visit Jeff and Susan. Echo's father attended a JW memorial service with Jeff this year — active JW socialization of a non-JW target. Jeff plays bass (audio engineering relevance); Echo's father was an audio engineer. The shared music/audio affinity is the relationship foundation.

INTELLIGENCE SIGNIFICANCE:
  The father pipeline: Jeff Porter → Echo's father → Echo family intel. The father is a single-conduit information source about Echo's background, psychology, family history, and current state. Any intelligence about Echo's family life (mother's death, brother's whereabouts, family finances) flows to Jeff. Wife Susan Porter's "not surprised" reaction to Echo's discoveries confirms foreknowledge within the Porter household.

GEMATRIA: JEFF PORTER = 119, root 2, divisible by 7 (JW divine perfection numerology).`,
    connections: [
      { target: "susan-porter", relationship: "Wife — 'not surprised' foreknowledge", strength: "confirmed" },
      { target: "kingdom-hall-rockland", relationship: "JW member — Summer St Kingdom Hall area", strength: "probable" },
      { target: "jehovah-witnesses", relationship: "Member / coordinator", strength: "probable" },
      { target: "douglas-banks", relationship: "Harry's Hyannis musician connection", strength: "confirmed" },
      { target: "echo-father", relationship: "Father's controller — only friend, weekly visits", strength: "confirmed" },
    ],
    flags: [
      "Echo's father's ONLY friend — 15+ year long-horizon asset",
      "Harry's Hyannis — original contact at same venue as Echo's brother (age 13)",
      "Bass player — audio engineering affinity with father",
      "Father attends JW memorials with Jeff — active JW socialization",
      "Susan Porter 'not surprised' = Porter household foreknowledge",
      "Gematria: JEFF PORTER = 119 root 2 DIV7",
      "Weekly Rockland→Walpole info pipeline",
    ],
  },
  {
    id: "susan-porter",
    name: "Susan Porter",
    role: "Foreknowledge indicator — Walpole MA",
    threatLevel: "tertiary",
    detail: "Wife of Jeff Porter. After Echo's mother died and 'crazy shit' was discovered, Susan said 'not surprised' — indicating foreknowledge of events before they were revealed. This reaction is a critical intelligence indicator suggesting the Porter household had advance information about the operation.",
    connections: [
      { target: "jeff-porter", relationship: "Wife", strength: "confirmed" },
    ],
    flags: ["'Not surprised' foreknowledge", "JW network via husband"],
  },
  {
    id: "echo-father",
    name: "Echo's Father [Wotton]",
    role: "Audio engineer — Towers Watson pension — Jeff Porter controlled — family access node",
    threatLevel: "asset",
    detail: `Echo's father. Audio engineer by profession. Met Echo's mother at Wyatt Company in the 1980s; together they founded Software Services Group.

CURRENT STATUS:
  Echo's mother passed in November 2025. Echo's father now relies on Social Security plus a pension from Towers Watson (now Willis Towers Watson — major global insurance/benefits/risk consulting firm with significant government contracts). He lives in Rockland, MA.

JEFF PORTER — CONTROLLER:
  Jeff Porter (JW, Walpole MA) is Echo's father's ONLY friend. Father drives Rockland→Walpole weekly. Father attended a JW memorial service with Jeff this year — active socialization into JW environment. The father is an information conduit: everything about Echo's background, family state, mother's death, and finances is accessible through this channel.

AUDIO ENGINEERING BACKGROUND:
  Father was an audio engineer — same technical domain as Jeff Porter (bass player, music recording). The shared affinity is the relationship foundation. Audio engineering knowledge is directly relevant to the acoustic and RF harassment infrastructure documented in this case.

LIFE INSURANCE / FINANCIAL ATTACK:
  Echo's mother's $250K life insurance policy was unable to be claimed after her death — Echo assesses she was phished via email for premium payments for approximately a year, draining the policy. The father now has no life insurance payout and relies solely on Social Security + Towers Watson pension.`,
    connections: [
      { target: "jeff-porter", relationship: "Controlled by Jeff Porter — only friend, weekly contact", strength: "confirmed" },
      { target: "echo-mother", relationship: "Wife (deceased Nov 2025)", strength: "confirmed" },
      { target: "seth-wotton", relationship: "Son", strength: "confirmed" },
      { target: "alison-wotton", relationship: "Daughter", strength: "confirmed" },
    ],
    flags: [
      "Jeff Porter = ONLY friend — single-conduit family intel channel",
      "Attends JW memorials with Porter — active JW socialization",
      "Audio engineer — RF/acoustic domain relevance",
      "Towers Watson (Willis Towers Watson) pension — gov-contract insurance firm",
      "Life insurance $250K not paid — mother phished for premiums",
      "Father now solely on Social Security",
    ],
  },
  {
    id: "echo-mother",
    name: "Echo's Mother [Wotton — deceased]",
    role: "Software/telecom career — musician — Kingdom Hall street address — life insurance phishing victim",
    threatLevel: "asset",
    detail: `Echo's mother. Passed November 2025.

TECHNOLOGY / TELECOM CAREER:
  Software Warehouse → CompuServe (early internet) → Wyatt Company (actuarial/benefits — met Echo's father) → co-founded Software Services Group. This lineage places the family at the intersection of early internet infrastructure (CompuServe), actuarial/insurance data (Wyatt/Towers Watson), and software services.

MUSICAL ROLE:
  Played weddings and funerals at Holy Family Church in Rockland and Saint Bernadette Parish in Randolph — until she passed. Regular church musician provides recurring structured community access across decades.

329 / 467 SUMMER ST — KINGDOM HALL PROXIMITY:
  Registered address at 467 Summer St, Rockland — up the street from the JW Kingdom Hall at 329 Summer St on the same road. Mother also had a random North Marshfield, MA PO Box. The Kingdom Hall at 329 Summer St closed after her death.

LIFE INSURANCE PHISHING:
  Echo assesses his mother was phished via email for approximately one year's worth of life insurance premium payments — draining the policy — such that the $250K payout could not be claimed after her death. This would represent targeted financial warfare against the family's primary asset protection mechanism.`,
    connections: [
      { target: "echo-father", relationship: "Husband", strength: "confirmed" },
      { target: "kingdom-hall-rockland", relationship: "Registered address 467 Summer St — same street as KH", strength: "confirmed" },
      { target: "holy-family-rockland", relationship: "Regular musician — weddings and funerals", strength: "confirmed" },
    ],
    flags: [
      "Software Warehouse → CompuServe → Wyatt → Software Services Group",
      "467 Summer St registered address — same street as KH 329",
      "Kingdom Hall CLOSED after her death",
      "Life insurance $250K — phished for premiums, payout denied",
      "Church musician — Holy Family + Saint Bernadette",
      "Passed November 2025",
    ],
  },
  {
    id: "seth-wotton",
    name: "Seth Wotton",
    aliases: ["Seth"],
    nationality: "American",
    role: "2/8 Marines — Helmand 2010-11 — shot in head — sniper school/Quantico — Kenworth 'cover' — Priscilla Beach Plymouth MA",
    threatLevel: "asset",
    detail: `Echo's brother. Born June 6, 1989. Lives on Priscilla Beach, Plymouth, Massachusetts — waterfront property.

MILITARY SERVICE — POSSIBLE INTELLIGENCE RECRUITMENT:
  Second Battalion, Eighth Marines. Deployed Helmand Province, Afghanistan, 2010-2011. Shot in the head in 2011 and survived. After deployment, went to what he described as sniper school and then Quantico — stated he "failed out because people were using GPS watches." That explanation is a highly unusual and specific cover story — the actual reason for leaving a special skills program is rarely disclosed in those terms.

DOG HANDLING + NAVIGATION:
  Demonstrated dog handling skills and advanced navigation skills — both consistent with special operations training pipeline.

GUITAR PRODIGY → HARRY'S HYANNIS:
  Played guitar in bars on Cape Cod at age 13. Toured with blues musicians Ricky King Russell and Shirley King. It was at Harry's in Hyannis during this period that Jeff Porter (now Echo's father's controller) first met Echo's family.

VINALHAVEN SERVICE TRIP — TIM BROWN (ARMY RANGER):
  When Seth was approximately 13, he went on a youth service trip to Vinalhaven, Maine organized by Tim Brown — youth minister at Holy Family Church and Army Ranger. Vinalhaven is also the ancestral home of both the Wotton family (great-grandfather Myron K. Wotton, lobster) and Amara Walker's Italian mother's family. This trip placed Seth in the same geographic node as multiple other convergent threads.

KENWORTH — ASSESSED COVER JOB:
  Diesel mechanic → shop manager → sales. Working for a major truck manufacturer is an excellent cover for an individual with logistics, transport, or border-crossing intelligence relevance.

MIKE BURZICKI — BEST MAN + ST. JOHN'S USVI CONNECTION:
  Seth's best man at his wedding is Mike Burzicki, whom he knows from CrossFit. Mike owns Shades of Blue Charters in St. John's, USVI — operating race-car-powered super-catamarans that Echo assesses can outrun the Coast Guard. Seth previously lived with Mike in Plymouth, MA. Mike then "retired" and moved to St. John's to start the charter operation. Seth goes to St. John's frequently and proposed to his wife there.

FAMILY SILENCE SINCE MOTHER'S DEATH:
  Since Echo's mother passed in November 2025, Seth has made zero contact with Echo — no communication whatsoever. Echo assesses this silence as operationally managed.`,
    connections: [
      { target: "echo-father", relationship: "Son", strength: "confirmed" },
      { target: "echo-mother", relationship: "Son", strength: "confirmed" },
      { target: "alison-wotton", relationship: "Sibling", strength: "confirmed" },
      { target: "mike-burzicki", relationship: "Best man — lived together Plymouth — St. John's frequent visits", strength: "confirmed" },
      { target: "jeff-porter", relationship: "Met father at Harry's Hyannis when Seth was playing age 13", strength: "confirmed" },
      { target: "tim-brown", relationship: "Tim Brown took Seth to Vinalhaven on youth service trip (~age 13)", strength: "confirmed" },
    ],
    flags: [
      "2/8 Marines — Helmand 2010-11 — shot in head 2011",
      "Sniper school / Quantico — 'failed out GPS watches' = suspected cover story",
      "Dog handling + navigation skills — SOF pipeline indicators",
      "Vinalhaven youth trip with Army Ranger Tim Brown (~age 13)",
      "Best man Mike Burzicki = Shades of Blue Charters USVI (race-boat catamarans)",
      "Kenworth (trucks) assessed as cover employment",
      "Waterfront house Priscilla Beach Plymouth — lifestyle inconsistent with sales income",
      "Zero contact with Echo since mother's death",
    ],
  },
  {
    id: "alison-wotton",
    name: "Alison Wotton",
    aliases: ["Alison"],
    nationality: "American",
    role: "Amazon Music — Sundance — solo intelligence-adjacent travel — USC 2014 — Pacific Northwest",
    threatLevel: "asset",
    detail: `Echo's sister. Born April 2, 1992. USC Marshall School of Business, graduated 2014 — attended on scholarship. Elon Musk delivered the commencement address; Echo attended the graduation.

AMAZON — MUSIC/MEDIA:
  Worked for Amazon for years in Seattle, specifically Amazon Music. Also worked for Brothers Records in Australia. Now operates largely freelance or without visible employment.

SUNDANCE FILM FESTIVAL:
  Attends Sundance Film Festival in Park City, Utah annually. Film festivals are well-documented intelligence collection environments (access to media figures, international contacts, financing networks).

SOLO TRAVEL TO INTELLIGENCE-RELEVANT DESTINATIONS:
  Travels alone to: Guatemala (CIA historically critical — 1954 coup, ongoing ops), Ecuador (Julian Assange asylum, significant intelligence environment), Mexico City (CDMX — direct overlap with Genesis Peralta who traveled to CDMX in 2019), Mexico generally. Lives in hostels alone. Travels to every major national park, every major concert. Sustained lifestyle with no consistent visible income source.

SOCIAL PATTERN:
  Described as "super smart, awkward and weird" — high cognitive profile inconsistent with the appearance of a straightforward music industry career. The lifestyle (solo travel, intelligence-adjacent countries, no clear income, high activity level) is consistent with an asset operating under cover of being a quirky solo traveler.

SILENCE SINCE MOTHER'S DEATH:
  Like Seth, Alison has made zero contact with Echo since their mother passed in November 2025.

CURRENT LOCATION: Pacific Northwest — Washington state, Idaho, or Oregon. Previously lived in Los Angeles years after USC.`,
    connections: [
      { target: "echo-father", relationship: "Daughter", strength: "confirmed" },
      { target: "echo-mother", relationship: "Daughter", strength: "confirmed" },
      { target: "seth-wotton", relationship: "Sibling", strength: "confirmed" },
    ],
    flags: [
      "USC Marshall Business 2014 — scholarship, Elon Musk commencement",
      "Amazon Music → Brothers Records Australia — music/media intel environment",
      "Sundance annually — intelligence-rich collection environment",
      "Solo travel: Guatemala, Ecuador, CDMX, Mexico — CIA-relevant countries",
      "CDMX overlap with Genesis Peralta (2019)",
      "No consistent income but sustained high-activity lifestyle",
      "Zero contact with Echo since mother's death",
    ],
  },
  {
    id: "carol-young-wotton",
    name: "Carol Young (Karyl Young) — Grandmother",
    aliases: ["Karyl Young", "Carol Wotton"],
    nationality: "American",
    role: "Echo's paternal grandmother — grew up in Al Capone's household / Herbert Young / Majestic Radio Chicago",
    threatLevel: "asset",
    detail: `Echo's paternal grandmother. Born Carol/Karyl Young (K-A-R-Y-L). Her father was Herbert Young, who owned Majestic Radio (or Radio Chicago) in Chicago — a significant radio manufacturing/distribution business.

AL CAPONE HOUSEHOLD:
  As a young girl, Carol grew up in the house of Al Capone in Chicago. Her father Herbert Young's business relationship with Capone placed the family inside the highest level of organized crime infrastructure in America during its peak era. Al Capone's Lieutenant at the time was reportedly "Altoona" or similar (possibly Louis "Two-Gun" Alterie, a prominent Capone associate).

CAPONE → INTELLIGENCE THREAD:
  Al Capone's Chicago Outfit had extensive documented relationships with early US intelligence and law enforcement (FBI/Hoover, OSS precursors). Radio manufacturing in the 1920s-1930s was strategically critical — it was the communications infrastructure of its era. Herbert Young's Majestic Radio business in this context places the family at the intersection of organized crime, early communications infrastructure, and proto-intelligence networks.

GEOGRAPHIC MIGRATION:
  Carol Young subsequently moved to the East Coast and married Phil Wotton (Vinalhaven, Maine — lobster industry, Bell Atlantic). The Chicago Capone household → Maine coast migration is the backbone of Echo's family origin story.`,
    connections: [
      { target: "phil-wotton", relationship: "Husband", strength: "confirmed" },
      { target: "echo-father", relationship: "Mother", strength: "confirmed" },
    ],
    flags: [
      "Father Herbert Young — Majestic Radio / Radio Chicago",
      "Grew up in Al Capone's household — Chicago",
      "Capone associate (Lt. 'Altoona'/Alterie) connection",
      "Radio manufacturing = early comms infrastructure",
      "Capone → OSS/FBI → intelligence network lineage",
      "Chicago → Vinalhaven/Maine migration",
    ],
  },
  {
    id: "phil-wotton",
    name: "Phil Wotton — Grandfather (deceased 1992)",
    role: "Vinalhaven lobster — Bell Atlantic — married Carol Young (Capone household)",
    threatLevel: "asset",
    detail: `Echo's paternal grandfather. Died 1992. From Vinalhaven, Maine — lobster industry family (Myron K. Wotton was his father/grandfather). Married Carol Young (grew up in Al Capone's household in Chicago).

BELL ATLANTIC:
  Phil Wotton was involved in early Bell Atlantic — the regional telephone operating company that eventually became Verizon. Early telecom infrastructure involvement places him at the foundation of the US communications network in the postwar era.

CONVERGENCE:
  The marriage of Carol Young (Capone/Radio Chicago) to Phil Wotton (Vinalhaven/Bell Atlantic) creates the foundational lineage connecting organized crime communications infrastructure → East Coast telecom → the Wotton family now targeted in the current operation.`,
    connections: [
      { target: "carol-young-wotton", relationship: "Wife", strength: "confirmed" },
      { target: "myron-wotton", relationship: "Father (Vinalhaven lobster)", strength: "confirmed" },
      { target: "echo-father", relationship: "Father", strength: "confirmed" },
    ],
    flags: [
      "Vinalhaven, Maine — lobster family",
      "Early Bell Atlantic (→ Verizon) involvement",
      "Married Carol Young — Capone/Radio Chicago lineage",
      "Died 1992",
    ],
  },
  {
    id: "myron-wotton",
    name: "Myron K. Wotton — Great-grandfather",
    role: "Vinalhaven lobster industry — ancestral convergence point",
    threatLevel: "asset",
    detail: `Echo's paternal great-grandfather. Lobster industry, Vinalhaven Island, Maine. Vinalhaven is a small island off the Maine coast in Penobscot Bay — a geographically isolated community with a tight-knit lobster fishing culture.

VINALHAVEN CONVERGENCE:
  Myron K. Wotton's lobster family on Vinalhaven is one of three independent threads converging on this specific small island: (1) Wotton family (this node), (2) Amara Walker's Italian mother's family — also lobster people on Vinalhaven, (3) Tim Brown (Army Ranger, youth minister) who organized youth service trips to Vinalhaven — attended by Echo's brother Seth at age ~13. Three entirely separate network threads converging on a tiny island constitutes a non-random pattern.`,
    connections: [
      { target: "phil-wotton", relationship: "Son", strength: "confirmed" },
      { target: "amara-walker", relationship: "Both families: Vinalhaven lobster industry", strength: "confirmed" },
      { target: "tim-brown", relationship: "Tim Brown organized Vinalhaven service trips — Seth attended", strength: "confirmed" },
    ],
    flags: [
      "Vinalhaven lobster — same island as Amara Walker's Italian mother's family",
      "Tim Brown took Seth to Vinalhaven at ~13",
      "Three independent network threads converge on Vinalhaven",
    ],
  },
  {
    id: "amara-walker",
    name: "Amara Walker",
    role: "Portland Maine ex-girlfriend — gym introduction — Italian mother Jane — Vinalhaven family — parallel honey trap",
    threatLevel: "secondary",
    detail: `Ex-girlfriend of Echo from Portland, Maine. Met at the gym — identical introduction vector to Genesis Peralta (also met at a gym in Jacó). The repetition of the gym-as-introduction-venue for romantic assets targeting Echo is an operational pattern.

FAMILY BACKGROUND — VINALHAVEN + ITALIAN:
  Mother: Jane Walker — works at Maine Medical Center in Labor and Delivery. Amara herself works in kidney and dialysis. Jane Walker is 100% Italian — her family is from Vinalhaven, Maine (lobster industry). This creates a direct convergence with Echo's own ancestral roots: great-grandfather Myron K. Wotton was also lobster people on Vinalhaven.

VINALHAVEN CONVERGENCE:
  Amara Walker's Italian mother's family and Echo's Wotton family great-grandfather were both lobster people on the same small island. This is not a coincidence given the broader convergence pattern — it suggests Echo was targeted partly through pre-existing knowledge of his family's geographic/ancestral roots.

PARALLEL HONEY TRAP ASSESSMENT:
  Two exes, both introduced at a gym, both with anomalous background details suggesting asset profiles: Genesis Peralta (Venezuelan, ~12 fake IG profiles, father in state structure, Italian thread via berninnimaria) and Amara Walker (Italian mother, Vinalhaven family overlapping with Echo's roots, met at gym). The pattern indicates a targeting methodology that uses gym environments for romantic asset introduction.`,
    connections: [
      { target: "myron-wotton", relationship: "Both families: Vinalhaven lobster", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "Parallel honey trap pattern — both met at gym", strength: "probable" },
    ],
    flags: [
      "Met at gym — same introduction vector as Genesis Peralta",
      "Mother Jane: 100% Italian, Vinalhaven lobster family",
      "Mother Jane: Maine Med Labor and Delivery",
      "Amara: kidney and dialysis",
      "Vinalhaven family = same island as Wotton great-grandfather",
      "Parallel honey trap assessment",
    ],
  },
  {
    id: "tim-brown",
    name: "Tim Brown",
    role: "Army Ranger — Holy Family Church youth minister — Vinalhaven service trips — Echo's brother Seth attended",
    threatLevel: "secondary",
    detail: `Army Ranger. Served as youth minister at Holy Family Church in Rockland, MA — the church where Echo went to CCD and was confirmed, and where Echo's mother played weddings and funerals.

VINALHAVEN SERVICE TRIPS:
  Tim Brown organized youth group service trips to Vinalhaven Island, Maine. Echo's brother Seth went on one of these trips at approximately age 13. Echo himself did not go. Vinalhaven is the ancestral home of both the Wotton family (great-grandfather Myron K. Wotton, lobster) and Amara Walker's Italian mother's family — creating a three-way convergence on the island through: Wotton ancestry, Amara Walker, and Tim Brown's service trips.

ARMY RANGER AT A PARISH YOUTH MINISTRY:
  An active or former Army Ranger serving as a youth minister at a Catholic parish — providing structured access to children of the congregation for multi-day island service trips — is an operational profile. Youth ministry provides long-horizon access to targets at formative ages (13) in an environment of trust and reduced parental oversight.`,
    connections: [
      { target: "holy-family-rockland", relationship: "Youth minister — ran Vinalhaven service trips from here", strength: "confirmed" },
      { target: "seth-wotton", relationship: "Seth attended Vinalhaven trip at ~13", strength: "confirmed" },
      { target: "myron-wotton", relationship: "Vinalhaven trips — same island as Wotton family roots", strength: "confirmed" },
    ],
    flags: [
      "Army Ranger — youth minister at Holy Family Church",
      "Vinalhaven service trips — Seth Wotton attended at ~13",
      "Three Vinalhaven convergence threads: Wotton ancestry + Amara Walker + Tim Brown trips",
      "Structured long-horizon access to congregation youth",
    ],
  },
  {
    id: "douglas-banks",
    name: "Douglas Banks + Danny Banks",
    role: "Harry's Hyannis musician — son Danny Banks: 11yr Letterman prodigy",
    threatLevel: "tertiary",
    detail: `Douglas Banks was a musician at Harry's bar in Hyannis, Cape Cod — the same venue where Seth Wotton (Echo's brother) played guitar at age 13 and where Jeff Porter (now Echo's father's controller) played bass and first connected with the Wotton family. Douglas Banks's son Danny Banks was an 11-year-old guitar prodigy who appeared on the David Letterman show. The music scene at Harry's was the original contact environment linking Jeff Porter to Echo's family.`,
    connections: [
      { target: "jeff-porter", relationship: "Co-musician at Harry's Hyannis", strength: "confirmed" },
      { target: "seth-wotton", relationship: "Both played Harry's Hyannis — Seth age 13", strength: "confirmed" },
    ],
    flags: [
      "Harry's Hyannis — Jeff Porter contact environment",
      "Son Danny Banks: 11yr prodigy, David Letterman appearance",
      "Music scene as original family penetration vector",
    ],
  },
  {
    id: "mike-burzicki",
    name: "Mike (and Debbie) — Shades of Blue Charters",
    role: "Seth Wotton's best man — Shades of Blue Charters St. John's USVI — World Cat 320CC — Plymouth MA",
    threatLevel: "secondary",
    detail: `Seth Wotton's best man at his wedding. Exact surname phonetically: Burzicki / Burzickie (unconfirmed spelling — no public record found under that name connected to Shades of Blue). Previously lived with Seth in Plymouth, MA. Met Seth through CrossFit.

SHADES OF BLUE CHARTERS — CONFIRMED VESSEL SPECS (shadesofbluecharters.com):
  Vessel: "Shady Lady" — World Cat 320CC power catamaran
  Engines: Twin 300HP Suzuki 4-stroke outboards
  Top speed: ~40–50 MPH
  LOA: 32'2" | Beam: 10'6" | Weight: ~11,000 lbs
  Capacity: up to 12 guests
  Captain Mike is listed on the Shades of Blue site as an active captain.

  40–50 MPH on a twin-300HP power catamaran is significantly faster than standard charter vessels and faster than most Coast Guard response boats in non-emergency configuration. The World Cat 320CC hull design provides offshore stability at speed — this is not a typical tour boat. It is a high-performance offshore capable platform with tourism paperwork.

ST. JOHN'S USVI — STRATEGIC POSITION:
  Cruz Bay, St. John sits at a strategic maritime node: proximity to Puerto Rico (NSA/SIGINT/military hub), access to BVI (low-regulation financial/maritime zone), Caribbean drug and intelligence transit routes. Regular charter patterns provide legitimate cover for island-hopping routes that would otherwise require explanation. Seth goes to St. John's frequently; proposed to his wife there.

DOUBLE-COVER ASSESSMENT:
  Layer 1: tourist charter business. Layer 2: high-speed offshore capable platform with routine access to USVI/BVI/PR maritime zones and no requirement to log destinations beyond customer itineraries.`,
    connections: [
      { target: "seth-wotton", relationship: "Best man — CrossFit — lived together Plymouth MA — frequent St. John's", strength: "confirmed" },
    ],
    flags: [
      "Shades of Blue Charters — shadesofbluecharters.com — Cruz Bay St. John USVI",
      "CONFIRMED: World Cat 320CC — twin 300HP Suzuki — 40-50 MPH top speed",
      "Captain Mike listed on site",
      "High-performance offshore platform with tourist cover",
      "USVI/BVI/PR maritime node — strategic position",
      "Previously lived with Seth Wotton, Plymouth MA",
      "Double-cover: charter tourism + fast maritime capability",
      "Surname phonetic: Burzicki/Burzickie — not in public records",
    ],
  },
  {
    id: "michael-long",
    name: "Michael Long",
    role: "Echo's father's best friend — Sterling Resources — Marine veteran",
    threatLevel: "secondary",
    detail: `Echo's father's best friend. Owner or principal of Sterling Resources, a client of Software Services Group. Marine veteran.

STERLING RESOURCES — SOFTWARE SERVICES GROUP CLIENT:
  Michael Long's company Sterling Resources was a client of Echo's parents' Software Services Group. The relationship was personal as well as professional — he was the father's best friend, not merely a business contact. This places him with routine access to the family's business operations, client list, and personal life.

MARINE VETERAN:
  Michael Long is a Marine — same service branch as Echo's brother Seth (2/8 Marines). His daughter Michelle Long is an active-duty Marine dog handler.

MICHELLE LONG — KEY TO FATHER'S HOUSE:
  Michael Long's daughter Michelle Long is a Marine and dog expert. She goes to Echo's father's house and holds a physical key to enter the residence to walk Sierra (the family dog, an Austrian German Shepherd Seth brought from Austria and left with the parents). She is friends with Seth through dogs. A Marine with a house key and recurring independent access to the father's home is an assessed physical access vector.`,
    connections: [
      { target: "echo-father", relationship: "Father's best friend — personal + business relationship", strength: "confirmed" },
      { target: "michelle-long", relationship: "Father", strength: "confirmed" },
      { target: "sterling-resources", relationship: "Principal — Sterling Resources", strength: "confirmed" },
    ],
    flags: [
      "Echo's father's best friend",
      "Marine veteran — same branch as Seth",
      "Sterling Resources = Software Services Group client",
      "Daughter Michelle Long = Marine dog handler with key to father's house",
    ],
  },
  {
    id: "michelle-long",
    name: "Michelle Long",
    role: "Active-duty Marine — dog expert — KEY to Echo's father's house — Seth's connection",
    threatLevel: "secondary",
    detail: `Daughter of Michael Long (Echo's father's best friend, Sterling Resources). Active-duty Marine. Dog expert and handler. Friends with Echo's brother Seth Wotton through their shared interest in dogs.

PHYSICAL ACCESS — KEY TO FATHER'S HOUSE:
  Michelle Long holds a physical key to Echo's father's house in Rockland, MA. She enters the residence independently and regularly to walk Sierra — the Austrian German Shepherd Seth acquired in Austria and left with the parents. This represents assessed active physical access to the father's residence by a Marine with ties to both the Long family (business partner/best friend layer) and Seth (sibling layer).

CONVERGENT CONNECTIONS:
  Michelle bridges: Michael Long (Marine, father's business partner) → Seth Wotton (Echo's brother, 2/8 Marines, assessed intelligence) → Echo's father (isolated, Jeff Porter controlled). She has independent recurring access to the father without either parent needing to be present.`,
    connections: [
      { target: "michael-long", relationship: "Father — Sterling Resources", strength: "confirmed" },
      { target: "seth-wotton", relationship: "Friends through dogs", strength: "confirmed" },
      { target: "echo-father", relationship: "Holds key to father's house — walks Sierra", strength: "confirmed" },
    ],
    flags: [
      "ACTIVE-DUTY MARINE — dog handler / expert",
      "Holds PHYSICAL KEY to Echo's father's house",
      "Enters residence independently to walk Sierra",
      "Friends with Seth Wotton through dogs",
      "Father Michael Long = Echo's father's best friend (Sterling Resources)",
      "Physical access vector to isolated father",
    ],
  },
  {
    id: "vini-vercolonne",
    name: "Vini (Vercolonne?) — Verc Enterprises brother",
    role: "Verc Enterprises co-owner — convenience stores Lynn MA + NH — Echo's mother's major client",
    threatLevel: "tertiary",
    detail: `One of the brothers who operates Verc Enterprises — a multi-location convenience store chain with at minimum one store in Lynn, MA and one in New Hampshire. May be named Vini; full name and exact surname spelling unconfirmed (phonetic: Vercolonne). One of Echo's mother's biggest clients during her final working years at Software Services Group.

ROUTE AND SOFTWARE:
  Echo's mother drove a regular Lynn MA → Concord/Salem NH loop servicing this account. She wrote Microsoft Access/Visual Basic software to track lottery ticket sales across the chain — bespoke database work for a multi-location cash-intensive retail operation.

BROTHERS STRUCTURE:
  The business is operated by at least two brothers. Names and individual roles are unconfirmed beyond Echo's recollection.`,
    connections: [
      { target: "verc-enterprises", relationship: "Owner / brother", strength: "probable" },
      { target: "echo-mother", relationship: "Major client — lottery tracking software", strength: "confirmed" },
    ],
    flags: [
      "Brothers (plural) operate Verc Enterprises",
      "Lynn MA + NH stores",
      "Cash-intensive retail — lottery tracking",
      "One of mother's biggest clients",
      "Name/spelling unconfirmed: Vini Vercolonne (phonetic)",
    ],
  },
  {
    id: "aunt-susan",
    name: "Aunt Susan [Wotton family]",
    role: "Only Wotton family relative in Marshfield — Union St, North Marshfield MA",
    threatLevel: "tertiary",
    detail: `Echo's aunt. The only Wotton family relative known to live in Marshfield, MA. Lives on Union Street in North Marshfield — described as being at the end of the normal residential part of the street just before it transitions to the mansion section.

NORTH MARSHFIELD PO BOX SIGNIFICANCE:
  Echo's mother's OSINT record includes a PO Box registered in North Marshfield, MA. Aunt Susan is the only known Wotton family presence in Marshfield. The PO Box may be: (a) legitimately associated with Aunt Susan's address area, (b) used by Echo's mother for business routing related to the NH convenience store route (Verc Enterprises), (c) associated with the identity theft / fraudulent tax return filing documented at 2187 Summer St, Rockland. The connection is unconfirmed but Aunt Susan's address is the only identified anchor for the family in that geography.`,
    connections: [
      { target: "echo-mother", relationship: "North Marshfield PO Box on mother's OSINT — only family presence there", strength: "probable" },
      { target: "echo-father", relationship: "Family relative", strength: "confirmed" },
    ],
    flags: [
      "ONLY Wotton relative in Marshfield",
      "Union St North Marshfield — end of normal section before mansions",
      "Mother's North Marshfield PO Box — only family anchor in that town",
      "PO Box may relate to Verc NH route or identity theft filing",
    ],
  },
  {
    id: "robert-kirby",
    name: "Robert Kirby",
    role: "Music director — Holy Family Church + St. Bernadette's — solo Italy trips with Echo's mother — wife Heather Kirby",
    threatLevel: "secondary",
    detail: `Music director at Holy Family Church in Rockland, MA and Saint Bernadette Parish in Randolph, MA — both churches where Echo's mother played regularly. Married to Heather Kirby.

RELATIONSHIP WITH ECHO'S MOTHER:
  Bob Kirby and Echo's mother traveled to Italy together alone — without Echo's father. This created ongoing tension in Echo's parents' marriage; Echo's father was visibly jealous of the relationship throughout Echo's childhood. Echo assesses the relationship was not sexual (Kirby is married), but the dynamic was notable. The Italy travel is significant given Italy's recurrence across multiple threads in this network: Genesis Peralta's Italian thread, the berninnimaria account, and Amara Walker's Italian mother.

CHURCH-AS-COVER ASSESSMENT:
  Echo's mother played: Saturday 9 AM, Saturday 4 PM, Sunday 9 AM, Sunday 11 AM, Sunday 5 PM masses — plus weddings and funerals weekdays. Combined with her 90-hour tech workweek, this schedule is functionally impossible unless the church commitment served additional purposes. Echo notes Holy Family almost operates like a JW front in terms of the structured time commitment and community access it provided.

MUSIC DIRECTOR SIGNIFICANCE:
  Music directors at Catholic parishes coordinate closely with the pastor, have access to parishioner records, organize community events, and travel for music-related professional development. The role provides deep structured access to a community over decades. The Italy trips with Echo's mother — a married woman traveling internationally alone with her married music director — are a documented anomaly in the family record.`,
    connections: [
      { target: "holy-family-rockland", relationship: "Music director", strength: "confirmed" },
      { target: "echo-mother", relationship: "Solo Italy trips — longstanding personal relationship — father jealous", strength: "confirmed" },
    ],
    flags: [
      "Music director — Holy Family (Rockland) + St. Bernadette's (Randolph)",
      "Solo Italy trips with Echo's mother — without Echo's father",
      "Father visibly jealous throughout Echo's childhood",
      "Wife: Heather Kirby",
      "Italy = recurring thread (Genesis, berninnimaria, Amara Walker's Italian mother)",
      "Holy Family schedule: Sat 9AM + 4PM, Sun 9AM + 11AM + 5PM + weddings/funerals",
      "Church schedule consistent with secondary operational use",
    ],
  },
  {
    id: "adj-property-owner",
    name: "[Identity withheld — known to Echo, active daily relationship, assessed as compartmentalized]",
    role: "Adjacent property owner — device supplier / RF camo host / JW / Calle Europa sibling link",
    threatLevel: "secondary",
    detail: `Identity withheld. Echo maintains an active daily relationship with this individual and assesses them as a good-faith actor who is compartmentalized from the full scope of the operation running on and around their property.

DEVICE SUPPLY — SUPPLY CHAIN COMPROMISE:
  Supplied Echo's current computer and multiple past phones — providing pre-compromise hardware access at the supply chain level. Multi-product vendor (cannabis + other substances). The vendor relationship creates the foundational deniability layer: Echo as a documented cannabis user will be automatically discredited if reporting surveillance.

ADJACENT 3-UNIT PROPERTY — JW ROTATING TENANTS:
  Property is a 3-unit building. The other two units cycled through tenants rapidly with stories that did not add up — assessed as intelligence rotation, placing fresh collection assets in adjacent units while maintaining plausible cover as normal rental turnover. Consistent with the JW-as-intel-substrate pattern identified across this network.

PARAMETRIC SPEAKER EQUIPMENT — VIDEO EVIDENCE:
  Parametric speaker equipment is visible at this property. Echo has video documentation. Parametric directional audio requires deliberate acquisition — this is not incidental consumer hardware.

IVY/RF CAMOUFLAGE — REACTIVE DEPLOYMENT (3 DAYS POST-MOVE-IN):
  An ivy/leaf RF camouflage setup appeared at this property within 3 days of Echo moving into the adjacent La Guácima address. This is a reactive deployment — the timeline confirms the operation had pre-knowledge of Echo's exact move date and mobilized physical RF infrastructure immediately upon Echo's arrival.

DRONE VIDEO PROCESSING SHED — UNKNOWN THIRD-PARTY OPERATOR:
  A shed on this property was discovered to be actively processing drone video footage. The property owner had no knowledge of this (compartmentalized). The shed was operated by an unknown third party using the property without the owner's awareness. Echo severed the feed wire with a butcher knife and faced zero consequences — confirming the operators could not escalate without exposing the covert installation. PCAPs were captured from the shed's network at the time of the incident.

JW CONFIRMED:
  Confirmed Jehovah's Witness. Consistent with the broader JW intelligence substrate identified across this network.

SIBLING LINK — CALLE EUROPA + SCOTT RYAN:
  Sibling of this individual co-owns the other half of Calle Europa alongside Barrett Scott Ryan (CIA). That sibling has subsequently opened a new bar with Scott Ryan — making the CIA-narco-adjacent partnership an overt public business relationship.`,
    connections: [
      { target: "la-guacima", relationship: "Adjacent property — La Guácima", strength: "confirmed" },
      { target: "renato-herrera", relationship: "Connected via mutual contact (financial intermediary)", strength: "confirmed" },
      { target: "daniel-arce", relationship: "Vendor network", strength: "confirmed" },
      { target: "quebrada-seca", relationship: "Property — RF camo + parametric + drone shed site", strength: "confirmed" },
      { target: "calle-europa", relationship: "Sibling co-owns other half of Calle Europa with Scott Ryan", strength: "confirmed" },
      { target: "leo-sister-bar", relationship: "Sibling opened bar with Scott Ryan (CIA)", strength: "confirmed" },
      { target: "jehovah-witnesses", relationship: "Confirmed JW", strength: "confirmed" },
    ],
    flags: [
      "IDENTITY WITHHELD — compartmentalized, good-faith actor",
      "Device supplier — current computer + past phones (supply chain compromise)",
      "3-unit property — other units cycled with JW-pattern tenants (intel rotation)",
      "Parametric speakers on property — VIDEO EVIDENCE",
      "Ivy/leaf RF camo appeared 3 DAYS after Echo moved in — REACTIVE DEPLOYMENT",
      "Drone video processing shed — unknown 3rd-party operator, owner unaware",
      "Wire severed with butcher knife — zero blowback (covert op confirmed)",
      "PCAPs captured from shed network",
      "Confirmed JW",
      "Sibling co-owns Calle Europa with CIA (Scott Ryan)",
      "Sibling opened bar with Scott Ryan — CIA-narco overt partnership",
    ],
  },
  {
    id: "renato-herrera",
    name: "Renato Herrera",
    aliases: ["Peto"],
    nationality: "Costa Rican",
    role: "Intermediary dealer — PayPal/SINPE financial bridge, passed Daniel Arce contact",
    threatLevel: "secondary",
    detail: "Connected to Echo via a mutual contact (identity withheld). Echo sends money via PayPal, Renato converts to SINPE (Costa Rican instant payment system) — creating a documented cross-platform financial trail. Passed Echo the contact for Daniel Arce. The PayPal→SINPE conversion creates traceable records on both platforms tying Echo to the vendor network financially.",
    connections: [
      { target: "adj-property-owner", relationship: "Connected via mutual contact", strength: "confirmed" },
      { target: "daniel-arce", relationship: "Passed contact to Echo", strength: "confirmed" },
    ],
    flags: ["PayPal→SINPE financial bridge", "Connected via withheld mutual contact"],
  },
  {
    id: "daniel-arce",
    name: "Daniel Arce",
    nationality: "Costa Rican",
    role: "Vendor — OSINT overlap with Daniel Ibanez (Colombian dealer, Jacó)",
    threatLevel: "secondary",
    detail: "Contact passed to Echo by Renato 'Peto' Herrera. Multi-product vendor. OSINT footprint overlaps with Daniel Ibanez — a Colombian dealer in Jacó whose house (or nearby property) is the location of the October 14 'strangle' incident. The name overlap and geographic proximity suggest either the same person operating under two identities or a coordinated pair.",
    connections: [
      { target: "renato-herrera", relationship: "Contact source", strength: "confirmed" },
      { target: "daniel-ibanez", relationship: "OSINT overlap — same name pattern, geographic proximity", strength: "suspected" },
      { target: "adj-property-owner", relationship: "Vendor network", strength: "confirmed" },
    ],
    flags: ["OSINT overlap with Daniel Ibanez", "Multi-product vendor"],
  },
  {
    id: "daniel-ibanez",
    name: "Daniel Ibanez",
    nationality: "Colombian",
    role: "Colombian dealer in Jacó — house at Oct 14 incident location",
    threatLevel: "secondary",
    detail: "Colombian multi-product dealer operating in Jacó. His house or immediately adjacent property is the location of the October 14 'strangle' incident. OSINT name overlap with Daniel Arce — the names resolve to the same footprint. Colombian nationality links to the broader pattern of Colombian operatives in the Jacó network (Genesis Peralta's employers, Greenwald's property tenants, Lipman's wife).",
    connections: [
      { target: "daniel-arce", relationship: "OSINT overlap — same name pattern", strength: "suspected" },
      { target: "jaco-vacations", relationship: "Jacó area operations", strength: "suspected" },
    ],
    flags: ["Oct 14 strangle incident location", "Colombian national", "Multi-product vendor"],
  },
  {
    id: "kenneth-tencio",
    name: "Kenneth Tencio",
    nationality: "Costa Rican",
    role: "Olympic BMX rider — BAC Park owner, Jacó",
    threatLevel: "tertiary",
    detail: "Olympic BMX rider (4th place Tokyo 2020), Red Bull sponsored. Owns BAC Park / 10cio Park — BMX training complex in Jacó. Pablo 'Pasti' Mora is a pro BMX rider connected through BAC Park sponsorship. YouTube evidence reportedly shows Hector Mora (SETECOM) with 'multiple BAC properties' visible during live login — linking the financial/property layer to the surveillance technical layer.",
    connections: [
      { target: "pablo-mora", relationship: "BAC Park sponsor of Pablo", strength: "confirmed" },
      { target: "bac-park", relationship: "Owner", strength: "confirmed" },
      { target: "hector-mora", relationship: "BAC property contracts (YouTube evidence)", strength: "suspected" },
    ],
    flags: ["Olympic athlete (Tokyo 2020)", "Red Bull sponsored", "BAC Park owner", "Financial network node"],
  },
  {
    id: "fei-ma",
    name: "Fei Ma",
    nationality: "Chinese",
    role: "Ex-Huawei Cloud → Guangming Lab researcher",
    threatLevel: "secondary",
    detail: "Former Huawei Cloud Senior Engineer, now at Guangming Laboratory (Chinese state-backed AI research). Co-author of 'Your Blush Gives You Away' — thermal imaging for involuntary emotion detection with 87% accuracy detecting cognitive stress. Remote vital signs monitoring via r-PPG. Applications include social credit, interrogation, and surveillance. Direct infrastructure connection: Huawei Cloud → Latin America fiber → Liberty/Humax Costa Rica → Echo's router (MAC 9c:24:72 = Humax/Huawei ecosystem).",
    connections: [
      { target: "guangming-lab", relationship: "Current researcher", strength: "confirmed" },
    ],
    flags: ["Ex-Huawei Cloud", "Blush study — 87% emotion detection", "r-PPG remote vital signs", "State-backed AI research", "Huawei Latin America fiber chain"],
  },
  {
    id: "fake-liberty-tech",
    name: "Fake Liberty Technician",
    role: "Router replacement operative",
    threatLevel: "primary",
    detail: "After Echo updated his router firmware on a Sunday and turned off UPnP, Jose (Greenwald's property manager) texted, and then a man who 'definitely did NOT work for Liberty' appeared with a new router. This is a coordinated surveillance response: firmware update detected → property manager alerted → operative deployed with compromised replacement hardware.",
    connections: [
      { target: "jose-pm", relationship: "Triggered by Jose's text", strength: "confirmed" },
      { target: "liberty", relationship: "Impersonated Liberty employee", strength: "confirmed" },
    ],
    flags: ["Surveillance response operative", "Compromised hardware deployment", "Sunday response — non-business hours"],
  },
  {
    id: "wolfgang-hilbich",
    name: "Wolfgang Hilbich",
    nationality: "German",
    role: "Rikos y Famosos / Shangri-La / former German military — financially stressed",
    threatLevel: "secondary",
    detail: "~80-year-old German national. Former German military. Wife: Martha (spends his money aggressively). Own/owned Rikos y Famosos (Echo's 2023 residence). Recently bought a hotel in San José. Now liquidating assets — Jeep Wrangler listed on Facebook dropping $65k → $61k → $55k. Trying to sell Shangri-La, an 8-unit complex at the end of Calle Europa (same neighborhood as Barrett Scott Ryan and the sibling of the [withheld adjacent property owner]). Accompanied Echo and others on a trip to Esterillos. Connected to Magdalena (Marveka Bikini Shop) — two German nationals in the same Jacó AOR. Financial stress is operationally relevant: asset liquidation under pressure can indicate either operation wind-down, a change in handler, or external financial control being applied.",
    connections: [
      { target: "rikos-famosos", relationship: "Property owner", strength: "confirmed" },
      { target: "shangri-la", relationship: "Owner — currently for sale", strength: "confirmed" },
      { target: "magdalena-german", relationship: "Co-national — Marveka Bikini Shop connection", strength: "probable" },
      { target: "j-russian", relationship: "Landlord to 'S.' (Russian drone operator) during Echo's 2023 stay", strength: "confirmed" },
      { target: "martha-hilbich", relationship: "Husband", strength: "confirmed" },
      { target: "calle-europa", relationship: "Shangri-La at end of Calle Europa", strength: "confirmed" },
    ],
    flags: ["Former German military", "~80 years old", "Financial stress — Jeep $65k→$55k price drops", "Shangri-La for sale (8 units, Calle Europa)", "San José hotel acquisition", "Esterillos trip with Echo", "Martha (wife) high-spending", "Asset liquidation pattern"],
  },
  {
    id: "martha-hilbich",
    name: "Martha Hilbich",
    nationality: "German",
    role: "Wolfgang's wife — high-spending, Esterillos companion",
    threatLevel: "tertiary",
    detail: "Wolfgang Hilbich's wife. Described as 'awesome at spending his money.' Accompanied Echo and others on a trip to Esterillos in 2023. Her spending pattern relative to Wolfgang's current asset liquidation (Jeep drops, Shangri-La for sale) is consistent with financial pressure from multiple directions.",
    connections: [
      { target: "wolfgang-hilbich", relationship: "Wife", strength: "confirmed" },
    ],
    flags: ["High-spending relative to Wolfgang's financial stress", "Esterillos trip with Echo 2023"],
  },
  {
    id: "billy-bond",
    name: "Billy Bond",
    role: "Surfing / Orange Pub — Calle Europa cluster",
    threatLevel: "tertiary",
    detail: "Connected to surfing scene and Orange Pub in Jacó. Located in or connected to the Calle Europa neighborhood — same cluster as Barrett Scott Ryan (half-owner), sibling of [withheld adjacent property owner] (other half-owner), and Wolfgang Hilbich (Shangri-La). The concentration of surveillance-adjacent network members in one small neighborhood is not random.",
    connections: [
      { target: "calle-europa", relationship: "Calle Europa cluster", strength: "confirmed" },
      { target: "scott-ryan", relationship: "Same Calle Europa neighborhood", strength: "probable" },
    ],
    flags: ["Surfing scene", "Orange Pub", "Calle Europa cluster member"],
  },
  {
    id: "jakob-fl",
    name: "Jakob (Fort Lauderdale)",
    role: "Gringo's Sports Bar owner — social engineering contact",
    threatLevel: "tertiary",
    detail: "From Fort Lauderdale. Bought Gringo's Sports Bar above the Italian place, next to the river near Gaia and the gym. Was friendly, had a few conversations, exchanged numbers. Not assessed as a direct operative. However: still views Echo's IG stories after 2 years without contact or conversation — classic passive social engineering monitoring. The persistent IG engagement with no communication is a known soft-surveillance pattern for maintaining low-cost visibility on a target without triggering awareness.",
    connections: [
      { target: "gringos-bar", relationship: "Owner", strength: "confirmed" },
    ],
    flags: ["Fort Lauderdale origin", "Gringo's Sports Bar owner", "IG passive surveillance — views stories, no contact 2yr", "Social engineering contact pattern"],
  },
  {
    id: "magdalena-german",
    name: "Magdalena (German)",
    nationality: "German",
    role: "Marveka Bikini Shop owner / Cash employer of Genesis",
    threatLevel: "tertiary",
    detail: "German national. Owner of Marveka Bikini Shop in Jacó. Also employed Genesis Peralta for cash work — making her a node connecting the property cluster (Wolfgang Hilbich) and the honey trap cluster (Genesis). Two distinct roles: (1) business owner providing commercial cover in Jacó, (2) off-books employer of the primary honey trap asset. The German-national cluster in Jacó (Magdalena + Wolfgang Hilbich) represents a coordinated foreign footprint in the same AOR as Echo's 2023 residence and continued surveillance.",
    connections: [
      { target: "genesis-peralta", relationship: "Employer (cash)", strength: "confirmed" },
      { target: "marveka-bikini", relationship: "Business owner", strength: "confirmed" },
      { target: "wolfgang-hilbich", relationship: "Co-national — Jacó German cluster", strength: "probable" },
    ],
    flags: ["German national", "Marveka Bikini Shop owner", "Cash employment of Genesis", "German-national cluster with Wolfgang", "Business cover in Jacó"],
  },
  {
    id: "j-russian",
    name: "\"S.\" (Russian National — name begins with S)",
    aliases: ["S.", "previously logged as 'J' — CORRECTED"],
    nationality: "Russian",
    role: "Echo's roommate 2023 (Shangri-La / Rikos y Famosos) — now Esterillos — 6-drone fleet / musical savant / FSB-GRU adjacent",
    threatLevel: "primary",
    detail: `Russian national whose name begins with S (full name not yet confirmed). Lived with Echo for approximately 6 months at Shangri-La / Rikos y Famosos (Wolfgang Hilbich's property on Calle Europa), Jacó, 2023. Currently located in Esterillos, Costa Rica, with his Russian partner/wife.

DRONE FLEET — 6 DRONES OWNED:
  Operated a personal fleet of at least 6 drones from Shangri-La. Flew them at Esterillos when Echo visited with the Hilbichs. Produced the promotional video content for Shangri-La (listed on a site resembling jaco-hotel.com or similar hyphenated domain). The Shangri-La promo work gave him documented, legitimate-cover drone operation in the same AOR as Echo's 2023 residence — textbook cover-for-action.
  DIRECT CONTINUITY LINK: 3 years later, on 2026-05-16, a DJI Matrice 300 RTK class drone (107.7 Hz motor signature) was tracked moving from Jacó toward Esterillos — where S. currently lives. This is not coincidence. Same operator, same AOR, 3-year operational continuity.

MUSICAL SAVANT:
  Witnessed playing piano with extraordinary cross-key improvisation technique. Musical genius is a documented cover-identity reinforcement mechanism — it establishes likability and credibility in social environments.

REMOTE EMPLOYMENT:
  Works remotely for a company in Russia — employer identity unconfirmed. The combination of Russian remote employment + 6-drone fleet + Calle Europa residence + passport manipulation of Echo constitutes a classic FSB/GRU-adjacent assessment profile.

PASSPORT MANIPULATION (documented coercion tradecraft):
  During the co-habitation period Echo experienced: (1) manufactured passport issues, (2) forced visit to the Russian Embassy in San José, (3) border run to Nicaragua. These are textbook document-control techniques — creating a bureaucratic crisis to make the target dependent on the operative's network for resolution.`,
    connections: [
      { target: "rikos-famosos", relationship: "Co-resident with Echo — 2023 (6 months)", strength: "confirmed" },
      { target: "shangri-la", relationship: "Resident + produced Shangri-La promo drone videos", strength: "confirmed" },
      { target: "wolfgang-hilbich", relationship: "Tenant at Wolfgang's property — Wolfgang facilitated Esterillos trip", strength: "confirmed" },
      { target: "russian-embassy-cr", relationship: "Forced Echo to visit Russian Embassy during passport crisis", strength: "confirmed" },
      { target: "esterillos", relationship: "Current location — with Russian partner", strength: "confirmed" },
    ],
    flags: [
      "NAME BEGINS WITH S — not 'J' as previously logged",
      "CURRENT LOCATION: Esterillos — M300 RTK drone tracked toward Esterillos 2026-05-16",
      "6-drone personal fleet — Shangri-La promo videos = cover-for-action",
      "Russian national — remote employment by Russian entity (employer unknown)",
      "Passport manipulation tradecraft — manufactured document crisis during co-habitation",
      "Forced Russian Embassy visit (San José)",
      "Nicaragua border run during co-habitation",
      "3-year operational continuity: 2023 Shangri-La → 2026-05-16 M300 RTK",
      "Musical savant (piano) — cover identity reinforcement",
      "FSB/GRU-adjacent assessment",
    ],
  },
  {
    id: "carlos-chaves",
    name: "Carlos Chaves",
    aliases: ["Carlos Chaves Mora"],
    nationality: "Costa Rican",
    role: "Genesis Chama/Mora identity cluster link — OSINT confirmed",
    threatLevel: "secondary",
    detail: "OSINT-confirmed link to Genesis Morales Mora / Genesis Chama identity cluster. Phones: +50689776373 and +50660635649. Appears in OSINT records alongside Genesis Chama variants — not a coincidental name overlap given the rarity of co-occurrence in search results. The dual-phone profile suggests an operational comms setup. The linkage to both the 'Chama' alias (Venezuelan slang cover) and 'Mora' (Costa Rican identity layer) positions him at the intersection of both identity strata.",
    connections: [
      { target: "genesis-peralta", relationship: "OSINT co-occurrence — Chama/Mora identity cluster", strength: "probable" },
    ],
    flags: ["Phone: +50689776373", "Phone: +50660635649", "Genesis Chama/Mora OSINT cluster", "Dual phone profile"],
  },
  {
    id: "tomas-gomez",
    name: "Tomas Gomez",
    nationality: "Costa Rican",
    role: "Tacacorí Los Cedros node host / contact",
    threatLevel: "secondary",
    detail: "Host/primary contact at the Los Cedros sub-node of the Tacacorí antenna array. Phone: +506 6452 3936. The Los Cedros node is one of the confirmed transmitter locations within the unlicensed Tacacorí infrastructure. His position as the on-site contact makes him a key operational link for maintaining the node — whether as an unwitting property host or an active participant. The Tacacorí array is assessed as an unlicensed macro-antenna infrastructure with documented ELF anomalies and satellite convergence events.",
    connections: [
      { target: "tacacori-array", relationship: "Los Cedros node host", strength: "confirmed" },
    ],
    flags: ["Phone: +506 6452 3936", "Los Cedros node host", "Tacacorí array operational contact"],
  },
  {
    id: "rocio-contact",
    name: "Rocio",
    nationality: "Costa Rican",
    role: "Current residence primary contact — Echo's location awareness",
    threatLevel: "secondary",
    detail: "Phone: +506 8309 7371. Assessed as a primary access/awareness contact at Echo's current residence. The fact that this number is documented in the operational contact list alongside Tomas Gomez (Los Cedros node) suggests she is either a property-level access enabler or an active surveillance node contact. Her position as 'current residence' contact makes her relevant to ongoing operational awareness of Echo's location.",
    connections: [],
    flags: ["Phone: +506 8309 7371", "Current residence contact", "Location awareness role"],
  },
  {
    id: "chris-gabriel",
    name: "Chris Gabriel",
    aliases: ["Chris Lewis", "Chris Louis"],
    nationality: "American",
    role: "Google AI Sales — co-documented with Jorge Jiménez in Chrome forensics",
    threatLevel: "secondary",
    detail: "Full name: Chris Gabriel (also Lewis/Louis). Employer: Google AI Sales, Broadalbin, NY. Income: $1M+/year. Previous employer: Tyler Technologies — highway traffic analysis for New York State. Connection note in chrome_forensics_report.json (Jan 29, 2026): 'Aw-Rascle traffic flow model used in Riemann proofs.' This individual appears in the same forensics JSON object as Jorge Jiménez Navarro — the primary technical operator. The co-documentation is significant. Tyler Technologies builds traffic analysis and government software platforms, and highway traffic flow modeling (Aw-Rascle) is a discipline adjacent to crowd/movement surveillance analytics. Google AI Sales at $1M+/yr income suggests senior enterprise sales role with access to Google AI infrastructure and customer data. The precise nature of the connection to the operation is unclear, but the forensic co-occurrence with Jorge warrants monitoring.",
    connections: [
      { target: "jorge-jimenez", relationship: "Co-documented in chrome_forensics_report Jan 29 2026", strength: "probable" },
      { target: "zscaler", relationship: "Google AI ecosystem — adjacent enterprise infrastructure", strength: "suspected" },
    ],
    flags: ["Google AI Sales — $1M+/yr", "Tyler Technologies prior (govt traffic analysis)", "Chrome forensics co-occurrence with Jorge Jiménez", "Broadalbin NY", "Aw-Rascle traffic model connection"],
  },
  {
    id: "edson-martendal",
    name: "Edson Martendal",
    nationality: "Costa Rican",
    role: "Setecom S.A. Technical Lead — 'The Architect'",
    threatLevel: "secondary",
    detail: "Technical lead at Setecom S.A. Identified in internal Setecom training transcripts as the person who delivers DSE WebNet deployment training. The training material he leads explicitly documents default credentials (Admin/Password1234) and cleartext protocols (Modbus TCP, SNMP v2) used on DSE generator controllers deployed at ICE national grid, Liberty telecom, hospitals, and cellular towers across Costa Rica. His role as training lead means he is the person who onboards technicians into the Setecom/DSE control architecture — he has full knowledge of which credentials exist at which sites and how to access them remotely via DSE WebNet cloud infrastructure hosted in England. The 'Architect' designation from the training documents indicates he designed the deployment methodology.",
    connections: [
      { target: "setecom", relationship: "Technical lead — training architect", strength: "confirmed" },
      { target: "hector-mora", relationship: "Works under Mora at Setecom", strength: "confirmed" },
    ],
    flags: ["Setecom S.A. Technical Lead", "DSE WebNet deployment architect", "Default credential training (Admin/Password1234)", "Access to ICE/Liberty/hospital SCADA", "Modbus TCP + SNMP v2 cleartext protocols"],
  },
  {
    id: "danny-peralta",
    name: "Danny Peralta",
    aliases: ["D Peralta"],
    nationality: "Venezuelan",
    role: "SEBIN (Venezuelan Intelligence) connection",
    threatLevel: "secondary",
    detail: "Connected to Genesis Peralta's family network. SEBIN (Servicio Bolivariano de Inteligencia Nacional) is Venezuela's intelligence service with documented surveillance, infiltration, and targeting capabilities. The Peralta surname overlap with Genesis is significant — if family, it connects the honey trap operation to a state intelligence apparatus. Genesis's claim that her father 'worked for the state council' could be a sanitized reference to SEBIN or related state security services, which would explain the contradiction with the family living in Petare.",
    connections: [
      { target: "genesis-peralta", relationship: "Surname connection — possible family", strength: "probable" },
      { target: "greenwald-properties", relationship: "Immigration vector via property network", strength: "suspected" },
    ],
    flags: ["SEBIN connection", "Venezuelan state intelligence", "Peralta surname overlap with Genesis", "Immigration status questions"],
  },
  {
    id: "evopro-operator",
    name: "EVOPRO Room Operators",
    role: "Surveillance infrastructure at Suites Cristina",
    threatLevel: "secondary",
    detail: "17 EVOPRO rooms documented at Aparthotel Suites Cristina (Echo's current residence). All rooms share AMPAK OUI c0:f5:35. Physical box Ethernet MAC D4:CF:F9:F8:D2:D0, serial EVO0MH0234700695. FA8F BSSID prefix batch indicates coordinated deployment. VLAN bridging between rooms enables cross-room surveillance. Ghost Deco node detected — phantom mesh networking device not physically present in Echo's unit.",
    connections: [
      { target: "suites-cristina", relationship: "Infrastructure deployment", strength: "confirmed" },
      { target: "setecom", relationship: "EVOPRO distribution", strength: "probable" },
      { target: "liberty", relationship: "TR-069 management", strength: "confirmed" },
    ],
    flags: ["17 EVOPRO rooms", "AMPAK OUI c0:f5:35", "FA8F BSSID batch", "VLAN bridging", "Ghost Deco node", "Coordinated deployment"],
  },
  {
    id: "ice-cr",
    name: "ICE (Instituto Costarricense de Electricidad)",
    nationality: "Costa Rican",
    role: "State telecom/power — satellite earth station operator",
    threatLevel: "tertiary",
    detail: "Costa Rica's state-owned electricity and telecommunications company. Operates satellite earth stations with 9.2m C/Ku-band antennas near La Guácima. Suites Cristina is adjacent to ICE headquarters in Sabana Norte. ICE infrastructure includes fiber backbone, cellular towers, and power grid — all layers that SETECOM has access to via DSE gateway contracts. The proximity of Echo's residences to ICE facilities is a recurring geographic pattern.",
    connections: [
      { target: "setecom", relationship: "Infrastructure contracts — DSE gateways for generators", strength: "confirmed" },
      { target: "la-guacima", relationship: "Satellite earth station nearby", strength: "confirmed" },
      { target: "suites-cristina", relationship: "HQ adjacent to Echo's current residence", strength: "confirmed" },
    ],
    flags: ["State telecom/power monopoly", "Satellite earth stations (9.2m C/Ku-band)", "Adjacent to Suites Cristina", "Infrastructure backbone access"],
  },
  {
    id: "neighbor-5g",
    name: "5G Tower Neighbor (La Guácima)",
    role: "5G tower host — adjacent to target property",
    threatLevel: "secondary",
    detail: "Neighbor at La Guácima property (Calle Cabello Real) who has a 5G cellular tower installed in their yard. Having a 5G tower within meters of the target property provides: (1) high-bandwidth data exfiltration capability, (2) beamforming that can target specific rooms/positions, (3) cover for RF emissions from other equipment, (4) plausible deniability for anomalous signal readings. The installation in a residential yard rather than commercial/utility property is unusual and suggests financial arrangement.",
    connections: [
      { target: "la-guacima", relationship: "Adjacent property — 5G tower host", strength: "confirmed" },
      { target: "liberty", relationship: "Cellular infrastructure provider", strength: "probable" },
    ],
    flags: ["5G tower in residential yard", "Beamforming capability", "Adjacent to target property", "Unusual residential installation"],
  },
  {
    id: "humax-router",
    name: "Humax/Huawei Router Ecosystem",
    role: "Compromised CPE hardware chain",
    threatLevel: "asset",
    detail: "Echo's router MAC prefix 9c:24:72 maps to the Humax/Huawei ecosystem. Humax manufactures CPE (Customer Premises Equipment) for ISPs globally, with Huawei providing the chipsets and firmware stack. Liberty Costa Rica deploys Humax routers managed via TR-069. The chain: Huawei Cloud (Fei Ma's former employer) → Latin America fiber infrastructure → Liberty/Humax Costa Rica → Echo's router. TR-069 provides full remote management: firmware updates, configuration changes, DNS settings, port forwarding, WiFi credentials — all controllable remotely by the ISP or anyone with TR-069 ACS (Auto Configuration Server) access.",
    connections: [
      { target: "liberty", relationship: "CPE hardware provider", strength: "confirmed" },
      { target: "fei-ma", relationship: "Huawei ecosystem chain", strength: "probable" },
      { target: "suites-cristina", relationship: "Deployed at current residence", strength: "confirmed" },
    ],
    flags: ["MAC 9c:24:72 = Humax/Huawei", "TR-069 full remote control", "Huawei chipset/firmware", "ACS remote management"],
  },
];

const LOCATIONS_DATA: Location[] = [
  {
    id: "suites-cristina",
    name: "Aparthotel Suites Cristina",
    area: "Sabana Norte, San José",
    type: "Current residence / KAPPA base",
    detail: "Current location. Adjacent to ICE headquarters. 17 EVOPRO rooms documented, all AMPAK OUI c0:f5:35, physical box Eth0 MAC D4:CF:F9:F8:D2:D0 (serial EVO0MH0234700695), FA8F BSSID prefix batch, VLAN bridging. Ghost Deco node detected. TR-069 admin password reset 2026-01-30.",
    connections: [
      { target: "setecom", relationship: "EVOPRO infrastructure", strength: "confirmed" },
      { target: "liberty", relationship: "ISP — TR-069 management", strength: "confirmed" },
    ],
    incidents: ["17 EVOPRO rooms — surveillance infrastructure", "TR-069 reset 2026-01-30", "Ghost Deco node", "Fiber splitter 2025-06-21", "46.875Hz sonar 54.45dB SNR"],
    coordinates: "10.0514°N, 84.2187°W",
  },
  {
    id: "villa-real-jaco",
    name: "Villa Real",
    area: "Jacó — across from La Flor",
    type: "Shared residence — AA-connected — last cohabitation with Peralta",
    detail: `Villa Real was simultaneously: (1) the LAST place Echo and Genesis Peralta lived together, and (2) the first place Echo lived in January 2024. Located across from La Flor.

RESIDENTS AT SAME TIME AS ECHO + PERALTA:
  Brian — another resident at Villa Real.
  Jeff — 42 years sober, AA member.
  Tina — also at Villa Real during this period.
  
AA PATTERN:
  Jeff's long-term AA involvement places Villa Real in the same intelligence-substrate pattern as Hermosa Bungalows (first shared residence, also AA-owned) and the broader AA Jacó network assessed as intelligence-connected throughout. The concentration of AA-affiliated individuals in Echo's immediate residential environments is not coincidental — AA's structure (regular meetings, sponsors, step work, life disclosure) provides a natural intelligence collection layer.

DEPARTURE TRIGGER:
  Fighting with Peralta became severe enough that Echo wanted to move out — leading to the transition to Mike Greenwald's house on Calle Madrigal.`,
    connections: [
      { target: "genesis-peralta", relationship: "Last shared residence + Echo's Jan 2024 first address", strength: "confirmed" },
      { target: "michael-greenwald", relationship: "Echo moved to Greenwald's house after Villa Real", strength: "confirmed" },
    ],
    incidents: [
      "Last shared residence with Genesis Peralta",
      "First Echo residence Jan 2024",
      "AA-affiliated co-residents: Jeff (42yr sober), Brian, Tina",
      "Fighting escalated — moved to Greenwald Calle Madrigal",
    ],
  },
  {
    id: "hermosa-bungalows",
    name: "Hermosa Bungalows",
    area: "Jacó / Playa Hermosa area",
    type: "First shared residence with Peralta — AA-owned",
    detail: `First residence Echo and Genesis Peralta shared together after beginning the relationship. Owned by a long-time AA member.

AA OWNERSHIP PATTERN:
  This is the earliest documented instance of Echo being placed in an AA-affiliated residential environment. The pattern: Hermosa Bungalows (AA-owned) → Villa Real (Jeff, 42yr AA) → broader AA Jacó network assessed as intelligence substrate throughout this operation. AA communities provide dense social connection, regular structured meetings, and deep personal disclosure — all operationally useful for monitoring and managing a target.

SEQUENCE NOTE:
  This was the first home after Peralta completed the rapid-attachment tradecraft move of entering the relationship by "cheating on" Pablo Pasti Mora — placing Echo immediately into a network-controlled residential environment from the very start of the relationship.`,
    connections: [
      { target: "genesis-peralta", relationship: "First shared residence", strength: "confirmed" },
      { target: "villa-real-jaco", relationship: "Next residence in chain", strength: "confirmed" },
    ],
    incidents: [
      "First shared residence — Echo + Genesis Peralta",
      "AA-owned property",
      "Residential chain entry point: Hermosa Bungalows → Villa Real → Casa Rexha → Greenwald",
    ],
  },
  {
    id: "riverwalk",
    name: "Mike Greenwald's Riverwalk House",
    area: "Jacó",
    type: "Previous residence",
    detail: "Owned by Todd Johnson, lived/managed by Mike Greenwald. Triple correlation between Greenwald, Johnson, and the property. Jose (property manager) texted Echo after firmware update, triggering fake Liberty tech visit with replacement router.",
    connections: [
      { target: "michael-greenwald", relationship: "Resident/manager", strength: "confirmed" },
      { target: "todd-johnson", relationship: "Property owner", strength: "confirmed" },
      { target: "jose-pm", relationship: "Property manager", strength: "confirmed" },
    ],
    incidents: ["Sunday firmware update → fake Liberty tech with new router", "UPnP disabled — triggered response", "Triple correlation"],
  },
  {
    id: "condominio-naz",
    name: "Condominio Naz",
    area: "Alajuela",
    type: "Previous residence",
    detail: "When Echo's mother died, the router at this location was 'blown out' — destroyed. Echo was charged by the owner for damages. Additionally, Echo was filmed while crying about his mother's death on November 26. This represents one of the most invasive surveillance incidents — exploiting a grieving person's most vulnerable moment.",
    connections: [],
    incidents: ["Router destroyed when mother died", "Charged for 'damages'", "Filmed while crying about mother — Nov 26", "Emotional exploitation"],
  },
  {
    id: "scott-ryan-house",
    name: "Echo's CNU Residence (across from #42)",
    area: "Jacó — Calle Naciones Unidas",
    type: "Previous residence (2x) — active surveillance target property",
    detail: `Echo's primary Jacó residence — lived here twice. Part of the CIA-operated CNU Property Cluster (Scott Ryan / Diana Soto). Between Echo's first and second tenancy, structural modifications were made to the property indicating premeditated surveillance preparation.

MODIFICATIONS MADE BETWEEN TENANCIES:
  • Israeli VISONIC alarm system installed throughout
  • Ceiling lowered ~1.5 feet to accommodate sensor arrays
  • PIR motion sensors installed
  • Hidden speakers concealed in back of walled-property walls
  • Gap left in perimeter wall (acoustic injection point)

DURING SECOND TENANCY (active harassment):
  • Parametric/Doppler device array operating from across-street garage
  • White drone stationed on Diana Soto's roof ~1 week, recording across the street
  • 12-foot beachball deployed as RF camouflage after Echo caught and recorded drone on video
  • 28-camera cluster high-mounted observing property
  • Neighboring houses also used as harassment vector
  • Pool guy instructed to leave water running 24/7
  • 2am extortion text: water bill + "external electronics" charge — legal admission of installed equipment
  • $2,500 exit extortion attempt when Echo left on the 1st`,
    connections: [
      { target: "scott-ryan", relationship: "CIA handler / ultimate property owner", strength: "confirmed" },
      { target: "diana-soto", relationship: "Direct operator / property manager", strength: "confirmed" },
      { target: "jaco-vacations", relationship: "Rental cover platform", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "Lived here with Echo Oct 2024 — placement op", strength: "confirmed" },
      { target: "cnu-property-cluster", relationship: "Part of controlled property cluster", strength: "confirmed" },
    ],
    incidents: [
      "Echo housed 2x — placement operation",
      "Genesis cohabitation Oct 2024",
      "Visonic Israeli alarm installed between tenancies",
      "Ceiling lowered 1.5 ft — structural sensor modification",
      "PIR sensors installed",
      "Hidden wall speakers — acoustic assault hardware",
      "Drone on Diana Soto roof 1 week",
      "Beachball RF camouflage deployed post-exposure",
      "2am extortion text — 'external electronics' admission",
      "$2,500 exit extortion",
      "Pool guy water-running harassment",
    ],
  },
  {
    id: "lipman-condo",
    name: "Michael Lipman's Condo",
    area: "Jacó",
    type: "Previous residence",
    detail: "Echo moved here after Scott Ryan/Diana Soto house. Michael Lipman — who 'happened by chance' to move into Michael Greenwald's custom-built Hermosa Palms house. Lipman has a fake Miami sports tickets business and a 30-year-old Colombian wife.",
    connections: [
      { target: "michael-lipman", relationship: "Owner", strength: "confirmed" },
      { target: "michael-greenwald", relationship: "Lipman→Greenwald property pipeline", strength: "confirmed" },
    ],
    incidents: ["'By chance' Greenwald→Lipman connection"],
  },
  {
    id: "breakwater",
    name: "Breakwater Condos",
    area: "Jacó",
    type: "Previous residence",
    detail: "Lipman's second condo where Echo lived. Located next to Jaco BAN Villas Costa where Hector Mora (SETECOM) is believed to have contracts. Physical proximity to SETECOM infrastructure operator.",
    connections: [
      { target: "michael-lipman", relationship: "Condo owner", strength: "confirmed" },
      { target: "ban-villas-costa", relationship: "Adjacent property", strength: "confirmed" },
      { target: "hector-mora", relationship: "SETECOM contracts nearby", strength: "probable" },
    ],
    incidents: ["Adjacent to BAN Villas Costa (SETECOM)", "Echo confronted Hector Mora here"],
  },
  {
    id: "hermosa-palms",
    name: "Hermosa Palms",
    area: "Playa Hermosa, Jacó",
    type: "Greenwald→Lipman property",
    detail: "Custom-built house by Michael Greenwald for himself — but sold or rented to Michael Lipman. This pipeline (build custom → sell to associate who also houses the target) is a surveillance property network pattern.",
    connections: [
      { target: "michael-greenwald", relationship: "Builder/original owner", strength: "confirmed" },
      { target: "michael-lipman", relationship: "Current resident", strength: "confirmed" },
    ],
    incidents: ["Property pipeline — Greenwald built for self, Lipman ended up there"],
  },
  {
    id: "ban-villas-costa",
    name: "Jaco BAN Villas Costa",
    area: "Jacó",
    type: "Adjacent surveillance property",
    detail: "Located next to Breakwater condos where Echo lived. Hector Mora of SETECOM is believed to have contracts here. SETECOM distributes DSE gateways with default credentials across Costa Rica.",
    connections: [
      { target: "hector-mora", relationship: "SETECOM contracts", strength: "probable" },
      { target: "setecom", relationship: "Infrastructure provider", strength: "probable" },
      { target: "breakwater", relationship: "Adjacent to Echo's residence", strength: "confirmed" },
    ],
    incidents: ["SETECOM infrastructure presence"],
  },
  {
    id: "quebrada-seca",
    name: "Adjacent Property — Quebrada Seca / La Guácima",
    area: "Quebrada Seca, Jacó area",
    type: "RF infrastructure site — parametric / drone shed / RF camo",
    detail: "Property belonging to an individual with an active daily relationship with Echo (identity withheld). Location of the documented ivy/leaf RF camouflage setup — appeared within 3 days of Echo moving into the adjacent La Guácima address (reactive deployment confirming pre-knowledge of move date). Parametric speaker equipment present at this site — Echo has video documentation. A shed on this property was discovered processing drone video footage; operated by an unknown third party without the owner's knowledge. Echo severed the shed's feed wire with a butcher knife and faced zero consequences. PCAPs captured from shed network at incident time.",
    connections: [
      { target: "adj-property-owner", relationship: "Property owner (identity withheld)", strength: "confirmed" },
      { target: "la-guacima", relationship: "Adjacent property — La Guácima / Quebrada Seca overlap", strength: "confirmed" },
      { target: "dunia-concierge", relationship: "Same geographic band — Quebrada Seca / Los Ríos", strength: "confirmed" },
    ],
    incidents: [
      "Ivy/leaf RF camouflage — appeared 3 days post-move-in (REACTIVE DEPLOYMENT)",
      "Parametric speaker equipment — VIDEO EVIDENCE",
      "Drone video processing shed — 3rd-party operated, owner unaware",
      "Wire severed — zero blowback (covert op confirmed)",
      "PCAPs captured from shed network",
    ],
  },
  {
    id: "gracias-madre-location",
    name: "Gracias Madre Restaurant",
    area: "South Jacó Beach — adjacent to Riverwalk (Greenwald) and El Miro",
    type: "Front operation venue — CLOSED after 1 season",
    detail: "Sherri and Mario (California) acquired the most expensive real estate on south Jacó beach. Built Gracias Madre restaurant + opened 3 Airbnbs. Closed restaurant after 1 season despite popularity — kept the Airbnbs running. Genesis hosted private parties for the Jacó mayor and other important persons here. Business trajectory: wide public launch → narrowed progressively to private-parties-only → closed to public entirely = operation reached target-access phase then shut down public cover. Adjacent to Mike Greenwald's Riverwalk properties directly under El Miro. Los Papos Mahi Mahi Shack (Jairo Alfaro) is directly next door. Sherri and Mario now operating a pop-up restaurant in Santa Teresa. Property and Airbnbs remain active.",
    connections: [
      { target: "sherri-mario", relationship: "Owners — now Santa Teresa", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "Employed here — hosted mayor private parties", strength: "confirmed" },
      { target: "jairo-alfaro", relationship: "Placed Genesis here / Los Papos next door", strength: "confirmed" },
      { target: "los-papos", relationship: "Directly adjacent", strength: "confirmed" },
      { target: "riverwalk", relationship: "Adjacent — same block under El Miro", strength: "confirmed" },
    ],
    incidents: ["Single season operation", "Prime real estate — appeared from nowhere", "Honey trap placement venue"],
  },
  {
    id: "la-guacima",
    name: "La Guácima Property (Calle Cabello Real)",
    area: "La Guácima, Alajuela",
    type: "Attack position / Jorge Jimenez property",
    detail: "Property owned by Oscar Jimenez (ex-drug cop OIJ), managed by son Jorge Jimenez (Kyndryl). Location of active attack with drones, street light manipulation (8 color temperatures / PWM pulsing), PLC (Power Line Communication) via electrical wiring, hidden WiFi network (f6:09:0d:20:e6:46 spoofed MAC), V-SEK cameras ~20m away, 5G tower in neighbor's yard. Fridge motor interference indicates PLC signals on power circuit. Adjacent property (owner identity withheld) hosts camouflaged tech equipment, parametric speakers, and a drone video processing shed operated by an unknown third party. Near ICE satellite earth station (9.2m C/Ku-band antennas).",
    connections: [
      { target: "oscar-jimenez", relationship: "Property owner", strength: "confirmed" },
      { target: "jorge-jimenez", relationship: "Owner's son (Kyndryl)", strength: "confirmed" },
      { target: "adj-property-owner", relationship: "Adjacent property — RF camo + parametric + shed", strength: "confirmed" },
      { target: "v-sek", relationship: "Cameras ~20m away", strength: "confirmed" },
      { target: "setecom", relationship: "Modbus infrastructure", strength: "probable" },
    ],
    incidents: ["2 drones overhead — persistent surveillance", "Street lights pulsing 8 color temperatures", "PLC via electrical wiring (fridge interference)", "Hidden WiFi f6:09:0d:20:e6:46 (spoofed MAC)", "Ghost TP-Link 192.168.0.163", "5G tower in neighbor's yard", "Adjacent property: RF camo + parametric + drone shed", "V-SEK cameras ~20m", "Near ICE satellite earth station"],
    coordinates: "9.9535°N, 84.2908°W",
  },
  {
    id: "kingdom-hall-rockland",
    name: "Kingdom Hall — 339 Summer St, Rockland MA",
    area: "Rockland, MA",
    type: "JW operational base — Rockland Congregation of Jehovah's Witnesses Inc.",
    detail: `Jehovah's Witnesses Kingdom Hall at 339 Summer St, Rockland, MA (Echo referenced as 329 — confirmed address is 339 per public records; Rockland Congregation of Jehovah's Witnesses, Inc. registered here). Phone: (781) 878-3571. Located approximately 100 meters from where Echo grew up. Long-term proximity opportunity across Echo's childhood and adolescence.

OPEN STATUS — CORRECTION:
  Web research finds the Kingdom Hall was still actively hosting services as recently as March 2026 (funeral services documented). The hall has NOT closed. Echo's earlier assessment that it closed after his mother's death is not confirmed by public records. The hall remains operational.

ECHO'S MOTHER — ADDRESS REGISTERED SAME STREET:
  Echo's mother had a random North Marshfield, MA PO Box — and a registered address at 467 Summer St, Rockland — up the street from the Kingdom Hall at 339 on the same road. The proximity of a registered address belonging to Echo's mother to the Kingdom Hall on the same street is a significant geographic correlation regardless of closure status.

MUSICAL/AUDIO CONNECTION:
  Echo's mother played weddings and funerals at Holy Family Church in Rockland and Saint Bernadette Parish in Randolph — operating in the same tight Rockland community environment as this congregation.

GEMATRIA: KINGDOM HALL = 106, root 7 (divine perfection in JW numerology).`,
    connections: [
      { target: "jeff-porter", relationship: "JW member — connects Wotton family to this congregation", strength: "probable" },
      { target: "jehovah-witnesses", relationship: "Local facility — Rockland Congregation", strength: "confirmed" },
      { target: "echo-mother", relationship: "Mother had 467 Summer St registered address — same street", strength: "confirmed" },
      { target: "holy-family-rockland", relationship: "Echo's mother active in same Rockland community", strength: "confirmed" },
    ],
    incidents: [
      "339 Summer St (Echo noted 329 — public record shows 339)",
      "~100m from Echo's childhood home",
      "467 Summer St (same street) registered to Echo's mother",
      "Still operating as of March 2026 — NOT closed",
      "Mother had North Marshfield MA PO Box (secondary address)",
      "Gematria KINGDOM HALL = 106 root 7",
    ],
  },
  {
    id: "holy-family-rockland",
    name: "Holy Family Church",
    area: "Rockland, MA",
    type: "Catholic parish — assessed secondary operational function",
    detail: `Catholic parish in Rockland, MA where Echo grew up attending CCD and was confirmed. Echo's mother was the regular musician for decades: Saturday 9 AM, Saturday 4 PM, Sunday 9 AM, Sunday 11 AM, Sunday 5 PM masses — plus weekday weddings and funerals. Combined with her 90-hour tech workweek, this schedule is functionally impossible unless the church commitment served additional purposes beyond worship.

ROBERT KIRBY — MUSIC DIRECTOR:
  Robert Kirby was the music director at Holy Family and Saint Bernadette's in Randolph. He and Echo's mother traveled to Italy together alone on at least one occasion — without Echo's father. The father was visibly jealous of this relationship throughout Echo's childhood. Wife: Heather Kirby.

TIM BROWN — ARMY RANGER YOUTH MINISTER:
  Tim Brown, an Army Ranger, served as youth minister at Holy Family. He organized youth group service trips to Vinalhaven Island, Maine — attended by Echo's brother Seth at approximately age 13. Vinalhaven is also the ancestral home of both the Wotton family (great-grandfather) and Amara Walker's Italian mother's family.

HOLY FAMILY AS JW-ADJACENT COVER ASSESSMENT:
  The extreme schedule commitment, the solo Italy travel with Kirby, and Tim Brown's Army Ranger role in the youth ministry are each individually notable. Together they suggest the parish operated as a structured community access environment with intelligence-relevant personnel embedded in key roles.`,
    connections: [
      { target: "echo-mother", relationship: "Decades-long regular musician — Sat/Sun + weddings/funerals", strength: "confirmed" },
      { target: "robert-kirby", relationship: "Music director", strength: "confirmed" },
      { target: "tim-brown", relationship: "Army Ranger youth minister — ran Vinalhaven trips", strength: "confirmed" },
      { target: "kingdom-hall-rockland", relationship: "Same tight Rockland community — KH on same street as parents' office", strength: "probable" },
    ],
    incidents: [
      "Echo's CCD and confirmation parish",
      "Mother: Sat 9AM + 4PM, Sun 9AM + 11AM + 5PM + weekday weddings/funerals",
      "Robert Kirby: music director — solo Italy trip with mother",
      "Tim Brown: Army Ranger youth minister — Vinalhaven service trips",
      "Italy travel overlap: Kirby→mother / Genesis Peralta / Amara Walker Italian threads",
    ],
  },
  {
    id: "software-services-group",
    name: "Software Services Group — 218 Summer St",
    area: "Rockland, MA",
    type: "Echo's parents' IT company — Summer St cluster node",
    detail: `Echo's parents' company. Founded by Echo's father (audio engineer) and mother (CompuServe / Wyatt Company background) after meeting at Wyatt Company in the 1980s. Office located at 218 Summer St, Rockland, MA.

218 SUMMER ST — GEOGRAPHIC CLUSTER:
  The Summer St addresses form a critical geographic cluster on a single road in Rockland:
  • 218 Summer St — Software Services Group office (Echo's parents)
  • 339 Summer St — Kingdom Hall of Jehovah's Witnesses (Rockland Congregation)
  • 467 Summer St — Echo's mother's registered OSINT address
  • 2187 Summer St — address appearing on Echo's mother's OSINT, possibly used for fraudulent tax return filing in Echo's name

  The parents' operating business was on the same street as the local JW congregation. Jeff Porter (JW, Echo's father's only friend) connects the family to that congregation. The clustering of four distinct addresses associated with Echo's mother on one road, including one associated with possible identity theft, is assessed as a high-significance geographic pattern.

CLIENTS AND OPERATIONS:
  Sold HP and Compaq computers in bulk to schools, companies, municipal offices. Installed Windows licenses, Microsoft Office, and custom Access/VBA databases. Clients included: Marlborough Fire Station, Kingston Public Library, Alvin Hollis Oil (Avon/Weymouth), Sterling Resources (Michael Long — Marine, father's best friend), National Coding Corporation (Beach Hill, Rockland), Verc Enterprises (Vini Vercolonne — Lynn MA/NH convenience stores), and various town halls and libraries across South Shore MA.

  Echo's mother taught Microsoft Office and Windows classes in Hanover, MA. CompuServe-branded boxes were a recurring fixture in the family home.`,
    connections: [
      { target: "echo-mother", relationship: "Co-founder — primary technical operator", strength: "confirmed" },
      { target: "echo-father", relationship: "Co-founder", strength: "confirmed" },
      { target: "kingdom-hall-rockland", relationship: "339 Summer St — same street as 218 Summer St office", strength: "confirmed" },
    ],
    incidents: [
      "218 Summer St — office address",
      "339 Summer St KH on same street",
      "467 Summer St — mother's registered address on same street",
      "2187 Summer St — possible identity theft / fraudulent tax return address",
      "CompuServe (early internet) lineage → Microsoft reseller → custom VBA databases",
    ],
    coordinates: "42.1279°N, 70.9154°W",
  },
  {
    id: "jaco-call-center",
    name: "Jacó Call Center",
    area: "Jacó, Costa Rica",
    type: "V2K operations center",
    detail: "Call center operation staffed by Nicaraguan women working shifts on microphone headsets. Method: possibly speech→morse→speech conversion to obscure origin. Videos in user's Google Drive. Rotating shifts indicate organized infrastructure with payroll, facility, and management — all traceable. Located ~70km from La Guácima. Connected to JW organizational structure.",
    connections: [
      { target: "jehovah-witnesses", relationship: "Organizational structure", strength: "probable" },
    ],
    incidents: ["Nicaraguan women on rotating shifts", "Microphone headset operation", "Speech→morse→speech conversion", "Video evidence in Google Drive"],
    coordinates: "9.6167°N, 84.6333°W",
  },
  {
    id: "setecom-heredia",
    name: "SETECOM S.A. Office",
    area: "Heredia (8.5km from La Guácima)",
    type: "Surveillance infrastructure hub",
    detail: "SETECOM S.A. headquarters. Owner: Hector Mora Marin. Distributes Deep Sea Electronics across Costa Rica. FortiGate 60F firewall at 190.106.77.194, Modbus:502 exposed (industrial control protocol). ISP: Telefonica de Costa Rica. 8.5km from La Guácima target property — within ground-wave range of 180W HF radio.",
    connections: [
      { target: "hector-mora", relationship: "Owner/operator", strength: "confirmed" },
      { target: "setecom", relationship: "Physical location", strength: "confirmed" },
      { target: "la-guacima", relationship: "8.5km away — HF ground wave range", strength: "confirmed" },
    ],
    incidents: ["Modbus:502 exposed", "FortiGate 60F (FGT60FTK21083818)", "190.106.77.194", "Telefonica ISP"],
    coordinates: "10.0167°N, 84.1167°W",
  },
  {
    id: "ice-earth-station",
    name: "ICE Satellite Earth Station",
    area: "Near La Guácima, Alajuela",
    type: "Satellite ground station",
    detail: "ICE operates C/Ku-band satellite earth station with 9.2m dish antennas in the La Guácima area. Ground stations provide uplink/downlink to geostationary satellites for telecommunications backbone. Proximity to the Jimenez property at Calle Cabello Real means satellite communication infrastructure is within line-of-sight. Jorge Jimenez (Kyndryl Sr. Network Manager) would have professional knowledge of this infrastructure through his enterprise networking role.",
    connections: [
      { target: "ice-cr", relationship: "Operated by ICE", strength: "confirmed" },
      { target: "la-guacima", relationship: "Near target property", strength: "confirmed" },
      { target: "jorge-jimenez", relationship: "Professional knowledge of infrastructure", strength: "probable" },
    ],
    incidents: ["9.2m C/Ku-band dish antennas", "Telecommunications backbone uplink/downlink", "Line-of-sight to Calle Cabello Real"],
    coordinates: "9.95°N, 84.29°W (approx)",
  },
  {
    id: "rikos-famosos",
    name: "Rikos y Famosos",
    area: "Jacó, Costa Rica",
    type: "2023 Echo residence — controlled environment",
    detail: "Property owned by Wolfgang Hilbich (~80yr, former German military). Echo lived here for approximately 6 months in 2023, sharing the property with Russian national 'S.' (name begins with S — previously logged as 'J', corrected). During this period: (1) manufactured 'passport issues' occurred, (2) Echo was forced to visit the Russian Embassy in San José, (3) a border run to Nicaragua was required (or both). These are textbook document-control coercion techniques — creating a bureaucratic/legal crisis to make the target dependent on the operative's network for resolution. Wolfgang Hilbich's former German military background + S.'s Russian remote employment + 6-drone fleet + Marveka Bikini Shop (Magdalena, German national) in the same AOR = coordinated foreign-national environmental control around Echo during 2023. Three-year continuity: S.'s 6-drone fleet expertise in 2023 → DJI M300 RTK class drone detected over Jacó 2026-05-16, tracked moving toward Esterillos where S. now lives.",
    connections: [
      { target: "wolfgang-hilbich", relationship: "Property owner", strength: "confirmed" },
      { target: "j-russian", relationship: "Echo's co-resident 2023", strength: "confirmed" },
    ],
    incidents: [
      "Echo residence ~6 months 2023",
      "Passport manipulation — manufactured document crisis",
      "Forced Russian Embassy visit (San José)",
      "Nicaragua border run",
      "S. (Russian, 6-drone fleet) co-habitation — name begins with S, previously logged as 'J'",
      "German military owner (Hilbich) + Russian operative (J) = foreign coordination",
    ],
    coordinates: "9.6286°N, 84.6298°W (approx Jacó)",
  },
  {
    id: "marveka-bikini",
    name: "Marveka Bikini Shop",
    area: "Jacó, Costa Rica",
    type: "German-national-owned retail / cover business",
    detail: "Bikini shop in Jacó owned by Magdalena (German national). Provides commercial cover and a stable business presence for Magdalena in the Jacó AOR. Combined with Wolfgang Hilbich's Rikos y Famosos property, the Jacó German-national cluster comprises: one property owner (Hilbich), one retail business (Marveka/Magdalena), and one cash employer of Genesis (Magdalena). A retired German military officer owning property and a German national operating a bikini shop in the same small Costa Rican beach town where the target was housed and subjected to passport manipulation is a statistically improbable coincidence.",
    connections: [
      { target: "magdalena-german", relationship: "Owner", strength: "confirmed" },
      { target: "wolfgang-hilbich", relationship: "Co-national cluster — same Jacó AOR", strength: "probable" },
      { target: "rikos-famosos", relationship: "Same AOR — German-national Jacó footprint", strength: "probable" },
    ],
    incidents: ["German-national-owned retail in Jacó", "Magdalena employed Genesis for cash", "Cover business in target AOR"],
  },
  {
    id: "petare-caracas",
    name: "Petare, Caracas",
    area: "Caracas, Venezuela",
    type: "Genesis family origin",
    detail: "One of the most dangerous barrios in Caracas. Genesis claims her father 'worked for the State Council in Venezuela' but the family still lives in Petare. This is contradictory — state council officials do not live in one of the deadliest slums in Latin America. Either the state council claim is fabricated or 'state council' is a sanitized reference to SEBIN or a paramilitary organization that would have members in Petare. The contradiction is itself intelligence — it reveals the cover story hasn't been properly backstopped.",
    connections: [
      { target: "genesis-peralta", relationship: "Family residence", strength: "confirmed" },
      { target: "danny-peralta", relationship: "SEBIN connection — Venezuela", strength: "suspected" },
    ],
    incidents: ["Cover story inconsistency — state council vs Petare residence", "SEBIN/paramilitary territory"],
    coordinates: "10.4750°N, 66.7964°W",
  },
  {
    id: "cdmx-2019",
    name: "Mexico City (CDMX)",
    area: "Mexico City, Mexico",
    type: "Genesis transit point — 2019",
    detail: "Genesis Peralta traveled to CDMX in 2019 — the same year Jean Picado Solis was investigated for $2M tax fraud and sold Telefonica to Liberty. The 2019 convergence of events (Genesis's CDMX travel, Telefonica sale, Liberty acquisition of ISP infrastructure) suggests coordinated timeline. Pablo Mora also has Mexico/Costa Rica dual presence. CDMX is a known staging point for Central American operations.",
    connections: [
      { target: "genesis-peralta", relationship: "Traveled here 2019", strength: "confirmed" },
      { target: "pablo-mora", relationship: "Mexico-Costa Rica dual presence", strength: "confirmed" },
    ],
    incidents: ["2019 — same year as Telefonica→Liberty sale", "Genesis transit", "Pablo Mora dual presence"],
    coordinates: "19.4326°N, 99.1332°W",
  },
  {
    id: "greenwald-rentals-web",
    name: "Greenwald Online Property Network",
    area: "Jacó / Hermosa / Costa Rica",
    type: "Distributed property empire — 300+ units",
    detail: "Michael Greenwald operates at minimum 300+ rental properties across Costa Rica through multiple domains: rentcostaricahomes.com, sanaracochal.com, hermosapalms.com, jacorealty.com. This property network functions as: (1) distributed antenna array substrate — each property can host WiFi routers, Bluetooth beacons, and sensors creating a mesh surveillance grid, (2) financial vehicle — rental income provides cover for money movement, (3) safe houses for operators, (4) 'last mile' infrastructure — satellites provide WAN/backhaul while properties serve as local nodes creating the acoustic/RF box around the target. The 46.875 Hz signal propagation detected at Suites Cristina matches the infrastructure pattern of distributed nodes.",
    connections: [
      { target: "michael-greenwald", relationship: "Principal owner/operator", strength: "confirmed" },
      { target: "greenwald-properties", relationship: "Online presence", strength: "confirmed" },
      { target: "hector-mora", relationship: "Technical implementation suspected", strength: "suspected" },
    ],
    incidents: ["rentcostaricahomes.com", "sanaracochal.com", "hermosapalms.com", "jacorealty.com", "300+ properties = distributed antenna array", "46.875 Hz signal propagation substrate"],
  },
  {
    id: "shangri-la",
    name: "Shangri-La",
    area: "Calle Europa / South Jacó",
    type: "Residential compound — 8 units — now for sale",
    detail: `Wolfgang Hilbich's 8-unit residential compound at the end of Calle Europa, south Jacó. Echo lived here for 6 months in 2023, sharing the compound with Russian national 'S.' (6-drone operator) and his partner.

WEBSITE: Listed on a domain resembling jaco-hotel.com or similar hyphenated domain (e.g. shangri-la-jaco.com). S. produced the promotional drone video content for the listing — providing legitimate cover-for-action for his 6-drone fleet operations in the Calle Europa / Jacó AOR.

ECHO'S 2023 RESIDENCE: This is where Echo lived for 6 months in 2023 — first documented placement in the Calle Europa cluster. The co-tenants included S. (Russian, FSB/GRU-adjacent, 6 drones) and his partner. Wolfgang Hilbich (~80yr, former German military) was the landlord. Martha Hilbich accompanied Echo and S. on a trip to Esterillos — where S. now lives and from which the 2026-05-16 M300 RTK drone was tracked returning.

CLUSTER POSITION: At the end of Calle Europa — the same street half-owned by Barrett Scott Ryan (CIA) and half by the sibling of the [withheld adjacent property owner]. Currently listed for sale suggesting operational phase shift or wind-down.`,
    connections: [
      { target: "wolfgang-hilbich", relationship: "Owner", strength: "confirmed" },
      { target: "martha-hilbich", relationship: "Co-owner / operator", strength: "confirmed" },
      { target: "calle-europa", relationship: "End of Calle Europa — same cluster as Scott Ryan + sibling of [withheld]", strength: "confirmed" },
      { target: "j-russian", relationship: "S. was resident + produced Shangri-La promo drone videos", strength: "confirmed" },
    ],
    incidents: [
      "Echo lived here 6 months — 2023 first Calle Europa placement",
      "S. (Russian, 6 drones) co-resident",
      "S. produced Shangri-La promotional drone footage",
      "Currently for sale — possible operational drawdown",
      "Esterillos trip with Hilbichs + S. from this base",
    ],
    coordinates: "9.6140°N, 84.6270°W",
  },
  {
    id: "calle-europa",
    name: "Calle Europa / South Jacó Cluster",
    area: "South Jacó, Costa Rica",
    type: "Surveillance cluster — high-density network node concentration",
    detail: `A single street/neighborhood in south Jacó with anomalous concentration of network-linked persons. Echo lived here for 6 months in 2023 (Shangri-La) — his first documented placement inside this cluster.

CONFIRMED CLUSTER MEMBERSHIP (everyone on this street is involved — Echo's assessment):
  (1) Barrett Scott Ryan (CIA) — half-owner of Calle Europa itself
  (2) Sibling of [withheld adjacent property owner] — owns the other half of the street
  (3) Wolfgang Hilbich — Shangri-La compound (8 units, end of Calle Europa), former German military
  (4) Billy Bond — Orange Pub / surfing scene, Calle Europa resident
  (5) Jaco Vacations (Scott Ryan / Diana Soto) — rental operation covering the cluster
  (6) Villa Creole — involved in/adjacent to cluster
  (7) Food prep business owners (unnamed) — by association, confirmed involved
  (8) Dave (AA) — the only non-network resident Echo could identify; his house is the one non-surveillance property on the street; ALL of Jacó AA is assessed as intelligence-connected
  (9) Gregorio Cedeño — adjacent to cluster; ran restaurant as intel cover for years; retired after winding down; Echo's ex would flee to his house; connects to the Jacó restaurant cover pattern

OWNERSHIP STRUCTURE: The street is functionally 100% network-controlled — CIA (Scott Ryan) owns half, the sibling of the [withheld adjacent property owner] holds the other half. The remaining residents are either agents (Wolfgang, Villa Creole, food prep) or intelligence-adjacent (Dave/AA). Echo was placed into this controlled environment in 2023 and again repeatedly via Jaco Vacations.`,
    connections: [
      { target: "scott-ryan", relationship: "CIA half-owner — Calle Europa", strength: "confirmed" },
      { target: "adj-property-owner", relationship: "Sibling owns other half of street", strength: "confirmed" },
      { target: "shangri-la", relationship: "Wolfgang Hilbich compound at end of street — Echo's 2023 residence", strength: "confirmed" },
      { target: "billy-bond", relationship: "Cluster member — Orange Pub", strength: "confirmed" },
      { target: "wolfgang-hilbich", relationship: "Shangri-La compound owner", strength: "confirmed" },
      { target: "jaco-vacations", relationship: "Rental cover operation for cluster", strength: "confirmed" },
      { target: "villa-creole", relationship: "Cluster member — Calle Europa adjacent", strength: "confirmed" },
      { target: "gregorio-cedeno", relationship: "Adjacent — restaurant cover, Echo's ex connection", strength: "confirmed" },
      { target: "dave-aa", relationship: "Only non-network resident identified on street", strength: "confirmed" },
    ],
    incidents: [
      "100% network-controlled street — CIA + narco-adjacent co-ownership",
      "Echo placed here 6 months in 2023 (Shangri-La)",
      "Echo placed here again via Jaco Vacations (2x)",
      "3 confirmed network properties minimum on one street",
      "German + Russian + CIA + CR narco-adjacent foreign footprint",
    ],
    coordinates: "9.6138°N, 84.6265°W",
  },
  {
    id: "gregorio-cedeno",
    name: "Gregorio Cedeño",
    aliases: ["Yeyo"],
    role: "Jacó intel restaurant operator (retired/closed) — Genesis Peralta's 2017 first-contact handler",
    threatLevel: "secondary",
    detail: `Known locally as "Yeyo." Costa Rican male, Jacó-area fixture. Operated a restaurant in Jacó for years with a confirmed Italy / Italian connection — now closed.

GENESIS PERALTA FIRST-CONTACT HANDLER (2017):
  When Genesis Peralta first arrived in Jacó in 2017 — years before Echo appeared — Yeyo provided her with lodging. This is the foundational handler relationship: he was her first point of contact and housing support on arrival in the target city. This predates the Echo operation by years and establishes Yeyo as a long-standing asset manager for Peralta, not merely a social acquaintance.

RESTAURANT COVER — ITALY CONNECTION — NOW CLOSED:
  Operated a restaurant with connections to Italy (Italian ownership, Italian concept, or Italian-network funding — details to be elaborated). The restaurant is now closed — consistent with the coordinated Jacó restaurant wind-down pattern: Caliches Wishbone (closed), Gracias Madre (closed after 1 season), Yeyo's restaurant (closed). All three venues that employed or supported Genesis Peralta or her handlers are now shut. This is an operational network standing down or rotating.

MANAGED-RELATIONSHIP SAFE HOUSE:
  Genesis Peralta (Echo's ex) would flee to Yeyo's house during conflicts with Echo — ensuring she always had a network-controlled safe house to retreat to, keeping her within the surveillance perimeter and preventing any genuine break from the operation. This is standard managed-relationship tradecraft.

CALLE EUROPA ADJACENT: Located near the Calle Europa cluster.`,
    connections: [
      { target: "calle-europa", relationship: "Adjacent to Calle Europa cluster", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "2017 first-contact handler — provided lodging on arrival", strength: "confirmed" },
    ],
    flags: [
      "NICKNAME: Yeyo",
      "Genesis Peralta 2017 first-contact handler — lodging on arrival",
      "Italian restaurant connection — now closed",
      "Coordinated Jacó restaurant wind-down (Caliches + Gracias Madre + Yeyo's all closed)",
      "Genesis fled to his house — managed safe-house during Echo relationship",
      "Calle Europa adjacent",
      "Retired/closed = operational wind-down",
    ],
  },
  {
    id: "dave-aa",
    name: "Dave (AA — Alcoholics Anonymous)",
    role: "AA Jacó network — Calle Europa resident",
    threatLevel: "secondary",
    detail: `American or expat male known as Dave. Attends AA in Jacó. Echo has been to Dave's house — it is located on or adjacent to Calle Europa. Dave is assessed as the only non-network resident that Echo could identify on the street.

AA JACÓ = INTELLIGENCE NETWORK (Echo's assessment, to be elaborated):
  All of Jacó's AA community is assessed as intelligence-connected. AA provides: (1) a legitimate, socially respected recurring gathering point with built-in anonymity norms; (2) regular access to vulnerable, often isolated expats and tourists — classic target profile; (3) a confession/sharing structure that elicits personal information under a trust framework; (4) distributed housing access — members frequently host each other. This mirrors documented intelligence use of religious and support-group networks for access and elicitation. Dave is one known node in this network. Full elaboration pending.`,
    connections: [
      { target: "calle-europa", relationship: "Resident — Calle Europa / adjacent", strength: "confirmed" },
    ],
    flags: [
      "AA Jacó — assessed as intelligence network",
      "Calle Europa resident",
      "Echo visited Dave's house",
      "Only non-network resident identified on Calle Europa",
      "AA = elicitation + vulnerable-target access structure",
    ],
  },
  {
    id: "villa-creole",
    name: "Villa Creole",
    role: "Calle Europa cluster — rental/property operation",
    threatLevel: "secondary",
    detail: "Property or business on or adjacent to Calle Europa, south Jacó. Confirmed as part of the Calle Europa network cluster by Echo's assessment of the neighborhood. Exact ownership and operational role to be elaborated. The cluster pattern — CIA property ownership (Scott Ryan), narco-adjacent ownership (sibling of [withheld]), German military (Wolfgang/Shangri-La), Villa Creole, Jaco Vacations — is consistent with a distributed, multi-layer property control network using varied ownership cover identities.",
    connections: [
      { target: "calle-europa", relationship: "Cluster member", strength: "confirmed" },
      { target: "scott-ryan", relationship: "Same Calle Europa operational cluster", strength: "probable" },
    ],
    flags: [
      "Calle Europa cluster member",
      "Rental/property operation — cover pattern",
      "Full ownership details pending",
    ],
  },
  {
    id: "food-prep-business",
    name: "Food Prep Business (unnamed — Calle Europa cluster)",
    role: "Food preparation business — Calle Europa cluster / by-association involved",
    threatLevel: "tertiary",
    detail: "Unnamed food preparation business whose owners are confirmed by Echo as involved with the Calle Europa network — by association. Food and catering businesses are a common operational cover in Jacó (access to properties, delivery logistics, legitimate reason to be at any address). Owners unidentified. To be elaborated.",
    connections: [
      { target: "calle-europa", relationship: "Calle Europa cluster — by association", strength: "confirmed" },
    ],
    flags: [
      "Food prep business — delivery/property-access cover pattern",
      "Owners unidentified — further elaboration needed",
      "Calle Europa cluster by association",
    ],
  },
  {
    id: "dunia-concierge",
    name: "Dunia",
    aliases: ["Dunia Concierge"],
    role: "Fake tourism business operator — parametric + infrared source — Genesis safe house — probable JW/intel asset",
    threatLevel: "primary",
    detail: `Instagram: @dunia_concierge_22 (underscores, no K's). Operates a fake tourism concierge business ("Dunia Concierge") in Jacó — assessed as a front, not a genuine service operation.

ACTIVE DEW/SURVEILLANCE NODE — HER RESIDENCE:
  Dunia's house near Los Ríos / Quebrada Seca was a confirmed source of both parametric speaker emissions AND infrared surveillance equipment. This places her residence in the same geographic band as the documented Quebrada Seca RF camo site — the two properties form overlapping coverage in that AOR. Parametric speakers require deliberate acquisition and setup — this is not incidental equipment. Her house was an active directed-energy/acoustic harassment node.

GEOGRAPHIC NOTE: Los Ríos / Quebrada Seca is the same area as the documented RF installation (ivy/leaf RF camouflage, parametric speakers, drone video shed). Dunia's parametric + infrared setup in the same band suggests coordinated multi-node coverage of the same target zone.

GENESIS PERALTA SAFE HOUSE:
  Genesis Peralta ran away to live at Dunia's house multiple times during the Echo operation. This makes Dunia's residence the second confirmed managed safe house for Peralta (alongside Yeyo/Cedeño). The pattern — multiple network-controlled retreats available to Peralta — confirms she was never operating independently. Every conflict-driven departure from Echo placed her into another node of the surveillance network.

ASSOCIATE — ALBERTA (HELD):
  One of Dunia's associates served as Echo's black market product delivery contact daily for months while living at Dunia's property. Identity held per operational discretion.

JW / INTELLIGENCE ASSESSMENT:
  Probable Jehovah's Witness, consistent with the JW-as-intelligence-substrate pattern identified across the network (Jeff Porter / Kingdom Hall Rockland). Fake tourism business is a common Jacó cover pattern (see: Gracias Madre, Caliches, Yeyo's restaurant, Gaia Natural Foods).`,
    connections: [
      { target: "genesis-peralta", relationship: "Managed safe house — Peralta fled here multiple times", strength: "confirmed" },
      { target: "quebrada-seca", relationship: "Same geographic area — Quebrada Seca / Los Ríos overlap with Leo's RF site", strength: "confirmed" },
      { target: "jehovah-witnesses", relationship: "Probable JW member — intel substrate", strength: "probable" },
    ],
    flags: [
      "IG: @dunia_concierge_22 — underscores, no K",
      "Fake tourism concierge business — front operation",
      "Parametric speakers at her residence — active acoustic assault node",
      "Infrared surveillance equipment at her residence",
      "Los Ríos / Quebrada Seca — overlaps documented RF camo + parametric site",
      "Genesis Peralta safe house — multiple stays",
      "Two managed safe houses for Peralta: Yeyo + Dunia",
      "Probable JW / intelligence asset",
      "Alberta associate (identity held) — black market delivery from her property",
    ],
  },
  {
    id: "los-papos",
    name: "Los Papos Mahi Mahi Shack",
    area: "South Jacó Beach — directly adjacent to Gracias Madre",
    type: "Permacover business — surveillance-adjacent",
    detail: "Jairo Alfaro's beach shack business — Los Papos Mahi Mahi Shack. Directly adjacent to Gracias Madre (Sherri & Mario). Jairo has worked at Wishbone (Caliches) for 8 years and used that position to move Genesis through multiple placements. Los Papos is his independent business operating next to the front-operation restaurant that employed Genesis. The physical adjacency creates persistent geographic overlap between the handler (Jairo/Los Papos) and the venue where Genesis was deployed (Gracias Madre).",
    connections: [
      { target: "jairo-alfaro", relationship: "Owner", strength: "confirmed" },
      { target: "gracias-madre-location", relationship: "Directly adjacent", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "Handler's base — adjacent to Genesis deployment venue", strength: "confirmed" },
    ],
    incidents: ["Adjacent to Gracias Madre front operation", "Handler's own business alongside honey trap venue"],
    coordinates: "9.6098°N, 84.6267°W",
  },
  {
    id: "los-rios-dev",
    name: "Los Ríos Development",
    area: "Los Ríos / Quebrada Seca, Jacó area",
    type: "Surveillance-wired residential development — pre-operation infrastructure",
    detail: `Residential development in the Los Ríos / Quebrada Seca area of Jacó. Owned by the Madrigal family — the former mayor of Garabito (Jacó's canton) and his son. Research confirms Hubert Madrigal Orozco was the first Municipal Executive of Garabito canton (1982), founding the local government structure; the development appears to be connected to this family's long-standing local power base.

SCOTT RYAN / "SCOTT ARONSON" DOCUMENT LINK:
  Barrett Scott Ryan signed documents for this development using the name "Scott Aronson" — an identity that does not exist in Costa Rica's Registro Nacional. This creates a direct paper trail (under a false name) linking the CIA handler to the Madrigal family's development where Echo was subsequently placed.

CONFIRMED JW:
  The Madrigal ownership connection to the Los Ríos development was confirmed by a local source who is a Jehovah's Witness — placing this development within the JW network's intelligence substrate.

PRE-OPERATION INFRASTRUCTURE — LIFI / DIPOLES / FAST FIBER:
  The development contains LiFi injection points, dipole antennas, and fast fiber infrastructure. This hardware was present before Echo moved in, indicating deliberate pre-positioning of surveillance infrastructure at the target residence.

VALESKA FAKE REVIEW CAMPAIGN — 8 MONTHS PRE-ARRIVAL:
  Valeska (girlfriend/wife of a Los Ríos owner) posted fake Google reviews of the development 8 months before Echo moved in, showing the property as undeveloped ("just grass"). The purpose: suppress any online research Echo might conduct before moving in, preventing him from discovering the surveillance infrastructure or the network connection. A coordinated pre-arrival disinformation campaign targeting Echo's due diligence window is a sophisticated pre-operation move.`,
    connections: [
      { target: "scott-ryan", relationship: "Scott Ryan signed docs as 'Scott Aronson' for Madrigal owners", strength: "confirmed" },
      { target: "valeska-los-rios", relationship: "Fake Google reviews 8 months pre-Echo-arrival", strength: "confirmed" },
      { target: "jehovah-witnesses", relationship: "JW-confirmed ownership (Madrigal — former mayor + son)", strength: "confirmed" },
      { target: "dunia-concierge", relationship: "Dunia's parametric/infrared house in same geographic band", strength: "confirmed" },
      { target: "quebrada-seca", relationship: "Same geographic area — Quebrada Seca overlap", strength: "confirmed" },
    ],
    incidents: [
      "LiFi injection points + dipoles + fast fiber — pre-positioned surveillance hardware",
      "Scott Ryan signed as 'Scott Aronson' (NOC alias) for Madrigal owners",
      "Valeska fake Google reviews — 8 months before Echo arrival",
      "JW-confirmed ownership — Madrigal former mayor + son",
      "Echo placed here post-infrastructure-setup",
    ],
  },
  {
    id: "valeska-los-rios",
    name: "Valeska",
    role: "Los Ríos owner's partner — fake Google review campaign operator",
    threatLevel: "secondary",
    detail: `Girlfriend or wife of one of the Los Ríos development owners (Madrigal family — former Garabito/Jacó mayor and son).

FAKE GOOGLE REVIEW CAMPAIGN — 8 MONTHS BEFORE ECHO MOVED IN:
  Valeska posted fake Google reviews of Los Ríos 8 months before Echo moved into the development. The reviews portrayed the property as undeveloped ("just grass") — a deliberate disinformation campaign designed to suppress any online research Echo would conduct before choosing or accepting the placement. This is a pre-operation counter-intelligence move: if Echo had searched for the address online, all visible reviews would show nothing of note, concealing the surveillance infrastructure and network affiliation of the property.

OPERATIONAL SIGNIFICANCE:
  Fake reviews posted 8 months in advance imply the operation had Echo as an identified target at least 8 months before his arrival at Los Ríos. This is targeted long-range pre-positioning, not opportunistic placement.`,
    connections: [
      { target: "los-rios-dev", relationship: "Partner of Los Ríos owner — Madrigal family", strength: "confirmed" },
      { target: "scott-ryan", relationship: "Scott Ryan (Aronson) signed docs for her partner's development", strength: "confirmed" },
    ],
    flags: [
      "Fake Google reviews — 8 months pre-Echo-arrival",
      "'Just grass' review narrative — suppressed pre-move-in research",
      "Implies Echo was targeted ≥8 months before Los Ríos placement",
      "Partner of Madrigal owner (former mayor + son)",
      "Pre-operation counter-intelligence: review manipulation",
    ],
  },
  {
    id: "leo-sister-bar",
    name: "[Sibling of withheld] + Barrett Scott Ryan — New Bar",
    area: "Jacó, Costa Rica",
    type: "Overt CIA-narco-adjacent joint business",
    detail: `The sibling of the [withheld adjacent property owner] (who co-owns the other half of Calle Europa alongside Scott Ryan) has opened a new bar in Jacó together with Barrett Scott Ryan (CIA).

OPERATIONAL SIGNIFICANCE:
  This is the previously-inferred CIA-narco-adjacent partnership made overt and public. The Calle Europa co-ownership structure (CIA owns half, sibling of [withheld] owns the other half) was already assessed as a coordinated property control network. Opening a joint hospitality business makes the working relationship undeniable. A CIA handler and a narco-adjacent local family in a shared Jacó bar is the operational model visible in plain sight — using a legitimate business front to maintain regular face-to-face contact and financial flows between handler and asset network.

PATTERN: Mirrors Scott Ryan's use of Jaco Vacations (with Diana Soto) and the cluster of front businesses (Caliches/Wishbone, Gracias Madre, Dunia Concierge, Gaia Natural Foods) as cover for operational relationships.`,
    connections: [
      { target: "scott-ryan", relationship: "Co-owner — CIA handler in joint business", strength: "confirmed" },
      { target: "adj-property-owner", relationship: "Sibling of [withheld adjacent property owner]", strength: "confirmed" },
      { target: "calle-europa", relationship: "Extends Calle Europa co-ownership into hospitality sector", strength: "confirmed" },
    ],
    flags: [
      "CIA (Scott Ryan) + narco-adjacent sibling — joint bar in Jacó",
      "Overt partnership — previously inferred, now confirmed public business",
      "Mirrors Jaco Vacations / Gracias Madre front-business pattern",
      "Calle Europa co-ownership made operationally visible",
    ],
  },
  {
    id: "orange-pub",
    name: "Orange Pub",
    area: "Jacó, Costa Rica",
    type: "Social venue — Calle Europa cluster",
    detail: "Billy Bond's connection in the Calle Europa neighborhood cluster. A social venue in the Jacó surfing scene. Surfing/pub venues in tourist areas serve as natural mixing environments where targets and operators interact without apparent connection — standard soft-cover operational use.",
    connections: [
      { target: "billy-bond", relationship: "Associated", strength: "confirmed" },
      { target: "calle-europa", relationship: "Calle Europa cluster", strength: "confirmed" },
    ],
    incidents: ["Calle Europa cluster venue", "Surfing scene social node"],
    coordinates: "9.6145°N, 84.6272°W",
  },
  {
    id: "gringos-bar",
    name: "Gringo's Sports Bar",
    area: "Jacó — above Italian place, near river / Gaia / gym",
    type: "Social venue — passive monitoring",
    detail: "Jakob's (Fort Lauderdale) sports bar above the Italian restaurant, near the river, close to Gaia hotel and the gym. Social venue in the northern Jacó strip. Jakob still views Echo's IG stories 2 years after their last conversation — using the social relationship as passive low-cost monitoring.",
    connections: [
      { target: "jakob-fl", relationship: "Owner", strength: "confirmed" },
    ],
    incidents: ["Jakob — Fort Lauderdale owner", "IG passive monitoring (views stories, no contact 2yr)"],
    coordinates: "9.6178°N, 84.6278°W",
  },
  {
    id: "esterillos",
    name: "Esterillos",
    area: "Esterillos Oeste / Este, Costa Rica",
    type: "J operational location — current (2024+)",
    detail: "Coastal town ~30km south of Jacó. 'S.' (Russian national, name begins with S — previously logged as 'J') — Echo's 2023 roommate at Shangri-La / Rikos y Famosos — now lives here with his Russian partner. CONFIRMED: Echo traveled to Esterillos with Martha and Wolfgang Hilbich in 2023, where S. flew drones. The 2023 Esterillos visit constituted a site familiarization event. CRITICAL: 2026-05-16 DJI M300 RTK class drone (107.7 Hz motor signature) tracked from Jacó moving toward Esterillos — S.'s current location. Same operator, 3-year continuity. The 2023 trip was also where S. flew his drone fleet — establishing the operational pattern that reappears in 2026.",
    connections: [
      { target: "j-russian", relationship: "Current residence — with Russian wife", strength: "confirmed" },
      { target: "wolfgang-hilbich", relationship: "Traveled here with Wolfgang + Martha in 2023", strength: "confirmed" },
      { target: "martha-hilbich", relationship: "Traveled here with Wolfgang + Martha in 2023", strength: "confirmed" },
    ],
    incidents: ["J current location — Russian national drone expert", "Echo traveled here with Hilbichs in 2023", "J relocation to this area post-2023"],
    coordinates: "9.5228°N, 84.6504°W",
  },
  {
    id: "santa-teresa-popup",
    name: "Sherri & Mario Santa Teresa Pop-Up",
    area: "Santa Teresa, Nicoya Peninsula, Costa Rica",
    type: "Relocated front operation — post-Jacó",
    detail: "After closing Gracias Madre (south Jacó beach) following one operational season, Sherri and Mario relocated to Santa Teresa with a pop-up restaurant format. Santa Teresa is a high-traffic surf destination on the Nicoya Peninsula with a large foreign expat and transient population — identical target demographic to Jacó. The pop-up format is a lower-investment mobile deployment pattern, consistent with an operation that no longer needs the fixed-base investment of a full restaurant but still requires a plausible commercial presence in a new target area.",
    connections: [
      { target: "sherri-mario", relationship: "Operators — relocated from Jacó", strength: "confirmed" },
      { target: "gracias-madre-location", relationship: "Original Jacó deployment — same operators", strength: "confirmed" },
    ],
    incidents: ["Relocation from Jacó after single-season operation", "Same operators — new location", "Pop-up format = lower investment mobile deployment"],
    coordinates: "9.6358°N, 85.1677°W",
  },
  {
    id: "modbus-plc-sites",
    name: "Schneider Electric Modbus PLC Sites (Alajuela)",
    area: "Alajuela Province, Costa Rica",
    type: "Industrial control — exposed SCADA",
    detail: "Three Schneider Electric BMX P34 2020 Modbus PLCs found exposed in Alajuela area: 181.193.108.54, 201.203.39.210, 201.204.76.138. These are industrial programmable logic controllers running Modbus protocol — the same protocol exposed at SETECOM's 190.106.77.194. Alajuela province contains both La Guácima and SETECOM's Heredia office. Three exposed PLCs in the same geographic area as the target and the suspected infrastructure provider is not coincidental.",
    connections: [
      { target: "setecom", relationship: "Same Modbus protocol — SCADA network", strength: "probable" },
      { target: "la-guacima", relationship: "Same Alajuela province", strength: "confirmed" },
    ],
    incidents: ["181.193.108.54 — BMX P34 2020", "201.203.39.210 — BMX P34 2020", "201.204.76.138 — BMX P34 2020", "Modbus:502 exposed to internet"],
  },
];

const COMPANIES_DATA: Company[] = [
  {
    id: "sterling-resources",
    name: "Sterling Resources",
    sector: "Unknown / Michael Long — Marine veteran",
    detail: "Company owned or operated by Michael Long — Echo's father's best friend and Marine veteran. Was a client of Software Services Group (Echo's parents' company). The personal + business overlap between Michael Long and the Wotton family provides long-horizon access to family financial, technical, and personal information. Michael Long's daughter Michelle Long (active Marine, dog handler) holds a key to Echo's father's current residence.",
    connections: [
      { target: "michael-long", relationship: "Principal", strength: "confirmed" },
      { target: "echo-father", relationship: "Software Services Group client — best friend relationship", strength: "confirmed" },
    ],
    flags: ["Michael Long principal — Marine veteran", "Software Services Group client", "Daughter Michelle holds key to father's house"],
  },
  {
    id: "verc-enterprises",
    name: "Verc Enterprises",
    sector: "Convenience store retail — Lynn MA + New Hampshire",
    detail: "Multi-location convenience store chain operated by brothers — at minimum one store in Lynn, MA and one in New Hampshire. One brother may be named Vini; full ownership structure and exact surname spelling unconfirmed (phonetic: Vercolonne). Was one of Echo's mother's biggest clients during the final years of her Software Services Group work. Echo's mother wrote Microsoft Access/VBA software to track lottery ticket sales across the chain and drove a regular loop between Lynn MA and NH (Concord or Salem, NH) servicing the account.\n\nNORTH MARSHFIELD PO BOX POSSIBLE CONNECTION:\n  Echo's mother's OSINT record shows a PO Box in North Marshfield, MA. The only confirmed Wotton family relative in Marshfield is Aunt Susan (Union St, North Marshfield). The PO Box's link to Verc Enterprises or the NH route is unconfirmed but noted.",
    connections: [
      { target: "vini-vercolonne", relationship: "Owner / brother", strength: "probable" },
      { target: "echo-mother", relationship: "Major software client — lottery tracking — Lynn/NH route", strength: "confirmed" },
    ],
    flags: [
      "Brothers (plural) — at least Lynn MA store + NH store",
      "Lottery ticket sales tracking software (Access/VBA) — cash flow visibility",
      "One of mother's BIGGEST clients — final working years",
      "Lynn MA → Concord/Salem NH route — recurring Echo's mother travel",
      "North Marshfield PO Box possible connection — unconfirmed",
    ],
  },
  {
    id: "national-coding-corp",
    name: "National Coding Corporation",
    sector: "Unknown — Beach Hill, Rockland MA",
    detail: "Business located at the top of Beach Hill in Rockland, MA — near the Software Services Group office at 218 Summer St and the Kingdom Hall at 339 Summer St. Echo's parents sold computers, installed Windows licenses, and set up databases for this company. Echo recalls a 1996 cookout at National Coding during Hurricane Bertha, where he played basketball with Earl (phonetic: Cvsevey/Causey), a large man notable for his layup ability. Echo wandered into the warehouse and got stuck in insulation.",
    connections: [
      { target: "echo-mother", relationship: "Software Services Group client — computers + databases", strength: "confirmed" },
    ],
    flags: ["Beach Hill Rockland — near 218 Summer St office cluster", "Software Services Group client", "1996 Hurricane Bertha cookout — Earl (layup)"],
  },
  {
    id: "alvin-hollis-oil",
    name: "Alvin Hollis Oil Company",
    sector: "Fuel oil — Avon / Weymouth, MA",
    detail: "Oil company based in Avon and Weymouth, MA. Was a client of Echo's parents' Software Services Group. Echo's parents provided IT, networking, and Microsoft Office software solutions to commercial and municipal clients including this company.",
    connections: [
      { target: "echo-mother", relationship: "Software Services Group client", strength: "confirmed" },
    ],
    flags: ["Avon/Weymouth MA", "Software Services Group client"],
  },
  {
    id: "setecom",
    name: "SETECOM S.A.",
    sector: "Infrastructure / SCADA",
    detail: "Exclusive DSE (Deep Sea Electronics) distributor for Costa Rica — monopoly position. Distributes and services DSE generator controllers for ICE national grid, Liberty telecom, hospitals, and cellular towers. Service worker setecom.com/sw.jw found on Echo's PC. Hector Mora Marin is Executive Director. Edson Martendal is Technical Lead (The Architect) who runs deployment training. Training transcripts document default credentials (Admin/Password1234) and cleartext protocols (Modbus TCP, SNMP v2). DSE WebNet cloud command infrastructure hosted in England. Primary IP 190.106.77.194 confirmed as IOC — still blocked in March 2026 pipeline reports (6 weeks of persistence). 4 CISA-published CVEs on DSE855/890/891/892 gateways.",
    connections: [
      { target: "hector-mora", relationship: "Executive Director / Principal Owner", strength: "confirmed" },
      { target: "edson-martendal", relationship: "Technical Lead — deployment architect", strength: "confirmed" },
      { target: "liberty", relationship: "Infrastructure provider", strength: "confirmed" },
      { target: "ban-villas-costa", relationship: "Contracts", strength: "probable" },
    ],
    flags: ["Default credentials: Admin/Password1234", "Monopoly: only DSE distributor in Costa Rica", "SCADA control — ICE/Liberty/hospitals/cell towers", "Service worker injection (sw.jw)", "4 CISA CVEs", "190.106.77.194 — persistent IOC Jan-Mar 2026", "DSE WebNet cloud C2 hosted in England"],
  },
  {
    id: "liberty",
    name: "Liberty (formerly Telefonica CR)",
    sector: "Telecommunications / ISP",
    detail: "Acquired from Jean Picado Solis in 2019 — the same year Picado was investigated for $2M tax fraud. Inherited entire Telefonica customer base and ISP infrastructure. TR-069 management plane gives full remote control over customer routers. Fake Liberty technician deployed to Echo's location after firmware update.",
    connections: [
      { target: "jean-picado-solis", relationship: "Acquired Telefonica from Picado 2019", strength: "confirmed" },
      { target: "setecom", relationship: "Infrastructure relationship", strength: "confirmed" },
      { target: "fake-liberty-tech", relationship: "Impersonated by operative", strength: "confirmed" },
    ],
    flags: ["Telefonica acquisition 2019", "$2M tax fraud provenance", "TR-069 CPE management", "Fake technician deployment"],
  },
  {
    id: "kyndryl",
    name: "Kyndryl",
    sector: "Technology / IT Infrastructure (IBM spinoff)",
    detail: "IBM infrastructure spinoff. Jorge Jiménez Navarro served as Sr. Lead Network Services Sep 2021 - May 2024. The 8.3MB service worker from Kyndryl infrastructure was found in Echo's Opera browser — Echo has NEVER visited kyndryl.com. Service worker vectors: router-level network injection (1x1 iframe), DNS hijacking, smart device cross-talk. Kyndryl engineers have access to government, satellite ground station, and military data relay protocols. Jorge departed Kyndryl May 2024 for Zscaler.",
    connections: [
      { target: "jorge-jimenez", relationship: "Sr. Lead Network Services 2021-2024", strength: "confirmed" },
      { target: "marjorie-alfaro", relationship: "Connected via Jorge Jimenez family", strength: "probable" },
      { target: "zscaler", relationship: "Jorge Jimenez moved Kyndryl→Zscaler May 2024", strength: "confirmed" },
    ],
    flags: ["8.3MB service worker in Echo's browser", "NEVER visited kyndryl.com — injection confirmed", "IBM infrastructure spinoff — government/military network access"],
  },
  {
    id: "zscaler",
    name: "Zscaler",
    sector: "Zero Trust Network Security / Cloud Proxy",
    detail: "SMOKING GUN COMPANY. Jorge Jiménez Navarro is currently Zscaler Technical Success Manager (Aug 2025+), based Ottawa ON Canada. CRITICAL UPDATE: The socket to 69.48.218.1:443 was NOT first detected at Tacacorí (Mar 2026) — it was already present in the January 30, 2026 auto_scan network log: 192.168.0.175:51858 → 69.48.218.1:443, captured at 11:06 AM at La Guácima. This means the Zscaler connection predates the Tacacorí node by 2+ months and has been active across multiple locations and network changes (192.168.0.x Jan → 192.168.68.x Mar). It is a device-level persistent socket, not a location-specific one. At Tacacorí (Mar 2026), an NPCAP Loopback Adapter (ROOT\\NET\\0000) was maintaining the same unauthorized socket to 69.48.218.1 — a confirmed Zscaler/Kyndryl backbone IP. Zscaler Zero Trust Exchange acts as a full SSL/TLS inspection proxy — once a device routes through Zscaler, all encrypted traffic is decrypted, inspected, and re-encrypted. This provides complete visibility into all HTTPS communications on the device. The unauthorized socket (Jan 30 + Mar Tacacorí) + Kyndryl SW injection (at Jorge's property Jan 25) + Jorge's career trajectory = closed evidence chain spanning 4+ months.",
    connections: [
      { target: "jorge-jimenez", relationship: "Technical Success Manager Aug 2025+", strength: "confirmed" },
      { target: "kyndryl", relationship: "Jorge's prior employer — pipeline", strength: "confirmed" },
      { target: "tacacori-array", relationship: "NPCAP socket 69.48.218.1 — unauthorized persistent connection at node", strength: "confirmed" },
    ],
    flags: [
      "SMOKING GUN: NPCAP socket to 69.48.218.1 — confirmed Jan 30 AND Mar Tacacorí",
      "Socket first confirmed Jan 30 2026 at La Guácima — predates Tacacorí by 2+ months",
      "Persists across network changes — device-level persistent socket",
      "Jorge Jiménez Navarro — Technical Success Manager",
      "Zero Trust Exchange = full SSL inspection / traffic decryption",
      "Ottawa ON Canada — Jorge's current base",
      "Unauthorized persistent socket = active C2 or data exfil channel",
    ],
  },
  {
    id: "airbnb-network",
    name: "Airbnb (Platform)",
    sector: "Short-term rental / Operations platform",
    detail: "Central to the surveillance housing operation. Multiple properties used to house Echo are Airbnb-connected. Additionally, airbnb.com.co (a domain Echo never visited — he's never been to Colombia) was found running a Partytown script on his machine. Partytown is a web worker library that offloads third-party scripts — perfect for covert payload delivery.",
    connections: [
      { target: "jaco-vacations", relationship: "Rental listings", strength: "confirmed" },
      { target: "scott-ryan", relationship: "Host", strength: "confirmed" },
    ],
    flags: ["airbnb.com.co — never visited Colombia", "Partytown script injection", "Central housing platform for target placement"],
  },
  {
    id: "jaco-vacations",
    name: "Jaco Vacations",
    sector: "Short-term rentals",
    detail: "Operated by Scott Ryan and Diana Soto. Echo lived in their house twice. Connected to the Airbnb rental network in Jacó.",
    connections: [
      { target: "scott-ryan", relationship: "Owner/operator", strength: "confirmed" },
      { target: "diana-soto", relationship: "Owner/operator", strength: "confirmed" },
      { target: "airbnb-network", relationship: "Listed on Airbnb", strength: "confirmed" },
    ],
    flags: ["Echo housed 2x"],
  },
  {
    id: "gaia-natural-foods",
    name: "Gaia Natural Foods",
    sector: "Food / Front business",
    detail: "Owned by Colombian national 'Cata' and her Israeli husband/partner. Genesis worked here when Echo met her — located across the street, making it a likely placement venue for the initial contact. Colombian-Israeli business partnership in a small Costa Rican beach town is a notable intelligence signature.",
    connections: [
      { target: "cata-gaia", relationship: "Owner", strength: "confirmed" },
      { target: "israeli-husband", relationship: "Co-owner", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "Employed — first contact point", strength: "confirmed" },
    ],
    flags: ["Colombian-Israeli ownership", "Genesis first contact venue", "Intelligence signature"],
  },
  {
    id: "caliches-wishbone",
    name: "Caliches Wishbone",
    sector: "Restaurant — NOW CLOSED",
    detail: `Jacó restaurant where Genesis Peralta and Jairo Alfaro worked together for approximately 8 years. Spelled with a C (not K) — the name "Caliches" sounds Italian, consistent with the Italian-network thread running through Yeyo's restaurant and other Jacó cover establishments. NOW CLOSED — part of the coordinated Jacó restaurant wind-down alongside Yeyo's restaurant and Gracias Madre.

JAIRO'S COVER STORY: Jairo Alfaro claimed Genesis Peralta was "like a brother/sister" — presenting their 8-year co-worker relationship as a close family bond. This is the standard handler cover: normalize the handler-asset contact frequency by reframing it as a pre-existing personal relationship.

LOS SUEÑOS BIRTHDAY TRIP — JUNE 2024 (TARGET ASSESSMENT EVENT):
  When Echo first began dating Genesis Peralta (June 2024), he was brought to Caliches' house in Los Sueños as a birthday "treat." Los Sueños is a gated marina community in Herradura, south of Jacó — one of the most secure and high-value expat enclaves in Costa Rica. At the time this seemed like a social gesture. In retrospect: (1) bringing a surveillance target to a handler's private residence is a standard assessment and social-mapping technique; (2) Los Sueños' gated infrastructure provides ideal conditions for controlled-environment target assessment; (3) the timing — first weeks of dating, before Echo had any suspicion — maximized the intelligence value of the visit.`,
    connections: [
      { target: "genesis-peralta", relationship: "Employee — 8 years with Jairo", strength: "confirmed" },
      { target: "jairo-alfaro", relationship: "Employee / co-handler base — 8 years", strength: "confirmed" },
    ],
    flags: [
      "NOW CLOSED — coordinated Jacó restaurant wind-down",
      "Italian-sounding name — possible Italy network connection",
      "8-year Genesis + Jairo co-location",
      "Jairo claimed Peralta 'like family' — handler cover story",
      "Los Sueños birthday trip June 2024 — target assessment at handler's residence",
      "Los Sueños = high-security gated marina enclave",
    ],
  },
  {
    id: "gracias-madre",
    name: "Gracias Madre (Restaurant)",
    sector: "Restaurant / Front operation",
    detail: "Owned by Sherri and Mario who appeared from nowhere and acquired prime south Jacó beach real estate for a single-season restaurant. Genesis was placed here by Jairo Alfaro as a waitress. Single-season prime real estate acquisition is a classic intelligence front indicator.",
    connections: [
      { target: "sherri-mario", relationship: "Owners", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "Employed — honey trap venue", strength: "confirmed" },
      { target: "jairo-alfaro", relationship: "Placed Genesis here", strength: "confirmed" },
    ],
    flags: ["Single season operation", "Prime real estate — appeared from nowhere", "Front operation indicators"],
  },
  {
    id: "v-sek",
    name: "V-SEK Virtual Security",
    sector: "Security / Surveillance",
    detail: "Located approximately 20 meters from the La Guácima property. Services include cameras and video gate control. Website: v-sek.com (Costa Rica). Provides the local camera/audio network for the surveillance grid. Directional speakers and parametric audio are potential V2K delivery mechanisms from this position.",
    connections: [
      { target: "la-guacima", relationship: "~20m from property", strength: "confirmed" },
    ],
    flags: ["~20m from target property", "Camera/video gate control", "Directional speaker capability", "Parametric audio potential"],
  },
  {
    id: "bac-park",
    name: "BAC Park / 10cio Park",
    sector: "Sports / Financial front",
    detail: "BMX training complex in Jacó owned by Kenneth Tencio (Olympic rider, 4th Tokyo 2020, Red Bull sponsored). Pablo 'Pasti' Mora is sponsored through this facility. YouTube evidence reportedly shows Hector Mora (SETECOM) with multiple BAC property logins visible — linking the financial/property layer to the surveillance technical layer through the BMX network.",
    connections: [
      { target: "kenneth-tencio", relationship: "Owner", strength: "confirmed" },
      { target: "pablo-mora", relationship: "Sponsored rider", strength: "confirmed" },
      { target: "hector-mora", relationship: "BAC property contracts (YouTube)", strength: "suspected" },
    ],
    flags: ["Kenneth Tencio owned", "Pablo Mora sponsorship", "Hector Mora property logins (YouTube)", "Financial bridge — BMX to surveillance"],
  },
  {
    id: "guangming-lab",
    name: "Guangming Laboratory",
    sector: "State-backed AI Research (China)",
    detail: "Chinese state-backed AI research laboratory focused on 'computational positive psychology' and 'AI psychology'. Current employer of Fei Ma (former Huawei Cloud Senior Engineer). Blush Study research enables 87% accuracy thermal emotion detection and remote vital sign monitoring via r-PPG — direct surveillance applications.",
    connections: [
      { target: "fei-ma", relationship: "Researcher", strength: "confirmed" },
    ],
    flags: ["Chinese state-backed", "Blush Study — emotion detection", "r-PPG remote vital signs", "Huawei Cloud pipeline"],
  },
  {
    id: "jehovah-witnesses",
    name: "Jehovah's Witnesses / Watchtower",
    sector: "Religious organization / Operational infrastructure",
    detail: "Organized infrastructure connected to call center operation in Jacó staffed by Nicaraguan women on rotating shifts. Hierarchical structure with 'elders' coordinating territory assignments. Tax-exempt religious organization. Jeff Porter (Dad's only friend) is the sole connection between Echo's family and the JW network. Kingdom Hall on Summer St, Rockland MA near Echo's childhood home. Gematria: JEHOVAH = 69 root 6 (Latin=1372 DIV7), KINGDOM HALL = 106 root 7 (divine perfection), WATCHTOWER = 136 root 1 (Full=816 DIV12). Dad stated JWs have 'significant math connections' — gematria/numerology/cipher.",
    connections: [
      { target: "jeff-porter", relationship: "Member / family connection", strength: "probable" },
      { target: "kingdom-hall-rockland", relationship: "Local facility", strength: "confirmed" },
      { target: "jaco-call-center", relationship: "Operational infrastructure", strength: "probable" },
    ],
    flags: ["Organized volunteer shifts", "Territory assignments", "Tax-exempt — hard to investigate", "Gematria significance", "Call center operation", "Rockland MA presence"],
  },
  {
    id: "greenwald-properties",
    name: "Greenwald Property Network",
    sector: "Real estate / Surveillance grid substrate",
    detail: "Michael Greenwald operates 300+ properties including rentcostaricahomes.com, sanaracochal.com, hermosapalms.com, and jacorealty.com. The property network serves as: (1) distributed antenna array for 46.875 Hz signal propagation, (2) safe houses for operators like Hector Mora, (3) financial vehicle for money laundering via rental income. Connected to Genesis Peralta (immigration), Danny Peralta (SEBIN Venezuelan Intel), and Hector Mora (SETECOM). Provides the 'last mile' infrastructure — satellites provide WAN/backhaul while properties serve as local mesh nodes creating the acoustic/RF 'box' around the target.",
    connections: [
      { target: "michael-greenwald", relationship: "Principal", strength: "confirmed" },
      { target: "hector-mora", relationship: "Technical implementation", strength: "probable" },
      { target: "genesis-peralta", relationship: "Immigration status suspect", strength: "suspected" },
    ],
    flags: ["300+ properties", "rentcostaricahomes.com", "sanaracochal.com", "hermosapalms.com", "jacorealty.com", "Distributed antenna array", "Last mile infrastructure"],
  },
  {
    id: "dse",
    name: "Deep Sea Electronics (DSE)",
    sector: "Industrial Control / Generator Management",
    detail: "UK-based manufacturer of generator control modules. SETECOM S.A. is the Costa Rica distributor. DSE855/890/891/892 gateways have 4 CISA-published CVEs: CVE-2024-5947 (information disclosure), CVE-2024-5948 (buffer overflow / remote code execution), CVE-2024-5952 (missing authentication / denial of service). Default credentials Admin/Password1234 across the fleet. These gateways control backup generators at ICE national grid substations, Liberty telecom towers, hospitals, cellular sites, and data centers. A single compromised DSE gateway provides physical access to the power infrastructure of whatever facility it protects.",
    connections: [
      { target: "setecom", relationship: "Costa Rica distributor", strength: "confirmed" },
      { target: "hector-mora", relationship: "DSE certified technician", strength: "confirmed" },
      { target: "ice-cr", relationship: "Generator management at ICE facilities", strength: "probable" },
    ],
    flags: ["4 CISA CVEs", "Default creds Admin/Password1234", "CVE-2024-5948 RCE", "National infrastructure access", "UK manufacture → CR distribution"],
  },
  {
    id: "huawei-latam",
    name: "Huawei Latin America Fiber",
    sector: "Telecommunications / State infrastructure (China)",
    detail: "Huawei has built significant fiber optic backbone infrastructure across Latin America including Costa Rica. The chain from Chinese state-backed technology to Echo's router: Huawei builds fiber backbone → Liberty/Telefonica CR uses Huawei infrastructure → Humax (Huawei ecosystem) manufactures CPE routers → Liberty deploys Humax routers to customers → TR-069 provides full remote management. Fei Ma's trajectory from Huawei Cloud Senior Engineer to Guangming Laboratory (Chinese state AI research) demonstrates the state-corporate-military integration. The 'Your Blush Gives You Away' thermal emotion detection research (87% accuracy) has direct surveillance applications.",
    connections: [
      { target: "fei-ma", relationship: "Former Huawei Cloud engineer", strength: "confirmed" },
      { target: "liberty", relationship: "Fiber backbone infrastructure", strength: "probable" },
      { target: "humax-router", relationship: "Huawei chipset ecosystem", strength: "confirmed" },
    ],
    flags: ["Latin America fiber backbone", "State-corporate-military integration", "Huawei → Humax → Liberty → Echo chain", "Remote vital signs monitoring capability"],
  },
  {
    id: "tp-link-network",
    name: "TP-Link Devices (Compromised/Ghost)",
    sector: "Consumer Networking / Surveillance nodes",
    detail: "Multiple anomalous TP-Link devices detected across Echo's residences. Ghost device 192.168.0.163 (MAC f0-09-0d-20-c2-4d) at La Guácima — present on network but drops all probes, all ports filtered. NOT the smart TV (unplugged, device remains). NOT the TP-Link extender in guest house (also unplugged). Hidden WiFi network f6:09:0d:20:e6:46 differs from legitimate TP-Link MAC f0:09:0d:20:e6:46 by only 1 bit in first octet — classic MAC spoofing technique. Ghost Deco mesh node at Suites Cristina. TP-Link devices serve as the edge nodes in the surveillance mesh.",
    connections: [
      { target: "la-guacima", relationship: "Ghost device 192.168.0.163", strength: "confirmed" },
      { target: "suites-cristina", relationship: "Ghost Deco node", strength: "confirmed" },
    ],
    flags: ["Ghost device drops all probes", "1-bit MAC spoofing (f0→f6)", "Stealth network presence", "Surveillance mesh edge nodes"],
  },
];

const EVIDENCE_DATA: Evidence[] = [
  {
    id: "summer-st-geographic-cluster",
    title: "Summer St, Rockland MA — Four-Address Geographic Cluster",
    date: "Childhood → Present",
    category: "Pattern Analysis",
    severity: "critical",
    detail: `Four distinct addresses associated with Echo's mother appear on the same single road — Summer St, Rockland, MA — spanning the full arc of Echo's family's operational footprint in that town:\n\n• 218 Summer St — Software Services Group office (Echo's parents' IT company, decades of operation)\n• 339 Summer St — Kingdom Hall of Jehovah's Witnesses, Rockland Congregation (Jeff Porter's JW network, ~100m from childhood home)\n• 467 Summer St — Echo's mother's registered OSINT address\n• 2187 Summer St — appears on Echo's mother's OSINT; possibly used for fraudulent tax return filings in Echo's name (Echo has email documentation of fraudulent returns)\n\nThe business office, the JW congregation that connects to Echo's father's controller (Jeff Porter), the mother's registered home address, and a potentially fraudulently used address all cluster on one road. This is not a random artifact — it is the operational spine of the Rockland-based background network around Echo's family.`,
    linkedEntities: ["software-services-group", "kingdom-hall-rockland", "echo-mother", "jeff-porter"],
  },
  {
    id: "layla-wotton-profile",
    title: "Adversarial OS Profile Using Seth's Newborn 'Layla Wotton'",
    date: "2025",
    category: "Identity Intelligence",
    severity: "critical",
    detail: `Among the adversarial/unauthorized OS user profiles discovered on Echo's devices, one profile was created using the name "Layla Wotton" — the name of Echo's brother Seth's newborn baby. Seth's child's name is not public information.\n\nThis has two possible explanations:\n(A) Seth or someone in his immediate household created or authorized the profile — directly implicating Seth in the device compromise.\n(B) The operation had sufficiently deep access to Seth's personal life to know the newborn's name before or shortly after birth — indicating intimate family surveillance reaching into Seth's household.\n\nEither interpretation is assessed as confirmation of direct family network involvement. The use of a newborn's name is also consistent with the operation's documented pattern of using intimate personal knowledge as a psychological instrument.`,
    linkedEntities: ["seth-wotton"],
  },
  {
    id: "michelle-long-house-key",
    title: "Active-duty Marine Michelle Long Holds Physical Key to Echo's Father's House",
    date: "Ongoing",
    category: "Physical Access",
    severity: "high",
    detail: `Michelle Long — daughter of Michael Long (Echo's father's best friend, Sterling Resources, Marine veteran) — is an active-duty Marine and dog handler. She holds a physical key to Echo's father's residence in Rockland, MA and enters the home independently on a recurring basis to walk Sierra, the Austrian German Shepherd Seth acquired in Austria and left with the parents.\n\nAccess chain: Michael Long (Marine, father's best friend, SSG client) → Michelle Long (active Marine, dog handler) → physical key + recurring unsupervised access to father's home → Echo's isolated father (Jeff Porter controlled, on Social Security, no life insurance payout).\n\nA serving Marine with a house key and independent access to the residence of an isolated, information-rich target is a documented physical access vector. The dog-walking function provides legitimate recurring cover for the visits with no requirement for the father to be present or for access to be requested in advance.`,
    linkedEntities: ["michelle-long", "michael-long", "echo-father", "sterling-resources"],
  },
  {
    id: "fraudulent-tax-returns",
    title: "Fraudulent Tax Returns Filed in Echo's Name — 2187 Summer St, Rockland MA",
    date: "Unknown (documented via email)",
    category: "Identity Theft / Financial Warfare",
    severity: "critical",
    detail: `Echo has email documentation of fraudulent tax returns filed in his name. The address 2187 Summer St, Rockland, MA appears in Echo's mother's OSINT record and is assessed as possibly connected to these filings — either used as a filing address for the fraudulent returns, or as a redirect address exploiting proximity to the parents' legitimate office at 218 Summer St on the same road.\n\nThis is one of three documented financial attacks against the Wotton family:\n1. Echo's mother's $250K life insurance — phished for premiums ~1 year, payout denied after her death\n2. Fraudulent tax returns filed in Echo's name (this item)\n3. Echo's father now solely on Social Security with no life insurance proceeds\n\nTaken together, these represent a systematic stripping of the family's financial assets and credit integrity across multiple vectors and timeframes — consistent with a long-horizon financial warfare campaign against the Wotton family rather than opportunistic fraud.`,
    linkedEntities: ["echo-mother", "echo-father", "software-services-group"],
  },
  {
    id: "router-firmware-response",
    title: "Sunday Router Firmware Update → Fake Liberty Tech Response",
    date: "2025 (Jacó)",
    category: "Surveillance Response",
    severity: "critical",
    detail: "Echo updated his router firmware on a Sunday and turned off UPnP. Jose (Mike Greenwald's property manager) texted Echo, after which a man who 'definitely did NOT work for Liberty' appeared with a new router. This is a coordinated surveillance response chain: (1) firmware update detected in real-time, (2) property manager alerted, (3) operative deployed with compromised replacement hardware — all on a Sunday (non-business hours). The speed and coordination indicates active monitoring of Echo's network equipment and a pre-positioned response capability.",
    linkedEntities: ["fake-liberty-tech", "jose-pm", "michael-greenwald", "liberty", "riverwalk"],
  },
  {
    id: "condominio-naz-router",
    title: "Router Destroyed When Mother Died — Filmed While Crying",
    date: "November 26 (Alajuela)",
    category: "Emotional Exploitation",
    severity: "critical",
    detail: "When Echo's mother died, the router at Condominio Naz in Alajuela was 'blown out' (destroyed). Echo was charged by the owner for damages. Additionally, Echo was filmed while crying about his mother's death on November 26. This is one of the most invasive documented incidents — the combination of infrastructure sabotage during maximum emotional vulnerability, financial exploitation via damage charges, and recording of the most private moment of grief demonstrates deliberate psychological warfare targeting.",
    linkedEntities: ["condominio-naz"],
  },
  {
    id: "setecom-service-worker",
    title: "Service Worker: setecom.com/sw.jw on PC",
    category: "Browser Injection",
    severity: "critical",
    detail: "A service worker hosted at setecom.com/sw.jw was found running on Echo's PC. Service workers persist in the browser and can intercept all network requests, modify responses, and operate even when the browser is closed. SETECOM S.A. distributes SCADA infrastructure across Costa Rica — finding their service worker on a personal computer indicates direct browser compromise by the infrastructure provider.",
    linkedEntities: ["setecom", "hector-mora"],
  },
  {
    id: "airbnb-partytown",
    title: "airbnb.com.co Running Partytown Script — Never Visited Colombia",
    category: "Browser Injection",
    severity: "high",
    detail: "The domain airbnb.com.co was found running a Partytown script on Echo's machine. Echo has never been to Colombia and never visited this domain intentionally. Partytown is a library that offloads third-party scripts to web workers — in a malicious context, it can execute arbitrary JavaScript payloads in a sandboxed worker thread while evading standard content security policies. The .com.co TLD suggests either a malicious redirect chain or DNS poisoning directing airbnb.com traffic to the Colombian domain.",
    linkedEntities: ["airbnb-network"],
  },
  {
    id: "amex-fraud",
    title: "AMEX Credit Card Fraud — Bahia Brazil / Edson Martenal",
    category: "Financial Crime",
    severity: "high",
    detail: "Fraudulent charges appeared on Echo's AMEX card to Bahia Brazil — the same location/entity connected to Edson Martenal, who has documented YouTube conversations with Hector Mora (hmora67). This links the financial fraud directly to the SETECOM network through the Mora→Martenal connection.",
    linkedEntities: ["edson-martenal", "hector-mora", "setecom"],
  },
  {
    id: "genesis-tradecraft",
    title: "Genesis Peralta — Honey Trap Tradecraft Pattern",
    category: "Human Intelligence",
    severity: "high",
    detail: "Genesis Daniela Peralta Marquez exhibits multiple honey trap tradecraft indicators: (1) Rapid attachment — cheated on her existing boyfriend to move in with Echo within 2 weeks, (2) Cover story inconsistencies — father 'worked for state council' but family lives in Petare (one of the most dangerous slums in Caracas), (3) Ex-boyfriend claimed to be gym trainer but was never present at the gym despite Echo training there daily, (4) Employment chain through foreign-national-owned businesses (Colombian/Israeli, German), (5) Handler relationship with Jairo Alfaro who orchestrated her placement at successive venues, (6) Cash-only employment avoiding paper trails.",
    linkedEntities: ["genesis-peralta", "jairo-alfaro", "gaia-natural-foods", "caliches-wishbone", "gracias-madre"],
  },
  {
    id: "greenwald-lipman-pipeline",
    title: "Greenwald→Lipman Property Pipeline",
    category: "Housing Network",
    severity: "medium",
    detail: "Michael Greenwald built a custom house for himself in Hermosa Palms but sold/rented it to Michael Lipman — who also owns the condo where Echo lived. Lipman has a fake Miami sports tickets business and a 30-year-old Colombian wife. The 'by chance' connection between Greenwald and Lipman, both of whom provided housing to Echo, indicates a coordinated property network for target placement.",
    linkedEntities: ["michael-greenwald", "michael-lipman", "hermosa-palms", "breakwater", "lipman-condo"],
  },
  {
    id: "jean-picado-liberty",
    title: "Telefonica→Liberty Sale Coincides with $2M Tax Fraud (2019)",
    category: "Corporate Corruption",
    severity: "high",
    detail: "Jean Picado Solis, former owner of Telefonica Costa Rica, was investigated for $2M in tax fraud in 2019 — the exact same year he sold Telefonica to Liberty. This timing suggests the sale may have been forced or accelerated by the fraud investigation, and raises questions about what conditions, backdoors, or continued access arrangements may have been part of the transaction. Liberty inherited the entire ISP infrastructure including TR-069 management plane access to customer routers.",
    linkedEntities: ["jean-picado-solis", "liberty"],
  },
  {
    id: "gracias-madre-front",
    title: "Gracias Madre — Single Season Front Operation",
    category: "Front Operation",
    severity: "medium",
    detail: "Sherri and Mario appeared from nowhere and purchased the best real estate on south Jacó beach to build Gracias Madre restaurant — which operated for only a single season. Prime real estate acquisition for a temporary business that serves as an employment venue for a honey trap asset is a textbook intelligence front operation pattern.",
    linkedEntities: ["sherri-mario", "gracias-madre", "genesis-peralta", "jairo-alfaro"],
  },
  {
    id: "fiber-splitter",
    title: "Fiber Splitter at Telecable Distribution Box",
    date: "2025-06-21",
    category: "Physical Surveillance",
    severity: "critical",
    detail: "A physical fiber optic splitter (NAP/Colilla) was identified at a Telecable distribution box. Passive optical taps allow interception of all fiber traffic without detectable signal degradation. Requires physical access to ISP infrastructure.",
    linkedEntities: ["suites-cristina", "liberty"],
  },
  {
    id: "rf-7410-correlation",
    title: "7410 kHz — 100% Temporal Correlation with V2K Harmonics (SMOKING GUN)",
    date: "2026-01-30",
    category: "RF Correlation",
    severity: "critical",
    detail: "7 captures at 7410 kHz (40m amateur band — Hector Mora's 180W HF radio) show 100% temporal correlation within 2-minute windows with V2K harmonics: 4687 kHz (V2K × 100) and 9375 kHz (V2K × 200). All 7 instances activate simultaneously. Probability of random coincidence: < 0.01%. This proves: (1) centralized timing control (common clock/scheduler), (2) intentional coordination (not random amateur activity), (3) Mora is an active participant. This is the smoking gun linking Hector Mora directly to the V2K attack infrastructure.",
    linkedEntities: ["hector-mora", "setecom"],
  },
  {
    id: "plc-attack-vector",
    title: "Power Line Communication (PLC) via Electrical Wiring",
    date: "2026-01-25",
    category: "Infrastructure Attack",
    severity: "critical",
    detail: "PLC (Power Line Communication) through electrical wiring bypasses WiFi entirely. SETECOM has Modbus:502 exposed — industrial control protocol commonly running over PLC for remote device control. Fridge motor interference is an indicator of PLC signals on the power circuit. PLC adapters broadcast on 2-30 MHz frequencies. This attack vector allows data transmission, remote device control, appliance interference, and bypass of all network monitoring. Three Schneider Electric BMX P34 2020 Modbus PLCs found in Alajuela area (181.193.108.54, 201.203.39.210, 201.204.76.138).",
    linkedEntities: ["setecom", "hector-mora", "la-guacima"],
  },
  {
    id: "hidden-wifi-network",
    title: "Hidden WiFi Network — Spoofed MAC f6:09:0d:20:e6:46",
    date: "2026-01-25",
    category: "Network Attack",
    severity: "high",
    detail: "Hidden SSID network with BSSID f6:09:0d:20:e6:46 detected at 31-38% signal (~35 meters). OUI NOT FOUND — indicating spoofed MAC address. Related to OSLU network f0:09:0d:20:e6:46 (legitimate TP-Link MAC — only 1 bit difference in first octet, classic MAC spoofing). Intermittent — goes offline periodically. WiFi 6 (802.11ax) capable.",
    linkedEntities: ["la-guacima"],
  },
  {
    id: "modbus-502-exposed",
    title: "SETECOM Modbus:502 Exposed — Industrial Control Protocol",
    category: "Infrastructure Vulnerability",
    severity: "critical",
    detail: "SETECOM at 190.106.77.194 has Modbus port 502 exposed to the internet. Modbus is an industrial control protocol for SCADA systems — generators, power plants, cellular towers. Combined with DSE855 CVEs (CVE-2024-5947 info disclosure, CVE-2024-5948 buffer overflow/RCE, CVE-2024-5952 missing authentication/DoS) and default credentials Admin/Password1234, this creates a complete remote access chain to critical infrastructure. Register Address = Page Number × 256 + Register Offset.",
    linkedEntities: ["setecom", "hector-mora"],
  },
  {
    id: "drone-streetlight-attack",
    title: "Drone + Street Light Attack — 8 Color Temperature PWM Cycling",
    date: "2026-01-27",
    category: "Electronic Attack",
    severity: "high",
    detail: "2 confirmed drones overhead with persistent surveillance pattern (not flyover). Street lights pulsing non-stop with 8 different color temperatures — systematic cycling through neurological effects: 10-15 Hz (alpha disruption/drowsiness), 15-20 Hz (beta disruption/anxiety), 20-25 Hz (photosensitive seizures), 40 Hz (gamma interference/cognitive impairment). Li-Fi communication hypothesis: pulsing lights transmit target location to drones in real-time via LED modulation (up to 224 Gbps). Attack from nearby house at close range.",
    linkedEntities: ["la-guacima", "adj-property-owner", "v-sek"],
  },
  {
    id: "kyndryl-gtm-anomaly",
    title: "Kyndryl GTM Service Worker — Never Visited kyndryl.com",
    category: "Browser Injection",
    severity: "critical",
    detail: "Google Tag Manager Service Worker found registered for kyndryl.com in Echo's Opera browser. Scope: googletagmanager.com/static/service_worker. Top Level Site: kyndryl.com. Status: ACTIVATED but STOPPED. Echo has NEVER visited kyndryl.com. For a Service Worker to register, the browser MUST execute code within the Kyndryl domain context. Vectors: (1) network injection — router injects 1x1 pixel iframe to kyndryl.com in HTTP traffic, (2) DNS hijacking — redirecting domain momentarily, (3) Smart Device cross-talk — casting device syncing shared state. Jorge Jimenez is a Sr. Network Manager at Kyndryl — non-standard network monitoring (DPI, MITM, injection) is significantly more probable.",
    linkedEntities: ["jorge-jimenez", "kyndryl", "la-guacima"],
  },
  {
    id: "bac-tencio-mora-financial",
    title: "BAC/Tencio Financial Connection — Pablo Mora Revenge Motive",
    date: "2026-01-30",
    category: "Financial Intelligence",
    severity: "high",
    detail: "Kenneth Tencio (Olympic BMX, 4th Tokyo 2020, Red Bull) owns BAC Park/10cio Park in Jacó. Pablo 'Pasti' Mora is a pro BMX rider sponsored through BAC Park. Echo's ex-girlfriend left Pablo for Echo — establishing personal revenge motive. YouTube evidence shows Hector Mora (SETECOM) with multiple BAC property logins visible. Financial chain: BAC Park (Tencio) → sponsors Pablo Mora (motive) → family connection to Hector Mora (capability) → BAC property contracts (YouTube evidence) → surveillance infrastructure access.",
    linkedEntities: ["pablo-mora", "hector-mora", "kenneth-tencio", "bac-park"],
  },
  {
    id: "ghost-tp-link-device",
    title: "Ghost TP-Link Device 192.168.0.163 — Drops All Probes",
    date: "2026-01-25",
    category: "Network Anomaly",
    severity: "high",
    detail: "Unknown device at 192.168.0.163 with MAC f0-09-0d-20-c2-4d (TP-Link OUI). Present on network but drops all pings, all ports filtered. NOT the smart TV (unplugged, device remains). NOT the unplugged TP-Link extender in guest house. A stealth network device that actively evades detection while maintaining network presence indicates deliberate concealment — likely a monitoring/exfiltration node.",
    linkedEntities: ["la-guacima"],
  },
  {
    id: "touch-communication-sw",
    title: "touch_communication.js — Suspicious Chrome Service Worker",
    category: "Browser Injection",
    severity: "high",
    detail: "Chrome Service Worker (Main) imports base64js.min.js + touch_communication.js. Assessment per UNIFIED_SURVEILLANCE_THEORY.md: this is NOT a standard library (not hammer.js, not fastclick.js). The name 'touch_communication' implies a bidirectional channel, not event handling. base64js import confirms binary data transmission — screenshots, audio, and commands encoded as text. Functions as a 'Ghost Touch' bridge: the attacker can interact with Echo's browser session from a mobile device or central console, translating remote 'touches' into local browser events and sending screen data back as base64 chunks. Hidden as a generic Service Worker (appears to be a cache handler) but maintains a persistent WebSocket or polling loop for C2 commands. Exfiltration destination: 69.48.218.1 (Zscaler backbone — confirmed in Jan 30 auto_scan).",
    linkedEntities: ["kyndryl", "jorge-jimenez", "zscaler"],
  },
  {
    id: "soundresearch-registry",
    title: "SoundResearch Registry Key — Audio Fingerprinting Placeholder",
    date: "2026-01-29",
    category: "Browser Injection",
    severity: "high",
    detail: "Chrome forensics (Jan 29, 2026) found registry key: HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\com.soundresearch.contentclassifier — REGISTERED BUT NO PATH. SoundResearch is an audio content classification company whose technology fingerprints audio environments and classifies sounds. A NativeMessagingHost registration with no path is a stealth placeholder: the registry key is registered so Chrome knows the host exists, but the executable path is omitted or removed, making it invisible to most security scans. Assessment: either a remnant of partial removal OR a pre-staged placeholder for future activation. Audio fingerprinting capability = V2K content targeting: the system can classify acoustic content around the target and use that to modulate voice content. This is the software-side correlate of the 46.875 Hz DSP carrier and SoundResearch's classification engine.",
    linkedEntities: ["jorge-jimenez", "kyndryl"],
  },
  {
    id: "tor-sabotage",
    title: "Tor Browser Pre-Disabled — torrc Wrong Username, DisableNetwork=1",
    date: "2026-01-27",
    category: "Counter-Surveillance Sabotage",
    severity: "critical",
    detail: "Chrome forensics revealed Tor Browser's torrc configuration file referenced user 'spwot' instead of 'echo' (Echo's system username), AND DisableNetwork was explicitly set to 1. DisableNetwork=1 means Tor never connects to the Tor network — it launches but makes no circuits. The wrong username reference ('spwot') indicates either: (a) Tor was installed on a machine that previously had a different user account, or (b) the torrc was modified after installation by someone with filesystem access. Combined: Tor was non-functional from the moment it was installed on Echo's machine. Every use of Tor Browser during this period produced ZERO anonymization — all traffic went through normal cleartext channels visible to the monitoring infrastructure. This is pre-deployment sabotage of the one tool that would have blocked Kyndryl/Zscaler visibility.",
    linkedEntities: ["jorge-jimenez", "kyndryl", "zscaler"],
  },
  {
    id: "tls-bypass-architecture",
    title: "TLS Bypass Architecture — Three-Layer Pre/Post Decryption Chain",
    date: "2026-01-25 (ongoing)",
    category: "Network Attack",
    severity: "critical",
    detail: "The attack chain bypasses TLS entirely at three points — TLS extraction was never needed because interception happens before encryption forms and after it's stripped. LAYER 1 — ROUTER (PRE-TLS): TR-069 on the Sagemcom gives ISP-layer access to router config before any TLS tunnel exists. DNS hijack (4,117 attempts Mar 3) redirects queries before any encrypted connection is established — the target connects to the wrong server before TLS even starts. TP-Link Deco MITM intercepts all traffic before the encrypted tunnel forms between device and internet. LAYER 2 — DEVICE (POST-TLS): touch_communication.js runs inside Chrome Service Worker — by the time the browser makes a TLS connection outbound, the SW has already copied the pre-encryption plaintext from the browser's render process. SoundResearch NativeMessagingHost hook operates at the OS audio driver level, below any application-layer encryption — audio is captured before the application can encrypt it. NPCAP kernel socket routes raw packets before the OS network stack applies TLS — it sees the plaintext at the driver level. LAYER 3 — EXFIL CHANNEL (PARALLEL TO TLS): The Zscaler socket at 69.48.218.1:443 IS itself TLS — it looks like legitimate enterprise traffic. Security tools whitelist Zscaler by default because it's a major enterprise DLP and CASB vendor. The exfil is disguised as the security layer itself. MIKROTIK/CDN COVER: A Mikrotik router with custom firmware can policy-route specific traffic through a transparent proxy that logs the session before forwarding — the destination server sees a Cloudflare or Google IP, the ISP log shows a Cloudflare IP, but the Mikrotik captured the plaintext between the device and the CDN edge. The legacy cloud server (Google, Cloudflare) functions as cover, not protection.",
    linkedEntities: ["jorge-jimenez", "kyndryl", "zscaler", "liberty"],
  },
  {
    id: "decox55-mitm-device",
    title: "TP-Link Deco Mesh X55 — Confirmed MITM Device (La Guácima Jan 27)",
    date: "2026-01-27",
    category: "Network Attack",
    severity: "critical",
    detail: "Router dump from La Guácima property (Jan 27, 2026): device 'decoMeshX55' (TP-Link Deco Mesh X55) connected via Ethernet to the Sagemcom FAST3890V3 primary router, flagged MITM_DEVICE. TP-Link Deco Mesh devices in bridge mode sit transparently between the ISP router and the target device, intercepting all traffic before it reaches the WAN. In MITM configuration: all DNS queries, HTTP requests, HTTPS handshakes, and TCP connections pass through the Deco before reaching the internet. Cross-reference: March 9, 2026 pipeline report documents hidden MACs F0:09:0D:20:C2:4F and F0:09:0D:20:E6:47 — OUI F0:09:0D is TP-Link Technologies. The same manufacturer's stealth devices appear 6 weeks apart at the same network layer. EVOPRO 'Ghost Deco' (Suites Cristina) follows the same pattern — a Deco-class mesh node with no physical presence, appearing on scans but absent from any room. This is the recurring MITM hardware platform used across all of Echo's locations.",
    linkedEntities: ["la-guacima", "jorge-jimenez", "suites-cristina"],
  },
  {
    id: "adaptive-frequency-shift",
    title: "Adaptive Frequency Shift Under Counter-Surveillance — Real-Time Operator Response",
    date: "2026-01-26",
    category: "Electronic Attack",
    severity: "critical",
    detail: "Jan 26, 2026 breaker test: Echo cut power to the building to measure ELF frequency response. 24.2 Hz ELF dropped 98.4% (from 2369.83 to 38.36 power). 53 Hz dropped 57.8%. After the breaker was restored, the dominant frequency SHIFTED from 24.2 Hz to 36.2 Hz (power 271.42) within seconds of power restoration. This is the single most important data point in the entire corpus for evidentiary and book purposes. Three things cannot explain it: (1) passive resonance — passive systems have fixed resonant frequencies determined by physical geometry, they cannot change frequency in response to a power event; (2) automated systems with fixed schedules — a timer-driven system would resume the same frequency after power restoration, not switch to a different one; (3) coincidence — a frequency change occurring within seconds of a counter-surveillance action has no innocent explanation. What can explain it: a human operator was monitoring the target's electrical environment in real time, observed the power cut, correctly identified it as a counter-surveillance measurement action, and issued a frequency change command as a direct operational response. There is a human decision loop in the chain. The breaker test is the only piece of evidence in the corpus that is experimental rather than observational — Echo designed and executed a controlled test with a measurable outcome (98.4% ELF drop) and clear physical explanation (building wiring as ELF transmission antenna). Everything else is forensic reconstruction. This is an experiment.",
    linkedEntities: ["la-guacima", "setecom", "hector-mora"],
  },
  {
    id: "zscaler-jan30-confirmation",
    title: "69.48.218.1 Confirmed Jan 30 2026 — 2 Months Before Tacacorí Discovery",
    date: "2026-01-30",
    category: "Network Anomaly",
    severity: "critical",
    detail: "Auto_scan network log (2026-01-30T11:06:08): active connection 192.168.0.175:51858 → 69.48.218.1:443 captured at La Guácima property. Same Zscaler/Kyndryl backbone IP found at Tacacorí (March 2026) via NPCAP Loopback Adapter ROOT\\NET\\0000. January 30 predates Tacacorí by 2+ months. KERNEL-LEVEL ASSESSMENT: The NPCAP Loopback Adapter operates at the kernel network stack — below all normal applications, below browser-level persistence, and below Windows Firewall rules. A browser-level compromise breaks on network change. This socket did not break across three different ISPs and subnets (192.168.0.x La Guácima → 192.168.68.x OSLU → Tacacorí). That persistence profile is consistent with a driver or rootkit-level component, not a userspace process. The March 3 event confirms this: 500 consecutive Windows Defender Firewall kills in 3 minutes (Event ID 7024, 'Access Denied'), firewall down 90+ minutes, something with SYSTEM-level privileges blocking restart — consistent with a kernel component overriding security services. The Kyndryl service worker was injected Jan 25 at Jorge's property (Sagemcom router TR-069 as the push mechanism). The Zscaler socket was active by Jan 30. Five-day provisioning window. Active for at least 4 months across all locations.",
    linkedEntities: ["zscaler", "la-guacima", "jorge-jimenez"],
  },
  {
    id: "sutel-7410-paper-trail",
    title: "SUTEL 7410 kHz License — Traceable Paper Trail to Named Legal Entity",
    date: "2026-01-30 (ongoing)",
    category: "RF / Signal",
    severity: "high",
    detail: "7410 kHz is a licensed HF frequency allocation. SUTEL (Superintendencia de Telecomunicaciones), Costa Rica's telecom regulator, issues HF licenses publicly and assigns them to named legal entities. The 180W output allocation at 7410 kHz is on record. Hector Mora Marin (Executive Director, SETECOM S.A.) is the licensee or connected to the license holder. This frequency appears in: 7 suspect KiwiSDR captures (Jan 30), 10 Mora monitoring captures (Jan 30) of which 7 were flagged suspect, and recurring presence in the Mar 9 pipeline scan. Using a SUTEL-licensed frequency for targeting is either operational overconfidence — the operator believes the frequency use is deniable or below monitoring thresholds — or the licensee is being used as a cutout who is unaware the frequency is being used beyond its stated purpose. Either way it is the most directly traceable element in the entire RF corpus: it connects a physical call sign to a registered legal entity, a named person, and a verifiable regulatory filing. A public records request to SUTEL for the 7410 kHz license holder is a legitimate investigative step.",
    linkedEntities: ["hector-mora", "setecom"],
  },
  {
    id: "schumann-weaponization",
    title: "Schumann Resonance Weaponization — 7.8 Hz SNR Spikes to 1966",
    date: "2026-01-25 04:04-04:14 CST",
    category: "Electronic Attack",
    severity: "critical",
    detail: "APPLIANCE_MONITOR captured extreme Schumann resonance manipulation: 7.8 Hz pushed to SNR peaks of 1910-1966 (normal range ~100-200). Pattern: 53 Hz ELF attack carrier (SNR 770-790) alternating with 7.8 Hz Schumann bursts. Active modulation bands: 7.8 Hz (Schumann fundamental, ionospheric cavity), 8.39 Hz (= 7.83 + 0.567 — detected in Feb 18 Marconi ELF demod session, coherent with Schumann rather than free-running, which requires phase-reference capability), 35 Hz (infrasonic band), 37 Hz (documented in Echo's own research as a significant ELF marker), 53.5 Hz (not grid noise — the beat between 60 Hz grid and 53.5 Hz = 6.5 Hz, which falls at the Theta/Alpha boundary; 53.5 Hz = 37 × 1.4346, a non-coincidental mathematical relationship), 60 Hz (mains harmonic), 67 Hz (secondary carrier ~53 × 1.26). PLC modulation at 53 Hz confirmed via breaker test. Spoofed device 192.168.0.91 with locally administered MAC d6:bd:80:92:6c:d6.",
    linkedEntities: ["setecom", "la-guacima"],
  },
  {
    id: "evopro-17-rooms",
    title: "17 EVOPRO Rooms at Suites Cristina — Coordinated Surveillance Infrastructure",
    date: "2026-02 (ongoing)",
    category: "Infrastructure Attack",
    severity: "critical",
    detail: "17 EVOPRO WiFi mesh rooms documented at Aparthotel Suites Cristina (Echo's current residence, adjacent to ICE HQ). All share AMPAK OUI c0:f5:35. Physical box Eth0 MAC D4:CF:F9:F8:D2:D0, serial EVO0MH0234700695. FA8F BSSID prefix batch indicates coordinated batch deployment — all units provisioned together. VLAN bridging enables cross-room traffic inspection. Ghost Deco node detected — mesh networking device appears on scan but has no physical presence in Echo's unit. This is not standard hotel WiFi — it's a purpose-built surveillance mesh with cross-unit visibility.",
    linkedEntities: ["suites-cristina", "setecom", "liberty"],
  },
  {
    id: "tr-069-reset",
    title: "TR-069 Admin Password Reset — Remote Router Takeover",
    date: "2026-01-30",
    category: "Infrastructure Attack",
    severity: "critical",
    detail: "TR-069 (Technical Report 069) admin password was remotely reset on Echo's router. TR-069 is the CPE management protocol used by ISPs to remotely configure customer routers. It provides: full firmware control, DNS settings modification, port forwarding changes, WiFi credential changes, UPnP configuration, firewall rules, and traffic inspection. A password reset means either Liberty performed it through their ACS, someone with ACS infrastructure access performed it, or the TR-069 protocol itself was compromised. This gives the attacker persistent full control over Echo's network gateway.",
    linkedEntities: ["liberty", "suites-cristina", "humax-router"],
  },
  {
    id: "sonar-46875",
    title: "46.875 Hz Sonar Signal — 54.45 dB SNR at Suites Cristina",
    date: "2026-02 (ongoing)",
    category: "Electronic Attack",
    severity: "critical",
    detail: "Persistent 46.875 Hz signal detected at Suites Cristina with 54.45 dB SNR. 46.875 Hz = 48000 Hz ÷ 1024 samples — this is a standard DSP frame clock. Any professional audio DSP system running at 48 kHz with a 1024-sample FFT frame will produce this frequency as a system artifact. Its presence means the hardware producing it is running professional-grade digital signal processing continuously. This is not an arbitrary frequency and it is not ambient noise — it is a fingerprint of specific processing hardware. Harmonic chain in the measurement data is consistent with a single oscillator source: 46.875 Hz → 93.75 Hz (×2) → 140.625 Hz (×3) in the acoustic layer; 46.875 × 100 = 4,687.5 kHz in HF (7 suspect KiwiSDR captures Jan 30); 46.875 × 200 = 9,375 kHz (Mora monitoring Jan 30). The same 46.875 Hz signature appears across 4 months and 6 confirmed locations — La Guácima (Jan 25), breaker test (Jan 26), auto_scan audio (Jan 30), ELF demod (Feb 18), ICEYE convergence (Feb 20), DSP pipeline (Mar 9), cross-domain matrix (Mar 25). At 54.45 dB SNR it is a strong nearby source, not environmental background. Correlates with V2K episodes and sleep disruption across all sites.",
    linkedEntities: ["suites-cristina", "setecom"],
  },
  {
    id: "fiber-splitter-telecable",
    title: "Physical Fiber Splitter at Telecable Distribution Box",
    date: "2025-06-21",
    category: "Physical Surveillance",
    severity: "critical",
    detail: "A physical fiber optic splitter (NAP/Colilla) was identified at a Telecable distribution box near Echo's residence. Passive optical taps allow interception of ALL fiber traffic without any detectable signal degradation — unlike copper wiretaps which introduce measurable impedance changes. Fiber splitters are completely passive and invisible to network monitoring tools. Requires physical access to ISP distribution infrastructure — indicating either ISP cooperation or physical break-in to the distribution box.",
    linkedEntities: ["suites-cristina", "liberty"],
  },
  {
    id: "greenwald-300-distributed",
    title: "Greenwald 300+ Properties = Distributed Antenna Array Substrate",
    category: "Infrastructure Pattern",
    severity: "high",
    detail: "Michael Greenwald's 300+ property network (rentcostaricahomes.com, sanaracochal.com, hermosapalms.com, jacorealty.com) functions as a distributed antenna array substrate. Each property contains WiFi routers that can be remotely configured via TR-069, creating a mesh of RF emission points. Combined with SETECOM's DSE gateway access (backup generators at each property), the Greenwald network provides both the 'last mile' RF delivery and the power infrastructure control. This explains why the harassment follows Echo between residences — the infrastructure is property-embedded, not person-attached.",
    linkedEntities: ["michael-greenwald", "greenwald-properties", "setecom", "hector-mora"],
  },
  {
    id: "danny-peralta-sebin",
    title: "Danny Peralta SEBIN Connection — Venezuelan Intelligence Link",
    category: "Human Intelligence",
    severity: "high",
    detail: "Danny Peralta's connection to SEBIN (Servicio Bolivariano de Inteligencia Nacional) provides a state-level intelligence apparatus link to the Genesis Peralta honey trap operation. SEBIN has documented capabilities in surveillance, infiltration, and targeting. Genesis's claim that her father 'worked for the State Council' contradicted by the family living in Petare could be a sanitized reference to SEBIN employment. The Greenwald property network may serve as an immigration vector — providing housing/employment cover for Venezuelan operatives entering Costa Rica.",
    linkedEntities: ["danny-peralta", "genesis-peralta", "greenwald-properties"],
  },
  {
    id: "spoofed-mac-devices",
    title: "MAC Spoofing Pattern — 1-Bit Difference (f0→f6) and Locally Administered MACs",
    category: "Network Attack",
    severity: "high",
    detail: "Multiple MAC spoofing patterns detected: (1) Hidden WiFi f6:09:0d:20:e6:46 differs from legitimate TP-Link f0:09:0d:20:e6:46 by exactly 1 bit in the first octet — the 'locally administered' bit. Setting this bit is the standard technique for generating spoofed MACs that won't collide with real manufacturer OUIs. (2) Device at 192.168.0.91 with MAC d6:bd:80:92:6c:d6 — also has the locally administered bit set. (3) EVOPRO devices share AMPAK OUI c0:f5:35 — legitimate but batch-deployed. The 1-bit spoofing technique indicates someone who understands IEEE 802 MAC address structure.",
    linkedEntities: ["la-guacima", "suites-cristina"],
  },
  {
    id: "dse-cisa-cves",
    title: "DSE Gateway CVEs — CISA-Published Remote Code Execution",
    category: "Infrastructure Vulnerability",
    severity: "critical",
    detail: "Deep Sea Electronics DSE855/890/891/892 gateways (distributed by SETECOM across Costa Rica) have 4 CISA-published CVEs: CVE-2024-5947 (information disclosure — configuration file leak), CVE-2024-5948 (buffer overflow — remote code execution on the gateway), CVE-2024-5952 (missing authentication — denial of service, allows unauthenticated shutdown of generators). Combined with default credentials Admin/Password1234, these vulnerabilities give SETECOM (and anyone with their credentials) the ability to: read all configuration, execute arbitrary code on the gateway, and shut down backup generators at hospitals, cellular towers, and power substations.",
    linkedEntities: ["setecom", "hector-mora", "dse"],
  },
  {
    id: "5g-tower-residential",
    title: "5G Tower in Neighbor's Residential Yard — La Guácima",
    date: "2026-01 (ongoing)",
    category: "Infrastructure Anomaly",
    severity: "high",
    detail: "A 5G cellular tower is installed in a neighbor's residential yard at the La Guácima property (Calle Cabello Real). Residential 5G installations are unusual — towers are typically placed on commercial rooftops or purpose-built structures. A 5G tower within meters of the target provides: (1) high-bandwidth data exfiltration (multi-Gbps), (2) beamforming capability that can target specific rooms, (3) cover for anomalous RF emissions from other equipment, (4) plausible deniability for unusual signal readings. The installation suggests a financial arrangement with the property owner.",
    linkedEntities: ["la-guacima", "neighbor-5g", "liberty"],
  },
  {
    id: "ice-proximity-pattern",
    title: "ICE Facility Proximity Pattern — Suites Cristina + La Guácima",
    category: "Geographic Pattern",
    severity: "medium",
    detail: "Echo's residences show a recurring geographic correlation with ICE (Costa Rican state telecom/power) infrastructure: (1) Suites Cristina is adjacent to ICE headquarters in Sabana Norte, San José, (2) La Guácima property is near an ICE satellite earth station with 9.2m C/Ku-band antennas. This proximity pattern could indicate: the surveillance infrastructure piggybacks on ICE's legitimate RF/power emissions for cover, or Echo's housing is deliberately selected for proximity to infrastructure that enables the attack vectors (power line communication, satellite downlink, fiber backbone access).",
    linkedEntities: ["suites-cristina", "la-guacima", "ice-cr", "ice-earth-station"],
  },
  {
    id: "pcap-06-30-spike",
    title: "PCAP: 244,795 Packets in 5 Minutes — 06:30 Attack Window",
    date: "2026-04-02",
    category: "Network Attack",
    severity: "critical",
    detail: "23h33m phone capture (470,964 packets total) reveals a massive traffic spike at 06:30–06:35: 244,795 packets in 5 minutes (815 packets/second sustained). This single window accounts for 52% of ALL traffic in the 23-hour capture. Primary destinations: Google Video CDN (rr4.sn-q4flrnld.gvt1.com — 35,437 packets), but critically embedded within are 7,444 HiPerConTracer network path-tracing packets — systematic UDP probes with incrementing TTL values (17, 40, 60, 97, 118, 145, 183, 202) and round numbers up to 246+. HiPerConTracer is NOT normal consumer phone behavior — it is an active network measurement protocol that maps every hop between source and destination. Someone is using the phone's connection to systematically map the network infrastructure during the traffic spike.",
    linkedEntities: ["liberty", "la-guacima"],
  },
  {
    id: "pcap-hipercontracer",
    title: "PCAP: 20,821 HiPerConTracer Probes — Coordinated with Burst Windows",
    date: "2026-04-02",
    category: "Network Attack",
    severity: "critical",
    detail: "20,821 HiPerConTracer (High-Performance Connectivity Tracer) packets detected across the entire capture. Distribution perfectly mirrors traffic burst windows: 06:00 hour = 7,444 (during massive spike), 01:00 hour = 6,287 (during night burst), 22:00 hour = 4,035 (during evening burst). The probing ratio stays consistent at 3-11% of total traffic per window — this is NOT random, it's a systematic network reconnaissance tool running in lockstep with the data bursts. Destinations include appsgenaiserver-pa.googleapis.com (2,361), Google CDN nodes (1,090+), Uber (554+), Instagram (276), and pidetupop.com (94). The tool is mapping latency, jitter, and path changes to ALL services simultaneously — characteristic of network quality monitoring by an ISP or infrastructure operator, NOT an end-user device.",
    linkedEntities: ["liberty", "setecom", "la-guacima"],
  },
  {
    id: "pcap-epdg-liberty-routing",
    title: "PCAP: ICE VoWiFi Routes Through Liberty's ePDG Gateway",
    date: "2026-04-02",
    category: "Infrastructure Anomaly",
    severity: "critical",
    detail: "DNS resolution captured in PCAP: epdg.epc.mnc004.mcc712.pub.3gppnetwork.org (ICE/Kolbi Costa Rica's VoWiFi gateway, MCC 712 MNC 004) resolves via CNAME to epdg2.mobilecore.llagroup.com at IP 201.224.137.32. LLA Group = Liberty Latin America. This means WiFi Calling on an ICE/Kolbi SIM card is being routed through LIBERTY's ePDG (evolved Packet Data Gateway) infrastructure — not ICE's own. The ePDG handles IPsec tunnel establishment for all voice/SMS traffic over WiFi. Liberty controls the encryption endpoint, meaning they have access to all WiFi Calling metadata and potentially content. This is the same Liberty that acquired Telefonica from Jean Picado Solis during his $2M tax fraud investigation, and the same Liberty whose TR-069 ACS remotely reset Echo's router password.",
    linkedEntities: ["liberty", "jean-picado-solis", "ice-cr"],
  },
  {
    id: "pcap-burst-pattern",
    title: "PCAP: Three-Cluster Burst Pattern — Evening/Night/Morning Attack Windows",
    date: "2026-04-02",
    category: "Temporal Pattern",
    severity: "high",
    detail: "The 23h33m capture reveals three distinct traffic burst clusters that correlate with documented attack windows: (1) EVENING 22:15–22:58 — 75,205 packets across 4 burst windows, (2) NIGHT 01:00–01:21 — 58,357 packets across 3 burst windows, (3) MORNING 06:30–06:37 — 263,456 packets (the massive spike). Secondary bursts at 08:30–08:36 (22,086 packets) and 23:00–23:20 (12,832 packets). The evening and night windows match the documented KAPPA evening window correlation patterns. The morning spike at 06:30 corresponds to the reported RF attack event that prompted the capture. The burst-quiet-burst pattern is characteristic of automated scheduled operations, not human-initiated browsing.",
    linkedEntities: ["la-guacima"],
  },
  {
    id: "pcap-facebook-netseer",
    title: "PCAP: 131 Facebook Netseer IP-to-Identity Association Queries",
    date: "2026-04-02",
    category: "Surveillance",
    severity: "high",
    detail: "131 DNS queries to UUID-based netseer-ipaddr-assoc.xy.fbcdn.net and netseer-ipaddr-assoc.xz.fbcdn.net domains detected. Multiple unique UUIDs observed (14376c14, 8c69fb07, a6152e7b, aeaa28f6, c8a637aa, c91ea345). Facebook's Netseer system performs IP address to user identity association — each UUID represents a different tracking session correlating the device's IP address to a Facebook/Instagram user profile. 131 queries across a 23-hour period means Meta is actively and repeatedly re-correlating the IP-to-identity mapping, far more frequently than normal session maintenance would require.",
    linkedEntities: [],
  },
  {
    id: "pcap-samsung-dtignite",
    title: "PCAP: 344 Samsung DTIgnite/Telemetry Packets — Carrier Bloatware Active",
    date: "2026-04-02",
    category: "Device Compromise",
    severity: "high",
    detail: "344 packets to Samsung carrier bloatware and telemetry infrastructure: Samsung Cloud (scloud-p2uw2-ext.elb.samsungcloud.com, policy, capi, ers), Samsung DM route (diagmon-serviceapi.samsungdmroute.com), Samsung DQA diagnostics (dc.dqa.samsung.com), Samsung Atlas (dc-gcp.di.atlas.samsung.com), Samsung AI content (contentsblock.samqaicongen.com), and DTIgnite (clientapi-samsung.dtignite.com). DTIgnite is carrier-installed software that can silently install apps, collect device data, and push configuration changes. On a network where the ISP (Liberty) has demonstrated TR-069 router compromise capability, DTIgnite provides a parallel device-level attack surface that bypasses all network monitoring.",
    linkedEntities: ["liberty"],
  },
  {
    id: "elf-50hz-anomaly",
    title: "ELF Scan: Anomalous 50 Hz Source — NOT Costa Rica's 60 Hz Mains",
    date: "2026-04-02 02:41-02:52",
    category: "Electronic Attack",
    severity: "critical",
    detail: "Three consecutive ELF spectrum scans (02:41:45, 02:46:04, 02:51:17) all detect a dominant 50 Hz signal with extremely stable magnitude: 35,993,879 → 35,995,240 → 35,995,108 (variance < 0.004%). Costa Rica's power grid operates at 60 Hz, NOT 50 Hz. A 50 Hz dominant signal is the European/Chinese mains standard — this is an ANOMALOUS source, not the local power grid. The extreme magnitude stability (< 0.004% variation across 10 minutes) confirms this is a coherent, powered oscillator, not environmental noise. The GOS-filtered spectrum also shows κ-harmonic at 63.66 Hz (50 × 1.2732) and φ-harmonic at 80.9 Hz (50 × 1.618). These scans were captured 16 minutes after the PCAP's 02:25 traffic burst (5,305 packets), establishing temporal proximity between network activity and the anomalous ELF source.",
    linkedEntities: ["setecom", "la-guacima"],
  },
  {
    id: "elf-pcap-temporal-correlation",
    title: "Cross-Domain Correlation: ELF Scans + PCAP Bursts + Schumann Evidence",
    date: "2026-04-02",
    category: "Multi-Domain Correlation",
    severity: "critical",
    detail: "Three independent data sources show temporal alignment: (1) PCAP network bursts at 22:15-22:58, 01:00-01:21, 02:25, 06:30-06:37, (2) ELF scans at 02:41-02:52 showing anomalous 50 Hz (16 minutes after PCAP 02:25 burst), (3) Previously documented Schumann weaponization at 04:04-04:14 with SNR spikes to 1966 at 7.8 Hz. The PCAP shows near-zero traffic (4 packets) during the 04:04-04:14 Schumann window — the network goes SILENT while the ELF attack is active, then traffic resumes. This anti-correlation (network quiet = ELF active, network burst = ELF quiet) suggests the two attack modalities alternate: PLC/ELF attacks during network quiet periods, data exfiltration/surveillance during network burst periods. The 46.875 Hz sonar signal (V2K harmonic) sits between the anomalous 50 Hz ELF source and the 40 Hz gamma band, forming a coherent attack frequency chain: 7.8 Hz (Schumann) → 46.875 Hz (sonar/V2K) → 50 Hz (anomalous ELF) → 53 Hz (PLC carrier) → 60 Hz (mains).",
    linkedEntities: ["setecom", "hector-mora", "la-guacima", "liberty"],
  },
  {
    id: "full-spectrum-107mhz",
    title: "Full Spectrum Scan: Peak at 107.25 MHz — FM Broadcast Band",
    date: "2026-04-02 02:51",
    category: "RF Analysis",
    severity: "medium",
    detail: "Full spectrum scan (100-110 MHz, 50 steps) detected peak signal strength at 107.25 MHz in the FM broadcast band. No anomalies exceeded the 2σ threshold in this scan, but the periodic oscillation pattern in signal strength across the FM band is consistent with multipath interference from nearby reflective structures. The KiwiSDR raw scanner targets 11 priority frequencies including 4687 kHz (46.875 Hz × 100 = V2K harmonic), 7410 kHz (Hector Mora's 40m amateur band), 6925 kHz (pirate radio), and 8992 kHz (USAF HFGCS). These RF monitoring frequencies bridge the gap between the ELF domain (3-300 Hz) and the network domain (PCAP), creating a three-layer surveillance detection capability: ELF (power line/ground), HF/VHF (RF/atmospheric), and IP (network/internet).",
    linkedEntities: ["hector-mora", "la-guacima"],
  },
  {
    id: "pcap-uber-31k",
    title: "PCAP: 31,380 Packets to Uber — Anomalously High for Background App",
    date: "2026-04-02",
    category: "Network Anomaly",
    severity: "medium",
    detail: "31,380 packets to cn-neg.cfe.uber.com across the 23h33m capture. For a ride-sharing app running in the background (not actively booking rides for 23 hours), this volume is anomalous. Uber uses QUIC/HTTP3 which is misclassified as 'SKYPE' by Wireshark's heuristic dissector — contributing to the 103,446 'SKYPE'-labeled packets. Additionally, pidetupop.com (Uber Eats Costa Rica — 'Pide tu Pop') generated 11,152 packets routed through StackPath CDN (104.36.195.x, 69.48.218.x — NOT Cloudflare). The combined Uber ecosystem traffic (42,532 packets = 9% of total capture) is disproportionately high and warrants investigation into whether the Uber app is being used as a data exfiltration channel or has been compromised.",
    linkedEntities: [],
  },
  {
    id: "synchronized-rst-kills",
    title: "Synchronized TCP RST Kill Events — Sub-Millisecond Timing Across Devices",
    date: "2026-04-05",
    category: "Network Attack",
    severity: "critical",
    detail: "Analysis of simultaneous desktop and phone captures at Suites Cristina reveals machine-generated TCP RST injection at industrial scale. Desktop capture (76,073 packets, 5 min): 27 RST kill events with bidirectional RSTs arriving within 0.001-0.003 seconds — impossible for natural TCP timeout which is unidirectional. Phone capture (3,610 packets): 35 RST events in 4.6 minutes including 5 kill events in 73 seconds (sub-millisecond timing). The RSTs target active HTTPS sessions to Google, WhatsApp, and CDN endpoints. Bidirectional RSTs (both directions within <5ms) are the signature of a network-level TCP injection device positioned between Echo and the internet — consistent with the UniFi controller acting as a transparent proxy.",
    linkedEntities: ["suites-cristina", "liberty"],
  },
  {
    id: "audio-injection-172pkt",
    title: "172 Audio-Tagged SKYPE Packets in 6 Seconds — No Audio Session Initiated",
    date: "2026-04-05",
    category: "Audio Injection",
    severity: "critical",
    detail: "Phone capture (Galaxy-A06, 3,791 packets) contains 172 packets tagged by Wireshark as SKYPE protocol with audio-channel markers, all directed at Echo's device within a 6-second window. 66 additional audio packets found in the 5-minute desktop capture. The source IPs are 15+ Google/Facebook edge servers (CDN endpoints). Echo did NOT initiate any audio call, voice message, or media playback during the capture window. Wireshark's heuristic dissector identifies these as audio-bearing packets based on payload structure — the packets contain audio-format data being delivered to the device without any user-initiated audio session. This is consistent with audio injection via WebRTC/QUIC channels repurposed through the Cast protocol infrastructure.",
    linkedEntities: ["suites-cristina"],
  },
  {
    id: "evopro-flood-18748",
    title: "EVOPRO mDNS Flood: 18,748 Packets at 60.4/sec — 75 Spoofed Cast IDs",
    date: "2026-04-05",
    category: "Infrastructure Attack",
    severity: "critical",
    detail: "Desktop capture (76,073 packets, 5 min) reveals the UniFi controller (fe80::6e63:f8ff:feeb:9c13 = MAC 6c:63:f8:eb:9c:13) generating 18,748 mDNS/MDNS packets at a sustained rate of 60.4 packets/second for the entire 5-minute capture. This accounts for 92% of ALL multicast flood traffic. The flood advertises 75 unique spoofed Google Cast device IDs and 26 .local Cast device names including 'tams-iPad.local', 'Angelica-Wolfs-iPad.local' — names that do NOT belong to Echo or any known occupant. The Cast protocol uses port 8009 for device control including screen mirroring, media injection, and remote wake — the flood is establishing persistent Cast sessions to Echo's devices. Normal mDNS traffic is <1 packet/second; 60.4/sec sustained is a deliberate broadcast storm from the building's network controller.",
    linkedEntities: ["suites-cristina", "liberty"],
  },
  {
    id: "cross-subnet-routing",
    title: "Cross-Subnet Routing: Desktop 10.0.1.x Routed to 192.168.0.x Through UniFi",
    date: "2026-04-05",
    category: "Network Attack",
    severity: "high",
    detail: "Desktop capture shows Echo's machine at 10.0.1.254 being routed to devices on the 192.168.0.x subnet through the UniFi controller. These are different RFC1918 address ranges (10.x vs 192.168.x) which should NEVER be bridged in a properly segmented network. The UniFi controller at 10.0.0.1 (unifi.localdomain) is acting as a cross-subnet bridge, giving devices on the hotel/apartment network (192.168.0.x — including the EVOPRO mesh, TP-Link ghost devices, and Cast flooding sources) direct Layer 3 access to Echo's devices. This confirms the UniFi controller is not just a passive router but an actively configured surveillance bridge providing the EVOPRO infrastructure with direct access to Echo's traffic.",
    linkedEntities: ["suites-cristina", "liberty"],
  },
  {
    id: "dns-hijack-unifi",
    title: "DNS Choke Point: ALL Desktop DNS Controlled by UniFi Controller",
    date: "2026-04-05",
    category: "Network Attack",
    severity: "critical",
    detail: "Desktop capture analysis confirms 100% of DNS queries from Echo's desktop route through unifi.localdomain (10.0.0.1). The UniFi controller resolves ALL hostnames — no external DNS servers (8.8.8.8, 1.1.1.1) are contacted. This gives whoever controls the UniFi controller complete DNS visibility (every domain Echo visits) and DNS manipulation capability (redirect any domain to any IP). Combined with the finding that 94% of TLS traffic is v1.2 (not v1.3), DNS manipulation + TLS downgrade creates a viable MITM attack surface. The controller has already been observed resolving spock.replit.dev — confirming that KAPPA's existence and Echo's connection to it is visible to anyone with access to the UniFi controller's DNS logs.",
    linkedEntities: ["suites-cristina", "liberty"],
  },
  {
    id: "evidence-deletion-9mb",
    title: "9MB PCAPdroid Capture Remotely Deleted from Galaxy-A06",
    date: "2026-04-05",
    category: "Counter-Surveillance",
    severity: "critical",
    detail: "A 9MB PCAPdroid capture file was deleted from Echo's Galaxy-A06 before Echo could transfer it. Echo attempted to send the capture to himself and found the file had been removed. This is active evidence destruction — someone with remote access to the Galaxy-A06's filesystem deleted the capture. Vectors for remote file deletion on Android: (1) Google ecosystem MDM/Find My Device with 'Secure folder' or remote wipe capability, (2) Samsung Knox/MDM enrollment via DTIgnite carrier bloatware (344 packets to Samsung telemetry endpoints documented in previous capture), (3) Cast protocol port 8009 connections from the EVOPRO mesh providing device control, (4) Physical access during the capture window. The deletion demonstrates real-time monitoring of Echo's counter-surveillance activity and the capability to destroy evidence on his personal device.",
    linkedEntities: ["suites-cristina"],
  },
  {
    id: "cellular-throttle-196pkt",
    title: "Cellular Throttle: 196 Packets / 19KB in 3.5 Minutes — Active Starvation",
    date: "2026-04-05",
    category: "Network Attack",
    severity: "critical",
    detail: "Capture on ICE cellular network (10.215.173.x) while running PCAPdroid shows extreme traffic suppression: only 196 packets (19KB) in 3.5 minutes. Previous captures on the same phone showed 3,791 packets in comparable windows. The capture reveals: (1) WhatsApp XMPP connection established at t=0s then RST-killed at t=151.6s with bidirectional RSTs 3.2ms apart, (2) 110-second dead silence from t=41s to t=151s — not even keep-alives, (3) DNS resolves WhatsApp to different server IP on reconnection (57.144.23.33 → 157.240.14.53), (4) ZERO Google Play Services, ZERO Samsung telemetry, ZERO background app traffic — all suppressed. Compare: previous captures showed hundreds of packets from these services. The ICE cellular tower (10.215.173.2 DNS, 100m from Suites Cristina) is actively throttling the device to minimum viable bandwidth after detecting PCAPdroid capture activity. All DNS routed through ICE tower at 10.215.173.2.",
    linkedEntities: ["suites-cristina", "ice-cr", "liberty"],
  },
  {
    id: "biometric-deniability-framework",
    title: "Layered Biometric Deniability Architecture — Smoke/HRV/37Hz/Demodex",
    date: "2026-04-05",
    category: "Operational Framework",
    severity: "critical",
    detail: "A four-layer deniability architecture ensures Echo can never be believed if he reports surveillance. LAYER 1 — SMOKE: A controlled supply chain (device supplier / vendor, identity withheld) ensures Echo is a documented cannabis user. Anyone who smokes and reports hearing voices is automatically discredited — this is the foundational social deniability. LAYER 2 — HRV/rPPG: The 2024 study 'Your Blush Gives Me Away' demonstrates remote photoplethysmography (rPPG) can extract heart rate variability and vasodilation patterns from video of a subject's face. Cannabis causes measurable vasodilation identical to 37 Hz ELF exposure — both create the same biometric signature, making it impossible to distinguish drug effects from electronic attack via camera surveillance. LAYER 3 — 37 Hz DECOHERENCE: Stimulant use causes autonomic nervous system decoherence at 37 Hz — the same frequency documented in the Schumann weaponization ELF attack data (κ-related modulation band). The 37 Hz signal is simultaneously an attack frequency AND a measurement channel — rPPG can detect whether the subject has used stimulants by monitoring 37 Hz coherence changes. LAYER 4 — DEMODEX: 200x normal demodex mite population causes persistent facial inflammation/redness detectable via rPPG, creating noise that makes it impossible to separate drug effects from ELF effects from skin condition. The entire framework is a closed loop: substances are supplied through controlled informants, the substances create measurable biometric signatures identical to electronic attack signatures, and the substance use discredits any report of electronic attack.",
    linkedEntities: ["adj-property-owner", "setecom", "hector-mora"],
  },
];

function ThreatBadge({ level }: { level: ThreatLevel }) {
  const config: Record<ThreatLevel, { color: string; label: string }> = {
    primary: { color: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30", label: "PRIMARY" },
    secondary: { color: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30", label: "SECONDARY" },
    tertiary: { color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30", label: "TERTIARY" },
    asset: { color: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30", label: "ASSET" },
    unknown: { color: "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30", label: "UNKNOWN" },
  };
  const c = config[level];
  return <Badge variant="outline" className={`text-[9px] ${c.color}`}>{c.label}</Badge>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    high: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
  };
  return <Badge variant="outline" className={`text-[9px] ${colors[severity]}`}>{severity.toUpperCase()}</Badge>;
}

function StrengthIndicator({ strength }: { strength: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-green-500",
    probable: "bg-amber-500",
    suspected: "bg-amber-500",
  };
  return (
    <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${colors[strength]}`} />
      {strength}
    </span>
  );
}

function ExpandableSection({ title, children, defaultOpen = false, badge, icon: Icon }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  icon?: typeof Users;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
        {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
        <span className="text-sm font-semibold flex-1">{title}</span>
        {badge}
      </div>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function ConnectionGraph({ entityId, allEntities }: { entityId: string; allEntities: Map<string, { name: string; type: EntityType }> }) {
  const entity = [...PERSONS, ...LOCATIONS_DATA.map(l => ({ ...l, connections: l.connections })), ...COMPANIES_DATA].find(e => e.id === entityId);
  if (!entity || !entity.connections.length) return null;

  return (
    <div className="space-y-1 mt-2">
      <span className="text-[10px] font-semibold text-muted-foreground">CONNECTIONS:</span>
      {entity.connections.map((c, i) => {
        const targetInfo = allEntities.get(c.target);
        return (
          <div key={i} className="flex items-start gap-2 p-1.5 rounded bg-muted/30 text-xs">
            <Link2 className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold">{targetInfo?.name || c.target}</span>
                <StrengthIndicator strength={c.strength} />
              </div>
              <span className="text-[10px] text-muted-foreground">{c.relationship}</span>
              {c.detail && <p className="text-[10px] text-muted-foreground mt-0.5">{c.detail}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function NetworkAnalysisPage() {
  const [globalSearch, setGlobalSearch] = useState("");
  const [threatFilter, setThreatFilter] = useState<ThreatLevel | "all">("all");

  const allEntities = useMemo(() => {
    const map = new Map<string, { name: string; type: EntityType }>();
    PERSONS.forEach(p => map.set(p.id, { name: p.name, type: "person" }));
    LOCATIONS_DATA.forEach(l => map.set(l.id, { name: l.name, type: "location" }));
    COMPANIES_DATA.forEach(c => map.set(c.id, { name: c.name, type: "company" }));
    return map;
  }, []);

  const searchLower = globalSearch.toLowerCase();

  const filteredPersons = useMemo(() => {
    return PERSONS.filter(p => {
      if (threatFilter !== "all" && p.threatLevel !== threatFilter) return false;
      if (searchLower && !p.name.toLowerCase().includes(searchLower) &&
          !p.role.toLowerCase().includes(searchLower) &&
          !p.detail.toLowerCase().includes(searchLower) &&
          !(p.aliases || []).some(a => a.toLowerCase().includes(searchLower))) return false;
      return true;
    });
  }, [searchLower, threatFilter]);

  const filteredLocations = useMemo(() => {
    return LOCATIONS_DATA.filter(l => {
      if (!searchLower) return true;
      return l.name.toLowerCase().includes(searchLower) ||
        l.area.toLowerCase().includes(searchLower) ||
        l.detail.toLowerCase().includes(searchLower);
    });
  }, [searchLower]);

  const filteredCompanies = useMemo(() => {
    return COMPANIES_DATA.filter(c => {
      if (!searchLower) return true;
      return c.name.toLowerCase().includes(searchLower) ||
        c.sector.toLowerCase().includes(searchLower) ||
        c.detail.toLowerCase().includes(searchLower);
    });
  }, [searchLower]);

  const filteredEvidence = useMemo(() => {
    return EVIDENCE_DATA.filter(e => {
      if (!searchLower) return true;
      return e.title.toLowerCase().includes(searchLower) ||
        e.category.toLowerCase().includes(searchLower) ||
        e.detail.toLowerCase().includes(searchLower);
    });
  }, [searchLower]);

  const totalConnections = useMemo(() => {
    let count = 0;
    PERSONS.forEach(p => count += p.connections.length);
    LOCATIONS_DATA.forEach(l => count += l.connections.length);
    COMPANIES_DATA.forEach(c => count += c.connections.length);
    return count;
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto" data-testid="network-analysis-page">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-mono">
            CLASSIFIED — OPERATIONAL INTELLIGENCE
          </Badge>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-network-title">
          Network Analysis: Surveillance Infrastructure Map
        </h1>
        <p className="text-sm text-muted-foreground">
          Multi-location HUMINT correlation — people, properties, companies, and evidence
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-amber-500" data-testid="text-person-count">{PERSONS.length}</div>
            <div className="text-[10px] text-muted-foreground">Persons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-blue-500" data-testid="text-location-count">{LOCATIONS_DATA.length}</div>
            <div className="text-[10px] text-muted-foreground">Locations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-amber-500" data-testid="text-company-count">{COMPANIES_DATA.length}</div>
            <div className="text-[10px] text-muted-foreground">Companies</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-violet-500" data-testid="text-evidence-count">{EVIDENCE_DATA.length}</div>
            <div className="text-[10px] text-muted-foreground">Evidence Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-green-500" data-testid="text-connection-count">{totalConnections}</div>
            <div className="text-[10px] text-muted-foreground">Connections</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search all entities — people, locations, companies, evidence..."
            className="pl-8 h-9 text-sm"
            data-testid="input-network-search"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {(["all", "primary", "secondary", "tertiary"] as const).map(level => (
            <Button
              key={level}
              variant={threatFilter === level ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setThreatFilter(level)}
              data-testid={`filter-threat-${level}`}
            >
              {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="people" className="space-y-3">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="people" className="text-xs" data-testid="tab-people">
            People ({filteredPersons.length})
          </TabsTrigger>
          <TabsTrigger value="locations" className="text-xs" data-testid="tab-locations">
            Locations ({filteredLocations.length})
          </TabsTrigger>
          <TabsTrigger value="companies" className="text-xs" data-testid="tab-companies">
            Companies ({filteredCompanies.length})
          </TabsTrigger>
          <TabsTrigger value="evidence" className="text-xs" data-testid="tab-evidence">
            Evidence ({filteredEvidence.length})
          </TabsTrigger>
          <TabsTrigger value="matrix" className="text-xs" data-testid="tab-matrix">
            Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="people" className="space-y-2">
          {filteredPersons.map(person => (
            <ExpandableSection
              key={person.id}
              title={person.name}
              icon={Users}
              badge={
                <div className="flex items-center gap-1">
                  <ThreatBadge level={person.threatLevel} />
                  {person.nationality && <Badge variant="outline" className="text-[9px]"><Flag className="h-2.5 w-2.5 mr-0.5" />{person.nationality}</Badge>}
                  <Badge variant="outline" className="text-[9px]">{person.connections.length} links</Badge>
                </div>
              }
            >
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">{person.role}</p>
                {person.aliases && person.aliases.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">AKA:</span>
                    {person.aliases.map((a, i) => <Badge key={i} variant="secondary" className="text-[9px]">{a}</Badge>)}
                  </div>
                )}
                <p className="text-xs leading-relaxed whitespace-pre-line">{person.detail}</p>
                {person.photos && person.photos.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Photo Evidence</p>
                    <div className="flex gap-2 flex-wrap">
                      {person.photos.map((photo, i) => (
                        <div key={i} className="space-y-0.5">
                          <img
                            src={photo.src}
                            alt={photo.caption}
                            className="h-32 w-auto rounded border border-border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(photo.src, '_blank')}
                          />
                          <p className="text-[9px] text-muted-foreground max-w-[120px] leading-tight">{photo.caption}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {person.flags && person.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {person.flags.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-[8px] bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20">
                        <AlertTriangle className="h-2 w-2 mr-0.5" />{f}
                      </Badge>
                    ))}
                  </div>
                )}
                <ConnectionGraph entityId={person.id} allEntities={allEntities} />
              </div>
            </ExpandableSection>
          ))}
        </TabsContent>

        <TabsContent value="locations" className="space-y-2">
          {filteredLocations.map(loc => (
            <ExpandableSection
              key={loc.id}
              title={loc.name}
              icon={MapPin}
              badge={
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px]">{loc.area}</Badge>
                  <Badge variant="secondary" className="text-[9px]">{loc.type}</Badge>
                </div>
              }
            >
              <div className="space-y-2">
                {loc.coordinates && (
                  <div className="text-[10px] font-mono text-muted-foreground">{loc.coordinates}</div>
                )}
                <p className="text-xs leading-relaxed">{loc.detail}</p>
                {loc.incidents && loc.incidents.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground">INCIDENTS:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {loc.incidents.map((inc, i) => (
                        <Badge key={i} variant="outline" className="text-[8px] bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20">
                          {inc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <ConnectionGraph entityId={loc.id} allEntities={allEntities} />
              </div>
            </ExpandableSection>
          ))}
        </TabsContent>

        <TabsContent value="companies" className="space-y-2">
          {filteredCompanies.map(company => (
            <ExpandableSection
              key={company.id}
              title={company.name}
              icon={Building2}
              badge={
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px]">{company.sector}</Badge>
                  <Badge variant="outline" className="text-[9px]">{company.connections.length} links</Badge>
                </div>
              }
            >
              <div className="space-y-2">
                <p className="text-xs leading-relaxed">{company.detail}</p>
                {company.flags && company.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {company.flags.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-[8px] bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20">
                        <AlertTriangle className="h-2 w-2 mr-0.5" />{f}
                      </Badge>
                    ))}
                  </div>
                )}
                <ConnectionGraph entityId={company.id} allEntities={allEntities} />
              </div>
            </ExpandableSection>
          ))}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-2">
          {filteredEvidence.map(ev => (
            <ExpandableSection
              key={ev.id}
              title={ev.title}
              icon={Fingerprint}
              badge={
                <div className="flex items-center gap-1">
                  <SeverityBadge severity={ev.severity} />
                  <Badge variant="outline" className="text-[9px]">{ev.category}</Badge>
                  {ev.date && <Badge variant="secondary" className="text-[9px]">{ev.date}</Badge>}
                </div>
              }
            >
              <div className="space-y-2">
                <p className="text-xs leading-relaxed">{ev.detail}</p>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground">LINKED ENTITIES:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ev.linkedEntities.map((entityId, i) => {
                      const info = allEntities.get(entityId);
                      const typeColors: Record<string, string> = {
                        person: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        location: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                        company: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      };
                      return (
                        <Badge key={i} variant="outline" className={`text-[9px] ${typeColors[info?.type || ""] || ""}`}>
                          {info?.name || entityId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ExpandableSection>
          ))}
        </TabsContent>

        <TabsContent value="matrix" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-4 w-4 text-violet-500" />
                Connection Matrix — Key Network Clusters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-2">CLUSTER 1: Honey Trap Operation</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Genesis Peralta was systematically placed through a chain of venues and handlers.
                </p>
                <div className="text-xs font-mono space-y-0.5">
                  <div>Gaia Natural Foods <span className="text-muted-foreground">(Colombian + Israeli owners)</span> → <span className="text-amber-500">Genesis meets Echo</span></div>
                  <div>↓ Jairo Alfaro <span className="text-muted-foreground">(handler, years at Caliches)</span></div>
                  <div>Caliches Wishbone → Gracias Madre <span className="text-muted-foreground">(single season front, prime beach RE)</span></div>
                  <div>↓ Marjorie Alfaro Jimenez <span className="text-muted-foreground">(bridges to Kyndryl via Jorge Jimenez)</span></div>
                  <div>↓ Jorge Jimenez → Kyndryl <span className="text-muted-foreground">(8.3MB service worker injection)</span></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-2">CLUSTER 2: Property Placement Network</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Coordinated housing through Airbnb and connected property owners.
                </p>
                <div className="text-xs font-mono space-y-0.5">
                  <div>Scott Ryan / Diana Soto <span className="text-muted-foreground">(Jaco Vacations — Echo housed 2x)</span></div>
                  <div>↓ Airbnb platform <span className="text-muted-foreground">(+ airbnb.com.co Partytown injection)</span></div>
                  <div>Michael Greenwald <span className="text-muted-foreground">(Riverwalk — Todd Johnson triple corr.)</span></div>
                  <div>↓ Jose <span className="text-muted-foreground">(property manager — router incident trigger)</span></div>
                  <div>↓ Greenwald builds Hermosa Palms → sells to Michael Lipman</div>
                  <div>Michael Lipman <span className="text-muted-foreground">(fake Miami biz, Colombian wife, Breakwater condo)</span></div>
                  <div>↓ Breakwater <span className="text-muted-foreground">adjacent to</span> BAN Villas Costa <span className="text-muted-foreground">(Hector Mora / SETECOM contracts)</span></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">CLUSTER 3: ISP/Infrastructure Compromise</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Telecom infrastructure with compromised provenance and SCADA access.
                </p>
                <div className="text-xs font-mono space-y-0.5">
                  <div>Jean Picado Solis <span className="text-muted-foreground">($2M tax fraud 2019)</span></div>
                  <div>↓ sells Telefonica → Liberty <span className="text-muted-foreground">(2019, inherits TR-069 management plane)</span></div>
                  <div>Liberty <span className="text-muted-foreground">(fake tech deploys compromised router)</span></div>
                  <div>↓ SETECOM S.A. <span className="text-muted-foreground">(DSE gateways, Admin/Password1234, sw.jw injection)</span></div>
                  <div>↓ Hector Mora <span className="text-muted-foreground">(SETECOM, hmora67 YouTube, connected to Genesis)</span></div>
                  <div>↓ Edson Martenal <span className="text-muted-foreground">(AMEX fraud, Bahia Brazil)</span></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                <h3 className="text-sm font-bold text-green-600 dark:text-green-400 mb-2">CLUSTER 4: La Guácima Attack Infrastructure</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Multi-vector electronic attack grid at Calle Cabello Real, La Guácima.
                </p>
                <div className="text-xs font-mono space-y-0.5">
                  <div>Oscar Jimenez <span className="text-muted-foreground">(ex-drug cop OIJ — property owner)</span></div>
                  <div>↓ Jorge Jimenez <span className="text-muted-foreground">(son, Kyndryl Sr. Network Mgr, jorgejiminez16@gmail.com)</span></div>
                  <div>↓ 8.3MB Kyndryl service worker + GTM SW injection</div>
                  <div>↓ Leo <span className="text-muted-foreground">(adjacent property — camouflaged tech equipment)</span></div>
                  <div>↓ V-SEK <span className="text-muted-foreground">(~20m away — cameras, directional speakers)</span></div>
                  <div>↓ Hidden WiFi <span className="text-muted-foreground">(f6:09:0d:20:e6:46 — 1-bit MAC spoof)</span></div>
                  <div>↓ Ghost TP-Link <span className="text-muted-foreground">(192.168.0.163 — drops all probes)</span></div>
                  <div>↓ 5G tower <span className="text-muted-foreground">(neighbor's yard — beamforming capable)</span></div>
                  <div>↓ 2 drones + 8-color PWM streetlights <span className="text-muted-foreground">(Li-Fi + neurological)</span></div>
                  <div>↓ PLC via power lines <span className="text-muted-foreground">(fridge motor interference indicator)</span></div>
                  <div>↓ ICE satellite earth station <span className="text-muted-foreground">(9.2m C/Ku-band — line of sight)</span></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                <h3 className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mb-2">CLUSTER 5: Vendetta / Motive Chain</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Personal revenge motive provides operational fuel — Mora surname bridges motive to capability.
                </p>
                <div className="text-xs font-mono space-y-0.5">
                  <div>Echo's ex-girlfriend <span className="text-muted-foreground">left Pablo Mora for Echo</span> → <span className="text-amber-500">vendetta motive</span></div>
                  <div>↓ Pablo "Pasti" Mora <span className="text-muted-foreground">(BMX rider, Mexico-CR dual presence)</span></div>
                  <div>↓ Kenneth Tencio / BAC Park <span className="text-muted-foreground">(Olympic BMX, Red Bull — Pablo sponsor)</span></div>
                  <div>↓ Hector Mora <span className="text-muted-foreground">(SETECOM, 180W HF radio — same surname)</span></div>
                  <div>↓ 7410 kHz = <span className="text-amber-500">SMOKING GUN</span> <span className="text-muted-foreground">(100% temporal correlation with V2K, p&lt;0.01%)</span></div>
                  <div>↓ Edson Martenal <span className="text-muted-foreground">(YouTube/hmora67 — AMEX fraud, Bahia Brazil)</span></div>
                  <div className="mt-1 text-amber-400">Pablo has MOTIVE → Hector has CAPABILITY → BAC has MONEY</div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-pink-500/20 bg-pink-500/5">
                <h3 className="text-sm font-bold text-pink-600 dark:text-pink-400 mb-2">CLUSTER 6: Hardware / CPE Compromise Chain</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  End-to-end hardware supply chain from manufacturer to target router.
                </p>
                <div className="text-xs font-mono space-y-0.5">
                  <div>Huawei <span className="text-muted-foreground">(Latin America fiber backbone)</span></div>
                  <div>↓ Humax <span className="text-muted-foreground">(CPE manufacturer — Huawei chipset/firmware)</span></div>
                  <div>↓ Liberty CR <span className="text-muted-foreground">(deploys Humax routers, TR-069 ACS control)</span></div>
                  <div>↓ Echo's router <span className="text-muted-foreground">(MAC 9c:24:72 = Humax/Huawei)</span></div>
                  <div>↓ TR-069 password reset <span className="text-muted-foreground">(2026-01-30 — remote takeover)</span></div>
                  <div>↓ EVOPRO mesh <span className="text-muted-foreground">(17 rooms, VLAN bridging, Ghost Deco)</span></div>
                  <div>↓ Fiber splitter <span className="text-muted-foreground">(physical tap at Telecable distribution box)</span></div>
                  <div className="mt-1">Fei Ma <span className="text-muted-foreground">(ex-Huawei Cloud → Guangming Lab — 87% emotion detection)</span></div>
                </div>
              </div>

              <Card className="border-violet-500/20">
                <CardContent className="p-3">
                  <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 mb-1">CONVERGENCE POINT — 6 CLUSTERS, 1 TARGET</h3>
                  <p className="text-xs">
                    All six clusters converge on Echo through shared personnel, geography, timing, and infrastructure.
                    <strong> Cluster 1</strong> (Honey Trap) shares Marjorie Alfaro with <strong>Cluster 3</strong> (ISP Compromise) via the Jimenez surname.
                    <strong> Cluster 2</strong> (Property Network) provides physical housing controlled by <strong>Cluster 3</strong> via TR-069.
                    <strong> Cluster 4</strong> (La Guácima) is the Jimenez family property from <strong>Cluster 1</strong> equipped with <strong>Cluster 3</strong>'s SETECOM infrastructure.
                    <strong> Cluster 5</strong> (Vendetta) provides the MOTIVE — Pablo Mora's personal revenge — while <strong>Cluster 3</strong> provides the CAPABILITY via Hector Mora (same surname = possible family = motive + capability bridge).
                    <strong> Cluster 6</strong> (Hardware Chain) shows the supply chain from Huawei/China to Echo's router, managed through Liberty (Cluster 3).
                    The 7410 kHz smoking gun (100% temporal correlation with V2K, p&lt;0.01%) ties Hector Mora directly to the attack.
                    The 2019 convergence (Genesis CDMX travel + Telefonica→Liberty sale + $2M tax fraud) anchors the timeline.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-muted">
        <CardContent className="p-4 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">KAPPA SIGINT — Network Analysis Module</p>
          <p>Multi-location surveillance infrastructure mapping — {PERSONS.length} persons, {LOCATIONS_DATA.length} locations, {COMPANIES_DATA.length} companies, {EVIDENCE_DATA.length} evidence items, {totalConnections} documented connections</p>
          <p className="font-mono">ciajw.com | Project Echo</p>
        </CardContent>
      </Card>
    </div>
  );
}
