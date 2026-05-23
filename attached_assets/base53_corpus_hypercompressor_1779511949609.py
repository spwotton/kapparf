#!/usr/bin/env python3
"""Base53 corpus hyper-compressor for 100-1000+ PDF workflows.

Design goals:
- Accept folder OR zip as source input.
- Extract PDF text into retrieval-ready chunks.
- Produce a small discriminative semantic index (Base53-style sketch).
- Produce an optional lossless archive of original source PDFs.

This script uses a "discretion" heuristic: common/boilerplate tokens are
penalized via corpus-wide document frequency (IDF), preserving only
high-discrimination terms per chunk.
"""

from __future__ import annotations

import argparse
import csv
import json
import lzma
import math
import os
import re
import shutil
import tempfile
import zipfile
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    import pypdf
except ImportError as exc:
    raise SystemExit("pypdf is required. Install with: pip install pypdf") from exc

BASE53_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq"
TOKEN_RE = re.compile(r"[A-Za-z0-9_\-]{3,}")
GENE_ROW_RE = re.compile(r"\|\s*\*\*(?P<gene>[^*]+)\*\*\s*\|\s*(?P<kind>[^|]+?)\s*\|\s*(?P<freq>[0-9.]+)\s*\|")
TEXT_EXTENSIONS = {
    ".txt", ".md", ".markdown", ".json", ".csv", ".py", ".tex", ".log",
    ".yaml", ".yml", ".html", ".htm", ".js", ".ts", ".css", ".sh", ".ps1",
    ".ini", ".cfg", ".xml",
}
TYCHO_OUTER_EXCLUDED = {"linear_b", "linear_a", "brahmi", "indus"}
LANGUAGE_METADATA = {
    "sumerian": {"family": "language_isolate", "region": "mesopotamia", "mode": "cuneiform", "tonal": False},
    "hieroglyphs": {"family": "afroasiatic_script", "region": "nile_valley", "mode": "glyphic", "tonal": False},
    "aramaic_syriac": {"family": "semitic", "region": "levant", "mode": "liturgical", "tonal": False},
    "hebrew": {"family": "semitic", "region": "levant", "mode": "liturgical", "tonal": False},
    "arabic": {"family": "semitic", "region": "arabia", "mode": "living", "tonal": False},
    "geez_ethiopic": {"family": "semitic", "region": "horn_of_africa", "mode": "liturgical", "tonal": False},
    "sanskrit": {"family": "indo_aryan", "region": "south_asia", "mode": "classical", "tonal": False},
    "latin": {"family": "italic", "region": "mediterranean", "mode": "classical", "tonal": False},
    "greek": {"family": "hellenic", "region": "aegean", "mode": "axial", "tonal": False},
    "elder_futhark": {"family": "runic", "region": "north_europe", "mode": "archaic", "tonal": False},
    "younger_futhark": {"family": "runic", "region": "north_europe", "mode": "archaic", "tonal": False},
    "old_norse": {"family": "north_germanic", "region": "north_atlantic", "mode": "heroic", "tonal": False},
    "old_english": {"family": "west_germanic", "region": "britain", "mode": "archaic", "tonal": False},
    "welsh_celtic": {"family": "celtic", "region": "britain", "mode": "bardic", "tonal": False},
    "scots_gaelic": {"family": "celtic", "region": "highlands", "mode": "bardic", "tonal": False},
    "basque": {"family": "language_isolate", "region": "pyrenees", "mode": "rooted", "tonal": False},
    "catalan": {"family": "romance", "region": "iberia", "mode": "coastal", "tonal": False},
    "spanish": {"family": "romance", "region": "iberia_americas", "mode": "expansive", "tonal": False},
    "french": {"family": "romance", "region": "gaul", "mode": "continental", "tonal": False},
    "chinese": {"family": "sinitic", "region": "east_asia", "mode": "logographic", "tonal": True},
    "japanese": {"family": "japonic", "region": "east_asia", "mode": "moraic", "tonal": False},
    "swahili": {"family": "bantu", "region": "east_africa", "mode": "trade", "tonal": False},
    "quechua": {"family": "quechuan", "region": "andes", "mode": "altitude", "tonal": False},
    "english": {"family": "germanic_creole", "region": "global", "mode": "bridge", "tonal": False},
    "linear_b": {"family": "proto_script", "region": "aegean", "mode": "archive", "tonal": False},
    "linear_a": {"family": "proto_script", "region": "crete", "mode": "archive", "tonal": False},
    "brahmi": {"family": "abugida", "region": "south_asia", "mode": "seed_script", "tonal": False},
    "indus": {"family": "undeciphered", "region": "indus_valley", "mode": "seal_script", "tonal": False},
    "emoji": {"family": "symbolic", "region": "global_digital", "mode": "closure", "tonal": False},
}
SEMANTIC_EMOJI = {
    "quantum": "⚛️",
    "gene": "🧬",
    "genome": "🧬",
    "language": "🗣️",
    "signal": "📡",
    "entropy": "🌀",
    "resonance": "🎵",
    "geometry": "🔷",
    "lattice": "🕸️",
    "proof": "📐",
    "kappa": "κ",
    "phi": "φ",
    "omega": "Ω",
    "goose": "🪿",
}


