import { chromium, type Browser, type Page } from "playwright-core";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { storage } from "./storage";
import { kappaEngine } from "./kappa-engine";
import { hypervisor } from "./hypervisor";
import { KAPPA_CONSTANTS } from "@shared/schema";

const K = KAPPA_CONSTANTS;

const CHROMIUM_PATH = "/nix/store/12iaw5ng4xvxxffm381lgxlh1ysh0bl4-playwright-browsers/chromium-1134/chrome-linux/chrome";
const CAPTURE_DIR = path.join(process.cwd(), "captures");
const KIWI_BASE = "http://ti0rc.proxy.kiwisdr.com:8073";

const CAPTURE_PROFILES: CaptureProfile[] = [
  {
    id: "vlf_military_20-30",
    label: "VLF Military 20-30 kHz",
    freqKHz: 25,
    mode: "CWN",
    zoom: 4,
    ext: "cw_decoder",
    description: "Military VLF band: NAA 24kHz, NLK 24.8kHz, NML 25.2kHz, NLM4 23.4kHz, TBB 26.7kHz",
    durationMs: 18000,
  },
  {
    id: "vlf_nav_37-42",
    label: "VLF Navigation 37-42 kHz",
    freqKHz: 40,
    mode: "CWN",
    zoom: 4,
    ext: "cw_decoder",
    description: "VLF nav/time: NAU 40.75kHz, JJY 40kHz, NRK 37.5kHz, Alpha 40.2kHz",
    durationMs: 18000,
  },
  {
    id: "vlf_utility_45-50",
    label: "VLF Utility 45-50 kHz",
    freqKHz: 47,
    mode: "CWN",
    zoom: 4,
    ext: "cw_decoder",
    description: "VLF utility: NSY Italy 45.9kHz, SXA Greece 49kHz, RTZ Russia 50kHz",
    durationMs: 18000,
  },
  {
    id: "lf_time_58-63",
    label: "LF Time Signals 58-63 kHz",
    freqKHz: 60,
    mode: "CWN",
    zoom: 4,
    ext: "timecode",
    description: "LF time signals: WWVB 60kHz, MSF 60kHz, JJY-60 60kHz, FUG 62.6kHz",
    durationMs: 18000,
  },
  {
    id: "lf_75_band",
    label: "LF 73-77 kHz",
    freqKHz: 75,
    mode: "CWN",
    zoom: 4,
    ext: "cw_decoder",
    description: "LF band: counter-beat 73.125kHz, CW beacons observed 75-76kHz",
    durationMs: 18000,
  },
  {
    id: "vlf_wide_10-30",
    label: "VLF Wide Survey 10-30 kHz",
    freqKHz: 20,
    mode: "USB",
    zoom: 2,
    ext: undefined,
    description: "Wide VLF survey: Alpha system, HWU France, full military VLF band",
    durationMs: 15000,
  },
  {
    id: "wideband_overview",
    label: "Wideband 0-30 MHz Overview",
    freqKHz: 15000,
    mode: "AM",
    zoom: 0,
    ext: undefined,
    description: "Full KiwiSDR bandwidth overview — look for anomalous broadband emissions, jammers, or unusual occupancy",
    durationMs: 12000,
  },
];

interface CaptureProfile {
  id: string;
  label: string;
  freqKHz: number;
  mode: string;
  zoom: number;
  ext?: string;
  description: string;
  durationMs: number;
}

interface CaptureResult {
  profileId: string;
  label: string;
  screenshotPath: string;
  timestamp: number;
  freqKHz: number;
  mode: string;
  success: boolean;
  error?: string;
}

interface VisionAnalysis {
  profileId: string;
  timestamp: number;
  stationsDetected: string[];
  signalDescriptions: string[];
  anomalies: string[];
  cwTextDecoded: string[];
  noiseFloorAssessment: string;
  propagationConditions: string;
  suspiciousFindings: string[];
  overallSummary: string;
  raw: string;
}

interface VisionState {
  running: boolean;
  lastCapture: number | null;
  captureCount: number;
  analysisCount: number;
  errors: number;
  timer: ReturnType<typeof setInterval> | null;
  lastAnalyses: VisionAnalysis[];
  browserReady: boolean;
  currentProfileIdx: number;
  contextMemory: ContextEntry[];
}

interface ContextEntry {
  timestamp: number;
  profileId: string;
  summary: string;
  stationsDetected: string[];
  anomalies: string[];
}

