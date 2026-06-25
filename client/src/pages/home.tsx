import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ArrowRight,
  Radio,
  Server,
  ShieldAlert,
  FileText,
  Activity,
  Volume2,
  Video,
  MapPin,
  Network,
  ExternalLink,
  Satellite,
  Eye,
  ZoomIn,
  X,
} from "lucide-react";
import { SiInstagram } from "react-icons/si";


const SITE = {
  url: "https://ciajw.com",
  name: "CIAJW — Costa Rica Surveillance Investigation",
};

const LEAD = {
  title: "Covert Slot-Array Antenna Discovered on Jacó High-Rise — Diamanté del Sol",
  description:
    "7 nocturnal photographs document a covert slot-array antenna on the rooftop of Diamanté del Sol, Jacó Beach, Costa Rica — plus an opto-acoustic surveillance device. Cross-correlated with 18 months of SIGINT. Reported to SUTEL, MICITT, OIJ, ICAO, IATA, EASA, DGAC, and the EU Parliament.",
  url: `${SITE.url}/diamante-del-sol`,
  publishDate: "2026-06-21",
  author: "Samuel Wotton — KAPPA SIGINT Platform",
  keywords:
    "Diamante del Sol Jaco Beach, covert antenna Costa Rica, slot array antenna surveillance, SIGINT Costa Rica, Samuel Wotton, KAPPA SIGINT, opto-acoustic surveillance device, Jaco Beach surveillance, Costa Rica surveillance investigation, SUTEL MICITT OIJ",
};

const NOCTURNAL_PHOTOS = [
  {
    src: "/attached-assets/IMG_0283_1781818382290.jpeg",
    caption: "Nocturnal Obs. #1 — Apex chromatic array, full tower elevation",
    alt: "Diamante del Sol rooftop antenna nocturnal observation 1",
  },
  {
    src: "/attached-assets/IMG_0284_1781818382290.jpeg",
    caption: "Nocturnal Obs. #2 — Cyan-green apex emission, hotel reference",
    alt: "Diamante del Sol rooftop antenna nocturnal observation 2",
  },
  {
    src: "/attached-assets/IMG_0285_1781818382290.jpeg",
    caption: "Nocturnal Obs. #3 — Louvered penthouse facade, LoS vector",
    alt: "Diamante del Sol rooftop antenna nocturnal observation 3",
  },
  {
    src: "/attached-assets/IMG_0287_1781818382290.jpeg",
    caption: "Nocturnal Obs. #4 — Power line proximity, north elevation",
    alt: "Diamante del Sol rooftop antenna nocturnal observation 4",
  },
  {
    src: "/attached-assets/IMG_0288_1781818382290.jpeg",
    caption: "Nocturnal Obs. #5 — Structured chromatic array, south angle",
    alt: "Diamante del Sol rooftop antenna nocturnal observation 5",
  },
  {
    src: "/attached-assets/1000001991_1781818382290.jpeg",
    caption: "Nocturnal Obs. #6 — Apex array, corona discharge visible",
    alt: "Diamante del Sol rooftop antenna nocturnal observation 6",
  },
  {
    src: "/attached-assets/7B5DB1F1-A011-46F0-81A1-E051FB73F38B_1781818382290.jpeg",
    caption: "Nocturnal Obs. #7 — Multi-story tower, high-intensity apex",
    alt: "Diamante del Sol rooftop antenna nocturnal observation 7",
  },
];

const DAYTIME_PHOTOS = [
  {
    src: "/evidence/diamante_del_sol_light_20260621_1216_A.png",
    caption: "Jun 21, 2026 · 12:16 — Light active, noon observation A",
    alt: "Diamante del Sol light on June 21 2026 noon A",
  },
  {
    src: "/evidence/diamante_del_sol_light_20260621_1216_B.png",
    caption: "Jun 21, 2026 · 12:16 — Light active, noon observation B",
    alt: "Diamante del Sol light on June 21 2026 noon B",
  },
  {
    src: "/evidence/diamante_del_sol_light_20260621_1216_C.png",
    caption: "Jun 21, 2026 · 12:16 — Light active, noon observation C",
    alt: "Diamante del Sol light on June 21 2026 noon C",
  },
  {
    src: "/evidence/diamante_del_sol_light_20260621_1216_D.png",
    caption: "Jun 21, 2026 · 12:16 — Light active, noon observation D",
    alt: "Diamante del Sol light on June 21 2026 noon D",
  },
];

