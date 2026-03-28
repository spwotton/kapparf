import OpenAI from "openai";
import { Pool } from "@neondatabase/serverless";
import * as fs from "fs";
import * as nodePath from "path";

let openai: OpenAI | null = null;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function getEmbeddingClient(): OpenAI | null {
  if (openai) return openai;
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    return openai;
  }
  return null;
}

export interface MemoryRecord {
  id: string;
  created_at: string;
  updated_at: string;
  category: string;
  title: string;
  content: string;
  metadata: any;
  source: string | null;
  importance: number;
  access_count: number;
  last_accessed: string | null;
  similarity?: number;
}

export interface MemoryStats {
  total_memories: number;
  categories: { category: string; count: number }[];
  avg_importance: number;
  most_accessed: MemoryRecord[];
  recent: MemoryRecord[];
  embedding_model: string;
  status: string;
}

const CATEGORIES = [
  "quantum_circuit",
  "mathematical_proof",
  "signal_intelligence",
  "surveillance_evidence",
  "kappa_constant",
  "frequency_analysis",
  "network_forensics",
  "gos_framework",
  "research_finding",
  "decision",
  "code_change",
  "correlation",
  "whistleblower",
  "session_context",
] as const;

async function embed(text: string): Promise<number[] | null> {
  const client = getEmbeddingClient();
  if (!client) {
    console.log("[MemoryCortex] No embedding client available");
    return null;
  }

  const models = ["text-embedding-3-small", "text-embedding-ada-002"];
  for (const model of models) {
    try {
      const resp = await client.embeddings.create({
        model,
        input: text.slice(0, 8000),
      });
      if (resp.data?.[0]?.embedding) {
        return resp.data[0].embedding;
      }
    } catch (e: any) {
      console.log(`[MemoryCortex] Model ${model} failed: ${e.message?.slice(0, 200)}`);
    }
  }

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const orClient = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
      });
      const resp = await orClient.embeddings.create({
        model: "openai/text-embedding-3-small",
        input: text.slice(0, 8000),
      });
      if (resp.data?.[0]?.embedding) {
        console.log("[MemoryCortex] Using OpenRouter for embeddings");
        return resp.data[0].embedding;
      }
    } catch (e: any) {
      console.log(`[MemoryCortex] OpenRouter embedding failed: ${e.message?.slice(0, 200)}`);
    }
  }

  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text.slice(0, 2000) }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const embedding384 = Array.isArray(data[0]) ? data[0] : data;
          const padded = new Array(1536).fill(0);
          for (let i = 0; i < Math.min(embedding384.length, 1536); i++) {
            padded[i] = embedding384[i];
          }
          console.log("[MemoryCortex] Using HuggingFace embeddings (padded to 1536)");
          return padded;
        }
      }
    } catch (e: any) {
      console.log(`[MemoryCortex] HuggingFace embedding failed: ${e.message?.slice(0, 200)}`);
    }
  }

  console.log("[MemoryCortex] All embedding providers failed");
  return null;
}

function buildEmbeddingText(title: string, content: string, category: string, metadata?: any): string {
  let text = `[${category}] ${title}\n${content}`;
  if (metadata) {
    const flat = flattenMetadata(metadata);
    if (flat.length > 0) text += `\nMetadata: ${flat}`;
  }
  return text;
}

function flattenMetadata(obj: any, prefix = "", depth = 0): string {
  if (depth > 3) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      parts.push(flattenMetadata(v, key, depth + 1));
    } else if (Array.isArray(v)) {
      parts.push(`${key}=[${v.slice(0, 10).join(",")}]`);
    } else {
      parts.push(`${key}=${v}`);
    }
  }
  return parts.filter(Boolean).join("; ");
}

