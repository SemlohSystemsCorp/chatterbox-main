import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon as ArrowRight,
  CheckIcon as Check,
  XIcon as X,
} from "@primer/octicons-react";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";

export const metadata: Metadata = {
  title: "Why Chatterbox? — Compare to Slack, Email & Teams",
  description:
    "See how Chatterbox stacks up against Slack, Microsoft Teams, and email. Faster, quieter, smarter team communication.",
};

const competitors = [
  {
    name: "Email",
    pain: "Slow, noisy, and impossible to keep organized",
    problems: [
      "Threads get buried in overflowing inboxes",
      "No way to know if someone read your message",
      "Searching for a conversation from last month? Good luck",
      "CCs and reply-alls create noise for everyone",
      'Attachments get lost in "see attached" chains',
    ],
  },
  {
    name: "Slack",
    pain: "Designed for chat, not for focused work",
    problems: [
      "Constant notifications destroy deep focus",
      "Important messages disappear in noisy channels",
      "Thread model is confusing — messages get lost",
      "Search returns everything except what you need",
      "Gets expensive fast with per-user pricing and add-ons",
    ],
  },
  {
    name: "Microsoft Teams",
    pain: "Bloated, slow, and built by committee",
    problems: [
      "UI is cluttered and overwhelming for new users",
      "Performance issues — slow to load, slow to search",
      "File sharing is tangled with SharePoint complexity",
      "Notification settings are buried and confusing",
      "Feels like it was designed for IT admins, not users",
    ],
  },
];

const advantages = [
  {
    title: "AI-powered catch-up",
    description:
      "Missed a day? Sherlock, our AI assistant, summarizes everything you missed in seconds. No more scrolling through hundreds of messages.",
    vs: "Slack and Teams make you read every message. Email gives you an unread count and a prayer.",
  },
  {
    title: "Notifications that respect your focus",
    description:
      "Smart notification routing filters noise by default. Get pinged for what matters, digest the rest on your schedule.",
    vs: "Slack's notification settings are a maze. Teams sends you notifications for notifications. Email is a lost cause.",
  },
  {
    title: "Search that actually works",
    description:
      "Find any message, file, or conversation in milliseconds. Filters by person, channel, date, and content type — no advanced syntax required.",
    vs: "Slack's search is limited on free plans and unreliable on paid. Teams search is notoriously slow. Email search varies wildly by provider.",
  },
  {
    title: "Organized by default",
    description:
      "Boxes keep separate teams or projects completely isolated. Channels, DMs, and threads all have clear, intuitive hierarchy.",
    vs: "Slack workspaces are expensive to separate. Teams uses a confusing Teams-within-Teams structure. Email has... folders?",
  },
  {
    title: "Voice & video built in",
    description:
      "Start a call from any conversation with one click. Screen sharing, reactions, and recording included — no third-party app needed.",
    vs: "Slack charges extra for Huddles features. Teams calls work but the UI is cluttered. Email doesn't do calls (obviously).",
  },
  {
    title: "Fast. Really fast.",
    description:
      "Built on modern infrastructure with real-time sync. Messages appear instantly. The app loads in under a second. No spinners, no lag.",
    vs: "Slack has gotten slower over the years. Teams is famously sluggish. Email latency depends on your provider and the phase of the moon.",
  },
];

