"use client";

import { BannedScreen } from "@/components/banned-screen";

interface BannedPageClientProps {
  reason: string | null;
  bannedUntil: string | null;
}

export function BannedPageClient({ reason, bannedUntil }: BannedPageClientProps) {
  return <BannedScreen reason={reason} bannedUntil={bannedUntil} />;
}
