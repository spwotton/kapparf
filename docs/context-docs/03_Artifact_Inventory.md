# Artifact Inventory (High-Level)

This is a *high-level* inventory intended to support navigation and pipeline design. It is not a full file listing.

## A) Structured datasets

### 1) `ContextBuffer/himtoo.json`

- Appears to be a very large packet-capture style JSON export (Wireshark/tshark-like “layers” data).
- Contains per-packet objects with `layers.frame`, `layers.ipv6`, `layers.tcp`, and multiple `*_raw` fields.
- Likely suitable for:
  - Feature extraction (timing, flow, ports, flags)
  - Protocol fingerprints
  - Time-series analysis

### 2) `ContextBuffer/results_completed_updated_20231003.csv`

- Large, wide CSV with paper metadata and many indicator columns.
- Columns include bibliographic fields and a very large set of country-code columns.
- Pipeline note: treat this as a dataset to *join* with extracted paper metadata (DOI/title matching), not as text to summarize.

### 3) `ContextBuffer/researchgate.csv`

- A scraped ResearchGate-derived table.
- Intended use: a *lead list* / “things to resolve” rather than an automated download target.

## B) Chat / conversation exports

### `ContextBuffer/OpenRouter Chat Sun Dec 21 2025.json`

- Appears to be an OpenRouter export (`version: orpg.3.0`) with model/session metadata.
- Useful as:
  - Provenance record
  - Prompt/source-of-ideas archive
  - Index for what was discussed and when

## C) Bundled codebases

`ContextBuffer/` includes ZIPs and an `extracted/` folder with bundled repos (e.g., `chat-ui-main`, `diffusers-main`, `smolagents-main`, `tesla`).

Pipeline note: treat these as *software sources* (to be indexed at the file level) rather than “documents” to summarize.

## D) PDFs / HTMs

There are many PDFs and HTML files. These should generally be routed through:

1) text extraction
2) chunking
3) summary + embedding
4) cross-linking via similarity + citations

## E) Notebooks

- `ContextBuffer/notebookb6972d7263.ipynb` exists (contents not reviewed here).
- Notebook processing should extract both markdown and code cells; code cells should be analyzed as code artifacts.
