const PRIME_SPOKES = [1, 5, 7, 11, 13, 17, 19, 23];
const SPOKE_ANGLES_DEG = PRIME_SPOKES.map(s => s * 15);
const ALL_SECTORS = Array.from({ length: 24 }, (_, i) => i);
const GAP_SECTORS = ALL_SECTORS.filter(s => !PRIME_SPOKES.includes(s));
const BASE53_BINS = 53;
const MAX_IMAGE_DIMENSION = 2048;
const MAX_IMAGE_PIXELS = 2048 * 2048;

export interface IcositetragonResult {
  anomalyScore: number;
  spokeEdgeCount: number;
  gapEdgeCount: number;
  base53Entropy: number;
  cloakedCandidates: number;
  spokeEdges: { angle: number; strength: number }[];
  gapEdges: { sector: number; strength: number }[];
  findings: string[];
  filterOutputs: FilterOutput[];
  overlayRGBA?: number[];
  sectorBreakdown: { sector: number; type: "spoke" | "gap"; angleDeg: number; edgeStrength: number; anomalyFlag: boolean }[];
}

export interface FilterOutput {
  method: string;
  description: string;
  data: number[];
  width: number;
  height: number;
}

interface PixelData {
  data: number[];
  width: number;
  height: number;
  channels: number;
}

function getPixel(img: PixelData, x: number, y: number): number {
  if (x < 0 || x >= img.width || y < 0 || y >= img.height) return 0;
  const idx = (y * img.width + x) * img.channels;
  if (img.channels >= 3) {
    return 0.299 * img.data[idx] + 0.587 * img.data[idx + 1] + 0.114 * img.data[idx + 2];
  }
  return img.data[idx];
}

function sobelAt(img: PixelData, x: number, y: number): { gx: number; gy: number; magnitude: number } {
  const gx =
    -1 * getPixel(img, x - 1, y - 1) + 1 * getPixel(img, x + 1, y - 1) +
    -2 * getPixel(img, x - 1, y) + 2 * getPixel(img, x + 1, y) +
    -1 * getPixel(img, x - 1, y + 1) + 1 * getPixel(img, x + 1, y + 1);
  const gy =
    -1 * getPixel(img, x - 1, y - 1) - 2 * getPixel(img, x, y - 1) - 1 * getPixel(img, x + 1, y - 1) +
    1 * getPixel(img, x - 1, y + 1) + 2 * getPixel(img, x, y + 1) + 1 * getPixel(img, x + 1, y + 1);
  return { gx, gy, magnitude: Math.sqrt(gx * gx + gy * gy) };
}

function laplacianAt(img: PixelData, x: number, y: number): number {
  return (
    getPixel(img, x - 1, y) + getPixel(img, x + 1, y) +
    getPixel(img, x, y - 1) + getPixel(img, x, y + 1) -
    4 * getPixel(img, x, y)
  );
}

function computeSobelMap(img: PixelData): number[] {
  const result: number[] = new Array(img.width * img.height);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      result[y * img.width + x] = sobelAt(img, x, y).magnitude;
    }
  }
  return result;
}

function computeLaplacianMap(img: PixelData): number[] {
  const result: number[] = new Array(img.width * img.height);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      result[y * img.width + x] = Math.abs(laplacianAt(img, x, y));
    }
  }
  return result;
}

