import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon as ArrowRight } from "@primer/octicons-react";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join the Chatterbox team and help build the future of team communication. View open roles in engineering, design, and go-to-market.",
};

const perks = [
  {
    title: "Remote-first",
    description:
      "Work from anywhere in the world. We're distributed across 12 countries and built around async collaboration from day one.",
  },
  {
    title: "Competitive comp",
    description:
      "Top-of-market salary, meaningful equity, and comprehensive benefits. We benchmark against the best and pay accordingly.",
  },
  {
    title: "Small team, big impact",
    description:
      "45 people, millions of users. Every person here directly shapes the product that thousands of teams rely on every day.",
  },
  {
    title: "Growth culture",
    description:
      "Conference budget, $1,500 learning stipend, and mentorship from experienced leaders. We invest in your career, not just your output.",
  },
];

const departments = [
  {
    name: "Engineering",
    roles: [
      {
        title: "Senior Backend Engineer",
        location: "Remote",
      },
      {
        title: "Senior Frontend Engineer",
        location: "Remote",
      },
      {
        title: "Staff Infrastructure Engineer",
        location: "SF / Remote",
      },
      {
        title: "Mobile Engineer — iOS",
        location: "Remote",
      },
    ],
  },
  {
    name: "Design",
    roles: [
      {
        title: "Senior Product Designer",
        location: "Remote",
      },
      {
        title: "Brand Designer",
        location: "SF",
      },
    ],
  },
  {
    name: "Go-to-Market",
    roles: [
      {
        title: "Account Executive, Enterprise",
        location: "NYC / SF",
      },
      {
        title: "Developer Advocate",
        location: "Remote",
      },
      {
        title: "Content Marketing Manager",
        location: "Remote",
      },
    ],
  },
];

const benefits = [
  {
    title: "Health, dental, vision",
    description: "Full coverage for you and your dependents from day one.",
  },
  {
    title: "Unlimited PTO",
    description:
      "Take the time you need. We track minimums, not maximums — 3 weeks is the floor.",
  },
  {
    title: "Home office stipend",
    description:
      "$2,000 to set up your workspace with the gear you need to do your best work.",
  },
  {
    title: "Learning & development",
    description:
      "$1,500/year for courses, books, conferences, or anything that helps you grow.",
  },
  {
    title: "Annual team offsite",
    description:
      "Once a year the whole company gets together for a week of collaboration and fun.",
  },
  {
    title: "Parental leave",
    description:
      "16 weeks of fully paid leave for all new parents, regardless of gender.",
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
                Careers
              </p>
              <h1 className="mb-6 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[48px]">
                Build the future of team communication
              </h1>
              <p className="text-[17px] leading-[28px] text-[#777]">
                Chatterbox is growing fast and we&apos;re looking for people who
                want to do the best work of their careers. Join a small,
                ambitious team building the platform that thousands of teams
                depend on every day.
              </p>
            </div>
          </div>
        </section>

        {/* Why join us */}
        <section className="border-t border-white/[0.06] bg-[#0d0d0d] py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-[28px] font-bold tracking-[-0.02em] text-white">
              Why join us
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {perks.map((perk) => (
                <div
                  key={perk.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
                >
                  <h3 className="mb-2 text-[15px] font-semibold text-white">
                    {perk.title}
                  </h3>
                  <p className="text-[14px] leading-[22px] text-[#777]">
                    {perk.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open positions */}
        <section className="py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-[28px] font-bold tracking-[-0.02em] text-white">
              Open positions
            </h2>
            <div className="space-y-10">
              {departments.map((dept) => (
                <div key={dept.name}>
                  <h3 className="mb-4 text-[14px] font-semibold text-[#555]">
                    {dept.name}
                  </h3>
                  <div className="space-y-2">
                    {dept.roles.map((role) => (
                      <a
                        key={role.title}
                        href={`mailto:careers@getchatterbox.app?subject=Application: ${role.title}`}
                        className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-semibold text-white">
                            {role.title}
                          </span>
                          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-[#888]">
                            {dept.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] text-[#555]">
                            {role.location}
                          </span>
                          <span className="text-[13px] font-medium text-[#777] transition-colors group-hover:text-white">
                            Apply
                            <ArrowRight className="ml-1 inline h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-t border-white/[0.06] bg-[#0d0d0d] py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-[28px] font-bold tracking-[-0.02em] text-white">
              Benefits
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                >
                  <h3 className="mb-2 text-[14px] font-semibold text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-[13px] leading-[20px] text-[#777]">
                    {benefit.description}
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
              Don&apos;t see your role?
            </h2>
            <p className="mb-8 text-[15px] leading-[24px] text-[#777]">
              We&apos;re always looking for exceptional people. If you think
              you&apos;d be a great fit for Chatterbox but don&apos;t see a
              matching role, we&apos;d still love to hear from you.
            </p>
            <a
              href="mailto:careers@getchatterbox.app"
              className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
            >
              Get in touch
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}
