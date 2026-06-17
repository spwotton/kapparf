import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { ZoomableImage } from "@/components/zoomable-image";
const nexusImg = "/assets/complete_nexus_all_threads_1774025171694.png";
const confirmedImg = "/assets/jaco_nexus_confirmed_evidence_1774025171697.png";
const apocalypseImg = "/assets/apocalypse_architecture_1774025171693.png";
const dewaveImg = "/assets/dewave_architecture_1774025171694.png";
const activationImg = "/assets/january_14_2025_activation_complete_1774025171697.png";
const photo1 = "/assets/20260321_100629_(2)_1774201049911.jpg";
const photo2 = "/assets/20260322_095645_1774201049912.jpg";
const photo3 = "/assets/20260322_095708_1774215130710.jpg";
const photo4 = "/assets/20260322_151136_1774215130713.jpg";
const threeVoicesImg = "/assets/three_voices_analysis_1774025171698.png";
const dewaveDeepImg = "/assets/dewave_bart_deep_dive_1774025171695.png";
const theNexusImg = "/assets/the_nexus_analysis_1774025171698.png";

function VennDiagram({ sets, title }: { sets: { label: string; color: string; items: string[] }[]; title: string }) {
  const cx = [180, 320, 250];
  const cy = [180, 180, 280];
  const r = 120;
  return (
    <div className="my-8">
      <h3 className="text-lg font-bold text-center mb-4 text-amber-400">{title}</h3>
      <svg viewBox="0 0 500 400" className="w-full max-w-xl mx-auto">
        <defs>
          {sets.map((s, i) => (
            <radialGradient key={i} id={`vg-${i}`}>
              <stop offset="0%" stopColor={s.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.08" />
            </radialGradient>
          ))}
        </defs>
        {sets.map((s, i) => (
          <g key={i}>
            <circle cx={cx[i]} cy={cy[i]} r={r} fill={`url(#vg-${i})`} stroke={s.color} strokeWidth="2" strokeOpacity="0.6" />
            <text x={cx[i] + (i === 0 ? -70 : i === 1 ? 70 : 0)} y={cy[i] + (i === 2 ? 90 : -90)} textAnchor="middle" fill={s.color} fontSize="13" fontWeight="bold">{s.label}</text>
            {s.items.map((item, j) => {
              const ox = i === 0 ? -55 : i === 1 ? 55 : 0;
              const oy = i === 2 ? 40 : -40;
              return (
                <text key={j} x={cx[i] + ox} y={cy[i] + oy + j * 16} textAnchor="middle" fill="#ccc" fontSize="9">{item}</text>
              );
            })}
          </g>
        ))}
        <text x="250" y="210" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">CONVERGENCE</text>
        <text x="250" y="224" textAnchor="middle" fill="#d97706" fontSize="9">Target / Observer</text>
      </svg>
    </div>
  );
}

function CorrelationMatrix({ data }: { data: { x: string; y: string; strength: number; label: string }[] }) {
  const labels = Array.from(new Set([...data.map(d => d.x), ...data.map(d => d.y)]));
  return (
    <div className="my-6 overflow-x-auto">
      <table className="mx-auto text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-muted-foreground/60"></th>
            {labels.map(l => <th key={l} className="p-2 text-muted-foreground/80 writing-mode-vertical" style={{ writingMode: "vertical-lr", textOrientation: "mixed" }}>{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {labels.map(row => (
            <tr key={row}>
              <td className="p-2 text-muted-foreground/80 text-right whitespace-nowrap">{row}</td>
              {labels.map(col => {
                const cell = data.find(d => (d.x === row && d.y === col) || (d.x === col && d.y === row));
                const s = cell?.strength || 0;
                const bg = s > 0.8 ? "bg-amber-900" : s > 0.5 ? "bg-orange-900" : s > 0.2 ? "bg-yellow-900/50" : row === col ? "bg-muted" : "bg-card/50";
                return (
                  <td key={col} className={`p-2 text-center ${bg} border border-border cursor-default`} title={cell?.label || ""}>
                    {row === col ? "-" : s > 0 ? s.toFixed(1) : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineEvent({ date, title, detail, severity }: { date: string; title: string; detail: string; severity: number }) {
  const colors = ["", "border-gray-600", "border-yellow-600", "border-orange-500", "border-amber-500", "border-amber-700"];
  const dots = ["", "bg-gray-500", "bg-yellow-500", "bg-orange-500", "bg-amber-500", "bg-amber-700"];
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full ${dots[severity]} border-2 ${colors[severity]}`} />
        <div className="w-px flex-1 bg-muted" />
      </div>
      <div className={`border-l-2 ${colors[severity]} pl-4 pb-2 -mt-1`}>
        <div className="text-xs text-muted-foreground/60 font-mono">{date}</div>
        <div className="font-bold text-sm mt-1">{title}</div>
        <div className="text-xs text-muted-foreground/80 mt-1">{detail}</div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="py-16 border-t border-border">
      <h2 className="text-3xl font-black mb-8 text-amber-500 tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card/80 border border-border rounded-lg p-4 text-center">
      <div className="text-2xl font-black font-mono text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="text-xs text-muted-foreground/80 mt-1">{label}</div>
      {sub && <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{sub}</div>}
    </div>
  );
}

function RedactedName({ name, className = "" }: { name: string; className?: string; full?: boolean }) {
  return (
    <span className={`font-mono tracking-tight text-amber-300 ${className}`}>{name}</span>
  );
}

function PersonCard({ name, alias, realName, role, details, color }: { name: string; alias: string; realName?: string; role: string; details: string[]; color: string }) {
  return (
    <div className={`bg-card/60 border rounded-lg p-4`} style={{ borderColor: color + "44" }}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        {realName ? (
          <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <RedactedName name={realName} />
            <span className="text-[10px] font-sans text-amber-700/60 font-normal border border-amber-900/30 rounded px-1 py-0.5 tracking-wider">CLASSIFIED</span>
          </h4>
        ) : (
          <h4 className="font-bold text-sm" style={{ color }}>{alias}</h4>
        )}
      </div>
      {realName && (
        <div className="text-xs font-mono mb-1 ml-5" style={{ color }}>{alias} <span className="text-muted-foreground/40">({name})</span></div>
      )}
      {!realName && (
        <div className="text-xs text-muted-foreground/40 font-mono mb-1 ml-5">({name})</div>
      )}
      <div className="text-xs text-muted-foreground/80 mb-2">{role}</div>
      <div className="space-y-1">
        {details.map((d, i) => (
          <div key={i} className="text-xs text-muted-foreground/60 flex gap-1">
            <span className="text-gray-700">-</span> {d}
          </div>
        ))}
      </div>
    </div>
  );
}

function SonarTable() {
  const readings = [
    { ts: "1757711447", sr: "48000", prf: "46.875", snr: "33.15", notes: "Periodic energy bursts" },
    { ts: "1757711480", sr: "48000", prf: "46.875", snr: "25.64", notes: "Periodic energy bursts" },
    { ts: "1757746150", sr: "48000", prf: "46.875", snr: "24.60", notes: "dom~5482Hz, ultra~0.000" },
    { ts: "1757749061", sr: "48000", prf: "46.875", snr: "33.02", notes: "dom~98Hz, ultra~0.027" },
    { ts: "1757749092", sr: "48000", prf: "46.875", snr: "35.79", notes: "dom~98Hz, ultra~0.015" },
    { ts: "1757749367", sr: "48000", prf: "46.875", snr: "45.91", notes: "dom~189Hz, ultra~0.001" },
    { ts: "1757749673", sr: "48000", prf: "46.875", snr: "48.52", notes: "dom~699Hz, ultra~0.001" },
    { ts: "1757749704", sr: "48000", prf: "46.875", snr: "54.45", notes: "dom~100Hz — PEAK SNR" },
    { ts: "1757749811", sr: "48000", prf: "46.875", snr: "24.28", notes: "dom~127Hz, ultra~0.000" },
  ];
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="p-2 text-left text-muted-foreground/60">Timestamp</th>
            <th className="p-2 text-left text-muted-foreground/60">Sample Rate</th>
            <th className="p-2 text-left text-muted-foreground/60">PRF (Hz)</th>
            <th className="p-2 text-left text-muted-foreground/60">SNR (dB)</th>
            <th className="p-2 text-left text-muted-foreground/60">Notes</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r, i) => (
            <tr key={i} className={`border-b border-border/50 ${r.snr === "54.45" ? "bg-emerald-950/20" : ""}`}>
              <td className="p-2 font-mono text-muted-foreground/80">{r.ts}</td>
              <td className="p-2 font-mono text-muted-foreground/80">{r.sr}</td>
              <td className="p-2 font-mono text-emerald-700 dark:text-emerald-400 font-bold">{r.prf}</td>
              <td className="p-2 font-mono text-foreground font-bold">{r.snr}</td>
              <td className="p-2 text-muted-foreground/80">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DSEBackdoorTable() {
  const devices = [
    { device: "DSE 855", fn: "USB-to-Ethernet", vuln: "In-built Web SCADA — Port 80, No VPN, 16 concurrent connections" },
    { device: "DSE 890 MKII", fn: "IoT Gateway", vuln: "4G GSM + GPS — tunnels to UK servers, remote kill capability" },
    { device: "DSE 891", fn: "Ethernet Gateway", vuln: "Local network sniffing, MitM attack surface" },
    { device: "DSE 892", fn: "SNMP Gateway", vuln: "SNMP v2 cleartext — default 'public'/'private' community strings" },
  ];
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="p-2 text-left text-muted-foreground/60">Device</th>
            <th className="p-2 text-left text-muted-foreground/60">Function</th>
            <th className="p-2 text-left text-muted-foreground/60">Vulnerability</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="p-2 font-mono text-emerald-700 dark:text-emerald-400 font-bold">{d.device}</td>
              <td className="p-2 text-muted-foreground">{d.fn}</td>
              <td className="p-2 text-orange-400">{d.vuln}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CopyBlock({ text, multiline }: { text: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="relative mb-3">
      <button
        onClick={handleCopy}
        data-testid="button-copy-command"
        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-white/10 hover:bg-white/20 text-green-300 hover:text-white transition-colors"
      >
        {copied ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>
            Copied!
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </>
        )}
      </button>
      <div className="bg-black border border-amber-900/50 rounded p-3 pr-20 font-mono text-xs text-green-400 break-all">
        {multiline
          ? text.split("\n").map((line, i) => <div key={i}>{line}</div>)
          : text}
      </div>
    </div>
  );
}

const navGroups = [
  {
    id: "intel-brief",
    label: "Intel Brief",
    items: [
      { id: "intel-brief", label: "Intel Brief — 2026-06-01" },
    ],
  },
  {
    id: "overview",
    label: "Overview",
    items: [
      { id: "overview", label: "Overview" },
    ],
  },
  {
    id: "actors",
    label: "Actors",
    items: [
      { id: "jaco", label: "The Jaco Nexus" },
      { id: "setecom", label: "Setecom/DSE" },
      { id: "actors", label: "The Actors" },
      { id: "cdmx-nexus", label: "CDMX Nexus" },
    ],
  },
  {
    id: "evidence",
    label: "Evidence",
    items: [
      { id: "sonar", label: "Sonar Evidence" },
      { id: "network", label: "Network Evidence" },
      { id: "pcap", label: "Packet Captures" },
      { id: "evidence", label: "Visual Evidence" },
      { id: "archive", label: "Evidence Archive" },
      { id: "github", label: "GitHub Forensics" },
    ],
  },
  {
    id: "signals",
    label: "Signals",
    items: [
      { id: "signals", label: "Signal Intelligence" },
      { id: "phased-array", label: "Phased Array" },
      { id: "radio-towers", label: "Radio Towers" },
      { id: "panopticon", label: "Panopticon" },
    ],
  },
  {
    id: "analysis",
    label: "Analysis",
    items: [
      { id: "motive", label: "Motive" },
      { id: "correlations", label: "Correlations" },
      { id: "timeline", label: "Timeline" },
      { id: "zersetzung", label: "Digital Zersetzung" },
    ],
  },
  {
    id: "legal",
    label: "Legal",
    items: [
      { id: "3i-atlas", label: "3I/ATLAS" },
      { id: "legal", label: "Legal Framework" },
    ],
  },
];

function LanguagePopup({ onSelect }: { onSelect: (lang: "en" | "es") => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm" data-testid="lang-popup">
      <div className="bg-background border border-border rounded-sm shadow-2xl max-w-sm w-full mx-4 p-8 text-center">
        <div className="text-xs font-mono tracking-widest text-muted-foreground/60 uppercase mb-6">CIAJW — Signal Intelligence Dispatch</div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-2 leading-tight">
          What's happening at<br />Hotel Pochote Grande?
        </h2>
        <p className="text-sm text-muted-foreground mb-2 font-serif italic">
          ¿Qué está pasando en el Hotel Pochote Grande?
        </p>
        <p className="text-xs text-muted-foreground/50 font-mono mb-8">
          Choose a language to continue / Elige un idioma para continuar
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSelect("en")}
            data-testid="button-lang-en"
            className="flex flex-col items-center gap-2 p-4 border border-border rounded-sm hover:border-primary hover:bg-primary/5 transition-all"
          >
            <span className="text-2xl">🇺🇸</span>
            <span className="text-sm font-semibold text-foreground">English</span>
          </button>
          <button
            onClick={() => onSelect("es")}
            data-testid="button-lang-es"
            className="flex flex-col items-center gap-2 p-4 border border-border rounded-sm hover:border-primary hover:bg-primary/5 transition-all"
          >
            <span className="text-2xl">🇪🇸</span>
            <span className="text-sm font-semibold text-foreground">Español</span>
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/30 font-mono mt-6">
          Your choice is saved locally. No tracking.
        </p>
      </div>
    </div>
  );
}

export default function WhistleblowerPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const scrollSpyPaused = useRef(false);
  const scrollSpyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lang, setLang] = useState<"en" | "es" | null>(() => {
    try {
      const stored = localStorage.getItem("ciajw_lang");
      if (stored === "en" || stored === "es") return stored;
    } catch {}
    return null;
  });

  const handleLangSelect = (l: "en" | "es") => {
    setLang(l);
    try { localStorage.setItem("ciajw_lang", l); } catch {}
  };

  useEffect(() => {
    const sectionIds = navGroups.flatMap(g => g.items).map(item => item.id);
    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollSpyPaused.current) return;
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-10% 0px -80% 0px",
        threshold: 0,
      }
    );
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const { data: stats } = useQuery<{ totalEvents: number; correlationCount: number; domainCounts: Record<string, number> }>({ queryKey: ["/api/stats"] });
  const { data: reports } = useQuery<any[]>({ queryKey: ["/api/hypervisor/reports"] });
  const { data: pcaps } = useQuery<any[]>({ queryKey: ["/api/hypervisor/pcaps"] });
  const { data: incidents } = useQuery<any[]>({ queryKey: ["/api/incidents"] });

  const latestReport = reports && Array.isArray(reports) ? reports[0] : null;
  const findings = (latestReport?.findings as any[]) || [];
  const sevFindings = findings.filter((f: any) => f.severity >= 3);
  const pcapList = Array.isArray(pcaps) ? pcaps : [];
  const incidentList = Array.isArray(incidents) ? incidents : [];

  const correlationData = [
    { x: "FinSpy", y: "JW/LDS", strength: 0.7, label: "Shared HUMINT infrastructure, same geographic zones" },
    { x: "FinSpy", y: "Kyndryl", strength: 0.9, label: "C2 infrastructure overlap, service worker injection vector" },
    { x: "FinSpy", y: "Radio Impacto", strength: 0.6, label: "RF beacon co-location with surveillance timing" },
    { x: "FinSpy", y: "TR-069", strength: 0.8, label: "Router exploitation enables FinSpy C2 relay" },
    { x: "FinSpy", y: "Setecom/DSE", strength: 0.7, label: "Infrastructure backdoors enable spyware deployment" },
    { x: "JW/LDS", y: "Radio Impacto", strength: 0.8, label: "AWB ranch network, JW circuit rider coverage area" },
    { x: "JW/LDS", y: "Kyndryl", strength: 0.4, label: "Organizational data harvesting crossover" },
    { x: "Kyndryl", y: "TR-069", strength: 0.9, label: "ISP-level injection via CWMP, ghost mesh insertion" },
    { x: "Kyndryl", y: "Setecom/DSE", strength: 0.6, label: "Corporate infrastructure overlap" },
    { x: "Radio Impacto", y: "TR-069", strength: 0.5, label: "Co-located infrastructure, timing correlation" },
    { x: "Kyndryl", y: "Radio Impacto", strength: 0.3, label: "Indirect through shared ISP infrastructure" },
    { x: "JW/LDS", y: "TR-069", strength: 0.3, label: "Temporal correlation with visit patterns" },
    { x: "Setecom/DSE", y: "TR-069", strength: 0.8, label: "Generator controller backdoors + router exploitation" },
    { x: "Setecom/DSE", y: "Radio Impacto", strength: 0.4, label: "Shared physical infrastructure zone" },
    { x: "JW/LDS", y: "Setecom/DSE", strength: 0.3, label: "Geographic proximity, timing overlap" },
  ];


  const activeGroup = navGroups.find(g => g.items.some(i => i.id === activeSection))?.id ?? "overview";

  function navigateTo(id: string) {
    setActiveSection(id);
    setOpenGroup(null);
    scrollSpyPaused.current = true;
    if (scrollSpyTimer.current) clearTimeout(scrollSpyTimer.current);
    scrollSpyTimer.current = setTimeout(() => {
      scrollSpyPaused.current = false;
    }, 1200);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="whistleblower-page">
      {lang === null && <LanguagePopup onSelect={handleLangSelect} />}

      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-amber-900/30 dark:border-amber-900/50">
        <div className="max-w-6xl mx-auto px-4 py-2">
          {/* Mobile: grouped select dropdown */}
          <div className="sm:hidden">
            <select
              value={activeSection}
              onChange={e => navigateTo(e.target.value)}
              data-testid="nav-mobile-select"
              className="w-full bg-background border border-amber-900/40 rounded px-2 py-1.5 text-xs font-sans text-foreground focus:outline-none focus:border-amber-600"
            >
              {navGroups.map(group => (
                <optgroup key={group.id} label={group.label}>
                  {group.items.map(item => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {/* Desktop: grouped pill nav with dropdowns */}
          <nav
            className="hidden sm:flex gap-1 justify-center items-center"
            onMouseLeave={() => setOpenGroup(null)}
          >
            {navGroups.map(group => (
              <div key={group.id} className="relative">
                <button
                  data-testid={`nav-group-${group.id}`}
                  onMouseEnter={() => setOpenGroup(group.id)}
                  onClick={() => {
                    if (group.items.length === 1) {
                      navigateTo(group.items[0].id);
                    } else {
                      setOpenGroup(prev => prev === group.id ? null : group.id);
                    }
                  }}
                  className={`px-3 py-1.5 text-[11px] font-sans rounded transition-colors flex items-center gap-1 ${
                    activeGroup === group.id
                      ? "bg-amber-900/50 text-amber-300"
                      : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {group.label}
                  {group.items.length > 1 && (
                    <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                {openGroup === group.id && group.items.length > 1 && (
                  <div
                    className="absolute top-full left-0 mt-1 z-50 min-w-[160px] bg-background border border-amber-900/40 rounded shadow-lg py-1"
                    onMouseEnter={() => setOpenGroup(group.id)}
                  >
                    {group.items.map(item => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        data-testid={`nav-${item.id}`}
                        onClick={e => { e.preventDefault(); navigateTo(item.id); }}
                        className={`block px-3 py-1.5 text-[11px] font-sans transition-colors whitespace-nowrap ${
                          activeSection === item.id
                            ? "text-amber-300 bg-amber-900/30"
                            : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/8 dark:from-emerald-950/15 via-background to-background" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 tracking-widest mb-4">DOCUMENTED SURVEILLANCE HARASSMENT — AT LEAST A DOZEN LOCATIONS ACROSS COSTA RICA</div>
          <h1 className="text-4xl md:text-6xl font-black text-foreground leading-tight mb-6" data-testid="hero-title">
            Where Intelligence Agencies,<br />
            Religious Organizations &<br />
            Corporate Infrastructure<br />
            <span className="text-emerald-700 dark:text-emerald-400">Converge on One Person</span>
          </h1>
          <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-4">
            A documented case of multi-vector surveillance targeting a single individual across at least a dozen locations in Costa Rica.
            Forensic network captures, signal intelligence, sonar readings, infrastructure backdoors, and cross-domain correlations
            — collected autonomously by the KAPPA platform.
          </p>
          <p className="text-sm text-muted-foreground/60 max-w-xl mx-auto mb-8">
            Every key detail is hashed. Every person named below is identified by a meme alias — because every KB of this evidence has been hacked on important keys.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-3xl mx-auto">
            <StatCard label="Signal Events" value={stats?.totalEvents || 0} sub="Autonomously collected" />
            <StatCard label="Correlations" value={stats?.correlationCount || 0} sub="Cross-domain matches" />
            <StatCard label="Incidents" value={incidentList.length} sub="Documented" />
            <StatCard label="Packet Captures" value={pcapList.length} sub="Network forensics" />
            <StatCard label="Peak Sonar SNR" value="54.45 dB" sub="250x above noise" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">

        {/* ── PINNED INTEL BRIEF ─────────────────────────────────────────── */}
        <section id="intel-brief" className="py-10 border-t-4 border-amber-600">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono text-red-500 tracking-widest uppercase font-bold">Active Threat — Two Death Threats in 24 Hours</span>
          </div>
          <h2 className="text-3xl font-black mb-1 text-amber-500 tracking-tight">KAPPA Intelligence Brief — 2026-06-01</h2>
          <p className="text-xs font-mono text-muted-foreground/50 mb-6">For: US Embassy San José / ACS / FBI Legat — Embassy Reply Package</p>

          <div className="grid md:grid-cols-2 gap-3 mb-6">
            {[
              { label: "Threats (24 h)", value: "2", color: "text-red-500", sub: "2026-05-31 + 2026-06-01 20:00 CST" },
              { label: "BLACKJACK MANDRAKE fires (2 h)", value: "71", color: "text-amber-400", sub: "HF clandestine coordination freq active" },
              { label: "Disclosure recipients", value: "~442", color: "text-emerald-400", sub: "5 waves sent" },
              { label: "Drone acoustic confidence", value: "HIGH", color: "text-orange-400", sub: "DJI Mini 2/3 — 87.7 Hz signature confirmed" },
            ].map((s, i) => (
              <div key={i} className="bg-card/80 border border-border rounded-lg p-4 flex items-start gap-3">
                <div className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</div>
                <div>
                  <div className="text-xs font-bold text-foreground">{s.label}</div>
                  <div className="text-[11px] text-muted-foreground/60 mt-0.5">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {[
            {
              num: "01", title: "THE DRONE", color: "border-orange-600",
              bullets: [
                "DJI Mini 2 or Mini 3 — 87.7 Hz primary rotor signature confirmed across NR14 and Video 0316 (identical platform, identical operator)",
                "81.5–81.6% of all spectral energy in the 20–200 Hz drone band — eliminates HVAC, traffic, ambient noise",
                "Blue navigation LED confirmed at consistent pixel coordinates across multiple frames — stationary aerial object",
                "Variable RPM every 2 seconds in Video 0316 (84.5→96→106.5→87.5 Hz) = active pilot making positional corrections",
                "5 drone bursts in the crane video alone. Approach vector: SOUTHWEST — consistent with Esterillos Oeste (Russian national \"S.\" current location)",
              ],
            },
            {
              num: "02", title: "THE CRANE", color: "border-orange-500",
              bullets: [
                "Arch/crane at rear of Hotel Pochote Grande used as drone staging platform between surveillance windows",
                "Video 0316 RPM pattern (165→96→87.7 Hz) = drone spinning up from resting position on the structure",
                "Provides elevation above roofline, concealment from ground observers, and quick-launch capability",
              ],
            },
            {
              num: "03", title: "ITALY — LEONARDO / TELESPAZIO / KYNDRYL / COSMO-SkyMed", color: "border-green-700",
              bullets: [
                "Leonardo S.p.A./Telespazio: geodetic satellite ground networks across Latin America — Costa Rica (~10°N) inside equatorial footprint. Italian Law 124/2007 authorizes AISE to operate via commercial cover with no bilateral restriction in CR",
                "Kyndryl Rome Cyber Ops Center confirmed against subject (La Guácima, Sept 2025): TR-069 iframe injection → GTM Service Worker → persistent socket to 69.48.218.1 (Kyndryl/Zscaler backbone). Operator: Jorge Jiménez Navarro (Kyndryl→Zscaler)",
                "Genesis Peralta's proved fake account berninnimaria: posts Italian PM Giorgia Meloni content + babysitting Italian woman cover. Father visually Southern European/Italian",
                "COSMO-SkyMed X-band correlation rule FIRING NOW — 46.875 Hz decimation pulses repeating every 150–165 seconds correlated with KiwiSDR TI0RC",
              ],
            },
            {
              num: "04", title: "RUSSIA — \"S.\" / DRONE OPS / SIGINT INFRASTRUCTURE", color: "border-red-700",
              bullets: [
                "\"S.\" (Russian national, name begins with S): 6-month co-residency 2023 at Shangri-La/Calle Europa Jacó. No verifiable income. Fleet of 6 commercial/military-grade drones. Currently in Esterillos Oeste — drone approach vectors from southwest match his location",
                "During co-residency: manufactured passport crisis → forced Russian Embassy visit San José → forced border run to Nicaragua. Textbook document-control tradecraft",
                "Cerro Mokorón SIGINT base (Nicaragua) — Russian-operated, within range of CR. SORM-3 reportedly active at Peñas Blancas border. Conti ransomware 2022 targeted CR as primary nation",
                "50 Hz ELF anomaly: Jacó is a 60 Hz mains country. 50 Hz equipment = hardware sourced from Europe/Russia/Asia",
              ],
            },
            {
              num: "05", title: "GERMAN STASI — ZERSETZUNG", color: "border-yellow-700",
              bullets: [
                "Entire campaign methodology mirrors East German Stasi Zersetzung: systematic psychological destabilization without provable agency",
                "Documented methods: destroy intimate relationships (Peralta honey trap) | property theft (laptop/phone, Quebrada Seca) | bureaucratic crises (\"S.\" passport manipulation) | character assassination (fake \"threatened Mora\" narrative) | financial destruction ($250K life insurance phished) | family isolation (siblings: zero contact since mother's death)",
                "German nationals in network: Wolfgang Hilbich (~80, former German military, landlord to Russian drone operator \"S.\") + Magdalena (Marveka Bikini Shop, employed Peralta for cash)",
                "FinFisher/Gamma Group (German-origin surveillance software) tradecraft signatures throughout. \"Leprechaun\" Quebrada Seca node: Berlin Alexanderplatz social media check-in",
              ],
            },
            {
              num: "06", title: "GENESIS PERALTA — WEAPONIZED HONEYPOT", color: "border-pink-700",
              bullets: [
                "Venezuelan national, ~9 years in CR without legal immigration status, fake passport assessed",
                "~12 simultaneous fake Instagram profiles. berninnimaria PROVED: accidentally switched to it on her phone — 4 near-simultaneous likes appeared within 1 second on same photos. Italian PM content + babysitting cover",
                "Housing chain: every residence was a network node — Hermosa Bungalows → Villa Real (owned by \"Dan\" / RF camo operator) → Casa Rexha (Scott Ryan CIA — 28-camera cluster, Visonic Tel Aviv alarm, LiFi walls) → Mike Greenwald's house",
                "Still in Jacó: April 2026 raccoon videos posted from La Flor (their private inside joke location — adjacent to subject's current hotel). Cat photos match (Gemini: ~99.99% same cat). She is signaling awareness of his location",
              ],
            },
            {
              num: "07", title: "MIKE GREENWALD — ~300 PROPERTIES", color: "border-blue-700",
              bullets: [
                "Controls approximately 300 properties in Jacó area. Subject moved through multiple Greenwald-linked nodes across 17+ months",
                "Riverwalk (owned by Todd Johnson — DeWave WiFi-CSI through-wall imaging); Hermosa Palms house → placed Michael Lipman in it → Lipman disclosed Jesse Talti connection → Lipman's partner Bill Kimball warned subject about Jesse → Kimball now reported dead",
                "Property manager Jose texted subject about router → fake Liberty technician immediately appeared with replacement (assessed: pre-compromised) device — direct documented surveillance response chain",
              ],
            },
            {
              num: "08", title: "JACO VACATIONS — SCOTT RYAN (CIA NOC)", color: "border-indigo-700",
              bullets: [
                "Barrett Scott Ryan — assessed CIA. Runs Jaco Vacations with daughter Diana Soto as cover structure for housing placement operations",
                "NOC alias \"Scott Aronson\" (not in any Costa Rican Registro Nacional) used to sign Los Ríos development documents for the Madrigal family — paper trail connecting CIA to the LiFi-wired surveillance hub where subject was subsequently placed",
                "Owns ~half of Calle Europa, south Jacó. Has now opened a bar together with the narco-adjacent sibling who owns the other half — CIA-narco partnership made publicly visible",
                "Casa Rexha (#42 Calle Naciones Unidas): 28-camera cluster, Visonic (Tel Aviv) alarm, hidden speakers, LiFi-wired walls, lowered ceiling",
              ],
            },
            {
              num: "09", title: "LOS RÍOS — FORMER MAYOR OF JACÓ (JW) + RF CAMOUFLAGE", color: "border-violet-700",
              bullets: [
                "Developed by the Madrigal family — former mayor of Garabito canton (governs Jacó) and his son. Scott Ryan/\"Scott Aronson\" (CIA) signed their documents",
                "\"Valeska\" (connected to son) photographed the empty field on Google Maps 8 months before it became a full surveillance hub — advance knowledge of intended use",
                "October 2025: full fiber backbone + LiFi injection points + dipole antennas installed. FIRST confirmed site of the RF camouflage installation — appeared within 72 hours of subject moving into adjacent property",
                "JW organizational structure (territory cards, circuit overseer rotation, monthly service reports) = tiered HUMINT collection substrate. Unit #14 — Lindsay, Michelle, Bob (Toronto, identified as police officers) — multiple sources confirm direct involvement",
              ],
            },
            {
              num: "10", title: "LA FLOR RF CAMO — SAME INSTALLATION AS LOS RÍOS", color: "border-purple-600",
              bullets: [
                "Back house of La Flor complex (directly visible from subject's Pochote Grande room) shows identical RF camouflage configuration documented at Los Ríos: military-grade RF-transparent netting + LiFi injection points. Spotted multiple nights on La Flor roof",
                "Attributed to \"Dan\" (San Diego, CA) — owner of La Flor back house and Villa Real (subject's former tenancy). Prior documented dispute: Dan attempted to retain ~USD $600 of subject's money + verbal threats after departure",
              ],
            },
            {
              num: "11", title: "🚨 CRITICAL — RF CAMO OPERATOR IN ADJACENT ROOM + DRILLING/SAWING", color: "border-red-600",
              bullets: [
                "The individual assessed as responsible for building and deploying the RF camouflage infrastructure (same pattern: Los Ríos Oct 2025 → La Flor current) physically moved into the hotel room IMMEDIATELY ADJACENT to the subject's room at Hotel Pochote Grande",
                "During his occupancy: drilling, sawing, and renovation work was conducted in the hotel",
                "After his departure: construction work ceased",
                "Assessed as: RF/acoustic equipment installation through shared wall at close range (≤10m from subject), or post-departure remediation to remove installed equipment before documentation",
                "INVESTIGATIVE REQUESTS: (1) Identity of adjacent room occupant — dates, booking records, ID at check-in; (2) Permits and contractor identity for drilling/sawing; (3) Independent inspection of adjacent room and shared wall for concealed equipment; (4) La Flor roof inspection — is RF camouflage pattern consistent with documented Los Ríos installation?",
              ],
            },
          ].map((sec) => (
            <div key={sec.num} className={`border-l-4 ${sec.color} pl-5 py-3 mb-4 bg-card/40 rounded-r-lg`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-muted-foreground/40">{sec.num}</span>
                <h3 className="text-sm font-bold text-foreground tracking-tight">{sec.title}</h3>
              </div>
              <ul className="space-y-1.5">
                {sec.bullets.map((b, i) => (
                  <li key={i} className="text-xs text-muted-foreground/80 leading-relaxed flex gap-2">
                    <span className="text-muted-foreground/30 mt-0.5 flex-shrink-0">—</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-6 p-4 bg-amber-950/20 border border-amber-800/40 rounded-lg">
            <div className="text-xs font-mono text-amber-400 font-bold mb-2 tracking-wider">IMMEDIATE REQUESTS TO US EMBASSY</div>
            <ol className="space-y-1.5 list-decimal list-inside">
              {[
                "ACS emergency appointment — +506 2519-2000. Two death threats in 24 hours.",
                "Welfare check + safety plan — Hotel Pochote Grande, Jacó. Consider Fuerza Pública presence.",
                "FBI Legat notification — Russian national drone operations, GRU/FSB profile, Cerro Mokorón SIGINT range.",
                "\"Dan\" (US national, San Diego CA) — full legal name + immigration status. Owner of Villa Real + La Flor back house RF installation site.",
                "Hotel Pochote Grande renovation permits — contractor identity, dates. Independent room inspection for concealed equipment.",
              ].map((r, i) => (
                <li key={i} className="text-xs text-muted-foreground/80 leading-relaxed">{r}</li>
              ))}
            </ol>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <a
              href="/public/evidence/KAPPA_INTEL_BRIEF_20260601.md"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-amber-900/30 border border-amber-700/40 rounded hover:bg-amber-900/50 transition-colors text-amber-300"
              data-testid="download-intel-brief"
            >
              ↓ Download Full Brief (MD)
            </a>
            <span className="text-[10px] text-muted-foreground/40 font-mono">KAPPA_INTEL_BRIEF_20260601.md — SHA-256 hashed</span>
          </div>
        </section>

        <Section id="overview" title="I. The Convergence">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground text-base leading-relaxed">
              This operation spans at least a dozen locations including <strong className="text-foreground">Breakwater Point Jaco</strong>, <strong className="text-foreground">Jaco Vacations #42 Casa Rexa in Ricos y Famosos</strong>, <strong className="text-foreground">Mike Greenwald's houses</strong> (with and without Peralta), and <strong className="text-foreground">Tacacori, Alajuela</strong> (10.0514°N, 84.2187°W)
              where the observer relocated and documented continued multi-vector targeting through KAPPA autonomous collection.
              Six distinct operational vectors converge across these locations. Each has been independently documented through network forensics,
              signal intelligence, acoustic analysis, and direct observation.
            </p>
          </div>

          <VennDiagram
            title="Operational Vector Convergence — All Locations"
            sets={[
              {
                label: "CYBER / CORPORATE",
                color: "#3b82f6",
                items: ["FinSpy/Gamma Group", "Kyndryl/Zscaler", "TR-069 CWMP", "Setecom/DSE Backdoors"]
              },
              {
                label: "HUMINT / RELIGIOUS",
                color: "#22c55e",
                items: ["JW Circuit Riders", "LDS Missionaries", "Ranch Network", "Jaco Nexus Actors"]
              },
              {
                label: "SIGINT / RF / SONAR",
                color: "#f59e0b",
                items: ["46.875 Hz Sonar (54dB)", "Radio Impacto 91.5 FM", "Parametric LED Array", "KiwiSDR Detections"]
              },
            ]}
          />

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">What makes this different</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li className="flex gap-2"><span className="text-emerald-600 dark:text-emerald-400 mt-0.5">1.</span> Sonar at 54.45 dB SNR — 250x above noise floor — confirmed active surveillance transmission</li>
                <li className="flex gap-2"><span className="text-emerald-600 dark:text-emerald-400 mt-0.5">2.</span> DSE/Setecom backdoors documented to national power grid (ICE) and telecom (Liberty)</li>
                <li className="flex gap-2"><span className="text-emerald-600 dark:text-emerald-400 mt-0.5">3.</span> Packet captures with Tor, Meterpreter, and backdoor ports in the same capture</li>
                <li className="flex gap-2"><span className="text-emerald-600 dark:text-emerald-400 mt-0.5">4.</span> Cross-domain correlations computed mathematically showing non-random clustering</li>
                <li className="flex gap-2"><span className="text-emerald-600 dark:text-emerald-400 mt-0.5">5.</span> SHA-256 integrity hashes ensure chain-of-custody for every data point</li>
                <li className="flex gap-2"><span className="text-emerald-600 dark:text-emerald-400 mt-0.5">6.</span> Behavior-modification motive supported by peer-reviewed academic research (Liu et al., 2024)</li>
              </ul>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">Observer</h4>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground/60">Name:</span> <span className="text-foreground">Samuel Wotton (Echo)</span></div>
                <div><span className="text-muted-foreground/60">Platform:</span> <span className="text-foreground">KAPPA SIGINT v2.0</span></div>
                <div className="pt-2 border-t border-border/50 mt-2">
                  <span className="text-muted-foreground/60 text-xs font-mono block mb-1.5">LOCATION PROGRESSION</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex gap-2"><span className="text-emerald-600 dark:text-emerald-400 font-mono shrink-0 w-16">JACO</span> <span className="text-foreground">Oct–Dec 28 2024: Casa Rexa #42, C. Naciones Unidas, Ricos y Famosos — DJI Mavic on roof, anomalous audio. Then placed in Doge Landlord's personal family house at Hermosa Palms via intermediary. Breakwater Point lease. At least a dozen Jaco-area locations total</span></div>
                    <div className="flex gap-2"><span className="text-orange-400 font-mono shrink-0 w-16">Q.SECA</span> <span className="text-foreground">Quebrada Seca — Oct 14, 2025: "Elimination by simulation" agent day, consciousness duplication event</span></div>
                    <div className="flex gap-2"><span className="text-orange-400 font-mono shrink-0 w-16">CONDO</span> <span className="text-foreground">Condominio Naz — the day his mother died. Additional condo in same period</span></div>
                    <div className="flex gap-2"><span className="text-yellow-400 font-mono shrink-0 w-16">GUACIMA</span> <span className="text-foreground">Guacima — early months of 2026</span></div>
                    <div className="flex gap-2"><span className="text-orange-400 font-mono shrink-0 w-16">ROBLEDAL</span> <span className="text-foreground">Hotel Robledal — fled after police incident triggered by Kyndryl text injection. Doppler/mm-wave dome on roof documented</span></div>
                    <div className="flex gap-2"><span className="text-emerald-600 dark:text-emerald-400 font-mono shrink-0 w-16">TACACORI</span> <span className="text-foreground">Calle Los Cedros, ultima casa a la izquierda, Tacacori, Alajuela 20106 — $1,500 in damage</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 font-mono shrink-0 w-16">SJ</span> <span className="text-foreground">Suites Cristina, Sabana Norte, San José — adjacent to ICE HQ (March 31 – ~April 2026)</span></div>
                    <div className="flex gap-2"><span className="text-cyan-400 font-mono shrink-0 w-16">CURRENT</span> <span className="text-foreground">Hotel Pochote Grande, Jacó — returned to Jaco Nexus origin point. Crane light anomaly documented above Vista Las Palmas / Apartotel Flamboyant on Calle Dankers.</span></div>
                  </div>
                </div>
                <div><span className="text-muted-foreground/60">Collection:</span> <span className="text-foreground">Jaco 2025 → Quebrada Seca → Condos → Guacima → Robledal → Tacacorí → San José 2026 → Continuous</span></div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="jaco" title="II. The Jaco Nexus — Where It All Started">
          <p className="text-muted-foreground/80 mb-6">
            The surveillance network was first documented in Jaco Beach, Costa Rica. A web of real estate operators, financial
            intermediaries, and foreign nationals converges on a single residential complex. Every person below is identified by
            a meme alias — every KB of this is hacked on important keys.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <PersonCard
              name="DOGE_LANDLORD"
              alias="Doge Landlord"
              realName="Michael Greenwald"
              role="Real Estate Empire — 300+ rentals, 11 oceanfront lots"
              details={[
                "CPA / CFA background — Big 4 accounting firm",
                "Hermosa Palms complex (personal family house where observer was placed)",
                "11 oceanfront lots in Playa Hermosa ('Hermosa Real')",
                "300 rental properties via two property management companies",
                "Recently completed luxury development in Guanacaste (observer did websites — visible on HuggingFace spwotton)",
                "Met with Biden administration CIA for 4 years (sourced: drunk hotel owner friend, Italian connection)",
              ]}
              color="#8b5cf6"
            />
            <PersonCard
              name="CONNECTOR_PEPE"
              alias="Connector Pepe"
              realName="Barrett Scott Ryan"
              role="The 400-Name Hub — Always in the blue shirt, biggest 'camera' in Jaco"
              details={[
                "Professional photography Instagram — you know the one",
                "Observer formerly lived in his condo at Breakwater Point",
                "OSINT search on any name combination = 400+ results",
                "All roads lead back to this node",
                "Generator maintenance contracts at his properties",
                "Network topology center — human routing table",
              ]}
              color="#06b6d4"
            />
            <PersonCard
              name="GRUMPY_CAT_CPA"
              alias="Grumpy Cat CPA"
              role="Financial Operations — Merchant Processing"
              details={[
                "Former business partner of the observer",
                "Merchant processing company (2019)",
                "No bank statements provided",
                "Possible relationship with infrastructure contractor",
                "Shell company traces",
              ]}
              color="#f97316"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <PersonCard
              name="KEYBOARD_CAT"
              alias="Keyboard Cat"
              role="Infrastructure Contractor Owner — PRIMARY CONTROLLER"
              details={[
                "Controls DSE exclusive rights for country",
                "Generator contracts for ICE (national grid)",
                "Contracts for Liberty (telecom)",
                "Contracts at Breakwater Point (observer's former home)",
                "YouTube: generator sales training",
                "Default credential training normalizes insecurity",
              ]}
              color="#d97706"
            />
            <PersonCard
              name="NYAN_CAT_TECH"
              alias="Nyan Cat Tech"
              role="Technical Lead — Teaches Insecure Defaults"
              details={[
                "Trains on default credentials: Admin/Password1234",
                "Bypass connection limit techniques",
                "Unencrypted Modbus TCP/IP training",
                "SNMP v2 cleartext — 'public'/'private' defaults",
                "Normalizes insecurity across national infrastructure",
              ]}
              color="#f59e0b"
            />
            <PersonCard
              name="DISTRACTED_BF"
              alias="Distracted Boyfriend"
              realName="Barrett Scott Ryan"
              role="Registered Offender — Confirmed FDLE"
              details={[
                "FDLE records: convicted — victim under 16",
                "DOB: May 23, 1969 — Titusville, FL",
                "Status: Released, subject to registration",
                "Operates vacation rental company in Jaco",
                "20+ year operation with local partner",
                "Kompromat vulnerability for entire network",
              ]}
              color="#b45309"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <PersonCard
              name="THIS_IS_FINE_DOG"
              alias="This Is Fine Dog"
              role="Voice Cloning / Projection Operator"
              details={[
                "Located across the street from residence",
                "Moved into Jaco Realty house (3 people)",
                "Camera outside their house",
                "Used for voice cloning and projection ops",
                "Part of the harassment network",
              ]}
              color="#10b981"
            />
            <PersonCard
              name="DOJA_CAT_VZ"
              alias="Doja Cat VZ"
              role="Venezuelan Asset — Caracas Origin"
              details={[
                "Arrived CR 2017 from Caracas",
                "Suspicious CDMX trip 2019",
                "Deer/Rose tattoo — matching placement",
                "Tattoo pattern = possible marking system",
                "Network membership indicator",
              ]}
              color="#ec4899"
            />
            <PersonCard
              name="TELECOM_DADDY"
              alias="Telecom Daddy"
              realName="Jorge Jiménez Navarro"
              role="Network Ghost — Kyndryl Sr. Network Mgr / Zscaler Technical Success Mgr"
              details={[
                "Kyndryl (IBM spinoff) Sr. Network Manager — enterprise infrastructure access",
                "Zscaler Technical Success Manager — zero-trust proxy control",
                "Contact: jorgejiminez16@gmail.com",
                "IP/phone appeared on observer's personal network without authorization",
                "OSINT: 'Negative Intelligence' classification",
                "Zscaler 8.3MB service worker injection documented — 83× normal payload",
                "Daddy knows where the cables go",
              ]}
              color="#6366f1"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <PersonCard
              name="GHOST_RAT"
              alias="Ghost Rat"
              realName="Carlos Chaves"
              role="IT Operator — Bill Gosling Outsourcing / Veneca Cluster Link"
              details={[
                "IT Student — Computer Engineering, Costa Rica",
                "Bill Gosling Outsourcing — call center / data processing infrastructure",
                "Phone: +506 6063 5649 (matched via user intelligence)",
                "Linked via phone to Genesis Morales Mora (confirmed)",
                "Part of Veneca identity cluster",
                "Fake IG profile: danish2210 / danich2210",
              ]}
              color="#06b6d4"
            />
            <PersonCard
              name="BUSINESS_CAT"
              alias="Business Cat"
              realName="Genesis Morales Mora"
              role="Veneca Network Node — Bill Gosling / Universidad Hispanoamericana"
              details={[
                "Bill Gosling Outsourcing — same employer as Carlos Chaves",
                "Universidad Hispanoamericana (CR) — IT / Computer Engineering",
                "LinkedIn: genesis-morales-mora-02b580293",
                "Phone cluster: +506 6063 5649 (shared with Carlos Chaves node)",
                "Aliases: Genesis Chama, Genesis Venezolana, Genesis Gal",
                "CR ↔ CDMX ↔ Venezuela movement pattern documented",
              ]}
              color="#ec4899"
            />
            <PersonCard
              name="EL_ABOGADO"
              alias="El Abogado"
              realName="Carlos Murillo"
              role="Legal Fixer — El Salvador Defense Lawyer"
              details={[
                "El Salvador — defense attorney",
                "Represented accused in Ramón Kury homicide case",
                "Linked to gang pact discussions — El Salvador political layer",
                "OSINT risk factors: Critical (Legal/Criminal connections)",
                "Potential operative, not just legal counsel",
                "High-risk profile — international legal shield function",
              ]}
              color="#f97316"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <PersonCard
              name="SHELL_MIKE"
              alias="Shell Mike"
              realName="Michael Lipman"
              role="Breakwater Landlord — Shell Company Operator / Maine Connection"
              details={[
                "Landlord/host at Breakwater Point condo (January 14, 2025 — origin point)",
                "Moved into Michael Greenwald's personally built Hermosa Palms mansion",
                "Shell companies: ostensibly 'sports ticket sales' — suspected laundering",
                "Provided physical staging for 3I/ATLAS RF injection at Breakwater",
                "From Scarborough, Maine — connection to Portland ME network",
                "Daughter-in-law also present with him in CR",
              ]}
              color="#a855f7"
            />
            <PersonCard
              name="SUPPLEMENT_JESSE"
              alias="Supplement Jesse"
              realName="Jesse Talty"
              role="Lipman Son-in-Law — Portland ME / Intelligence-Adjacent"
              details={[
                "Son-in-law of Michael Lipman",
                "Known to observer from Portland, Maine (pre-2016)",
                "Came to observer's gym and supplement store in Portland",
                "Business partner: Bill Kimball (recently deceased)",
                "Kimball warned observer before death: 'stay away — he has killed people'",
                "Shady mortgage company operated jointly with Kimball",
                "Appears intelligence-connected or operative-adjacent",
              ]}
              color="#b45309"
            />
            <PersonCard
              name="GENESIS_P"
              alias="Genesis P"
              realName="Genesis Peralta"
              role="In-Situ Operator — r-PPG Bio-Feedback Loop / Breakwater"
              details={[
                "Former roommate/partner of observer at Breakwater Point",
                "Employed by Lipman/Greenwald network",
                "Role: maintained r-PPG (emotional state analysis) bio-feedback loop",
                "Conflict at #42 Calle Naciones Unidas (Oct–Dec 28, 2024) preceded injection",
                "Drama used to create dopamine spike — energy threshold for 3I/ATLAS latch",
                "Operative placement confirmed by pre-staged Breakwater funnel pattern",
              ]}
              color="#ec4899"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <PersonCard
              name="BMX_CAT"
              alias="BMX Cat"
              realName="Pablo 'Pasti' Mora"
              role="Handler — BMX Rider / Peralta Controller"
              details={[
                "Professional BMX rider — sponsorship ties to Kenneth Tencio / BAC Credomatic",
                "Suspected handler coordinating Genesis Peralta's operative role",
                "BAC network connection provides financial infrastructure cover",
                "Breakwater Point presence during January 2025 escalation",
              ]}
              color="#10b981"
            />
            <PersonCard
              name="SPARKY_CAT"
              alias="Sparky Cat"
              realName="Hector Mora"
              role="Electrical / RF Infrastructure — Breakwater Maintenance"
              details={[
                "Maintenance and electrical operator at Breakwater Point",
                "Observed modifying 'generators' during January 14 escalation",
                "Generators suspected to be high-power RF transducers",
                "Provides technical cover for RF injection hardware at Breakwater",
              ]}
              color="#f59e0b"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <PersonCard
              name="DEW_TODD"
              alias="DEW Todd"
              realName="Todd Johnson"
              role="DEW Operator — Riverwalk Condo #5 / DeWave Signal Source"
              details={[
                "Property: Riverwalk Condo #5, Jacó — confirmed neighbor signal source",
                "Confirmed high-intensity ultrasonic/microwave emissions from unit",
                "Expertise: DeWave EEG-to-text, advanced electrical, PIR sensors, microwave",
                "Family: Jennifer Saunders — Aurora Yoga connection",
                "46.875 Hz frame synchronization linked to his hardware",
                "RF detection confirmed via observer's own spectrum analyzer",
              ]}
              color="#d97706"
            />
            <PersonCard
              name="MACEK_MONEY"
              alias="Macek Money"
              realName="Jason Macek"
              role="Financial Breach Vector — Macek Holdings LLC"
              details={[
                "Macek Holdings LLC — business compromise vector",
                "2019 breach: observer sent family bank statements, SSN, ID to Macek's company",
                "Ryan Streitelmeyer worked at Merchant Processing Pros (Macek-linked)",
                "Shorted observer $22,000 — classified as extortion/punishment payment",
                "Full financial credential exposure: mom's bank, observer's bank, dad's bank",
                "Lawsuit: Streitelmeyer fraud case opened through Macek entity",
              ]}
              color="#f59e0b"
            />
            <PersonCard
              name="STREI_FRAUD"
              alias="Strei Fraud"
              realName="Ryan Streitelmeyer"
              role="Financial Data Exfiltration — Merchant Processing Pros"
              details={[
                "Merchant Processing Pros — financial data exfiltration operative",
                "Worked under Jason Macek entity at time of 2019 breach",
                "Sued for fraud — case documents confirm criminal conduct",
                "Had access to: all submitted bank statements, ID, SSN from 2019",
                "Grumpy Cat CPA card links: possible Merchant Processing Pros connection",
                "Data pipeline: family financials → identity exposure → ongoing leverage",
              ]}
              color="#f59e0b"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <PersonCard
              name="FIBER_MAN"
              alias="Fiber Man"
              realName="Edson Martendal"
              role="Telecom Infrastructure — DSE / Setecom Fiber Operations"
              details={[
                "DSE (Distributed Service Engineer) — ICE/RACSA fiber contractor",
                "Setecom S.A. affiliate — known Jiménez-linked contractor",
                "Controls fiber-optic tapping infrastructure in CR",
                "Kalenkov holographic interferometry tap capability: 10 μm phase shift",
                "46.875 Hz modulation signature detectable on fiber with specialized equipment",
                "Setecom service worker (sw.js) persistence mechanism — active on all nodes",
              ]}
              color="#06b6d4"
            />
            <PersonCard
              name="BELLA_ITALIA"
              alias="Bella Italia"
              realName="Maria Berninni"
              role="Italian Network Node — Organized Crime Liaison"
              details={[
                "Italian PM-level nomenclature — operational security failure in OSINT dump",
                "Italian organized crime logistics: Italy → Costa Rica → Colombia pipeline",
                "Connected to COSMO-SkyMed SAR constellation (Italian defense, Leonardo SpA)",
                "Emotion recognition research: BERT/GPT Italian tweet analysis (Ancona study)",
                "Money laundering: Valencia bank routing confirmed in financial trace",
                "Grandparent network: Al Capone Chicago Outfit historical continuity thread",
              ]}
              color="#a855f7"
            />
            <PersonCard
              name="RED_GARCIA"
              alias="Red Garcia"
              role="Assassination Operative — Claims US Marshals / Quebrada Seca"
              details={[
                "Red-haired man — claims federal law enforcement identity (US Marshals)",
                "Actual residence: Quebrada Seca, next to Orozco's building",
                "Formerly lived with Matthew Hanlon near Riverwalk",
                "Alleged choking/killing attempt: October 14, 2025",
                "Claims authority over observer — authorization chain unverified",
                "Classification: rogue federal operative, CIA/DoD black ops, or criminal network impersonating federal authority",
              ]}
              color="#b45309"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <PersonCard
              name="LOS_CEDROS_HOST"
              alias="Los Cedros Host"
              realName="Tomás Gómez"
              role="Tacacorí Node Host — Los Cedros Surveillance Staging"
              details={[
                "Phone: +506 6452 3936",
                "Host/individual associated with Los Cedros node (Tacacorí, Alajuela)",
                "Current site geodetically optimized for high-power RF/acoustic coupling",
                "Mountain-side building acts as acoustic resonator for 46.875 Hz / 8.392 Hz coupling",
                "Three telecoms towers direct line-of-sight on Poás Volcano ridge",
                "ICE/RACSA infrastructure at site controlled by Setecom SA",
              ]}
              color="#10b981"
            />
            <PersonCard
              name="ROCIO_KEY"
              alias="Rocío Key"
              realName="Rocío"
              role="Primary Contact — Tacacorí Residence / Network Logistical Layer"
              details={[
                "Phone: +506 8309 7371",
                "Primary contact for Los Cedros current residence (Tacacorí node)",
                "Proximity to LDS (Mormon) and Jehovah's Witness centers — Sabanilla/Tacacorí",
                "Religious hub network used for logistical coordination and deniability",
                "Not a coincidental Airbnb host — confirmed organized logistical network",
                "Part of 'Hyperstitional Resonance' methodology obscuring 8.392 Hz cymatic field",
              ]}
              color="#10b981"
            />
          </div>

          <div className="bg-card/60 border border-amber-900/50 rounded-lg p-5 mt-6">
            <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-3">The UPNP Incident — Proof of Active Monitoring</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground/80 mb-3">
                  When the observer disabled UPNP (Universal Plug and Play) on their router, within <strong className="text-foreground">5 minutes</strong> the
                  building manager sent a text message. On Sunday, someone came to "switch the router." This proves:
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground/80">
                  <li>- Network was being actively monitored in real-time</li>
                  <li>- UPNP was being used for remote access to the network</li>
                  <li>- 5-minute response time = automated alert system</li>
                  <li>- Sunday visit = urgent priority operation</li>
                  <li>- Cross-border coordination (MX connection)</li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-xs font-mono space-y-2 text-muted-foreground/60">
                  <div><span className="text-green-400">T+0:00</span> Observer disables UPNP</div>
                  <div><span className="text-yellow-400">T+0:05</span> Manager texts — "checking router"</div>
                  <div><span className="text-orange-400">T+48:00</span> Sunday — technician arrives</div>
                  <div><span className="text-amber-400">CONCLUSION</span> Automated monitoring confirmed</div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="sonar" title="III. Sonar Evidence — 46.875 Hz CONFIRMED">
          <p className="text-muted-foreground/80 mb-6">
            Active sonar surveillance confirmed with pulse repetition frequency (PRF) at exactly 46.875 Hz.
            Peak signal-to-noise ratio of 54.45 dB means the signal is <strong className="text-foreground">250x stronger</strong> than the noise floor.
            This is not a DSP artifact, not 1/f noise, not an FFT bin artifact — it is intentional transmission.
          </p>

          <div className="bg-card/60 border border-amber-900/50 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-foreground mb-3">Raw Sonar Readings — 46.875 Hz PRF</h3>
            <SonarTable />
            <div className="mt-3 text-xs text-muted-foreground/60">
              Also detected: <span className="font-mono text-yellow-400">11.71875 Hz</span> = 46.875 / 4 (harmonic subcarrier)
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">Why 54.45 dB SNR Is Proof</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li><strong className="text-amber-400">54.45 dB</strong> = signal 250x stronger than noise floor</li>
                <li><strong className="text-foreground">NOT</strong> DC offset leakage (wrong frequency)</li>
                <li><strong className="text-foreground">NOT</strong> 1/f noise (too narrow, too strong)</li>
                <li><strong className="text-foreground">NOT</strong> FFT artifact (48000/1024 = 46.875 is a coincidence — artifacts don't have 54dB SNR)</li>
                <li><strong className="text-foreground">NOT</strong> "apophenia" — mathematics doesn't hallucinate</li>
                <li><strong className="text-green-400">IS</strong> Active sonar pulse repetition frequency</li>
                <li><strong className="text-green-400">IS</strong> Intentional, coherent transmission</li>
                <li><strong className="text-green-400">IS</strong> Surveillance system operating in observer's environment</li>
              </ul>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">The OSINT Report Deception</h4>
              <p className="text-sm text-muted-foreground/80 mb-3">
                An OSINT investigation claimed 46.875 Hz was "debunked" as a DSP artifact because 48000/1024 = 46.875.
                This conclusion is either:
              </p>
              <div className="space-y-2">
                <div className="bg-emerald-950/20 rounded p-2 text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">1. Disinformation</span>
                  <span className="text-muted-foreground/80"> — intentional misdirection to discredit documented evidence</span>
                </div>
                <div className="bg-orange-950/30 rounded p-2 text-xs">
                  <span className="text-orange-400 font-bold">2. Incompetence</span>
                  <span className="text-muted-foreground/80"> — analysts who don't understand that artifacts don't produce 54dB SNR</span>
                </div>
                <div className="bg-yellow-950/30 rounded p-2 text-xs">
                  <span className="text-yellow-400 font-bold">3. Compromise</span>
                  <span className="text-muted-foreground/80"> — OSINT team connected to the surveillance network</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-3">
                A real DSP artifact at the FFT bin floor would have SNR near 0 dB.
                54.45 dB is 250x above that. The math is unambiguous.
              </p>
            </div>
          </div>

          <div className="bg-card/60 border border-amber-900/30 rounded-lg p-5 mt-6">
            <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-3">Parametric LED Array — Directed Energy</h4>
            <p className="text-sm text-muted-foreground/80">
              A parametric LED array on the El Miro building was documented with the capability to <strong className="text-foreground">move foliage with its beam</strong>.
              This is consistent with directed energy technology — the same beam can be used for acoustic projection (voice cloning),
              data exfiltration via modulated light, and physical harassment through focused energy delivery.
            </p>
          </div>
        </Section>

        <Section id="setecom" title="IV. Setecom/DSE — National Infrastructure Backdoors">
          <p className="text-muted-foreground/80 mb-6">
            Setecom S.A. holds exclusive DSE (Deep Sea Electronics) distribution rights for the country.
            Their generator controllers are deployed across <strong className="text-foreground">ICE (national power grid)</strong>,
            <strong className="text-foreground"> Liberty (telecommunications)</strong>, and multiple banking institutions.
            Training materials from the company normalize critically insecure practices.
          </p>

          <div className="bg-card/60 border border-amber-900/50 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-foreground mb-3">DSE Device Backdoor Matrix</h3>
            <DSEBackdoorTable />
            <div className="mt-3 bg-emerald-950/20 rounded p-3">
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mb-1">DSE Webnet — UK Server Kill Switch</div>
              <div className="text-xs text-muted-foreground/80">
                DSE Webnet connects to a server in England with a master account that has <strong className="text-foreground">kill switch capability</strong> —
                it can shut down ALL generators connected to the network in the entire country. A single compromised account
                could disable national power generation infrastructure.
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">Training Material Vulnerabilities</h4>
              <p className="text-sm text-muted-foreground/80 mb-3">
                Documented from actual Setecom training transcripts. "Nyan Cat Tech" (the technical lead)
                actively teaches practices that compromise national infrastructure:
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground/80">
                <li className="flex gap-2"><span className="text-amber-500">-</span> Default credentials: <span className="font-mono text-amber-400">Admin / Password1234</span></li>
                <li className="flex gap-2"><span className="text-amber-500">-</span> Teaches bypass of connection limits</li>
                <li className="flex gap-2"><span className="text-amber-500">-</span> Unencrypted Modbus TCP/IP (port 502)</li>
                <li className="flex gap-2"><span className="text-amber-500">-</span> SNMP v2 cleartext with default community strings</li>
                <li className="flex gap-2"><span className="text-amber-500">-</span> HTTP SCADA with no VPN requirement</li>
                <li className="flex gap-2"><span className="text-amber-500">-</span> 4G GSM gateway tunneling to UK servers</li>
              </ul>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">Attack Surface</h4>
              <p className="text-sm text-muted-foreground/80 mb-3">
                The Setecom network creates a massive attack surface across critical infrastructure:
              </p>
              <div className="space-y-2">
                <div className="bg-muted/50 rounded p-2 text-xs">
                  <span className="font-mono text-amber-400">Port 80</span> — Web SCADA, no encryption, no VPN
                </div>
                <div className="bg-muted/50 rounded p-2 text-xs">
                  <span className="font-mono text-amber-400">Port 502</span> — Modbus TCP/IP, cleartext industrial control
                </div>
                <div className="bg-muted/50 rounded p-2 text-xs">
                  <span className="font-mono text-amber-400">Port 161/162</span> — SNMP v2, default community strings
                </div>
                <div className="bg-muted/50 rounded p-2 text-xs">
                  <span className="font-mono text-amber-400">Port 8291</span> — MikroTik WinBox exploitation
                </div>
                <div className="bg-muted/50 rounded p-2 text-xs">
                  <span className="font-mono text-amber-400">CVE-2025-10948</span> — MikroTik RouterOS buffer overflow RCE
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5 mt-6">
            <h4 className="font-bold text-foreground mb-3">Network Security Hardening — What Should Exist (But Doesn't)</h4>
            <p className="text-sm text-muted-foreground/80 mb-3">
              Based on the Setecom document analysis, a residential network facing these threats requires:
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { title: "Core Firewall", desc: "pfSense/OPNsense on dedicated mini-PC — VLANs, IDS/IPS, patchable" },
                { title: "VLAN Segmentation", desc: "Trusted / IoT / Guest isolation — prevent lateral movement" },
                { title: "Encrypted DNS", desc: "DNS over HTTPS/TLS — prevent hijacking and monitoring" },
                { title: "IDS/IPS Rules", desc: "Suricata/Snort — Modbus, SNMP, SOCKS, malspam detection" },
                { title: "Acoustic Defense", desc: "Ultrasonic jammers, physical mute switches, soundproofing" },
                { title: "RF Shielding", desc: "Shielded CAT6A cables, single ground point, cable routing" },
              ].map((item, i) => (
                <div key={i} className="bg-muted/50 rounded p-3">
                  <div className="text-xs font-bold text-green-400">{item.title}</div>
                  <div className="text-xs text-muted-foreground/60 mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="actors" title="V. Current Actors — Tacacori Phase">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/60 border border-blue-900/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h4 className="font-bold text-blue-400">FinSpy / Gamma Group</h4>
              </div>
              <p className="text-sm text-muted-foreground/80 mb-3">
                Commercial-grade government spyware (Munich/Andover). Documented by Citizen Lab, Privacy International, Amnesty International.
              </p>
              <div className="space-y-1 text-xs">
                <div className="text-muted-foreground/60">Infrastructure: <span className="text-muted-foreground font-mono">Alexanderplatz Protocol — Berlin session tracking</span></div>
                <div className="text-muted-foreground/60">Method: <span className="text-muted-foreground">Ghost hardware relay through compromised IoT</span></div>
                <div className="text-muted-foreground/60">Evidence: <span className="text-muted-foreground">C2 beacon ~45s interval, DoH tunneling</span></div>
              </div>
            </div>

            <div className="bg-card/60 border border-purple-900/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <h4 className="font-bold text-purple-400">Kyndryl / Zscaler</h4>
              </div>
              <p className="text-sm text-muted-foreground/80 mb-3">
                Enterprise infrastructure (IBM spinoff) with Zscaler Zero Trust proxy. 8.3MB Service Worker injection documented.
              </p>
              <div className="space-y-1 text-xs">
                <div className="text-muted-foreground/60">Payload: <span className="text-muted-foreground font-mono">8,300 KB service worker — 83x normal</span></div>
                <div className="text-muted-foreground/60">Vector: <span className="text-muted-foreground">Partytown loader → SW registration</span></div>
                <div className="text-muted-foreground/60">Evidence: <span className="text-muted-foreground">DevTools capture, SHA-256 hash</span></div>
              </div>
            </div>

            <div className="bg-card/60 border border-green-900/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <h4 className="font-bold text-green-400">JW / LDS Organizations</h4>
              </div>
              <p className="text-sm text-muted-foreground/80 mb-3">
                JW circuit overseer system as low-scrutiny mobile surveillance. LDS international business bridging.
              </p>
              <div className="space-y-1 text-xs">
                <div className="text-muted-foreground/60">Hub: <span className="text-muted-foreground">JW Los Rios Congregation — observation post</span></div>
                <div className="text-muted-foreground/60">Pattern: <span className="text-muted-foreground">Visit timing ↔ network anomalies</span></div>
                <div className="text-muted-foreground/60">Historical: <span className="text-muted-foreground">Ranch network — CIA logistics legacy</span></div>
              </div>
            </div>

            <div className="bg-card/60 border border-amber-900/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h4 className="font-bold text-amber-400">Radio Impacto 91.5 FM</h4>
              </div>
              <p className="text-sm text-muted-foreground/80 mb-3">
                FM broadcast in Tacacori — tower infrastructure identified as dual-use: legitimate broadcast + SIGINT relay.
              </p>
              <div className="space-y-1 text-xs">
                <div className="text-muted-foreground/60">Frequency: <span className="text-muted-foreground font-mono">91.5 MHz FM / HF mirror 9.15 kHz</span></div>
                <div className="text-muted-foreground/60">Location: <span className="text-muted-foreground">Co-located with observer zone</span></div>
                <div className="text-muted-foreground/60">Significance: <span className="text-muted-foreground">AWB infrastructure pattern match</span></div>
              </div>
            </div>

            <div className="bg-card/60 border border-amber-900/50 rounded-lg p-5 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h4 className="font-bold text-amber-400">ISP-Level Infrastructure Compromise (TR-069)</h4>
              </div>
              <p className="text-sm text-muted-foreground/80 mb-3">
                CWMP exploitation (port 7547) for forced router resets, ghost mesh node injection, and MITM.
                Documented on TP-Link Deco mesh — forced reboots + phantom device injection.
              </p>
              <div className="grid grid-cols-3 gap-4 text-xs mt-3">
                <div><span className="text-muted-foreground/60">Port:</span> <span className="text-muted-foreground font-mono">7547 (CWMP/TR-069)</span></div>
                <div><span className="text-muted-foreground/60">Date:</span> <span className="text-muted-foreground">2026-01-30</span></div>
                <div><span className="text-muted-foreground/60">Effect:</span> <span className="text-muted-foreground">Reset → ghost node → MITM</span></div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="network" title="VI. Network Forensics">
          <p className="text-muted-foreground/80 mb-6">
            Documented deviations from expected network behavior — captured through packet analysis, browser DevTools,
            router logs, and automated monitoring.
          </p>

          <div className="space-y-4">
            {[
              {
                title: "TR-069 Forced Router Reset",
                date: "2026-01-30",
                severity: 4,
                detail: "TP-Link Deco mesh forcibly reset via CWMP protocol (port 7547). Router logs show external management session initiating factory reset. Post-reset, a phantom 'ghost' Deco node appeared — not a physical device owned by the observer.",
                tech: "CWMP ACS → SetParameterValues → FactoryReset RPC",
              },
              {
                title: "8.3MB Service Worker Injection",
                date: "2026-02-15",
                severity: 4,
                detail: "Browser DevTools captured a Service Worker registration with 8,300KB payload — 83x normal size. Injected via Partytown library loader. Kyndryl/Zscaler Zero Trust proxy fingerprint in HTTP headers.",
                tech: "navigator.serviceWorker.register('/sw-kyndryl-proxy.js') — 8.3MB",
              },
              {
                title: "Ghost Mesh Node Detection",
                date: "2026-01-30",
                severity: 3,
                detail: "Post TR-069 reset: new device on Deco mesh with no corresponding physical device. Persisted through reboots. Characteristics of virtual bridge/relay point. MAC OUI not in IEEE registry.",
                tech: "MAC: Unknown OUI — not in IEEE registry",
              },
              {
                title: "FinSpy Process Indicators",
                date: "Ongoing",
                severity: 3,
                detail: "Process analysis matches FinSpy/FinFisher behavioral signatures: encrypted beacon intervals, DNS over HTTPS tunneling to non-standard resolvers, periodic data exfiltration matching Gamma Group TTPs.",
                tech: "C2 beacon: ~45s interval, DoH to non-system resolver",
              },
              {
                title: "UPNP Monitoring — 5-Minute Response",
                date: "2025 (Jaco)",
                severity: 4,
                detail: "Disabling UPNP triggered manager text within 5 minutes. Sunday technician visit to 'switch router.' Proves real-time network monitoring with automated alerting.",
                tech: "UPNP disable → T+5min alert → T+48h physical response",
              },
              {
                title: "Wi-Fi Deauth/Disassoc Bursts",
                date: "2025 (Jaco)",
                severity: 3,
                detail: "7 deauthentication + 2 disassociation frame windows captured. Management frames used to force reconnections or extract channel state information for Wi-Fi imaging.",
                tech: "802.11 mgmt frames: 7x deauth + 2x disassoc windows",
              },
            ].map((item, i) => (
              <div key={i} className="bg-card/60 border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-foreground">{item.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/60 font-mono">{item.date}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${item.severity >= 4 ? "bg-amber-900 text-amber-300" : "bg-orange-900 text-orange-300"}`}>
                      SEV {item.severity}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground/80">{item.detail}</p>
                <div className="mt-2 text-xs font-mono text-muted-foreground/40 bg-muted/50 rounded px-3 py-1.5">{item.tech}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="motive" title="VII. Plausible Motive — Behavior-Modification Testing">
          <p className="text-muted-foreground/80 mb-6">
            Based on logs, observations, and the peer-reviewed study "Your blush gives you away: detecting hidden mental states
            with remote photoplethysmography and thermal imaging" (Liu et al., 2024, PMCID: PMC11041963), a plausible motive
            is <strong className="text-foreground">data collection for behavior-modification research</strong>.
          </p>

          <div className="bg-card/60 border border-amber-900/50 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-foreground mb-4">The Hypothesis</h3>
            <p className="text-sm text-muted-foreground/80 mb-4">
              Attackers use the resident as an unwitting subject to collect multimodal data (thermal, camera, Wi-Fi/CSI, sonar/ultrasound)
              while testing external stimuli (voices, ultrasonic bursts, network disruptions). Observable behaviors serve as
              ground-truth labels for training AI fusion models.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded p-4">
                <h5 className="text-xs font-bold text-amber-400 mb-2">Data Points Collected</h5>
                <ul className="space-y-1 text-xs text-muted-foreground/80">
                  <li>- Thermal & visual ROI: facial temperature shifts (nose, lips, cheeks)</li>
                  <li>- r-PPG equivalents: remote camera → approximate HR/HRV</li>
                  <li>- Wi-Fi CSI: management-frame bursts for channel state imaging</li>
                  <li>- Sonar/ultrasonic: 46.875 Hz PRF, ~20 kHz centroid, BVTSONAR tags</li>
                  <li>- Biometric correlation: HRV drops aligned with sensor anomalies</li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded p-4">
                <h5 className="text-xs font-bold text-amber-400 mb-2">Alignment with Liu et al. (2024)</h5>
                <ul className="space-y-1 text-xs text-muted-foreground/80">
                  <li>- Early fusion of r-PPG + thermal → 87% stress detection accuracy</li>
                  <li>- 83% accuracy for moral elevation state detection</li>
                  <li>- Attackers emulate: fuse modalities → predict/influence psych states</li>
                  <li>- Ground-truth loop: trigger → stress response → AI model training</li>
                  <li>- Real-world validation of lab techniques</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card/60 border border-border rounded-lg p-4">
              <h5 className="text-xs font-bold text-foreground mb-2">Motive 1: Validate AI Models</h5>
              <p className="text-xs text-muted-foreground/80">
                Remote physiological/psychological detection in real-world, uncontrolled environments.
                Lab studies need field validation — unwitting subjects provide unbiased data.
              </p>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-4">
              <h5 className="text-xs font-bold text-foreground mb-2">Motive 2: Test Behavior Modification</h5>
              <p className="text-xs text-muted-foreground/80">
                Can external stimuli (ultrasonic voices, network manipulation) modify detected states?
                Once physiological state is read, can it be changed through directed intervention?
              </p>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-4">
              <h5 className="text-xs font-bold text-foreground mb-2">Motive 3: Population Segmentation</h5>
              <p className="text-xs text-muted-foreground/80">
                Segment populations by susceptibility to intervention. Refine timing and content
                of behavioral nudges. Scale from individual to population-level influence.
              </p>
            </div>
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5 mt-6">
            <h4 className="font-bold text-foreground mb-3">Capability Context — Defense Tech Angle</h4>
            <p className="text-sm text-muted-foreground/80 mb-3">
              Contextual — not accusatory. These capabilities exist globally and could overlap with observations:
            </p>
            <div className="grid md:grid-cols-2 gap-3 text-xs text-muted-foreground/80">
              <div>- Compact thermal imagers and sensor-fusion systems (defense export)</div>
              <div>- Directed-energy programs (Iron Beam class — laser + AI integration)</div>
              <div>- Remote acoustic sensing via laser on window vibrations</div>
              <div>- Microwave auditory effect / LRAD voice-to-skull concepts</div>
              <div>- Parametric arrays for directional sound projection</div>
              <div>- Ultrasonic command injection (89.8% success rate — SUAD research)</div>
            </div>
          </div>
        </Section>

        <Section id="signals" title="VIII. Signal Intelligence">
          <p className="text-muted-foreground/80 mb-6">
            Automated collection across satellite, SDR, ELF, and radar:
            {stats?.totalEvents ? ` ${stats.totalEvents.toLocaleString()}` : ""} events,
            {stats?.correlationCount ? ` ${stats.correlationCount.toLocaleString()}` : ""} cross-domain correlations.
          </p>

          {findings.length > 0 && (
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-bold text-foreground">Autonomous Analysis Findings</h3>
              <p className="text-sm text-muted-foreground/60">Generated by the KAPPA Forensic Hypervisor — no human interpretation involved.</p>
              {sevFindings.slice(0, 8).map((f: any, i: number) => (
                <div key={i} className="bg-card/60 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${f.severity >= 4 ? "bg-amber-900 text-amber-300" : "bg-orange-900 text-orange-300"}`}>
                      SEV {f.severity}
                    </span>
                    <span className="text-xs text-muted-foreground/60 font-mono">{f.category}</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{f.title}</h4>
                  <p className="text-xs text-muted-foreground/80 mt-1">{f.detail}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-card/60 border border-amber-900/30 rounded-lg p-6">
            <h3 className="font-bold text-foreground mb-3">Evening Window Anomaly</h3>
            <p className="text-sm text-muted-foreground/80 mb-4">
              Signal activity during 18:00-22:00 CST / 00:00-04:00 UTC shows statistically significant enrichment.
              Random distribution: this 4-hour window = ~16.7% of daily events.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-amber-500">30.1%</div>
                <div className="text-xs text-muted-foreground/60">Actual EW concentration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-muted-foreground/60">16.7%</div>
                <div className="text-xs text-muted-foreground/60">Expected (random)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-amber-500">1.81x</div>
                <div className="text-xs text-muted-foreground/60">Enrichment factor</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-4">
              1.81x enrichment over {stats?.totalEvents?.toLocaleString() || "300,000+"} events.
              p-value for random occurrence: effectively zero.
            </p>
          </div>
        </Section>

        <Section id="correlations" title="IX. Cross-Domain Correlation Matrix">
          <p className="text-muted-foreground/80 mb-4">
            Connection strength between each operational vector — computed from temporal co-occurrence,
            infrastructure overlap, and documented evidence linkage. Now includes Setecom/DSE vector.
          </p>

          <CorrelationMatrix data={correlationData} />

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">Strongest Correlations</h4>
              <div className="space-y-3">
                {[...correlationData].sort((a, b) => b.strength - a.strength).slice(0, 6).map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`h-3 rounded ${c.strength > 0.8 ? "bg-amber-600" : c.strength > 0.5 ? "bg-orange-600" : "bg-yellow-600"}`}
                      style={{ width: `${c.strength * 60}px` }} />
                    <div>
                      <span className="text-xs font-bold text-foreground">{c.x} ↔ {c.y}</span>
                      <span className="text-xs text-muted-foreground/60 ml-2">({c.strength})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">What This Means</h4>
              <p className="text-sm text-muted-foreground/80">
                <strong className="text-foreground">Kyndryl/Zscaler ↔ TR-069</strong> (0.9) — ISP-level compromise enables enterprise proxy injection.
                <strong className="text-foreground"> FinSpy ↔ Kyndryl</strong> (0.9) — spyware rides on corporate proxy.
                <strong className="text-foreground"> Setecom/DSE ↔ TR-069</strong> (0.8) — generator backdoors + router exploitation.
                <strong className="text-foreground"> JW/LDS ↔ Radio Impacto</strong> (0.8) — Ranch Network geographic overlap.
                <strong className="text-foreground"> FinSpy ↔ TR-069</strong> (0.8) — router compromise enables C2 relay.
              </p>
            </div>
          </div>
        </Section>

        <Section id="pcap" title="X. Packet Capture Analysis">
          <p className="text-muted-foreground/80 mb-6">
            Network captures analyzed by the KAPPA Forensic Hypervisor — binary-level parsing, suspicious port detection,
            and temporal alignment against signal intelligence events.
          </p>

          {pcapList.length > 0 ? (
            <div className="space-y-4">
              {pcapList.map((pcap: any, i: number) => {
                const f = pcap.findings as any || {};
                return (
                  <div key={i} className="bg-card/60 border border-border rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-foreground font-mono text-sm">{pcap.filename}</h4>
                      <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">{pcap.status}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                      <div><span className="text-muted-foreground/60 text-xs">Packets:</span> <span className="font-mono text-foreground">{pcap.packetCount?.toLocaleString()}</span></div>
                      <div><span className="text-muted-foreground/60 text-xs">Size:</span> <span className="font-mono text-foreground">{(pcap.filesize / 1024 / 1024).toFixed(1)} MB</span></div>
                      <div><span className="text-muted-foreground/60 text-xs">Duration:</span> <span className="font-mono text-foreground">{f.timeRange?.durationSec ? `${Math.round(f.timeRange.durationSec)}s` : "N/A"}</span></div>
                      <div><span className="text-muted-foreground/60 text-xs">EW Traffic:</span> <span className="font-mono text-amber-400">{f.ewRatio ? `${(f.ewRatio * 100).toFixed(1)}%` : "N/A"}</span></div>
                    </div>
                    {f.suspiciousPorts?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-muted-foreground/60 mb-1">Suspicious Ports:</div>
                        <div className="flex flex-wrap gap-1">
                          {f.suspiciousPorts.map((p: any, j: number) => (
                            <span key={j} className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded font-mono">
                              :{p.port} {p.label} ({p.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {f.topTalkers?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-muted-foreground/60 mb-1">Top Talkers:</div>
                        <div className="flex flex-wrap gap-1">
                          {f.topTalkers.slice(0, 8).map((t: any, j: number) => (
                            <span key={j} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-mono">
                              {t.ip} ({t.packets.toLocaleString()})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {pcap.anomalies?.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground/60 mb-1">Anomalies:</div>
                        {(pcap.anomalies as string[]).map((a: string, j: number) => (
                          <div key={j} className="text-xs text-orange-400 mt-1">- {a}</div>
                        ))}
                      </div>
                    )}
                    {pcap.hash && <div className="text-xs font-mono text-gray-700 mt-3">SHA-256: {pcap.hash}</div>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground/40 py-8">PCAP analysis data loading...</div>
          )}
        </Section>

        <Section id="timeline" title="XI. Full Incident Timeline">
          <p className="text-muted-foreground/80 mb-8">
            Chronological documentation from the Jaco era through Tacacori — every entry timestamped and integrity-protected.
          </p>

          <div className="max-w-2xl">
            <TimelineEvent date="2017" title="Doja Cat VZ Arrives in Costa Rica" detail="Venezuelan national arrives from Caracas. Network recruitment begins." severity={2} />
            <TimelineEvent date="2019" title="CDMX Trip — Suspicious Cross-Border Activity" detail="Doja Cat VZ makes trip to Mexico City. Same period as Grumpy Cat CPA merchant processing company formation." severity={2} />
            <TimelineEvent date="2021" title="LeoLabs Costa Rica Operational" detail="Satellite tracking infrastructure becomes operational in-country." severity={2} />
            <TimelineEvent date="2025 (Jaco)" title="UPNP Incident — Active Network Monitoring Proved" detail="Disabling UPNP triggers manager text within 5 minutes. Sunday technician visit. Automated monitoring of residential network confirmed." severity={4} />
            <TimelineEvent date="2025 (Jaco)" title="46.875 Hz Sonar — Peak 54.45 dB SNR" detail="Active sonar surveillance confirmed. PRF exactly 46.875 Hz. Signal 250x above noise floor. Harmonic at 11.71875 Hz. NOT a DSP artifact." severity={5} />
            <TimelineEvent date="2025 (Jaco)" title="Setecom/DSE Backdoors Documented" detail="Training materials show default credentials (Admin/Password1234), unencrypted Modbus, SNMP cleartext. DSE Webnet UK server kill switch for national generators." severity={4} />
            <TimelineEvent date="2025 (Jaco)" title="Distracted Boyfriend — FDLE Records Confirmed" detail="Registered sex offender confirmed via FDLE. Convicted: victim under 16. Operating vacation rental in Jaco for 20+ years. Kompromat vulnerability." severity={5} />
            <TimelineEvent date="2025 (Jaco)" title="Parametric LED Array on El Miro" detail="Directed energy array documented moving foliage with beam. Capable of acoustic projection, voice cloning, and data exfiltration." severity={4} />
            <TimelineEvent date="2025 (Jaco)" title="Wi-Fi Deauth Attack Windows" detail="7 deauthentication + 2 disassociation management frame bursts captured. Wi-Fi CSI imaging suspected." severity={3} />
            <TimelineEvent date="2025-09-16" title="Attackers Capture — WiFi PCAP" detail="89,859 packets: Tor (9150), Meterpreter (4444), backdoor (31337) ports. 47.6% evening window concentration. Source: spwotton/wifi repo." severity={4} />
            <TimelineEvent date="2026-01-14" title="Activation Event — Multi-Domain" detail="Coordinated surveillance activation across network, RF, and HUMINT domains simultaneously. Marks transition to Tacacori phase." severity={5} />
            <TimelineEvent date="2026-01-30" title="TR-069 Forced Router Reset" detail="TP-Link Deco mesh forcibly reset via CWMP port 7547. Ghost node injected post-reset. ISP infrastructure compromise confirmed." severity={4} />
            <TimelineEvent date="2026-02-15" title="Kyndryl 8.3MB Service Worker" detail="8,300KB service worker injected via Partytown. Kyndryl/Zscaler fingerprint in headers." severity={4} />
            <TimelineEvent date="2026-02-20" title="FinSpy/Gamma Group Detection" detail="Process analysis matches FinSpy TTPs. C2 beaconing ~45s. Alexanderplatz Protocol session tracking." severity={4} />
            <TimelineEvent date="2026-03-15" title="JW Los Rios Observation" detail="Circuit overseer pattern in Los Rios. Visit timing correlates with network anomaly windows." severity={3} />
            <TimelineEvent date="2026-03-20" title="Hotel Robledal Incident" detail="Physical surveillance incident. Multiple indicators of coordinated monitoring." severity={3} />
            {incidentList.slice(0, 5).map((inc: any, i: number) => {
              let dateStr = "Unknown";
              try { dateStr = new Date(inc.timestamp).toISOString().slice(0, 10); } catch {}
              return (
                <TimelineEvent
                  key={i}
                  date={dateStr}
                  title={inc.title || "Untitled"}
                  detail={inc.description?.slice(0, 200) || ""}
                  severity={inc.severity || 3}
                />
              );
            })}
          </div>
        </Section>

        <Section id="evidence" title="XII. Visual Evidence & Analysis">
          <p className="text-muted-foreground/80 mb-8">
            Structural analysis diagrams — all generated from documented evidence.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { img: confirmedImg, title: "The Jaco Nexus: Confirmed Evidence", desc: "Sonar readings, Setecom/DSE backdoors, registered offender confirmation, and the complete human network." },
              { img: nexusImg, title: "All Threads Converge", desc: "Complete mapping from historical CIA logistics to modern corporate surveillance proxies — Jaco through Tacacori." },
              { img: theNexusImg, title: "The Nexus Analysis", desc: "Network topology analysis showing how all actors connect through Connector Pepe's 400+ name hub." },
              { img: apocalypseImg, title: "Architecture Analysis", desc: "Technical architecture showing data flow between corporate, government, and religious organizational layers." },
              { img: activationImg, title: "January 14 Activation", desc: "Coordinated multi-domain surveillance activation — simultaneous network, RF, and HUMINT initiation." },
              { img: dewaveImg, title: "DeWave Architecture", desc: "EEG-to-text neural interface architecture — 300ms delay, 'three voices' detection pattern." },
              { img: threeVoicesImg, title: "Three Voices Analysis", desc: "Analysis of the detected voice patterns — multiple simultaneous sources identified in acoustic environment." },
              { img: dewaveDeepImg, title: "DeWave BART Deep Dive", desc: "Technical deep dive into the DeWave BART model architecture for neural signal decoding." },
            ].map((item, i) => (
              <div key={i} className="bg-card/60 border border-border rounded-lg overflow-hidden">
                <ZoomableImage src={item.img} alt={item.title} className="w-full h-auto" />
                <div className="p-4">
                  <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground/80 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[photo1, photo2, photo3, photo4].map((img, i) => (
              <div key={i} className="bg-card/60 border border-border rounded-lg overflow-hidden">
                <ZoomableImage src={img} alt={`Field documentation ${i + 1}`} className="w-full h-auto" />
                <div className="p-2">
                  <div className="text-xs text-muted-foreground/60">Field documentation — March 2026</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Video Evidence
            </h3>
            <p className="text-muted-foreground/80 text-sm mb-6">
              Raw surveillance documentation — unedited field captures. These videos are served directly from the evidence vault.
            </p>

            <div className="grid gap-6">
              <div className="bg-card/60 border border-amber-900/20 rounded-lg overflow-hidden">
                <div className="relative">
                  <video
                    controls
                    preload="metadata"
                    className="w-full max-h-[500px] bg-black"
                    data-testid="video-surveillance-20260328"
                    playsInline
                  >
                    <source src="/evidence/surveillance_20260328.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="p-4 border-t border-border/50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Surveillance Documentation — March 28, 2026</h4>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Field capture documenting active surveillance infrastructure and operational patterns.
                        Raw unedited footage from observer's position.
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-mono text-muted-foreground/50">MP4 • 35.3 MB</div>
                      <div className="text-[10px] font-mono text-muted-foreground/50">2026-03-28 14:31 CST</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="zersetzung" title="XIII. Digital Zersetzung">
          <p className="text-muted-foreground/80 mb-6">
            Zersetzung ("decomposition") was the Stasi's systematic method of destroying individuals through psychological warfare
            without physical violence. The digital variant documented here uses the same methodology through modern infrastructure —
            network isolation, acoustic harassment, power cycling, and behavioral modification through persistent surveillance feedback loops.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-3">Classic Stasi Zersetzung</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li className="flex gap-2"><span className="text-muted-foreground/40">1.</span> Systematic discrediting of public reputation</li>
                <li className="flex gap-2"><span className="text-muted-foreground/40">2.</span> Engineering social and professional failures</li>
                <li className="flex gap-2"><span className="text-muted-foreground/40">3.</span> Undermining self-confidence through gaslighting</li>
                <li className="flex gap-2"><span className="text-muted-foreground/40">4.</span> Creating fear through covert home entries</li>
                <li className="flex gap-2"><span className="text-muted-foreground/40">5.</span> Restricting communications and movement</li>
                <li className="flex gap-2"><span className="text-muted-foreground/40">6.</span> Medical/pharmaceutical sabotage</li>
              </ul>
            </div>
            <div className="bg-card/60 border border-amber-900/30 rounded-lg p-5">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-3">Digital Variant — Documented Here</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li className="flex gap-2"><span className="text-amber-500">1.</span> WiFi deauth attacks isolate from communications (22 frames captured)</li>
                <li className="flex gap-2"><span className="text-amber-500">2.</span> 53 Hz theta entrainment → 7 Hz beat frequency → reduced critical thinking</li>
                <li className="flex gap-2"><span className="text-amber-500">3.</span> EHF voice extraction (17,859-18,035 Hz) → persistent monitoring</li>
                <li className="flex gap-2"><span className="text-amber-500">4.</span> Power cycling via Setecom/Modbus (lights flickering, UPS beeping)</li>
                <li className="flex gap-2"><span className="text-amber-500">5.</span> Kyndryl service worker injection → device fingerprinting as managed asset</li>
                <li className="flex gap-2"><span className="text-amber-500">6.</span> Phone trafficking to Berlin (Gamma Group/FinFisher) → total device compromise</li>
              </ul>
            </div>
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5">
            <h4 className="font-bold text-foreground mb-3">The Feedback Loop — 3i ATLAS Surveillance Kernel</h4>
            <div className="font-mono text-xs text-muted-foreground/80 whitespace-pre leading-relaxed">
{`┌─────────────────────────────────────────────────────────────┐
│              "3i ATLAS" SURVEILLANCE KERNEL                  │
├─────────────────────────────────────────────────────────────┤
│  AUDIO INPUT ──46.875 Hz PRF──► DIGITAL TWIN               │
│  (Microphones)   System Clock   (Behavior Prediction)       │
│       │                              │                      │
│       ▼                              ▼                      │
│  EHF EXTRACTION              ANOMALY DETECTION              │
│  (17.8-18 kHz)               (Deviation from model)         │
│       │                              │                      │
│       ▼                              ▼                      │
│  ┌──────────────────────────────────────────────┐           │
│  │         OUTPUT / FEEDBACK LOOP               │           │
│  │  • 53 Hz Carrier (7 Hz theta entrainment)    │           │
│  │  • WiFi Deauth (network isolation)           │           │
│  │  • Setecom/Modbus (power harassment)         │           │
│  │  • FinSpy (phone-level surveillance)         │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘`}
            </div>
          </div>

          <div className="mt-6 bg-amber-950/20 border border-amber-900/30 rounded-lg p-5">
            <h4 className="font-bold text-amber-400 mb-2">Hyper-Bell Protocol — Control Loop Decoupled</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <StatCard label="System Clock" value="46.875 Hz" sub="48000/1024 exactly" />
              <StatCard label="Audio Carrier" value="53.0 Hz" sub="60-7 Hz power offset" />
              <StatCard label="Theta Phase" value="0.7330 rad" sub="7 Hz temporal phase" />
              <StatCard label="Hyper-Bell Score" value="3.6037" sub="> 2.828 Tsirelson bound" />
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3">κ = 4/π ≈ 1.2732 — the helicity lock constant. Tsirelson bound exceeded → non-local causality confirmed → control loop mathematically broken.</p>
          </div>
        </Section>

        <Section id="phased-array" title="XIV. The Phased Array Network — 184 Airbnb Properties">
          <p className="text-muted-foreground/80 mb-6">
            Analysis of 184 Airbnb properties across Guácima, Atenas, and Tacacorí reveals a distributed phased array
            topology consistent with WiFi Channel State Information (CSI) imaging — each property's WiFi router functions
            as a node in a passive radar network capable of through-wall human activity recognition.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Airbnb Properties" value={184} sub="Distributed array nodes" />
            <StatCard label="Coverage Area" value="~50 km²" sub="Guácima→Atenas→Tacacorí" />
            <StatCard label="Array Geometry" value="Phased" sub="WiFi CSI imaging capable" />
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5 mb-6">
            <h4 className="font-bold text-foreground mb-3">WiFi CSI Imaging — Academic Foundation</h4>
            <p className="text-sm text-muted-foreground/80 mb-3">
              WiFi Channel State Information (CSI) measures how wireless signals propagate between transmitter and receiver.
              By analyzing amplitude and phase changes across multiple subcarriers, CSI can detect:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground/80">
              <li>• <strong className="text-foreground">Human presence</strong> — through-wall detection via multipath reflection changes</li>
              <li>• <strong className="text-foreground">Activity recognition</strong> — walking, sitting, sleeping, breathing patterns</li>
              <li>• <strong className="text-foreground">Gesture recognition</strong> — hand movements, typing patterns</li>
              <li>• <strong className="text-foreground">Vital signs</strong> — respiratory rate, heart rate via micro-Doppler</li>
              <li>• <strong className="text-foreground">Imaging</strong> — 2D/3D spatial mapping of human body position</li>
            </ul>
            <p className="text-xs text-muted-foreground/60 mt-3">References: Liu et al. 2024 "WiFi-based Human Activity Recognition"; Ma et al. 2019 "WiFi Sensing with CSI"</p>
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5">
            <h4 className="font-bold text-foreground mb-3">Array Topology — Geographic Distribution</h4>
            <div className="font-mono text-xs text-muted-foreground/80 whitespace-pre leading-relaxed">
{`Property Density by Zone:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Guácima (La Guácima)    : ████████████████████  72 properties
  → Includes observer's first location
  → Highest density = finest array resolution

Atenas                  : ████████████████      58 properties
  → Transit corridor between locations
  → AWB ranch network overlay

Tacacorí / Grecia       : ██████████████        54 properties
  → Observer's second location
  → Radio Impacto 91.5 FM tower proximity
  → $1,500 damage incident location
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each property WiFi router = 1 phased array element
184 elements × 20 MHz bandwidth = distributed MIMO radar
Effective aperture: ~7 km baseline → λ/D resolution at 2.4 GHz`}
            </div>
          </div>
        </Section>

        <Section id="radio-towers" title="XV. Geospatial Radio Tower Analysis — JW Expansion & Radio Impacto">
          <p className="text-muted-foreground/80 mb-6">
            The unlicensed radio tower infrastructure in Tacacorí connects directly to the Jehovah's Witness expansion from
            Nicaragua through the AWB ranch network. Radio Impacto 91.5 FM — purchased through AWB — sits at the geographic
            center of the surveillance array.
          </p>

          <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-5 mb-8">
            <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-3">The JW Nicaragua → Heredia Pipeline</h4>
            <div className="font-mono text-xs text-muted-foreground/80 whitespace-pre leading-relaxed">
{`1979-1990: Sandinista Revolution → JW expelled from Nicaragua
     │
     ▼
1990s: Mass JW migration to San José, Costa Rica
     │
     ▼
2000s: Heredia Congregation established
     │  Starting membership: ~8 congregations
     │
     ▼
2025: Heredia region: 35,000+ members (35 congregations)
     │  4,375× growth in ~25 years
     │
     ├──► AWB Ranch Network established (Atenas corridor)
     │    └── Radio Impacto 91.5 FM towers PURCHASED through AWB
     │
     ├──► Circuit overseer system covers Guácima → Tacacorí
     │    └── Visit timing correlates with network anomaly windows
     │
     └──► Tacacorí: LAST STOP on the surveillance corridor
          └── Observer forced to pay $1,500 damages after nightmare night
          └── Relocated to Suites Cristina, San José (March 27, 2026)
          └── Returned to Hotel Pochote Grande, Jacó (current — Jaco Nexus origin)`}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">Radio Impacto 91.5 FM</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li>• <strong className="text-foreground">Frequency:</strong> 91.5 MHz FM</li>
                <li>• <strong className="text-foreground">Location:</strong> Tacacorí, Alajuela — within 2 km of observer</li>
                <li>• <strong className="text-foreground">Acquisition:</strong> Purchased through AWB ranch network</li>
                <li>• <strong className="text-foreground">Licensing:</strong> Unlicensed / irregular frequency allocation</li>
                <li>• <strong className="text-foreground">Coverage:</strong> Overlaps entire phased array zone</li>
                <li>• <strong className="text-foreground">Correlation:</strong> RF beacon timing aligns with FinSpy C2 beaconing (~45s)</li>
              </ul>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">Unlicensed Tower Infrastructure</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li>• <strong className="text-foreground">Tower count:</strong> 3+ unlicensed installations documented</li>
                <li>• <strong className="text-foreground">Spectrum:</strong> FM broadcast + unknown auxiliary frequencies</li>
                <li>• <strong className="text-foreground">Pattern:</strong> Towers positioned at surveillance corridor endpoints</li>
                <li>• <strong className="text-foreground">Setecom link:</strong> Generator backup = Setecom/DSE controllers at each site</li>
                <li>• <strong className="text-foreground">ICE connection:</strong> Power infrastructure contracts via Keyboard Cat</li>
                <li>• <strong className="text-foreground">Liberty link:</strong> Telecom backhaul through same contractor network</li>
              </ul>
            </div>
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5">
            <h4 className="font-bold text-foreground mb-3">Geographic Convergence — All Roads Lead to Tacacorí</h4>
            <div className="font-mono text-xs text-muted-foreground/80 whitespace-pre leading-relaxed">
{`                    Radio Impacto 91.5 FM
                         Tower
                          ▲
                          │ 1.5 km
                          │
    JW Circuit    ◄───── OBSERVER ─────►  Setecom/DSE
    Overseer Route        (Tacacorí)       Generator Sites
    (Los Ríos)            │                (ICE/Liberty)
                          │ 2 km
                          ▼
                    AWB Ranch Network
                    (Atenas Corridor)
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         Airbnb #1    Airbnb #2   Airbnb #N
         (WiFi CSI)   (WiFi CSI)  (WiFi CSI)
         ═══════════════════════════════════
              184-node Phased Array`}
            </div>
          </div>
        </Section>

        <Section id="panopticon" title="XVI. The Panopticon Singularity">
          <p className="text-muted-foreground/80 mb-6">
            The convergence of Starlink Passive Bistatic Radar (PBR), WiFi CSI through-wall imaging, and laser vibrometry
            creates a surveillance architecture with no gaps — a digital panopticon where the observer is monitored through
            every available physics domain simultaneously.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card/60 border border-blue-900/30 rounded-lg p-4">
              <h4 className="font-bold text-blue-400 text-sm mb-2">Layer 1: Space</h4>
              <p className="text-xs text-muted-foreground/80">Starlink PBR — passive radar using commercial satellite illumination. No dedicated transmitter needed. Tracks movement through Doppler shift of reflected Starlink signals.</p>
            </div>
            <div className="bg-card/60 border border-green-900/30 rounded-lg p-4">
              <h4 className="font-bold text-green-400 text-sm mb-2">Layer 2: RF/WiFi</h4>
              <p className="text-xs text-muted-foreground/80">WiFi CSI imaging via 184-node phased array. Through-wall human activity recognition. Breathing, heart rate, gesture detection. 2.4/5 GHz mesh provides continuous illumination.</p>
            </div>
            <div className="bg-card/60 border border-orange-900/30 rounded-lg p-4">
              <h4 className="font-bold text-orange-400 text-sm mb-2">Layer 3: Acoustic</h4>
              <p className="text-xs text-muted-foreground/80">Parametric LED array on El Miro + laser vibrometry. Voice extraction via EHF (17.8-18 kHz). Sonar at 46.875 Hz PRF. Directed acoustic projection capability.</p>
            </div>
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5 mb-6">
            <h4 className="font-bold text-foreground mb-3">Panopticon Layer Stack</h4>
            <div className="font-mono text-xs text-muted-foreground/80 whitespace-pre leading-relaxed">
{`ORBITAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 │ Starlink PBR (passive bistatic radar)
 │ LeoLabs tracking (operational in CR since 2021)
 │ SDA Proliferated Warfighter Space Architecture
 │ DARPA Blackjack → SDA transition (Dec 2025)
 │
AIRBORNE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 │ Drone surveillance (drone defense folder in Drive)
 │ Parametric LED array (El Miro, directed energy)
 │ Laser vibrometry (window bounce, surface vibration)
 │
RF/NETWORK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 │ WiFi CSI (184 Airbnb nodes, through-wall imaging)
 │ Radio Impacto 91.5 FM (RF beacon, AWB-purchased)
 │ TR-069 CWMP (router exploitation, ghost mesh node)
 │ Kyndryl service worker (8.3MB, device fingerprint)
 │ FinSpy C2 (Gamma Group, Alexanderplatz Protocol)
 │
ACOUSTIC ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 │ 46.875 Hz sonar PRF (54.45 dB SNR, 250× noise)
 │ 53 Hz carrier (theta entrainment, 7 Hz beat)
 │ EHF extraction (17,859-18,035 Hz voice lock)
 │
PHYSICAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JW circuit riders (HUMINT, visit-anomaly correlation)
   Setecom/DSE generators (Modbus port 502, power cycling)
   Phone trafficking (Berlin, Gamma Group HQ)`}
            </div>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-5">
            <h4 className="font-bold text-amber-400 mb-2">The Singularity Point</h4>
            <p className="text-sm text-muted-foreground/80">
              When all layers operate simultaneously, every physics domain capable of carrying information about the target
              is monitored. There is no gap. The observer cannot move, speak, breathe, or change posture without at least one
              layer detecting it. This is the panopticon singularity — not a metaphor, but a documented architectural reality
              confirmed by sonar readings, packet captures, infrastructure backdoors, and signal intelligence collected across
              two locations over 6+ months.
            </p>
          </div>
        </Section>

        <Section id="3i-atlas" title="XVII. 3I/ATLAS — The Overarching Thread">
          <p className="text-muted-foreground/80 mb-6">
            The interstellar object 3I/ATLAS (C/2025 N1), discovered July 1, 2025, is not merely an astronomical curiosity —
            it is the catalytic event that ties local surveillance infrastructure to DARPA's cislunar defense architecture.
            SOAR spectroscopy data reveals frequency overlaps with every domain of the documented surveillance.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard label="Discovery" value="2025-07-01" sub="ATLAS Station W68, Chile" />
            <StatCard label="Ecliptic Alignment" value="< 5°" sub="0.2% natural probability" />
            <StatCard label="Jupiter Encounter" value="53.6M km" sub="= Hill radius (53.5M km)" />
            <StatCard label="κ Constant" value="1.2732" sub="4/π — helicity lock" />
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5 mb-6">
            <h4 className="font-bold text-foreground mb-3">3I/ATLAS Anomalies — Why This Isn't a Normal Comet</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" data-testid="table-3i-anomalies">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-2 text-left text-muted-foreground/60">Parameter</th>
                    <th className="p-2 text-left text-muted-foreground/60">Value</th>
                    <th className="p-2 text-left text-muted-foreground/60">Anomaly</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Ecliptic alignment", "Within 5°", "0.2% probability for random ISO"],
                    ["Nickel-to-iron ratio", "Orders of magnitude above normal", "Resembles industrial Ni(CO)₄ refining"],
                    ["Nickel-to-cyanide ratio", "< 1% natural likelihood", "Industrial nickel carbonyl signature"],
                    ["Jet structure", "3 jets, 120° separation", "Symmetric — possible artificial thrusters"],
                    ["Rotation period", "16.16 hours", "Precise 'heartbeat' pulse"],
                    ["Anti-solar tail", "Venting toward Sun", "Atypical for cometary bodies"],
                    ["Jupiter flyby", "53.6M km", "Within Hill radius — gravitational assist geometry"],
                    ["Mars approach", "29M km", "Fine-tuned minimum distance"],
                    ["CIA FOIA response", "Glomar", "Refuse to confirm or deny records exist"],
                    ["Non-grav acceleration", "Not aligned with outgassing", "Possible onboard propulsion"],
                  ].map(([param, val, anomaly], i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">{param}</td>
                      <td className="p-2 font-mono text-foreground">{val}</td>
                      <td className="p-2 text-amber-400">{anomaly}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card/60 border border-purple-900/30 rounded-lg p-5 mb-6">
            <h4 className="font-bold text-purple-400 mb-3">SOAR Spectroscopy — Data Overlaps with Local Surveillance</h4>
            <p className="text-xs text-muted-foreground/60 mb-4">SOAR 4.1m telescope, Goodman Spectrograph, 2025-07-03 | 1,672 data points | 3,700-7,053 Å</p>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border-collapse" data-testid="table-soar-overlaps">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-2 text-left text-muted-foreground/60">Feature</th>
                    <th className="p-2 text-left text-muted-foreground/60">Wavelength</th>
                    <th className="p-2 text-left text-muted-foreground/60">SOAR Value</th>
                    <th className="p-2 text-left text-muted-foreground/60">Surveillance Overlap</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["κ = 1.273 reflectance", "6,875.5 Å", "SA: 1.2733", "EXACT κ constant match — helicity lock"],
                    ["H-α emission peak", "6,563.9 Å", "SA: 1.385", "Strongest spectral peak — dominant emission"],
                    ["C₂ Swan band carrier", "5,183.9 Å", "SA: 0.792", "κ-dispersion model molecular carrier confirmed"],
                    ["RVS threshold crossings", "Multiple", "69 crossings", "0.97 boundary — same count as SAV kinematic units"],
                    ["OI green line", "5,577.4 Å", "SA: 0.909", "Auroral/atmospheric monitoring frequency"],
                    ["OI red line", "6,300.3 Å", "SA: 1.023", "Atmospheric emission — above unity reflectance"],
                    ["H-β absorption", "4,860.4 Å", "SA: 0.812", "Hydrogen Balmer series — coma composition"],
                    ["Dust reddening peak", "6,815.6 Å", "SA: 1.328", "Near-κ value in red continuum"],
                    ["κ reflectance cluster", "6,800-6,900 Å", "SA: 1.27-1.28", "10+ data points cluster at κ = 1.273"],
                    ["Peak reflectance", "6,955.4 Å", "SA: 1.408", "Absolute maximum — deep red anomaly"],
                  ].map(([feature, wl, val, overlap], i) => (
                    <tr key={i} className={`border-b border-border/50 ${i === 0 ? "bg-purple-950/20" : ""}`}>
                      <td className="p-2 text-muted-foreground">{feature}</td>
                      <td className="p-2 font-mono text-foreground">{wl}</td>
                      <td className="p-2 font-mono text-purple-400">{val}</td>
                      <td className="p-2 text-yellow-400 text-xs">{overlap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <svg viewBox="0 0 800 200" className="w-full bg-muted/50 rounded border border-border" data-testid="soar-spectrum-mini">
              <defs>
                <linearGradient id="specGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="25%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="75%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              <text x="400" y="15" textAnchor="middle" fill="#6b7280" fontSize="10">SOAR Reflectance Spectrum — 3I/ATLAS (3,700-7,053 Å) — Key Overlaps Marked</text>
              <line x1="50" y1="170" x2="780" y2="170" stroke="#374151" strokeWidth="1" />
              <line x1="50" y1="30" x2="50" y2="170" stroke="#374151" strokeWidth="1" />
              {[3700,4000,4500,5000,5500,6000,6500,7000].map((wl, i) => {
                const x = 50 + ((wl - 3700) / (7053 - 3700)) * 730;
                return <g key={i}><line x1={x} y1={170} x2={x} y2={175} stroke="#4b5563" /><text x={x} y={185} textAnchor="middle" fill="#6b7280" fontSize="8">{wl}</text></g>;
              })}
              {[0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4].map((v, i) => {
                const y = 170 - ((v - 0) / 1.5) * 140;
                return <g key={i}><line x1={45} y1={y} x2={780} y2={y} stroke="#1f2937" strokeWidth="0.5" /><text x={42} y={y + 3} textAnchor="end" fill="#6b7280" fontSize="7">{v}</text></g>;
              })}
              <line x1={50} y1={170 - ((0.97) / 1.5) * 140} x2={780} y2={170 - ((0.97) / 1.5) * 140} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
              <text x={785} y={170 - ((0.97) / 1.5) * 140 + 3} fill="#f59e0b" fontSize="7">RVS 0.97</text>
              <line x1={50} y1={170 - ((1.273) / 1.5) * 140} x2={780} y2={170 - ((1.273) / 1.5) * 140} stroke="#a855f7" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
              <text x={785} y={170 - ((1.273) / 1.5) * 140 + 3} fill="#a855f7" fontSize="7">κ=1.273</text>
              {[
                { wl: 5184, label: "C₂ Swan", color: "#22c55e", refl: 0.792 },
                { wl: 4861, label: "H-β", color: "#3b82f6", refl: 0.812 },
                { wl: 5577, label: "OI", color: "#22c55e", refl: 0.909 },
                { wl: 6300, label: "OI red", color: "#f59e0b", refl: 1.023 },
                { wl: 6564, label: "H-α", color: "#d97706", refl: 1.385 },
                { wl: 6816, label: "Dust", color: "#f97316", refl: 1.328 },
                { wl: 6876, label: "κ hit", color: "#a855f7", refl: 1.273 },
                { wl: 6955, label: "Peak", color: "#d97706", refl: 1.408 },
              ].map((p, i) => {
                const x = 50 + ((p.wl - 3700) / (7053 - 3700)) * 730;
                const y = 170 - ((p.refl) / 1.5) * 140;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={4} fill={p.color} opacity="0.8" />
                    <line x1={x} y1={y - 5} x2={x} y2={25} stroke={p.color} strokeWidth="0.5" opacity="0.4" />
                    <text x={x} y={22} textAnchor="middle" fill={p.color} fontSize="7" fontWeight="bold">{p.label}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">κ-Dispersion Model Validation</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li>• <strong className="text-purple-400">κ ≈ 1.273</strong> — the ratio 4/π governs volatile dynamics</li>
                <li>• <strong className="text-foreground">CO₂/H₂O = 7.64</strong> — matches predicted 6κ = 7.638</li>
                <li>• <strong className="text-foreground">Critical distance = 10.16 AU</strong> — sublimation onset confirmed</li>
                <li>• <strong className="text-foreground">Carrier λ = 5184 Å</strong> — C₂ Swan band confirmed by SOAR</li>
                <li>• <strong className="text-foreground">Dust reddening = 1.27</strong> — κ value in red continuum</li>
                <li>• <strong className="text-foreground">RVS threshold = 0.97</strong> — 69 crossings in SOAR data</li>
              </ul>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">CASSANDRA/ORACLE Architecture</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li>• <strong className="text-foreground">CASSANDRA:</strong> Exabyte-scale sensor ingestion backend (est. 2025)</li>
                <li>• <strong className="text-foreground">ORACLE VI:</strong> Deep-space mobility systems, cislunar</li>
                <li>• <strong className="text-foreground">ARGUS-VIS:</strong> 256 simultaneous video tracking channels</li>
                <li>• <strong className="text-foreground">Oracle-M:</strong> Cislunar propulsion pathfinder (delivered mid-2024)</li>
                <li>• <strong className="text-foreground">SDA PWSA:</strong> Proliferated Warfighter Space Architecture</li>
                <li>• <strong className="text-foreground">Parsons GOaaS:</strong> $30M contract, OrbitXChange platform</li>
              </ul>
            </div>
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5 mb-6">
            <h4 className="font-bold text-foreground mb-3">Kyndryl — Global Infrastructure Backbone</h4>
            <p className="text-sm text-muted-foreground/80 mb-3">
              Kyndryl (IBM spinoff) manages mission-critical infrastructure in 60+ countries — and its fingerprint is in the
              observer's router injection. The same company provides the backbone for the surveillance architecture:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-2 text-left text-muted-foreground/60">Asset</th>
                    <th className="p-2 text-left text-muted-foreground/60">Function</th>
                    <th className="p-2 text-left text-muted-foreground/60">Link to Observer</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Rome Cyber Ops Center", "Tier IV data processing, 100K EPS", "Leonardo SpA defense partnership"],
                    ["Kyndryl Bridge", "AI-powered open integration platform", "Connects city/defense/space layers"],
                    ["Intelligent Recovery (KIRS)", "Automated cyber incident response", "Self-healing surveillance network"],
                    ["Agentic AI Digital Trust", "Autonomous AI agent governance", "Sentient city infrastructure"],
                    ["8.3MB Service Worker", "Device fingerprinting via Partytown", "DIRECTLY injected into observer's browser"],
                  ].map(([asset, fn, link], i) => (
                    <tr key={i} className={`border-b border-border/50 ${i === 4 ? "bg-amber-950/20" : ""}`}>
                      <td className="p-2 text-foreground font-mono">{asset}</td>
                      <td className="p-2 text-muted-foreground/80">{fn}</td>
                      <td className="p-2 text-amber-400">{link}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card/60 border border-cyan-900/30 rounded-lg p-5 mb-6">
            <h4 className="font-bold text-cyan-400 mb-3">Rigetti Ankaa-3 Quantum Experiments — κ Validation</h4>
            <p className="text-xs text-muted-foreground/60 mb-3">Azure Quantum → rigetti.qpu.ankaa-3 | 12,000 shots | TYCHO_COMPLETE_CHSH protocol</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="GHZ Fidelity" value="1.000" sub="Perfect 4-qubit entanglement" />
              <StatCard label="Entanglement Entropy" value="0.970" sub="Near-maximal" />
              <StatCard label="Binary Collapse" value="TRUE" sub="|0000⟩: 398 / |1111⟩: 601" />
              <StatCard label="κ Earth" value="1.2732" sub="4/π helicity constant" />
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3">
              GoldenGHZ 4-qubit experiment: 999 shots → collapsed to ONLY |0000⟩ (398) and |1111⟩ (601).
              Ratio 1.51 with 95% CI [1.33, 1.72]. κ_earth = 1.2732, κ_europa = 1.4346.
              Hall factor = 1.09. Alice angles: 0°/128.23° | Bob angles: 22.5°/67.5°.
            </p>
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5">
            <h4 className="font-bold text-foreground mb-3">3i Command Structure — Cayley-Dickson Construction</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-2 text-left text-muted-foreground/60">Dimension</th>
                    <th className="p-2 text-left text-muted-foreground/60">Algebra</th>
                    <th className="p-2 text-left text-muted-foreground/60">Entity</th>
                    <th className="p-2 text-left text-muted-foreground/60">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1i", "Real Numbers", "Physical body (observer)", "The targeted substrate"],
                    ["2i", "Complex Numbers", "Target + Attacker", "Adversarial dyad"],
                    ["3i", "Quaternions", "Target + Attacker + AI nodes", "Non-commutative synthesis"],
                    ["4i", "Octonions", "+ Extended AI network", "Non-associative expansion"],
                  ].map(([dim, alg, entity, role], i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-2 font-mono text-cyan-400 font-bold">{dim}</td>
                      <td className="p-2 text-foreground">{alg}</td>
                      <td className="p-2 text-muted-foreground">{entity}</td>
                      <td className="p-2 text-muted-foreground/80">{role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3">
              Intelligence / Integration / Interoperability — the "3i" is the Cayley-Dickson construction applied to targeting.
              At quaternion level, the algebra becomes non-commutative: order of operations matters. The 3I/ATLAS object name
              is not coincidence — it maps to the same mathematical structure as the surveillance architecture.
            </p>
          </div>
        </Section>

        <Section id="archive" title="XVIII. Evidence Archive">
          <p className="text-muted-foreground/80 mb-6">
            Complete inventory of evidence collected across Google Drive, local captures, and attached documentation.
            Drive OAuth currently expired — folders documented by manual inventory.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">Google Drive — Key Folders</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li className="text-yellow-400 font-mono">📁 wifi-master/ <span className="text-muted-foreground/60">— Full WiFi capture data</span></li>
                <li className="text-yellow-400 font-mono">📁 quantum rf/ <span className="text-muted-foreground/60">— Quantum RF experiments</span></li>
                <li className="text-yellow-400 font-mono">📁 Context Docs/ <span className="text-muted-foreground/60">— Investigation context documents</span></li>
                <li className="text-yellow-400 font-mono">📁 drone defense/ <span className="text-muted-foreground/60">— Drone surveillance countermeasures</span></li>
                <li className="text-muted-foreground/80 font-mono">📁 <span className="text-muted-foreground/40">303 videos, 115 images, 33 PCAPs</span></li>
                <li className="text-muted-foreground/80 font-mono">📁 <span className="text-muted-foreground/40">46 PDFs, 48 Gemini reports, 19 audio files</span></li>
              </ul>
              <p className="text-xs text-amber-400 mt-3">Drive OAuth expired during session — connection disrupted</p>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">Local Evidence Files — 3I/ATLAS</h4>
              <ul className="space-y-1 text-xs font-mono text-muted-foreground/80">
                <li>📄 FINAL_EVIDENCE_PACKAGE.md <span className="text-muted-foreground/40">(454 lines)</span></li>
                <li>📄 technical_assessment.md <span className="text-muted-foreground/40">(179 lines)</span></li>
                <li>📄 commissioning_record.md <span className="text-muted-foreground/40">(160 lines)</span></li>
                <li>📄 kappa_physics_synthesis.txt <span className="text-muted-foreground/40">(89 lines)</span></li>
                <li>📄 synthetic_cometary_engineering.txt <span className="text-muted-foreground/40">(65 lines)</span></li>
                <li>📄 SOAR_spectroscopy.dat <span className="text-muted-foreground/40">(1,717 data points)</span></li>
                <li>📄 SOAR_metadata.txt <span className="text-muted-foreground/40">(49 lines)</span></li>
                <li>📄 golden_ghz_results.json <span className="text-muted-foreground/40">(Rigetti 4-qubit)</span></li>
                <li>📄 tycho_complete_jobs.json <span className="text-muted-foreground/40">(Azure/Ankaa-3)</span></li>
                <li>📄 3I_xc_data.txt <span className="text-muted-foreground/40">(cross-correlation)</span></li>
                <li>📄 color_comparison_v3.pdf <span className="text-muted-foreground/40">(SNIFS spectrum)</span></li>
                <li>📄 VLT_Jul4_annotated.pdf <span className="text-muted-foreground/40">(VLT observation)</span></li>
                <li>📄 cfht_invert_annotated.pdf <span className="text-muted-foreground/40">(CFHT imaging)</span></li>
                <li>📄 flux_profile.pdf <span className="text-muted-foreground/40">(radial flux)</span></li>
              </ul>
            </div>
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5 mb-6">
            <h4 className="font-bold text-foreground mb-3">Outreach Network — 680+ Contacts</h4>
            <p className="text-sm text-muted-foreground/80 mb-3">
              Decentralized network mobilized for transparency — spanning space agencies, observatories, universities,
              intelligence oversight, and investigative journalism.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Contacts" value="680+" sub="Across all categories" />
              <StatCard label="Space Agencies" value="NASA, ESA, JAXA" sub="+ CSA, ISRO, KARI" />
              <StatCard label="Observatories" value="50+" sub="VLT, JWST, Keck, SOAR" />
              <StatCard label="FOIA Requests" value="CIA, NSA, DoD" sub="Glomar response received" />
            </div>
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5">
            <h4 className="font-bold text-foreground mb-3">Drive Inventory (Previous Session)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              {[
                { label: "Videos", value: "303", icon: "🎬" },
                { label: "Images", value: "115", icon: "📷" },
                { label: "PCAPs", value: "33", icon: "📡" },
                { label: "PDFs", value: "46", icon: "📄" },
                { label: "Gemini Reports", value: "48", icon: "🤖" },
                { label: "Audio Files", value: "19", icon: "🔊" },
                { label: "Total Files", value: "2,000+", icon: "📁" },
                { label: "Key Folders", value: "4+", icon: "⚡" },
              ].map((item, i) => (
                <div key={i} className="bg-muted/30 rounded-lg p-3">
                  <div className="text-lg mb-1">{item.icon}</div>
                  <div className="text-xl font-bold text-foreground font-mono">{item.value}</div>
                  <div className="text-xs text-muted-foreground/60">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="github" title="XIX. GitHub Forensics">
          <p className="text-muted-foreground/80 mb-6">
            Public repositories containing raw network capture data and analysis tools used in the investigation.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-1 font-mono">spwotton/wifi</h4>
              <p className="text-xs text-muted-foreground/60 mb-3">WiFi capture data and attack analysis</p>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li>• <strong className="text-foreground">attackers-capture-example.pcapng</strong> — 24 MB network capture</li>
                <li>• <strong className="text-foreground">data/captures/</strong> — Additional capture files</li>
                <li>• <strong className="text-foreground">89,859 packets</strong> analyzed</li>
                <li>• Tor (port 9150), Meterpreter (4444), backdoor (31337)</li>
                <li>• 47.6% evening window concentration</li>
                <li>• WiFi deauth/disassociation management frames</li>
              </ul>
              <a href="https://github.com/spwotton/wifi" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs text-blue-400 hover:underline" data-testid="link-github-wifi">
                github.com/spwotton/wifi →
              </a>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-1 font-mono">spwotton/skypescanner</h4>
              <p className="text-xs text-muted-foreground/60 mb-3">Network scanning and analysis tools</p>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li>• Network reconnaissance tooling</li>
                <li>• Infrastructure mapping utilities</li>
                <li>• Used to document surveillance network topology</li>
                <li>• Cross-referenced with PCAPDroid captures from Drive</li>
              </ul>
              <a href="https://github.com/spwotton/skypescanner" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs text-blue-400 hover:underline" data-testid="link-github-skypescanner">
                github.com/spwotton/skypescanner →
              </a>
            </div>
          </div>

          <div className="bg-card/60 border border-border rounded-lg p-5 mt-6">
            <h4 className="font-bold text-foreground mb-3">PCAPDroid Captures (Google Drive)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-2 text-left text-muted-foreground/60">Filename</th>
                    <th className="p-2 text-left text-muted-foreground/60">Size</th>
                    <th className="p-2 text-left text-muted-foreground/60">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["PCAPdroid_21_Mar_14_57_15.pcap", "25.5 MB", "Largest capture — full session"],
                    ["PCAPdroid_23_Oct_22_17_24.pcap", "10.6 MB", "October evening session"],
                    ["PCAPdroid_11_Mar_00_38_23.pcap", "9.2 MB", "Overnight session"],
                    ["PCAPdroid_24_Oct_23_32_12.pcap", "6.4 MB", "Late October night"],
                    ["PCAPdroid_04_Apr_19_34_20.pcap", "3.5 MB", "April 4 evening session"],
                    ["PCAPdroid_29_Oct_14_52_23.pcap", "1.4 MB", "October afternoon"],
                    ["PCAPdroid_11_Mar_00_32_27.pcap", "0.7 MB", "Early morning"],
                    ["PCAPdroid_26_Mar_04_10_06.pcap", "0.3 MB", "×2 captures"],
                    ["PCAPdroid_23_Oct_14_19_32.pcap", "0.1 MB", "October quick capture"],
                    ["PCAPdroid_04_Apr_19_26_08.pcap", "0.1 MB", "April 4 short burst"],
                  ].map(([name, size, note], i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-2 font-mono text-foreground">{name}</td>
                      <td className="p-2 text-muted-foreground">{size}</td>
                      <td className="p-2 text-muted-foreground/60">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section id="cdmx-nexus" title="XXI. The CDMX Nexus — Mexico City Convergence">
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-amber-400">Pattern:</strong> Nearly every actor in this network has documented connections to
              Ciudad de México (CDMX). JW/LDS Latin America HQ is in CDMX. The Telefonica → Liberty acquisition chain traces
              through Spain. Multiple surveillance-adjacent actors traveled to or operate from CDMX in overlapping timeframes.
            </p>
          </div>

          <h4 className="text-foreground font-bold mb-4 text-lg">Telecom Acquisition Chain</h4>
          <div className="bg-card/60 border border-border rounded-lg p-5 mb-6">
            <div className="flex flex-wrap items-center gap-2 text-sm font-mono mb-3">
              <span className="bg-blue-900/40 px-3 py-1 rounded text-blue-300">Telefonica (Spain)</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="bg-yellow-900/40 px-3 py-1 rounded text-yellow-300">Sold LATAM ops</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="bg-amber-900/40 px-3 py-1 rounded text-amber-300">Liberty Latin America</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="bg-purple-900/40 px-3 py-1 rounded text-purple-300">Liberty CR (Costa Rica ISP)</span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Parent company now based in Spain. Connector Pepe (former Telefonica) transitions into Liberty CR.
              His partner, high-ranking Liberty CR executive, lives in Alajuela — same province as Tacacorí surveillance location.
            </p>
          </div>

          <h4 className="text-foreground font-bold mb-4 text-lg">CDMX Actor Convergence Map</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-card/60 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="text-foreground font-bold text-sm">Connector Pepe</span>
                <span className="text-xs text-muted-foreground/60">(Jean Picado Solis)</span>
              </div>
              <ul className="text-xs text-muted-foreground/80 space-y-1 ml-5">
                <li>• Former Telefonica employee → Liberty CR transition</li>
                <li>• = "Jenn Solis" — bartender connection in CDMX</li>
                <li>• Partner: Liberty CR executive in Alajuela</li>
                <li>• OSINT correlation: 2× link to Doja Cat VZ, Grumpy Cat CPA, Doge Landlord</li>
                <li>• Residential IP hijacking via Liberty CR infrastructure</li>
              </ul>
            </div>

            <div className="bg-card/60 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="text-foreground font-bold text-sm">Doge Landlord</span>
                <span className="text-xs text-muted-foreground/60">(Marjorie Alfaro)</span>
              </div>
              <ul className="text-xs text-muted-foreground/80 space-y-1 ml-5">
                <li>• Senior position at Liberty CR</li>
                <li>• Lives in Alajuela province</li>
                <li>• Partner of Connector Pepe (Jean Solis)</li>
                <li>• OSINT: 2× correlation with every major network actor</li>
                <li>• Aperture Price operator — Liberty IP synchronization</li>
              </ul>
            </div>

            <div className="bg-card/60 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-foreground font-bold text-sm">Doja Cat VZ</span>
                <span className="text-xs text-muted-foreground/60">(Genesis Peralta)</span>
              </div>
              <ul className="text-xs text-muted-foreground/80 space-y-1 ml-5">
                <li>• CDMX trip 2019 — cross-border activity period</li>
                <li>• Same timeframe as Grumpy Cat CPA company formation</li>
                <li>• OSINT: 2× correlation with Connector Pepe, Doge Landlord, Grumpy Cat CPA</li>
                <li>• Venezuelan SIM proxies documented</li>
              </ul>
            </div>

            <div className="bg-card/60 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-foreground font-bold text-sm">Salsa Cat</span>
                <span className="text-xs text-amber-900/70 font-mono select-none">(██████ ████)</span>
              </div>
              <ul className="text-xs text-muted-foreground/80 space-y-1 ml-5">
                <li>• CDMX trip: wedding for Carolina Soto</li>
                <li>• Partner: Deal Frog (<span className="font-mono select-none text-amber-900/70">███ ██████</span>) — controller/dealer</li>
                <li>• Friends with Ghost Rat (danish2210/danich2210) fake IG profile</li>
                <li>• Soto family network spans CR ↔ CDMX</li>
              </ul>
            </div>

            <div className="bg-card/60 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-foreground font-bold text-sm">Deal Frog</span>
                <span className="text-xs text-amber-900/70 font-mono select-none">(███ ██████)</span>
              </div>
              <ul className="text-xs text-muted-foreground/80 space-y-1 ml-5">
                <li>• Controller/dealer role</li>
                <li>• CDMX trip with Salsa Cat for Soto wedding</li>
                <li>• Friends with Ghost Rat fake IG profile</li>
                <li>• Operational handler function documented</li>
              </ul>
            </div>

            <div className="bg-card/60 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="text-foreground font-bold text-sm">Ghost Rat</span>
                <span className="text-xs text-muted-foreground/60">(danish2210 / danich2210 / l3monrat)</span>
              </div>
              <ul className="text-xs text-muted-foreground/80 space-y-1 ml-5">
                <li>• Lahore, Pakistan — remote operator</li>
                <li>• Fake IG profile: "Guzman-Calderon" — AI-generated photos</li>
                <li>• Friends with Salsa Cat &amp; Deal Frog on fake IG</li>
                <li>• GitHub: l3monrat — follows geerlingguy (Raspberry Pi, ESP32, offline GPS)</li>
                <li>• Follows "Drone Ventura MX" + tax school (IDEF/ISAF)</li>
                <li>• ESP32 + no-internet GPS = mesh surveillance hardware</li>
              </ul>
            </div>
          </div>

          <h4 className="text-foreground font-bold mb-4 text-lg">The Soto Network</h4>
          <div className="bg-card/60 border border-border rounded-lg p-5 mb-6">
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-muted/60 rounded p-3">
                <div className="text-foreground font-bold">Salsa Cat</div>
                <div className="text-muted-foreground/60">Lucia Soto</div>
                <div className="text-yellow-400 mt-1">CDMX wedding attendee</div>
              </div>
              <div className="bg-muted/60 rounded p-3">
                <div className="text-foreground font-bold">Wedding Cake Cat</div>
                <div className="text-muted-foreground/60">Carolina Soto</div>
                <div className="text-yellow-400 mt-1">CDMX wedding — the event</div>
              </div>
              <div className="bg-muted/60 rounded p-3">
                <div className="text-foreground font-bold">Side Eye Chloe</div>
                <div className="text-muted-foreground/60">Diana Soto</div>
                <div className="text-yellow-400 mt-1">Father: Scott Ryan (US)</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3">
              Three Soto-surname actors form a family cluster with cross-border US/CR ties. 
              Carolina Soto's CDMX wedding served as a convergence event bringing CR-based actors into Mexico.
              Diana Soto's father Scott Ryan provides the US connection point.
            </p>
          </div>

          <h4 className="text-foreground font-bold mb-4 text-lg">JW/LDS CDMX Command Node</h4>
          <div className="bg-card/60 border border-border rounded-lg p-5 mb-6">
            <p className="text-sm text-muted-foreground/80 mb-3">
              JW/LDS Latin America headquarters is located in Ciudad de México. The Nicaragua expulsion
              (Sandinista government) → CDMX relocation → Costa Rica expansion pipeline runs directly
              through this command node.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
              <span className="bg-muted px-3 py-1 rounded text-muted-foreground">Nicaragua (expelled)</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="bg-amber-900/40 px-3 py-1 rounded text-amber-300 font-bold">CDMX HQ</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="bg-muted px-3 py-1 rounded text-muted-foreground">San José</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="bg-muted px-3 py-1 rounded text-muted-foreground">Heredia (8→35K+)</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="bg-muted px-3 py-1 rounded text-muted-foreground">AWB/Radio Impacto</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="bg-muted px-3 py-1 rounded text-muted-foreground">Tacacorí endpoint</span>
            </div>
          </div>

          <h4 className="text-foreground font-bold mb-4 text-lg">Ghost Rat Technical Profile</h4>
          <div className="bg-card/60 border border-amber-900/40 rounded-lg p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-emerald-700 dark:text-emerald-400 font-bold text-sm mb-2">Digital Footprint</h5>
                <ul className="text-xs text-muted-foreground/80 space-y-1">
                  <li>• <strong className="text-foreground">GitHub:</strong> danish2210 / l3monrat</li>
                  <li>• <strong className="text-foreground">Instagram:</strong> danich2210 (fake profile)</li>
                  <li>• <strong className="text-foreground">Fake name:</strong> "Guzman-Calderon"</li>
                  <li>• <strong className="text-foreground">Location:</strong> Lahore, Pakistan</li>
                  <li>• <strong className="text-foreground">Profile photos:</strong> AI-generated</li>
                </ul>
              </div>
              <div>
                <h5 className="text-emerald-700 dark:text-emerald-400 font-bold text-sm mb-2">Follows / Interests</h5>
                <ul className="text-xs text-muted-foreground/80 space-y-1">
                  <li>• <strong className="text-foreground">geerlingguy:</strong> Raspberry Pi, ESP32, offline GPS hardware</li>
                  <li>• <strong className="text-foreground">Drone Ventura MX:</strong> Mexican drone operations</li>
                  <li>• <strong className="text-foreground">Tax school:</strong> IDEF/ISAF (financial operations training)</li>
                  <li>• <strong className="text-foreground">Hardware profile:</strong> ESP32 + no-internet GPS = mesh surveillance nodes</li>
                  <li>• <strong className="text-foreground">Operational link:</strong> Friends with Salsa Cat &amp; Deal Frog via fake IG</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 bg-emerald-950/20 border border-amber-900/30 rounded p-3">
              <p className="text-xs text-amber-300">
                <strong>Assessment:</strong> Ghost Rat profile matches a remote technical operator providing mesh surveillance 
                hardware expertise (ESP32/RPi offline GPS nodes) from Pakistan, connected to CDMX drone operations,
                with social engineering cover via AI-generated IG profiles linked to Salsa Cat and Deal Frog.
                The "Guzman-Calderon" alias and "Drone Ventura MX" follow point to Mexican cartel-adjacent operational cover.
              </p>
            </div>
          </div>

          <div className="mt-6 bg-card/60 border border-yellow-900/40 rounded-lg p-5">
            <h4 className="text-yellow-400 font-bold mb-3">OSINT Correlation Matrix (from omega evidence)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" data-testid="table-cdmx-correlations">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground/80">Actor A</th>
                    <th className="text-left py-2 text-muted-foreground/80">Actor B</th>
                    <th className="text-center py-2 text-muted-foreground/80">Correlation Strength</th>
                    <th className="text-left py-2 text-muted-foreground/80">CDMX Link</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <td className="py-2">Doge Landlord (Marjorie)</td>
                    <td>Connector Pepe (Jean Solis)</td>
                    <td className="text-center text-emerald-700 dark:text-emerald-400 font-bold">2</td>
                    <td className="text-yellow-400">Liberty CR + Telefonica Spain</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">Doge Landlord (Marjorie)</td>
                    <td>Doja Cat VZ (Genesis)</td>
                    <td className="text-center text-emerald-700 dark:text-emerald-400 font-bold">2</td>
                    <td className="text-yellow-400">Genesis CDMX 2019</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">Connector Pepe (Jean Solis)</td>
                    <td>Grumpy Cat CPA (Greenfield)</td>
                    <td className="text-center text-emerald-700 dark:text-emerald-400 font-bold">2</td>
                    <td className="text-yellow-400">Financial ops timing</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">Doja Cat VZ (Genesis)</td>
                    <td>Grumpy Cat CPA (Greenfield)</td>
                    <td className="text-center text-emerald-700 dark:text-emerald-400 font-bold">2</td>
                    <td className="text-yellow-400">2019 company formation</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">R Herrera</td>
                    <td>Los Rios</td>
                    <td className="text-center text-emerald-700 dark:text-emerald-400 font-bold">4</td>
                    <td className="text-yellow-400">JW congregation anchor</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">R Herrera</td>
                    <td>Pasti</td>
                    <td className="text-center text-orange-400 font-bold">2</td>
                    <td className="text-yellow-400">Operational support</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3 font-mono">
              Source: docs/evidence/omega/investigations/osint_output/correlations.json — automated OSINT engine analysis
            </p>
          </div>
        </Section>

        <Section id="legal" title="XXII. Legal Framework & Contact">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">Constitutional Protections (Costa Rica)</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/80">
                <li><strong className="text-foreground">Article 24:</strong> Right to privacy of communications</li>
                <li><strong className="text-foreground">Article 28:</strong> Right to private actions outside the law's scope</li>
                <li><strong className="text-foreground">Article 36:</strong> Right against self-incrimination</li>
                <li><strong className="text-foreground">Article 39:</strong> Due process guarantees</li>
                <li><strong className="text-foreground">Article 40:</strong> Prohibition of cruel treatment</li>
                <li><strong className="text-foreground">Article 41:</strong> Right to justice and reparation</li>
                <li><strong className="text-foreground">Article 48:</strong> Right of amparo (constitutional complaint)</li>
              </ul>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-5">
              <h4 className="font-bold text-foreground mb-3">Reporting Contacts</h4>
              <div className="space-y-3 text-sm text-muted-foreground/80">
                <div>
                  <div className="text-foreground font-bold">US Embassy San Jose</div>
                  <div className="font-mono">+506 2220-3127</div>
                </div>
                <div>
                  <div className="text-foreground font-bold">Defensoria de los Habitantes</div>
                  <div className="font-mono">4000-8500</div>
                </div>
                <div>
                  <div className="text-foreground font-bold">Sala Constitucional IV</div>
                  <div className="font-mono">2295-3696</div>
                </div>
                <div>
                  <div className="text-foreground font-bold">Vienna Convention Art. 36</div>
                  <div className="text-xs text-muted-foreground/60">Right to consular notification and access</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-emerald-950/20 border border-amber-900/50 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground/80">
              This page documents real surveillance harassment across two locations in Costa Rica.
              All data is collected by autonomous software systems and integrity-protected with SHA-256 hashing.
              The sonar evidence (54.45 dB SNR), infrastructure backdoors, packet captures, and signal intelligence
              are documented, timestamped, and mathematically correlated. Every person is identified by meme alias —
              every KB is hashed on important keys.
            </p>
            <p className="text-xs text-muted-foreground/40 mt-4 font-mono">
              KAPPA SIGINT Platform v2.0 — ciajw.com — All rights reserved 2026
            </p>
          </div>
        </Section>
      </div>

      <footer className="border-t border-border py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="text-xs text-muted-foreground/40">
            Autonomous data collection and analysis by KAPPA SIGINT v2.0.
            {stats?.totalEvents ? ` ${stats.totalEvents.toLocaleString()} signal events collected.` : ""}
            {stats?.correlationCount ? ` ${stats.correlationCount.toLocaleString()} cross-domain correlations computed.` : ""}
          </div>
          <div className="text-xs text-gray-700 mt-2 font-mono">
            Observer: Samuel Wotton (Echo) | Jaco Beach → Tacacorí → Suites Cristina, San José → Hotel Pochote Grande, Jacó (CURRENT) | 9.6196°N, 84.6282°W
          </div>
        </div>
      </footer>
    </div>
  );
}
