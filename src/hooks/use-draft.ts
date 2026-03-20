"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const DRAFT_PREFIX = "chatterbox_draft_";

/** Persist unsent message text per channel/conversation across sessions. */
export function useDraft(key: string) {
  const storageKey = `${DRAFT_PREFIX}${key}`;
  const [draft, setDraftState] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(storageKey) || "";
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when key changes (switching channels)
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) || "";
    setDraftState(stored);
  }, [storageKey]);

  const setDraft = useCallback(
    (value: string) => {
      setDraftState(value);
      // Debounce writes to localStorage
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (value) {
          localStorage.setItem(storageKey, value);
        } else {
          localStorage.removeItem(storageKey);
        }
      }, 300);
    },
    [storageKey]
  );

  const clearDraft = useCallback(() => {
    setDraftState("");
    localStorage.removeItem(storageKey);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [storageKey]);

  return { draft, setDraft, clearDraft };
}
