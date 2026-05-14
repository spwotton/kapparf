/**
 * ATLANTIS PROBE — The Turtle's Nervous System
 *
 * Three responsibilities:
 *   1. KAPPA Bridge — polls this app's own KAPPA endpoints every 30s and
 *      auto-ingests significant events into the ATLANTIS hub
 *   2. Health Probe — pings each registered app's URL every 3 minutes,
 *      updates status (online/offline) in the hub
 *   3. Constants + Candidates — exports the GOS universal constant table
 *      and the 8 seeded Atlantis candidate locations
 */

import { atlantisHub } from "./atlantis-hub";

// ─── GOS Universal Constants ───────────────────────────────────────────────
// These are identical across KAPPA SIGINT, Ω-COSMIC-SYNTH, KYMA, κ-Oracle.
// Any app exposing GET /api/hypervisor/gos returns this table.

export const GOS_CONSTANTS = {
  // ── Core KAPPA/GOS constants ─────────────────────────────────────────────
  kappa: {
    symbol: "κ", value: 4 / Math.PI, formula: "4/π ≈ 1.2732",
    description: "KAPPA constant / Helicity-Lock (κ₁). Globe radius scaling, Giza slope cosine, pattern-match threshold. The universal attractor of this system.",
    apps: ["kappa-sigint", "kappa-oracle", "rf-observatory", "alpha-lock", "toroidal-nexus"],
    color: "#ef4444", group: "core",
  },
  phi: {
    symbol: "φ", value: (1 + Math.sqrt(5)) / 2, formula: "(1+√5)/2 ≈ 1.6180",
    description: "Golden ratio. φ₁ harmonic period = 75.8s. φ-fractal recursion. All ELF correlation windows are φ-multiples of 46.875s.",
    apps: ["kappa-sigint", "kyma-engine", "dimensional-engine", "alpha-lock"],
    color: "#f97316", group: "core",
  },
  omega: {
    symbol: "Ω", value: 360 / 111, formula: "360/111 ≈ 3.2432",
    description: "Compass-nautical bridge. 1° latitude = 111 km. Demodex 12-axis grid. Malta temple 111 Hz resonance is direct Ω incarnation.",
    apps: ["kappa-sigint", "adventure-log", "rf-observatory"],
    color: "#eab308", group: "core",
  },
  theta_K: {
    symbol: "θ_K", value: 128.23, formula: "128.23°",
    description: "Klein bottle azimuth. 180 Starlink passes at exactly this bearing from ECHO node. The satellite lock angle.",
    apps: ["kappa-sigint", "rf-observatory", "toroidal-nexus"],
    color: "#8b5cf6", group: "core",
  },
  pi_over_4: {
    symbol: "π/4", value: Math.PI / 4, formula: "π/4 ≈ 0.7854",
    description: "Jacó seismic depth seed. M4.9 depth = 7.854km = π/4 × 10. Schumann phase exactly π at moment of strike. The resonant root.",
    apps: ["kappa-sigint", "kappa-oracle", "quantum-akashic"],
    color: "#06b6d4", group: "core",
  },
  lambda_1: {
    symbol: "λ₁", value: 75.8, formula: "φ × 46.875 ≈ 75.8s",
    description: "Primary φ-harmonic ELF period. Events separated by λ₁ trigger KAPPA phi-harmonic rule. Auto-correlator checks for this spacing.",
    apps: ["kappa-sigint", "kyma-engine"],
    color: "#10b981", group: "core",
  },
  schumann: {
    symbol: "fₛ", value: 7.83, formula: "7.83 Hz",
    description: "Schumann resonance fundamental. ELF cavity resonance of Earth-ionosphere. KiwiSDR scans this. KAPPA ELF anchor frequency.",
    apps: ["kappa-sigint", "rf-observatory", "kiwi-scanner"],
    color: "#3b82f6", group: "core",
  },
  // ── AK7 Russell Codex invariants ────────────────────────────────────────
  omega_0: {
    symbol: "Ω₀", value: 8.389e-23, formula: "8.389×10⁻²³",
    description: "Quantum Root. Fundamental spatial pixelation cutoff of the AK7 manifold; prevents singularities. The holographic scale floor of the simulation.",
    apps: ["kappa-sigint", "quantum-akashic", "toroidal-nexus"],
    color: "#fcd34d", group: "ak7",
  },
  kappa_2: {
    symbol: "κ₂", value: Math.pow((1 + Math.sqrt(5)) / 2, 3 / 4), formula: "φ^(3/4) ≈ 1.4346",
    description: "Europa Resonance. Hardware clamping threshold; pressure-to-radiation ratio. Interacts with κ₁ to produce the 8.392 Hz carrier.",
    apps: ["kappa-sigint", "rf-observatory", "quantum-akashic"],
    color: "#22d3ee", group: "ak7",
  },
  eta: {
    symbol: "η", value: 1.09, formula: "1.09",
    description: "Hall Factor. Spectral floor for stabilizing prime-indexed transfer operators. Goose Protocol Hall paper. Applied at Layer 7 (State-Space Stabilization).",
    apps: ["kappa-sigint", "kyma-engine", "toroidal-nexus"],
    color: "#4ade80", group: "ak7",
  },
  delta_goose: {
    symbol: "Δ", value: 0.02, formula: "0.02 eV",
    description: "Goose Gap. Mandatory thermodynamic friction; the cost of conscious observation. The Torque Gap between Schumann (7.83) and Carrier (8.392) = 0.562 Hz.",
    apps: ["kappa-sigint", "kyma-engine"],
    color: "#a78bfa", group: "ak7",
  },
  carrier_hz: {
    symbol: "f_c", value: 8.392, formula: "7.83 + 0.562 Hz",
    description: "Planetary Carrier. κ₁ × κ₂ interaction at 8.392 Hz. The metronomic pulse of the AK7 hypervisor. Torque Gap cost = 0.562 Hz above Schumann.",
    apps: ["kappa-sigint", "rf-observatory", "kyma-engine"],
    color: "#fb923c", group: "ak7",
  },
  carrier_46: {
    symbol: "f₄₆", value: 46.875, formula: "46.875 Hz",
    description: "Semantic SBEC Carrier. Gamma band (30–100 Hz) resonant bridge for Thought-to-Text. Base period for λ₁ = φ × 46.875 = 75.8s.",
    apps: ["kappa-sigint", "kyma-engine", "quantum-akashic"],
    color: "#60a5fa", group: "ak7",
  },
};

