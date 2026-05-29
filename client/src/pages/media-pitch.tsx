import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square, ChevronDown, ChevronUp, ExternalLink, FileText, AlertTriangle, Users, Home, Utensils, Radio, Zap, Globe } from "lucide-react";

interface Story {
  id: string;
  headline: string;
  subhead: string;
  category: string;
  power: "critical" | "major" | "significant";
  icon: typeof AlertTriangle;
  summary: string;
  keyFacts: string[];
  evidence: string[];
  angle: string;
  caveat?: string;
}

const STORIES: Story[] = [
  {
    id: "trafficking",
    headline: "Tattooed, Augmented, and Deployed: A Human Trafficking Network Operating Inside Costa Rica's Expat Scene",
    subhead: "Three confirmed cases of the same physical branding pattern across unconnected women — all linked to a single intelligence-adjacent network in Jacó",
    category: "Human Trafficking / Asset Control",
    power: "critical",
    icon: AlertTriangle,
    summary: "Documented physical branding pattern — thigh tattoo + breast augmentation — appears on at least three women (Genesis Peralta, Ale/Vida from Aurora Yoga, Lucia at Leo's property) across separate nodes of the same surveillance network in Jacó, Costa Rica. All three have Venezuelan origin or Venezuelan-network connections. Peralta is from Petare — the most dangerous barrio in Caracas — despite claiming her father worked for the State Council. Women demonstrate constrained agency, coordinated deployment around a single target, and documented sexual contact with multiple network male members simultaneously. One claimed to have been in CR for 9 years illegally with a fraudulent passport, requiring institutional support for daily operations that no individual could self-sustain.",
    keyFacts: [
      "3 confirmed instances of thigh tattoo + breast augmentation pattern across separate network nodes",
      "All three Venezuelan-origin or Venezuelan-network connected",
      "Genesis Peralta: Petare origin (poorest Caracas barrio), 9 years illegal CR residency, fraudulent passport held by subject",
      "No entry/exit record despite alleged July 2025 departure — ghost movement requiring document infrastructure",
      "Ale/Vida (Aurora Yoga): Margarita Island, kino incident same week as Peralta approach — coordinated deployment",
      "Lucia (Leo's property): recent augmentation, GitHub automation — probable fake-account factory for network",
      "Peralta documented with multiple BMX-circle males simultaneously (Pablo Mora, Junior Araya — video claimed)",
      "Women's movement controlled: Peralta always fled to network-controlled safe houses, never independent",
      "Aurora Yoga assessed as Venezuelan operative cluster + social collection + laundering circuit",
      "Recruiting pipeline: Petare → Margarita Island → Jacó = documented Venezuelan intelligence asset geography",
    ],
    evidence: [
      "Photographic comparison: thigh tattoo pattern across Peralta + Ale/Vida",
      "Gemini AI image analysis: 99.99% same cat — Peralta location confirmation",
      "Immigration records absence: no CR entry/exit record for 9-year resident",
      "Leo's apartment rotation: Junior Araya → Haitian kid → dark kid — managed asset cycling",
      "Aurora Yoga social map: Venezuelan cluster, Uber coordination, kino incident chain",
      "Lucia's GitHub: automation repos consistent with fake-account-factory infrastructure",
    ],
    angle: "The physical branding of trafficked assets for rapid network identification is documented in both sex-trafficking and intelligence operations. The convergence of these markers with a coordinated surveillance operation targeting a single American subject suggests a hybrid model: human trafficking infrastructure repurposed for or integrated with intelligence operations.",
    caveat: "Physical marker correlation is inferential. The trafficking assessment is based on behavioral patterns and is presented as an investigative hypothesis requiring further corroboration.",
  },
  {
    id: "cia-jw",
    headline: "Jehovah's Witnesses as CIA Cover: A Documented Pattern in a Costa Rican Beach Town",
    subhead: "Multiple Kingdom Hall–affiliated individuals cluster around a surveillance target — one with a self-disclosed CIA background",
    category: "Intelligence / Religion as Cover",
    power: "critical",
    icon: Globe,
    summary: "At least one individual in the documented Jacó network disclosed a CIA background directly to the subject. Multiple Kingdom Hall / Jehovah's Witness–affiliated individuals cluster around the surveillance target and operate in roles consistent with intelligence asset functions: social introduction, psychological management, financial facilitation, and safe-house access. The CIA/JW intersection is a documented historical tradecraft pattern — JW networks provide: global mobility with plausible religious cover, tight community discipline, internal communication channels, and resistance to external scrutiny.",
    keyFacts: [
      "Jeff Porter: self-disclosed CIA background, long-term AA member, introduced to Echo via AA substrate",
      "Kingdom Hall affiliation documented across multiple network-adjacent individuals",
      "JW provides: global mobility, plausible religious travel cover, community infrastructure, closed communication",
      "AA substrate and JW substrate overlap in Jacó — both operate through a single physical meeting space",
      "Dunia (DEW node operator): probable JW asset — pattern consistent with Jeff Porter / Kingdom Hall profile",
      "JW missionaries operate in 240 countries with no formal reporting requirement and community housing networks",
      "Historical CIA/JW operational intersection documented in multiple declassified operations",
    ],
    evidence: [
      "Jeff Porter direct CIA self-disclosure to subject",
      "Kingdom Hall affiliation documented",
      "AA/JW substrate overlap — shared social control infrastructure",
      "Dunia DEW node: JW profile assessment",
    ],
    angle: "Religious communities with global reach, strong internal discipline, and resistance to outside scrutiny have been used as intelligence covers historically. The concentration of JW-affiliated individuals in specific functional roles around a surveillance target in a small Costa Rican beach town warrants journalistic investigation.",
    caveat: "The CIA/JW connection is assessed from behavioral patterns and one self-disclosure. It is presented as an investigative lead, not a concluded fact.",
  },
  {
    id: "airbnb-surveillance",
    headline: "CIA-Linked Operators Modified Airbnb Properties Between Tenancies to Install Surveillance Hardware",
    subhead: "Lowered ceilings, hidden speakers, 28-camera clusters, and an Israeli alarm system — all installed while the target was between stays",
    category: "Surveillance Housing / CIA Infrastructure",
    power: "major",
    icon: Home,
    summary: "Casa Rexha (#42 Calle Naciones Unidas, Jacó) — owned by Scott Ryan (CIA affiliation documented) and Diana Soto — was structurally modified between Echo's two tenancies. Documented modifications include: ceiling lowered approximately 1.5 feet (sufficient to conceal sensor arrays), Israeli VISONIC alarm system installed (Visonic = Tel Aviv manufacturer, connected to Israeli national owning Gaia Natural Foods who employed Genesis Peralta), PIR motion sensors, hidden speakers, 28-camera high-mounted cluster, and a white drone stationed on the roof for approximately one week recording across the street. Diana Soto sent a 2am text demanding payment for 'external electronics' — a legal admission of electronic equipment installed and operated on the property.",
    keyFacts: [
      "Scott Ryan: documented CIA affiliation — owns CNU property cluster (multiple units)",
      "#42 CNU: ceiling lowered ~1.5ft between tenancies — structural modification for sensor array",
      "Israeli VISONIC alarm system: Tel Aviv manufacturer installed at CIA-attributed property",
      "Visonic thread: Israeli manufacturer → Israeli national at Gaia Natural Foods → employed Peralta → Echo first contact",
      "28-camera high-mounted cluster",
      "Hidden speakers embedded in walls",
      "White drone: stationed on roof ~1 week recording across street; removed after Echo documented it",
      "Giant beachball deployed as RF camouflage after drone removal",
      "Diana Soto 2am text: demanded payment for 'external electronics' = legal admission of installed equipment",
      "Pool maintenance person left water running 24hrs/day — bill inflation",
      "Departure harassment: attempted $2,500 charge for full month on day-1 departure",
      "Property cluster: CNU #34, #42, across-street unit, Casa Keenan — full 360° coverage",
    ],
    evidence: [
      "Diana Soto 2am text — screenshot",
      "Drone video recorded by Echo before removal",
      "Structural modification evidence: lowered ceiling documentation",
      "28-camera cluster — photographic",
      "Scott Ryan property records — Registro Nacional CR",
      "Visonic alarm system — model documentation",
    ],
    angle: "Airbnb-model short-term rental properties as persistent surveillance infrastructure is an emerging documented phenomenon. A CIA-attributed operator modifying a rental property between tenancies and then demanding payment for 'external electronics' is a story with documentary evidence that speaks for itself.",
    caveat: "Scott Ryan CIA affiliation is based on investigative assessment. Property ownership is verifiable via Registro Nacional CR.",
  },
  {
    id: "restaurants",
    headline: "Jacó's Restaurant Surveillance Grid: Every Venue a Target's Ex-Girlfriend Worked Is a Front Operation",
    subhead: "Three venues — all now simultaneously closed — were staffed and managed by the same handler network. The coordinated shutdown is the tell.",
    category: "Surveillance Infrastructure / Front Businesses",
    power: "major",
    icon: Utensils,
    summary: "Every restaurant, café, and food venue where Genesis Peralta (the intelligence asset deployed against Echo) worked or frequented in Jacó, Costa Rica is linked to her handler Jairo Alfaro or his alleged-brother network. Three venues closed simultaneously after the operation reached its target-access phase: Caliches Wishbone (8 years, Jairo + Peralta), Gracias Madre (1 season, Sherri + Mario from California who acquired prime beach real estate out of nowhere), and Yeyo's restaurant (Italian connection). Los Papos Mahi Mahi — the fourth venue — continues operating despite persistent financial struggles, consistent with external operational funding. Gaia Natural Foods (Colombian-Israeli ownership) was the placement venue for Peralta's initial contact with Echo. The simultaneous closure of three venues is the key indicator: organic restaurant closures don't synchronize.",
    keyFacts: [
      "Gaia Natural Foods (Colombian-Israeli): Peralta employed here when Echo first met her — placement venue",
      "Caliches Wishbone: 8 years Jairo + Peralta co-worker — now CLOSED",
      "Gracias Madre: Sherri + Mario (California), prime south-beach RE acquired out of nowhere, 1 season, now CLOSED (pop-up Santa Teresa)",
      "Yeyo's restaurant (Italian connection): Yeyo was Peralta's 2017 first-contact handler — now CLOSED",
      "Los Papos Mahi Mahi: Jairo lives here with 'alleged brother' Papo — financially struggling, still open",
      "Caliche (alleged Jairo brother) owns Caliches Wishbone AND a house in Los Sueños (gated marina enclave)",
      "Papo (alleged Jairo brother) owns Los Papos — Jairo lives with him",
      "All three closed venues = coordinated operational wind-down, not organic business failure",
      "Gaia owner = Israeli national with Visonic alarm thread to CIA surveillance property",
      "Cata (Gaia): also went to gym with Peralta — dual collection contact point",
    ],
    evidence: [
      "Business closure records",
      "HGTV 'Selling Paradise' + Sherri/Mario social media (Gracias Madre)",
      "8-year co-worker documentation (Peralta + Jairo at Caliches)",
      "Los Sueños property registry: Caliche ownership",
      "Instagram evidence: venue social accounts",
    ],
    angle: "The simultaneous closure of multiple food venues — each linked to the same person — after that person's operation against a single target concludes is a documented counterintelligence indicator. Costa Rica's cash-heavy hospitality economy and permissive business registration make it ideal for this model.",
  },
  {
    id: "v2k",
    headline: "Olympic BMX, a 4G Tower, and 100% Temporal Correlation: The Evidence for Voice-to-Skull Harassment in Costa Rica",
    subhead: "A network engineer's forensic analysis of RF emissions links a SETECOM operative with direct access to telecommunications infrastructure to documented directed-energy incidents",
    category: "Directed Energy / V2K",
    power: "major",
    icon: Radio,
    summary: "Seven separate RF captures at 7410 kHz show 100% temporal correlation within 2-minute windows with V2K harmonics at 4687 kHz and 9375 kHz — a probability of random coincidence below 0.01%. The source: Hector Mora (SETECOM S.A. operative), who simultaneously holds generator contracts at Breakwater Point AND Jaco BAN (adjacent properties, site of first documented incidents), and manages the 4G cell tower in the Breakwater parking lot. Hector's 180W HF Radio Transceiver (Chinese origin, capable of ionospheric skip) is documented. His IP (190.106.77.194, FortiGate 60F) has Modbus:502 exposed — SCADA-level infrastructure access. The motive layer: Pablo Mora (Red Bull BMX, connected via BAC Park to Olympic athlete Kenneth Tencio) is Genesis Peralta's stated prior boyfriend — whose girlfriend Echo took. The capability layer is Hector. Motive + capability = documented motive-capability pair.",
    keyFacts: [
      "7 RF captures at 7410 kHz: 100% temporal correlation with V2K harmonics — p < 0.01%",
      "Hector Mora: SETECOM S.A. — DSE gateway distribution, generator contracts, 4G tower management",
      "Generator contracts: Breakwater Point + Jaco BAN — both sites simultaneously",
      "4G tower: Breakwater parking lot, managed by Hector — IMSI capture + baseband RF control capability",
      "First V2K incidents: at Breakwater, proximate to Jaco BAN",
      "180W HF Radio Transceiver (Chinese origin) — ionospheric skip capable",
      "IP: 190.106.77.194 FortiGate 60F — Modbus:502 EXPOSED (SCADA access)",
      "YouTube: hmora67 — conversations with Edson Martenal, BAC property logins visible",
      "Pablo Mora: Red Bull BMX, Peralta's stated ex — personal revenge motive",
      "Kenneth Tencio: Olympic BMX (Tokyo 2020 4th), Red Bull, BAC Park owner — Pablo's sponsor",
      "False 'death threat' narrative fabricated against Echo — legal pretext creation",
    ],
    evidence: [
      "7 RF captures with timestamps — spectrograms available",
      "Hector Mora SETECOM records",
      "Modbus/Shodan scan: 190.106.77.194",
      "YouTube channel hmora67 — OSINT documentation",
      "BAC property contract evidence (YouTube login captures)",
      "4G tower location documentation",
    ],
    angle: "V2K / directed-energy harassment is documented in declassified US government reports (Havana Syndrome, CIA OMS reports) and is no longer fringe. A forensic RF correlation at below 0.01% probability of coincidence, linked to a specific individual with simultaneous access to the physical infrastructure at the incident site, is a publishable technical finding.",
  },
  {
    id: "real-estate-network",
    headline: "HGTV, Hotel Investments, and a Lawsuit by the River: How Costa Rica's Expat Real Estate Scene Became a Surveillance Infrastructure",
    subhead: "A network of American investors, a TV show, an Olympic athlete, and a grid of strategic properties — converging on one target",
    category: "Real Estate / Intelligence Infrastructure",
    power: "significant",
    icon: Home,
    summary: "The documented property infrastructure around Echo includes: a CIA-attributed property cluster on Calle Naciones Unidas (Scott Ryan / Diana Soto), Greenwald's house in Hermosa Palms (cat delivery site, safe house for Peralta), Hotel Amavi (Adam Harper + John/Quebrada Seca condo + Josh/wife = main investors), Todd Johnson's Riverwalk 5+6 (DeWave sonar/WiFi CSI imaging), and David Karr's dominant real estate position with a billboard outside La Flor. Adam Harper appeared on HGTV 'Selling Paradise.' His co-investor John has a condo in Quebrada Seca — the primary documented surveillance cluster. Israel Brooks built houses near the Los Ríos river zone (same geographic cluster). The property network forms a geographic ring around Echo's movement zones with investor nodes connecting back to the surveillance operational clusters.",
    keyFacts: [
      "Scott Ryan (CIA): owns CNU property cluster — modified between tenancies with surveillance hardware",
      "Greenwald (Hermosa Palms): safe house for Peralta, cat delivery by Jairo Alfaro",
      "Adam Harper: met Echo via Supplement Edge (Maine), moved to Hermosa Palms, Hotel Amavi investor",
      "Hotel Amavi investor John: also has Quebrada Seca condo — dual operational zone overlap",
      "Todd Johnson: Riverwalk 5+6, El Mirador — DeWave sonar/WiFi CSI imaging experiments",
      "David Karr: largest Jacó real estate operator, billboard outside La Flor (Echo's zone)",
      "Karr hired Shelby (no experience) — best friend of Brianna Harper (Adam's wife)",
      "Israel Brooks lawsuit by Adam: houses near Los Ríos river = Quebrada Seca ops zone geography",
      "Italian connection thread: Caliches Wishbone + Yeyo's + Hotel Amavi",
      "HGTV 'Selling Paradise': US television promoting CR real estate as investment vehicle",
    ],
    evidence: [
      "Registro Nacional CR: Scott Ryan property records",
      "Registro Nacional CR: Greenwald, Harper, Karr property records",
      "Hotel Amavi incorporation documents",
      "HGTV 'Selling Paradise' episodes — Adam Harper appearance",
      "Todd Johnson DeWave documentation",
      "Karr billboard — La Flor photographic evidence",
    ],
    angle: "Real estate control is surveillance control. A network that determines where the target lives, which properties are available at what price, and which rentals are structurally modified before occupancy has near-total physical environment dominance. This is the material infrastructure of the operation.",
  },
];

