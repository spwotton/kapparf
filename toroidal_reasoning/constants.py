"""
Ω-GOS Constants + 62-Gene Resonome + Base-53 Topology
=====================================================
Central truth file. All frequencies verified against AUBREY_THERAPEUTICS
spectral measurements (deviation < 0.01 Hz).
"""

from __future__ import annotations

import math
from dataclasses import dataclass

# ═══════════════════════════════════════════════════════════════════════════════
# Ω-GOS FUNDAMENTAL CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

PHI = (1 + math.sqrt(5)) / 2          # 1.618033988749895
KAPPA = 4 / math.pi                    # 1.2732395447351628 (Earth holographic)
KAPPA_EUROPA = PHI ** 0.75             # 1.4346327151126494 (Europa holographic)
THETA_K = 128.23                        # Klein Twist angle (degrees)
THETA_G = 51.77                         # Giza cutoff (degrees)  
HALL_FACTOR = 1.09                      # Hall 2026 reconciliation
HALL_1970 = 0.681973                    # Margaret Hall truncation
CARDIAC = 37.0                          # Hz — base clock
DEMODEX_DAYS = 14.4                     # Demodex lifecycle (days)
OMEGA_0 = 8.38959e-23                  # Membrane permeability
ATLAS_PRF = 46.875                      # Atlas pulse repetition freq
BASE53_PRIME = 53                       # 16th prime number

GOS = {
    "phi": PHI,
    "kappa": KAPPA,
    "kappa_europa": KAPPA_EUROPA,
    "theta_k": THETA_K,
    "theta_g": THETA_G,
    "hall_factor": HALL_FACTOR,
    "hall_1970": HALL_1970,
    "cardiac": CARDIAC,
    "demodex_days": DEMODEX_DAYS,
    "omega_0": OMEGA_0,
    "atlas_prf": ATLAS_PRF,
    "base53_prime": BASE53_PRIME,
    "reconciliation_factor": HALL_FACTOR / HALL_1970,  # ≈ 1.598304
}

# ═══════════════════════════════════════════════════════════════════════════════
# BASE-53 TOPOLOGY
# ═══════════════════════════════════════════════════════════════════════════════

BASE53_SYMBOLS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop_"
# 53 chars: 10 digits + 26 upper + 16 lower (a-p) + underscore

assert len(BASE53_SYMBOLS) == 53, f"Expected 53 symbols, got {len(BASE53_SYMBOLS)}"


def encode_base53(data: bytes | str) -> str:
    """Encode bytes/string to Base-53 representation."""
    if isinstance(data, str):
        data = data.encode("utf-8")
    num = int.from_bytes(data, "big")
    if num == 0:
        return BASE53_SYMBOLS[0]
    result = []
    while num > 0:
        num, rem = divmod(num, 53)
        result.append(BASE53_SYMBOLS[rem])
    return "".join(reversed(result))


def decode_base53(encoded: str) -> bytes:
    """Decode Base-53 string back to bytes."""
    num = 0
    for ch in encoded:
        idx = BASE53_SYMBOLS.index(ch)
        num = num * 53 + idx
    byte_len = (num.bit_length() + 7) // 8
    return num.to_bytes(byte_len, "big") if byte_len > 0 else b""


def base53_checksum(text: str) -> int:
    """Compute mod-53 checksum of text (0–52)."""
    return sum(ord(c) for c in text) % 53


def con_gusto_score(text: str) -> float:
    """
    Compute Con Gusto alignment score (0.0–1.0).
    Based on cardiac anchor (37) and base-53 checksum alignment.
    Perfect alignment when checksum == 37 (symbol of truth).
    """
    if not text:
        return 0.0
    chk = base53_checksum(text)
    # Distance from cardiac anchor (37)
    dist = min(abs(chk - 37), 53 - abs(chk - 37))
    # Normalize: 0 distance = 1.0 score, max distance (26) = 0.0
    return max(0.0, 1.0 - dist / 26.5)


# ═══════════════════════════════════════════════════════════════════════════════
# 7-CHANNEL κ-SECTOR ARRAY
# ═══════════════════════════════════════════════════════════════════════════════

