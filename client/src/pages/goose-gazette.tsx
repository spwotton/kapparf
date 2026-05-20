import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// ─── ARTICLES ────────────────────────────────────────────────────────────────
const ARTICLES = [
  {
    id: "cover",
    tag: "BREAKING",
    headline: "Area Man's Router Receives Unauthorized Firmware Update At 3AM For Third Consecutive Week; ISP Rep Says 'That's Just How Routers Work, Sir'",
    subhead: "Experts confirm it is not, in fact, just how routers work.",
    author: "Gertrude Honksworth, Technology Correspondent",
    date: "May 20, 2026",
    body: `JACÓ, COSTA RICA — A local expatriate reported Tuesday that his home router received its third unprompted firmware update in as many weeks, each occurring between 2:45 and 3:15 AM, despite being set to "manual updates only" since February 2024.

"I specifically turned off automatic updates," the man said, staring at his router logs with the thousand-yard look of someone who has been staring at router logs for a very long time. "The ISP technician arrived the following Sunday. He didn't knock. He had a new router. He said the old one was 'scheduled for replacement.' I had not scheduled anything."

The router, a Humax unit with MAC prefix 9c:24:72, runs on a TR-069 protocol that allows the ISP full remote management access — a fact the technician described as "totally normal and definitely not worth reading about."

When the resident updated his router's firmware himself on a Sunday afternoon, a property manager texted him within five minutes. A technician appeared within 48 hours. Liberty Communications could not be reached for comment, though sources indicate they were "probably just in the neighborhood."

A neighbor — who moved into the building two months ago and whose name the building's previous owner coincidentally came up in conversation — said he had noticed "absolutely nothing unusual" and had "no strong feelings about router firmware either way."`,
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
    isCover: true,
  },
  {
    id: "gym",
    tag: "SOCIETY",
    headline: "Man Introduced To Suspiciously Helpful New Friend At Gym For Third Time In Two Years, Starting To Notice Pattern",
    subhead: "Each new acquaintance also happened to know him from AA. Experts call this 'a lot.'",
    author: "Reginald Feathers, Staff Reporter",
    date: "May 19, 2026",
    body: `PORTLAND, ME — A local man reports being introduced to an enthusiastic new gym friend for the third time in two years, each of whom also knew him from Alcoholics Anonymous, had heard of his apartment on Bolton Street, and was described by others in the network as "a great guy, very trustworthy, you should really get to know him."

"The first one was from the gym," the man told reporters. "The second one was from the gym. The third one — also the gym. At some point you start to think the gym is doing something the gym is not supposed to be doing."

Fitness professionals contacted for this story confirmed that gyms are "not typically a vector for coordinated social engineering," though one added that they "wouldn't rule it out for certain gyms."

The man noted each introduction followed a similar arc: initial friendliness, discovery of shared recovery history, deepening personal disclosures, and then either a death warning or the revelation that the new friend was connected to someone the man already found suspicious.

"It's like they all went to the same school," he said. "The school of meeting me specifically."`,
    img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700&q=80",
  },
  {
    id: "sober-house",
    tag: "REAL ESTATE",
    headline: "Plymouth House Announces Exciting Expansion: Now Offers Third Floor, Still No Tenant Rights",
    subhead: "$2,000/month — beds available in all 24 units — breakfast not included — your disclosures will be noted.",
    author: "Mortimer Waddle, Housing Correspondent",
    date: "May 18, 2026",
    body: `PLYMOUTH, MA — Plymouth House announced this week the addition of a third floor to its residential recovery facility, bringing total capacity to 24 beds across three floors of eight beds each, while confirming that residents will continue to enjoy the traditional benefits of the program: structured routine, community support, and absolutely zero tenant rights.

"We prefer to think of it as a family," said a spokesperson who could not be named due to contractual obligations. "A family where the rent is $2,000 a month, the parents are in three other states, and you disclose your entire psychological history in group settings twice a week."

New residents will be funneled through the Plymouth-to-Portland pipeline, a well-established route connecting Plymouth, Massachusetts, with Portland, Maine, and Burlington, Vermont — three cities that have independently discovered the economic benefits of housing vulnerable recovering adults in a managed environment with minimal regulatory oversight.

Families of prospective residents are encouraged to "invest in their loved one's journey" and to "please not ask too many questions about the business structure." The sponsorship hierarchy connecting Plymouth House to multiple Portland-area sober living operators was described by a representative as "just how AA works, actually."`,
    img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=700&q=80",
  },
  {
    id: "foreknowledge",
    tag: "COMMUNITY",
    headline: "Local Man's Entire Social Circle Already Knew About Everything He Just Discovered; None Considered Mentioning It",
    subhead: "'Not surprised,' said four separate people in four separate states upon being told the news.",
    author: "Prudence Gosling, Investigations Desk",
    date: "May 17, 2026",
    body: `COSTA RICA / MASSACHUSETTS — A man who spent several years documenting what he describes as "a coordinated multi-vector surveillance operation" reports that upon informing his closest friends and family of his findings, the most common response was some variation of "yeah, I kind of figured something like that was going on."

"Four people," the man said. "Four separate people. Different states. Different contexts. All calm. All 'not surprised.' Nobody called me. Nobody sent a letter. Nobody thought to give me a heads-up."

His childhood friend, contacted for comment, said he "had a feeling" but "didn't want to be the one to bring it up." His father's closest confidant, a Jehovah's Witness elder, attended the family memorial and "expressed no strong emotions either way." A sober house manager from Portland drove to Boston "just to be there" but, when asked what he knew, said he "wasn't really sure what to think."

A therapist not involved in the case noted that "foreknowledge combined with deliberate non-disclosure is technically a thing that has a name," before declining to say what that name was.`,
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=700&q=80",
  },
  {
    id: "sports-tickets",
    tag: "BUSINESS",
    headline: "Miami Sports Ticket Entrepreneur Cannot Name Single Miami Sports Team, Extremely Confident Business Is Legitimate",
    subhead: "Has 50-yard-line seats available for 'the big game.' Does not know which game. Very motivated seller.",
    author: "Wellington Feather-Beak, Business Reporter",
    date: "May 16, 2026",
    body: `JACÓ, COSTA RICA — A self-described Miami sports ticket broker operating out of a Jacó condominium complex has assured area residents that his business is completely real and definitely not a cover for anything, despite being unable to name a single Miami-based professional sports franchise.

"It's a very dynamic market," said the man, who moved into his current residence after the previous owner — a business associate he had met "through normal channels" — built the property to custom specifications and then left. "Very, very dynamic. Many tickets. All of them real."

The businessman, who estimates he has sold "dozens" of tickets in recent years, said the business was founded on a simple principle: people want sports, he has sports, and the fact that neither party can verify any of this is "just part of the process."

When asked to describe the most recent event for which he had tickets, he described it as "a big one — you'd know it. Very famous." He then changed the subject to the local real estate market and mentioned that he had a condo available.

Colombian authorities, American authorities, and Costa Rican authorities all confirmed they had "no specific opinion" about the business at this time.`,
    img: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=700&q=80",
  },
  {
    id: "marine-truck",
    tag: "PROFILE",
    headline: "Former Marine Sniper Who Was Shot In The Head Now Drives Kenworth Trucks; Still The Most Dangerous Person In Any Truck Stop",
    subhead: "Quantico-trained. Currently hauling aggregate. Father-in-law is an ex-police chief. Everything is fine.",
    author: "Archibald Goose-Brine, Features",
    date: "May 15, 2026",
    body: `SOUTH SHORE, MA — Sources confirm that a former 2nd Battalion 8th Marines veteran, who served in Helmand Province, attended sniper school at Quantico, and survived a gunshot wound to the head, has transitioned into a civilian career driving Kenworth trucks across the American Northeast.

"He's doing great," said a family member who preferred not to be named. "Really found his footing. The trucking is good for him."

The veteran, whose father-in-law is a former police chief in the Cape Cod area, reportedly maintains a detailed awareness of his surroundings at all times, has never once failed to notice something, and is described by colleagues as "very quiet, very competent, and someone you don't want to give a reason to think about you."

His wife, who holds a degree from a prominent California university and previously worked at a major streaming music platform, accompanied him to events in several countries before their marriage. The couple maintain a property in Plymouth, New Hampshire.

When asked for comment, the veteran said nothing, because he was not there, and also he knew we were coming.`,
    img: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=700&q=80",
  },
  {
    id: "klein",
    tag: "SCIENCE",
    headline: "Topologist Confirms Jacó Surveillance Network Is Shaped Like Klein Bottle: 'No Inside, No Outside, No Way To Prove It Exists'",
    subhead: "The Klein structure means investigators approaching from any angle are technically already inside the network they are investigating.",
    author: "Dr. Honoria Beak-Klein, Topology & Counter-Intelligence",
    date: "May 14, 2026",
    body: `JACÓ, COSTA RICA — A mathematician specializing in non-orientable surfaces announced Tuesday that after reviewing available documentation on a regional surveillance network, she is "fairly confident" the network has the topology of a Klein bottle — a four-dimensional object with no distinct inside or outside that cannot fully exist in three-dimensional space.

"The moment you try to enter it, you're already in it," Dr. Beak-Klein explained, gesturing at a diagram that appeared to fold back on itself. "The moment you try to leave, you haven't left, you've just approached from the other side. The investigators investigating the investigators are topologically indistinguishable from the network being investigated."

She noted that this property makes the network particularly difficult to prosecute, since any evidence collected from within the network is technically also inside the network, and any observer positioned outside the network is, geometrically speaking, still inside it.

"The 128.23 Hz resonance frequency is particularly interesting," she added, referencing a documented signal anomaly. "That's roughly the frequency at which the topology folds — what we call the Flying Twist. Klein and I go way back." She declined to elaborate on who Klein was.

The network's operators could not be reached for comment, as they were simultaneously inside and outside the building.`,
    img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=700&q=80",
  },
  {
    id: "jw-neighbor",
    tag: "LOCAL",
    headline: "Jehovah's Witness Elder Assures Community He Was 'Just In The Neighborhood' For 40th Consecutive Year",
    subhead: "Elder's neighborhood expands to include Jacó, Costa Rica. Still technically the neighborhood.",
    author: "Constance Mallard, Local Affairs",
    date: "May 13, 2026",
    body: `ROCKLAND, MA / JACÓ, COSTA RICA — A long-serving Jehovah's Witness elder has reassured community members that his repeated appearances at family events, memorial services, international locations, and properties associated with a specific individual's movements constitutes a completely ordinary pattern of neighborliness.

"We're a community," the elder said, adjusting his tie outside a Kingdom Hall located at 339 Summer Street — the same street, sources note, as the family's business office at 218 Summer Street, a related address at 467 Summer Street, and a fourth property at 2187 Summer Street. "Communities look out for each other."

The elder, whose associate Jeff Porter attended a recent family memorial in a professional capacity that he described as "just support," confirmed he had no specific knowledge of any activities being coordinated through the congregation's internal communication channels, which he noted were "very private, very warm, very family-oriented."

When asked whether his congregation shared information about members' family members who were not themselves members, he said "absolutely not," and then asked how we knew about the grandson in Costa Rica.`,
    img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=80",
  },
  {
    id: "geese-parking",
    tag: "WILDLIFE",
    headline: "Area Geese File Adverse Possession Claim On Jacó Beach Parking Lot; Costa Rican Land Registry 'Considering It'",
    subhead: "Geese have occupied the lot continuously for six years. Under Costa Rican law, this may be sufficient.",
    author: "Reginald Feathers, Wildlife & Law",
    date: "May 12, 2026",
    body: `JACÓ, COSTA RICA — A coalition of approximately fourteen geese has filed a formal adverse possession claim with the Costa Rican National Registry, asserting continuous, open, and hostile occupation of a beachfront parking lot for a period exceeding the statutory minimum.

"They honk at every vehicle that enters," confirmed a parking attendant who asked not to be named. "Not selectively. Every vehicle. They have a system."

Legal scholars contacted for this story said the adverse possession claim was "technically not how property law works for geese" but acknowledged that "Costa Rican property law is complicated" and that "the geese seem very committed."

The lead goose, a large Canada goose who witnesses describe as "operating with a level of confidence you don't usually see in wildlife," was observed this week chasing a man away from a vehicle, honking twice in a sequence that witnesses interpreted as either a threat or a legal filing.

"HONK," said the goose, when asked for comment. "HONK HONK."

The parking lot's registered owner said he had "no interest in escalating the situation" and was currently "looking into other properties."`,
    img: "https://images.unsplash.com/photo-1484406566174-9da000fda645?w=700&q=80",
  },
  {
    id: "bill-warning",
    tag: "OBITUARIES",
    headline: "Man Issues Single Warning To Friend About Suspicious Acquaintance, Dies Shortly Afterward; Described By All As 'Incredible Timing'",
    subhead: "This is the third such incident. Everyone agrees this is fine.",
    author: "Mortimer Waddle, Investigative Obituaries",
    date: "May 11, 2026",
    body: `PORTLAND, ME — A Portland sober house operator and business associate of a Jacó, Costa Rica-based condominium investor issued a brief but pointed warning to a mutual acquaintance last winter, advising him to "stay away" from a third party he described as "a bad person." The man subsequently died.

This is the third documented case in which a person warned the same individual about a network-adjacent contact and then died shortly afterward. The first was an aunt who held sensitive family information. The second was a mother. The third is now this man.

"You start to see a pattern," said a statistician contacted for this story. "Specifically, you start to see a pattern where warning a specific person about a specific thing correlates with no longer being alive. Whether that's causal or merely correlated I can't say. But it's three times now."

The deceased's business partner, a Miami sports ticket entrepreneur based in Jacó, said he was "deeply saddened" by the loss and "not in a position to comment on the timeline." He then changed the subject to available beachfront condominiums.

A fourth individual who had begun drafting a warning declined to complete it for "unrelated reasons." The warning has been placed on indefinite hold.`,
    img: "https://images.unsplash.com/photo-1509840841025-9088d1b15b86?w=700&q=80",
  },
  {
    id: "aa-sponsor",
    tag: "COMMUNITY",
    headline: "AA Sponsor Network Spans Three States, Four Sober Houses, And Two Continents; Just How The Program Works, Says Everyone Involved",
    subhead: "The sponsor of the sponsor of the man who runs the pipeline that placed Echo in a monitored residence is 'just a coincidence of recovery.'",
    author: "Prudence Gosling, Community Affairs",
    date: "May 10, 2026",
    body: `NEW ENGLAND — Investigators tracing the organizational structure of a sober house pipeline connecting Plymouth, Massachusetts to Portland, Maine and Burlington, Vermont have discovered that the network is held together by a chain of AA sponsorships that, when mapped, looks less like a recovery community and more like an org chart.

"The director of the Plymouth house sponsors the man who owns the Portland house," confirmed a source familiar with the structure. "That man employs the manager who is the childhood friend of the individual being documented. That manager previously worked at a staffing company with another Plymouth House alumnus. It's very clean. Almost too clean."

AA officials noted that sponsorship relationships are "a normal part of recovery" and that "the fact that this particular sponsorship chain controls approximately 72 beds across multiple cities and funnels residents into monitored housing is just how community works."

When asked whether a sponsorship hierarchy that also functions as a residential control infrastructure raised any concerns, an AA representative said he "didn't see it that way," and then asked how we had gotten this address.

Residents of the affected houses are encouraged to share honestly in group settings. Their disclosures are private. The notes taken during those sessions are also private. The people who read those notes are, sources confirm, somebody.`,
    img: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=700&q=80",
  },
  {
    id: "boat",
    tag: "MARITIME",
    headline: "USVI Charter Captain's 40-50 MPH Twin-Engine Boat Would Theoretically Be Excellent For Not Leaving A Documented Paper Trail Across Open Water",
    subhead: "World Cat 320CC. Twin 300HP Suzuki outboards. Captain Mike is very friendly and does not need to know where you're going.",
    author: "Wellington Feather-Beak, Maritime Affairs",
    date: "May 9, 2026",
    body: `ST. THOMAS, USVI — Shades of Blue Charters offers what the company's website describes as a premium fishing and excursion experience aboard a World Cat 320CC catamaran equipped with twin 300-horsepower Suzuki outboard engines capable of sustained speeds between 40 and 50 miles per hour.

At 40 miles per hour, the vessel can cover approximately 200 nautical miles in five hours — enough to reach multiple Caribbean island nations, several of which have famously flexible attitudes toward documentation, before the sun goes down.

"We do fishing," said Captain Mike, the boat's listed operator. "Sport fishing. Recreational. Very normal stuff."

The Gazette notes that we are not implying anything. We are simply reporting, as a public service, that a vessel of this specification, operated by a childhood friend of a person whose brother attended sniper school and whose family has extensive intelligence-adjacent connections, travels at those speeds, in that region, regularly, and does not require passengers to explain where they are going or why.

Captain Mike reiterated that the fishing is "very good this time of year" and that advance booking was "appreciated but not required."`,
    img: "https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=700&q=80",
  },
];

