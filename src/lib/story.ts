"use client";

import { create } from "zustand";

/** Low-frequency story state (re-renders are OK here: changes a few times per scroll). */
type StoryState = {
  chapter: number;
  loaded: boolean;
  entered: boolean;
  canvasActive: boolean;
  tableIndex: number;
  setChapter: (n: number) => void;
  setLoaded: () => void;
  enter: () => void;
  setCanvasActive: (v: boolean) => void;
  setTableIndex: (n: number) => void;
};

export const useStory = create<StoryState>((set) => ({
  chapter: 0,
  loaded: false,
  entered: false,
  canvasActive: true,
  tableIndex: 0,
  setChapter: (chapter) => set({ chapter }),
  setLoaded: () => set({ loaded: true }),
  enter: () => set({ entered: true }),
  setCanvasActive: (canvasActive) => set({ canvasActive }),
  setTableIndex: (tableIndex) => set({ tableIndex }),
}));

/** Rotation requests for the table lazy-susan from DOM buttons. */
export const tableControl = { target: 0, drag: 0 };
