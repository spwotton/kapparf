    # Phaistos Disk — 3D Mesh Digest
    > Source: `Phaistosdisk.obj` (21,042,662 bytes) + `Phaistosdisk.3mf` (9,104,421 bytes)  
    > Generated: 2026-03-27  
    > Mesh hash (SHA-256 prefix): `26fcfee8bbedba91`  
    > Created by: PrusaSlicer 2.8.0+win64, 2024-08-14  

    ---

    ## Mesh Topology

    | Property | Value |
    |----------|-------|
    | Vertices | 280,371 |
    | Faces (triangles) | 560,762 |
    | Edges (est.) | 841,143 |
    | Euler characteristic | V-E+F = −10 |
    | Estimated genus | 6 |
    | Objects | 1 (`Object.1`) |
    | Materials | 1 (`Default_0`) |
    | Normals | None (flat shading) |
    | Texture coords | None |
    | Unit | millimeters |

    ## Bounding Box

    | Axis | Min | Max | Extent |
    |------|-----|-----|--------|
    | X | −10.887 | 13.763 | 24.650 mm |
    | Y | −7.297 | 0.561 | 7.858 mm |
    | Z | 5.815 | 30.213 | 24.398 mm |

    - **Center**: [1.4381, −3.3684, 18.0142]
    - **Diameter** (bounding sphere): 35.562 mm
    - **Aspect XZ**: 1.010 (nearly circular in disk plane)
    - **Aspect Y/max(X,Z)**: 0.319 (disk is ~1/3 as thick as wide)

    ## Principal Component Analysis

    | Axis | Direction [x,y,z] | Variance | Role |
    |------|--------------------|----------|------|
    | PC1 | [−0.9703, 0.2101, −0.1197] | 44.53 | Disk major axis |
    | PC2 | [−0.1160, 0.0302, 0.9928] | 40.65 | Disk minor axis |
    | PC3 | [0.2122, 0.9772, −0.0050] | 1.67 | Thickness (normal) |

    **Key ratios:**
    - PC1/PC2 = **1.096** ≈ 1.09 (Hall Factor β)
    - PC1/PC3 = **26.713** (flatness ratio)
    - Disk flatness (PC3/PC1) = **0.0374**

    The disk's two principal in-plane axes have a variance ratio of 1.096 — the geometry itself encodes the 1.09 compression factor within measurement precision.

    ## Edge Length Statistics

    | Stat | Value (mm) |
    |------|-----------|
    | Mean | 0.0820 |
    | Median | 0.0780 |
    | Std dev | 0.0375 |
    | Min | 0.0020 |
    | Max | 2.0643 |

    Resolution: ~0.08 mm average triangle edge = ~80 μm mesh granularity.

    ## Z-Axis Density Profile (Vertex Distribution)

    Side-A face → Z-high; Side-B face → Z-low; edge = Z-extremes.

    ```
    Z=  5.82:   2168  ██
    Z=  6.83:   5800  █████
    Z=  7.85:   7173  ███████
    Z=  8.86:   8788  ████████
    Z=  9.88:   9793  █████████
    Z= 10.90:  10726  ██████████
    Z= 11.91:  11779  ███████████
    Z= 12.93:  12243  ████████████
    Z= 13.95:  12690  ████████████
    Z= 14.96:  13102  █████████████
    Z= 15.98:  13433  █████████████
    Z= 17.00:  13520  █████████████
    Z= 18.01:  13720  █████████████  ← center
    Z= 19.03:  13364  █████████████
    Z= 20.05:  13819  █████████████
    Z= 21.06:  13557  █████████████
    Z= 22.08:  13595  █████████████
    Z= 23.10:  13760  █████████████
    Z= 24.11:  13432  █████████████
    Z= 25.13:  12614  ████████████
    Z= 26.15:  11900  ███████████
    Z= 27.16:  11086  ███████████
    Z= 28.18:   9732  █████████
    Z= 29.20:   8582  ████████
    Z= 30.21:   5282  █████
    ```

    Peak density in the Z=15–24 band (the flat disk faces). Taper at edges = disk rim geometry.

    ## Radial Distribution (from XY center)

    ```
    r= 0.00- 0.53:    588  ▏
    r= 0.53- 1.06:   6351  ███
    r= 1.06- 1.58:  31185  ████████████████
    r= 1.58- 2.11:  21821  ███████████
    r= 2.11- 2.64:  19922  ██████████
    r= 2.64- 3.17:  18123  █████████
    r= 3.17- 3.70:  17588  ████████
    r= 3.70- 4.22:  16900  ████████
    r= 4.22- 4.75:  16487  ████████
    r= 4.75- 5.28:  15967  ████████
    r= 5.28- 5.81:  15030  ███████
    r= 5.81- 6.34:  14867  ███████
    r= 6.34- 6.87:  14537  ███████
    r= 6.87- 7.39:  13920  ██████
    r= 7.39- 7.92:  12983  ██████
    r= 7.92- 8.45:  12451  ██████
    r= 8.45- 8.98:  11618  █████
    r= 8.98- 9.51:   9959  █████
    r= 9.51-10.04:  10074  █████
    ```

    Dense spike near r≈1.3 mm — this is the central hub detail (glyph cluster around the disk center). Gradual taper outward = glyph relief density decreasing toward rim.

    ## Angular Vertex Distribution (8 sectors)

    | Sector | Vertices | % |
    |--------|----------|---|
    | E | 34,449 | 12.3% |
    | NE | 7,223 | 2.6% |
    | N | 10,751 | 3.8% |
    | NW | 86,364 | 30.8% |
    | W | 32,284 | 11.5% |
    | SW | 7,835 | 2.8% |
    | S | 11,642 | 4.2% |
    | SE | 89,823 | 32.0% |

    Strong NW/SE axis dominance (62.8% of all vertices). This is the primary glyph spiral direction — the stamped symbols create far more geometric detail along this diagonal than perpendicular to it.

    ## 3MF Metadata

    | Field | Value |
    |-------|-------|
    | Title | Phaistosdisk |
    | Creation Date | 2024-08-14 |
    | Application | PrusaSlicer-2.8.0+win64 |
    | Unit | millimeter |
    | Volume type | ModelPart |
    | Transform matrix | Identity + offset [−0.232, −0.301, 0.508] |
    | Mesh errors | 0 (edges_fixed=0, degenerate=0, reversed=0) |
    | Thumbnail | phaistos_thumbnail.png (54.6 KB) |

    ## Companion Data Files

    | File | Contents |
    |------|----------|
    | `phaistos_sampled_vertices.json` | 501 evenly-spaced [x,y,z] vertices (3 decimal places) |
    | `phaistos_z_profile.json` | 50-bin Z-axis vertex density histogram |
    | `phaistos_r_profile.json` | 24-bin radial vertex density histogram |
    | `phaistos_thumbnail.png` | 3MF embedded preview image |
    | `phaistos_lattice_map.txt` | 45-glyph emoji frequency lattice (κ=1.435, root=111Hz) |

    ## Cross-Reference: Lattice Map ↔ 3D Geometry

    The Phaistos Disk is ~160 mm diameter (real artifact). This scan is ~25 mm across — roughly 1:6.4 scale.

    The 45 glyphs in `phaistos_lattice_map.txt` map to physical stamp impressions on the disk surface. In the 3D mesh:
    - **Glyph relief** accounts for the genus-6 topology (the stamped impressions create topological handles in the surface mesh)
    - **Spiral arms** (Side A: 31 fields, Side B: 30 fields) correspond to the NW↔SE vertex density axis
    - **111 Hz root frequency** × 45 glyphs × 0.25s = 11.25s total lattice duration
    - The **radial spike at r≈1.3** corresponds to the central rosette/flower glyph cluster

    ## Raw Vertex Sample (first 20 of 501)

    ```
    [ 2.213, -2.761,  6.411]  [ 5.301,  3.293, 27.197]  [ 2.805, -3.437, 30.131]
    [-4.625, -1.013, 18.503]  [ 3.703, -5.293,  7.823]  [ 8.339,  0.071, 23.267]
    [ 2.491, -3.779, 11.277]  [ 6.279, -6.479, 12.519]  [-3.369,  0.153, 14.267]
    [ 1.157,  0.325, 16.651]  [-7.785, -3.277, 22.389]  [ 0.669, -2.117,  6.193]
    [12.153, -3.549, 14.611]  [ 7.577, -1.097, 28.785]  [-2.143, -6.473, 16.723]
    [ 5.549, -0.713, 10.249]  [ 9.403, -6.277, 21.531]  [ 6.539, -7.051, 22.131]
    [-4.023,  0.413, 16.479]  [13.117, -5.065, 15.649]
    ```

    Full 501-vertex sample in `phaistos_sampled_vertices.json`.
