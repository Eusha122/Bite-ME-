"use client";

import { Component, type ReactNode } from "react";

/** Swallows render errors (e.g. a missing texture) so one asset can't take down the scene. */
export default class SafeBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    if (process.env.NODE_ENV !== "production") console.warn("[SafeBoundary]", err);
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
