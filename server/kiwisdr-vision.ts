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
    description: "VLF utility: NSY Italy 45.9kHz, 46.875kHz DDS harmonic target, SXA Greece 49kHz",
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
    description: "LF band: counter-beat 73.125kHz (46.875×1.5625), CW beacons 75-76kHz",
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
    id: "hf_blackjack_2200m",
    label: "BLACKJACK 137 kHz Band",
    freqKHz: 137,
    mode: "USB",
    zoom: 4,
    ext: undefined,
    description: "2200m band: DARPA BLACKJACK LEO constellation telemetry/C2 downlink window, LF beacons",
    durationMs: 15000,
  },
  {
    id: "hf_475_630m",
    label: "630m Band 472-479 kHz",
    freqKHz: 475,
    mode: "CWN",
    zoom: 5,
    ext: "cw_decoder",
    description: "630m band: WSPR beacons, experimental LF allocation, BLACKJACK secondary downlink candidates",
    durationMs: 15000,
  },
  {
    id: "hf_1800_160m",
    label: "160m Band 1.8-2.0 MHz",
    freqKHz: 1900,
    mode: "LSB",
    zoom: 4,
    ext: undefined,
    description: "160m amateur band: ground-wave propagation, night-time skip, covert NVIS operations",
    durationMs: 12000,
  },
  {
    id: "hf_3500_80m",
    label: "80m Band 3.5-4.0 MHz",
    freqKHz: 3750,
    mode: "LSB",
    zoom: 3,
    ext: undefined,
    description: "80m band: TI amateur activity, NVIS surveillance comms, 3I ATLAS ground coordination",
    durationMs: 12000,
  },
  {
    id: "hf_5_60m",
    label: "60m Band 5.3-5.4 MHz",
    freqKHz: 5350,
    mode: "USB",
    zoom: 5,
    ext: undefined,
    description: "60m channelized: government/military shared allocation, FEMA, disaster comms, covert nets",
    durationMs: 12000,
  },
  {
    id: "hf_7_40m",
    label: "40m Band 7.0-7.3 MHz",
    freqKHz: 7150,
    mode: "LSB",
    zoom: 3,
    ext: undefined,
    description: "40m band: international broadcast, TI0RC club activity, numbers stations, surveillance nets",
    durationMs: 12000,
  },
  {
    id: "hf_10_30m",
    label: "30m Band 10.1-10.15 MHz",
    freqKHz: 10125,
    mode: "CWN",
    zoom: 6,
    ext: "cw_decoder",
    description: "30m band: CW/digital only, WSPR propagation monitoring, SIGINT beacon detection",
    durationMs: 12000,
  },
  {
    id: "hf_14_20m",
    label: "20m Band 14.0-14.35 MHz",
    freqKHz: 14175,
    mode: "USB",
    zoom: 3,
    ext: undefined,
    description: "20m band: primary DX band, daytime propagation, OTHR backscatter, military STANAG",
    durationMs: 12000,
  },
  {
    id: "hf_starlink_gateway",
    label: "Starlink Gateway 10.7-12.7 GHz Harmonic",
    freqKHz: 10700,
    mode: "USB",
    zoom: 4,
    ext: undefined,
    description: "Ku-band subharmonic zone: Starlink gateway downlink harmonics, spurious emissions from VSAT terminals",
    durationMs: 12000,
  },
  {
    id: "hf_21_15m",
    label: "15m Band 21.0-21.45 MHz",
    freqKHz: 21200,
    mode: "USB",
    zoom: 3,
    ext: undefined,
    description: "15m band: solar-cycle dependent, OTHR Jindalee/DUGA patterns, tactical military",
    durationMs: 12000,
  },
  {
    id: "hf_28_10m",
    label: "10m Band 28.0-29.7 MHz",
    freqKHz: 28500,
    mode: "FM",
    zoom: 3,
    ext: undefined,
    description: "10m band: FM repeaters, sporadic-E propagation, local surveillance repeater detection",
    durationMs: 12000,
  },
  {
    id: "hf_cb_27",
    label: "CB/ISM 27 MHz Band",
    freqKHz: 27000,
    mode: "AM",
    zoom: 4,
    ext: undefined,
    description: "CB 27MHz: unlicensed comms, ISM interference, covert low-power surveillance transmitters",
    durationMs: 12000,
  },
  {
    id: "hf_numbers_station_survey",
    label: "Numbers Station Survey 4-8 MHz",
    freqKHz: 6000,
    mode: "USB",
    zoom: 1,
    ext: undefined,
    description: "Wide HF survey: HM01 Cuba, E10 Mossad, V02a/S06s Russian, Lincolnshire Poacher successors",
    durationMs: 15000,
  },
  {
    id: "hf_radio_impacto_915",
    label: "Radio Impacto 91.5 FM Harmonic",
    freqKHz: 9150,
    mode: "AM",
    zoom: 5,
    ext: undefined,
    description: "Radio Impacto 91.5MHz HF harmonic zone — documented local surveillance nexus, TR-069 correlation",
    durationMs: 12000,
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

async function handleKiwiLogin(page: Page): Promise<boolean> {
  try {
    const hasLoginGate = await page.evaluate(() => {
      const overlaySelectors = [
        '#id-kiwi-msg', '#id-login', '.w3-modal', '[id*="splash"]',
        '[id*="overlay"]', '[id*="welcome"]', '#id-kiwi-container-msg'
      ];
      for (const sel of overlaySelectors) {
        const el = document.querySelector(sel) as HTMLElement;
        if (el && el.offsetParent !== null && el.style.display !== 'none') {
          const text = el.innerText || '';
          if (text.includes('callsign') || text.includes('Enter your name') || 
              text.includes('to start') || text.includes('nickname')) {
            return true;
          }
        }
      }
      const body = document.body.innerText || "";
      const kiwiMain = document.getElementById('id-kiwi-body') || document.getElementById('id-main');
      if (!kiwiMain || kiwiMain.offsetHeight < 100) {
        if (body.includes("Enter your name") || body.includes("callsign") || body.includes("to start KiwiSDR")) {
          return true;
        }
      }
      return false;
    });

    if (!hasLoginGate) return false;

    console.log(`[KiwiVision] Login gate detected — entering callsign...`);

    const inputFilled = await page.evaluate(() => {
      const loginInputs = document.querySelectorAll('#id-kiwi-msg input, .w3-modal input, [id*="splash"] input, [id*="login"] input');
      for (const input of loginInputs) {
        const el = input as HTMLInputElement;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          el.value = "KAPPA-SIGINT";
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
      }
      const allInputs = document.querySelectorAll('input[type="text"], input:not([type])');
      for (const input of allInputs) {
        const el = input as HTMLInputElement;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && !el.closest('#id-control') && !el.closest('#id-top-bar')) {
          el.value = "KAPPA-SIGINT";
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
      }
      return false;
    });

    if (inputFilled) {
      await page.waitForTimeout(500);

      await page.evaluate(() => {
        const buttons = document.querySelectorAll("button, input[type=submit], input[type=button], a.button, .btn");
        for (const btn of buttons) {
          const text = (btn as HTMLElement).innerText?.toLowerCase() || "";
          const val = (btn as HTMLInputElement).value?.toLowerCase() || "";
          if (text.includes("start") || text.includes("go") || text.includes("enter") || 
              text.includes("ok") || text.includes("connect") || text.includes("listen") ||
              val.includes("start") || val.includes("go") || val.includes("enter")) {
            (btn as HTMLElement).click();
            return;
          }
        }
        const allButtons = document.querySelectorAll("button, input[type=submit]");
        if (allButtons.length > 0) {
          (allButtons[0] as HTMLElement).click();
        }
      });

      await page.waitForTimeout(500);
      await page.keyboard.press("Enter");

      console.log(`[KiwiVision] Callsign entered and submitted`);
      return true;
    }

    await page.keyboard.type("KAPPA-SIGINT", { delay: 50 });
    await page.waitForTimeout(300);
    await page.keyboard.press("Enter");
    console.log(`[KiwiVision] Fallback: typed callsign via keyboard`);
    return true;

  } catch (err) {
    console.log(`[KiwiVision] Login handler error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function dismissOverlays(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      const selectors = [
        '.w3-modal', '.modal', '[id*="overlay"]', '[id*="splash"]',
        '[class*="popup"]', '[class*="dialog"]', '[id*="login"]',
        '[class*="intro"]', '[id*="welcome"]'
      ];
      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        els.forEach(el => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style) htmlEl.style.display = "none";
        });
      }
      const overlays = document.querySelectorAll("div");
      for (const div of overlays) {
        const style = window.getComputedStyle(div);
        if (style.position === "fixed" && style.zIndex && parseInt(style.zIndex) > 100) {
          const rect = div.getBoundingClientRect();
          if (rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5) {
            (div as HTMLElement).style.display = "none";
          }
        }
      }
    });
  } catch {}
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
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 },
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    let url = `${KIWI_BASE}/?f=${profile.freqKHz}/${profile.mode}&z=${profile.zoom}`;
    if (profile.ext) {
      url += `&ext=${profile.ext}`;
    }

    console.log(`[KiwiVision] Navigating to ${profile.label}: ${url}`);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    console.log(`[KiwiVision] Page loaded, handling KiwiSDR login gate...`);

    await page.waitForTimeout(3000);

    const loginHandled = await handleKiwiLogin(page);
    if (loginHandled) {
      console.log(`[KiwiVision] Login gate dismissed, waiting for waterfall init...`);
      await page.waitForTimeout(5000);
    }

    let waterfallReady = false;
    let loginAlreadyHandled = loginHandled;
    for (let attempt = 0; attempt < 6; attempt++) {
      waterfallReady = await page.evaluate(() => {
        const wfCandidates = [
          document.getElementById("id-wf-canvas"),
          document.querySelector("canvas[id*=wf]"),
          document.querySelector("canvas[id*=waterfall]"),
        ].filter(Boolean) as HTMLCanvasElement[];
        
        for (const wfCanvas of wfCandidates) {
          if (wfCanvas.width > 200 && wfCanvas.height > 50) {
            try {
              const ctx = wfCanvas.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                const data = ctx.getImageData(0, 0, 100, 50).data;
                let colorPixels = 0;
                for (let i = 0; i < data.length; i += 4) {
                  if (data[i] > 10 || data[i+1] > 10 || data[i+2] > 10) colorPixels++;
                }
                if (colorPixels > 200) return true;
              }
            } catch {}
            return true;
          }
        }
        
        const anyCanvas = document.querySelectorAll("canvas");
        let largeCanvasCount = 0;
        for (const c of anyCanvas) {
          if (c.width > 300 && c.height > 100) {
            largeCanvasCount++;
            try {
              const ctx = c.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                const data = ctx.getImageData(0, 0, 100, 50).data;
                let colorPixels = 0;
                for (let i = 0; i < data.length; i += 16) {
                  if (data[i] > 10 || data[i+1] > 10 || data[i+2] > 10) colorPixels++;
                }
                if (colorPixels > 50) return true;
              }
            } catch { continue; }
          }
        }
        if (largeCanvasCount >= 2) return true;
        
        return false;
      }).catch(() => false);

      if (waterfallReady) {
        console.log(`[KiwiVision] Waterfall active on attempt ${attempt + 1}!`);
        break;
      }

      console.log(`[KiwiVision] Waterfall not ready (attempt ${attempt + 1}/6), waiting 5s...`);

      if (!loginAlreadyHandled) {
        const stillHasLogin = await handleKiwiLogin(page);
        if (stillHasLogin) {
          console.log(`[KiwiVision] Re-dismissed login overlay`);
          loginAlreadyHandled = true;
        }
      }

      await page.waitForTimeout(5000);
    }

    await page.evaluate(({ freqKHz, mode, zoom }) => {
      try {
        const w = window as any;
        if (typeof w.freq_set_kHz === 'function') {
          w.freq_set_kHz(freqKHz);
        } else if (typeof w.setfreq === 'function') {
          w.setfreq(freqKHz);
        }
        
        if (typeof w.demodulator_analog_replace === 'function') {
          w.demodulator_analog_replace(mode.toLowerCase());
        } else if (typeof w.set_mode === 'function') {
          w.set_mode(mode.toLowerCase());
        }
        
        if (typeof w.zoom_set === 'function') {
          w.zoom_set(zoom);
        } else if (typeof w.zoom_step === 'function') {
          w.zoom_step(zoom);
        }

        const freqInput = document.getElementById('id-freq-input') as HTMLInputElement;
        if (freqInput) {
          freqInput.value = String(freqKHz);
          freqInput.dispatchEvent(new Event('change', { bubbles: true }));
          freqInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        }
      } catch (e) {}
    }, { freqKHz: profile.freqKHz, mode: profile.mode, zoom: profile.zoom }).catch(() => {});

    console.log(`[KiwiVision] Tuned to ${profile.freqKHz} kHz / ${profile.mode} / zoom ${profile.zoom}`);

    await page.waitForTimeout(3000);

    if (waterfallReady) {
      console.log(`[KiwiVision] Collecting spectrogram for ${profile.durationMs}ms...`);
    } else {
      console.log(`[KiwiVision] Waterfall may not be fully active — capturing anyway after max wait`);
    }
    await page.waitForTimeout(profile.durationMs);

    await dismissOverlays(page);

    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      type: "png",
    });

    const pageInfo = await page.evaluate(() => {
      const canvases = document.querySelectorAll("canvas");
      const wsState = (window as any).kiwi_ws_state || "unknown";
      return {
        canvasCount: canvases.length,
        canvasSizes: Array.from(canvases).map(c => `${c.width}x${c.height}`),
        title: document.title,
        wsState,
        bodyClasses: document.body.className,
        visibleText: document.body.innerText?.substring(0, 200) || "",
      };
    }).catch(() => ({ canvasCount: 0, canvasSizes: [] as string[], title: "", wsState: "error", bodyClasses: "", visibleText: "" }));

    console.log(`[KiwiVision] Page state: ${pageInfo.canvasCount} canvases (${pageInfo.canvasSizes.join(", ")}), title="${pageInfo.title}", waterfall=${waterfallReady}`);

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

You are analyzing a screenshot from a KiwiSDR (Software Defined Radio) web interface located at TI0RC, RADIOCLUB COSTA RICA, San José (9.936°N, 84.109°W).

Observer location: Aparthotel Suites Cristina, Sabana Norte, San José, CR (9.9352°N, 84.1094°W) — ~100m from the TI0RC antenna/giant radio tower, 300m north of ICE building.

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
