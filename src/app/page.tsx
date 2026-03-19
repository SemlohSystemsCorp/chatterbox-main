"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CommentDiscussionIcon as MessageSquare, SearchIcon as Search, BellIcon as Bell, SparklesFillIcon as Sparkles, DeviceCameraVideoIcon as Video, ShieldIcon as Shield, ArrowRightIcon as ArrowRight, GlobeIcon as Globe, PackageIcon as Box, ZapIcon as Zap, PeopleIcon as Users, HashIcon as Hash, ReplyIcon as Reply, SmileyGrinIcon as SmilePlus, ChevronRightIcon as ChevronRight, CheckIcon as Check, DesktopDownloadIcon as Download } from "@primer/octicons-react";
import Image from "next/image";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";
import { isTauri } from "@/lib/tauri";
import HomeDesktop from "./home-desktop";

const features = [
  {
    icon: Bell,
    title: "Smart notifications",
    description:
      "Priority routing, schedules, per-channel controls. Only get pinged when it matters.",
  },
  {
    icon: Search,
    title: "Instant search",
    description:
      "Full-text across messages, files, and threads. Filters and date ranges built in.",
  },
  {
    icon: Sparkles,
    title: "AI built in",
    description:
      "Summarize threads, catch up on channels, draft replies. Actually saves you time.",
  },
  {
    icon: Video,
    title: "Voice & video",
    description:
      "Call from any channel or DM. Screen sharing included, no extra app needed.",
  },
  {
    icon: Globe,
    title: "Joint channels",
    description:
      "Shared channels across workspaces. Work with partners and clients in one place.",
  },
  {
    icon: Shield,
    title: "Enterprise security",
    description:
      "Role-based access at every level. 256-bit encryption, SOC 2 compliant.",
  },
];

// Animated chat messages for the hero preview
const chatMessages = [
  {
    name: "Sarah Chen",
    initials: "SC",
    color: "bg-emerald-500",
    time: "10:32 AM",
    msg: "Just pushed the new auth flow. Can someone review the PR?",
    reactions: [{ emoji: "👀", count: 2 }, { emoji: "🚀", count: 1 }],
  },
  {
    name: "Mike Ross",
    initials: "MR",
    color: "bg-sky-500",
    time: "10:34 AM",
    msg: "On it! The notification refactor is looking great btw — way snappier.",
    reply: true,
  },
  {
    name: "Alex Kim",
    initials: "AK",
    color: "bg-violet-500",
    time: "10:36 AM",
    msg: "Search is 10x faster with the new index. Deploying to staging now.",
    reactions: [{ emoji: "🔥", count: 3 }],
  },
];

