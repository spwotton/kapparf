import { chromium, type Browser } from "playwright-core";
import * as fs from "fs";
import * as nodePath from "path";
import { storage } from "./storage";
import { kappaEngine } from "./kappa-engine";
import { hypervisor } from "./hypervisor";
import { KAPPA_CONSTANTS } from "@shared/schema";
import { runScanCycleOnce, getScannerStatus } from "./kiwisdr-scanner";
import { runHeartbeatOnce, getWatchdogStatus } from "./network-watchdog";
import { getNetworkThreatStatus } from "./network-threat-scanner";
import * as dns from "dns";
import * as http from "http";

const K = KAPPA_CONSTANTS;

const CHROMIUM_PATH = "/nix/store/12iaw5ng4xvxxffm381lgxlh1ysh0bl4-playwright-browsers/chromium-1134/chrome-linux/chrome";
const CAPTURE_BASE = nodePath.join(process.cwd(), "kiwisdr_screenshots");
const KIWI_BASE = "http://ti0rc.proxy.kiwisdr.com:8073";

const SYNC_PROFILES = [
  { id: "1234kHz", freqKHz: 1234, mode: "am", label: "TR-069 correlation 1234 kHz" },
  { id: "4687kHz", freqKHz: 4687, mode: "am", label: "46.875Hz harmonic x100" },
  { id: "7410kHz", freqKHz: 7410, mode: "am", label: "Pirate radio 7410 kHz" },
  { id: "6925kHz", freqKHz: 6925, mode: "am", label: "Pirate radio 6925 kHz" },
  { id: "3900kHz", freqKHz: 3900, mode: "lsb", label: "80m SSB" },
  { id: "7200kHz", freqKHz: 7200, mode: "lsb", label: "40m SSB" },
  { id: "14200kHz", freqKHz: 14200, mode: "usb", label: "20m SSB" },
  { id: "27025kHz", freqKHz: 27025, mode: "am", label: "CB Channel 6" },
  { id: "27185kHz", freqKHz: 27185, mode: "am", label: "CB Channel 19" },
];

export interface SyncCaptureResult {
  correlationId: string;
  epochMs: number;
  epochNs: string;
  isoTimestamp: string;
  durationMs: number;
  sensors: {
    kiwiScreenshot: KiwiScreenshotResult;
    kiwiSpectrum: KiwiSpectrumResult;
    networkLatency: NetworkLatencyResult;
    dnsProbe: DnsProbeResult;
    httpProbe: HttpProbeResult;
    threatStatus: ThreatStatusResult;
  };
  summary: string;
}

interface KiwiScreenshotResult {
  success: boolean;
  files: string[];
  errors: string[];
  durationMs: number;
}

interface KiwiSpectrumResult {
  success: boolean;
  detections: number;
  targetsScanned: number;
  durationMs: number;
}

interface NetworkLatencyResult {
  success: boolean;
  targets: { host: string; latencyMs: number | null; status: string }[];
  durationMs: number;
}

interface DnsProbeResult {
  success: boolean;
  lookups: { domain: string; resolvedIps: string[]; latencyMs: number }[];
  durationMs: number;
}

interface HttpProbeResult {
  success: boolean;
  probes: { url: string; statusCode: number | null; latencyMs: number; error?: string }[];
  durationMs: number;
}

