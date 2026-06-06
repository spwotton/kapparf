---
name: GOS corpus for Jaco shaders
description: GOS Quantum Quake and QuantumRenderer are the primary shader sources for jaco-map.tsx terrain/drone visual upgrades
---

## Source files (attached_assets)

- `quantum_quake_1780784116888.html` — raw WebGL2 GOS Resurrection engine with sky/nebula GLSL
- `gos_math_1780784137493.js` — GOS Math Library: κ=1.435, φ=1.618, θ=128.23°, Δκ=0.161393, carrier=8.392Hz
- `shaders_1780784137493.js` — Three.js GLSL: gosTwistVert, gosResonanceFrag, kleinVert, geneGlowVert, voidFrag
- `renderer_1770503312_1780784190482.txt` — QuantumRenderer: SuperpositionShader, EntanglementShader, TunnelingShader, WaveFunctionShader
- `quantum_quake_bsp_1780784116888.html` — BSP loader with three-point cinematic lighting and φ-harmonic field

## Applied upgrades in jaco-map.tsx

### kappaPhase terrain shader (terrain fragment shader lines ~222-237)
Added φ-harmonic third wave from GOS BSP toroidal standing wave:
```glsl
const float PHI=1.618; const float DK=0.161393;
float d = length(p*0.08);
float w3 = sin(d*KAPPA*PHI - t*DK*6.283)*0.5 + cos(d*KAPPA - t*0.07)*0.5;
float psi = w1*0.45 + w2*0.3 + w3*0.25; // three-component Born rule
return psi*psi;
```

### GOS breath scale on drone
From `gosBreathScale(t, amp=0.05)` in gos_math.js — scaled down to visible rate (÷100 of carrier).

### GOS constants used
κ=1.273 (terrain) / κ=1.435 (GOS primary), φ=1.618, Δκ=0.161393, carrier=8.392Hz

## Planned future upgrades (not yet applied)
- Void/nebula sky shader (voidFrag from shaders.js) — replace Points stars with proper GLSL sky
- GOS Klein twist on drone mesh (gosTwistVert) — subtle 128.23° twist at low amplitude
- EntanglementShader link lines between TARGETS — pulse at `distance*10 - t*3`
- HSV phase coloring for aircraft IFF — map threat level/country to hue via hsv2rgb
- Gene glow shader on landmark pylons (geneGlowVert) — pulse at gene frequency

## QUANTUM CODEX source
`QUANTUM_CODEX_COMPLETE_1780784427615.md` is the master GOS reference:
- κ=4/π≈1.2732 (helicity lock, circle→square bridge)  
- DeWave κ-Attention: `softmax(QK^T / κ) · V` (replaces √d_k with κ)
- Unity Invariant: Ψ(t) = A(t)·N(t) ≡ 1
- 7-Channel Mind Radio architecture
- Base-53 encoding system