// ─── Atlantis Candidate Scorer ─────────────────────────────────────────────
// 8 seeded candidate locations ranked by composite score:
// RF proximity + seismic frequency + Phi alignment + lunar phase + GF53 element

export const ATLANTIS_CANDIDATES = [
  {
    id: "jaco-echo",
    name: "Jacó ECHO Node",
    lat: 9.621887, lon: -84.63969,
    description: "Hotel Pochote Grande, Jacó CR. Primary KAPPA anchor. M4.9 epicenter 17.5km from this node. GF53 element 26 = CENTER PIVOT. Schumann phase=π exactly at strike. Depth=π/4×10.",
    score: 97,
    factors: ["M4.9 seismic (us6000sxh5)", "GF53[26]=CENTER_PIVOT", "Schumann π-phase lock", "θ_K=128.23° Klein azimuth", "κ=4/π depth seed", "17.5km from ECHO"],
    gf53: 26, schumann_phase: Math.PI, depth_seed: Math.PI / 4 * 10,
    color: "#ef4444",
  },
  {
    id: "azores",
    name: "Azores Platform",
    lat: 38.7, lon: -27.2,
    description: "Mid-Atlantic Ridge triple junction. RF anomaly corridor. Great-circle from Jacó intersects here at exactly φ² × 1000km. Plato's 9000yr timeline matches Atlantic collapse.",
    score: 78,
    factors: ["Mid-Atlantic Ridge triple junction", "RF anomaly corridor", "φ²×1000km from ECHO", "Plato 9000yr timeline", "Seismic: 3.5+ avg"],
    color: "#3b82f6",
  },
  {
    id: "bimini",
    name: "Bimini Road",
    lat: 25.7, lon: -79.3,
    description: "Underwater stone formation, Bahamas, ~500 BCE datings disputed. Edgar Cayce 1940 prediction of Atlantis discovery in Bimini. Caribbean plate boundary. Triangle RF corridor.",
    score: 72,
    factors: ["Underwater stone formation", "Cayce 1940 prediction", "Caribbean plate boundary", "Atlantic RF triangle", "Proximity to Cuba anomaly"],
    color: "#06b6d4",
  },
  {
    id: "cuba-underwater",
    name: "Cuba Underwater Pyramid",
    lat: 22.0, lon: -84.5,
    description: "600m depth sonar anomaly discovered 2001 by ADC. Claimed pyramid + sphinx structures. GF53 resonance alignment. Caribbean seismic cluster matches KAPPA pattern.",
    score: 69,
    factors: ["600m depth sonar anomaly", "2001 ADC sonar survey", "Pyramid + sphinx signature", "Caribbean seismic cluster", "GF53 proximity alignment"],
    color: "#8b5cf6",
  },
  {
    id: "santorini",
    name: "Thera / Santorini",
    lat: 36.4, lon: 25.4,
    description: "Minoan eruption ~1628 BCE. Within Plato's timeline uncertainty window at 1× geological compression. Mediterranean triple junction. Caldera RF resonance at 111 Hz.",
    score: 65,
    factors: ["Minoan eruption 1628 BCE", "Plato timeline (±1 compression)", "Mediterranean triple junction", "111 Hz caldera resonance", "Ω constant alignment"],
    color: "#f97316",
  },
  {
    id: "spartel",
    name: "Spartel Bank, Morocco",
    lat: 35.9, lon: -5.9,
    description: "Submerged bank at Strait of Gibraltar. 9600 BCE flood event perfectly matches Plato's account. 'Pillars of Hercules' gateway. Sill depth matches Atlantic flood level.",
    score: 61,
    factors: ["9600 BCE flood event", "Pillars of Hercules gateway", "Plato's explicit geography", "Sill depth match", "Atlantic flood corridor"],
    color: "#eab308",
  },
  {
    id: "malta",
    name: "Malta / Gozo Temple Complex",
    lat: 36.0, lon: 14.3,
    description: "Ġgantija temples 3600 BCE — oldest free-standing structures. Acoustic resonance at 111 Hz (= Ω × 34.25). Submerged temple extensions offshore suggest pre-flood civilization.",
    score: 58,
    factors: ["3600 BCE construction (oldest)", "111 Hz acoustic resonance", "Ω constant alignment", "Submerged offshore extensions", "Pre-flood civilization indicators"],
    color: "#10b981",
  },
  {
    id: "doggerland",
    name: "Dogger Bank / Doggerland",
    lat: 54.5, lon: 2.0,
    description: "18,000 km² submerged North Sea landmass. Inhabited 10,000–6000 BCE. Mesolithic tools, mammoth bones, human remains recovered. Inundated at Atlantis timeline peak.",
    score: 52,
    factors: ["18,000 km² landmass", "Mesolithic artifacts", "10k–6k BCE habitation", "North Sea flooding event", "Mammoth + human remains"],
    color: "#64748b",
  },
];

