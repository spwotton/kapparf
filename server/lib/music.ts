/**
 * MUSIC DOA Engine — Multiple Signal Classification
 *
 * Computes the spatial pseudo-spectrum for a Uniform Circular Array (UCA):
 *   P_MUSIC(θ) = 1 / (a(θ)ᴴ Vₙ Vₙᴴ a(θ))
 *
 * Includes spatial smoothing for coherent multipath.
 */

export interface MusicResult {
  bearings: BearingPeak[];
  pseudoSpectrum: number[];
  noiseSubspaceDim: number;
  signalSubspaceDim: number;
}

export interface BearingPeak {
  azimuthDeg: number;
  pseudoSpectrumValue: number;
  normalizedPeak: number;
}

const TWO_PI = 2 * Math.PI;

/**
 * UCA steering vector for azimuth θ (radians), M antennas, array radius r,
 * and wavelength λ = c / f.
 *
 * a(θ)[m] = exp( j·2π·r/λ · cos(θ - 2π·m/M) )   m = 0…M-1
 */
function ucaSteeringVector(
  thetaRad: number,
  M: number,
  r: number,
  wavelength: number,
): { re: number[]; im: number[] } {
  const re = new Array(M);
  const im = new Array(M);
  const k = TWO_PI / wavelength;
  for (let m = 0; m < M; m++) {
    const phi = TWO_PI * m / M;
    const phase = k * r * Math.cos(thetaRad - phi);
    re[m] = Math.cos(phase);
    im[m] = Math.sin(phase);
  }
  return { re, im };
}

/**
 * Compute spatial covariance matrix R = (1/K) Σ x(k)·x(k)ᴴ
 * from IQ snapshot data. Assumes interleaved IQ:
 *   snapshot[2*m]     = I component of antenna m at snapshot k
 *   snapshot[2*m + 1] = Q component of antenna m at snapshot k
 *
 * Returns the M×M covariance as flat arrays of real/imag parts.
 */
function computeCovarianceMatrix(
  snapshots: number[][],
  M: number,
): { re: number[][]; im: number[][] } {
  const K = snapshots.length;
  const re: number[][] = Array.from({ length: M }, () => new Array(M).fill(0));
  const im: number[][] = Array.from({ length: M }, () => new Array(M).fill(0));

  for (const snap of snapshots) {
    for (let i = 0; i < M; i++) {
      const xi_re = snap[2 * i] ?? 0;
      const xi_im = snap[2 * i + 1] ?? 0;
      for (let j = 0; j < M; j++) {
        const xj_re = snap[2 * j] ?? 0;
        const xj_im = snap[2 * j + 1] ?? 0;
        re[i][j] += (xi_re * xj_re + xi_im * xj_im) / K;
        im[i][j] += (xi_im * xj_re - xi_re * xj_im) / K;
      }
    }
  }
  return { re, im };
}

/**
 * Spatial smoothing for coherent multipath.
 * Divides the array into overlapping sub-arrays of size L = M - P + 1,
 * averages their covariance matrices.
 */
function spatialSmoothing(
  covRe: number[][],
  covIm: number[][],
  M: number,
  P: number,
): { re: number[][]; im: number[][] } {
  const L = M - P + 1;
  if (L < 2) return { re: covRe, im: covIm };

  const smRe: number[][] = Array.from({ length: L }, () => new Array(L).fill(0));
  const smIm: number[][] = Array.from({ length: L }, () => new Array(L).fill(0));

  for (let p = 0; p < P; p++) {
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < L; j++) {
        smRe[i][j] += covRe[i + p][j + p] / P;
        smIm[i][j] += covIm[i + p][j + p] / P;
      }
    }
  }
  return { re: smRe, im: smIm };
}

/**
 * Power-iteration eigendecomposition of a Hermitian matrix (real + imag).
 * Returns eigenvalues sorted descending and corresponding eigenvectors.
 * Uses a simple repeated deflation approach — adequate for M ≤ 32.
 */
function hermitianEigendecomposition(
  re: number[][],
  im: number[][],
): { values: number[]; vectorsRe: number[][]; vectorsIm: number[][] } {
  const N = re.length;
  const values: number[] = [];
  const vectorsRe: number[][] = [];
  const vectorsIm: number[][] = [];

  let workRe = re.map((r) => [...r]);
  let workIm = im.map((r) => [...r]);

  for (let k = 0; k < N; k++) {
    let vRe = Array.from({ length: N }, () => Math.random() - 0.5);
    let vIm = new Array(N).fill(0);
    let eigenvalue = 0;

    for (let iter = 0; iter < 80; iter++) {
      const avRe = new Array(N).fill(0);
      const avIm = new Array(N).fill(0);
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          avRe[i] += workRe[i][j] * vRe[j] - workIm[i][j] * vIm[j];
          avIm[i] += workRe[i][j] * vIm[j] + workIm[i][j] * vRe[j];
        }
      }
      const norm = Math.sqrt(avRe.reduce((s, x, i) => s + x * x + avIm[i] * avIm[i], 0)) || 1;
      const prevEig = eigenvalue;
      eigenvalue = vRe.reduce((s, vri, i) => s + vri * avRe[i] + (vIm[i] ?? 0) * avIm[i], 0);
      vRe = avRe.map((x) => x / norm);
      vIm = avIm.map((x) => x / norm);
      if (Math.abs(eigenvalue - prevEig) < 1e-7) break;
    }

    values.push(eigenvalue);
    vectorsRe.push(vRe);
    vectorsIm.push(vIm);

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        workRe[i][j] -= eigenvalue * (vRe[i] * vRe[j] + vIm[i] * vIm[j]);
        workIm[i][j] -= eigenvalue * (vIm[i] * vRe[j] - vRe[i] * vIm[j]);
      }
    }
  }

  const order = values.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).map((o) => o.i);
  return {
    values: order.map((i) => values[i]),
    vectorsRe: order.map((i) => vectorsRe[i]),
    vectorsIm: order.map((i) => vectorsIm[i]),
  };
}

