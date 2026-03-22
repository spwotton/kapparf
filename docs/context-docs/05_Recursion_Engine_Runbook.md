# Recursion Engine Runbook (Minimal)

This runbook is intentionally minimal and format-agnostic.

## Goal

Turn a heterogeneous `ContextBuffer/` corpus into a consistent, queryable, linkable knowledge base:

- Extracted text + metadata
- Multi-level summaries
- Embeddings
- Similarity graph / connection map
- Structured outputs (CSV/JSON/MD)

## Suggested per-document output folder

For each input artifact `X`, write:

- `ProcessedDocuments/X/metadata.json`
- `ProcessedDocuments/X/text.txt` (or `text.md`)
- `ProcessedDocuments/X/chunks.jsonl`
- `ProcessedDocuments/X/summaries.md` (brief/detailed/technical)
- `ProcessedDocuments/X/embeddings.parquet` (or `embeddings.npy` + index)
- `ProcessedDocuments/X/links.json` (neighbors, citations, references)

## Step-by-step flow

1) **Ingest**
   - Enumerate files in `ContextBuffer/`.
   - Classify by type: PDF / HTML / TXT / MD / JSON / CSV / ZIP / notebook.

2) **Extract**
   - PDF: extract text + detect sections.
   - HTML: strip boilerplate, keep headings.
   - JSON/CSV: treat as data (schema + sample stats), not narrative.
   - ZIP/repos: index code files separately.

3) **Normalize**
   - Clean whitespace, fix encoding.
   - Store deterministic IDs for each doc.

4) **Summarize (multi-level)**
   - Brief: 5–10 bullets
   - Detailed: 1–3 pages equivalent
   - Technical: assumptions, math, algorithms, metrics

5) **Embed + Graph**
   - Chunk the text.
   - Embed chunks.
   - Build similarity edges (kNN or threshold).

6) **Analyze invariants**
   - If using $\kappa = 4/\pi$ as a motif, define:
     - what gets measured
     - how it’s computed
     - how it’s validated

7) **Export**
   - Emit CSV/JSON reports.
   - Emit a top-level index / registry.

## Reliability requirements

- Deterministic outputs: same input -> same IDs and file layout.
- Provenance: source filename + hash + timestamps.
- Safety: avoid embedding secrets or private identifiers from chat logs.
