"use client";

/**
 * Shared, non-reactive scroll state. The 3D scene reads this every frame
 * (no React re-renders), the DOM overlay writes it from Lenis.
 */
export const scrollState = {
  /** 0..1 over the whole story */
  progress: 0,
  /** damped version used by the camera */
  smooth: 0,
  velocity: 0,
  /** pointer in -1..1 */
  pointer: { x: 0, y: 0 },
};

export const CHAPTER_COUNT = 7;

/** Which chapter (float) we're in: 0..CHAPTER_COUNT-1 */
export const chapterFloat = (p: number) => p * (CHAPTER_COUNT - 1);

/** Local progress for chapter i, -1..1 (0 = centred on it). */
export const localProgress = (p: number, i: number) => chapterFloat(p) - i;
