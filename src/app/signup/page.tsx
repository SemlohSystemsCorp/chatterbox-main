"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Send verification code first
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

    // Store signup data in sessionStorage for the verify page
    sessionStorage.setItem(
      "chatterbox_signup",
      JSON.stringify({ fullName, email, password })
    );

    setLoading(false);
    // Pass redirect through to verify page via sessionStorage
    if (redirectTo !== "/dashboard") {
      sessionStorage.setItem("chatterbox_redirect", redirectTo);
    }
    router.push("/verify");
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
          id="fullName"
          label="Full name"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
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
