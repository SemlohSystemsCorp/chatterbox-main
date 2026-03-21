"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

export default function VerifyPage() {
  const router = useRouter();

  useEffect(() => {
    // Verification is now handled inline on the signup page
    router.replace("/signup");
  }, [router]);

  return (
    <div className="py-20">
      <Spinner size="lg" center />
    </div>
  );
}
