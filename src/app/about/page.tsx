import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Chatterbox — the team behind the modern communication platform built for speed, clarity, and collaboration.",
};

const values = [
  {
    title: "Speed over ceremony",
    description:
      "We ship fast and iterate in the open. Every feature starts as the simplest thing that could work, then gets refined based on real usage.",
  },
  {
    title: "Clarity by default",
    description:
      "Good communication tools should reduce confusion, not create it. We obsess over defaults that keep conversations clear and organized.",
  },
  {
    title: "Privacy is non-negotiable",
    description:
      "Your conversations are yours. We encrypt everything, never sell data, and give you full control over retention and access policies.",
  },
  {
    title: "Built for builders",
    description:
      "We build Chatterbox for teams that ship products, write code, and solve hard problems. Every decision is informed by how these teams actually work.",
  },
];

const team = [
  {
    name: "Jordan Hayes",
    role: "CEO & Co-founder",
    bio: "Previously engineering lead at Stripe. Built distributed systems for 10 years before deciding team chat needed a rethink.",
  },
  {
    name: "Priya Sharma",
    role: "CTO & Co-founder",
    bio: "Former principal engineer at Cloudflare. Obsessed with real-time systems, low latency, and making complex things feel simple.",
  },
  {
    name: "Marcus Chen",
    role: "Head of Design",
    bio: "Led product design at Linear and Figma. Believes the best interfaces are the ones you don't notice.",
  },
  {
    name: "Elena Rodriguez",
    role: "Head of Engineering",
    bio: "Built messaging infrastructure at WhatsApp. Knows what it takes to deliver messages reliably at any scale.",
  },
];

const milestones = [
  { year: "2023", event: "Founded in San Francisco" },
  { year: "2023", event: "First 100 teams on the platform" },
  { year: "2024", event: "Launched AI features and joint channels" },
  { year: "2024", event: "10,000 teams, Series A funding" },
  { year: "2025", event: "Enterprise launch, SOC 2 certified" },
  { year: "2025", event: "50,000+ teams worldwide" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
                About
              </p>
              <h1 className="mb-6 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[48px]">
                We&apos;re building the future of team communication
              </h1>
              <p className="text-[17px] leading-[28px] text-[#777]">
                Chatterbox started with a simple observation: every team chat
                tool gets the basics wrong. Notifications are noisy, search is
                broken, and catching up after a day off takes an hour. We
                decided to fix that.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/[0.06] py-16">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 lg:grid-cols-4">
            {[
              ["50,000+", "Teams"],
              ["2M+", "Daily messages"],
              ["142", "Countries"],
              ["99.99%", "Uptime"],
            ].map(([value, label]) => (
              <div key={label} className="text-center">
                <div className="text-[28px] font-bold tracking-tight text-white">
                  {value}
                </div>
                <div className="mt-1 text-[13px] text-[#555]">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Our story */}
        <section className="py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-16 lg:flex-row lg:gap-20">
              <div className="flex-1">
                <h2 className="mb-6 text-[28px] font-bold tracking-[-0.02em] text-white">
                  Our story
                </h2>
                <div className="space-y-4 text-[15px] leading-[26px] text-[#888]">
                  <p>
                    We were a distributed engineering team using every chat tool
                    on the market. Slack was noisy. Teams was slow. Discord
                    wasn&apos;t built for work. Every tool had the same
                    fundamental problems: too many notifications, search that
                    couldn&apos;t find anything, and no way to catch up without
                    reading every message.
                  </p>
                  <p>
                    So we built Chatterbox. We started with the problems that
                    wasted the most time: notification routing that actually
                    respects your focus, search that returns what you need in
                    milliseconds, and AI that can summarize what you missed while
                    you were heads-down on real work.
                  </p>
                  <p>
                    Today, over 50,000 teams use Chatterbox to communicate
                    faster with less noise. We&apos;re a team of 45 people across
                    San Francisco, London, and Tokyo, and we&apos;re just getting
                    started.
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="w-full lg:w-80">
                <h3 className="mb-6 text-[14px] font-semibold text-white">
                  Milestones
                </h3>
                <div className="space-y-4">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-[#444]" />
                        {i < milestones.length - 1 && (
                          <div className="w-px flex-1 bg-[#222]" />
                        )}
                      </div>
                      <div className="pb-4">
                        <div className="text-[12px] font-semibold text-[#555]">
                          {m.year}
                        </div>
                        <div className="text-[13px] text-[#aaa]">
                          {m.event}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="border-t border-white/[0.06] bg-[#0d0d0d] py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-[28px] font-bold tracking-[-0.02em] text-white">
              What we believe
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
                >
                  <h3 className="mb-2 text-[15px] font-semibold text-white">
                    {v.title}
                  </h3>
                  <p className="text-[14px] leading-[22px] text-[#777]">
                    {v.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-[28px] font-bold tracking-[-0.02em] text-white">
              Leadership
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {team.map((person) => (
                <div
                  key={person.name}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-[16px] font-bold text-white">
                    {person.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <h3 className="text-[14px] font-semibold text-white">
                    {person.name}
                  </h3>
                  <p className="mb-3 text-[12px] text-[#555]">{person.role}</p>
                  <p className="text-[13px] leading-[20px] text-[#777]">
                    {person.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/[0.06] py-20">
          <div className="mx-auto max-w-xl px-6 text-center">
            <h2 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-white">
              Join us
            </h2>
            <p className="mb-8 text-[15px] leading-[24px] text-[#777]">
              We&apos;re hiring across engineering, design, and go-to-market.
              Remote-friendly, async-first.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
              >
                Try Chatterbox
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#"
                className="inline-flex h-11 items-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
              >
                View open roles
              </a>
            </div>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}
