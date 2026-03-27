# OSINT Agents

This folder contains a local, source-first research orchestration layer for the Italy / SDA / CSG / Costa Rica dossier.

## Goals
- keep research grounded in primary sources
- split work into specialized agents
- preserve evidence and citations
- export clean markdown and JSON outputs

## Files
- `agent_specs.json` — agent definitions
- `orchestrator.py` — local CLI for case setup and brief generation

## Optional tools
The orchestrator works with the Python standard library.

If `smolagents` is installed later, the workspace can use it as an optional execution layer, but no external key is stored in this repository.

## Suggested command
- `py run_osint_agents.py all --case italy_sda_costa_rica`
