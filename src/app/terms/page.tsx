import type { Metadata } from "next";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using the Chatterbox platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        <article className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
            Legal
          </p>
          <h1 className="mb-2 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[44px]">
            Terms of Service
          </h1>
          <p className="mb-12 text-[14px] text-[#555]">
            Last updated: March 1, 2026
          </p>

          <div className="space-y-10 text-[14px] leading-[24px] text-[#999]">
            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using Chatterbox (&quot;the Service&quot;), you
                agree to be bound by these Terms of Service (&quot;Terms&quot;).
                If you are using the Service on behalf of an organization, you
                represent that you have the authority to bind that organization
                to these Terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                2. Description of Service
              </h2>
              <p>
                Chatterbox is a team communication platform that provides
                real-time messaging, voice and video calling, file sharing, and
                related collaboration features. We may update, modify, or
                discontinue features at any time with reasonable notice.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                3. Account Registration
              </h2>
              <p className="mb-3">
                To use the Service, you must create an account and provide
                accurate, complete information. You are responsible for:
              </p>
              <ul className="list-inside list-disc space-y-1 text-[#888]">
                <li>
                  Maintaining the confidentiality of your account credentials
                </li>
                <li>
                  All activities that occur under your account
                </li>
                <li>
                  Notifying us immediately of any unauthorized use
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                4. Acceptable Use
              </h2>
              <p className="mb-3">You agree not to use the Service to:</p>
              <ul className="list-inside list-disc space-y-1 text-[#888]">
                <li>
                  Violate any applicable law, regulation, or third-party rights
                </li>
                <li>
                  Transmit malware, viruses, or other harmful code
                </li>
                <li>
                  Send spam, unsolicited messages, or phishing attempts
                </li>
                <li>
                  Attempt to gain unauthorized access to other accounts or
                  systems
                </li>
                <li>
                  Interfere with the performance or availability of the Service
                </li>
                <li>
                  Use the Service for any illegal or unauthorized purpose
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                5. Your Content
              </h2>
              <p>
                You retain ownership of all content you submit through the
                Service (&quot;Your Content&quot;). By submitting content, you
                grant Chatterbox a limited, non-exclusive license to store,
                display, and transmit that content solely for the purpose of
                operating the Service. We do not claim ownership of Your Content
                and will not use it for any other purpose.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                6. Payment and Billing
              </h2>
              <p>
                Paid plans are billed in advance on a monthly or annual basis.
                All fees are non-refundable except as required by law. We may
                change pricing with 30 days&apos; notice. If you do not agree to
                a price change, you may cancel your subscription before it takes
                effect.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                7. Termination
              </h2>
              <p>
                You may cancel your account at any time. We may suspend or
                terminate your access if you violate these Terms or if required
                by law. Upon termination, your right to use the Service ceases
                immediately. We will make your data available for export for 30
                days following termination.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                8. Disclaimers
              </h2>
              <p>
                The Service is provided &quot;as is&quot; without warranties of
                any kind, either express or implied. We do not guarantee that
                the Service will be uninterrupted, secure, or error-free. To
                the maximum extent permitted by law, we disclaim all warranties
                including implied warranties of merchantability, fitness for a
                particular purpose, and non-infringement.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                9. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, Chatterbox shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages, or any loss of profits or revenues, whether
                incurred directly or indirectly. Our total liability for any
                claims under these Terms shall not exceed the amount you paid us
                in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                10. Changes to Terms
              </h2>
              <p>
                We may modify these Terms at any time. We will notify you of
                material changes via email or through the Service at least 30
                days before they take effect. Your continued use of the Service
                after changes take effect constitutes acceptance of the updated
                Terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-white">
                11. Contact
              </h2>
              <p>
                If you have questions about these Terms, contact us at{" "}
                <a
                  href="mailto:legal@chatterbox.io"
                  className="text-white underline decoration-[#555] underline-offset-2 hover:decoration-white"
                >
                  legal@chatterbox.io
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </div>

      <MarketingFooter />
    </div>
  );
}
