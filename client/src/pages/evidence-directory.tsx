import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Radio, Network, FileText, Map, Shield, Cpu,
  Activity, Mic, Video, Zap, ExternalLink, Database,
  Eye, Upload, Search, CheckCircle2, AlertTriangle, Loader2, LogIn
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const SECTIONS = [
  {
    id: "signal",
    icon: Mic,
    title: "Signal Captures",
    subtitle: "Audio · Ultrasound · Spectrogram",
    description: "18.6 kHz tonal bursts — 76 events in IMG_0316, 0 in all indoor/negative controls. Multirotor rotor fundamental 85–127 Hz across 3 clips.",
    links: [
      { label: "Audio Forensics", href: "/audio" },
      { label: "Video Forensics", href: "/video-forensics" },
      { label: "Bio-Acoustic Monitor", href: "/bio-acoustic" },
    ],
    accent: "border-amber-300 dark:border-amber-700",
    badge: "18.6 kHz CONFIRMED",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    id: "network",
    icon: Network,
    title: "Network Forensics",
    subtitle: "PCAP · Packet Analysis · Intrusion",
    description: "TR-069 remote router resets, ePDG Liberty routing, HiPerConTracer probes, Samsung DTIgnite telemetry, Facebook Netseer tracking. 06:30 traffic spike correlation.",
    links: [
      { label: "Network Forensics", href: "/forensics" },
      { label: "Network Analysis", href: "/network-analysis" },
      { label: "Bettercap", href: "/bettercap" },
    ],
    accent: "border-blue-300 dark:border-blue-700",
    badge: "PCAP EVIDENCE",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    id: "chain",
    icon: Shield,
    title: "Chain of Custody",
    subtitle: "SHA-256 · Legal-grade · Timeline",
    description: "Immutable evidence log with SHA-256 integrity hashing, unified incident timeline, and HTML export. Covers 18 months of documented events.",
    links: [
      { label: "Evidence Chain", href: "/evidence" },
      { label: "Forensic Hypervisor", href: "/forensic-hypervisor" },
    ],
    accent: "border-green-300 dark:border-green-700",
    badge: "INTEGRITY VERIFIED",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  {
    id: "rf",
    icon: Radio,
    title: "RF & Spectrum",
    subtitle: "KiwiSDR · HF · ELF · 7410 kHz",
    description: "Hector Mora 180W HF station at 7410 kHz. KiwiSDR scans across 33 nodes. ELF anomalous 50 Hz vs CR 60 Hz mains. Full spectrum pipeline documentation.",
    links: [
      { label: "Tools & RF Scanners", href: "/tools" },
      { label: "Imagery / Spectrograms", href: "/imagery" },
      { label: "Seismic & ELF", href: "/seismic" },
    ],
    accent: "border-purple-300 dark:border-purple-700",
    badge: "7410 kHz LOGGED",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  },
  {
    id: "humint",
    icon: Map,
    title: "HUMINT & Locations",
    subtitle: "Jacó · La Flor · Breakwater · El Mirador",
    description: "La Flor #9 (Carmen Gray), #14 (Toronto Lindsay/Michelle/Bob), Dan/Villa Real, Brian/Hermosa Bungalows, Peralta houses. Parametric emitters at El Mirador + La Flor garage. Ceiling lowered 3ft at Breakwater April 2025.",
    links: [
      { label: "Jacó Incident Map", href: "/jaco" },
      { label: "Network Analysis", href: "/network-analysis" },
      { label: "Correlations", href: "/correlations" },
    ],
    accent: "border-red-300 dark:border-red-700",
    badge: "6 CLUSTERS",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
  {
    id: "intel",
    icon: FileText,
    title: "Intelligence Reports",
    subtitle: "HUMINT · Dossiers · Operators",
    description: "Setecom S.A. / Mora Marín dossier. COSMO-SkyMed / Telespazio Argentina cadastral contract 2019LN-000002-0005900001. Cy4gate D-SINT targeting analysis. Scott Ryan / Jaco Vacation network.",
    links: [
      { label: "Setecom / Mora Dossier", href: "/setecom" },
      { label: "Intelligence", href: "/intelligence" },
      { label: "Drone Intel", href: "/drone-intel" },
    ],
    accent: "border-slate-400 dark:border-slate-500",
    badge: "ITALIAN CONNECTION",
    badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    id: "satellite",
    icon: Zap,
    title: "Satellite & Orbital",
    subtitle: "COSMO-SkyMed · Blackjack · TLE",
    description: "DARPA Blackjack / SSC-CASINO OSINT. COSMO-SkyMed CSG SAR calibration grid at 10°N. LeoLabs CRSR Filadelfia 10°36'42.2\" N. TLE consistency checks.",
    links: [
      { label: "Satellites", href: "/satellites" },
      { label: "Fleet Tracker", href: "/fleet" },
      { label: "Atlas Observatory", href: "/atlas" },
    ],
    accent: "border-cyan-300 dark:border-cyan-700",
    badge: "ORBITAL CONFIRMED",
    badgeColor: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
  {
    id: "live",
    icon: Activity,
    title: "Live Correlation Engine",
    subtitle: "KAPPA Score · 22 Rules · Real-time",
    description: "Auto-correlator running 22 rules across satellite, ELF, and network domains. Forensic hypervisor SQL pattern mining every 30 min. Current κ = live.",
    links: [
      { label: "Events Feed", href: "/events" },
      { label: "Correlations", href: "/correlations" },
      { label: "Hypervisor", href: "/hypervisor" },
    ],
    accent: "border-emerald-300 dark:border-emerald-700",
    badge: "LIVE",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
];

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

interface CompareResult {
  confidence: number;
  assessedSameDesign: boolean;
  reasoning: string;
  matchFeatures: string[];
  mismatchFeatures: string[];
  model: string;
}

interface ImageSlot {
  mode: "drive" | "upload";
  driveId: string;
  base64: string;
  mimeType: string;
  previewUrl: string;
  fileName: string;
}

function ConfidenceMeter({ value }: { value: number }) {
  const color =
    value >= 70 ? "bg-red-500" : value >= 40 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Geometric consistency</span>
        <span className="font-mono font-bold">{value}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ImageInputSlot({
  label,
  slot,
  onChange,
}: {
  label: string;
  slot: ImageSlot;
  onChange: (s: Partial<ImageSlot>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const b64 = url.split(",")[1] ?? "";
      onChange({ base64: b64, mimeType: file.type || "image/jpeg", previewUrl: url, fileName: file.name });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>

      <div className="flex gap-2">
        <button
          data-testid={`btn-mode-drive-${label}`}
          onClick={() => onChange({ mode: "drive" })}
          className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
            slot.mode === "drive"
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground hover:border-foreground"
          }`}
        >
          Drive ID
        </button>
        <button
          data-testid={`btn-mode-upload-${label}`}
          onClick={() => onChange({ mode: "upload" })}
          className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
            slot.mode === "upload"
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground hover:border-foreground"
          }`}
        >
          Upload
        </button>
      </div>

      {slot.mode === "drive" ? (
        <input
          data-testid={`input-drive-id-${label}`}
          type="text"
          value={slot.driveId}
          onChange={(e) => onChange({ driveId: e.target.value.trim() })}
          placeholder="Google Drive file ID"
          className="w-full text-xs font-mono border border-border rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
            data-testid={`input-file-${label}`}
          />
          <button
            data-testid={`btn-browse-${label}`}
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 text-xs border border-dashed border-border rounded px-3 py-3 hover:border-foreground transition-colors text-muted-foreground hover:text-foreground"
          >
            <Upload className="w-3.5 h-3.5" />
            {slot.fileName ? slot.fileName : "Choose image file"}
          </button>
        </div>
      )}

      {slot.previewUrl && (
        <img
          src={slot.previewUrl}
          alt={label}
          className="w-full max-h-40 object-contain rounded border border-border"
        />
      )}
    </div>
  );
}

function MaskTattooForensicsPanel() {
  const { toast } = useToast();

  const emptySlot = (): ImageSlot => ({
    mode: "upload",
    driveId: "",
    base64: "",
    mimeType: "image/jpeg",
    previewUrl: "",
    fileName: "",
  });

  const [slot1, setSlot1] = useState<ImageSlot>(emptySlot);
  const [slot2, setSlot2] = useState<ImageSlot>(emptySlot);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [driveQuery, setDriveQuery] = useState("");
  const [driveMode, setDriveMode] = useState<"search" | "recent">("recent");
  const [showDriveSearch, setShowDriveSearch] = useState(false);
  const [driveFallbackNote, setDriveFallbackNote] = useState<string | null>(null);

  const driveListQuery = useQuery<DriveFile[]>({
    queryKey: ["/api/drive/list", driveMode, driveQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (driveMode === "recent") {
        params.set("recent", "1");
      } else {
        params.set("q", driveQuery);
      }
      const res = await fetch(`/api/drive/list?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: false,
  });

  async function fetchDriveFiles() {
    setShowDriveSearch(true);
    await driveListQuery.refetch();
  }

  function formatFileDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return "";
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  const compareMutation = useMutation({
    mutationFn: async () => {
      setDriveFallbackNote(null);
      const body = {
        driveFileId1: slot1.mode === "drive" ? slot1.driveId : undefined,
        driveFileId2: slot2.mode === "drive" ? slot2.driveId : undefined,
        base64Image1: slot1.mode === "upload" ? slot1.base64 : undefined,
        base64Image2: slot2.mode === "upload" ? slot2.base64 : undefined,
        mimeType1: slot1.mode === "upload" ? slot1.mimeType : undefined,
        mimeType2: slot2.mode === "upload" ? slot2.mimeType : undefined,
      };
      const res = await apiRequest("POST", "/api/forensics/mask-tattoo-compare", body);
      return res.json() as Promise<CompareResult & { error?: string }>;
    },
    onSuccess: (data) => {
      if ((data as any).error) {
        // Drive fetch failed server-side — auto-switch failing slot(s) to upload mode
        const msg = (data as any).error as string;
        if (msg.includes("Image 1")) {
          setSlot1(s => ({ ...s, mode: "upload", driveId: "" }));
          setDriveFallbackNote("Drive fetch failed for Image 1 — switched to upload mode. Please select a local file.");
        } else if (msg.includes("Image 2")) {
          setSlot2(s => ({ ...s, mode: "upload", driveId: "" }));
          setDriveFallbackNote("Drive fetch failed for Image 2 — switched to upload mode. Please select a local file.");
        } else {
          toast({ title: "Comparison failed", description: msg, variant: "destructive" });
        }
        return;
      }
      setResult(data);
    },
    onError: (err: any) => {
      // 4xx errors come through here — check for Drive resolution failure
      const msg: string = err.message ?? "";
      if (msg.includes("Image 1 could not be resolved")) {
        setSlot1(s => ({ ...s, mode: "upload", driveId: "" }));
        setDriveFallbackNote("Drive fetch failed for Image 1 — switched to upload mode. Please select a local file.");
      } else if (msg.includes("Image 2 could not be resolved")) {
        setSlot2(s => ({ ...s, mode: "upload", driveId: "" }));
        setDriveFallbackNote("Drive fetch failed for Image 2 — switched to upload mode. Please select a local file.");
      } else {
        toast({ title: "Comparison failed", description: msg, variant: "destructive" });
      }
    },
  });

  const logMutation = useMutation({
    mutationFn: async () => {
      if (!result) throw new Error("No result to log");
      const imageRef1 = slot1.mode === "drive" ? `drive:${slot1.driveId}` : (slot1.fileName || "upload");
      const imageRef2 = slot2.mode === "drive" ? `drive:${slot2.driveId}` : (slot2.fileName || "upload");
      const res = await apiRequest("POST", "/api/forensics/mask-tattoo-compare/log", { ...result, imageRef1, imageRef2 });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Logged to Evidence Chain", description: "Incident recorded with SHA-256 hash." });
    },
    onError: (err: any) => {
      toast({ title: "Log failed", description: err.message, variant: "destructive" });
    },
  });

  function canCompare() {
    const ok1 = slot1.mode === "drive" ? !!slot1.driveId : !!slot1.base64;
    const ok2 = slot2.mode === "drive" ? !!slot2.driveId : !!slot2.base64;
    return ok1 && ok2;
  }

  return (
    <div className="rounded-lg border-2 border-rose-300 dark:border-rose-700 bg-card p-5 space-y-4 col-span-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-semibold leading-tight">Mask Geometry Forensics</p>
            <p className="text-[10px] text-muted-foreground tracking-wide uppercase mt-0.5">
              Ale (alevida89) · Tattoo vs Porch Photo · Gemini 2.5 Flash
            </p>
          </div>
        </div>
        <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 shrink-0">
          VISUAL FORENSICS
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Structured geometric comparison of the mask depicted in Ale's thigh tattoo against the physical mask worn
        in the hotel porch photo. Analyzes facial coverage, edge geometry, and structural elements only — no facial
        recognition. Returns a 0–100 consistency score with match/mismatch features.
      </p>

      {/* Drive search */}
      <div className="border border-border rounded p-3 space-y-2">
        <button
          data-testid="btn-toggle-drive-search"
          onClick={() => setShowDriveSearch((v) => !v)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          Browse Google Drive for relevant files
        </button>
        {showDriveSearch && (
          <div className="space-y-2">
            {/* Mode toggle */}
            <div className="flex gap-1.5 items-center">
              <button
                data-testid="btn-drive-mode-recent"
                onClick={() => setDriveMode("recent")}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${driveMode === "recent" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground"}`}
              >
                Recent uploads
              </button>
              <button
                data-testid="btn-drive-mode-search"
                onClick={() => setDriveMode("search")}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${driveMode === "search" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground"}`}
              >
                Search by name
              </button>
              <span className="text-[10px] text-muted-foreground ml-1">
                {driveMode === "recent"
                  ? "— lists latest 80 images, sorted newest first"
                  : "— filter by filename keyword"}
              </span>
            </div>

            {/* Search input (only in search mode) */}
            {driveMode === "search" && (
              <input
                data-testid="input-drive-query"
                type="text"
                value={driveQuery}
                onChange={(e) => setDriveQuery(e.target.value)}
                placeholder="e.g. mask OR porch OR ale"
                className="w-full text-xs font-mono border border-border rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            )}

            <button
              data-testid="btn-drive-search"
              onClick={fetchDriveFiles}
              disabled={driveListQuery.isFetching}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:border-foreground transition-colors disabled:opacity-50"
            >
              {driveListQuery.isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              {driveMode === "recent" ? "Load recent images" : "Search"}
            </button>

            {driveListQuery.isError && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1.5">
                <LogIn className="w-3 h-3 shrink-0" />
                Drive not authorized.{" "}
                <a href="/api/auth/google" className="underline">Authorize Google Drive</a>
                {" "}— or use file upload instead.
              </div>
            )}
            {driveListQuery.data && driveListQuery.data.length === 0 && (
              <p className="text-xs text-muted-foreground">No images found.</p>
            )}
            {driveListQuery.data && driveListQuery.data.length > 0 && (
              <div className="divide-y divide-border rounded border border-border max-h-72 overflow-y-auto">
                {driveListQuery.data.map((f) => (
                  <div
                    key={f.id}
                    data-testid={`drive-file-${f.id}`}
                    className="flex items-center justify-between gap-2 px-2 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{f.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {formatFileDate(f.modifiedTime)}
                        </span>
                        {(f as any).size && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatFileSize((f as any).size)}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono opacity-50 truncate">
                          {f.id}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        data-testid={`btn-use-slot1-${f.id}`}
                        onClick={() => setSlot1((s) => ({ ...s, mode: "drive", driveId: f.id, fileName: f.name }))}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${slot1.driveId === f.id ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
                      >
                        {slot1.driveId === f.id ? "✓ Slot 1" : "→ Slot 1"}
                      </button>
                      <button
                        data-testid={`btn-use-slot2-${f.id}`}
                        onClick={() => setSlot2((s) => ({ ...s, mode: "drive", driveId: f.id, fileName: f.name }))}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${slot2.driveId === f.id ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
                      >
                        {slot2.driveId === f.id ? "✓ Slot 2" : "→ Slot 2"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ImageInputSlot
          label="Image 1 — Tattoo (mask design)"
          slot={slot1}
          onChange={(p) => setSlot1((s) => ({ ...s, ...p }))}
        />
        <ImageInputSlot
          label="Image 2 — Porch photo (physical mask)"
          slot={slot2}
          onChange={(p) => setSlot2((s) => ({ ...s, ...p }))}
        />
      </div>

      {/* Run button */}
      <button
        data-testid="btn-run-comparison"
        onClick={() => compareMutation.mutate()}
        disabled={!canCompare() || compareMutation.isPending}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded border border-border hover:border-foreground bg-foreground text-background transition-colors disabled:opacity-40"
      >
        {compareMutation.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with Gemini…</>
        ) : (
          <><Eye className="w-4 h-4" /> Run Comparison</>
        )}
      </button>

      {!canCompare() && !driveFallbackNote && (
        <p className="text-[11px] text-muted-foreground">
          Provide both images (Drive ID or file upload) to enable comparison.
        </p>
      )}

      {driveFallbackNote && (
        <div
          data-testid="drive-fallback-note"
          className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded px-3 py-2"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {driveFallbackNote}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="border border-border rounded p-4 space-y-4 bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Comparison Result</p>
            {result.assessedSameDesign ? (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3" />
                Same design assessed
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" />
                Different design assessed
              </span>
            )}
          </div>

          <ConfidenceMeter value={result.confidence} />

          <div>
            <p className="text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Analysis</p>
            <p className="text-xs leading-relaxed">{result.reasoning}</p>
          </div>

          {result.matchFeatures.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1 text-green-700 dark:text-green-400 uppercase tracking-wide">
                Matching features
              </p>
              <ul className="space-y-0.5">
                {result.matchFeatures.map((f, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.mismatchFeatures.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1 text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Mismatch / uncertain features
              </p>
              <ul className="space-y-0.5">
                {result.mismatchFeatures.map((f, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-border">
            <p className="text-[10px] text-muted-foreground font-mono">model: {result.model}</p>
            <button
              data-testid="btn-log-to-chain"
              onClick={() => logMutation.mutate()}
              disabled={logMutation.isPending || logMutation.isSuccess}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:border-foreground transition-colors disabled:opacity-40"
            >
              {logMutation.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Logging…</>
              ) : logMutation.isSuccess ? (
                <><CheckCircle2 className="w-3 h-3 text-green-600" /> Logged</>
              ) : (
                <><Shield className="w-3 h-3" /> Log to Evidence Chain</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvidenceDirectoryPage() {
  const { data: kappaStatus } = useQuery<{ score: number; level: string; eventCount: number; correlationCount: number }>({
    queryKey: ["/api/kappa/status"],
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold tracking-tight">KAPPA Evidence Directory</span>
            <span className="hidden sm:inline text-xs text-muted-foreground">— Jacó, Puntarenas · Dec 2024–present</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Lede */}
        <div className="mb-8 pb-6 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight mb-2">18-Month Surveillance Documentation</h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Technical and forensic record of an electronic harassment and drone surveillance operation in Costa Rica. 
            All data sourced from real captures — audio, PCAP, RF, HUMINT, satellite OSINT. Zero synthetic or reconstructed evidence.
          </p>
          {kappaStatus && (
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono">
              <span className="text-muted-foreground">κ score <span className="text-foreground font-bold">{kappaStatus.score?.toFixed(1)}</span></span>
              <span className="text-muted-foreground">events <span className="text-foreground font-bold">{kappaStatus.eventCount?.toLocaleString()}</span></span>
              <span className="text-muted-foreground">correlations <span className="text-foreground font-bold">{kappaStatus.correlationCount?.toLocaleString()}</span></span>
              <span className="text-muted-foreground">threat <span className="text-foreground font-bold">{kappaStatus.level}</span></span>
            </div>
          )}
        </div>

        {/* Key finding banner */}
        <div className="mb-8 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20 px-5 py-4">
          <div className="flex items-start gap-3">
            <Mic className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">Primary acoustic finding — 18.6 kHz tonal signature</p>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                76 tonal bursts in IMG_0316 (24s drone-overhead clip). Peak: t=20.03s, f=18,666 Hz, 3003× quiet-band baseline. 
                Zero bursts in 201s lossless FLAC negative control, all indoor/ambient captures, and 8 cross-location recordings. 
                Signature is drone-locked, not codec or location-locked. Consistent with ≥60 kHz parametric carrier (Pompei US 8,027,488) aliasing at 48 kHz sampling.
              </p>
            </div>
          </div>
        </div>

        {/* Section grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                data-testid={`evidence-card-${s.id}`}
                className={`rounded-lg border-2 ${s.accent} bg-card p-5 flex flex-col gap-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-semibold leading-tight">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground tracking-wide uppercase mt-0.5">{s.subtitle}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded shrink-0 ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>

                <div className="flex flex-wrap gap-2 mt-auto pt-1">
                  {s.links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      data-testid={`link-evidence-${s.id}-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:text-primary border border-border rounded px-2 py-0.5 transition-colors"
                    >
                      {l.label}
                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Mask Tattoo Forensics Panel — full width */}
          <MaskTattooForensicsPanel />
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-border flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-muted-foreground">
            KAPPA Signal Intelligence Platform · All evidence real captures only · No synthetic data
          </p>
          <Link href="/evidence" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
            Full chain of custody →
          </Link>
        </div>
      </main>
    </div>
  );
}
