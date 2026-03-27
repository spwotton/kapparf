# Agent Brief — Infrastructure and Data-Path Analyst

- Agent ID: `infrastructure_data_path_analyst`
- Case: `italy_sda_costa_rica`
- Generated: 2026-03-08T05:03:15+00:00

## Objective
Trace public evidence for hosting, cable paths, cloud processing, and regulatory footprints.

## Date range
2020-01-01 to present

## Jurisdictions
- Costa Rica
- Italy
- United States
- Argentina

## Entities
- Telecom Italia Sparkle
- CLEOS
- e-GEOS
- LeoLabs
- SUTEL
- MICITT

## Required sources
- network disclosures
- product sheets
- submarine cable docs
- regulatory filings

## Search strings
- Telecom Italia Sparkle Costa Rica Miami
- e-GEOS CLEOS Costa Rica
- LeoLabs Costa Rica regulatory filing
- site:micitt.go.cr site:sutel.go.cr radar Costa Rica

## Output schema
- component
- role
- jurisdiction
- source_url
- confidence
- notes

## Confidence rules
- High = primary record directly supports the claim.
- Medium = reputable secondary source plus partial primary support.
- Low = credible lead only, not yet verified.

## Stop conditions
- Infrastructure map drafted
- Rumor/evidence table completed

## Notes
- Do not present speculation as fact.
- If no record is found, say `no public evidence located`.
- Archive URLs, PDFs, and screenshots as you go.