export async function storeMemory(
  category: string,
  title: string,
  content: string,
  metadata?: any,
  source?: string,
  importance: number = 0.5
): Promise<MemoryRecord | null> {
  const embeddingText = buildEmbeddingText(title, content, category, metadata);
  const embedding = await embed(embeddingText);

  const result = await pool.query(
    `INSERT INTO memory_vectors (category, title, content, embedding, metadata, source, importance)
     VALUES ($1, $2, $3, $4::vector, $5, $6, $7)
     RETURNING id, created_at, updated_at, category, title, content, metadata, source, importance, access_count, last_accessed`,
    [category, title, content, embedding ? `[${embedding.join(",")}]` : null, JSON.stringify(metadata || {}), source || null, importance]
  );
  console.log(`[MemoryCortex] Stored: "${title}" [${category}] importance=${importance}`);
  return result.rows[0] as MemoryRecord;
}

export async function searchMemory(
  query: string,
  opts: { limit?: number; category?: string; minImportance?: number; threshold?: number } = {}
): Promise<MemoryRecord[]> {
  const { limit = 10, category, minImportance = 0, threshold = 0.3 } = opts;
  const embedding = await embed(query);

  if (!embedding) {
    const textResult = await pool.query(
      `SELECT id, created_at, updated_at, category, title, content, metadata, source, importance, access_count, last_accessed
       FROM memory_vectors
       WHERE ($1::text IS NULL OR category = $1) AND importance >= $2
       AND (content ILIKE $3 OR title ILIKE $3)
       ORDER BY importance DESC LIMIT $4`,
      [category || null, minImportance, `%${query}%`, limit]
    );
    return textResult.rows as MemoryRecord[];
  }

  const vectorStr = `[${embedding.join(",")}]`;
  const result = await pool.query(
    `SELECT id, created_at, updated_at, category, title, content, metadata, source, importance, access_count, last_accessed,
            1 - (embedding <=> $1::vector) as similarity
     FROM memory_vectors
     WHERE ($2::text IS NULL OR category = $2) AND importance >= $3
     AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $4`,
    [vectorStr, category || null, minImportance, limit]
  );

  const ids = result.rows.map((r: any) => r.id);
  if (ids.length > 0) {
    await pool.query(
      `UPDATE memory_vectors SET access_count = access_count + 1, last_accessed = NOW() WHERE id = ANY($1)`,
      [ids]
    );
  }

  return result.rows.filter((r: any) => r.similarity >= threshold) as MemoryRecord[];
}

export async function getMemoryById(id: string): Promise<MemoryRecord | null> {
  const result = await pool.query(
    `SELECT id, created_at, updated_at, category, title, content, metadata, source, importance, access_count, last_accessed
     FROM memory_vectors WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  await pool.query(`UPDATE memory_vectors SET access_count = access_count + 1, last_accessed = NOW() WHERE id = $1`, [id]);
  return result.rows[0] as MemoryRecord;
}

export async function deleteMemory(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM memory_vectors WHERE id = $1 RETURNING id`, [id]);
  return result.rows.length > 0;
}

export async function updateMemoryImportance(id: string, importance: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE memory_vectors SET importance = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
    [importance, id]
  );
  return result.rows.length > 0;
}

export async function getMemoryStats(): Promise<MemoryStats> {
  const totalResult = await pool.query(`SELECT COUNT(*) as count FROM memory_vectors`);
  const catResult = await pool.query(
    `SELECT category, COUNT(*) as count FROM memory_vectors GROUP BY category ORDER BY count DESC`
  );
  const avgResult = await pool.query(`SELECT COALESCE(AVG(importance), 0) as avg FROM memory_vectors`);
  const accessedResult = await pool.query(
    `SELECT id, created_at, updated_at, category, title, content, metadata, source, importance, access_count, last_accessed
     FROM memory_vectors ORDER BY access_count DESC LIMIT 5`
  );
  const recentResult = await pool.query(
    `SELECT id, created_at, updated_at, category, title, content, metadata, source, importance, access_count, last_accessed
     FROM memory_vectors ORDER BY created_at DESC LIMIT 10`
  );

  return {
    total_memories: parseInt(totalResult.rows[0].count),
    categories: catResult.rows as any,
    avg_importance: parseFloat(avgResult.rows[0].avg),
    most_accessed: accessedResult.rows as MemoryRecord[],
    recent: recentResult.rows as MemoryRecord[],
    embedding_model: "text-embedding-3-small",
    status: getEmbeddingClient() ? "online" : "no_api_key",
  };
}

