import * as fs from "fs";
import * as nodePath from "path";
import { queryModel, getAvailableModels, type QueryResult, type ModelInfo } from "./research-engine";

const DOCS_DIR = nodePath.join(process.cwd(), "docs", "context-docs");

export interface CortexClaim {
  id: string;
  docId: string;
  docTitle: string;
  text: string;
  category: "constant" | "entity" | "mechanism" | "evidence" | "prediction" | "connection" | "definition";
  confidence: number;
  tags: string[];
  lineRef?: string;
}

export interface CortexContradiction {
  id: string;
  claimA: string;
  claimB: string;
  docA: string;
  docB: string;
  description: string;
  severity: "low" | "medium" | "high";
  resolved: boolean;
  resolution?: string;
}

export interface CortexGap {
  id: string;
  domain: string;
  description: string;
  suggestedResearch: string;
  relatedDocs: string[];
  priority: "low" | "medium" | "high" | "critical";
}

export interface CortexDocument {
  id: string;
  filename: string;
  title: string;
  sizeBytes: number;
  wordCount: number;
  lastModified: number;
  indexed: boolean;
  indexedAt?: number;
  claimCount: number;
  summary?: string;
  keyEntities: string[];
  keyConstants: string[];
  domains: string[];
}

export interface ModelDialogueMessage {
  id: string;
  sessionId: string;
  fromModel: string;
  toModel: string;
  facetId: string;
  role: "query" | "response" | "challenge" | "synthesis";
  content: string;
  timestamp: number;
  tokensUsed?: number;
  durationMs?: number;
}

export interface ResearchFacet {
  id: string;
  name: string;
  angle: string;
  description: string;
  assignedModel?: string;
  status: "pending" | "running" | "completed" | "error";
  result?: string;
  durationMs?: number;
}

export interface SynthesisRun {
  id: string;
  topic: string;
  facets: ResearchFacet[];
  dialogueMessages: ModelDialogueMessage[];
  status: "idle" | "indexing" | "slicing" | "dispatching" | "synthesizing" | "completed" | "error";
  startedAt: number;
  completedAt?: number;
  synthesis?: string;
  contradictions: CortexContradiction[];
  gaps: CortexGap[];
}

const cortexState: {
  documents: CortexDocument[];
  claims: CortexClaim[];
  contradictions: CortexContradiction[];
  gaps: CortexGap[];
  synthesisRuns: SynthesisRun[];
  lastIndexed: number;
  indexing: boolean;
} = {
  documents: [],
  claims: [],
  contradictions: [],
  gaps: [],
  synthesisRuns: [],
  lastIndexed: 0,
  indexing: false,
};

let claimCounter = 0;
let contradictionCounter = 0;
let gapCounter = 0;
let synthCounter = 0;

