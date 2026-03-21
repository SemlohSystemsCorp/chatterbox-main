import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldIcon as Shield,
  LockIcon as Lock,
  GlobeIcon as Globe,
  ServerIcon as Server,
  CheckCircleFillIcon as CheckCircle,
  ArrowRightIcon as ArrowRight,
  ShieldCheckIcon as ShieldCheck,
  DatabaseIcon as Database,
  EyeIcon as Eye,
  BugIcon as Bug,
  ClockIcon as Clock,
} from "@primer/octicons-react";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Enterprise-grade security for your team communications. End-to-end encryption, SOC 2 certified, GDPR compliant, and 99.99% uptime SLA.",
};

const principles = [
  {
    icon: Lock,
    title: "Encrypted at rest & in transit",
    description:
      "All data is encrypted with AES-256 at rest and TLS 1.3 in transit. Your messages, files, and calls are protected at every layer of our stack.",
  },
  {
    icon: ShieldCheck,
    title: "SOC 2 Type II certified",
    description:
      "We undergo annual SOC 2 Type II audits by independent third parties, verifying our security controls meet the highest industry standards.",
  },
  {
    icon: Globe,
    title: "GDPR & CCPA compliant",
    description:
      "Full compliance with global privacy regulations. We provide data processing agreements, privacy impact assessments, and honor all data subject requests.",
  },
  {
    icon: Clock,
    title: "99.99% uptime SLA",
    description:
      "Enterprise-grade reliability backed by a contractual SLA. Real-time status monitoring and transparent incident communication.",
  },
];

const infrastructure = [
  {
    title: "Multi-region redundancy",
    description:
      "Data hosted on AWS with automatic failover across multiple availability zones. Your data is replicated in real time to ensure zero downtime.",
  },
  {
    title: "Third-party penetration testing",
    description:
      "We engage independent security firms to conduct regular penetration tests. Results are reviewed by our security team and addressed immediately.",
  },
  {
    title: "Automated vulnerability scanning",
    description:
      "Continuous automated scanning of our codebase, dependencies, and infrastructure. Critical vulnerabilities are patched within 24 hours.",
  },
  {
    title: "1-hour incident response",
    description:
      "Our security team operates a 24/7 on-call rotation with a guaranteed 1-hour response time for security incidents. Every incident gets a public post-mortem.",
  },
];

const dataOwnership = [
  {
    icon: Database,
    title: "Export anytime",
    description:
      "Your data is yours. Export all messages, files, and metadata in standard formats at any time with a single click.",
  },
  {
    icon: Clock,
    title: "Configurable retention",
    description:
      "Set custom retention policies per channel or organization-wide. Automatically purge data after 30, 90, or 365 days.",
  },
  {
    icon: Eye,
    title: "Right to deletion",
    description:
      "Request complete deletion of your data at any time. We permanently remove all records within 30 days of your request.",
  },
  {
    icon: Shield,
    title: "No data sold to third parties",
    description:
      "We never sell, share, or monetize your data. Your conversations are used only to provide the Chatterbox service, nothing else.",
  },
];

const complianceBadges = [
  { name: "SOC 2", label: "Type II" },
  { name: "GDPR", label: "Compliant" },
  { name: "CCPA", label: "Compliant" },
  { name: "HIPAA", label: "Enterprise" },
  { name: "ISO 27001", label: "Certified" },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
                Security
              </p>
              <h1 className="mb-6 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[48px]">
                Security you can trust
              </h1>
              <p className="text-[17px] leading-[28px] text-[#777]">
                Enterprise-grade encryption, rigorous compliance standards, and
                transparent security practices. Your team&apos;s conversations
                deserve the highest level of protection.
              </p>
            </div>
          </div>
        </section>

        {/* Key principles */}
        <section className="border-t border-white/[0.06] bg-[#0d0d0d] py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-[28px] font-bold tracking-[-0.02em] text-white">
              Security principles
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {principles.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                    <p.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mb-2 text-[15px] font-semibold text-white">
                    {p.title}
                  </h3>
                  <p className="text-[14px] leading-[22px] text-[#777]">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Infrastructure */}
        <section className="py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-16 lg:flex-row lg:gap-20">
              <div className="lg:w-80">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                  <Server className="h-5 w-5 text-white" />
                </div>
                <h2 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-white">
                  Infrastructure built for security
                </h2>
                <p className="text-[15px] leading-[26px] text-[#777]">
                  Every layer of our infrastructure is designed with security as
                  the default. From network isolation to encrypted backups,
                  we leave nothing to chance.
                </p>
              </div>
              <div className="flex-1 space-y-4">
                {infrastructure.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                  >
                    <h3 className="mb-2 text-[14px] font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="text-[13px] leading-[22px] text-[#777]">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Data ownership */}
        <section className="border-t border-white/[0.06] bg-[#0d0d0d] py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-white">
                Your data, your rules
              </h2>
              <p className="text-[15px] leading-[26px] text-[#777]">
                We believe your data belongs to you. Full stop. We give you
                complete control over how it&apos;s stored, retained, and deleted.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {dataOwnership.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mb-2 text-[14px] font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-[13px] leading-[20px] text-[#777]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance badges */}
        <section className="border-t border-white/[0.06] py-16">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-8 text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
              Compliance & certifications
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {complianceBadges.map((badge) => (
                <div
                  key={badge.name}
                  className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-6"
                >
                  <CheckCircle className="mb-3 h-5 w-5 text-[#22c55e]" />
                  <div className="text-[15px] font-bold text-white">
                    {badge.name}
                  </div>
                  <div className="mt-1 text-[12px] text-[#555]">
                    {badge.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bug bounty */}
        <section className="py-24 lg:py-28">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/[0.06] bg-white/[0.02] px-8 py-7 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
              <Bug className="h-5 w-5 text-white" />
            </div>
            <h3 className="mb-2 text-[15px] font-semibold text-white">
              Responsible disclosure program
            </h3>
            <p className="mb-5 text-[13px] leading-[22px] text-[#777]">
              We run an active bug bounty program and welcome responsible
              security researchers. If you discover a vulnerability, we want to
              hear from you. Rewards range from $100 to $10,000 depending on
              severity.
            </p>
            <a
              href="mailto:security@getchatterbox.app"
              className="inline-flex h-9 items-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-5 text-[13px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
            >
              Report a vulnerability
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/[0.06] py-20">
          <div className="mx-auto max-w-xl px-6 text-center">
            <h2 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-white">
              Questions about security?
            </h2>
            <p className="mb-8 text-[15px] leading-[24px] text-[#777]">
              Our security team is happy to answer questions, provide
              documentation, or walk through our practices with your team.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="mailto:security@getchatterbox.app"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
              >
                Contact security team
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <Link
                href="#"
                className="inline-flex h-11 items-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
              >
                Download security whitepaper
              </Link>
            </div>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}
