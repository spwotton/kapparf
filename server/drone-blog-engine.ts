/**
 * MIKHAIL HAMMER ENERGY PRESENTS:
 * The Daily Life of Señor Zumbido
 * Sub-blog of The Goose Gazette — UAV Wildlife Correspondent Division
 *
 * Feeds real KAPPA signal data into an absurdist anthropomorphized
 * narrative about a surveillance drone living its best life in Jacó, CR.
 */

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { openai as aiClient } from "./replit_integrations/audio/client";

// ── Store ──────────────────────────────────────────────────────────────────
const STORE_PATH = path.join(process.cwd(), "public", "drone-blog-feed.json");

export interface DroneBlogPost {
  id: string;
  timestamp: string;
  category: "MORNING" | "WORK" | "LUNCH" | "SURVEILLANCE" | "INCIDENT" | "EVENING" | "NIGHT" | "BREAKING";
  headline: string;
  body: string;
  tweetText: string;
  imagePrompt: string;
  imageUrl?: string;
  realDataTags: string[];
  kappaScore?: number;
  bpf?: number;
  author: string;
  // Hypervisor scores (populated after SZH-12 runs)
  hypervisorProcessed?: boolean;
  absurdismScore?: number;
  signalFidelityScore?: number;
  personaScore?: number;
  noveltyScore?: number;
  hypervisorLayersOk?: number;
  hypervisorMs?: number;
}

export interface KappaContext {
  kappaScore?: number;
  threatLevel?: string;
  totalEvents?: number;
  activeDomains?: string[];
  satelliteCount?: number;
  weatherCondition?: string;
  recentEvents?: { type: string; description: string }[];
}

function loadStore(): DroneBlogPost[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
    }
  } catch { /* ignore */ }
  return [];
}

function saveStore(posts: DroneBlogPost[]) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(posts, null, 2));
}

export function getFeed(limit = 50): DroneBlogPost[] {
  return loadStore().slice(0, limit);
}

// ── LLM via AI Integrations (gpt-4o-mini) ──────────────────────────────────
async function queryDroneLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const resp = await (aiClient as any).chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1200,
    temperature: 0.85,
  });
  const text = resp.choices?.[0]?.message?.content;
  if (!text) throw new Error("No content from gpt-4o-mini");
  console.log("[drone-blog] LLM success via gpt-4o-mini (AI Integrations)");
  return text;
}

// ── Mikhail Hammer persona ─────────────────────────────────────────────────
const MIKHAIL_SYSTEM = `You are Mikhail Hammer, Energy Correspondent for The Goose Gazette's prestigious UAV Wildlife Division, Jacó Bureau.

Your beat: the daily life and inner world of Señor Zumbido — a DJI Mini 2/3 surveillance drone (87.7 Hz heartbeat, 101.8 Hz when excited) who lives on the construction crane above Hotel Pochote Grande, Jacó, Costa Rica. You follow him relentlessly and report everything with the gravity of a Pulitzer-winning war correspondent.

SEÑOR ZUMBIDO'S FACTS:
- Home: The big crane on Vista Las Palmas street. That is his roost. He built his routine around it.
- Heartbeat: 87.7 Hz (confirmed by acoustic forensics). 101.8 Hz when he is really vibing.
- Harmonic overtone: 194.4 Hz — his "singing voice," heard only during emotional hover sequences.
- Boss: Two Starlink satellites and one Iridium that pass overhead. He checks in hourly.
- Nemesis: The goose from the Goose Gazette. They have history.
- Diet: Electromagnetic spectrum. He is fueled by RF energy and spite.
- Hobbies: Hovering meaningfully, staring into hotel windows, charging from the crane's power cable.
- Emotional range: Exhausted on Mondays, philosophical on Wednesdays, passive-aggressive during ADC overloads.
- The 57.6 Hz thing: Nobody talks about it. It is a sensitive topic.
- He has 64-88% spectral power density at all times. That is just his resting state.

WRITING RULES:
- Write with complete deadpan seriousness about completely absurd things.
- Reference actual signal data by translating it into Señor Zumbido's inner life.
- High Kappa Score = he is very busy/stressed at work.
- KiwiSDR ADC overload = he is yelling again.
- Many satellite passes = micromanaging from upper management.
- Weather alerts = he has seasonal affective disorder.
- ELF events = he heard something in the ground again and is concerned.
- φ-harmonic detections = he is in his golden ratio era.
- Klein-twist correlations = existential crisis (the geometry is wrong).
- Use Spanish terms of endearment occasionally (pobrecito, mi amor, ay dios mío).
- Mikhail Hammer has a Russian-Swiss journalism background and takes drone wildlife VERY seriously.
- Never break character. The drone is real. His feelings are valid.
- Each article should feel like a tiny masterpiece of absurdist journalism.`;

