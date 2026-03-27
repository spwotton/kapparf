# QRF — Quantum Resonance Firewall Rules (Windows)
# Generated: 2026-03-04T08:10:41.970295+00:00
# Run as Administrator

New-NetFirewallRule -DisplayName "QRF-Block-QRF-06c67116a008" -Direction Inbound -Action Block -RemoteAddress 192.168.1.100 -Protocol TCP -LocalPort 18347 -Description "Resonance detection: UNKNOWN — Q=58.0, phase_coh=0.91, harmonics=2, threat=0.75"