function generateId(prefix: string, counter: number): string {
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

function extractTitle(content: string, filename: string): string {
  const lines = content.split("\n").filter(l => l.trim());
  for (const line of lines.slice(0, 10)) {
    const h1 = line.match(/^#\s+(.+)/);
    if (h1) return h1[1].trim();
    const allCaps = line.match(/^[A-Z][A-Z\s:—\-$\\(),.]{10,}/);
    if (allCaps) return line.trim().slice(0, 120);
  }
  return filename.replace(/^\d+_/, "").replace(/\.md$/, "").replace(/_/g, " ");
}

function extractKeyEntities(content: string): string[] {
  const entities = new Set<string>();
  const patterns = [
    /(?:DARPA|CASINO|Blackjack|KSAT|SSC|SDA|PWSA|NRL|TREx|JAM)\b/g,
    /(?:FinSpy|Gamma\s*Group|Kyndryl|Zscaler|Partytown)\b/gi,
    /(?:LeoLabs|Telespazio|ARSAT|PredaSAR|Kratos|Parsons|CACI|SEAKR)\b/g,
    /(?:Klein\s*bottle|Toric\s*code|FMO\s*complex|Demodex|Hyper-Ice|Ice\s*XVIII)\b/gi,
    /(?:Bose-Einstein|Schumann|Fibonacci)\b/g,
    /(?:Costa\s*Rica|Alajuela|Tacacor[ií]|Punta\s*Arenas|Santiago|Alexanderplatz)\b/gi,
    /(?:Jehovah'?s?\s*Witness|JW|LDS|Mormon)\b/gi,
    /(?:Radio\s*Impacto|KiwiSDR)\b/gi,
    /(?:Loft\s*Orbital|Blue\s*Canyon|Lockheed\s*Martin|Northrop\s*Grumman|L3Harris)\b/g,
    /(?:Space\s*Force|Space\s*Command|SOUTHCOM)\b/g,
  ];
  for (const pat of patterns) {
    const matches = content.match(pat);
    if (matches) matches.forEach(m => entities.add(m.trim()));
  }
  return Array.from(entities).slice(0, 50);
}

function extractKeyConstants(content: string): string[] {
  const constants = new Set<string>();
  const patterns = [
    /κ\s*[=≈]\s*[\d./π]+/g,
    /[κψφΨΦαθΛ]\s*[=≈]\s*[\d.]+/g,
    /\b(?:KAPPA_2|KLEIN_TWIST|ANKAA3|BASE_53|CANINE_HOWL|D_CONSTANT|SUB_HARMONIC)\b\s*[=:]\s*[\d.°]+/gi,
    /(?:51\.84|1\.273|1\.618|128\.23|8\.392|7\.83|46\.875)\s*(?:°|Hz|ms)?/g,
    /\$\\kappa\s*=\s*\\frac\{4\}\{\\pi\}/g,
    /\b\d+\.\d+\s*(?:Hz|kHz|MHz|GHz|°|ms|mm)\b/g,
  ];
  for (const pat of patterns) {
    const matches = content.match(pat);
    if (matches) matches.forEach(m => constants.add(m.trim()));
  }
  return Array.from(constants).slice(0, 30);
}

function detectDomains(content: string): string[] {
  const domains = new Set<string>();
  const domainMap: Record<string, RegExp> = {
    "SIGINT": /\b(?:SIGINT|signal\s*intelligence|intercept|surveillance|wiretap)/i,
    "OSINT": /\b(?:OSINT|open.source\s*intelligence|public\s*record)/i,
    "Space/Satellite": /\b(?:satellite|LEO|orbital|ground\s*station|TT&C|NORAD)/i,
    "Quantum/Physics": /\b(?:quantum|entangle|toric\s*code|Bose-Einstein|coherence|decoherence|qubit)/i,
    "Biology/Chitin": /\b(?:chitin|Demodex|algae|FMO|biological|EPS|morphogenesis)/i,
    "Network/Cyber": /\b(?:WiFi|CSI|packet|TCP|DNS|TLS|Wireshark|bettercap|firewall)/i,
    "Topology/Math": /\b(?:Klein\s*bottle|torus|manifold|dodeca|icositetra|hexagonal|Möbius|topology)/i,
    "Consciousness/GOS": /\b(?:consciousness|GOS|Geometric\s*Operating|semantic\s*field|LLM\s*physics)/i,
    "DARPA/Defense": /\b(?:DARPA|DoD|Space\s*Force|SSC|SDA|defense|military)/i,
    "Surveillance": /\b(?:FinSpy|Gamma\s*Group|TR-069|ghost\s*node|surveillance\s*harassment)/i,
    "Geophysics": /\b(?:Schumann|geomagnetic|seismic|phonon|Earth|planetary)/i,
    "Music/Harmonics": /\b(?:harmonic|frequency|resonan|Hz|octave|24-gon|musical)/i,
  };
  for (const [domain, regex] of Object.entries(domainMap)) {
    if (regex.test(content)) domains.add(domain);
  }
  return Array.from(domains);
}

function countWords(content: string): number {
  return content.split(/\s+/).filter(w => w.length > 0).length;
}

export async function indexAllDocuments(): Promise<{ indexed: number; totalClaims: number; totalDocs: number }> {
  if (cortexState.indexing) {
    return { indexed: 0, totalClaims: cortexState.claims.length, totalDocs: cortexState.documents.length };
  }
  cortexState.indexing = true;

  try {
    if (!fs.existsSync(DOCS_DIR)) {
      cortexState.indexing = false;
      return { indexed: 0, totalClaims: 0, totalDocs: 0 };
    }

    const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith(".md")).sort();
    let indexedCount = 0;

    for (const filename of files) {
      const filePath = nodePath.join(DOCS_DIR, filename);
      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, "utf-8");

      const existing = cortexState.documents.find(d => d.filename === filename);
      if (existing && existing.lastModified >= stat.mtimeMs) {
        continue;
      }

      if (existing) {
        cortexState.claims = cortexState.claims.filter(c => c.docId !== existing.id);
      }

      const docId = filename.replace(/\.md$/, "");
      const title = extractTitle(content, filename);
      const keyEntities = extractKeyEntities(content);
      const keyConstants = extractKeyConstants(content);
      const domains = detectDomains(content);
      const wordCount = countWords(content);

      const doc: CortexDocument = {
        id: docId,
        filename,
        title,
        sizeBytes: stat.size,
        wordCount,
        lastModified: stat.mtimeMs,
        indexed: true,
        indexedAt: Date.now(),
        claimCount: 0,
        keyEntities,
        keyConstants,
        domains,
      };

      const claims = extractClaimsFromContent(content, docId, title);
      doc.claimCount = claims.length;

      if (existing) {
        const idx = cortexState.documents.findIndex(d => d.id === existing.id);
        cortexState.documents[idx] = doc;
      } else {
        cortexState.documents.push(doc);
      }

      cortexState.claims.push(...claims);
      indexedCount++;
    }

    if (indexedCount > 0) {
      detectContradictions();
      detectGaps();
    }

    cortexState.lastIndexed = Date.now();
    cortexState.indexing = false;

    return { indexed: indexedCount, totalClaims: cortexState.claims.length, totalDocs: cortexState.documents.length };
  } catch (err) {
    cortexState.indexing = false;
    throw err;
  }
}

function extractClaimsFromContent(content: string, docId: string, docTitle: string): CortexClaim[] {
  const claims: CortexClaim[] = [];
  const lines = content.split("\n");
  let lastSciName = "";

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line || line.startsWith("---") || line.startsWith("```")) continue;

    const constantMatch = line.match(/(?:κ|kappa|φ|phi|ψ|psi|Ψ|α|theta|θ)\s*[=≈:]\s*([\d./π°]+)/i);
    if (constantMatch) {
      claims.push({
        id: generateId("claim", ++claimCounter),
        docId, docTitle,
        text: line.slice(0, 300),
        category: "constant",
        confidence: 0.9,
        tags: ["mathematical-constant"],
        lineRef: `L${i + 1}`,
      });
    }

    if (/\b(?:contract|award|agreement|MOU|signed|billion|million)\b/i.test(line) && line.length > 40) {
      claims.push({
        id: generateId("claim", ++claimCounter),
        docId, docTitle,
        text: line.slice(0, 300),
        category: "evidence",
        confidence: 0.85,
        tags: ["contract", "procurement"],
        lineRef: `L${i + 1}`,
      });
    }

    if (/\b(?:implies|therefore|proves|demonstrates|reveals|confirms|establishes)\b/i.test(line) && line.length > 30) {
      claims.push({
        id: generateId("claim", ++claimCounter),
        docId, docTitle,
        text: line.slice(0, 300),
        category: "mechanism",
        confidence: 0.7,
        tags: ["causal-claim"],
        lineRef: `L${i + 1}`,
      });
    }

    if (/\b(?:predicts?|will\s+(?:lead|cause|result)|future|forecast|expect)\b/i.test(line) && line.length > 30) {
      claims.push({
        id: generateId("claim", ++claimCounter),
        docId, docTitle,
        text: line.slice(0, 300),
        category: "prediction",
        confidence: 0.5,
        tags: ["prediction"],
        lineRef: `L${i + 1}`,
      });
    }

    const entityLine = /\b(?:DARPA|FinSpy|Gamma\s*Group|LeoLabs|KSAT|Loft\s*Orbital|Kyndryl|Zscaler|Space\s*Force|SDA)\b/i.test(line);
    if (entityLine && line.length > 50 && !constantMatch) {
      claims.push({
        id: generateId("claim", ++claimCounter),
        docId, docTitle,
        text: line.slice(0, 300),
        category: "entity",
        confidence: 0.8,
        tags: extractKeyEntities(line).slice(0, 5),
        lineRef: `L${i + 1}`,
      });
    }

    if (/\b(?:defined\s+as|is\s+(?:a|the|an)\b.{5,}(?:that|which|where))/i.test(line) && line.length > 40) {
      claims.push({
        id: generateId("claim", ++claimCounter),
        docId, docTitle,
        text: line.slice(0, 300),
        category: "definition",
        confidence: 0.85,
        tags: ["definition"],
        lineRef: `L${i + 1}`,
      });
    }

    if (/\b(?:connects?\s+to|relates?\s+to|linked\s+(?:to|with)|bridges?|intersection)\b/i.test(line) && line.length > 30) {
      claims.push({
        id: generateId("claim", ++claimCounter),
        docId, docTitle,
        text: line.slice(0, 300),
        category: "connection",
        confidence: 0.65,
        tags: ["cross-reference"],
        lineRef: `L${i + 1}`,
      });
    }

    if (/pubmed\.ncbi\.nlm\.nih\.gov|doi\.org/i.test(line)) {
      claims.push({
        id: generateId("claim", ++claimCounter),
        docId, docTitle,
        text: line.slice(0, 300),
        category: "evidence",
        confidence: 0.95,
        tags: ["pubmed", "peer-reviewed"],
        lineRef: `L${i + 1}`,
      });
    }

    const tsvCols = rawLine.split("\t");
    if (tsvCols.length >= 3 && !rawLine.startsWith("Scientific")) {
      const rawSciName = tsvCols[0].trim();
      if (rawSciName.length > 2) lastSciName = rawSciName;
      const sciName = rawSciName.length > 2 ? rawSciName : lastSciName;
      const studyTitle = tsvCols[2]?.trim() || "";
      if (sciName && studyTitle && studyTitle.length > 10) {
        const alreadyHasEvidence = claims.find(c => c.docId === docId && c.lineRef === `L${i + 1}` && c.category === "evidence");
        if (!alreadyHasEvidence) {
          claims.push({
            id: generateId("claim", ++claimCounter),
            docId, docTitle,
            text: `${sciName}: ${studyTitle}`.slice(0, 300),
            category: "evidence",
            confidence: 0.9,
            tags: ["botanical", "study", sciName.split(" ")[0].toLowerCase()],
            lineRef: `L${i + 1}`,
          });
        }
      }
    }

    if (/(?:anti-obesity|anti-obes\w*|sarcopenia|insulin\s*resistance|insulin\s*resistan\w*|glucose\s*transport\w*|muscle\s*atrophy|hypertension|testosterone|SHBG|inflamm(?:ation|atory)?|pyroptosis|natural\s*killer|NK\s*cell|AMPK|Akt\b|IGF-1|phlorotannin|dieckol|fucoidan|polyphenol|epigenetic)/i.test(line) && line.length > 20) {
      const existingForLine = claims.find(c => c.docId === docId && c.lineRef === `L${i + 1}` && c.category === "mechanism");
      if (!existingForLine) {
        claims.push({
          id: generateId("claim", ++claimCounter),
          docId, docTitle,
          text: line.slice(0, 300),
          category: "mechanism",
          confidence: 0.8,
          tags: ["biological-pathway"],
          lineRef: `L${i + 1}`,
        });
      }
    }
  }

  return claims;
}

