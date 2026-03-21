import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon as Check, ArrowRightIcon as ArrowRight, DashIcon as Minus } from "@primer/octicons-react";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for teams of all sizes. Start free, upgrade when you're ready.",
};

const plans = [
  {
    name: "Free",
    description: "For small teams getting started",
    price: "$0",
    period: "/month",
    cta: "Get started",
    ctaHref: "/signup",
    highlight: false,
    features: [
      { name: "Up to 10 members", included: true },
      { name: "5 channels per Box", included: true },
      { name: "90 days message history", included: true },
      { name: "1:1 voice & video calls", included: true },
      { name: "5 GB file storage", included: true },
      { name: "Basic search", included: true },
      { name: "AI summaries", included: false },
      { name: "Joint channels", included: false },
      { name: "Advanced permissions", included: false },
      { name: "SSO / SAML", included: false },
      { name: "Audit logs", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    description: "For growing teams that need more",
    price: "$8",
    period: "/user/month",
    cta: "Start free trial",
    ctaHref: "/signup",
    highlight: true,
    badge: "Most popular",
    features: [
      { name: "Unlimited members", included: true },
      { name: "Unlimited channels", included: true },
      { name: "Unlimited message history", included: true },
      { name: "Group calls + screen sharing", included: true },
      { name: "50 GB file storage", included: true },
      { name: "Advanced search & filters", included: true },
      { name: "AI summaries & catch-up", included: true },
      { name: "Joint channels", included: true },
      { name: "Advanced permissions", included: true },
      { name: "SSO / SAML", included: false },
      { name: "Audit logs", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    name: "Enterprise",
    description: "For organizations at scale",
    price: "Custom",
    period: "",
    cta: "Contact sales",
    ctaHref: "#",
    highlight: false,
    features: [
      { name: "Unlimited members", included: true },
      { name: "Unlimited channels", included: true },
      { name: "Unlimited message history", included: true },
      { name: "Group calls + screen sharing", included: true },
      { name: "Unlimited file storage", included: true },
      { name: "Advanced search & filters", included: true },
      { name: "AI summaries & catch-up", included: true },
      { name: "Joint channels", included: true },
      { name: "Advanced permissions", included: true },
      { name: "SSO / SAML", included: true },
      { name: "Audit logs & compliance", included: true },
      { name: "Dedicated support & SLA", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade, downgrade, or cancel at any time. When you upgrade, you get immediate access to new features. When you downgrade, the change takes effect at the end of your billing cycle.",
  },
  {
    q: "What happens when my free trial ends?",
    a: "You'll be moved to the Free plan automatically. No charges, no surprises. All your messages and files stay exactly where they are.",
  },
  {
    q: "Do you offer discounts for nonprofits or education?",
    a: "Yes. We offer 50% off Pro for registered nonprofits, educational institutions, and open-source projects. Contact us to apply.",
  },
  {
    q: "How does billing work for teams?",
    a: "You're billed per active user per month. If someone is deactivated mid-cycle, you'll receive a prorated credit. Annual billing gives you 2 months free.",
  },
  {
    q: "Is there a limit on message history?",
    a: "On the Free plan, you can search and access the last 90 days. Pro and Enterprise have unlimited history — every message is searchable forever.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, and Enterprise customers can pay via invoice with net-30 terms.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        {/* Header */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
              Pricing
            </p>
            <h1 className="mb-4 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[48px]">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto max-w-md text-[17px] leading-[28px] text-[#777]">
              Start free. Upgrade when you need more. No hidden fees, no
              per-message charges.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-24">
          <div className="mx-auto grid max-w-5xl gap-4 px-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlight
                    ? "border-white/[0.15] bg-white/[0.04]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-0.5 text-[11px] font-semibold text-black">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="mb-1 text-[15px] font-semibold text-white">
                    {plan.name}
                  </h3>
                  <p className="text-[13px] text-[#555]">{plan.description}</p>
                </div>
                <div className="mb-8">
                  <span className="text-[40px] font-bold tracking-tight text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="ml-1 text-[14px] text-[#555]">
                      {plan.period}
                    </span>
                  )}
                  {plan.name === "Pro" && (
                    <p className="mt-2 text-[12px] leading-[18px] text-[#555]">
                      or $6.67/month billed annually (2 months free)
                    </p>
                  )}
                </div>
                <Link
                  href={plan.ctaHref}
                  className={`mb-8 flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-all ${
                    plan.highlight
                      ? "group bg-white text-black hover:bg-[#e8e8e8]"
                      : "border border-white/[0.08] bg-white/[0.03] text-[#ccc] hover:border-white/[0.12] hover:bg-white/[0.06]"
                  }`}
                >
                  {plan.cta}
                  {plan.highlight && (
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  )}
                </Link>
                <ul className="flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f.name}
                      className={`flex items-start gap-2.5 text-[13px] ${
                        f.included ? "text-[#999]" : "text-[#444]"
                      }`}
                    >
                      {f.included ? (
                        <Check
                          className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                            plan.highlight ? "text-white" : "text-[#555]"
                          }`}
                        />
                      ) : (
                        <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#333]" />
                      )}
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Nonprofit & Education */}
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/[0.06] bg-white/[0.02] px-8 py-7 text-center">
            <h3 className="mb-2 text-[15px] font-semibold text-white">
              Discounts for nonprofits. Free for education.
            </h3>
            <p className="mb-5 text-[13px] leading-[22px] text-[#777]">
              We offer 50% off Pro for registered nonprofits and open-source
              projects. Schools, universities, and educational institutions get
              Chatterbox Pro completely free.
            </p>
            <a
              href="mailto:sales@getchatterbox.app"
              className="inline-flex h-9 items-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-5 text-[13px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
            >
              Apply for a discount
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/[0.06] py-24 lg:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-12 text-center text-[28px] font-bold tracking-[-0.02em] text-white">
              Frequently asked questions
            </h2>
            <div className="space-y-1">
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-5"
                >
                  <h3 className="mb-2 text-[14px] font-semibold text-white">
                    {faq.q}
                  </h3>
                  <p className="text-[13px] leading-[22px] text-[#777]">
                    {faq.a}
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
              Ready to get started?
            </h2>
            <p className="mb-8 text-[15px] leading-[24px] text-[#777]">
              Free to start, no credit card required.
            </p>
            <Link
              href="/signup"
              className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-[#e8e8e8]"
            >
              Get started for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}
