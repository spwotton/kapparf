/**
 * Ω-REEL IndexedDB Persistence Layer
 * DB: omega-gram-reel, v1, store: sessions
 * Max 12 sessions with LRU eviction.
 */

export type ReelPhase = "outline" | "generation" | "playback";

export interface BeatDraft {
  index: number;
  act: string;
  prompt: string;
  mood: string;
  palette: string;
  jobId?: string;
  status?: "pending" | "running" | "done" | "error";
  psiScore?: number;
  narration?: string;
}

export interface ReelSession {
  id: string;
  title: string;
  articleId?: string;
  articleSource?: string;
  theme: string;
  beatCount: number;
  beats: BeatDraft[];
  coherence?: any;
  phase: ReelPhase;
  mp4Base64?: string;
  beatOnsets?: number[];
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = "omega-gram-reel";
const DB_VERSION = 1;
const STORE_NAME = "sessions";
const MAX_SESSIONS = 12;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, mode);
    const store = t.objectStore(STORE_NAME);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function evictLRU(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, "readwrite");
    const store = t.objectStore(STORE_NAME);
    const countReq = store.count();
    countReq.onsuccess = () => {
      const count = countReq.result;
      if (count < MAX_SESSIONS) { resolve(); return; }

      const idx = store.index("updatedAt");
      const cursor = idx.openCursor(null, "next");
      let deleted = 0;
      const toDelete = count - MAX_SESSIONS + 1;

      cursor.onsuccess = (e) => {
        const c = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (!c || deleted >= toDelete) { resolve(); return; }
        c.delete();
        deleted++;
        c.continue();
      };
      cursor.onerror = () => reject(cursor.error);
    };
  });
}

export async function saveReel(session: ReelSession): Promise<void> {
  const db = await openDB();
  await evictLRU(db);
  await tx(db, "readwrite", (store) => store.put(session));
  db.close();
}

export async function loadReel(id: string): Promise<ReelSession | null> {
  const db = await openDB();
  const result = await tx<ReelSession | undefined>(db, "readonly", (store) => store.get(id));
  db.close();
  return result ?? null;
}

export async function listReels(): Promise<ReelSession[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, "readonly");
    const store = t.objectStore(STORE_NAME);
    const idx = store.index("updatedAt");
    const req = idx.getAll();
    req.onsuccess = () => {
      const all = (req.result as ReelSession[]).sort((a, b) => b.updatedAt - a.updatedAt);
      db.close();
      resolve(all);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function deleteReel(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, "readwrite", (store) => store.delete(id));
  db.close();
}

export function makeSession(
  theme: string,
  options: Partial<ReelSession> = {}
): ReelSession {
  const now = Date.now();
  return {
    id: `reel-${now}-${Math.random().toString(36).slice(2, 7)}`,
    title: theme.slice(0, 80) || "Untitled Reel",
    theme,
    beatCount: 5,
    beats: [],
    phase: "outline",
    createdAt: now,
    updatedAt: now,
    ...options,
  };
}