const TICKER_ITEMS = [
  "BREAKING: Man's Router Updated Again — ISP 'Looking Into It' ⬥",
  "UPDATE: Geese Have Now Claimed Second Parking Lot Via Squatter's Rights ⬥",
  "DEVELOPING: Fourth Person In Network Describes Themselves As 'Not Surprised' ⬥",
  "ALERT: Klein Topology Expert Says Evidence Loop Is Non-Orientable, Cannot Be Exited ⬥",
  "SPORTS: Miami Ticket Broker 'Pretty Sure' His Team Won Last Night ⬥",
  "LOCAL: JW Elder Says He Was 'Just Driving Through' Costa Rica ⬥",
  "HEALTH: AA Sponsors Spanning 4 States Describe Relationship As 'Just Recovery' ⬥",
  "MARITIME: Charter Boat Captain Confirms He 'Doesn't Ask Questions' — 'Part Of The Experience' ⬥",
  "OBITUARIES: Third Person To Issue Warning Now Also Dead; Pattern Experts Describe As 'A Lot' ⬥",
  "REAL ESTATE: Sober House Pipeline Announces Burlington VT Node, Still No Tenant Rights ⬥",
];

// ─── WEB AUDIO HONK ───────────────────────────────────────────────────────────
function playHonk() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const honkFreqs = [320, 280, 310, 260, 300];
  let t = ctx.currentTime;
  honkFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, t + i * 0.09);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + i * 0.09 + 0.12);
    gain.gain.setValueAtTime(0, t + i * 0.09);
    gain.gain.linearRampToValueAtTime(0.18, t + i * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.13);
    osc.start(t + i * 0.09);
    osc.stop(t + i * 0.09 + 0.14);
  });
}