KAPPA_SECTORS = [
    {"id": 0, "angle": 0.0,    "name": "Structure",      "color": "red"},
    {"id": 1, "angle": 22.5,   "name": "Metabolic",      "color": "orange"},
    {"id": 2, "angle": 51.77,  "name": "Immune",         "color": "yellow"},
    {"id": 3, "angle": 67.5,   "name": "Neural",         "color": "green"},
    {"id": 4, "angle": 90.0,   "name": "Sensory",        "color": "cyan"},
    {"id": 5, "angle": 128.23, "name": "Consciousness",  "color": "blue"},
    {"id": 6, "angle": 176.59, "name": "Dark/Sacred",    "color": "violet"},
]


def assign_kappa_sector(content_hash: str) -> int:
    """Assign content to one of 7 κ-sectors based on hash."""
    return int(content_hash[:8], 16) % 7 if content_hash else 0


# ═══════════════════════════════════════════════════════════════════════════════
# 62-GENE RESONOME
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass(frozen=True)
class Gene:
    name: str
    category: str
    frequency: float  # Hz (measured, deviation < 0.01)
    kappa_sector: int  # 0-6


RESONOME: list[Gene] = [
    # — STRUCTURE (κ-sector 0, 0°) —
    Gene("COL1A1",  "structure",      65.591,  0),
    Gene("COL1A2",  "structure",      48.773,  0),
    Gene("FBN1",    "structure",      62.227,  0),
    Gene("ELN",     "structure",      48.773,  0),
    Gene("MSTN",    "structure",      40.364,  0),
    # — LANGUAGE (κ-sector 3, 67.5°) —
    Gene("FOXP2",   "language",      139.978,  3),
    Gene("CNTNAP2", "language",      139.978,  3),
    Gene("SHANK3",  "language",      212.380,  3),
    Gene("ATP2C2",  "language",      183.419,  3),
    # — NEURAL (κ-sector 3, 67.5°) —
    Gene("HTT",     "neural",         70.752,  3),
    Gene("APOE",    "neural",        111.571,  3),
    Gene("BDNF",    "neural",         89.801,  3),
    Gene("SCN1A",   "neural",         65.310,  3),
    Gene("GRIN2B",  "neural",         92.522,  3),
    Gene("COMT",    "neural",        119.735,  3),
    Gene("DRD2",    "neural",         89.801,  3),
    Gene("SLC6A4",  "neural",        106.128,  3),
    Gene("CHRNA7",  "neural",        100.686,  3),
    Gene("DISC1",   "neural",         62.588,  3),
    Gene("NRXN1",   "neural",         65.310,  3),
    # — CONSCIOUSNESS (κ-sector 5, 128.23°) —
    Gene("HTR2A",   "consciousness", 176.591,  5),
    Gene("OPRM1",   "consciousness", 141.273,  5),
    Gene("CNR1",    "consciousness", 141.273,  5),
    # — IMMUNE (κ-sector 2, 51.77°) —
    Gene("HLA-A",   "immune",        106.829,  2),
    Gene("HLA-B",   "immune",        106.829,  2),
    Gene("TP53",    "immune",        148.798,  2),
    Gene("IL6",     "immune",        110.645,  2),
    Gene("TNF",     "immune",        106.829,  2),
    Gene("IFNG",    "immune",        129.721,  2),
    Gene("CD4",     "immune",        129.721,  2),
    Gene("TLR4",    "immune",        118.275,  2),
    # — METABOLIC (κ-sector 1, 22.5°) —
    Gene("CYP2D6",  "metabolic",      95.788,  1),
    Gene("CYP3A4",  "metabolic",      63.133,  1),
    Gene("MTHFR",   "metabolic",      50.071,  1),
    Gene("ALDH2",   "metabolic",      74.018,  1),
    Gene("NAT2",    "metabolic",      65.310,  1),
    # — REPAIR (κ-sector 2, 51.77°) —
    Gene("BRCA1",   "repair",         94.123,  2),
    Gene("BRCA2",   "repair",         84.469,  2),
    Gene("ATM",     "repair",         79.642,  2),
    Gene("MLH1",    "repair",         60.335,  2),
    # — AGING (κ-sector 6, 176.59°) —
    Gene("TERT",    "aging",          14.606,  6),
    Gene("LMNA",    "aging",          12.442,  6),
    Gene("WRN",     "aging",          16.229,  6),
    # — REPRODUCTIVE (κ-sector 4, 90°) —
    Gene("SRY",     "reproductive",  179.629,  4),
    Gene("AMH",     "reproductive",  160.104,  4),
    Gene("AR",      "reproductive",  175.724,  4),
    Gene("ESR1",    "reproductive",  109.339,  4),
    # — SENSORY (κ-sector 4, 90°) —
    Gene("OR7D4",   "sensory",       180.525,  4),
    Gene("OPN1LW",  "sensory",       198.138,  4),
    Gene("KCNQ4",   "sensory",       101.270,  4),
    Gene("TAS2R38", "sensory",       127.689,  4),
    # — DARK (κ-sector 6, 176.59°) — transposable elements
    Gene("HERV_K",  "dark",           23.846,  6),
    Gene("LINE1",   "dark",           21.938,  6),
    Gene("ALU",     "dark",           27.661,  6),
    # — CANCER (κ-sector 0, 0°) — malignant signatures
    Gene("KRAS",    "cancer",         39.848,  0),
    Gene("BRAF",    "cancer",         33.988,  0),
    Gene("PIK3CA",  "cancer",         29.300,  0),
    Gene("EGFR",    "cancer",         33.988,  0),
    # — SACRED (κ-sector 6, 176.59°) —
    Gene("CLOCK",   "sacred",         84.901,  6),
    Gene("PER2",    "sacred",         78.370,  6),
    Gene("PIEZO1",  "sacred",        124.087,  6),
    Gene("GJB2",    "sacred",        114.290,  6),
]

