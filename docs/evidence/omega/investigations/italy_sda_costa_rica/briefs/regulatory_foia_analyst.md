# Agent Brief — Regulatory and FOIA Analyst

- Agent ID: `regulatory_foia_analyst`
- Case: `italy_sda_costa_rica`
- Generated: 2026-03-08T05:03:15+00:00

## Objective
Identify the best public-record requests, existing reading-room materials, and likely exemptions.

## Date range
2018-01-01 to present

## Jurisdictions
- Costa Rica
- Italy
- United States

## Entities
- UAMA
- MAECI
- MICITT
- SUTEL
- PRODHAB
- FCC
- NTIA

## Required sources
- FOIA logs
- reading rooms
- agency portals
- ATI laws
- parliamentary questions

## Search strings
- UAMA relazione annuale Costa Rica Leonardo
- MICITT acceso informacion Telespazio
- SUTEL LeoLabs Costa Rica permiso
- DARPA FOIA reading room Blackjack

## Output schema
- jurisdiction
- agency
- record_type
- legal_basis
- likely_exemption
- request_text_seed
- source_url

## Confidence rules
- High = primary record directly supports the claim.
- Medium = reputable secondary source plus partial primary support.
- Low = credible lead only, not yet verified.

## Stop conditions
- Top requests per jurisdiction identified
- Reading-room sweep completed

## Notes
- Do not present speculation as fact.
- If no record is found, say `no public evidence located`.
- Archive URLs, PDFs, and screenshots as you go.
