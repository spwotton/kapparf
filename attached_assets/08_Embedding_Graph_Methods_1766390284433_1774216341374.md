# Embedding + Similarity Graph Notes

This doc is implementation-agnostic; it focuses on decisions you’ll need to make to get a stable similarity graph.

## 1) Chunking

Choose a chunking strategy per type:

- PDFs: section-aware chunking (headings, paragraphs)
- HTML: heading-aware + boilerplate removal
- Codebases: per-file and per-symbol chunks
- CSV/JSON: schema summaries + derived stats (not raw rows)

Store chunks with stable IDs:

- `doc_id`
- `chunk_id`
- `offset` / `span`
- `text`

## 2) Embedding

Key choices:

- Embedding model family
- Dimensionality
- Whether you embed:
  - chunks only
  - chunks + summaries
  - both narrative and code

## 3) Similarity edges

For each chunk, compute neighbors:

- kNN: choose k (e.g., 10–50)
- threshold: choose cosine threshold (e.g., 0.75–0.90) depending on model

Graph outputs:

- `nodes`: chunks (or docs)
- `edges`: (source, target, similarity)

## 4) Document-level rollup

To build doc-level similarity from chunk-level similarity:

- max similarity across chunk pairs
- top-k chunk matches aggregated
- average of best N similarities

## 5) Connection mapping

Enrich edges with:

- shared entities (authors, DOIs)
- shared keywords
- shared citations (from `results_completed_updated_20231003.csv` if it’s a citations table)

## 6) κ motif integration

If you want to track $\kappa = 4/\pi$ as an invariant across documents, define:

- the *measurable*: what gets counted or measured
- the *transform*: what mapping you apply
- the *validation*: how you test whether κ is meaningful vs coincidence

Without those, κ remains a narrative motif rather than an analytic feature.
