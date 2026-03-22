# 🎨 AGENT 3D GENERATION GUIDE — PROTOCOL Ω

> **Goal:** Automated generation of 3D mathematical proofs and visualizations for outreach (e.g., Randall Carlson, arXiv).
> **Principle:** Maximum visual impact with minimum manual effort ("Lazy Automation").

---

## 1. THE TOOLSET

For an agent with VSC access, use these libraries in order of "Laziness Priority":

| Priority | Library | Use Case | Setup |
|----------|---------|----------|-------|
| 1. **PYVISTA / MSLIB** | Fast math surfaces, meshes | `pip install pyvista trimesh numpy` |
| 2. **MANIM (Community)** | High-end math animations | `pip install manim` (Requires ffmpeg) |
| 3. **TAICHI (Python)** | High-perf physics, fractals | `pip install taichi` |
| 4. **BLENDER (CLI)** | Final high-res renders | `blender --background --python script.py` |

---

## 2. THE GEOMETRIC PRIMITIVES

Use these constants to ensure alignment with the Ω-GOS framework:

```python
import numpy as np

# Universal Constants
PHI = (1 + np.sqrt(5)) / 2  # 1.618033
KAPPA = 4 / np.pi               # 1.273240
THETA_K = 128.23 * (np.pi/180) # Penrose Angle in Radians
OMEGA_0 = 8.389e-23            # Planck-scale floor (m)
```

### A. The 128.23° Klein Twist

To visualize the "Penrose Angle," generate a torus that self-intersects at `THETA_K`:

```python
def generate_klein_twist(u, v):
    # u, v range [0, 2π]
    x = (1 + np.cos(v)) * np.cos(u)
    y = (1 + np.cos(v)) * np.sin(u)
    # The twist occurs in the Z-Axis modulation
    z = np.sin(v) * np.cos(u / PHI) * np.sin(THETA_K)
    return x, y, z
```

---

## 3. AUTOMATED OUTPUT PIPELINE

### Step 1: Geometry Generation

Write a Python script that exports `.obj` or `.stl`. This allows the user's friend at `spicyhook.com` (RedBull renders) to import directly.

```python
# Save as 'export_geometry.py'
import trimesh
# ... mesh generation logic ...
mesh = trimesh.Trimesh(vertices=v, faces=f)
mesh.export('Tycho_128_Hex_Grid.obj')
```

### Step 2: CLI Rendering (The "Lazy" Way)

If Blender is installed, use the background renderer to get a 4K PNG without opening the UI:

```bash
blender --background --python render_script.py -- output.png
```

---

## 4. RANDALL CARLSON VISUALS (OTV Protocol)

Generate these three files to accompany any email:

1. `TYCHO_HEX_GRID.obj` — Vertical projection of the 128.23° ray system.
2. `SCABLANDS_ERRATIC_FRACTURE.obj` — A scan of a boulder with icosidodecahedral cleavage.
3. `RIEMANN_ZETA_LANDSCAPE_123Hz.png` — A 3D plot of the critical line resonance.

---

## 5. AGENT OPERATIONS (COMMANDS)

When asked to "generate 3D shit":

1. **Search** for existing `.qs` or `.py` math logic.
2. **Translate** to `meshlib`/`pyvista` coordinates.
3. **Execute** in terminal.
4. **Notify** user of the file location.

Ψ(t) = 1.