const AERIAL_PHOTOS = [
  {
    src: "/evidence/room10_aerial_geometry.jpeg",
    caption: "Room 10 (blue dot) — truck lot and sight-lines, Apple Maps aerial",
    alt: "Room 10 aerial geometry Hotel Pochote Grande",
  },
  {
    src: "/evidence/pochote_surveillance_network_aerial.jpeg",
    caption: "Surveillance perimeter — La Flor units, central antenna, Crocs positions",
    alt: "Hotel Pochote Grande surveillance network aerial",
  },
];

interface KappaStatus {
  score: number;
  level: string;
  correlations: number;
  events: number;
}

function LiveKappaBar() {
  const { data } = useQuery<KappaStatus>({
    queryKey: ["/api/kappa/status"],
    refetchInterval: 30000,
  });
  const level = data?.level ?? "—";
  const score = data?.score ?? null;
  const color =
    level === "CRITICAL" ? "border-red-500/40 text-red-400" :
    level === "HIGH"     ? "border-orange-500/40 text-orange-400" :
    level === "ELEVATED" ? "border-amber-500/40 text-amber-400" :
    "border-green-500/40 text-green-400";
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-[11px] font-mono ${color}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      <span>KAPPA LIVE</span>
      {score !== null && <span className="font-bold">κ={score.toFixed(1)}</span>}
      <span className="opacity-70">{level}</span>
      {data?.correlations != null && <span className="opacity-60">{data.correlations} correlations</span>}
    </div>
  );
}