function histogramEqualize(img: PixelData): PixelData {
  const gray: number[] = [];
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      gray.push(Math.round(getPixel(img, x, y)));
    }
  }

  const hist = new Array(256).fill(0);
  gray.forEach(v => hist[Math.min(255, Math.max(0, v))]++);

  const cdf = new Array(256).fill(0);
  cdf[0] = hist[0];
  for (let i = 1; i < 256; i++) cdf[i] = cdf[i - 1] + hist[i];

  const cdfMin = cdf.find(v => v > 0) || 0;
  const total = img.width * img.height;
  const lut = new Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(((cdf[i] - cdfMin) / (total - cdfMin)) * 255);
  }

  const newData: number[] = new Array(img.data.length);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const idx = (y * img.width + x) * img.channels;
      const g = Math.round(getPixel(img, x, y));
      const eq = lut[Math.min(255, Math.max(0, g))];
      for (let c = 0; c < img.channels; c++) {
        if (c < 3) {
          const ratio = img.data[idx + c] / (g || 1);
          newData[idx + c] = Math.min(255, Math.max(0, Math.round(eq * ratio)));
        } else {
          newData[idx + c] = img.data[idx + c];
        }
      }
    }
  }

  return { data: newData, width: img.width, height: img.height, channels: img.channels };
}

function contrastStretch(img: PixelData, factor: number): PixelData {
  const newData = [...img.data];
  for (let i = 0; i < newData.length; i++) {
    if (i % img.channels < 3) {
      newData[i] = Math.min(255, Math.max(0, Math.round(128 + (newData[i] - 128) * factor)));
    }
  }
  return { data: newData, width: img.width, height: img.height, channels: img.channels };
}

function directionalSobel(img: PixelData, angleDeg: number): number[] {
  const angleRad = angleDeg * Math.PI / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const kx = [
    [-cos - sin, -2 * cos, -cos + sin],
    [-sin, 0, sin],
    [cos - sin, 2 * cos, cos + sin],
  ];
  const ky = [
    [-sin - cos, -2 * sin, -sin + cos],
    [-cos, 0, cos],
    [sin - cos, 2 * sin, sin + cos],
  ];

  const result: number[] = new Array(img.width * img.height);
  for (let y = 1; y < img.height - 1; y++) {
    for (let x = 1; x < img.width - 1; x++) {
      let gx = 0, gy = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const p = getPixel(img, x + dx, y + dy);
          gx += p * kx[dy + 1][dx + 1];
          gy += p * ky[dy + 1][dx + 1];
        }
      }
      result[y * img.width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  for (let x = 0; x < img.width; x++) {
    result[x] = 0;
    result[(img.height - 1) * img.width + x] = 0;
  }
  for (let y = 0; y < img.height; y++) {
    result[y * img.width] = 0;
    result[y * img.width + img.width - 1] = 0;
  }
  return result;
}

function generateAnnotatedOverlay(
  img: PixelData,
  sobelMap: number[],
  spokeStrengths: number[],
  gapStrengths: number[],
  avgSpoke: number,
  avgGap: number
): number[] {
  const w = img.width;
  const h = img.height;
  const rgba = new Array(w * h * 4).fill(0);
  const cx = w / 2;
  const cy = h / 2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
      if (angleDeg < 0) angleDeg += 360;
      const sectorIdx = Math.floor(angleDeg / 15) % 24;
      const edgeVal = Math.min(255, sobelMap[y * w + x]);

      const isSpokeSector = PRIME_SPOKES.includes(sectorIdx);

      if (edgeVal > 30) {
        if (isSpokeSector) {
          rgba[idx] = 0;
          rgba[idx + 1] = Math.min(255, edgeVal * 2);
          rgba[idx + 2] = Math.min(255, edgeVal);
          rgba[idx + 3] = Math.min(200, edgeVal + 60);
        } else {
          const gapIdx = GAP_SECTORS.indexOf(sectorIdx);
          const isAnomaly = gapIdx >= 0 && gapStrengths[gapIdx] > avgGap * 1.5;
          if (isAnomaly) {
            rgba[idx] = 255;
            rgba[idx + 1] = Math.min(100, edgeVal / 2);
            rgba[idx + 2] = 0;
            rgba[idx + 3] = Math.min(220, edgeVal + 80);
          } else {
            rgba[idx] = Math.min(255, edgeVal);
            rgba[idx + 1] = Math.min(200, edgeVal);
            rgba[idx + 2] = 0;
            rgba[idx + 3] = Math.min(160, edgeVal + 40);
          }
        }
      }
    }
  }

  const lineLen = Math.min(w, h) / 2;
  for (let s = 0; s < 24; s++) {
    const angle = s * 15 * Math.PI / 180;
    const isSpoke = PRIME_SPOKES.includes(s);
    for (let r = 0; r < lineLen; r += 0.5) {
      const px = Math.round(cx + r * Math.cos(angle));
      const py = Math.round(cy + r * Math.sin(angle));
      if (px >= 0 && px < w && py >= 0 && py < h) {
        const idx = (py * w + px) * 4;
        if (isSpoke) {
          rgba[idx] = 0; rgba[idx + 1] = 255; rgba[idx + 2] = 200; rgba[idx + 3] = 180;
        } else {
          rgba[idx] = 120; rgba[idx + 1] = 120; rgba[idx + 2] = 40; rgba[idx + 3] = 80;
        }
      }
    }
  }

  return rgba;
}

