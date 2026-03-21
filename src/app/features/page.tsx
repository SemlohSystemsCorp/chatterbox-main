import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon as ArrowRight,
  CheckIcon as Check,
  XIcon as X,
  CommentDiscussionIcon as MessageSquare,
  DeviceCameraVideoIcon as Video,
  SparklesFillIcon as Sparkles,
  SearchIcon as Search,
  GraphIcon as BarChart,
  FileIcon as File,
  PlugIcon as Plug,
  DeviceMobileIcon as Mobile,
} from "@primer/octicons-react";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore everything Chatterbox offers — channels, voice calls, AI summaries, advanced search, polls, file sharing, integrations, and native apps.",
};

const features = [
  {
    icon: MessageSquare,
    title: "Channels & DMs",
    description:
      "Organize conversations by topic with public and private channels, or go 1:1 with direct messages. Keep every discussion in its place.",
  },
  {
    icon: Video,
    title: "Voice & Video Calls",
    description:
      "Crystal-clear group calls with screen sharing, noise suppression, and background blur. Start a call from any conversation in one click.",
  },
  {
    icon: Sparkles,
    title: "AI Summaries",
    description:
      "Missed a conversation? Get an AI-generated catch-up in seconds, not minutes. Sherlock reads the messages so you don\u2019t have to.",
  },
  {
    icon: Search,
    title: "Advanced Search",
    description:
      "Find any message instantly with filters like from:, in:, before:, and has:. Results in milliseconds, not seconds.",
  },
  {
    icon: BarChart,
    title: "Polls & Reactions",
    description:
      "Quick decisions with built-in polls, emoji reactions, and threaded discussions. No more \u201Ccan everyone reply with a thumbs up?\u201D",
  },
  {
    icon: File,
    title: "File Sharing",
    description:
      "Drag and drop files, images, and documents with inline previews. Everything is searchable and stays attached to the conversation.",
  },
  {
    icon: Plug,
    title: "Integrations",
    description:
      "Connect your tools with webhooks and a growing library of integrations. GitHub, Linear, Figma, and more \u2014 all piped into the right channel.",
  },
  {
    icon: Mobile,
    title: "Desktop & Mobile",
    description:
      "Native apps for macOS, Windows, iOS, and Android with push notifications. Your conversations follow you everywhere.",
  },
];

const comparisonRows = [
  { feature: "Channels & DMs", chatterbox: true, slack: true, teams: true },
  { feature: "Voice & video calls", chatterbox: true, slack: true, teams: true },
  { feature: "AI message summaries", chatterbox: true, slack: false, teams: false },
  { feature: "Advanced search filters", chatterbox: true, slack: "Paid", teams: "Slow" },
  { feature: "Built-in polls", chatterbox: true, slack: "Add-on", teams: "Add-on" },
  { feature: "Screen sharing", chatterbox: true, slack: true, teams: true },
  { feature: "Noise suppression", chatterbox: true, slack: false, teams: true },
  { feature: "File inline previews", chatterbox: true, slack: true, teams: "Limited" },
  { feature: "Webhook integrations", chatterbox: true, slack: true, teams: true },
  { feature: "Native desktop app", chatterbox: true, slack: true, teams: true },
  { feature: "Native mobile app", chatterbox: true, slack: true, teams: true },
  { feature: "End-to-end encryption", chatterbox: true, slack: false, teams: false },
  { feature: "Smart notifications", chatterbox: true, slack: false, teams: false },
  { feature: "Free plan with full features", chatterbox: true, slack: "Limited", teams: "Limited" },
  { feature: "Fast load time (<1s)", chatterbox: true, slack: false, teams: false },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true)
    return <Check className="h-4 w-4 text-emerald-400" />;
  if (value === false)
    return <X className="h-4 w-4 text-[#444]" />;
  return (
    <span className="text-[12px] font-medium text-yellow-500/80">
      {value}
    </span>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
                Features
              </p>
              <h1 className="mb-6 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[48px]">
                Everything your team needs
              </h1>
              <p className="mx-auto max-w-xl text-[17px] leading-[28px] text-[#777]">
                Channels, calls, AI, search, and more &mdash; all in one place.
                Built for teams that move fast and communicate clearly.
              </p>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="border-t border-white/[0.06] bg-[#0d0d0d] py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-4 text-center text-[28px] font-bold tracking-[-0.02em] text-white">
              Built for how teams actually work
            </h2>
            <p className="mx-auto mb-16 max-w-lg text-center text-[15px] leading-[24px] text-[#777]">
              Every feature is designed to reduce noise, save time, and keep
              your team focused on what matters.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {features.map((feat) => (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                    <feat.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mb-2 text-[15px] font-semibold text-white">
                    {feat.title}
                  </h3>
                  <p className="text-[14px] leading-[22px] text-[#777]">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="border-t border-white/[0.06] py-24 lg:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-4 text-center text-[28px] font-bold tracking-[-0.02em] text-white">
              How we compare
            </h2>
            <p className="mx-auto mb-12 max-w-md text-center text-[15px] leading-[24px] text-[#777]">
              See how Chatterbox stacks up against the tools you already know.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="pb-4 pr-4 text-left text-[13px] font-semibold text-[#555]">
                      Feature
                    </th>
                    <th className="pb-4 px-4 text-center text-[13px] font-semibold text-white">
                      Chatterbox
                    </th>
                    <th className="pb-4 px-4 text-center text-[13px] font-semibold text-[#555]">
                      Slack
                    </th>
                    <th className="pb-4 pl-4 text-center text-[13px] font-semibold text-[#555]">
                      Teams
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-white/[0.04]"
                    >
                      <td className="py-3.5 pr-4 text-[13px] text-[#999]">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex justify-center">
                          <CellValue value={row.chatterbox} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex justify-center">
                          <CellValue value={row.slack} />
                        </div>
                      </td>
                      <td className="py-3.5 pl-4">
                        <div className="flex justify-center">
                          <CellValue value={row.teams} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/[0.06] py-20">
          <div className="mx-auto max-w-xl px-6 text-center">
            <h2 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-white">
              Ready to switch?
            </h2>
            <p className="mb-8 text-[15px] leading-[24px] text-[#777]">
              Join 50,000+ teams who communicate faster with less noise. Free to
              start, no credit card required.
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
                href="/pricing"
                className="inline-flex h-11 items-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
              >
                See pricing
              </Link>
            </div>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}