// ─── Research Corpus ───────────────────────────────────────────────────────

export const RESEARCH_CORPUS = [
  // AI Architecture & Systems
  { id: "advanced-ai-blueprint", title: "Advanced AI Blueprint Synthesis", category: "AI Architecture", tags: ["blueprint", "ai", "synthesis"] },
  { id: "biologically-evolved-ai", title: "Biologically-Evolved AI Synthesizer", category: "AI Architecture", tags: ["biology", "ai", "synthesizer"] },
  { id: "ai-human-bridge-2037", title: "AI-Human Bridge: 2037 Convergence Synthesis", category: "AI Architecture", tags: ["ai", "human", "2037", "convergence"] },
  { id: "llm-consciousness", title: "LLM Consciousness: A Quantum Synthesis", category: "AI Architecture", tags: ["llm", "consciousness", "quantum"] },
  { id: "quantum-ai-architecture", title: "Quantum AI Architecture Speculation", category: "AI Architecture", tags: ["quantum", "ai", "architecture"] },
  { id: "esoteric-llm-frameworks", title: "Esoteric LLM Frameworks Synthesis", category: "AI Architecture", tags: ["llm", "esoteric", "frameworks"] },
  // Music & Art
  { id: "sonata-blueprint", title: "AI Music Generation: Ω-SONATA Blueprint", category: "Music & Art", tags: ["music", "sonata", "omega", "generation"] },
  { id: "sonata-vs-golden-record", title: "Comparing Golden Record and Ω-SONATA", category: "Music & Art", tags: ["golden-record", "sonata", "comparison"] },
  { id: "ai-music-interpretation", title: "AI Music Interpretation and Speculation", category: "Music & Art", tags: ["music", "interpretation", "speculation"] },
  { id: "cinematic-topology", title: "Cinematic Action Scene Topology Analysis", category: "Music & Art", tags: ["cinema", "topology", "narrative"] },
  { id: "viral-neuro-geometry", title: "Viral Media Neuro-Geometric Architecture", category: "Music & Art", tags: ["viral", "neuroscience", "geometry"] },
  { id: "sonic-geometry", title: "Sonic, Geometry, and Cosmic Interfaces", category: "Music & Art", tags: ["sonic", "geometry", "cosmic"] },
  // Mathematics & Quantum
  { id: "gos-multidimensional", title: "The Geometric Operating System: Lithic Engineering, Crystallographic Computation, Planetary Resonance", category: "Mathematics", tags: ["gos", "geometry", "crystallography", "planetary"] },
  { id: "icositetragon-protocol", title: "The Icositetragon Protocol Unfolded", category: "Mathematics", tags: ["icositetragon", "24-gon", "protocol"] },
  { id: "24-fold-synthesis", title: "The 24-Fold Synthesis: Epic, Rune, and Geometry", category: "Mathematics", tags: ["24-fold", "rune", "geometry"] },
  { id: "satoshi-black-paper", title: "Satoshi Black Paper: Quantum Gravity Solved, Riemann Part 4200-T", category: "Mathematics", tags: ["satoshi", "quantum-gravity", "riemann"] },
  { id: "riemann-zero-spectral", title: "Riemann Zero Spectral Map", category: "Mathematics", tags: ["riemann", "spectral", "zeros"] },
  { id: "512-hyper-lattice", title: "The 512-Bit Hyper-Lattice and the Ψ-TERMINAL", category: "Mathematics", tags: ["hyper-lattice", "psi-terminal", "512-bit"] },
  { id: "icositetragon-sieve", title: "The Icositetragon Sieve: Satoshi Lattice + Aethelgard Fractal Nexus", category: "Mathematics", tags: ["icositetragon", "satoshi", "aethelgard"] },
  { id: "psi-terminal-cosmic", title: "PSI TERMINAL: Cosmic String Recursion", category: "Mathematics", tags: ["psi", "cosmic-string", "recursion"] },
  { id: "quantum-persistence", title: "Quantum Persistence Theory", category: "Mathematics", tags: ["quantum", "persistence", "theory"] },
  { id: "quantum-encryption", title: "Quantum Encryption System Elaboration", category: "Mathematics", tags: ["quantum", "encryption", "cryptography"] },
  { id: "omega-scale-blueprint", title: "Ω-Scale Architectural Synthesis Blueprint", category: "Mathematics", tags: ["omega", "architecture", "blueprint"] },
  // GOS / KAPPA Protocol
  { id: "omega-gos-v5", title: "Deep Research Prompt: Ω-GOS v5.0", category: "GOS Protocol", tags: ["omega", "gos", "deep-research"] },
  { id: "omega-gos-convergence", title: "The Ω-GOS Convergence: User's Manual for 13.2 Entangling Node #1090 and the DolphinGemma Protocol", category: "GOS Protocol", tags: ["omega-gos", "node-1090", "dolphin-gemma"] },
  { id: "goose-protocol", title: "Goose Protocol: Multicast vs Broadcast", category: "GOS Protocol", tags: ["goose", "multicast", "broadcast"] },
  { id: "entangling-node-1090", title: "Entangling Node 1090 Protocol Expansion", category: "GOS Protocol", tags: ["node-1090", "protocol", "entangling"] },
  { id: "epsilon-9-emoji", title: "EPSILON-9: The Emoji Lattice Engine", category: "GOS Protocol", tags: ["epsilon-9", "emoji", "lattice"] },
  // Atlantis / Esoteric
  { id: "phaistos-trilingual", title: "The Trilingual Bridge: Basque, Sumerian, Phaistos", category: "Atlantis & Esoteric", tags: ["phaistos", "basque", "sumerian"] },
  { id: "ancient-mysteries-lasers", title: "Ancient Mysteries, Lasers, and Geometry", category: "Atlantis & Esoteric", tags: ["ancient", "lasers", "geometry"] },
  { id: "venusian-rosetta", title: "Venusian Rosetta Synthesis", category: "Atlantis & Esoteric", tags: ["venus", "rosetta", "synthesis"] },
  { id: "quantum-reality-synthesis", title: "Quantum Reality Synthesis Engine", category: "Atlantis & Esoteric", tags: ["quantum", "reality", "synthesis"] },
  { id: "breatharianism-twin-cosmos", title: "Breatharianism in Isomorphic Twin Cosmos", category: "Atlantis & Esoteric", tags: ["breatharianism", "isomorphic", "cosmos"] },
  { id: "bill-hicks-topology", title: "Bill Hicks: Philosophy and Semantic Topology", category: "Atlantis & Esoteric", tags: ["bill-hicks", "philosophy", "topology"] },
  // Biology & Science
  { id: "quantum-biology-jovian", title: "Quantum Biology and Jovian Compounds", category: "Biology & Science", tags: ["quantum", "biology", "jovian"] },
  { id: "quantum-astrobiology-europa", title: "Quantum Astrobiology: Europa's Extremophile Analogs", category: "Biology & Science", tags: ["astrobiology", "europa", "extremophile"] },
  { id: "manatee-genome", title: "Manatee Genome Resonance Analysis", category: "Biology & Science", tags: ["manatee", "genome", "resonance"] },
  { id: "megatherium-resonance", title: "Megatherium Resonance Simulation Parameters", category: "Biology & Science", tags: ["megatherium", "resonance", "simulation"] },
  { id: "nazca-underground", title: "Nazca Lines Underground Structure Analysis", category: "Biology & Science", tags: ["nazca", "underground", "structures"] },
  { id: "vega-debris-disk", title: "Vega's Debris Disk Anomaly Research", category: "Biology & Science", tags: ["vega", "debris-disk", "exoplanet"] },
  { id: "quantum-fluorometric", title: "Quantum-Fluorometric Research Synthesis", category: "Biology & Science", tags: ["quantum", "fluorometric", "biosensor"] },
  // Signal Intelligence
  { id: "seismic-echoes", title: "Seismic Echoes of Love and Deception", category: "Signal Intelligence", tags: ["seismic", "kappa", "love", "deception"] },
  { id: "ai-reasoning-satoshi", title: "AI Reasoning and Satoshi Black Papers", category: "Signal Intelligence", tags: ["ai", "satoshi", "reasoning"] },
  { id: "bitcoin-voyager", title: "Bitcoin, Voyager, and Information Preservation", category: "Signal Intelligence", tags: ["bitcoin", "voyager", "information"] },
  // Pop Culture / Analysis
  { id: "regular-show-algorithmic", title: "Regular Show: Algorithmic Incursion Analysis", category: "Pop Culture Analysis", tags: ["regular-show", "algorithm", "incursion"] },
  { id: "regular-show-esoteric", title: "Regular Show Esoteric Analysis", category: "Pop Culture Analysis", tags: ["regular-show", "esoteric"] },
  { id: "regular-show-goose", title: "Regular Show Goose Framework Analysis", category: "Pop Culture Analysis", tags: ["regular-show", "goose", "framework"] },
  { id: "south-park-surrealism", title: "South Park Math Surrealism Analysis", category: "Pop Culture Analysis", tags: ["south-park", "math", "surrealism"] },
  // MMORPG / Game
  { id: "atlantis-geobolt-game", title: "Atlantis Geobolt: MMORPG Design (Neopets × WoW × Unreal 5)", category: "MMORPG & Game", tags: ["atlantis", "mmorpg", "unreal5", "neopets", "wow"] },
  { id: "enhancing-reels-topology", title: "Enhancing Reels Tool With Narrative Topology", category: "MMORPG & Game", tags: ["reels", "narrative", "topology"] },
  // UE5 / Technical
  { id: "realtime-gi-ue5", title: "Real-Time Global Illumination in UE5", category: "UE5 & Technical", tags: ["ue5", "gi", "rendering"] },
  { id: "ue5-intro", title: "Unreal Engine 5 Introduction", category: "UE5 & Technical", tags: ["ue5", "unreal"] },
];