function gapSectorCloaking(img: PixelData, sobelMap: number[]): { data: number[]; gapCandidates: number } {
  const w = img.width;
  const h = img.height;
  const cx = w / 2;
  const cy = h / 2;
  const result = new Array(w * h).fill(0);
  let gapCandidates = 0;

  const gapEqualized = histogramEqualize(img);
  const gapStretched = contrastStretch(gapEqualized, 4);
  const gapEdges = computeSobelMap(gapStretched);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
      if (angleDeg < 0) angleDeg += 360;
      const sectorIdx = Math.floor(angleDeg / 15) % 24;

      if (!PRIME_SPOKES.includes(sectorIdx)) {
        const enhancedVal = gapEdges[y * w + x];
        const originalVal = sobelMap[y * w + x];
        const diff = Math.abs(enhancedVal - originalVal);
        result[y * w + x] = enhancedVal;
        if (diff > 25) gapCandidates++;
      } else {
        result[y * w + x] = sobelMap[y * w + x];
      }
    }
  }

  return { data: result, gapCandidates: Math.floor(gapCandidates / (w * h) * 100) };
}

function computeBase53Entropy(img: PixelData): number {
  const bins = new Array(BASE53_BINS).fill(0);
  const total = img.width * img.height;

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const intensity = getPixel(img, x, y);
      const bin = Math.min(BASE53_BINS - 1, Math.floor((intensity / 256) * BASE53_BINS));
      bins[bin]++;
    }
  }

  let entropy = 0;
  for (const count of bins) {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

function computeBinaryEdges(edgeMap: number[], threshold: number): number[] {
  const sorted = [...edgeMap].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * threshold);
  const cutoff = sorted[idx];
  return edgeMap.map(v => v >= cutoff ? 255 : 0);
}

function classifyEdgeAngles(img: PixelData): { spokeStrengths: number[]; gapStrengths: number[] } {
  const spokeStrengths: number[] = [];
  const gapStrengths: number[] = [];

  for (const angle of SPOKE_ANGLES_DEG) {
    const edges = directionalSobel(img, angle);
    const total = edges.reduce((s, v) => s + v, 0);
    spokeStrengths.push(total / edges.length);
  }

  for (const sector of GAP_SECTORS) {
    const angle = sector * 15;
    const edges = directionalSobel(img, angle);
    const total = edges.reduce((s, v) => s + v, 0);
    gapStrengths.push(total / edges.length);
  }

  return { spokeStrengths, gapStrengths };
}

