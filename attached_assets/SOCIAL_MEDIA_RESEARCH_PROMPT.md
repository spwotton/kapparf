# Research Prompt — KAPPA Social Media Automation

Copy and send this to an AI agent for deep research:

---

## CONTEXT

I'm building Project KAPPA — a 24/7 autonomous SIGINT (signal intelligence) correlation platform that monitors 11 electromagnetic domains (WiFi, BLE, LTE, Satellite, SDR, ELF, etc.) from a fixed observer point in Costa Rica. The platform already has:

- A live adaptive pipeline that collects data from CelesTrak (satellites), OpenSky (flights), NWS (weather), KiwiSDR nodes, and network watchdog
- A correlation engine that generates a "KAPPA Score" (0-100 threat level)
- A "Social Media Studio" page that renders dark-themed infographic cards from live data (KAPPA Score, Satellite Intel, Correlation Alert, Domain Breakdown, Evening Window) in Instagram dimensions (1080x1080, 1080x1350, 1080x1920) and exports them as PNG
- Node.js/Express backend, React frontend, PostgreSQL database
- OpenAI gpt-4o-mini already integrated for intelligence analysis

## WHAT I NEED RESEARCHED

### 1. AI-Generated Visual Backgrounds
- What are the best text-to-image models available RIGHT NOW on HuggingFace Inference API for generating dark, abstract, data-visualization-style backgrounds?
- Specifically looking for models that can generate: orbital/satellite patterns, electromagnetic wave visualizations, radar sweep aesthetics, grid/matrix patterns — all dark-themed, minimal, professional (NOT sci-fi or cyberpunk)
- What are the actual costs per image on HuggingFace free tier vs paid?
- Can I use `@huggingface/inference` npm package to call these from a Node.js Express backend?
- What's the latency like for generating a 1080x1080 image?

### 2. Instagram Graph API — Realistic Assessment
- What exactly does it take to get approved for `instagram_content_publish` permission in 2026?
- Is it realistic for a single developer with a new Business account?
- What are the actual gotchas, rejection reasons, and timeline?
- Are there any alternatives that don't require Meta app review (third-party APIs like Later, Buffer API, etc.)?
- Can I publish directly from a server without user interaction once authorized?

### 3. Server-Side Infographic Generation
- Compare `sharp` (SVG overlay) vs `node-canvas` vs `@napi-rs/canvas` for server-side infographic rendering in Node.js in 2026
- Which handles custom fonts (monospace like JetBrains Mono) best?
- Can sharp render the same quality as html-to-image browser capture?
- What about complex layouts — is SVG-in-sharp enough for multi-section infographic cards?

### 4. Multi-Platform Posting
- Compare these unified social media posting APIs: Late, Ayrshare, SocialBee API, Publer API
- Which ones allow posting to Instagram + Twitter/X + Threads + LinkedIn from a single API call?
- Pricing comparison for low volume (10-30 posts/month)
- Which ones DON'T require Meta app review for Instagram posting?

### 5. Content Intelligence
- What's the best approach for AI-generated captions and hashtags for technical/SIGINT content?
- Are there any open-source hashtag recommendation engines or trending topic APIs?
- How to structure prompts for OpenAI to generate engaging social media captions from raw signal intelligence data without sounding overly technical?

### 6. Automation Triggers
- What patterns exist for event-driven social media posting? (e.g., auto-post when a metric crosses a threshold)
- How do platforms like n8n, Pipedream, or Temporal handle social media automation workflows?
- Is there a lightweight way to schedule posts from a Node.js Express app without adding a full workflow engine?

### 7. Content Calendar & Analytics
- Are there any open-source content calendar tools or libraries?
- How to track engagement metrics back from Instagram Graph API to measure which card types perform best?
- Best practices for A/B testing social media content programmatically

### 8. Video/Reel Generation
- Can ffmpeg programmatically turn a sequence of infographic PNGs into a Reel/Story video with transitions?
- What ffmpeg command creates a smooth slideshow from static images optimized for Instagram Reels (9:16, 1080x1920, 15-30 seconds)?
- Are there any Node.js libraries that wrap ffmpeg for social media video generation specifically?

### 9. Legal/Compliance
- What are Instagram's automation policies in 2026? What gets accounts flagged?
- Rate limits and best practices for not getting shadowbanned
- Content disclosure requirements for AI-generated images

### 10. HuggingFace Spaces Worth Investigating
- Are there any HuggingFace Spaces that do: social media image templates, data visualization generation, or infographic creation?
- Any Gradio apps that could be used as API endpoints for image processing?
- What about image-to-image models for style transfer (e.g., take my dark-themed card and make it look more polished)?

## OUTPUT FORMAT

For each section, give me:
1. **Best option right now** — what to use today
2. **Code snippet** — minimal working example in Node.js/TypeScript
3. **Cost** — free tier limits and paid pricing
4. **Effort estimate** — hours to integrate into an existing Express app
5. **Gotchas** — things that will waste my time if I don't know upfront
