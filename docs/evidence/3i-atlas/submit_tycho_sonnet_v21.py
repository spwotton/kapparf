#!/usr/bin/env python3
"""
SUBMIT TYCHO-SONNET v2.1 — THE SINGING CIRCUIT
================================================
Submits the 14-qubit Sonnet 18 / PID-CL circuit to Rigetti Ankaa-3
with the full europa_sonnet SONIC_LAYER manifest (29 tongues, 4 DNA anchors).

Same proven circuit from tycho_sonnet_pid.py (March 14 2026).
New metadata: SONIC_LAYER frequency brackets, 𓃭🌀🔱ᚦ anchors,
              29 writing systems, singback protocol ECHO_HYPERVISOR_v2.

Usage:
    py submit_tycho_sonnet_v21.py              # submit to Ankaa-3
    py submit_tycho_sonnet_v21.py --dry-run    # local Aer simulation only
    py submit_tycho_sonnet_v21.py --wait       # submit + block until results
"""

import os
import sys
import json
from datetime import datetime, timezone

# Force UTF-8 on Windows
sys.stdout = __import__('io').TextIOWrapper(
    sys.stdout.buffer, encoding='utf-8', errors='replace')

# ── Import the circuit builder (same proven circuit) ─────────────
from tycho_sonnet_pid import tycho_sonnet_circuit, PHI, KAPPA, THETA_K, THETA_RAD, VOLTA_LINE

# ── Import the singing circuit manifest ──────────────────────────
from europa_sonnet import ALL_TONGUES, SONIC_LAYER, build_circuit_manifest


