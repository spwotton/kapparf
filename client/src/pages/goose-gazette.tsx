import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

// ─── WEB AUDIO HONK ──────────────────────────────────────────────────────────
function playHonk() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [[320, 0], [280, 0.09], [310, 0.18], [260, 0.27], [300, 0.36]].forEach(([freq, t]) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, ctx.currentTime + t + 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.13);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.15);
    });
  } catch {}
}

// ─── ARTICLE TYPE ─────────────────────────────────────────────────────────────
interface Article {
  id: string;
  tag: string;
  headline: string;
  subhead: string;
  author: string;
  date: string;
  body: string;
  img: string;
}

// ─── PLACEHOLDER ARTICLES (fallback founding edition) ────────────────────────
// Pure Onion-style satirical content. No specific persons. No surveillance refs.
const PLACEHOLDERS: Article[] = [
  {
    id: "geese-llc",
    tag: "BUSINESS",
    headline: "Area Geese Incorporate, Begin Invoicing Municipality for Noise Pollution Services Rendered Since 2019",
    subhead: "Rate sheet unavailable. Honking services non-refundable. Clients may not opt out.",
    author: "Wellington Feather-Beak, Business Reporter",
    date: "May 20, 2026",
    body: `PORTLAND, ME — A coalition of fourteen Canada geese formally incorporated as Gander & Associates LLC last Tuesday, retroactively billing the City of Portland for 2,190 days of ambient noise services dating to the spring of 2019, according to filings obtained from the Secretary of State's office.

The invoice, submitted by certified mail and also by repeated honking in the general direction of City Hall, itemizes 4.7 million honks at a rate of $0.003 per honk, producing a total liability of $14,100. The city has 30 days to respond.

"We have reviewed the invoice and found several technical concerns with the methodology," said a city spokesperson who asked not to be named. "Specifically, we are not certain the geese have standing to bill for services they elected to provide without a contract."

A legal expert consulted for this story said that geese, strictly speaking, do not have legal standing, but added that "the LLC filing is technically valid" and that the question of what happens next was "above his pay grade, frankly."

The geese have applied for a second LLC to pursue the matter if the first one is dismissed. The application is under review.`,
    img: "https://images.unsplash.com/photo-1484406566174-9da000fda645?w=900&q=80",
  },
  {
    id: "vibes-economy",
    tag: "BUSINESS",
    headline: "Vibes-Based Market Outperforms Logic-Based Market For Seventh Consecutive Quarter; Economists 'Not Surprised Anymore'",
    subhead: "The S&P Vibes Index closed up 3.4 points on strong feelings and a general sense that things might be fine.",
    author: "Eugenia Greylag, Markets Correspondent",
    date: "May 19, 2026",
    body: `NEW YORK — The Vibes-Based Market closed up 3.4 points Friday on strong ambient feelings, a general sense that things might be fine, and one trader's intuition that "it just feels like an up day," according to the Quarterly Feelings Report released Thursday by the Institute for Economic Sensation.

The performance extends the Vibes Index's lead over the Logic-Based Market to seven consecutive quarters, the longest streak since 2017, when the Logic-Based Market suffered a catastrophic encounter with actual data.

"At this point we've had to acknowledge the vibes are load-bearing," said Dr. Cornelius Wing, Chief Sentiment Analyst at the Institute. "We ran the models. Confidence, loosely defined, correlates with outcomes at a rate of roughly 0.68. We don't fully understand it. We've stopped trying."

The Logic-Based Market, which factors in supply chains, earnings ratios, and geopolitical stability, closed flat. Its chief strategist said the market remained "fundamentally sound" and noted that this had not been reflected in the price.

Trading will resume Monday, assuming the vibes hold.`,
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&q=80",
  },
  {
    id: "brain-study",
    tag: "SCIENCE",
    headline: "Scientists Locate Brain Region Responsible For Deciding Not to Do the Thing You Planned to Do",
    subhead: "The region, designated the 'Pre-Nope Cortex,' activates approximately 40 seconds before you close the tab.",
    author: "Dr. Benedict Plumage, Science Desk",
    date: "May 18, 2026",
    body: `CAMBRIDGE, MA — Neuroscientists at the Institute for Behavioral Non-Completion have identified the brain region responsible for the precise moment when a person decides not to do the thing they had planned, scheduled, and in several documented cases, told other people they would do.

The region, located in the prefrontal cortex adjacent to the Planning Module, activates on average 40 seconds before the subject closes the browser tab, puts down the gym bag, or selects "remind me tomorrow" on a notification they will never revisit.

"We've been calling it the Pre-Nope Cortex informally," said Dr. Algernon Beak, lead author of the study. "The formal name is the Anterior Avoidance Complex, but Pre-Nope tested better in focus groups, which is one of the reasons I became a neuroscientist instead of a marketer."

The study followed 2,400 subjects over eighteen months, tracking 14.7 million individual instances of not doing things. Subjects reported in exit interviews that they had "meant to," "were about to," and in 34% of cases, had "already basically done it in their head."

Researchers noted the findings have no practical implications. A follow-up study investigating whether the discovery itself would prompt any changes in behavior found that it would not.`,
    img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=900&q=80",
  },
  {
    id: "bird-concert",
    tag: "WILDLIFE",
    headline: "Local Bird Performs Same Four-Note Sequence for Eleventh Consecutive Hour; Ornithologist Rules It 'Technically Still New'",
    subhead: "Each repetition contains minor tonal variation. The bird is aware of the distinction. Neighbors are not.",
    author: "Constance Waddle, Natural History",
    date: "May 17, 2026",
    body: `JACÓ, COSTA RICA — A brown-headed cowbird perched in an acacia tree outside the Hotel Poseidon has performed the same four-note descending sequence 3,847 times since 6:14 AM, pausing an average of 1.3 seconds between each repetition in what ornithologists consulted for this story describe as "technically a fresh performance each time."

"The bird is communicating," said Dr. Philippa Honk, a field ornithologist who has been watching from the hotel parking lot since approximately 8 AM. "Each iteration carries nuanced tonal data. The fact that it sounds identical to a human ear reflects a limitation of the human ear, not the bird."

Two hotel guests filed separate complaints with the front desk. The front desk advised them to "appreciate the nature."

The bird, contacted for comment via extended observation, performed the sequence forty-four additional times and showed no sign of concluding. Its territory claims are considered secure. Its neighbor, a second cowbird who arrived at 11:20 AM and began performing a slightly different four-note sequence from the adjacent tree, has introduced what scientists describe as "a counterpoint that is also technically not the same thing on a molecular level."

As of press time, the bird had not finished.`,
    img: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=900&q=80",
  },
  {
    id: "consultant-recursion",
    tag: "BUSINESS",
    headline: "Company Hires Consultants to Evaluate Consultant Situation; New Consultants Also Consultants",
    subhead: "The engagement is expected to last six months and result in a report recommending further consultation.",
    author: "Mortimer Gander, Corporate Affairs",
    date: "May 16, 2026",
    body: `NEW YORK — Meridian Group, a financial services company with a documented consultant problem, announced Thursday the engagement of McKinsey & Associates to evaluate its current consultant utilization, making McKinsey the forty-third consulting firm retained by the company in fourteen months and the third firm retained specifically to evaluate the others.

"We wanted an outside perspective," said Chief Operating Officer Gerald Wadsworth, who was himself retained as a consultant in 2022 before being hired full-time to manage consultant relationships. "The situation has become somewhat self-referential, but that's exactly the kind of complexity a good consulting firm is equipped to handle."

McKinsey, reached for comment, confirmed the engagement and noted that the work would take approximately six months, involve fourteen analysts, and produce a 340-page report recommending the consolidation of consulting functions under a single strategic advisory partnership. McKinsey did not specify who that partnership would be, but noted the firm had recent experience in the area.

The board approved the engagement at a meeting facilitated by a governance consultant retained in March to advise on board meeting structure. The meeting ran 20 minutes over schedule. A consultant was retained to address meeting efficiency the following week.

The report is expected in November. A consultant has been engaged to manage its delivery.`,
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80",
  },
  {
    id: "fine-report",
    tag: "BREAKING",
    headline: "New Report Confirms Everything Fine; Panel Raises Concerns About Definition of Fine",
    subhead: "Working group to be formed. Members of working group will be fine.",
    author: "Algernon Beak, Investigations",
    date: "May 15, 2026",
    body: `WASHINGTON, D.C. — A bipartisan report released Tuesday by the Select Committee on Current Conditions concluded that everything is, broadly speaking, fine, while raising substantial procedural concerns about what "fine" means as an evaluative standard and whether the committee had the statutory authority to make that determination.

"We found no evidence of anything not fine," said Committee Chair Representative Dorothea Quillsworth. "We also found no universally accepted definition of fine. These two findings are in tension, and we felt it was important to flag that in the executive summary."

The 400-page report, titled "Current Conditions: A Status Assessment," includes 78 pages of methodology, 94 pages of footnotes, and a 12-page appendix acknowledging that the report itself was fine but noting that its fineness was not audited.

Ranking member Senator Reginald Feathers issued a minority opinion agreeing that everything was fine but disputing the process by which fineness had been determined, calling for a working group to establish a framework for future fineness evaluations.

The working group will convene in September. Its membership is expected to be fine.`,
    img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=80",
  },
  {
    id: "motivational-origin",
    tag: "OPINION",
    headline: "Motivational Speaker Cannot Explain How He Became A Motivational Speaker; Has Very Moving Speech About It",
    subhead: "The journey, he says, is not about the destination. The destination remains unclear.",
    author: "Philippa Honk, Lifestyle",
    date: "May 14, 2026",
    body: `LAS VEGAS, NV — Bradley Honsworth, who has delivered motivational addresses to over 400 corporate retreats, two cruise ship audiences, and a regional insurance conference in Tempe, Arizona, confirmed Tuesday that he cannot fully explain how any of this happened.

"I was in sales," said Honsworth, speaking from a stage in the Venetian Hotel's Vista Ballroom B to 340 Allstate representatives. "And then one day someone asked me to speak at something. And I spoke at it. And then more things." He paused here for effect. The pause was very effective. "That's the whole story."

Honsworth, whose keynote is titled "The Road You Didn't Know You Were On: A Framework for Accidental Excellence," charges $18,000 per appearance and is booked through April of next year.

An audience member who attended two of his talks in the same fiscal year confirmed that the content was "slightly different the second time" and that this was "actually kind of a relief."

His forthcoming book, "You're Already Doing It (You Just Don't Know What It Is)," is available for pre-order. The publication date is to be determined. The publisher described the timeline as "motivationally fluid."`,
    img: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=900&q=80",
  },
  {
    id: "ocean-update",
    tag: "SCIENCE",
    headline: "Ocean Issues Quarterly Update: Still Large, Still Moving, No Plans to Address Either",
    subhead: "Volume consistent with previous quarters. Saltiness unchanged. Whale situation ongoing.",
    author: "Dorothea Quillsworth, Maritime Affairs",
    date: "May 13, 2026",
    body: `PACIFIC OCEAN — The ocean released its quarterly status report Friday, confirming that it remains approximately 1.335 billion cubic kilometers in volume, has not changed its salinity meaningfully since the Permian period, and is not planning to make any adjustments at this time.

"The ocean is continuing to do the ocean," said Dr. Wallace Featherstone, Senior Oceanographer at the National Oceanic and Atmospheric Administration, reviewing the report. "It's moving, mostly sideways, at speeds that are concerning to no one in the ocean. This is consistent with our projections."

The report notes an ongoing whale situation in the North Atlantic that the ocean describes as "within operating parameters." A separate section covering the Pacific Garbage Patch acknowledges the patch while noting that it was not the ocean's idea and that the ocean has "no comment at this time."

Global shipping interests, contacted for the ocean's perspective on human activity, said the ocean had been "largely unresponsive" to outreach but had indicated through wave patterns and general behavior that it was "aware of the situation."

The next quarterly report is expected in August. The ocean will not be issuing a press release.`,
    img: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=900&q=80",
  },
];

