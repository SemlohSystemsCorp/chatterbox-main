"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DesktopDownloadIcon as Download,
  CheckIcon as Check,
  ArrowRightIcon as ArrowRight,
  ShieldIcon as Shield,
  ZapIcon as Zap,
  BellIcon as Bell,
  DeviceCameraVideoIcon as Video,
} from "@primer/octicons-react";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";
import { createClient } from "@/lib/supabase/client";

const DOWNLOAD_URLS = {
  mac_arm: "/api/download?platform=mac&arch=arm64",
  mac_intel: "/api/download?platform=mac&arch=x64",
  windows: "/api/download?platform=windows&arch=x64",
  windows_msi: "/api/download?platform=windows&arch=msi",
  releases: "https://github.com/SemlohSystemsCorp/chatterbox-main/releases/latest",
};

const SYSTEM_REQS = {
  mac: {
    os: "macOS 10.15 (Catalina) or later",
    arch: "Apple Silicon (M1+) or Intel",
    ram: "4 GB RAM minimum",
    disk: "200 MB available disk space",
  },
  windows: {
    os: "Windows 10 (version 1803) or later",
    arch: "64-bit (x86_64)",
    ram: "4 GB RAM minimum",
    disk: "200 MB available disk space",
  },
};

const DESKTOP_FEATURES = [
  {
    icon: Bell,
    title: "Native notifications",
    description: "OS-level notifications that work even when the app is in the background.",
  },
  {
    icon: Zap,
    title: "Global shortcuts",
    description: "Jump to Chatterbox from anywhere with customizable keyboard shortcuts.",
  },
  {
    icon: Video,
    title: "Screen sharing",
    description: "Share your screen directly in calls without browser permission prompts.",
  },
  {
    icon: Shield,
    title: "Signed & notarized",
    description: "Code-signed and notarized by Apple. No security warnings on install.",
  },
];

