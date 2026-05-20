import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cast } from "@/lib/goose-personas";
import { BarneyTRex } from "@/components/barney-trex";
import { PinkRabbit } from "@/components/pink-rabbit";
import { HypervisorPanel } from "@/components/hypervisor-panel";

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

// ─── CATEGORY CONSTANTS ───────────────────────────────────────────────────────
const CATEGORIES = ["ALL", "NEWS", "SOCIETY", "SCIENCE", "WILDLIFE", "MARITIME", "OPINION"];

// ─── HUMOR HYPERVISOR BADGE ──────────────────────────────────────────────────
interface HumorStats {
  rollingAvg: {
    apRigidity: number; premiseAbsurdity: number; jokeDiscipline: number;
    specificityCarrier: number; resolutionUnresolved: number;
    overall: number; sampleSize: number;
  };
  exemplars: Array<{ headline: string; overall: number }>;
  failures: Array<{ headline: string; overall: number }>;
}
interface RejudgeStatus {
  rubricVersion: number;
  running: boolean;
  startedAt: number | null;
  finishedAt: number | null;
  batches: number;
  scored: number;
  rejudged: number;
  lastError: string | null;
}
function HumorBadge() {
  const { data } = useQuery<HumorStats>({
    queryKey: ["/api/goose/humor-stats"],
    refetchInterval: 5 * 60 * 1000,
  });
  const [pollWhileRunning, setPollWhileRunning] = useState(false);
  const { data: status } = useQuery<RejudgeStatus>({
    queryKey: ["/api/humor/rejudge-all/status"],
    refetchInterval: pollWhileRunning ? 2000 : false,
  });
  const [flash, setFlash] = useState<string | null>(null);
  const rejudge = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/humor/rejudge-all");
      return res.json() as Promise<{
        success?: boolean; batches: number; scored: number; rejudged: number;
        durationMs: number; alreadyRunning?: boolean; rubricVersion: number;
      }>;
    },
    onMutate: () => { setPollWhileRunning(true); setFlash(null); },
    onSuccess: (r) => {
      const secs = (r.durationMs / 1000).toFixed(1);
      setFlash(
        r.alreadyRunning
          ? `already running · ${r.scored} scored so far`
          : `done · ${r.scored} scored (${r.rejudged} re-judged) in ${secs}s`
      );
      queryClient.invalidateQueries({ queryKey: ["/api/goose/humor-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/humor/rejudge-all/status"] });
    },
    onError: (e: Error) => setFlash(`error · ${e.message.slice(0, 80)}`),
    onSettled: () => { setPollWhileRunning(false); setTimeout(() => setFlash(null), 8000); },
  });

  const avg = data?.rollingAvg;
  const running = rejudge.isPending || status?.running;
  const liveLabel = running
    ? `judging · batch ${status?.batches ?? 0} · ${status?.scored ?? 0} scored`
    : flash;

  const badge = !avg || avg.sampleSize === 0 ? (
    <span data-testid="badge-humor-score"
      className="px-2 py-0.5 border border-gray-800 rounded text-gray-600 font-mono"
      title="Humor Hypervisor warming up">κ-humor: —</span>
  ) : (() => {
    const tone = avg.overall >= 75 ? "text-green-500 border-green-900"
               : avg.overall >= 55 ? "text-amber-500 border-amber-900"
               : "text-red-500 border-red-900";
    const title = `Humor Hypervisor — rolling avg over ${avg.sampleSize} articles
AP Rigidity: ${avg.apRigidity}
Premise Absurdity: ${avg.premiseAbsurdity}
Joke Discipline: ${avg.jokeDiscipline}
Specificity Carrier: ${avg.specificityCarrier}
Resolution Unresolved: ${avg.resolutionUnresolved}`;
    return (
      <Link
        href="/goose/humor"
        data-testid="badge-humor-score"
        className={`px-2 py-0.5 border rounded font-mono hover:opacity-80 cursor-pointer ${tone}`}
        title={`${title}\n\nClick for full dashboard →`}
      >κ-humor: {avg.overall.toFixed(1)}</Link>
    );
  })();

  return (
    <span className="flex items-center gap-2 text-[10px] font-mono">
      {badge}
      <button
        type="button"
        onClick={() => rejudge.mutate()}
        disabled={!!running}
        data-testid="button-rejudge-all"
        title="Re-judge every article whose latest score is older than the current rubric"
        className="px-2 py-0.5 border border-gray-700 rounded text-gray-400 hover:text-white hover:border-white transition-colors disabled:opacity-50 disabled:cursor-wait"
      >
        {running ? "judging…" : "↻ re-judge all"}
      </button>
      {liveLabel && (
        <span data-testid="text-rejudge-status" className="text-gray-400 truncate max-w-[260px]">
          {liveLabel}
        </span>
      )}
    </span>
  );
}