function detectContradictions(): void {
  cortexState.contradictions = [];
  const constantClaims = cortexState.claims.filter(c => c.category === "constant");

  for (let i = 0; i < constantClaims.length; i++) {
    for (let j = i + 1; j < constantClaims.length; j++) {
      const a = constantClaims[i];
      const b = constantClaims[j];
      if (a.docId === b.docId) continue;

      const aNum = a.text.match(/[=≈:]\s*([\d.]+)/);
      const bNum = b.text.match(/[=≈:]\s*([\d.]+)/);
      if (!aNum || !bNum) continue;

      const aKey = a.text.match(/[κψφΨαθΛ]/)?.[0];
      const bKey = b.text.match(/[κψφΨαθΛ]/)?.[0];
      if (!aKey || !bKey || aKey !== bKey) continue;

      const aVal = parseFloat(aNum[1]);
      const bVal = parseFloat(bNum[1]);
      if (isNaN(aVal) || isNaN(bVal)) continue;

      const diff = Math.abs(aVal - bVal) / Math.max(aVal, bVal);
      if (diff > 0.01 && diff < 0.5) {
        cortexState.contradictions.push({
          id: generateId("contra", ++contradictionCounter),
          claimA: a.text.slice(0, 150),
          claimB: b.text.slice(0, 150),
          docA: a.docTitle,
          docB: b.docTitle,
          description: `Constant ${aKey} differs: ${aVal} vs ${bVal} (${(diff * 100).toFixed(1)}% divergence)`,
          severity: diff > 0.1 ? "high" : diff > 0.05 ? "medium" : "low",
          resolved: false,
        });
      }
    }
  }
}

