import { useEffect } from "react";
import { Link } from "wouter";
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
} from "lucide-react";

const heroImage = "/assets/setecom-hero.png";

const SITE = {
  url: "https://ciajw.com",
  name: "CIAJW — Costa Rica Critical Infrastructure & Surveillance Investigation",
};

const LEAD = {
  title:
    "Hector Eduardo Mora Marín & Setecom S.A.: The Single Company With Root Access to Costa Rica's Power Grid, Telecom, and Airport Radar",
  description:
    "Investigation into Hector Eduardo Mora Marín (HMORA67) and Setecom S.A. — the exclusive Deep Sea Electronics distributor whose default credentials and cleartext Modbus TCP exposure place ICE, Liberty, hospitals, and Juan Santamaría International Airport radar behind a single point of failure.",
  url: `${SITE.url}/setecom`,
  publishDate: "2026-05-23",
  author: "CIAJW Investigative Unit",
  keywords:
    "Hector Mora Marin, Hector Eduardo Mora Marin, HMORA67, Setecom SA, Setecom Costa Rica, Deep Sea Electronics Costa Rica, DSE distributor Costa Rica, Modbus TCP 502, SCADA default credentials, ICE Costa Rica generator security, Liberty CR infrastructure, SJO radar, Juan Santamaría airport, Costa Rica critical infrastructure investigation",
};

function SEOHead() {
  useEffect(() => {
    document.title =
      "Hector Eduardo Mora Marín & Setecom S.A. — Critical Infrastructure Investigation | CIAJW";

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", LEAD.description);
    setMeta("keywords", LEAD.keywords);
    setMeta("author", LEAD.author);
    setMeta("robots", "index, follow, max-image-preview:large");
    setMeta("og:title", LEAD.title, true);
    setMeta("og:description", LEAD.description, true);
    setMeta("og:type", "website", true);
    setMeta("og:url", SITE.url, true);
    setMeta("og:site_name", SITE.name, true);
    setMeta("og:image", `${SITE.url}/assets/setecom-hero.png`, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", LEAD.title);
    setMeta("twitter:description", LEAD.description);
    setMeta("twitter:image", `${SITE.url}/assets/setecom-hero.png`);

    const canonical =
      document.querySelector('link[rel="canonical"]') ||
      (() => {
        const el = document.createElement("link");
        el.setAttribute("rel", "canonical");
        document.head.appendChild(el);
        return el;
      })();
    canonical.setAttribute("href", SITE.url + "/");

    const graph = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${SITE.url}/#website`,
          url: SITE.url,
          name: "CIAJW",
          description: SITE.name,
          publisher: { "@id": `${SITE.url}/#org` },
        },
        {
          "@type": "Organization",
          "@id": `${SITE.url}/#org`,
          name: "CIAJW Investigative Unit",
          url: SITE.url,
          logo: { "@type": "ImageObject", url: `${SITE.url}/favicon.png` },
        },
        {
          "@type": "InvestigativeNewsArticle",
          "@id": `${SITE.url}/#lead`,
          headline: LEAD.title,
          description: LEAD.description,
          datePublished: LEAD.publishDate,
          dateModified: LEAD.publishDate,
          author: { "@id": `${SITE.url}/#org` },
          publisher: { "@id": `${SITE.url}/#org` },
          mainEntityOfPage: { "@type": "WebPage", "@id": LEAD.url },
          image: `${SITE.url}/assets/setecom-hero.png`,
          keywords: LEAD.keywords,
          isPartOf: { "@id": `${SITE.url}/#website` },
          about: [
            {
              "@type": "Person",
              name: "Hector Eduardo Mora Marín",
              alternateName: ["Hector Mora", "Héctor Mora Marín", "HMORA67"],
              jobTitle: "Executive Director, Setecom S.A.",
              worksFor: { "@type": "Organization", name: "Setecom S.A." },
            },
            {
              "@type": "Organization",
              name: "Setecom S.A.",
              description:
                "Costa Rica exclusive Deep Sea Electronics (DSE) distributor and critical-infrastructure contractor",
              location: { "@type": "Place", name: "Heredia, Costa Rica" },
            },
          ],
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE.url,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Setecom S.A. Investigation",
              item: LEAD.url,
            },
          ],
        },
      ],
    };

    let scriptEl = document.querySelector("script[data-home-ld]");
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.setAttribute("type", "application/ld+json");
      scriptEl.setAttribute("data-home-ld", "home");
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(graph);

    return () => {
      document.title = "CIAJW.com — Documented Surveillance Harassment in Costa Rica";
      document.querySelector("script[data-home-ld]")?.remove();
    };
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
    href: "/forensics",
    kicker: "Network Forensics",
    title: "Twelve Forensic Checks on a Compromised Network",
    excerpt:
      "Documented indicators of router compromise, TR-069 injection, and service-worker persistence drawn from a year of captured traffic.",
    icon: Network,
    level: "high",
  },
  {
    href: "/evidence",
    kicker: "Evidence Chain",
    title: "Legal-Grade Incident Log With SHA-256 Integrity",
    excerpt:
      "A tamper-evident timeline of incidents, each entry cryptographically hashed and exportable for embassy and law-enforcement review.",
    icon: FileText,
    level: "high",
  },
  {
    href: "/zersetzung",
    kicker: "Acoustic Targeting",
    title: "Zersetzung: RF & V2K Pulse-Train Signatures",
    excerpt:
      "Live KAPPA event feed correlating directed-acoustic and V2K-band emissions (7 Hz, 46.875 Hz, 2 kHz, 17.9 kHz) against documented targeting windows.",
    icon: Radio,
    level: "critical",
  },
  {
    href: "/tools",
    kicker: "RF Scanners",
    title: "Cross-Domain Temporal Correlation (PCAP × ELF × Satellite)",
    excerpt:
      "Frequency-chain analysis from 7.8 Hz to 107 MHz, KiwiSDR priority targets, and full-spectrum sweep records.",
    icon: Activity,
    level: "high",
  },
  {
    href: "/cristina",
    kicker: "Field Investigation",
    title: "Suites Cristina: Property Placement & Infrastructure",
    excerpt:
      "How a network of properties, ISPs, and hardware deployments maps onto the documented surveillance footprint in Guácima and Jacó.",
    icon: MapPin,
    level: "medium",
  },
  {
    href: "/audio",
    kicker: "Audio Forensics",
    title: "Recordings: Verify the Frequencies Yourself",
    excerpt:
      "Raw acoustic captures with FFT spectrograms — independently checkable against the targeting-band signatures named across the investigation.",
    icon: Volume2,
    level: "medium",
  },
  {
    href: "/video-forensics",
    kicker: "Video Forensics",
    title: "The Video Forensics Vault",
    excerpt:
      "Light-pattern analysis of drone transponders and crane-mounted emitters, with frame-level timing measurements.",
    icon: Video,
    level: "medium",
  },
  {
    href: "/jaco",
    kicker: "Geospatial",
    title: "Mapping the Jacó & Guácima Surveillance Zone",
    excerpt:
      "An interactive map tying RF emitters, tower sites, and property nodes to the broader Costa Rican infrastructure picture.",
    icon: MapPin,
    level: "medium",
  },
];

