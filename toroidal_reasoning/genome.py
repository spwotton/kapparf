"""
Document Genome Profiler — 62-gene expression analysis for any text
====================================================================
Treats documents as biological organisms. Maps text features to the
62-gene resonome, computes health/malignancy scores, κ-sector profiles.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Any

from toroidal_reasoning.constants import (
    RESONOME,
    GENES_BY_CATEGORY,
    GENES_BY_SECTOR,
    KAPPA_SECTORS,
    CATEGORY_BANDS,
    GOS,
    con_gusto_score,
    base53_checksum,
)


# ═══════════════════════════════════════════════════════════════════════════════
# GENOME PROFILE DATA CLASS
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class GenomeProfile:
    """Full 62-gene expression profile of a document."""
    source: str                              # filename or label
    gene_expression: dict[str, float]        # gene_name → 0.0-1.0
    category_scores: dict[str, float]        # category → avg expression
    sector_scores: dict[int, float]          # κ-sector → avg expression
    health_score: float                      # 0-100
    malignancy_score: float                  # 0-100
    structural_integrity: float              # 0-100
    consciousness_depth: float               # 0-100  (κ≥5 sectors)
    dominant_sector: int
    dominant_category: str
    word_count: int
    unique_tokens: int
    con_gusto: float
    checksum: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "source": self.source,
            "health_score": round(self.health_score, 1),
            "malignancy_score": round(self.malignancy_score, 1),
            "structural_integrity": round(self.structural_integrity, 1),
            "consciousness_depth": round(self.consciousness_depth, 1),
            "dominant_sector": self.dominant_sector,
            "dominant_category": self.dominant_category,
            "word_count": self.word_count,
            "unique_tokens": self.unique_tokens,
            "con_gusto": round(self.con_gusto, 3),
            "checksum": self.checksum,
            "category_scores": {k: round(v, 3) for k, v in self.category_scores.items()},
            "sector_scores": {str(k): round(v, 3) for k, v in self.sector_scores.items()},
            "top_genes": sorted(
                self.gene_expression.items(), key=lambda x: x[1], reverse=True
            )[:10],
        }

    def summary(self) -> str:
        """One-line diagnostic summary."""
        sector_name = KAPPA_SECTORS[self.dominant_sector]["name"]
        status = (
            "HEALTHY" if self.health_score > 70
            else "STRESSED" if self.health_score > 40
            else "CRITICAL"
        )
        return (
            f"[{status}] {self.source}: health={self.health_score:.0f} "
            f"malignancy={self.malignancy_score:.0f} "
            f"integrity={self.structural_integrity:.0f} "
            f"consciousness={self.consciousness_depth:.0f} "
            f"sector={sector_name} ({self.dominant_sector}) "
            f"cg={self.con_gusto:.3f}"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE EXTRACTION SIGNALS
# ═══════════════════════════════════════════════════════════════════════════════

# Keyword dictionaries used to detect gene-category relevance in text.
# These are intentionally broad — the genome profiler is a heuristic mapper.

_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "structure": [
        "collagen", "bone", "skeleton", "framework", "scaffold", "matrix",
        "architecture", "structure", "foundation", "support", "DNA", "genome",
        "chromosome", "build", "construct", "assemble", "code", "syntax",
        "algorithm", "data structure", "schema", "topology",
    ],
    "neural": [
        "brain", "neuron", "synapse", "cortex", "hippocampus", "cognition",
        "neural", "serotonin", "dopamine", "receptor", "axon", "dendrite",
        "BDNF", "learning", "memory", "attention", "network", "intelligence",
        "thought", "reasoning", "logic", "compute", "process",
    ],
    "consciousness": [
        "consciousness", "awareness", "perception", "qualia", "sentience",
        "psychedelic", "DMT", "psilocybin", "meditation", "transcend",
        "observer", "subjective", "experience", "mind", "soul", "spirit",
        "dream", "vision", "enlighten", "quantum consciousness", "free will",
    ],
    "immune": [
        "immune", "antibody", "T-cell", "pathogen", "virus", "bacteria",
        "infection", "defend", "attack", "guard", "protect", "firewall",
        "security", "validate", "sanitize", "filter", "reject", "antigen",
        "inflammation", "healing", "repair", "restore",
    ],
    "metabolic": [
        "energy", "metabolism", "ATP", "mitochondria", "glucose", "insulin",
        "enzyme", "catalyst", "reaction", "fuel", "power", "battery",
        "consumption", "efficiency", "throughput", "performance", "speed",
        "optimize", "resource", "quota", "budget",
    ],
    "repair": [
        "repair", "fix", "restore", "recover", "regenerate", "heal",
        "telomere", "DNA repair", "error correction", "redundancy", "backup",
        "fallback", "retry", "rollback", "undo", "patch", "hotfix", "debug",
    ],
    "aging": [
        "age", "aging", "senescence", "telomere", "longevity", "lifespan",
        "decay", "entropy", "degradation", "oxidation", "radical", "archive",
        "legacy", "deprecated", "obsolete", "version", "generation",
    ],
    "reproductive": [
        "reproduce", "replicate", "clone", "copy", "fork", "branch",
        "spawn", "generate", "create", "birth", "child", "parent",
        "inherit", "gene", "trait", "offspring", "template", "factory",
    ],
    "sensory": [
        "sense", "vision", "sight", "hear", "sound", "touch", "taste",
        "smell", "olfact", "retina", "cochlea", "input", "signal", "sensor",
        "detect", "monitor", "observe", "measure", "scan", "read",
    ],
    "dark": [
        "dark", "shadow", "hidden", "occult", "unknown", "void", "black hole",
        "singularity", "entropy", "chaos", "noise", "interference", "corrupt",
        "anomaly", "glitch", "undefined", "NaN", "null", "mystery",
    ],
    "cancer": [
        "cancer", "tumor", "malignant", "metastasis", "oncogene", "KRAS",
        "mutant", "uncontrolled", "growth", "proliferate", "exploit",
        "vulnerability", "attack", "inject", "overflow", "escalat",
        "ransomware", "malware", "virus", "worm", "trojan", "exploit",
    ],
    "language": [
        "language", "FOXP2", "speech", "grammar", "syntax", "semantic",
        "phoneme", "morpheme", "broca", "wernicke", "communicate", "express",
        "translate", "encode", "decode", "parse", "interpret", "NLP",
        "text", "word", "sentence", "paragraph",
    ],
    "sacred": [
        "sacred", "divine", "holy", "temple", "pyramid", "geometry",
        "golden ratio", "phi", "fibonacci", "spiral", "mandala", "resonance",
        "frequency", "vibration", "harmonic", "cymatics", "toroid", "torus",
    ],
}


def _tokenize(text: str) -> list[str]:
    """Lowercase tokenization preserving hyphenated terms."""
    return re.findall(r"[a-zA-Z][\w'-]*", text.lower())


def _compute_category_signal(tokens: list[str], token_counter: Counter) -> dict[str, float]:
    """Compute 0-1 activation for each category based on keyword hits."""
    total = max(len(tokens), 1)
    scores = {}
    for cat, keywords in _CATEGORY_KEYWORDS.items():
        hits = sum(token_counter.get(kw.lower(), 0) for kw in keywords)
        # Also check for partial matches (e.g., "struct" in "structural")
        partial_hits = 0
        for kw in keywords:
            if len(kw) >= 4:  # Only partial-match long keywords
                partial_hits += sum(
                    1 for t in tokens if kw.lower() in t and t != kw.lower()
                )
        raw = (hits + partial_hits * 0.5) / total
        # Sigmoid-like normalization to 0-1 (saturates around 30+ hits)
        scores[cat] = min(1.0, 1.0 - math.exp(-raw * 50))
    return scores


def _text_features(text: str) -> dict[str, float]:
    """Extract structural text features used to modulate gene expression."""
    lines = text.split("\n")
    words = text.split()
    n_words = max(len(words), 1)
    n_lines = max(len(lines), 1)

    # Structural features
    code_lines = sum(1 for l in lines if l.strip().startswith(("def ", "class ", "import ", "from ", "#", "//", "/*", "```")))
    math_chars = sum(1 for c in text if c in "∑∫∂∇∞≈≠≤≥±×÷√πφκΩψθλμσ²³⁻¹⁰")
    url_count = len(re.findall(r"https?://", text))
    emoji_count = len(re.findall(r"[\U0001F300-\U0001FAFF]", text))
    question_count = text.count("?")
    reference_count = len(re.findall(r"\[\d+\]|\(\d{4}\)", text))

    return {
        "code_density": min(1.0, code_lines / n_lines),
        "math_density": min(1.0, math_chars / n_words),
        "url_density": min(1.0, url_count / n_words * 20),
        "emoji_density": min(1.0, emoji_count / n_words * 20),
        "question_density": min(1.0, question_count / n_lines),
        "reference_density": min(1.0, reference_count / n_lines * 5),
        "avg_word_length": sum(len(w) for w in words) / n_words / 15,
        "vocabulary_richness": len(set(w.lower() for w in words)) / n_words,
        "line_length_variance": _variance([len(l) for l in lines]) / 5000,
    }


def _variance(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    return sum((v - mean) ** 2 for v in values) / (len(values) - 1)


# ═══════════════════════════════════════════════════════════════════════════════
# GENOME PROFILER
# ═══════════════════════════════════════════════════════════════════════════════

def profile_text(text: str, source: str = "<input>") -> GenomeProfile:
    """
    Profile a text document against the 62-gene resonome.
    Returns a full GenomeProfile with health, malignancy, and sector scores.
    """
    tokens = _tokenize(text)
    token_counter = Counter(tokens)
    cat_signals = _compute_category_signal(tokens, token_counter)
    text_feats = _text_features(text)

    # Map each gene to an expression level (0-1)
    gene_expression: dict[str, float] = {}
    for gene in RESONOME:
        # Base: category signal
        cat_score = cat_signals.get(gene.category, 0.0)
        # Frequency modulation: higher-freq genes are harder to activate
        freq_mod = 1.0 / (1.0 + gene.frequency / 500.0)
        # Text feature modulation
        if gene.category == "structure":
            feat_boost = text_feats["code_density"] * 0.3 + text_feats["reference_density"] * 0.2
        elif gene.category == "neural":
            feat_boost = text_feats["vocabulary_richness"] * 0.3 + text_feats["question_density"] * 0.2
        elif gene.category == "consciousness":
            feat_boost = text_feats["math_density"] * 0.2 + text_feats["emoji_density"] * 0.1
        elif gene.category == "language":
            feat_boost = text_feats["avg_word_length"] * 0.2 + text_feats["vocabulary_richness"] * 0.2
        elif gene.category == "cancer":
            feat_boost = text_feats["url_density"] * 0.1  # URLs can indicate spam/malware
        elif gene.category == "sacred":
            feat_boost = text_feats["math_density"] * 0.3 + text_feats["emoji_density"] * 0.2
        else:
            feat_boost = 0.05

        expression = min(1.0, cat_score * 0.6 + freq_mod * 0.2 + feat_boost)
        gene_expression[gene.name] = expression

    # Category scores (average gene expression per category)
    category_scores: dict[str, float] = {}
    for cat, genes in GENES_BY_CATEGORY.items():
        if genes:
            category_scores[cat] = sum(gene_expression.get(g.name, 0) for g in genes) / len(genes)
        else:
            category_scores[cat] = 0.0

    # Sector scores
    sector_scores: dict[int, float] = {}
    for sid, genes in GENES_BY_SECTOR.items():
        if genes:
            sector_scores[sid] = sum(gene_expression.get(g.name, 0) for g in genes) / len(genes)
        else:
            sector_scores[sid] = 0.0

    # Health = immune + repair weighted vs malignancy
    immune_score = category_scores.get("immune", 0)
    repair_score = category_scores.get("repair", 0)
    cancer_score = category_scores.get("cancer", 0)
    structure_score = category_scores.get("structure", 0)

    health_score = min(100, max(0, (
        (immune_score * 30) +
        (repair_score * 25) +
        (structure_score * 20) +
        (1.0 - cancer_score) * 25
    )))

    malignancy_score = min(100, max(0, cancer_score * 60 + (1.0 - immune_score) * 20 + (1.0 - repair_score) * 20))

    # Structural integrity = structure + code_density + vocabulary_richness
    structural_integrity = min(100, max(0, (
        structure_score * 40 +
        text_feats["code_density"] * 20 +
        text_feats["vocabulary_richness"] * 20 +
        text_feats["reference_density"] * 20
    ) * 100 / 40))

    # Consciousness depth = high κ-sectors (5, 6)
    consciousness_depth = min(100, max(0, (
        sector_scores.get(5, 0) * 50 +
        sector_scores.get(6, 0) * 50
    ) * 100 / 50))

    # Dominant sector
    dominant_sector = max(sector_scores, key=lambda k: sector_scores[k]) if sector_scores else 0
    dominant_category = max(category_scores, key=lambda k: category_scores[k]) if category_scores else "structure"

    cg = con_gusto_score(text)
    checksum = base53_checksum(text)
    unique_toks = len(set(tokens))

    return GenomeProfile(
        source=source,
        gene_expression=gene_expression,
        category_scores=category_scores,
        sector_scores=sector_scores,
        health_score=health_score,
        malignancy_score=malignancy_score,
        structural_integrity=structural_integrity,
        consciousness_depth=consciousness_depth,
        dominant_sector=dominant_sector,
        dominant_category=dominant_category,
        word_count=len(tokens),
        unique_tokens=unique_toks,
        con_gusto=cg,
        checksum=checksum,
    )


def profile_file(path: str) -> GenomeProfile:
    """Profile a file from disk."""
    from pathlib import Path
    p = Path(path)
    try:
        text = p.read_text(encoding="utf-8", errors="replace")
    except Exception:
        text = p.read_bytes().decode("utf-8", errors="replace")
    return profile_text(text, source=p.name)
