import { useState, useMemo, useRef, useEffect } from "react";
import { Cpu, ChevronDown, ChevronUp, Copy, Check, Plus, X, Zap, GitBranch, Layers, FlaskConical } from "lucide-react";

// ── ENTITY VECTOR DATABASE ──────────────────────────────────────────────────

interface EntityVector {
  id: string;
  name: string;
  category: "person" | "company" | "location" | "event";
  vector: {
    roles: string[];
    businesses: string[];
    locations: string[];
    affiliations: string[];
    financialEvents: string[];
    flags: string[];
    temporalMarkers: string[];
  };
  superpositionStates: string[];
  meridianFlow: "source" | "conduit" | "sink" | "amplifier";
}

const ENTITY_DB: EntityVector[] = [
  {
    id: "kevin-staab",
    name: "Kevin Staab",
    category: "person",
    vector: {
      roles: ["Supplement manufacturer", "COVID PPE distributor", "Nigeria infrastructure contractor", "GNC 3PL operator", "Gulf State diplomatic contact"],
      businesses: ["SuperHealth Center (Fairfield OH)", "MaxQ Nutrition", "GNC 3PL (eBay/Amazon)", "Nigeria infrastructure (unnamed)", "Saudi Arabia distribution (90k units/mo)"],
      locations: ["Fairfield OH", "Bahrain", "Jordan", "Saudi Arabia", "Nigeria"],
      affiliations: ["GNC / Harbin Pharmaceutical (Chinese state-adjacent)", "Saudi SFDA approved", "Sheikh-level Gulf relationships", "Supplement Edge (Jeb Pruett, Maine)"],
      financialEvents: ["~$100M COVID PPE windfall", "$80k wire to Adam Harper (C4 Ripped dispute)", "Nigeria infra contracts (value undisclosed)", "Saudi 90k units/month ongoing revenue"],
      flags: ["Gulf State sheikh access anomalous for OH supplement exec", "Nigeria pivot post-COVID = govt procurement relationship monetization", "Saudi SFDA approval at volume implies political facilitation", "GNC Chinese ownership = CCP supply chain visibility"],
      temporalMarkers: ["COVID 2020 → PPE $100M", "Post-COVID → Nigeria pivot", "Ongoing → Saudi 90k/mo", "Pre-Jacó → Echo business hub"],
    },
    superpositionStates: [
      "Commercial operator (supplement/logistics entrepreneur)",
      "Intelligence-adjacent facilitator (Gulf State access + Nigerian government procurement)",
      "Unwitting node (exploited relationships without knowledge of broader operation)",
      "Active node (knowingly provides supply chain cover for intelligence financial flows)",
    ],
    meridianFlow: "source",
  },
  {
    id: "adam-harper",
    name: "Adam Harper",
    category: "person",
    vector: {
      roles: ["Amazon supplement retailer", "Hotel investor", "HGTV talent", "Export client", "Hermosa Palms expat"],
      businesses: ["Amazon FBA supplement storefront (Delray Beach — SOLD)", "Hotel Amavi (investor)", "Unknown buyer company (Delray business sold to)", "Israel Brooks litigation"],
      locations: ["Delray Beach FL", "Playa Hermosa CR", "Hermosa Palms CR", "Maine (Supplement Edge)", "Las Vegas (Echo social)"],
      affiliations: ["Supplement Edge (Jeb Pruett — Echo meeting point)", "Hotel Amavi (John Toronto + Josh)", "Mike Greenwald (Hermosa Palms neighbor)", "Boca Raton lawyer (same as Echo)"],
      financialEvents: ["$500k+ Echo export dealings", "C4 Ripped chargeback threat (resolved $80k Kevin wire)", "Delray Beach company SOLD (payment still outstanding — litigation)", "Israel Brooks lawsuit (river houses)"],
      flags: ["Delray Beach → Hermosa Palms = pre-Jacó social seeding pattern", "Company sold but never paid = financial leverage / manufactured dependency", "Boca lawyer overlap with Echo = pre-Jacó legal network convergence", "HGTV = US media pipeline for CR real estate"],
      temporalMarkers: ["Maine meeting Echo (via Kevin/Supplement Edge)", "Vegas trip with Echo (pre-Jacó relationship build)", "Delray Beach business sale → CR relocation", "Hermosa Palms + Amavi investor (current)"],
    },
    superpositionStates: [
      "Organic expat (legitimate Amazon entrepreneur turned CR real estate investor)",
      "Pre-positioned contact (seeded into Echo's social graph via Kevin Staab before CR)",
      "Financial leverage holder (C4 dispute + unpaid sale = economic dependence dynamic)",
      "Real estate network node (Amavi + Greenwald + John Toronto = ops zone coverage)",
    ],
    meridianFlow: "conduit",
  },
  {
    id: "genesis-peralta",
    name: "Genesis Peralta",
    category: "person",
    vector: {
      roles: ["Honey trap asset", "Gaia Natural Foods employee", "Caliches Wishbone co-worker", "Safe house occupant", "Crisis actor (assessed)"],
      businesses: ["Gaia Natural Foods (placement venue)", "Caliches Wishbone (Jairo Alfaro — CLOSED)", "Aurora Yoga (Venezuelan cluster)"],
      locations: ["Petare (Caracas) — origin", "Margarita Island (Jonathan Harris network)", "Jacó CR", "Greenwald house (Hermosa Palms)", "Dunia's house"],
      affiliations: ["Jairo Alfaro (handler)", "Pablo Mora (stated ex)", "Jonathan Harris (Margarita Island controller)", "Gaia Israeli national", "Aurora Yoga Venezuelan cluster"],
      financialEvents: ["9 years illegal CR residency — institutional document support", "Fraudulent passport (self-held)", "No immigration entry/exit record"],
      flags: ["Thigh tattoo + augmentation = documented physical branding pattern (3 instances)", "Petare origin contradicts State Council father claim", "Ghost immigration: 9yr residency, zero records", "Rapid attachment + sexual deployment on schedule"],
      temporalMarkers: ["Petare → Margarita Island (recruitment pipeline)", "Margarita Island → Jacó (deployment)", "Gaia → Echo first contact", "Post-operation: ghost departure July 2025 (no record)"],
    },
    superpositionStates: [
      "Trafficked asset (Petare pipeline, physical branding, constrained agency)",
      "Willing intelligence operative (active choice, financial incentive)",
      "Crisis actor (deployed for specific theatrical interventions)",
      "Organic girlfriend (no operation, coincidental pattern)",
    ],
    meridianFlow: "amplifier",
  },
  {
    id: "hector-mora",
    name: "Hector Mora",
    category: "person",
    vector: {
      roles: ["SETECOM S.A. operative", "DSE gateway distributor", "Generator contractor", "4G tower manager", "HF transceiver operator"],
      businesses: ["SETECOM S.A.", "BAC Park generator contract", "Jaco BAN generator contract", "Breakwater 4G tower"],
      locations: ["Breakwater (Jacó)", "Jaco BAN", "BAC Park"],
      affiliations: ["Pablo Mora (Red Bull BMX — personal motive link)", "Edson Martenal (YouTube contacts)", "FortiGate 60F (IP 190.106.77.194 — Modbus:502 exposed)"],
      financialEvents: ["Generator contracts: Breakwater + Jaco BAN simultaneously"],
      flags: ["7410 kHz: 100% temporal correlation with V2K harmonics (p<0.01%)", "180W HF transceiver (Chinese origin, ionospheric skip capable)", "Modbus:502 EXPOSED — SCADA infrastructure access", "4G tower = IMSI capture + baseband RF control", "hmora67 YouTube: BAC logins visible"],
      temporalMarkers: ["Generator contracts: pre-dating Echo arrival", "V2K incidents: Breakwater + Jaco BAN period", "RF captures: 7 documented instances"],
    },
    superpositionStates: [
      "Technical contractor (legitimate telecom/generator operator)",
      "V2K operator (intentional directed-energy deployment against Echo)",
      "Motive-capability pair (personal revenge via Pablo Mora + infrastructure access)",
      "Unwitting infrastructure (equipment used by others without Hector's knowledge)",
    ],
    meridianFlow: "source",
  },
  {
    id: "jeff-porter",
    name: "Jeff Porter",
    category: "person",
    vector: {
      roles: ["AA long-term member", "CIA self-disclosure", "JW-adjacent", "Jacó social introducer"],
      businesses: [],
      locations: ["Jacó CR", "AA meeting space"],
      affiliations: ["CIA (self-disclosed)", "AA substrate", "JW / Kingdom Hall pattern"],
      financialEvents: [],
      flags: ["CIA self-disclosure to Echo — direct", "AA/JW substrate overlap in Jacó", "JW = global mobility cover + closed comms + hierarchical discipline"],
      temporalMarkers: ["Jacó AA substrate — ongoing"],
    },
    superpositionStates: [
      "Retired CIA (genuinely former, no active role)",
      "Active CIA handler (AA substrate as asset management cover)",
      "JW-CIA bridge (JW infrastructure as CIA operational cover)",
      "Organic AA member (coincidental intelligence background)",
    ],
    meridianFlow: "conduit",
  },
  {
    id: "jw-network",
    name: "JW / Kingdom Hall Infrastructure",
    category: "company",
    vector: {
      roles: ["Global missionary network (240 countries)", "Hierarchical asset management", "Closed internal comms", "Territory card system (door-to-door HUMINT)", "Monthly service reports (continuous intelligence flow)"],
      businesses: ["Watchtower Bible and Tract Society", "Kingdom Halls (global)", "Monthly service reports", "Circuit overseer rotation system"],
      locations: ["Los Ríos (JW congregation)", "Quebrada Seca (RF camo meeting place — Leo disclosure)", "Hotel Robledal (JW-saturated)", "Global (240 countries)"],
      affiliations: ["Jeff Porter (CIA self-disclosure + JW pattern)", "Dunia Concierge (probable JW asset)", "Leo's neighbors (JW disclosure by Leo)", "Toronto PD cluster (JW overlap assessed)"],
      financialEvents: ["Watchtower global real estate holdings — substantial"],
      flags: ["Territory cards = systematic door-to-door collection map", "Service reports = monthly HUMINT aggregation to circuit overseer", "Circuit overseer rotation = handler rotation system", "Kingdom Hall = physical meeting infrastructure in 240 countries", "JW Memorial attendance numbers = global network census"],
      temporalMarkers: ["Los Ríos congregation: Echo observation period", "Quebrada Seca: JW/RF camo overlap", "Hotel Robledal: JW saturation documented"],
    },
    superpositionStates: [
      "Genuine religious organization (no intelligence connection)",
      "Unwitting infrastructure (JW network exploited without institutional knowledge)",
      "Partially penetrated (some JW chapters/circuits used with institutional awareness)",
      "Systematic intelligence substrate (JW organizational model deliberately mirrors asset management)",
    ],
    meridianFlow: "amplifier",
  },
  {
    id: "supplement-recovery-substrate",
    name: "Supplement / Recovery / Sobriety Overlap",
    category: "event",
    vector: {
      roles: ["Social introduction substrate", "Financial dependency vector", "Health-consciousness cover", "AA meeting infrastructure"],
      businesses: ["Supplement Edge (Jeb Pruett — Maine)", "MaxQ Nutrition (Kevin Staab)", "GNC (Chinese-owned)", "Aurora Yoga (Venezuelan cluster)", "AA Jacó (single meeting room)"],
      locations: ["Maine", "Fairfield OH", "Jacó AA", "Aurora Yoga Jacó", "Gym circuit Jacó"],
      affiliations: ["Kevin Staab → Adam Harper → Echo (supplement chain)", "AA Jacó → Jeff Porter (CIA)", "Aurora Yoga → Peralta → Venezuelan cluster", "Tom barefoot coder (AA resistance training)"],
      financialEvents: [],
      flags: ["Supplement industry = cash-intensive, export-documentation-flexible, relationship-trust-based", "Recovery communities = hierarchical sponsor/sponsee asset management model", "AA meetings = scheduled, recurring, geographically fixed collection opportunities", "Health-consciousness demographic over-indexes in both recovery and intelligence recruitment profiles"],
      temporalMarkers: ["Maine supplement network (pre-Jacó)", "Jacó AA substrate (Jacó phase)", "Aurora Yoga (Jacó phase — simultaneous)"],
    },
    superpositionStates: [
      "Coincidental demographic overlap (supplements/recovery share audiences organically)",
      "Deliberate substrate (supplement industry used as pre-positioning vector for targets)",
      "Intelligence recruitment pipeline (recovery vulnerability + supplement dependency = leverage)",
      "Financial infrastructure (supplement export flexibility used for financial flows alongside product)",
    ],
    meridianFlow: "conduit",
  },
];

