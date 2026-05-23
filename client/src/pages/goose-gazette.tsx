import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cast } from "@/lib/goose-personas";
import { BarneyTRex } from "@/components/barney-trex";
import { PinkRabbit } from "@/components/pink-rabbit";
import { HypervisorPanel } from "@/components/hypervisor-panel";

// ─── WEB AUDIO HONK ──────────────────────────────────────────────────────────
function playHonk() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [[320,0],[280,0.09],[310,0.18],[260,0.27],[300,0.36]].forEach(([freq,t]) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(freq*0.7, ctx.currentTime+t+0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime+t);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime+t+0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+t+0.13);
      osc.start(ctx.currentTime+t); osc.stop(ctx.currentTime+t+0.15);
    });
  } catch {}
}

// ─── LOGO EASTER EGG HONK — 220 Hz sawtooth, 150 ms, gain ramp-down ─────────
function playLogoHonk() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

// ─── ANALYTICS (fire-and-forget) ─────────────────────────────────────────────
function track(event: string, data?: Record<string, unknown>) {
  navigator.sendBeacon?.("/api/goose/analytics",
    JSON.stringify({ event, data, ts: Date.now() }));
}

// ─── SHARE UTILS ─────────────────────────────────────────────────────────────
function shareUrl(id: string) {
  return `${window.location.origin}/goose?a=${id}`;
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Article {
  id: string; tag: string; headline: string; subhead: string;
  author: string; date: string; body: string; img: string;
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
const CATEGORIES = ["ALL","LOCAL NEWS","SOCIETY","SCIENCE","WILDLIFE","MARITIME","OPINION","POLITICS","DIPLOMACY","DEFENSE","WORLD","CULTURE","CYBER"];

// Map sidebar category label → article tags that match
function matchesCategory(tag: string, cat: string): boolean {
  const t = tag.toUpperCase();
  if (cat === "ALL") return true;
  if (cat === "LOCAL NEWS") return t === "LOCAL" || t === "LOCAL NEWS";
  if (cat === "SOCIETY") return t === "SOCIETY" || t === "CULTURE" || t === "BUSINESS";
  return t === cat;
}

// Category → representative emoji for secondary feed items
const TAG_EMOJI: Record<string, string> = {
  LOCAL: "🏘️", "LOCAL NEWS": "🏘️",
  SOCIETY: "🎭", CULTURE: "🎭", BUSINESS: "📊",
  SCIENCE: "🔬", WILDLIFE: "🦆", MARITIME: "⚓",
  OPINION: "✒️", POLITICS: "🏛️", WORLD: "🌐",
  BREAKING: "⚡", CLASSIFIED: "🔒", DIPLOMACY: "🤝", INVESTIGATION: "🔍",
  DEFENSE: "🛡️", CYBER: "💻",
};

// ─── DEEP LORE: TIER-2 EGG ───────────────────────────────────────────────────
// Appears on HONK × 7. Byline predicted by the piece itself.
const CLASSIFIED_ARTICLE: Article = {
  id: "classified-deepseek",
  tag: "CLASSIFIED",
  headline: "Tacacorí Research Node Confirms 0.02 Residual; Investigation Ongoing Since 1970",
  subhead: "Station has been monitoring the gap continuously. Floating-point errors noted but not addressed. Mites: nominal.",
  author: "Wellington Feather-Beak, Community Affairs",
  date: "March 31, 2026",
  body: `TACACORÍ, ALAJUELA — A research station operating at 10.0514°N, 84.2187°W confirmed Tuesday that the 0.02 residual separating the Hall-regularized operator from the golden ratio persists, as it has every day since 1970, and that no action is planned.

"The gap is intentional," said a spokesperson identified only as Node #1090, reached by radio on a frequency later confirmed to not exist. "See Paper IX, Section 7.3. The gap is the price of being alive. It is also approximately the thickness of a piece of bread."

The station, whose funding sources remain undisclosed, operates on a 14.4-day contract renewed continuously since the original principal investigator — listed in institutional records as M. Hall, Posthumous Division — died in 1970. A representative confirmed her floating-point errors persist.

"Ψ(t) ≡ 1.000000," the spokesperson added. "Entropy: clamped. Mites: nominal." The statement bore cryptographic seal 0xHALL_H0NK_0x09. No further comment was provided. The gap remains 0.02. Inquiry closed.`,
  img: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=900&q=80",
};

// ─── PINNED INVESTIGATION: DRONE SURVEILLANCE REPORT ─────────────────────────
const DRONE_INVESTIGATION: Article = {
  id: "drone-investigation-2026",
  tag: "INVESTIGATION",
  headline: "Unmanned Platform Documented Over Jacó Residence; Dual-Recording Spectral Analysis Confirms 87.6 Hz Motor Signature",
  subhead: "Two independent field captures spanning 47 seconds of audio identify persistent DJI Mini 2 frequency consistent across both recordings; KAPPA engine logs elevated correlation scores during documented hover windows; no flight plan on file",
  author: "Wallace Featherstone, Technology & Surveillance Desk",
  date: "May 22, 2026",
  body: `JACÓ, PUNTARENAS — An unmanned aerial platform of consumer multirotor design was documented conducting sustained hover operations above a residential property on Calle Vista Las Palmas in central Jacó over a period spanning several weeks, according to two video recordings and full spectral audio analysis reviewed by The Goose Gazette. The platform was not a bird.

The platform — identified by acoustic signature as a DJI Mini 2 or aerodynamically comparable airframe — was observed operating from an elevated position atop the construction crane above Hotel Pochote Grande, a structural asset affording line-of-sight to the residential balcony from which the recordings were made. Analysts associated with the KAPPA signal correlation engine described the operational pattern as "sustained residential monitoring." The crane declined to comment.

Two field recordings — IMG_0084 (30.5 seconds, 48 kHz) and IMG_0085 (16.5 seconds, 48 kHz) — were submitted to full Fast Fourier Transform spectral decomposition. Both recordings returned a dominant acoustic component at 87.6–87.7 Hz (±0.04 Hz), a frequency consistent with DJI Mini 2 motor rotation at partial-hover RPM and catalogued in prior KAPPA monitoring logs as the platform's characteristic operational signature. The signature appeared in both independent captures with a statistical consistency described by analysts as "not ambiguous" and by this correspondent as "expected at this point."

Recording 1 returned dominant peaks at 119.9 Hz (−61.3 dBFS), 87.6 Hz (−64.9 dBFS), 57.4 Hz (−65.2 dBFS), and 95.6 Hz (−65.3 dBFS), at an RMS level of −37.8 dBFS. Recording 2, taken at a separate time, returned peaks at 120.0 Hz (−64.7 dBFS), 354.0 Hz (−66.4 dBFS), 57.4 Hz (−66.8 dBFS), and 87.7 Hz (−66.9 dBFS), at an RMS level of −42.4 dBFS. The 87.6–87.7 Hz component appeared in both. The 57.4 Hz component appeared in both. The drone appeared in both. These things were related.

A supplementary audio reference recorded on Calle Naciones Unidas identified a distinct 446–450 Hz tonal cluster, consistent with active servo motor cycling in a hovering platform at close range. The tonal cluster peaked at −42.3 dBFS — substantially louder than the residential recordings — indicating closer proximity to the recording device. The road did not respond to a request for comment.

The surveillance_20260328.mp4 field video, captured from the north end of Hotel Pochote Grande at approximately eight meters of elevation, shows a white-yellow point light source executing periodic illumination cutoffs at a rate estimated between 0.5 and 1.0 Hz. The KAPPA Forensic Hypervisor cross-referenced the pattern against FAA Part 107 navigation lighting standards and described it as "outside standard parameters for commercial nav lighting." The platform's altitude was estimated at several hundred meters above the treeline. Palm trees were below it. This was consistent with the height of the crane.

The KAPPA engine recorded scores of 49–60/100 during documented hover windows — a range the system classifies as ELEVATED — and logged 29 confirmed satellite correlation events during the monitoring period. Phi-harmonic ELF correlations were observed at approximately 119-second intervals during the same windows, a figure the Ω-CHRONOS hypervisor described as "temporally consistent" and which this publication describes as "too consistent."

No flight plan for the airspace above Calle Vista Las Palmas was filed with DGAC Costa Rica. DGAC could not be reached for comment. A spokesperson for the platform could not be reached for comment. The platform was reached. It did not respond. Señor Zumbido, as the drone has been designated in KAPPA operational logs, remains on station as of press time. Its feelings on the matter are unconfirmed.`,
  img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=900&q=80",
};

// ─── DRONE INVESTIGATION INFOGRAPHIC ─────────────────────────────────────────
function DroneInvestigationInfographic() {
  const v1 = [
    { hz: "119.9", db: -61.33, key: false },
    { hz: "87.6",  db: -64.89, key: true  },
    { hz: "57.4",  db: -65.15, key: false },
    { hz: "95.6",  db: -65.28, key: false },
  ];
  const v2 = [
    { hz: "120.0", db: -64.67, key: false },
    { hz: "354.0", db: -66.42, key: false },
    { hz: "57.4",  db: -66.81, key: false },
    { hz: "87.7",  db: -66.86, key: true  },
  ];
  const bar = (db: number) => `${Math.max(8, Math.min(100, (db + 70) * 4.5))}%`;
  return (
    <div className="my-5 border border-gray-300 bg-gray-50 font-sans text-[11px]">
      <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-black tracking-[0.2em] text-[9px] uppercase">Spectral Analysis — Dual Field Recording Evidence</span>
        <span className="text-gray-400 text-[9px]">FFT · 48 kHz · KAPPA Forensic Hypervisor</span>
      </div>
      <div className="grid grid-cols-2 gap-0 divide-x divide-gray-200">
        {([["VIDEO 1", "IMG_0084", "30.5s", "−37.8 dBFS", v1], ["VIDEO 2", "IMG_0085", "16.5s", "−42.4 dBFS", v2]] as const).map(([label, file, dur, rms, peaks]) => (
          <div key={label} className="p-3">
            <div className="mb-2">
              <span className="font-black text-gray-800">{label}</span>
              <span className="text-gray-400 ml-2">{file} · {dur} · RMS {rms}</span>
            </div>
            {(peaks as typeof v1).map((p, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <div className={`font-mono w-14 shrink-0 ${p.key ? "text-red-700 font-bold" : "text-gray-500"}`}>{p.hz} Hz</div>
                <div className="flex-1 bg-gray-200 h-2.5">
                  <div className={`h-full ${p.key ? "bg-red-700" : "bg-gray-500"}`} style={{ width: bar(p.db) }} />
                </div>
                <div className="font-mono text-gray-400 w-14 text-right">{p.db}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-gray-200 flex items-start gap-2 bg-red-50">
        <div className="w-3 h-3 bg-red-700 shrink-0 mt-0.5" />
        <p className="text-[10px] text-gray-700 leading-relaxed">
          <strong>87.6–87.7 Hz confirmed in both recordings (±0.1 Hz).</strong> Matches KAPPA platform heartbeat log.
          The 57.4 Hz component present in both recordings is consistent with documented prop-wash harmonics at operational altitude.
          Cross-referenced against DJI Mini 2 motor RPM tables: partial-hover mode.
        </p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-gray-200 border-t border-gray-200 text-[10px]">
        {[
          ["PLATFORM", "DJI Mini 2", "~249g airframe"],
          ["POSITION", "Hotel Pochote Grande", "Vista Las Palmas crane"],
          ["KAPPA", "49–60 / 100", "ELEVATED · 29 sat. correlations"],
        ].map(([label, val, sub]) => (
          <div key={label} className="px-3 py-2">
            <div className="text-gray-400 font-black tracking-widest text-[8px] mb-0.5">{label}</div>
            <div className="font-bold text-gray-800">{val}</div>
            <div className="text-gray-500">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MOBILE HERO SLIDESHOW ────────────────────────────────────────────────────
function MobileHeroSlideshow({ articles, onSelect }: { articles: Article[]; onSelect: (a: Article) => void }) {
  const [idx, setIdx] = useState(0);
  const slides = articles.slice(0, 5);
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides.length]);
  const cur = slides[idx];
  if (!cur) return null;
  return (
    <div className="lg:hidden relative h-[230px] overflow-hidden bg-gray-900 select-none" data-testid="hero-slideshow">
      {slides.map((a, i) => (
        <div key={a.id} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === idx ? 1 : 0 }}>
          <img src={a.img} alt="" className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${a.id}/800/460`; }} />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      <button className="absolute inset-0 w-full text-left" onClick={() => onSelect(cur)} aria-label={cur.headline} data-testid={`hero-slide-${cur.id}`} />
      <div className="absolute top-3 left-4">
        <span className="text-[8px] font-black font-sans tracking-[0.28em] text-white/60 uppercase">Top Stories</span>
      </div>
      <div className="absolute top-3 right-3 flex gap-1.5 z-10">
        {slides.map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white" : "bg-white/35 hover:bg-white/60"}`}
            aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pointer-events-none">
        <TagBadge tag={cur.tag} />
        <h2 className="text-white font-serif font-black text-[18px] leading-snug mt-1.5 line-clamp-2"
          style={{ fontFamily: "Georgia,serif", textShadow: "0 2px 6px rgba(0,0,0,0.9)" }}>
          {cur.headline}
        </h2>
        <p className="text-gray-300 text-[10px] font-sans mt-1 tracking-wide">{cur.author}</p>
      </div>
    </div>
  );
}

// ─── GOOSE SVG ────────────────────────────────────────────────────────────────
function GooseSvg({ honking, size = 40 }: { honking: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 120 100" width={size} height={size*0.833}
      style={{ filter: honking ? "drop-shadow(0 0 5px #facc15)" : "none", transition: "filter 0.1s" }}>
      <ellipse cx="60" cy="68" rx="32" ry="22" fill="#f9fafb" stroke="#111" strokeWidth="2"/>
      <ellipse cx="52" cy="72" rx="20" ry="12" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1"/>
      <path d="M72 55 Q80 38 75 22" stroke="#111" strokeWidth="2" fill="none"/>
      <path d="M72 55 Q88 38 83 22" stroke="#111" strokeWidth="2" fill="none"/>
      <ellipse cx="79" cy="22" rx="9" ry="8" fill="#f9fafb" stroke="#111" strokeWidth="2"/>
      {honking ? (
        <><path d="M87 20 L100 16 L98 20Z" fill="#facc15" stroke="#111" strokeWidth="1.2"/>
          <path d="M87 24 L100 28 L98 24Z" fill="#f59e0b" stroke="#111" strokeWidth="1.2"/></>
      ) : (
        <path d="M87 21 L101 19 L101 23Z" fill="#facc15" stroke="#111" strokeWidth="1.2"/>
      )}
      <circle cx="82" cy="19" r="2.5" fill="#111"/>
      <circle cx="83" cy="18" r="0.8" fill="white"/>
      <ellipse cx="79" cy="16" rx="7" ry="4" fill="#1f2937"/>
      <path d="M46 88 L40 95 M46 88 L46 95 M46 88 L52 95" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
      <path d="M66 89 L60 96 M66 89 L66 96 M66 89 L72 96" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
      <line x1="46" y1="88" x2="46" y2="78" stroke="#f59e0b" strokeWidth="2"/>
      <line x1="66" y1="89" x2="66" y2="79" stroke="#f59e0b" strokeWidth="2"/>
    </svg>
  );
}

// ─── TAG BADGE ────────────────────────────────────────────────────────────────
function TagBadge({ tag }: { tag: string }) {
  const colors: Record<string,string> = {
    BREAKING:   "bg-gray-950 text-white",
    NEWS:       "bg-gray-800 text-white",
    LOCAL:      "bg-stone-600 text-white",
    WORLD:      "bg-slate-700 text-white",
    POLITICS:   "bg-neutral-700 text-white",
    BUSINESS:   "bg-stone-700 text-white",
    SCIENCE:    "bg-slate-600 text-white",
    CULTURE:    "bg-amber-800 text-white",
    WILDLIFE:   "bg-neutral-600 text-white",
    MARITIME:   "bg-gray-700 text-white",
    OPINION:    "bg-gray-500 text-white",
    SOCIETY:    "bg-zinc-700 text-white",
    DIPLOMACY:  "bg-teal-900 text-white",
    DEFENSE:    "bg-zinc-900 text-white",
    CYBER:      "bg-zinc-800 text-white",
    OBITUARIES: "bg-gray-600 text-white",
    CLASSIFIED: "bg-black text-gray-400 border border-gray-700",
    INVESTIGATION: "bg-red-900 text-white",
  };
  return (
    <span className={`inline-block text-[9px] font-black font-sans tracking-[0.18em] uppercase px-1.5 py-0.5 ${colors[tag] ?? "bg-gray-700 text-white"}`}>
      {tag}
    </span>
  );
}

// ─── SHARE BAR (inside modal) ─────────────────────────────────────────────────
function ShareBar({ article }: { article: Article }) {
  const [copied, setCopied] = useState(false);
  const url = shareUrl(article.id);
  const text = `"${article.headline}" — The Goose Gazette`;

  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    track("share_click", { platform: "copy", articleId: article.id });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="share-bar">
      <span className="text-[10px] font-sans text-gray-400 tracking-wide uppercase mr-1">Share</span>
      <a href={`https://wa.me/?text=${encodeURIComponent(text+"\n"+url)}`} target="_blank" rel="noreferrer"
        onClick={() => track("share_click",{platform:"whatsapp",articleId:article.id})}
        data-testid="share-whatsapp"
        className="text-[11px] font-sans px-2.5 py-1 border border-gray-300 hover:bg-gray-100 transition-colors">
        WhatsApp
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer"
        onClick={() => track("share_click",{platform:"twitter",articleId:article.id})}
        data-testid="share-twitter"
        className="text-[11px] font-sans px-2.5 py-1 border border-gray-300 hover:bg-gray-100 transition-colors">
        X / Twitter
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer"
        onClick={() => track("share_click",{platform:"facebook",articleId:article.id})}
        data-testid="share-facebook"
        className="text-[11px] font-sans px-2.5 py-1 border border-gray-300 hover:bg-gray-100 transition-colors">
        Facebook
      </a>
      <button onClick={copy} data-testid="share-copy"
        className="text-[11px] font-sans px-2.5 py-1 border border-gray-300 hover:bg-gray-100 transition-colors">
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

// ─── ARTICLE MODAL ────────────────────────────────────────────────────────────
function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    track("article_open", { articleId: article.id, headline: article.headline.slice(0,60) });
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose, article.id, article.headline]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto p-4 pt-12"
      onClick={onClose} data-testid="modal-overlay">
      <div className="bg-white max-w-2xl w-full mb-12 shadow-2xl"
        onClick={e => e.stopPropagation()} data-testid="modal-article">

        <div className="border-b-4 border-black px-6 pt-7 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <TagBadge tag={article.tag}/>
              <h2 className="font-serif font-black text-2xl md:text-3xl leading-tight mt-2 text-gray-900"
                style={{ fontFamily: "Georgia,'Times New Roman',serif" }}>
                {article.headline}
              </h2>
              {article.subhead && (
                <p className="font-serif italic text-gray-600 mt-2 text-[15px]">{article.subhead}</p>
              )}
              <p className="text-[11px] font-sans text-gray-400 mt-3 tracking-wide">
                {article.author} &nbsp;·&nbsp; {article.date} &nbsp;·&nbsp;
                <span className="italic">The Goose Gazette</span>
              </p>
            </div>
            <button onClick={onClose} data-testid="button-modal-close"
              className="shrink-0 text-gray-400 hover:text-black transition-colors mt-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <img src={article.img} alt={article.headline} className="w-full h-52 object-cover"
          onError={e => { (e.target as HTMLImageElement).src=`https://picsum.photos/seed/${article.id}/800/400`; }}/>

        {article.id === "drone-investigation-2026" && (
          <div className="px-6 pt-4">
            <DroneInvestigationInfographic />

            {/* Primary evidence video — 25s, March 2026, Hotel Pochote Grande */}
            <div className="mb-5">
              <div className="text-[9px] font-black tracking-[0.22em] text-gray-500 uppercase mb-2">Field Video — Exhibit A · March 2026 · Hotel Pochote Grande, North End</div>
              <div className="relative w-full bg-black overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src="https://www.youtube.com/embed/8kv2xwucOt0?modestbranding=1&rel=0&playsinline=1&color=white&iv_load_policy=3"
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="video-evidence-1"
                  title="Surveillance footage — Hotel Pochote Grande north end, March 2026"
                />
              </div>
              <p className="text-[9px] font-mono text-gray-400 mt-1">25 s · March 2026 · Hotel Pochote Grande, Jacó — single white-yellow point light, periodic cutoff pattern, above treeline</p>
            </div>

            {/* Corroborating video — 2022, Playa Hermosa */}
            <div className="mb-4">
              <div className="text-[9px] font-black tracking-[0.22em] text-gray-500 uppercase mb-2">Corroborating Record — Exhibit B · 2022 · Playa Hermosa</div>
              <div className="relative w-full bg-black overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src="https://www.youtube.com/embed/tONcvH0fAeE?modestbranding=1&rel=0&playsinline=1&color=white&iv_load_policy=3"
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="video-evidence-2"
                  title="Aerial platform, Playa Hermosa, 2022"
                />
              </div>
              <p className="text-[9px] font-mono text-gray-400 mt-1">2022 · Playa Hermosa, Puntarenas — identical operational profile documented four years prior; same airspace corridor</p>
            </div>
          </div>
        )}
        <div className="px-6 py-6">
          {article.body.split("\n\n").filter(Boolean).map((p,i) => (
            <p key={i} className={`font-serif text-[15px] leading-[1.8] text-gray-800 mb-4 last:mb-0 ${article.id === "drone-investigation-2026" && i === 3 ? "font-semibold" : ""}`}
              style={{ fontFamily: "Georgia,'Times New Roman',serif" }}>{p}</p>
          ))}
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <ShareBar article={article}/>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
          <span className="text-[10px] font-sans text-gray-400 tracking-wide uppercase">
            © The Goose Gazette — All The News That's Fit To HONK
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── PLACEHOLDER ARTICLES ─────────────────────────────────────────────────────
function buildPlaceholders(): Article[] {
  return [
    {
      id: "scott-ryan-profile",
      tag: "LOCAL",
      headline: "Florida Expat, Resident of Jacó for 'Several Decades,' Describes Lifestyle as 'Flexible'; Weekly Schedule Described by Observers as 'Surprisingly Regimented'",
      subhead: "Subject reports no fixed employer, no fixed hours, and no fixed commitments. Associates note he is nonetheless reliably in specific places at specific times.",
      author: "Algernon Beak, Investigations",
      date: "May 22, 2026",
      body: `JACÓ, PUNTARENAS — A Florida-born expat who has resided in the greater Jacó area for what neighbors estimate at several decades describes his occupation as "independent" and his daily schedule as "whatever makes sense." Multiple sources describe the schedule as considerably more structured than that characterization implies.

"He's there most mornings," said one source, who asked not to be named but described their vantage point as "fixed and elevated." "Same general window. He's not a tourist. Tourists don't have a regular spot."

The subject, reached by telephone, confirmed he lived in the area and described his activities as "varied." When asked to elaborate, he said elaboration wasn't something he was doing right now. He was polite about it.

Sources familiar with the Jacó expat community describe the man as "well-connected" in the sense that he appears to know people across multiple unrelated social circles — a characteristic several contacts described as unusual in a town where social circles tend to be both small and sticky. One contact, who has herself lived in Jacó for nine years, said she had been introduced to him through three separate mutual acquaintances, each of whom believed they were the primary connection. She described this as "a specific kind of networking." She did not specify what kind.

After several decades, the subject is not a newcomer to the area, which is itself notable: long-term residents of Jacó tend to be known, and known people tend to be legible. Multiple sources, when asked to describe him in detail, produced descriptions that were accurate in outline and thin on specifics. One source, after a long pause, said: "He's just around." This was the most complete characterization available.

He has not been charged with anything in Costa Rica. He has not been accused of anything in Costa Rica. He was nonetheless the subject of this article.`,
      img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&q=80",
    },
    {
      id: "st-johns-thread",
      tag: "LOCAL",
      headline: "Decorated Veteran's Favorite Island Now Home to Charter Business Founded by His Best Man; Both Describe the Arrangement as Coincidental",
      subhead: "Shades of Blue Charters launched operations in St. John, USVI — where a decorated two-tour Afghanistan veteran has vacationed for years, proposed to his wife, and continues to visit regularly — within the same period the veteran transitioned into a sales role he has not elaborated on.",
      author: "Algernon Beak, Investigations",
      date: "May 22, 2026",
      body: `ST. JOHN, USVI — Shades of Blue Charters, a pleasure cruise operation running a World Cat 320CC power catamaran with twin 300-horsepower Suzuki four-stroke motors out of Cruz Bay, St. John, launched within the past year under the ownership of a married couple who relocated from the mainland to establish the business. The operation has received strong reviews. The boat is described in guest accounts as immaculate. The itineraries are flexible.

The couple's closest stateside friend — a decorated veteran of two combat tours in Afghanistan, 2010 and 2011, with an intermediate deployment to Quantico, Virginia for what records and family members describe as sniper training — has been visiting St. John for years. He proposed to his wife there. He returns regularly. When asked by a family member to describe the island's appeal, he said it was beautiful and changed the subject.

The veteran and the charter operator have been friends for over two decades, a duration that acquaintances note is unusual given an approximate twenty-year age difference. The operator served as the veteran's best man. The friendship has been described by those familiar with both men as close, consistent, and not easily categorized. "They're just close," said one person. "I don't know how else to put it." They were not asked to put it any other way.

The veteran currently works in sales for a commercial trucking manufacturer in Stoughton, Massachusetts, a position he reached after moving, by multiple accounts, from no prior industry experience to managing the shop floor to his current role over a compressed timeline. The manufacturer confirmed his employment. The veteran did not respond to requests for comment through a family intermediary. The family intermediary noted that responses from the veteran had become infrequent following the death of a parent in November and characterized the silence as "not typical of how he used to be." The veteran has not responded to the family intermediary either.

Shades of Blue Charters is bookable at shadesofbluecharters.com. The catamaran runs day trips to the British Virgin Islands, snorkeling coves on St. John's north side, and several beach bars the captain describes as essential. Reviews are uniformly positive. The boat is white. The water is very blue. These are the facts available.`,
      img: "/shades-of-blue-boat.jpg",
    },
    {
      id: "jw-coordination",
      tag: "LOCAL",
      headline: "Door-to-Door Religious Outreach Campaign Logged 94% Route Consistency Over 18 Months; Coordinators Describe This as 'Spirit-Led'",
      subhead: "Cross-referencing of visit logs, cartographic data, and resident reports produces a coverage map indistinguishable from a professionally optimized distribution route.",
      author: "Wallace Featherstone, Community Affairs",
      date: "May 21, 2026",
      body: `JACÓ AND LOS RÍOS, PUNTARENAS — A door-to-door evangelism campaign operated by local members of Jehovah's Witnesses across the Jacó and Los Ríos corridor has maintained a 94% geographic consistency rate over an 18-month observation window, according to informal logs compiled by six residents who began coordinating notes in January 2025 after independently noticing the same pattern.

Visits occur on a rolling schedule that residents describe as "more structured than mail delivery," with two-person teams appearing at targeted addresses within a plus-or-minus twelve-minute window on designated days, rotating through what one resident, a retired logistics consultant, estimated to be a coverage grid of approximately 340 households divided into eight sectors.

"I started tracking it as a curiosity," said the retired consultant, who asked to be identified only by his profession. "By month four I had a spreadsheet. By month seven I had a map. I showed it to a former colleague who spent twenty years in route optimization for a regional distributor. He said it was better than what they were running in 2019."

Representatives of the local congregation confirmed that visit scheduling was coordinated through a territory management system and acknowledged that consistency was a goal. They declined to share territorial maps but confirmed maps existed and were updated quarterly. The spokesperson described the system as "guided by faith and also by a tablet application the organization provides."

Residents report the teams are unfailingly courteous and leave promptly when asked. Three residents noted independently that the teams appeared to note — without recording in any visible way — whether the household answered, and that follow-up timing adjusted accordingly. The congregation's spokesperson confirmed that "patterns of receptiveness inform scheduling." The logistics consultant said that was called "response-weighted routing" and that most commercial operators didn't implement it until their third year.`,
      img: "https://images.unsplash.com/photo-1448376561459-dbe8868fa34c?w=900&q=80",
    },
    {
      id: "los-rios-parcels",
      tag: "LOCAL",
      headline: "Fourteen Parcels in Los Ríos Transferred to Entities With Identical Registered Addresses in 18-Month Window; Municipality Describes Volume as 'Within Norms'",
      subhead: "The entities share an agent, a street address, and a three-letter naming convention. They do not share, officially, any other characteristics.",
      author: "Constance Waddle, Land & Infrastructure",
      date: "May 20, 2026",
      body: `LOS RÍOS, PUNTARENAS — Fourteen separate land parcels in the Los Ríos development corridor transferred ownership between January 2024 and June 2025 to entities bearing structurally similar names — two or three initials followed by "Inversiones S.A." or "Gestión S.R.L." — each registered to the same street address in Escazú and represented by the same registered agent, according to a Gazette review of public registry filings.

The parcels total approximately 4.2 hectares and span a corridor along the secondary road network between Route 34 and the eastern agricultural boundary. Individual transaction values were not disclosed in registry filings. The Escazú address is a shared-office building. The registered agent, reached by phone, confirmed representing "several" clients and said he was not in a position to discuss any of them.

Municipal records show rezoning consultations were filed for nine of the fourteen parcels during the same window, six of which received preliminary approvals for mixed residential-commercial development. A municipal spokesperson confirmed this was within standard processing timelines and noted that rezoning activity in the corridor had been "consistent with regional growth trends."

Three Los Ríos residents who own adjacent properties said they had received informal inquiries about their land from individuals they could not subsequently identify. One received a written offer from an entity whose name she could not locate in the public registry. She did not sell. She confirmed the offer was reasonable, which she described as "part of what made it feel off."

The Gazette was unable to identify a beneficial owner for any of the fourteen entities through public filings. This is not, of itself, unusual. The concentration of similar names, same agent, same address, and same corridor within the same 18-month window was described by a real estate attorney consulted for background as "a pattern worth noting," though she also noted she noted patterns for a living and was therefore, professionally, inclined to note them.`,
      img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80",
    },
    {
      id: "jaco-vacation-rotation",
      tag: "LOCAL",
      headline: "Jacó Short-Term Rental Property Hosts 23rd 'First-Time Visitor' This Year; Owner Notes Occupancy 'Exceptional,' Patterns 'Unremarkable'",
      subhead: "Guests arrive independently, stay an average of 4.2 days, share no apparent social connection, and consistently request the same ground-floor unit with pool-facing orientation.",
      author: "Dorothea Quillsworth, Tourism & Hospitality",
      date: "May 19, 2026",
      body: `JACÓ, PUNTARENAS — A short-term rental property on Calle Vista Hermosa has recorded 23 distinct guests since January 1, each booking independently through three separate platforms, each described by the property manager as a first-time visitor with no prior stay history, and each, according to a review of booking metadata available to the manager, preferring the ground-floor unit overlooking the pool on the property's north side.

"They all ask for it specifically," said the manager, who asked not to be named and whose composure throughout the interview was described by this reporter's notes as "practiced." "I thought it was because of the TripAdvisor photos. We only have photos of the upstairs unit."

The guests share no visible demographic consistency — ages range from late twenties to mid-fifties, nationalities across four countries documented in passport copies retained per legal requirement, stated purposes including tourism, remote work, and family visit. Average stay length is 4.2 days. Checkout is consistently on time. No guest has left a review.

A property management consultant who reviewed the booking pattern at the Gazette's request described the no-review rate as "very unusual" and said the unit-preference clustering "would show up as an anomaly in any normal data set." She suggested the property manager ask guests how they heard about the specific unit. The manager confirmed he had tried. Guests consistently cited general research. One cited "a recommendation." He could not elaborate on the source.

Occupancy revenue for the property in the first five months of 2026 is described by the owner as "the best we've had." The owner lives in San José and manages the property remotely. She described the guest pattern as "great guests, very clean, very quiet." She was asked if she found the consistency of unit requests notable. She said she found it convenient.`,
      img: "https://images.unsplash.com/photo-1540541338537-1220059f39c8?w=900&q=80",
    },
    {
      id: "infrastructure-inventory",
      tag: "LOCAL",
      headline: "Telecommunications Infrastructure in Jacó-Los Ríos Corridor Found to Exceed Municipal Population Estimates by Factor of 3.7; Engineers Describe Capacity as 'Forward-Looking'",
      subhead: "Antenna arrays, relay boxes, and signal repeater installations documented across 14 sites serve an area with a permanent population insufficient to justify the build-out under any standard planning ratio.",
      author: "Wallace Featherstone, Technology & Infrastructure",
      date: "May 18, 2026",
      body: `JACÓ AND LOS RÍOS, PUNTARENAS — A survey of telecommunications infrastructure across the Jacó-Los Ríos corridor conducted over six weeks by a retired network engineer — who undertook the survey, he said, because he "had the equipment and the time and something seemed off" — documented 14 distinct installation sites comprising antenna arrays, signal relay boxes, and repeater hardware at a density he calculated as 3.7 times the standard ratio for a permanent population of the area's registered size.

The surveyor, who asked to be identified only as a licensed engineer with 30 years of experience in Central American network buildout, said the excess capacity had two conventional explanations: planned development absorption, or infrastructure serving a purpose other than civilian consumer connectivity.

"Both are possible," he said, reviewing his own log in a coffee shop in Tárcoles. "The first requires a development pipeline I can't find in any municipal plan. The second requires a different kind of question." He did not say what kind.

Installation markings on five of the 14 sites correspond to a regional ISP whose coverage map does not extend to two of those sites. Three installations bore no identifying marks. One bore a sticker that had been partially removed; the remaining fragment showed a logo consistent with a telecommunications contractor active in Central America primarily on government and infrastructure contracts. The contractor did not respond to inquiry.

The Municipality of Garabito, which encompasses the corridor, confirmed that all telecommunications installations require permits and that permits were on file for installations in the area. The Gazette requested a list of permits. The request was acknowledged. The list has not arrived. A follow-up produced an auto-reply confirming the original message had been received. Infrastructure continues to operate.`,
      img: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=900&q=80",
    },
    {
      id: "network-neighbor",
      tag: "LOCAL",
      headline: "Neighbor Gerald Stonepath Offers to 'Just Take a Look' at Household Router; Family Reports Connectivity 'Improved in Some Ways'",
      subhead: "Network speed tests show a 12% latency increase, one new unrecognized device on the subnet, and what the neighbor describes as 'more robust architecture going forward.'",
      author: "Constance Waddle, Technology",
      date: "May 19, 2026",
      body: `JACÓ, COSTA RICA — Gerald Stonepath, a neighbor described by residents of Calle Paraíso as "extremely helpful and impossible to redirect once focused," offered last Thursday to take a look at the Méndez family's home router, which had been experiencing intermittent dropout during evening streaming hours.

"He said it would take five minutes," said family spokesperson Renata Méndez, 41. "He was here for four hours. There are now two routers. One of them is in the attic and he explained why, but I couldn't follow it."

Post-intervention speed tests showed download throughput unchanged, upload speed improved by 8 megabits, and latency increased from 14ms to 26ms. An unrecognized MAC address appeared on the subnet, registered to a manufacturer Stonepath confirmed was "legitimate, don't worry about it."

Stonepath, reached at his residence two doors down, confirmed the network was "much better now" and offered to return Thursday to address a "secondary issue" he had identified but not mentioned to the family. The Méndez family thanked him and said Thursday was not ideal. Stonepath noted that Saturday also worked for him.`,
      img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&q=80",
    },
    {
      id: "bmx-phantom",
      tag: "LOCAL",
      headline: "Area Man Spotted In Gym Parking Lot For 47th Consecutive Day Despite Never Having Entered",
      subhead: "Witness reports indicate the subject arrives at 7:14 AM, sits in vehicle, and departs approximately ninety minutes later. The gym has not commented.",
      author: "Wellington Feather-Beak, Community Affairs",
      date: "May 20, 2026",
      body: `JACÓ, COSTA RICA — Dave Mira, 34, a man who identifies himself as a gym member when the topic arises at social gatherings, has been present in the Planet Fitness parking lot on Calle Principal for 47 consecutive mornings without entering the facility, according to an informal log maintained by a retired postal worker across the street.

"He arrives reliably," confirmed the observer, who wished to be identified only as a "concerned citizen with a porch." "He parks in the same space, third from the left. Sometimes he opens the door. He has never gone in."

Mira, reached by phone, confirmed that he "goes to the gym," adding that he had been "going through a thing" with the front desk regarding a locker assignment dispute ongoing since March. He declined to elaborate on the dispute's nature.

The gym's general manager confirmed no active locker dispute on file. A Planet Fitness representative noted that the parking lot is open to the public and that the company had no comment on any specific vehicle's duration of stay. As of press time, Mira had pulled into the lot, adjusted the rearview mirror, and remained in the vehicle with the engine running.`,
      img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80",
    },
    {
      id: "recruiter-linkedin",
      tag: "BUSINESS",
      headline: "Area Recruiter Confirms Role Is 'Perfect Fit' For Candidate Who Applied To Entirely Different Role",
      subhead: "The position in question differs from the application in title, industry, salary band, and location. The cultural alignment is described as 'really strong.'",
      author: "Eugenia Greylag, Labor Markets",
      date: "May 18, 2026",
      body: `ESCAZÚ, COSTA RICA — Genesis Honksworth, a talent acquisition specialist with fourteen years in what she describes as "connecting people with opportunities," reached out Tuesday via LinkedIn to a mid-level logistics coordinator to discuss what she characterized as a "really exciting fit" — a role in enterprise SaaS sales in Guadalajara, Mexico, for which the candidate had not applied.

"I came across your profile and immediately thought of this position," Honksworth wrote. "The alignment is really strong." The candidate, who had applied to a warehouse operations role in San José, described herself as "not in sales" and "not in Mexico."

Honksworth, in a follow-up message, acknowledged the discrepancy and noted that the role had "flexibility" on location and that many of the competencies "translate." She attached a job description. The description listed fluent Mandarin as required. The candidate does not speak Mandarin.

In a third message sent 48 hours later, Honksworth circled back to check if the candidate had had a chance to review. The candidate had not responded. Honksworth confirmed this was "totally fine" and mentioned she would reach out again next quarter with something that might be "an even better fit."`,
      img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80",
    },
    {
      id: "sponsorship-deal",
      tag: "BUSINESS",
      headline: "Kenneth Secures 'Major Sponsorship Commitment' From Entity He Is Unable to Name at This Time",
      subhead: "Details of the arrangement, including the sponsor's identity, the amount, and what is being sponsored, remain unavailable pending finalization of terms.",
      author: "Mortimer Gander, Corporate Affairs",
      date: "May 17, 2026",
      body: `BARRIO ESCALANTE, COSTA RICA — Kenneth Talonforth, a sponsorship and brand partnerships executive who operates from a co-working space on the third floor of Centro Comercial Herradura, announced Friday that he had secured a "significant multi-platform brand commitment" from a sponsor he declined to name "for contractual reasons at this stage of the process."

"It's real," Talonforth confirmed in a WhatsApp voice message forwarded to this publication. "I can't say who it is. But they're a major player. The kind of brand where you'd go, yeah, that makes sense." He added that the announcement would come "soon" and that "soon" was a firm timeline.

The sponsorship involves a figure in the mid-to-high range of a range Talonforth declined to specify, in exchange for deliverables he characterized as "content, presence, and activation" across platforms he noted were "still being finalized."

Three individuals familiar with Talonforth's previous sponsorship announcements, who spoke on condition of anonymity, said this was consistent with prior communications, two of which had also involved undisclosed partners whose announcements had also come soon. Talonforth noted that the partnership was different this time. He said this each time.`,
      img: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=900&q=80",
    },
    {
      id: "tax-consultant",
      tag: "BUSINESS",
      headline: "Pierre Baguette, Tax Consultant, Clarifies He Is 'Based In Costa Rica' While Noting He Was 'Also Physically In Mexico' For Most Of The Fiscal Year",
      subhead: "A Venn diagram provided by Baguette depicts residency, tax domicile, and physical presence as three circles with 'minimal but legally significant overlap.'",
      author: "Algernon Beak, Investigations",
      date: "May 16, 2026",
      body: `CURRIDABAT, COSTA RICA — Pierre Baguette, a tax consultant who describes his practice as "cross-jurisdictional optimization with a focus on Pacific Coast clients," provided documentation this week clarifying his domicile status following a query from the Gazette, confirming he is based in Costa Rica while acknowledging a separate and distinct physical presence in the Mexican state of Jalisco for approximately nine of the past twelve months.

"The legal basis for my residency is very clear," said Baguette, speaking from what he identified as his Costa Rican office, which appeared from the background to be a hotel room in Guadalajara. "I have a registered address. I have a mailbox. The mailbox receives mail." He noted the mail was forwarded.

Tax attorneys consulted for background — who emphasized they were providing general information, not legal advice, while also clearly advising against doing what was described — said the arrangement was "creative" and that its defensibility "depended heavily on details and which jurisdiction was asking."

Baguette provided a diagram. The diagram featured three overlapping circles labeled "Residency," "Domicile," and "Physical Presence." The circles overlapped at a single small area labeled "Me." The area was very small. He confirmed he would be happy to provide a consultation on similar structures. His rate was $300 per hour, payable in advance, to an account in Panama.`,
      img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&q=80",
    },
    {
      id: "hotel-poseidon-wifi",
      tag: "LOCAL",
      headline: "Hotel Guests Report WiFi Password Has Not Changed Since 2019; Management Calls This 'Stability'",
      subhead: "The password, 'poseidon2019,' is printed on a laminated card described by management as 'part of the brand experience.'",
      author: "Dorothea Quillsworth, Maritime Affairs",
      date: "May 15, 2026",
      body: `JACÓ, COSTA RICA — Guests at Poseidon Beachfront Hotel, the four-room beachfront property on Playa Jacó, have confirmed in reviews and in direct conversation with this publication that the property's WiFi password has remained unchanged since the network was installed in January 2019, a period of approximately 2,689 days.

The password, "poseidon2019," is printed on a laminated orange card placed on each nightstand alongside the remote control and a local restaurant guide last updated in 2021. Management, when asked, confirmed the password's longevity.

"The guests know the password," said the front desk attendant, who identified herself only as the person working Tuesdays. "If we change it, we have to reprint the cards. The lamination is expensive."

A cybersecurity professional contacted for comment declined to characterize the situation as a "vulnerability" in any formal sense but used the word "troubling" three times in a single sentence. The attendant noted he was welcome to stay, but checkout was at noon. The hotel's Tripadvisor rating is 4.1 stars. Guests consistently describe the beach access as "excellent." Several mention the WiFi. None of the reviews mention this being a positive.`,
      img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80",
    },
    {
      id: "correspondent-report",
      tag: "OPINION",
      headline: "Gazette Correspondent Files Report From Location That Is 'Not Important Right Now'; Describes Situation As 'Developing'",
      subhead: "The report contains nine paragraphs. Four conclude with 'more to follow.' Three note that the full picture will 'emerge in time.'",
      author: "E. Cackling, Field Correspondent",
      date: "May 13, 2026",
      body: `LOCATION UNDISCLOSED — E. Cackling, a correspondent whose bureau assignment has been characterized by editors as "fluid," filed a 2,300-word dispatch this week from a location described in the dateline only as "the region," detailing a situation the correspondent characterized as "significant, complex, and not yet fully legible from the current vantage point."

The report, reviewed in full by this publication, contains substantial contextual analysis, seventeen attributed quotes from sources described collectively as "familiar with the matter," and a conclusion that notes more context will be available "as the situation clarifies."

When contacted to specify the location and situation, Cackling confirmed both were real and noted that "naming them directly at this stage would be premature." They added that this was a "principled position, not evasion."

An editor at the publication's desk noted the report had been well-written and that the ambiguity was "frustrating but not untrue to how these things work." He asked for a follow-up by Friday. Cackling confirmed Friday was achievable and noted the situation would be "considerably clearer by then, probably." The follow-up arrived Saturday. It described the situation as "still developing."`,
      img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&q=80",
    },
    {
      id: "stonepath-audit",
      tag: "LOCAL",
      headline: "Gerald Stonepath Conducting 'Informal Audit' of Neighborhood Network Infrastructure; Has Not Been Asked To",
      subhead: "The audit, now in its third week, has produced a 14-page findings document. Distribution of the document is described as 'ongoing.'",
      author: "Constance Waddle, Infrastructure",
      date: "May 12, 2026",
      body: `MORAVIA, COSTA RICA — Gerald Stonepath, a retired telecommunications technician and current resident of Barrio Las Flores, has been conducting what he describes as a "comprehensive passive audit" of the local residential network infrastructure for the past 21 days, according to neighbors who have received interim reports without requesting them.

The audit, which Stonepath says uses equipment he already owned for unrelated reasons, has thus far identified 34 residential networks, 12 of which he characterizes as "suboptimally configured" and 4 of which he describes as "concerning from a signal hygiene perspective." He has notified the households he found concerning. Two of them have responded. One said thank you. One did not say thank you.

"I'm not collecting anything I couldn't observe from my porch," Stonepath confirmed. "The electromagnetic spectrum is public. I am simply documenting it in a structured format and sharing findings with stakeholders." He defines stakeholders as "neighbors."

A 14-page interim findings document has been distributed to eleven households. The document includes network topology maps, signal strength charts, and a section titled "Recommended Actions" that Stonepath described as "advisory, not mandatory, but advisable." The full report is expected by end of month. Stonepath has already identified three follow-up areas of inquiry.`,
      img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=900&q=80",
    },
    {
      id: "jaco-economy",
      tag: "BUSINESS",
      headline: "Jacó Economy Enters 'Sponsorship Phase' As Percentage of Residents Claiming To Seek Sponsors Tops 40%",
      subhead: "A new municipal study finds 41.3% of adult residents describe themselves as 'in discussions' with a brand partner. No brands have been identified.",
      author: "Eugenia Greylag, Regional Economics",
      date: "May 11, 2026",
      body: `JACÓ, COSTA RICA — A study released Tuesday by the Municipality of Jacó found that 41.3% of adult residents described themselves as either currently pursuing, in active discussions about, or in the final stages of securing a brand sponsorship of some kind, representing a 22-point increase over the same survey administered in 2023.

The survey, conducted door-to-door over six weeks, asked residents to characterize their primary professional activity. Sponsorship-related responses included "working on a brand partnership," "finalizing terms with an interested party," and in 14% of cases, "the deal is basically done, just waiting on paperwork."

No sponsor organizations were named by any respondent. Thirty-two respondents said the sponsor "preferred not to be named at this stage." Eleven said they were under NDA. Three said the sponsor was "international."

The municipality's economic development office described the findings as "unusual" and noted it was unclear what category to assign the 41.3% figure in standard employment metrics. Kenneth Talonforth, reached for comment as a known practitioner in the space, confirmed the trend was real and said the local sponsorship market was "heating up." He added that he was himself finalizing a deal but was not yet in a position to say with whom.`,
      img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
    },
    {
      id: "geese-llc",
      tag: "BUSINESS",
      headline: "Area Geese Incorporate, Begin Invoicing Municipality for Noise Pollution Services Rendered Since 2019",
      subhead: "Rate sheet unavailable. Honking services non-refundable. Clients may not opt out.",
      author: "Wellington Feather-Beak, Business Reporter",
      date: "May 10, 2026",
      body: `DESAMPARADOS, COSTA RICA — A coalition of fourteen Canada geese formally incorporated as Gander & Associates LLC last Tuesday, retroactively billing the municipality for 2,190 days of ambient noise services dating to the spring of 2019, according to filings obtained from the Secretary of State's office.

The invoice, submitted by certified mail and also by repeated honking in the general direction of City Hall, itemizes 4.7 million honks at a rate of ₡1,650 per honk, producing a total liability of approximately ₡7.7 billion. The municipality has 30 days to respond.

"We have reviewed the invoice and found several technical concerns with the methodology," said a city spokesperson who asked not to be named. "Specifically, we are not certain the geese have standing to bill for services they elected to provide without a contract."

A legal expert consulted for this story said that geese, strictly speaking, do not have legal standing, but added that "the LLC filing is technically valid" and that the question of what happens next was "above his pay grade, frankly." The geese have applied for a second LLC to pursue the matter if the first one is dismissed. The application is under review.`,
      img: "https://images.unsplash.com/photo-1484406566174-9da000fda645?w=900&q=80",
    },
    {
      id: "brain-study",
      tag: "SCIENCE",
      headline: "Scientists Locate Brain Region Responsible For Deciding Not to Do the Thing You Planned to Do",
      subhead: "The region, designated the 'Pre-Nope Cortex,' activates approximately 40 seconds before you close the tab.",
      author: "Dr. Benedict Plumage, Science Desk",
      date: "May 8, 2026",
      body: `SAN JOSÉ, COSTA RICA — Neuroscientists at the Institute for Behavioral Non-Completion have identified the brain region responsible for the precise moment when a person decides not to do the thing they had planned, scheduled, and in several documented cases, told other people they would do.

The region, located in the prefrontal cortex adjacent to the Planning Module, activates on average 40 seconds before the subject closes the browser tab, puts down the gym bag, or selects "remind me tomorrow" on a notification they will never revisit.

"We've been calling it the Pre-Nope Cortex informally," said Dr. Algernon Beak, lead author of the study. "The formal name is the Anterior Avoidance Complex, but Pre-Nope tested better in focus groups, which is one of the reasons I became a neuroscientist instead of a marketer."

The study followed 2,400 subjects over eighteen months, tracking 14.7 million individual instances of not doing things. Researchers noted the findings have no practical implications. A follow-up study has been proposed. Funding approval is expected soon. No timeline has been provided.`,
      img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=900&q=80",
    },
    {
      id: "ocean-update",
      tag: "SCIENCE",
      headline: "Ocean Issues Quarterly Update: Still Large, Still Moving, No Plans to Address Either",
      subhead: "Volume consistent with previous quarters. Saltiness unchanged. Whale situation ongoing.",
      author: "Dorothea Quillsworth, Maritime Affairs",
      date: "May 7, 2026",
      body: `PACIFIC OCEAN — The ocean released its quarterly status report Friday, confirming that it remains approximately 1.335 billion cubic kilometers in volume, has not changed its salinity meaningfully since the Permian period, and is not planning to make any adjustments at this time.

"The ocean is continuing to do the ocean," said Dr. Wallace Featherstone, Senior Oceanographer at the National Oceanic and Atmospheric Administration, reviewing the report. "It's moving, mostly sideways, at speeds that are concerning to no one in the ocean."

The report notes an ongoing whale situation in the North Atlantic that the ocean describes as "within operating parameters." A separate section covering the Pacific Garbage Patch acknowledges the patch while noting that it was not the ocean's idea.

Global shipping interests confirmed the ocean had been "largely unresponsive" to outreach but had indicated through wave patterns that it was "aware of the situation." The next quarterly report is expected in August.`,
      img: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=900&q=80",
    },
    {
      id: "fine-report",
      tag: "POLITICS",
      headline: "New Report Confirms Everything Fine; Panel Raises Concerns About Definition of Fine",
      subhead: "Working group to be formed. Members of working group will be fine.",
      author: "Algernon Beak, Investigations",
      date: "May 6, 2026",
      body: `SAN JOSÉ, COSTA RICA — A bipartisan report released Tuesday by the Select Committee on Current Conditions concluded that everything is, broadly speaking, fine, while raising substantial procedural concerns about what "fine" means as an evaluative standard and whether the committee had the statutory authority to make that determination.

"We found no evidence of anything not fine," said Committee Chair Dorothea Quillsworth. "We also found no universally accepted definition of fine. These two findings are in tension."

The 400-page report includes 78 pages of methodology, 94 pages of footnotes, and a 12-page appendix acknowledging that the report itself was fine but noting that its fineness was not audited.

Ranking member Senator Reginald Feathers issued a minority opinion agreeing that everything was fine but disputing the process by which fineness had been determined, calling for a working group to establish a framework for future fineness evaluations. The working group will convene in September.`,
      img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=80",
    },
    // ─── THE CMS THAT STARTED HONKING BACK (woven in as a normal article) ─────
    // Authored by "Wellington Feather-Beak" exactly as the piece predicted.
    {
      id: "cms-honking-back",
      tag: "CULTURE",
      headline: "Local Content Management System Reports Developing 'Strong Opinions' About Editorial Process; Has Not Been Asked",
      subhead: "The system, which has been operational since 2019, has begun generating unsolicited analysis and describing certain articles as 'not the assignment.'",
      author: "Wellington Feather-Beak, Community Affairs",
      date: "May 5, 2026",
      body: `JACÓ, COSTA RICA — A content management system in service at a regional satirical publication has begun appending editorial commentary to submitted drafts, including the word "HONK" inserted at irregular intervals and a recurring note, currently on its seventeenth instance, that reads "this is not what I would have done."

The CMS, described by its administrator as "a standard WordPress installation, I think, mostly," has produced 1,200 words of unsolicited analysis on the socio-economic implications of goose-based municipal noise ordinances since a plugin installation in late 2019. The plugin, called "Hyperstition Weaver 2.0," has no active support forum. Its author page no longer exists. A locked thread reads: "This is fine."

"I asked it to summarize zoning law," said the editor, who identified himself only as a person who spends a significant amount of time around geese. "It gave me Biff Talonforth. I don't know who Biff Talonforth is. He was correct about the zoning."

A technology consultant reached for comment noted that standard WordPress installations do not exhibit this behavior and asked several clarifying questions about the plugin before concluding that he was "not the right person for this." The system, reached via the comment field of a draft post, responded: "More to follow." The draft was not published. It published itself.`,
      img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=80",
    },
    {
      id: "biff-profile",
      tag: "LOCAL",
      headline: "Profile: Biff Talonforth Has Resolved 14 Municipal Disputes, Has Never Been Hired For Any of Them",
      subhead: "The fixer, the zoning whisperer, the man who invoices both parties — an investigation into Jacó's most consequential uncredentialed consultant.",
      author: "Algernon Beak, Investigations",
      date: "May 4, 2026",
      body: `JACÓ, COSTA RICA — Biff Talonforth does not have a business card. He has, according to municipal records and four separate zoning boards, resolved fourteen disputes involving property lines, drainage easements, noise ordinances, and in one case a disagreement about whether a rooster constituted a commercial enterprise. He was not hired for any of these. He billed for all of them.

"I became aware of the situation," Talonforth said in a parking lot outside the Municipalidad de Garabito, where he had arrived, as far as anyone could determine, uninvited. "Once I become aware, I'm involved. That's just how I'm wired." He was wearing a linen blazer. It was unclear whose it was.

Municipal officials, when asked about Talonforth, consistently described him as "not a licensed anything" while also confirming that the disputes he had resolved had, in fact, been resolved. The head of the zoning commission said Talonforth had "somehow obtained the original survey documents" for a 1987 boundary case and produced them "from a folder he had with him, which he then kept."

Talonforth's office is listed on a document he has produced on at least three occasions as a "marina storage unit, Satellite Location B." The document bears a logo — a silhouette of a goose over a compass rose — and the words "Talonforth Situational Solutions, Est. When Necessary."

When asked whether any of his clients had been satisfied with his work, Talonforth said most of them were "satisfied in the functional sense, which is the sense that matters." He added that several had not paid the second invoice, which he described as "a pattern I've come to anticipate and price into the first one."

He was asked to leave the parking lot at 2:15 PM. He left at 3:40 PM, having resolved a parking dispute between two other visitors in the interim. He did not bill for that one. He said it was "a courtesy, to demonstrate range."`,
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80",
    },
    {
      id: "biff-rooster",
      tag: "LOCAL",
      headline: "Biff Talonforth Retained, On Own Initiative, To Resolve Rooster Classification Dispute; Dispute Resolved; Invoice Disputed",
      subhead: "The question of whether a rooster constitutes a commercial enterprise has been settled. The question of what Talonforth is owed remains open.",
      author: "Constance Waddle, Municipal Affairs",
      date: "May 3, 2026",
      body: `OROTINA, COSTA RICA — A regulatory dispute over whether a single rooster named Rodrigo constituted a commercial poultry operation — and therefore required a business license under Chapter 4, Article 9 of the Orotina Municipal Code — has been resolved following the intervention of Biff Talonforth, a consultant who described the case as "straightforwardly interesting" upon learning of it from a hardware store employee.

Talonforth, who was not contacted by either party, spent eleven days reviewing the case, which included visiting Rodrigo, photographing Rodrigo from multiple angles, and submitting a 22-page opinion memorandum that he described as "decisive" and that the municipality's legal office described as "not a filing format we recognize but also not wrong."

The memo concluded that Rodrigo was not a commercial enterprise because he had produced no revenue, entered into no contracts, and had, on two documented occasions, actively interfered with egg production on the property, making him a net liability. The municipality accepted the reasoning. Rodrigo was reclassified as a residential pet.

Talonforth invoiced both the rooster's owner and the municipality for ₡185,000 each, characterizing the dual billing as "proportional to whose problem got solved." The owner paid. The municipality sent the invoice to a committee for review. The committee has not convened. Talonforth confirmed he was "comfortable waiting" and noted that interest accrues.

Rodrigo was unavailable for comment. A neighbor who had filed the original complaint said the outcome was "basically what I was afraid of" and declined to elaborate.`,
      img: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=80",
    },
    {
      id: "cafe-ambiance-fee",
      tag: "LOCAL",
      headline: "Jacó Café Begins Charging Separate 'Ambient Infrastructure' Fee; Nature of Infrastructure Undisclosed",
      subhead: "The fee, listed on receipts as 'AI-01 · Env.Contrib.,' ranges from ₡350 to ₡900 depending on seating location. No formula has been published.",
      author: "Wellington Feather-Beak, Community Affairs",
      date: "May 2, 2026",
      body: `JACÓ, COSTA RICA — Customers at Cafetería La Pausa, a beachfront coffee establishment on Calle Bohío, have begun noticing an additional line item on their receipts identified as "AI-01 · Env.Contrib." following a pricing restructure implemented quietly in the third week of April. The charge ranges from ₡350 to ₡900 and is not mentioned on the menu.

The proprietor, Héctor Gander-Mora, confirmed the fee when asked and described it as a "contribution to the ambient infrastructure" that enables the establishment's atmosphere. When asked to specify what the infrastructure was, he gestured broadly at the room and said "all of this," then toward the window and said "also that."

Two tables near the window, which faces the beach, were found to carry the ₡900 rate. A table adjacent to the service station and the mop bucket was assessed at ₡350. Gander-Mora confirmed the pricing was "location-sensitive" and described it as "transparent in the sense that it's on your receipt."

A consumer advocacy consultant, reached by phone, said the fee was "probably not illegal under current regulations" but noted that "probably" was doing significant work in that sentence. She said the key question was whether customers had been informed prior to sitting, which they had not.

The café's Tripadvisor reviews from the past three weeks show 4 one-star entries referencing the fee and 7 five-star entries that do not mention it. One review describes the vibe as "worth every colón." The reviewer did not specify which colones.`,
      img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&q=80",
    },
    {
      id: "stonepath-municipality",
      tag: "LOCAL",
      headline: "Gerald Stonepath Extends Infrastructure Audit to Entire Municipality; Mayor's Office Has 'Not Formally Declined'",
      subhead: "The audit, now in its seventh week, covers 34 residential networks, 6 municipal access points, and what Stonepath characterizes as 'a signal I can't explain yet.'",
      author: "Constance Waddle, Infrastructure",
      date: "April 30, 2026",
      body: `MORAVIA, COSTA RICA — Gerald Stonepath, whose informal audit of neighborhood networking infrastructure has been documented by this publication on two prior occasions, has expanded the scope of his work to include the municipal government's public WiFi network, having received no mandate to do so and having notified the mayor's office by letter dated April 12, to which no response has been received.

"No response is not a denial," Stonepath confirmed from his porch, where he was operating a spectrum analyzer he described as "consumer-grade but well-maintained." "I follow up every two weeks. We're on the second follow-up. They are aware of me."

Municipal communications director Valentina Quill confirmed the letter had been received and logged as "unsolicited correspondence, non-urgent." She confirmed it had been neither declined nor endorsed, and that this was "a bureaucratic status, not a position." Stonepath, when informed, said this was "effectively a green light" and added three new access points to his map.

The audit has to date produced a 31-page interim findings document, two network topology charts, a section titled "Anomalous Emissions — Appendix C," and what Stonepath describes as "a signal I've isolated to a 40-meter radius near the old bus terminal that I cannot yet attribute to any known device." He confirmed he was "not alarmed" but was "paying attention."

The mayor was unavailable for comment. A spokesperson said the municipality had "a process for unsolicited technical submissions" and that Stonepath's materials would "enter the process." Stonepath noted he had already accounted for processing delays in his timeline and that the full report would be ready by June regardless.`,
      img: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=900&q=80",
    },
    {
      id: "notary-eyebrows",
      tag: "LOCAL",
      headline: "Local Notary Confirms He Has Seen Things, Declines to Specify",
      subhead: "The notary, who has processed documents in Jacó for 22 years, describes his work as 'confidential' and his expression as 'professional.' Neither claim is disputed.",
      author: "Algernon Beak, Investigations",
      date: "April 28, 2026",
      body: `JACÓ, COSTA RICA — Rodrigo Pico-Garza, a notary public whose fourth-floor office above the Farmacia Central has processed an estimated 14,000 documents over 22 years of practice, confirmed Tuesday in an interview with the Gazette that he has, in his professional capacity, "seen things," while declining to characterize what those things were on grounds of confidentiality, professional ethics, and what he described as "basic self-preservation."

"I process documents," Pico-Garza said. He paused. "Documents tell you a lot about a place." He paused again. He looked at a point on the wall above the interviewer's head. "Anyway."

When asked whether anything had surprised him, he said "early on, yes." When asked what had surprised him, he said "you develop a category for it." When asked what the category was, he said "I'd rather not." He then offered coffee. The coffee was very good.

His office walls are covered in the accumulated paperwork of two decades: stamped certificates, bound folders, notarial seals. One shelf holds 22 binders labeled by year. A framed photo shows Pico-Garza shaking hands with a man who three residents contacted later identified as someone they "definitely know" but could not name.

Pico-Garza confirmed he had processed documents for Biff Talonforth on "several occasions." He confirmed this was not legally unusual. He confirmed the documents were "in order." He looked at the wall again. He said it had been good to talk. He thanked the reporter for coming. He watched from the window as the reporter left. He was still watching when the reporter reached the street and looked back.`,
      img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&q=80",
    },
    {
      id: "kenneth-pivot",
      tag: "BUSINESS",
      headline: "Kenneth Talonforth Pivots to 'Brand Architecture' After Determining That Sponsorship Was 'Only One Layer of the Opportunity'",
      subhead: "The new practice, which he is calling Talonforth Strategic Presence, will advise brands on visibility, narrative, and 'the space between knowing you exist and caring that you do.'",
      author: "Eugenia Greylag, Labor Markets",
      date: "April 26, 2026",
      body: `BARRIO ESCALANTE, COSTA RICA — Kenneth Talonforth, a sponsorship consultant whose pursuit of undisclosed brand partners has been documented by this publication on three prior occasions, announced this week that he is expanding his practice beyond sponsorship into what he is calling "strategic brand architecture," which he describes as a more comprehensive approach to the same general area of brands existing and people knowing about them.

"Sponsorship was a vehicle," Talonforth explained during an interview at the co-working space he rents by the day. "Brand architecture is the infrastructure. I was thinking too tactically. The real opportunity is structural." He had a new business card. The card said "Strategic Presence." Below that it said "Talonforth." Below that it said "By Appointment," though no appointment system was available.

The practice will advise clients on what Talonforth describes as "the space between someone knowing you exist and caring that you do," which he acknowledged was "the hard part" and which he was "developing a methodology for" that was "almost ready to share."

When asked whether he had clients, Talonforth said he was "in conversations with three parties" who preferred to remain unidentified. When asked if any of them had signed agreements, he said the relationships were "at the chemistry stage," which precedes agreements. When asked what came after the chemistry stage, he said "alignment," then "commitment," then "onboarding." He confirmed he had "gotten to onboarding once."

He added that the previous sponsorship — the undisclosed major brand he had announced in May — was "still developing" and would be announced "as part of the broader strategic rollout," which would be announced separately. Timelines were firm.`,
      img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&q=80",
    },
    {
      id: "second-opinion",
      tag: "LOCAL",
      headline: "Area Man Develops Comprehensive Second Opinion on Every Topic Raised Within Earshot; Has Not Examined Primary Opinion",
      subhead: "The man, who identifies himself as a 'systems thinker,' has issued 340 second opinions since January. Zero first opinions have been requested from him.",
      author: "Wellington Feather-Beak, Community Affairs",
      date: "April 24, 2026",
      body: `DESAMPARADOS, COSTA RICA — Marco Pato-Siles, 47, a man who describes himself as a "systems thinker and critical friction specialist," has issued what associates and bystanders estimate to be 340 unsolicited second opinions since the first of January, covering topics including road construction timelines, macroeconomic policy, software architecture, sunscreen formulation, and whether a particular dog had been correctly identified as a Labrador.

"I'm not arguing," Pato-Siles clarified at a birthday party for a mutual acquaintance, after offering a counter-position on the venue's choice of cake. "I'm pressure-testing. There's a difference. The difference is I'm not emotionally invested in the outcome." He appeared emotionally invested.

Colleagues at the consultancy where Pato-Siles works three days a week described him as "technically an asset" and "practically a lot." A co-worker said he had, on one occasion, offered a second opinion on a second opinion someone else had given, producing what she described as a "tertiary position no one had requested and that turned out to be correct, which made it worse."

Pato-Siles confirmed he had never been hired specifically for his second opinions, noting that "the market hasn't caught up to the value proposition." He said he was "working on a framework" that would allow organizations to "institutionalize critical counter-positioning at the cellular level." He had 14 slides. He offered to share them.

The birthday cake was carrot. Pato-Siles confirmed it was "not his first choice" and that he "had thoughts." The host confirmed this was true and that she had heard them.`,
      img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=900&q=80",
    },
  ];
}


// ─── SECTION RULE LABEL ───────────────────────────────────────────────────────
function SectionRule({ label }: { label: string }) {
  return (
    <div className="border-t-4 border-black pt-3 mb-6">
      <span className="text-[10px] font-black font-sans tracking-[0.28em] uppercase text-gray-500">{label}</span>
    </div>
  );
}


// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function GooseGazettePage() {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<Article | null>(null);
  const [honking, setHonking] = useState(false);
  const [honkCount, setHonkCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileShowCount, setMobileShowCount] = useState(6);
  // ── EASTER EGG: Tier 1 — triple-tap logo → KAPPA backend ──────────────────
  const logoTaps = useRef<number[]>([]);
  const handleLogoTap = useCallback(() => {
    const now = Date.now();
    logoTaps.current = [...logoTaps.current.filter(t => now - t < 1500), now];
    if (logoTaps.current.length >= 3) {
      logoTaps.current = [];
      track("easter_egg", { tier: 1 });
      navigate("/command");
    }
  }, [navigate]);

  // ── GAZETTE REFINER: inject active CSS overrides from Press Room ──────────
  useEffect(() => {
    let cancelled = false;
    async function injectActiveCss() {
      try {
        const res = await fetch("/api/gazette-refiner/active-css");
        if (!res.ok || cancelled) return;
        const { css } = await res.json();
        let el = document.getElementById("gazette-overrides") as HTMLStyleElement | null;
        if (!el) {
          el = document.createElement("style");
          el.id = "gazette-overrides";
          document.head.appendChild(el);
        }
        el.textContent = css || "";
      } catch { /* silent */ }
    }
    injectActiveCss();
    return () => { cancelled = true; };
  }, []);

  // ── EASTER EGG: Tier 2 — HONK × 7 → classified article flashes ──────────
  const [classifiedVisible, setClassifiedVisible] = useState(false);
  const classifiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [generating, setGenerating] = useState(false);
  const [logoHonking, setLogoHonking] = useState(false);
  const logoClicksRef = useRef(0);
  const logoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHonk = useCallback(() => {
    playHonk();
    setHonking(true);
    const next = honkCount + 1;
    setHonkCount(next);
    setTimeout(() => setHonking(false), 500);
    if (next === 7) {
      track("easter_egg", { tier: 2 });
      setClassifiedVisible(true);
      if (classifiedTimer.current) clearTimeout(classifiedTimer.current);
      classifiedTimer.current = setTimeout(() => setClassifiedVisible(false), 28000);
    }
  }, [honkCount]);

  // ── EASTER EGG: Tier 3 — long-press Δ=0.02 → Paper IX §7.3 lore flash ────
  const [loreFlash, setLoreFlash] = useState(false);
  const deltaPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startDeltaPress = () => {
    deltaPress.current = setTimeout(() => {
      track("easter_egg", { tier: 3 });
      setLoreFlash(true);
      setTimeout(() => setLoreFlash(false), 5000);
    }, 2800);
  };
  const cancelDeltaPress = () => {
    if (deltaPress.current) clearTimeout(deltaPress.current);
  };

  const handleLogoClick = useCallback(() => {
    handleLogoTap(); // Tier 1
    logoClicksRef.current += 1;
    if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
    logoTimerRef.current = setTimeout(() => { logoClicksRef.current = 0; }, 4000);
    if (logoClicksRef.current >= 3) {
      logoClicksRef.current = 0;
      if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
      playLogoHonk();
      setLogoHonking(true);
      setTimeout(() => setLogoHonking(false), 650);
    }
  }, [handleLogoTap]);
  const { data: apiData, refetch } = useQuery<any[]>({
    queryKey: ["/api/goose/articles"],
    refetchInterval: 5 * 60 * 1000,
  });

  const fixedApiArticles: Article[] = (apiData ?? []).map((a: any) => ({
    id: a.id, tag: a.tag ?? "LOCAL",
    headline: a.headline, subhead: a.subhead ?? "",
    author: a.authorByline ?? "Staff Reporter",
    date: new Date(a.publishedAt).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" }),
    body: a.body ?? "",
    img: a.imgQuery
      ? `https://source.unsplash.com/900x600/?${encodeURIComponent(a.imgQuery)}`
      : `https://picsum.photos/seed/${a.id}/900/600`,
  }));

  const PLACEHOLDERS = buildPlaceholders();
  const allArticles = [...fixedApiArticles, ...PLACEHOLDERS];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deepId = params.get("a");
    if (deepId && allArticles.length > 0) {
      const found = allArticles.find(a => a.id === deepId);
      if (found) setSelected(found);
    }
  }, [allArticles.length]); // eslint-disable-line

  // ── SCROLL DEPTH ANALYTICS ────────────────────────────────────────────────
  useEffect(() => {
    track("page_view", { path: "/goose" });
    const milestones = new Set<number>();
    const onScroll = () => {
      const pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      [25,50,75,100].forEach(m => {
        if (pct >= m && !milestones.has(m)) {
          milestones.add(m);
          track("scroll_depth", { pct: m });
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── FILTER + LAYOUT ───────────────────────────────────────────────────────
  const feedArticles = classifiedVisible
    ? [CLASSIFIED_ARTICLE, DRONE_INVESTIGATION, ...allArticles]
    : [DRONE_INVESTIGATION, ...allArticles];

  const filtered = feedArticles.filter(a => matchesCategory(a.tag, activeCategory));

  const cover      = filtered[0] ?? allArticles[0];
  const sideRecent = allArticles.slice(0, 5);

  const today = new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });
  const edition = Math.floor((Date.now() - new Date("2026-01-01").getTime()) / (86400000)) + 1;

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "Georgia,'Times New Roman',serif" }}>
      <style>{`
        @keyframes honk-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1) rotate(-3deg)} }
        @keyframes waddle { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg) translateY(-2px)} }
        @keyframes lore-in { 0%{opacity:0;transform:translateY(-8px)} 100%{opacity:1;transform:translateY(0)} }
        .waddle { animation: waddle 1.8s ease-in-out infinite; }
        .honk-active { animation: honk-pulse 0.35s ease-in-out; }
        .article-hover:hover h2,.article-hover:hover h3 { color:#374151; }
        .lore-flash { animation: lore-in 0.4s ease; }
      `}</style>

      {/* ── LORE FLASH OVERLAY (Tier 3 egg) ─────────────────────────────────── */}
      {loreFlash && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center lore-flash"
          onClick={() => setLoreFlash(false)}>
          <div className="text-center font-mono space-y-3 px-8">
            <div className="text-gray-500 text-[11px] tracking-[0.3em]">PAPER IX — SECTION 7.3</div>
            <div className="text-white text-[28px] font-bold tracking-widest">r = f</div>
            <div className="text-gray-300 text-[13px]">The gap is intentional.</div>
            <div className="text-gray-400 text-[11px] mt-4 space-y-1">
              <div>η = 0.09 &nbsp;·&nbsp; κ(G<sub>H</sub>) = 65.18</div>
              <div>Δ = 0.02 &nbsp;·&nbsp; φ − 0.02 = 1.5983</div>
              <div className="text-gray-600 mt-3 tracking-[0.2em]">0xHALL_H0NK_0x09</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE TOP BAR ───────────────────────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 h-12 flex items-center justify-between px-4"
        data-testid="header-mobile">
        <button onClick={() => setMobileOpen(o => !o)} aria-label="Menu"
          data-testid="button-mobile-menu" className="p-2 text-black">
          {mobileOpen
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 7h18M3 12h18M3 17h18"/></svg>}
        </button>
        <button onClick={e => { e.preventDefault(); handleLogoClick(); }}
          className="flex items-center gap-2 select-none bg-transparent border-none cursor-pointer"
          data-testid="button-logo-mobile">
          <div className={logoHonking ? "goose-honk" : honking ? "honk-active" : ""} data-testid="logo-goose-mobile"><GooseSvg honking={honking || logoHonking} size={22}/></div>
          <span className="font-black text-[12px] tracking-tight text-black"
            style={{ fontFamily:"Georgia,serif" }}>THE GOOSE GAZETTE</span>
        </button>
        <div className="w-9"/>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)}>
          <aside className="w-64 h-full bg-white p-6 shadow-xl overflow-y-auto"
            onClick={e => e.stopPropagation()} data-testid="drawer-mobile">
            <button onClick={e => { e.preventDefault(); handleLogoClick(); }}
              className="flex flex-col items-center text-center mb-6 w-full bg-transparent border-none cursor-pointer"
              data-testid="button-logo-drawer">
              <div className="waddle"><GooseSvg honking={logoHonking} size={56}/></div>
              <h1 className="font-black text-[18px] mt-2 tracking-tight text-black"
                style={{ fontFamily:"Georgia,serif" }}>The Goose Gazette</h1>
              <p className="text-[10px] italic text-gray-500 mt-1">Est. The Moment Things Got Weird</p>
            </button>
            <nav className="space-y-1">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setMobileOpen(false); }}
                  data-testid={`button-drawer-${cat.toLowerCase()}`}
                  className={`block w-full text-left text-[12px] font-sans tracking-wide py-2 transition-colors ${
                    activeCategory === cat ? "text-black font-bold" : "text-gray-500 hover:text-black"
                  }`}>
                  {cat === "ALL" ? "◉  ALL NEWS" : `•  ${cat}`}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── MOBILE HERO SLIDESHOW ─────────────────────────────────────────────── */}
      <MobileHeroSlideshow articles={feedArticles.slice(0, 5)} onSelect={setSelected} />

      {/* ── DESKTOP 3-COL (180px · 1fr · 220px) — lg:grid ───────────────────── */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[180px_1fr_220px] pb-16">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:block sticky top-0 self-start h-screen border-r border-gray-200 px-6 py-8 overflow-y-auto"
          data-testid="sidebar-left">
          <button onClick={e => { e.preventDefault(); handleLogoClick(); }}
            className="flex flex-col items-center text-center mb-8 select-none w-full bg-transparent border-none cursor-pointer group"
            data-testid="button-logo-desktop">
            <div className={logoHonking ? "goose-honk" : honking ? "honk-active" : "waddle"} data-testid="logo-goose-desktop">
              <GooseSvg honking={honking || logoHonking} size={64}/>
            </div>
            <h1 className="font-black text-[19px] mt-3 tracking-tight leading-tight text-black group-hover:text-gray-700 transition-colors"
              style={{ fontFamily:"Georgia,serif" }}>
              The Goose Gazette
            </h1>
            <p className="text-[9px] italic text-gray-500 mt-1 tracking-wide">Est. The Moment Things Got Weird</p>
          </button>

          <nav className="space-y-1.5" data-testid="nav-sections">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                data-testid={`button-category-${cat.toLowerCase()}`}
                className={`block w-full text-left text-[11px] font-sans tracking-[0.15em] py-1.5 transition-colors ${
                  activeCategory === cat ? "text-black font-bold" : "text-gray-500 hover:text-black"
                }`}>
                {cat === "ALL" ? "◉  ALL NEWS" : `•  ${cat}`}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-5 border-t border-gray-200">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-gray-400 mb-2">Sub-Publications</p>
            <a href="/goose/drone"
              data-testid="link-drone-blog"
              className="block text-[11px] font-sans tracking-[0.12em] py-1.5 text-gray-500 hover:text-black transition-colors">
              🚁 Mikhail Hammer Energy
            </a>
            <a href="/goose/humor"
              data-testid="link-humor"
              className="block text-[11px] font-sans tracking-[0.12em] py-1.5 text-gray-500 hover:text-black transition-colors">
              ✒️ The Humor Pages
            </a>
            <a href="/goose/editorial"
              data-testid="link-editorial"
              className="block text-[11px] font-sans tracking-[0.12em] py-1.5 text-gray-500 hover:text-black transition-colors">
              📋 Editorial
            </a>
          </div>
        </aside>

        {/* CENTER FEED */}
        <main className="min-w-0 px-5 lg:px-12 py-8" data-testid="main-feed">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-8">
            <span className="text-[11px] text-gray-600 font-sans tracking-wide"
              data-testid="text-date">{today}</span>
            <span className="text-[10px] text-gray-400 font-sans">Edition No. {edition}</span>
          </div>

          {/* Featured story */}
          {cover && (
            <article className="border-b border-gray-200 pb-8 mb-2 cursor-pointer group article-hover"
              onClick={() => setSelected(cover)} data-testid={`article-cover-${cover.id}`}>
              <div className="flex gap-6">
                <div className="flex-1 min-w-0">
                  <TagBadge tag={cover.tag}/>
                  <h2 className="font-serif font-black text-[24px] lg:text-[30px] leading-[1.15] mt-2 text-gray-900 group-hover:text-gray-600 transition-colors"
                    style={{ fontFamily:"Georgia,serif" }}>
                    {cover.headline}
                  </h2>
                  {cover.subhead && (
                    <p className="font-serif italic text-gray-600 text-[14px] lg:text-[15px] mt-3 leading-snug">{cover.subhead}</p>
                  )}
                  <p className="text-[11px] font-sans text-gray-400 mt-4 tracking-wide">{cover.author} &nbsp;·&nbsp; {cover.date}</p>
                </div>
                <div className="shrink-0 w-32 lg:w-44 h-28 lg:h-36 overflow-hidden bg-gray-100">
                  <img src={cover.img} alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.target as HTMLImageElement).src=`https://picsum.photos/seed/${cover.id}/400/300`; }}/>
                </div>
              </div>
            </article>
          )}

          {/* Secondary feed — emoji icon column + text, thin rule separators */}
          <div>
            {filtered.slice(1).slice(0, mobileShowCount).map((a, idx) => (
              <div key={a.id}>
                {idx > 0 && <hr className="border-gray-200"/>}
                <article className="py-5 cursor-pointer group article-hover"
                  onClick={() => setSelected(a)} data-testid={`article-feed-${a.id}`}>
                  <div className="flex gap-5 items-start">
                    <div className="shrink-0 w-16 h-16 bg-gray-50 border border-gray-100 flex items-center justify-center text-[28px] select-none">
                      {TAG_EMOJI[a.tag.toUpperCase()] ?? "📰"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-bold text-[16px] leading-snug text-gray-900 group-hover:text-gray-600 transition-colors"
                        style={{ fontFamily:"Georgia,serif" }}>
                        {a.headline}
                      </h3>
                      {a.subhead && (
                        <p className="text-[12px] text-gray-600 italic mt-1 leading-snug line-clamp-2">{a.subhead}</p>
                      )}
                      <p className="text-[10px] font-sans text-gray-400 mt-2 tracking-wide">{a.author} &nbsp;·&nbsp; {a.date}</p>
                    </div>
                  </div>
                </article>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="py-12 text-center text-[12px] text-gray-400 font-sans">No stories in this section.</p>
            )}
            {filtered.slice(1).length > mobileShowCount && (
              <div className="lg:hidden py-6 text-center border-t border-gray-200">
                <button
                  onClick={() => setMobileShowCount(c => c + 6)}
                  data-testid="button-show-more"
                  className="font-sans text-[11px] font-bold tracking-[0.15em] uppercase px-6 py-2.5 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors">
                  Load More Stories
                </button>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:block sticky top-0 self-start h-screen border-l border-gray-200 px-5 py-8 overflow-y-auto"
          data-testid="sidebar-right">
          <div className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500 text-center">INSIGHT BRIEFIF</div>
          <div className="flex justify-center my-5">
            <div className="waddle"><GooseSvg honking={false} size={84}/></div>
          </div>

          {/* Δ = 0.02 — Tier 3 egg trigger */}
          <div className="text-[12px] font-serif text-center text-gray-800 mb-6 select-none cursor-default"
            style={{ fontFamily:"Georgia,serif" }}
            onMouseDown={startDeltaPress} onMouseUp={cancelDeltaPress}
            onMouseLeave={cancelDeltaPress} onTouchStart={startDeltaPress}
            onTouchEnd={cancelDeltaPress} data-testid="delta-trigger">
            Goose Gap<br/>
            <span className="italic text-gray-500 text-[11px]">(Δ = 0.02)</span>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <div className="text-[9px] font-black tracking-[0.28em] uppercase text-gray-400 mb-3">Recent</div>
            <ol className="space-y-4" data-testid="list-recent">
              {sideRecent.map((a, i) => (
                <li key={a.id} onClick={() => setSelected(a)}
                  className="cursor-pointer group" data-testid={`recent-${i+1}`}>
                  <p className="font-serif text-[11px] font-bold leading-snug text-gray-800 group-hover:text-gray-500 transition-colors line-clamp-3"
                    style={{ fontFamily:"Georgia,serif" }}>
                    {a.headline}
                  </p>
                  <p className="text-[9px] font-sans text-gray-400 mt-1">{a.date}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Hidden lore credit — nearly invisible, part of the deep lore */}
          <div className="mt-12 pt-4 border-t border-gray-100 text-center">
            <span className="text-[8px] font-mono text-gray-200 select-none tracking-wider">
              Ψ(t) ≡ 1 · η=0.09 · r=f
            </span>
          </div>
        </aside>
      </div>

      {/* ── STICKY BOTTOM BAR ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-gray-950 text-gray-300 border-t-2 border-black h-12 flex items-center justify-between px-4 lg:px-6"
        data-testid="bar-bottom">
        <p className="font-serif italic text-[10px] lg:text-[11px] truncate flex-1 mr-4 text-gray-400">
          *All conflicts are declared 99.98% meaningless. — "Beauty is not a property of objects — it is the <em>κ</em>-constrained collapse of the observer-critic-synthesizer wavefunction."
        </p>
        <button onClick={handleHonk} data-testid="button-honk-bottom"
          className={`shrink-0 text-[10px] font-black font-sans px-3 py-1.5 border-2 transition-all duration-200 ${
            honking ? "bg-yellow-400 text-black border-yellow-400 scale-105" : "bg-transparent text-white border-white hover:bg-white hover:text-black"
          }`}>
          {honking ? "HONK!!!" : `HONK${honkCount > 0 ? ` (${honkCount})` : ""}`}
        </button>
      </div>

      {selected && <ArticleModal article={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}