export function analyzeImage(rawData: Buffer, width: number, height: number, channels: number = 4): IcositetragonResult {
  const data: number[] = [];
  for (let i = 0; i < rawData.length; i++) data.push(rawData[i]);

  const img: PixelData = { data, width, height, channels };
  const findings: string[] = [];
  const filterOutputs: FilterOutput[] = [];

  const sobelMap = computeSobelMap(img);
  filterOutputs.push({ method: "sobel", description: "Sobel gradient magnitude", data: sobelMap, width, height });

  const laplacianMap = computeLaplacianMap(img);
  filterOutputs.push({ method: "laplacian", description: "Laplacian edge detection", data: laplacianMap, width, height });

  const binaryEdges = computeBinaryEdges(sobelMap, 0.85);
  filterOutputs.push({ method: "binary_edges", description: "85th percentile binary threshold", data: binaryEdges, width, height });

  const equalized = histogramEqualize(img);
  const eqSobel = computeSobelMap(equalized);
  filterOutputs.push({ method: "equalized_edges", description: "Histogram-equalized edge detection", data: eqSobel, width, height });

  const stretched = contrastStretch(img, 4);
  const stretchedSobel = computeSobelMap(stretched);
  filterOutputs.push({ method: "enhanced_edges", description: "4x contrast enhanced edges", data: stretchedSobel, width, height });

  const { spokeStrengths, gapStrengths } = classifyEdgeAngles(img);
  const avgSpoke = spokeStrengths.reduce((s, v) => s + v, 0) / spokeStrengths.length;
  const avgGap = gapStrengths.reduce((s, v) => s + v, 0) / gapStrengths.length;

  const spokeEdgeCount = spokeStrengths.filter(s => s > avgSpoke * 1.5).length;
  const gapEdgeCount = gapStrengths.filter(s => s > avgGap * 1.5).length;

  const rotationalMap: number[] = new Array(width * height).fill(0);
  for (let i = 0; i < SPOKE_ANGLES_DEG.length; i++) {
    const edges = directionalSobel(img, SPOKE_ANGLES_DEG[i]);
    for (let j = 0; j < edges.length; j++) rotationalMap[j] = Math.max(rotationalMap[j], edges[j]);
  }
  filterOutputs.push({ method: "24gon_rotational", description: "24-gon rotational edge composite (8 prime spoke angles)", data: rotationalMap, width, height });

  const { data: gapCloakData, gapCandidates: gapCloakCandidates } = gapSectorCloaking(img, sobelMap);
  filterOutputs.push({ method: "gap_sector_cloaking", description: "Gap-sector-specific cloaking detection: enhanced processing applied only to inter-spoke sectors", data: gapCloakData, width, height });

  const cloakEqualized = histogramEqualize(img);
  const cloakStretched = contrastStretch(cloakEqualized, 3);
  const cloakEdges = computeSobelMap(cloakStretched);
  filterOutputs.push({ method: "cloaking_pipeline", description: "Full cloaking detection: histogram equalization + 3x contrast + edges", data: cloakEdges, width, height });

  const base53Entropy = computeBase53Entropy(img);

  const gapRatio = avgGap > 0 ? avgGap / (avgSpoke || 1) : 0;
  let anomalyScore = 0;
  anomalyScore += gapRatio > 1.2 ? 30 : gapRatio > 0.8 ? 15 : 5;
  anomalyScore += gapEdgeCount > 4 ? 20 : gapEdgeCount > 2 ? 10 : 0;
  anomalyScore += base53Entropy > 5.0 ? 15 : base53Entropy > 4.0 ? 10 : 5;

  const cloakDiff = cloakEdges.reduce((s, v, i) => s + Math.abs(v - sobelMap[i]), 0) / cloakEdges.length;
  const cloakedCandidates = Math.max(gapCloakCandidates, cloakDiff > 20 ? Math.floor(cloakDiff / 10) : 0);
  anomalyScore += cloakedCandidates > 0 ? Math.min(35, cloakedCandidates * 5) : 0;

  anomalyScore = Math.min(100, anomalyScore);

  if (gapRatio > 1.2) findings.push(`Gap-to-spoke edge ratio ${gapRatio.toFixed(2)} exceeds threshold — anomalous structure detected in inter-spoke sectors`);
  if (gapEdgeCount > 4) findings.push(`${gapEdgeCount} gap sectors show elevated edge density — potential hidden geometry`);
  if (base53Entropy > 5.0) findings.push(`Base-53 histogram entropy ${base53Entropy.toFixed(3)} indicates high information content in 53-band analysis`);
  if (gapCloakCandidates > 0) findings.push(`${gapCloakCandidates}% gap-sector pixel differential — cloaked features isolated to inter-spoke zones`);
  if (cloakedCandidates > 0) findings.push(`${cloakedCandidates} cloaked feature candidates detected via equalization pipeline`);
  if (anomalyScore > 60) findings.push(`HIGH ANOMALY SCORE: ${anomalyScore}/100 — this image warrants detailed investigation`);
  else if (anomalyScore > 30) findings.push(`Moderate anomaly score: ${anomalyScore}/100 — some inter-spoke structure detected`);
  else findings.push(`Low anomaly score: ${anomalyScore}/100 — structure consistent with natural/expected patterns`);

  const spokeEdges = SPOKE_ANGLES_DEG.map((angle, i) => ({ angle, strength: spokeStrengths[i] }));
  const gapEdges = GAP_SECTORS.map((sector, i) => ({ sector, strength: gapStrengths[i] }));

  const overlayRGBA = generateAnnotatedOverlay(img, sobelMap, spokeStrengths, gapStrengths, avgSpoke, avgGap);

  const sectorBreakdown = ALL_SECTORS.map(s => {
    const isSpoke = PRIME_SPOKES.includes(s);
    const idx = isSpoke ? PRIME_SPOKES.indexOf(s) : GAP_SECTORS.indexOf(s);
    const strength = isSpoke ? spokeStrengths[idx] : gapStrengths[idx];
    const threshold = isSpoke ? avgSpoke * 1.5 : avgGap * 1.5;
    return {
      sector: s,
      type: (isSpoke ? "spoke" : "gap") as "spoke" | "gap",
      angleDeg: s * 15,
      edgeStrength: strength,
      anomalyFlag: strength > threshold,
    };
  });

  return {
    anomalyScore,
    spokeEdgeCount,
    gapEdgeCount,
    base53Entropy,
    cloakedCandidates,
    spokeEdges,
    gapEdges,
    findings,
    filterOutputs,
    overlayRGBA,
    sectorBreakdown,
  };
}

