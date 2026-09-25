import type { Sequence } from "./frameLoader";

/**
 * Draw the film at a fractional frame position: the two neighbouring frames are
 * cross-faded by the fraction, so scrubbing is continuous rather than stepping
 * frame to frame. Edges dissolve into the page colour so the frame boundary never shows.
 */
export function drawFilm(ctx: CanvasRenderingContext2D, seq: Sequence, pos: number, bg: string, dx: number, dy: number, dw: number, dh: number) {
  // `pos` counts logical frames; phones store every stride-th one, so step in stored frames
  const p = pos / seq.stride;
  const i0 = Math.floor(p);
  const t = p - i0;
  const a = seq.nearest(i0 * seq.stride);
  if (!a) return false;
  // only blend when the exact next frame is in memory (never blend towards a stand-in)
  const b = t > 0.02 ? seq.frames[i0 + 1] : null;

  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.globalAlpha = 1;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(a, dx, dy, dw, dh);
  if (b) {
    ctx.globalAlpha = t;
    ctx.drawImage(b, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  }
  featherEdges(ctx, bg, dx, dy, dw, dh);
  return true;
}

const rampCache = new Map<string, [string, string]>();

function featherEdges(ctx: CanvasRenderingContext2D, bg: string, dx: number, dy: number, dw: number, dh: number) {
  let stops = rampCache.get(bg);
  if (!stops) {
    const n = parseInt(bg.slice(1), 16);
    const rgb = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
    stops = [`rgba(${rgb}, 1)`, `rgba(${rgb}, 0)`];
    rampCache.set(bg, stops);
  }
  const fx = dw * 0.09;
  const fy = dh * 0.09;
  const ramp = (x0: number, y0: number, x1: number, y1: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, stops![0]);
    g.addColorStop(1, stops![1]);
    return g;
  };
  ctx.fillStyle = ramp(dx, 0, dx + fx, 0);
  ctx.fillRect(dx, dy, fx, dh);
  ctx.fillStyle = ramp(dx + dw, 0, dx + dw - fx, 0);
  ctx.fillRect(dx + dw - fx, dy, fx, dh);
  ctx.fillStyle = ramp(0, dy, 0, dy + fy);
  ctx.fillRect(dx, dy, dw, fy);
  ctx.fillStyle = ramp(0, dy + dh, 0, dy + dh - fy);
  ctx.fillRect(dx, dy + dh - fy, dw, fy);
}

/**
 * Canvas backing size: device pixels, but never more than the film's own resolution
 * needs — drawing a 1440px frame into a 4K backing store just burns fill-rate.
 */
export function sizeCanvas(cv: HTMLCanvasElement, maxWidth = 2200) {
  // 2× keeps phones sharp without making the GPU paint 9 pixels for every CSS pixel (3×), which is what hangs them
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = Math.min(dpr, maxWidth / Math.max(1, cv.clientWidth));
  cv.width = Math.round(cv.clientWidth * scale);
  cv.height = Math.round(cv.clientHeight * scale);
}

/** Frame-rate independent easing of the playhead toward the scroll position. */
export const approach = (current: number, target: number, dtMs: number, rate = 14) => current + (target - current) * (1 - Math.exp((-rate * dtMs) / 1000));
