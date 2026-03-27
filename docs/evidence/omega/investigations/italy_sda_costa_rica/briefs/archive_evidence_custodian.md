# Agent Brief — Archive and Evidence Custodian

- Agent ID: `archive_evidence_custodian`
- Case: `italy_sda_costa_rica`
- Generated: 2026-03-08T05:03:15+00:00

## Objective
Preserve URLs, PDFs, screenshots, translations, and hashes for every material source.

## Date range
continuous

## Jurisdictions
- all

## Entities
- all cited entities

## Required sources
- saved PDFs
- screenshots
- Wayback links
- hash manifests

## Search strings
- none

## Output schema
- title
- url
- saved_path
- sha256
- captured_at
- language
- notes

## Confidence rules
- High = primary record directly supports the claim.
- Medium = reputable secondary source plus partial primary support.
- Low = credible lead only, not yet verified.

## Stop conditions
- Every cited source archived or noted unavailable

## Notes
- Do not present speculation as fact.
- If no record is found, say `no public evidence located`.
- Archive URLs, PDFs, and screenshots as you go.
