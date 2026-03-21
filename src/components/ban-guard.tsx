"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client-side ban check — runs on mount and every 5 minutes.
 * Replaces the blocking server-side admin API call that ran on every navigation.
 */
export function BanGuard() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const res = await fetch("/api/auth/ban-status");
        if (!res.ok) return;
        const data = await res.json();
        if (data.banned && mounted) {
          router.replace("/banned");
        }
      } catch {
        // Silently fail — next interval will retry
      }
    }

    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