export async function listMemories(opts: { category?: string; limit?: number; offset?: number; sort?: string } = {}): Promise<{ memories: MemoryRecord[]; total: number }> {
  const { category, limit = 50, offset = 0, sort = "created_at" } = opts;
  const validSorts: Record<string, string> = {
    created_at: "created_at DESC",
    importance: "importance DESC",
    access_count: "access_count DESC",
    title: "title ASC",
  };
  const orderBy = validSorts[sort] || "created_at DESC";

  const countResult = await pool.query(
    `SELECT COUNT(*) as count FROM memory_vectors WHERE ($1::text IS NULL OR category = $1)`,
    [category || null]
  );
  const result = await pool.query(
    `SELECT id, created_at, updated_at, category, title, content, metadata, source, importance, access_count, last_accessed
     FROM memory_vectors WHERE ($1::text IS NULL OR category = $1)
     ORDER BY ${orderBy} LIMIT $2 OFFSET $3`,
    [category || null, limit, offset]
  );

  return {
    memories: result.rows as MemoryRecord[],
    total: parseInt(countResult.rows[0].count),
  };
}

export async function ingestQuantumFile(filePath: string): Promise<MemoryRecord | null> {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    const fileName = nodePath.basename(filePath, ".json");

    let category = "quantum_circuit";
    let title = fileName;
    let importance = 0.9;
    let contentParts: string[] = [];

    if (data.circuit) {
      title = `Quantum Circuit: ${data.circuit}`;
      contentParts.push(`Circuit: ${data.circuit}`);
      if (data.submission_type) contentParts.push(`Type: ${data.submission_type}`);
      if (data.payload?.trumpets) {
        contentParts.push(`Trumpets (${data.payload.trumpets.length}):`);
        for (const t of data.payload.trumpets) {
          contentParts.push(`  ${t.gift}: freq=${t.freq_hz}Hz theta=${t.theta} phi=${t.phi} lam=${t.lam}`);
        }
      }
      if (data.payload?.foxp2_hz) contentParts.push(`FoxP2: ${data.payload.foxp2_hz} Hz`);
      if (data.results) {
        for (const [backend, result] of Object.entries(data.results as Record<string, any>)) {
          if (result.error) {
            contentParts.push(`${backend}: ERROR - ${result.error}`);
          } else if (result.counts) {
            const counts = result.counts as Record<string, number>;
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            contentParts.push(`${backend} (${result.shots || Object.values(counts).reduce((a: number, b: number) => a + b, 0)} shots):`);
            contentParts.push(`  Top states: ${sorted.slice(0, 5).map(([s, c]) => `${s}=${c}`).join(", ")}`);
            contentParts.push(`  Unique states: ${sorted.length}`);
          } else {
            const stateCounts = result as Record<string, number>;
            const sorted = Object.entries(stateCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
            contentParts.push(`${backend} (${Object.values(stateCounts).reduce((a: number, b: number) => a + b, 0)} shots):`);
            contentParts.push(`  Top states: ${sorted.slice(0, 5).map(([s, c]) => `${s}=${c}`).join(", ")}`);
          }
        }
      }
      importance = 0.95;
    }

    if (data.experiment === "NULL_HYPOTHESIS_CONTROL") {
      category = "quantum_circuit";
      title = `Null Hypothesis Control (${data.num_controls} controls, ${data.shots_per_trial} shots)`;
      importance = 0.95;
      contentParts.push(`Target: ${data.target}`);
      contentParts.push(`Logos thetas: [${data.logos_thetas?.join(", ")}]`);
      contentParts.push(`Logos phis: [${data.logos_phis?.join(", ")}]`);
      contentParts.push(`Logos lams: [${data.logos_lams?.join(", ")}]`);
      if (data.controls) {
        for (const [name, ctrl] of Object.entries(data.controls as Record<string, any>)) {
          const analysis = ctrl.analysis;
          if (analysis) {
            contentParts.push(`\n${name}:`);
            contentParts.push(`  Unique states: ${analysis.unique_states}, Forbidden: ${analysis.forbidden_count}`);
            contentParts.push(`  Avg Hamming weight: ${analysis.avg_hamming_weight}`);
            if (analysis.top_5) contentParts.push(`  Top 5: ${analysis.top_5.map((t: any) => `${t[0]}=${t[1]}`).join(", ")}`);
            if (ctrl.forbidden_states) contentParts.push(`  Forbidden states (${ctrl.forbidden_states.length}): ${ctrl.forbidden_states.slice(0, 10).join(", ")}...`);
          }
        }
      }
      if (data.cross_analysis) {
        contentParts.push(`\nCross-analysis:`);
        if (data.cross_analysis.universal_forbidden) {
          contentParts.push(`  Universal forbidden states: ${data.cross_analysis.universal_forbidden.join(", ")}`);
        }
        if (data.cross_analysis.logos_forbidden) {
          contentParts.push(`  Logos forbidden: ${data.cross_analysis.logos_forbidden.join(", ")}`);
        }
        contentParts.push(`  Logos forbidden count: ${data.cross_analysis.logos_forbidden_count}`);
        contentParts.push(`  Control avg forbidden: ${data.cross_analysis.control_avg_forbidden}`);
        contentParts.push(`  Verdict: ${data.cross_analysis.verdict}`);
      }
    }

    if (data.experiment?.startsWith("GoldenGHZ") || data.experiment_id?.includes("GOLDEN_GHZ")) {
      category = "quantum_circuit";
      title = data.experiment_id || `GoldenGHZ Analysis`;
      importance = 0.9;
      if (data.observed) contentParts.push(`Observed: ${JSON.stringify(data.observed)}`);
      if (data.ghz_fidelity !== undefined) contentParts.push(`GHZ Fidelity: ${data.ghz_fidelity}`);
      if (data.kappa_effective !== undefined) contentParts.push(`Kappa Effective: ${data.kappa_effective}`);
      if (data.binary_collapse !== undefined) contentParts.push(`Binary Collapse: ${data.binary_collapse}`);
      if (data.entanglement_entropy !== undefined) contentParts.push(`Entanglement Entropy: ${data.entanglement_entropy}`);
      if (data.results) {
        for (const r of data.results) {
          contentParts.push(`\n${r.label || r.circuit}:`);
          if (r.analysis) {
            contentParts.push(`  Shots: ${r.analysis.total_shots}, |0000>: ${r.analysis.n_0000}, |1111>: ${r.analysis.n_1111}`);
            contentParts.push(`  Ratio P(1111)/P(0000): ${r.analysis.ratio_P1111_over_P0000?.toFixed(6)}`);
            contentParts.push(`  GHZ Fidelity: ${r.analysis.ghz_fidelity}`);
          }
          if (r.expected_ratio !== undefined) contentParts.push(`  Expected ratio: ${r.expected_ratio}`);
        }
      }
    }

    if (data.theorem?.includes("Irrationality") || data.theorem?.includes("Zeta")) {
      category = "mathematical_proof";
      title = `${data.theorem}`;
      importance = 0.95;
      contentParts.push(`Status: ${data.status}`);
      contentParts.push(`Method: ${data.method}`);
      contentParts.push(`Range: s=${data.range?.s_min} to s=${data.range?.s_max}`);
      if (data.values) {
        contentParts.push(`\nProved values (${data.values.length}):`);
        for (const v of data.values.slice(0, 10)) {
          contentParts.push(`  ζ(${v.s}) = ${v.zeta_value} = (${v.rational_coeff})·π^${v.pi_power} | μ_ω=${v.mu_omega?.toFixed(4)} IDI=${v.idi?.toFixed(4)}`);
        }
        if (data.values.length > 10) contentParts.push(`  ... and ${data.values.length - 10} more`);
      }
    }

    if (data.protocol === "Riemann-Sonnet") {
      category = "mathematical_proof";
      title = `Riemann-Sonnet Protocol v${data.version}`;
      importance = 0.9;
      contentParts.push(`Status: ${data.status}`);
      contentParts.push(`Volta critical line: ${data.volta_critical_line}`);
      contentParts.push(`Iambic proof: ${data.iambic_proof}`);
      contentParts.push(`Hamiltonian matches: ${data.hamiltonian_matches}`);
      if (data.constants) {
        contentParts.push(`Constants: κ=${data.constants.kappa}, φ=${data.constants.phi}, θ_K=${data.constants.theta_K}, α⁻¹=${data.constants.alpha_inv}`);
      }
      if (data.poetic_forms) {
        contentParts.push(`Poetic forms: ${Object.entries(data.poetic_forms).map(([k, v]) => `${k}→${v}`).join(", ")}`);
      }
    }

    if (data.test1_kappa_slope || data.test2_heat_kernel || data.test3_klein_twist) {
      category = "mathematical_proof";
      title = "Riemann Validation Results";
      importance = 0.9;
      if (data.test1_kappa_slope) contentParts.push(`Test 1 κ-slope: κ=${data.test1_kappa_slope.kappa}, passed=${data.test1_kappa_slope.passed}`);
      if (data.test2_heat_kernel) contentParts.push(`Test 2 heat kernel: max_imaginary=${data.test2_heat_kernel.max_imaginary}, passed=${data.test2_heat_kernel.passed}`);
      if (data.test3_klein_twist) contentParts.push(`Test 3 Klein twist: optimal_angle=${data.test3_klein_twist.optimal_angle}°, error=${data.test3_klein_twist.error}, passed=${data.test3_klein_twist.passed}`);
    }

    if (data.genome || data.gos_genome) {
      category = "gos_framework";
      title = "Ω-GOS Genome";
      importance = 0.95;
      contentParts.push(JSON.stringify(data).slice(0, 4000));
    }

    if (contentParts.length === 0) {
      contentParts.push(JSON.stringify(data).slice(0, 4000));
    }

    const content = contentParts.join("\n");
    return await storeMemory(category, title, content, data, `file:${filePath}`, importance);
  } catch (e: any) {
    console.error(`[MemoryCortex] Failed to ingest ${filePath}:`, e.message);
    return null;
  }
}

