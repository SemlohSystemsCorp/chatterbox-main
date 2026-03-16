"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "email" | "code" | "new-password" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleSendCode() {
    if (!email.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), type: "password_reset" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset code");
        setLoading(false);
        return;
      }

      setResendCooldown(60);
      setLoading(false);
      setStep("code");
      // Focus first code input after render
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setError("Something went wrong");
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
      setStep("new-password");
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    const nextEmpty = newCode.findIndex((d) => d === "");
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();

    if (pasted.length === 6) {
      setStep("new-password");
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");

    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "password_reset" }),
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

  async function handleResetPassword() {
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: code.join(""),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        // If code was wrong, go back to code step
        if (data.error?.includes("code") || data.error?.includes("Code")) {
          setCode(["", "", "", "", "", ""]);
          setStep("code");
          setTimeout(() => inputRefs.current[0]?.focus(), 50);
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep("done");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  // ── Email step ──
  if (step === "email") {
    return (
      <div>
        <button
          onClick={() => router.push("/login")}
          className="mb-8 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#1a1a1a]"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          Reset your password
        </h1>
        <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
          Enter the email address associated with your account and we&apos;ll
          send you a verification code.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendCode();
          }}
          className="space-y-4"
        >
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />

          {error && <p className="text-[14px] text-[#de1135]">{error}</p>}

          <div className="pt-2">
            <Button type="submit" loading={loading} disabled={!email.trim()} className="w-full">
              Send reset code
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ── Code step ──
  if (step === "code") {
    return (
      <div>
        <button
          onClick={() => setStep("email")}
          className="mb-8 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#1a1a1a]"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          Enter the code
        </h1>
        <p className="mb-1 text-[16px] leading-[24px] text-[#888]">
          We sent a 6-digit code to
        </p>
        <p className="mb-8 text-[16px] font-medium leading-[24px] text-white">
          {email}
        </p>

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
              className="h-[56px] w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] text-center text-[24px] font-bold text-white outline-none transition-colors focus:border-white focus:bg-[#222]"
            />
          ))}
        </div>

        {error && <p className="mb-4 text-[14px] text-[#de1135]">{error}</p>}

        <div className="flex items-center gap-1 text-[14px]">
          <span className="text-[#888]">Didn&apos;t receive a code?</span>
          {resendCooldown > 0 ? (
            <span className="text-[#555]">Resend in {resendCooldown}s</span>
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

  // ── New password step ──
  if (step === "new-password") {
    return (
      <div>
        <button
          onClick={() => setStep("code")}
          className="mb-8 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#1a1a1a]"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          Set a new password
        </h1>
        <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
          Choose a strong password with at least 8 characters.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleResetPassword();
          }}
          className="space-y-4"
        >
          <Input
            id="newPassword"
            label="New password"
            type="password"
            placeholder="Min 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            autoFocus
            required
          />
          <Input
            id="confirmPassword"
            label="Confirm password"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />

          {error && <p className="text-[14px] text-[#de1135]">{error}</p>}

          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              disabled={!newPassword || !confirmPassword}
              className="w-full"
            >
              Reset password
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ── Done ──
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/10">
        <Check className="h-8 w-8 text-[#22c55e]" />
      </div>
      <h1 className="mb-3 text-[36px] font-bold leading-[44px] tracking-tight text-white">
        Password reset
      </h1>
      <p className="mx-auto mb-10 max-w-sm text-[16px] leading-[24px] text-[#888]">
        Your password has been updated. You can now log in with your new password.
      </p>
      <Button onClick={() => router.push("/login")} className="w-full">
        Back to login
      </Button>
    </div>
  );
}
