"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon as ArrowLeft } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [signupData, setSignupData] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load signup data
  useEffect(() => {
    const stored = sessionStorage.getItem("chatterbox_signup");
    if (!stored) {
      router.push("/signup");
      return;
    }
    setSignupData(JSON.parse(stored));
  }, [router]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleCodeChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && newCode.every((d) => d !== "")) {
      submitCode(newCode.join(""));
    }
  }

  function handleCodeKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 0) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    const nextEmpty = newCode.findIndex((d) => d === "");
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();

    if (pasted.length === 6) {
      submitCode(pasted);
    }
  }

  const submitCode = useCallback(
    async (codeStr: string) => {
      if (!signupData) return;
      setError("");
      setVerifying(true);

      // 1. Verify the code
      const verifyRes = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupData.email,
          code: codeStr,
          type: "email_verification",
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.error || "Verification failed");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setVerifying(false);
        return;
      }

      // 2. Create account
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            email_verified: true,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setVerifying(false);
        return;
      }

      // 3. Sign them in
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: signupData.email,
          password: signupData.password,
        });

      sessionStorage.removeItem("chatterbox_signup");

      if (signInError) {
        router.push("/login");
        return;
      }

      // Send welcome email (fire-and-forget)
      fetch("/api/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupData.email,
          name: "",
        }),
      }).catch(() => {});

      router.push("/onboarding");
      router.refresh();
    },
    [signupData, router]
  );

  async function handleResend() {
    if (resendCooldown > 0 || !signupData) return;
    setError("");

    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: signupData.email,
        type: "email_verification",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to resend code");
      return;
    }

    setResendCooldown(60);
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  }

  if (!signupData) return null;

  return (
    <div>
      <button
        onClick={() => router.push("/signup")}
        className="mb-8 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#1a1a1a]"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>

      <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
        Enter the code
      </h1>
      <p className="mb-1 text-[16px] leading-[24px] text-[#888]">
        We sent a 6-digit verification code to
      </p>
      <p className="mb-8 text-[16px] font-medium leading-[24px] text-white">
        {signupData.email}
      </p>

      {/* Code inputs */}
      <div className="mb-6 flex gap-3" onPaste={handleCodePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            autoFocus={i === 0}
            maxLength={1}
            value={digit}
            onChange={(e) => handleCodeChange(i, e.target.value)}
            onKeyDown={(e) => handleCodeKeyDown(i, e)}
            disabled={verifying}
            className="h-[56px] w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] text-center text-[24px] font-bold text-white outline-none transition-colors focus:border-white focus:bg-[#222] disabled:text-[#555]"
          />
        ))}
      </div>

      {error && (
        <p className="mb-4 text-[14px] text-[#de1135]">{error}</p>
      )}

      {verifying && (
        <div className="mb-4">
          <Spinner label="Verifying..." />
        </div>
      )}

      <div className="flex items-center gap-1 text-[14px]">
        <span className="text-[#888]">Didn&apos;t receive a code?</span>
        {resendCooldown > 0 ? (
          <span className="text-[#555]">
            Resend in {resendCooldown}s
          </span>
        ) : (
          <button
            onClick={handleResend}
            className="font-medium text-white underline underline-offset-2"
          >
            Resend
          </button>
        )}
      </div>
    </div>
  );
}