const MAX_CONTEXT_ENTRIES = 100;
const MAX_RECENT_ANALYSES = 20;

let visionState: VisionState = {
  running: false,
  lastCapture: null,
  captureCount: 0,
  analysisCount: 0,
  errors: 0,
  timer: null,
  lastAnalyses: [],
  browserReady: false,
  currentProfileIdx: 0,
  contextMemory: [],
};

function getOpenAIClient(): OpenAI | null {
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    return new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return null;
}

function ensureCaptureDir(): void {
  if (!fs.existsSync(CAPTURE_DIR)) {
    fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  }
  const files = fs.readdirSync(CAPTURE_DIR);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const f of files) {
    const fp = path.join(CAPTURE_DIR, f);
    try {
      const stat = fs.statSync(fp);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(fp);
      }
    } catch {}
  }
}

async function captureKiwiSDR(profile: CaptureProfile): Promise<CaptureResult> {
  const timestamp = Date.now();
  const filename = `kiwi_${profile.id}_${timestamp}.png`;
  const screenshotPath = path.join(CAPTURE_DIR, filename);

  let browser: Browser | null = null;

  try {
    ensureCaptureDir();

    browser = await chromium.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: "KAPPA-SIGINT-Vision/1.0",
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    let url = `${KIWI_BASE}/?f=${profile.freqKHz}/${profile.mode}&z=${profile.zoom}`;
    if (profile.ext) {
      url += `&ext=${profile.ext}`;
    }

    console.log(`[KiwiVision] Navigating to ${profile.label}: ${url}`);

    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {
      return page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    });

    await page.waitForTimeout(profile.durationMs);

    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      type: "png",
    });

    await browser.close();
    browser = null;

    visionState.captureCount++;
    visionState.lastCapture = timestamp;

    console.log(`[KiwiVision] Captured ${profile.label} → ${filename}`);

    return {
      profileId: profile.id,
      label: profile.label,
      screenshotPath,
      timestamp,
      freqKHz: profile.freqKHz,
      mode: profile.mode,
      success: true,
    };
  } catch (err) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[KiwiVision] Capture error (${profile.label}): ${msg}`);
    visionState.errors++;
    return {
      profileId: profile.id,
      label: profile.label,
      screenshotPath: "",
      timestamp,
      freqKHz: profile.freqKHz,
      mode: profile.mode,
      success: false,
      error: msg,
    };
  }
}

function buildContextSummary(): string {
  if (visionState.contextMemory.length === 0) return "No prior observations.";

  const recent = visionState.contextMemory.slice(-10);
  return recent.map(c => {
    const ago = Math.round((Date.now() - c.timestamp) / 60000);
    return `[${ago}m ago] ${c.profileId}: ${c.summary}${c.anomalies.length > 0 ? ` ANOMALIES: ${c.anomalies.join(", ")}` : ""}`;
  }).join("\n");
}

async function analyzeCapture(capture: CaptureResult): Promise<VisionAnalysis | null> {
  const client = getOpenAIClient();
  if (!client) {
    console.log("[KiwiVision] No AI client available — skipping analysis");
    return null;
  }

  if (!capture.success || !capture.screenshotPath || !fs.existsSync(capture.screenshotPath)) {
    return null;
  }

  try {
    const imageBuffer = fs.readFileSync(capture.screenshotPath);
    const base64Image = imageBuffer.toString("base64");

    const contextSummary = buildContextSummary();
    const profile = CAPTURE_PROFILES.find(p => p.id === capture.profileId);

    const systemPrompt = `You are KAPPA SIGINT Vision Analyst — an expert radio frequency signals intelligence analyst specializing in VLF/LF military, navigation, and time signal analysis.

You are analyzing a screenshot from a KiwiSDR (Software Defined Radio) web interface located at TI0RC Zapote, Costa Rica (9.936°N, 84.109°W).

Observer location: Tacacorí, Alajuela, CR (10.0513892°N, 84.2186578°W, ~1050m ASL).

CONTEXT: This is part of Project KAPPA — a 24/7 autonomous SIGINT correlation platform monitoring for:
- Surveillance infrastructure (FinSpy/Gamma Group, IMSI catchers)
- Hidden network activity (ghost WiFi nodes, TR-069 resets, fiber splice anomalies)  
- JW listening post activity near Los Rios
- Jaco Vacations property network surveillance
- Marconi/Eitel timing patterns in RF emissions
- Any unusual VLF/LF propagation indicating ionospheric manipulation

