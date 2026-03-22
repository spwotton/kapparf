# Data Schemas & Sampling Notes

This doc captures *observed* schema shapes from large structured artifacts, based on header/early-line sampling.

## 1) `ContextBuffer/results_completed_updated_20231003.csv`

### Practical constraints

- The file is large (>50MB) and cannot be opened with the VS Code file-sync reading tool in this environment.
- Use sampling (e.g., first ~20 lines) to infer schema.

### Observed columns (prefix)

Header begins with:

- `V1`
- `paper_id`
- `title`
- `abstract`
- `year`
- `doi`
- `venue`
- `journal`
- `mag_field_of_study`
- plus many additional numeric/flag fields

Then includes:

- `data_use`
- `group_name`
- `outbound_citations`
- `inbound_citations`
- `places`
- `countries`

And then a very large set of ISO-like country code indicator columns:

- `ABW, AFG, AGO, ... , USA, ... , ZWE`

And finally:

- `nf` (observed as a trailing column in sampled rows)

### Working interpretation

- Treat this as a bibliometrics / enrichment table.
- It can drive:
  - geo aggregation (country flags)
  - topic grouping (field of study)
  - filtering and reporting
- It should not be used as a “text source” beyond short metadata fields.

## 2) `ContextBuffer/himtoo.json`

### High-level structure

The file is a JSON array of packet-like objects.

Observed outer object fields:

- `_index`: e.g., `packets-2025-12-21`
- `_score`: null
- `_source.layers`: a nested object containing protocol layers and raw slices

### Notable layer keys (sample)

Within `_source.layers`:

- `frame_raw`: array-like with hex/raw values and offsets
- `frame`: dict-like with keys such as:
  - `frame.time`
  - `frame.time_epoch` (note: sampled value is an ISO timestamp string)
  - `frame.number`, `frame.len`, `frame.protocols`
- `null` / `null_raw`
- `ipv6` / `ipv6_raw`
- `tcp` (appears later in the file; sample shows `frame.protocols: null:ipv6:tcp`)

### Working interpretation

- This resembles a Wireshark export with both parsed fields and “raw” slices.
- For analysis, extract a normalized schema:
  - timestamp
  - 5-tuple (src/dst addresses, ports, protocol)
  - flags
  - lengths
  - flow identifiers

## 3) `ContextBuffer/researchgate.csv`

### Structure

- The header row contains multiple “nova-legacy-*” fields indicating this is derived from RG DOM classnames.
- Rows contain:
  - publication title
  - RG URLs
  - author names
  - short snippet-like text

### Working interpretation

- Treat as a “resolution queue”:
  - map entries to DOI / arXiv / publisher URL
  - record open-access status
  - then download only from legitimate open sources