const POWER_COLORS = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  major: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  significant: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
};

const POWER_LABELS = {
  critical: "CRITICAL STORY",
  major: "MAJOR STORY",
  significant: "SIGNIFICANT STORY",
};

export default function MediaPitchPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pitchMode, setPitchMode] = useState(false);

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedStories = STORIES.filter(s => selected.has(s.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Media Intelligence</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Story Pitch Selector</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Select the story angles most relevant to your outreach. Each entry summarizes the core narrative,
            key documented facts, available evidence, and journalist framing. All facts are drawn from verified
            or directly observed intelligence.
          </p>
        </div>

        {selected.size > 0 && (
          <div className="mb-6 p-4 border border-border rounded bg-sidebar-accent/30 flex items-center justify-between">
            <span className="text-sm font-medium">{selected.size} stor{selected.size === 1 ? "y" : "ies"} selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPitchMode(!pitchMode)}
                data-testid="button-toggle-pitch-mode"
                className="text-xs px-3 py-1.5 border border-border rounded hover:bg-sidebar-accent/50 transition-colors"
              >
                {pitchMode ? "List view" : "Pitch sheet view"}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                data-testid="button-clear-selection"
                className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {pitchMode && selectedStories.length > 0 ? (
          <div className="space-y-8">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-6">
              Pitch Sheet — {selectedStories.length} Selected Storie{selectedStories.length !== 1 ? "s" : ""}
            </div>
            {selectedStories.map(story => (
              <div key={story.id} className="border-l-2 border-primary pl-6 pb-8 border-b border-b-border last:border-b-0">
                <div className="mb-1">
                  <span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 ${POWER_COLORS[story.power]}`}>
                    {POWER_LABELS[story.power]}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">{story.category}</span>
                </div>
                <h2 className="text-lg font-serif font-bold text-foreground mt-2 mb-1 leading-snug">{story.headline}</h2>
                <p className="text-sm text-muted-foreground italic mb-4">{story.subhead}</p>
                <p className="text-sm text-foreground leading-relaxed mb-4">{story.summary}</p>

                <div className="mb-4">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Key Facts</div>
                  <ul className="space-y-1">
                    {story.keyFacts.map((f, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-muted-foreground shrink-0 font-mono text-xs mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Available Evidence</div>
                  <ul className="space-y-1">
                    {story.evidence.map((e, i) => (
                      <li key={i} className="text-sm text-foreground flex gap-2 items-start">
                        <span className="text-muted-foreground shrink-0">—</span>
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-sidebar-accent/30 rounded p-3">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Journalist Angle</div>
                  <p className="text-sm text-foreground">{story.angle}</p>
                </div>
                {story.caveat && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{story.caveat}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {STORIES.map(story => {
              const isSelected = selected.has(story.id);
              const isExpanded = expanded.has(story.id);
              const Icon = story.icon;

              return (
                <div
                  key={story.id}
                  data-testid={`story-card-${story.id}`}
                  className={`border rounded transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40 bg-card"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggle(story.id)}
                        data-testid={`button-select-${story.id}`}
                        className="shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {isSelected
                          ? <CheckSquare className="w-4 h-4 text-primary" />
                          : <Square className="w-4 h-4" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 ${POWER_COLORS[story.power]}`}>
                            {POWER_LABELS[story.power]}
                          </span>
                          <span className="text-xs text-muted-foreground">{story.category}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground leading-snug mb-1">{story.headline}</h3>
                        <p className="text-xs text-muted-foreground italic">{story.subhead}</p>
                      </div>

                      <button
                        onClick={() => toggleExpand(story.id)}
                        data-testid={`button-expand-${story.id}`}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pl-7 space-y-4">
                        <p className="text-sm text-foreground leading-relaxed">{story.summary}</p>

                        <div>
                          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Key Facts</div>
                          <ul className="space-y-1">
                            {story.keyFacts.slice(0, 6).map((f, i) => (
                              <li key={i} className="text-xs flex gap-2 items-start">
                                <span className="text-muted-foreground shrink-0 font-mono mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                                <span className="text-foreground">{f}</span>
                              </li>
                            ))}
                            {story.keyFacts.length > 6 && (
                              <li className="text-xs text-muted-foreground pl-6">+{story.keyFacts.length - 6} more in pitch sheet</li>
                            )}
                          </ul>
                        </div>

                        <div className="bg-sidebar-accent/30 rounded p-3">
                          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Angle</div>
                          <p className="text-xs text-foreground">{story.angle}</p>
                        </div>

                        {story.caveat && (
                          <p className="text-xs text-muted-foreground italic">{story.caveat}</p>
                        )}

                        <button
                          onClick={() => toggle(story.id)}
                          data-testid={`button-select-inline-${story.id}`}
                          className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                            isSelected
                              ? "border-primary text-primary bg-primary/10"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                          }`}
                        >
                          {isSelected ? "✓ Selected for pitch" : "Select this story"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
