# Master Plan — italy_sda_costa_rica

Generated: 2026-03-08T05:03:15+00:00

## Execution order
### 1. Procurement Cartographer
- Objective: Map Costa Rican contracts, amendments, and procurement records tied to Telespazio, e-GEOS, Leonardo, or related geospatial and radar work.
- Date range: 2020-01-01 to present
- Deliverable fields: contract_id, authority, date, value, scope, status, source_url, confidence, notes

### 2. Corporate Lineage Analyst
- Objective: Untangle ownership, joint ventures, and any documented Italy / FinFisher relationships.
- Date range: 2018-01-01 to present
- Deliverable fields: entity, parent, subsidiary_or_partner, relationship_type, source_url, confidence, notes

### 3. Orbital and Program Timeline Analyst
- Objective: Build a sourced timeline for COSMO-SkyMed / CSG, SDA / PWSA, DARPA Blackjack, LeoLabs Costa Rica, and public Starlink milestones.
- Date range: 2025-01-01 to present
- Deliverable fields: date, event, entity, source_url, confidence, notes

### 4. Regulatory and FOIA Analyst
- Objective: Identify the best public-record requests, existing reading-room materials, and likely exemptions.
- Date range: 2018-01-01 to present
- Deliverable fields: jurisdiction, agency, record_type, legal_basis, likely_exemption, request_text_seed, source_url

### 5. Infrastructure and Data-Path Analyst
- Objective: Trace public evidence for hosting, cable paths, cloud processing, and regulatory footprints.
- Date range: 2020-01-01 to present
- Deliverable fields: component, role, jurisdiction, source_url, confidence, notes

### 6. Archive and Evidence Custodian
- Objective: Preserve URLs, PDFs, screenshots, translations, and hashes for every material source.
- Date range: continuous
- Deliverable fields: title, url, saved_path, sha256, captured_at, language, notes

## Export targets
- `exports/executive_summary.md`
- `exports/chronology.csv`
- `exports/evidence_table.csv`
- `exports/entity_map.json`
- `exports/next_requests.md`
