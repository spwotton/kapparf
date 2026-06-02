/**
 * IDENTITY PARSER — Extract and cluster identities from raw OSINT text
 * Features:
 * - Name/alias extraction with regex + heuristics
 * - E.164 phone prefix extraction
 * - Address and employer parsing
 * - PUA 64×64 grid coordinate assignment
 * - Genesis-pattern cluster detection (shared base name + varied suffix)
 * - Deduplication against existing identities via cosine similarity ≥ 0.92
 */

import { db } from "../../db";
import { sql } from "drizzle-orm";
import { embed, cosineSim } from "./ftmAi";
import { puaCoord, hammingDistance } from "./lfsr53";
import { GOS_CONSTANTS } from "./gosConstants";

export interface ParsedIdentity {
  name: string;
  aliases: string[];
  phones: string[];
  addresses: string[];
  employers: string[];
  pua_x: number;
  pua_y: number;
  confidence: number;
  source: string;
  cluster_id?: string;
  cluster_base?: string;
  embedding?: number[];
}

/** Sanitize raw ingest text — strip HTML/script tags and dangerous SQL fragments */
export function sanitizeIngestText(raw: string): string {
  // Remove HTML tags
  let clean = raw.replace(/<[^>]*>/g, " ");
  // Remove SQL comment starters and null bytes
  clean = clean.replace(/--|;|[\x00\r]/g, " ");
  // Collapse whitespace
  clean = clean.replace(/\s+/g, " ").trim();
  // Truncate
  return clean.slice(0, 100_000);
}

// Name patterns
const NAME_REGEX = /\b([A-Z][a-záéíóúñüÁÉÍÓÚÑÜ]+)\s+([A-Z][a-záéíóúñüÁÉÍÓÚÑÜ]+(?:\s+[A-Z][a-záéíóúñüÁÉÍÓÚÑÜ]+)?)\b/g;
// E.164 phone
const PHONE_REGEX = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\+\d{7,15}/g;
// Addresses
const ADDR_REGEX = /\d+\s+[A-Za-z\s]+(?:St|Ave|Blvd|Rd|Dr|Ln|Ct|Pl|Way|Hwy|Calle|Avenida|Urb|Barrio)[.,\s]*[A-Za-z\s]*/gi;
// Employers
const EMP_REGEX = /(?:works?\s+(?:at|for)|employed\s+(?:at|by)|position\s+at)\s+([A-Z][A-Za-z\s&.,]{2,50})/gi;

/** Suffix words that indicate a "Genesis cluster" variant */
const SUFFIX_WORDS = [
  "venezolana","chama","queso","pamela","uber","veneca","mora","reina","negra","blanca",
  "linda","bonita","rica","bella","chica","grande","pequena","vieja","nueva","primera",
];

/** Detect if two names share a phonetic base (Genesis cluster pattern) */
function extractBase(name: string): string {
  const lower = name.toLowerCase();
  for (const sw of SUFFIX_WORDS) {
    if (lower.includes(sw)) {
      return lower.replace(sw, "").replace(/\s+/g, " ").trim();
    }
  }
  // Use first 2 words as base
  return lower.split(/\s+/).slice(0, 2).join(" ");
}

function makeClusterId(base: string): string {
  let h = 0x811c9dc5;
  for (const c of base) { h ^= c.charCodeAt(0); h = (h * 0x01000193) >>> 0; }
  return "cluster-" + h.toString(16).padStart(8, "0");
}

export async function parseIdentities(rawText: string, source = "manual"): Promise<ParsedIdentity[]> {
  const clean = sanitizeIngestText(rawText);
  const results: ParsedIdentity[] = [];

  // Extract names
  const nameMatches = new Set<string>();
  let m: RegExpExecArray | null;
  const nameRe = new RegExp(NAME_REGEX.source, "g");
  while ((m = nameRe.exec(clean)) !== null) {
    const name = m[0].trim();
    if (name.split(" ").length >= 2 && name.length < 60) {
      nameMatches.add(name);
    }
  }

  // Extract phones
  const phones: string[] = [];
  const phoneRe = new RegExp(PHONE_REGEX.source, "g");
  while ((m = phoneRe.exec(clean)) !== null) {
    phones.push(m[0].trim());
  }

  // Extract addresses
  const addresses: string[] = [];
  const addrRe = new RegExp(ADDR_REGEX.source, "gi");
  while ((m = addrRe.exec(clean)) !== null) {
    const a = m[0].trim();
    if (a.length > 10) addresses.push(a);
  }

  // Extract employers
  const employers: string[] = [];
  const empRe = new RegExp(EMP_REGEX.source, "gi");
  while ((m = empRe.exec(clean)) !== null) {
    employers.push(m[1].trim());
  }

  // Build identity per unique name
  const baseMap = new Map<string, string[]>(); // base → [names]
  for (const name of nameMatches) {
    const base = extractBase(name);
    if (!baseMap.has(base)) baseMap.set(base, []);
    baseMap.get(base)!.push(name);
  }

  for (const [base, names] of baseMap) {
    const clusterId = names.length > 1 ? makeClusterId(base) : undefined;
    for (const name of names) {
      const parts = name.split(/\s+/);
      const coords = puaCoord(parts);
      const identity: ParsedIdentity = {
        name,
        aliases: names.filter(n => n !== name),
        phones: phones.slice(0, 5),
        addresses: addresses.slice(0, 3),
        employers: employers.slice(0, 3),
        pua_x: coords.x,
        pua_y: coords.y,
        confidence: 0.7,
        source,
        cluster_id: clusterId,
        cluster_base: clusterId ? base : undefined,
      };
      results.push(identity);
    }
  }

  // Deduplicate against existing identities in DB
  const unique: ParsedIdentity[] = [];
  for (const identity of results) {
    const identText = `${identity.name} ${identity.aliases.join(" ")}`;
    const emb = await embed(identText);
    identity.embedding = emb;

    const existing = await findSimilarIdentity(emb, identity.name);
    if (!existing) {
      unique.push(identity);
    }
  }

  return unique;
}

/** Find an existing identity with cosine similarity ≥ 0.92 or hamming distance ≤ 8 */
async function findSimilarIdentity(emb: number[], name: string): Promise<boolean> {
  try {
    const rows = await db.execute(sql`
      SELECT name, embedding FROM ftm_identities LIMIT 500
    `);
    for (const row of rows.rows as any[]) {
      const existingEmb: number[] | null = typeof row.embedding === "string"
        ? JSON.parse(row.embedding) : row.embedding;
      if (existingEmb && cosineSim(emb, existingEmb) >= 0.92) return true;
      if (row.name && hammingDistance(row.name.toLowerCase(), name.toLowerCase()) <= 8) return true;
    }
  } catch (_e) { /* table may not exist yet */ }
  return false;
}

export async function storeIdentity(identity: ParsedIdentity): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(sql`
    INSERT INTO ftm_identities (id, name, aliases, phones, addresses, jobs, confidence, source,
      cluster_id, cluster_base, pua_x, pua_y, embedding)
    VALUES (
      ${id}, ${identity.name},
      ${JSON.stringify(identity.aliases)},
      ${JSON.stringify(identity.phones)},
      ${JSON.stringify(identity.addresses)},
      ${JSON.stringify(identity.employers)},
      ${identity.confidence},
      ${identity.source},
      ${identity.cluster_id ?? null},
      ${identity.cluster_base ?? null},
      ${identity.pua_x},
      ${identity.pua_y},
      ${JSON.stringify(identity.embedding ?? [])}
    )
    ON CONFLICT DO NOTHING
  `);
  return id;
}
