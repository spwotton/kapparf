/**
 * CORPUS INDEXER — Index GOS docs + mega_corpus.json into ftm_corpus table
 * Uses pgvector-stored embeddings (stored as JSONB float arrays for compatibility)
 * Skips already-indexed chunks for idempotency.
 */

import * as fs from "fs";
import * as path from "path";
import { db } from "../../db";
import { sql } from "drizzle-orm";
import { embed, embedBatch, cosineSim } from "./ftmAi";
import { createHash } from "crypto";

const GOS_DIR = path.join(process.cwd(), "docs", "gos");
const MEGA_CORPUS = path.join(process.cwd(), "docs", "mega_corpus.json");
const CHUNK_SIZE = 800;    // chars per chunk
const CHUNK_OVERLAP = 100;

export interface CorpusChunk {
  chunk_id: string;
  corpus_id: string;
  src: string;
  page: number;
  body: string;
  embedding?: number[];
}

/** Ensure ftm_corpus table exists */
async function ensureTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ftm_corpus (
      chunk_id TEXT PRIMARY KEY,
      corpus_id TEXT NOT NULL,
      src TEXT NOT NULL,
      page INTEGER NOT NULL DEFAULT 0,
      body TEXT NOT NULL,
      embedding JSONB,
      indexed_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ftm_corpus_corpus_id ON ftm_corpus(corpus_id);
  `);
}

function chunkText(text: string, src: string, corpusId: string): CorpusChunk[] {
  const chunks: CorpusChunk[] = [];
  let page = 0;
  for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const body = text.slice(i, i + CHUNK_SIZE).trim();
    if (body.length < 50) continue;
    const hash = createHash("sha256").update(`${corpusId}:${page}:${body.slice(0, 40)}`).digest("hex").slice(0, 16);
    chunks.push({ chunk_id: hash, corpus_id: corpusId, src, page, body });
    page++;
  }
  return chunks;
}

async function getIndexedIds(): Promise<Set<string>> {
  const rows = await db.execute(sql`SELECT chunk_id FROM ftm_corpus`);
  return new Set((rows.rows as any[]).map(r => r.chunk_id as string));
}

async function upsertChunks(chunks: CorpusChunk[]) {
  if (chunks.length === 0) return;
  const BATCH = 20;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const texts = batch.map(c => c.body);
    const embeddings = await embedBatch(texts);

    for (let j = 0; j < batch.length; j++) {
      const c = batch[j];
      const emb = embeddings[j];
      await db.execute(sql`
        INSERT INTO ftm_corpus (chunk_id, corpus_id, src, page, body, embedding)
        VALUES (${c.chunk_id}, ${c.corpus_id}, ${c.src}, ${c.page}, ${c.body}, ${JSON.stringify(emb)})
        ON CONFLICT (chunk_id) DO NOTHING
      `);
    }
  }
}

export async function indexCorpus(): Promise<{ indexed: number; skipped: number }> {
  await ensureTable();
  const indexed_ids = await getIndexedIds();
  const allChunks: CorpusChunk[] = [];

  // Index GOS docs directory
  if (fs.existsSync(GOS_DIR)) {
    const files = fs.readdirSync(GOS_DIR).filter(f => /\.(md|tex|txt)$/.test(f));
    for (const file of files) {
      const text = fs.readFileSync(path.join(GOS_DIR, file), "utf-8");
      const corpusId = file.replace(/\.[^.]+$/, "");
      const chunks = chunkText(text, file, corpusId);
      allChunks.push(...chunks.filter(c => !indexed_ids.has(c.chunk_id)));
    }
  }

  // Index mega_corpus.json if present
  if (fs.existsSync(MEGA_CORPUS)) {
    try {
      const raw = JSON.parse(fs.readFileSync(MEGA_CORPUS, "utf-8"));
      const entries: Array<{ id?: string; title?: string; body?: string; text?: string }> =
        Array.isArray(raw) ? raw : Object.values(raw);
      for (const entry of entries.slice(0, 500)) {
        const text = (entry.body ?? entry.text ?? "").toString().trim();
        const corpusId = entry.id ?? entry.title ?? "mega_corpus";
        if (text.length < 20) continue;
        const chunks = chunkText(text, "mega_corpus.json", corpusId);
        allChunks.push(...chunks.filter(c => !indexed_ids.has(c.chunk_id)));
      }
    } catch (_e) {
      // mega_corpus.json not yet available — skip silently
    }
  }

  const skipped = indexed_ids.size;
  if (allChunks.length > 0) {
    await upsertChunks(allChunks);
  }
  return { indexed: allChunks.length, skipped };
}

export async function searchCorpus(queryEmbedding: number[], topK = 5): Promise<CorpusChunk[]> {
  await ensureTable();
  const rows = await db.execute(sql`
    SELECT chunk_id, corpus_id, src, page, body, embedding
    FROM ftm_corpus
    ORDER BY indexed_at DESC
    LIMIT 2000
  `);

  const candidates = (rows.rows as any[]).map(r => ({
    chunk_id: r.chunk_id as string,
    corpus_id: r.corpus_id as string,
    src: r.src as string,
    page: r.page as number,
    body: r.body as string,
    embedding: typeof r.embedding === "string" ? JSON.parse(r.embedding) : (r.embedding as number[] | null),
  }));

  const scored = candidates
    .filter(c => Array.isArray(c.embedding))
    .map(c => ({ ...c, score: cosineSim(queryEmbedding, c.embedding!) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

export async function getCorpusCount(): Promise<number> {
  try {
    const r = await db.execute(sql`SELECT COUNT(*)::int as n FROM ftm_corpus`);
    return Number((r.rows as any[])[0]?.n ?? 0);
  } catch { return 0; }
}
