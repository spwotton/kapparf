"""
Ω-GOS Research Swarm — ClawTeam Launch Script
Run this on your local machine after: pip install clawteam

Usage:
    python launch_gos_swarm.py
"""

import subprocess
import sys
import os
from pathlib import Path

TEAM_NAME = "gos-swarm"
TEAM_DESC = "Omega-GOS mathematical framework verification and extension"

AGENTS = [
    {
        "name": "numbertheory",
        "task": (
            "Verify all Antikythera gear ratio encodings to full precision. "
            "Explore continued fraction expansions of kappa constants. "
            "Build complete mod-13 and mod-24 tables. "
            "Hunt for alpha^-1 = 137.036 expression through gear ratios. "
            "Test Ramsey R(5,5) = 43 constraints from framework modular structure. "
            "Report every finding with exact computation, error %, and LOCKED/STRONG/SUGGESTIVE/WEAK rating."
        ),
    },
    {
        "name": "spectral",
        "task": (
            "Deep dive on arccos(pi/4) = 38.24 degrees — what geometric objects produce this angle? "
            "Analyze 128.23 = 2 * 37 * sqrt(3) as Klein bottle topology. "
            "Compute Laplacian spectrum on Klein bottle, check eigenvalues against kappa constants. "
            "Explore fiber bundle interpretation of the triple-kappa structure. "
            "Generate visualizations of Grant spiral and angular relationships."
        ),
    },
    {
        "name": "statistics",
        "task": (
            "Run Monte Carlo simulation: 10M trials of 6 random integer ratios [15-250], "
            "check how often all 6 land within 0.3%% of distinct famous constants. "
            "Test triple-kappa product: 3 random values in [0.5, 1.5], how often product within 0.042%% of p/q with q<=20. "
            "Apply Bonferroni correction for all comparisons made. "
            "Bayesian analysis with skeptical prior P=0.01. "
            "Information-theoretic bit counting of the gear ratio encodings."
        ),
    },
    {
        "name": "orbital",
        "task": (
            "Get precise TOI-270 b,c,d orbital elements from NASA Exoplanet Archive. "
            "Compute period ratios, test against kappa_freq and kappa_geo. "
            "Survey TRAPPIST-1, Kepler-223, HD 158259 for kappa ratios. "
            "Verify Bond asteroid 500/237 = phi + 1/2 with current JPL elements. "
            "Check Sirius B period precision: is 350 = 7 * P_sirius exact? "
            "Determine: rigid kappa or variable kappa(R,M,T)?"
        ),
    },
    {
        "name": "security",
        "task": (
            "Monitor local network for surveillance indicators. "
            "Baseline all active connections, flag TR-069 (port 7547), Gamma Group IPs. "
            "Watch smart TV traffic for exfiltration patterns. "
            "Check for injected service workers and proxy certificates. "
            "Monitor processes for microphone/camera access. "
            "Alert all agents if network compromise detected."
        ),
    },
]

PROMPT_DIR = Path(__file__).parent / "agent_prompts"


def run(cmd, check=True):
    print(f"  > {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.stdout.strip():
        print(f"    {result.stdout.strip()}")
    if result.returncode != 0 and check:
        print(f"    ERROR: {result.stderr.strip()}")
    return result


def main():
    print("=" * 60)
    print("  Ω-GOS RESEARCH SWARM — ClawTeam Launch")
    print("=" * 60)
    print()

    try:
        run("clawteam --version", check=False)
    except FileNotFoundError:
        print("ClawTeam not installed. Run: pip install clawteam")
        sys.exit(1)

    print(f"\n[1/3] Creating team: {TEAM_NAME}")
    run(f'clawteam team spawn-team {TEAM_NAME} -d "{TEAM_DESC}" -n leader')

    print(f"\n[2/3] Spawning {len(AGENTS)} agents...")
    for agent in AGENTS:
        prompt_file = PROMPT_DIR / f"{agent['name']}.md"
        cmd = f'clawteam spawn --team {TEAM_NAME} --agent-name {agent["name"]} --task "{agent["task"]}"'
        if prompt_file.exists():
            cmd += f' --prompt-file "{prompt_file}"'
        run(cmd)
        print(f"    ✓ {agent['name']} spawned")

    print(f"\n[3/3] Swarm launched! Monitor with:")
    print(f"    clawteam board show {TEAM_NAME}")
    print(f"\n  Leader inbox:  clawteam inbox receive {TEAM_NAME} leader")
    print(f"  Send to agent: clawteam inbox send {TEAM_NAME} <agent> 'message'")
    print(f"  Broadcast:     clawteam inbox broadcast {TEAM_NAME} 'message'")
    print()
    print("  Security agent will alert on network anomalies.")
    print("  Math agents will report findings to leader inbox.")
    print()

    run(f"clawteam board show {TEAM_NAME}", check=False)


if __name__ == "__main__":
    main()