function levelClasses(level: Spoke["level"]) {
  return {
    critical:
      "text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40",
    high: "text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40",
    medium:
      "text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40",
  }[level];
}

export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-testid="home-page"
    >
      <SEOHead />

      <article itemScope itemType="https://schema.org/InvestigativeNewsArticle">
        {/* HERO */}
        <header className="relative bg-foreground text-background overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px),
                repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px)`,
            }}
          />
          <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-[11px] font-mono tracking-widest opacity-60 uppercase">
                CIAJW Investigative Unit
              </span>
              <span className="text-[11px] font-mono tracking-widest opacity-40">
                —
              </span>
              <time
                className="text-[11px] font-mono tracking-widest opacity-60"
                dateTime={LEAD.publishDate}
              >
                Lead Investigation
              </time>
            </div>
            <h1
              className="text-3xl md:text-5xl font-serif font-bold leading-tight tracking-tight mb-6"
              itemProp="headline"
              data-testid="text-home-headline"
            >
              The Man With Master Keys to Costa Rica's Power Grid, Telecom
              Network, and Airport Radar
            </h1>
            <p
              className="text-lg md:text-xl opacity-70 leading-relaxed max-w-3xl font-serif"
              itemProp="description"
            >
              <strong>Hector Eduardo Mora Marín</strong> runs a small company in
              Heredia called <strong>Setecom S.A.</strong> Through an exclusive
              distribution deal with a British hardware manufacturer, his firm
              holds root-level access to the backup generator systems of ICE,
              Liberty, hospitals, and the radar infrastructure at Juan Santamaría
              International Airport. The default password is{" "}
              <code className="font-mono text-background/90 bg-background/10 px-1 rounded">
                Password1234
              </code>
              .
            </p>
            <div className="flex flex-wrap gap-2 mt-8">
              <Badge
                variant="outline"
                className="border-red-400/50 text-red-200 bg-red-500/10 font-mono text-[10px] tracking-wider"
              >
                <AlertTriangle className="h-3 w-3 mr-1" /> NATIONAL INFRASTRUCTURE
                RISK
              </Badge>
              <Badge
                variant="outline"
                className="border-background/30 text-background/80 bg-background/10 font-mono text-[10px] tracking-wider"
              >
                <Server className="h-3 w-3 mr-1" /> MODBUS:502 EXPOSED
              </Badge>
              <Badge
                variant="outline"
                className="border-background/30 text-background/80 bg-background/10 font-mono text-[10px] tracking-wider"
              >
                <ShieldAlert className="h-3 w-3 mr-1" /> SCADA DEFAULT CREDENTIALS
              </Badge>
            </div>
            <div className="mt-10">
              <Link
                href="/setecom"
                className="inline-flex items-center gap-2 rounded-md bg-background text-foreground px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
                data-testid="link-read-lead"
              >
                Read the full investigation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* HERO PHOTOGRAPH */}
        <div className="w-full bg-black">
          <img
            src={heroImage}
            alt="Costa Rica telecommunications tower and electrical substation at dusk — the infrastructure maintained by Setecom S.A. and Hector Eduardo Mora Marín under exclusive Deep Sea Electronics contract"
            className="w-full max-h-[480px] object-cover opacity-90"
            itemProp="image"
            loading="eager"
            width={1600}
            height={900}
          />
        </div>

        {/* LEDE */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-lg md:text-xl leading-relaxed text-foreground font-serif mb-6">
            In Costa Rica, a country of five million people served by a single
            national electrical utility and a consolidated telecom market, the
            fragility of critical infrastructure is less a matter of cyberwar
            sophistication and more a matter of vendor lock-in. When one company
            — Setecom S.A., led by{" "}
            <strong>Hector Eduardo Mora Marín</strong> — holds the exclusive
            contract to maintain and remotely access the backup generator
            controllers for the national grid, the cellular network, and the
            country's busiest airport, and trains its engineers to deploy
            equipment using default credentials that are never changed, the
            resulting attack surface is documented, enumerable, and wide open.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-8">
            CIAJW is an open investigation into that exposure and the wider
            pattern of surveillance and harassment surrounding it. Below: the
            connected reports, each independently verifiable.
          </p>

          <Link
            href="/setecom"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground underline underline-offset-4 decoration-2"
            data-testid="link-read-lead-inline"
          >
            Continue to the Setecom &amp; Hector Mora Marín investigation
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <Separator />

        {/* SPOKES — RELATED INVESTIGATIONS */}
        <section className="max-w-5xl mx-auto px-6 py-12" aria-label="Related investigations">
          <div className="mb-8">
            <p className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground mb-2">
              More Investigations
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
              The Connected Record
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Each report stands on its own evidence — network captures,
              cryptographically hashed incident logs, RF spectrograms, and
              geospatial mapping — and links back to the Setecom core.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SPOKES.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group flex flex-col h-full rounded-lg border border-border bg-card p-5 hover-elevate transition-colors"
                  data-testid={`card-spoke-${s.href.replace("/", "")}`}
                >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-md bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${levelClasses(
                          s.level,
                        )}`}
                      >
                        {s.level}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground mb-1">
                      {s.kicker}
                    </p>
                    <h3 className="text-base font-serif font-bold leading-snug mb-2">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {s.excerpt}
                    </p>
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

        {/* CLOSING / INTERNAL LINK BLOCK */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-xl font-serif font-bold tracking-tight mb-4">
            About this investigation
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            CIAJW documents a multi-vector pattern of critical-infrastructure
            exposure and surveillance harassment in Costa Rica, centered on{" "}
            <strong>Hector Eduardo Mora Marín</strong> and{" "}
            <strong>Setecom S.A.</strong>, the country's exclusive Deep Sea
            Electronics distributor. The record is built from network forensics,
            radio-frequency correlation, audio and video evidence, and a
            tamper-evident incident chain — all collected and continuously
            updated by the KAPPA platform.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/setecom"
              className="text-sm font-semibold text-foreground underline underline-offset-4"
              data-testid="link-footer-setecom"
            >
              Setecom &amp; Hector Mora Marín →
            </Link>
            <Link
              href="/evidence"
              className="text-sm font-semibold text-foreground underline underline-offset-4"
              data-testid="link-footer-evidence"
            >
              Evidence Chain →
            </Link>
            <Link
              href="/forensics"
              className="text-sm font-semibold text-foreground underline underline-offset-4"
              data-testid="link-footer-forensics"
            >
              Network Forensics →
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}