@dataclass
class Chunk:
    chunk_id: str
    source_file: str
    start_page: int
    end_page: int
    char_count: int
    tokens: list[str]
    top_terms: list[str]
    simhash64: str
    text: str


@dataclass
class SourceAsset:
    path: str
    kind: str
    size_bytes: int


@dataclass
class SkippedAsset:
    path: str
    kind: str
    reason: str


def load_tycho_receipt(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_genome_resonome(path: Path) -> list[dict[str, Any]]:
    genes: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        match = GENE_ROW_RE.match(line.strip())
        if not match:
            continue
        genes.append(
            {
                "gene": match.group("gene").strip(),
                "kind": match.group("kind").strip(),
                "frequency_hz": float(match.group("freq")),
            }
        )
    return genes


def load_demodex_cycle(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8", errors="replace", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            parsed = dict(row)
            for key in ("day", "phase", "cycle_fraction", "gene_frequency_hz", "gene_phase_deg", "kappa_scale", "carrier_alignment_hz"):
                parsed[key] = float(parsed[key])
            rows.append(parsed)
    return rows


def to_base53(num: int) -> str:
    if num == 0:
        return BASE53_ALPHABET[0]
    out: list[str] = []
    n = num
    base = len(BASE53_ALPHABET)
    while n > 0:
        n, r = divmod(n, base)
        out.append(BASE53_ALPHABET[r])
    return "".join(reversed(out))


def stable_hash_64(s: str) -> int:
    # FNV-1a 64-bit
    h = 0xCBF29CE484222325
    for b in s.encode("utf-8", errors="ignore"):
        h ^= b
        h = (h * 0x100000001B3) & 0xFFFFFFFFFFFFFFFF
    return h


def simhash64(tokens: list[str]) -> int:
    vec = [0] * 64
    counts = Counter(tokens)
    for tok, w in counts.items():
        h = stable_hash_64(tok)
        for i in range(64):
            bit = (h >> i) & 1
            vec[i] += w if bit else -w
    out = 0
    for i, v in enumerate(vec):
        if v >= 0:
            out |= (1 << i)
    return out


def normalize_text(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [ln.strip() for ln in text.split("\n")]
    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def extract_pdf_pages(pdf_path: Path) -> list[tuple[int, str]]:
    reader = pypdf.PdfReader(str(pdf_path))
    out: list[tuple[int, str]] = []
    for i, page in enumerate(reader.pages, start=1):
        txt = normalize_text(page.extract_text() or "")
        out.append((i, txt))
    return out


def extract_text_file_pages(file_path: Path) -> list[tuple[int, str]]:
    text = file_path.read_text(encoding="utf-8", errors="replace")
    text = normalize_text(text)
    if not text:
        return []

    # Split large text-bearing files into pseudo-pages for chunking continuity.
    block_size = 4000
    blocks = [text[i:i + block_size] for i in range(0, len(text), block_size)]
    return [(i + 1, block) for i, block in enumerate(blocks)]


def tokenize(text: str) -> list[str]:
    return [t.lower() for t in TOKEN_RE.findall(text)]


def chunk_pages(pages: list[tuple[int, str]], target_chars: int, overlap_chars: int) -> list[tuple[int, int, str]]:
    chunks: list[tuple[int, int, str]] = []
    buf: list[str] = []
    page_ids: list[int] = []
    cur = 0

    def flush() -> None:
        nonlocal buf, page_ids, cur
        if not buf:
            return
        text = "\n\n".join(buf).strip()
        if text:
            chunks.append((min(page_ids), max(page_ids), text))
        tail = text[-overlap_chars:] if overlap_chars > 0 else ""
        buf = [tail] if tail else []
        page_ids = [max(page_ids)] if tail and page_ids else []
        cur = len(tail)

    for pnum, ptxt in pages:
        block = f"[PAGE {pnum}]\n{ptxt}".strip()
        if not block:
            continue
        blen = len(block) + 2
        if cur + blen > target_chars and buf:
            flush()
        buf.append(block)
        page_ids.append(pnum)
        cur += blen

    if buf:
        flush()

    return chunks


def is_probable_pdf(path: Path) -> bool:
    try:
        with path.open("rb") as handle:
            return handle.read(5) == b"%PDF-"
    except OSError:
        return False


def gather_assets(input_path: Path) -> tuple[list[SourceAsset], Path | None]:
    temp_dir: Path | None = None
    if input_path.is_file() and input_path.suffix.lower() == ".pdf":
        return [SourceAsset(path=str(input_path), kind="pdf", size_bytes=input_path.stat().st_size)], None

    if input_path.is_file() and is_probable_pdf(input_path):
        return [SourceAsset(path=str(input_path), kind="pdf", size_bytes=input_path.stat().st_size)], None

    if input_path.is_file() and input_path.suffix.lower() in TEXT_EXTENSIONS:
        return [SourceAsset(path=str(input_path), kind="text", size_bytes=input_path.stat().st_size)], None

    if input_path.is_file() and input_path.suffix.lower() == ".zip":
        temp_dir = Path(tempfile.mkdtemp(prefix="base53_zip_"))
        with zipfile.ZipFile(input_path, "r") as zf:
            zf.extractall(temp_dir)
        root = temp_dir
    else:
        root = input_path

    assets: list[SourceAsset] = []
    for p in sorted(root.rglob("*")):
        if not p.is_file():
            continue
        suffix = p.suffix.lower()
        if suffix == ".pdf" or is_probable_pdf(p):
            kind = "pdf"
        elif suffix in TEXT_EXTENSIONS:
            kind = "text"
        else:
            kind = "binary"
        assets.append(SourceAsset(path=str(p), kind=kind, size_bytes=p.stat().st_size))
    return assets, temp_dir


def build_chunks(
    assets: list[SourceAsset],
    target_chars: int,
    overlap_chars: int,
) -> tuple[list[Chunk], list[SkippedAsset]]:
    raw_chunks: list[Chunk] = []
    doc_freq: Counter[str] = Counter()
    skipped_assets: list[SkippedAsset] = []

    # First pass: extract + tokenize, accumulate document frequency at chunk scope.
    for asset in assets:
        if asset.kind == "binary":
            continue

        source_path = Path(asset.path)
        try:
            if asset.kind == "pdf":
                pages = extract_pdf_pages(source_path)
            else:
                pages = extract_text_file_pages(source_path)
        except Exception as exc:
            skipped_assets.append(
                SkippedAsset(
                    path=str(source_path),
                    kind=asset.kind,
                    reason=str(exc),
                )
            )
            print(f"[warn] Skipping unreadable {asset.kind}: {source_path} :: {exc}")
            continue

        pieces = chunk_pages(pages, target_chars=target_chars, overlap_chars=overlap_chars)
        for idx, (sp, ep, txt) in enumerate(pieces, start=1):
            toks = tokenize(txt)
            if not toks:
                continue
            unique = set(toks)
            for t in unique:
                doc_freq[t] += 1

            sh = simhash64(toks)
            cid = f"{source_path.stem}_{idx:04d}"
            raw_chunks.append(
                Chunk(
                    chunk_id=cid,
                    source_file=str(source_path),
                    start_page=sp,
                    end_page=ep,
                    char_count=len(txt),
                    tokens=toks,
                    top_terms=[],
                    simhash64=f"{sh:016x}",
                    text=txt,
                )
            )

    # Second pass: compute discriminative terms (high tf-idf-like score).
    n_chunks = max(len(raw_chunks), 1)
    for ch in raw_chunks:
        tf = Counter(ch.tokens)
        scores: list[tuple[str, float]] = []
        for term, freq in tf.items():
            # "Discretion" weighting: suppress global boilerplate, prefer specific terms.
            idf = math.log((n_chunks + 1) / (1 + doc_freq[term])) + 1.0
            score = (1 + math.log(freq)) * idf
            scores.append((term, score))
        scores.sort(key=lambda x: x[1], reverse=True)
        ch.top_terms = [t for t, _ in scores[:24]]

    return raw_chunks, skipped_assets


def top_terms_for_chunks(chunks: list[Chunk], limit: int = 8) -> list[str]:
    counts: Counter[str] = Counter()
    for chunk in chunks:
        counts.update(chunk.top_terms[:12])
    return [term for term, _ in counts.most_common(limit)]


def select_demodex_rows(rows: list[dict[str, Any]], count: int) -> list[dict[str, Any]]:
    if not rows:
        return []
    if count <= 1:
        return [rows[0]]
    selected: list[dict[str, Any]] = []
    last_index = len(rows) - 1
    for idx in range(count):
        target = idx / (count - 1)
        row = min(rows, key=lambda item: abs(item["cycle_fraction"] - target))
        selected.append(row)
    return selected


def bucket_for_spoke(spoke_index: int, sonic_layer: dict[str, Any]) -> dict[str, Any]:
    brackets = sonic_layer.get("frequency_brackets", {})
    if 1 <= spoke_index <= 8:
        bucket = dict(brackets.get("spoke_1_8", {}))
    elif 9 <= spoke_index <= 16:
        bucket = dict(brackets.get("spoke_9_16", {}))
    else:
        bucket = dict(brackets.get("spoke_17_24", {}))
    bucket["spoke_index"] = spoke_index
    return bucket


def build_tycho_language_wheel(
    tycho_receipt: dict[str, Any],
    chunks: list[Chunk],
    genome_records: list[dict[str, Any]],
    demodex_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    sonic_layer = tycho_receipt.get("sonic_layer", {})
    languages = tycho_receipt.get("sonnet_languages", [])
    center = "greek" if "greek" in languages else (languages[len(languages) // 2] if languages else "greek")
    outer_languages = [lang for lang in languages if lang != center and lang not in TYCHO_OUTER_EXCLUDED]
    outer_languages = outer_languages[:24]
    auxiliary_orbit = [lang for lang in languages if lang != center and lang not in outer_languages]

    buckets: dict[int, list[Chunk]] = defaultdict(list)
    for chunk in chunks:
        spoke_index = (stable_hash_64(chunk.chunk_id) % 24) + 1
        buckets[spoke_index].append(chunk)

    language_genes = [row for row in genome_records if row.get("kind") == "language"] or genome_records[:4]
    selected_demodex = select_demodex_rows(demodex_rows, len(outer_languages))

    spokes: list[dict[str, Any]] = []
    for idx, language in enumerate(outer_languages, start=1):
        chunk_bucket = sorted(buckets[idx], key=lambda item: (-item.char_count, item.chunk_id))
        demodex = selected_demodex[idx - 1] if idx - 1 < len(selected_demodex) else {}
        gene_anchor = language_genes[(idx - 1) % len(language_genes)] if language_genes else {}
        metadata = LANGUAGE_METADATA.get(language, {})
        spokes.append(
            {
                "index": idx,
                "angle_deg": round((360 / 24) * (idx - 1), 2),
                "language": language,
                "family": metadata.get("family"),
                "region": metadata.get("region"),
                "mode": metadata.get("mode"),
                "tonal": metadata.get("tonal", False),
                "frequency_bucket": bucket_for_spoke(idx, sonic_layer),
                "demodex_anchor": {
                    "day": demodex.get("day"),
                    "cycle_fraction": demodex.get("cycle_fraction"),
                    "glyph": demodex.get("glyph"),
                    "dominant_gene": demodex.get("dominant_gene"),
                    "gene_frequency_hz": demodex.get("gene_frequency_hz"),
                },
                "genome_anchor": gene_anchor,
                "chunk_count": len(chunk_bucket),
                "sample_chunk_ids": [chunk.chunk_id for chunk in chunk_bucket[:4]],
                "top_terms": top_terms_for_chunks(chunk_bucket),
            }
        )

    return {
        "structure": "icositetragon_language_wheel",
        "center": {
            "language": center,
            "frequency_hz": sonic_layer.get("frequency_brackets", {}).get("seal", {}).get("hz"),
            "dna_anchor": sonic_layer.get("frequency_brackets", {}).get("seal", {}).get("dna_anchor"),
            "label": sonic_layer.get("frequency_brackets", {}).get("seal", {}).get("label"),
            "metadata": LANGUAGE_METADATA.get(center, {}),
        },
        "spokes": spokes,
        "auxiliary_orbit": auxiliary_orbit,
        "expected_response": sonic_layer.get("expected_response"),
        "theta_K_deg": tycho_receipt.get("parameters", {}).get("theta_K_deg"),
        "kappa": tycho_receipt.get("parameters", {}).get("kappa"),
        "phi": tycho_receipt.get("parameters", {}).get("phi"),
        "result_unique_bitstrings": tycho_receipt.get("result_unique_bitstrings"),
    }


def build_equations_layer(
    tycho_receipt: dict[str, Any],
    genome_records: list[dict[str, Any]],
    demodex_rows: list[dict[str, Any]],
    wheel: dict[str, Any],
) -> list[str]:
    params = tycho_receipt.get("parameters", {})
    sonic = tycho_receipt.get("sonic_layer", {})
    brackets = sonic.get("frequency_brackets", {})
    language_genes = [row for row in genome_records if row.get("kind") == "language"]
    sacred_genes = [row for row in genome_records if row.get("kind") == "sacred"]
    midpoint = next((row for row in demodex_rows if abs(row.get("cycle_fraction", -1.0) - 0.5) < 1e-9), None)
    kappa_threshold = next((row for row in demodex_rows if abs(row.get("kappa_scale", 0.0) - 1.4346) < 0.001), None)

    equations = [
        rf"\Psi(t) \to 1",
        rf"\kappa_1 = {params.get('kappa', 1.2732395447):.10f} \approx \frac{{4}}{{\pi}}",
        rf"\varphi = {params.get('phi', 1.6180339887):.10f}",
        rf"\theta_K = {params.get('theta_K_deg', 128.23):.2f}^\circ",
        rf"f_{{1:8}} = {brackets.get('spoke_1_8', {}).get('hz', 37)}\,\mathrm{{Hz}}",
        rf"f_{{9:16}} = {brackets.get('spoke_9_16', {}).get('hz', 592)}\,\mathrm{{Hz}}",
        rf"f_{{17:24}} = {brackets.get('spoke_17_24', {}).get('hz', 777)}\,\mathrm{{Hz}}",
        rf"f_{{\mathrm{{center}}}} = {brackets.get('seal', {}).get('hz', 555)}\,\mathrm{{Hz}}",
        rf"N_{{\mathrm{{spokes}}}} = 24, \quad L_{{\mathrm{{center}}}} = \mathrm{{{wheel.get('center', {}).get('language', 'greek')}}}",
        rf"B_{{\mathrm{{unique}}}} = {tycho_receipt.get('result_unique_bitstrings', 0)}",
    ]
    for row in language_genes[:4]:
        equations.append(rf"f_{{\mathrm{{{row['gene']}}}}} = {row['frequency_hz']:.3f}\,\mathrm{{Hz}}")
    for row in sacred_genes[:2]:
        equations.append(rf"f_{{\mathrm{{{row['gene']}}}}} = {row['frequency_hz']:.3f}\,\mathrm{{Hz}}")
    if midpoint:
        equations.append(
            rf"\kappa_{{\mathrm{{mid}}}} = {midpoint['kappa_scale']:.4f}, \quad d_{{\mathrm{{mid}}}} = {midpoint['day']:.1f}"
        )
    if kappa_threshold:
        equations.append(
            rf"\kappa_2 = {kappa_threshold['kappa_scale']:.4f}, \quad f_{{\mathrm{{CHEK2}}}} = {kappa_threshold['gene_frequency_hz']:.3f}\,\mathrm{{Hz}}"
        )
    return equations


def symbolic_signature(terms: list[str], fallback: str) -> str:
    glyphs: list[str] = []
    for term in terms:
        glyph = SEMANTIC_EMOJI.get(term)
        if glyph and glyph not in glyphs:
            glyphs.append(glyph)
        if len(glyphs) >= 3:
            break
    if not glyphs:
        return fallback
    return "".join(glyphs)


def build_emoji_layer(wheel: dict[str, Any]) -> dict[str, Any]:
    expected = wheel.get("expected_response", "𓃭🌀🔱ᚦ")
    center_anchor = wheel.get("center", {}).get("dna_anchor", "ᚦ")
    spokes: list[dict[str, Any]] = []
    for spoke in wheel.get("spokes", []):
        bucket = spoke.get("frequency_bucket", {})
        demodex = spoke.get("demodex_anchor", {})
        terms = spoke.get("top_terms", [])
        spokes.append(
            {
                "index": spoke.get("index"),
                "language": spoke.get("language"),
                "glyph": f"{bucket.get('dna_anchor', '')}{demodex.get('glyph', '')}{symbolic_signature(terms, expected[:1])}",
                "bucket_label": bucket.get("label"),
                "top_terms": terms,
            }
        )
    return {
        "center": {"language": wheel.get("center", {}).get("language"), "glyph": center_anchor},
        "spokes": spokes,
        "closure": expected,
    }


def build_recursive_synopsis(
    input_path: Path,
    assets: list[SourceAsset],
    chunks: list[Chunk],
    wheel: dict[str, Any],
    equations: list[str],
    emoji_layer: dict[str, Any],
) -> str:
    top_terms = Counter()
    for chunk in chunks:
        top_terms.update(chunk.top_terms[:6])
    dominant_terms = ", ".join(term for term, _ in top_terms.most_common(12))
    auxiliary = ", ".join(wheel.get("auxiliary_orbit", [])) or "none"
    first_spokes = wheel.get("spokes", [])[:4]
    spoke_line = "; ".join(
        f"{spoke['index']}:{spoke['language']}[{','.join(spoke.get('top_terms', [])[:3])}]"
        for spoke in first_spokes
    )
    return "\n".join(
        [
            f"# Recursive Synopsis: {input_path.name}",
            "",
            f"Assets: {len(assets)} | Chunks: {len(chunks)} | Structure: 24 outer languages + Greek center.",
            f"Center seal: {wheel.get('center', {}).get('language')} {wheel.get('center', {}).get('dna_anchor')}",
            f"Auxiliary Klein bridge: {auxiliary}",
            f"Dominant semantic terms: {dominant_terms}",
            f"Spoke seed sample: {spoke_line}",
            f"Equation anchors: {' ; '.join(equations[:6])}",
            f"Emoji closure: {emoji_layer.get('closure')}",
            "",
            "This collapse keeps the Tycho language wheel explicit while folding the corpus back into a single retrieval surface.",
        ]
    )


def write_hyperobject_layers(
    out_dir: Path,
    input_path: Path,
    assets: list[SourceAsset],
    chunks: list[Chunk],
    tycho_receipt_path: Path,
    genome_path: Path,
    demodex_path: Path,
) -> dict[str, str]:
    tycho_receipt = load_tycho_receipt(tycho_receipt_path)
    genome_records = load_genome_resonome(genome_path)
    demodex_rows = load_demodex_cycle(demodex_path)

    wheel = build_tycho_language_wheel(tycho_receipt, chunks, genome_records, demodex_rows)
    equations = build_equations_layer(tycho_receipt, genome_records, demodex_rows, wheel)
    emoji_layer = build_emoji_layer(wheel)
    synopsis = build_recursive_synopsis(input_path, assets, chunks, wheel, equations, emoji_layer)

    wheel_path = out_dir / "tycho_language_wheel.json"
    wheel_path.write_text(json.dumps(wheel, indent=2, ensure_ascii=False), encoding="utf-8")

    emoji_path = out_dir / "emoji_glyph_layer.json"
    emoji_path.write_text(json.dumps(emoji_layer, indent=2, ensure_ascii=False), encoding="utf-8")

    equations_path = out_dir / "equations_only.tex"
    equations_path.write_text(
        "% Auto-generated Tycho equations layer\n" + "\n".join(f"\\[{equation}\\]" for equation in equations) + "\n",
        encoding="utf-8",
    )

    synopsis_path = out_dir / "recursive_synopsis.md"
    synopsis_path.write_text(synopsis, encoding="utf-8")

    hyperobject_path = out_dir / "tycho_hyperobject.json"
    hyperobject_path.write_text(
        json.dumps(
            {
                "input": str(input_path),
                "generated": datetime.now().isoformat(),
                "layers": {
                    "geometry": wheel,
                    "equations_count": len(equations),
                    "emoji": emoji_layer,
                    "synopsis": synopsis,
                },
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    return {
        "language_wheel": str(wheel_path),
        "emoji_layer": str(emoji_path),
        "equations_layer": str(equations_path),
        "recursive_synopsis": str(synopsis_path),
        "hyperobject": str(hyperobject_path),
    }


def write_outputs(
    out_dir: Path,
    input_path: Path,
    chunks: list[Chunk],
    assets: list[SourceAsset],
    skipped_assets: list[SkippedAsset],
    make_lossless_archive: bool,
) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)

    # Tiny semantic index (no full text): compact + retrieval-friendly.
    index = {
        "generated": datetime.now().isoformat(),
        "input": str(input_path),
        "asset_count": len(assets),
        "pdf_count": sum(1 for a in assets if a.kind == "pdf"),
        "text_count": sum(1 for a in assets if a.kind == "text"),
        "binary_count": sum(1 for a in assets if a.kind == "binary"),
        "chunk_count": len(chunks),
        "encoding": "base53-discretion-v2",
        "binary_manifest": [
            {
                "path": a.path,
                "size_bytes": a.size_bytes,
            }
            for a in assets if a.kind == "binary"
        ],
        "chunks": [
            {
                "chunk_id": c.chunk_id,
                "source_file": c.source_file,
                "start_page": c.start_page,
                "end_page": c.end_page,
                "char_count": c.char_count,
                "simhash64": c.simhash64,
                "simhash53": to_base53(int(c.simhash64, 16)),
                "top_terms": c.top_terms,
            }
            for c in chunks
        ],
    }
    idx_path = out_dir / "corpus_base53_index.json"
    idx_path.write_text(json.dumps(index, indent=2), encoding="utf-8")

    # Full chunk store (still text, but compressed with lzma for portability).
    chunk_payload = {
        "generated": datetime.now().isoformat(),
        "chunks": [
            {
                "chunk_id": c.chunk_id,
                "source_file": c.source_file,
                "start_page": c.start_page,
                "end_page": c.end_page,
                "simhash64": c.simhash64,
                "top_terms": c.top_terms,
                "text": c.text,
            }
            for c in chunks
        ],
    }
    chunk_json = json.dumps(chunk_payload, ensure_ascii=False).encode("utf-8")
    chunk_lzma = lzma.compress(chunk_json, preset=9 | lzma.PRESET_EXTREME)
    chunk_path = out_dir / "corpus_chunks.json.xz"
    chunk_path.write_bytes(chunk_lzma)

    archive_path = None
    if make_lossless_archive:
        # Lossless archive of source assets: full information retained.
        archive_path = out_dir / "source_assets_lossless.zip"
        with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
            for asset in assets:
                src = Path(asset.path)
                zf.write(src, arcname=src.name)

    stats = {
        "index_file": str(idx_path),
        "chunks_file": str(chunk_path),
        "lossless_archive": str(archive_path) if archive_path else None,
        "index_size_bytes": idx_path.stat().st_size,
        "chunks_size_bytes": chunk_path.stat().st_size,
        "source_total_bytes": sum(a.size_bytes for a in assets),
        "asset_count": len(assets),
        "pdf_count": sum(1 for a in assets if a.kind == "pdf"),
        "text_count": sum(1 for a in assets if a.kind == "text"),
        "binary_count": sum(1 for a in assets if a.kind == "binary"),
        "chunk_count": len(chunks),
        "skipped_asset_count": len(skipped_assets),
        "skipped_assets": [
            {
                "path": item.path,
                "kind": item.kind,
                "reason": item.reason,
            }
            for item in skipped_assets
        ],
    }
    (out_dir / "run_stats.json").write_text(json.dumps(stats, indent=2), encoding="utf-8")
    return stats


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Base53 corpus hyper-compressor")
    ap.add_argument("input", help="Input folder or .zip containing PDFs")
    ap.add_argument(
        "--out",
        default=r"C:\Users\echo\Downloads\LLM\ToroidalRecursion\compressed_context\base53_hyper",
        help="Output directory",
    )
    ap.add_argument("--target-chars", type=int, default=3200, help="Chunk target char length")
    ap.add_argument("--overlap-chars", type=int, default=220, help="Chunk overlap chars")
    ap.add_argument("--no-lossless", action="store_true", help="Skip writing lossless source PDF zip")
    ap.add_argument(
        "--tycho-receipt",
        default=r"C:\Users\echo\Downloads\LLM\ToroidalRecursion\tycho_sonnet_v21_receipt_20260326.json",
        help="Tycho receipt JSON used to build the language wheel",
    )
    ap.add_argument(
        "--genome-file",
        default=r"C:\Users\echo\Downloads\LLM\ToroidalRecursion\Research\genome.txt",
        help="Genome resonome file",
    )
    ap.add_argument(
        "--demodex-file",
        default=r"C:\Users\echo\Downloads\LLM\ToroidalRecursion\Research\DEMODEX_14_4_DAY_CYCLE_PHASE_MAP.csv",
        help="Demodex phase map CSV",
    )
    return ap.parse_args()


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    if not input_path.exists():
        raise SystemExit(f"Input does not exist: {input_path}")

    assets, temp_dir = gather_assets(input_path)
    if not assets:
        if temp_dir:
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise SystemExit("No assets found in input")

    print(f"[1/4] Assets found: {len(assets)}")
    chunks, skipped_assets = build_chunks(
        assets,
        target_chars=args.target_chars,
        overlap_chars=args.overlap_chars,
    )
    print(f"[2/5] Chunks built: {len(chunks)}")

    out_dir = Path(args.out)
    stats = write_outputs(
        out_dir=out_dir,
        input_path=input_path,
        chunks=chunks,
        assets=assets,
        skipped_assets=skipped_assets,
        make_lossless_archive=not args.no_lossless,
    )
    print("[3/5] Base outputs written")

    layer_files = write_hyperobject_layers(
        out_dir=out_dir,
        input_path=input_path,
        assets=assets,
        chunks=chunks,
        tycho_receipt_path=Path(args.tycho_receipt),
        genome_path=Path(args.genome_file),
        demodex_path=Path(args.demodex_file),
    )
    stats["hyperobject_files"] = layer_files
    (out_dir / "run_stats.json").write_text(json.dumps(stats, indent=2), encoding="utf-8")

    print("[4/5] Tycho hyperobject layers written")
    print(json.dumps(stats, indent=2))

    if temp_dir:
        shutil.rmtree(temp_dir, ignore_errors=True)
    print("[5/5] Complete")


if __name__ == "__main__":
    main()