// ─── PLACEHOLDER ARTICLES — Onion-style, using cast() for all characters ─────
function buildPlaceholders(): Article[] {
  return [
    {
      id: "bmx-phantom",
      tag: "SOCIETY",
      headline: `${cast("DAVE")} Spotted In Gym Parking Lot For 47th Consecutive Day Despite Never Having Entered`,
      subhead: `Witness reports indicate the subject arrives at 7:14 AM, sits in vehicle, and departs approximately ninety minutes later. The gym has not commented.`,
      author: "Wellington Feather-Beak, Community Affairs",
      date: "May 20, 2026",
      body: `${cast("TOWN")}, COSTA RICA — ${cast("DAVE")}, 34, a man who identifies himself as a gym member when the topic arises at social gatherings, has been present in the Planet Fitness parking lot on Calle Principal for 47 consecutive mornings without entering the facility, according to an informal log maintained by a retired postal worker across the street.

"He arrives reliably," confirmed the observer, who wished to be identified only as a "concerned citizen with a porch." "He parks in the same space, third from the left. Sometimes he opens the door. He has never gone in."

${cast("DAVE")}, reached by phone, confirmed that he "goes to the gym," adding that he had been "going through a thing" with the front desk regarding a locker assignment dispute that had been ongoing since March. He declined to elaborate on the dispute's nature.

The gym's general manager confirmed no active locker dispute on file. A Planet Fitness representative noted that the parking lot is open to the public and that the company had no comment on any specific vehicle's duration of stay.

As of press time, ${cast("DAVE")} had pulled into the lot, adjusted the rearview mirror, and remained in the vehicle with the engine running.`,
      img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80",
    },
    {
      id: "network-neighbor",
      tag: "NEWS",
      headline: `Neighbor ${cast("HECTOR")} Offers to 'Just Take a Look' at Household Router; Family Reports Connectivity 'Improved in Some Ways'`,
      subhead: `Network speed tests show a 12% latency increase, one new unrecognized device on the subnet, and what the neighbor describes as "more robust architecture going forward."`,
      author: "Constance Waddle, Technology",
      date: "May 19, 2026",
      body: `${cast("TOWN")}, COSTA RICA — ${cast("HECTOR")}, a neighbor described by residents of Calle Paraíso as "extremely helpful and impossible to redirect once focused," offered last Thursday to take a look at the Méndez family's home router, which had been experiencing intermittent dropout during evening streaming hours.

"He said it would take five minutes," said family spokesperson Renata Méndez, 41. "He was here for four hours. There are now two routers. One of them is in the attic and he explained why, but I couldn't follow it."

Post-intervention speed tests showed download throughput unchanged, upload speed improved by 8 megabits, and latency increased from 14ms to 26ms. An unrecognized MAC address appeared on the subnet, registered to a manufacturer ${cast("HECTOR")} confirmed was "legitimate, don't worry about it."

${cast("HECTOR")}, reached at his residence two doors down, confirmed the network was "much better now" and offered to return Thursday to address a "secondary issue" he had identified but not mentioned to the family.

The Méndez family thanked him and said Thursday was not ideal. ${cast("HECTOR")} noted that Saturday also worked for him.`,
      img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&q=80",
    },
    {
      id: "recruiter-linkedin",
      tag: "SOCIETY",
      headline: `Area Recruiter ${cast("GENESIS")} Confirms Role Is 'Perfect Fit' For Candidate Who Applied To Entirely Different Role`,
      subhead: `The position in question differs from the application in title, industry, salary band, and location. The cultural alignment is described as "really strong."`,
      author: "Eugenia Greylag, Labor Markets",
      date: "May 18, 2026",
      body: `${cast("TOWN")}, COSTA RICA — ${cast("GENESIS")}, a talent acquisition specialist with fourteen years in what she describes as "connecting people with opportunities," reached out Tuesday via LinkedIn to a mid-level logistics coordinator to discuss what she characterized as a "really exciting fit" — a role in enterprise SaaS sales in Guadalajara, Mexico, for which the candidate had not applied.

"I came across your profile and immediately thought of this position," ${cast("GENESIS")} wrote in a message flagged for this story. "The alignment is really strong." The candidate, who had applied to a warehouse operations role in San José, described herself as "not in sales" and "not in Mexico."

${cast("GENESIS")}, in a follow-up message, acknowledged the discrepancy and noted that the role had "flexibility" on location and that many of the competencies "translate." She attached a job description. The description listed fluent Mandarin as required. The candidate does not speak Mandarin.

In a third message sent 48 hours later, ${cast("GENESIS")} circled back to check if the candidate had had a chance to review.

The candidate had not responded. ${cast("GENESIS")} confirmed this was "totally fine" and mentioned she would reach out again next quarter with something that might be "an even better fit."`,
      img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80",
    },
    {
      id: "sponsorship-deal",
      tag: "BUSINESS",
      headline: `${cast("KENNETH")} Secures 'Major Sponsorship Commitment' From Entity He Is Unable to Name at This Time`,
      subhead: `Details of the arrangement, including the sponsor's identity, the sponsorship amount, and what is being sponsored, remain unavailable pending finalization of terms.`,
      author: "Mortimer Gander, Corporate Affairs",
      date: "May 17, 2026",
      body: `${cast("TOWN")}, COSTA RICA — ${cast("KENNETH")}, a sponsorship and brand partnerships executive who operates from a co-working space on the third floor of Centro Comercial Herradura, announced Friday that he had secured what he described as a "significant multi-platform brand commitment" from a sponsor he declined to name "for contractual reasons at this stage of the process."

"It's real," ${cast("KENNETH")} confirmed in a WhatsApp voice message forwarded to this publication. "I can't say who it is. But they're a major player. The kind of brand where you'd go, yeah, that makes sense." He added that the announcement would come "soon" and that "soon" was a firm timeline.

The sponsorship, as described, involves a figure in the mid-to-high range of a range ${cast("KENNETH")} declined to specify, in exchange for deliverables he characterized as "content, presence, and activation" across platforms he noted were "still being finalized."

Three individuals familiar with ${cast("KENNETH")}'s previous sponsorship announcements, who spoke on condition of anonymity, said this was consistent with prior communications, two of which had also involved undisclosed partners whose announcements had also come soon.

${cast("KENNETH")} noted that the partnership was different this time. He said this each time.`,
      img: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=900&q=80",
    },
    {
      id: "tax-consultant",
      tag: "BUSINESS",
      headline: `${cast("JEAN")}, Tax Consultant, Clarifies He Is 'Based In Costa Rica' While Noting He Was 'Also Physically In Mexico' For Most Of The Fiscal Year`,
      subhead: `A Venn diagram provided by ${cast("JEAN")} depicts residency, tax domicile, and physical presence as three circles with "minimal but legally significant overlap."`,
      author: "Algernon Beak, Investigations",
      date: "May 16, 2026",
      body: `${cast("TOWN")}, COSTA RICA — ${cast("JEAN")}, a tax consultant who describes his practice as "cross-jurisdictional optimization with a focus on Pacific Coast clients," provided documentation this week clarifying his domicile status following a query from the Gazette, confirming he is based in Costa Rica while acknowledging a separate and distinct physical presence in the Mexican state of Jalisco for approximately nine of the past twelve months.

"The legal basis for my residency is very clear," said ${cast("JEAN")}, speaking from what he identified as his Costa Rican office, which appeared from the background to be a hotel room in Guadalajara. "I have a registered address. I have a mailbox. The mailbox receives mail." He noted the mail was forwarded.

Tax attorneys consulted for background — and who emphasized they were providing general information, not legal advice, while also clearly advising against doing what was described — said the arrangement was "creative" and that its defensibility "depended heavily on details and which jurisdiction was asking."

${cast("JEAN")} provided a diagram. The diagram featured three overlapping circles labeled "Residency," "Domicile," and "Physical Presence." The circles overlapped at a single small area labeled "Me." The area was very small.

He confirmed he would be happy to provide a consultation on similar structures. His rate was $300 per hour, payable in advance, to an account in Panama.`,
      img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&q=80",
    },
    {
      id: "hotel-poseidon-wifi",
      tag: "NEWS",
      headline: `${cast("HOTEL")} Guests Report WiFi Password Has Not Changed Since 2019; Management Calls This 'Stability'`,
      subhead: `The password, "poseidon2019," is printed on a laminated card described by management as "part of the brand experience."`,
      author: "Dorothea Quillsworth, Maritime Affairs",
      date: "May 15, 2026",
      body: `${cast("TOWN")}, COSTA RICA — Guests at ${cast("HOTEL")}, the four-room beachfront property on Playa Jacó, have confirmed in reviews and in direct conversation with this publication that the property's WiFi password has remained unchanged since the network was installed in January 2019, a period of approximately 2,689 days.

The password, "poseidon2019," is printed on a laminated orange card placed on each nightstand alongside the remote control and a local restaurant guide last updated in 2021. Management, when asked, confirmed the password's longevity.

"The guests know the password," said the front desk attendant, who identified herself only as the person working Tuesdays. "If we change it, we have to reprint the cards. The lamination is expensive."

A cybersecurity professional contacted for comment declined to characterize the situation as a "vulnerability" in any formal sense but used the word "troubling" three times in a single sentence. The attendant noted he was welcome to stay, but checkout was at noon.

The hotel's Tripadvisor rating is 4.1 stars. Guests consistently describe the beach access as "excellent." Several mention the WiFi. None of the reviews mention this being a positive.`,
      img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80",
    },
    {
      id: "bmx-event",
      tag: "SOCIETY",
      headline: `${cast("DAVE")} Announces BMX Demonstration Event, Notes Venue, Date, and Equipment Status All 'Being Sorted'`,
      subhead: `Flyer distributed via WhatsApp group lists event as "COMING SOON" with a photo of ${cast("DAVE")} next to a bicycle that sources confirm belongs to someone else.`,
      author: "Wellington Feather-Beak, Events",
      date: "May 14, 2026",
      body: `${cast("TOWN")}, COSTA RICA — ${cast("DAVE")}, who has self-identified as a BMX practitioner at multiple social gatherings over the past eighteen months, announced via a WhatsApp message to the Playa Hermosa neighborhood group that he would be organizing a BMX demonstration event "soon," with further details to follow once several logistical items were resolved.

The announcement, forwarded to this publication by a group member who described it as "par for the course," included a photograph of ${cast("DAVE")} standing beside a red BMX bicycle in what appeared to be a garage. Three people who saw the message confirmed the bicycle belongs to a man named Carlos who lives on Calle Miramar and was unaware his bike had been featured in event promotional materials.

"I have a bike," ${cast("DAVE")} said when reached for clarification. "I'm between bikes. I have a situation with the bike I normally use. It's being resolved." He added that the event itself was "very much happening" and that he was "in conversations" with the Jacó skate park regarding venue use.

The skate park's coordinator said no conversations had occurred but that ${cast("DAVE")} was "welcome to call."

A follow-up WhatsApp message was sent to the neighborhood group the following week. It contained a different photo of ${cast("DAVE")} and the words "STAY TUNED."`,
      img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80",
    },
    {
      id: "correspondent-report",
      tag: "OPINION",
      headline: `${cast("ECHO")} Files Report From Location That Is 'Not Important Right Now'; Describes Situation As 'Developing'`,
      subhead: `The report contains nine paragraphs. Four conclude with "more to follow." Three note that the full picture will "emerge in time."`,
      author: `${cast("ECHO")}, Field Correspondent`,
      date: "May 13, 2026",
      body: `LOCATION UNDISCLOSED — ${cast("ECHO")}, a correspondent whose bureau assignment has been characterized by editors as "fluid," filed a 2,300-word dispatch this week from a location described in the dateline only as "the region," detailing a situation the correspondent characterized as "significant, complex, and not yet fully legible from the current vantage point."

The report, reviewed in full by this publication, contains substantial contextual analysis, seventeen attributed quotes from sources described collectively as "familiar with the matter," and a conclusion that notes more context will be available "as the situation clarifies."

When contacted to specify the location and situation, ${cast("ECHO")} confirmed both were real and noted that "naming them directly at this stage would be premature." They added that this was a "principled position, not evasion."

An editor at the publication's desk noted the report had been well-written and that the ambiguity was "frustrating but not untrue to how these things work." He asked for a follow-up by Friday. ${cast("ECHO")} confirmed Friday was achievable and noted the situation would be "considerably clearer by then, probably."

The follow-up arrived Saturday. It described the situation as "still developing."`,
      img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&q=80",
    },
    {
      id: "stonepath-audit",
      tag: "BREAKING",
      headline: `${cast("HECTOR")} Conducting 'Informal Audit' of Neighborhood Network Infrastructure; Has Not Been Asked To`,
      subhead: `The audit, now in its third week, has produced a 14-page findings document. Distribution of the document is described as 'ongoing.'`,
      author: "Constance Waddle, Infrastructure",
      date: "May 12, 2026",
      body: `${cast("TOWN")}, COSTA RICA — ${cast("HECTOR")}, a retired telecommunications technician and current resident of Barrio Las Flores, has been conducting what he describes as a "comprehensive passive audit" of the local residential network infrastructure for the past 21 days, according to neighbors who have received interim reports without requesting them.

The audit, which ${cast("HECTOR")} says uses equipment he already owned for unrelated reasons, has thus far identified 34 residential networks, 12 of which he characterizes as "suboptimally configured" and 4 of which he describes as "concerning from a signal hygiene perspective." He has notified the households he found concerning. Two of them have responded. One said thank you. One did not say thank you.

"I'm not collecting anything I couldn't observe from my porch," ${cast("HECTOR")} confirmed. "The electromagnetic spectrum is public. I am simply documenting it in a structured format and sharing findings with stakeholders." He defines stakeholders as "neighbors."

A 14-page interim findings document has been distributed to eleven households. The document includes network topology maps, signal strength charts, and a section titled "Recommended Actions" that ${cast("HECTOR")} described as "advisory, not mandatory, but advisable."

The full report is expected by end of month. ${cast("HECTOR")} has already identified three follow-up areas of inquiry.`,
      img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=900&q=80",
    },
    {
      id: "jaco-economy",
      tag: "NEWS",
      headline: `${cast("TOWN")} Economy Enters 'Sponsorship Phase' As Percentage of Residents Claiming To Seek Sponsors Tops 40%`,
      subhead: `A new municipal study finds 41.3% of adult residents describe themselves as 'in discussions' with a brand partner. No brands have been identified.`,
      author: "Eugenia Greylag, Regional Economics",
      date: "May 11, 2026",
      body: `${cast("TOWN")}, COSTA RICA — A study released Tuesday by the Municipality of ${cast("TOWN")} found that 41.3% of adult residents described themselves as either currently pursuing, in active discussions about, or in the final stages of securing a brand sponsorship of some kind, representing a 22-point increase over the same survey administered in 2023.

The survey, conducted door-to-door over six weeks, asked residents to characterize their primary professional activity. Sponsorship-related responses included "working on a brand partnership," "finalizing terms with an interested party," and in 14% of cases, "the deal is basically done, just waiting on paperwork."

No sponsor organizations were named by any respondent. Thirty-two respondents said the sponsor "preferred not to be named at this stage." Eleven said they were under NDA. Three said the sponsor was "international."

The municipality's economic development office described the findings as "unusual" and noted it was unclear what category to assign the 41.3% figure in standard employment metrics. A note in the appendix flags the response pattern for "further methodological review."

${cast("KENNETH")}, reached for comment as a known practitioner in the space, confirmed the trend was real and said the local sponsorship market was "heating up." He added that he was himself finalizing a deal but was not yet in a position to say with whom.`,
      img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
    },
    // Non-cast supplemental articles
    {
      id: "geese-llc",
      tag: "BUSINESS",
      headline: "Area Geese Incorporate, Begin Invoicing Municipality for Noise Pollution Services Rendered Since 2019",
      subhead: "Rate sheet unavailable. Honking services non-refundable. Clients may not opt out.",
      author: "Wellington Feather-Beak, Business Reporter",
      date: "May 10, 2026",
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
      headline: "Vibes-Based Market Outperforms Logic-Based Market For Seventh Consecutive Quarter",
      subhead: "The S&P Vibes Index closed up 3.4 points on strong feelings and a general sense that things might be fine.",
      author: "Eugenia Greylag, Markets Correspondent",
      date: "May 9, 2026",
      body: `NEW YORK — The Vibes-Based Market closed up 3.4 points Friday on strong ambient feelings, a general sense that things might be fine, and one trader's intuition that "it just feels like an up day," according to the Quarterly Feelings Report released Thursday by the Institute for Economic Sensation.

The performance extends the Vibes Index's lead over the Logic-Based Market to seven consecutive quarters, the longest streak since 2017, when the Logic-Based Market suffered a catastrophic encounter with actual data.

"At this point we've had to acknowledge the vibes are load-bearing," said Dr. Cornelius Wing, Chief Sentiment Analyst at the Institute. "We ran the models. Confidence, loosely defined, correlates with outcomes at a rate of roughly 0.68. We don't fully understand it. We've stopped trying."

The Logic-Based Market, which factors in supply chains, earnings ratios, and geopolitical stability, closed flat. Its chief strategist said the market remained "fundamentally sound" and noted that this had not been reflected in the price.`,
      img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&q=80",
    },
    {
      id: "brain-study",
      tag: "SCIENCE",
      headline: "Scientists Locate Brain Region Responsible For Deciding Not to Do the Thing You Planned to Do",
      subhead: "The region, designated the 'Pre-Nope Cortex,' activates approximately 40 seconds before you close the tab.",
      author: "Dr. Benedict Plumage, Science Desk",
      date: "May 8, 2026",
      body: `CAMBRIDGE, MA — Neuroscientists at the Institute for Behavioral Non-Completion have identified the brain region responsible for the precise moment when a person decides not to do the thing they had planned, scheduled, and in several documented cases, told other people they would do.

The region, located in the prefrontal cortex adjacent to the Planning Module, activates on average 40 seconds before the subject closes the browser tab, puts down the gym bag, or selects "remind me tomorrow" on a notification they will never revisit.

"We've been calling it the Pre-Nope Cortex informally," said Dr. Algernon Beak, lead author of the study. "The formal name is the Anterior Avoidance Complex, but Pre-Nope tested better in focus groups, which is one of the reasons I became a neuroscientist instead of a marketer."

The study followed 2,400 subjects over eighteen months, tracking 14.7 million individual instances of not doing things. Researchers noted the findings have no practical implications.`,
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
      tag: "BREAKING",
      headline: "New Report Confirms Everything Fine; Panel Raises Concerns About Definition of Fine",
      subhead: "Working group to be formed. Members of working group will be fine.",
      author: "Algernon Beak, Investigations",
      date: "May 6, 2026",
      body: `WASHINGTON, D.C. — A bipartisan report released Tuesday by the Select Committee on Current Conditions concluded that everything is, broadly speaking, fine, while raising substantial procedural concerns about what "fine" means as an evaluative standard and whether the committee had the statutory authority to make that determination.

"We found no evidence of anything not fine," said Committee Chair Representative Dorothea Quillsworth. "We also found no universally accepted definition of fine. These two findings are in tension."

The 400-page report includes 78 pages of methodology, 94 pages of footnotes, and a 12-page appendix acknowledging that the report itself was fine but noting that its fineness was not audited.

Ranking member Senator Reginald Feathers issued a minority opinion agreeing that everything was fine but disputing the process by which fineness had been determined, calling for a working group to establish a framework for future fineness evaluations. The working group will convene in September.`,
      img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=80",
    },
  ];
}