export const INVESTIGATION_PRESETS = [
  {
    id: "antarctic-impact",
    name: "Antarctic Impact Zone (Oumuamua Trajectory)",
    description: "Approximate coordinates along Oumuamua's projected impact/flyby trajectory near Antarctica",
    lat: -72.0,
    lon: 2.5,
    zoom: 4,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "Oumuamua hyperbolic trajectory extrapolation — potential sub-surface impact signatures",
  },
  {
    id: "3i-atlas-cr",
    name: "3I Atlas — Costa Rica Corridor",
    description: "Primary 3I Atlas observation zone: Tacacorí, Calle Los Cedros, Alajuela 20106",
    lat: 10.0514,
    lon: -84.2187,
    zoom: 8,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "3I Atlas 53 Hz infrasonic signatures, κ-weighted resonance field measurements",
  },
  {
    id: "3i-atlas-poas",
    name: "3I Atlas — Volcán Poás",
    description: "OVSICORI monitoring station — volcanic/seismic correlation with UAP activity",
    lat: 10.197,
    lon: -84.233,
    zoom: 10,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "Volcanic activity correlation with 37 Hz/53 Hz signatures — Orch-OR gamma base",
  },
  {
    id: "lake-cote",
    name: "Lake Cote, Costa Rica (1971 Photo)",
    description: "Site of the authenticated 1971 aerial survey UFO photograph",
    lat: 10.5747,
    lon: -84.9197,
    zoom: 10,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "Tier 1 sighting location — metallic disc emerged from lake. Verified by Ground Saucer Watch",
  },
  {
    id: "oumuamua-perihelion",
    name: "Oumuamua Perihelion Reference",
    description: "Projected observation window — solar system entry point",
    lat: -34.0,
    lon: 18.5,
    zoom: 4,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "Interstellar object trajectory mapping — 2017 discovery, anomalous acceleration detected",
  },
  {
    id: "skinwalker-ranch",
    name: "Skinwalker Ranch, Utah",
    description: "Historic anomaly hotspot — AAWSAP/BAASS study site",
    lat: 40.2588,
    lon: -109.8880,
    zoom: 10,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "Known UAP/anomaly hotspot with extensive government study history (DIRD-01 through DIRD-37)",
  },
  {
    id: "hessdalen",
    name: "Hessdalen Valley, Norway",
    description: "Recurring luminous phenomena documented since 1981",
    lat: 62.7833,
    lon: 11.2167,
    zoom: 10,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "Persistent aerial luminous phenomena — spectral analysis shows ionized metals and plasmas",
  },
  {
    id: "popocatepetl",
    name: "Popocatépetl Volcano, Mexico",
    description: "Frequent UAP sightings correlated with volcanic activity",
    lat: 19.0225,
    lon: -98.6278,
    zoom: 10,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "Volcanic-UAP correlation zone — multiple video captures of objects entering crater",
  },
  {
    id: "giza-plateau",
    name: "Giza Plateau, Egypt",
    description: "Great Pyramid complex — GOS resonance array. Slope 51.84° = 180° - Klein twist (128.23°)",
    lat: 29.9792,
    lon: 31.1342,
    zoom: 10,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "King's Chamber tuned to 15.66 Hz (2nd Schumann harmonic). 1:43,200 Earth scale. Supplementary identity: θ_K + pyramid slope = 180°",
  },
  {
    id: "hal-saflieni",
    name: "Ħal Saflieni Hypogeum, Malta",
    description: "Underground Neolithic temple — 111 Hz / 114 Hz double resonance Oracle Room",
    lat: 35.8686,
    lon: 14.5094,
    zoom: 12,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "111 Hz archaeoacoustic standard — triggers right prefrontal cortex shift, Alpha state trance. Triple spiral marks peak resonance chambers",
  },
  {
    id: "gobekli-tepe",
    name: "Göbekli Tepe, Turkey",
    description: "Pre-Pottery Neolithic A temple complex — 70 Hz infrasound T-pillar resonators (c. 9600 BCE)",
    lat: 37.2233,
    lon: 38.9225,
    zoom: 12,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "Infrasound 70 Hz — T-pillar anthropomorphic resonators. Built on tectonic fault zone. 9,600 ancient sites correlate with fault proximity globally",
  },
  {
    id: "barabar-caves",
    name: "Barabar Caves, India",
    description: "Earliest rock-cut architecture — 110 Hz resonance in mirror-polished granite chambers (c. 322 BCE)",
    lat: 25.0058,
    lon: 85.0631,
    zoom: 12,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "Mauryan polish granite — surface flatness comparable to modern glass. Resonance at 110 Hz optimized for human vocal range (85-255 Hz). Ajivika sect dedication (fatalism/niyati)",
  },
  {
    id: "newgrange",
    name: "Newgrange, Ireland",
    description: "Passage tomb with 110 Hz resonance — graywacke/quartz construction (c. 3200 BCE)",
    lat: 53.6947,
    lon: -6.4756,
    zoom: 12,
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    investigationNote: "110-112 Hz range. Triple spiral motif marks peak resonance. Winter solstice alignment. Built 500 years before Great Pyramid",
  },
];

export function getNasaGibsUrl(lat: number, lon: number, zoom: number, layer: string = "MODIS_Terra_CorrectedReflectance_TrueColor", date?: string): string {
  const tileDate = date || new Date().toISOString().split("T")[0];
  const tileX = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/${layer}/default/${tileDate}/250m/${zoom}/${tileY}/${tileX}.jpg`;
}
