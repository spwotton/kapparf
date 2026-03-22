# Paper Acquisition Policy (Practical + Safe)

This project includes scraped/aggregated leads (e.g., `ContextBuffer/researchgate.csv`). This doc defines a workflow that avoids automated scraping or bulk downloading from sources that may restrict it.

## Principle

- Treat scraped lists as *pointers*.
- Prefer open-access sources (arXiv, publisher OA, institutional repositories, author pages).
- Record DOI/arXiv IDs and provenance.

## Recommended workflow for each row in `researchgate.csv`

1) Extract basic metadata:
   - title
   - author(s)
   - year (if present)
   - the RG URL (as a pointer only)

2) Resolve to a canonical identifier:
   - DOI if available
   - arXiv ID if available
   - publisher landing page

3) Download only from legitimate open endpoints:
   - arXiv PDF
   - publisher open PDF
   - institutional repository PDF

4) Save provenance:
   - where it was downloaded from
   - when
   - hash of the downloaded file

## Output format suggestion

Create a per-paper metadata row (CSV/JSON) with:

- `title`
- `authors`
- `year`
- `doi`
- `arxiv_id`
- `source_url`
- `license_or_terms` (if known)
- `downloaded` boolean

## Why this matters

- It keeps the corpus shareable and reproducible.
- It reduces the risk of embedding restricted content.
- It makes downstream summaries easier to attribute.
