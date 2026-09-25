"use client";

/**
 * Progressive frame loading for scroll-scrubbed films.
 * Frames arrive in passes (every 16th, then 8th, 4th, 2nd, all) so a scene is
 * scrubbable almost immediately and sharpens in time. The queue is ordered by pass
 * first, so a scene you are approaching gets its coarse frames ahead of another
 * scene's fine detail. Only a few requests run at once.
 *
 * Memory matters: every decoded frame costs width × height × 4 bytes and a film is
 * hundreds of them, so a scene that is far from the screen calls dispose() to let go.
 */
export type Sequence = {
  /** physical frames actually stored (phones store every `stride`-th logical frame) */
  frames: (HTMLImageElement | null)[];
  /** logical frames per stored frame: 1 on desktop, 2 on phones */
  stride: number;
  loaded: number;
  disposed: boolean;
  /** nearest loaded frame to logical index i */
  nearest: (i: number) => HTMLImageElement | null;
  /** stop loading and release every decoded frame */
  dispose: () => void;
  onFirst: Promise<void>;
};

type Job = { url: string; seq: Sequence; index: number; pass: number; order: number };

const MAX_PARALLEL = 6;
let queue: Job[] = [];
let active = 0;
let seqCounter = 0;

function pump() {
  while (active < MAX_PARALLEL && queue.length) {
    const job = queue.shift()!;
    if (job.seq.disposed) continue;
    active++;
    const img = new Image();
    img.decoding = "async";
    img.src = job.url;
    img
      .decode()
      .then(() => {
        // a scene that was released while this frame was in flight must not keep it
        if (job.seq.disposed) return;
        job.seq.frames[job.index] = img;
        job.seq.loaded++;
      })
      .catch(() => {})
      .finally(() => {
        active--;
        pump();
      });
  }
}

const STRIDES = [16, 8, 4, 2, 1];

/** Frame indices grouped by pass: every 16th frame, then the 8ths not yet taken, and so on. */
function passes(n: number) {
  const seen = new Set<number>([0]);
  return STRIDES.map((stride) => {
    const out: number[] = [];
    const take = (i: number) => {
      if (seen.has(i)) return;
      seen.add(i);
      out.push(i);
    };
    for (let i = 0; i < n; i += stride) take(i);
    take(n - 1);
    return out;
  });
}

/**
 * @param count   logical frames in the film
 * @param version appended to every URL so regenerated frames are never served from a stale cache
 * @param stride  1 = a file for every logical frame; 2 = phones, a file for every second one
 */
export function loadSequence(base: string, count: number, version = 0, stride = 1): Sequence {
  const stored = Math.ceil(count / stride);
  const url = (i: number) => `${base}/${String(i).padStart(3, "0")}.webp?v=${version}`;
  const frames: (HTMLImageElement | null)[] = Array(stored).fill(null);
  let resolveFirst!: () => void;
  const onFirst = new Promise<void>((r) => (resolveFirst = r));
  const seq: Sequence = {
    frames,
    stride,
    loaded: 0,
    disposed: false,
    onFirst,
    nearest(i) {
      const p = Math.min(stored - 1, Math.max(0, Math.round(i / stride)));
      if (frames[p]) return frames[p];
      for (let d = 1; d < stored; d++) {
        const a = frames[p - d];
        if (a) return a;
        const b = frames[p + d];
        if (b) return b;
      }
      return null;
    },
    dispose() {
      seq.disposed = true;
      queue = queue.filter((j) => j.seq !== seq);
      frames.fill(null);
      seq.loaded = 0;
    },
  };

  // frame 0 first, on its own, so the scene can paint immediately
  const first = new Image();
  first.src = url(0);
  first
    .decode()
    .then(() => {
      if (seq.disposed) return;
      frames[0] = first;
      seq.loaded++;
    })
    .catch(() => {})
    .finally(resolveFirst);

  const order = seqCounter++;
  passes(stored).forEach((indices, pass) => {
    for (const index of indices) queue.push({ url: url(index), seq, index, pass, order });
  });
  // coarse passes of every scene before anyone's fine detail; earlier scenes first within a pass
  queue.sort((a, b) => a.pass - b.pass || a.order - b.order || a.index - b.index);
  pump();
  return seq;
}
