"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon as ArrowLeft } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";

type Step = "credentials" | "verify";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/onboarding";
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  // Verify step state
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "email_verification" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send verification code");
        setLoading(false);
        return;
      }

      setLoading(false);
      setResendCooldown(60);
      setStep("verify");
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setError(
        "Could not connect to the server. Check your internet connection."
      );
      setLoading(false);
    }
  }

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
      if (!email || !password) return;
      setError("");
      setVerifying(true);

      try {
        // 1. Verify the code
        const verifyRes = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
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
          email,
          password,
          options: {
            data: {
              email_verified: true,
              onboarding_completed: false,
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
          await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          router.push("/login");
          return;
        }

        // Send welcome email (fire-and-forget)
        fetch("/api/auth/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: "" }),
        }).catch(() => {});

        // Navigate to onboarding, preserving invite context if present
        const joinMatch = redirectTo.match(/\/join\?code=([^&]+)/);
        const onboardingPath = joinMatch
          ? `/onboarding?invite=${encodeURIComponent(joinMatch[1])}`
          : "/onboarding";
        router.push(onboardingPath);
        router.refresh();
      } catch {
        setError(
          "Could not connect to the server. Check your internet connection."
        );
        setVerifying(false);
      }
    },
    [email, password, redirectTo, router]
  );

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "email_verification" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend code");
        return;
      }

      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError(
        "Could not connect to the server. Check your internet connection."
      );
    }
  }

  async function handleGoogleOAuth() {
    setError("");
    setOauthLoading("google");

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
    }
  }

  // ── Verify Step ──
  if (step === "verify") {
    return (
      <div>
        <button
          onClick={() => {
            setStep("credentials");
            setCode(["", "", "", "", "", ""]);
            setError("");
          }}
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
          {email}
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

  // ── Credentials Step ──
  return (
    <div>
      <h1 className="mb-6 text-[36px] font-bold leading-[44px] tracking-tight text-white">
        Create your account
      </h1>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleOAuth}
        disabled={oauthLoading !== null}
        className="flex h-[48px] w-full items-center justify-center gap-3 rounded-[8px] border-2 border-[#2a2a2a] bg-[#0a0a0a] text-[16px] font-medium text-white transition-colors hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {oauthLoading === "google" ? "Redirecting..." : "Continue with Google"}
      </button>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#2a2a2a]" />
        <span className="text-[14px] text-[#666]">or</span>
        <div className="h-px flex-1 bg-[#2a2a2a]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {password.length > 0 && (
            <p
              className={cn(
                "mt-[6px] text-[13px]",
                password.length < 8
                  ? "text-[#de1135]"
                  : password.length < 12
                    ? "text-[#f5a623]"
                    : "text-[#1db954]"
              )}
            >
              {password.length < 8
                ? "Must be at least 8 characters"
                : password.length < 12
                  ? "Weak password"
                  : "Strong password"}
            </p>
          )}
        </div>

        {error && (
          <p className="text-[14px] text-[#de1135]">{error}</p>
        )}

        <div className="pt-2">
          <Button type="submit" loading={loading} className="w-full">
            Continue
          </Button>
        </div>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#2a2a2a]" />
        <span className="text-[14px] text-[#666]">or</span>
        <div className="h-px flex-1 bg-[#2a2a2a]" />
      </div>

      <Link href="/login">
        <Button variant="secondary" className="w-full">
          Log in to existing account
        </Button>
      </Link>

      <p className="mt-8 text-[13px] leading-[20px] text-[#666]">
        By creating an account, you agree to Chatterbox&apos;s{" "}
        <Link href="/terms" className="text-white underline underline-offset-2">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="text-white underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </div>
  );
}