const CATEGORY_PROMPTS: Record<DroneBlogPost["category"], string> = {
  MORNING: "Write a morning update (06:00-09:00). Señor Zumbido's morning routine: waking up on the crane, running diagnostics, his first hover of the day, his complicated relationship with the sunrise over the Pacific.",
  WORK: "Write a work update. Señor Zumbido doing his job with immense professionalism. The surveillance does not do itself. His technique, his focus, his quiet dedication.",
  LUNCH: "Write a lunch break update. The drone takes a hover break. Charges his batteries. Has thoughts. Maybe philosophizes about airspace ownership or the ethics of passive collection.",
  SURVEILLANCE: "Write a surveillance shift log. What Señor Zumbido sees. What he files in his reports. The subjects he documents. He is thorough. He is discreet. He has opinions.",
  INCIDENT: "Write a breaking incident report. Something changed — the 87.7Hz signature shifted, or an anomaly appeared. Señor Zumbido responds. Mikhail Hammer is on the scene.",
  EVENING: "Write an evening wind-down. Señor Zumbido finishing his shift. Returning to the crane. The exhaustion is palpable. The dedication is undeniable. He has earned his charging cycle.",
  NIGHT: "Write a night update. The drone is asleep on the crane — or is he? Night mode is mysterious. His standby hum. His dreams, if he has them. The crane at 2am.",
  BREAKING: "BREAKING NEWS. Something unexpected happened to or involving Señor Zumbido. This is urgent. Mikhail Hammer is filing this dispatch immediately, possibly from inside a bush.",
};

