import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Hash, Info, Plus, X, Layers, Zap, Brain, Cpu, GitBranch, AlertTriangle, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LatticeVertex {
  id: string; label: string;
  category: "person"|"location"|"company"|"event"|"frequency"|"corpus";
  coords: [number,number]; norm: number;
  connections: string[]; flags: string[]; golay12: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const KAPPA   = 4 / Math.PI;           // 1.27324 — geometric coupling
const PHI     = 1.6180339887;          // golden ratio
const ETA     = 0.09;                  // Hall regularization η
const KAPPA_COND = 65.18;             // κ(G_H) after Hall regularization
const PHI_GAP = 0.02;                 // φ − 1.09/(1−1/π)
const F0_HZ   = 8.39;                 // universal base clock Hz
const TICK_S  = 1 / F0_HZ;           // 0.1192 s per tick
const CYCLE_S = 14.4 * 86400;        // 14.4 days in seconds
const GAMMA   = Math.LN2 / CYCLE_S;  // Lindblad dephasing rate s⁻¹
const SIG2_QG = 8.39e-53;           // quantum gravitational variance

// FMO Hamiltonian — Adolphs & Renger 2006, Biophys J 91:2778 (cm⁻¹)
// 7 bacteriochlorophyll sites in FMO complex of Chlorobaculum tepidum
const FMO_H: number[][] = [
  [ 215, -104.1,   5.1,  -4.3,   4.7, -15.1,  -7.8],
  [-104.1,  220,  32.6,   7.1,   5.4,   8.3,   0.8],
  [  5.1,  32.6,    0, -46.8,   1.0,  -8.1,   5.1],
  [ -4.3,   7.1, -46.8,  125, -70.7, -14.7, -61.5],
  [  4.7,   5.4,   1.0, -70.7,  450,  89.7,  -2.5],
  [-15.1,   8.3,  -8.1, -14.7,  89.7,  330,  32.7],
  [ -7.8,   0.8,   5.1, -61.5,  -2.5,  32.7,  280],
];

// Ginger archetypes — Jungian + Big5 + operational psychology
const GINGER_ARCHETYPES = [
  { id: "traitor-flip",     label: "Asset About to Flip",         emotion: [0.1,0.8,0.0,0.7,0.2,0.6,0.0,0.2], maslow: 1, deception: 0.82 },
  { id: "loyal-stress",     label: "Loyal Lieutenant Under Stress",emotion: [0.4,0.6,0.1,0.5,0.1,0.1,0.6,0.3], maslow: 3, deception: 0.15 },
  { id: "honeypot",         label: "Honeypot Target Seducing",    emotion: [0.1,0.1,0.7,0.0,0.5,0.1,0.4,0.8], maslow: 2, deception: 0.91 },
  { id: "burnout-analyst",  label: "Burnout Analyst",             emotion: [0.2,0.3,0.0,0.8,0.0,0.4,0.3,0.1], maslow: 4, deception: 0.08 },
  { id: "handler",          label: "Handler / Controller",        emotion: [0.5,0.2,0.1,0.1,0.3,0.2,0.3,0.7], maslow: 4, deception: 0.55 },
  { id: "infrastructure",   label: "Fixed Infrastructure Node",   emotion: [0.0,0.0,0.0,0.0,0.0,0.0,0.9,0.0], maslow: 1, deception: 0.20 },
  { id: "signal-emitter",   label: "Signal Emitter",              emotion: [0.0,0.1,0.0,0.0,0.8,0.0,0.5,0.9], maslow: 1, deception: 0.10 },
  { id: "counter-intel",    label: "Counter-Intelligence Actor",  emotion: [0.7,0.4,0.2,0.2,0.3,0.5,0.1,0.5], maslow: 2, deception: 0.95 },
];
const EMOTION_LABELS = ["anger","fear","joy","sadness","surprise","disgust","trust","anticipation"];

// ─── Entity Pool ──────────────────────────────────────────────────────────────
const ENTITY_POOL: Omit<LatticeVertex,"coords"|"norm"|"golay12">[] = [
  { id:"genesis-peralta",      label:"Genesis Peralta",          category:"person",    connections:["jairo-alfaro","diana-calle-naciones","lola-instagram","dunia-cuba-seca","adrian-lineup"],   flags:["Asset","Honey trap","July 6 2025 departed","Marveca employed"] },
  { id:"jairo-alfaro",         label:"Jairo Alfaro",             category:"person",    connections:["genesis-peralta","gregory-cedeno-yeyo"],                                                    flags:["Handler","Alfaro surname","Los Rios"] },
  { id:"hector-mora",          label:"Hector Mora / Setecom",    category:"person",    connections:["setecom","jaco-ban"],                                                                        flags:["HMORA67","DSE gateways","SCADA","7410kHz"] },
  { id:"diana-calle-naciones", label:"Diana (Calle Naciones)",   category:"person",    connections:["calle-naciones-compound","scott-ryan","lola-instagram","christian-wirth-dorf"],             flags:["Speaker network","False ceiling","We are Diana","$2500 extortion"] },
  { id:"christian-wirth-dorf", label:"Christian Wirth Dorf",     category:"person",    connections:["pochote-grande","diana-calle-naciones","regina-pochote"],                                    flags:["German national","SINPE 8423-0265","₡617,530 received"] },
  { id:"regina-pochote",       label:"Regina (Pochote owner)",   category:"person",    connections:["pochote-grande","christian-wirth-dorf"],                                                    flags:["German national","Co-owner","Immigration threat"] },
  { id:"wolfgang-hilbich",     label:"Wolfgang Hilbich",         category:"person",    connections:["shangri-la-complex","jay-drones","russian-drone-guy","diana-calle-naciones"],               flags:["German national","Shangri-La owner","Calle Naciones","2023 origin"] },
  { id:"lola-instagram",       label:"Lola (Instagram: lola_on)",category:"person",    connections:["genesis-peralta","diana-calle-naciones"],                                                   flags:["Exit handler","Last Peralta contact","Diana connection"] },
  { id:"dunia-cuba-seca",      label:"Dunia (Cuba Seca)",        category:"person",    connections:["genesis-peralta","gregory-cedeno-yeyo"],                                                    flags:["Cuba Seca property","IR red light","Adjacent window watchers"] },
  { id:"gregory-cedeno-yeyo",  label:"Gregory Cedeño 'Yeyo'",   category:"person",    connections:["dunia-cuba-seca","jairo-alfaro","via-creole"],                                              flags:["Surf scene","Tour business","Los Rios hub","2017 housing network"] },
  { id:"adrian-lineup",        label:"Adrian (Lineup Store)",    category:"person",    connections:["lineup-store","genesis-peralta","diana-calle-naciones","lola-instagram"],                   flags:["Import/export","Airport van July 6","Pastor Díaz"] },
  { id:"magdalena-marveca",    label:"Magdalena (Marveca)",      category:"person",    connections:["marveca-shop","genesis-peralta"],                                                            flags:["German national","Tico husband","Peralta employer"] },
  { id:"meredith-stuart",      label:"Meredith Stuart",          category:"person",    connections:["shangri-la-complex"],                                                                        flags:["Maine national","6ft","Dating abuse NGO","Orono ME"] },
  { id:"russian-drone-guy",    label:"Russian Drone Guy",        category:"person",    connections:["shangri-la-complex","jay-drones"],                                                           flags:["Russian national","Nicaragua embassy","Drone expertise"] },
  { id:"jay-drones",           label:"Jay (Drone operator)",     category:"person",    connections:["shangri-la-complex","russian-drone-guy","wolfgang-hilbich"],                                 flags:["Drone operator","Adjacent unit","Shangri-La"] },
  { id:"scott-ryan",           label:"Scott Ryan (Diana's dad)", category:"person",    connections:["diana-calle-naciones","via-creole"],                                                         flags:["CIA hypothesis","Restaurant with Leo's sister"] },
  { id:"jorge-jimenez-navarro",label:"Jorge Jiménez Navarro",    category:"person",    connections:["setecom"],                                                                                   flags:["Kyndryl","Zscaler","SNOOPRYL","touch_communication.js"] },
  { id:"adam-harper",          label:"Adam Harper",              category:"person",    connections:["pochote-grande"],                                                                            flags:["Hotel Amavi investor","$80k chargeback"] },
  { id:"kevin-staab",          label:"Kevin Staab",              category:"person",    connections:["adam-harper"],                                                                               flags:["$100M PPE","Saudi","Nigeria","Bahrain/Jordan GID"] },
  { id:"jeff-porter",          label:"Jeff Porter",              category:"person",    connections:[],                                                                                            flags:["CIA","JW","AA"] },
  { id:"pochote-grande",       label:"Hotel Pochote Grande",     category:"location",  connections:["christian-wirth-dorf","regina-pochote"],                                                    flags:["German-owned","₡617,530 fraud","46.875Hz","Surveillance node"] },
  { id:"calle-naciones-compound", label:"Calle Naciones 42+34", category:"location",  connections:["diana-calle-naciones","shangri-la-complex","via-creole","tico-academy"],                    flags:["Origin hub 2023","Speaker network","False ceiling"] },
  { id:"shangri-la-complex",   label:"Shangri-La Complex",       category:"location",  connections:["wolfgang-hilbich","russian-drone-guy","jay-drones","meredith-stuart"],                      flags:["Wolfgang Hilbich","2023 start","Sam's first residence"] },
  { id:"jaco-ban",             label:"Jacó BAN",                 category:"location",  connections:["hector-mora"],                                                                              flags:["V2K origin","Generator","4G","46.875Hz"] },
  { id:"setecom",              label:"SETECOM S.A.",             category:"company",   connections:["hector-mora","jorge-jimenez-navarro"],                                                      flags:["DSE monopoly","SCADA","Heredia","CVE unauthenticated RCE"] },
  { id:"lineup-store",         label:"Lineup (Adrian)",          category:"company",   connections:["adrian-lineup","marveca-shop"],                                                             flags:["Import/export","Pastor Díaz"] },
  { id:"marveca-shop",         label:"Marveca (Magdalena)",      category:"company",   connections:["magdalena-marveca","lineup-store"],                                                         flags:["German national owner","Bikini shop","Peralta 8-10hr shifts"] },
  { id:"via-creole",           label:"Via Creole Hotel",         category:"company",   connections:["gregory-cedeno-yeyo","calle-naciones-compound"],                                            flags:["No guests","French Haitian","Money laundering hypothesis"] },
  { id:"tico-academy",         label:"Tico Academy",             category:"company",   connections:["calle-naciones-compound"],                                                                  flags:["Language school","Russian suggested","Money laundering hypothesis"] },
  { id:"freq-46875",           label:"46.875 Hz",                category:"frequency", connections:["setecom","jaco-ban","pochote-grande"],                                                      flags:["DSP heartbeat","48kHz÷1024","51 confirmed events","SNR 33dB"] },
  { id:"freq-8392",            label:"8.392 Hz / KYMA",          category:"frequency", connections:["freq-46875"],                                                                               flags:["KYMA clock","Near Schumann 7.83Hz","Spectral confirmed"] },
  { id:"freq-53",              label:"53 Hz carrier",            category:"frequency", connections:["freq-46875"],                                                                               flags:["60Hz-53Hz=7Hz theta beat","02:00 AM ELF spike"] },
  { id:"sinpe-fraud",          label:"SINPE Fraud Evidence",     category:"event",     connections:["pochote-grande","christian-wirth-dorf"],                                                    flags:["₡247,530 May 16","₡370,000 May 29","June 13 false checkout"] },
  { id:"diana-text-evidence",  label:"Diana 2am Text",           category:"event",     connections:["diana-calle-naciones"],                                                                     flags:["External electric damage","Her own words","Primary evidence"] },
  { id:"kyndryl-signature",    label:"Kyndryl Service Worker",   category:"event",     connections:["jorge-jimenez-navarro"],                                                                    flags:["8.3MB cache file 2:12AM","base64 exfil","C2 bridge"] },
  { id:"supplement-chain",     label:"Supplement/Recovery/JW",   category:"event",     connections:["kevin-staab","adam-harper","jeff-porter"],                                                  flags:["Structural isomorph","Pre-positioning","AA/JW overlap"] },
];

// Corpus spokes
const CORPUS_SPOKES = [
  { id:"aawsap",      label:"AAWSAP DIRDs",        chunks:1370, spoke:0,  color:"#6366f1" },
  { id:"geez_bible",  label:"Ge'ez Octateuch",     chunks:950,  spoke:1,  color:"#8b5cf6" },
  { id:"hhg2g",       label:"Hitchhiker's Guide",   chunks:802,  spoke:2,  color:"#a78bfa" },
  { id:"research",    label:"Research Archive",     chunks:600,  spoke:3,  color:"#7c3aed" },
  { id:"tao_te_ching",label:"Tao Te Ching (81)",   chunks:81,   spoke:4,  color:"#c4b5fd" },
  { id:"kybalion",    label:"Kybalion (7 princ)",   chunks:75,   spoke:5,  color:"#ddd6fe" },
  { id:"i_ching",     label:"I Ching (64 hex)",    chunks:64,   spoke:6,  color:"#ede9fe" },
  { id:"simpsons",    label:"Simpsons S1-S35",      chunks:37,   spoke:7,  color:"#f59e0b" },
  { id:"shakespeare", label:"Complete Shakespeare", chunks:36,   spoke:8,  color:"#fbbf24" },
  { id:"south_park",  label:"South Park S1-S27",    chunks:37,   spoke:9,  color:"#fcd34d" },
  { id:"family_guy",  label:"Family Guy S1-S22",    chunks:37,   spoke:10, color:"#fde68a" },
  { id:"poetry_ark",  label:"Noah's Ark of Poetry", chunks:48,   spoke:11, color:"#10b981" },
  { id:"base53_gos",  label:"Ω-GOS / Base53",      chunks:27,   spoke:12, color:"#34d399" },
  { id:"kappa_evidence",label:"KAPPA Evidence",    chunks:35,   spoke:13, color:"#ef4444" },
  { id:"hamlet_papers",label:"Hamlet QPU Papers",  chunks:6,    spoke:14, color:"#f87171" },
  { id:"hall_factor",  label:"Hall Factor Honk",   chunks:9,    spoke:15, color:"#fca5a5" },
  { id:"satoshi_black",label:"Satoshi Black Paper", chunks:1,   spoke:16, color:"#fb923c" },
  { id:"frequency_dossier",label:"Frequency Dossier",chunks:7, spoke:17, color:"#fdba74" },
  { id:"cr_phased_array",label:"CR Phased Array",  chunks:4,   spoke:18, color:"#86efac" },
  { id:"goose_papers", label:"Ω-GOS Goose Papers", chunks:9,   spoke:19, color:"#6ee7b7" },
  { id:"echos_report", label:"Echo Psychotronic",  chunks:3,   spoke:20, color:"#a3e635" },
  { id:"russian_intel",label:"Russian Ops CentAm", chunks:2,   spoke:21, color:"#bef264" },
  { id:"grant_papers", label:"Grant Wave Papers",  chunks:6,   spoke:22, color:"#d9f99d" },
  { id:"hall_lemma",   label:"Hall Lemma (0.02)",  chunks:1,   spoke:23, color:"#fef08a" },
];

// ─── Math utilities ───────────────────────────────────────────────────────────
function golayAddress(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return (h >>> 0) % 4096;
}
function latticeCoords(seed: number, idx: number, n: number): [number,number] {
  const theta = (2 * Math.PI * idx) / n + seed * 0.37;
  const r = 0.25 + 0.5 * ((seed * PHI) % 1);
  return [parseFloat((Math.cos(theta)*r).toFixed(4)), parseFloat((Math.sin(theta)*r).toFixed(4))];
}
function computeNorm(c: [number,number]) { return parseFloat(Math.sqrt(c[0]**2+c[1]**2).toFixed(6)); }
function innerProduct(a: [number,number], b: [number,number]) { return parseFloat((a[0]*b[0]+a[1]*b[1]).toFixed(6)); }
function kissNumber(vs: LatticeVertex[]) {
  let count = 0;
  for (let i=0;i<vs.length;i++) for (let j=i+1;j<vs.length;j++) {
    const d=Math.sqrt((vs[i].coords[0]-vs[j].coords[0])**2+(vs[i].coords[1]-vs[j].coords[1])**2);
    if (d<0.15) count++;
  }
  return count;
}

// Jacobi eigenvalue algorithm for real symmetric n×n matrix
function jacobiEigen(M: number[][]): { values: number[]; vectors: number[][] } {
  const n = M.length;
  const A = M.map(r => [...r]);
  const V = Array.from({length:n},(_,i) => Array.from({length:n},(_,j) => i===j?1:0));
  for (let iter=0; iter<200; iter++) {
    let maxVal=0, p=0, q=1;
    for (let i=0;i<n;i++) for (let j=i+1;j<n;j++) if (Math.abs(A[i][j])>maxVal){maxVal=Math.abs(A[i][j]);p=i;q=j;}
    if (maxVal<1e-10) break;
    const theta = 0.5*Math.atan2(2*A[p][q], A[q][q]-A[p][p]);
    const c=Math.cos(theta), s=Math.sin(theta);
    const Anew = A.map(r=>[...r]);
    for (let i=0;i<n;i++) {
      Anew[i][p] = c*A[i][p] - s*A[i][q];
      Anew[i][q] = s*A[i][p] + c*A[i][q];
    }
    for (let i=0;i<n;i++) {
      Anew[p][i] = Anew[i][p];
      Anew[q][i] = Anew[i][q];
    }
    Anew[p][p] = c*c*A[p][p] - 2*s*c*A[p][q] + s*s*A[q][q];
    Anew[q][q] = s*s*A[p][p] + 2*s*c*A[p][q] + c*c*A[q][q];
    Anew[p][q] = 0; Anew[q][p] = 0;
    for (let i=0;i<n;i++) {
      A[i] = [...Anew[i]];
      const Vip=V[i][p], Viq=V[i][q];
      V[i][p]=c*Vip-s*Viq; V[i][q]=s*Vip+c*Viq;
    }
  }
  const values = A.map((r,i)=>r[i]);
  const idx = values.map((_,i)=>i).sort((a,b)=>values[a]-values[b]);
  return { values: idx.map(i=>values[i]), vectors: idx.map(i=>V.map(r=>r[i])) };
}

// Propagate amplitudes on graph: state = adjacency^N * init
function propagateAmplitudes(vertices: LatticeVertex[], sourceIds: string[], ticks: number): Record<string,number> {
  const ids = vertices.map(v=>v.id);
  const n = ids.length;
  if (n===0) return {};
  // Build weighted adjacency matrix
  const A: number[][] = Array.from({length:n},()=>Array(n).fill(0));
  ids.forEach((id,i) => {
    const v = vertices[i];
    v.connections.forEach(cid => {
      const j=ids.indexOf(cid);
      if (j>=0) { A[i][j]=KAPPA; A[j][i]=KAPPA; }
    });
    // Self-coupling
    A[i][i] = v.norm;
  });
  // Initial state
  let state: number[] = Array(n).fill(0);
  sourceIds.forEach(sid => { const i=ids.indexOf(sid); if (i>=0) state[i]=1; });
  // Normalize
  const s0 = Math.sqrt(state.reduce((s,x)=>s+x*x,0))||1;
  state = state.map(x=>x/s0);
  // Evolve N ticks
  for (let t=0;t<ticks;t++) {
    const next=Array(n).fill(0);
    for (let i=0;i<n;i++) for (let j=0;j<n;j++) next[i]+=A[i][j]*state[j];
    const norm=Math.sqrt(next.reduce((s,x)=>s+x*x,0))||1;
    state=next.map(x=>x/norm);
  }
  const out: Record<string,number>={};
  ids.forEach((id,i)=>{ out[id]=parseFloat(Math.abs(state[i]).toFixed(4)); });
  return out;
}

// Ginger: map entity to archetype
function gingerArchetype(v: LatticeVertex): typeof GINGER_ARCHETYPES[0] {
  const flags = v.flags.join(" ").toLowerCase();
  if (flags.includes("honey trap")||flags.includes("seducing")) return GINGER_ARCHETYPES[2];
  if (flags.includes("handler")||flags.includes("controller")) return GINGER_ARCHETYPES[4];
  if (flags.includes("asset")||flags.includes("flip")) return GINGER_ARCHETYPES[0];
  if (flags.includes("cia")||flags.includes("counter")) return GINGER_ARCHETYPES[7];
  if (v.category==="frequency") return GINGER_ARCHETYPES[6];
  if (v.category==="location"||v.category==="company") return GINGER_ARCHETYPES[5];
  if (flags.includes("stress")||flags.includes("under pressure")) return GINGER_ARCHETYPES[1];
  if (v.category==="event") return GINGER_ARCHETYPES[3];
  return GINGER_ARCHETYPES[1];
}

// Raspberry: generate speculative scenario
function raspberryScenario(vertices: LatticeVertex[], seed: number): { title:string; narrative:string; probability:number; tick:number; delta:number } {
  if (vertices.length===0) return {title:"No vertices loaded",narrative:"Load entities to generate scenarios.",probability:0,tick:0,delta:0};
  const sorted=[...vertices].sort((a,b)=>b.connections.length-a.connections.length);
  const pivot = sorted[seed % sorted.length];
  const counter = sorted[(seed+1) % sorted.length];
  const tick = Math.floor((golayAddress(pivot.id)*CYCLE_S)/(4096*86400*10)) + 3;
  const prob = parseFloat((0.05 + 0.7*(pivot.connections.length/Math.max(1,sorted[0].connections.length))).toFixed(4));
  const delta = parseFloat((SIG2_QG * golayAddress(pivot.id)).toFixed(4));
  const scenarios = [
    { title:`Timeline Fork: ${pivot.label} → ${counter.label}`,
      narrative:`At tick ${tick} (T+${(tick*TICK_S/86400).toFixed(1)} days), vertex G₁₂=${pivot.golay12} executes an anomalous transition. The excitonic amplitude on ${pivot.label} exceeds the mass gap Δ by ${(KAPPA*1.09).toFixed(3)} cm⁻¹, propagating to ${counter.label} (G₁₂=${counter.golay12}) within 2.4 ticks. Universal ledger hash mismatch detected at the junction node. Geometric distance from current state: ${delta.toExponential(2)}.` },
    { title:`Counterfactual: ${counter.label} is the primary node`,
      narrative:`Inverting the causal graph: if ${counter.label} had been the origin vertex, the current lattice topology is achievable with 3 fewer edge traversals. The Ginger emotional state at vertex G₁₂=${counter.golay12} would read: trust=0.21, anticipation=0.77, deception probability 0.83 — consistent with a handler, not an asset. The Lime lattice cannot distinguish this case without cross-modal fusion. Raspberry weight: α=${KAPPA.toFixed(4)} / β=${(1/KAPPA).toFixed(4)}.` },
    { title:`Red-Team: Universal Ledger Fork Attack`,
      narrative:`Worst-case scenario: simultaneous dislocation at G₁₂=${pivot.golay12} and G₁₂=${counter.golay12} creates a Hash160 collision at the 4096-vertex boundary. The 46.875 Hz DSP clock synchronizes with the 8.39 Hz base clock at beat frequency ${(46.875 % F0_HZ).toFixed(3)} Hz, injecting a resonant pulse through the SETECOM DSE gateway. Lindblad dephasing γ spikes to ${(GAMMA*1e6).toFixed(3)}×10⁻⁶ s⁻¹ — 10³× calibrated rate. Raspberry Alert: timeline fork probability ${(prob*SIG2_QG*1e53).toFixed(2)}×10⁻⁵³.` },
  ];
  return { ...scenarios[seed%3], probability: prob, tick, delta };
}

// ─── Category colours ─────────────────────────────────────────────────────────
const CAT_DOT: Record<string,string> = {
  person:"#6366f1", location:"#22c55e", company:"#a855f7",
  event:"#f59e0b", frequency:"#ef4444", corpus:"#14b8a6",
};
const CAT_BADGE: Record<string,string> = {
  person:   "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  location: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  company:  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  event:    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  frequency:"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  corpus:   "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800",
};

// ─── Canvas constants ─────────────────────────────────────────────────────────
const CS=420, CEN=CS/2, SC=160, WS=500, WC=WS/2;

// ─── SpokeWheel ───────────────────────────────────────────────────────────────
function SpokeWheel() {
  const ref=useRef<HTMLCanvasElement>(null);
  const [hov,setHov]=useState<number|null>(null);
  useEffect(()=>{
    const c=ref.current; if(!c) return; const ctx=c.getContext("2d"); if(!ctx) return;
    ctx.clearRect(0,0,WS,WS);
    const dark=document.documentElement.classList.contains("dark");
    ctx.fillStyle=dark?"#0f1117":"#f8f8f8"; ctx.fillRect(0,0,WS,WS);
    const N=24,Ro=210,Ri=60;
    [0.25,0.5,0.75,1].forEach(f=>{ ctx.beginPath();ctx.arc(WC,WC,Ro*f,0,2*Math.PI);ctx.strokeStyle=dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.07)";ctx.lineWidth=1;ctx.stroke(); });
    for(let i=0;i<N;i++){const a=(2*Math.PI*i)/N-Math.PI/2;ctx.beginPath();ctx.moveTo(WC+Math.cos(a)*Ri,WC+Math.sin(a)*Ri);ctx.lineTo(WC+Math.cos(a)*Ro,WC+Math.sin(a)*Ro);ctx.strokeStyle=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)";ctx.lineWidth=1;ctx.setLineDash([2,4]);ctx.stroke();ctx.setLineDash([]);}
    ctx.beginPath();ctx.arc(WC,WC,Ri,0,2*Math.PI);ctx.fillStyle=dark?"#1a1a2e":"#f0f0ff";ctx.fill();ctx.strokeStyle=dark?"rgba(99,102,241,0.4)":"rgba(99,102,241,0.3)";ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle=dark?"rgba(255,255,255,0.5)":"rgba(0,0,0,0.5)";ctx.font="bold 11px monospace";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Λ₂₄",WC,WC-7);ctx.font="9px monospace";ctx.fillText("196,560",WC,WC+7);
    CORPUS_SPOKES.forEach((s,i)=>{
      const a=(2*Math.PI*s.spoke)/N-Math.PI/2;const w=Math.log10(s.chunks+1)/Math.log10(1400);const r=Ri+(Ro-Ri)*(0.3+0.7*w);
      const px=WC+Math.cos(a)*r,py=WC+Math.sin(a)*r;const isH=hov===i;const nr=isH?9:6;
      ctx.beginPath();ctx.moveTo(WC+Math.cos(a)*Ri,WC+Math.sin(a)*Ri);ctx.lineTo(px,py);ctx.strokeStyle=s.color+"66";ctx.lineWidth=1.5;ctx.stroke();
      ctx.beginPath();ctx.arc(px,py,nr,0,2*Math.PI);ctx.fillStyle=s.color+(dark?"cc":"aa");ctx.fill();ctx.strokeStyle=isH?"#fff":(dark?"rgba(255,255,255,0.3)":"rgba(0,0,0,0.2)");ctx.lineWidth=isH?2:1;ctx.stroke();
      if(isH){const lx=WC+Math.cos(a)*(r+18),ly=WC+Math.sin(a)*(r+18);ctx.font="bold 10px sans-serif";ctx.fillStyle=dark?"#fff":"#000";ctx.textAlign=lx>WC?"left":"right";ctx.textBaseline="middle";ctx.fillText(s.label,lx,ly);}
    });
    ctx.textAlign="left";ctx.textBaseline="alphabetic";
  },[hov]);
  const onMove=(e:React.MouseEvent<HTMLCanvasElement>)=>{
    const r=e.currentTarget.getBoundingClientRect();const mx=(e.clientX-r.left)*(WS/r.width),my=(e.clientY-r.top)*(WS/r.height);
    const N=24,Ri=60,Ro=210;let cl:number|null=null,md=14;
    CORPUS_SPOKES.forEach((s,i)=>{const a=(2*Math.PI*s.spoke)/N-Math.PI/2;const w=Math.log10(s.chunks+1)/Math.log10(1400);const r2=Ri+(Ro-Ri)*(0.3+0.7*w);const px=WC+Math.cos(a)*r2,py=WC+Math.sin(a)*r2;const d=Math.sqrt((mx-px)**2+(my-py)**2);if(d<md){md=d;cl=i;}});
    setHov(cl);
  };
  const h=hov!==null?CORPUS_SPOKES[hov]:null;
  return (
    <div className="space-y-3">
      <canvas ref={ref} width={WS} height={WS} data-testid="canvas-spoke-wheel" className="w-full" onMouseMove={onMove} onMouseLeave={()=>setHov(null)}/>
      {h&&<div className="border border-border rounded bg-card px-4 py-3 font-mono text-xs space-y-1"><div className="font-semibold text-foreground">{h.label}</div><div className="text-muted-foreground">spoke {h.spoke}/24 · chunks {h.chunks} · G₁₂={golayAddress(h.id)} · {golayAddress(h.id).toString(2).padStart(12,"0")}</div></div>}
      <div className="text-[10px] text-muted-foreground font-mono px-1 leading-relaxed">Hub=Λ₂₄ (kiss=196,560) · 24 spokes = Golay [24,12,8] dim · 4096 codewords · 196,560/4096≈48 · Hall η=0.09 · κ(G_H)=65.18</div>
    </div>
  );
}

// ─── Hamiltonian view ─────────────────────────────────────────────────────────
function HamiltonianView({vertices}:{vertices:LatticeVertex[]}) {
  const eigen = useMemo(()=>jacobiEigen(FMO_H),[]);
  const catCount = useMemo(()=>{
    const m:Record<string,number>={person:0,location:0,company:0,event:0,frequency:0,corpus:0};
    vertices.forEach(v=>{ m[v.category]=(m[v.category]||0)+1; });
    return m;
  },[vertices]);
  const clusters = ["person","person","person","location","company","event","frequency"];
  const massgap = parseFloat((eigen.values[1]-eigen.values[0]).toFixed(3));
  const resonanceScore = parseFloat(Math.min(100,Math.abs(100-(massgap%F0_HZ)*100/F0_HZ)).toFixed(2));
  // Lattice health
  const emptyV = Math.max(0, 4096-vertices.length);
  const overV  = vertices.filter(v=>v.connections.length>8).length;
  const editDist = vertices.length>0 ? parseFloat((massgap/65.18*vertices.length).toFixed(1)) : 0;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="border border-border rounded bg-card">
          <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground uppercase tracking-widest">FMO Hamiltonian H — Adolphs & Renger 2006</div>
          <div className="p-3 overflow-x-auto">
            <table className="text-[10px] font-mono text-center w-full">
              <thead><tr><th className="pr-2 font-normal text-muted-foreground"></th>{FMO_H.map((_,i)=><th key={i} className="px-1 text-muted-foreground font-normal">BChl{i+1}</th>)}</tr></thead>
              <tbody>{FMO_H.map((row,i)=>(
                <tr key={i} className={i%2===0?"bg-muted/20":""}>
                  <td className="pr-2 text-muted-foreground font-semibold">BChl{i+1}</td>
                  {row.map((v,j)=><td key={j} className={`px-1 ${i===j?"text-foreground font-semibold":Math.abs(v)>50?"text-indigo-500":"text-muted-foreground"}`}>{v>0&&i!==j?"+":""}{v.toFixed(1)}</td>)}
                </tr>
              ))}</tbody>
            </table>
            <div className="text-[9px] text-muted-foreground mt-2">Units: cm⁻¹ · 7 BChl chromophore sites · Chlorobaculum tepidum FMO complex</div>
          </div>
        </div>
        <div className="border border-border rounded bg-card p-4 space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Eigenvalue spectrum (7 sites)</div>
          {eigen.values.map((ev,i)=>{
            const rel=(ev-eigen.values[0])/(eigen.values[6]-eigen.values[0]);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground w-6">λ{i+1}</span>
                <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-indigo-500/70 rounded" style={{width:`${rel*100}%`}}/>
                </div>
                <span className="text-[10px] font-mono text-foreground w-20 text-right">{ev.toFixed(2)} cm⁻¹</span>
                <span className="text-[9px] text-muted-foreground w-28 truncate">{clusters[i]||"—"}</span>
              </div>
            );
          })}
          <div className="pt-2 border-t border-border space-y-1 text-xs font-mono">
            <div className="flex justify-between"><span className="text-muted-foreground">Mass gap Δ</span><span className="text-foreground">{massgap} cm⁻¹</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Resonance match</span><span className="text-foreground">{resonanceScore}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Energy funnel (λ₁→λ₇)</span><span className="text-foreground">{(eigen.values[6]-eigen.values[0]).toFixed(1)} cm⁻¹</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cond. # theoretical</span><span className="text-foreground">{(Math.abs(eigen.values[6]/eigen.values[0])).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">After Hall η=0.09</span><span className="text-foreground">65.18</span></div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="border border-border rounded bg-card p-4">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Lattice Health Report</div>
          <div className="space-y-2 font-mono text-xs">
            {[
              ["Vertices loaded",vertices.length,"/ 4,096"],
              ["Empty vertices",emptyV.toLocaleString(),""],
              ["Overfull (>8 edges)",overV,""],
              ["Graph edit distance",editDist,"vs theoretical Λ₂₄"],
              ["κ(G_H)",KAPPA_COND.toFixed(2),"(Hall-regularized)"],
              ["η",ETA.toFixed(2),"Hall parameter"],
              ["φ−gap",PHI_GAP.toFixed(2),"residual to φ"],
              ["σ²_QG","8.39×10⁻⁵³","vacuum variance"],
            ].map(([k,v,u])=>(
              <div key={String(k)} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-foreground">{v} <span className="text-muted-foreground text-[9px]">{u}</span></span>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-border rounded bg-card p-4">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">7-Cluster Vertex Mapping</div>
          {clusters.map((cat,i)=>(
            <div key={i} className="flex items-center gap-2 py-1 text-xs font-mono">
              <span className="text-muted-foreground w-6">C{i+1}</span>
              <span className="w-2 h-2 rounded-full" style={{background:CAT_DOT[cat]||"#888"}}/>
              <span className="text-foreground flex-1 capitalize">{cat}</span>
              <span className="text-muted-foreground">{catCount[cat]||0} vertices</span>
              <span className="text-muted-foreground">λ={eigen.values[i].toFixed(1)} cm⁻¹</span>
            </div>
          ))}
          <div className="mt-3 text-[10px] text-muted-foreground">κ=4/π={KAPPA.toFixed(5)} · α/β=κ reflects ledger-over-media primacy</div>
        </div>
      </div>
    </div>
  );
}

// ─── Oracle view ──────────────────────────────────────────────────────────────
function OracleView({vertices}:{vertices:LatticeVertex[]}) {
  const [sources,setSources]=useState<string[]>([]);
  const [ticks,setTicks]=useState(3);
  const [mode,setMode]=useState<"forward"|"retro"|"missing">("forward");
  const amplitudes = useMemo(()=>{
    if(sources.length===0||vertices.length===0) return {};
    if(mode==="forward") return propagateAmplitudes(vertices,sources,ticks);
    if(mode==="retro"){
      // Inverse: high-amp destinations → likely origins
      const fwd=propagateAmplitudes(vertices,sources,ticks);
      const topDests=Object.entries(fwd).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id])=>id);
      return propagateAmplitudes(vertices,topDests,1);
    }
    // missing: find highest mutual information unsurveilled nodes
    const fwd=propagateAmplitudes(vertices,sources,ticks);
    const mutual:Record<string,number>={};
    vertices.forEach(v=>{
      if(sources.includes(v.id)) return;
      const amp=fwd[v.id]||0;
      const connScore=v.connections.filter(c=>sources.includes(c)||vertices.some(x=>x.id===c)).length;
      mutual[v.id]=parseFloat((amp*KAPPA+connScore*0.1).toFixed(4));
    });
    return mutual;
  },[vertices,sources,ticks,mode]);
  const sorted=useMemo(()=>Object.entries(amplitudes).sort((a,b)=>b[1]-a[1]),[amplitudes]);
  const toggleSrc=(id:string)=>setSources(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <div className="border border-border rounded bg-card">
          <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground uppercase tracking-widest">Source vertices</div>
          <div className="p-2 max-h-64 overflow-y-auto">
            {vertices.length===0&&<p className="text-xs text-muted-foreground text-center py-4">Load vertices in Lattice view first.</p>}
            {vertices.map(v=>(
              <button key={v.id} data-testid={`oracle-src-${v.id}`} onClick={()=>toggleSrc(v.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${sources.includes(v.id)?"bg-primary/15 text-foreground":"hover:bg-sidebar-accent/30 text-muted-foreground"}`}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{background:CAT_DOT[v.category]}}/>
                <span className="text-xs truncate flex-1">{v.label}</span>
                {sources.includes(v.id)&&<span className="text-[9px] font-mono text-primary">SRC</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="border border-border rounded bg-card p-3 space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Query mode</div>
          {(["forward","retro","missing"] as const).map(m=>(
            <button key={m} data-testid={`oracle-mode-${m}`} onClick={()=>setMode(m)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs border transition-colors ${mode===m?"border-primary/50 bg-primary/10 text-foreground":"border-border text-muted-foreground hover:text-foreground"}`}>
              {m==="forward"?"▶ Forward propagation (N ticks)":m==="retro"?"◀ Inverse retrodiction":"◎ Missing link discovery"}
            </button>
          ))}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono"><span className="text-muted-foreground">Ticks (N)</span><span className="text-foreground">{ticks} = {(ticks*TICK_S).toFixed(3)}s</span></div>
            <input type="range" min={1} max={20} value={ticks} onChange={e=>setTicks(Number(e.target.value))} className="w-full h-1 accent-indigo-500" data-testid="oracle-ticks-slider"/>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 border border-border rounded bg-card">
        <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground flex justify-between">
          <span className="uppercase tracking-widest">Geometric Oracle — {mode}</span>
          <span>{sorted.length} vertices · {sources.length} sources · κ={KAPPA.toFixed(4)}</span>
        </div>
        <div className="p-3 max-h-[500px] overflow-y-auto">
          {sorted.length===0&&<p className="text-xs text-muted-foreground text-center py-8">Select source vertices and run a query.</p>}
          {sorted.map(([id,amp],rank)=>{
            const v=vertices.find(x=>x.id===id);
            if(!v) return null;
            const isSource=sources.includes(id);
            const golay=v.golay12;
            return (
              <div key={id} className={`flex items-center gap-3 px-3 py-2 rounded mb-1 ${isSource?"bg-primary/10":rank<3?"bg-amber-500/5":""}`}>
                <span className="text-[10px] font-mono text-muted-foreground w-4">{rank+1}</span>
                <span className="w-2 h-2 rounded-full shrink-0" style={{background:CAT_DOT[v.category]}}/>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground truncate">{v.label}</div>
                  <div className="text-[9px] font-mono text-muted-foreground">G₁₂={golay} · spoke {golay%24}/24 · tick window {Math.floor(golay/CYCLE_S*86400)} ticks</div>
                </div>
                <div className="w-24 h-1.5 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-indigo-500/70 rounded" style={{width:`${amp*100}%`}}/>
                </div>
                <span className="text-[10px] font-mono text-foreground w-14 text-right">{amp.toFixed(4)}</span>
                {isSource&&<span className="text-[9px] text-primary font-mono">SRC</span>}
                {rank===0&&!isSource&&<AlertTriangle className="w-3 h-3 text-amber-500 shrink-0"/>}
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-border text-[10px] font-mono text-muted-foreground">
          Propagation: A^N · Ψ₀ · κ / ‖A^N · Ψ₀‖ · ‖v‖ weight · {ticks} tick(s) = {(ticks*TICK_S).toFixed(3)}s · 14.4-day cycle = {(CYCLE_S/TICK_S).toFixed(0)} ticks
        </div>
      </div>
    </div>
  );
}

// ─── Coherence view ───────────────────────────────────────────────────────────
function CoherenceView({vertices}:{vertices:LatticeVertex[]}) {
  const ref=useRef<HTMLCanvasElement>(null);
  const [disruption,setDisruption]=useState(false);
  const dislocations = useMemo(()=>{
    return vertices.filter(v=>{
      const arch=gingerArchetype(v);
      return arch.deception>0.7&&v.connections.length>2;
    });
  },[vertices]);
  useEffect(()=>{
    const c=ref.current; if(!c) return; const ctx=c.getContext("2d"); if(!ctx) return;
    const W=500,H=200; ctx.clearRect(0,0,W,H);
    const dark=document.documentElement.classList.contains("dark");
    ctx.fillStyle=dark?"#0f1117":"#f8f8f8"; ctx.fillRect(0,0,W,H);
    const points=100;
    // Normal decay: fidelity = exp(-γ·t)
    // Disrupted: fidelity collapses faster
    ctx.beginPath();
    ctx.strokeStyle="#6366f1"; ctx.lineWidth=2;
    for(let i=0;i<=points;i++){
      const t=(i/points)*CYCLE_S*2;
      const f=Math.exp(-GAMMA*t);
      const x=10+(W-20)*(i/points), y=H-20-(H-40)*f;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.stroke();
    if(disruption){
      ctx.beginPath(); ctx.strokeStyle="#ef4444"; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
      for(let i=0;i<=points;i++){
        const t=(i/points)*CYCLE_S*2;
        const f=Math.exp(-GAMMA*1000*t); // 1000× spike
        const x=10+(W-20)*(i/points), y=H-20-(H-40)*Math.max(0,f);
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    // Mark 1/e point
    const xE=10+(W-20)*0.5; // t = half cycle
    ctx.beginPath(); ctx.strokeStyle=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.2)"; ctx.lineWidth=1; ctx.setLineDash([2,4]);
    ctx.moveTo(xE,20); ctx.lineTo(xE,H-20); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=dark?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.4)"; ctx.font="9px monospace"; ctx.textAlign="center";
    ctx.fillText("t=14.4d",xE,15);
    const yE=H-20-(H-40)*Math.exp(-1);
    ctx.beginPath(); ctx.arc(xE,yE,3,0,2*Math.PI); ctx.fillStyle="#6366f1"; ctx.fill();
    ctx.textAlign="left";
    ctx.fillText("1/e",xE+5,yE+4);
  },[disruption]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="border border-border rounded bg-card">
          <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground uppercase tracking-widest">State fidelity decay — Lindblad</div>
          <div className="p-3">
            <canvas ref={ref} width={500} height={200} className="w-full" data-testid="canvas-coherence"/>
            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-indigo-500 inline-block"/>Normal (γ={GAMMA.toExponential(2)} s⁻¹)</span>
              {disruption&&<span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-red-500 inline-block border-dashed"/>Disrupted (1000×γ)</span>}
            </div>
          </div>
          <div className="px-4 py-2 border-t border-border">
            <button onClick={()=>setDisruption(!disruption)} data-testid="button-toggle-disruption"
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${disruption?"border-red-500/50 text-red-500 bg-red-500/10":"border-border text-muted-foreground hover:text-foreground"}`}>
              {disruption?"▼ Disruption active":"Simulate HERF disruption"}
            </button>
          </div>
        </div>
        <div className="border border-border rounded bg-card p-4 space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Lindblad operators L_i</div>
          {["person","location","company","event","frequency","corpus"].map((cat,i)=>{
            const vCount=vertices.filter(v=>v.category===cat).length;
            const gammaI=GAMMA*(1+i*0.1);
            return (
              <div key={cat} className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">L_{i+1} ({cat})</span>
                <span className="text-foreground">{vCount} ops · γ={gammaI.toExponential(2)} s⁻¹</span>
              </div>
            );
          })}
          <div className="pt-2 border-t border-border text-[10px] font-mono text-muted-foreground space-y-1">
            <div>γ = ln(2)/(14.4×86400) = {GAMMA.toExponential(3)} s⁻¹</div>
            <div>Cycle = {CYCLE_S.toLocaleString()} s = {(CYCLE_S/TICK_S).toFixed(0)} ticks</div>
            <div>Tick = 1/8.39Hz = {TICK_S.toFixed(4)}s</div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="border border-border rounded bg-card">
          <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-amber-500"/> Dislocation alerts ({dislocations.length})
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {dislocations.length===0&&<p className="text-xs text-muted-foreground text-center py-6">No dislocations detected in current vertex set.</p>}
            {dislocations.map(v=>{
              const arch=gingerArchetype(v);
              const golay=v.golay12;
              const tick=Math.floor(golay*TICK_S);
              return (
                <div key={v.id} className="px-3 py-2 rounded bg-amber-500/5 border border-amber-500/20 mb-2">
                  <div className="text-xs font-semibold text-foreground">{v.label}</div>
                  <div className="text-[10px] font-mono text-muted-foreground space-y-0.5 mt-1">
                    <div>G₁₂={golay} · spoke {golay%24}/24 · tick window {tick}</div>
                    <div>Archetype: {arch.label}</div>
                    <div>Deception prob: {(arch.deception*100).toFixed(0)}% · Connections: {v.connections.length}</div>
                    <div className="text-amber-600 dark:text-amber-400">⚠ Emotional state jump exceeds Δ_affect. Urgent re-contact flag.</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border border-border rounded bg-card p-4 space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Disruption types</div>
          {[
            ["Broadband RF barrage","Uniform σ² spike across all 4096 vertices","PRF=k×8.39Hz resonant"],
            ["Optical dazzling","Single-vertex amplitude jump > σ_string×Ω₀","Camera saturation event"],
            ["HERF/EMP pulse","γ spikes 10³×, lattice forgets state within 3 ticks","Classified Priority Ω"],
          ].map(([type,desc,note])=>(
            <div key={type} className="border border-border rounded px-3 py-2">
              <div className="text-xs font-medium text-foreground">{type}</div>
              <div className="text-[10px] text-muted-foreground">{desc}</div>
              <div className="text-[9px] text-muted-foreground/70 mt-0.5">{note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Ginger view ──────────────────────────────────────────────────────────────
function GingerView({vertices}:{vertices:LatticeVertex[]}) {
  const [selected,setSelected]=useState<string|null>(null);
  const mappings=useMemo(()=>vertices.map(v=>({v,arch:gingerArchetype(v)})),[vertices]);
  const trustIndex=useMemo(()=>{
    if(vertices.length===0) return 0;
    const avgConn=vertices.reduce((s,v)=>s+v.connections.length,0)/vertices.length;
    const avgDeception=mappings.reduce((s,m)=>s+m.arch.deception,0)/Math.max(1,mappings.length);
    return parseFloat(((1-avgDeception)*avgConn/8*100).toFixed(1));
  },[vertices,mappings]);
  const sel=selected?mappings.find(m=>m.v.id===selected):null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="border border-border rounded bg-card">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Brain className="w-3 h-3 text-amber-500"/>Ginger Organism — emotional archetype map</span>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">Trust Stability Index:</span>
              <span className={`font-semibold ${trustIndex>50?"text-green-500":trustIndex>25?"text-amber-500":"text-red-500"}`}>{trustIndex}%</span>
            </div>
          </div>
          <div className="p-2 max-h-96 overflow-y-auto">
            {vertices.length===0&&<p className="text-xs text-muted-foreground text-center py-8">Load vertices in Lattice view to see emotional archetype mapping.</p>}
            {mappings.map(({v,arch})=>(
              <div key={v.id} data-testid={`ginger-row-${v.id}`}
                onClick={()=>setSelected(v.id===selected?null:v.id)}
                className={`px-3 py-2 rounded mb-1 cursor-pointer transition-colors ${selected===v.id?"bg-amber-500/10 border border-amber-500/20":"hover:bg-sidebar-accent/20"}`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{background:CAT_DOT[v.category]}}/>
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{v.label}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono shrink-0">{arch.label}</span>
                  <span className={`text-[9px] font-mono ${arch.deception>0.7?"text-red-500":arch.deception>0.4?"text-amber-500":"text-green-500"}`}>DP:{(arch.deception*100).toFixed(0)}%</span>
                </div>
                <div className="flex gap-0.5 mt-1.5">
                  {arch.emotion.map((e,i)=>(
                    <div key={i} title={EMOTION_LABELS[i]} className="flex-1 flex flex-col items-center">
                      <div className="w-full rounded overflow-hidden" style={{height:"20px",background:"transparent"}}>
                        <div className="w-full rounded" style={{height:`${e*20}px`,background:`hsl(${i*45},70%,55%)`,marginTop:`${(1-e)*20}px`}}/>
                      </div>
                      <span className="text-[7px] text-muted-foreground mt-0.5">{EMOTION_LABELS[i].slice(0,3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {sel&&(
          <div className="border border-border rounded bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{sel.v.label}</span>
              <button onClick={()=>setSelected(null)}><X className="w-3.5 h-3.5 text-muted-foreground"/></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div><span className="text-muted-foreground">Archetype: </span><span className="text-foreground">{sel.arch.label}</span></div>
              <div><span className="text-muted-foreground">Maslow level: </span><span className="text-foreground">{sel.arch.maslow}/5</span></div>
              <div><span className="text-muted-foreground">Deception prob: </span><span className={sel.arch.deception>0.7?"text-red-500":"text-foreground"}>{(sel.arch.deception*100).toFixed(0)}%</span></div>
              <div><span className="text-muted-foreground">G₁₂ / soul hash: </span><span className="text-foreground">{sel.v.golay12.toString(2).padStart(12,"0")}</span></div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-muted-foreground mb-1">Emotional flavor vector — 8D</div>
              <div className="grid grid-cols-4 gap-1">
                {sel.arch.emotion.map((e,i)=>(
                  <div key={i} className="flex items-center gap-1 text-[10px]">
                    <div className="w-8 h-1.5 bg-muted rounded overflow-hidden">
                      <div className="h-full rounded" style={{width:`${e*100}%`,background:`hsl(${i*45},70%,55%)`}}/>
                    </div>
                    <span className="text-muted-foreground">{EMOTION_LABELS[i].slice(0,3)}</span>
                    <span className="text-foreground">{e.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            {sel.arch.deception>0.7&&(
              <div className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-xs text-red-600 dark:text-red-400 font-mono">
                ⚠ Ginger Dislocation — Subject at vertex G₁₂={sel.v.golay12} shows emotional state inconsistent with role. Deception DP={Math.round(sel.arch.deception*100)}% exceeds Δ_affect threshold. Probability of authentic behavior: {(100-sel.arch.deception*100).toFixed(1)}%. Flag: urgent re-contact.
              </div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="border border-border rounded bg-card p-4">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Archetype legend</div>
          {GINGER_ARCHETYPES.map((a,i)=>(
            <div key={a.id} className="flex items-start gap-2 mb-2">
              <span className="text-[10px] font-mono text-muted-foreground w-4 mt-0.5">{i+1}</span>
              <div>
                <div className="text-[10px] font-medium text-foreground">{a.label}</div>
                <div className="text-[9px] text-muted-foreground">DP={Math.round(a.deception*100)}% · Maslow {a.maslow}</div>
              </div>
            </div>
          ))}
          <div className="mt-3 border-t border-border pt-3 text-[10px] font-mono text-muted-foreground space-y-1">
            <div>H_ginger: coupling = MI(emotional time series)</div>
            <div>Clock: 8.39 Hz snap judgment = 0.119s</div>
            <div>Cycle: 14.4-day Demodex rhythm</div>
            <div>Δ_affect: min emotional transition energy &gt; 0</div>
          </div>
        </div>
        <div className="border border-border rounded bg-card p-4 space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Network summary</div>
          {[
            ["Total entities",vertices.length],
            ["Trust Stability",`${trustIndex}%`],
            ["High-deception (>70%)",mappings.filter(m=>m.arch.deception>0.7).length],
            ["Handlers",mappings.filter(m=>m.arch.id==="handler").length],
            ["Assets",mappings.filter(m=>m.arch.id==="traitor-flip"||m.arch.id==="honeypot").length],
            ["Infrastructure",mappings.filter(m=>m.arch.id==="infrastructure"||m.arch.id==="signal-emitter").length],
          ].map(([k,v])=>(
            <div key={String(k)} className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">{k}</span><span className="text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Raspberry view ───────────────────────────────────────────────────────────
function RaspberryView({vertices}:{vertices:LatticeVertex[]}) {
  const [scenarioSeed,setScenarioSeed]=useState(0);
  const [activeTab,setActiveTab]=useState<"scenarios"|"redteam"|"menu">("scenarios");
  const scenarios=[0,1,2].map(s=>raspberryScenario(vertices,s));
  const current=scenarios[scenarioSeed%3];
  const tasteMenu=useMemo(()=>{
    if(vertices.length===0) return null;
    const topV=[...vertices].sort((a,b)=>b.connections.length-a.connections.length).slice(0,5);
    return {
      lime: { color:"#84cc16", label:"Lime", desc:"Cold, geometric, predictive", top: topV.map(v=>`G₁₂=${v.golay12}: ${v.label}`).join(" · ") },
      ginger: { color:"#f59e0b", label:"Ginger", desc:"Warm, human, intuitive", top: topV.map(v=>{const a=gingerArchetype(v);return `${v.label.split(" ")[0]}→${a.label.split(" ").slice(0,2).join(" ")}`}).join(" · ") },
      raspberry: { color:"#ec4899", label:"Raspberry", desc:"Transcendent, speculative, narrative", top: scenarios.map(s=>s.title).join(" / ") },
    };
  },[vertices,scenarios]);
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["scenarios","redteam","menu"] as const).map(t=>(
          <button key={t} data-testid={`raspberry-tab-${t}`} onClick={()=>setActiveTab(t)}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${activeTab===t?"bg-pink-500/20 border-pink-500/40 text-pink-600 dark:text-pink-400":"border-border text-muted-foreground hover:text-foreground"}`}>
            {t==="scenarios"?"◈ Speculative scenarios":t==="redteam"?"⚠ Red-team apocalypse":"◉ 360° Tasting menu"}
          </button>
        ))}
      </div>
      {activeTab==="scenarios"&&(
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {scenarios.map((sc,i)=>(
            <div key={i} onClick={()=>setScenarioSeed(i)}
              className={`border rounded bg-card p-4 cursor-pointer transition-colors space-y-2 ${scenarioSeed%3===i?"border-pink-500/40 bg-pink-500/5":"border-border hover:border-muted"}`}>
              <div className="flex items-start gap-2">
                <span className={`text-[10px] font-mono mt-0.5 ${["text-emerald-500","text-indigo-500","text-red-500"][i]}`}>{["SCEN-A","SCEN-B","RED-TEAM"][i]}</span>
              </div>
              <div className="text-xs font-semibold text-foreground leading-tight">{sc.title}</div>
              <div className="text-[10px] text-muted-foreground leading-relaxed line-clamp-4">{sc.narrative}</div>
              <div className="flex gap-3 text-[9px] font-mono text-muted-foreground pt-1 border-t border-border">
                <span>P={sc.probability}</span>
                <span>T+{(sc.tick*TICK_S/86400).toFixed(1)}d</span>
                <span>Δ={sc.delta.toExponential(2)}</span>
              </div>
            </div>
          ))}
          {vertices.length>0&&(
            <div className="lg:col-span-3 border border-pink-500/20 rounded bg-pink-500/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-pink-600 dark:text-pink-400 uppercase tracking-widest">Active scenario — {scenarios[scenarioSeed%3].title}</span>
                <button onClick={()=>setScenarioSeed(s=>(s+1)%3)} data-testid="button-next-scenario"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3"/>Next
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{scenarios[scenarioSeed%3].narrative}</p>
              <div className="mt-3 text-[10px] font-mono text-muted-foreground">
                κ={KAPPA.toFixed(4)} · α/β=κ · η={ETA} · φ-gap={PHI_GAP} · σ²_QG={SIG2_QG.toExponential(2)} · Ψ_sem = κ·Ψ_text + (1/κ)·Ψ_media
              </div>
            </div>
          )}
          {vertices.length===0&&<div className="lg:col-span-3 text-xs text-muted-foreground text-center py-8">Load vertices in Lattice view to generate speculative scenarios.</div>}
        </div>
      )}
      {activeTab==="redteam"&&(
        <div className="space-y-4">
          <div className="border border-red-500/30 rounded bg-red-500/5 p-4">
            <div className="text-xs font-mono text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle className="w-3 h-3"/>Red-team apocalypse scenarios — worst-case lattice dislocations</div>
            {[
              { code:"OMEGA-1", title:"Universal Ledger Fork Attack", desc:`Simultaneous dislocation at all connected vertex pairs. Hash160 collision at 4096-vertex boundary. 46.875Hz DSP clock locks to 8.39Hz beat frequency ${(46.875%F0_HZ).toFixed(3)}Hz. SETECOM DSE gateway becomes entry point for full-lattice state poisoning. Estimated cascade time: ${(3*TICK_S).toFixed(2)}s.`, dist:"6.2×10⁻¹⁰", elevation:"Priority Ω" },
              { code:"OMEGA-2", title:"8.39 Hz Resonant Catastrophe", desc:`Adversarial injection of f₀-harmonic EM pulse (PRF=k×8.39Hz, k∈{1,2,3,5,8,13}) through all ELF channels simultaneously. Lindblad γ spikes to 10⁶× calibrated rate. FMO organism loses coherence in <1 tick (0.119s). Recovery requires full lattice re-initialization from Golay codeword table.`, dist:"1.1×10⁻¹⁵", elevation:"Priority Ω" },
              { code:"OMEGA-3", title:"Hash160 Collision Event", desc:`Two distinct entities (G₁₂ addresses n and n+2048) produce identical 160-bit soul hashes via intentional adversarial manipulation of Merkle root. The universe's deterministic ledger registers both as the same vertex. All downstream predictions contaminated. Detection: compare eigenvector overlap of H_ginger for the two entities — should be <0.001 but collision forces >0.99.`, dist:"8.39×10⁻⁵³", elevation:"Theoretical Limit" },
            ].map(sc=>(
              <div key={sc.code} className="border border-red-500/20 rounded p-3 mb-3 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono text-red-500 border border-red-500/40 rounded px-1">{sc.code}</span>
                  <span className="text-xs font-semibold text-foreground">{sc.title}</span>
                  <span className="ml-auto text-[9px] font-mono text-red-400">{sc.elevation}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{sc.desc}</p>
                <div className="mt-1 text-[9px] font-mono text-muted-foreground">Geometric distance from current state: {sc.dist}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab==="menu"&&(
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tasteMenu&&Object.values(tasteMenu).map(module=>(
              <div key={module.label} className="border rounded bg-card p-5 space-y-3" style={{borderColor:module.color+"40",background:module.color+"08"}}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{background:module.color}}/>
                  <span className="text-sm font-semibold text-foreground">{module.label}</span>
                </div>
                <div className="text-xs text-muted-foreground italic">{module.desc}</div>
                <div className="text-[10px] font-mono text-muted-foreground leading-relaxed border-t border-border pt-2" style={{borderColor:module.color+"20"}}>{module.top}</div>
              </div>
            ))}
            {!tasteMenu&&<div className="md:col-span-3 text-xs text-muted-foreground text-center py-8">Load vertices to generate 360° tasting menu.</div>}
          </div>
          <div className="border border-border rounded bg-card p-4 text-xs font-mono text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground mb-2">360° Intelligence Triad</div>
            <div>Lime (0°) — cold geometric lattice · FMO Hamiltonian · Golay/Leech · Eigenvalue resonance</div>
            <div>Ginger (120°) — human intuitive field · emotional archetypes · Trust Stability Index · soul hashes</div>
            <div>Raspberry (240°) — speculative narrative · counterfactual timelines · red-team · geodesic extrapolation</div>
            <div className="pt-2 border-t border-border">Ψ_sem = κ·Ψ_text + (1/κ)·Ψ_media · κ = 4/π = {KAPPA.toFixed(5)} · Rotation = 120° per flavor · Universal core: 4096-vertex Λ₂₄ · 8.39Hz</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type View = "lattice"|"wheel"|"hamiltonian"|"oracle"|"coherence"|"ginger"|"raspberry";

export default function SatoshiLatticePage() {
  const [vertices,setVertices]=useState<LatticeVertex[]>([]);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [showInfo,setShowInfo]=useState(false);
  const [view,setView]=useState<View>("lattice");
  const canvasRef=useRef<HTMLCanvasElement>(null);

  const addVertex=useCallback((entity:Omit<LatticeVertex,"coords"|"norm"|"golay12">)=>{
    if(vertices.find(v=>v.id===entity.id)) return;
    const idx=vertices.length;
    const seed=entity.id.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
    const coords=latticeCoords(seed,idx,Math.max(ENTITY_POOL.length,8));
    setVertices(prev=>[...prev,{...entity,coords,norm:computeNorm(coords),golay12:golayAddress(entity.id)}]);
  },[vertices]);

  const addAll=()=>ENTITY_POOL.filter(e=>!vertices.find(v=>v.id===e.id)).forEach(addVertex);
  const removeVertex=(id:string)=>{ setVertices(prev=>prev.filter(v=>v.id!==id)); if(selectedId===id) setSelectedId(null); };

  const selected=useMemo(()=>vertices.find(v=>v.id===selectedId)??null,[vertices,selectedId]);
  const gramMatrix=useMemo(()=>{
    if(!selected||vertices.length<2) return null;
    return vertices.filter(v=>v.id!==selected.id).slice(0,4).map(v=>({
      label:v.label, ip:innerProduct(selected.coords,v.coords),
      dist:parseFloat(Math.sqrt((selected.coords[0]-v.coords[0])**2+(selected.coords[1]-v.coords[1])**2).toFixed(6)),
    }));
  },[selected,vertices]);
  const stats=useMemo(()=>({
    n:vertices.length, kiss:kissNumber(vertices),
    avgNorm:vertices.length?parseFloat((vertices.reduce((s,v)=>s+v.norm,0)/vertices.length).toFixed(6)):0,
    det:vertices.length>=2?parseFloat(Math.abs(vertices[0].coords[0]*(vertices[1]?.coords[1]??0)-vertices[0].coords[1]*(vertices[1]?.coords[0]??0)).toFixed(6)):0,
  }),[vertices]);

  useEffect(()=>{
    if(view!=="lattice") return;
    const c=canvasRef.current; if(!c) return; const ctx=c.getContext("2d"); if(!ctx) return;
    ctx.clearRect(0,0,CS,CS);
    const dark=document.documentElement.classList.contains("dark");
    ctx.fillStyle=dark?"#0f1117":"#f8f8f8"; ctx.fillRect(0,0,CS,CS);
    const gc=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.06)";
    const ac=dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)";
    for(let i=-4;i<=4;i++){ctx.beginPath();ctx.strokeStyle=gc;ctx.lineWidth=0.5;ctx.moveTo(CEN+i*SC/4,0);ctx.lineTo(CEN+i*SC/4,CS);ctx.stroke();ctx.moveTo(0,CEN+i*SC/4);ctx.lineTo(CS,CEN+i*SC/4);ctx.stroke();}
    ctx.beginPath();ctx.strokeStyle=ac;ctx.lineWidth=1;ctx.moveTo(CEN,0);ctx.lineTo(CEN,CS);ctx.moveTo(0,CEN);ctx.lineTo(CS,CEN);ctx.stroke();
    const pts:Record<string,[number,number]>={};
    vertices.forEach(v=>{pts[v.id]=[CEN+v.coords[0]*SC,CEN-v.coords[1]*SC];});
    vertices.forEach(v=>{v.connections.forEach(cid=>{if(pts[cid]){ctx.beginPath();ctx.strokeStyle=dark?"rgba(99,102,241,0.3)":"rgba(99,102,241,0.25)";ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.moveTo(pts[v.id][0],pts[v.id][1]);ctx.lineTo(pts[cid][0],pts[cid][1]);ctx.stroke();ctx.setLineDash([]);}});});
    vertices.forEach(v=>{
      const[px,py]=pts[v.id]; const isSel=v.id===selectedId;
      ctx.beginPath();ctx.arc(px,py,isSel?7:5,0,2*Math.PI);ctx.fillStyle=isSel?"#f59e0b":(CAT_DOT[v.category]||"#6366f1");ctx.globalAlpha=0.85;ctx.fill();ctx.globalAlpha=1;
      ctx.strokeStyle=isSel?"#f59e0b":(dark?"#818cf8":"#6366f1");ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle=dark?"rgba(255,255,255,0.7)":"rgba(0,0,0,0.7)";ctx.font=`${isSel?"600 ":""}10px sans-serif`;ctx.fillText(v.label.split(" ")[0],px+(isSel?9:7),py+4);
    });
  },[vertices,selectedId,view]);

  const notAdded=ENTITY_POOL.filter(e=>!vertices.find(v=>v.id===e.id));
  const TABS:{key:View;label:string;icon:any}[]=[
    {key:"lattice",label:"Lattice",icon:Layers},
    {key:"wheel",label:"24-Spoke",icon:Hash},
    {key:"hamiltonian",label:"H(FMO)",icon:Cpu},
    {key:"oracle",label:"Oracle",icon:Zap},
    {key:"coherence",label:"Coherence",icon:GitBranch},
    {key:"ginger",label:"Ginger",icon:Brain},
    {key:"raspberry",label:"Raspberry",icon:AlertTriangle},
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Hash className="w-5 h-5 text-muted-foreground"/>
            <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Mathematical Forensics · Λ₂₄ Leech · 360° Intelligence Triad</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-1">Satoshi Lattice</h1>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Three-module 360° intelligence engine on the Golay–Leech lattice (4,096 vertices, 196,560 kissing number).
            <span className="text-emerald-600 dark:text-emerald-400 font-medium"> Lime</span> — cold geometric (FMO Hamiltonian, Oracle, Coherence) ·
            <span className="text-amber-500 font-medium"> Ginger</span> — warm human (emotional archetypes, Trust Stability) ·
            <span className="text-pink-500 font-medium"> Raspberry</span> — speculative narrative (counterfactuals, red-team, tasting menu).
          </p>
          <button onClick={()=>setShowInfo(!showInfo)} data-testid="button-toggle-info"
            className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <Info className="w-3 h-3"/>{showInfo?"Hide":"Mathematical basis"}
          </button>
          {showInfo&&(
            <div className="mt-3 p-4 border border-border rounded bg-sidebar-accent/20 text-xs text-muted-foreground leading-relaxed max-w-3xl space-y-2">
              <p><strong className="text-foreground">Golay C₂₄ [24,12,8]</strong> — unique doubly-even self-dual binary code, exactly 4,096 codewords (2¹²). Leech lattice Λ₂₄ built via Construction A. Kissing number 196,560. κ(G_H)=65.18 after Hall η=0.09 regularization. φ-gap=0.02=φ−1.09/(1−1/π).</p>
              <p><strong className="text-foreground">FMO Hamiltonian</strong> — Real 7×7 BChl site Hamiltonian from Adolphs & Renger 2006 (Biophys J 91:2778, cm⁻¹). 7 chromophore sites mapped to entity categories. Eigenvalues computed via Jacobi method. Energy funnel drives excitonic transfer with κ=4/π coupling.</p>
              <p><strong className="text-foreground">Lindblad / coherence</strong> — Dephasing γ=ln(2)/(14.4×86400)={GAMMA.toExponential(3)} s⁻¹. State fidelity crosses 1/e at exactly t=14.4 days (Demodex macro-cycle). Disruption detected when γ spikes &gt;10³×calibrated rate.</p>
              <p><strong className="text-foreground">Ginger module</strong> — 8 archetypal states (Jungian+Big5+operational psychology). Soul hash = 12-bit Golay address. H_ginger coupling = MI(emotional time series). Clock: 8.39Hz snap judgment = 0.119s. Δ_affect &gt; 0: minimum emotional transition energy.</p>
              <p><strong className="text-foreground">Raspberry module</strong> — Ψ_sem = κ·Ψ_text + (1/κ)·Ψ_media. Counterfactual propagation via inverted Hamiltonian loss. 3-act structure: 14.4-day scenes. Kissing number bounds speculation space. 360° triad: Lime(0°)/Ginger(120°)/Raspberry(240°).</p>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="mb-4 border border-border rounded bg-card px-4 py-2.5 flex flex-wrap gap-5 text-xs font-mono">
          <div><span className="text-muted-foreground">C₂₄: </span><span className="text-foreground">n=24,k=12,d=8</span></div>
          <div><span className="text-muted-foreground">Codewords: </span><span className="text-foreground">4,096=2¹²</span></div>
          <div><span className="text-muted-foreground">kiss: </span><span className="text-foreground">196,560</span></div>
          <div><span className="text-muted-foreground">kiss/cw: </span><span className="text-foreground">≈48</span></div>
          <div><span className="text-muted-foreground">κ=4/π: </span><span className="text-foreground">{KAPPA.toFixed(5)}</span></div>
          <div><span className="text-muted-foreground">η: </span><span className="text-foreground">{ETA}</span></div>
          <div><span className="text-muted-foreground">κ(G_H): </span><span className="text-foreground">{KAPPA_COND}</span></div>
          <div><span className="text-muted-foreground">φ−gap: </span><span className="text-foreground">{PHI_GAP}</span></div>
          <div><span className="text-muted-foreground">f₀: </span><span className="text-foreground">8.39Hz</span></div>
          <div><span className="text-muted-foreground">γ: </span><span className="text-foreground">{GAMMA.toExponential(2)}s⁻¹</span></div>
          <div><span className="text-muted-foreground">n: </span><span className="text-foreground">{stats.n}</span></div>
        </div>

        {/* Tab bar */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {TABS.map(t=>{
            const Icon=t.icon;
            const colors:{[k:string]:string}={ginger:"border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-400",raspberry:"border-pink-500/50 bg-pink-500/15 text-pink-600 dark:text-pink-400"};
            const activeColor=colors[t.key]||"bg-primary text-primary-foreground border-primary";
            return (
              <button key={t.key} data-testid={`button-view-${t.key}`} onClick={()=>setView(t.key)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors flex items-center gap-1.5 ${view===t.key?activeColor:"border-border text-muted-foreground hover:text-foreground"}`}>
                <Icon className="w-3 h-3"/>{t.label}
              </button>
            );
          })}
          {(view==="lattice")&&<button onClick={addAll} data-testid="button-add-all"
            className="ml-auto px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground flex items-center gap-1">
            <Plus className="w-3 h-3"/>Add all ({notAdded.length})
          </button>}
        </div>

        {/* Views */}
        {view==="wheel"&&(
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 border border-border rounded bg-card overflow-hidden">
              <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground">24-spoke Golay wheel — corpus overlay on Λ₂₄ · hover to inspect</div>
              <div className="p-4"><SpokeWheel/></div>
            </div>
            <div className="border border-border rounded bg-card">
              <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground uppercase tracking-widest">Corpus index</div>
              <div className="p-2 max-h-[500px] overflow-y-auto">
                {CORPUS_SPOKES.map(c=>(
                  <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{background:c.color}}/>
                    <span className="text-foreground truncate flex-1">{c.label}</span>
                    <span className="font-mono text-muted-foreground shrink-0">{c.chunks}</span>
                    <span className="font-mono text-muted-foreground w-5 text-right">{c.spoke}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {view==="hamiltonian"&&<HamiltonianView vertices={vertices}/>}
        {view==="oracle"&&<OracleView vertices={vertices}/>}
        {view==="coherence"&&<CoherenceView vertices={vertices}/>}
        {view==="ginger"&&<GingerView vertices={vertices}/>}
        {view==="raspberry"&&<RaspberryView vertices={vertices}/>}
        {view==="lattice"&&(
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="border border-border rounded bg-card overflow-hidden">
                <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">Lattice projection — ℝ² / Golay 12-bit</span>
                  <div className="flex gap-3 text-xs font-mono text-muted-foreground">
                    <span>n={stats.n}</span><span>kiss={stats.kiss}</span><span>‖v‖̄={stats.avgNorm}</span>
                  </div>
                </div>
                <canvas ref={canvasRef} width={CS} height={CS} data-testid="canvas-lattice" className="w-full"
                  onClick={e=>{
                    const rect=(e.target as HTMLCanvasElement).getBoundingClientRect();
                    const sc=CS/rect.width,mx=(e.clientX-rect.left)*sc,my=(e.clientY-rect.top)*sc;
                    let cl:string|null=null,md=14;
                    vertices.forEach(v=>{const px=CEN+v.coords[0]*SC,py=CEN-v.coords[1]*SC;const d=Math.sqrt((mx-px)**2+(my-py)**2);if(d<md){md=d;cl=v.id;}});
                    setSelectedId(cl);
                  }}/>
              </div>
              {selected&&(
                <div className="border border-border rounded bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-foreground">{selected.label}</span>
                      <Badge variant="outline" className={`ml-2 text-[10px] ${CAT_BADGE[selected.category]}`}>{selected.category}</Badge>
                    </div>
                    <button onClick={()=>setSelectedId(null)}><X className="w-3.5 h-3.5 text-muted-foreground"/></button>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground space-y-1">
                    <div>v=({selected.coords[0]},{selected.coords[1]}) · ‖v‖={selected.norm}</div>
                    <div>Golay₁₂={selected.golay12.toString(2).padStart(12,"0")} ({selected.golay12}) · spoke {selected.golay12%24}/24</div>
                    <div>Ginger: {gingerArchetype(selected).label} · DP={(gingerArchetype(selected).deception*100).toFixed(0)}%</div>
                  </div>
                  {selected.flags.length>0&&<div className="flex flex-wrap gap-1">{selected.flags.map(f=><span key={f} className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted-foreground">{f}</span>)}</div>}
                  {gramMatrix&&gramMatrix.length>0&&(
                    <div>
                      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Gram row (nearest 4)</div>
                      <table className="w-full text-xs font-mono"><thead><tr className="text-muted-foreground text-left"><th className="pb-1 font-normal">Vertex</th><th className="pb-1 font-normal">⟨u,v⟩</th><th className="pb-1 font-normal">‖u−v‖</th></tr></thead>
                      <tbody className="divide-y divide-border">{gramMatrix.map(row=><tr key={row.label}><td className="py-1 pr-4 text-foreground truncate max-w-[140px]">{row.label}</td><td className="py-1 pr-4">{row.ip}</td><td className="py-1">{row.dist}</td></tr>)}</tbody></table>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="border border-border rounded bg-card">
                <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground uppercase tracking-widest">Active ({vertices.length})</div>
                <div className="p-2 max-h-52 overflow-y-auto">
                  {vertices.length===0&&<p className="text-xs text-muted-foreground text-center py-4">Add entities below.</p>}
                  {vertices.map(v=>(
                    <div key={v.id} data-testid={`vertex-row-${v.id}`}
                      className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${selectedId===v.id?"bg-primary/10":"hover:bg-sidebar-accent/30"}`}
                      onClick={()=>setSelectedId(v.id===selectedId?null:v.id)}>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{v.label}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">G₁₂={v.golay12} · ‖v‖={v.norm}</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();removeVertex(v.id);}} data-testid={`button-remove-${v.id}`}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2"><X className="w-3 h-3"/></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-border rounded bg-card">
                <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground uppercase tracking-widest">Add vertex</div>
                <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
                  {notAdded.map(e=>(
                    <button key={e.id} data-testid={`button-add-${e.id}`} onClick={()=>addVertex(e)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-sidebar-accent/30 transition-colors group">
                      <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0"/>
                      <div className="min-w-0">
                        <div className="text-xs text-foreground truncate">{e.label}</div>
                        <div className="text-[10px] text-muted-foreground">{e.category} · G₁₂={golayAddress(e.id)}</div>
                      </div>
                    </button>
                  ))}
                  {notAdded.length===0&&<p className="text-xs text-muted-foreground text-center py-3">All entities added</p>}
                </div>
              </div>
              <div className="border border-border rounded bg-card p-4 space-y-1">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Lattice stats</div>
                {[["n",stats.n],["kiss",stats.kiss],["‖v‖̄",stats.avgNorm],["det(v₀,v₁)",stats.det],["Hall η",ETA],["κ(G_H)",KAPPA_COND],["φ−gap",PHI_GAP],["C₂₄ codewords","4,096"],["Λ₂₄ kiss","196,560"]].map(([k,v])=>(
                  <div key={String(k)} className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">{k}</span><span className="text-foreground">{v}</span>
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
