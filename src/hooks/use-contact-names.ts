"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Fetches all contact nicknames for the current user and provides
 * a `displayName` helper that returns nickname || fallback.
 */
export function useContactNames() {
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch("/api/contacts/nickname")
      .then((r) => r.json())
      .then((data) => {
        if (data.nicknames) setNicknames(data.nicknames);
      })
      .catch(() => {});
  }, []);

  /** Returns nickname if set, otherwise the fallback (full_name, email, etc.) */
  const displayName = useCallback(
    (userId: string, fallback: string) => {
      return nicknames[userId] || fallback;
    },
    [nicknames]
  );

  /** Update a nickname locally (after saving via API) */
  const setNickname = useCallback(
    (contactUserId: string, nickname: string | null) => {
      setNicknames((prev) => {
        const next = { ...prev };
        if (nickname) {
          next[contactUserId] = nickname;
        } else {
          delete next[contactUserId];
        }
        return next;
      });
    },
    []
  );

  return { nicknames, displayName, setNickname };
}
