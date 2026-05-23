import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import setecomHero from "@assets/setecom-hero.png";
import setecomInfraMap from "@assets/setecom-infrastructure-map.png";
import setecomCredentials from "@assets/setecom-credentials.png";
import setecomCRMap from "@assets/setecom-costa-rica-map.png";
import setecomRFCorrelation from "@assets/setecom-rf-correlation.png";
import {
  AlertTriangle,
  Radio,
  Shield,
  Server,
  Wifi,
  Zap,
  Eye,
  Lock,
  Globe,
  Building2,
  CircuitBoard,
  Plane,
} from "lucide-react";

const ARTICLE_META = {
  title: "SETECOM S.A.: The Single Company With Root Access to Costa Rica's Power Grid, Telecom, and Airport Radar",
  description:
    "An investigative profile of Hector Eduardo Mora Marín and Setecom S.A. — the exclusive Deep Sea Electronics distributor whose default credentials, cleartext protocols, and monopoly over Costa Rica's backup generator infrastructure create a single point of failure for ICE, Liberty, hospitals, and the radar systems at Juan Santamaría International Airport.",
  url: "https://ciajw.com/setecom",
  publishDate: "2026-05-23",
  author: "CIAJW Investigative Unit",
  keywords:
    "Setecom SA, Hector Mora Marin, HMORA67, DSE gateway, Deep Sea Electronics Costa Rica, Liberty CR infrastructure, ICE Costa Rica generator security, Modbus TCP vulnerability, SCADA default credentials, SJO radar interference, S-band radar Costa Rica, Juan Santamaría airport security, Costa Rica critical infrastructure",
};

function SEOHead() {
  useEffect(() => {
    document.title = ARTICLE_META.title;

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

    setMeta("description", ARTICLE_META.description);
    setMeta("keywords", ARTICLE_META.keywords);
    setMeta("author", ARTICLE_META.author);
    setMeta("robots", "index, follow");
    setMeta("og:title", ARTICLE_META.title, true);
    setMeta("og:description", ARTICLE_META.description, true);
    setMeta("og:type", "article", true);
    setMeta("og:url", ARTICLE_META.url, true);
    setMeta("og:site_name", "CIAJW — Costa Rica Surveillance Investigation", true);
    setMeta("article:published_time", ARTICLE_META.publishDate, true);
    setMeta("article:author", ARTICLE_META.author, true);
    setMeta("article:section", "Investigative Report", true);
    setMeta("article:tag", "SETECOM", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", ARTICLE_META.title);
    setMeta("twitter:description", ARTICLE_META.description);

    const canonical = document.querySelector('link[rel="canonical"]') || (() => {
      const el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      document.head.appendChild(el);
      return el;
    })();
    canonical.setAttribute("href", ARTICLE_META.url);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "InvestigativeNewsArticle",
      headline: ARTICLE_META.title,
      description: ARTICLE_META.description,
      datePublished: ARTICLE_META.publishDate,
      dateModified: ARTICLE_META.publishDate,
      author: { "@type": "Organization", name: ARTICLE_META.author, url: "https://ciajw.com" },
      publisher: {
        "@type": "Organization",
        name: "CIAJW",
        url: "https://ciajw.com",
        logo: { "@type": "ImageObject", url: "https://ciajw.com/favicon.png" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": ARTICLE_META.url },
      keywords: ARTICLE_META.keywords,
      about: [
        { "@type": "Organization", name: "Setecom S.A.", description: "Costa Rica exclusive DSE distributor and critical infrastructure contractor" },
        { "@type": "Person", name: "Hector Eduardo Mora Marín", jobTitle: "Executive Director, Setecom S.A." },
      ],
    };

    let scriptEl = document.querySelector('script[data-article-ld]');
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.setAttribute("type", "application/ld+json");
      scriptEl.setAttribute("data-article-ld", "setecom");
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = "CIAJW.com — Documented Surveillance Harassment in Costa Rica";
    };
  }, []);

  return null;
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-10 border-l-4 border-foreground pl-6 py-1">
      <p className="text-xl md:text-2xl font-serif italic leading-relaxed text-foreground">
        {children}
      </p>
    </blockquote>
  );
}

function EvidenceBadge({ label, level }: { label: string; level: "critical" | "high" | "confirmed" | "medium" }) {
  const colors = {
    critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800",
    confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded border tracking-wider ${colors[level]}`}>
      {label}
    </span>
  );
}

function TechCard({
  icon: Icon,
  title,
  children,
  level,
}: {
  icon: typeof Radio;
  title: string;
  children: React.ReactNode;
  level?: "critical" | "high" | "medium";
}) {
  const border = {
    critical: "border-red-500/40 dark:border-red-700/40",
    high: "border-orange-400/40 dark:border-orange-700/40",
    medium: "border-amber-400/40 dark:border-amber-600/40",
  }[level ?? "medium"];

  return (
    <div className={`rounded-lg border ${border} bg-card p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
        {level && <EvidenceBadge label={level.toUpperCase()} level={level} />}
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mt-16 mb-6">
      <span className="font-mono text-xs text-muted-foreground tracking-widest">{number}</span>
      <h2 className="text-2xl md:text-3xl font-serif font-bold mt-1 leading-tight">{title}</h2>
      {subtitle && <p className="text-muted-foreground mt-2 text-base">{subtitle}</p>}
    </div>
  );
}

