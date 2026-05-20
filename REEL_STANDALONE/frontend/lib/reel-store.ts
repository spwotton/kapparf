// Persistence layer for Ω-REEL sessions in IndexedDB. Mirrors the pattern
// used by feed-store.ts so the React layer can resume an in-flight reel
// across page refreshes and browse a small gallery of finished reels.

const DB_NAME = "omega-gram-reel";
const DB_VERSION = 1;
const SESSION_STORE = "sessions";
const MAX_STORED_REELS = 12;

export type ReelBeat = {
  index: number;
  spoke: number;
  visualPrompt: string;
  psiTarget: number;
  A: number;
  N: number;
  sigma: number;
  gamma: number;
  phi: number;
  // Optional per-beat duration override (seconds). Set on transitional beats
  // synthesised by /reel/repair so they render at 1-2s instead of the
  // session-wide default duration.
  durationSeconds?: number;
  // Sonata form section — set when the outline was generated in sonataMode.
  sonataSection?: "exposition" | "development" | "recapitulation";
  // Editorial state for auto-inserted bridge beats. `pending` beats render
  // with accept/reject/regenerate controls in the outline UI; `accepted`
  // beats are committed (controls hidden) but still flagged so we know the
  // beat originated from an auto-repair pass. Absent for hand-authored beats.
  bridge?: {
    status: "pending" | "accepted";
    leftSpoke: number;
    rightSpoke: number;
    leftPrompt: string;
    rightPrompt: string;
    pairKappa?: number;
  };
};

export type ReelClip = {
  beatIndex: number;
  video?: string;       // base64 mp4 of the per-beat clip
  videoMimeType?: string;
  // Server-side clip cache ID returned by /reel/clip. When present,
  // /reel/stitch reads the clip from disk by this ID instead of
  // accepting the raw base64 in the request body (avoids 413 on long reels).
  clipId?: string;
  terminalFrame?: string; // base64 PNG, used as seed for next beat
  psiScore?: { A: number; N: number; psi: number };
  continuity?: {
    dominantElements?: string[];
    continuityScore?: number;
    bridgeSuggestion?: string;
  } | null;
  promptUsed?: string;
  durationSeconds?: number;
  // When the beat first appears in the stitched timeline (seconds from t=0).
  // Set by /reel/stitch so narration / playhead overlays can snap to actual
  // visual beat boundaries instead of a naive cumulative-sum estimate that
  // ignores xfade and bridge overlap.
  onsetSeconds?: number;
  status: "pending" | "running" | "done" | "error";
  error?: string;
};

export type ReelCoherence = {
  kappa: number;
  kappaHall: number;
  kappaMax: number;
  eta: number;
  observerPresence: number;
  bridges: Array<{ from: number; to: number; kappa: number }>;
};

export type ReelNarration = {
  beatIndex: number;       // spoke index this narration is anchored to
  text: string;
  voice: string;           // OpenAI TTS voice (alloy, nova, etc.)
  offsetSeconds: number;   // when the narration plays in the stitched timeline
};

export type ReelMusic = {
  audio: string;           // base64-encoded music track
  mimeType: string;
  name: string;            // file name shown in UI
  volume: number;          // 0..2 mix-down volume relative to narration
};

export type ReelAudio = {
  enabled: boolean;
  narration: ReelNarration[];
  music?: ReelMusic | null;
  narrationVolume: number; // 0..2
  scoredVideo?: string;    // base64 final video with mixed audio
  scoredMime?: string;
  lastScoredAt?: number;
};

export type ReelSession = {
  id: string;
  title: string;
  theme: string;
  beats: ReelBeat[];
  clips: ReelClip[];
  coherence: ReelCoherence;
  finalVideo?: string;     // base64 stitched mp4 (silent)
  finalMime?: string;
  // Actual pixel resolution of the stitched output, as returned by
  // /reel/stitch. Lets the UI surface "1280x720" / "720x1280" beside the
  // play button so users can confirm aspect-ratio fidelity at a glance.
  // Optional because older saved sessions stitched before this field was
  // captured won't have it — UIs should fall back to the aspect label.
  finalResolution?: { width: number; height: number };
  aspectRatio: "9:16" | "16:9" | "1:1";
  durationSeconds: number; // requested per-clip duration
  audio?: ReelAudio;       // optional narration + music bed
  // Optional cover thumbnail (data URL). Bridge reels populate this with a
  // small SVG of the geodesic path so the gallery can preview them at a
  // glance instead of falling back to a generic "stitched" pill.
  coverThumbnail?: string;
  // Provenance of `coverThumbnail` so /reel/stitch knows when it's safe to
  // overwrite (frame snapshots replace Ψ-curve fallbacks, but never the
  // bridge geodesic preview that was stamped by Ω-CATHEDRAL).
  //   'bridge' — geodesic SVG from cathedral-view (do not overwrite)
  //   'curve'  — Ψ-curve fallback SVG (overwrite on stitch)
  //   'frame'  — first-frame snapshot from the stitched video
  coverKind?: "bridge" | "curve" | "frame";
  // When `coverKind === 'frame'`, the timestamp (in seconds, into
  // `finalVideo`) the snapshot was taken from. Lets the playback UI show
  // which frame is currently the cover and offer a "reset to first frame"
  // affordance. Undefined for non-frame covers, or for legacy frame covers
  // stamped before this field existed (treated as t=0).
  coverFrameSeconds?: number;
  // Bridge auto-pipeline checkpoint. Set whenever the repair → clips → stitch
  // pipeline runs (only the bridge-from-cathedral path triggers it). Lets the
  // gallery show a "resume" affordance when the user cancelled mid-run, so
  // the next attempt skips stages that already finished instead of starting
  // over from repair.
  pipelineState?: {
    kind: "running" | "cancelled" | "complete" | "error";
    stage: "repair" | "clips" | "stitch";
    updatedAt: number;
  };
  createdAt: number;
  updatedAt: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveReel(session: ReelSession): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SESSION_STORE, "readwrite");
    const store = tx.objectStore(SESSION_STORE);
    store.put({ ...session, updatedAt: Date.now() });
    const allReq = store.getAll();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    const all = (allReq.result ?? []) as ReelSession[];
    if (all.length > MAX_STORED_REELS) {
      all.sort((a, b) => a.updatedAt - b.updatedAt);
      const tx2 = db.transaction(SESSION_STORE, "readwrite");
      const s2 = tx2.objectStore(SESSION_STORE);
      for (const old of all.slice(0, all.length - MAX_STORED_REELS)) {
        s2.delete(old.id);
      }
      await new Promise<void>((resolve, reject) => {
        tx2.oncomplete = () => resolve();
        tx2.onerror = () => reject(tx2.error);
      });
    }
    db.close();
  } catch {
    /* IDB best-effort */
  }
}

export async function loadReels(): Promise<ReelSession[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(SESSION_STORE, "readonly");
    const req = tx.objectStore(SESSION_STORE).getAll();
    const list = await new Promise<ReelSession[]>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result ?? []) as ReelSession[]);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function deleteReel(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SESSION_STORE, "readwrite");
    tx.objectStore(SESSION_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}
