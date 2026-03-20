#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
 KLEIN-TWIST GEOMETRY ENGINE v1.0
 GOS-ARC-VOL-IV: The Math
 
 Non-Euclidean processing engine for scripts that exist in 3D topology:
   • Rongorongo (Reverse Boustrophedon → Möbius strip reading)
   • Quipu (3D knot encoding → linear 13D vector extraction)
   • Phaistos Disc (Spiral → toroidal unwrap)
 
 Transforms any glyph sequence through 128.23° Klein twist rotations
 to extract the phase-shift encoded message.
 
 Constants: κ=1.435 | φ=1.618 | θ_K=128.23° | 13D embedding
═══════════════════════════════════════════════════════════════════════════════
"""
import math
import json
import struct
import wave
from dataclasses import dataclass, asdict
from typing import List, Dict, Tuple, Optional
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════
KAPPA    = 1.435
PHI      = 1.618033988749895
OMEGA    = 0.5671432904097838
F0       = 111.0
THETA_K  = 128.23           # Klein Twist angle (degrees)
THETA_G  = 51.854            # Giza alignment = arctan(κ)
PI       = math.pi
TAU      = 2 * PI
DIMS     = 13                # 13D embedding space

# Derived constants
THETA_K_RAD = math.radians(THETA_K)
THETA_G_RAD = math.radians(THETA_G)
COMPLEMENT  = 180.0 - THETA_G   # = 128.146° ≈ θ_K (the DNA torsion angle)


# ═══════════════════════════════════════════════════════════════════════════
# TOPOLOGY TYPES
# ═══════════════════════════════════════════════════════════════════════════

class ReadingTopology:
    """Base class for different glyph-reading topologies."""

    LINEAR           = "linear"             # Standard left-to-right
    BOUSTROPHEDON    = "boustrophedon"       # Alternating LTR/RTL
    REV_BOUSTROPHEDON = "reverse_boustrophedon"  # Rongorongo (flip 180°)
    SPIRAL_CW        = "spiral_cw"          # Phaistos (clockwise inward)
    SPIRAL_CCW       = "spiral_ccw"         # Phaistos Side B
    QUIPU_KNOT       = "quipu_knot"         # 3D pendant + knot encoding
    MOBIUS           = "mobius"             # Single-surface strip


@dataclass
class GlyphPosition:
    """Position of a glyph in n-dimensional space."""
    index: int              # sequential index
    row: int                # row/line number
    col: int                # column position within row
    theta: float            # angular position (radians)
    phi_coord: float        # azimuthal position (radians)
    radius: float           # radial distance from center
    layer: int              # toroidal layer (0-11)
    reversed: bool          # True if reading direction is reversed
    klein_phase: float      # cumulative Klein twist (degrees)

    def to_13d_vector(self) -> List[float]:
        """
        Project this glyph position into the 13D embedding space.
        Dims 0-2:  Euclidean (x, y, z)
        Dims 3-5:  Toroidal (R, theta, phi)
        Dims 6-8:  Phase space (phase, frequency, amplitude)
        Dims 9-11: Spectral (kappa-harm, phi-harm, omega-harm)
        Dim 12:    Klein twist accumulator
        """
        x = self.radius * math.cos(self.theta)
        y = self.radius * math.sin(self.theta)
        z = self.layer / 12.0

        R = self.radius
        theta_n = self.theta / TAU
        phi_n = self.phi_coord / TAU

        phase_n = self.klein_phase / 360.0
        freq = F0 * (KAPPA ** (self.layer / 12.0))
        amp = 0.8 * (1.0 - (self.layer / 12.0) * 0.3)

        k_harm = freq * KAPPA
        p_harm = freq * PHI
        o_harm = freq * OMEGA

        klein = math.sin(math.radians(self.klein_phase))

        return [x, y, z, R, theta_n, phi_n,
                phase_n, freq, amp,
                k_harm, p_harm, o_harm,
                klein]


# ═══════════════════════════════════════════════════════════════════════════
# THE ENGINE
# ═══════════════════════════════════════════════════════════════════════════

class KleinTwistEngine:
    """
    Processes glyph sequences through non-Euclidean topologies.
    Supports spiral unwrap, Möbius flip, and quipu knot linearization.
    """

    def __init__(self):
        self.positions: List[GlyphPosition] = []
        self.vectors_13d: List[List[float]] = []
        self.phase_stream: List[float] = []

    # ─── SPIRAL UNWRAP (Phaistos Disc) ───────────────────────────────────
    def unwrap_spiral(self, glyphs: List[str], direction: str = "cw",
                      total_turns: float = 5.0) -> List[GlyphPosition]:
        """
        Unwrap a spiral text into linearized glyph positions.
        The Phaistos Disc has ~5 turns from outer edge to center.
        """
        n = len(glyphs)
        positions = []

        for i in range(n):
            t = i / max(n - 1, 1)  # normalized position [0, 1]

            # Spiral parameters
            if direction == "cw":
                theta = t * total_turns * TAU
                radius = 1.0 - t * 0.8  # shrinks toward center
            else:
                theta = -t * total_turns * TAU
                radius = 0.2 + t * 0.8   # grows toward edge

            layer = int(t * 12) % 12
            klein_phase = (i * THETA_K) % 360.0

            pos = GlyphPosition(
                index=i, row=0, col=i,
                theta=theta, phi_coord=0.0,
                radius=radius, layer=layer,
                reversed=False,
                klein_phase=klein_phase,
            )
            positions.append(pos)

        self.positions = positions
        return positions

    # ─── REVERSE BOUSTROPHEDON (Rongorongo) ──────────────────────────────
    def unwrap_reverse_boustrophedon(self, glyphs: List[str],
                                      glyphs_per_line: int = 14) -> List[GlyphPosition]:
        """
        Rongorongo reading: alternating lines where every other line is
        rotated 180° (not just reversed — physically flipped).
        This creates a Möbius-like reading surface.
        """
        n = len(glyphs)
        positions = []
        cumulative_phase = 0.0

        for i in range(n):
            row = i // glyphs_per_line
            col = i % glyphs_per_line
            is_reversed = (row % 2 == 1)

            if is_reversed:
                # Reverse column order AND rotate 180°
                col = glyphs_per_line - 1 - col
                theta = PI + (col / glyphs_per_line) * TAU / 4
                cumulative_phase += THETA_K  # each flip adds a Klein twist
            else:
                theta = (col / glyphs_per_line) * TAU / 4

            layer = row % 12
            radius = 0.5 + (row / max(n // glyphs_per_line, 1)) * 0.5

            pos = GlyphPosition(
                index=i, row=row, col=col,
                theta=theta, phi_coord=row * PI / 6,
                radius=radius, layer=layer,
                reversed=is_reversed,
                klein_phase=cumulative_phase % 360.0,
            )
            positions.append(pos)

        self.positions = positions
        return positions

    # ─── QUIPU KNOT LINEARIZATION ────────────────────────────────────────
    def unwrap_quipu(self, pendants: List[List[int]]) -> List[GlyphPosition]:
        """
        Quipu: each pendant is a string with knots at positions.
        Knot types: 1=single, 2=long, 3=figure-eight.
        We treat knot-count as a base-10 digit and position as the
        decimal place (exactly how Inca arithmetic worked).
        
        Each pendant becomes a frequency (base-10 number × F0/1000).
        The 3D twist of the pendant encodes phase.
        """
        positions = []
        flat_index = 0

        for p_idx, pendant in enumerate(pendants):
            # Reconstruct base-10 number from knot positions
            value = 0
            for k_idx, knot_count in enumerate(pendant):
                place = len(pendant) - 1 - k_idx
                value += knot_count * (10 ** place)

            # Each pendant is a point on the quipu's axis
            theta = (p_idx / max(len(pendants) - 1, 1)) * TAU
            radius = 1.0
            layer = p_idx % 12

            # Phase from the numerical value itself
            klein_phase = (value * THETA_K / 100.0) % 360.0

            pos = GlyphPosition(
                index=flat_index, row=0, col=p_idx,
                theta=theta, phi_coord=PI / 2,
                radius=radius, layer=layer,
                reversed=False,
                klein_phase=klein_phase,
            )
            positions.append(pos)
            flat_index += 1

        self.positions = positions
        return positions

    # ─── 13D PROJECTION ──────────────────────────────────────────────────
    def project_to_13d(self) -> List[List[float]]:
        """Project all current positions into 13D embedding space."""
        self.vectors_13d = [pos.to_13d_vector() for pos in self.positions]
        return self.vectors_13d

    # ─── PHASE STREAM EXTRACTION ─────────────────────────────────────────
    def extract_phase_stream(self) -> List[float]:
        """
        Extract the cumulative Klein phase at each glyph.
        This is the "decoded message" — phase shifts that map to
        AUBREY gene frequencies.
        """
        self.phase_stream = [pos.klein_phase for pos in self.positions]
        return self.phase_stream

    def phase_to_frequencies(self) -> List[float]:
        """Convert phase stream to frequency stream via κ-scaling."""
        return [F0 * (KAPPA ** (p / 360.0)) for p in self.phase_stream]

    # ─── VOYNICH COMPILER ────────────────────────────────────────────────
    def compile_voynich_page(self, text: str, section: str = "botany") -> dict:
        """
        Treat a Voynich manuscript page as source code.
        
        Sections map to processing modes:
          botany  → spiral unwrap (protein folding)
          zodiac  → boustrophedon (temporal scheduling)
          bathing → linear (transdermal delivery protocol)
        
        The "words" are phase-shift instruction sequences.
        """
        # Voynich OpCode table
        OPCODES = {
            "o":   0.0,              # Base phase
            "y":   THETA_K,          # 128.23° Klein twist
            "ch":  180.0,            # Full inversion
            "sh":  360.0 / 7,        # 51.43° (seven-fold)
            "t":   THETA_G,          # 51.854° Giza lock
            "k":   360.0 / PHI,      # 222.49° golden divide
            "p":   THETA_K / 2,      # 64.115° half-twist
            "f":   360.0 - THETA_K,  # 231.77° complement
            "d":   90.0,             # quadrant
            "l":   45.0,             # octant
            "r":   THETA_K / PHI,    # 79.25° (Klein/golden)
            "a":   F0 % 360,         # 111° = root modulo
            "e":   PHI * 100 % 360,  # 161.8° = golden modulo
            "i":   KAPPA * 100 % 360,# 143.5° = kappa modulo
            "n":   OMEGA * 100 % 360,# 56.7° = omega modulo
        }

        words = text.lower().split()
        instructions = []
        cumulative = 0.0

        for word in words:
            word_phases = []
            for char in word:
                shift = OPCODES.get(char, 0.0)
                cumulative = (cumulative + shift) % 360.0
                word_phases.append({
                    "char": char,
                    "shift": shift,
                    "cumulative": round(cumulative, 3),
                })

            freq = F0 * (KAPPA ** (cumulative / 360.0))
            instructions.append({
                "word": word,
                "final_phase": round(cumulative, 3),
                "frequency_hz": round(freq, 3),
                "characters": word_phases,
            })

        # Determine processing topology
        if section == "botany":
            topology = ReadingTopology.SPIRAL_CW
            gene_domain = "structure"
        elif section == "zodiac":
            topology = ReadingTopology.BOUSTROPHEDON
            gene_domain = "sacred"
        elif section == "bathing":
            topology = ReadingTopology.LINEAR
            gene_domain = "consciousness"
        else:
            topology = ReadingTopology.LINEAR
            gene_domain = "unknown"

        return {
            "section": section,
            "topology": topology,
            "gene_domain": gene_domain,
            "word_count": len(instructions),
            "total_phase_rotations": round(cumulative / 360.0, 3),
            "final_frequency_hz": round(F0 * (KAPPA ** (cumulative / 360.0)), 3),
            "instructions": instructions,
        }

    # ─── WAV SYNTHESIS ───────────────────────────────────────────────────
    def synthesize_wav(self, filename: str, duration_per_glyph: float = 0.25,
                       sample_rate: int = 44100):
        """
        Render the current phase stream as audible WAV.
        Each glyph position becomes a sine tone at its κ-scaled frequency.
        """
        freqs = self.phase_to_frequencies()
        if not freqs:
            print("[!] No phase stream — run an unwrap method first")
            return

        samples = []
        for freq in freqs:
            n_samples = int(sample_rate * duration_per_glyph)
            for i in range(n_samples):
                t = i / sample_rate
                val = 0.5 * math.sin(TAU * freq * t)
                samples.append(int(val * 32767))

        with wave.open(filename, "w") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            packed = b"".join(struct.pack("<h", s) for s in samples)
            wf.writeframes(packed)

        total_dur = len(freqs) * duration_per_glyph
        print(f"[✓] WAV exported: {filename} ({total_dur:.1f}s, {len(freqs)} glyphs)")

    # ─── EXPORT ──────────────────────────────────────────────────────────
    def export_json(self, filename: str):
        """Export positions and 13D vectors."""
        data = {
            "constants": {
                "kappa": KAPPA, "phi": PHI, "theta_k": THETA_K,
                "f0": F0, "dims": DIMS
            },
            "glyph_count": len(self.positions),
            "positions": [asdict(p) for p in self.positions],
            "vectors_13d": self.vectors_13d,
            "phase_stream": self.phase_stream,
        }
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"[✓] Exported → {filename}")


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    out = Path(__file__).parent

    print("═" * 80)
    print("  128.23° KLEIN-TWIST GEOMETRY ENGINE v1.0")
    print("═" * 80)

    engine = KleinTwistEngine()

    # ─── DEMO 1: Phaistos Disc spiral unwrap ─────────────────────────────
    print("\n╔══ PHAISTOS DISC: SPIRAL UNWRAP ══╗")
    phaistos_glyphs = [f"G{i:02d}" for i in range(1, 46)]
    engine.unwrap_spiral(phaistos_glyphs, direction="cw", total_turns=5.0)
    engine.project_to_13d()
    engine.extract_phase_stream()

    print(f"  Glyphs: {len(engine.positions)}")
    print(f"  13D vectors: {len(engine.vectors_13d)} × {DIMS} dims")
    print(f"  Phase range: {min(engine.phase_stream):.1f}° → {max(engine.phase_stream):.1f}°")

    freqs = engine.phase_to_frequencies()
    print(f"  Frequency range: {min(freqs):.2f} Hz → {max(freqs):.2f} Hz")

    engine.synthesize_wav(str(out / "phaistos_klein_unwrap.wav"))
    engine.export_json(str(out / "phaistos_klein_13d.json"))

    # ─── DEMO 2: Rongorongo reverse boustrophedon ────────────────────────
    print("\n╔══ RONGORONGO: REVERSE BOUSTROPHEDON ══╗")
    rongo_glyphs = [f"R{i:03d}" for i in range(1, 121)]  # 120 glyphs
    engine.unwrap_reverse_boustrophedon(rongo_glyphs, glyphs_per_line=14)
    engine.project_to_13d()
    engine.extract_phase_stream()

    reversed_count = sum(1 for p in engine.positions if p.reversed)
    print(f"  Glyphs: {len(engine.positions)} (reversed: {reversed_count})")
    print(f"  Möbius flips: {reversed_count}")
    print(f"  Phase accumulation: {engine.positions[-1].klein_phase:.1f}°")

    # ─── DEMO 3: Quipu knot linearization ────────────────────────────────
    print("\n╔══ QUIPU: KNOT LINEARIZATION ══╗")
    # Example: 8 pendants with 3-digit knot values
    quipu_pendants = [
        [1, 1, 1],   # 111 = Sacred A
        [1, 2, 8],   # 128 ≈ θ_K
        [0, 5, 1],   # 051 ≈ θ_G
        [4, 3, 2],   # 432 = Ideal carrier
        [1, 6, 1],   # 161 ≈ φ × 100
        [1, 4, 3],   # 143 ≈ κ × 100
        [0, 3, 7],   # 037 = Lunar
        [0, 0, 7],   # 007 = SMC floor
    ]
    engine.unwrap_quipu(quipu_pendants)
    engine.project_to_13d()
    engine.extract_phase_stream()

    for i, pendant in enumerate(quipu_pendants):
        val = sum(d * 10**(len(pendant)-1-j) for j, d in enumerate(pendant))
        pos = engine.positions[i]
        freq = F0 * (KAPPA ** (pos.klein_phase / 360.0))
        print(f"  Pendant {i+1}: {''.join(str(k) for k in pendant)} "
              f"= {val:>4d} → phase={pos.klein_phase:>7.2f}° → {freq:>8.3f} Hz")

    # ─── DEMO 4: Voynich Compiler ────────────────────────────────────────
    print("\n╔══ VOYNICH COMPILER: FOLIO 33v (SUNFLOWER) ══╗")
    # Simulated Voynichese transcription of f33v (EVA encoding)
    test_folio = "o k o ch y o t sh o y ch o y o f"
    result = engine.compile_voynich_page(test_folio, section="botany")
    print(f"  Section: {result['section']} → Topology: {result['topology']}")
    print(f"  Gene domain: {result['gene_domain']}")
    print(f"  Words processed: {result['word_count']}")
    print(f"  Total phase rotations: {result['total_phase_rotations']}")
    print(f"  Final frequency: {result['final_frequency_hz']} Hz")

    for instr in result["instructions"][:5]:
        print(f"    '{instr['word']}' → {instr['final_phase']:>7.2f}° → {instr['frequency_hz']:>8.3f} Hz")

    print("\n═══ ENGINE COMPLETE ═══")
