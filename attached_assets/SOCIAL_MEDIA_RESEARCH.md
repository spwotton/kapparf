# Social Media Automation Research — Project KAPPA

## What's Trending & Immediately Usable

### Tier 1: Ready to Integrate Now

**1. `@huggingface/inference` (Node.js SDK)**
- Text-to-image generation directly from your Express backend
- Free tier available, no credit card needed
- Models: FLUX.1-dev (photorealistic), SDXL-Lightning (fast), Stable Diffusion 2
- Can generate AI backgrounds for your infographic cards instead of solid colors
- `npm install @huggingface/inference`

**2. `sharp` (Server-side image compositing)**
- Already common in Node.js — fast, stable, uses libvips
- Generate full infographic PNGs server-side (no browser needed)
- SVG text overlay for clean typography on generated backgrounds
- Enables: API endpoint that returns a ready-to-post PNG
- `npm install sharp`

**3. Instagram Graph API (Official Publishing)**
- Only official way to auto-post to Instagram
- Requires: Business/Creator account linked to a Facebook Page
- Can publish photos, carousels, Reels, and Stories programmatically
- Workflow: Create media container -> Upload -> Poll status -> Publish
- 200 requests/hour rate limit
- Needs Meta developer app approval

**4. OpenAI (Already Integrated via Replit AI)**
- Generate captions, hashtags, and post copy from correlation/event data
- Summarize KAPPA findings into social-media-friendly language
- You already have gpt-4o-mini wired up

### Tier 2: High Value, Moderate Effort

**5. AI Background Generation Pipeline**
- Use HuggingFace to generate thematic backgrounds per card type:
  - "Dark abstract satellite orbital pattern" for Satellite Intel cards
  - "Dark electromagnetic wave visualization" for Domain Breakdown
  - "Dark surveillance grid amber warning" for Evening Window
- Composite KAPPA data text on top with sharp

**6. Multi-Platform Unified APIs**
- **Late API** — single endpoint posts to IG + Facebook + TikTok + LinkedIn + Twitter + YouTube + Threads
- **Bannerbear** — template-based social graphics with API ($49-199/mo)
- **Placid.app** — video + image generation, no-code tools

**7. Server-Side Card Rendering (sharp + SVG)**
- Move card rendering from browser (html-to-image) to server
- Benefits: faster, no browser dependency, can run on schedule
- Endpoint: `GET /api/social/render?template=kappa&format=square` returns PNG
- Enables fully autonomous posting pipeline

### Tier 3: Future / Advanced

**8. Video Content Generation**
- Animate the infographic cards into Reels/Stories
- ffmpeg (already planned for video upload module) can create slideshow videos
- HuggingFace has video generation models emerging

**9. Content Calendar Automation**
- Schedule posts based on pipeline activity
- Auto-generate when KAPPA score crosses thresholds
- Evening window triggers = automatic "alert" post generation
- n8n or cron-based workflows

**10. Hashtag & Caption Intelligence**
- AI-optimized hashtags based on content type
- Trending hashtag analysis
- Multi-language captions (EN/ES already in your i18n)

---

## HuggingFace Spaces Assessment

Most Instagram-related Spaces on HuggingFace are low-quality clones or simple UI demos. The actually useful ones are:

- **Viral Instagram Story Analyzer** — analyzes stories for viral potential (concept worth stealing for your content optimization)
- **Instagram Content Bot** — generates post content (similar to what you'd build with OpenAI)
- **InstaGrowth Pro** — growth analytics dashboard concept

The real value from HuggingFace isn't the Spaces — it's the **Inference API** for generating visual assets programmatically.

---

## Recommended Implementation Path

### Phase 1: AI-Enhanced Cards (Quick Win)
1. Add OpenAI caption generation to Social Media Studio
2. Generate smart captions + hashtags from current KAPPA data
3. One-click "Generate Caption" button next to Export PNG

### Phase 2: Server-Side Rendering
1. Install `sharp`, render cards server-side as PNG
2. API endpoint: `/api/social/render/:template/:format`
3. Enables automation — no browser needed

### Phase 3: AI Backgrounds
1. Add `@huggingface/inference` for text-to-image
2. Generate thematic backgrounds per card template
3. Composite data overlay with sharp

### Phase 4: Auto-Publishing
1. Instagram Graph API integration (needs Business account + Meta app)
2. Schedule posts based on pipeline events
3. Auto-post when KAPPA score crosses thresholds or evening window activates

### Phase 5: Multi-Platform
1. Add Twitter/X, Threads, LinkedIn posting
2. Unified API (Late or custom) for cross-posting
3. Content calendar with analytics feedback loop
