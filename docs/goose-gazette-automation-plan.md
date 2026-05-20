# The Goose Gazette — Automated Content Engine
## Plan for Confirmation Before Build

---

### What This Is

An AI-powered satirical news generator that runs continuously inside KAPPA, pulling live data from the platform's real data sources — flight tracking, earthquake feeds, space weather, network correlation events, KiwiSDR detections — and transforming them into Onion-style articles via OpenAI. Articles are stored in the database and served to the Goose Gazette frontend in real time. The hardcoded articles become the "founding edition" fallback only.

---

### Data Sources (All Real, All Already In KAPPA)

| Source | What It Generates |
|---|---|
| KAPPA correlation engine events | "Pattern detected for Nth time" articles |
| OpenSky Network flights | "Area Aircraft" local observation pieces |
| USGS earthquake feed | "Nature Refuses To Cooperate" dispatches |
| NOAA/SWPC space weather (Kp, X-ray) | Cosmic affairs columns |
| KiwiSDR frequency detections | Science/technology parody briefs |
| NWS weather | Regional conditions humor |
| Network analysis persons/connections | "Local Man / Area Person" society pieces |
| Ω-GOS outputs | Philosophy/science editorial content |

---

### Article Templates (The Onion Patterns That Actually Work)

**1. The Local Incident** — Deadpan specificity, dateline required
> "JACÓ, COSTA RICA — A local man reported [exact thing] at [exact time] for the [ordinal] time in [specific timeframe]. [ISP/property manager/neighbor] could not be reached for comment."

**2. The Expert Validation** — Obvious conclusion, prestigious framing
> "Researchers at [invented institution] confirmed [thing everyone already knew], recommending [obviously insufficient solution]. The study took [comically long time]."

**3. The Corporate Non-Denial**
> "[Entity] assured the public Thursday that [suspicious thing] is 'completely standard practice' and 'not worth looking into further.' [Entity] did not respond to follow-up questions about [specific detail]."

**4. The Nth-Time Pattern** — Escalation is the joke
> "[Thing] has occurred for the [fifth/seventh/twelfth] time this [month/quarter/administration]. Experts describe this as 'a lot.'"

**5. The Obituary / Knew-Too-Much Format**
> "[Person Who Issued Warning] passed away [timeframe] after describing [suspicious thing] to [specific person]. They are survived by [funny detail]. Authorities say the death was [obviously inadequate explanation]."

**6. The Science Brief** — Real data, absurd framing
> "Instruments at [real location] detected [real frequency or real event] at [real time]. Researchers describe the finding as '[understated response].' A follow-up study is planned for [comically distant future]."

**7. The Real Estate Dispatch**
> "[Property] changed hands [Tuesday/last week] for [amount], the [ordinal] time in [timeframe]. The new owner, who could not be reached, was described by neighbors as 'polite' and 'seemed to know [specific person] already.'"

**8. The Maritime Affairs Column**
> "A charter vessel operating out of [port] completed its [ordinal] journey this [month] without incident, its captain confirming only that passengers were 'clients' who 'preferred not to be named.'"

---

### Virality Algorithm (Why Onion Articles Get Shared)

These are the structural elements that make satirical news spread:

1. **Absurd Specificity** — Exact times (3:04 AM), exact frequencies (461.56 Hz), exact addresses (339 Summer St), exact router MAC prefixes (9c:24:72). Specificity signals truth, which makes the absurdity funnier. KAPPA has all of this.

2. **The Nth-Time Escalation** — "For the third time" is funnier than "again." "For the seventh time" is funnier still. The database tracks event recurrence. Use it.

3. **The Understated Conclusion** — The article ends with something catastrophically understated. "Experts say this is 'a lot'" or "Authorities note the situation 'warrants monitoring.'"

4. **Expert Validation of the Absurd** — A credentialed fictional expert confirming something obvious or terrifying using professional language.

5. **The Non-Denial Denial Quote** — A direct quote from a fictional entity that neither confirms nor denies, while clearly confirming. "Liberty Communications did not respond to requests for comment, though sources indicate the router had, in fact, been updated."

6. **Hyperlocal Dateline** — "JACÓ, COSTA RICA —" or "PORTLAND, MAINE —" makes it feel like AP wire. Wire format = credibility = funnier.

7. **The Tonal Gap** — Formal AP-style prose describing something insane. The gap between the register and the content IS the joke.

---

### Technical Implementation

**Database table** (`goose_articles`):
```
id, headline, subhead, body, tag, category, author_byline,
published_at, generated_at, source_event_ids, approved, img_query
```

**Backend routes**:
- `GET /api/goose/articles` — returns approved articles, newest first, with manual fallbacks if count < 5
- `POST /api/goose/generate` — internal, pulls KAPPA data, calls OpenAI, stores draft (approved=false)
- `POST /api/goose/approve/:id` — marks article as approved (simple admin)
- `GET /api/goose/articles/latest` — RSS-style, returns last 10

**Auto-generation scheduler**:
- Runs every 6 hours inside the autonomous pipeline (alongside existing collectors)
- Picks a random template, pulls matching KAPPA data, generates via gpt-4o-mini
- Prompt structure: system role (Onion editor), data payload (KAPPA event JSON), template selection, tone instructions
- Auto-approves if confidence threshold met (no hallucinated proper nouns, length in range)

**OpenAI prompt skeleton**:
```
You are a senior editor at The Onion writing deadpan satirical news.
Using only the following real data from our monitoring system, write
a complete news article in template format [N]. Use AP wire style.
Never break the fourth wall. Include one quoted expert.

DATA: [KAPPA event JSON]
TEMPLATE: [selected template]
DATELINE: [location from event]
```

**Frontend changes**:
- `useQuery` hook fetching `/api/goose/articles`
- Falls back to hardcoded ARTICLES array if API returns < 3 results
- New articles appear at top of grid automatically
- No manual refresh required

---

### Publication Rhythm

| Time | Edition | Source Priority |
|---|---|---|
| 8:00 AM | Morning Brief | Overnight seismic / space weather events |
| 2:00 PM | Afternoon Edition | Flight + correlation engine events |
| 11:00 PM | Late Night Weird Stuff | KiwiSDR detections + Ω-GOS outputs |

---

### What Gets Generated vs. What Stays Manual

**Auto-generated**: Local Incident, Expert Validation, Science Brief, Pattern/Escalation, Corporate Non-Denial
**Manual only**: Obituaries (too sensitive for auto-gen), Maritime Affairs column (requires specific sourcing)

---

### What I Need From You To Build This

1. **Confirm the plan is correct** — any templates to add, remove, or change tone on?
2. **Approval workflow** — auto-approve all, or should a "publish" flag be manual?
3. **How often** — every 6 hours is the default; want more or less frequently?
4. **Article length** — short (~150 word Onion brief) or full feature (~400 words)?

Once confirmed, I'll build the DB schema, backend routes, scheduler, and wire up the frontend in one shot.
