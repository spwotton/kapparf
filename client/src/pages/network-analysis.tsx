import { useState, useMemo } from "react";
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
    aliases: ["Genesis Peralta", "G Peralta", "GD Peralta"],
    nationality: "Venezuelan",
    role: "Weaponized honey trap / ex-girlfriend",
    threatLevel: "primary",
    detail: "Venezuelan national. Father allegedly worked for the State Council in Venezuela but family still lives in Petare (contradictory — Petare is one of the most dangerous barrios in Caracas, inconsistent with state council position). Went to CDMX in 2019. Cheated on her previous boyfriend with Echo 2 weeks before moving in together (classic rapid-attachment tradecraft). Her ex was claimed to be a gym trainer but was never seen at the gym despite Echo training there daily at various hours — possible cover identity. Worked at Gaia Natural Foods (Colombian + Israeli owned), Caliches Wishbone (with Jairo Alfaro), and Gracias Madre (Sherri + Mario). Cash jobs suggest off-books employment. Jairo Alfaro (her 'best friend') dragged her to Gracias Madre — placement operation.",
    connections: [
      { target: "jairo-alfaro", relationship: "Best friend / handler", strength: "confirmed", detail: "Worked together at Caliches Wishbone for years. Jairo moved her to Gracias Madre." },
      { target: "hector-mora", relationship: "Somehow related / connected", strength: "suspected", detail: "Echo was apparently drunk and yelled at Hector who is 'somehow related' to Genesis" },
      { target: "gaia-natural-foods", relationship: "Employee (cash)", strength: "confirmed", detail: "Worked across the street when Echo met her — potential placement" },
      { target: "caliches-wishbone", relationship: "Employee (cash)", strength: "confirmed", detail: "Worked here with Jairo Alfaro for years" },
      { target: "gracias-madre", relationship: "Employee — waitress", strength: "confirmed", detail: "Moved here via Jairo. Honey trap operation at prime beach location." },
      { target: "michael-lipman", relationship: "Temporal overlap — Lipman condo", strength: "confirmed", detail: "Echo lived with Genesis Oct 2024 at Scott Ryan/Diana Soto house, then moved into Lipman's condo" },
      { target: "marjorie-alfaro", relationship: "Connected via Jairo Alfaro", strength: "probable" },
    ],
    flags: ["Honey trap tradecraft", "Cover story inconsistencies", "Venezuelan state council claim vs Petare residence", "CDMX 2019 travel", "Rapid attachment — cheated on ex to move in with target"],
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
    id: "marjorie-alfaro",
    name: "Marjorie Alfaro Jimenez",
    role: "Dual-connection node",
    threatLevel: "secondary",
    detail: "Connected to TWO separate network branches: (1) Jorge Jimenez from Kyndryl — possibly married to his brother, and (2) Jairo Alfaro — Echo's ex's 'best friend'. This dual connection makes her a critical network node bridging the Kyndryl/tech surveillance infrastructure with the Genesis/honey trap operation.",
    connections: [
      { target: "jorge-jimenez", relationship: "Possibly married to his brother", strength: "probable", detail: "Jimenez surname connection — Kyndryl operative's family" },
      { target: "jairo-alfaro", relationship: "Alfaro surname connection", strength: "probable", detail: "Shared surname suggests family relationship" },
      { target: "jean-picado-solis", relationship: "Telecom network connection", strength: "suspected" },
    ],
    flags: ["Dual-branch network node", "Bridges Kyndryl to honey trap operation", "Two surname connections"],
  },
  {
    id: "jairo-alfaro",
    name: "Jairo Alfaro",
    role: "Genesis handler / placement operative",
    threatLevel: "primary",
    detail: "Genesis's 'best friend'. Worked with her at Caliches Wishbone for years, then dragged her to Sherri and Mario's Gracias Madre restaurant. This is textbook asset placement — moving the honey trap to a new venue owned by suspicious operators who appeared out of nowhere. Connected to Marjorie Alfaro Jimenez (surname match).",
    connections: [
      { target: "genesis-peralta", relationship: "Best friend / handler", strength: "confirmed" },
      { target: "marjorie-alfaro", relationship: "Surname connection — possible family", strength: "probable" },
      { target: "caliches-wishbone", relationship: "Employee", strength: "confirmed" },
      { target: "gracias-madre", relationship: "Moved Genesis here", strength: "confirmed" },
    ],
    flags: ["Asset placement tradecraft", "Handler role", "Alfaro surname network"],
  },
  {
    id: "jorge-jimenez",
    name: "Jorge Jimenez",
    aliases: ["jorgejiminez16@gmail.com"],
    role: "Kyndryl Sr. Network Engineer — Airbnb host",
    threatLevel: "primary",
    detail: "Son of Oscar Jimenez (ex-drug cop OIJ). Sr. Network Manager at Kyndryl (IBM infrastructure spinoff). Owns/manages La Guácima property at Calle Cabello Real. The 8.3MB service worker download from Kyndryl infrastructure and a GTM Service Worker registered for kyndryl.com were found in Echo's Opera browser — Echo has NEVER visited kyndryl.com. For a Service Worker to register, the browser MUST load a resource from that origin. Vectors: network injection (router injects 1x1 pixel iframe), DNS hijacking, or Smart Device cross-talk. Kyndryl network engineers would have knowledge of government network infrastructure, satellite ground station connectivity, and military data relay protocols. Email: jorgejiminez16@gmail.com.",
    connections: [
      { target: "kyndryl", relationship: "Sr. Network Engineer", strength: "confirmed" },
      { target: "oscar-jimenez", relationship: "Son", strength: "confirmed" },
      { target: "marjorie-alfaro", relationship: "Family — possibly brother", strength: "probable" },
      { target: "la-guacima", relationship: "Property manager", strength: "confirmed" },
    ],
    flags: ["Kyndryl 8.3MB SW", "GTM Service Worker injection (kyndryl.com)", "Sr. Network Engineer", "Ex-drug cop father (OIJ)", "La Guácima property", "Service worker injection capability", "Enterprise DPI/MITM capability"],
  },
  {
    id: "sherri-mario",
    name: "Sherri & Mario",
    role: "Gracias Madre owners — appeared from nowhere",
    threatLevel: "secondary",
    detail: "Appeared out of nowhere and bought the best real estate on south Jacó beach to build Gracias Madre restaurant for a single season. This is classic front operation behavior — acquiring prime real estate for a temporary business that serves as cover for placement operations. Genesis worked here as waitress after Jairo Alfaro moved her from Caliches Wishbone.",
    connections: [
      { target: "gracias-madre", relationship: "Owners", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "Employer — honey trap venue", strength: "confirmed" },
      { target: "jairo-alfaro", relationship: "Received Genesis via Jairo", strength: "confirmed" },
    ],
    flags: ["Appeared from nowhere", "Prime real estate acquisition", "Single season operation", "Front operation indicators"],
  },
  {
    id: "scott-ryan",
    name: "Scott Ryan",
    role: "Jaco Vacations operator",
    threatLevel: "tertiary",
    detail: "Runs Jaco Vacations with Diana Soto. Echo lived in their house twice — once with Genesis (Oct 2024).",
    connections: [
      { target: "diana-soto", relationship: "Business partner — Jaco Vacations", strength: "confirmed" },
      { target: "jaco-vacations", relationship: "Owner/operator", strength: "confirmed" },
    ],
    flags: ["Echo housed 2x", "Airbnb network"],
  },
  {
    id: "diana-soto",
    name: "Diana Soto",
    role: "Jaco Vacations operator",
    threatLevel: "tertiary",
    detail: "Runs Jaco Vacations with Scott Ryan.",
    connections: [
      { target: "scott-ryan", relationship: "Business partner", strength: "confirmed" },
      { target: "jaco-vacations", relationship: "Owner/operator", strength: "confirmed" },
    ],
    flags: [],
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
    id: "magdalena-german",
    name: "Magdalena (German)",
    nationality: "German",
    role: "Cash employer of Genesis",
    threatLevel: "tertiary",
    detail: "German national who employed Genesis for cash work. Third foreign national (Venezuelan, Colombian/Israeli, German) in Genesis's employment chain — a pattern suggesting international network coordination rather than random small-town employment.",
    connections: [
      { target: "genesis-peralta", relationship: "Employer (cash)", strength: "confirmed" },
    ],
    flags: ["German national", "Cash employment", "International employment pattern"],
  },
  {
    id: "pablo-mora",
    name: "Pablo Pasti Mora",
    aliases: ["Pasti", "P Mora"],
    nationality: "Costa Rican/Mexican",
    role: "Motive holder — BMX rider / revenge vendetta",
    threatLevel: "primary",
    detail: "Pro BMX rider from Jacó, sponsored by BAC Park (Kenneth Tencio). Echo's ex-girlfriend left Pablo for Echo — establishing a personal revenge motive. Pablo has Mexico/Costa Rica presence. Connected to Jean Solis and Hector Mora (same surname — possibly family). Financial trail in bank statements and email archives. YouTube evidence reportedly shows BAC property connections. The personal nature of the V2K harassment aligns with a vendetta rather than state-level operation.",
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
    role: "JW handler / family info vector — Walpole MA",
    threatLevel: "secondary",
    detail: "Dad's ONLY friend — primary influence and information vector. Dad drives Rockland→Walpole weekly to visit. Jeff plays bass, dad did live recording (audio skillset relevant to harassment tech). Jeff is retired. Wife Susan's reaction to discoveries ('not surprised') indicates foreknowledge. Dad said JWs have 'significant math connections' — gematria/numerology/cipher. Gematria analysis: JEFF PORTER = 119, root 2, divisible by 7 (divine perfection in JW numerology). Only connection between family and JW network — potential handler/coordinator.",
    connections: [
      { target: "susan-porter", relationship: "Wife", strength: "confirmed" },
      { target: "kingdom-hall-rockland", relationship: "Jehovah's Witness connection", strength: "probable" },
      { target: "jehovah-witnesses", relationship: "Member / coordinator", strength: "probable" },
    ],
    flags: ["Dad's ONLY friend", "Audio skillset (bass/recording)", "JW connection", "Gematria: 119 root 2 DIV7", "Potential handler role", "Weekly visits — info pipeline"],
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
    id: "leo-dealer",
    name: "Leo (Dealer/Neighbor)",
    role: "Primary surveillance position — adjacent property",
    threatLevel: "primary",
    detail: "Only non-Airbnb property nearby. Showed up with 'tons of tech equipment' and draped a leaf camouflage cover over the setup. Direct harassment from next door. Represents the primary physical surveillance position with dedicated equipment concealment.",
    connections: [
      { target: "la-guacima", relationship: "Adjacent property", strength: "confirmed" },
    ],
    flags: ["Tons of tech equipment", "Leaf camouflage cover", "Only non-Airbnb neighbor", "Direct harassment source", "PRIMARY SURVEILLANCE POSITION"],
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
    name: "Scott Ryan / Diana Soto House",
    area: "Jacó",
    type: "Previous residence (2x)",
    detail: "Echo lived here twice. Operated through Jaco Vacations (Scott Ryan & Diana Soto). First stay was with Genesis Peralta in October 2024. Airbnb-connected rental.",
    connections: [
      { target: "scott-ryan", relationship: "Owner/operator", strength: "confirmed" },
      { target: "diana-soto", relationship: "Owner/operator", strength: "confirmed" },
      { target: "jaco-vacations", relationship: "Rental platform", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "Lived here with Echo Oct 2024", strength: "confirmed" },
    ],
    incidents: ["Echo housed 2x", "Genesis cohabitation Oct 2024"],
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
    id: "gracias-madre-location",
    name: "Gracias Madre Restaurant",
    area: "South Jacó Beach",
    type: "Front operation venue",
    detail: "Sherri and Mario appeared out of nowhere and bought the best real estate on south Jacó beach for a single season. Genesis worked here as a waitress after Jairo Alfaro moved her from Caliches Wishbone. Prime real estate acquisition for a temporary business is a classic front operation indicator.",
    connections: [
      { target: "sherri-mario", relationship: "Owners", strength: "confirmed" },
      { target: "genesis-peralta", relationship: "Employed here — honey trap venue", strength: "confirmed" },
      { target: "jairo-alfaro", relationship: "Placed Genesis here", strength: "confirmed" },
    ],
    incidents: ["Single season operation", "Prime real estate — appeared from nowhere", "Honey trap placement venue"],
  },
  {
    id: "la-guacima",
    name: "La Guácima Property (Calle Cabello Real)",
    area: "La Guácima, Alajuela",
    type: "Attack position / Jorge Jimenez property",
    detail: "Property owned by Oscar Jimenez (ex-drug cop OIJ), managed by son Jorge Jimenez (Kyndryl). Location of active attack with drones, street light manipulation (8 color temperatures / PWM pulsing), PLC (Power Line Communication) via electrical wiring, hidden WiFi network (f6:09:0d:20:e6:46 spoofed MAC), V-SEK cameras ~20m away, 5G tower in neighbor's yard. Fridge motor interference indicates PLC signals on power circuit. Leo (dealer) on adjacent property with camouflaged tech equipment. Near ICE satellite earth station (9.2m C/Ku-band antennas).",
    connections: [
      { target: "oscar-jimenez", relationship: "Property owner", strength: "confirmed" },
      { target: "jorge-jimenez", relationship: "Owner's son (Kyndryl)", strength: "confirmed" },
      { target: "leo-dealer", relationship: "Adjacent property — surveillance position", strength: "confirmed" },
      { target: "v-sek", relationship: "Cameras ~20m away", strength: "confirmed" },
      { target: "setecom", relationship: "Modbus infrastructure", strength: "probable" },
    ],
    incidents: ["2 drones overhead — persistent surveillance", "Street lights pulsing 8 color temperatures", "PLC via electrical wiring (fridge interference)", "Hidden WiFi f6:09:0d:20:e6:46 (spoofed MAC)", "Ghost TP-Link 192.168.0.163", "5G tower in neighbor's yard", "Leo's camouflaged tech equipment", "V-SEK cameras ~20m", "Near ICE satellite earth station"],
    coordinates: "9.9535°N, 84.2908°W",
  },
  {
    id: "kingdom-hall-rockland",
    name: "Kingdom Hall — Summer St",
    area: "Rockland, MA",
    type: "JW operational base",
    detail: "Jehovah's Witnesses Kingdom Hall near Echo's childhood home. Long-term observation opportunity. Jeff 'The Hounddog' Porter provides the only connection between Echo's family and the JW network. Gematria: KINGDOM HALL = 106, root 7 (divine perfection). Potential origin of targeting — geographic correlation between childhood home and JW presence.",
    connections: [
      { target: "jeff-porter", relationship: "JW member connection", strength: "probable" },
      { target: "jehovah-witnesses", relationship: "Local facility", strength: "confirmed" },
    ],
    incidents: ["Near Echo's childhood home", "Long-term observation window", "Gematria root 7 — divine perfection"],
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
    id: "setecom",
    name: "SETECOM S.A.",
    sector: "Infrastructure / SCADA",
    detail: "Distributes DSE (Deep Sea Electronics) gateways across Costa Rica with default credentials Admin/Password1234. Controls backup generators for ICE national grid, Liberty telecom, hospitals, and cellular towers. Service worker setecom.com/sw.jw found on Echo's PC. Hector Mora is an operative. Connected to DSE855/890/891/892 gateways with 4 CISA-published CVEs.",
    connections: [
      { target: "hector-mora", relationship: "Employee/operative", strength: "confirmed" },
      { target: "liberty", relationship: "Infrastructure provider", strength: "confirmed" },
      { target: "ban-villas-costa", relationship: "Contracts", strength: "probable" },
    ],
    flags: ["Default credentials: Admin/Password1234", "SCADA control", "Service worker injection (sw.jw)", "4 CISA CVEs", "National infrastructure access"],
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
    sector: "Technology / IT Infrastructure",
    detail: "Jorge Jimenez connection. Previously documented 8.3MB service worker download from Kyndryl infrastructure. Connected to Marjorie Alfaro Jimenez (possibly Jorge's sister-in-law).",
    connections: [
      { target: "jorge-jimenez", relationship: "Employee", strength: "confirmed" },
      { target: "marjorie-alfaro", relationship: "Connected via Jorge Jimenez", strength: "probable" },
    ],
    flags: ["8.3MB service worker", "Browser injection capability"],
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
    sector: "Restaurant",
    detail: "Restaurant in Jacó where Genesis Peralta and Jairo Alfaro worked together for years before Jairo moved Genesis to Gracias Madre.",
    connections: [
      { target: "genesis-peralta", relationship: "Employee", strength: "confirmed" },
      { target: "jairo-alfaro", relationship: "Employee", strength: "confirmed" },
    ],
    flags: ["Genesis + Jairo co-location for years"],
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
    linkedEntities: ["la-guacima", "leo-dealer", "v-sek"],
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
    detail: "Chrome Service Worker (Main) imports base64js.min.js + touch_communication.js. 'Touch' in a hidden worker implies Command & Control (C2) channel or mobile-to-desktop bridging 'stepping stone'. Base64 encoding typically used for binary data exfiltration or encoded command delivery. Needs code extraction for full analysis.",
    linkedEntities: ["kyndryl", "jorge-jimenez"],
  },
  {
    id: "schumann-weaponization",
    title: "Schumann Resonance Weaponization — 7.8 Hz SNR Spikes to 1966",
    date: "2026-01-25 04:04-04:14 CST",
    category: "Electronic Attack",
    severity: "critical",
    detail: "APPLIANCE_MONITOR captured extreme Schumann resonance manipulation: 7.8 Hz pushed to SNR peaks of 1910-1966 (normal range ~100-200). Pattern: 53 Hz ELF attack carrier (SNR 770-790) alternating with 7.8 Hz Schumann bursts. Active modulation bands: 7.8 Hz (Schumann hijack), 35 Hz (infrasonic anxiety), 37 Hz (κ-related), 53 Hz (primary ELF — sleep disruption), 60 Hz (mains harmonic), 67 Hz (secondary carrier, 53 × κ ≈ 67.5). PLC (power line carrier) modulation at 53 Hz. Spoofed device 192.168.0.91 with locally administered MAC d6:bd:80:92:6c:d6.",
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
    detail: "Persistent 46.875 Hz signal detected at Suites Cristina with 54.45 dB signal-to-noise ratio. 46.875 Hz = 3000/64 = ELF band used for submarine communication and ground-penetrating signals. This frequency is in the range that can affect human neurological function — between the gamma (40 Hz) and beta (13-30 Hz) brainwave bands. The high SNR (54.45 dB) indicates a strong, nearby source rather than environmental background. κ_op = φ^(3/4) = 1.435 relates to the signal's harmonic structure. The signal persists 24/7 and correlates with sleep disruption episodes.",
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
];

