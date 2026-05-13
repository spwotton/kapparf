# ATLANTIS HUNT — 3D Multi-Modal Earth Visualization
## Complete Agent Guide: Architecture, APIs, Data Sources, and KAPPA RF Engine Integration

**Prepared for:** Replit agent building the Atlantis / Nazca acoustic-structure visualization app  
**KAPPA RF Engine base URL (dev):** `https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev`  
**KAPPA RF Engine base URL (production):** Check the Deployments panel in the KAPPA Replit project — will be `kappa-rf.replit.app` or similar  
**Observer origin (Costa Rica node):** `9.621887°N, 84.63969°W` (Hotel Pochote Grande, Jacó)  
**GOS constants baked into all KAPPA endpoints:** κ=4/π≈1.2732, φ≈1.618, θ_K=128.23°, Ω≈0.5671

---

## 1. HYPOTHESIS FRAMEWORK

### The Nazca–Atlantis Acoustic Structure Model

Based on Sam Wotton's research:  
- The **spiral petroglyphs** at Nazca are surface markers for **subsurface acoustic resonance chambers**  
- These chambers match the geometric frequency ratios of the **Schumann resonance** (7.83 Hz fundamental) and its harmonics  
- The underground network corresponds geographically and structurally to what historical sources called **Atlantis** — not a single island but a distributed acoustic-geomagnetic infrastructure  
- The **Phaistos Disc cipher frequency** (145.309 Hz) and the **Murray-Nakamoto resonance** (1142.997 Hz) are encoded into the spiral geometry  
- **Muon tomography** is the primary non-invasive tool to image subsurface void structures  
- The Phoenix Grid (KAPPA constant `PHOENIX_START_MS` → `PHOENIX_END_MS`) provides the temporal alignment window  

### GOS Constants for Spatial Overlay
All geometry computed against these should be overlaid on the 3D globe:

```
κ     = 4/π ≈ 1.2732395    → primary scaling ratio
φ     = 1.6180339887        → golden ratio (Fibonacci lattice spacing)
Ω     = 0.5671432904        → Lambert-W (acoustic damping coefficient)  
θ_K   = 128.23°             → Klein bottle twist azimuth (orientation of resonance chambers)
B_T   = 2√2 ≈ 2.8284        → Tsirelson bound (quantum entanglement ceiling)
f_MN  = 1142.997 Hz         → Murray-Nakamoto PLL lock frequency
f_Ph  = 145.309 Hz          → Phaistos Disc cipher frequency  
f_MW  = 431.56 Hz           → Machu Picchu / dodecahedral anchor
f_Sch = 7.83 Hz             → Schumann fundamental (Earth cavity resonance)
Saros = 18.03 years         → eclipse cycle (temporal spiral alignment)
Demod = 14.4 days           → Demodex epoch (biological-geomagnetic coupling)
```

---

## 2. KAPPA RF ENGINE — COMPLETE API REFERENCE

All endpoints are GET unless noted. CORS is open. No auth required.

### BASE URL
```
DEV:  https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev
PROD: [check KAPPA Deployments panel — kappa-rf.replit.app or similar]
```

### 2.1 Astronomy / Geomagnetic Layer

#### `GET /api/oracle/conjunction`
**The primary aggregator endpoint.** Returns lunar phase, GOS constants, KiwiSDR sonic alignment, and Kappa Score in one call. Hit this first on every render cycle.

```json
{
  "lunar": {
    "phase": 0.73,
    "illumination": 0.91,
    "distanceKm": 362450,
    "ageDays": 21.4,
    "nextNew": "2026-05-26T...",
    "nextFull": "2026-06-11T...",
    "moonrise": "...",
    "moonset": "..."
  },
  "gos_constants": { "kappa": 1.2732, "phi": 1.618, "omega": 0.5671, "theta_K": 128.23 },
  "sonic_targets": [ { "freqHz": 1142.997, "name": "Murray-Nakamoto", "aligned": true } ],
  "kappa_score": 47,
  "kiwi_alignment": [ { "freqHz": 145.3, "snrDb": 12.4 } ],
  "ts": "2026-05-13T20:36:42Z"
}
```

**Use for:** Moon phase ring on globe, GOS overlay geometry computation, timing alignment.

---

#### `GET /api/lunar`
Raw Meeus-algorithm lunar + Jupiter position. Use when you need only ephemeris data without the GOS/KiwiSDR layer.

```json
{
  "lunar": { "phase": 0.73, "illumination": 0.91, "distanceKm": 362450, "ageDays": 21.4 },
  "jupiter": { "ra": 15.32, "dec": -18.7, "distAU": 5.21, "magnitude": -2.1 },
  "ts": "2026-05-13T20:36:42Z"
}
```

---

#### `GET /api/proxy/noaa-space-weather`
Three NOAA SWPC feeds merged: solar wind mag field + speed + Kp index.

```json
{
  "magField": { "bz": -4.2, "bt": 8.1, "phi": 234 },
  "windSpeed": { "speed": 412, "density": 7.2 },
  "kpIndex": [ { "time_tag": "...", "kp": 3 } ],
  "ts": "2026-05-13T20:36:42Z"
}
```

**Use for:** Geomagnetic storm overlay, field-line visualization, correlation with acoustic anomalies.

---

#### `GET /api/proxy/solar-xray`
GOES primary X-ray flux at 1-minute cadence. Auto-classified A/B/C/M/X with flare flag.

