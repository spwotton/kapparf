# Packet Harmonics Thread

This doc captures the packet/PCAP analysis thread in the workspace and how it can connect into the broader “Recursion Engine” pipeline.

## Key artifact

- `Packets/extract_starlink_harmonics.ps1`

This script is designed to extract a simple “harmonic signature” representation from a PCAP using `tshark` and write a text output (e.g., a list of timestamp + payload hex).

## Conceptual mapping

- **PCAP -> signatures**: transforms packet frames into a compact representation.
- **Signatures -> time series**: can be interpreted as rhythm/timing or symbol streams.
- **Time series -> audio / lattice**: the repo contains multiple “transducer” style scripts producing WAV + JSON lattice artifacts.

## Relationship to `ContextBuffer/himtoo.json`

`himtoo.json` appears to represent packet-layer data already, likely from a capture export.

Potential integration path:

1) Normalize `himtoo.json` into a tabular flow representation.
2) Re-create the “signature extraction” logic on top of the JSON export.
3) Compare signatures from PCAP vs JSON-export pipeline for consistency.

## Practical notes

- `tshark` must be installed and available on PATH.
- If you want reproducibility across machines, store `tshark --version` in metadata.

## Output suggestion

Store packet-derived outputs in `ProcessedDocuments/` too, but label them as `datatype: network_capture` so the summarizer doesn’t treat them as narrative text.