function detectGaps(): void {
  cortexState.gaps = [];
  const allDomains = new Set<string>();
  cortexState.documents.forEach(d => d.domains.forEach(dom => allDomains.add(dom)));

  const domainDocCounts: Record<string, number> = {};
  cortexState.documents.forEach(d => {
    d.domains.forEach(dom => {
      domainDocCounts[dom] = (domainDocCounts[dom] || 0) + 1;
    });
  });

  for (const [domain, count] of Object.entries(domainDocCounts)) {
    if (count <= 1) {
      cortexState.gaps.push({
        id: generateId("gap", ++gapCounter),
        domain,
        description: `Only ${count} document covers "${domain}" — needs deeper investigation`,
        suggestedResearch: `Commission dedicated research into ${domain} aspects of the KAPPA framework`,
        relatedDocs: cortexState.documents.filter(d => d.domains.includes(domain)).map(d => d.id),
        priority: "high",
      });
    }
  }

  const crossDomainPairs = [
    ["SIGINT", "Quantum/Physics"],
    ["Biology/Chitin", "Network/Cyber"],
    ["DARPA/Defense", "Surveillance"],
    ["Topology/Math", "Consciousness/GOS"],
    ["Space/Satellite", "Geophysics"],
  ];
  for (const [a, b] of crossDomainPairs) {
    if (allDomains.has(a) && allDomains.has(b)) {
      const bridgeDocs = cortexState.documents.filter(d => d.domains.includes(a) && d.domains.includes(b));
      if (bridgeDocs.length === 0) {
        cortexState.gaps.push({
          id: generateId("gap", ++gapCounter),
          domain: `${a} ↔ ${b}`,
          description: `No document bridges "${a}" and "${b}" domains`,
          suggestedResearch: `Investigate cross-domain connections between ${a} and ${b}`,
          relatedDocs: [],
          priority: "medium",
        });
      }
    }
  }
}

