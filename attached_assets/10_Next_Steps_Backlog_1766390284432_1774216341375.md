# Next Steps Backlog (Concrete)

1) **Create a top-level registry**
   - Build a `ProcessedDocuments/index.csv` that lists every ingested artifact with:
     - type, size, hash
     - extracted-text status
     - embedding status
     - last processed timestamp

2) **Implement type routing**
   - PDFs/HTML/TXT: text extraction + summary + embedding
   - CSV/JSON: schema + stats + lightweight summary (no row dumps)
   - ZIP repos: code indexing (file list + symbol extraction)

3) **Normalize the packet dataset**
   - Convert `ContextBuffer/himtoo.json` to a flat table (parquet/csv):
     - timestamp, src/dst, ports, proto, length, flags

4) **Align the bibliometrics table**
   - Use `results_completed_updated_20231003.csv` as a reference table:
     - map to corpus docs by DOI/title fuzzy match
     - enrich doc metadata

5) **Turn `researchgate.csv` into a resolution queue**
   - Create `paper_queue.csv` with:
     - title, authors, year
     - resolved DOI/arXiv
     - OA download URL (if any)

6) **Graph build + inspection**
   - Build doc-level similarity graph.
   - Export `graph.json` and a simple adjacency report.

7) **Define κ precisely (if it’s meant to be analytical)**
   - Decide what κ is computed from, and how to falsify it.

8) **Security pass on chat exports**
   - Strip keys, tokens, and personal identifiers from anything that will be embedded.
