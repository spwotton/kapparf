"""
Toroidal Reasoning CLI — __main__.py
=====================================
Run with: py -m toroidal_reasoning <command> [args]

Commands:
  reason   "query"   --modes cot abductive --preset deep --tournament
  genome   path      Profile a file or text against 62-gene resonome  
  ingest   path      Ingest files into vector store
  search   "query"   Search the vector store
  modes              List available reasoning modes
  presets            List chain presets
  stats              Show engine statistics
"""

from __future__ import annotations

import argparse
import json
import sys
import time

# Rich for terminal rendering
try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.markdown import Markdown
    from rich import box
    HAS_RICH = True
except ImportError:
    HAS_RICH = False

from toroidal_reasoning.engine import ToroidalEngine, CHAIN_PRESETS
from toroidal_reasoning.reasoning import AVAILABLE_MODES
from toroidal_reasoning.constants import GOS, KAPPA_SECTORS


console = Console() if HAS_RICH else None


def _print(text: str):
    if console:
        console.print(text)
    else:
        print(text)


def _print_panel(content: str, title: str = "", border_style: str = "cyan"):
    if console:
        console.print(Panel(content, title=title, border_style=border_style))
    else:
        print(f"\n=== {title} ===\n{content}\n")


def _print_result(result):
    """Pretty-print a ReasoningResult."""
    if console:
        # Steps table
        table = Table(title="Reasoning Chain", box=box.ROUNDED)
        table.add_column("#", style="bold")
        table.add_column("Mode", style="cyan")
        table.add_column("κ-Sector", style="magenta")
        table.add_column("Time", style="green")
        table.add_column("Model", style="dim")

        for i, step in enumerate(result.steps, 1):
            sector_name = KAPPA_SECTORS[step.kappa_sector]["name"]
            table.add_row(
                str(i),
                step.mode,
                f"{step.kappa_sector} ({sector_name})",
                f"{step.elapsed_sec:.1f}s",
                step.model.split("/")[-1][:30],
            )

        console.print(table)

        # Individual step outputs (collapsed)
        for i, step in enumerate(result.steps, 1):
            console.print(
                Panel(
                    step.response[:2000] + ("..." if len(step.response) > 2000 else ""),
                    title=f"[bold]{step.mode.upper()}[/bold] (κ={step.kappa_sector})",
                    border_style="dim",
                )
            )

        # Final answer
        console.print(
            Panel(
                Markdown(result.final_answer),
                title="[bold green]FINAL ANSWER[/bold green]",
                border_style="green",
            )
        )

        # Footer
        console.print(
            f"\n[dim]Modes: {' → '.join(result.modes_used)} | "
            f"Total: {result.total_elapsed_sec:.1f}s | "
            f"Con Gusto: {result.con_gusto_score:.3f}[/dim]\n"
        )
    else:
        print(f"\n{'='*60}")
        for i, step in enumerate(result.steps, 1):
            print(f"\n--- STEP {i}: {step.mode.upper()} (κ={step.kappa_sector}) ---")
            print(step.response[:2000])
        print(f"\n{'='*60}")
        print(f"\nFINAL ANSWER:\n{result.final_answer}")
        print(f"\nModes: {' → '.join(result.modes_used)} | Total: {result.total_elapsed_sec:.1f}s")


