import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon as ArrowRight,
  MailIcon as Mail,
  LocationIcon as MapPin,
} from "@primer/octicons-react";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Chatterbox team. Sales inquiries, support, partnerships, and more.",
};

const contactCards = [
  {
    title: "Sales",
    description: "Talk to our sales team about Enterprise plans",
    email: "sales@getchatterbox.app",
  },
  {
    title: "Support",
    description: "Need help? Our support team is here",
    email: "support@getchatterbox.app",
  },
  {
    title: "Partnerships",
    description: "Interested in partnering with us?",
    email: "partnerships@getchatterbox.app",
  },
];

const offices = [
  {
    city: "San Francisco",
    label: "HQ",
    address: "548 Market St, Suite 600",
    region: "San Francisco, CA 94104",
  },
  {
    city: "London",
    address: "10 Finsbury Square",
    region: "EC2A 1AF, United Kingdom",
  },
  {
    city: "Tokyo",
    address: "Shibuya Hikarie, 2-21-1",
    region: "Shibuya, Tokyo 150-8510",
  },
];

const faqs = [
  {
    q: "How fast is your support response time?",
    a: "Under 4 hours for Pro plans, under 1 hour for Enterprise. Free plan support is handled via community forums and email within 24 hours.",
  },
  {
    q: "Do you offer demos?",
    a: "Yes. Book a demo with our sales team and we\u2019ll walk you through Chatterbox tailored to your team\u2019s workflow. Email sales@getchatterbox.app to schedule.",
  },
  {
    q: "Can I request a feature?",
    a: "Absolutely. We love hearing from users. Send feature requests to feedback@getchatterbox.app and our product team reviews every submission.",
  },
  {
    q: "What are your support hours?",
    a: "Our support team is available Monday through Friday, 9 AM\u20136 PM in each office timezone. Enterprise customers get 24/7 coverage.",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
                Contact
              </p>
              <h1 className="mb-6 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[48px]">
                Get in touch
              </h1>
              <p className="text-[17px] leading-[28px] text-[#777]">
                Have a question, need help, or want to learn more about
                Chatterbox? We&apos;d love to hear from you.
              </p>
            </div>
          </div>
        </section>

        {/* Contact cards */}
        <section className="pb-24">
          <div className="mx-auto grid max-w-5xl gap-4 px-6 md:grid-cols-3">
            {contactCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                  <Mail className="h-4 w-4 text-[#999]" />
                </div>
                <h3 className="mb-2 text-[15px] font-semibold text-white">
                  {card.title}
                </h3>
                <p className="mb-4 text-[13px] leading-[20px] text-[#777]">
                  {card.description}
                </p>
                <a
                  href={`mailto:${card.email}`}
                  className="text-[13px] font-medium text-white transition-colors hover:text-[#ccc]"
                >
                  {card.email}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Office locations */}
        <section className="border-t border-white/[0.06] bg-[#0d0d0d] py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-[28px] font-bold tracking-[-0.02em] text-white">
              Our offices
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {offices.map((office) => (
                <div
                  key={office.city}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                    <MapPin className="h-4 w-4 text-[#999]" />
                  </div>
                  <h3 className="mb-1 text-[15px] font-semibold text-white">
                    {office.city}
                    {office.label && (
                      <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-[#777]">
                        {office.label}
                      </span>
                    )}
                  </h3>
                  <p className="text-[13px] leading-[22px] text-[#777]">
                    {office.address}
                  </p>
                  <p className="text-[13px] leading-[22px] text-[#555]">
                    {office.region}
                  </p>
                </div>
              ))}
            </div>
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
              Free to start, no credit card required. Set up your team in
              minutes.
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
