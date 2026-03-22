# Glossary

## ContextBuffer
A drop-zone folder for heterogeneous source artifacts (PDF/TXT/HTML/JSON/CSV/ZIP) intended for automated processing.

## Recursion Engine
The pipeline that ingests `ContextBuffer/` and emits extracted text, summaries, embeddings, and structured reports.

## Lattice
In this repo’s usage, a structured representation (often JSON) that maps a source into symbolic/semantic coordinates.

## Transducer
A script or component that converts a source representation into another domain (e.g., text -> lattice, lattice -> audio).

## Toroidal timeline
A time representation that wraps/loops (conceptually mapping linear time onto a torus).

## Similarity graph
A graph where nodes are documents (or chunks) and edges represent semantic similarity.

## κ (kappa)
Here used as a motif: $\kappa = 4/\pi$. For it to be an analysis feature, it needs a clear definition of what it measures.

## Provenance
Metadata about where an artifact came from, when it was acquired, and how it was processed (including hashes).

## Open-access resolution
The practice of mapping a paper lead (title/authors) to an OA endpoint (arXiv/publisher OA/institutional repo).