const RELEASE_BASE = "https://github.com/SemlohSystemsCorp/chatterbox-main/releases/latest/download";
const DOWNLOAD_URLS = {
  mac_arm: `${RELEASE_BASE}/Chatterbox_aarch64.dmg`,
  mac_intel: `${RELEASE_BASE}/Chatterbox_x64.dmg`,
  windows: `${RELEASE_BASE}/Chatterbox_x64-setup.exe`,
  releases: "https://github.com/SemlohSystemsCorp/chatterbox-main/releases/latest",
};

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [platform, setPlatform] = useState<"mac" | "windows" | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(DOWNLOAD_URLS.releases);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Mac|Macintosh/i.test(ua)) {
      setPlatform("mac");
      // Apple Silicon detection via WebGL renderer or platform
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl");
      const renderer = gl
        ? (gl.getExtension("WEBGL_debug_renderer_info")
          ? gl.getParameter(gl.getExtension("WEBGL_debug_renderer_info")!.UNMASKED_RENDERER_WEBGL)
          : "")
        : "";
      const isAppleSilicon = /Apple M/i.test(renderer) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setDownloadUrl(isAppleSilicon ? DOWNLOAD_URLS.mac_arm : DOWNLOAD_URLS.mac_intel);
    } else if (/Windows/i.test(ua)) {
      setPlatform("windows");
      setDownloadUrl(DOWNLOAD_URLS.windows);
    }
  }, []);

  // Subtle parallax on the hero preview
  useEffect(() => {
    function handleScroll() {
      if (!heroRef.current) return;
      const y = window.scrollY;
      heroRef.current.style.transform = `translateY(${y * 0.05}px)`;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isTauri) return <HomeDesktop />;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      {/* ── Desktop Download Banner ── */}
      {platform && !bannerDismissed && (
        <div className="fixed left-0 right-0 top-14 z-40 flex items-center justify-center gap-3 border-b border-white/[0.06] bg-[#0a0a0a]/95 px-4 py-2.5 text-[13px] text-[#ccc] backdrop-blur">
          {platform === "mac" ? (
            <svg className="h-4 w-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          ) : (
            <svg className="h-4 w-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
          )}
          <span>Chatterbox is available as a native {platform === "mac" ? "macOS" : "Windows"} app</span>
          <a
            href={downloadUrl}
            className="ml-1 inline-flex items-center gap-1 rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-black transition-colors hover:bg-[#e8e8e8]"
          >
            <Download className="h-3 w-3" />
            Download
          </a>
          <button
            onClick={() => setBannerDismissed(true)}
            className="ml-2 text-[#555] transition-colors hover:text-white"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <section className={`relative overflow-hidden ${platform && !bannerDismissed ? "pt-24" : "pt-14"}`}>
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-white/[0.02] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="pb-20 pt-24 text-center lg:pb-28 lg:pt-32">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-[13px] text-[#888]">
              <Zap className="h-3.5 w-3.5 text-white" />
              Now with AI-powered summaries and search
            </div>

            <h1 className="mx-auto mb-6 max-w-3xl text-[clamp(2.5rem,5.5vw,4rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white">
              Where teams actually
              <br />
              <span className="bg-gradient-to-r from-white via-white to-[#666] bg-clip-text text-transparent">
                get things done
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-xl text-[17px] leading-[28px] text-[#777]">
              Chatterbox fixes everything broken about team messaging.
              Real-time chat, threaded replies, smart notifications, and AI
              that saves you hours every week.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
              >
                Start for free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
              >
                See features
              </a>
            </div>

            {/* Stats row */}
            <div className="mt-14 flex items-center justify-center gap-8 text-[13px] text-[#555] sm:gap-12">
              {[
                ["99.99%", "Uptime"],
                ["<50ms", "Latency"],
                ["256-bit", "Encryption"],
                ["Unlimited", "History"],
              ].map(([value, label]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="font-semibold text-[#aaa]">{value}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── App Preview ── */}
          <div ref={heroRef} className="relative mx-auto max-w-4xl pb-20">
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f0f] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)]">
              {/* Title bar */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#333]" />
                  <div className="h-3 w-3 rounded-full bg-[#333]" />
                  <div className="h-3 w-3 rounded-full bg-[#333]" />
                </div>
                <div className="ml-4 flex items-center gap-1.5 text-[12px] text-[#555]">
                  <MessageSquare className="h-3 w-3" />
                  Acme Corp
                </div>
              </div>

              {/* App body */}
              <div className="flex h-[420px] lg:h-[480px]">
                {/* Sidebar */}
                <div className="hidden w-48 shrink-0 border-r border-white/[0.06] py-3 md:block">
                  <div className="mb-4 flex items-center gap-2 px-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[9px] font-bold text-black">
                      AC
                    </div>
                    <span className="text-[13px] font-semibold text-white">
                      Acme Corp
                    </span>
                  </div>
                  <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                    Channels
                  </div>
                  <div className="space-y-px px-1.5">
                    {[
                      { name: "general", active: false },
                      { name: "engineering", active: true },
                      { name: "design", active: false },
                      { name: "product", active: false, unread: true },
                      { name: "random", active: false },
                    ].map((ch) => (
                      <div
                        key={ch.name}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] ${
                          ch.active
                            ? "bg-white/[0.06] font-medium text-white"
                            : "text-[#555] hover:text-[#888]"
                        }`}
                      >
                        <Hash className="h-3 w-3 shrink-0 text-[#444]" />
                        <span className="truncate">{ch.name}</span>
                        {ch.unread && !ch.active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                    Direct messages
                  </div>
                  <div className="space-y-px px-1.5">
                    {[
                      { name: "Sarah Chen", color: "bg-emerald-500" },
                      { name: "Mike Ross", color: "bg-sky-500" },
                      { name: "Alex Kim", color: "bg-violet-500" },
                    ].map((u) => (
                      <div
                        key={u.name}
                        className="flex items-center gap-2 rounded-md px-2 py-1 text-[13px] text-[#555]"
                      >
                        <div className="relative">
                          <div
                            className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[8px] font-bold text-white ${u.color}`}
                          >
                            {u.name[0]}
                          </div>
                          <div className="absolute -bottom-px -right-px h-1.5 w-1.5 rounded-full border border-[#0f0f0f] bg-green-500" />
                        </div>
                        <span className="truncate">{u.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat area */}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-[#444]" />
                      <span className="text-[13px] font-semibold text-white">
                        engineering
                      </span>
                      <span className="ml-1 text-[11px] text-[#444]">
                        12 members
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[#444]">
                      <Search className="h-3.5 w-3.5" />
                      <Users className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden px-4 py-4">
                    {chatMessages.map((message, idx) => (
                      <div
                        key={idx}
                        className="group rounded-md px-1 py-1.5 transition-colors hover:bg-white/[0.02]"
                      >
                        <div className="flex gap-2.5">
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${message.color}`}
                          >
                            {message.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[13px] font-semibold text-white">
                                {message.name}
                              </span>
                              <span className="text-[10px] text-[#444]">
                                {message.time}
                              </span>
                            </div>
                            <p className="text-[13px] leading-[20px] text-[#999]">
                              {message.msg}
                            </p>
                            {message.reactions && (
                              <div className="mt-1.5 flex gap-1">
                                {message.reactions.map((r) => (
                                  <span
                                    key={r.emoji}
                                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[11px]"
                                  >
                                    {r.emoji}
                                    <span className="text-[#666]">
                                      {r.count}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {message.reply && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#555]">
                                <Reply className="h-3 w-3" />
                                Replying to Sarah Chen
                              </div>
                            )}
                          </div>
                          {/* Hover actions */}
                          <div className="flex items-start gap-px pt-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="flex items-center gap-px rounded-md border border-white/[0.06] bg-[#1a1a1a] p-0.5">
                              <SmilePlus className="h-4 w-4 p-0.5 text-[#555]" />
                              <Reply className="h-4 w-4 p-0.5 text-[#555]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Typing indicator */}
                    <div className="flex items-center gap-2 px-1 py-1.5">
                      <div className="flex h-8 w-8 items-center justify-center">
                        <div className="flex gap-0.5">
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#444] [animation-delay:0ms]" />
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#444] [animation-delay:150ms]" />
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#444] [animation-delay:300ms]" />
                        </div>
                      </div>
                      <span className="text-[11px] text-[#555]">
                        Sarah is typing...
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-white/[0.06] p-3">
                    <div className="flex items-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[13px] text-[#444]">
                      Message #engineering
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow under preview */}
            <div className="absolute -bottom-10 left-1/2 h-40 w-[80%] -translate-x-1/2 rounded-full bg-white/[0.02] blur-[80px]" />
          </div>
        </div>
      </section>

      {/* ── Trusted by ── */}
      <section className="border-t border-white/[0.06] py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-10 text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-[#444]">
            These teams very likley would trust us
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 lg:gap-x-20">
            {/* Netflix */}
            <Image
              src="https://cdn.brandfetch.io/netflix.com/w/512/h/512/logo"
              alt="Netflix"
              width={120}
              height={40}
              className="h-9 w-auto opacity-40 brightness-0 invert transition-opacity hover:opacity-70"
              unoptimized
            />
            {/* Uber */}
            <Image
              src="https://cdn.brandfetch.io/uber.com/w/512/h/512/logo"
              alt="Uber"
              width={120}
              height={40}
              className="h-9 w-auto opacity-40 brightness-0 invert transition-opacity hover:opacity-70"
              unoptimized
            />
            {/* OpenAI */}
            <Image
              src="https://cdn.brandfetch.io/openai.com/w/512/h/512/logo"
              alt="OpenAI"
              width={120}
              height={40}
              className="h-9 w-auto opacity-40 brightness-0 invert transition-opacity hover:opacity-70"
              unoptimized
            />
            {/* Anthropic */}
            <Image
              src="https://cdn.brandfetch.io/anthropic.com/w/512/h/512/logo"
              alt="Anthropic"
              width={120}
              height={40}
              className="h-9 w-auto opacity-40 brightness-0 invert transition-opacity hover:opacity-70"
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative border-t border-white/[0.06] py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-lg">
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
              Features
            </p>
            <h2 className="mb-4 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[44px]">
              Built for how teams
              <br />
              actually work
            </h2>
            <p className="text-[16px] leading-[26px] text-[#777]">
              Every feature designed to fix the problems you hit every day with other chat tools.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-colors hover:border-white/[0.1] hover:bg-white/[0.03]"
              >
                <div className="mb-4 inline-flex rounded-xl border border-white/[0.06] bg-white/[0.04] p-2.5">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-[15px] font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-[14px] leading-[22px] text-[#777]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Boxes ── */}
      <section id="boxes" className="border-t border-white/[0.06] bg-[#0d0d0d] py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">
            <div className="flex-1 lg:max-w-md">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[13px] font-medium text-white">
                <Box className="h-3.5 w-3.5" />
                Boxes
              </div>
              <h2 className="mb-5 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[44px]">
                One account,
                <br />
                every workspace
              </h2>
              <p className="mb-8 text-[16px] leading-[26px] text-[#777]">
                Boxes are workspaces for your teams, projects, and organizations.
                Each has its own channels, members, and permissions.
              </p>
              <ul className="space-y-3">
                {[
                  "Separate workspace per team or project",
                  "Fine-grained roles and permissions",
                  "Joint channels across workspaces",
                  "Custom invite links with role assignment",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#555]" />
                    <span className="text-[14px] text-[#aaa]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 lg:p-8">
                <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#555]">
                  Your Boxes
                </div>
                <div className="space-y-1.5">
                  {[
                    {
                      name: "Acme Corp",
                      members: 48,
                      channels: 12,
                      color: "bg-white text-black",
                    },
                    {
                      name: "Design Studio",
                      members: 15,
                      channels: 6,
                      color: "bg-blue-500 text-white",
                    },
                    {
                      name: "Open Source",
                      members: 230,
                      channels: 24,
                      color: "bg-violet-500 text-white",
                    },
                  ].map((b) => (
                    <div
                      key={b.name}
                      className="flex items-center gap-4 rounded-xl border border-transparent p-3.5 transition-colors hover:border-white/[0.06] hover:bg-white/[0.02]"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-[13px] font-bold ${b.color}`}
                      >
                        {b.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </div>
                      <div className="flex-1">
                        <div className="text-[14px] font-medium text-white">
                          {b.name}
                        </div>
                        <div className="text-[12px] text-[#555]">
                          {b.members} members &middot; {b.channels} channels
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#333]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-white/[0.06] py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
              Pricing
            </p>
            <h2 className="mb-4 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[44px]">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto max-w-md text-[16px] leading-[26px] text-[#777]">
              Start free. Upgrade when you need more. No hidden fees, no per-message charges.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-3">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
              <div className="mb-6">
                <h3 className="mb-1 text-[15px] font-semibold text-white">Free</h3>
                <p className="text-[13px] text-[#555]">For small teams getting started</p>
              </div>
              <div className="mb-6">
                <span className="text-[40px] font-bold tracking-tight text-white">$0</span>
                <span className="ml-1 text-[14px] text-[#555]">/month</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {[
                  "Up to 10 members",
                  "5 channels per Box",
                  "90 days message history",
                  "1:1 voice & video calls",
                  "5 GB file storage",
                  "Basic search",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-[#999]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#555]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="flex h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[13px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
              >
                Get started
              </Link>
            </div>

            {/* Pro — highlighted */}
            <div className="relative flex flex-col rounded-2xl border border-white/[0.15] bg-white/[0.04] p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-0.5 text-[11px] font-semibold text-black">
                Most popular
              </div>
              <div className="mb-6">
                <h3 className="mb-1 text-[15px] font-semibold text-white">Pro</h3>
                <p className="text-[13px] text-[#555]">For growing teams that need more</p>
              </div>
              <div className="mb-6">
                <span className="text-[40px] font-bold tracking-tight text-white">$8</span>
                <span className="ml-1 text-[14px] text-[#555]">/user/month</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {[
                  "Unlimited members",
                  "Unlimited channels",
                  "Unlimited message history",
                  "Group calls + screen sharing",
                  "50 GB file storage",
                  "AI summaries & catch-up",
                  "Advanced search & filters",
                  "Joint channels",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-[#ccc]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="group flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white text-[13px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
              >
                Start free trial
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Enterprise */}
            <div className="flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
              <div className="mb-6">
                <h3 className="mb-1 text-[15px] font-semibold text-white">Enterprise</h3>
                <p className="text-[13px] text-[#555]">For organizations at scale</p>
              </div>
              <div className="mb-6">
                <span className="text-[40px] font-bold tracking-tight text-white">Custom</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {[
                  "Everything in Pro",
                  "SSO / SAML",
                  "Unlimited file storage",
                  "Custom data retention",
                  "Audit logs & compliance",
                  "Dedicated support & SLA",
                  "Custom integrations",
                  "On-premise option",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-[#999]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#555]" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="flex h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[13px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
              >
                Contact sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="security" className="border-t border-white/[0.06] py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="mb-5 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[44px]">
              Ready to switch?
            </h2>
            <p className="mb-10 text-[16px] leading-[26px] text-[#777]">
              Free to start, no credit card required. Set up your first Box in
              under a minute.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
              >
                Get started for free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Download Desktop App ── */}
      <section className="border-t border-white/[0.06] py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center lg:p-14">
            <div className="mb-5 inline-flex rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3.5">
              <Download className="h-7 w-7 text-white" />
            </div>
            <h3 className="mb-2 text-[22px] font-bold tracking-[-0.01em] text-white">
              Download desktop app
            </h3>
            <p className="mb-8 max-w-md text-[14px] leading-[22px] text-[#777]">
              Get the native desktop app for the best experience. Native notifications,
              global shortcuts, and a faster feel.
            </p>
            {/* Primary: auto-detected platform button */}
            {platform ? (
              <a
                href={downloadUrl}
                className="group inline-flex h-11 items-center gap-2.5 rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
              >
                {platform === "mac" ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
                )}
                Download for {platform === "mac" ? "macOS" : "Windows"}
              </a>
            ) : (
              <a
                href={DOWNLOAD_URLS.releases}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-11 items-center gap-2.5 rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
              >
                <Download className="h-4 w-4" />
                Download desktop app
              </a>
            )}

            {/* Secondary: other platform */}
            <a
              href={platform === "windows" ? DOWNLOAD_URLS.mac_arm : DOWNLOAD_URLS.windows}
              className="inline-flex h-11 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
            >
              {platform === "windows" ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
              )}
              {platform === "windows" ? "macOS" : "Windows"}
            </a>

            <a
              href={DOWNLOAD_URLS.releases}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-[12px] text-[#555] transition-colors hover:text-white"
            >
              All downloads &rarr;
            </a>

            <p className="mt-2 text-[12px] text-[#444]">
              macOS 10.15+ &middot; Windows 10+
            </p>
            {platform === "mac" && (
              <p className="mt-2 max-w-sm text-[11px] leading-[16px] text-[#444]">
                After opening the .dmg, drag Chatterbox to Applications. If macOS blocks the app,
                go to System Settings &rarr; Privacy &amp; Security and click &ldquo;Open Anyway&rdquo;.
              </p>
            )}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