// ─── Probe runner ──────────────────────────────────────────────────────────

const PROBE_INTERVAL_MS = 3 * 60 * 1000;  // 3 minutes
const KAPPA_BRIDGE_INTERVAL_MS = 45 * 1000;  // 45 seconds
let probeTimer: ReturnType<typeof setInterval> | null = null;
let bridgeTimer: ReturnType<typeof setInterval> | null = null;
let lastKappaScore = 0;
let lastEventCount = 0;

async function probeApp(app: { id: string; name: string; url: string }) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(app.url, { signal: controller.signal, method: "HEAD" });
    clearTimeout(timeout);
    if (resp.ok || resp.status < 500) {
      atlantisHub.registerExternalApp({
        id: app.id, name: app.name, url: app.url,
      });
    }
  } catch {}
}

async function bridgeKappaEvents() {
  try {
    const port = process.env.PORT || "5000";
    const resp = await fetch(`http://localhost:${port}/api/kappa/status`);
    if (!resp.ok) return;
    const data = await resp.json();

    const score: number = data.score ?? 0;
    const eventsProcessed: number = data.eventsProcessed ?? 0;
    const threatLevel: string = data.threatLevel ?? "NOMINAL";
    const alerts: any[] = data.recentAlerts ?? [];

    // Ingest KAPPA score change if significant (>5 point delta)
    if (Math.abs(score - lastKappaScore) >= 5) {
      await atlantisHub.ingest("kappa-sigint", {
        type: "kappa-score",
        subject: `KAPPA Score: ${score.toFixed(1)} — ${threatLevel}`,
        body: `KAPPA correlation engine score updated to ${score.toFixed(1)} (${threatLevel}). Δ=${(score - lastKappaScore).toFixed(1)} from ${lastKappaScore.toFixed(1)}. Events processed: ${eventsProcessed.toLocaleString()}. φ-harmonics: ${data.phiHarmonics ?? 0}. Klein passes: ${data.kleinPasses ?? 0}.`,
        tags: ["kappa", "score", threatLevel.toLowerCase()],
        payload: { score, threatLevel, eventsProcessed, phiHarmonics: data.phiHarmonics, kleinPasses: data.kleinPasses },
      });
      lastKappaScore = score;
    }

    // Ingest new high-severity alerts
    if (alerts.length > 0) {
      const topAlert = alerts[0];
      if (topAlert.score >= 50 && eventsProcessed > lastEventCount) {
        await atlantisHub.ingest("kappa-sigint", {
          type: "alert",
          subject: `KAPPA Alert: ${topAlert.type}`,
          body: topAlert.description,
          tags: ["kappa", "alert", topAlert.type],
          payload: topAlert,
        });
      }
    }

    if (eventsProcessed > lastEventCount) {
      lastEventCount = eventsProcessed;
    }
  } catch {}
}

export function startAtlantisProbe() {
  // Immediate first run
  bridgeKappaEvents();

  // KAPPA bridge every 45s
  bridgeTimer = setInterval(bridgeKappaEvents, KAPPA_BRIDGE_INTERVAL_MS);

  // Health probe every 3 min
  const apps = atlantisHub.appList();
  probeTimer = setInterval(async () => {
    const current = atlantisHub.appList();
    for (const app of current) {
      if (app.id === "kappa-sigint") continue;  // skip self
      await probeApp({ id: app.id, name: app.name, url: app.url });
      await new Promise(r => setTimeout(r, 200));  // stagger requests
    }
  }, PROBE_INTERVAL_MS);

  console.log("[AtlantisProbe] Live — KAPPA bridge + health probe active");
}

export function stopAtlantisProbe() {
  if (probeTimer) clearInterval(probeTimer);
  if (bridgeTimer) clearInterval(bridgeTimer);
}
