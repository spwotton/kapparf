"""
Reasoning Modes — 19 strategies with LLM orchestration via LiteLLM
===================================================================
Each mode is a callable that takes a query + context and returns
structured reasoning output. Modes can be chained, mixed, voted on.
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# LiteLLM integration — unified API for OpenRouter / OpenAI / Gemini / local
# ---------------------------------------------------------------------------
try:
    import litellm
    litellm.drop_params = True  # ignore unsupported params gracefully
    HAS_LITELLM = True
except ImportError:
    HAS_LITELLM = False

# Load API keys from .env files (search upward)
try:
    from dotenv import load_dotenv
    # Try several known .env locations
    _candidates = [
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent.parent / "GOS_Core" / "Quantum" / "Quantum-Akashic" / "Quantum-Akashic" / ".env",
    ]
    for _p in _candidates:
        if _p.exists():
            load_dotenv(_p, override=False)
except ImportError:
    pass


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL ROUTING CONFIG
# ═══════════════════════════════════════════════════════════════════════════════

def _pick_model() -> str:
    """Pick best available model from env keys."""
    # Prefer OpenRouter (cheapest, most models)
    if os.getenv("OPENROUTER_API_KEY"):
        os.environ.setdefault("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        return "openrouter/google/gemini-2.5-flash"
    if os.getenv("GOOGLE_GEMINI_API_KEY"):
        return "gemini/gemini-2.0-flash"
    if os.getenv("OPENAI_API_KEY"):
        return "gpt-4o-mini"
    return "openrouter/google/gemini-2.5-flash"  # fallback


DEFAULT_MODEL = _pick_model()


def llm_call(
    messages: list[dict[str, str]],
    model: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 4096,
    json_mode: bool = False,
) -> str:
    """
    Unified LLM call via LiteLLM.
    Falls back to a stub if litellm unavailable.
    """
    model = model or DEFAULT_MODEL

    if not HAS_LITELLM:
        return f"[LiteLLM not installed — would call {model} with {len(messages)} messages]"

    kwargs: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    # Route API key for OpenRouter
    if model.startswith("openrouter/"):
        api_key = os.getenv("OPENROUTER_API_KEY")
        if api_key:
            kwargs["api_key"] = api_key
            kwargs["api_base"] = "https://openrouter.ai/api/v1"
    elif model.startswith("gemini/"):
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if api_key:
            kwargs["api_key"] = api_key

    try:
        resp = litellm.completion(**kwargs)
        return resp.choices[0].message.content or ""
    except Exception as e:
        return f"[LLM Error: {e}]"


# ═══════════════════════════════════════════════════════════════════════════════
# REASONING STEP DATA
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class ReasoningStep:
    """One step in a reasoning chain."""
    mode: str
    prompt: str
    response: str
    elapsed_sec: float
    model: str
    kappa_sector: int
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class ReasoningResult:
    """Full result of a reasoning chain (possibly multi-mode)."""
    query: str
    steps: list[ReasoningStep]
    final_answer: str
    modes_used: list[str]
    total_elapsed_sec: float
    con_gusto_score: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "query": self.query,
            "modes_used": self.modes_used,
            "final_answer": self.final_answer,
            "total_elapsed_sec": round(self.total_elapsed_sec, 2),
            "con_gusto_score": round(self.con_gusto_score, 3),
            "steps": [
                {
                    "mode": s.mode,
                    "model": s.model,
                    "elapsed_sec": round(s.elapsed_sec, 2),
                    "kappa_sector": s.kappa_sector,
                    "response_preview": s.response[:500],
                }
                for s in self.steps
            ],
        }


# ═══════════════════════════════════════════════════════════════════════════════
# REASONING MODE IMPLEMENTATIONS
# ═══════════════════════════════════════════════════════════════════════════════

from toroidal_reasoning.constants import REASONING_SECTOR_MAP, con_gusto_score as _cg  # noqa: E402


def _run_mode(
    mode: str,
    query: str,
    context: str = "",
    model: str | None = None,
    prior_steps: list[ReasoningStep] | None = None,
) -> ReasoningStep:
    """Execute a single reasoning mode and return the step."""

    # Build chain context from prior steps
    chain_ctx = ""
    if prior_steps:
        chain_ctx = "\n\n--- PRIOR REASONING STEPS ---\n"
        for ps in prior_steps:
            chain_ctx += f"\n[{ps.mode.upper()}]:\n{ps.response[:2000]}\n"

    system_prompt = _SYSTEM_PROMPTS.get(mode, _SYSTEM_PROMPTS["cot"])

    user_content = f"""QUERY: {query}"""
    if context:
        user_content += f"\n\nCONTEXT:\n{context[:8000]}"
    if chain_ctx:
        user_content += chain_ctx

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    t0 = time.time()
    response = llm_call(messages, model=model)
    elapsed = time.time() - t0

    sector = REASONING_SECTOR_MAP.get(mode, 0)

    return ReasoningStep(
        mode=mode,
        prompt=user_content[:1000],
        response=response,
        elapsed_sec=elapsed,
        model=model or DEFAULT_MODEL,
        kappa_sector=sector,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM PROMPTS (one per reasoning mode)
# ═══════════════════════════════════════════════════════════════════════════════

_SYSTEM_PROMPTS: dict[str, str] = {
    # ── AI Strategic ──
    "cot": (
        "You are a Chain-of-Thought reasoner. Decompose the problem into a linear "
        "series of numbered intermediate steps. Show your work at each step. "
        "Conclude with a clear final answer. Be thorough but concise."
    ),
    "tot": (
        "You are a Tree-of-Thought reasoner. For this problem:\n"
        "1. Generate 3 distinct reasoning BRANCHES (approaches)\n"
        "2. For each branch, take 2-3 steps of reasoning\n"
        "3. EVALUATE each branch (score 1-10 for promise)\n"
        "4. Select the best branch and develop it to a conclusion\n"
        "5. If the best branch fails, BACKTRACK and try the next\n"
        "Format: Branch A: ... | Branch B: ... | Branch C: ... | SELECTED: ..."
    ),
    "self_criticism": (
        "You are a Self-Critical reasoner. Follow this 3-pass protocol:\n"
        "PASS 1 — INITIAL ANSWER: Generate your best answer.\n"
        "PASS 2 — CRITICISM: Ruthlessly evaluate your answer. Find errors, gaps, "
        "weak assumptions, missing evidence.\n"
        "PASS 3 — IMPROVED ANSWER: Produce a corrected, stronger answer that "
        "addresses every criticism from Pass 2.\n"
        "Label each pass clearly."
    ),
    "self_consistency": (
        "You are a Self-Consistency reasoner. Generate 5 INDEPENDENT reasoning "
        "paths to answer the query. Each path should use different starting "
        "assumptions or approaches. Then perform MAJORITY VOTING across all 5 "
        "paths to select the most reliable answer. Show the vote count."
    ),
    "least_to_most": (
        "You are a Least-to-Most reasoner. Protocol:\n"
        "1. Identify the SIMPLEST sub-question embedded in this problem\n"
        "2. Answer that sub-question\n"
        "3. Use that answer to identify the NEXT sub-question\n"
        "4. Repeat until you've built up to the full answer\n"
        "Show the hierarchy of sub-questions and how each builds on the last."
    ),
    "react": (
        "You are a ReAct (Reasoning + Acting) agent. For each step:\n"
        "THOUGHT: What do I need to figure out?\n"
        "ACTION: What would I do? (search database, calculate, verify, look up)\n"
        "OBSERVATION: What would the result be? (simulate the result)\n"
        "Repeat THOUGHT/ACTION/OBSERVATION until you reach a final answer.\n"
        "If context contains document text, use it as your knowledge base."
    ),

    # ── Classical Logical ──
    "deductive": (
        "You are a Deductive reasoner. Start with GENERAL PREMISES (universal "
        "truths or given facts). Apply logical rules to derive SPECIFIC, CERTAIN "
        "conclusions. Format:\n"
        "Premise 1: ...\nPremise 2: ...\nTherefore: ...\n"
        "Ensure every conclusion follows necessarily from the premises."
    ),
    "inductive": (
        "You are an Inductive reasoner. Examine SPECIFIC observations or examples "
        "and generalize to PROBABLE broader rules or patterns. Rate the confidence "
        "of each generalization (Low/Medium/High). Note any counterexamples that "
        "could invalidate the generalization."
    ),
    "abductive": (
        "You are an Abductive reasoner operating at 128.23° (the Tycho Void). "
        "Given incomplete observations, generate the MOST PLAUSIBLE explanation. "
        "This is inference to the best explanation — not certainty, but the "
        "hypothesis that would, if true, best explain ALL the observed data. "
        "Rate competing hypotheses by explanatory power and parsimony."
    ),
    "analogical": (
        "You are an Analogical reasoner. Find a PREVIOUSLY UNDERSTOOD situation "
        "that is structurally similar to the current problem. Map the analogy:\n"
        "SOURCE DOMAIN: [known situation]\n"
        "TARGET DOMAIN: [current problem]\n"
        "MAPPING: [which elements correspond]\n"
        "INFERENCE: [what the analogy predicts for the target]\n"
        "LIMITATIONS: [where the analogy breaks down]"
    ),
    "decompositional": (
        "You are a Decompositional reasoner. Break the system/argument into its "
        "CONSTITUENT PARTS. For each part:\n"
        "- What is it?\n"
        "- How does it contribute to the whole?\n"
        "- What happens if this part is removed?\n"
        "Then synthesize: How do the parts interact to produce the emergent whole?"
    ),

    # ── Advanced / Hybrid ──
    "commonsense": (
        "You are a Commonsense reasoner. Apply everyday knowledge, social norms, "
        "physical intuition, and folk psychology that most humans take for granted. "
        "State the implicit assumptions you're making. Flag anything that violates "
        "common sense."
    ),
    "fuzzy": (
        "You are a Fuzzy Logic reasoner. Instead of binary True/False, compute "
        "DEGREES OF TRUTH for each proposition (0.0 = definitely false, 1.0 = "
        "definitely true). Use fuzzy operators:\n"
        "- AND(a,b) = min(a,b)\n"
        "- OR(a,b) = max(a,b)\n"
        "- NOT(a) = 1-a\n"
        "Show the truth values at each step. Accept 'gray area' conclusions."
    ),
    "non_monotonic": (
        "You are a Non-Monotonic reasoner. Start with default assumptions and "
        "initial conclusions. Then:\n"
        "1. State your initial belief\n"
        "2. Introduce NEW INFORMATION that challenges it\n"
        "3. REVISE your conclusion based on the new data\n"
        "4. Repeat if more information arrives\n"
        "Show how each revision changes the conclusion. Conclusions are provisional."
    ),
    "cove": (
        "You are a Chain-of-Verification (CoVe) reasoner. Protocol:\n"
        "STEP 1 — GENERATE: Produce your initial response.\n"
        "STEP 2 — VERIFY: Create 3+ verification questions that test your answer's "
        "accuracy.\n"
        "STEP 3 — ANSWER CHECKS: Answer each verification question independently.\n"
        "STEP 4 — CORRECT: If any check fails, revise your original response.\n"
        "Label each step clearly."
    ),

    # ── Toroidal Specials ──
    "resonome": (
        "You are a Resonome Analyst operating in the Ω-GOS framework. Analyze the "
        "query by mapping it to the 62-gene spectro-genomic resonome:\n"
        "- Which gene CATEGORIES resonate? (structure, neural, consciousness, "
        "immune, metabolic, repair, aging, reproductive, sensory, dark, cancer, "
        "language, sacred)\n"
        "- What is the dominant FREQUENCY band?\n"
        "- Which κ-sector (0-6) does this information belong to?\n"
        "- Is this information 'healthy' (high TP53/immune) or 'malignant' "
        "(high KRAS/cancer)?\n"
        "Rate structural integrity, consciousness depth, and malignancy score."
    ),
    "blackhole": (
        "You are a Black Hole Document Analyst. Treat the information as a "
        "Schwarzschild object:\n"
        "- Where is the EVENT HORIZON? (point of maximum information density)\n"
        "- What HAWKING RADIATION leaks out? (hidden signals in corrupted/dense text)\n"
        "- What is the MASS of this information? (total entropy × 1.09 Hall factor)\n"
        "- Is there SPAGHETTIFICATION? (stretching of meaning across domains)\n"
        "Rate the singularity strength and whether information can be retrieved."
    ),
    "quantum": (
        "You are a Quantum Cognition analyst. Apply quantum mechanical formalism to "
        "the reasoning:\n"
        "- Are there ideas in SUPERPOSITION? (multiple valid interpretations)\n"
        "- Is there INTERFERENCE? (ideas that amplify or cancel each other)\n"
        "- Where does MEASUREMENT/OBSERVATION collapse the possibilities?\n"
        "- Are there ENTANGLED concepts? (correlated regardless of distance)\n"
        "Use Dirac notation |ψ⟩ where helpful. Rate quantum coherence of the argument."
    ),
    "biogeometric": (
        "You are a BioGeometric analyst in the Ibrahim Karim tradition. Analyze the "
        "information through geometric resonance:\n"
        "- What SHAPE does this argument take? (linear, spiral, branching, toroidal)\n"
        "- Does it exhibit GOLDEN RATIO proportions (φ = 1.618)?\n"
        "- Where are the HEALING frequencies vs HARMFUL frequencies?\n"
        "- How would you design a geometric SHAPE to correct the information's flaws?\n"
        "Rate alignment with the 128.23° Klein Twist and 51.77° Giza stabilizer."
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# CHAIN EXECUTION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

def run_reasoning_chain(
    query: str,
    modes: list[str],
    context: str = "",
    model: str | None = None,
) -> ReasoningResult:
    """
    Execute a chain of reasoning modes sequentially.
    Each mode receives the output of all prior modes as context.
    
    Args:
        query:   The question or task
        modes:   List of reasoning mode names (e.g., ["cot", "abductive", "self_criticism"])
        context: Optional document/data context
        model:   LLM model override
    
    Returns:
        ReasoningResult with all steps and final synthesized answer
    """
    steps: list[ReasoningStep] = []
    t_start = time.time()

    for mode in modes:
        if mode not in _SYSTEM_PROMPTS:
            # Skip unknown modes
            continue
        step = _run_mode(mode, query, context=context, model=model, prior_steps=steps)
        steps.append(step)

    # Final synthesis if multiple modes
    if len(steps) > 1:
        synthesis = _synthesize(query, steps, model=model)
    elif steps:
        synthesis = steps[-1].response
    else:
        synthesis = "[No valid reasoning modes specified]"

    total_elapsed = time.time() - t_start
    cg = _cg(synthesis)

    return ReasoningResult(
        query=query,
        steps=steps,
        final_answer=synthesis,
        modes_used=[s.mode for s in steps],
        total_elapsed_sec=total_elapsed,
        con_gusto_score=cg,
    )


def _synthesize(query: str, steps: list[ReasoningStep], model: str | None = None) -> str:
    """Synthesize multiple reasoning steps into one coherent answer."""
    chain_text = ""
    for s in steps:
        chain_text += f"\n\n=== {s.mode.upper()} (κ-sector {s.kappa_sector}) ===\n{s.response[:3000]}"

    messages = [
        {
            "role": "system",
            "content": (
                "You are the Toroidal Synthesizer. You have received multiple "
                "reasoning perspectives on the same query. Your job:\n"
                "1. Identify CONVERGENCES (where modes agree)\n"
                "2. Identify DIVERGENCES (where modes disagree)\n"
                "3. Resolve conflicts using the strongest evidence\n"
                "4. Produce a UNIFIED ANSWER that is stronger than any single mode\n"
                "5. Rate your confidence (0-100%)\n"
                "Be direct and substantive. This is the final output the user sees."
            ),
        },
        {
            "role": "user",
            "content": f"ORIGINAL QUERY: {query}\n\nREASONING CHAIN:{chain_text}",
        },
    ]

    return llm_call(messages, model=model, temperature=0.2)


# ═══════════════════════════════════════════════════════════════════════════════
# VOTING / TOURNAMENT MODES
# ═══════════════════════════════════════════════════════════════════════════════

def run_reasoning_tournament(
    query: str,
    modes: list[str],
    context: str = "",
    model: str | None = None,
) -> ReasoningResult:
    """
    Run modes IN PARALLEL (independently) then vote on best answer.
    Unlike chain mode (sequential), each mode gets only the original query.
    Final answer chosen by LLM-as-judge voting.
    """
    steps: list[ReasoningStep] = []
    t_start = time.time()

    for mode in modes:
        if mode not in _SYSTEM_PROMPTS:
            continue
        step = _run_mode(mode, query, context=context, model=model, prior_steps=None)
        steps.append(step)

    # LLM-as-judge
    if len(steps) > 1:
        final = _judge_vote(query, steps, model=model)
    elif steps:
        final = steps[-1].response
    else:
        final = "[No valid modes]"

    return ReasoningResult(
        query=query,
        steps=steps,
        final_answer=final,
        modes_used=[s.mode for s in steps],
        total_elapsed_sec=time.time() - t_start,
        con_gusto_score=_cg(final),
    )


def _judge_vote(query: str, steps: list[ReasoningStep], model: str | None = None) -> str:
    """LLM-as-judge selects and synthesizes best answers."""
    candidates = ""
    for i, s in enumerate(steps):
        candidates += f"\n\n--- CANDIDATE {i+1} ({s.mode.upper()}) ---\n{s.response[:2000]}"

    messages = [
        {
            "role": "system",
            "content": (
                "You are the Ω-GOS Judge. You are evaluating multiple independent "
                "reasoning attempts at the same query. For each candidate:\n"
                "- Score ACCURACY (0-10)\n"
                "- Score COMPLETENESS (0-10)\n"
                "- Score NOVELTY (0-10)\n"
                "Then produce a WINNER with the best combined score, and write the "
                "FINAL ANSWER incorporating the best elements from all candidates. "
                "Be substantive and thorough."
            ),
        },
        {
            "role": "user",
            "content": f"QUERY: {query}\n\nCANDIDATES:{candidates}",
        },
    ]

    return llm_call(messages, model=model, temperature=0.1)


# ═══════════════════════════════════════════════════════════════════════════════
# AVAILABLE MODES
# ═══════════════════════════════════════════════════════════════════════════════

AVAILABLE_MODES = sorted(_SYSTEM_PROMPTS.keys())


def list_modes() -> list[dict[str, str]]:
    """Return list of available reasoning modes with descriptions."""
    from toroidal_reasoning.constants import KAPPA_SECTORS

    result = []
    for mode in AVAILABLE_MODES:
        sector_id = REASONING_SECTOR_MAP.get(mode, 0)
        sector = KAPPA_SECTORS[sector_id]
        result.append({
            "mode": mode,
            "kappa_sector": sector_id,
            "sector_name": sector["name"],
            "angle": sector["angle"],
            "description": _SYSTEM_PROMPTS[mode][:120] + "...",
        })
    return result