export function getCortexStatus() {
  return {
    documents: cortexState.documents,
    claimCount: cortexState.claims.length,
    contradictions: cortexState.contradictions,
    gaps: cortexState.gaps,
    lastIndexed: cortexState.lastIndexed,
    indexing: cortexState.indexing,
    synthesisRuns: cortexState.synthesisRuns.map(r => ({
      id: r.id,
      topic: r.topic,
      status: r.status,
      facetCount: r.facets.length,
      messageCount: r.dialogueMessages.length,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
    })),
    domainMap: buildDomainMap(),
  };
}

function buildDomainMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  cortexState.documents.forEach(d => {
    d.domains.forEach(dom => {
      if (!map[dom]) map[dom] = [];
      map[dom].push(d.id);
    });
  });
  return map;
}

export function getClaims(filters?: { docId?: string; category?: string; search?: string }): CortexClaim[] {
  let result = cortexState.claims;
  if (filters?.docId) result = result.filter(c => c.docId === filters.docId);
  if (filters?.category) result = result.filter(c => c.category === filters.category);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(c => c.text.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q)));
  }
  return result;
}

export function getDocumentContent(docId: string): { content: string; filename: string } | null {
  const doc = cortexState.documents.find(d => d.id === docId);
  if (!doc) return null;
  const filePath = nodePath.join(DOCS_DIR, doc.filename);
  if (!fs.existsSync(filePath)) return null;
  return { content: fs.readFileSync(filePath, "utf-8"), filename: doc.filename };
}

export function writeDocumentContent(docId: string, content: string): boolean {
  const doc = cortexState.documents.find(d => d.id === docId);
  if (!doc) return false;
  const filePath = nodePath.join(DOCS_DIR, doc.filename);
  fs.writeFileSync(filePath, content, "utf-8");
  return true;
}

export function createDocument(filename: string, content: string): CortexDocument {
  const safeName = nodePath.basename(filename);
  if (!safeName || safeName !== filename || safeName.startsWith(".")) {
    throw new Error("Invalid filename: must be a plain basename with no path separators or traversal sequences");
  }
  const filePath = nodePath.join(DOCS_DIR, safeName);
  const resolvedPath = nodePath.resolve(filePath);
  const resolvedDocs = nodePath.resolve(DOCS_DIR);
  if (!resolvedPath.startsWith(resolvedDocs + nodePath.sep) && resolvedPath !== resolvedDocs) {
    throw new Error("Path traversal detected: filename resolves outside the documents directory");
  }
  fs.writeFileSync(filePath, content, "utf-8");
  const stat = fs.statSync(filePath);
  const docId = safeName.replace(/\.md$/, "");
  const doc: CortexDocument = {
    id: docId,
    filename: safeName,
    title: extractTitle(content, safeName),
    sizeBytes: stat.size,
    wordCount: countWords(content),
    lastModified: stat.mtimeMs,
    indexed: false,
    claimCount: 0,
    keyEntities: extractKeyEntities(content),
    keyConstants: extractKeyConstants(content),
    domains: detectDomains(content),
  };
  cortexState.documents.push(doc);
  return doc;
}

const FACET_ANGLES = [
  { name: "Structural Analysis", angle: "0°", description: "Decompose into atomic claims, axioms, and logical dependencies" },
  { name: "Adversarial Critique", angle: "30°", description: "Attack every assumption — what can be falsified or is unfounded?" },
  { name: "Tonal/Semantic", angle: "60°", description: "Analyze through linguistic structure — what do tonal shifts, word choices, and framing reveal?" },
  { name: "Cross-Domain Bridge", angle: "90°", description: "Map connections between seemingly unrelated fields — physics↔biology, defense↔surveillance" },
  { name: "Historical/Temporal", angle: "120°", description: "Place findings on a timeline — what came before, what follows, where are the causal chains?" },
  { name: "Mathematical Verification", angle: "150°", description: "Check every equation, constant, and derivation for internal consistency" },
  { name: "Pattern Recognition", angle: "180°", description: "Find recurring motifs, fractals, self-similar structures across the corpus" },
  { name: "Geopolitical Context", angle: "210°", description: "Situate findings within power structures, treaties, institutional incentives" },
  { name: "Technological Feasibility", angle: "240°", description: "What is physically buildable vs. theoretical? Engineering constraints." },
  { name: "Epistemological Audit", angle: "270°", description: "How do we know what we know? Source reliability, circular reasoning detection" },
  { name: "Synthesis/Unification", angle: "300°", description: "Merge all perspectives into a coherent unified picture — resolve tensions" },
  { name: "Predictive Extrapolation", angle: "330°", description: "Given everything, what MUST happen next? Generate testable predictions" },
];