// ─── GOOSE SVG ────────────────────────────────────────────────────────────────
function GooseSvg({ honking, size = 40 }: { honking: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 120 100" width={size} height={size * 0.833}
      style={{ filter: honking ? "drop-shadow(0 0 5px #facc15)" : "none", transition: "filter 0.1s" }}>
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

// ─── TAG BADGE — ink-black for BREAKING, dark for all others, zero red ────────
function TagBadge({ tag }: { tag: string }) {
  const colors: Record<string, string> = {
    BREAKING:      "bg-gray-950 text-white",
    NEWS:          "bg-gray-800 text-white",
    SCIENCE:       "bg-slate-700 text-white",
    BUSINESS:      "bg-stone-700 text-white",
    SOCIETY:       "bg-zinc-700 text-white",
    WILDLIFE:      "bg-neutral-700 text-white",
    MARITIME:      "bg-gray-700 text-white",
    OBITUARIES:    "bg-gray-600 text-white",
    OPINION:       "bg-gray-500 text-white",
    LOCAL:         "bg-stone-600 text-white",
    "REAL ESTATE": "bg-stone-500 text-white",
  };
  return (
    <span className={`inline-block text-[9px] font-black font-sans tracking-[0.18em] uppercase px-1.5 py-0.5 ${colors[tag] ?? "bg-gray-700 text-white"}`}>
      {tag}
    </span>
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

        <div className="border-b-4 border-black px-8 pt-8 pb-5">
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

        <img src={article.img} alt={article.headline} className="w-full h-56 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${article.id}/800/400`; }}/>

        <div className="px-8 py-7">
          {article.body.split("\n\n").filter(Boolean).map((para, i) => (
            <p key={i} className="font-serif text-[15px] leading-[1.75] text-gray-800 mb-4 last:mb-0">{para}</p>
          ))}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-8 py-4">
          <span className="text-[10px] font-sans text-gray-400 tracking-wide uppercase">
            © The Goose Gazette — All The News That's Fit To HONK
          </span>
        </div>
      </div>
    </div>
  );
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
  const [selected, setSelected] = useState<Article | null>(null);
  const [honking, setHonking] = useState(false);
  const [honkCount, setHonkCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleHonk = useCallback(() => {
    playHonk();
    setHonking(true);
    setHonkCount(c => c + 1);
    setTimeout(() => setHonking(false), 500);
  }, []);

  const { data: apiData, refetch } = useQuery<any[]>({
    queryKey: ["/api/goose/articles"],
    refetchInterval: 5 * 60 * 1000,
  });

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
      : `https://picsum.photos/seed/${a.id}/900/600`,
  }));

  const PLACEHOLDERS = buildPlaceholders();
  const allArticles = [...fixedApiArticles, ...PLACEHOLDERS];

  const filtered = activeCategory === "ALL"
    ? allArticles
    : allArticles.filter(a => a.tag.toUpperCase() === activeCategory);

  const cover      = filtered[0] ?? allArticles[0];
  const secondary1 = filtered[1] ?? allArticles[1];
  const secondary2 = filtered[2] ?? allArticles[2];
  const gridStories = filtered.slice(3, 7);
  const briefStories = filtered.slice(7, 15);
  const mostHonked  = allArticles.slice(0, 5);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await fetch("/api/goose/generate", { method: "POST" });
      setTimeout(() => refetch(), 1000);
    } catch {}
    setGenerating(false);
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const edition = Math.floor((Date.now() - new Date("2026-01-01").getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        @keyframes honk-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1) rotate(-3deg); } }
        @keyframes waddle { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg) translateY(-2px); } }
        .waddle { animation: waddle 1.8s ease-in-out infinite; }
        .honk-active { animation: honk-pulse 0.35s ease-in-out; }
        .article-hover:hover h2, .article-hover:hover h3, .article-hover:hover h4 { color: #374151; }
      `}</style>

      {/* ──────────── MOBILE TOP BAR (lg:hidden) ─────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 h-12 flex items-center justify-between px-4" data-testid="header-mobile">
        <button onClick={() => setMobileOpen(o => !o)} aria-label="Menu" data-testid="button-mobile-menu" className="p-2 text-black">
          {mobileOpen
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
          }
        </button>
        <a href="/goose" className="flex items-center gap-2 select-none">
          <div className={honking ? "honk-active" : ""}><GooseSvg honking={honking} size={22}/></div>
          <span className="font-black text-[12px] tracking-tight text-black" style={{ fontFamily: "Georgia, serif" }}>THE GOOSE GAZETTE</span>
        </a>
        <div className="w-9"/>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)}>
          <aside className="w-64 h-full bg-white p-6 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="drawer-mobile">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="waddle"><GooseSvg honking={false} size={56}/></div>
              <h1 className="font-black text-[18px] mt-2 tracking-tight leading-tight text-black" style={{ fontFamily: "Georgia, serif" }}>The Goose Gazette</h1>
              <p className="text-[10px] italic text-gray-500 mt-1">Est. The Moment Things Got Weird</p>
            </div>
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

      {/* ──────────── DESKTOP 3-COL LAYOUT (180px · 1fr · 200px) ────────────── */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[180px_1fr_220px] pb-16">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:block sticky top-0 self-start h-screen border-r border-gray-200 px-6 py-8 overflow-y-auto" data-testid="sidebar-left">
          <a href="/goose" className="flex flex-col items-center text-center mb-8 select-none group">
            <div className={honking ? "honk-active" : "waddle"}>
              <GooseSvg honking={honking} size={64}/>
            </div>
            <h1 className="font-black text-[19px] mt-3 tracking-tight leading-tight text-black group-hover:text-gray-700 transition-colors" style={{ fontFamily: "Georgia, serif" }}>
              The Goose Gazette
            </h1>
            <p className="text-[9px] italic text-gray-500 mt-1 tracking-wide">Est. The Moment Things Got Weird</p>
          </a>

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

          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="text-[8px] font-black tracking-[0.3em] uppercase text-gray-400 mb-2">Engine</div>
            <div className="text-[9px] text-gray-500 font-sans leading-relaxed space-y-0.5">
              <div>Ψ = A × N = 1</div>
              <div>κ = 4/π</div>
              <div>θ_K = 128.23°</div>
              <div>Δ = 0.02</div>
            </div>
          </div>
        </aside>

        {/* CENTER FEED */}
        <main className="min-w-0 px-5 lg:px-12 py-8" data-testid="main-feed">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-8">
            <span className="text-[11px] text-gray-600 font-sans tracking-wide" data-testid="text-date">{today}</span>
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
                    style={{ fontFamily: "Georgia, serif" }}>
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
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${cover.id}/400/300`; }}/>
                </div>
              </div>
            </article>
          )}

          {/* Secondary stories — clean vertical feed */}
          <div className="divide-y divide-gray-200">
            {filtered.slice(1).map(a => (
              <article key={a.id} className="py-6 cursor-pointer group article-hover"
                onClick={() => setSelected(a)} data-testid={`article-feed-${a.id}`}>
                <div className="flex gap-5 items-start">
                  <div className="shrink-0 w-20 h-20 overflow-hidden bg-gray-100">
                    <img src={a.img} alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${a.id}/200/200`; }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <TagBadge tag={a.tag}/>
                    <h3 className="font-serif font-bold text-[16px] lg:text-[17px] leading-snug mt-1 text-gray-900 group-hover:text-gray-600 transition-colors"
                      style={{ fontFamily: "Georgia, serif" }}>
                      {a.headline}
                    </h3>
                    {a.subhead && (
                      <p className="text-[12px] lg:text-[13px] text-gray-600 italic mt-1 leading-snug line-clamp-2">{a.subhead}</p>
                    )}
                    <p className="text-[10px] font-sans text-gray-400 mt-2 tracking-wide">{a.author} &nbsp;·&nbsp; {a.date}</p>
                  </div>
                </div>
              </article>
            ))}
            {filtered.length === 0 && (
              <p className="py-12 text-center text-[12px] text-gray-400 font-sans">No stories in this section.</p>
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:block sticky top-0 self-start h-screen border-l border-gray-200 px-5 py-8 overflow-y-auto" data-testid="sidebar-right">
          <div className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500 text-center">INSIGHT BRIEFIF</div>
          <div className="flex justify-center my-5">
            <div className="waddle">
              <GooseSvg honking={false} size={84}/>
            </div>
          </div>
          <div className="text-[12px] font-serif text-center text-gray-800 mb-6" style={{ fontFamily: "Georgia, serif" }}>
            Goose Gap<br/>
            <span className="italic text-gray-500 text-[11px]">(Δ = 0.02)</span>
          </div>

          <div className="border-t border-gray-200 pt-5 mt-2">
            <HypervisorPanel />
          </div>

          <div className="border-t border-gray-200 pt-5 mt-5">
            <BarneyTRex />
          </div>

          <div className="border-t border-gray-200 pt-5 mt-5">
            <PinkRabbit />
          </div>

          <div className="border-t border-gray-200 pt-4 mt-5">
            <div className="text-[9px] font-black tracking-[0.28em] uppercase text-gray-400 mb-3">Recent</div>
            <ol className="space-y-4" data-testid="list-recent">
              {mostHonked.slice(0, 5).map((a, i) => (
                <li key={a.id} onClick={() => setSelected(a)} className="cursor-pointer group"
                  data-testid={`recent-${i + 1}`}>
                  <p className="font-serif text-[11px] font-bold leading-snug text-gray-800 group-hover:text-gray-500 transition-colors line-clamp-3"
                    style={{ fontFamily: "Georgia, serif" }}>
                    {a.headline}
                  </p>
                  <p className="text-[9px] font-sans text-gray-400 mt-1">{a.date}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <button onClick={handleGenerate} disabled={generating} data-testid="button-generate-article"
              className="text-[10px] font-sans text-gray-400 hover:text-black transition-colors disabled:opacity-40 tracking-wide"
              title="Generate new article (Ω-Council)">
              {generating ? "⏳ generating…" : "↻ new edition"}
            </button>
          </div>
        </aside>

      </div>

      {/* ──────────── STICKY BOTTOM BAR ─────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-gray-950 text-gray-300 border-t-2 border-black h-12 flex items-center justify-between px-4 lg:px-6" data-testid="bar-bottom">
        <p className="font-serif italic text-[11px] truncate flex-1 mr-4 text-gray-400">
          <span className="hidden lg:inline">*All conflicts declared 99.98% meaningless. — </span>
          "Beauty is not a property of objects — it is the κ-constrained collapse of the observer-critic-synthesizer wavefunction."
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <HumorBadge />
          <button onClick={handleHonk} data-testid="button-honk-bottom"
            className={`shrink-0 text-[10px] font-black font-sans px-3 py-1.5 border-2 transition-all duration-200 ${
              honking ? "bg-yellow-400 text-black border-yellow-400 scale-105" : "bg-transparent text-white border-white hover:bg-white hover:text-black"
            }`}>
            {honking ? "HONK!!!" : `HONK${honkCount > 0 ? ` (${honkCount})` : ""}`}
          </button>
        </div>
      </div>

      {selected && <ArticleModal article={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}