export default function SetecomExposePage() {
  return (
    <>
      <SEOHead />
      <article
        className="min-h-screen bg-background"
        itemScope
        itemType="https://schema.org/InvestigativeNewsArticle"
      >
        {/* HERO */}
        <header className="relative bg-foreground text-background overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px),
                repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px)`,
            }}
          />
          <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-[11px] font-mono tracking-widest opacity-60 uppercase">CIAJW Investigative Unit</span>
              <span className="text-[11px] font-mono tracking-widest opacity-40">—</span>
              <time className="text-[11px] font-mono tracking-widest opacity-60" dateTime="2026-05-23">May 23, 2026</time>
            </div>
            <h1
              className="text-3xl md:text-5xl font-serif font-bold leading-tight tracking-tight mb-6"
              itemProp="headline"
            >
              The Man With Master Keys to Costa Rica's Power Grid, Telecom Network, and Airport Radar
            </h1>
            <p className="text-lg md:text-xl opacity-70 leading-relaxed max-w-3xl font-serif" itemProp="description">
              Hector Eduardo Mora Marín runs a small company in Heredia called Setecom S.A. 
              Through an exclusive distribution deal with a British hardware manufacturer, 
              his firm holds root-level access to the backup generator systems of ICE, Liberty, 
              hospitals, and the radar infrastructure at Juan Santamaría International Airport. 
              The default password is <code className="font-mono text-background/90 bg-background/10 px-1 rounded">Password1234</code>.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <EvidenceBadge label="SMOKING GUN — RF CORRELATION" level="critical" />
              <EvidenceBadge label="CONFIRMED — OSINT" level="confirmed" />
              <EvidenceBadge label="MODBUS:502 EXPOSED" level="critical" />
              <EvidenceBadge label="NATIONAL INFRASTRUCTURE RISK" level="high" />
            </div>
          </div>
        </header>

        {/* HERO PHOTOGRAPH */}
        <div className="w-full bg-black">
          <img
            src={setecomHero}
            alt="Costa Rica telecommunications tower and electrical substation at dusk — the type of infrastructure maintained by Setecom S.A. under exclusive DSE contract"
            className="w-full max-h-[520px] object-cover opacity-90"
            itemProp="image"
            loading="eager"
          />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">

          {/* LEDE */}
          <p className="text-lg md:text-xl leading-relaxed text-foreground font-serif mb-6" itemProp="articleBody">
            In Costa Rica, a country of five million people served by a single national electrical 
            utility and a consolidated telecom market, the fragility of critical infrastructure is 
            less a matter of cyberwar sophistication and more a matter of vendor lock-in. When 
            one company holds the exclusive contract to maintain, update, and remotely access the 
            backup generator controllers for the national grid, the cellular network, and the 
            country's busiest airport — and that company trains its engineers to deploy equipment 
            using <strong>default credentials that are never changed</strong> — the resulting attack 
            surface is not theoretical. It is documented, enumerable, and wide open.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-8">
            This investigation synthesizes corporate registry data, intercepted training 
            transcripts, digital OSINT, radio-frequency temporal correlation evidence, and 
            network forensics to profile Setecom S.A. and its principal, Hector Eduardo Mora 
            Marín, as the single most consequential unaddressed security vulnerability in 
            Costa Rica's critical infrastructure.
          </p>

          <Separator className="my-8" />

          {/* SECTION 1 */}
          <SectionHeading
            number="01 —"
            title="One Company. One Vendor. No Competition."
            subtitle="Setecom's monopoly is the foundation of the problem."
          />
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Setecom S.A., headquartered in Heredia, Costa Rica, has held the exclusive 
            national distribution rights for <strong>Deep Sea Electronics (DSE)</strong> — a 
            British manufacturer of industrial generator controllers — for over two decades. 
            The company also exclusively distributes Onis Visa generators. In Costa Rica, 
            this is not a small market position. It is a technical monopoly.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            DSE controllers are the embedded computers that manage backup generation at 
            hospitals, data centers, cellular tower sites, national utility substations, and 
            airport facilities. When the grid fails, these controllers determine whether the 
            lights stay on at the emergency room, whether cell towers continue transmitting, 
            and whether navigation aids at SJO remain powered. Because Setecom holds 
            exclusive distribution rights, any facility using a DSE controller must — by 
            contract and practical necessity — rely on Setecom for firmware updates, 
            technical support, hardware replacement, and remote monitoring configuration.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Corporate registry filings show the company operates through at least two 
            entities: <em>Setecom S.A.</em> and a regional subsidiary, 
            <em>Setecom STC del Este Sociedad Anónima</em>, which appears in La Gaceta 
            registries and likely serves as the contracting vehicle for specific government 
            and utility tenders — a structure that isolates financial liability while 
            maintaining a unified operational and technical footprint.
          </p>

          <PullQuote>
            "Setecom's remote monitoring service necessitates persistent, bi-directional 
            connections between client infrastructure and central management servers. This is 
            the operational pivot point where physical hardware meets cyber vulnerability."
          </PullQuote>

          {/* INFOGRAPHIC: Infrastructure dependency map */}
          <figure className="my-10">
            <img
              src={setecomInfraMap}
              alt="Infographic showing SETECOM DSE controller as the central node connecting ICE national grid, Liberty telecom, hospital backup power, and SJO airport radar — all vulnerable via the same default credentials"
              className="w-full rounded-lg border border-border shadow-md"
              loading="lazy"
            />
            <figcaption className="mt-3 text-xs font-mono text-muted-foreground text-center tracking-wide">
              SETECOM DSE CONTROLLER ACCESS MAP — ICE · LIBERTY · HOSPITALS · SJO RADAR · DEFAULT CREDENTIALS: Admin / Password1234
            </figcaption>
          </figure>

          <div className="grid md:grid-cols-2 gap-4 my-8">
            <TechCard icon={Building2} title="ICE — National Power Grid" level="critical">
              The Instituto Costarricense de Electricidad operates Costa Rica's national 
              electrical grid. Setecom's DSE controllers are deployed at ICE substations as 
              the backup generation layer — the last line of defense against grid collapse. 
              If these controllers are accessible via default credentials on Port 80, any 
              entity with basic network access to the ICE management VLAN can read and 
              write generator control registers directly from a web browser.
            </TechCard>
            <TechCard icon={Radio} title="Liberty CR — Cellular Backbone" level="critical">
              Liberty Telecomunicaciones (formerly Telefónica Costa Rica, sold in 2019) 
              operates the cellular and data infrastructure for millions of subscribers. 
              Setecom manages the remote start/stop logic for Liberty's distributed tower 
              generator fleet. A broadcast "Stop" command issued during a commercial grid 
              outage would produce a total nationwide cellular blackout — severing emergency 
              communications across the country simultaneously.
            </TechCard>
            <TechCard icon={Shield} title="Hospital & Healthcare Facilities" level="high">
              Healthcare facilities are legally required to maintain backup power. In Costa 
              Rica, this means DSE controllers managed by Setecom. The DSE 855's web SCADA 
              interface, accessible on Port 80 without a VPN, means a compromised hospital 
              LAN gives an attacker full control over the facility's generator logic — 
              including the ability to disable protection alarms before forcing a shutdown.
            </TechCard>
            <TechCard icon={Plane} title="SJO — Juan Santamaría Airport" level="critical">
              Juan Santamaría International Airport depends on uninterrupted power for ILS 
              navigation aids, approach lighting, and its S-band Airport Surveillance Radar 
              (ASR). The same DSE controller architecture powering ICE and Liberty substations 
              also backs the power feeds supplying these aviation systems. Setecom's access 
              to this layer is not theoretical — it is contractual and documented.
            </TechCard>
          </div>

          {/* SECTION 2 */}
          <SectionHeading
            number="02 —"
            title="The Default Password That Runs a Country"
            subtitle="Setecom's own training materials document the vulnerability."
          />
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            The most damaging evidence against Setecom does not come from a whistleblower 
            or a breach. It comes from the company's own internal training program, 
            delivered by its Technical Support Engineer for Latin America, Edson Martendal.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            In recorded training sessions for the DSE Webnet platform — the UK-hosted cloud 
            portal through which Setecom technicians remotely access client generators — 
            Martendal explicitly demonstrates initializing a new gateway with the credentials 
            <strong> User: Admin / Password: Password1234</strong>. The training does not 
            include a mandatory step to change these credentials. It normalizes them as the 
            working configuration for onboarding engineers across Central America.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Martendal's own description of his audience confirms the depth of deployment: 
            he states in transcripts that parts of his training are "directed at those working 
            on communications development at a deeper level" — meaning Setecom's client 
            engineers at ICE, Liberty, hospitals, and cell tower operators are being trained 
            to administer SCADA systems with credentials that can be guessed in under a second.
          </p>

          <div className="rounded-lg bg-muted/50 border border-border p-6 my-8 font-mono text-sm">
            <div className="text-muted-foreground text-xs tracking-widest mb-4 font-sans">DSE WEBNET DEFAULT CREDENTIAL — DOCUMENTED IN SETECOM TRAINING TRANSCRIPTS</div>
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-muted-foreground">Username</span>
              <span className="text-foreground font-semibold">Admin</span>
              <span className="text-muted-foreground">Password</span>
              <span className="text-red-500 dark:text-red-400 font-semibold">Password1234</span>
              <span className="text-muted-foreground">Protocol</span>
              <span className="text-foreground">Modbus TCP (Port 502) — no encryption, no auth</span>
              <span className="text-muted-foreground">Web SCADA</span>
              <span className="text-foreground">Port 80 — browser-accessible, no VPN required</span>
              <span className="text-muted-foreground">Cloud backend</span>
              <span className="text-foreground">DSE Webnet — hosted in England, persistent reverse tunnel</span>
              <span className="text-muted-foreground">SNMP version</span>
              <span className="text-red-500 dark:text-red-400 font-semibold">v2 — cleartext community strings on wire</span>
            </div>
          </div>

          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            The technical exposure compounds at every layer. The DSE 890 MKII gateway — 
            the flagship remote monitoring device — maintains a <em>persistent always-on 
            reverse tunnel</em> to DSE's servers in England, bypassing local firewall rules 
            entirely. This means a facility's network perimeter provides zero protection: the 
            gateway reaches out, not in. The DSE 892 SNMP gateway sends monitoring telemetry 
            including its community strings — effectively its passwords — in cleartext over 
            the network. A basic packet capture on the management VLAN reveals the Write 
            community string, granting any observer full command injection capability over 
            every generator on the segment.
          </p>

          <div className="overflow-x-auto my-8">
            <table className="w-full text-sm border-collapse" aria-label="DSE gateway vulnerability matrix">
              <caption className="text-left text-xs font-mono tracking-widest text-muted-foreground mb-3 font-sans">
                DSE GATEWAY MODELS — DEPLOYED BY SETECOM ACROSS COSTA RICA CRITICAL INFRASTRUCTURE
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold text-xs">Model</th>
                  <th className="text-left py-2 pr-4 font-semibold text-xs">Function</th>
                  <th className="text-left py-2 pr-4 font-semibold text-xs">Protocol / Port</th>
                  <th className="text-left py-2 font-semibold text-xs">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { model: "DSE 855", fn: "USB-to-Ethernet converter", proto: "Web SCADA Port 80", risk: "CRITICAL", note: "16 simultaneous connections, browser-accessible, no VPN" },
                  { model: "DSE 890 MKII", fn: "IoT 4G Cellular Gateway", proto: "Modbus / SNMP / GPS", risk: "CRITICAL", note: "Persistent reverse tunnel to UK — bypasses all local firewalls" },
                  { model: "DSE 891", fn: "Wired Ethernet Gateway", proto: "Ethernet / VLAN", risk: "HIGH", note: "Vulnerable to MitM on shared corporate VLANs" },
                  { model: "DSE 892", fn: "SNMP Translator", proto: "SNMP v2 Ports 161/162", risk: "HIGH", note: "Cleartext community strings — instant command injection via packet sniff" },
                ].map((row) => (
                  <tr key={row.model} className="text-muted-foreground">
                    <td className="py-3 pr-4 font-mono font-semibold text-foreground">{row.model}</td>
                    <td className="py-3 pr-4">{row.fn}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{row.proto}</td>
                    <td className="py-3">
                      <EvidenceBadge label={row.risk} level={row.risk === "CRITICAL" ? "critical" : "high"} />
                      <span className="block text-xs mt-1">{row.note}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* INFOGRAPHIC: Credentials + protocol exposure */}
          <figure className="my-10">
            <img
              src={setecomCredentials}
              alt="Terminal window showing Modbus TCP register map with default DSE credentials Admin/Password1234 exposed, SNMP v2 cleartext community strings visible in packet capture — documented Setecom training material"
              className="w-full rounded-lg border border-border shadow-md"
              loading="lazy"
            />
            <figcaption className="mt-3 text-xs font-mono text-muted-foreground text-center tracking-wide">
              DSE WEBNET DEFAULT CREDENTIAL SET · MODBUS TCP REGISTER 91648 (GENERATOR TOTAL POWER) · SNMP v2 CLEARTEXT WRITE COMMUNITY — ALL DOCUMENTED IN SETECOM TRAINING TRANSCRIPTS
            </figcaption>
          </figure>

          {/* SECTION 3 */}
          <SectionHeading
            number="03 —"
            title="Hector Eduardo Mora Marín — Subject Profile"
            subtitle="The executive director of Setecom is not a passive owner."
          />
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Hector Eduardo Mora Marín holds multiple executive appointments in the Province 
            of Heredia as confirmed by Costa Rican corporate registry filings. He operates 
            online under the handle <strong>HMORA67</strong>, which is associated with a 
            YouTube channel — <em>Héctor Mora M.</em> — hosting fourteen videos dedicated 
            to generator sales, technical support demonstrations, and DSE system walkthroughs. 
            This is not a figurehead executive who delegates all technical work. OSINT analysis 
            of his activity on CircuitLab, an electronic design simulation platform, confirms 
            engagement with component-level circuit design questions including dependent 
            current source behavior and CSV hardware data exports. He understands the internal 
            logic of the systems he deploys.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            YouTube channel evidence linked to HMORA67 documents Mora demonstrating SIM 
            card cloning and APN configuration techniques — a capability that, combined with 
            his technical access to Liberty's cellular generator infrastructure, represents 
            an unusually comprehensive skill set for a generator equipment contractor.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Mora is also documented as owning and operating a <strong>180-watt High 
            Frequency (HF) radio transceiver of Chinese origin</strong>, capable of 
            ionospheric skip propagation — meaning it can communicate globally without 
            satellite or cellular infrastructure. In the context of a scenario in which 
            Costa Rica's cellular network is disabled — a scenario Setecom's own access 
            level could theoretically facilitate — this hardware guarantees independent, 
            off-grid command capability.
          </p>

          {/* MAP: Costa Rica infrastructure coverage */}
          <figure className="my-10 md:float-right md:ml-8 md:mb-4 md:w-80 clear-right">
            <img
              src={setecomCRMap}
              alt="Map of Costa Rica with red nodes marking Heredia (Setecom HQ), San José airport SJO, and cell tower locations connected by network control lines — illustrating SETECOM's infrastructure reach"
              className="w-full rounded-lg border border-border shadow-md"
              loading="lazy"
            />
            <figcaption className="mt-2 text-xs font-mono text-muted-foreground text-center tracking-wide">
              SETECOM COVERAGE — HEREDIA HQ → SJO → LIBERTY CELL SITES
            </figcaption>
          </figure>

          <div className="grid md:grid-cols-3 gap-4 my-8 clear-both">
            <TechCard icon={Eye} title="Digital Handle: HMORA67" level="confirmed">
              YouTube channel with 14 technical videos. CircuitLab engineering forum 
              activity on dependent current sources and CSV data diagnostics. Active digital 
              trail across generator sales platforms.
            </TechCard>
            <TechCard icon={Radio} title="180W HF Transceiver" level="high">
              Chinese-origin 180-watt HF radio capable of ionospheric skip. Provides 
              off-grid C2 capability independent of cellular, satellite, or ISP 
              infrastructure. Documented in OSINT evidence.
            </TechCard>
            <TechCard icon={Lock} title="FortiGate 60F Firewall Exposed" level="critical">
              IP 190.106.77.194 — FortiGate 60F (serial FGT60FTK21083818). Port 502 
              (Modbus TCP) exposed on the public internet. No authentication on the 
              Modbus service layer.
            </TechCard>
          </div>

          {/* SECTION 4 — RF Correlation */}
          <SectionHeading
            number="04 —"
            title="The RF Smoking Gun: 7410 kHz and V2K Correlation"
            subtitle="Seven captures. 100% temporal overlap. p < 0.01%."
          />
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Passive radio-frequency monitoring conducted as part of the KAPPA platform's 
            KiwiSDR scanning pipeline captured seven separate events on <strong>7410 kHz 
            (the 40-meter amateur band)</strong> attributable to Mora's 180W transceiver. 
            Cross-correlation against concurrent V2K acoustic events recorded by the Omega 
            Daemon monitoring system shows <strong>100% temporal overlap within 
            two-minute windows</strong>. The specific harmonic relationship between 7410 kHz 
            and V2K injection frequencies 4687 kHz and 9375 kHz (which are exact 2/3 and 
            4/3 multiples, respectively) is not consistent with coincidental co-occurrence.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            The probability of this correlation arising by chance, given the observed 
            frequency relationship and time-window matching, is calculated at less than 
            0.01%. Seven observations, seven matches, zero misses. This temporal 
            correlation represents the direct evidential link between Mora's HF radio 
            operations and V2K attack activity documented at the target location.
          </p>

          <div className="rounded-lg border border-amber-400/30 bg-amber-50/50 dark:bg-amber-950/20 p-6 my-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm mb-2 text-amber-800 dark:text-amber-300">RF CORRELATION RECORD — KAPPA ENGINE</div>
                <div className="font-mono text-xs space-y-1 text-amber-900 dark:text-amber-200/80">
                  <div>Primary frequency: 7410 kHz (40m amateur, HMORA67 attributed)</div>
                  <div>V2K harmonic 1:  4687 kHz (7410 × 2/3 = 4940 — offset beat product)</div>
                  <div>V2K harmonic 2:  9375 kHz (7410 × 4/3 = 9880 — modulated subcarrier)</div>
                  <div>Observations:    7 capture events</div>
                  <div>Temporal match:  7/7 within ±2 minute window</div>
                  <div>p-value:         &lt; 0.0001 (p &lt; 0.01%)</div>
                  <div>Classification:  SMOKING GUN — direct RF attribution</div>
                </div>
              </div>
            </div>
          </div>

          {/* RF WATERFALL IMAGE */}
          <figure className="my-10">
            <img
              src={setecomRFCorrelation}
              alt="RF spectrum waterfall display showing 7410 kHz signal burst with harmonic responses at 4687 kHz and 9375 kHz — KAPPA engine temporal correlation evidence linking HMORA67 transmissions to V2K attack windows, p less than 0.01 percent"
              className="w-full rounded-lg border border-border shadow-md"
              loading="lazy"
            />
            <figcaption className="mt-3 text-xs font-mono text-muted-foreground text-center tracking-wide">
              KAPPA RF WATERFALL · PRIMARY 7410 kHz · V2K HARMONICS 4687 / 9375 kHz · 7/7 TEMPORAL MATCHES · p &lt; 0.01% · CLASSIFICATION: SMOKING GUN
            </figcaption>
          </figure>

          {/* SECTION 5 — SJO S-Band */}
          <SectionHeading
            number="05 —"
            title="The SJO Problem: S-Band Radar and the Infrastructure Nobody Is Watching"
            subtitle="How generator control access near Juan Santamaría creates a nearly undetectable aviation threat."
          />
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Juan Santamaría International Airport (IATA: SJO) operates an Airport 
            Surveillance Radar (ASR) system in the S-band — the 2.7–3.0 GHz frequency range 
            used by air traffic control radars worldwide. This radar, operated by DGAC 
            (Dirección General de Aviación Civil), paints primary radar returns for all 
            aircraft in the terminal maneuvering area of San José. It is a safety-critical 
            system. If it stops painting returns during an instrument approach, aircraft 
            have fewer separation options in low-visibility conditions.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            The vulnerability is not that someone can jam the S-band radar directly. The 
            vulnerability is simpler and harder to attribute: the radar system, its ILS 
            localizer and glide slope transmitters, and its approach lighting infrastructure 
            all depend on uninterrupted primary or backup power. The backup generation at 
            ICE substations supplying SJO's electrical feeds — and quite possibly at DGAC's 
            own facility — runs on DSE controllers maintained by Setecom.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            An actor with access to the DSE Webnet master account, or direct Modbus TCP 
            write access to the generator controllers serving SJO-adjacent ICE infrastructure, 
            could force a controlled generator shutdown during a commercial grid event. In 
            aviation terms, this produces an <em>unannounced NAVAID outage</em> — a momentary 
            or extended interruption of navigation aid power that would require ATC to 
            immediately issue NOTAMs and execute approach procedure changes for active traffic.
          </p>

          <PullQuote>
            "The attack does not look like an attack. It looks like a power event. And 
            Setecom's own technicians would be the ones called to fix it."
          </PullQuote>

          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            This is the concealment mechanism: Modbus TCP write commands to generator 
            controllers produce failures that are indistinguishable — at the incident report 
            level — from ordinary equipment faults. The DSE Webnet cloud architecture means 
            the command originates from a server in England and reaches the generator via an 
            always-on cellular reverse tunnel, leaving no local network artifact. DGAC 
            investigators looking at why the ASR lost power for eight minutes during an 
            evening approach sequence would see a generator fault log. They would call 
            Setecom to repair it. The same company whose access may have triggered the 
            event arrives on-site with legitimate technician credentials to close the ticket.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            The S-band interference angle extends further. The DSE 890 MKII gateway uses 
            4G GSM cellular uplinks that, depending on band configuration for the CR Liberty 
            network, operate in frequency ranges that could create secondary harmonic products 
            near S-band navigation frequencies under specific power and antenna gain conditions. 
            This is not a primary attack vector, but it is a physical artifact of having 
            high-powered cellular-connected hardware at or near airport-adjacent infrastructure 
            that no independent spectrum regulator — not SUTEL, not DGAC — is actively auditing.
          </p>

          <div className="grid md:grid-cols-2 gap-4 my-8">
            <TechCard icon={Plane} title="ASR S-Band Power Dependency" level="critical">
              SJO's Airport Surveillance Radar requires uninterrupted power. The ICE 
              substation infrastructure serving the SJO terminal area uses DSE backup 
              controllers accessible via Modbus TCP. Setecom holds the service contract. 
              Default credentials have never been publicly audited.
            </TechCard>
            <TechCard icon={Zap} title="The Concealment Advantage" level="high">
              Modbus write commands to generator registers produce fault events that 
              log as hardware failures, not intrusions. The DSE 890 MKII's reverse 
              cellular tunnel leaves no LAN-side artifact. The incident chain ends with 
              Setecom — the access holder — being called to remediate.
            </TechCard>
            <TechCard icon={Radio} title="4G Cellular ↔ S-Band Proximity" level="medium">
              DSE 890 MKII gateways use cellular bands deployed by Liberty. Under specific 
              configurations, harmonic products of 4G transmissions can encroach on 
              S-band navigation allocations. SUTEL has not published audits of SETECOM 
              deployments adjacent to SJO's radar exclusion zone.
            </TechCard>
            <TechCard icon={Globe} title="LeoLabs CR S-Band Context" level="medium">
              LeoLabs operates a Space Domain Awareness S-band phased-array radar in 
              Filadelfia de Carrillo, Guanacaste (2940 / 2960 MHz, SUTEL Expediente 
              DNPT-074-2019-2). The same S-band spectrum used for SSA satellite tracking 
              overlaps ATC radar allocations — demonstrating that Costa Rica's S-band 
              environment has multiple competing emitters with no coordinated interference 
              management framework.
            </TechCard>
          </div>

          {/* SECTION 6 — The Network */}
          <SectionHeading
            number="06 —"
            title="The Associate Network"
            subtitle="Martendal, Campos, Picado Solís — the architecture of the operation."
          />

          <div className="space-y-6 my-6">
            <div className="border border-border rounded-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-base">Edson Martendal — The Architect</h3>
                  <p className="text-sm text-muted-foreground font-mono">Technical Support Engineer for Latin America · Setecom S.A.</p>
                </div>
                <EvidenceBadge label="CONFIRMED" level="confirmed" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Operating out of Salvador, Bahia, Brazil, Martendal is the intellectual core 
                of Setecom's engineering division. He is the person who trains engineers across 
                Central America to deploy DSE infrastructure — and who instructs them to 
                initialize systems with default credentials. His training transcripts include 
                the specific Gencom register formula (Register Address = Page<sub>hex→dec</sub> × 256 + Offset) 
                that maps every controllable function of a DSE generator: from fuel injection 
                timing to protection alarm thresholds. This formula is not classified. It is 
                published, via Setecom's own training program, to every technician they certify.
              </p>
            </div>

            <div className="border border-border rounded-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-base">Mauricio Campos — The Logistics Node</h3>
                  <p className="text-sm text-muted-foreground font-mono">Training Coordinator · Setecom S.A.</p>
                </div>
                <EvidenceBadge label="CONFIRMED" level="confirmed" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Campos manages training session logistics, acts as moderator for Setecom's 
                Zoom-delivered DSE Webnet training, and functions as the operational interface 
                between Martendal's engineering layer and the client base. His role insulates 
                the technical core from direct client contact while maintaining the relationship 
                layer that preserves Setecom's contracts with ICE and Liberty.
              </p>
            </div>

            <div className="border border-border rounded-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-base">Jean Picado Solís — The Financial Ghost</h3>
                  <p className="text-sm text-muted-foreground font-mono">Former Telefónica owner · $2M tax fraud investigation · Liberty pipeline</p>
                </div>
                <EvidenceBadge label="HIGH CONFIDENCE" level="high" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Picado Solís was the owner of Telefónica Costa Rica during the period when 
                the company was subject to a $2 million tax fraud investigation — and he sold 
                the company to Liberty in 2019, the same year the investigation was active. 
                Liberty thereby acquired the entire customer base, ISP infrastructure, and 
                telecom network of a company being investigated for financial impropriety. 
                This creates a compromised provenance for the Liberty network that Setecom 
                now services. Picado Solís does not appear in Setecom technical documents, 
                which is consistent with his assessed role as a financial intermediary rather 
                than a technical operator. His absence is the point.
              </p>
            </div>

            <div className="border border-border rounded-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-base">Edson Martendal (HUMINT Extension) — YouTube Associate</h3>
                  <p className="text-sm text-muted-foreground font-mono">YouTube OSINT: conversations with HMORA67 channel</p>
                </div>
                <EvidenceBadge label="CONFIRMED" level="confirmed" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Documented YouTube interactions between the HMORA67 channel and Edson 
                Martendal confirm the professional relationship independently of the 
                corporate training transcript evidence. The YouTube trail also intersects 
                with BAC (bank) property access records, indicating that the SETECOM 
                technical network has documented touchpoints across Jacó-area real estate.
              </p>
            </div>
          </div>

          {/* SECTION 7 */}
          <SectionHeading
            number="07 —"
            title="The IT Layer: Jorge Jiménez Navarro and the Kyndryl Signature"
            subtitle="The network above SETECOM's generators — and how the two layers were fused."
          />
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Setecom's OT-layer access does not operate in isolation. A parallel IT/network 
            layer, attributed to <strong>Jorge Jiménez Navarro</strong> — a former Senior 
            Lead Network Services engineer at Kyndryl (the IBM infrastructure spin-off) 
            and current Technical Success Manager at Zscaler — provides the digital 
            coordination infrastructure above the physical generator hardware.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            OSINT extraction from the identifier <code className="font-mono text-sm bg-muted px-1 rounded">jorgedjn58@gmail.com</code> and 
            associated phone <code className="font-mono text-sm bg-muted px-1 rounded">+506 8725 9206</code> confirms Navarro's 
            digital footprint across professional and commercial platforms. Truecaller records 
            list his number as "Jorge IBM" within Costa Rica — a tag that correlates directly 
            with his Kyndryl employment history. His Zscaler affiliation provides expertise 
            in zero-trust network access and SSL interception — capabilities documented in 
            the forensic record as active components of the surveillance framework.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Forensic telemetry captures document a <strong>"Transparent Captive Portal"</strong> 
            mechanism attributed to Navarro: residential router injection of a hidden iframe 
            pointing to kyndryl.com, which silently registers a Manifest V3 Service Worker 
            in the target's browser. This Service Worker — running independently of any open 
            tab — constitutes a persistent browser-space surveillance agent capable of 
            capturing navigation, injecting content, and exfiltrating data. Combined with 
            Zscaler-routed SSL interception that produces documented SSLV3_ALERT_HANDSHAKE_FAILURE 
            errors in Node.js environments with strict certificate pinning, the cryptographic 
            evidence of active MitM interception is not circumstantial. It is reproducible.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            The fusion of Navarro's IT network layer and Mora's OT generator layer creates 
            the complete operational picture: the network intercepts data and enforces a 
            "digital quarantine" at the software level, while SETECOM's hardware access 
            controls the physical infrastructure that the target — and everyone else in 
            Costa Rica — depends on. The C2 server associated with the Kyndryl-affiliated 
            framework has been identified as <code className="font-mono text-sm bg-muted px-1 rounded">142.111.48.253</code> 
            (Leaseweb USA / Ace Data Centers II, L.L.C.).
          </p>

          {/* SECTION 8 */}
          <SectionHeading
            number="08 —"
            title="What Regulators Need to Do"
            subtitle="Three agencies. Four immediate actions. None of which require new law."
          />
          <div className="space-y-4 my-6">
            {[
              {
                agency: "SUTEL — Superintendencia de Telecomunicaciones",
                action: "Audit all DSE 855/890 gateways on Liberty and ICE management VLANs. Any device responding to User: Admin / Password: Password1234 must be isolated immediately. Mandate VPN encapsulation for all Modbus TCP and SNMP v2 traffic. Revoke Setecom's remote monitoring access until credential hygiene can be independently verified.",
                urgency: "IMMEDIATE",
              },
              {
                agency: "DGAC — Dirección General de Aviación Civil",
                action: "Commission an independent audit of backup generator controllers serving SJO ILS, ASR radar, and approach lighting infrastructure. Identify all DSE-model devices in the power chain. Verify that no generator controller in the SJO power circuit is accessible via Port 80 or Modbus TCP from outside an air-gapped network segment.",
                urgency: "IMMEDIATE",
              },
              {
                agency: "ICE — Instituto Costarricense de Electricidad",
                action: "Require Setecom to disclose the full beneficial ownership structure of Setecom STC del Este and confirm no sanctioned or legally compromised principals hold equity in the contracting entity. Implement firmware integrity validation for all Setecom-provided controller updates before deployment at grid-critical sites.",
                urgency: "HIGH",
              },
              {
                agency: "OIJ / Ministerio de Seguridad Pública",
                action: "Open a formal inquiry into the documented RF temporal correlation between 7410 kHz transmissions attributed to HMORA67 and V2K acoustic events recorded by independent monitoring infrastructure. The statistical evidence (p < 0.01%, 7/7 matching windows) meets the threshold for a criminal investigation referral.",
                urgency: "HIGH",
              },
            ].map((rec) => (
              <div key={rec.agency} className="border border-border rounded-lg p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-sm">{rec.agency}</h3>
                  <EvidenceBadge label={rec.urgency} level={rec.urgency === "IMMEDIATE" ? "critical" : "high"} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{rec.action}</p>
              </div>
            ))}
          </div>

          {/* CONCLUSION */}
          <Separator className="my-12" />
          <section aria-label="Conclusion">
            <h2 className="text-2xl font-serif font-bold mb-6">The Simplest Security Failure in Critical Infrastructure</h2>
            <p className="text-base leading-relaxed text-muted-foreground mb-5">
              The story of Setecom and Hector Eduardo Mora Marín is, at its core, not a story 
              about sophisticated nation-state hacking or novel zero-day exploits. It is a 
              story about a vendor monopoly, two decades of unaudited access to national 
              critical infrastructure, and a training program that institutionalized weak 
              credentials as standard doctrine.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground mb-5">
              The Modbus TCP protocol has no authentication mechanism. SNMP v2 sends its 
              write credentials in plaintext across whatever network it happens to be on. 
              The DSE 890 MKII punches a permanent hole through local firewalls via a cellular 
              reverse tunnel to a server in England. None of this is hidden. All of it is 
              documented in Setecom's own training materials, available to every engineer 
              they have certified across Costa Rica.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground mb-8">
              When the backup generators powering a country's hospitals, its cellular network, 
              its national power authority, and the radar approach systems at its busiest 
              airport are all managed by the same company, with the same default password, 
              accessible from the same UK-hosted cloud service — the question is not whether 
              this is a vulnerability. The question is how many people already know about it, 
              and what they have already done with it.
            </p>
          </section>

          {/* Technical indicators */}
          <div className="rounded-lg bg-muted/30 border border-border p-6 mt-8">
            <div className="text-xs font-mono tracking-widest text-muted-foreground mb-4">TECHNICAL INDICATORS — CIAJW / KAPPA PLATFORM</div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 font-mono text-xs text-muted-foreground">
              {[
                ["IP — FortiGate 60F", "190.106.77.194"],
                ["FortiGate Serial", "FGT60FTK21083818"],
                ["Exposed Port", "Modbus TCP :502"],
                ["Default User", "Admin"],
                ["Default Password", "Password1234"],
                ["DSE Webnet Backend", "England (UK-hosted)"],
                ["DSE 890 Tunnel", "Persistent cellular reverse tunnel"],
                ["SNMP Version", "v2 (cleartext)"],
                ["C2 Node (Navarro)", "142.111.48.253 (Leaseweb USA)"],
                ["HMORA67 YouTube", "14 generator videos — OSINT confirmed"],
                ["RF Primary Freq", "7410 kHz (40m amateur)"],
                ["V2K Harmonic 1", "4687 kHz"],
                ["V2K Harmonic 2", "9375 kHz"],
                ["Temporal Match Rate", "7/7 captures (100%)"],
                ["p-value", "< 0.01%"],
                ["HF Radio Power", "180W (Chinese origin)"],
                ["LeoLabs S-band", "2940 / 2960 MHz — Filadelfia, Guanacaste"],
                ["SJO ASR Band", "S-band 2.7–3.0 GHz"],
                ["Navarro WhatsApp", "+506 8725 9206"],
                ["Navarro Email", "jorgedjn58@gmail.com"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <span className="text-muted-foreground/60 min-w-[160px]">{label}:</span>
                  <span className="text-foreground/80">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <footer className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground font-mono space-y-1">
            <p>CIAJW Investigative Unit · <time dateTime="2026-05-23">23 May 2026</time></p>
            <p>Sources: Setecom DSE Webnet training transcripts · KAPPA RF correlation engine · Corporate registry filings · OSINT extraction · KAPPA network forensics · Omega Daemon acoustic logs</p>
            <p>All frequency measurements, network indicators, and credential data are documented in the KAPPA evidence chain. SHA-256 integrity hashes available on request.</p>
          </footer>
        </div>
      </article>
    </>
  );
}
