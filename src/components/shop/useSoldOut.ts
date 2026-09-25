"use client";

import { useEffect, useState } from "react";

export function useSoldOut() {
  const [soldOut, setSoldOut] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/soldout")
      .then((r) => r.json())
      .then((d) => alive && setSoldOut(d.soldOut ?? []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return soldOut;
}