def _print_genome(gp):
    """Pretty-print a GenomeProfile."""
    if console:
        # Summary panel
        console.print(Panel(gp.summary(), title="Genome Diagnostic", border_style="cyan"))

        # Category scores table
        table = Table(title="Category Expression", box=box.ROUNDED)
        table.add_column("Category", style="bold")
        table.add_column("Score", style="cyan")
        table.add_column("Bar", style="green")

        for cat, score in sorted(gp.category_scores.items(), key=lambda x: x[1], reverse=True):
            bar_len = int(score * 30)
            bar = "█" * bar_len + "░" * (30 - bar_len)
            table.add_row(cat, f"{score:.3f}", bar)
        console.print(table)

        # Sector scores
        table2 = Table(title="κ-Sector Profile", box=box.ROUNDED)
        table2.add_column("Sector", style="bold")
        table2.add_column("Angle", style="cyan")
        table2.add_column("Score", style="magenta")

        for sid in sorted(gp.sector_scores.keys()):
            s = KAPPA_SECTORS[sid]
            score = gp.sector_scores[sid]
            table2.add_row(
                f"{sid}: {s['name']}",
                f"{s['angle']}°",
                f"{score:.3f}",
            )
        console.print(table2)

        # Top genes
        top = sorted(gp.gene_expression.items(), key=lambda x: x[1], reverse=True)[:15]
        table3 = Table(title="Top 15 Expressed Genes", box=box.ROUNDED)
        table3.add_column("Gene", style="bold")
        table3.add_column("Expression", style="green")
        for name, expr in top:
            table3.add_row(name, f"{expr:.3f}")
        console.print(table3)
    else:
        print(gp.summary())
        print(json.dumps(gp.to_dict(), indent=2))


def cmd_reason(args, engine: ToroidalEngine):
    query = " ".join(args.query)
    if not query:
        _print("[red]Error: No query provided[/red]" if console else "Error: No query provided")
        return

    modes = args.modes
    preset = args.preset

    if preset:
        _print(f"Using preset: [bold]{preset}[/bold] → {CHAIN_PRESETS.get(preset, ['?'])}")
    elif modes:
        _print(f"Chain: [bold]{' → '.join(modes)}[/bold]")
    else:
        modes = ["cot"]
        _print("Default mode: [bold]cot[/bold]")

    context = ""
    if args.context_file:
        from pathlib import Path
        context = Path(args.context_file).read_text(encoding="utf-8", errors="replace")
        _print(f"Loaded context: {len(context)} chars from {args.context_file}")

    _print("\n[dim]Reasoning...[/dim]\n" if console else "\nReasoning...\n")

    result = engine.reason(
        query,
        modes=modes,
        preset=preset,
        context=context,
        tournament=args.tournament,
        model=args.model,
    )

    _print_result(result)


def cmd_genome(args, engine: ToroidalEngine):
    from pathlib import Path

    target = args.target
    p = Path(target)

    if p.is_file():
        text = p.read_text(encoding="utf-8", errors="replace")
        gp = engine.profile(text, source=p.name)
    elif p.is_dir():
        _print(f"Profiling directory: {p}")
        # Profile each file and show summary
        for f in sorted(p.rglob("*")):
            if f.is_file() and f.suffix.lower() in (".txt", ".md", ".py", ".json", ".htm", ".html"):
                try:
                    text = f.read_text(encoding="utf-8", errors="replace")
                    gp = engine.profile(text, source=str(f.relative_to(p)))
                    _print(gp.summary())
                except Exception as e:
                    _print(f"  [red]Error: {f.name}: {e}[/red]" if console else f"  Error: {f.name}: {e}")
        return
    else:
        # Treat as raw text
        gp = engine.profile(target, source="<cli-input>")

    _print_genome(gp)


def cmd_ingest(args, engine: ToroidalEngine):
    from pathlib import Path
    target = args.target
    p = Path(target)

    if p.is_file():
        ids = engine.ingest_file(str(p))
        _print(f"Ingested {p.name}: {len(ids)} chunks")
    elif p.is_dir():
        count = engine.ingest_directory(str(p), extensions=args.extensions)
        _print(f"Ingested {count} files from {p}")
    else:
        _print(f"[red]Not found: {target}[/red]" if console else f"Not found: {target}")


def cmd_search(args, engine: ToroidalEngine):
    query = " ".join(args.query)
    results = engine.search(query, top_k=args.top_k)

    if not results:
        _print("No results. Ingest some documents first: `py -m toroidal_reasoning ingest <path>`")
        return

    if console:
        table = Table(title=f"Search: '{query}'", box=box.ROUNDED)
        table.add_column("#", style="bold")
        table.add_column("Score", style="cyan")
        table.add_column("Source", style="green")
        table.add_column("Preview", style="dim", max_width=60)

        for i, r in enumerate(results, 1):
            table.add_row(
                str(i),
                f"{r['score']:.3f}",
                r["metadata"].get("source", r["id"][:20]),
                r["text"][:100].replace("\n", " "),
            )
        console.print(table)
    else:
        for i, r in enumerate(results, 1):
            print(f"{i}. [{r['score']:.3f}] {r['metadata'].get('source', r['id'][:20])}")
            print(f"   {r['text'][:100]}")


