import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Radio, Satellite, Plane, Activity, Clock, MapPin, Zap, Eye, Signal, Shield, ChevronDown, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const aerialImg = "/evidence/pochote_surveillance_network_aerial.jpeg";
const aerialRoom10 = "/evidence/room10_aerial_geometry.jpeg";
const antennaImg1 = "/evidence/boom/antenna/a001.jpg";
const antennaImg2 = "/evidence/boom/antenna/a003.jpg";
const antennaImg3 = "/evidence/boom/antenna/a007.jpg";
const antennaImg4 = "/evidence/boom/antenna/a012.jpg";
const truckImg = "/evidence/vehicle_CL273123_20260607_072008.jpeg";
const sinpeImg1 = "/evidence/pochote-sinpe-may29-370k.jpeg";
const sinpeImg2 = "/evidence/pochote-sinpe-may16-247k.jpeg";
const noteImg = "/evidence/pochote-handwritten-note-june13.jpeg";
const rssiSpike = "/evidence/rssi_spike_10h50_20260607_072008.png";
const rssiBle = "/evidence/ble_IMG_0630_20260607.png";

interface KappaStatus {
  score: number;
  level: string;
  correlations: number;
  events: number;
}

interface KappaEvent {
  id: number;
  type: string;
  source: string;
  description: string;
  severity: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface Correlation {
  id: number;
  type: string;
  description: string;
  confidence: number;
  severity: string;
  timestamp: string;
  eventIds?: number[];
}

interface Flight {
  icao24: string;
  callsign?: string;
  lat?: number;
  lon?: number;
  altitude?: number;
  velocity?: number;
  origin_country?: string;
}

interface DronePost {
  id: string;
  headline: string;
  summary: string;
  publishedAt: string;
  tags?: string[];
}

interface DroneFeed {
  posts: DronePost[];
  count: number;
}

function SurveillanceNetworkDiagram() {
  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <svg viewBox="0 0 600 500" className="w-full border border-border rounded-sm bg-muted/20">
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" opacity="0.7" />
          </marker>
          <pattern id="ocean" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect width="20" height="20" fill="#0c1a2e" />
            <path d="M0,10 Q5,5 10,10 Q15,15 20,10" stroke="#1e3a5f" strokeWidth="1" fill="none" />
          </pattern>
        </defs>

        {/* Ocean East */}
        <rect x="480" y="0" width="120" height="500" fill="url(#ocean)" />
        <text x="540" y="250" textAnchor="middle" fill="#1e3a5f" fontSize="11" fontWeight="bold" transform="rotate(-90 540 250)">PACIFIC OCEAN →</text>

        {/* Road/Street */}
        <rect x="0" y="460" width="480" height="40" fill="#1a1a1a" opacity="0.6" />
        <text x="240" y="483" textAnchor="middle" fill="#555" fontSize="9">CALLE BOHÍO</text>

        {/* Hotel Pochote Grande main building */}
        <rect x="180" y="240" width="240" height="140" fill="#2d2d2d" stroke="#666" strokeWidth="1.5" rx="2" />
        <text x="300" y="300" textAnchor="middle" fill="#999" fontSize="9" fontWeight="bold">HOTEL POCHOTE</text>
        <text x="300" y="312" textAnchor="middle" fill="#777" fontSize="8">GRANDE</text>

        {/* Pool */}
        <rect x="250" y="350" width="100" height="50" fill="#0c3547" stroke="#1e6494" strokeWidth="1" rx="3" />
        <text x="300" y="379" textAnchor="middle" fill="#1e6494" fontSize="8">POOL</text>

        {/* Room 10 — eastern end, highlighted */}
        <rect x="395" y="250" width="50" height="45" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" rx="1" />
        <text x="420" y="268" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="bold">ROOM</text>
        <text x="420" y="280" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="bold">10</text>
        <circle cx="420" cy="273" r="18" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.6" />

        {/* POSITION 1: La Flor 23/24/25 — NE large houses */}
        <rect x="340" y="40" width="100" height="80" fill="#1c1c2e" stroke="#7c3aed" strokeWidth="1.5" rx="2" />
        <text x="390" y="65" textAnchor="middle" fill="#a78bfa" fontSize="8" fontWeight="bold">LA FLOR</text>
        <text x="390" y="77" textAnchor="middle" fill="#a78bfa" fontSize="8">UNITS 23–25</text>
        <text x="390" y="89" textAnchor="middle" fill="#7c3aed" fontSize="7">3-floor / ~2400 sq ft</text>
        <text x="390" y="101" textAnchor="middle" fill="#7c3aed" fontSize="7">NE surveillance cluster</text>
        {/* LOS line from La Flor to Room 10 */}
        <line x1="390" y1="120" x2="425" y2="250" stroke="#7c3aed" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" markerEnd="url(#arrow)" />

        {/* POSITION 2: La Flor unit 9 — Genesis Peralta */}
        <rect x="455" y="50" width="90" height="65" fill="#1a1a2e" stroke="#6366f1" strokeWidth="1.5" rx="2" />
        <text x="500" y="70" textAnchor="middle" fill="#a5b4fc" fontSize="8" fontWeight="bold">LA FLOR #9</text>
        <text x="500" y="82" textAnchor="middle" fill="#a5b4fc" fontSize="7">Genesis Peralta</text>
        <text x="500" y="93" textAnchor="middle" fill="#6366f1" fontSize="7">3rd-floor roof deck</text>
        <text x="500" y="104" textAnchor="middle" fill="#6366f1" fontSize="7">DIRECT LOS → R10</text>
        <line x1="490" y1="115" x2="435" y2="250" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.6" markerEnd="url(#arrow)" />

        {/* POSITION 3: Central antenna */}
        <rect x="100" y="120" width="90" height="60" fill="#1a1c1a" stroke="#16a34a" strokeWidth="1.5" rx="2" />
        <text x="145" y="140" textAnchor="middle" fill="#86efac" fontSize="8" fontWeight="bold">CENTRAL</text>
        <text x="145" y="152" textAnchor="middle" fill="#86efac" fontSize="8">ANTENNA</text>
        <text x="145" y="163" textAnchor="middle" fill="#16a34a" fontSize="7">PARABOLIC DISH</text>
        <text x="145" y="174" textAnchor="middle" fill="#16a34a" fontSize="7">ROTATING</text>
        <line x1="180" y1="165" x2="380" y2="265" stroke="#16a34a" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" markerEnd="url(#arrow)" />

        {/* POSITION 4: Crocs */}
        <rect x="20" y="280" width="90" height="55" fill="#1c1a14" stroke="#d97706" strokeWidth="1.5" rx="2" />
        <text x="65" y="300" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">CROCS</text>
        <text x="65" y="312" textAnchor="middle" fill="#fbbf24" fontSize="7">W observation post</text>
        <text x="65" y="323" textAnchor="middle" fill="#d97706" fontSize="7">persistent presence</text>
        <line x1="110" y1="305" x2="240" y2="290" stroke="#d97706" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" markerEnd="url(#arrow)" />

        {/* POSITION 5: Vista Las Palmas */}
        <rect x="30" y="150" width="90" height="70" fill="#1c1414" stroke="#dc2626" strokeWidth="1.5" rx="2" />
        <text x="75" y="170" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold">VISTA LAS</text>
        <text x="75" y="182" textAnchor="middle" fill="#fca5a5" fontSize="8">PALMAS</text>
        <text x="75" y="193" textAnchor="middle" fill="#dc2626" fontSize="7">tallest bldg in Jacó</text>
        <text x="75" y="204" textAnchor="middle" fill="#dc2626" fontSize="7">Dan Wagner / red lights</text>
        <text x="75" y="215" textAnchor="middle" fill="#dc2626" fontSize="7">possible antenna array</text>
        <line x1="120" y1="200" x2="240" y2="270" stroke="#dc2626" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" markerEnd="url(#arrow)" />

        {/* POSITION 6: Hotel corner unit */}
        <rect x="180" y="180" width="90" height="55" fill="#1c1c14" stroke="#ca8a04" strokeWidth="1.5" rx="2" />
        <text x="225" y="198" textAnchor="middle" fill="#fde68a" fontSize="8" fontWeight="bold">CORNER</text>
        <text x="225" y="210" textAnchor="middle" fill="#fde68a" fontSize="7">UNIT</text>
        <text x="225" y="221" textAnchor="middle" fill="#ca8a04" fontSize="7">masked operative</text>
        <text x="225" y="232" textAnchor="middle" fill="#ca8a04" fontSize="7">confirmed on porch</text>

        {/* Compass */}
        <g transform="translate(550, 30)">
          <circle cx="0" cy="0" r="18" fill="#111" stroke="#333" strokeWidth="1" />
          <text x="0" y="-6" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">N</text>
          <text x="0" y="14" textAnchor="middle" fill="#666" fontSize="7">S</text>
          <text x="10" y="4" textAnchor="middle" fill="#666" fontSize="7">E</text>
          <text x="-10" y="4" textAnchor="middle" fill="#666" fontSize="7">W</text>
          <line x1="0" y1="-13" x2="0" y2="2" stroke="#ef4444" strokeWidth="2" />
          <line x1="0" y1="2" x2="0" y2="13" stroke="#666" strokeWidth="1.5" />
        </g>

        {/* Legend */}
        <g transform="translate(10, 380)">
          <text x="0" y="0" fill="#666" fontSize="8" fontWeight="bold">SURVEILLANCE POSITIONS</text>
          <circle cx="5" cy="12" r="4" fill="#7c3aed" opacity="0.7" />
          <text x="13" y="16" fill="#999" fontSize="7">La Flor cluster (N/NE)</text>
          <circle cx="5" cy="24" r="4" fill="#16a34a" opacity="0.7" />
          <text x="13" y="28" fill="#999" fontSize="7">Parabolic antenna / yoga property</text>
          <circle cx="5" cy="36" r="4" fill="#d97706" opacity="0.7" />
          <text x="13" y="40" fill="#999" fontSize="7">Crocs (W post)</text>
          <circle cx="5" cy="48" r="4" fill="#dc2626" opacity="0.7" />
          <text x="13" y="52" fill="#999" fontSize="7">Vista Las Palmas (possible array)</text>
          <rect x="2" y="56" width="6" height="6" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
          <text x="13" y="63" fill="#fca5a5" fontSize="7" fontWeight="bold">Room 10 — observer position</text>
        </g>
      </svg>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Schematic diagram — six confirmed surveillance positions surrounding Room 10, Hotel Pochote Grande, Jacó Beach
      </p>
    </div>
  );
}

function LiveKappaWidget() {
  const { data: status } = useQuery<KappaStatus>({
    queryKey: ["/api/kappa/status"],
    refetchInterval: 15000,
  });

  const { data: stats } = useQuery<{ totalCorrelations: number; highConfidence: number }>({
    queryKey: ["/api/correlations/stats"],
    refetchInterval: 30000,
  });

  if (!status) return null;

  const scoreColor =
    status.score >= 70 ? "#ef4444" :
    status.score >= 40 ? "#f97316" :
    status.score >= 20 ? "#eab308" : "#22c55e";

  return (
    <div className="my-8 p-6 border border-border rounded-sm bg-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: scoreColor }} />
        <span className="text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase">KAPPA Engine — Live Feed</span>
        <Badge variant="outline" className="ml-auto text-[10px] font-mono rounded-none">{new Date().toLocaleTimeString()}</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-3xl font-mono font-bold" style={{ color: scoreColor }}>{status.score.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground mt-1">KAPPA SCORE</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-foreground">{status.events ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">EVENTS LOGGED</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-foreground">{status.correlations ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">CORRELATIONS</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-amber-400">{stats?.highConfidence ?? "—"}</div>
          <div className="text-xs text-muted-foreground mt-1">HIGH CONFIDENCE</div>
        </div>
      </div>
      <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
        <span className="font-mono uppercase">THREAT LEVEL:</span>
        <span className="font-mono font-bold" style={{ color: scoreColor }}>{status.level ?? "—"}</span>
      </div>
    </div>
  );
}

function RecentCorrelationsPanel() {
  const { data: correlations } = useQuery<Correlation[]>({
    queryKey: ["/api/correlations"],
    refetchInterval: 30000,
  });

  const recent = (correlations ?? []).slice(0, 8);

  if (recent.length === 0) return null;

  const severityColor = (s: string) =>
    s === "critical" ? "text-red-400" :
    s === "high" ? "text-orange-400" :
    s === "medium" ? "text-yellow-400" : "text-green-400";

  return (
    <div className="my-8">
      <h3 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Live Correlation Feed — KAPPA Engine
      </h3>
      <div className="space-y-2">
        {recent.map((c) => (
          <div key={c.id} className="border border-border rounded-sm p-3 bg-card/50 hover:bg-card transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono font-bold uppercase text-muted-foreground/70 mb-1">{c.type}</div>
                <p className="text-sm text-foreground line-clamp-2">{c.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-xs font-mono font-bold ${severityColor(String(c.severity ?? ""))}`}>
                  {String(c.severity ?? "").toUpperCase() || "—"}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {Math.round(((c.confidence as number) ?? 0) * 100)}% conf
                </span>
              </div>
            </div>
            <div className="mt-1 text-[10px] font-mono text-muted-foreground/40">
              {new Date(c.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentEventsTimeline() {
  const { data: events } = useQuery<KappaEvent[]>({
    queryKey: ["/api/events/recent"],
    refetchInterval: 30000,
  });

  const recent = (events ?? []).slice(0, 10);

  if (recent.length === 0) return null;

  const sourceIcon = (source: string) => {
    if (source?.toLowerCase().includes("flight")) return <Plane className="h-3.5 w-3.5 flex-shrink-0" />;
    if (source?.toLowerCase().includes("sat")) return <Satellite className="h-3.5 w-3.5 flex-shrink-0" />;
    if (source?.toLowerCase().includes("network") || source?.toLowerCase().includes("wifi")) return <Signal className="h-3.5 w-3.5 flex-shrink-0" />;
    if (source?.toLowerCase().includes("kiwi") || source?.toLowerCase().includes("rf")) return <Radio className="h-3.5 w-3.5 flex-shrink-0" />;
    return <Activity className="h-3.5 w-3.5 flex-shrink-0" />;
  };

  const sevColor = (s: string) =>
    s === "critical" ? "border-l-red-500 bg-red-950/10" :
    s === "high" ? "border-l-orange-500 bg-orange-950/10" :
    s === "medium" ? "border-l-yellow-500 bg-yellow-950/10" : "border-l-green-500/40";

  return (
    <div className="my-8">
      <h3 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        KAPPA Event Timeline — Most Recent
      </h3>
      <div className="space-y-1.5">
        {recent.map((e) => (
          <div key={e.id} className={`border-l-2 pl-3 py-2 pr-3 rounded-r-sm text-sm ${sevColor(e.severity)}`}>
            <div className="flex items-center gap-2 text-muted-foreground/70">
              {sourceIcon(e.source)}
              <span className="text-[10px] font-mono uppercase">{e.source}</span>
              <span className="ml-auto text-[10px] font-mono">{new Date(e.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-foreground mt-1 text-xs leading-relaxed">{e.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-muted-foreground/50 font-mono">
        Showing {recent.length} most recent events — <Link href="/events" className="underline underline-offset-2 hover:text-primary">view full event log →</Link>
      </div>
    </div>
  );
}

function FlightIntelPanel() {
  const { data: flights } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
    refetchInterval: 60000,
  });

  const active = (flights ?? []).filter(f => f.lat && f.lon).slice(0, 6);

  if (active.length === 0) return null;

  return (
    <div className="my-6 p-4 border border-border rounded-sm bg-card/30">
      <div className="flex items-center gap-2 mb-3">
        <Plane className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-mono font-bold tracking-widest uppercase text-muted-foreground">Live Air Picture — OpenSky Network</span>
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {active.map((f, i) => (
          <div key={f.icao24 ?? i} className="text-xs border border-border/50 rounded-sm p-2 bg-muted/10 font-mono">
            <div className="font-bold text-foreground">{f.callsign?.trim() || f.icao24}</div>
            <div className="text-muted-foreground/70">{f.origin_country}</div>
            {f.altitude != null && <div className="text-muted-foreground/50">{Math.round(f.altitude)}m alt</div>}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground/40 font-mono">
        Flight data is global — aircraft shown from OpenSky live feed, not filtered to Jacó airspace. Jacó aerial intrusions are logged separately in KAPPA events.
      </p>
    </div>
  );
}

function DroneSightingsPanel() {
  const { data: feed } = useQuery<DroneFeed>({
    queryKey: ["/api/drone-blog/feed"],
    refetchInterval: 120000,
  });

  const posts = (feed?.posts ?? []).slice(0, 4);

  if (posts.length === 0) return null;

  return (
    <div className="my-6">
      <h3 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground mb-4 flex items-center gap-2">
        <Eye className="h-4 w-4" />
        C-UAS Intel — Drone Sighting Reports
      </h3>
      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="border border-border rounded-sm p-4 bg-card/40">
            <div className="text-xs font-mono text-muted-foreground/60 mb-1">{new Date(p.publishedAt).toLocaleDateString()}</div>
            <h4 className="text-sm font-semibold text-foreground mb-1 leading-snug">{p.headline}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{p.summary}</p>
            {p.tags && p.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {p.tags.slice(0, 4).map(t => (
                  <Badge key={t} variant="outline" className="text-[9px] rounded-none font-mono">{t}</Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-muted-foreground/50 font-mono">
        <Link href="/drone-intel" className="underline underline-offset-2 hover:text-primary">Full C-UAS Intel Library →</Link>
      </div>
    </div>
  );
}

function ZoomImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`cursor-zoom-in rounded-sm border border-border ${className ?? ""}`}
        onClick={() => setZoomed(true)}
      />
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <img src={src} alt={alt} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}

export default function PochoteHeadlinerPage() {
  const [readingTime] = useState(12);
  const publishedDate = "June 17, 2026";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${aerialImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-12">
          <div className="flex items-center gap-2 mb-6">
            <Badge variant="destructive" className="text-[10px] font-mono rounded-none tracking-widest animate-pulse">
              ACTIVE OPERATION
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono rounded-none tracking-widest">
              INTELLIGENCE SYNTHESIS
            </Badge>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground/60">KAPPA — SIGINT PLATFORM</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold leading-tight text-foreground mb-6">
            Hotel Pochote Grande:<br />
            <span className="text-muted-foreground font-normal">30 Days Under Surveillance</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-6 font-serif">
            A rotating parabolic dish antenna. A stationary operative at Crocs. Nightly drone transits over Room 10. German-connected hotel ownership. And a KAPPA engine registering anomalous correlations across six independent signal domains. This is what the last month looked like at Jacó Beach, Costa Rica.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground/60 font-mono">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {publishedDate}</span>
            <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> ~{readingTime} min read</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Jacó Beach, Puntarenas, Costa Rica</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 pb-24 space-y-0">

        <LiveKappaWidget />

        <Separator className="my-8" />

        {/* Section 1: The Setting */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-serif font-bold text-foreground">The Setting</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            Hotel Pochote Grande sits at the northern end of Jacó Beach, a mid-tier beach town on Costa Rica's Pacific coast. The hotel is a low-rise structure with guest units facing east toward the ocean. Room 10 occupies the eastern end of the property — the corner unit closest to the water, with a balcony facing the beach.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            What makes Room 10 significant is not its location within the hotel, but its location within a surveillance geometry. As of May 2026, KAPPA has mapped six confirmed observation positions surrounding the room, each occupying a different elevation and bearing. Together, they form a 270-degree cordon. The ocean covers the remaining 90 degrees to the east.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div>
              <ZoomImage src={aerialRoom10} alt="Aerial geometry — Room 10 and surroundings" className="w-full" />
              <p className="text-xs text-muted-foreground/60 mt-1 font-mono">Room 10 (blue dot) and parking lot positions. Apple Maps aerial.</p>
            </div>
            <div>
              <ZoomImage src={aerialImg} alt="Hotel Pochote Grande surveillance network aerial" className="w-full" />
              <p className="text-xs text-muted-foreground/60 mt-1 font-mono">Full surveillance perimeter — La Flor, central antenna, Crocs.</p>
            </div>
          </div>

          <SurveillanceNetworkDiagram />
        </section>

        <Separator className="my-8" />

        {/* Section 2: German Ownership */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-serif font-bold text-foreground">The German Ownership Question</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            Hotel Pochote Grande is operated under Costa Rican corporate structures, but ownership traces — through multiple legal instruments — to German-connected principals. This is not itself unusual in Jacó, where European real-estate accumulation has been documented for decades. What makes it operationally relevant is the convergence of three factors:
          </p>
          <div className="space-y-3 my-6">
            {[
              { n: "01", title: "Unusual lease and payment structures", body: "SINPE transfers from the hotel administration to external accounts show irregular timing — large round-number amounts on the 16th and 29th of each month, inconsistent with standard payroll cycles." },
              { n: "02", title: "Staff rotation consistent with intelligence tradecraft", body: "Front desk and cleaning staff rotate on a schedule that does not match low-season occupancy patterns. Several staff members appear on property outside their normal shift windows during evening KAPPA alert periods." },
              { n: "03", title: "Physical access to the target room", body: "The Room 10 occupant (the observer) has documented at least three instances of physical interference with room electronics, forced entry attempts, and one confirmed access event correlated with a WiFi deauthentication burst." },
            ].map(item => (
              <div key={item.n} className="border border-border rounded-sm p-4 bg-card/30">
                <div className="flex gap-4">
                  <span className="text-2xl font-mono font-bold text-muted-foreground/30 flex-shrink-0">{item.n}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 my-6">
            <div>
              <ZoomImage src={sinpeImg1} alt="SINPE transfer May 29 — 370,000 CRC" className="w-full" />
              <p className="text-xs text-muted-foreground/60 mt-1 font-mono">SINPE — 370,000 CRC — May 29, 2026</p>
            </div>
            <div>
              <ZoomImage src={sinpeImg2} alt="SINPE transfer May 16 — 247,000 CRC" className="w-full" />
              <p className="text-xs text-muted-foreground/60 mt-1 font-mono">SINPE — 247,000 CRC — May 16, 2026</p>
            </div>
          </div>
          <div className="my-4">
            <ZoomImage src={noteImg} alt="Handwritten note — June 13, 2026" className="w-full max-w-md" />
            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">Handwritten note recovered June 13, 2026</p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Section 3: Parabolic Antenna */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-4 w-4 text-green-400" />
            <h2 className="text-xl font-serif font-bold text-foreground">The Parabolic Antenna — Santa Reyes Yoga Property</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            On June 8, 2026, AI-enhanced forensic video analysis confirmed a rotating parabolic dish antenna on the roof of the yoga property immediately behind Hotel Pochote Grande. The dish was observed completing a full 360-degree rotation during a 4-minute observation window, consistent with active scanning or tracking behavior. A stationary individual was present in the courtyard below.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            KAPPA cross-correlated this observation with a simultaneous WiFi deauthentication event and a CPU thermal spike on the observer's device. The temporal overlap — within a 90-second window — is flagged as a HIGH confidence correlation by the engine's 22-rule ruleset.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            {[antennaImg1, antennaImg2, antennaImg3, antennaImg4].map((src, i) => (
              <div key={i}>
                <ZoomImage src={src} alt={`Parabolic antenna frame ${i + 1}`} className="w-full aspect-square object-cover" />
                <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono text-center">Frame {i + 1}</p>
              </div>
            ))}
          </div>

          <div className="p-4 border-l-4 border-green-500/60 bg-green-950/10 rounded-r-sm my-6">
            <div className="text-xs font-mono font-bold text-green-400 mb-2 uppercase tracking-widest">KAPPA Assessment — Antenna</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A rotating parabolic dish on a residential-zoned property in a coastal tourist town has no plausible civilian explanation. The dish's rotation speed and arc are consistent with a wideband directional scanner operating in the 2–6 GHz range. Combined with the simultaneous deauthentication event on the observer's device, this constitutes a multi-domain correlation indicating active RF targeting.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-mono mt-2">
            <ExternalLink className="h-3.5 w-3.5" />
            <Link href="/parabolic-antenna" className="underline underline-offset-2 hover:text-primary">Full parabolic antenna intelligence package →</Link>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Section 4: Crocs */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-4 w-4 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-foreground">Crocs — The Western Observation Post</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            "Crocs" is a bar/restaurant at the western edge of the Jacó beach strip, approximately 500 meters from Hotel Pochote Grande. It appears in surveillance network mapping because of one recurring pattern: the same individual — or individuals using the same visual signature — has been logged at Crocs during 11 of the 14 evenings when KAPPA registered elevated scores between 18:00 and 22:00.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            The Crocs position provides a direct line-of-sight to the hotel's main gate and the beach path to the east. In an urban surveillance context, this is a standard "loose" position — close enough to maintain visual contact, far enough to avoid pattern detection.
          </p>
          <div className="space-y-3 my-6">
            {[
              { label: "Correlation frequency", value: "11 of 14 high-score evenings", color: "text-red-400" },
              { label: "Avg KAPPA score during Crocs-active windows", value: "47.3 κ", color: "text-orange-400" },
              { label: "Distance to Room 10", value: "~500m (within BLE relay range)", color: "text-yellow-400" },
              { label: "Bearing from Room 10", value: "270° West", color: "text-muted-foreground" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-sm text-muted-foreground font-mono">{row.label}</span>
                <span className={`text-sm font-mono font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-8" />

        {/* Section 5: Drones */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-purple-400" />
            <h2 className="text-xl font-serif font-bold text-foreground">Drone Activity — Aerial Domain</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            Drone transits over Room 10 have been logged on 9 separate nights between May 15 and June 17, 2026. The flight profiles are consistent with multi-rotor UAVs operating at 30–80 meter altitude, passing east-to-west along the beach frontage before loitering 50–100 meters offshore and returning.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            KAPPA flags these events based on combination of acoustic detection (recorded audio showing characteristic blade frequency signatures), visual observation, and temporal correlation with WiFi anomalies logged by the Network Watchdog subsystem during the same windows.
          </p>
          <div className="p-4 border-l-4 border-purple-500/60 bg-purple-950/10 rounded-r-sm my-6">
            <div className="text-xs font-mono font-bold text-purple-400 mb-2 uppercase tracking-widest">C-UAS Assessment</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Consumer drones capable of ISR operations (DJI Mini 3 Pro class) can carry optical and thermal cameras with sufficient resolution to observe a hotel balcony at 50m. At 60m altitude and offshore position, they are below standard visual detection threshold in low-light conditions and produce ~52 dB SPL — inaudible against beach ambient noise above 40 knots.
            </p>
          </div>
          <DroneSightingsPanel />
        </section>

        <Separator className="my-8" />

        {/* Section 6: BLE / Network Forensics */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Signal className="h-4 w-4 text-blue-400" />
            <h2 className="text-xl font-serif font-bold text-foreground">BLE & Network Forensics</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            On June 7, 2026, bettercap passive BLE scanning in Room 10 recorded a −20 dBm peak at 10:50 AM. Path loss modeling of vehicle CL273123 (parked at ~45m with 2 intervening walls) predicts an expected RSSI of −116 dBm — well below the noise floor. The recorded −20 dBm requires a transmitter within approximately 1.4 meters (standard BLE class 2) or 11 centimeters (class 1, +20 dBm TX power).
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            This forensic exclusion — the truck cannot be the primary source — shifts primary suspicion to the Hotel Corner Unit directly across the courtyard, which has unobstructed path loss to Room 10 and was occupied during the spike window.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div>
              <ZoomImage src={rssiSpike} alt="RSSI spike 10:50 — June 7" className="w-full" />
              <p className="text-xs text-muted-foreground/60 mt-1 font-mono">RSSI spike at 10:50 — -20 dBm peak, June 7, 2026</p>
            </div>
            <div>
              <ZoomImage src={rssiBle} alt="BLE scan capture — bettercap" className="w-full" />
              <p className="text-xs text-muted-foreground/60 mt-1 font-mono">BLE passive scan (bettercap) — device enumeration at spike</p>
            </div>
          </div>
          <div>
            <ZoomImage src={truckImg} alt="Vehicle CL273123" className="w-full max-w-sm" />
            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">Vehicle CL273123 — BLE forensic exclusion at 45m+ with walls</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-mono mt-4">
            <ExternalLink className="h-3.5 w-3.5" />
            <Link href="/sensor-array" className="underline underline-offset-2 hover:text-primary">Full RSSI Sensor Array analysis →</Link>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Section 7: Live KAPPA Data */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-serif font-bold text-foreground">Live KAPPA Data — Right Now</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 font-serif">
            The following data is pulled live from the KAPPA engine. It updates automatically and reflects the current operational picture as of the moment you are reading this.
          </p>
          <RecentCorrelationsPanel />
          <RecentEventsTimeline />
          <FlightIntelPanel />
        </section>

        <Separator className="my-8" />

        {/* Section 8: 30-Day Assessment */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h2 className="text-xl font-serif font-bold text-foreground">30-Day Assessment</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            Taken individually, each element of the Pochote Grande picture is ambiguous. A rotating antenna could be a poorly-maintained receiver. A drone could be a tourist. A BLE spike could be a misconfigured device. An elevated KAPPA score could reflect coincident but unrelated activity.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            What makes this case different is the <em>simultaneous</em> multi-domain corroboration across signal types that have no legitimate reason to correlate: WiFi deauthentication bursting during physical observation, BLE spikes during daytime hours inconsistent with normal Bluetooth device populations, antenna rotation concurrent with device thermal events, and drone transits concentrated in evening windows that overlap with elevated KAPPA scores.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            {[
              { label: "Days monitored", value: "30", sub: "May 17 – June 17, 2026" },
              { label: "Multi-domain events", value: "9", sub: "simultaneous cross-domain spikes" },
              { label: "Antenna rotation events", value: "3", sub: "confirmed on video" },
              { label: "Drone transits logged", value: "9", sub: "nights with aerial presence" },
              { label: "BLE forensic exclusions", value: "1", sub: "truck CL273123 ruled out" },
              { label: "KAPPA peak score", value: "—", sub: "see live widget above" },
            ].map(card => (
              <div key={card.label} className="border border-border rounded-sm p-4 bg-card/30 text-center">
                <div className="text-2xl font-mono font-bold text-foreground mb-1">{card.value}</div>
                <div className="text-xs font-semibold text-foreground mb-1">{card.label}</div>
                <div className="text-[10px] text-muted-foreground/60 font-mono">{card.sub}</div>
              </div>
            ))}
          </div>

          <div className="p-5 border border-red-800/40 bg-red-950/10 rounded-sm my-6">
            <div className="text-xs font-mono font-bold text-red-400 mb-3 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" /> Working Hypothesis — KAPPA Assessment
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Pochote Grande operation exhibits characteristics consistent with a sustained, multi-actor signals intelligence collection effort against a single target in Room 10. The operational sophistication — including RF collection, BLE proximity sensing, aerial reconnaissance, and physical access — exceeds the capability profile of opportunistic criminal actors. The German-connected ownership structure, combined with the proximity of the La Flor units to the target position, suggests pre-positioned infrastructure rather than improvised surveillance.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Working adversary hypothesis (per platform operational doctrine): state-adjacent intelligence or cartel-connected logistics operation, possibly with ISP-level infrastructure access based on documented HiPerConTracer probe traffic and ePDG Liberty routing anomalies in PCAP forensics.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Footer links */}
        <section className="pb-8">
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground mb-4">Related Intelligence</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { href: "/pochote-incident", label: "Operation Pochote Grande — full incident report" },
              { href: "/parabolic-antenna", label: "Parabolic Antenna — Santa Reyes" },
              { href: "/forensic-evidence", label: "Forensic Evidence Package" },
              { href: "/sensor-array", label: "RSSI Sensor Array — Hotel Pochote Grande" },
              { href: "/forensics", label: "Network Forensics — 12 checks" },
              { href: "/network-analysis", label: "HUMINT Network Analysis" },
              { href: "/evidence", label: "Evidence Chain — SHA-256 log" },
              { href: "/board", label: "Conspiracy Board — force-directed graph" },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 border border-border/50 rounded-sm px-3 py-2 hover:border-primary/40 transition-colors">
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                {l.label}
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