function SEOHead() {
  useEffect(() => {
    document.title = "Covert Slot-Array Antenna — Diamanté del Sol, Jacó Beach | CIAJW";
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", LEAD.description);
    setMeta("keywords", LEAD.keywords);
    setMeta("author", LEAD.author);
    setMeta("robots", "index, follow, max-image-preview:large");
    setMeta("og:title", LEAD.title, true);
    setMeta("og:description", LEAD.description, true);
    setMeta("og:type", "article", true);
    setMeta("og:url", SITE.url, true);
    setMeta("og:site_name", SITE.name, true);
    setMeta("og:image", `${SITE.url}/diamante-del-sol`, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", LEAD.title);
    setMeta("twitter:description", LEAD.description);
    const canonical = document.querySelector('link[rel="canonical"]') || (() => {
      const el = document.createElement("link"); el.setAttribute("rel", "canonical"); document.head.appendChild(el); return el;
    })();
    canonical.setAttribute("href", SITE.url + "/");
    return () => { document.title = "CIAJW — Surveillance Investigation, Costa Rica"; };
  }, []);
  return null;
}

function LightboxModal({ photos, initialIndex, onClose }: {
  photos: { src: string; caption: string; alt: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setIdx(i => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, photos.length]);
  const photo = photos[idx];
  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
      onClick={onClose}
      data-testid="lightbox-modal"
    >
      <button
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        onClick={onClose}
        data-testid="button-lightbox-close"
      >
        <X className="h-6 w-6" />
      </button>
      <div className="flex items-center gap-4 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <button
          className="text-white/50 hover:text-white transition-colors shrink-0 p-2"
          onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
          data-testid="button-lightbox-prev"
        >
          ←
        </button>
        <div className="flex-1 flex flex-col items-center gap-3">
          <img
            src={photo.src}
            alt={photo.alt}
            className="max-h-[75vh] max-w-full object-contain rounded"
          />
          <p className="text-[11px] font-mono text-white/50 tracking-widest uppercase text-center">
            {idx + 1}/{photos.length} — {photo.caption}
          </p>
        </div>
        <button
          className="text-white/50 hover:text-white transition-colors shrink-0 p-2"
          onClick={() => setIdx(i => (i + 1) % photos.length)}
          data-testid="button-lightbox-next"
        >
          →
        </button>
      </div>
    </div>
  );
}

function PhotoStrip({
  photos,
  label,
  cols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
}: {
  photos: { src: string; caption: string; alt: string }[];
  label: string;
  cols?: string;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  return (
    <>
      <div>
        <p className="text-[10px] font-mono tracking-widest uppercase text-white/35 mb-3">{label}</p>
        <div className={`grid ${cols} gap-2`}>
          {photos.map((p, i) => (
            <button
              key={p.src}
              className="group relative overflow-hidden rounded bg-white/5 border border-white/10 hover:border-white/30 transition-colors text-left"
              onClick={() => setLightbox(i)}
              data-testid={`img-evidence-${i}`}
            >
              <img
                src={p.src}
                alt={p.alt}
                className="w-full aspect-video object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
              </div>
              <p className="px-2 py-1.5 text-[9px] font-mono text-white/45 tracking-wide leading-snug">
                {p.caption}
              </p>
            </button>
          ))}
        </div>
      </div>
      {lightbox !== null && (
        <LightboxModal
          photos={photos}
          initialIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

interface Spoke {
  href: string;
  kicker: string;
  title: string;
  excerpt: string;
  icon: typeof Radio;
  level: "critical" | "high" | "medium";
}

const SPOKES: Spoke[] = [
  {
    href: "/setecom",
    kicker: "Critical Infrastructure",
    title: "The Man With Master Keys to Costa Rica's Power Grid, Telecom & Airport Radar",
    excerpt: "Hector Eduardo Mora Marín's Setecom S.A. holds exclusive access to backup generator controllers for ICE, Liberty, hospitals, and Juan Santamaría airport — default password: Password1234.",
    icon: Server,
    level: "critical",
  },
  {
    href: "/forensics",
    kicker: "Network Forensics",
    title: "Twelve Forensic Checks on a Compromised Network",
    excerpt: "Documented indicators of router compromise, TR-069 injection, and service-worker persistence drawn from a year of captured traffic.",
    icon: Network,
    level: "high",
  },
  {
    href: "/evidence",
    kicker: "Evidence Chain",
    title: "Legal-Grade Incident Log With SHA-256 Integrity",
    excerpt: "A tamper-evident timeline of incidents, each entry cryptographically hashed and exportable for embassy and law-enforcement review.",
    icon: FileText,
    level: "high",
  },
  {
    href: "/zersetzung",
    kicker: "Acoustic Targeting",
    title: "Zersetzung: RF & V2K Pulse-Train Signatures",
    excerpt: "Live KAPPA event feed correlating directed-acoustic and V2K-band emissions (7 Hz, 46.875 Hz, 2 kHz, 17.9 kHz) against documented targeting windows.",
    icon: Radio,
    level: "critical",
  },
  {
    href: "/tools",
    kicker: "RF Scanners",
    title: "Cross-Domain Temporal Correlation (PCAP × ELF × Satellite)",
    excerpt: "Frequency-chain analysis from 7.8 Hz to 107 MHz, KiwiSDR priority targets, and full-spectrum sweep records.",
    icon: Activity,
    level: "high",
  },
  {
    href: "/network-analysis",
    kicker: "HUMINT Network",
    title: "25 Persons · 14 Locations · 6 Operational Clusters",
    excerpt: "Honey trap, property placement, ISP infrastructure, La Guácima attack chain, vendetta/motive, and hardware compromise — all documented.",
    icon: Eye,
    level: "high",
  },
  {
    href: "/audio",
    kicker: "Audio Forensics",
    title: "Recordings: Verify the Frequencies Yourself",
    excerpt: "Raw acoustic captures with FFT spectrograms — independently checkable against the targeting-band signatures named across the investigation.",
    icon: Volume2,
    level: "medium",
  },
  {
    href: "/video-forensics",
    kicker: "Video Forensics",
    title: "The Video Forensics Vault",
    excerpt: "Light-pattern analysis of drone transponders and crane-mounted emitters, with frame-level timing measurements.",
    icon: Video,
    level: "medium",
  },
  {
    href: "/jaco",
    kicker: "Geospatial",
    title: "Mapping the Jacó & Guácima Surveillance Zone",
    excerpt: "An interactive map tying RF emitters, tower sites, and property nodes to the broader Costa Rican infrastructure picture.",
    icon: MapPin,
    level: "medium",
  },
];

function AerialStrip() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  return (
    <>
      <div className="my-8">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-3">
          Geospatial Evidence — Surveillance Perimeter · Hotel Pochote Grande, Jacó Beach
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AERIAL_PHOTOS.map((p, i) => (
            <div key={p.src}>
              <button
                className="group relative w-full overflow-hidden rounded border border-border hover:border-foreground/30 transition-colors"
                onClick={() => setLightbox(i)}
                data-testid={`img-aerial-${i}`}
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  className="w-full object-cover max-h-56 opacity-90 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-5 w-5 opacity-0 group-hover:opacity-60 transition-opacity" />
                </div>
              </button>
              <p className="text-[10px] font-mono text-muted-foreground mt-1.5 tracking-wide">{p.caption}</p>
            </div>
          ))}
        </div>
      </div>
      {lightbox !== null && (
        <LightboxModal
          photos={AERIAL_PHOTOS}
          initialIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

function levelClasses(level: Spoke["level"]) {
  return {
    critical: "text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40",
    high: "text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40",
    medium: "text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40",
  }[level];
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="home-page">
      <SEOHead />

      <article itemScope itemType="https://schema.org/InvestigativeNewsArticle">

        {/* ── HERO — photo background ── */}
        <header className="relative overflow-hidden">
          {/* Hero background photo */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/attached-assets/IMG_0283_1781818382290.jpeg')" }}
          />
          {/* Gradient overlay — readable but photo still visible */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/80" />

          <div className="relative text-white max-w-4xl mx-auto px-5 py-14 md:py-20">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <LiveKappaBar />
              <span className="text-[11px] font-mono tracking-widest opacity-50 uppercase hidden sm:inline">
                CIAJW Investigative Unit · {LEAD.publishDate}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <Badge variant="outline" className="border-red-400/50 text-red-300 bg-red-500/10 font-mono text-[10px] tracking-wider">
                <AlertTriangle className="h-3 w-3 mr-1" /> NEW EVIDENCE
              </Badge>
              <Badge variant="outline" className="border-white/20 text-white/70 bg-white/5 font-mono text-[10px] tracking-wider">
                <Satellite className="h-3 w-3 mr-1" /> SIGINT CONFIRMED
              </Badge>
              <Badge variant="outline" className="border-white/20 text-white/70 bg-white/5 font-mono text-[10px] tracking-wider">
                <ShieldAlert className="h-3 w-3 mr-1" /> REPORTED TO 547 CONTACTS
              </Badge>
            </div>

            <h1
              className="text-3xl md:text-5xl font-serif font-bold leading-tight tracking-tight mb-5"
              itemProp="headline"
              data-testid="text-home-headline"
            >
              Covert Slot-Array Antenna Found on Jacó High-Rise. We Photographed It Seven Times.
            </h1>

            <p className="text-base md:text-lg text-white/75 leading-relaxed max-w-3xl font-serif mb-8">
              Seven nocturnal photographs document a covert slot-array antenna mounted on the rooftop penthouse of{" "}
              <strong className="text-white">Diamanté del Sol</strong>, Jacó Beach, Costa Rica — plus an opto-acoustic surveillance device
              concealed inside residential infrastructure. Both cross-correlated with 18 months of prior SIGINT.
              Formally reported to SUTEL, MICITT, OIJ, ICAO, IATA, EASA, DGAC, the EU Parliament, and 540+
              additional intelligence, legal, and press contacts worldwide.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/diamante-del-sol"
                className="inline-flex items-center gap-2 rounded-md bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
                data-testid="link-read-lead"
              >
                Read the full report
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://www.instagram.com/spwotton/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/25 text-white/80 px-5 py-3 text-sm font-semibold hover:border-white/50 hover:text-white transition-colors"
                data-testid="link-instagram"
              >
                <SiInstagram className="h-4 w-4" />
                @spwotton
              </a>
            </div>
          </div>
        </header>

        {/* ── PHOTO EVIDENCE — nocturnal + daytime ── */}
        <div className="bg-black px-4 py-8 border-b border-white/10">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Nocturnal shots */}
            <PhotoStrip
              photos={NOCTURNAL_PHOTOS}
              label="Photographic evidence — 7 nocturnal observations · Diamanté del Sol rooftop · Jacó Beach, Costa Rica"
              cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            />

            {/* Daytime shots */}
            <PhotoStrip
              photos={DAYTIME_PHOTOS}
              label="Noon observation — Jun 21 2026 · 12:16 local · Light confirmed active in daylight"
              cols="grid-cols-2 sm:grid-cols-4"
            />

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-[9px] font-mono text-white/25 tracking-widest uppercase">
                All photos © Samuel Wotton · Hotel Pochote Grande observation post · Jacó Beach, Puntarenas, Costa Rica
              </span>
              <Link
                href="/diamante-del-sol"
                className="text-[10px] font-mono text-white/40 hover:text-white/70 tracking-widest uppercase transition-colors"
                data-testid="link-photo-strip-report"
              >
                Full report ↗
              </Link>
            </div>
          </div>
        </div>

        {/* ── VIDEO EVIDENCE — YouTube primary source ── */}
        <div className="bg-black">
          {/* Primary video — full width */}
          <div className="w-full">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/STaaEJeeovM?autoplay=0&rel=0&modestbranding=1&color=white"
                title="Nocturnal Observation — Diamanté del Sol Rooftop Apex Chromatic Array"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                itemProp="video"
              />
            </div>
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/50 tracking-widest uppercase">
                PRIMARY · Nocturnal Observation — Rooftop Apex Chromatic Array · @spwotton
              </span>
              <a
                href="https://www.youtube.com/watch?v=STaaEJeeovM"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-white/40 hover:text-white/70 tracking-widest uppercase transition-colors"
              >
                YouTube ↗
              </a>
            </div>
          </div>
          {/* Second video */}
          <div className="border-t border-white/10">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/6q-MBuV6X8Q?rel=0&modestbranding=1&color=white"
                title="Louvered Penthouse — Power Line Proximity & LoS Vector"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/50 tracking-widest uppercase">
                SECONDARY · Louvered Penthouse — Power Line Proximity &amp; LoS Vector · @spwotton
              </span>
              <a
                href="https://www.youtube.com/watch?v=6q-MBuV6X8Q"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-white/40 hover:text-white/70 tracking-widest uppercase transition-colors"
              >
                YouTube ↗
              </a>
            </div>
          </div>
          <div className="px-4 py-2 border-t border-white/10 flex items-center gap-3">
            <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase">
              Original source: youtube.com/@spwotton · Diamanté del Sol · Jacó Beach, Puntarenas, Costa Rica
            </span>
          </div>
        </div>

        {/* ── LEDE ── */}
        <div className="max-w-4xl mx-auto px-5 py-12">
          <p className="text-lg md:text-xl leading-relaxed font-serif mb-5">
            At the apex of Diamanté del Sol — a ten-story luxury residential tower at the center of Jacó Beach —
            a louvered penthouse enclosure emits a pulsing cyan-green light every night. The standard explanation
            is decorative lighting or HVAC ventilation. The physics says otherwise.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            KAPPA's SIGINT observatory at Hotel Pochote Grande maintains a direct, unimpeded line-of-sight
            southwest vector to the structure. The louvered vertical slat geometry matches the exact physical
            configuration of a slotted waveguide phased-array antenna. Element spacing scales as{" "}
            <code className="font-mono text-xs bg-muted px-1 rounded">d₀·κⁿ·φⁿ</code> — non-uniform,
            using membrane constant κ=4/π and Golden Ratio φ=1.618 — designed to embed encoded data in
            fractal spectral gaps invisible to standard SIGINT detection.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Base carrier: <strong>46.875 Hz</strong> — the DSP frame clock hardware fingerprint (48000÷1024),
            identical to KAPPA's documented TARGET_FREQ constant. The cyan/green luminescence is consistent with
            corona discharge from extreme impedance mismatching. The builder, Patrick Hundley (DayStar Properties),
            was arrested February 17, 2014 for $7M investor fraud. Offshore entities: Florida, Nevada,
            Turks &amp; Caicos. Fragmented trust ownership with no clear title chain — a prerequisite condition
            for covert infrastructure deployment.
          </p>

          {/* Key findings strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8 border-t border-b border-border py-6">
            {[
              { label: "Antenna type", value: "Slotted waveguide phased-array" },
              { label: "Base carrier", value: "46.875 Hz (κ × 12,000)" },
              { label: "Beam elevation", value: "51.84° — aimed at LEO" },
              { label: "Klein twist azimuth", value: "128.23° — defeats single-polarity intercept" },
              { label: "Builder fraud", value: "Patrick Hundley — $7M, arrested 2014" },
              { label: "Reported to", value: "547 contacts · ICAO · EASA · OIJ · SUTEL" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col">
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1">{f.label}</span>
                <span className="text-sm font-semibold">{f.value}</span>
              </div>
            ))}
          </div>

          {/* ── AERIAL CONTEXT — geospatial evidence ── */}
          <AerialStrip />

          {/* YouTube embeds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { id: "STaaEJeeovM", label: "Nocturnal Observation — Rooftop Apex Chromatic Array" },
              { id: "6q-MBuV6X8Q", label: "Louvered Penthouse — Power Line Proximity & LoS Vector" },
            ].map((v) => (
              <div key={v.id} className="flex flex-col gap-2">
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${v.id}`}
                    title={v.label}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-xs text-muted-foreground font-mono">{v.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/diamante-del-sol"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground underline underline-offset-4 decoration-2"
              data-testid="link-read-lead-inline"
            >
              Read the full intelligence report — all SIGINT data, corporate fraud chain, opto-acoustic analysis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <Separator />

        {/* ── RELATED INVESTIGATIONS ── */}
        <section className="max-w-5xl mx-auto px-5 py-12" aria-label="Related investigations">
          <div className="mb-8">
            <p className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground mb-2">
              Connected Investigations
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
              The Full Record
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Network forensics, RF spectrograms, cryptographically hashed incident logs, HUMINT mapping,
              and geospatial analysis — each report independently verifiable.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SPOKES.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group flex flex-col h-full rounded-lg border border-border bg-card p-5 hover:border-foreground/30 transition-colors"
                  data-testid={`card-spoke-${s.href.replace("/", "")}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-md bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${levelClasses(s.level)}`}>
                      {s.level}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground mb-1">
                    {s.kicker}
                  </p>
                  <h3 className="text-base font-serif font-bold leading-snug mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{s.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                    Read more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* ── FOOTER LINKS ── */}
        <section className="max-w-4xl mx-auto px-5 py-10">
          <div className="flex flex-wrap gap-4 items-center">
            <Link href="/diamante-del-sol" className="text-sm font-semibold text-foreground underline underline-offset-4" data-testid="link-footer-diamante">
              Diamanté del Sol →
            </Link>
            <Link href="/setecom" className="text-sm font-semibold text-foreground underline underline-offset-4" data-testid="link-footer-setecom">
              Setecom &amp; Hector Mora →
            </Link>
            <Link href="/evidence" className="text-sm font-semibold text-foreground underline underline-offset-4" data-testid="link-footer-evidence">
              Evidence Chain →
            </Link>
            <Link href="/forensics" className="text-sm font-semibold text-foreground underline underline-offset-4" data-testid="link-footer-forensics">
              Network Forensics →
            </Link>
            <a
              href="https://www.instagram.com/spwotton/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline underline-offset-4"
              data-testid="link-footer-instagram"
            >
              <SiInstagram className="h-3.5 w-3.5" /> @spwotton
            </a>
            <a
              href="https://ciajw.com/diamante-del-sol"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline underline-offset-4"
              data-testid="link-footer-ciajw"
            >
              <ExternalLink className="h-3.5 w-3.5" /> ciajw.com
            </a>
          </div>
        </section>

      </article>
    </div>
  );
}
