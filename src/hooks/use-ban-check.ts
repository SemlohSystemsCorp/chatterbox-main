"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface BanStatus {
  banned: boolean;
  ban_reason: string | null;
  banned_until: string | null;
}

const POLL_INTERVAL = 15_000; // 15 seconds

export function useBanCheck() {
  const [banStatus, setBanStatus] = useState<BanStatus>({
    banned: false,
    ban_reason: null,
    banned_until: null,
  });
  const mountedRef = useRef(true);

  const checkBanStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/ban-status");
      if (!res.ok) return;
      const data: BanStatus = await res.json();
      if (mountedRef.current) {
        setBanStatus(data);
      }
    } catch {
      // Network errors are silently ignored — we'll retry on next poll
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Initial check
    checkBanStatus();

    // Poll interval
    const interval = setInterval(checkBanStatus, POLL_INTERVAL);

    // Check on window focus (user switches back to tab)
    function handleFocus() {
      checkBanStatus();
    }
    window.addEventListener("focus", handleFocus);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkBanStatus]);

  return banStatus;
}