KNOWN VLF/LF STATIONS IN RANGE:
- NAU: US Navy Aguada, Puerto Rico, 40.75 kHz MSK
- NAA: US Navy Cutler, ME, 24.0 kHz
- NLK: US Navy Jim Creek, WA, 24.8 kHz  
- NML: US Navy LaMoure, ND, 25.2 kHz
- NLM4: Norwegian VLF, 23.4 kHz
- HWU: French Navy, 18.3/20.9 kHz
- TBB: Turkish Navy, 26.7 kHz
- NRK/TFK: Iceland, 37.5 kHz
- NSY: Italian Navy, 45.9 kHz
- WWVB: NIST time, 60 kHz
- JJY: Japan NICT, 40/60 kHz
- Alpha/RSDN-20: Russian nav, 11.9/12.6/14.9 kHz

KEY FREQUENCIES OF INTEREST:
- 46.875 Hz (PRF master clock) — look for harmonics at 18.75 kHz, etc.
- 13.125 Hz (delta-slip beat) — 60 Hz mains minus 46.875 Hz
- 73.125 Hz (counter-beat) — look for VLF presence at 73.125 kHz

PREVIOUS OBSERVATIONS:
${contextSummary}`;

    const userPrompt = `Analyze this KiwiSDR screenshot. Profile: "${capture.label}" (${profile?.description || ""}).
Frequency: ${capture.freqKHz} kHz, Mode: ${capture.mode}.

Examine carefully:
1. WATERFALL DISPLAY: What signals are visible? Note frequencies, signal strengths, and any unusual patterns.
2. CW/TIMECODE DECODER: If visible, read ALL decoded text. Note callsigns, WPM speeds, and any coded messages.
3. STATION LABELS: What station labels appear on the waterfall? (These are community-identified stations.)
4. SIGNAL QUALITY: Assess noise floor, propagation conditions, any interference or jamming.
5. ANOMALIES: Look for anything unusual — unexpected signals, broadband noise bursts, carrier artifacts, modulation patterns that don't match known stations.
6. TIMING PATTERNS: Any evidence of 46.875 Hz harmonics, prime-number spaced bursts, or Marconi/Eitel timing structures.

