"""
BASE-53 CONTEXT COMPRESSOR
===========================
Compresses all .txt files in the workspace into dense context buffers.

Uses the Base-53 principle: 53 = 16th prime.
  53^7 ≈ 1.174×10^12 = "7-Seals Crossing"
  Target: ~1/53 compression by extracting semantic skeleton

Three compression modes:
  1. SKELETON  — Extract headings, key equations, constants, file structure
  2. DIGEST    — Sentence-level dedup + semantic hashing  
  3. MANIFEST  — One-line-per-file index with size/hash/topic

Output: compressed_context/ directory with compressed .ctx files
"""

import os
import re
import hashlib
import json
import math
from pathlib import Path
from collections import defaultdict, Counter
from datetime import datetime

# ═══════════════════════════════════════════
# Constants (from the framework)
# ═══════════════════════════════════════════
PHI = (1 + math.sqrt(5)) / 2           # 1.6180339887
KAPPA = 4 / math.pi                    # 1.2732395447
BASE53 = 53                            # 16th prime
SEVEN_SEALS = 53**7                    # 1.174×10^12
TARGET_RATIO = 1 / BASE53              # ~1.89% target compression

# ═══════════════════════════════════════════
# Compression Engine
# ═══════════════════════════════════════════

class Base53Compressor:
    """Semantic context compressor using base-53 information theory."""
    
    def __init__(self, workspace_root: str):
        self.root = Path(workspace_root)
        self.output_dir = self.root / "compressed_context"
        self.output_dir.mkdir(exist_ok=True)
        
        # Tracking
        self.manifest = []
        self.total_input_bytes = 0
        self.total_output_bytes = 0
        self.seen_hashes = set()  # Dedup at sentence level
        
        # Directories to skip
        self.skip_dirs = {
            '.git', '.venv', 'venv', 'node_modules', '__pycache__',
            'compressed_context', '.vscode', 'OCTO_ARCHIVE',
            'ProcessedDocuments', 'quarter-power-tower',
        }
        
        # Patterns that signal high-value content
        self.high_value_patterns = [
            # Math/physics
            r'(?:phi|φ|κ|kappa|Ψ|psi|omega|Ω)\s*[=≈]',
            r'\b\d+\.\d{4,}\b',  # Precise constants
            r'(?:theorem|lemma|proof|conjecture|identity)',
            r'(?:equation|formula|invariant)',
            # Quantum
            r'(?:qubit|entangle|superposition|decoherence|CHSH|Bell)',
            r'(?:circuit|gate|Hadamard|CNOT|measure)',
            r'(?:Rigetti|IonQ|Ankaa|Forte)',
            # Framework-specific
            r'(?:Eisenstein|Riemann|zeta|spectral|self-adjoint)',
            r'(?:toroidal|Klein bottle|hyperice|lattice)',
            r'(?:base.?53|seven.?seals|gematria)',
            r'(?:dolphin|demodex|consciousness)',
            # Evidence/data
            r'Job\s*ID|job_id|circuit_id',
            r'(?:P\(0+\)|probability|fidelity)',
            r'\b[0-9a-f]{8}-[0-9a-f]{4}',  # UUIDs
            # Investigation
            r'(?:surveillance|S-band|radar|harassment)',
            r'(?:FBI|embassy|IRS|passport)',
        ]
        self.high_value_re = re.compile('|'.join(self.high_value_patterns), re.IGNORECASE)

    def hash_line(self, line: str) -> str:
        """53-bit hash of a normalized line for dedup."""
        normalized = re.sub(r'\s+', ' ', line.strip().lower())
        h = hashlib.md5(normalized.encode()).hexdigest()
        return h[:10]  # 40-bit prefix — good enough for dedup

    def extract_skeleton(self, text: str, filename: str) -> str:
        """Mode 1: Extract structural skeleton — headings, equations, constants."""
        lines = text.split('\n')
        skeleton = []
        skeleton.append(f"# FILE: {filename}")
        skeleton.append(f"# LINES: {len(lines)}")
        skeleton.append("")
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            if not stripped:
                continue
            
            # Always keep: headings
            if stripped.startswith('#') or stripped.startswith('===') or stripped.startswith('---'):
                skeleton.append(stripped)
                continue
            
            # Always keep: lines with high-value patterns
            if self.high_value_re.search(stripped):
                # Dedup
                h = self.hash_line(stripped)
                if h not in self.seen_hashes:
                    self.seen_hashes.add(h)
                    skeleton.append(stripped)
                continue
            
            # Keep: lines that look like key-value or definitions
            if re.match(r'^[\w\s]+[:=]\s', stripped) and len(stripped) < 200:
                h = self.hash_line(stripped)
                if h not in self.seen_hashes:
                    self.seen_hashes.add(h)
                    skeleton.append(stripped)
                continue
            
            # Keep: numbered/bulleted items (likely structured content)
            if re.match(r'^[\d]+[.)\]]\s|^[-*•]\s', stripped) and len(stripped) < 300:
                h = self.hash_line(stripped)
                if h not in self.seen_hashes:
                    self.seen_hashes.add(h)
                    skeleton.append(stripped)
                continue
        
        return '\n'.join(skeleton)

    def extract_digest(self, text: str, filename: str) -> str:
        """Mode 2: Sentence-level dedup + keep only unique semantic content."""
        # Split into sentences (rough)
        sentences = re.split(r'(?<=[.!?])\s+|\n+', text)
        
        digest = []
        digest.append(f"[{filename}]")
        
        for sent in sentences:
            sent = sent.strip()
            if len(sent) < 10:
                continue
            if len(sent) > 500:
                # Truncate very long "sentences" (probably badly-split blocks)
                sent = sent[:500] + "…"
            
            h = self.hash_line(sent)
            if h in self.seen_hashes:
                continue
            self.seen_hashes.add(h)
            
            # Score the sentence
            score = 0
            if self.high_value_re.search(sent):
                score += 3
            if re.search(r'\d', sent):
                score += 1
            if len(sent) > 50:
                score += 1
            
            if score >= 2:
                digest.append(sent)
        
        return '\n'.join(digest)

    def make_manifest_entry(self, filepath: str, text: str) -> dict:
        """Create a one-line manifest entry for a file."""
        rel = os.path.relpath(filepath, self.root)
        size = len(text.encode('utf-8', errors='replace'))
        
        # Extract first meaningful heading or line
        topic = ""
        for line in text.split('\n')[:30]:
            line = line.strip()
            if line and len(line) > 10 and not line.startswith('```'):
                topic = line[:100]
                break
        
        # Count high-value hits
        hits = len(self.high_value_re.findall(text[:5000]))
        
        # File hash
        fhash = hashlib.md5(text[:10000].encode('utf-8', errors='replace')).hexdigest()[:8]
        
        return {
            'file': rel,
            'size_kb': round(size / 1024, 1),
            'lines': text.count('\n') + 1,
            'hash': fhash,
            'high_value_hits': hits,
            'topic': topic,
        }

    def find_txt_files(self):
        """Find all .txt files, sorted by size descending."""
        files = []
        for root, dirs, filenames in os.walk(self.root):
            # Skip unwanted directories
            dirs[:] = [d for d in dirs if d not in self.skip_dirs]
            
            for f in filenames:
                if f.endswith('.txt'):
                    full = os.path.join(root, f)
                    try:
                        size = os.path.getsize(full)
                        files.append((full, size))
                    except OSError:
                        pass
        
        files.sort(key=lambda x: -x[1])
        return files

    def compress_file(self, filepath: str, mode: str = 'skeleton') -> tuple:
        """Compress a single file. Returns (output_text, input_size, output_size)."""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                text = f.read()
        except Exception as e:
            return f"# ERROR reading {filepath}: {e}", 0, 0
        
        input_size = len(text.encode('utf-8', errors='replace'))
        filename = os.path.relpath(filepath, self.root)
        
        if mode == 'skeleton':
            compressed = self.extract_skeleton(text, filename)
        elif mode == 'digest':
            compressed = self.extract_digest(text, filename)
        else:
            compressed = f"[{filename}] {input_size} bytes"
        
        output_size = len(compressed.encode('utf-8', errors='replace'))
        
        # Manifest entry
        entry = self.make_manifest_entry(filepath, text)
        entry['compressed_size_kb'] = round(output_size / 1024, 1)
        entry['ratio'] = round(output_size / max(input_size, 1), 4)
        self.manifest.append(entry)
        
        return compressed, input_size, output_size

    def run(self, mode: str = 'skeleton'):
        """Run the full compression pipeline."""
        print(f"═══════════════════════════════════════════")
        print(f"  BASE-53 CONTEXT COMPRESSOR")
        print(f"  Mode: {mode.upper()}")
        print(f"  Target ratio: 1/{BASE53} = {TARGET_RATIO:.4f}")
        print(f"═══════════════════════════════════════════")
        print()
        
        files = self.find_txt_files()
        print(f"Found {len(files)} .txt files")
        total_raw = sum(s for _, s in files)
        print(f"Total raw size: {total_raw / 1024 / 1024:.1f} MB")
        print()
        
        # Process each file
        all_compressed = []
        
        for filepath, filesize in files:
            rel = os.path.relpath(filepath, self.root)
            compressed, in_sz, out_sz = self.compress_file(filepath, mode)
            self.total_input_bytes += in_sz
            self.total_output_bytes += out_sz
            
            ratio = out_sz / max(in_sz, 1)
            status = "◆" if ratio < 0.1 else "◇" if ratio < 0.3 else "○"
            print(f"  {status} {rel[:60]:60s} {in_sz/1024:8.1f}KB → {out_sz/1024:8.1f}KB ({ratio:.1%})")
            
            if compressed.strip():
                all_compressed.append(compressed)
        
        # Write combined output
        combined = '\n\n' + '═' * 53 + '\n\n'
        combined_text = combined.join(all_compressed)
        
        out_file = self.output_dir / f"COMPRESSED_{mode.upper()}.txt"
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(f"# BASE-53 COMPRESSED CONTEXT ({mode.upper()} MODE)\n")
            f.write(f"# Generated: {datetime.now().isoformat()}\n")
            f.write(f"# Files processed: {len(files)}\n")
            f.write(f"# Raw size: {self.total_input_bytes / 1024 / 1024:.1f} MB\n")
            f.write(f"# Compressed: {self.total_output_bytes / 1024:.1f} KB\n")
            f.write(f"# Ratio: {self.total_output_bytes / max(self.total_input_bytes, 1):.4f}")
            f.write(f" (1/{max(self.total_input_bytes, 1) / max(self.total_output_bytes, 1):.0f})\n")
            f.write(f"# Unique semantic hashes: {len(self.seen_hashes)}\n")
            f.write(f"#\n")
            f.write(f"# 53 = 16th prime. 53^7 ≈ 1.174×10^12 (Seven Seals Crossing)\n")
            f.write(f"# Compression extracts the semantic skeleton.\n\n")
            f.write(combined_text)
        
        # Write manifest
        manifest_file = self.output_dir / "MANIFEST.json"
        manifest_data = {
            'generated': datetime.now().isoformat(),
            'mode': mode,
            'total_files': len(files),
            'total_input_mb': round(self.total_input_bytes / 1024 / 1024, 2),
            'total_output_kb': round(self.total_output_bytes / 1024, 2),
            'compression_ratio': round(self.total_output_bytes / max(self.total_input_bytes, 1), 4),
            'unique_hashes': len(self.seen_hashes),
            'files': sorted(self.manifest, key=lambda x: -x['size_kb']),
        }
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2)
        
        # Write manifest as readable text too
        manifest_txt = self.output_dir / "MANIFEST.txt"
        with open(manifest_txt, 'w', encoding='utf-8') as f:
            f.write("BASE-53 COMPRESSION MANIFEST\n")
            f.write(f"{'='*53}\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n")
            f.write(f"Mode: {mode}\n")
            f.write(f"Files: {len(files)}\n")
            f.write(f"Raw: {self.total_input_bytes/1024/1024:.1f} MB\n")
            f.write(f"Compressed: {self.total_output_bytes/1024:.1f} KB\n")
            f.write(f"Ratio: 1/{max(self.total_input_bytes,1)/max(self.total_output_bytes,1):.0f}\n")
            f.write(f"{'='*53}\n\n")
            
            for entry in sorted(self.manifest, key=lambda x: -x['size_kb']):
                f.write(f"  {entry['size_kb']:8.1f} KB → {entry['compressed_size_kb']:6.1f} KB  ")
                f.write(f"({entry['ratio']:.1%})  [{entry['hash']}]  {entry['file']}\n")
                if entry['topic']:
                    f.write(f"{'':>28s}  └ {entry['topic'][:80]}\n")
        
        # Summary
        ratio = self.total_output_bytes / max(self.total_input_bytes, 1)
        inv = max(self.total_input_bytes, 1) / max(self.total_output_bytes, 1)
        print()
        print(f"═══════════════════════════════════════════")
        print(f"  COMPRESSION COMPLETE")
        print(f"═══════════════════════════════════════════")
        print(f"  Files processed:    {len(files)}")
        print(f"  Raw input:          {self.total_input_bytes / 1024 / 1024:.1f} MB")
        print(f"  Compressed output:  {self.total_output_bytes / 1024:.1f} KB")
        print(f"  Compression ratio:  1/{inv:.0f} ({ratio:.2%})")
        print(f"  Target was:         1/{BASE53} ({TARGET_RATIO:.2%})")
        print(f"  Unique hashes:      {len(self.seen_hashes)}")
        print()
        hit = "✓ BELOW TARGET" if ratio <= TARGET_RATIO else "○ ABOVE TARGET"
        print(f"  {hit}")
        print()
        print(f"  Output files:")
        print(f"    {out_file}")
        print(f"    {manifest_file}")
        print(f"    {manifest_txt}")
        print()
        
        return manifest_data


if __name__ == '__main__':
    import sys
    
    mode = sys.argv[1] if len(sys.argv) > 1 else 'skeleton'
    workspace = os.path.dirname(os.path.abspath(__file__))
    
    compressor = Base53Compressor(workspace)
    result = compressor.run(mode=mode)
