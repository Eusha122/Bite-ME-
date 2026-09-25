/**
 * Draw a film frame and dissolve its edges into the page colour, so the frame
 * boundary never shows even when the generated background drifts by a shade.
 */
export function drawFrame(ctx: CanvasRenderingContext2D, img: CanvasImageSource, bg: string, dx: number, dy: number, dw: number, dh: number) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, dx, dy, dw, dh);

  const fx = dw * 0.09;
  const fy = dh * 0.09;
  const ramp = (x0: number, y0: number, x1: number, y1: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, withAlpha(bg, 1));
    g.addColorStop(1, withAlpha(bg, 0));
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

function withAlpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