Respond in this exact JSON format (no markdown wrapping):
{
  "stationsDetected": ["list of station callsigns/names visible"],
  "signalDescriptions": ["detailed description of each visible signal"],
  "anomalies": ["any unusual findings"],
  "cwTextDecoded": ["any CW/morse text visible in the decoder"],
  "noiseFloorAssessment": "description of noise floor conditions",
  "propagationConditions": "assessment of current VLF/LF propagation",
  "suspiciousFindings": ["anything that could indicate surveillance, jamming, or unusual activity"],
  "overallSummary": "2-3 sentence summary of what this capture shows"
}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "";
    
    let parsed: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    const analysis: VisionAnalysis = {
      profileId: capture.profileId,
      timestamp: capture.timestamp,
      stationsDetected: parsed?.stationsDetected || [],
      signalDescriptions: parsed?.signalDescriptions || [],
      anomalies: parsed?.anomalies || [],
      cwTextDecoded: parsed?.cwTextDecoded || [],
      noiseFloorAssessment: parsed?.noiseFloorAssessment || "Unable to assess",
      propagationConditions: parsed?.propagationConditions || "Unknown",
      suspiciousFindings: parsed?.suspiciousFindings || [],
      overallSummary: parsed?.overallSummary || content.substring(0, 500),
      raw: content,
    };

    visionState.analysisCount++;
    visionState.lastAnalyses.push(analysis);
    while (visionState.lastAnalyses.length > MAX_RECENT_ANALYSES) {
      visionState.lastAnalyses.shift();
    }

    visionState.contextMemory.push({
      timestamp: capture.timestamp,
      profileId: capture.profileId,
      summary: analysis.overallSummary,
      stationsDetected: analysis.stationsDetected,
      anomalies: analysis.anomalies,
    });
    while (visionState.contextMemory.length > MAX_CONTEXT_ENTRIES) {
      visionState.contextMemory.shift();
    }

    if (analysis.anomalies.length > 0 || analysis.suspiciousFindings.length > 0) {
      const event = await storage.createSignalEvent({
        domain: "sdr",
        source: "kiwisdr-vision-ai",
        eventType: "vision-analysis",
        frequency: capture.freqKHz,
        confidence: 0.85,
        latitude: 9.936,
        longitude: -84.1088,
        metadata: {
          profileId: capture.profileId,
          label: capture.label,
          freqKHz: capture.freqKHz,
          mode: capture.mode,
          stationsDetected: analysis.stationsDetected,
          anomalies: analysis.anomalies,
          suspiciousFindings: analysis.suspiciousFindings,
          cwTextDecoded: analysis.cwTextDecoded,
          propagation: analysis.propagationConditions,
          noiseFloor: analysis.noiseFloorAssessment,
          summary: analysis.overallSummary,
          captureFile: path.basename(capture.screenshotPath),
        },
        raw: null,
      });

      kappaEngine.ingest(event);
      hypervisor.ingestEvent(event);
    }

    console.log(`[KiwiVision] Analysis complete (${capture.label}): ${analysis.stationsDetected.length} stations, ${analysis.anomalies.length} anomalies, ${analysis.suspiciousFindings.length} suspicious`);

    return analysis;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[KiwiVision] Analysis error: ${msg}`);
    visionState.errors++;
    return null;
  }
}

async function runVisionCycle(): Promise<void> {
  const profile = CAPTURE_PROFILES[visionState.currentProfileIdx % CAPTURE_PROFILES.length];
  visionState.currentProfileIdx++;

  console.log(`[KiwiVision] === Cycle ${visionState.captureCount + 1}: ${profile.label} ===`);

  const capture = await captureKiwiSDR(profile);
  if (capture.success) {
    await analyzeCapture(capture);
  }
}

export function startKiwiVision(intervalMs: number = 300_000): void {
  if (visionState.running) return;

  if (!fs.existsSync(CHROMIUM_PATH)) {
    console.log("[KiwiVision] Chromium not found — vision system disabled");
    return;
  }

  visionState.running = true;
  visionState.browserReady = true;

  setTimeout(() => {
    runVisionCycle().catch(err => {
      console.error("[KiwiVision] Cycle error:", err instanceof Error ? err.message : String(err));
    });
  }, 30_000);

  visionState.timer = setInterval(() => {
    runVisionCycle().catch(err => {
      console.error("[KiwiVision] Cycle error:", err instanceof Error ? err.message : String(err));
    });
  }, intervalMs);

  console.log(`[KAPPA] KiwiSDR Vision Hypervisor started: ${CAPTURE_PROFILES.length} profiles, ${intervalMs / 1000}s cycle, AI analysis enabled`);
}

export function stopKiwiVision(): void {
  if (visionState.timer) {
    clearInterval(visionState.timer);
    visionState.timer = null;
  }
  visionState.running = false;
}

export async function runVisionOnce(profileId?: string): Promise<VisionAnalysis | null> {
  const profile = profileId
    ? CAPTURE_PROFILES.find(p => p.id === profileId) || CAPTURE_PROFILES[0]
    : CAPTURE_PROFILES[visionState.currentProfileIdx % CAPTURE_PROFILES.length];

  visionState.currentProfileIdx++;
  const capture = await captureKiwiSDR(profile);
  if (!capture.success) return null;
  return analyzeCapture(capture);
}

export function getVisionStatus() {
  return {
    running: visionState.running,
    browserReady: visionState.browserReady,
    lastCapture: visionState.lastCapture,
    captureCount: visionState.captureCount,
    analysisCount: visionState.analysisCount,
    errors: visionState.errors,
    profileCount: CAPTURE_PROFILES.length,
    profiles: CAPTURE_PROFILES.map(p => ({ id: p.id, label: p.label, freqKHz: p.freqKHz, mode: p.mode })),
    currentProfileIdx: visionState.currentProfileIdx % CAPTURE_PROFILES.length,
    nextProfile: CAPTURE_PROFILES[visionState.currentProfileIdx % CAPTURE_PROFILES.length]?.label || "unknown",
    recentAnalyses: visionState.lastAnalyses.slice(-5).map(a => ({
      profileId: a.profileId,
      timestamp: a.timestamp,
      stationsDetected: a.stationsDetected,
      anomalies: a.anomalies,
      suspiciousFindings: a.suspiciousFindings,
      summary: a.overallSummary,
    })),
    contextMemorySize: visionState.contextMemory.length,
  };
}

export function getVisionAnalyses(): VisionAnalysis[] {
  return visionState.lastAnalyses;
}

export function getContextMemory(): ContextEntry[] {
  return visionState.contextMemory;
}