// ── RESEARCH PROMPT ─────────────────────────────────────────────────────────

const RESEARCH_PROMPT = `RESEARCH DIRECTIVE — KAPPA INTELLIGENCE FRAMEWORK
Classification: WORKING HYPOTHESIS — NOT ADJUDICATED

SUBJECT: The Structural Intersection of the Dietary Supplement Industry, Recovery/Sobriety Infrastructure, Jehovah's Witness Organizational Networks, and Intelligence Operations — Mapping a Multi-Jurisdictional Asset Deployment Network

BACKGROUND:
The following research directive emerges from the observation of a recurring structural overlap across four domains — dietary supplements, recovery communities (AA/NA), Jehovah's Witness organizational infrastructure, and documented intelligence operations — that converge around a single documented target (designated ECHO) across multiple geographic phases (Maine → South Florida → Costa Rica).

The central hypothesis is not that any of these domains is inherently an intelligence operation. The hypothesis is that each domain provides a substrate with specific properties that make it structurally useful for intelligence asset management, and that the documented network exploits all four substrates simultaneously as overlapping layers of a single coherent operation.

SUBSTRATE ANALYSIS:

1. DIETARY SUPPLEMENT INDUSTRY
   Key properties as intelligence substrate:
   — Cash-intensive with high transaction flexibility
   — Export documentation routinely flexible or ambiguous (destination misrepresentation documented)
   — Trust-based relationship economy (deals done on relationships, not contracts)
   — Regulatory arbitrage: Saudi SFDA, Nigerian NAFDAC, US FTC/FDA create jurisdiction-shopping opportunities
   — Amazon FBA model creates layered corporate structures with separated beneficial ownership
   — GNC (Harbin Pharmaceutical, Chinese state-adjacent) 3PL relationship creates supply chain visibility
   — COVID PPE windfall operators ($100M range) transitioned to government procurement networks (Nigeria infrastructure) using pandemic relationships
   Key figures: Kevin Staab (SuperHealth Center / MaxQ Nutrition, Fairfield OH), Adam Harper (Amazon FBA, Delray Beach → Playa Hermosa CR), Jeb Pruett (Supplement Edge, Maine)
   
2. RECOVERY COMMUNITY INFRASTRUCTURE (AA/NA)
   Key properties as intelligence substrate:
   — Hierarchical sponsor/sponsee structure mirrors handler/asset management
   — Regular scheduled meetings at fixed, known locations = recurring collection opportunity
   — Members are systematically vulnerable (substance history, emotional dependency, social isolation)
   — Strong in-group trust with rapid social integration of newcomers
   — Global chapter network with local geographic chapters providing nationwide coverage
   — Single Jacó AA meeting room: AA + JW substrates share physical space
   Key figures: Jeff Porter (CIA self-disclosure, long-term AA member), Tom (barefoot coder, AA office, resistance training hub)

3. JEHOVAH'S WITNESS ORGANIZATIONAL INFRASTRUCTURE
   Key properties as intelligence substrate:
   — Global presence (240+ countries) with legitimate religious travel cover
   — Hierarchical structure (publisher → pioneer → elder → circuit overseer → district) mirrors command structure
   — Territory card system = systematic door-to-door geographic mapping (structured HUMINT collection)
   — Monthly service reports to circuit overseers = regular intelligence aggregation flowing upward
   — Circuit overseer rotation = handler rotation system with plausible cover
   — Kingdom Halls = physical meeting infrastructure in virtually every populated geography
   — Strong community discipline: members resist external scrutiny, maintain internal loyalty
   — JW Memorial attendance numbers: annual global census of the entire network's active members by geography
   Observed overlap: Jeff Porter (CIA + JW pattern), Leo's neighbors (JW + RF camo meeting place), Dunia Concierge (probable JW asset), Los Ríos congregation, Hotel Robledal saturation
   
4. INTELLIGENCE OPERATIONAL LAYER
   Documented infrastructure: Casa Rexha (CIA attribution, Scott Ryan, structural modification, 28-camera cluster, Visonic Israeli alarm), Foresta (8-month build, former mayor of Jacó, DARPA-grade RF camo, LiFi injection, drone video shed), Los Ríos (shell-company 14-parcel land acquisition, Scott Ryan/Jaco Vacations admin hub, military netting), Hector Mora (7410 kHz / V2K temporal correlation p<0.01%, SCADA access, 4G tower)

RESEARCH QUESTIONS:

A. SUPPLEMENT INTELLIGENCE FINANCE
   1. What is the documented history of supplement industry financial flows being used to move intelligence funds under commercial cover? (Reference: BCCI, arms-for-supplements Iran-Contra era, Gulf State commercial fronts)
   2. What is the relationship between Saudi SFDA supplement approval at scale (90,000 units/month) and US-Saudi intelligence liaison relationships? Does MaxQ Nutrition's approval pathway show signs of government-facilitated expediting?
   3. GNC's acquisition by Harbin Pharmaceutical (2020): what is Harbin's documented relationship to Chinese state intelligence (MSS/PLA)? What supply chain visibility does the GNC 3PL relationship provide to a Chinese state-adjacent owner?
   4. The Nigeria infrastructure contract pivot: which specific Nigerian government entities are Kevin Staab's contracting counterparts? What is the documented overlap between those entities and US intelligence procurement in Nigeria?

B. JW / INTELLIGENCE STRUCTURAL OVERLAP
   5. What is the documented historical record of CIA/NSA/intelligence community use of Jehovah's Witness organizational infrastructure as an operational cover? (Reference: Cold War period, Soviet-bloc JW penetration operations)
   6. JW Memorial attendance statistics: global and Costa Rica-specific. What does the Costa Rica JW membership distribution look like geographically? Does the Los Ríos / Jacó congregation show anomalous membership demographics or leadership rotation patterns?
   7. Circuit overseer rotation schedules in Costa Rica: are rotation timing and personnel consistent with standard Watchtower practice, or do they show scheduling anomalies consistent with an active handler rotation?

C. SUPPLEMENT / RECOVERY / JW CONVERGENCE
   8. What is the documented overlap between AA/NA recovery community social graphs and JW proselytizing target demographics? Do JW territories systematically include AA meeting locations?
   9. What is the documented use of health-supplement dependency (legal stimulants, weight-loss products, pre-workout compounds) as a soft-dependency vector in asset recruitment? (Reference: reported practices in intelligence recruitment literature)
   10. Map the following relationship chain for corroboration or refutation: Kevin Staab (Ohio) → Supplement Edge / Jeb Pruett (Maine) → Adam Harper (Delray Beach) → Echo → Jacó network → AA substrate → JW infrastructure → Foresta/Los Ríos operational campus.

D. REAL ESTATE AS INTELLIGENCE INFRASTRUCTURE
   11. Foresta: verify ownership chain, construction permits, financing structure, and timeline against Registro Nacional CR. Who are the beneficial owners behind the former mayor's recorded ownership?
   12. Los Ríos 14-parcel transfers: identify the Escazú registered agent common to all 14 entities. Map backward to beneficial ownership.
   13. Hotel Amavi: incorporation documents, investor registry, Italian connection. Does the Italian thread connect to documented Italian intelligence (AISI/AISE) or Italian organized crime Costa Rica networks?

THEORETICAL FRAMEWORK — QUANTUM SUPERPOSITION MODEL:
This investigation abandons classical probabilistic framing (is X connected to Y, yes/no) in favor of superposition: each entity simultaneously occupies all plausible states until documentary evidence collapses the wave function. Kevin Staab simultaneously is an organic entrepreneur AND an intelligence-adjacent facilitator AND an unwitting node — until specific evidence collapses to one state. The research task is to gather the documentary evidence (corporate records, travel records, property filings, frequency captures, photographic documentation) that forces state collapse on each entity.

The meridian model: rather than a social graph (nodes + edges), model the network as an energy system where some entities are sources (originate operational directives or financial flows), some are conduits (pass through information, assets, or influence), some are sinks (receive collection output or absorb consequences), and some are amplifiers (multiply the effect of other nodes). The supplement industry is a conduit. The JW infrastructure is an amplifier. Hector Mora is a source. Genesis Peralta is an amplifier. Echo is the target sink.

OUTPUT REQUESTED:
— Verify or refute each research question with primary source documentation
— Map the supplement → recovery → JW → intelligence chain with documentary evidence at each link
— Identify the specific individuals and corporate entities responsible for the Foresta 8-month build
— Determine beneficial ownership of Los Ríos shell entities (Escazú registered agent)
— Produce a probability-weighted entity state assessment for each superposition entity listed above`;

