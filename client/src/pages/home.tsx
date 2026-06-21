import { useEffect } from "react";
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

        {/* ── HERO ── */}
        <header className="relative bg-foreground text-background overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px),
                repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px)`,
            }}
          />
          <div className="relative max-w-4xl mx-auto px-5 py-14 md:py-20">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <LiveKappaBar />
              <span className="text-[11px] font-mono tracking-widest opacity-50 uppercase hidden sm:inline">
                CIAJW Investigative Unit · {LEAD.publishDate}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <Badge variant="outline" className="border-red-400/50 text-red-200 bg-red-500/10 font-mono text-[10px] tracking-wider">
                <AlertTriangle className="h-3 w-3 mr-1" /> NEW EVIDENCE
              </Badge>
              <Badge variant="outline" className="border-background/30 text-background/80 bg-background/10 font-mono text-[10px] tracking-wider">
                <Satellite className="h-3 w-3 mr-1" /> SIGINT CONFIRMED
              </Badge>
              <Badge variant="outline" className="border-background/30 text-background/80 bg-background/10 font-mono text-[10px] tracking-wider">
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

            <p className="text-base md:text-lg opacity-75 leading-relaxed max-w-3xl font-serif mb-8">
              Seven nocturnal photographs document a covert slot-array antenna mounted on the rooftop penthouse of{" "}
              <strong>Diamanté del Sol</strong>, Jacó Beach, Costa Rica — plus an opto-acoustic surveillance device
              concealed inside residential infrastructure. Both cross-correlated with 18 months of prior SIGINT.
              Formally reported to SUTEL, MICITT, OIJ, ICAO, IATA, EASA, DGAC, the EU Parliament, and 540+
              additional intelligence, legal, and press contacts worldwide.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/diamante-del-sol"
                className="inline-flex items-center gap-2 rounded-md bg-background text-foreground px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
                data-testid="link-read-lead"
              >
                Read the full report
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://www.instagram.com/spwotton/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-background/30 text-background/80 px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
                data-testid="link-instagram"
              >
                <SiInstagram className="h-4 w-4" />
                @spwotton
              </a>
            </div>
          </div>
        </header>


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
