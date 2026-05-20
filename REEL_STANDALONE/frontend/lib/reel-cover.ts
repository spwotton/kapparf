import type { ReelSession } from "./reel-store";

// Build a stylised Ψ-curve SVG cover for a reel. Used as a glanceable
// gallery thumbnail for hand-built reels (bridge reels get their own
// geodesic preview from the Cathedral). The curve plots each beat's
// realised Ψ score when available, falling back to the planned psiTarget
// so reels look populated even before they're stitched.
export function buildReelCover(sess: ReelSession): string | undefined {
  const beats = sess.beats ?? [];
  if (beats.length < 2) return undefined;
  const values: number[] = beats.map((b, i) => {
    const psi = sess.clips?.[i]?.psiScore?.psi;
    return typeof psi === "number" && Number.isFinite(psi) ? psi : b.psiTarget;
  });
  const w = 240, h = 160, pad = 18;
  const max = Math.max(1.5, ...values);
  const min = Math.min(0.5, ...values);
  const range = Math.max(0.01, max - min);
  const sx = (i: number) =>
    pad + (i / Math.max(1, values.length - 1)) * (w - 2 * pad);
  const sy = (v: number) =>
    (h - pad) - ((v - min) / range) * (h - 2 * pad);
  const bg = "#0d0e10";
  const stroke = "#e0a64a";
  const dot = "#f0c878";
  const guide = "#5a4a2a";
  const polyline = values
    .map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`)
    .join(" ");
  const circles = values
    .map(
      (v, i) =>
        `<circle cx="${sx(i).toFixed(1)}" cy="${sy(v).toFixed(1)}" r="${
          i === 0 || i === values.length - 1 ? 4 : 2.5
        }" fill="${dot}"/>`,
    )
    .join("");
  const yOne = sy(1).toFixed(1);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="${bg}"/>` +
    `<line x1="${pad}" y1="${yOne}" x2="${w - pad}" y2="${yOne}" stroke="${guide}" stroke-width="0.75" stroke-dasharray="3 3"/>` +
    `<polyline points="${polyline}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    `${circles}` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Decode a single frame of a base64 video at the given timestamp into a
// small JPEG data URL, suitable for the gallery cover. Returns undefined if
// the video can't be decoded (caller falls back to the Ψ-curve cover).
//
// The video is loaded into an offscreen <video> element, seeked to
// `atSeconds` (default 0 — the first frame), and rasterised into a
// downsized canvas to keep IDB writes small (gallery thumbnails only need
// ~240×160 px). Bounded by an 8 s timeout so a stuck decode never wedges
// the stitch flow.
export async function extractFrameCover(
  videoBase64: string,
  videoMimeType: string,
  atSeconds = 0,
): Promise<string | undefined> {
  if (typeof document === "undefined") return undefined;
  const src = `data:${videoMimeType || "video/mp4"};base64,${videoBase64}`;
  const target = Number.isFinite(atSeconds) ? Math.max(0, atSeconds) : 0;
  return new Promise<string | undefined>((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    let settled = false;
    let timer = 0;
    const finish = (result?: string) => {
      if (settled) return;
      settled = true;
      if (timer) window.clearTimeout(timer);
      try { video.removeAttribute("src"); video.load(); } catch { /* ignore */ }
      resolve(result);
    };
    timer = window.setTimeout(() => finish(undefined), 8000);
    const draw = () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return finish(undefined);
        const maxW = 480;
        const scale = Math.min(1, maxW / w);
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(undefined);
        ctx.drawImage(video, 0, 0, cw, ch);
        const url = canvas.toDataURL("image/jpeg", 0.8);
        finish(url);
      } catch {
        finish(undefined);
      }
    };
    video.addEventListener("seeked", draw, { once: true });
    video.addEventListener("loadeddata", () => {
      // Some browsers already have frame 0 ready and won't fire "seeked"
      // for a zero-delta seek; when targeting t=0 try to draw immediately
      // and also request a tiny seek as a fallback. For non-zero targets,
      // clamp to the known duration so we don't seek past the end.
      try {
        const duration = Number.isFinite(video.duration) ? video.duration : Infinity;
        const clamped = Math.min(target, Math.max(0, duration - 0.001));
        if (clamped === 0 && video.readyState >= 2 && video.currentTime === 0) {
          draw();
        } else {
          video.currentTime = clamped;
        }
      } catch {
        finish(undefined);
      }
    }, { once: true });
    video.addEventListener("error", () => finish(undefined), { once: true });
    video.src = src;
  });
}

// Back-compat alias — the original name only ever extracted t=0; keep it
// working for any callers that haven't been updated yet.
export const extractFirstFrameCover = (
  videoBase64: string,
  videoMimeType: string,
): Promise<string | undefined> => extractFrameCover(videoBase64, videoMimeType, 0);
