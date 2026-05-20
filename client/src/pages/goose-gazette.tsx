import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

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
  BREAKING: "⚡", CLASSIFIED: "🔒", DIPLOMACY: "🤝",
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

        <div className="px-6 py-6">
          {article.body.split("\n\n").filter(Boolean).map((p,i) => (
            <p key={i} className="font-serif text-[15px] leading-[1.8] text-gray-800 mb-4 last:mb-0"
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

  // ── EASTER EGG: Tier 2 — HONK × 7 → classified article flashes ──────────
  const [classifiedVisible, setClassifiedVisible] = useState(false);
  const classifiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── DEEP LINK: ?a=articleId ───────────────────────────────────────────────
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
    ? [CLASSIFIED_ARTICLE, ...allArticles]
    : allArticles;

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
        <button onClick={handleLogoTap}
          className="flex items-center gap-2 select-none bg-transparent border-none cursor-pointer"
          data-testid="button-logo-mobile">
          <div className={honking ? "honk-active" : ""}><GooseSvg honking={honking} size={22}/></div>
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
            <button onClick={handleLogoTap}
              className="flex flex-col items-center text-center mb-6 w-full bg-transparent border-none cursor-pointer"
              data-testid="button-logo-drawer">
              <div className="waddle"><GooseSvg honking={false} size={56}/></div>
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

      {/* ── DESKTOP 3-COL (180px · 1fr · 220px) — lg:grid ───────────────────── */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[180px_1fr_220px] pb-16">

        {/* LEFT SIDEBAR — hidden on desktop unless hovered? No — sticky nav */}
        <aside className="hidden lg:block sticky top-0 self-start h-screen border-r border-gray-200 px-6 py-8 overflow-y-auto"
          data-testid="sidebar-left">
          <button onClick={handleLogoTap}
            className="flex flex-col items-center text-center mb-8 select-none w-full bg-transparent border-none cursor-pointer group"
            data-testid="button-logo-desktop">
            <div className={honking ? "honk-active" : "waddle"}>
              <GooseSvg honking={honking} size={64}/>
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
            {filtered.slice(1).map((a, idx) => (
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
