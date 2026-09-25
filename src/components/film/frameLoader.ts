"use client";

/**
 * Progressive frame loading for scroll-scrubbed films.
 * Frames arrive in passes (every 16th, then 8th, 4th, 2nd, all) so a scene is
 * scrubbable almost immediately and sharpens in time. Scenes are queued in page
 * order; only a few requests run at once.
 */
export type Sequence = {
  frames: (HTMLImageElement | null)[];
  loaded: number;
  /** nearest loaded frame to i */
  nearest: (i: number) => HTMLImageElement | null;
  onFirst: Promise<void>;
};

const MAX_PARALLEL = 6;
const queue: { url: string; seq: Sequence; index: number }[] = [];
let active = 0;

function pump() {
  while (active < MAX_PARALLEL && queue.length) {
    const job = queue.shift()!;
    active++;
    const img = new Image();
    img.decoding = "async";
    img.src = job.url;
    const done = () => {
      active--;
      pump();
    };
    img
      .decode()
      .then(() => {
        job.seq.frames[job.index] = img;
        job.seq.loaded++;
      })
      .catch(() => {})
      .finally(done);
  }
}

function passOrder(n: number) {
  const seen = new Set<number>();
  const order: number[] = [];
  const take = (i: number) => {
    if (seen.has(i)) return;
    seen.add(i);
    order.push(i);
  };
  for (const stride of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < n; i += stride) take(i);
    take(n - 1);
  }
  return order;
}

export function loadSequence(base: string, count: number): Sequence {
  const frames: (HTMLImageElement | null)[] = Array(count).fill(null);
  let resolveFirst!: () => void;
  const onFirst = new Promise<void>((r) => (resolveFirst = r));
  const seq: Sequence = {
    frames,
    loaded: 0,
    onFirst,
    nearest(i) {
      if (frames[i]) return frames[i];
      for (let d = 1; d < count; d++) {
        const a = frames[i - d];
        if (a) return a;
        const b = frames[i + d];
        if (b) return b;
      }
      return null;
    },
  };

  // frame 0 first, on its own, so the scene can paint immediately
  const first = new Image();
  first.src = `${base}/000.webp`;
  first
    .decode()
    .then(() => {
      frames[0] = first;
      seq.loaded++;
    })
    .catch(() => {})
    .finally(resolveFirst);

  for (const i of passOrder(count)) {
    if (i === 0) continue;
    queue.push({ url: `${base}/${String(i).padStart(3, "0")}.webp`, seq, index: i });
  }
  pump();
  return seq;
}