def cmd_modes(args, engine: ToroidalEngine):
    modes = engine.list_modes()
    if console:
        table = Table(title="Available Reasoning Modes", box=box.ROUNDED)
        table.add_column("Mode", style="bold cyan")
        table.add_column("κ", style="magenta")
        table.add_column("Sector", style="green")
        table.add_column("Description", max_width=70)

        for m in modes:
            table.add_row(m["mode"], str(m["kappa_sector"]), m["sector_name"], m["description"])
        console.print(table)
    else:
        for m in modes:
            print(f"  {m['mode']:20s}  κ={m['kappa_sector']}  {m['sector_name']:15s}  {m['description']}")


def cmd_presets(args, engine: ToroidalEngine):
    presets = engine.list_presets()
    if console:
        table = Table(title="Chain Presets", box=box.ROUNDED)
        table.add_column("Preset", style="bold cyan")
        table.add_column("Chain", style="green")

        for name, chain in sorted(presets.items()):
            table.add_row(name, " → ".join(chain))
        console.print(table)
    else:
        for name, chain in sorted(presets.items()):
            print(f"  {name:15s}  {' → '.join(chain)}")


def cmd_stats(args, engine: ToroidalEngine):
    stats = engine.stats()
    _print(json.dumps(stats, indent=2, default=str))


# ═══════════════════════════════════════════════════════════════════════════════
# ARGUMENT PARSER
# ═══════════════════════════════════════════════════════════════════════════════

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="toroidal_reasoning",
        description="🌀 Toroidal Reasoning Engine — 19 modes × 62 genes × 7 κ-sectors",
    )
    parser.add_argument("--model", type=str, default=None, help="Override LLM model")
    parser.add_argument("--vector-dir", type=str, default=".vectors", help="Vector store directory")

    sub = parser.add_subparsers(dest="command")

    # reason
    p_reason = sub.add_parser("reason", help="Run a reasoning chain")
    p_reason.add_argument("query", nargs="+", help="The question to reason about")
    p_reason.add_argument("--modes", "-m", nargs="+", choices=AVAILABLE_MODES, help="Reasoning modes to chain")
    p_reason.add_argument("--preset", "-p", choices=list(CHAIN_PRESETS.keys()), help="Use a preset chain")
    p_reason.add_argument("--tournament", "-t", action="store_true", help="Run modes independently and vote")
    p_reason.add_argument("--context-file", "-c", type=str, help="File to load as context")
    p_reason.set_defaults(func=cmd_reason)

    # genome
    p_genome = sub.add_parser("genome", help="Profile a document's 62-gene resonome")
    p_genome.add_argument("target", help="File path, directory, or raw text")
    p_genome.set_defaults(func=cmd_genome)

    # ingest
    p_ingest = sub.add_parser("ingest", help="Ingest files into vector store")
    p_ingest.add_argument("target", help="File or directory to ingest")
    p_ingest.add_argument("--extensions", "-e", nargs="+", default=None, help="File extensions to include")
    p_ingest.set_defaults(func=cmd_ingest)

    # search
    p_search = sub.add_parser("search", help="Search the vector store")
    p_search.add_argument("query", nargs="+", help="Search query")
    p_search.add_argument("--top-k", "-k", type=int, default=5, help="Number of results")
    p_search.set_defaults(func=cmd_search)

    # modes
    p_modes = sub.add_parser("modes", help="List available reasoning modes")
    p_modes.set_defaults(func=cmd_modes)

    # presets
    p_presets = sub.add_parser("presets", help="List chain presets")
    p_presets.set_defaults(func=cmd_presets)

    # stats
    p_stats = sub.add_parser("stats", help="Show engine statistics")
    p_stats.set_defaults(func=cmd_stats)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    engine = ToroidalEngine(model=args.model, vector_dir=args.vector_dir)

    if hasattr(args, "func"):
        args.func(args, engine)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