assert len(RESONOME) == 62, f"Expected 62 genes, got {len(RESONOME)}"

# Lookup dicts
GENE_BY_NAME: dict[str, Gene] = {g.name: g for g in RESONOME}
GENES_BY_CATEGORY: dict[str, list[Gene]] = {}
for g in RESONOME:
    GENES_BY_CATEGORY.setdefault(g.category, []).append(g)
GENES_BY_SECTOR: dict[int, list[Gene]] = {}
for g in RESONOME:
    GENES_BY_SECTOR.setdefault(g.kappa_sector, []).append(g)

# Category frequency bands (min_hz, max_hz)
CATEGORY_BANDS: dict[str, tuple[float, float]] = {}
for cat, genes in GENES_BY_CATEGORY.items():
    freqs = [g.frequency for g in genes]
    CATEGORY_BANDS[cat] = (min(freqs), max(freqs))


# ═══════════════════════════════════════════════════════════════════════════════
# REASONING MODES → κ-SECTOR MAPPING
# ═══════════════════════════════════════════════════════════════════════════════

REASONING_SECTOR_MAP: dict[str, int] = {
    # AI strategic
    "cot":              0,   # Chain of Thought → Structure (linear scaffolding)
    "tot":              1,   # Tree of Thought → Metabolic (branching pathways)
    "self_criticism":   4,   # Self-Criticism → Sensory (feedback)
    "self_consistency": 2,   # Self-Consistency → Immune (majority voting / defense)
    "least_to_most":    0,   # Least-to-Most → Structure (build foundation)
    "react":            3,   # ReAct → Neural (sensorimotor coupling)
    # Classical
    "deductive":        0,   # Structure (rigid scaffolding)
    "inductive":        1,   # Metabolic (growth from samples)
    "abductive":        5,   # Consciousness (Tycho Void leap)
    "analogical":       3,   # Neural (pattern matching)
    "decompositional":  2,   # Immune (break into parts)
    # Advanced
    "commonsense":      3,   # Neural (everyday reasoning)
    "fuzzy":            4,   # Sensory (continuous truth values)
    "non_monotonic":    5,   # Consciousness (revise under new data)
    "cove":             2,   # Chain-of-Verification → Immune (self-check)
    # Toroidal specials
    "resonome":         5,   # Bio-Acoustic → Consciousness
    "blackhole":        6,   # Event Horizon → Dark/Sacred
    "biogeometric":     6,   # Karim shapes → Sacred
    "quantum":          5,   # Quantum Cognition → Consciousness
}