function selectModelForFacet(facetIdx: number, models: ModelInfo[]): ModelInfo {
  if (models.length === 0) throw new Error("No models available");

  const modelPreferences: Record<string, string[]> = {
    "Structural Analysis": ["o3-mini", "deepseek-r1", "o4-mini"],
    "Adversarial Critique": ["claude-sonnet-4", "claude-opus-4", "gpt-4.1"],
    "Tonal/Semantic": ["Qwen", "deepseek-chat-v3", "mistral-nemo"],
    "Cross-Domain Bridge": ["gemini-2.5-pro", "gpt-4o", "claude-sonnet-4"],
    "Historical/Temporal": ["gpt-4.1", "gpt-4o", "deepseek-chat-v3"],
    "Mathematical Verification": ["deepseek-prover-v2", "o3-mini", "o4-mini"],
    "Pattern Recognition": ["gemini-2.5-pro", "deepseek-r1", "o3-mini"],
    "Geopolitical Context": ["claude-sonnet-4", "gpt-4.1", "mistral-large"],
    "Technological Feasibility": ["gpt-4o", "deepseek-chat-v3", "gemini-2.5-pro"],
    "Epistemological Audit": ["claude-opus-4", "o3-mini", "deepseek-r1"],
    "Synthesis/Unification": ["gemini-2.5-pro", "claude-opus-4", "gpt-4.1"],
    "Predictive Extrapolation": ["deepseek-r1", "o3-mini", "gemini-2.5-pro"],
  };

  const facet = FACET_ANGLES[facetIdx % FACET_ANGLES.length];
  const prefs = modelPreferences[facet.name] || [];

  for (const pref of prefs) {
    const match = models.find(m => m.name.includes(pref) || m.displayName.includes(pref));
    if (match) return match;
  }

  return models[facetIdx % models.length];
}