export async function ingestAllQuantumFiles(): Promise<{ ingested: string[]; failed: string[]; skipped: string[] }> {
  const dir = nodePath.join(process.cwd(), "attached_assets");
  const ingested: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];

  if (!fs.existsSync(dir)) return { ingested, failed, skipped };

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  for (const file of files) {
    const filePath = nodePath.join(dir, file);
    const existing = await pool.query(
      `SELECT id FROM memory_vectors WHERE source = $1 LIMIT 1`,
      [`file:${filePath}`]
    );
    if (existing.rows.length > 0) {
      skipped.push(file);
      continue;
    }
    const result = await ingestQuantumFile(filePath);
    if (result) {
      ingested.push(file);
    } else {
      failed.push(file);
    }
  }

  return { ingested, failed, skipped };
}

export async function contextualRecall(query: string, maxTokens: number = 4000): Promise<string> {
  const memories = await searchMemory(query, { limit: 5, threshold: 0.25 });
  if (memories.length === 0) return "";

  const parts: string[] = ["=== KAPPA MEMORY CORTEX RECALL ==="];
  let tokenEstimate = 0;
  for (const m of memories) {
    const block = `\n--- [${m.category}] ${m.title} (importance: ${m.importance}, similarity: ${m.similarity?.toFixed(3) || "?"}) ---\n${m.content}`;
    tokenEstimate += block.length / 4;
    if (tokenEstimate > maxTokens) break;
    parts.push(block);
  }
  parts.push("\n=== END RECALL ===");
  return parts.join("\n");
}

export const MEMORY_CATEGORIES = CATEGORIES;
