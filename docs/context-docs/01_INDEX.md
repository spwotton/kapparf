# ContextDocs Index

This folder is the "structured map" of the workspace’s current corpus and pipelines. It is designed to be readable, actionable, and safe to share internally (i.e., it avoids reproducing long copyrighted passages).

## Documents

1. `02_ContextBuffer_Dropzone.md`
   - What the ContextBuffer is for, and the intended Recursion Engine outputs.

2. `03_Artifact_Inventory.md`
   - High-level inventory of corpus types and notable artifacts.

3. `04_Data_Schemas.md`
   - Practical notes on large structured files (CSV/JSON) and what fields look like.

4. `05_Recursion_Engine_Runbook.md`
   - A minimal runbook-style flow for processing and generating outputs.

5. `06_Packet_Harmonics_Thread.md`
   - Packet/PCAP “harmonics” extraction thread and how it ties into the repo.

6. `07_Paper_Acquisition_Policy.md`
   - A policy + workflow for linking papers without automated scraping/downloading.

7. `08_Embedding_Graph_Methods.md`
   - Notes for embeddings, similarity graphs, and connection mapping.

8. `09_Glossary.md`
   - Terms used across the repo (lattice, toroidal timeline, κ, etc.).

9. `10_Next_Steps_Backlog.md`
   - Concrete next steps to operationalize the pipeline.

## Conventions used here

- We refer to artifacts by *filename*, not by reproducing their contents.
- We prefer “metadata + pointers + intended processing” over long excerpts.
- Large files are sampled (e.g., header-only) rather than fully loaded.
