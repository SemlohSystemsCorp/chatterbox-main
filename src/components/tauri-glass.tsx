"use client";

import { useEffect } from "react";

export function TauriGlass() {
  useEffect(() => {
    try {
      const w = window as Record<string, unknown>;
      if (w.__TAURI_INTERNALS__ || w.__TAURI__) {
        document.documentElement.setAttribute("data-tauri", "");
      }
    } catch {}
  }, []);
  return null;
}