export default function DownloadPage() {
  const [platform, setPlatform] = useState<"mac" | "windows" | null>(null);
  const [isAppleSilicon, setIsAppleSilicon] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user) setIsLoggedIn(true);
      });
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Mac|Macintosh/i.test(ua)) {
      setPlatform("mac");
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl");
      const renderer = gl
        ? gl.getExtension("WEBGL_debug_renderer_info")
          ? gl.getParameter(
              gl.getExtension("WEBGL_debug_renderer_info")!
                .UNMASKED_RENDERER_WEBGL
            )
          : ""
        : "";
      const appleSilicon =
        /Apple M/i.test(renderer) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setIsAppleSilicon(appleSilicon);
    } else if (/Windows/i.test(ua)) {
      setPlatform("windows");
    }
  }, []);

  const primaryUrl =
    platform === "mac"
      ? isAppleSilicon
        ? DOWNLOAD_URLS.mac_arm
        : DOWNLOAD_URLS.mac_intel
      : DOWNLOAD_URLS.windows;

  const primaryLabel =
    platform === "mac"
      ? `Download for Mac (${isAppleSilicon ? "Apple Silicon" : "Intel"})`
      : "Download for Windows";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav isLoggedIn={isLoggedIn} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-white/[0.02] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center lg:pt-32">
          <div className="mb-6 inline-flex rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3.5">
            <Download className="h-7 w-7 text-white" />
          </div>

          <h1 className="mb-4 text-[clamp(2rem,4.5vw,3.2rem)] font-bold leading-[1.1] tracking-[-0.03em] text-white">
            Download Chatterbox
          </h1>
          <p className="mx-auto mb-10 max-w-lg text-[16px] leading-[26px] text-[#777]">
            Get the native desktop app for the best experience. Faster, native
            notifications, global shortcuts, and always running in your dock.
          </p>

          {/* Primary download button */}
          {platform ? (
            <a
              href={primaryUrl}
              className="group inline-flex h-12 items-center gap-3 rounded-xl bg-white px-8 text-[15px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
            >
              {platform === "mac" ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
                </svg>
              )}
              {primaryLabel}
            </a>
          ) : (
            <a
              href={DOWNLOAD_URLS.releases}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-12 items-center gap-3 rounded-xl bg-white px-8 text-[15px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
            >
              <Download className="h-5 w-5" />
              View all downloads
            </a>
          )}

          <p className="mt-4 text-[13px] text-[#555]">
            Also available on{" "}
            <a
              href={platform === "windows" ? DOWNLOAD_URLS.mac_arm : DOWNLOAD_URLS.windows}
              className="text-[#888] underline decoration-[#444] underline-offset-2 transition-colors hover:text-white"
            >
              {platform === "windows" ? "macOS" : "Windows"}
            </a>
            {" "}&middot;{" "}
            <Link
              href="/login"
              className="text-[#888] underline decoration-[#444] underline-offset-2 transition-colors hover:text-white"
            >
              or use the web app
            </Link>
          </p>
        </div>
      </section>

      {/* ── Platform Downloads ── */}
      <section className="border-t border-white/[0.06] py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* macOS Card */}
            <div className={`rounded-2xl border p-8 transition-colors ${platform === "mac" ? "border-white/[0.12] bg-white/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}>
              <div className="mb-5 flex items-center gap-3">
                <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div>
                  <h3 className="text-[17px] font-semibold text-white">macOS</h3>
                  <p className="text-[12px] text-[#555]">{SYSTEM_REQS.mac.os}</p>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href={DOWNLOAD_URLS.mac_arm}
                  className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 transition-all hover:border-white/[0.15] hover:bg-white/[0.06]"
                >
                  <div>
                    <div className="text-[14px] font-medium text-white">Apple Silicon</div>
                    <div className="text-[12px] text-[#555]">M1, M2, M3, M4 &mdash; .dmg</div>
                  </div>
                  <Download className="h-4 w-4 text-[#666]" />
                </a>
                <a
                  href={DOWNLOAD_URLS.mac_intel}
                  className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 transition-all hover:border-white/[0.15] hover:bg-white/[0.06]"
                >
                  <div>
                    <div className="text-[14px] font-medium text-white">Intel</div>
                    <div className="text-[12px] text-[#555]">x86_64 &mdash; .dmg</div>
                  </div>
                  <Download className="h-4 w-4 text-[#666]" />
                </a>
              </div>

              <div className="mt-5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="text-[12px] leading-[18px] text-[#555]">
                  <span className="font-medium text-[#888]">Install:</span> Open the .dmg
                  and drag Chatterbox to Applications. The app is signed and notarized by
                  Apple.
                </p>
              </div>
            </div>

            {/* Windows Card */}
            <div className={`rounded-2xl border p-8 transition-colors ${platform === "windows" ? "border-white/[0.12] bg-white/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}>
              <div className="mb-5 flex items-center gap-3">
                <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
                </svg>
                <div>
                  <h3 className="text-[17px] font-semibold text-white">Windows</h3>
                  <p className="text-[12px] text-[#555]">{SYSTEM_REQS.windows.os}</p>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href={DOWNLOAD_URLS.windows}
                  className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 transition-all hover:border-white/[0.15] hover:bg-white/[0.06]"
                >
                  <div>
                    <div className="text-[14px] font-medium text-white">Installer</div>
                    <div className="text-[12px] text-[#555]">Recommended &mdash; .exe</div>
                  </div>
                  <Download className="h-4 w-4 text-[#666]" />
                </a>
                <a
                  href={DOWNLOAD_URLS.windows_msi}
                  className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 transition-all hover:border-white/[0.15] hover:bg-white/[0.06]"
                >
                  <div>
                    <div className="text-[14px] font-medium text-white">MSI Package</div>
                    <div className="text-[12px] text-[#555]">For IT admins &mdash; .msi</div>
                  </div>
                  <Download className="h-4 w-4 text-[#666]" />
                </a>
              </div>

              <div className="mt-5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="text-[12px] leading-[18px] text-[#555]">
                  <span className="font-medium text-[#888]">Install:</span> Run the
                  installer and follow the prompts. Chatterbox will start automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <a
              href={DOWNLOAD_URLS.releases}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-[#555] transition-colors hover:text-white"
            >
              View all releases on GitHub &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── Why Desktop ── */}
      <section className="border-t border-white/[0.06] py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-4 text-center text-[28px] font-bold tracking-[-0.02em] text-white lg:text-[32px]">
            Why use the desktop app?
          </h2>
          <p className="mx-auto mb-14 max-w-lg text-center text-[15px] leading-[24px] text-[#777]">
            Everything the web app does, plus native integrations that make
            Chatterbox feel like it belongs on your machine.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {DESKTOP_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.1]"
              >
                <div className="mb-3 inline-flex rounded-lg border border-white/[0.06] bg-white/[0.04] p-2">
                  <feature.icon className="h-4 w-4 text-white" />
                </div>
                <h3 className="mb-1.5 text-[14px] font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-[13px] leading-[20px] text-[#777]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── System Requirements ── */}
      <section className="border-t border-white/[0.06] py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-10 text-center text-[24px] font-bold tracking-[-0.02em] text-white">
            System requirements
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {(
              [
                { label: "macOS", reqs: SYSTEM_REQS.mac },
                { label: "Windows", reqs: SYSTEM_REQS.windows },
              ] as const
            ).map(({ label, reqs }) => (
              <div
                key={label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
              >
                <h3 className="mb-4 text-[15px] font-semibold text-white">{label}</h3>
                <ul className="space-y-2.5">
                  {Object.values(reqs).map((req) => (
                    <li key={req} className="flex items-start gap-2.5 text-[13px] text-[#999]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#555]" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/[0.06] py-20 lg:py-24">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-white">
            Prefer the browser?
          </h2>
          <p className="mb-8 text-[15px] leading-[24px] text-[#777]">
            Chatterbox works great in any modern browser. No download required.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
              >
                Open Chatterbox
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <Link
                href="/signup"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
              >
                Start for free in your browser
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
