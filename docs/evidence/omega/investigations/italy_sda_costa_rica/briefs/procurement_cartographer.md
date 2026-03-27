# Agent Brief — Procurement Cartographer

- Agent ID: `procurement_cartographer`
- Case: `italy_sda_costa_rica`
- Generated: 2026-03-08T05:03:15+00:00

## Objective
Map Costa Rican contracts, amendments, and procurement records tied to Telespazio, e-GEOS, Leonardo, or related geospatial and radar work.

## Date range
2020-01-01 to present

## Jurisdictions
- Costa Rica
- Italy

## Entities
- Telespazio Argentina
- e-GEOS
- Leonardo S.p.A.
- Registro Nacional
- SICOP
- MICITT

## Required sources
- SICOP
- La Gaceta
- Registro Nacional
- award notices
- amendment notices

## Search strings
- site:sicop.go.cr Telespazio Argentina Costa Rica
- site:registroinmobiliario.go.cr Telespazio catastro
- Telespazio Argentina contrato catastral Costa Rica
- e-GEOS Costa Rica contrato

## Output schema
- contract_id
- authority
- date
- value
- scope
- status
- source_url
- confidence
- notes

## Confidence rules
- High = primary record directly supports the claim.
- Medium = reputable secondary source plus partial primary support.
- Low = credible lead only, not yet verified.

## Stop conditions
- Award notice located
- Amendments mapped
- No new primary records after 3 portal passes

## Notes
- Do not present speculation as fact.
- If no record is found, say `no public evidence located`.
- Archive URLs, PDFs, and screenshots as you go.
