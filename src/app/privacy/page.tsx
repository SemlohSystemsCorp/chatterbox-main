import type { Metadata } from "next";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Chatterbox collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        <article className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
            Legal
          </p>
          <h1 className="mb-2 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[44px]">
            Privacy Policy
          </h1>
          <p className="mb-12 text-[14px] text-[#555]">
            Last updated: March 1, 2026
          </p>

          <div className="space-y-10 text-[14px] leading-[24px] text-[#999]">
            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                1. Overview
              </h2>
              <p>
                Chatterbox, Inc. (&quot;Chatterbox,&quot; &quot;we,&quot;
                &quot;us&quot;) is committed to protecting your privacy. This
                Privacy Policy explains how we collect, use, store, and share
                information when you use our team communication platform and
                related services (the &quot;Service&quot;).
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                2. Information We Collect
              </h2>
              <h3 className="mb-2 mt-4 text-[14px] font-semibold text-[#ccc]">
                Information you provide
              </h3>
              <ul className="list-inside list-disc space-y-1 text-[#888]">
                <li>
                  Account information: name, email address, profile photo
                </li>
                <li>
                  Messages, files, and other content you share through the
                  Service
                </li>
                <li>
                  Payment information (processed by our payment provider; we do
                  not store card numbers)
                </li>
                <li>
                  Communications with our support team
                </li>
              </ul>

              <h3 className="mb-2 mt-4 text-[14px] font-semibold text-[#ccc]">
                Information collected automatically
              </h3>
              <ul className="list-inside list-disc space-y-1 text-[#888]">
                <li>
                  Device information: browser type, operating system, device
                  identifiers
                </li>
                <li>
                  Usage data: features used, timestamps, interaction patterns
                </li>
                <li>
                  Log data: IP addresses, access times, error logs
                </li>
                <li>
                  Cookies and similar technologies (see Section 7)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                3. How We Use Your Information
              </h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-inside list-disc space-y-1 text-[#888]">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and security alerts</li>
                <li>
                  Respond to support requests and communicate with you
                </li>
                <li>
                  Monitor and analyze usage trends to improve the experience
                </li>
                <li>
                  Detect, investigate, and prevent fraud or abuse
                </li>
                <li>
                  Power AI features like message summaries and search (processed
                  in real-time, not stored separately)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                4. How We Share Your Information
              </h2>
              <p className="mb-3">
                We do not sell your personal information. We share information
                only in these circumstances:
              </p>
              <ul className="list-inside list-disc space-y-1 text-[#888]">
                <li>
                  <strong className="text-[#ccc]">Within your workspace:</strong>{" "}
                  Messages and content are visible to members of your Box based
                  on channel permissions
                </li>
                <li>
                  <strong className="text-[#ccc]">Service providers:</strong>{" "}
                  We work with third-party providers for hosting, analytics,
                  payment processing, and support. They are contractually
                  obligated to protect your data
                </li>
                <li>
                  <strong className="text-[#ccc]">Legal requirements:</strong>{" "}
                  We may disclose information if required by law, subpoena, or
                  government request
                </li>
                <li>
                  <strong className="text-[#ccc]">Business transfers:</strong>{" "}
                  In connection with a merger, acquisition, or sale of assets,
                  your information may be transferred
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                5. Data Security
              </h2>
              <p>
                We implement industry-standard security measures to protect your
                data. All data is encrypted in transit (TLS 1.3) and at rest
                (AES-256). We conduct regular security audits, maintain SOC 2
                Type II compliance, and operate a responsible disclosure program.
                Despite these measures, no method of electronic transmission or
                storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                6. Data Retention
              </h2>
              <p>
                We retain your data for as long as your account is active or as
                needed to provide the Service. Message history retention depends
                on your plan. When you delete your account, we will delete or
                anonymize your personal data within 30 days, except where we are
                required to retain it for legal or compliance purposes.
                Enterprise customers can configure custom retention policies.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                7. Cookies
              </h2>
              <p>
                We use essential cookies to authenticate users and maintain
                session state. We use analytics cookies to understand how the
                Service is used. You can control cookie preferences through your
                browser settings. Disabling essential cookies may prevent you
                from using the Service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                8. Your Rights
              </h2>
              <p className="mb-3">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-inside list-disc space-y-1 text-[#888]">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
                <li>Object to or restrict certain processing</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us at{" "}
                <a
                  href="mailto:privacy@chatterbox.io"
                  className="text-white underline decoration-[#555] underline-offset-2 hover:decoration-white"
                >
                  privacy@chatterbox.io
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                9. International Data Transfers
              </h2>
              <p>
                Your data may be processed in the United States and other
                countries where our service providers operate. We use Standard
                Contractual Clauses and other approved mechanisms to ensure
                adequate protection for international transfers in compliance
                with GDPR and other applicable regulations.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                10. Children&apos;s Privacy
              </h2>
              <p>
                The Service is not intended for children under 16. We do not
                knowingly collect personal information from children under 16.
                If you believe we have collected such information, please
                contact us and we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                11. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of material changes via email or through the Service
                at least 30 days before they take effect. The &quot;Last
                updated&quot; date at the top indicates the most recent revision.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                12. Contact Us
              </h2>
              <p>
                If you have questions or concerns about this Privacy Policy,
                contact us at{" "}
                <a
                  href="mailto:privacy@chatterbox.io"
                  className="text-white underline decoration-[#555] underline-offset-2 hover:decoration-white"
                >
                  privacy@chatterbox.io
                </a>{" "}
                or write to:
              </p>
              <p className="mt-3 text-[#888]">
                Chatterbox, Inc.
                <br />
                548 Market Street, Suite 35
                <br />
                San Francisco, CA 94104
                <br />
                United States
              </p>
            </section>
          </div>
        </article>
      </div>

      <MarketingFooter />
    </div>
  );
}
