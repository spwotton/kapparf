# ContextBuffer Drop Zone

## Purpose

`ContextBuffer/` is a mixed-format intake folder for PDFs, HTML, TXT, MD, JSON, and other artifacts. Its role (per `ContextBuffer/README.txt`) is to act as a staging area for a “Recursion Engine” that:

- Extracts text
- Produces multi-level summaries (brief / detailed / technical)
- Performs “geometric analysis” centered on $\kappa = 4/\pi$ invariants
- Computes semantic embeddings + a similarity graph
- Maps connections to an existing corpus
- Emits structured outputs (CSV/JSON/MD)

Outputs are intended to land under `../ProcessedDocuments/<document_name>/`.

## Current observed corpus shape

`ContextBuffer/` contains a broad set of materials, including:

- Many PDFs (technical papers, manuals, reports)
- HTML/HTM documents
- Large structured artifacts (notably a very large packet JSON export and a large CSV)
- Multiple ZIP files (including extracted codebases)
- A Jupyter notebook (`notebookb6972d7263.ipynb`)
- Chat exports (OpenRouter)

## Operational implication

This corpus is heterogeneous enough that your pipeline should explicitly:

- Detect type by extension and/or magic bytes (not only extension)
- Normalize text extraction per file type (PDF vs HTML vs plain text)
- Track provenance and licensing constraints in the output metadata
- Store intermediate results (raw text, chunking, embeddings) in per-document folders

## Guardrails

When generating derivative “context docs” or summaries:

- Prefer metadata, short paraphrases, and citations (title/author/year/DOI/URL) over verbatim content.
- For chat logs and scraped lists, keep private identifiers out of shared outputs.