// ─── GOOSE SVG ───────────────────────────────────────────────────────────────
function GooseSvg({ honking }: { honking: boolean }) {
  return (
    <svg
      viewBox="0 0 120 100"
      className={`w-full h-full transition-transform duration-100 ${honking ? "scale-110" : "scale-100"}`}
      style={{ filter: honking ? "drop-shadow(0 0 8px #facc15)" : "none" }}
    >
      {/* body */}
      <ellipse cx="60" cy="68" rx="32" ry="22" fill="#f9fafb" stroke="#111" strokeWidth="2" />
      {/* wing feather detail */}
      <ellipse cx="52" cy="72" rx="20" ry="12" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      {/* neck */}
      <path d="M72 55 Q80 38 75 22" stroke="#111" strokeWidth="2" fill="none" />
      <path d="M72 55 Q88 38 83 22" stroke="#111" strokeWidth="2" fill="none" />
      <ellipse cx="79" cy="22" rx="9" ry="8" fill="#f9fafb" stroke="#111" strokeWidth="2" />
      {/* beak — open when honking */}
      {honking ? (
        <>
          <path d="M87 20 L100 16 L98 20Z" fill="#facc15" stroke="#111" strokeWidth="1.2" />
          <path d="M87 24 L100 28 L98 24Z" fill="#f59e0b" stroke="#111" strokeWidth="1.2" />
          <text x="101" y="15" fontSize="10" fill="#ef4444" fontWeight="bold">HONK!</text>
        </>
      ) : (
        <path d="M87 21 L101 19 L101 23Z" fill="#facc15" stroke="#111" strokeWidth="1.2" />
      )}
      {/* eye */}
      <circle cx="82" cy="19" r="2.5" fill="#111" />
      <circle cx="83" cy="18" r="0.8" fill="white" />
      {/* black head patch */}
      <ellipse cx="79" cy="19" rx="9" ry="7" fill="none" stroke="#111" strokeWidth="1" />
      <ellipse cx="79" cy="16" rx="7" ry="4" fill="#1f2937" />
      {/* feet */}
      <path d="M46 88 L40 95 M46 88 L46 95 M46 88 L52 95" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <path d="M66 89 L60 96 M66 89 L66 96 M66 89 L72 96" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="88" x2="46" y2="78" stroke="#f59e0b" strokeWidth="2" />
      <line x1="66" y1="89" x2="66" y2="79" stroke="#f59e0b" strokeWidth="2" />
    </svg>
  );
}