def _load_connection_string() -> str:
    env_path = os.path.join(os.path.dirname(__file__), ".env.quantum")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("AZURE_QUANTUM_CONNECTION_STRING="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if not val.endswith(";"):
                        val += ";"
                    return val
    return ""


def main():
    dry_run = "--dry-run" in sys.argv
    wait = "--wait" in sys.argv

    # Build the circuit
    qc = tycho_sonnet_circuit()

    # Build the full singing circuit manifest
    manifest = build_circuit_manifest()

    # Add circuit-level metadata
    manifest["circuit_depth"] = qc.depth()
    manifest["circuit_gates"] = qc.size()
    manifest["circuit_name"] = qc.name
    manifest["submission_utc"] = datetime.now(timezone.utc).isoformat()
    manifest["parameters"] = {
        "theta_K_deg": THETA_K,
        "theta_K_rad": round(THETA_RAD, 6),
        "volta_qubit": VOLTA_LINE,
        "kappa": round(KAPPA, 10),
        "phi": round(PHI, 10),
    }

    shots = manifest["shots"]  # 10,000

    print("=" * 70)
    print("  TYCHO-SONNET v2.1 — THE SINGING CIRCUIT")
    print(f"  {datetime.now(timezone.utc):%Y-%m-%d %H:%M UTC}")
    print("  Node #1090, Tacacorí, Costa Rica")
    print("=" * 70)
    print(f"  Qubits : {manifest['qubits']}   Depth : {qc.depth()}   Gates : {qc.size()}")
    print(f"  Volta  : q{VOLTA_LINE}  Klein twist : {THETA_K}°")
    print(f"  Shots  : {shots:,}")
    print(f"  Languages : {manifest['sonnet_count']} tongues")
    print(f"  Measurement : {manifest['measurement_basis']}")
    print(f"  Sonic Layer : {SONIC_LAYER['base_frequency']} Hz base, anchors {SONIC_LAYER['expected_response']}")
    print(f"  Fidelity threshold : {SONIC_LAYER['fidelity_threshold']} bits/symbol")
    print()

    if dry_run:
        print("  [DRY-RUN] Local Aer simulation only.\n")
        from tycho_sonnet_pid import _local_validate
        _local_validate(shots=4096)
        _save_manifest(manifest, None, qc, dry_run=True)
        return

    # ── Connect to Azure Quantum ────────────────────────────────
    conn = _load_connection_string()
    if not conn:
        print("  [!] No AZURE_QUANTUM_CONNECTION_STRING in .env.quantum")
        sys.exit(1)

    from azure.quantum import Workspace
    from azure.quantum.qiskit import AzureQuantumProvider

    print("  Connecting to Azure Quantum workspace...")
    ws = Workspace.from_connection_string(conn)
    print(f"  Workspace : {ws.name}  ({ws.location})")

    provider = AzureQuantumProvider(workspace=ws)

    # ── Discover Rigetti target ─────────────────────────────────
    preferred = "rigetti.qpu.ankaa-3"
    targets = ws.get_targets()
    target_names = [t.name for t in targets]

    if preferred in target_names:
        target_name = preferred
    else:
        rigetti = [n for n in target_names if "rigetti" in n.lower()]
        if rigetti:
            target_name = rigetti[0]
            print(f"  [!] {preferred} unavailable — using {target_name}")
        else:
            print(f"  [!] No Rigetti target found.  Available: {target_names}")
            sys.exit(1)

    print(f"  Target : {target_name}")
    backend = provider.get_backend(target_name)

    # ── Submit ──────────────────────────────────────────────────
    job_name = f"TychoSonnet_v21_{datetime.now(timezone.utc):%Y%m%d_%H%M%S}"
    print(f"\n  Submitting '{job_name}' ({shots:,} shots)...")
    job = backend.run(qc, shots=shots)
    job_id = job.job_id()

    print(f"  Job ID : {job_id}")
    print(f"  Status : {job.status()}")

    manifest["job_id"] = job_id
    manifest["job_name"] = job_name
    manifest["target_actual"] = target_name

    _save_manifest(manifest, job_id, qc)

    # ── Wait for results if requested ───────────────────────────
    if wait:
        print("\n  Waiting for job to complete (Ctrl+C to stop)...")
        try:
            result = job.result()
            counts = result.get_counts()
            print(f"\n  Raw counts ({len(counts)} unique bitstrings):")
            sorted_c = sorted(counts.items(), key=lambda x: x[1], reverse=True)
            for bs, cnt in sorted_c[:15]:
                print(f"    {bs} : {cnt:>5}  ({cnt/shots*100:.1f}%)")

            # Save results
            manifest["result_counts"] = counts
            manifest["result_unique_bitstrings"] = len(counts)
            _save_manifest(manifest, job_id, qc)
            print(f"\n  Results saved.")

            # Quick singback check
            _singback_check(counts, shots)
        except KeyboardInterrupt:
            print("\n  Interrupted — check job later.")
        except Exception as e:
            print(f"\n  Error: {e}")
    else:
        print(f"\n  Job submitted. Re-run with --wait to block for results.")
        print(f"  Or check: portal.azure.com → quantumrecursion → Jobs")

    print("\n" + "=" * 70)
    print("  𓃭🌀🔱ᚦ  —  The singing is bidirectional resonance.")
    print("  Ψ(t) → 1")
    print("=" * 70)


def _save_manifest(manifest, job_id, qc, dry_run=False):
    """Save the full manifest (without ALL_TONGUES text to save space)."""
    # Strip the full tongue texts for the receipt (they're huge)
    save_manifest = {k: v for k, v in manifest.items() if k != "sonnet_all_tongues"}
    save_manifest["sonnet_languages"] = list(ALL_TONGUES.keys())
    save_manifest["sonnet_count"] = len(ALL_TONGUES)

    tag = "dryrun" if dry_run else datetime.now(timezone.utc).strftime("%Y%m%d")
    receipt_path = os.path.join(
        os.path.dirname(__file__),
        f"tycho_sonnet_v21_receipt_{tag}.json",
    )
    with open(receipt_path, "w", encoding="utf-8") as f:
        json.dump(save_manifest, f, indent=2, default=str, ensure_ascii=False)
    print(f"  Receipt: {os.path.basename(receipt_path)}")


def _singback_check(counts, shots):
    """
    Quick check: do the top measurement clusters correspond to
    the 4 DNA anchor positions (37, 53, 74, 89)?

    We map bitstring integer values modulo 137 and check if
    the 4 anchor primes appear in the top distribution.
    """
    print("\n  ── SINGBACK CHECK (𓃭🌀🔱ᚦ) ──")
    anchors = {37: "𓃭 LION", 53: "🌀 SPIRAL", 74: "🔱 TRIDENT", 89: "ᚦ THORN"}

    # Map bitstrings to integers mod 137
    mod_counts = {}
    for bs, cnt in counts.items():
        val = int(bs.replace(" ", ""), 2) % 137
        mod_counts[val] = mod_counts.get(val, 0) + cnt

    # Check anchor positions
    total_anchor_hits = 0
    for pos, name in anchors.items():
        hits = mod_counts.get(pos, 0)
        total_anchor_hits += hits
        pct = hits / shots * 100
        expected = shots / 137  # uniform expectation
        ratio = hits / expected if expected > 0 else 0
        marker = "✓ RESONANT" if ratio > 1.09 else ""
        print(f"    mod137={pos:>3} ({name:>12}): {hits:>4} hits ({pct:.2f}%) ratio={ratio:.3f} {marker}")

    overall = total_anchor_hits / shots * 100
    bits_per_symbol = (total_anchor_hits / (shots * 4/137)) if shots > 0 else 0
    print(f"\n    Total anchor hits: {total_anchor_hits}/{shots} ({overall:.2f}%)")
    print(f"    Bits/symbol: {bits_per_symbol:.3f} (threshold: 1.09)")
    if bits_per_symbol > 1.09:
        print("    ═══ SINGBACK CONFIRMED ═══")
    else:
        print("    Singback below threshold — noise floor.")


if __name__ == "__main__":
    main()
