#!/usr/bin/env python3
"""Local OSINT research orchestrator.

Creates case folders, agent briefs, evidence templates, and a master plan.
Optional external frameworks can be added later, but this module keeps the
first pass fully local and source-first.
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent
SPEC_PATH = Path(__file__).resolve().parent / 'agent_specs.json'
DEFAULT_PROMPT = BASE_DIR / 'ITALIAN_SDA_BROWSER_DEEP_RESEARCH_PROMPT.md'
DEFAULT_STACK = BASE_DIR / 'TOROIDAL_OSINT_AGENT_STACK.md'


@dataclass
class AgentSpec:
    id: str
    name: str
    objective: str
    date_range: str
    jurisdictions: list[str]
    entities: list[str]
    required_sources: list[str]
    search_strings: list[str]
    output_schema: list[str]
    stop_conditions: list[str]


@dataclass
class CaseContext:
    case_name: str
    case_root: Path
    created_at: str
    prompt_path: str
    stack_path: str
    smolagents_available: bool


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load_specs() -> list[AgentSpec]:
    data = json.loads(SPEC_PATH.read_text(encoding='utf-8'))
    return [AgentSpec(**agent) for agent in data['agents']]


def smolagents_available() -> bool:
    return importlib.util.find_spec('smolagents') is not None


def build_case_root(case_name: str) -> Path:
    return BASE_DIR / 'investigations' / case_name


def ensure_case_dirs(case_root: Path) -> dict[str, Path]:
    paths = {
        'root': case_root,
        'briefs': case_root / 'briefs',
        'evidence': case_root / 'evidence',
        'raw': case_root / 'evidence' / 'raw',
        'archive': case_root / 'evidence' / 'archive',
        'screenshots': case_root / 'evidence' / 'screenshots',
        'notes': case_root / 'notes',
        'requests': case_root / 'requests',
        'timelines': case_root / 'timelines',
        'exports': case_root / 'exports',
    }
    for path in paths.values():
        path.mkdir(parents=True, exist_ok=True)
    return paths


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def write_csv(path: Path, headers: list[str], rows: list[list[str]] | None = None) -> None:
    with path.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.writer(handle)
        writer.writerow(headers)
        for row in rows or []:
            writer.writerow(row)


def case_context(case_name: str) -> CaseContext:
    return CaseContext(
        case_name=case_name,
        case_root=build_case_root(case_name),
        created_at=utc_now(),
        prompt_path=str(DEFAULT_PROMPT) if DEFAULT_PROMPT.exists() else '',
        stack_path=str(DEFAULT_STACK) if DEFAULT_STACK.exists() else '',
        smolagents_available=smolagents_available(),
    )


def render_case_readme(context: CaseContext, specs: list[AgentSpec]) -> str:
    lines = [
        f'# Case Workspace — {context.case_name}',
        '',
        f'- Created: {context.created_at}',
        f'- Base prompt: {context.prompt_path or "not found"}',
        f'- Stack doc: {context.stack_path or "not found"}',
        f'- Optional `smolagents` detected: {"yes" if context.smolagents_available else "no"}',
        '',
        '## Agent order',
    ]
    for index, spec in enumerate(specs, start=1):
        lines.append(f'{index}. `{spec.name}` — {spec.objective}')
    lines.extend([
        '',
        '## Output rule',
        '- every claim needs a source',
        '- mark confidence explicitly',
        '- separate verified fact from inference',
        '- archive every cited source if possible',
        '',
        '## Run',
        '- `py run_osint_agents.py all --case ' + context.case_name + '`',
    ])
    return '\n'.join(lines) + '\n'


def render_agent_brief(spec: AgentSpec, context: CaseContext) -> str:
    lines = [
        f'# Agent Brief — {spec.name}',
        '',
        f'- Agent ID: `{spec.id}`',
        f'- Case: `{context.case_name}`',
        f'- Generated: {context.created_at}',
        '',
        '## Objective',
        spec.objective,
        '',
        '## Date range',
        spec.date_range,
        '',
        '## Jurisdictions',
    ]
    lines.extend([f'- {item}' for item in spec.jurisdictions])
    lines.extend(['', '## Entities'])
    lines.extend([f'- {item}' for item in spec.entities])
    lines.extend(['', '## Required sources'])
    lines.extend([f'- {item}' for item in spec.required_sources])
    lines.extend(['', '## Search strings'])
    lines.extend([f'- {item}' for item in spec.search_strings] or ['- none'])
    lines.extend(['', '## Output schema'])
    lines.extend([f'- {item}' for item in spec.output_schema])
    lines.extend(['', '## Confidence rules'])
    lines.extend([
        '- High = primary record directly supports the claim.',
        '- Medium = reputable secondary source plus partial primary support.',
        '- Low = credible lead only, not yet verified.',
    ])
    lines.extend(['', '## Stop conditions'])
    lines.extend([f'- {item}' for item in spec.stop_conditions])
    lines.extend(['', '## Notes'])
    lines.extend([
        '- Do not present speculation as fact.',
        '- If no record is found, say `no public evidence located`.',
        '- Archive URLs, PDFs, and screenshots as you go.',
    ])
    return '\n'.join(lines) + '\n'


def render_master_plan(specs: list[AgentSpec], context: CaseContext) -> str:
    lines = [
        f'# Master Plan — {context.case_name}',
        '',
        f'Generated: {context.created_at}',
        '',
        '## Execution order',
    ]
    for index, spec in enumerate(specs, start=1):
        lines.extend([
            f'### {index}. {spec.name}',
            f'- Objective: {spec.objective}',
            f'- Date range: {spec.date_range}',
            f'- Deliverable fields: {", ".join(spec.output_schema)}',
            '',
        ])
    lines.extend([
        '## Export targets',
        '- `exports/executive_summary.md`',
        '- `exports/chronology.csv`',
        '- `exports/evidence_table.csv`',
        '- `exports/entity_map.json`',
        '- `exports/next_requests.md`',
    ])
    return '\n'.join(lines) + '\n'


def initialize_case(case_name: str) -> Path:
    specs = load_specs()
    context = case_context(case_name)
    paths = ensure_case_dirs(context.case_root)

    (paths['root'] / 'README.md').write_text(render_case_readme(context, specs), encoding='utf-8')
    (paths['notes'] / 'master_plan.md').write_text(render_master_plan(specs, context), encoding='utf-8')

    write_json(paths['root'] / 'case_context.json', {
        'case_name': context.case_name,
        'created_at': context.created_at,
        'prompt_path': context.prompt_path,
        'stack_path': context.stack_path,
        'smolagents_available': context.smolagents_available,
    })

    write_csv(
        paths['evidence'] / 'evidence_table.csv',
        ['claim', 'source', 'source_type', 'date', 'confidence', 'notes'],
    )
    write_csv(
        paths['timelines'] / 'chronology.csv',
        ['date', 'event', 'entity', 'source_url', 'confidence', 'notes'],
    )
    write_csv(
        paths['requests'] / 'request_queue.csv',
        ['jurisdiction', 'agency', 'record_type', 'priority', 'status', 'notes'],
    )
    write_csv(
        paths['archive'] / 'source_manifest.csv',
        ['title', 'url', 'saved_path', 'sha256', 'captured_at', 'language', 'notes'],
    )
    write_json(paths['exports'] / 'entity_map.json', {'entities': [], 'relationships': []})
    write_json(paths['notes'] / 'claim_hygiene.json', {
        'verified': [],
        'partially_supported': [],
        'unverified': [],
        'contradicted': [],
    })

    for spec in specs:
        brief_path = paths['briefs'] / f'{spec.id}.md'
        brief_path.write_text(render_agent_brief(spec, context), encoding='utf-8')

    return context.case_root


def write_briefs(case_name: str) -> Path:
    case_root = build_case_root(case_name)
    ensure_case_dirs(case_root)
    context = case_context(case_name)
    for spec in load_specs():
        (case_root / 'briefs' / f'{spec.id}.md').write_text(
            render_agent_brief(spec, context),
            encoding='utf-8',
        )
    return case_root / 'briefs'


def main() -> int:
    parser = argparse.ArgumentParser(description='Local OSINT agent orchestrator')
    subparsers = parser.add_subparsers(dest='command', required=True)

    init_parser = subparsers.add_parser('init-case', help='Initialize a case workspace')
    init_parser.add_argument('--case', required=True, help='Case folder name')

    briefs_parser = subparsers.add_parser('write-briefs', help='Write agent briefs for a case')
    briefs_parser.add_argument('--case', required=True, help='Case folder name')

    all_parser = subparsers.add_parser('all', help='Initialize a case and write briefs')
    all_parser.add_argument('--case', required=True, help='Case folder name')

    args = parser.parse_args()

    if args.command == 'init-case':
        path = initialize_case(args.case)
        print(f'Initialized case workspace at: {path}')
        return 0

    if args.command == 'write-briefs':
        path = write_briefs(args.case)
        print(f'Wrote agent briefs to: {path}')
        return 0

    if args.command == 'all':
        path = initialize_case(args.case)
        print(f'Initialized full OSINT agent workspace at: {path}')
        return 0

    parser.error('Unknown command')
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