const comparisonTable = [
  {
    feature: "Real-time messaging",
    chatterbox: true,
    slack: true,
    teams: true,
    email: false,
  },
  {
    feature: "AI message summaries",
    chatterbox: true,
    slack: false,
    teams: false,
    email: false,
  },
  {
    feature: "Smart notification routing",
    chatterbox: true,
    slack: false,
    teams: false,
    email: false,
  },
  {
    feature: "Instant search",
    chatterbox: true,
    slack: "Paid",
    teams: "Slow",
    email: "Varies",
  },
  {
    feature: "Voice & video calls",
    chatterbox: true,
    slack: true,
    teams: true,
    email: false,
  },
  {
    feature: "Screen sharing",
    chatterbox: true,
    slack: true,
    teams: true,
    email: false,
  },
  {
    feature: "Pinned messages",
    chatterbox: true,
    slack: true,
    teams: false,
    email: false,
  },
  {
    feature: "Message scheduling",
    chatterbox: true,
    slack: true,
    teams: false,
    email: true,
  },
  {
    feature: "GIF & emoji reactions",
    chatterbox: true,
    slack: true,
    teams: true,
    email: false,
  },
  {
    feature: "Polls",
    chatterbox: true,
    slack: "Add-on",
    teams: "Add-on",
    email: false,
  },
  {
    feature: "Link previews",
    chatterbox: true,
    slack: true,
    teams: true,
    email: false,
  },
  {
    feature: "Message translation",
    chatterbox: true,
    slack: false,
    teams: true,
    email: false,
  },
  {
    feature: "End-to-end encryption",
    chatterbox: true,
    slack: false,
    teams: false,
    email: "Varies",
  },
  {
    feature: "Free plan with real features",
    chatterbox: true,
    slack: "Limited",
    teams: "Limited",
    email: true,
  },
  {
    feature: "Fast load time (<1s)",
    chatterbox: true,
    slack: false,
    teams: false,
    email: "Varies",
  },
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

export default function WhyChatterboxPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
                Why Chatterbox?
              </p>
              <h1 className="mb-6 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[48px]">
                Your current tools are slowing
                <br className="hidden lg:block" /> your team down
              </h1>
              <p className="mx-auto max-w-xl text-[17px] leading-[28px] text-[#777]">
                Email is too slow. Slack is too noisy. Teams is too bloated.
                Chatterbox is the team communication tool that gets out of your
                way and lets you do your best work.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/signup"
                  className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
                >
                  Try Chatterbox free
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
          </div>
        </section>

        {/* The problems with current tools */}
        <section className="border-t border-white/[0.06] py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-4 text-center text-[28px] font-bold tracking-[-0.02em] text-white">
              What&apos;s wrong with the status quo
            </h2>
            <p className="mx-auto mb-16 max-w-lg text-center text-[15px] leading-[24px] text-[#777]">
              We&apos;ve used every team communication tool out there. Here&apos;s
              what we found.
            </p>
            <div className="grid gap-4 lg:grid-cols-3">
              {competitors.map((comp) => (
                <div
                  key={comp.name}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
                >
                  <h3 className="mb-1 text-[18px] font-bold text-white">
                    {comp.name}
                  </h3>
                  <p className="mb-6 text-[13px] text-[#555]">{comp.pain}</p>
                  <ul className="space-y-3">
                    {comp.problems.map((problem) => (
                      <li
                        key={problem}
                        className="flex items-start gap-2.5 text-[13px] leading-[20px] text-[#888]"
                      >
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400/60" />
                        {problem}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How Chatterbox is different */}
        <section className="border-t border-white/[0.06] bg-[#0d0d0d] py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-4 text-center text-[28px] font-bold tracking-[-0.02em] text-white">
              How Chatterbox is different
            </h2>
            <p className="mx-auto mb-16 max-w-lg text-center text-[15px] leading-[24px] text-[#777]">
              We built Chatterbox to fix the problems we experienced every day.
              Here&apos;s what that looks like.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {advantages.map((adv) => (
                <div
                  key={adv.title}
                  className="flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
                >
                  <h3 className="mb-2 text-[15px] font-semibold text-white">
                    {adv.title}
                  </h3>
                  <p className="mb-4 flex-1 text-[13px] leading-[22px] text-[#888]">
                    {adv.description}
                  </p>
                  <div className="rounded-lg bg-white/[0.03] px-4 py-3">
                    <p className="text-[12px] leading-[18px] text-[#555]">
                      <span className="font-semibold text-[#666]">
                        vs. the rest:
                      </span>{" "}
                      {adv.vs}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature comparison table */}
        <section className="border-t border-white/[0.06] py-24 lg:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-4 text-center text-[28px] font-bold tracking-[-0.02em] text-white">
              Feature-by-feature comparison
            </h2>
            <p className="mx-auto mb-12 max-w-md text-center text-[15px] leading-[24px] text-[#777]">
              See exactly where Chatterbox leads — and where others fall short.
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
                    <th className="pb-4 px-4 text-center text-[13px] font-semibold text-[#555]">
                      Teams
                    </th>
                    <th className="pb-4 pl-4 text-center text-[13px] font-semibold text-[#555]">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonTable.map((row) => (
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
                      <td className="py-3.5 px-4">
                        <div className="flex justify-center">
                          <CellValue value={row.teams} />
                        </div>
                      </td>
                      <td className="py-3.5 pl-4">
                        <div className="flex justify-center">
                          <CellValue value={row.email} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Quotes / Social proof */}
        <section className="border-t border-white/[0.06] bg-[#0d0d0d] py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-center text-[28px] font-bold tracking-[-0.02em] text-white">
              What teams say after switching
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  quote:
                    "We switched from Slack and our unread count dropped by 80%. The AI catch-up alone saves me 30 minutes every morning.",
                  name: "Sarah K.",
                  role: "Engineering Manager",
                  from: "Switched from Slack",
                },
                {
                  quote:
                    "Our team was drowning in email threads. Chatterbox replaced email for internal comms entirely — decisions happen in minutes, not days.",
                  name: "David R.",
                  role: "Head of Product",
                  from: "Switched from Email",
                },
                {
                  quote:
                    "Teams was so slow our engineers started using Discord instead. Chatterbox loads instantly and has everything we need in one place.",
                  name: "Anika P.",
                  role: "CTO",
                  from: "Switched from Microsoft Teams",
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
                >
                  <p className="mb-6 text-[14px] leading-[24px] text-[#999]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <div className="text-[13px] font-semibold text-white">
                      {t.name}
                    </div>
                    <div className="text-[12px] text-[#555]">{t.role}</div>
                    <div className="mt-1 text-[11px] text-[#444]">
                      {t.from}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/[0.06] py-20">
          <div className="mx-auto max-w-xl px-6 text-center">
            <h2 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-white">
              Ready to ditch the noise?
            </h2>
            <p className="mb-8 text-[15px] leading-[24px] text-[#777]">
              Join 50,000+ teams who switched to Chatterbox. Free to start, no
              credit card required.
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