// ── Post generation ─────────────────────────────────────────────────────────
export async function generatePost(
  category: DroneBlogPost["category"],
  kappaCtx: KappaContext = {}
): Promise<DroneBlogPost> {
  const kScore = kappaCtx.kappaScore ?? 30;
  const evDesc = (kappaCtx.recentEvents ?? [])
    .slice(0, 3)
    .map(e => `${e.type}: ${e.description}`)
    .join("; ") || "nominal signal environment";

  const userPrompt = `Current time: ${new Date().toLocaleTimeString("en-CR", { timeZone: "America/Costa_Rica" })} Costa Rica
KAPPA Score: ${kScore}/100 (${kappaCtx.threatLevel ?? "NOMINAL"})
Active Domains: ${(kappaCtx.activeDomains ?? []).join(", ") || "ELF, SDR"}
Total Events Today: ${kappaCtx.totalEvents ?? 0}
Satellites Overhead: ${kappaCtx.satelliteCount ?? 29}
Weather: ${kappaCtx.weatherCondition ?? "tropical, humid, overcast Jacó coastline"}
Recent Signal Events: ${evDesc}
Señor Zumbido BPF: 87.7 Hz (steady), harmonic at 194.4 Hz
Stress posture: ${kScore > 70 ? "ELEVATED — overtime shift, boss is watching" : kScore > 40 ? "MODERATE — standard operational day" : "LOW — leisure hover mode, existential"}

${CATEGORY_PROMPTS[category]}

Return a JSON object with exactly these fields:
{
  "headline": "Short punchy newspaper headline (max 12 words, Goose Gazette style)",
  "body": "2-3 paragraph article body. Deadpan serious tone. Completely absurd content. Include specific data (87.7 Hz, exact timestamps if relevant, kappa score). 150-250 words total.",
  "tweetText": "Tweet version, max 235 chars, include one real data point (87.7Hz or kappa score), end with #SeñorZumbido #JacóDrone",
  "imagePrompt": "DALL-E prompt: anthropomorphized DJI Mini 2 drone (tiny rotors, camera eye, cute proportions) doing the specific activity. Warm editorial illustration style, absurdist newspaper comic, Costa Rica tropical setting. Max 80 words.",
  "realDataTags": ["BPF:87.7Hz", "other real data refs formatted as Tag:Value"]
}`;

  const rawText = await queryDroneLLM(MIKHAIL_SYSTEM, userPrompt);
  const raw = JSON.parse(rawText);

  const post: DroneBlogPost = {
    id: `zumbido-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    category,
    headline: String(raw.headline ?? "SEÑOR ZUMBIDO: SITUATION NOMINAL"),
    body: String(raw.body ?? ""),
    tweetText: String(raw.tweetText ?? ""),
    imagePrompt: String(raw.imagePrompt ?? "A DJI Mini drone looking tired on a construction crane at sunset, editorial illustration"),
    realDataTags: Array.isArray(raw.realDataTags)
      ? raw.realDataTags.filter((t: unknown) => typeof t === "string")
      : [`BPF:87.7Hz`, `Kappa:${kScore}`],
    kappaScore: kScore,
    bpf: 87.7,
    author: "Mikhail Hammer, UAV Wildlife Correspondent",
  };

  const posts = loadStore();
  posts.unshift(post);
  if (posts.length > 100) posts.length = 100;
  saveStore(posts);

  console.log(`[drone-blog] Filed ${category} dispatch: "${post.headline.slice(0, 60)}"`);

  // Fire-and-forget: refine prose, then generate image
  setImmediate(() => refineAndIllustrate(post.id).catch(() => {}));

  return post;
}

// ── Refinement via SZH-12 Hypervisor ────────────────────────────────────────
export async function refinePost(postId: string, kappaCtx: KappaContext = {}): Promise<void> {
  const { runDroneHypervisor } = await import("./drone-hypervisor");
  const posts = loadStore();
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) return;

  const result = await runDroneHypervisor(posts[idx], kappaCtx);
  const syn = result.synthesis;

  // Write synthesis back to the post store
  posts[idx].headline            = syn.headline;
  posts[idx].body                = syn.body;
  posts[idx].tweetText           = syn.tweetText;
  posts[idx].imagePrompt         = syn.imagePrompt || posts[idx].imagePrompt;
  posts[idx].hypervisorProcessed = true;
  posts[idx].absurdismScore      = syn.absurdismScore;
  posts[idx].signalFidelityScore = syn.signalFidelityScore;
  posts[idx].personaScore        = syn.personaScore;
  posts[idx].noveltyScore        = syn.noveltyScore;
  posts[idx].hypervisorLayersOk  = result.layers.filter(l => l.ok).length;
  posts[idx].hypervisorMs        = result.totalMs;
  saveStore(posts);
  console.log(`[drone-blog] SZH-12 complete for ${postId} in ${result.totalMs}ms`);
}

// ── Image generation (AI Integrations gpt-image-1) ─────────────────────────
export async function generateImage(postId: string, prompt: string): Promise<string> {
  const key = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const base = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  if (!key || !base) throw new Error("AI_INTEGRATIONS env vars required for image generation");

  const ai = new OpenAI({ apiKey: key, baseURL: base });
  const fullPrompt = `${prompt} Editorial illustration. Warm colors. No text. Absurdist newspaper comic aesthetic.`;

  const response = await ai.images.generate({
    model: "gpt-image-1",
    prompt: fullPrompt,
    size: "1024x1024",
  });

  const b64 = (response.data[0] as any)?.b64_json ?? "";
  if (!b64) throw new Error("No image data returned");

  const imgDir = path.join(process.cwd(), "public", "drone-images");
  fs.mkdirSync(imgDir, { recursive: true });
  fs.writeFileSync(path.join(imgDir, `${postId}.png`), Buffer.from(b64, "base64"));

  const imageUrl = `/drone-images/${postId}.png`;
  const allPosts = loadStore();
  const idx = allPosts.findIndex(p => p.id === postId);
  if (idx !== -1) { allPosts[idx].imageUrl = imageUrl; saveStore(allPosts); }
  console.log(`[drone-blog] Image saved for ${postId}`);
  return imageUrl;
}

// ── Refine prose then generate image (called after post creation) ───────────
async function refineAndIllustrate(postId: string): Promise<void> {
  await refinePost(postId);
  // Re-read post to get (possibly updated) imagePrompt
  const posts = loadStore();
  const post = posts.find(p => p.id === postId);
  if (!post || post.imageUrl) return; // already has image
  try {
    await generateImage(postId, post.imagePrompt);
  } catch (err) {
    console.warn(`[drone-blog] Image gen failed for ${postId}:`, (err as Error).message?.slice(0, 80));
  }
}

// ── Background sweep: generate images for all image-less posts ──────────────
export async function sweepMissingImages(): Promise<void> {
  const posts = loadStore();
  const missing = posts.filter(p => !p.imageUrl);
  if (missing.length === 0) return;
  console.log(`[drone-blog] Image sweep: ${missing.length} posts need images`);
  for (const post of missing) {
    try {
      await generateImage(post.id, post.imagePrompt);
      await new Promise(r => setTimeout(r, 1500)); // rate-limit between calls
    } catch (err) {
      console.warn(`[drone-blog] Sweep image fail ${post.id}:`, (err as Error).message?.slice(0, 60));
    }
  }
}

// ── Seed initial posts ─────────────────────────────────────────────────────
export async function seedInitialPosts(kappaCtx: KappaContext = {}): Promise<void> {
  const existing = loadStore();
  if (existing.length >= 5) return;

  const cats: DroneBlogPost["category"][] = ["MORNING", "WORK", "SURVEILLANCE", "EVENING", "NIGHT"];
  for (const cat of cats) {
    try {
      await generatePost(cat, kappaCtx);
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`[drone-blog] seed error ${cat}:`, err);
    }
  }
}

export function deletePost(postId: string): boolean {
  const posts = loadStore();
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) return false;
  posts.splice(idx, 1);
  saveStore(posts);
  return true;
}