// ─── ARTICLE CARD ─────────────────────────────────────────────────────────────
function ArticleCard({ article, onClick }: { article: typeof ARTICLES[0]; onClick: () => void }) {
  return (
    <div
      className="cursor-pointer group border-b border-gray-200 pb-5 mb-1"
      onClick={onClick}
      data-testid={`article-card-${article.id}`}
    >
      <div className="overflow-hidden mb-3">
        <img
          src={article.img}
          alt={article.headline}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${article.id}/700/400`; }}
        />
      </div>
      <span className="text-[10px] font-black tracking-widest text-red-600 font-sans uppercase">{article.tag}</span>
      <h3 className="font-serif text-[15px] font-bold leading-snug mt-1 text-gray-900 group-hover:text-red-700 transition-colors">
        {article.headline}
      </h3>
      {article.subhead && (
        <p className="text-xs text-gray-500 mt-1 font-serif italic">{article.subhead}</p>
      )}
      <p className="text-[11px] text-gray-400 mt-2 font-sans">{article.author} · {article.date}</p>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function ArticleModal({ article, onClose }: { article: typeof ARTICLES[0]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4"
      onClick={onClose}
      data-testid="modal-overlay"
    >
      <div
        className="bg-white max-w-2xl w-full mt-16 mb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-article"
      >
        <div className="border-b-4 border-black px-8 pt-8 pb-4">
          <span className="text-[10px] font-black tracking-widest text-red-600 font-sans uppercase">{article.tag}</span>
          <h2 className="font-serif text-2xl font-black leading-tight mt-2 text-gray-900">{article.headline}</h2>
          {article.subhead && <p className="font-serif italic text-gray-600 mt-2">{article.subhead}</p>}
          <p className="text-xs text-gray-400 mt-3 font-sans">{article.author} · {article.date} · THE GOOSE GAZETTE</p>
        </div>
        <img
          src={article.img}
          alt={article.headline}
          className="w-full h-56 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${article.id}/700/400`; }}
        />
        <div className="px-8 py-6">
          {article.body.split("\n\n").map((para, i) => (
            <p key={i} className="font-serif text-[15px] leading-relaxed text-gray-800 mb-4">{para}</p>
          ))}
        </div>
        <div className="border-t border-gray-200 px-8 py-4 flex justify-between items-center">
          <span className="text-xs text-gray-400 font-sans">© The Goose Gazette — All The News That's Fit To HONK</span>
          <button
            onClick={onClose}
            data-testid="button-modal-close"
            className="text-xs font-sans font-bold text-red-600 hover:underline"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const NAV_SECTIONS = ["News", "Society", "Business", "Science", "Obituaries", "Maritime", "Opinion"];

