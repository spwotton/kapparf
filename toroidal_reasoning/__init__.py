"""
Toroidal Reasoning Engine — Ω-GOS v13.0
========================================
A multi-modal reasoning orchestrator that chains 15+ reasoning types
through a 62-gene resonome, Base-53 topology, and κ-scaled document
genome analysis.

Usage:
    from toroidal_reasoning import ToroidalEngine
    engine = ToroidalEngine()
    result = engine.reason("What causes quantum decoherence?", modes=["abductive", "cot", "react"])
    
CLI:
    python -m toroidal_reasoning reason "query" --modes cot tot abductive
    python -m toroidal_reasoning genome path/to/document.txt
    python -m toroidal_reasoning ingest path/to/folder
    python -m toroidal_reasoning search "query"
"""

from toroidal_reasoning.engine import ToroidalEngine
from toroidal_reasoning.constants import RESONOME, GOS, BASE53_SYMBOLS

__version__ = "0.1.0"
__all__ = ["ToroidalEngine", "RESONOME", "GOS", "BASE53_SYMBOLS"]