interface ThreatStatusResult {
  packetsProcessed: number;
  threatsDetected: number;
  recentThreats: number;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function captureKiwiScreenshots(epochMs: number, ts: string): Promise<KiwiScreenshotResult> {
  const start = Date.now();
  const files: string[] = [];
  const errors: string[] = [];

  if (!fs.existsSync(CHROMIUM_PATH)) {
    return { success: false, files: [], errors: ["Chromium not found at " + CHROMIUM_PATH], durationMs: Date.now() - start };
  }

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: [
        "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
        "--no-first-run", "--no-zygote", "--single-process",
        "--disable-extensions", "--disable-background-timer-throttling",
      ],
    });

    const screenshotPromises = SYNC_PROFILES.map(async (profile) => {
      try {
        const context = await browser!.newContext({
          viewport: { width: 1904, height: 933 },
          userAgent: "Mozilla/5.0 (X11; Linux x86_64) KAPPA-SIGINT/4.20",
        });
        const page = await context.newPage();
        page.setDefaultTimeout(45000);

        const url = `${KIWI_BASE}/?f=${profile.freqKHz}/${profile.mode}&z=4`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

        await page.waitForTimeout(3000);

        await page.evaluate(() => {
          const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
          for (const input of inputs) {
            const el = input as HTMLInputElement;
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              el.value = "KAPPA-SIGINT";
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
          const buttons = document.querySelectorAll("button, input[type=submit]");
          for (const btn of buttons) {
            const text = (btn as HTMLElement).innerText?.toLowerCase() || "";
            if (text.includes("start") || text.includes("go") || text.includes("enter") || text.includes("ok")) {
              (btn as HTMLElement).click();
              return;
            }
          }
          if (buttons.length > 0) (buttons[0] as HTMLElement).click();
        });

        await page.waitForTimeout(8000);

        const filename = `${profile.freqKHz}kHz_${profile.mode}_${ts}.png`;
        const filepath = nodePath.join(CAPTURE_BASE, filename);
        await page.screenshot({ path: filepath, fullPage: false, type: "png" });
        files.push(filename);

        await context.close();
      } catch (err) {
        errors.push(`${profile.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    await Promise.all(screenshotPromises);
    await browser.close();
    browser = null;
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    errors.push(`browser: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { success: files.length > 0, files, errors, durationMs: Date.now() - start };
}

async function runSpectrumScan(): Promise<KiwiSpectrumResult> {
  const start = Date.now();
  try {
    await runScanCycleOnce();
    const status = getScannerStatus();
    return {
      success: true,
      detections: status.detections,
      targetsScanned: status.activeTargets.length,
      durationMs: Date.now() - start,
    };
  } catch {
    return { success: false, detections: 0, targetsScanned: 0, durationMs: Date.now() - start };
  }
}

async function runNetworkLatency(): Promise<NetworkLatencyResult> {
  const start = Date.now();
  const targets = [
    { host: "8.8.8.8", name: "Google DNS" },
    { host: "1.1.1.1", name: "Cloudflare DNS" },
    { host: "208.67.222.222", name: "OpenDNS" },
    { host: "ti0rc.proxy.kiwisdr.com", name: "TI0RC KiwiSDR" },
  ];

  try {
    await runHeartbeatOnce();
    const wdStatus = getWatchdogStatus();

    const results = targets.map((t) => ({
      host: t.host,
      latencyMs: wdStatus.latencyHistory.length > 0 ? wdStatus.latencyHistory[wdStatus.latencyHistory.length - 1] : null,
      status: wdStatus.networkActive ? "up" : "down",
    }));

    return { success: true, targets: results, durationMs: Date.now() - start };
  } catch {
    return { success: false, targets: [], durationMs: Date.now() - start };
  }
}

async function runDnsProbe(): Promise<DnsProbeResult> {
  const start = Date.now();
  const domains = [
    "ti0rc.proxy.kiwisdr.com",
    "kolbi.cr",
    "ice.go.cr",
    "sutel.go.cr",
    "kiwisdr.puntarenas.cr",
  ];

  const lookups = await Promise.all(domains.map(async (domain) => {
    const lookupStart = Date.now();
    try {
      const ips = await new Promise<string[]>((resolve, reject) => {
        dns.resolve4(domain, (err, addresses) => {
          if (err) reject(err);
          else resolve(addresses);
        });
      });
      return { domain, resolvedIps: ips, latencyMs: Date.now() - lookupStart };
    } catch {
      return { domain, resolvedIps: [], latencyMs: Date.now() - lookupStart };
    }
  }));

  return { success: true, lookups, durationMs: Date.now() - start };
}

async function runHttpProbe(): Promise<HttpProbeResult> {
  const start = Date.now();
  const urls = [
    `${KIWI_BASE}/status`,
    "http://kiwisdr.puntarenas.cr:8073/status",
    "http://pj4g.proxy.kiwisdr.com:8073/status",
  ];

  const probes = await Promise.all(urls.map(async (url) => {
    const probeStart = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "KAPPA-SIGINT/4.20" },
      });
      clearTimeout(timeout);
      return { url, statusCode: resp.status, latencyMs: Date.now() - probeStart };
    } catch (err) {
      return { url, statusCode: null, latencyMs: Date.now() - probeStart, error: err instanceof Error ? err.message : String(err) };
    }
  }));

  return { success: true, probes, durationMs: Date.now() - start };
}

function grabThreatStatus(): ThreatStatusResult {
  const ts = getNetworkThreatStatus();
  return {
    packetsProcessed: ts.packetsProcessed,
    threatsDetected: ts.threatsDetected,
    recentThreats: ts.recentThreats?.length || 0,
  };
}

let captureCount = 0;
let lastCapture: SyncCaptureResult | null = null;
const captureHistory: SyncCaptureResult[] = [];
const MAX_HISTORY = 50;

