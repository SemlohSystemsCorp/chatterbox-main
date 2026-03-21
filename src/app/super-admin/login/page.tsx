"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CommentDiscussionIcon as MessageSquare, ShieldIcon as Shield } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isSuperAdmin } from "@/lib/super-admin";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already logged in as super admin
  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isSuperAdmin(user.email ?? "")) {
        router.replace("/super-admin");
        return;
      }
      setChecking(false);
    }
    check();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let email = identifier.trim();

    // Resolve username to email
    if (!email.includes("@")) {
      try {
        const res = await fetch("/api/auth/resolve-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email }),
        });
        if (!res.ok) {
          setError("No account found with that username");
          setLoading(false);
          return;
        }
        const data = await res.json();
        email = data.email;
      } catch {
        setError("Something went wrong");
        setLoading(false);
        return;
      }
    }

    // Check if this email is a super admin before attempting login
    if (!isSuperAdmin(email)) {
      setError("Access denied. This account is not authorized for super admin access.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/super-admin");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#276ef1] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="h-16 shrink-0 border-b border-[#1a1a1a] bg-[#111] px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-[1440px] items-center">
          <div className="flex items-center gap-2">
            <div className="logo-glass flex h-7 w-7 items-center justify-center rounded-md bg-white">
              <MessageSquare className="h-4 w-4 text-black" />
            </div>
            <span className="text-[18px] font-bold text-white">Chatterbox</span>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex flex-1 items-start justify-center px-6 pt-12 pb-16 lg:pt-20">
        <div className="w-full max-w-[400px]">
          {/* Admin badge */}
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-red-500/10">
              <Shield className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-red-400">
              Super Admin
            </span>
          </div>

          <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
            Admin Access
          </h1>
          <p className="mb-8 text-[15px] text-[#666]">
            Sign in with an authorized admin account to access the platform dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="identifier"
              label="Email or username"
              type="text"
              placeholder="Enter your email or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-[14px] text-[#de1135]">{error}</p>
            )}

            <div className="pt-2">
              <Button type="submit" loading={loading} className="w-full">
                Sign in
              </Button>
            </div>
          </form>

          <div className="mt-8 rounded-[8px] border border-[#1a1a1a] bg-[#0f0f0f] p-3">
            <p className="text-[12px] leading-relaxed text-[#555]">
              This page is restricted to authorized platform administrators. Unauthorized access attempts are logged.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
