# Case Workspace — italy_sda_costa_rica

- Created: 2026-03-08T05:03:15+00:00
- Base prompt: C:\Users\echo\Downloads\LLM\ToroidalRecursion\ITALIAN_SDA_BROWSER_DEEP_RESEARCH_PROMPT.md
- Stack doc: C:\Users\echo\Downloads\LLM\ToroidalRecursion\TOROIDAL_OSINT_AGENT_STACK.md
- Optional `smolagents` detected: no

## Agent order
1. `Procurement Cartographer` — Map Costa Rican contracts, amendments, and procurement records tied to Telespazio, e-GEOS, Leonardo, or related geospatial and radar work.
2. `Corporate Lineage Analyst` — Untangle ownership, joint ventures, and any documented Italy / FinFisher relationships.
3. `Orbital and Program Timeline Analyst` — Build a sourced timeline for COSMO-SkyMed / CSG, SDA / PWSA, DARPA Blackjack, LeoLabs Costa Rica, and public Starlink milestones.
4. `Regulatory and FOIA Analyst` — Identify the best public-record requests, existing reading-room materials, and likely exemptions.
5. `Infrastructure and Data-Path Analyst` — Trace public evidence for hosting, cable paths, cloud processing, and regulatory footprints.
6. `Archive and Evidence Custodian` — Preserve URLs, PDFs, screenshots, translations, and hashes for every material source.

## Output rule
- every claim needs a source
- mark confidence explicitly
- separate verified fact from inference
- archive every cited source if possible

## Run
- `py run_osint_agents.py all --case italy_sda_costa_rica`