function ThreatBadge({ level }: { level: ThreatLevel }) {
  const config: Record<ThreatLevel, { color: string; label: string }> = {
    primary: { color: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30", label: "PRIMARY" },
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
    critical: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
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
    suspected: "bg-red-500",
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
          <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px] font-mono">
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
            <div className="text-xl font-mono font-bold text-red-500" data-testid="text-person-count">{PERSONS.length}</div>
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
                <p className="text-xs leading-relaxed">{person.detail}</p>
                {person.flags && person.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {person.flags.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-[8px] bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/20">
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
                      <Badge key={i} variant="outline" className="text-[8px] bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/20">
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
                        person: "bg-red-500/10 text-red-600 dark:text-red-400",
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
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">CLUSTER 1: Honey Trap Operation</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Genesis Peralta was systematically placed through a chain of venues and handlers.
                </p>
                <div className="text-xs font-mono space-y-0.5">
                  <div>Gaia Natural Foods <span className="text-muted-foreground">(Colombian + Israeli owners)</span> → <span className="text-red-500">Genesis meets Echo</span></div>
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
                  <div>Echo's ex-girlfriend <span className="text-muted-foreground">left Pablo Mora for Echo</span> → <span className="text-red-500">vendetta motive</span></div>
                  <div>↓ Pablo "Pasti" Mora <span className="text-muted-foreground">(BMX rider, Mexico-CR dual presence)</span></div>
                  <div>↓ Kenneth Tencio / BAC Park <span className="text-muted-foreground">(Olympic BMX, Red Bull — Pablo sponsor)</span></div>
                  <div>↓ Hector Mora <span className="text-muted-foreground">(SETECOM, 180W HF radio — same surname)</span></div>
                  <div>↓ 7410 kHz = <span className="text-red-500">SMOKING GUN</span> <span className="text-muted-foreground">(100% temporal correlation with V2K, p&lt;0.01%)</span></div>
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