/**
 * Compute MUSIC pseudo-spectrum.
 * P_MUSIC(θ) = 1 / (a(θ)ᴴ Vₙ Vₙᴴ a(θ))
 */
function computePseudoSpectrum(
  noiseVecRe: number[][],
  noiseVecIm: number[][],
  M: number,
  r: number,
  wavelength: number,
  numPoints = 360,
): number[] {
  const spectrum = new Array(numPoints);
  for (let idx = 0; idx < numPoints; idx++) {
    const thetaDeg = (idx * 360) / numPoints;
    const thetaRad = (thetaDeg * Math.PI) / 180;
    const { re: aRe, im: aIm } = ucaSteeringVector(thetaRad, M, r, wavelength);

    let denom = 0;
    for (const [nvRe, nvIm] of noiseVecRe.map((v, i) => [v, noiseVecIm[i]])) {
      let innerRe = 0;
      let innerIm = 0;
      for (let m = 0; m < M; m++) {
        innerRe += aRe[m] * nvRe[m] + aIm[m] * nvIm[m];
        innerIm += aIm[m] * nvRe[m] - aRe[m] * nvIm[m];
      }
      denom += innerRe * innerRe + innerIm * innerIm;
    }

    spectrum[idx] = 1 / (denom + 1e-15);
  }
  return spectrum;
}

/**
 * Extract peak bearings from the pseudo-spectrum via local-maxima detection.
 */
function extractPeaks(spectrum: number[], minPeaks = 1, maxPeaks = 6): BearingPeak[] {
  const N = spectrum.length;
  const maxVal = Math.max(...spectrum);
  const threshold = maxVal * 0.1;

  const peaks: BearingPeak[] = [];
  for (let i = 0; i < N; i++) {
    const prev = spectrum[(i - 1 + N) % N];
    const curr = spectrum[i];
    const next = spectrum[(i + 1) % N];
    if (curr > prev && curr >= next && curr > threshold) {
      peaks.push({
        azimuthDeg: (i * 360) / N,
        pseudoSpectrumValue: curr,
        normalizedPeak: curr / maxVal,
      });
    }
  }

  peaks.sort((a, b) => b.pseudoSpectrumValue - a.pseudoSpectrumValue);
  const result = peaks.slice(0, maxPeaks);
  if (result.length < minPeaks && peaks.length > 0) return peaks.slice(0, minPeaks);
  return result;
}

/**
 * Build snapshot matrix from interleaved IQ flat array.
 * Groups each M*2 samples into one snapshot of M antennas.
 */
function buildSnapshots(iqFlat: number[], M: number): number[][] {
  const stride = M * 2;
  const numSnaps = Math.floor(iqFlat.length / stride);
  return Array.from({ length: numSnaps }, (_, k) =>
    iqFlat.slice(k * stride, k * stride + stride),
  );
}

/**
 * Main MUSIC DOA analysis.
 *
 * @param iqFlat      Flat interleaved IQ array, length = numSnapshots * M * 2
 * @param M           Number of antennas
 * @param r           Array radius in metres
 * @param freqHz      Centre frequency in Hz
 * @param numSources  Expected number of signal sources (for subspace split)
 * @param numPoints   Angular resolution (default 360 points)
 */
export function runMusic(
  iqFlat: number[],
  M: number,
  r: number,
  freqHz: number,
  numSources?: number,
  numPoints = 360,
): MusicResult {
  const C = 3e8;
  const wavelength = C / freqHz;

  const snapshots = buildSnapshots(iqFlat, M);
  const K = snapshots.length;
  if (K < 1) {
    return {
      bearings: [],
      pseudoSpectrum: new Array(numPoints).fill(0),
      noiseSubspaceDim: M - 1,
      signalSubspaceDim: 1,
    };
  }

  let { re: covRe, im: covIm } = computeCovarianceMatrix(snapshots, M);

  const smoothPasses = Math.max(1, Math.floor(M / 4));
  ({ re: covRe, im: covIm } = spatialSmoothing(covRe, covIm, M, smoothPasses));
  const effectiveM = covRe.length;

  const { values, vectorsRe, vectorsIm } = hermitianEigendecomposition(covRe, covIm);

  const threshold = values[0] * 0.1;
  const detectedSources = numSources ?? Math.max(1, values.filter((v) => v > threshold).length - 1);
  const signalDim = Math.min(detectedSources, effectiveM - 1);
  const noiseDim = effectiveM - signalDim;

  const noiseVecRe = vectorsRe.slice(signalDim);
  const noiseVecIm = vectorsIm.slice(signalDim);

  const pseudoSpectrum = computePseudoSpectrum(noiseVecRe, noiseVecIm, effectiveM, r, wavelength, numPoints);
  const bearings = extractPeaks(pseudoSpectrum);

  return {
    bearings,
    pseudoSpectrum,
    noiseSubspaceDim: noiseDim,
    signalSubspaceDim: signalDim,
  };
}