export async function runSyncCapture(): Promise<SyncCaptureResult> {
  const epochMs = Date.now();
  const epochNs = String(process.hrtime.bigint());
  const isoTimestamp = new Date(epochMs).toISOString();
  const ts = formatTimestamp(new Date(epochMs));
  const correlationId = `SYNC-${ts}-${captureCount++}`;

  ensureDir(CAPTURE_BASE);

  console.log(`[SYNC-CAPTURE] ═══════════════════════════════════════════════════`);
  console.log(`[SYNC-CAPTURE] FIRING ALL SENSORS — ${correlationId}`);
  console.log(`[SYNC-CAPTURE] Epoch: ${epochMs}ms | ${epochNs}ns | ${isoTimestamp}`);
  console.log(`[SYNC-CAPTURE] ═══════════════════════════════════════════════════`);

  const fireTime = Date.now();

  const [kiwiScreenshot, kiwiSpectrum, networkLatency, dnsProbe, httpProbe] = await Promise.all([
    captureKiwiScreenshots(epochMs, ts),
    runSpectrumScan(),
    runNetworkLatency(),
    runDnsProbe(),
    runHttpProbe(),
  ]);

  const threatStatus = grabThreatStatus();

  const durationMs = Date.now() - fireTime;

  const result: SyncCaptureResult = {
    correlationId,
    epochMs,
    epochNs,
    isoTimestamp,
    durationMs,
    sensors: {
      kiwiScreenshot,
      kiwiSpectrum,
      networkLatency,
      dnsProbe,
      httpProbe,
      threatStatus,
    },
    summary: [
      `${correlationId} @ ${isoTimestamp}`,
      `Screenshots: ${kiwiScreenshot.files.length}/${SYNC_PROFILES.length} (${kiwiScreenshot.durationMs}ms)`,
      `Spectrum: ${kiwiSpectrum.detections} detections across ${kiwiSpectrum.targetsScanned} targets (${kiwiSpectrum.durationMs}ms)`,
      `Network: ${networkLatency.targets.length} hosts probed (${networkLatency.durationMs}ms)`,
      `DNS: ${dnsProbe.lookups.length} lookups (${dnsProbe.durationMs}ms)`,
      `HTTP: ${httpProbe.probes.length} probes (${httpProbe.durationMs}ms)`,
      `Threats: ${threatStatus.threatsDetected} detected, ${threatStatus.recentThreats} recent`,
      `Total duration: ${durationMs}ms`,
    ].join(" | "),
  };

  const scanResultsFile = nodePath.join(CAPTURE_BASE, `SCAN_RESULTS_${ts}.json`);
  fs.writeFileSync(scanResultsFile, JSON.stringify({
    correlationId,
    timestamp: isoTimestamp,
    epochMs,
    epochNs,
    target: "TI0RC 180W HF — Synchronized Multi-Sensor Capture",
    frequencies_scanned: SYNC_PROFILES.length,
    results: SYNC_PROFILES.map(p => ({
      frequency: p.freqKHz,
      mode: p.mode,
      note: p.label,
      screenshot: `kiwisdr_screenshots/${p.freqKHz}kHz_${p.mode}_${ts}.png`,
      signal: "N/A",
      timestamp: isoTimestamp,
    })),
    sensors: result.sensors,
  }, null, 2));

  const event = await storage.createSignalEvent({
    domain: "multi-sensor",
    source: "sync-capture",
    eventType: "synchronized-capture",
    frequency: 0,
    confidence: 1.0,
    latitude: 9.9352,
    longitude: -84.1094,
    metadata: {
      correlationId,
      epochMs,
      epochNs,
      screenshotCount: kiwiScreenshot.files.length,
      spectrumDetections: kiwiSpectrum.detections,
      dnsLookups: dnsProbe.lookups.length,
      httpProbes: httpProbe.probes.length,
      durationMs,
      description: `Synchronized multi-sensor capture: ${kiwiScreenshot.files.length} screenshots, ${kiwiSpectrum.detections} RF detections, ${dnsProbe.lookups.length} DNS, ${httpProbe.probes.length} HTTP — all fired at ${epochNs}ns`,
    },
    raw: null,
  });

  kappaEngine.ingest(event);
  hypervisor.ingestEvent(event);

  lastCapture = result;
  captureHistory.push(result);
  while (captureHistory.length > MAX_HISTORY) captureHistory.shift();

  console.log(`[SYNC-CAPTURE] COMPLETE — ${result.summary}`);

  return result;
}

export function getSyncCaptureStatus() {
  return {
    captureCount,
    lastCapture: lastCapture ? {
      correlationId: lastCapture.correlationId,
      epochMs: lastCapture.epochMs,
      isoTimestamp: lastCapture.isoTimestamp,
      durationMs: lastCapture.durationMs,
      summary: lastCapture.summary,
    } : null,
    historyCount: captureHistory.length,
    profileCount: SYNC_PROFILES.length,
    profiles: SYNC_PROFILES,
  };
}

export function getSyncCaptureHistory(): SyncCaptureResult[] {
  return captureHistory;
}

export function getScreenshotFiles(): { filename: string; sizeBytes: number; modifiedAt: number }[] {
  if (!fs.existsSync(CAPTURE_BASE)) return [];
  return fs.readdirSync(CAPTURE_BASE)
    .filter(f => f.endsWith(".png"))
    .map(f => {
      const stat = fs.statSync(nodePath.join(CAPTURE_BASE, f));
      return { filename: f, sizeBytes: stat.size, modifiedAt: stat.mtimeMs };
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt);
}

export function getScanResultFiles(): { filename: string; data: any }[] {
  if (!fs.existsSync(CAPTURE_BASE)) return [];
  return fs.readdirSync(CAPTURE_BASE)
    .filter(f => f.startsWith("SCAN_RESULTS_") && f.endsWith(".json"))
    .map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(nodePath.join(CAPTURE_BASE, f), "utf-8"));
        return { filename: f, data };
      } catch {
        return { filename: f, data: null };
      }
    })
    .filter(f => f.data !== null)
    .sort((a, b) => (b.data.timestamp || "").localeCompare(a.data.timestamp || ""));
}