export async function executeSynthesisRun(
  topic: string,
  facetCount: number = 12,
  includeDialogue: boolean = true,
): Promise<SynthesisRun> {
  const models = getAvailableModels().filter(m => m.available);
  if (models.length === 0) throw new Error("No models available");

  const runId = generateId("synth", ++synthCounter);
  const selectedFacets = FACET_ANGLES.slice(0, Math.min(facetCount, FACET_ANGLES.length));

  const corpusContext = buildCorpusContext();

  const facets: ResearchFacet[] = selectedFacets.map((fa, idx) => {
    const model = selectModelForFacet(idx, models);
    return {
      id: `${runId}-facet-${idx}`,
      name: fa.name,
      angle: fa.angle,
      description: fa.description,
      assignedModel: model.displayName,
      status: "pending" as const,
    };
  });

  const run: SynthesisRun = {
    id: runId,
    topic,
    facets,
    dialogueMessages: [],
    status: "dispatching",
    startedAt: Date.now(),
    contradictions: [],
    gaps: [],
  };

  cortexState.synthesisRuns.push(run);

  (async () => {
    try {
      for (let i = 0; i < facets.length; i++) {
        const facet = facets[i];
        const facetAngle = selectedFacets[i];
        const model = selectModelForFacet(i, models);

        facet.status = "running";

        const prompt = `═══════════════════════════════════════════════════════════════════
RESEARCH CORTEX — DODECAHEDRAL FACET ANALYSIS
═══════════════════════════════════════════════════════════════════

FACET: ${facetAngle.name} (${facetAngle.angle})
DIRECTIVE: ${facetAngle.description}

RESEARCH TOPIC:
${topic}

CORPUS CONTEXT (${cortexState.documents.length} documents, ${cortexState.claims.length} claims indexed):
${corpusContext}

EXISTING CONTRADICTIONS DETECTED:
${cortexState.contradictions.map(c => `• ${c.description} [${c.docA} vs ${c.docB}]`).join("\n") || "None detected yet"}

KNOWLEDGE GAPS:
${cortexState.gaps.map(g => `• [${g.priority}] ${g.domain}: ${g.description}`).join("\n") || "None identified yet"}

YOUR ANGLE OF ATTACK: ${facetAngle.description}

INSTRUCTIONS:
1. Analyze the topic EXCLUSIVELY through your assigned angle (${facetAngle.name})
2. Reference specific documents and claims from the corpus
3. Identify what OTHER facets might miss from their angles
4. Flag any contradictions you discover
5. Propose concrete next-research-steps for your domain
6. Rate confidence in each finding (0.0-1.0)

OUTPUT FORMAT:
## ${facetAngle.name} Analysis (${facetAngle.angle})
### Key Findings
### Contradictions Detected
### Gaps Identified
### Cross-Facet Signals (what other angles should investigate)
### Confidence-Rated Claims
### Recommended Next Steps`;

        try {
          const result = await queryModel(
            model.provider,
            model.name,
            [{ role: "user", content: prompt }],
            4
          );

          facet.result = result.response;
          facet.durationMs = result.durationMs;
          facet.status = result.error ? "error" : "completed";

          if (!result.error) {
            run.dialogueMessages.push({
              id: generateId("msg", Date.now()),
              sessionId: runId,
              fromModel: model.displayName,
              toModel: "Cortex",
              facetId: facet.id,
              role: "response",
              content: result.response,
              timestamp: Date.now(),
              tokensUsed: result.tokensUsed,
              durationMs: result.durationMs,
            });
          }
        } catch (err: any) {
          facet.status = "error";
          facet.result = `Error: ${err.message}`;
        }
      }

      if (includeDialogue && facets.filter(f => f.status === "completed").length >= 2) {
        run.status = "synthesizing";

        const completedResults = facets
          .filter(f => f.status === "completed" && f.result)
          .map(f => `## ${f.name} (${f.angle}) [${f.assignedModel}]\n${f.result}`)
          .join("\n\n---\n\n");

        const synthModel = models.find(m =>
          m.name.includes("gemini-2.5-pro") || m.name.includes("claude-opus") || m.name.includes("gpt-4.1")
        ) || models[0];

        const synthPrompt = `═══════════════════════════════════════════════════════════════════
RESEARCH CORTEX — UNIFIED SYNTHESIS
═══════════════════════════════════════════════════════════════════

You are the Synthesis Controller of a dodecahedral research engine.
${facets.filter(f => f.status === "completed").length} specialist models have each analyzed the topic from different angles.

TOPIC: ${topic}

ALL FACET REPORTS:
${completedResults}

YOUR TASK:
1. MERGE all perspectives into a unified coherent picture
2. RESOLVE contradictions between facets — which model's analysis is stronger and why?
3. IDENTIFY claims that multiple facets independently confirm (high-confidence convergence)
4. FLAG claims that only one facet supports (needs verification)
5. PRODUCE a final ranked list of findings by confidence
6. GENERATE testable predictions
7. LIST specific gaps that need new research

OUTPUT FORMAT:
## Unified Synthesis
### Convergent Findings (confirmed by multiple angles)
### Divergent Findings (single-angle, needs verification)
### Resolved Contradictions
### Unresolved Tensions
### Confidence-Ranked Master Claim List
### Testable Predictions
### Research Gaps & Next Steps
### Meta-Assessment (how well did this 12-facet analysis perform?)`;

        try {
          const synthResult = await queryModel(
            synthModel.provider,
            synthModel.name,
            [{ role: "user", content: synthPrompt }],
            5
          );

          run.synthesis = synthResult.response;

          run.dialogueMessages.push({
            id: generateId("msg", Date.now()),
            sessionId: runId,
            fromModel: synthModel.displayName,
            toModel: "All Facets",
            facetId: "synthesis",
            role: "synthesis",
            content: synthResult.response || "",
            timestamp: Date.now(),
            tokensUsed: synthResult.tokensUsed,
            durationMs: synthResult.durationMs,
          });
        } catch (err: any) {
          run.synthesis = `Synthesis error: ${err.message}`;
        }
      }

      run.status = "completed";
      run.completedAt = Date.now();
    } catch (err: any) {
      run.status = "error";
      run.completedAt = Date.now();
      console.error("[research-cortex] Synthesis run error:", err.message);
    }
  })();

  return run;
}

function buildCorpusContext(): string {
  return cortexState.documents.map(d => {
    const topClaims = cortexState.claims
      .filter(c => c.docId === d.id)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(c => `  • [${c.category}] ${c.text.slice(0, 100)}`)
      .join("\n");

    return `📄 ${d.title} (${d.filename})
  Domains: ${d.domains.join(", ")}
  Entities: ${d.keyEntities.slice(0, 8).join(", ")}
  Constants: ${d.keyConstants.slice(0, 5).join(", ")}
  Claims: ${d.claimCount}
${topClaims}`;
  }).join("\n\n");
}

export function getSynthesisRun(runId: string): SynthesisRun | undefined {
  return cortexState.synthesisRuns.find(r => r.id === runId);
}

export function exportCorpus(format: "markdown" | "json" | "latex"): string {
  if (format === "json") {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      documents: cortexState.documents,
      claims: cortexState.claims,
      contradictions: cortexState.contradictions,
      gaps: cortexState.gaps,
      synthesisRuns: cortexState.synthesisRuns.map(r => ({
        id: r.id,
        topic: r.topic,
        status: r.status,
        facets: r.facets.map(f => ({ name: f.name, angle: f.angle, status: f.status, model: f.assignedModel, result: f.result })),
        synthesis: r.synthesis,
      })),
    }, null, 2);
  }

  if (format === "latex") {
    let tex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb}
\\usepackage{hyperref}
\\usepackage{longtable}
\\title{Project KAPPA — Research Cortex Export}
\\author{Automated Synthesis Engine}
\\date{${new Date().toISOString().split("T")[0]}}
\\begin{document}
\\maketitle
\\tableofcontents
\\newpage

