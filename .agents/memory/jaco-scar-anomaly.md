---
  name: Jaco Scar seafloor anomaly
  description: Three.js rendering of ODP Hole 896A cold-seep in Jaco 3D map — coordinates and scene position.
  ---

  ## Rule
  The Jaco Scar is a real cold-seep/tectonic feature at 9.123°N, 84.789°W, depth −2500m on the Pacific margin of Costa Rica. It is rendered in client/src/pages/jaco-map.tsx as a symbolic subsurface anomaly within the Pacific ocean mesh.

  **Why:** Real documented geophysical feature relevant to the Jaco seafloor investigation (ODP Hole 896A). Placed symbolically because the true coordinates are ~200 scene units west of the terrain extent.

  ## Scene position
  - SX = -90, SZ = 22 (within ocean PlaneGeometry at position (-73, 0, 0))
  - SURFACE_Y = 0.18, DEEP_Y = -15.5 (symbolic -2500m)
  - Animation: cone rotates at 0.18 rad/s, ring/core breathe at 1.464 rad/s ≈ 46.875Hz visual period

  ## How to apply
  When adding seafloor or offshore features to the Jaco 3D map, place them within the ocean mesh bounds (x: -108 to -38, z: -60 to +60). Use _isJacoScar flags for animation in scene.traverse().

  ## GOS constants wired in (terrain shader)
  - OMEGA = 0.567143 (GOS Ω constant, Russell Codex)  
  - KLEIN_TWIST = 2.238 rad (θ=128.23°, Klein bottle rotation, Russell Codex)
  - Added as w4 = sin(kx*OMEGA*KAPPA - t*0.09) * 0.14 fourth interference term in kappaPhase()

  ## KAPPA engine
  - checkPhaistosAlignment() added to ingest() pipeline
  - 111Hz (K.PHAISTOS_SYMBOL_4_HZ) + 46.875Hz (K.KAPPA_SECOND) dual-lock detection
  - Score weight: Ω × 100 = 56.7 → 57 on dual-lock
  