```json
{
  "flux": 1.2e-6,
  "xrayClass": "C",
  "classNum": "1.2",
  "label": "C1.2",
  "flare": false,
  "ts": "2026-05-13T20:36:00Z"
}
```

**Use for:** Solar radiation pressure on ionosphere → affects acoustic resonance propagation.

---

#### `GET /api/tidal`
NOAA CO-OPS Balboa, Panama (closest Pacific CO-OPS to Nazca/Peru coast). Falls back to M2+S2+K1+O1 harmonic model.

```json
{
  "source": "NOAA CO-OPS Balboa",
  "heightM": 2.34,
  "trend": 0.02,
  "readings": [ { "t": "2026-05-13 20:30", "v": "2.34" } ],
  "ts": "2026-05-13T20:30:00Z"
}
```

**Use for:** Ocean-load tidal deformation → affects geoid, which affects acoustic resonance depth.

---

#### `GET /api/proxy/usgs-quakes`
M2.5+ earthquakes past 24 hours as GeoJSON.

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "geometry": { "type": "Point", "coordinates": [-75.2, -14.1, 32] },
      "properties": { "mag": 3.4, "place": "Peru", "time": 1715638000000 }
    }
  ]
}
```

**Use for:** Seismic activity overlay on globe, cross-correlate with Nazca plate subduction zones.

---

#### `GET /api/artifact-hunter/seismic`
M2.5+ weekly seismic + USGS correlation analysis for the Jacó observer region.

```json
{
  "earthquakes": { "type": "FeatureCollection", "features": [...] },
  "correlations": [...],
  "usgsInfo": { "url": "...", "description": "M2.5+ past 7 days" }
}
```

---

### 2.2 Satellite / TLE Layer

#### `GET /api/satellites`
Full satellite DB — all tracked objects with TLE, elevation, azimuth from `9.621887°N, 84.63969°W`.

```json
[
  {
    "satelliteName": "ISS (ZARYA)",
    "tleLine1": "1 25544U ...",
    "tleLine2": "2 25544 ...",
    "elevation": 34.2,
    "azimuth": 127.4,
    "rangeKm": 892,
    "latitude": 12.4,
    "longitude": -81.2
  }
]
```

**Use for:** Real-time satellite positions on globe, overhead pass timing for SAR collection windows.

---

#### `GET /api/satellites/groups`
TLE catalog group manifest with IDs, names, CelesTrak source URLs.

```json
{
  "groups": [
    { "id": "stations", "name": "Space Stations", "url": "https://celestrak.org/SATCAT/..." },
    { "id": "noaa", "name": "NOAA Weather Satellites", "url": "..." },
    { "id": "goes", "name": "GOES", "url": "..." }
  ]
}
```

---

#### `GET /api/tle/consistency`
TLE temporal consistency checker — flags satellites with stale or anomalous orbital elements.

```json
{
  "status": "ok",
  "anomalies": [ { "name": "COSMOS-2499", "ageDays": 47, "flag": "STALE_TLE" } ],
  "lastCheck": "2026-05-13T20:30:00Z"
}
```

---

### 2.3 Signal Intelligence Layer

#### `GET /api/kappa/status`
Live Kappa Score (0-100), threat level, domain event counts, satellite overhead count.

```json
{
  "score": 47,
  "threatLevel": "ELEVATED",
  "eventsProcessed": 24,
  "satOverhead": 3,
  "satKlein": 1,
  "kleinPasses": 2,
  "domainWindows": { "sdr": 12, "elf": 8, "satellite": 4 },
  "recentAlerts": [...]
}
```

---

#### `GET /api/stats`
Total event counts by domain since system start.

```json
{
  "totalEvents": 1716363,
  "correlationCount": 432606,
  "domainCounts": {
    "elf": 313295,
    "satellite": 161278,
    "sdr": 1217296,
    "rf": 8836,
    "radar": 23,
    "isp": 15635
  }
}
```

---

#### `GET /api/hypervisor/constants`
Full ΩCHRONOS hypervisor constant set — includes all GOS/κ-DTW temporal alignment parameters.

```json
{
  "kappa": 1.2732,
  "phi": 1.618,
  "omega": 0.5671,
  "theta_K": 128.23,
  "murray_nakamoto_hz": 1142.997,
  "lambert_w_beat_hz": 0.562,
  "phaistos_hz": 145.309,
  "machu_picchu_hz": 431.56,
  "saros_years": 18.03,
  "demodex_days": 14.4,
  "phoenix_start_ms": 1711929600000,
  "phoenix_end_ms": 1743465600000
}
```

---

#### `GET /api/phoenix/countdown`
Phoenix Event temporal progress (KAPPA's primary threat timeline).

```json
{
  "startDate": "2024-04-01T00:00:00.000Z",
  "endDate": "2025-04-01T00:00:00.000Z",
  "percentComplete": 100,
  "daysRemaining": 0,
  "totalDays": 366
}
```

---

#### `GET /api/rf-scans`
KiwiSDR scan results: 71 targets × 33 nodes. Frequency, SNR, detection type per node.

```json
[
  {
    "source": "kiwisdr-ti0rc",
    "eventType": "vlf-station-detection",
    "frequency": 25.2,
    "confidence": 0.91,
    "timestamp": "2026-05-13T09:24:58Z"
  }
]
```

---

#### `GET /api/events?domain=elf&limit=100`
Raw KAPPA events. Supports filtering by `domain`, `type`, `since`, `limit`.

**Domains:** `elf`, `sdr`, `satellite`, `rf`, `radar`, `isp`, `wifi`, `ble`, `lte`

---

#### `GET /api/correlations`
Correlation pairs with rule name, confidence, event IDs, severity.

---

#### `POST /api/gos/oracle/analyze`
**3-layer LLM analysis pipeline** (Mistral Large × 2 + Hermes 3 → synthesis).  
Send scene context, get tactical/signals/behavioral analysis + 200-token synthesis.

**Request body:**
```json
{
  "droneTarget": "NAZCA-SPIRAL-7",
  "aircraftCount": 2,
  "kappaScore": 47,
  "lunar": "Waxing Gibbous 91%",
  "solarClass": "C1.2",
  "targets": "NAZCA,ECHO,SPIRAL-ARRAY",
  "echoLat": 9.621887,
  "echoLon": -84.63969
}
```

---

### 2.4 Memory / Corpus Layer

#### `POST /api/memory/store`
Store a research finding, synthesis, or geospatial annotation into the semantic vector memory.

```json
{ "content": "Nazca Line 7 spiral centroid correlates with 145.3 Hz Phaistos frequency at 14.73 km depth", "category": "geospatial", "tags": ["nazca", "atlantis", "acoustic"] }
```

#### `POST /api/memory/search`
Semantic vector search across all stored memories.

```json
{ "query": "subsurface acoustic chamber Nazca", "limit": 10, "category": "geospatial" }
```

#### `GET /api/memory/list?category=geospatial`
List stored memories by category.

---

## 3. 3D VISUALIZATION ARCHITECTURE

### 3.1 Recommended Stack

```
Three.js / WebGL          → primary 3D Earth rendering
Globe.gl (cesium-free)    → layered point cloud + arc rendering on sphere  
Deck.gl                   → high-performance geospatial layers (LiDAR point clouds)
React + Vite              → UI shell (matches KAPPA stack)
TanStack Query v5         → polling KAPPA endpoints (30s interval)
Zustand                   → local state (active layers, time scrubber)
Turf.js                   → geospatial computations (GOS spiral generation)
```

### 3.2 Globe Rendering Layers (draw order, back to front)

```
Layer 0: Earth sphere (NASA Blue Marble texture or Stamen terrain tiles)
Layer 1: Geomagnetic field lines (from NOAA-space-weather Bz/Bt values)
Layer 2: Seismic event heatmap (USGS quakes, fade by age)
Layer 3: Schumann resonance standing wave visualization (7.83 Hz contours)
Layer 4: Satellite orbital tracks (from /api/satellites TLE propagation)
Layer 5: Nazca structure overlay (GOS spiral lattice computed from constants)
Layer 6: Muon tomography density map (import from open datasets — see §5)
Layer 7: LiDAR point cloud (Nazca/Peru region — see §5)
Layer 8: KiwiSDR RF signal strength heatmap (from /api/rf-scans)
Layer 9: Moon position indicator (from /api/lunar)
Layer 10: Solar radiation direction vector (from /api/proxy/solar-xray)
Layer 11: ELF anomaly markers (from /api/events?domain=elf)
Layer 12: Phoenix Grid overlay (temporal resonance zones)
```

### 3.3 GOS Spiral Geometry Generation

The Nazca spirals should be rendered as **Fibonacci lattice spirals** parameterized by GOS constants:

```javascript
// Generate GOS spiral vertices for a given center coordinate
function generateGOSSpiral(centerLat, centerLon, radiusKm, turns = 7) {
  const kappa = 1.2732395;
  const phi = 1.6180339887;
  const theta_K = 128.23 * (Math.PI / 180);
  const points = [];
  
  for (let i = 0; i < turns * 360; i++) {
    const angle = (i * Math.PI) / 180;
    // φ-logarithmic spiral with κ amplitude modulation
    const r = (radiusKm * kappa * Math.pow(phi, angle / (2 * Math.PI))) / Math.pow(phi, turns);
    // Rotate by Klein twist azimuth
    const rotatedAngle = angle + theta_K;
    const latOffset = (r / 111.32) * Math.cos(rotatedAngle);
    const lonOffset = (r / (111.32 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(rotatedAngle);
    points.push({ lat: centerLat + latOffset, lon: centerLon + lonOffset, r, angle });
  }
  return points;
}

// Key Nazca spiral centroids to render (approximate research coords)
const NAZCA_SPIRALS = [
  { name: "Spiral-1 (Monkey)", lat: -14.7067, lon: -75.1300, radiusKm: 0.8 },
  { name: "Spiral-2 (Spider)", lat: -14.6912, lon: -75.1200, radiusKm: 0.6 },
  { name: "Spiral-3 (Condor)", lat: -14.7204, lon: -75.0981, radiusKm: 1.2 },
  { name: "Spiral-4 (Hummingbird)", lat: -14.6783, lon: -75.1501, radiusKm: 0.5 },
  { name: "Spiral-5 (Astronaut)", lat: -14.7453, lon: -75.0792, radiusKm: 0.4 },
  // Underground acoustic chamber projected centers (research estimates):
  { name: "Chamber-Alpha", lat: -14.7100, lon: -75.1150, radiusKm: 2.1, depth_m: 47 },
  { name: "Chamber-Beta",  lat: -14.6950, lon: -75.0900, radiusKm: 1.8, depth_m: 63 },
  { name: "Chamber-Gamma", lat: -14.7300, lon: -75.1400, radiusKm: 3.2, depth_m: 31 },
];
```

### 3.4 Schumann Resonance Standing Wave Overlay

```javascript
// Approximate Schumann standing wave contour on sphere
// The fundamental 7.83 Hz mode produces 1 full wavelength around Earth's circumference
function schumannContour(lat, lon, time_s) {
  const f_sch = 7.83; // Hz
  const earthRadius = 6371; // km
  const c_effective = f_sch * (2 * Math.PI * earthRadius); // phase velocity
  const phase = (2 * Math.PI * f_sch * time_s) - 
                (2 * Math.PI * earthRadius * lat * Math.PI / 180);
  return Math.sin(phase) * Math.cos(lon * Math.PI / 180);
}
```

### 3.5 Data Polling Strategy

```javascript
// Recommended polling intervals for the 3D globe refresh loop
const POLLING_SCHEDULE = {
  "/api/oracle/conjunction":       30_000,  // 30s — moon + GOS overlay
  "/api/proxy/noaa-space-weather":  60_000,  // 1min — Kp/solar wind
  "/api/proxy/solar-xray":          60_000,  // 1min — X-ray class
  "/api/kappa/status":              15_000,  // 15s — Kappa Score + alerts
  "/api/satellites":               120_000,  // 2min — orbital positions
  "/api/proxy/usgs-quakes":        300_000,  // 5min — seismic
  "/api/tidal":                    600_000,  // 10min — tidal
  "/api/events?domain=elf&limit=50":30_000,  // 30s — ELF anomalies
  "/api/rf-scans":                  90_000,  // 90s — KiwiSDR results
};
```

---

## 4. GOOGLE API INTEGRATION

### 4.1 Google Maps / Earth Embed
- **Maps JavaScript API** — satellite tile base layer for 2D zoom-in panels
- **Maps Elevation API** — `GET https://maps.googleapis.com/maps/api/elevation/json?locations={lat},{lon}&key={KEY}` — ground truth elevation for Nazca region (compare against muon depth estimates)
- **Places API** — name lookups for discovered coordinates

### 4.2 Google Earth Engine (GEE) — Most Powerful Option
GEE has **40+ years of satellite imagery** and direct LIDAR/SAR access. Sign up for free research access at `earthengine.google.com`.

Key datasets available in GEE for Atlantis/Nazca research:

```javascript
// In GEE Code Editor or via Python API:
// Sentinel-1 SAR — penetrates surface for subsurface structure detection
var sar = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(nazcaBounds)
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .select(['VV', 'VH']);

// SRTM 30m Digital Elevation Model — base topography
var dem = ee.Image('USGS/SRTMGL1_003');

// GEDI LiDAR — NASA's Global Ecosystem Dynamics Investigation
var gedi = ee.ImageCollection('LARSE/GEDI/GEDI02_A_002_MONTHLY')
  .filterBounds(nazcaBounds);

// Landsat 8 — surface mineralogy (iron content = ancient construction proxy)
var landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(nazcaBounds);
```

**GEE Python API endpoint pattern for server integration:**
```python
import ee
ee.Initialize(credentials)
# Export computed image to Google Drive or GCS, then serve as tile layer
```

---

## 5. OPEN DATA SOURCES FOR ATLANTIS HUNT

### 5.1 LiDAR (Highest Priority)

| Source | URL | Coverage | Format | Notes |
|--------|-----|----------|--------|-------|
| **OpenTopography** | `portal.opentopography.org` | Global + regional high-res | LAS/LAZ | **Best free source.** Has Nazca region. API: `https://portal.opentopography.org/API/globaldem?demtype=SRTMGL1&south=-16&north=-13&west=-76&east=-74&outputFormat=GTiff` |
| **NASA GEDI** | `gedi.umd.edu` | Global forest/ground cover | HDF5 | Ground elevation from ISS LiDAR. Download via Earthdata |
| **USGS 3DEP** | `prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/` | USA only | LAS | N/A for Nazca but good for reference |
| **Peru Ministry (MINAM)** | `geoservidor.minam.gob.pe` | Peru national | SHP/GeoTIFF | Has elevation data for Ica/Nazca region |
| **ICESat-2** | `nsidc.org/data/ATL08` | Global | HDF5 | NASA photon-counting LiDAR, 91-day repeat |

**OpenTopography API call for Nazca plateau:**
```
GET https://portal.opentopography.org/API/globaldem
  ?demtype=SRTMGL1
  &south=-15.0&north=-14.5
  &west=-75.4&east=-74.8
  &outputFormat=GTiff
  &API_Key={YOUR_KEY}
```
Free API key at `opentopography.org/api_access`.

---

### 5.2 Muon Tomography Data

Muon tomography is used to image **density anomalies** inside structures (volcanoes, pyramids, underground chambers). No real-time public API exists, but published datasets are downloadable:

| Source | URL | Notes |
|--------|-----|-------|
| **CERN Open Data** | `opendata.cern.ch` | Search "muon detector" — CMS muon data, good for algorithm reference |
| **MURAVES (Vesuvius)** | `muon.na.infn.it/muraves` | Published muography data for Vesuvius — directly analogous to what Nazca chambers would produce |
| **SciCat (SNS)** | `scicatproject.github.io` | Neutron/muon datasets from national labs |
| **ArXiv Muography** | Search `arxiv.org/search/?query=muography+underground` | Download papers with synthetic datasets |
| **KEK Muon Science Lab** | `cmrc.kek.jp` | Japanese program — has published Giza pyramid muon data (most relevant to ancient chambers) |
| **Nagoya Muon Papers** | `muon.coi.nagoya-u.ac.jp` | Egyptian pyramid scans — extract density inversion algorithms |

**Key Giza muon tomography paper** (directly applicable to Nazca chamber hypothesis):  
`arxiv.org/abs/1711.01758` — "Discovery of a Big Void in Khufu's Pyramid by Observation of Cosmic-ray Muons"  
Download the supplementary data to get the density matrix format.

**Synthetic muon simulation** (if you can't get real data):
```javascript
// Simulate muon flux attenuation through rock
// Muon range in rock: ~1 km per 230 GeV
// For typical cosmic muons (2-3 GeV): penetrate ~5-10m of standard rock
function muonTransmission(densityGcm3, thicknessM) {
  const standardRockDensity = 2.65; // g/cm³
  const X0 = 26.76; // g/cm² radiation length for standard rock
  const muonMeanRange = 300; // g/cm² for ~2 GeV muon
  const areal_density = densityGcm3 * 100 * thicknessM; // g/cm²
  return Math.exp(-areal_density / muonMeanRange);
}

// A void chamber (air, density 0.0013 g/cm³) shows as HIGH transmission
// vs. solid rock (density 2.65 g/cm³) = LOW transmission
// Ratio gives chamber detection signature
```

---

### 5.3 Satellite SAR (Synthetic Aperture Radar)
SAR penetrates dry desert sand to ~2m depth — directly applicable to Nazca.

| Source | URL | Notes |
|--------|-----|-------|
| **Copernicus Open Access Hub** | `dataspace.copernicus.eu` | Free Sentinel-1 SAR. Register, then API: `https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=...` |
| **ASF DAAC** | `search.asf.alaska.edu` | Alaska Satellite Facility — huge archive of ERS, ALOS, Sentinel-1 SAR |
| **JAXA ALOS-2** | `www.eorc.jaxa.jp/ALOS-2` | L-band SAR — deepest surface penetration (~5m in dry conditions) |
| **NASA UAVSAR** | `uavsar.jpl.nasa.gov` | Airborne L-band SAR — very high resolution, some South America coverage |

**ASF API example (Sentinel-1, Nazca region):**
```
GET https://api.daac.asf.alaska.edu/services/search/param
  ?platform=Sentinel-1
  &bbox=-75.5,-15.1,-74.7,-14.4
  &start=2020-01-01T00:00:00UTC
  &end=2026-05-01T00:00:00UTC
  &processingLevel=GRD_HD
  &output=geojson
```

---

### 5.4 Gravity & Geomagnetic Data

| Source | URL | Notes |
|--------|-----|-------|
| **GRACE-FO (NASA)** | `podaac.jpl.nasa.gov/GRACE-FO` | Gravity anomaly data — underground mass variations |
| **NOAA NGDC Magnetics** | `www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml` | Magnetic declination + field vector API |
| **BGS World Magnetic Model** | `www.ngdc.noaa.gov/geomag/WMM/` | `GET https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml?model=WMM&lat=-14.7&lon=-75.1&alt=0.38&resultFormat=json` |
| **EMAG2 (Earth Mag Anomaly Grid)** | `geomag.colorado.edu/emag.html` | 2-arc-minute resolution total field anomaly, downloadable GeoTIFF |
| **ICGEM (Gravity Models)** | `icgem.gfz-potsdam.de` | Global gravity field models — EGM2008 is standard |

**NOAA Magnetic Field API for Nazca:**
```
GET https://www.ngdc.noaa.gov/geomag-web/calculators/calculateIgrfgrid
  ?lat1=-15&lat2=-14.5&lon1=-75.5&lon2=-74.8
  &latStepSize=0.1&lonStepSize=0.1
  &magneticComponent=d&resultFormat=json&key={YOUR_KEY}
```

---

### 5.5 Ancient Infrastructure / Archaeological

| Source | URL | Notes |
|--------|-----|-------|
| **tDAR (Digital Archaeological Record)** | `core.tdar.org` | 120k+ archaeological datasets, CC licensed |
| **Open Context** | `opencontext.org/search/?q=nazca` | Archaeological data API: `GET https://opencontext.org/search/.json?q=nazca&geo-bbox=-76,-16,-74,-14` |
| **Pleiades** | `pleiades.stoa.org` | Ancient places gazetteer with coordinates. API: `GET https://pleiades.stoa.org/search_rss?SearchableText=nazca&portal_type=Place` |
| **ESDAC (Soil Data)** | `esdac.jrc.ec.europa.eu` | European soil data — proxy for ancient landscape reconstruction |
| **WorldPop** | `www.worldpop.org/geodata/` | Population + land use rasters |

**Open Context Nazca API:**
```
GET https://opencontext.org/search/.json
  ?q=nazca
  &geo-bbox=-76,-16,-74,-14
  &proj=nasca-bioarchaeology-project
```

---

### 5.6 Acoustic / Infrasound Data

| Source | URL | Notes |
|--------|-----|-------|
| **IMS Infrasound (CTBTO)** | `www.ctbto.org/verification-regime/ims` | 60-station global infrasound network. Data via IRIS FDSN API |
| **IRIS FDSN Seismic** | `service.iris.edu/fdsnws/dataselect/1/` | Download waveform data for acoustic-seismic coupling analysis |
| **NOAA PMEL Hydroacoustic** | `www.pmel.noaa.gov/acoustics/` | Ocean infrasound — useful for Pacific coast resonance |
| **Global Seismographic Network** | `ds.iris.edu/ds/nodes/dmc/` | Broadband seismic = acoustic proxy at low frequencies |

**IRIS waveform fetch for Nazca-region station:**
```
GET https://service.iris.edu/fdsnws/dataselect/1/query
  ?network=II&station=NNA&location=00&channel=BHZ
  &starttime=2026-05-13T00:00:00&endtime=2026-05-13T01:00:00
  &format=miniseed
```
NNA = Nana, Peru — closest broadband seismic to Nazca.

---

### 5.7 Ionosphere / ELF (Directly Wired to Schumann)

| Source | URL | Notes |
|--------|-----|-------|
| **Space Weather Live** | `api.spaceweatherlive.com` | Kp, Ap, X-ray, proton flux — JSON API, free tier |
| **LISN (Low Latitude Ionosphere)** | `lisn.igp.gob.pe` | Peruvian ionosphere network — has GPS TEC data directly over Nazca |
| **Madrigal (MIT Haystack)** | `cedar.openmadrigal.org` | Global ionosphere database, Python API |
| **PolSAR (Polarimetric SAR)** | In ASF DAAC | Polarimetric SAR reveals subsurface dielectric contrasts |

**Schumann resonance real-time feed:**
```
GET https://api.spaceweatherlive.com/alerts/latest  
  (or scrape Tomsk Schumann: http://sosrff.tsu.ru/?page_id=7 — manual download only)
```

Schumann monitoring stations with public data:
- **Cumiana, Italy:** `www.schumannresonance.it`
- **Kiel, Germany:** Published via HeliDATa / GFZ Potsdam
- **Magyar station:** `www.tarsoly.hu/~simonyi/sr/`

---

## 6. APP ARCHITECTURE FOR THE ATLANTIS HUNT APP

### 6.1 Page Structure

```
/                 → Earth Globe (main 3D view, all layers)
/nazca            → Nazca zoom view + muon density overlay + spiral geometry
/acoustic         → Acoustic chamber visualization (subsurface cross-section)
/timeline         → Phoenix Grid + Schumann cycles + solar cycle alignment
/data             → Raw data explorer (all KAPPA feeds + LiDAR downloads)
/research         → Memory Cortex search + synthesis history
```

### 6.2 Three.js Globe Implementation

```javascript
import * as THREE from 'three';

// Earth sphere with NASA texture
const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
const earthTexture = new THREE.TextureLoader().load(
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/1200px-Blue_Marble_2002.png'
);
const earthMesh = new THREE.Mesh(
  earthGeometry,
  new THREE.MeshPhongMaterial({ map: earthTexture, specularMap: specTexture })
);

// Convert lat/lon to 3D sphere position
function latLonToVector3(lat, lon, radius = 1.01) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
     (radius * Math.cos(phi)),
     (radius * Math.sin(phi) * Math.sin(theta))
  );
}

// Place a KAPPA ELF event as a pulsing sphere on the globe
function addELFMarker(lat, lon, intensity) {
  const pos = latLonToVector3(lat, lon);
  const geo = new THREE.SphereGeometry(0.005 * intensity, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.7 });
  const marker = new THREE.Mesh(geo, mat);
  marker.position.copy(pos);
  scene.add(marker);
  // Pulse animation — scale with Kp index
  return marker;
}

// Render satellite orbital arc
function addSatelliteArc(tleLine1, tleLine2) {
  const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
  const points = [];
  for (let i = 0; i < 5760; i += 10) { // 1 orbit in 10-second steps
    const t = new Date(Date.now() + i * 1000);
    const pv = satellite.propagate(satrec, t);
    if (!pv.position) continue;
    const gmst = satellite.gstime(t);
    const geo = satellite.eciToGeodetic(pv.position, gmst);
    points.push(latLonToVector3(
      satellite.radiansToDegrees(geo.latitude),
      satellite.radiansToDegrees(geo.longitude),
      1.02
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 200, 0.001, 4, false);
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x4488ff })));
}
```

### 6.3 Geomagnetic Field Line Rendering

```javascript
// Render Bz field line from NOAA space weather data
function renderFieldLines(bz, bt, kp) {
  const fieldStrength = Math.abs(bz) / bt; // normalized 0-1
  const numLines = Math.floor(4 + kp * 2); // more lines when disturbed
  
  for (let i = 0; i < numLines; i++) {
    const lon = (i / numLines) * 360 - 180;
    const points = [];
    for (let lat = -80; lat <= 80; lat += 5) {
      // Simplified dipole field line
      const r = 1.01 + 0.1 * Math.cos(lat * Math.PI / 180) * fieldStrength;
      points.push(latLonToVector3(lat, lon, r));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 60, 0.0005, 4, false);
    const color = bz < 0 ? 0xff4444 : 0x4488ff; // red=southward (geomagnetic storm)
    scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 })));
  }
}
```

### 6.4 KAPPA Integration Hook (React)

```typescript
// hooks/useKAPPA.ts — fetches all KAPPA feeds and exposes to Three.js globe
import { useQuery } from '@tanstack/react-query';

const KAPPA_BASE = 'https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev';

export function useKAPPAGlobeData() {
  const conjunction = useQuery({
    queryKey: ['kappa', 'conjunction'],
    queryFn: () => fetch(`${KAPPA_BASE}/api/oracle/conjunction`).then(r => r.json()),
    refetchInterval: 30_000,
  });

  const spaceWeather = useQuery({
    queryKey: ['kappa', 'space-weather'],
    queryFn: () => fetch(`${KAPPA_BASE}/api/proxy/noaa-space-weather`).then(r => r.json()),
    refetchInterval: 60_000,
  });

  const satellites = useQuery({
    queryKey: ['kappa', 'satellites'],
    queryFn: () => fetch(`${KAPPA_BASE}/api/satellites`).then(r => r.json()),
    refetchInterval: 120_000,
  });

  const elfEvents = useQuery({
    queryKey: ['kappa', 'elf'],
    queryFn: () => fetch(`${KAPPA_BASE}/api/events?domain=elf&limit=100`).then(r => r.json()),
    refetchInterval: 30_000,
  });

  const quakes = useQuery({
    queryKey: ['kappa', 'quakes'],
    queryFn: () => fetch(`${KAPPA_BASE}/api/proxy/usgs-quakes`).then(r => r.json()),
    refetchInterval: 300_000,
  });

  const kappaStatus = useQuery({
    queryKey: ['kappa', 'status'],
    queryFn: () => fetch(`${KAPPA_BASE}/api/kappa/status`).then(r => r.json()),
    refetchInterval: 15_000,
  });

  return { conjunction, spaceWeather, satellites, elfEvents, quakes, kappaStatus };
}
```

### 6.5 Acoustic Chamber Cross-Section Renderer (Muon Density)

```javascript
// Cross-section view for subsurface chamber visualization
// Uses muon transmission values to create density grid
function renderAcousticChamber(densityGrid, depthM, widthM) {
  // densityGrid: 2D array [x][z] of density values (g/cm³)
  // Values near 0 = void/chamber, values near 2.65 = solid rock
  
  const canvas = document.createElement('canvas');
  canvas.width = densityGrid[0].length;
  canvas.height = densityGrid.length;
  const ctx = canvas.getContext('2d');
  
  densityGrid.forEach((row, z) => {
    row.forEach((density, x) => {
      // Color map: dark = rock, bright cyan = void (chamber)
      const normalized = 1 - (density / 2.65); // 0=rock, 1=void
      const r = Math.floor(normalized * 0);
      const g = Math.floor(normalized * 255);
      const b = Math.floor(normalized * 200 + 55);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, z, 1, 1);
    });
  });
  
  // Overlay GOS frequency contours
  // At resonance depth, the Schumann frequency produces standing wave patterns
  // f_depth = f_surface * sqrt(density_ratio) — acoustic dispersion in rock
  const f_chamber = 7.83 * Math.sqrt(2.65 / 0.0013); // Schumann in rock vs air
  drawFrequencyContour(ctx, f_chamber, canvas.width, canvas.height);
  
  return canvas;
}
```

---

## 7. AGENT IMPLEMENTATION RECOMMENDATIONS

### 7.1 Build Order (Recommended)

1. **Globe shell** — Three.js sphere with Earth texture, camera controls (OrbitControls), day/night shader
2. **KAPPA data hooks** — wire all 10 endpoints using `useKAPPAGlobeData()` hook above
3. **Satellite layer** — pull `/api/satellites` and render orbital arcs using `satellite.js`
4. **Seismic + ELF markers** — pulsing spheres from `/api/proxy/usgs-quakes` + `/api/events?domain=elf`
5. **Geomagnetic field lines** — from `/api/proxy/noaa-space-weather` Bz/Bt values
6. **Nazca spiral overlay** — GOS spiral geometry from §3.3, rendered as glowing line geometry
7. **OpenTopography LiDAR tile layer** — DEM tiles for Nazca plateau, rendered as bump-mapped terrain
8. **Muon density overlay** — import Giza tomography data as proxy, apply to Nazca chamber hypothesis
9. **Acoustic cross-section panel** — side panel showing subsurface slice with density visualization
10. **LLM synthesis** — POST to `/api/gos/oracle/analyze` with current globe state for AI commentary

### 7.2 npm Packages Needed

```json
{
  "three": "^0.160.0",
  "satellite.js": "^4.1.4",
  "@deck.gl/core": "^8.9.0",
  "@deck.gl/layers": "^8.9.0",
  "globe.gl": "^2.26.0",
  "@turf/turf": "^6.5.0",
  "geotiff": "^2.1.0",
  "proj4": "^2.9.0",
  "d3-geo": "^3.1.0",
  "@tanstack/react-query": "^5.0.0"
}
```

### 7.3 Key Nazca / Peru Bounding Box

```
Nazca Lines plateau:
  south: -15.1°, north: -14.3°
  west: -75.6°, east: -74.6°

Nazca city center: -14.8296°N, -74.9382°W
Cahuachi ceremonial center (Atlantis candidate): -14.8101°N, -75.1044°W
Palpa spiral complex: -14.5347°N, -75.1786°W

Ica region (broader):
  south: -15.5°, north: -13.8°
  west: -76.0°, east: -74.0°
```

### 7.4 Acoustic Chamber Frequency Analysis

Cross-correlate KAPPA's ELF events with Schumann harmonics over the Nazca region:

```javascript
// Schumann harmonics (Hz): 7.83, 14.3, 20.8, 27.3, 33.8, 39.9 ...
// Chamber resonances scale as: f_n = (c/2L) * n where L = chamber length
// For a 100m chamber: f_1 = 340/(2*100) = 1.7 Hz (sub-Schumann)
// For a 10m chamber: f_1 = 340/(2*10) = 17 Hz (Schumann range!)
// For a 1m chamber: f_1 = 170 Hz (near Phaistos: 145.3 Hz)

const CHAMBER_SIGNATURES = {
  'large_void_100m': [1.7, 3.4, 5.1],    // sub-ELF range
  'medium_void_10m': [17, 34, 51],         // Schumann harmonic range
  'small_void_1m':   [170, 340, 510],      // Phaistos / Murray-Nakamoto range
  'phaistos_lock':   [145.309],            // KAPPA constant — exact match = discovery
};

// Feed KAPPA ELF events through chamber signature filter:
async function detectChamberResonance() {
  const events = await fetch(`${KAPPA_BASE}/api/events?domain=elf&limit=500`).then(r => r.json());
  const rfScans = await fetch(`${KAPPA_BASE}/api/rf-scans`).then(r => r.json());
  
  // Match detected frequencies against chamber signatures
  return rfScans.filter(scan => 
    Object.values(CHAMBER_SIGNATURES).flat().some(f => 
      Math.abs(scan.frequency - f) / f < 0.05 // within 5%
    )
  );
}
```

---

## 8. ATLANTIS GEOGRAPHIC CANDIDATES

Based on acoustic resonance structure, electromagnetic anomaly, and proximity to Pacific plate subduction:

| Site | Coordinates | Evidence | Data to Pull |
|------|-------------|----------|--------------|
| **Cahuachi** | -14.81°, -75.10° | Largest ancient site in Nazca region, mud-brick pyramids, ritual center | SAR subsurface, GEE imagery |
| **Palpa Spirals** | -14.53°, -75.18° | Concentrated spiral geoglyph cluster, older than Nazca | OpenTopography DEM |
| **Huaca del Sol** | -8.09°, -79.00° | Northern Peru, massive platform mound | Muon tomography candidate |
| **Tiwanaku** | -16.56°, -68.68° | Altiplano, near Lake Titicaca, 3800m altitude | Anomalous magnetic readings |
| **Chavín de Huántar** | -9.59°, -77.18° | Underground galleries confirmed, acoustic resonance documented in literature | IRIS seismic NNA station |
| **Sacsayhuamán** | -13.51°, -71.98° | Cusco, massive polygonal construction, geomagnetic anomaly area | EMAG2 data |

**Priority research site: Cahuachi** — located on the dry Nazca river system, known tunnel systems, directly underneath main Nazca Lines concentration, never fully excavated.

---

## 9. MEMORY CORTEX INTEGRATION

Store every discovered correlation into KAPPA's Memory Cortex for recursive synthesis:

```javascript
// After each analysis cycle, store findings
async function storeAtlantisDiscovery(finding) {
  await fetch(`${KAPPA_BASE}/api/memory/store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: finding.description,
      category: 'geospatial',
      tags: ['atlantis', 'nazca', finding.type, ...finding.coordinates ? ['geolocated'] : []],
      metadata: {
        lat: finding.lat,
        lon: finding.lon,
        frequency: finding.frequency,
        chamberDepth: finding.depthEstimate,
        kappaScore: finding.kappaAtTime,
        gosAlignment: finding.gosPhase,
      }
    })
  });
}