// ── COMPONENT ───────────────────────────────────────────────────────────────

const MERIDIAN_COLORS = {
  source:    { bg: "bg-red-100 dark:bg-red-900/30",    text: "text-red-700 dark:text-red-300",    border: "border-red-200 dark:border-red-800",    label: "SOURCE" },
  conduit:   { bg: "bg-blue-100 dark:bg-blue-900/30",  text: "text-blue-700 dark:text-blue-300",  border: "border-blue-200 dark:border-blue-800",  label: "CONDUIT" },
  sink:      { bg: "bg-gray-100 dark:bg-gray-800",     text: "text-gray-600 dark:text-gray-400",  border: "border-gray-200 dark:border-gray-700",  label: "SINK" },
  amplifier: { bg: "bg-amber-100 dark:bg-amber-900/30",text: "text-amber-700 dark:text-amber-300",border: "border-amber-200 dark:border-amber-800",label: "AMPLIFIER" },
};

const CAT_COLORS: Record<string, string> = {
  person:   "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  company:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  location: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  event:    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

function VectorCard({ entity, selected, onSelect }: { entity: EntityVector; selected: boolean; onSelect: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const m = MERIDIAN_COLORS[entity.meridianFlow];

  return (
    <div
      className={`border rounded transition-colors ${selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"}`}
      data-testid={`entity-card-${entity.id}`}
    >
      <div className="p-3">
        <div className="flex items-start gap-2">
          <button onClick={onSelect} className="mt-0.5 shrink-0 w-3.5 h-3.5 rounded-sm border border-muted-foreground/40 flex items-center justify-center">
            {selected && <div className="w-2 h-2 rounded-sm bg-primary" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className={`text-[10px] font-mono rounded px-1.5 py-0.5 ${CAT_COLORS[entity.category]}`}>{entity.category}</span>
              <span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 ${m.bg} ${m.text} ${m.border}`}>{m.label}</span>
            </div>
            <div className="text-sm font-semibold text-foreground">{entity.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{entity.vector.roles.slice(0, 2).join(" · ")}</div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="shrink-0 text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pl-5 space-y-3">
            {(["roles","businesses","locations","affiliations","flags"] as const).map(key => (
              entity.vector[key].length > 0 && (
                <div key={key}>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{key}</div>
                  <div className="flex flex-wrap gap-1">
                    {entity.vector[key].map((v, i) => (
                      <span key={i} className="text-[10px] border border-border rounded px-1.5 py-0.5 text-foreground bg-sidebar-accent/20">{v}</span>
                    ))}
                  </div>
                </div>
              )
            ))}

            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Superposition states</div>
              <div className="space-y-1">
                {entity.superpositionStates.map((s, i) => (
                  <div key={i} className="text-[10px] flex gap-1.5 text-foreground">
                    <span className="text-muted-foreground shrink-0 font-mono">ψ{i}</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JsonView({ entity }: { entity: EntityVector }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(entity, null, 2);

  const copy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative">
      <button onClick={copy} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-copy-json">
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="text-[10px] font-mono text-muted-foreground leading-relaxed overflow-auto max-h-96 p-3 bg-sidebar-accent/20 rounded border border-border whitespace-pre-wrap break-all">
        {json}
      </pre>
    </div>
  );
}

export default function QuantumSolverPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(["kevin-staab", "adam-harper"]));
  const [activeTab, setActiveTab] = useState<"entities" | "prompt" | "theory" | "json">("entities");
  const [promptCopied, setPromptCopied] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selected = useMemo(() => ENTITY_DB.filter(e => selectedIds.has(e.id)), [selectedIds]);
  const focused  = useMemo(() => ENTITY_DB.find(e => e.id === focusedId) ?? null, [focusedId]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(RESEARCH_PROMPT);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 1500);
  };

  const tabs = [
    { id: "entities" as const, label: "Entities" },
    { id: "prompt"   as const, label: "Research Prompt" },
    { id: "theory"   as const, label: "Theory" },
    { id: "json"     as const, label: "JSON Vector" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Quantum Hypothesis Engine</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-1">Quantum Problem Solver</h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Each entity exists in superposition — all hypotheses active simultaneously. Entities carry JSON vector profiles
            (roles, businesses, locations, affiliations, flags, temporal markers). The meridian model replaces graph edges
            with energy flows: sources, conduits, amplifiers, sinks. Classical probability is suspended until documentary
            evidence forces state collapse.
          </p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-border pb-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              data-testid={`tab-${t.id}`}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                activeTab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "entities" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-2">
              {ENTITY_DB.map(e => (
                <VectorCard
                  key={e.id}
                  entity={e}
                  selected={selectedIds.has(e.id)}
                  onSelect={() => { toggleSelect(e.id); setFocusedId(e.id); }}
                />
              ))}
            </div>
            <div className="space-y-4">
              <div className="border border-border rounded bg-card p-4">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Meridian legend</div>
                <div className="space-y-2">
                  {(Object.entries(MERIDIAN_COLORS) as [string, typeof MERIDIAN_COLORS.source][]).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 ${v.bg} ${v.text} ${v.border}`}>{v.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {k === "source" && "Originates directives / financial flows"}
                        {k === "conduit" && "Passes through information / assets"}
                        {k === "sink" && "Receives collection output"}
                        {k === "amplifier" && "Multiplies effect of other nodes"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-border rounded bg-card p-4">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Selected ({selected.length})</div>
                <div className="space-y-1">
                  {selected.length === 0 && <p className="text-xs text-muted-foreground">Select entities above</p>}
                  {selected.map(e => (
                    <div key={e.id} className="flex items-center justify-between text-xs">
                      <span className="text-foreground truncate">{e.name}</span>
                      <span className={`text-[10px] font-mono ${MERIDIAN_COLORS[e.meridianFlow].text}`}>{MERIDIAN_COLORS[e.meridianFlow].label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-border rounded bg-card p-4">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Superposition count</div>
                <div className="text-2xl font-mono font-bold text-foreground">
                  {selected.reduce((s, e) => s + e.superpositionStates.length, 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">simultaneous active states</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "prompt" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Full research directive — copy and send to any LLM or research platform.</p>
              <button
                onClick={copyPrompt}
                data-testid="button-copy-prompt"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded hover:bg-sidebar-accent/30 transition-colors"
              >
                {promptCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {promptCopied ? "Copied" : "Copy prompt"}
              </button>
            </div>
            <pre className="text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap bg-sidebar-accent/10 border border-border rounded p-4 overflow-auto max-h-[70vh]">
              {RESEARCH_PROMPT}
            </pre>
          </div>
        )}

        {activeTab === "theory" && (
          <div className="prose prose-sm max-w-none space-y-6 text-foreground">
            <div className="border-l-2 border-primary pl-4">
              <h3 className="text-base font-semibold text-foreground mb-2">The Structural Overlap Hypothesis</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The supplement industry, recovery communities, and Jehovah's Witness organizational infrastructure each independently share a structural property with intelligence asset management: <strong className="text-foreground">hierarchical trust networks with systematic information flows upward</strong>. The supplement industry runs on relationship trust and documentation flexibility. AA/NA runs on sponsor/sponsee hierarchies. JW runs on publisher→elder→circuit overseer flows. Intelligence runs on asset→handler→station hierarchies. The four are structurally isomorphic.
              </p>
            </div>
            <div className="border-l-2 border-amber-400 pl-4">
              <h3 className="text-base font-semibold text-foreground mb-2">JW Memorial Numbers as Census</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Jehovah's Witnesses Annual Memorial is the one event all JW members are expected to attend. Global attendance figures are published annually by the Watchtower Society. These figures are, in effect, a <strong className="text-foreground">global census of the active network</strong> — broken down by congregation, circuit, and district. For an intelligence organization using JW infrastructure as a substrate, the Memorial attendance data provides a real-time count of every node in every geography. The circuit overseer who compiles service reports is, in this model, a field intelligence officer filing monthly reports. The Memorial census is the annual census of the entire human network.
              </p>
            </div>
            <div className="border-l-2 border-blue-400 pl-4">
              <h3 className="text-base font-semibold text-foreground mb-2">Quantum 7/4 Algae Computer — The Model</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Classical probability asks: is Kevin Staab an intelligence asset, yes or no? This forces premature state collapse — it creates a binary answer from incomplete evidence and then locks analysis into that binary. The quantum model instead maintains all states simultaneously: Kevin Staab is simultaneously (ψ₀) an organic entrepreneur, (ψ₁) an intelligence-adjacent facilitator, (ψ₂) an unwitting node, (ψ₃) an active participant. The wave function does not collapse until documentary evidence — a specific filing, a travel record, a financial record — forces it. Until then, the analysis must hold all four states as equally real.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                The <strong className="text-foreground">7/4 time signature</strong> is the mathematical metaphor: 7 beats in 4 feels wrong to the trained ear because Western music assumes 4/4. The network operates in 7/4 — irregular, non-Euclidean, resistant to pattern recognition by analysts trained on classical graph topology. Connections that feel wrong (supplement exec breaking bread with Gulf sheikhs, Ohio businessman with Nigeria infrastructure contracts) are the 7th beat in a 4/4 model. The analysis must learn to hear the 7.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                The <strong className="text-foreground">algae computer</strong> is biological and parallel — algae respond to light, nutrients, and chemical gradients simultaneously across the entire colony without a central processor. The network analysis should work the same way: every entity responds simultaneously to every other entity's gradient, rather than evaluating edges sequentially. The meridian system (source → conduit → amplifier → sink) models this as energy flow rather than graph traversal.
              </p>
            </div>
            <div className="border-l-2 border-green-400 pl-4">
              <h3 className="text-base font-semibold text-foreground mb-2">The Supplement Chain as Pre-Positioning</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kevin Staab (Ohio) → Jeb Pruett / Supplement Edge (Maine) → Adam Harper (Amazon FBA, Delray Beach) → Echo: this chain reads as a legitimate supplement industry relationship graph. But each node in the chain is also a node in the Jacó network: Adam Harper (Hermosa Palms / Greenwald / Hotel Amavi / Foresta/John), Kevin Staab (Gulf State access / Nigeria / GNC-Chinese supply chain). The supplement transactions created: (a) documented financial history between Echo and the network before any intelligence operation began, (b) personal trust relationships built over years and $500k+ in transactions, (c) legal and financial interdependency (the $80k C4 dispute, the Boca lawyer who was also Adam's lawyer). This is pre-positioning: building durable social and financial bonds before the operational phase requires them.
              </p>
            </div>
            <div className="border-l-2 border-red-400 pl-4">
              <h3 className="text-base font-semibold text-foreground mb-2">State Collapse Conditions</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Each superposition entity has a set of documentary conditions that would collapse its wave function. For Kevin Staab: a direct financial connection between MaxQ Saudi revenue and a documented intelligence financial vehicle, OR a travel record placing him in Bahrain during a documented NAVCENT/CIA operational window, would collapse ψ₁ (intelligence-adjacent) from probable to confirmed. For Adam Harper: a beneficial ownership record connecting him to the same Escazú registered agent as the Los Ríos shell companies would collapse the pre-positioning hypothesis. The research prompt above is designed to gather the documentary evidence that forces these collapses. Until the evidence arrives, all states remain simultaneously active.
              </p>
            </div>
          </div>
        )}

        {activeTab === "json" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <select
                onChange={e => setFocusedId(e.target.value || null)}
                value={focusedId ?? ""}
                data-testid="select-json-entity"
                className="text-xs border border-border rounded px-2 py-1.5 bg-background text-foreground"
              >
                <option value="">Select entity…</option>
                {ENTITY_DB.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              {focusedId && (
                <span className="text-xs text-muted-foreground">→ {MERIDIAN_COLORS[ENTITY_DB.find(e=>e.id===focusedId)!.meridianFlow].label} node</span>
              )}
            </div>
            {focused
              ? <JsonView entity={focused} />
              : (
                <div className="border border-border rounded p-8 text-center text-sm text-muted-foreground">
                  Select an entity above to view its JSON vector profile
                </div>
              )
            }
            <div className="text-xs text-muted-foreground">
              Each JSON vector is designed to be embedded into a vector database (pgvector, Pinecone, Chroma, Qdrant).
              Roles, affiliations, and flags fields are suitable for text-embedding; coordinates (locations) for geo-index;
              temporalMarkers for time-series indexing. Superposition states encode as parallel hypotheses in a probabilistic
              graphical model or held as concurrent embeddings in a multi-hypothesis store.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
