/**
 * ATLANTIS SATELLITE — KAPPA → atlantis-hub.replit.app
 *
 * Registers KAPPA as a monad on the external Atlantis Hub and
 * continuously pushes live signal tags from the KAPPA engine.
 */

const ATLANTIS_URL = "https://atlantis-hub.replit.app";
const SOURCE_APP = "kappa-sigint";

let monadId: string | null = null;
let running = false;
let tagsSent = 0;
let lastError: string | null = null;

async function post(path: string, body: object): Promise<any> {
  const r = await fetch(`${ATLANTIS_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text().catch(() => "")}`);
  return r.json();
}

async function get(path: string): Promise<any> {
  const r = await fetch(`${ATLANTIS_URL}${path}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function register() {
  try {
    const result = await post("/api/cortex/register", {
      name: SOURCE_APP,
      layer: "SENSOR",
      vertex: 9,
    });
    monadId = result.id;
    console.log(`[AtlantisSatellite] Registered as monad ${monadId}`);
  } catch (e: any) {
    lastError = e.message;
    console.warn(`[AtlantisSatellite] Register failed: ${e.message}`);
  }
}

async function pushTags() {
  try {
    const { kappaEngine } = await import("./kappa-engine");
    const status = kappaEngine.getStatus();

    const tags: Array<{ tagKey: string; tagValue: string | number; confidence?: number; geo?: any; metadata?: any }> = [
      {
        tagKey: "signal.kappa_score",
        tagValue: status.score ?? 0,
        confidence: 1.0,
        geo: { lat: 9.6286, lng: -84.6298 },
        metadata: { threat: status.threatLevel, node: "kappa-sigint-jaco" },
      },
      {
        tagKey: "signal.threat_level",
        tagValue: status.threatLevel ?? "NOMINAL",
        confidence: 1.0,
      },
      {
        tagKey: "signal.phi_harmonics",
        tagValue: status.phiHarmonics ?? 0,
        confidence: 0.9,
      },
      {
        tagKey: "signal.domain_sdr",
        tagValue: status.domainWindows?.sdr ?? 0,
        confidence: 0.85,
      },
      {
        tagKey: "signal.domain_elf",
        tagValue: status.domainWindows?.elf ?? 0,
        confidence: 0.85,
      },
      {
        tagKey: "signal.domain_satellite",
        tagValue: status.domainWindows?.satellite ?? 0,
        confidence: 0.85,
      },
    ];

    for (const tag of tags) {
      await post("/api/cortex/tag", {
        sourceApp: SOURCE_APP,
        ...tag,
      }).catch(() => {});
    }

    tagsSent += tags.length;
  } catch (e: any) {
    lastError = e.message;
  }
}

async function loop() {
  while (running) {
    await pushTags();
    await new Promise(r => setTimeout(r, 30_000));
  }
}

export async function startAtlantisSatellite() {
  if (running) return;
  running = true;
  console.log(`[AtlantisSatellite] Starting — connecting to ${ATLANTIS_URL}`);
  await register();
  loop().catch(e => console.warn("[AtlantisSatellite] loop error:", e.message));
}

export function stopAtlantisSatellite() {
  running = false;
}

export function getAtlantisSatelliteStatus() {
  return {
    running,
    monadId,
    tagsSent,
    lastError,
    hubUrl: ATLANTIS_URL,
    sourceApp: SOURCE_APP,
  };
}
