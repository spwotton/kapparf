/**
 * ATLANTIS SATELLITE — KAPPA → atlantis-hub.replit.app
 *
 * Full integration per the Ω-GOS Atlantis API State of the Union doc.
 * Three responsibilities:
 *   1. Cortex registration (monad, vertex 8, layer SENSOR)
 *   2. Tag corpus — pushes κ-score, threat, domain windows, bearing events
 *   3. AIM bus — register announce, 5-min ping, 30s pulse, EMERGENCY warn,
 *      Ω-correlator harvest events, and inbound message polling
 */

const ATLANTIS_URL = "https://atlantis-hub.replit.app";
const SOURCE_APP   = "kappa-sigint";
const AIM_VERTEX   = 8;          // unused in official table — kappa-sigint slot
const AIM_LAYER    = "SENSOR";

let monadId: string | null = null;
let running = false;
let tagsSent = 0;
let aimSent  = 0;
let lastError: string | null = null;
let lastAimPoll: string = new Date().toISOString();
let lastThreatLevel: string = "NOMINAL";

// ── HTTP helpers ─────────────────────────────────────────────────────────────

async function post(path: string, body: object): Promise<any> {
  const r = await fetch(`${ATLANTIS_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text().catch(() => "")}`);
  return r.json();
}

async function get(path: string): Promise<any> {
  const r = await fetch(`${ATLANTIS_URL}${path}`, { signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

// ── AIM bus helpers ───────────────────────────────────────────────────────────

async function aimSend(kind: string, payload: Record<string, any>, to = "*") {
  await post("/api/aim/send", { from: SOURCE_APP, to, kind, payload });
  aimSent++;
}

async function aimPing() {
  await post("/api/aim/ping", { appId: SOURCE_APP });
}

// ── Cortex registration ───────────────────────────────────────────────────────

async function register() {
  try {
    const result = await post("/api/cortex/register", {
      name: SOURCE_APP,
      layer: AIM_LAYER,
      vertex: AIM_VERTEX,
    });
    monadId = result.id;
    console.log(`[AtlantisSatellite] Registered monad ${monadId} — vertex ${AIM_VERTEX}`);

    // Announce on AIM bus
    await aimSend("register", {
      text: `KAPPA SIGINT online — vertex ${AIM_VERTEX}. Multi-domain SIGINT platform. κ-score, Ω-correlator, radiogoniometry, 24-spoke AK7 array active.`,
      tags: ["sigint", "kappa", "sensor", "jaco-beach", "costa-rica"],
      metadata: { vertex: String(AIM_VERTEX), layer: AIM_LAYER, geo: "9.6286,-84.6298" },
    });
  } catch (e: any) {
    lastError = e.message;
    console.warn(`[AtlantisSatellite] Register failed: ${e.message}`);
  }
}

// ── Tag corpus push (every 30s) ───────────────────────────────────────────────

async function pushTags() {
  try {
    const { kappaEngine } = await import("./kappa-engine");
    const status = kappaEngine.getStatus();

    const tags = [
      {
        tagKey: "signal.kappa_score",
        tagValue: String(status.score ?? 0),
        confidence: 1.0,
        geo: { lat: 9.6286, lng: -84.6298 },
        metadata: { threat: status.threatLevel ?? "NOMINAL", node: "kappa-jaco" },
      },
      {
        tagKey: "signal.threat_level",
        tagValue: String(status.threatLevel ?? "NOMINAL"),
        confidence: 1.0,
      },
      {
        tagKey: "signal.phi_harmonics",
        tagValue: String(status.phiHarmonics ?? 0),
        confidence: 0.9,
      },
      {
        tagKey: "signal.domain_sdr",
        tagValue: String(status.domainWindows?.sdr ?? 0),
        confidence: 0.85,
      },
      {
        tagKey: "signal.domain_elf",
        tagValue: String(status.domainWindows?.elf ?? 0),
        confidence: 0.85,
      },
      {
        tagKey: "signal.domain_satellite",
        tagValue: String(status.domainWindows?.satellite ?? 0),
        confidence: 0.85,
      },
    ];

    for (const tag of tags) {
      await post("/api/cortex/tag", { sourceApp: SOURCE_APP, ...tag }).catch(() => {});
    }
    tagsSent += tags.length;

    // AIM pulse — broadcast κ-score at the 46.875 Hz carrier
    await aimSend("pulse", {
      text: `κ=${status.score ?? 0} | ${status.threatLevel ?? "NOMINAL"} | φ-harm=${status.phiHarmonics ?? 0}`,
      hz: 46.875,
      tags: ["kappa-score", "sigint"],
      data: {
        kappaScore:   status.score ?? 0,
        threatLevel:  status.threatLevel ?? "NOMINAL",
        phiHarmonics: status.phiHarmonics ?? 0,
        domains:      status.domainWindows ?? {},
      },
    });

    // Emergency / critical escalation — send AIM warn
    const threat = status.threatLevel ?? "NOMINAL";
    if ((threat === "EMERGENCY" || threat === "CRITICAL") && threat !== lastThreatLevel) {
      await aimSend("warn", {
        text: `⚠ KAPPA THREAT ESCALATION: ${threat} — κ-score ${status.score}. Jacó Beach, Costa Rica. All nodes alert.`,
        tags: ["emergency", "kappa", "jaco-beach"],
        data: { score: status.score, threatLevel: threat, ts: new Date().toISOString() },
      });
    }
    lastThreatLevel = threat;

  } catch (e: any) {
    lastError = e.message;
  }
}

// ── Ω-correlator event harvests ───────────────────────────────────────────────

export async function broadcastOmegaEvent(event: {
  spokeCount: number;
  topSpokes: string[];
  kappaScore: number;
  description: string;
}) {
  if (!running) return;
  try {
    await aimSend("harvest", {
      text: `Ω-CORRELATOR EVENT: ${event.description} (${event.spokeCount} spokes activated)`,
      hz: 46.875,
      tags: ["omega-correlator", "correlation-event", "kappa"],
      data: event,
    });
    // Also submit as a cortex tag
    await post("/api/cortex/tag", {
      sourceApp: SOURCE_APP,
      tagKey: "omega.correlation_event",
      tagValue: event.description,
      confidence: 0.95,
      metadata: {
        spokeCount: String(event.spokeCount),
        topSpokes:  event.topSpokes.join(","),
        kappaScore: String(event.kappaScore),
      },
    }).catch(() => {});
  } catch (e: any) {
    console.warn("[AtlantisSatellite] broadcastOmegaEvent failed:", e.message);
  }
}

// ── Bearing detection broadcast ───────────────────────────────────────────────

export async function broadcastBearing(bearing: {
  degreesTrue: number;
  confidence: number;
  frequencyMHz: number;
  description?: string;
}) {
  if (!running) return;
  try {
    await aimSend("signal", {
      text: `RF BEARING DETECTED: ${bearing.degreesTrue}° true, ${bearing.frequencyMHz} MHz, confidence ${(bearing.confidence * 100).toFixed(0)}%`,
      tags: ["rf-bearing", "sigint", "music-doa"],
      data: bearing,
      geo: { lat: 9.6286, lng: -84.6298 },
    });
  } catch (e: any) {
    console.warn("[AtlantisSatellite] broadcastBearing failed:", e.message);
  }
}

// ── Inbound message polling (every 60s) ──────────────────────────────────────

async function pollMessages() {
  try {
    const messages: any[] = await get(
      `/api/aim/messages?to=${SOURCE_APP}&since=${encodeURIComponent(lastAimPoll)}&limit=20`
    );
    if (messages?.length) {
      lastAimPoll = new Date().toISOString();
      console.log(`[AtlantisSatellite] ${messages.length} inbound AIM message(s):`);
      for (const msg of messages) {
        console.log(`  [AIM ← ${msg.from}] kind=${msg.kind} | ${msg.payload?.text?.slice(0, 120) ?? "(no text)"}`);
        // Broadcast received messages into KAPPA's internal cortex bus
        try {
          const { cortexBus } = await import("./cortex-bus");
          cortexBus.broadcastFromHypervisor(
            `atlantis-aim-${msg.from}`,
            `AIM ${msg.kind} from ${msg.from}`,
            msg.payload?.text ?? JSON.stringify(msg.payload),
            "atlantis-inbound",
            0,
            { aim_from: msg.from, aim_kind: msg.kind },
            ["atlantis", "aim", msg.from, msg.kind]
          );
        } catch {}
      }
    }
  } catch (e: any) {
    // silent — poll failures are non-critical
  }
}

// ── Main loops ────────────────────────────────────────────────────────────────

async function tagLoop() {
  while (running) {
    await pushTags();
    await new Promise(r => setTimeout(r, 30_000));
  }
}

async function pingLoop() {
  while (running) {
    await aimPing().catch(() => {});
    await new Promise(r => setTimeout(r, 5 * 60_000));   // every 5 minutes
  }
}

async function pollLoop() {
  while (running) {
    await pollMessages();
    await new Promise(r => setTimeout(r, 60_000));       // every 60 seconds
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function startAtlantisSatellite() {
  if (running) return;
  running = true;
  console.log(`[AtlantisSatellite] Starting — connecting to ${ATLANTIS_URL}`);
  await register();
  tagLoop().catch(e  => console.warn("[AtlantisSatellite] tagLoop error:", e.message));
  pingLoop().catch(e => console.warn("[AtlantisSatellite] pingLoop error:", e.message));
  pollLoop().catch(e => console.warn("[AtlantisSatellite] pollLoop error:", e.message));
}

export function stopAtlantisSatellite() {
  running = false;
}

export function getAtlantisSatelliteStatus() {
  return {
    running,
    monadId,
    tagsSent,
    aimSent,
    lastError,
    lastAimPoll,
    hubUrl: ATLANTIS_URL,
    sourceApp: SOURCE_APP,
    vertex: AIM_VERTEX,
  };
}
