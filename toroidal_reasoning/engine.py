"""
ToroidalEngine — top-level orchestrator
========================================
Chains reasoning modes, manages vector store, profiles documents.
This is the main interface for the toroidal_reasoning package.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from toroidal_reasoning.constants import (
    GOS,
    RESONOME,
    KAPPA_SECTORS,
    REASONING_SECTOR_MAP,
    encode_base53,
    con_gusto_score,
)
from toroidal_reasoning.reasoning import (
    run_reasoning_chain,
    run_reasoning_tournament,
    list_modes,
    AVAILABLE_MODES,
    DEFAULT_MODEL,
    ReasoningResult,
)
from toroidal_reasoning.genome import profile_text, profile_file, GenomeProfile
from toroidal_reasoning.vector_store import VectorStore


# ═══════════════════════════════════════════════════════════════════════════════
# PRESET CHAINS (battle-tested combinations)
# ═══════════════════════════════════════════════════════════════════════════════

CHAIN_PRESETS: dict[str, list[str]] = {
    # Quick & practical
    "fast":        ["cot"],
    "verify":      ["cot", "cove"],
    "critique":    ["cot", "self_criticism"],

    # Deep analysis
    "deep":        ["cot", "abductive", "self_criticism", "cove"],
    "research":    ["decompositional", "inductive", "abductive", "self_criticism"],
    "debate":      ["cot", "tot", "self_consistency"],

    # Scientific
    "scientific":  ["deductive", "inductive", "cove", "self_criticism"],
    "hypothesis":  ["abductive", "deductive", "cove"],

    # Creative / exploratory
    "explore":     ["analogical", "fuzzy", "non_monotonic", "biogeometric"],
    "quantum":     ["quantum", "resonome", "blackhole"],

    # Full toroidal sweep (all 7 κ-sectors)
    "toroidal":    ["cot", "react", "deductive", "analogical", "abductive", "resonome", "biogeometric"],

    # Maximum rigor
    "max":         ["cot", "tot", "self_criticism", "self_consistency", "cove", "deductive", "abductive"],
}


class ToroidalEngine:
    """
    The engine. Chains reasoning modes, profiles documents, searches vectors.
    
    Usage:
        engine = ToroidalEngine()
        result = engine.reason("Why do raccoons wash their food?", modes=["cot", "abductive"])
        print(result.final_answer)
    """

    def __init__(
        self,
        model: str | None = None,
        vector_dir: str | Path = ".vectors",
    ):
        self.model = model or DEFAULT_MODEL
        self.vectors = VectorStore(store_dir=vector_dir)
        self._history: list[dict[str, Any]] = []

    # ── Reasoning ──────────────────────────────────────────────────────────

    def reason(
        self,
        query: str,
        modes: list[str] | None = None,
        preset: str | None = None,
        context: str = "",
        tournament: bool = False,
        model: str | None = None,
    ) -> ReasoningResult:
        """
        Main reasoning entry point.
        
        Args:
            query:      The question
            modes:      List of reasoning modes to chain
            preset:     Use a named preset chain (e.g., "deep", "research")
            context:    Additional context text
            tournament: If True, run modes independently and vote (vs. sequential chain)
            model:      Override LLM model
        """
        if preset and preset in CHAIN_PRESETS:
            modes = CHAIN_PRESETS[preset]
        elif not modes:
            modes = ["cot"]

        # Auto-augment with vector search context
        if self.vectors.count() > 0 and not context:
            hits = self.vectors.search(query, top_k=3)
            if hits:
                context = "\n\n".join(
                    f"[Related doc: {h['metadata'].get('source', h['id'])}]\n{h['text'][:1500]}"
                    for h in hits
                )

        if tournament:
            result = run_reasoning_tournament(query, modes, context=context, model=model or self.model)
        else:
            result = run_reasoning_chain(query, modes, context=context, model=model or self.model)

        # Log to history
        self._history.append(result.to_dict())

        return result

    # ── Document Genome ────────────────────────────────────────────────────

    def profile(self, text: str, source: str = "<input>") -> GenomeProfile:
        """Profile text against 62-gene resonome."""
        return profile_text(text, source=source)

    def profile_and_ingest(self, text: str, source: str = "<input>", metadata: dict | None = None) -> tuple[GenomeProfile, str]:
        """Profile text AND store in vector DB."""
        gp = profile_text(text, source=source)
        meta = metadata or {}
        meta.update({
            "source": source,
            "health_score": round(gp.health_score, 1),
            "dominant_sector": gp.dominant_sector,
            "dominant_category": gp.dominant_category,
            "con_gusto": round(gp.con_gusto, 3),
        })
        doc_id = self.vectors.add(text, metadata=meta)
        return gp, doc_id

    def ingest_file(self, path: str, chunk_size: int = 2000) -> list[str]:
        """Ingest a file into the vector store by chunks."""
        p = Path(path)
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            text = p.read_bytes().decode("utf-8", errors="replace")

        # Split into chunks
        chunks = []
        words = text.split()
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i : i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)

        ids = []
        for i, chunk in enumerate(chunks):
            meta = {"source": p.name, "chunk_index": i, "total_chunks": len(chunks)}
            doc_id = self.vectors.add(chunk, metadata=meta)
            ids.append(doc_id)

        return ids

    def ingest_directory(self, directory: str, extensions: list[str] | None = None) -> int:
        """Ingest all files in a directory. Returns count ingested."""
        exts = extensions or [".txt", ".md", ".py", ".json", ".htm", ".html", ".csv"]
        count = 0
        for p in Path(directory).rglob("*"):
            if p.suffix.lower() in exts and p.is_file():
                try:
                    self.ingest_file(str(p))
                    count += 1
                except Exception:
                    continue
        return count

    # ── Search ─────────────────────────────────────────────────────────────

    def search(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        """Search the vector store."""
        return self.vectors.search(query, top_k=top_k)

    # ── Utilities ──────────────────────────────────────────────────────────

    def list_modes(self) -> list[dict[str, str]]:
        """List available reasoning modes."""
        return list_modes()

    def list_presets(self) -> dict[str, list[str]]:
        """List chain presets."""
        return CHAIN_PRESETS.copy()

    def stats(self) -> dict[str, Any]:
        return {
            "model": self.model,
            "vector_store": self.vectors.stats(),
            "history_length": len(self._history),
            "available_modes": len(AVAILABLE_MODES),
            "available_presets": len(CHAIN_PRESETS),
            "gos_constants": {k: v for k, v in GOS.items() if isinstance(v, (int, float))},
        }

    def export_history(self, path: str | None = None) -> str:
        """Export reasoning history to JSON."""
        if path is None:
            path = f"reasoning_history_{encode_base53(int(time.time()))}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self._history, f, indent=2, ensure_ascii=False)
        return path
