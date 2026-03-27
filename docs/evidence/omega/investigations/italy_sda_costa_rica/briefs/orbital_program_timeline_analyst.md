# Agent Brief — Orbital and Program Timeline Analyst

- Agent ID: `orbital_program_timeline_analyst`
- Case: `italy_sda_costa_rica`
- Generated: 2026-03-08T05:03:15+00:00

## Objective
Build a sourced timeline for COSMO-SkyMed / CSG, SDA / PWSA, DARPA Blackjack, LeoLabs Costa Rica, and public Starlink milestones.

## Date range
2025-01-01 to present

## Jurisdictions
- Italy
- Costa Rica
- United States

## Entities
- ASI
- Telespazio
- SDA
- DARPA
- LeoLabs
- SpaceX

## Required sources
- official press releases
- operator technical docs
- Air & Space Forces Magazine
- SpaceNews
- SUTEL records

## Search strings
- site:asi.it COSMO-SkyMed January 2025 Costa Rica
- site:sda.mil tranche January 2025
- site:darpa.mil Blackjack January 2025
- site:sutel.go.cr LeoLabs Costa Rica

## Output schema
- date
- event
- entity
- source_url
- confidence
- notes

## Confidence rules
- High = primary record directly supports the claim.
- Medium = reputable secondary source plus partial primary support.
- Low = credible lead only, not yet verified.

## Stop conditions
- ±14 day Jan 14 timeline complete
- 2025-present chronology complete

## Notes
- Do not present speculation as fact.
- If no record is found, say `no public evidence located`.
- Archive URLs, PDFs, and screenshots as you go.
