"use client";

/**
 * Progressive frame loading for scroll-scrubbed films.
 * Frames arrive in passes (every 16th, then 8th, 4th, 2nd, all) so a scene is
 * scrubbable almost immediately and sharpens in time. The queue is ordered by pass
 * first, so a scene you are approaching gets its coarse frames ahead of another
 * scene's fine detail. Only a few requests run at once.
 */
export type Sequence = {
  frames: (HTMLImageElement | null)[];
  loaded: number;
  /** nearest loaded frame to i */
  nearest: (i: number) => HTMLImageElement | null;
  onFirst: Promise<void>;
};

type Job = { url: string; seq: Sequence; index: number; pass: number; order: number };

const MAX_PARALLEL = 6;
const queue: Job[] = [];
let active = 0;
let seqCounter = 0;

function pump() {
  while (active < MAX_PARALLEL && queue.length) {
    const job = queue.shift()!;
    active++;
    const img = new Image();
    img.decoding = "async";
    img.src = job.url;
    img
      .decode()
      .then(() => {
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

/** `version` is appended to every URL so regenerated frames are never served from a stale cache. */
export function loadSequence(base: string, count: number, version = 0): Sequence {
  const url = (i: number) => `${base}/${String(i).padStart(3, "0")}.webp?v=${version}`;
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
  first.src = url(0);
  first
    .decode()
    .then(() => {
      frames[0] = first;
      seq.loaded++;
    })
    .catch(() => {})
    .finally(resolveFirst);

  const order = seqCounter++;
  passes(count).forEach((indices, pass) => {
    for (const index of indices) queue.push({ url: url(index), seq, index, pass, order });
  });
  // coarse passes of every scene before anyone's fine detail; earlier scenes first within a pass
  queue.sort((a, b) => a.pass - b.pass || a.order - b.order || a.index - b.index);
  pump();
  return seq;
}