// ─── NAV SECTIONS ─────────────────────────────────────────────────────────────
const NAV_SECTIONS = ["News", "Society", "Science", "Wildlife", "Business", "Maritime", "Opinion"];

// ─── GOOSE SVG ────────────────────────────────────────────────────────────────
function GooseSvg({ honking, size = 40 }: { honking: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 120 100" width={size} height={size * 0.833}
      style={{ filter: honking ? "drop-shadow(0 0 6px #facc15)" : "none", transition: "filter 0.1s" }}>
      <ellipse cx="60" cy="68" rx="32" ry="22" fill="#f9fafb" stroke="#111" strokeWidth="2"/>
      <ellipse cx="52" cy="72" rx="20" ry="12" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1"/>
      <path d="M72 55 Q80 38 75 22" stroke="#111" strokeWidth="2" fill="none"/>
      <path d="M72 55 Q88 38 83 22" stroke="#111" strokeWidth="2" fill="none"/>
      <ellipse cx="79" cy="22" rx="9" ry="8" fill="#f9fafb" stroke="#111" strokeWidth="2"/>
      {honking ? (
        <>
          <path d="M87 20 L100 16 L98 20Z" fill="#facc15" stroke="#111" strokeWidth="1.2"/>
          <path d="M87 24 L100 28 L98 24Z" fill="#f59e0b" stroke="#111" strokeWidth="1.2"/>
        </>
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
  const colors: Record<string, string> = {
    BREAKING: "bg-red-700 text-white",
    SCIENCE: "bg-blue-800 text-white",
    BUSINESS: "bg-gray-800 text-white",
    SOCIETY: "bg-purple-800 text-white",
    WILDLIFE: "bg-green-800 text-white",
    MARITIME: "bg-cyan-800 text-white",
    OBITUARIES: "bg-gray-600 text-white",
    OPINION: "bg-amber-700 text-white",
    LOCAL: "bg-stone-700 text-white",
    "REAL ESTATE": "bg-orange-700 text-white",
  };
  return (
    <span className={`inline-block text-[9px] font-black font-sans tracking-[0.18em] uppercase px-1.5 py-0.5 ${colors[tag] ?? "bg-gray-700 text-white"}`}>
      {tag}
    </span>
  );
}

// ─── STORY CARD (grid) ────────────────────────────────────────────────────────
function StoryCard({ article, onClick, variant = "default" }: {
  article: Article;
  onClick: () => void;
  variant?: "default" | "compact" | "featured";
}) {
  if (variant === "compact") {
    return (
      <div className="cursor-pointer group flex gap-3 pb-4 border-b border-gray-100 last:border-0"
        onClick={onClick} data-testid={`article-card-${article.id}`}>
        <div className="shrink-0 overflow-hidden w-20 h-16">
          <img src={article.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${article.id}/300/200`; }}/>
        </div>
        <div className="flex-1 min-w-0">
          <TagBadge tag={article.tag}/>
          <h4 className="font-serif text-[13px] font-bold leading-snug mt-1 text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2">
            {article.headline}
          </h4>
        </div>
      </div>
    );
  }

  return (
    <div className="cursor-pointer group" onClick={onClick} data-testid={`article-card-${article.id}`}>
      <div className="overflow-hidden aspect-[16/10] mb-3">
        <img src={article.img} alt={article.headline}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${article.id}/700/440`; }}/>
      </div>
      <TagBadge tag={article.tag}/>
      <h3 className={`font-serif font-bold leading-snug mt-1.5 text-gray-900 group-hover:text-red-700 transition-colors ${variant === "featured" ? "text-xl" : "text-[15px]"}`}>
        {article.headline}
      </h3>
      {article.subhead && variant !== "default" && (
        <p className="text-[13px] italic text-gray-500 mt-1 line-clamp-2">{article.subhead}</p>
      )}
      <p className="text-[11px] font-sans text-gray-400 mt-2">{article.author} · {article.date}</p>
    </div>
  );
}

// ─── ARTICLE MODAL ────────────────────────────────────────────────────────────
function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto p-4 pt-12"
      onClick={onClose} data-testid="modal-overlay">
      <div className="bg-white max-w-2xl w-full mb-12 shadow-2xl"
        onClick={(e) => e.stopPropagation()} data-testid="modal-article">

        {/* Modal header */}
        <div className="bg-white border-b-4 border-black px-8 pt-8 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <TagBadge tag={article.tag}/>
              <h2 className="font-serif text-2xl md:text-3xl font-black leading-tight mt-2 text-gray-900">
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

        {/* Image */}
        <img src={article.img} alt={article.headline} className="w-full h-60 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${article.id}/800/400`; }}/>

        {/* Body */}
        <div className="px-8 py-7">
          {article.body.split("\n\n").filter(Boolean).map((para, i) => (
            <p key={i} className="font-serif text-[15px] leading-[1.7] text-gray-800 mb-4 last:mb-0">{para}</p>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-4 flex justify-between items-center">
          <span className="text-[10px] font-sans text-gray-400 tracking-wide">
            © THE GOOSE GAZETTE — All The News That's Fit To HONK
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── DIVIDER ──────────────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="h-px flex-1 bg-black"/>
      <span className="text-[10px] font-black font-sans tracking-[0.25em] uppercase text-gray-500 shrink-0 px-1">{label}</span>
      <div className="h-px flex-1 bg-black"/>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function GooseGazettePage() {
  const [selected, setSelected] = useState<Article | null>(null);
  const [honking, setHonking] = useState(false);
  const [honkCount, setHonkCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleHonk = useCallback(() => {
    playHonk();
    setHonking(true);
    setHonkCount(c => c + 1);
    setTimeout(() => setHonking(false), 500);
  }, []);

  // ── API articles ──────────────────────────────────────────────────────────
  const { data: apiData, refetch } = useQuery<any[]>({
    queryKey: ["/api/goose/articles"],
    refetchInterval: 5 * 60 * 1000,
  });

  // ── Merge: API articles first, then placeholders as padding ────────────────
  const apiArticles: Article[] = (apiData ?? []).map((a: any) => ({
    id: a.id,
    tag: a.tag ?? "NEWS",
    headline: a.headline,
    subhead: a.subhead ?? "",
    author: a.authorByline ?? "Staff Reporter",
    date: new Date(a.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    body: a.body ?? "",
    img: a.imgQuery
      ? `https://images.unsplash.com/photo-${a.id.slice(0,8)}?w=900&q=80`
      : `https://picsum.photos/seed/${a.id}/900/600`,
  }));

  // Use API images more reliably
  const fixedApiArticles: Article[] = (apiData ?? []).map((a: any) => ({
    id: a.id,
    tag: a.tag ?? "NEWS",
    headline: a.headline,
    subhead: a.subhead ?? "",
    author: a.authorByline ?? "Staff Reporter",
    date: new Date(a.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    body: a.body ?? "",
    img: a.imgQuery
      ? `https://source.unsplash.com/900x600/?${encodeURIComponent(a.imgQuery)}`
      : PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)].img,
  }));

  const allArticles = [...fixedApiArticles, ...PLACEHOLDERS];
  const cover = allArticles[0];
  const secondaries = allArticles.slice(1, 4);      // 3-col row
  const tertiary = allArticles.slice(4, 8);          // 4-col compact row
  const compact = allArticles.slice(8, 16);          // compact list

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await fetch("/api/goose/generate", { method: "POST" });
      setTimeout(() => refetch(), 1000);
    } catch {}
    setGenerating(false);
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        @keyframes honk-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes waddle { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg) translateY(-2px); } }
        .waddle { animation: waddle 1.8s ease-in-out infinite; }
        .honk-active { animation: honk-pulse 0.3s ease-in-out; }
      `}</style>

      {/* ────────── STICKY TRANSPARENT HEADER ────────── */}
      <header
        data-testid="header-main"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-[0_1px_0_0_#000] border-b border-black"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

          {/* Logo — visible always but adapts color */}
          <a href="/goose" className="flex items-center gap-2 shrink-0 select-none group">
            <div className={`transition-all duration-300 ${honking ? "honk-active" : ""}`}>
              <GooseSvg honking={honking} size={28}/>
            </div>
            <span className={`font-black tracking-tight text-[13px] transition-colors duration-300 ${scrolled ? "text-black" : "text-white drop-shadow-md"}`}
              style={{ fontFamily: "Georgia, serif" }}>
              <span className="hidden sm:inline">THE GOOSE GAZETTE</span>
              <span className="sm:hidden">GOOSE GAZETTE</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0">
            {NAV_SECTIONS.map(s => (
              <button key={s}
                className={`px-3 py-1 text-[10px] font-black font-sans tracking-widest uppercase transition-colors duration-300 hover:underline ${
                  scrolled ? "text-gray-600 hover:text-black" : "text-white/80 hover:text-white"
                }`}>
                {s}
              </button>
            ))}
          </nav>

          {/* Right: HONK + hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleHonk} data-testid="button-nav-honk"
              className={`hidden sm:block text-[10px] font-black font-sans px-3 py-1.5 border-2 transition-all duration-200 ${
                honking
                  ? "bg-yellow-400 text-black border-yellow-400 scale-105"
                  : scrolled
                    ? "bg-white text-black border-black hover:bg-yellow-50"
                    : "bg-transparent text-white border-white hover:bg-white/10"
              }`}>
              {honking ? "HONK!!!" : "HONK"}
            </button>
            <button onClick={() => setMobileOpen(o => !o)} data-testid="button-mobile-menu"
              className={`lg:hidden p-2 transition-colors ${scrolled ? "text-black" : "text-white"}`}
              aria-label="Menu">
              {mobileOpen
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
              }
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 border-b-2 border-b-black shadow-xl">
            <div className="max-w-7xl mx-auto px-5 py-4 grid grid-cols-3 gap-1">
              {NAV_SECTIONS.map(s => (
                <button key={s} onClick={() => setMobileOpen(false)}
                  className="text-left px-3 py-3 text-[10px] font-black font-sans tracking-widest uppercase text-gray-700 hover:bg-gray-50 transition-colors">
                  {s}
                </button>
              ))}
            </div>
            <div className="px-5 pb-4">
              <button onClick={() => { handleHonk(); setMobileOpen(false); }} data-testid="button-drawer-honk"
                className="w-full py-3 bg-yellow-400 text-black text-[11px] font-black font-sans tracking-widest border-2 border-black hover:bg-yellow-300 transition-colors">
                🪿 HONK {honkCount > 0 ? `(${honkCount})` : ""}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ────────── HERO MASTHEAD ────────── */}
      {cover && (
        <div
          className="relative cursor-pointer"
          style={{ minHeight: "92vh" }}
          onClick={() => setSelected(cover)}
          data-testid={`article-cover-${cover.id}`}
        >
          {/* Full-bleed background image */}
          <div className="absolute inset-0">
            <img
              src={cover.img}
              alt={cover.headline}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=80"; }}
            />
            {/* Dark gradient overlay — heavier at bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/85"/>
          </div>

          {/* Masthead title — centered over image */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center pt-28 pb-6 px-6">
            <div className="text-[10px] font-sans tracking-[0.35em] text-white/60 uppercase mb-3 select-none">
              Est. The Moment Things Got Weird
            </div>
            <h1
              className="text-white leading-none font-black select-none"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(3.2rem, 10vw, 8rem)",
                letterSpacing: "-0.025em",
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              }}
            >
              THE GOOSE GAZETTE
            </h1>
            <div className="flex items-center gap-4 mt-3 w-full max-w-xl justify-center">
              <div className="h-px flex-1 bg-white/30"/>
              <span className="text-white/70 font-serif italic text-sm tracking-wider px-2 shrink-0">
                "All The News That's Fit To HONK"
              </span>
              <div className="h-px flex-1 bg-white/30"/>
            </div>
            <div className="text-[10px] font-sans tracking-[0.2em] text-white/50 mt-2 uppercase">
              {today}
            </div>
          </div>

          {/* Cover story text — bottom of hero */}
          <div className="relative z-10 mt-auto px-6 pb-10 max-w-4xl mx-auto w-full">
            <div className="group">
              <TagBadge tag={cover.tag}/>
              <h2
                className="font-serif font-black text-white leading-tight mt-2 group-hover:text-yellow-200 transition-colors duration-200"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.6rem)", textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
              >
                {cover.headline}
              </h2>
              {cover.subhead && (
                <p className="font-serif italic text-white/75 mt-2 text-base max-w-2xl">
                  {cover.subhead}
                </p>
              )}
              <p className="font-sans text-[11px] text-white/50 mt-3 tracking-wide">
                {cover.author} · {cover.date}
                <span className="ml-3 text-white/40 group-hover:text-white/70 transition-colors">
                  Read story →
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────── CONTENT AREA ────────── */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-5 py-10">

          {/* ── 3-col secondary row ── */}
          {secondaries.length > 0 && (
            <>
              <SectionDivider label="Latest Stories"/>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {secondaries.map(a => (
                  <StoryCard key={a.id} article={a} onClick={() => setSelected(a)} variant="featured"/>
                ))}
              </div>
            </>
          )}

          {/* ── 4-col tertiary row ── */}
          {tertiary.length > 0 && (
            <>
              <SectionDivider label="More From The Gazette"/>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {tertiary.map(a => (
                  <StoryCard key={a.id} article={a} onClick={() => setSelected(a)} variant="default"/>
                ))}
              </div>
            </>
          )}

          {/* ── Two-column layout: compact stories + editorial sidebar ── */}
          {compact.length > 0 && (
            <>
              <SectionDivider label="In Brief"/>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Compact story list */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
                    {compact.map(a => (
                      <StoryCard key={a.id} article={a} onClick={() => setSelected(a)} variant="compact"/>
                    ))}
                  </div>
                </div>

                {/* Sidebar: editorial + goose */}
                <div className="border-l border-gray-200 pl-8">
                  <div className="text-[10px] font-black font-sans tracking-[0.25em] uppercase text-gray-400 border-b border-black pb-1 mb-4">
                    Editor's Note
                  </div>
                  <div className="flex gap-3 mb-4">
                    <div className="shrink-0 waddle">
                      <GooseSvg honking={false} size={44}/>
                    </div>
                    <p className="font-serif text-[13px] leading-relaxed text-gray-700 italic">
                      "The Goose Gazette reports what the standard press declines to frame correctly.
                      We apply rigorous AP-wire discipline to premises that would collapse under less precise handling.
                      The goose does not explain the joke. There is no joke."
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 font-sans mb-6">
                    — G. Honksworth, Editor-In-Chief
                  </p>

                  <div className="text-[10px] font-black font-sans tracking-[0.25em] uppercase text-gray-400 border-b border-black pb-1 mb-4">
                    About This Publication
                  </div>
                  <p className="font-sans text-[12px] leading-relaxed text-gray-600">
                    Content generated using the Ω-Council Engine — a multi-layer AI round-table
                    structured on the GOS lattice (κ₁ = 4/π ≈ 1.273, φ = 1.618, Ψ = A × N = 1).
                    Every article is shaped by live signal intelligence data from the KAPPA platform.
                    The math is real. The facts are invented. The geese are real.
                  </p>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ────────── FOOTER ────────── */}
      <footer className="border-t-4 border-black bg-gray-950 text-gray-400 mt-4">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-[12px] font-sans">

          <div className="md:col-span-2">
            <div className="text-white font-black text-base mb-3 font-serif tracking-tight">THE GOOSE GAZETTE</div>
            <p className="leading-relaxed mb-3 text-gray-500">
              Satirical news for people who have noticed that the official version of events
              leaves several details unaccounted for. We use AP-style wire discipline and
              live signal data to generate articles that are structurally indistinguishable
              from reality, except for the part where geese file LLC paperwork.
            </p>
            <p className="text-gray-600 text-[11px]">
              goosegazette.org &nbsp;·&nbsp; All articles satirical &nbsp;·&nbsp; No persons depicted are real &nbsp;·&nbsp; The geese are real
            </p>
          </div>

          <div>
            <div className="text-white font-black text-xs mb-3 tracking-widest uppercase">Sections</div>
            {NAV_SECTIONS.map(s => (
              <div key={s} className="py-1 text-gray-500 hover:text-white transition-colors cursor-pointer">{s}</div>
            ))}
          </div>

          <div>
            <div className="text-white font-black text-xs mb-3 tracking-widest uppercase">Engine</div>
            <div className="text-[11px] leading-relaxed text-gray-600 space-y-1">
              <div>AP Invariant: Ψ = A × N = 1</div>
              <div>κ₁ = 4/π = 1.27324</div>
              <div>φ = 1.618033 (body structure)</div>
              <div>CZ limit: 17 tokens</div>
              <div>f₍ₛₙₐₚ₎ = 111 Hz (P3)</div>
              <div>δ_Hall = 0.00682</div>
              <div className="pt-1 text-gray-700">L1: 3 council agents (parallel)</div>
              <div className="text-gray-700">L3: Editorial arbiter (gpt-4o-mini)</div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 px-6 py-4 flex items-center justify-between text-[10px] font-sans text-gray-700 max-w-7xl mx-auto">
          <span>© 2026 The Goose Gazette · goosegazette.org · Est. The Moment Things Got Weird</span>
          <button
            data-testid="button-generate-article"
            onClick={handleGenerate}
            disabled={generating}
            className="text-gray-600 hover:text-white transition-colors disabled:opacity-40 text-base"
            title="Generate new article (Ω-Council)"
          >
            {generating ? "⏳" : "↻"}
          </button>
        </div>
      </footer>

      {/* ────────── MODAL ────────── */}
      {selected && <ArticleModal article={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}