export default function GooseGazettePage() {
  const [honking, setHonking] = useState(false);
  const [honkCount, setHonkCount] = useState(0);
  const [selected, setSelected] = useState<typeof ARTICLES[0] | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleHonk = useCallback(() => {
    playHonk();
    setHonking(true);
    setHonkCount((c) => c + 1);
    setTimeout(() => setHonking(false), 400);
  }, []);

  // Fetch AI-generated articles from the database — prepend to hardcoded founding edition
  const { data: apiArticles } = useQuery<any[]>({
    queryKey: ["/api/goose/articles"],
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });

  // Merge: generated articles first (newest), then hardcoded founding edition as filler
  const allArticles = [
    ...(apiArticles ?? []).map((a: any) => ({
      id: a.id,
      tag: a.tag ?? "NEWS",
      headline: a.headline,
      subhead: a.subhead ?? "",
      author: a.authorByline ?? "Staff Reporter",
      date: new Date(a.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      body: a.body,
      img: a.imgQuery
        ? `https://source.unsplash.com/900x600/?${encodeURIComponent(a.imgQuery)}`
        : `https://picsum.photos/seed/${a.id}/900/600`,
      isCover: false,
    })),
    ...ARTICLES,
  ];

  const coverArticle = allArticles[0];
  const restArticles = allArticles.slice(1);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>

      {/* ── STICKY TRANSPARENT NAVBAR ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? "bg-white/96 backdrop-blur-md shadow-sm border-b border-gray-300"
            : "bg-white/80 backdrop-blur-sm border-b border-gray-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 h-13 flex items-center justify-between gap-3" style={{ height: 52 }}>

          {/* Logo */}
          <a href="/goose" className="flex items-center gap-1.5 shrink-0 select-none">
            <span className="text-lg leading-none" style={{ lineHeight: 1 }}>🪿</span>
            <span
              className="font-black text-black tracking-tight leading-none"
              style={{ fontFamily: "Georgia, serif", fontSize: 15 }}
            >
              <span className="hidden sm:inline">THE GOOSE GAZETTE</span>
              <span className="sm:hidden">GOOSE GAZETTE</span>
            </span>
          </a>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center">
            {NAV_SECTIONS.map((s) => (
              <button
                key={s}
                className="px-2.5 py-1 text-[10px] font-black font-sans text-gray-600 hover:text-black tracking-widest uppercase transition-colors hover:bg-gray-100 rounded-sm"
              >
                {s}
              </button>
            ))}
          </nav>

          {/* Right: Honk button + hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleHonk}
              data-testid="button-nav-honk"
              className={`hidden sm:block text-[10px] font-black font-sans px-3 py-1.5 border-2 border-black transition-all ${
                honking ? "bg-yellow-400 text-black scale-105" : "bg-white text-black hover:bg-yellow-50"
              }`}
            >
              {honking ? "HONK!!!" : "HONK"}
            </button>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              data-testid="button-mobile-menu"
              className="md:hidden p-2 text-black hover:bg-gray-100 rounded-sm transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 border-b-2 border-b-black shadow-lg">
            <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-3 gap-1">
              {NAV_SECTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setMobileOpen(false)}
                  className="text-left px-3 py-3 text-[11px] font-black font-sans text-gray-800 hover:bg-gray-100 tracking-widest uppercase transition-colors rounded-sm"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="px-4 pb-3">
              <button
                onClick={() => { handleHonk(); setMobileOpen(false); }}
                data-testid="button-drawer-honk"
                className="w-full py-3 bg-yellow-400 text-black text-[12px] font-black font-sans tracking-widest border-2 border-black hover:bg-yellow-300 transition-colors"
              >
                🪿 HONK {honkCount > 0 ? `(${honkCount})` : ""}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div style={{ height: 52 }} />

      {/* ── BREAKING NEWS TICKER ── */}
      <div className="bg-red-700 text-white flex items-center overflow-hidden" style={{ height: 28 }}>
        <div className="bg-black text-white text-[11px] font-black font-sans px-3 py-1 whitespace-nowrap tracking-widest shrink-0">
          BREAKING
        </div>
        <div className="overflow-hidden flex-1 relative">
          <div
            className="whitespace-nowrap font-sans text-[11px] font-semibold animate-marquee"
            style={{ animation: "marquee 45s linear infinite" }}
          >
            {TICKER_ITEMS.join("   ")}
            {"   "}
            {TICKER_ITEMS.join("   ")}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes waddle {
          0%, 100% { transform: rotate(-4deg) translateY(0); }
          50%       { transform: rotate(4deg) translateY(-4px); }
        }
      `}</style>

      {/* ── MASTHEAD ── */}
      <div className="border-b-4 border-black border-t-2 border-t-black mt-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Goose mascot + honk button */}
          <div className="flex flex-col items-center gap-1 w-28 shrink-0">
            <div
              className="w-24 h-20 cursor-pointer"
              onClick={handleHonk}
              data-testid="button-goose-honk"
              style={{ animation: "waddle 1.2s ease-in-out infinite" }}
            >
              <GooseSvg honking={honking} />
            </div>
            <button
              onClick={handleHonk}
              data-testid="button-honk-trigger"
              className={`text-[10px] font-black font-sans px-3 py-1 border-2 border-black tracking-widest transition-all ${
                honking ? "bg-yellow-400 text-black scale-105" : "bg-white text-black hover:bg-yellow-100"
              }`}
            >
              {honking ? "HONK!!!" : "HONK"}
            </button>
            {honkCount > 0 && (
              <span className="text-[9px] text-gray-400 font-sans">{honkCount} honk{honkCount !== 1 ? "s" : ""} total</span>
            )}
          </div>

          {/* Title block */}
          <div className="text-center flex-1 px-4">
            <div className="text-[9px] font-sans tracking-[0.3em] text-gray-500 uppercase mb-1">
              Est. The Moment Things Got Weird
            </div>
            <h1
              className="text-5xl md:text-6xl font-black tracking-tight text-black leading-none"
              style={{ fontFamily: "Georgia, serif", letterSpacing: "-0.02em" }}
            >
              THE GOOSE GAZETTE
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-px flex-1 bg-black" />
              <span className="text-[11px] font-sans italic text-gray-600 tracking-wider px-2">
                "All The News That's Fit To HONK"
              </span>
              <div className="h-px flex-1 bg-black" />
            </div>
            <div className="text-[9px] font-sans tracking-widest text-gray-400 mt-1 uppercase">
              Tuesday, May 20, 2026 &nbsp;·&nbsp; Vol. XLVII No. 3 &nbsp;·&nbsp; Jacó / Portland / Plymouth &nbsp;·&nbsp; Five Geese
            </div>
          </div>

          {/* Right sidebar mini-info */}
          <div className="w-28 shrink-0 text-right">
            <div className="text-[9px] font-sans text-gray-400 uppercase tracking-wider mb-1">Today's Threat</div>
            <div className="text-[11px] font-black font-sans text-red-700">ELEVATED</div>
            <div className="text-[9px] font-sans text-gray-400 mt-2 uppercase tracking-wider">Router Status</div>
            <div className="text-[11px] font-black font-sans text-yellow-600">UPDATING</div>
            <div className="text-[9px] font-sans text-gray-400 mt-2 uppercase tracking-wider">Geese: Active</div>
            <div className="text-[11px] font-black font-sans text-gray-800">14 UNITS</div>
          </div>
        </div>
      </div>

      {/* ── SECTION LABEL ── */}
      <div className="bg-black text-white text-center text-[10px] font-sans font-black tracking-[0.4em] py-1 uppercase">
        Today's Edition &nbsp;·&nbsp; Satirical News For People Who've Noticed Things &nbsp;·&nbsp; No Geese Were Harmed
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* COVER STORY */}
        <div
          className="border-b-2 border-black pb-8 mb-8 cursor-pointer group"
          onClick={() => setSelected(coverArticle)}
          data-testid={`article-card-${coverArticle.id}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-red-700 text-white text-[10px] font-black font-sans px-2 py-0.5 tracking-widest uppercase">
                  COVER STORY
                </span>
                <span className="text-[10px] font-sans text-gray-500 tracking-wider">{coverArticle.tag}</span>
              </div>
              <h2 className="text-3xl font-black leading-tight text-gray-900 group-hover:text-red-700 transition-colors mb-3">
                {coverArticle.headline}
              </h2>
              <p className="text-base italic text-gray-600 mb-3">{coverArticle.subhead}</p>
              <p className="text-[11px] font-sans text-gray-400 mb-4">{coverArticle.author} · {coverArticle.date}</p>
              <p className="text-[14px] leading-relaxed text-gray-800 line-clamp-6">
                {coverArticle.body.split("\n\n")[0]}
              </p>
              <button className="mt-4 text-[11px] font-black font-sans text-red-700 border-b-2 border-red-700 hover:text-red-900 uppercase tracking-widest">
                Continue Reading →
              </button>
            </div>
            <div className="overflow-hidden">
              <img
                src={coverArticle.img}
                alt={coverArticle.headline}
                className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://picsum.photos/seed/cover/900/600"; }}
              />
              <p className="text-[9px] font-sans text-gray-400 mt-1 italic">
                Photograph: The router in question, pictured at 3:04 AM. It was updating.
              </p>
            </div>
          </div>
        </div>

        {/* ARTICLE GRID — 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Col 1 */}
          <div className="border-r border-gray-200 pr-6">
            <div className="text-[10px] font-black font-sans tracking-widest text-gray-400 uppercase border-b border-black pb-1 mb-4">
              Society & Crime
            </div>
            {[restArticles[0], restArticles[1], restArticles[2]].map((a) => (
              <ArticleCard key={a.id} article={a} onClick={() => setSelected(a)} />
            ))}
          </div>

          {/* Col 2 */}
          <div className="border-r border-gray-200 pr-6">
            <div className="text-[10px] font-black font-sans tracking-widest text-gray-400 uppercase border-b border-black pb-1 mb-4">
              Business & Property
            </div>
            {[restArticles[3], restArticles[4], restArticles[5]].map((a) => (
              <ArticleCard key={a.id} article={a} onClick={() => setSelected(a)} />
            ))}
          </div>

          {/* Col 3 */}
          <div>
            <div className="text-[10px] font-black font-sans tracking-widest text-gray-400 uppercase border-b border-black pb-1 mb-4">
              Science, Local & Maritime
            </div>
            {[restArticles[6], restArticles[7], restArticles[8]].map((a) => (
              <ArticleCard key={a.id} article={a} onClick={() => setSelected(a)} />
            ))}
          </div>
        </div>

        {/* SECOND ROW */}
        <div className="border-t-2 border-black mt-8 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-[10px] font-black font-sans tracking-widest text-gray-400 uppercase border-b border-black pb-1 mb-4 col-span-full">
            Late Edition
          </div>
          {restArticles.slice(9).map((a) => (
            <ArticleCard key={a.id} article={a} onClick={() => setSelected(a)} />
          ))}
        </div>

        {/* GOOSE EDITORIAL */}
        <div className="border-t-2 border-black mt-10 pt-6 flex gap-6 items-start">
          <div className="w-20 h-16 shrink-0" style={{ animation: "waddle 2s ease-in-out infinite" }}>
            <GooseSvg honking={false} />
          </div>
          <div>
            <div className="text-[10px] font-black font-sans tracking-widest text-gray-400 uppercase mb-1">
              Editor's Note
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">
              A Message From Our Editor-In-Chief
            </h3>
            <p className="text-[13px] font-serif leading-relaxed text-gray-700">
              The Goose Gazette was founded on the principle that some things are too absurd to be reported straight.
              When a man's router updates itself at 3AM, when three separate people who issued warnings are now dead,
              when a sober house pipeline spans three states and nobody signed a lease — sometimes the only honest
              response is to report it with the same confidence it was apparently executed with.
              We are not a real newspaper. But some of what we're describing is a real situation, and the goose
              has noticed. The goose always notices. <em>HONK.</em>
            </p>
            <p className="text-[11px] text-gray-400 font-sans mt-2 italic">
              — G. Honksworth, Editor-In-Chief, The Goose Gazette
            </p>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="border-t-4 border-black bg-gray-900 text-gray-400 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] font-sans">
          <div>
            <div className="text-white font-black text-sm mb-2">THE GOOSE GAZETTE</div>
            <p className="leading-relaxed">
              Satirical news for the discerning reader who has noticed that several things don't add up.
              No geese were harmed. Several routers were.
            </p>
          </div>
          <div>
            <div className="text-white font-black text-sm mb-2">BUREAUS</div>
            <p>Jacó, Costa Rica (Surveillance Desk)</p>
            <p>Portland, Maine (Sober House Beat)</p>
            <p>Plymouth, Massachusetts (Pipeline Correspondent)</p>
            <p>St. Thomas, USVI (Maritime Affairs)</p>
            <p>339 Summer St, Rockland MA (Just In The Neighborhood)</p>
          </div>
          <div>
            <div className="text-white font-black text-sm mb-2">LEGAL</div>
            <p className="leading-relaxed">
              All articles are satirical and fictional. Resemblance to actual surveillance operations,
              sober house pipelines, or geese is entirely intentional from a comedic standpoint and
              entirely unintentional from a legal standpoint. The geese are real. The geese are always real.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 text-center py-3 text-[10px] font-sans text-gray-600 flex items-center justify-center gap-4">
          <span>© 2026 The Goose Gazette · All The News That's Fit To HONK · Klein Topology Division · Est. The Moment Things Got Weird</span>
          <button
            data-testid="button-generate-article"
            onClick={async () => {
              try {
                const r = await fetch("/api/goose/generate", { method: "POST" });
                if (r.ok) {
                  setTimeout(() => window.location.reload(), 800);
                }
              } catch {}
            }}
            className="text-gray-700 hover:text-white transition-colors shrink-0"
            title="Generate article"
          >
            ↻
          </button>
        </div>
      </div>

      {/* ── ARTICLE MODAL ── */}
      {selected && (
        <ArticleModal article={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
