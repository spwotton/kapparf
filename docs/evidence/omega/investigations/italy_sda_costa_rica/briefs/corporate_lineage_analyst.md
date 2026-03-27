# Agent Brief — Corporate Lineage Analyst

- Agent ID: `corporate_lineage_analyst`
- Case: `italy_sda_costa_rica`
- Generated: 2026-03-08T05:03:15+00:00

## Objective
Untangle ownership, joint ventures, and any documented Italy / FinFisher relationships.

## Date range
2018-01-01 to present

## Jurisdictions
- Italy
- Germany
- United Kingdom

## Entities
- Leonardo S.p.A.
- Telespazio
- e-GEOS
- Thales Alenia Space
- Gamma International
- FinFisher GmbH
- Cy4Gate
- Memento Labs

## Required sources
- annual reports
- corporate registry filings
- ECCHR material
- court records
- press releases

## Search strings
- FinFisher GmbH Italien Verbindung
- Gamma International Italy public records
- Leonardo annual report Telespazio e-GEOS
- Cy4Gate Memento Labs FinFisher

## Output schema
- entity
- parent
- subsidiary_or_partner
- relationship_type
- source_url
- confidence
- notes

## Confidence rules
- High = primary record directly supports the claim.
- Medium = reputable secondary source plus partial primary support.
- Low = credible lead only, not yet verified.

## Stop conditions
- Ownership tree completed
- FinFisher/Italy assessment written

## Notes
- Do not present speculation as fact.
- If no record is found, say `no public evidence located`.
- Archive URLs, PDFs, and screenshots as you go.
