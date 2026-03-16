"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Zap,
  Building2,
  Users,
  Sparkles,
  HardDrive,
  MessageSquareText,
  Puzzle,
  Headset,
  Palette,
  ShieldCheck,
  FileText,
  Server,
  Lock,
  Phone,
  FileSignature,
  Globe,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";

interface BoxData {
  id: string;
  short_id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  plan: string;
  role: string;
}

interface CheckoutClientProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
  boxes: BoxData[];
}

const proFeatures = [
  { icon: Users, label: "Unlimited channels & members" },
  { icon: HardDrive, label: "50 GB storage" },
  { icon: MessageSquareText, label: "Unlimited message history" },
  { icon: Puzzle, label: "All integrations" },
  { icon: Sparkles, label: "AI-powered features" },
  { icon: Headset, label: "Priority support" },
  { icon: Palette, label: "Custom branding" },
];

const enterpriseFeatures = [
  { icon: Zap, label: "Everything in Pro" },
  { icon: ShieldCheck, label: "SSO / SAML" },
  { icon: FileText, label: "Audit logs" },
  { icon: Server, label: "99.99% SLA" },
  { icon: Phone, label: "Dedicated support" },
  { icon: FileSignature, label: "Custom contracts" },
  { icon: Globe, label: "Data residency" },
  { icon: Lock, label: "Advanced compliance" },
];

export function CheckoutClient({ user, boxes }: CheckoutClientProps) {
  const searchParams = useSearchParams();
  const boxShortId = searchParams.get("box") || "";
  const selectedPlan = searchParams.get("plan") || "pro";
  const isSuccess = searchParams.get("success") === "true";
  const box = boxes.find((b) => b.short_id === boxShortId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!box) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId: box.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start checkout");
        setLoading(false);
        return;
      }

      // Redirect to Polar's hosted checkout
      window.location.href = data.url;
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  // ── Enterprise contact page ──
  if (selectedPlan === "enterprise") {
    return (
      <AppShell user={user} boxes={boxes}>
        <TopBar
          title="Enterprise Plan"
          actions={
            <Link
              href={box ? `/box/${box.short_id}/settings` : "/dashboard"}
              className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          }
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-[480px] text-center px-6">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-[#276ef1]" />
            <h2 className="mb-2 text-[24px] font-bold text-white">Enterprise Plan</h2>
            <p className="mb-6 text-[14px] text-[#666] leading-relaxed">
              Custom pricing and features tailored for large organizations. Get SSO, audit logs, dedicated support, SLA guarantees, and more.
            </p>
            <div className="mb-6 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-5 text-left">
              <ul className="space-y-2.5">
                {enterpriseFeatures.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-[13px] text-[#888]">
                    <f.icon className="h-3.5 w-3.5 shrink-0 text-[#555]" />
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="mailto:sales@chatterbox.io?subject=Enterprise Plan Inquiry"
              className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-white px-6 text-[14px] font-semibold text-black transition-colors hover:bg-[#e0e0e0]"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Success state ──
  if (isSuccess) {
    return (
      <AppShell user={user} boxes={boxes}>
        <TopBar title="Checkout" />
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-[400px] text-center px-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/10">
              <Check className="h-8 w-8 text-[#22c55e]" />
            </div>
            <h2 className="mb-2 text-[24px] font-bold text-white">
              Welcome to Pro!
            </h2>
            <p className="mb-8 text-[14px] text-[#666]">
              Your subscription is now active{box ? ` for ${box.name}` : ""}. All Pro features are unlocked.
            </p>
            <Link
              href={box ? `/box/${box.short_id}` : "/dashboard"}
              className="inline-flex h-10 items-center rounded-[8px] bg-white px-6 text-[14px] font-semibold text-black transition-colors hover:bg-[#e0e0e0]"
            >
              Go to {box ? box.name : "Dashboard"}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Pro checkout ──
  return (
    <AppShell user={user} boxes={boxes}>
      <TopBar
        title="Checkout"
        actions={
          <Link
            href={box ? `/box/${box.short_id}/settings` : "/dashboard"}
            className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[520px] px-6 py-12">
          {/* Plan card */}
          <div className="rounded-[16px] border border-[#1a1a1a] bg-[#0f0f0f] p-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#276ef1]/10">
                <Zap className="h-5 w-5 text-[#276ef1]" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-white">Pro Plan</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-[24px] font-bold text-white">$8</span>
                  <span className="text-[13px] text-[#555]">per member/month</span>
                </div>
              </div>
            </div>

            {/* Box info */}
            {box && (
              <div className="mb-5 flex items-center gap-3 rounded-[10px] bg-[#1a1a1a] p-3">
                {box.icon_url ? (
                  <img src={box.icon_url} alt="" className="h-9 w-9 rounded-[8px]" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white text-[11px] font-bold text-black">
                    {box.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-[14px] font-medium text-white">{box.name}</div>
                  <div className="text-[12px] text-[#555]">
                    Upgrading from <span className="capitalize">{box.plan}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mb-6 space-y-2.5">
              {proFeatures.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 text-[13px]">
                  <f.icon className="h-3.5 w-3.5 shrink-0 text-[#276ef1]" />
                  <span className="text-[#ccc]">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="mb-5 border-t border-[#1a1a1a]" />

            {/* Error */}
            {error && (
              <p className="mb-4 text-[14px] text-[#de1135]">{error}</p>
            )}

            {/* CTA */}
            <button
              onClick={handleCheckout}
              disabled={loading || !box}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-white text-[14px] font-semibold text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  Redirecting...
                </>
              ) : (
                "Continue to payment"
              )}
            </button>

            <p className="mt-3 text-center text-[11px] text-[#444]">
              You&apos;ll be redirected to our secure payment partner to complete your purchase. Cancel anytime.
            </p>
          </div>

          {!box && (
            <p className="mt-6 text-center text-[13px] text-[#555]">
              No workspace selected.{" "}
              <Link href="/dashboard" className="text-white underline underline-offset-2">
                Go to dashboard
              </Link>{" "}
              to select a workspace to upgrade.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