// Search accumulated research
async function recallAtlantisContext(query) {
  return fetch(`${KAPPA_BASE}/api/memory/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 20, category: 'geospatial' })
  }).then(r => r.json());
}
```

---

## 10. SUMMARY CHECKLIST FOR THE BUILDING AGENT

- [ ] Three.js globe with 12 data layers (§3.2)
- [ ] Wire all 10 KAPPA endpoints using the base URL above
- [ ] GOS spiral geometry for Nazca centroids (§3.3)
- [ ] OpenTopography API key — free, apply at `portal.opentopography.org`
- [ ] Google Earth Engine account — `earthengine.google.com` (research access)
- [ ] ASF DAAC account — `search.asf.alaska.edu` (free Sentinel-1 SAR)
- [ ] IRIS FDSN waveform fetch for station NNA (Nana, Peru)
- [ ] Muon density simulation using Giza paper algorithm (arxiv 1711.01758)
- [ ] Acoustic chamber frequency matcher against KAPPA RF-scans
- [ ] Memory Cortex integration for recursive finding storage
- [ ] POST to `/api/gos/oracle/analyze` for LLM synthesis layer

**The goal:** When Phaistos frequency (145.309 Hz) is detected in KAPPA RF-scans AND muon density shows a void AND OpenTopography shows an anomalous depression AND seismic shows a resonant cavity — that intersection point is a chamber. That is the hunt.