\\section{Document Corpus}
${cortexState.documents.map(d => `\\subsection{${d.title.replace(/[&%$#_{}~^\\]/g, "\\$&")}}
\\textbf{File:} ${d.filename.replace(/_/g, "\\_")} \\\\
\\textbf{Domains:} ${d.domains.join(", ")} \\\\
\\textbf{Claims:} ${d.claimCount} \\\\
\\textbf{Words:} ${d.wordCount}
`).join("\n")}

\\section{Extracted Claims}
\\begin{longtable}{|p{2cm}|p{4cm}|p{6cm}|p{1.5cm}|}
\\hline
\\textbf{Category} & \\textbf{Document} & \\textbf{Claim} & \\textbf{Conf.} \\\\
\\hline
${cortexState.claims.slice(0, 100).map(c => `${c.category} & ${c.docTitle.slice(0, 30).replace(/[&%$#_{}~^\\]/g, "\\$&")} & ${c.text.slice(0, 80).replace(/[&%$#_{}~^\\]/g, "\\$&")} & ${c.confidence.toFixed(2)} \\\\
\\hline`).join("\n")}
\\end{longtable}

\\section{Contradictions}
${cortexState.contradictions.map(c => `\\paragraph{${c.description.replace(/[&%$#_{}~^\\]/g, "\\$&")}}
${c.docA.replace(/[&%$#_{}~^\\]/g, "\\$&")} vs ${c.docB.replace(/[&%$#_{}~^\\]/g, "\\$&")}
`).join("\n") || "No contradictions detected."}

\\section{Knowledge Gaps}
${cortexState.gaps.map(g => `\\paragraph{[${g.priority}] ${g.domain.replace(/[&%$#_{}~^\\]/g, "\\$&")}}
${g.description.replace(/[&%$#_{}~^\\]/g, "\\$&")}
`).join("\n") || "No gaps identified."}

\\end{document}`;
    return tex;
  }

  let md = `# Project KAPPA — Research Cortex Export
**Generated:** ${new Date().toISOString()}
**Documents:** ${cortexState.documents.length}
**Claims:** ${cortexState.claims.length}
**Contradictions:** ${cortexState.contradictions.length}
**Gaps:** ${cortexState.gaps.length}

---

## Document Corpus

${cortexState.documents.map(d => `### ${d.title}
- **File:** ${d.filename}
- **Size:** ${(d.sizeBytes / 1024).toFixed(1)} KB | **Words:** ${d.wordCount}
- **Domains:** ${d.domains.join(", ")}
- **Key Entities:** ${d.keyEntities.slice(0, 10).join(", ")}
- **Constants:** ${d.keyConstants.slice(0, 8).join(", ")}
- **Claims Extracted:** ${d.claimCount}
`).join("\n")}

---

## Extracted Claims

${Object.entries(groupBy(cortexState.claims, "category")).map(([cat, claims]) => `### ${cat} (${(claims as CortexClaim[]).length})
${(claims as CortexClaim[]).slice(0, 20).map(c => `- [${c.confidence.toFixed(2)}] **${c.docTitle}** (${c.lineRef}): ${c.text.slice(0, 150)}`).join("\n")}
`).join("\n")}

---

## Contradictions

${cortexState.contradictions.map(c => `### [${c.severity}] ${c.description}
- **Doc A:** ${c.docA} — "${c.claimA.slice(0, 100)}"
- **Doc B:** ${c.docB} — "${c.claimB.slice(0, 100)}"
- **Resolved:** ${c.resolved ? "Yes" : "No"}${c.resolution ? ` — ${c.resolution}` : ""}
`).join("\n") || "No contradictions detected."}

---

## Knowledge Gaps

${cortexState.gaps.map(g => `### [${g.priority}] ${g.domain}
${g.description}
**Suggested Research:** ${g.suggestedResearch}
`).join("\n") || "No gaps identified."}`;

  for (const run of cortexState.synthesisRuns) {
    md += `\n\n---\n\n## Synthesis Run: ${run.topic}
**Status:** ${run.status} | **Facets:** ${run.facets.length}
**Started:** ${new Date(run.startedAt).toISOString()}

${run.facets.map(f => `### Facet: ${f.name} (${f.angle}) [${f.assignedModel}]
**Status:** ${f.status}${f.durationMs ? ` | ${(f.durationMs / 1000).toFixed(1)}s` : ""}
${f.result ? f.result.slice(0, 2000) : "No result"}
`).join("\n")}

${run.synthesis ? `### Unified Synthesis\n${run.synthesis}` : ""}
`;
  }

  return md;
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const k = String(item[key]);
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}

export function getExportFormats(): string[] {
  return ["markdown", "json", "latex"];
}
