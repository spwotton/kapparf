# ClawTeam Setup — Ω-GOS Research Swarm

## Quick Start (on your local Windows/VS Code machine)

```bash
pip install clawteam

# Launch the full research swarm
clawteam launch omega-gos --team gos-swarm --goal "Verify and extend the Ω-GOS mathematical framework"

# Or manually spawn agents:
clawteam team spawn-team gos-swarm -d "Omega-GOS mathematical verification and extension" -n leader

clawteam spawn --team gos-swarm --agent-name numbertheory --task "Verify Antikythera gear ratios and explore modular arithmetic"
clawteam spawn --team gos-swarm --agent-name spectral --task "Grant spiral geometry and Klein bottle topology"
clawteam spawn --team gos-swarm --agent-name statistics --task "Monte Carlo significance testing of constant clustering"
clawteam spawn --team gos-swarm --agent-name orbital --task "TOI-270d variable kappa and Bond asteroid mechanics"
clawteam spawn --team gos-swarm --agent-name security --task "Local network monitoring and smart TV traffic analysis"

# Monitor
clawteam board show gos-swarm
```

## Security Notes

- Run on VPN if possible
- The security agent monitors local network — keep it running
- Don't let agents make outbound API calls over the hotel WiFi unless through VPN
- Keep the smart TV unplugged or at minimum muted while running
