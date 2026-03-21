import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon as ArrowRight } from "@primer/octicons-react";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "See what's new in Chatterbox. Product updates, improvements, and bug fixes.",
};

const GITHUB_REPO = "SemlohSystemsCorp/chatterbox-main";

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
}

async function fetchReleases(): Promise<GitHubRelease[]> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=20`,
      { headers, next: { revalidate: 300 } }
    );

    if (!res.ok) return [];
    const data: GitHubRelease[] = await res.json();
    return data.filter((r) => !r.draft);
  } catch {
    return [];
  }
}

type BadgeType = "New" | "Improved" | "Fixed";

const badgeColors: Record<BadgeType, string> = {
  New: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Improved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Fixed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

interface ParsedLine {
  badge: BadgeType;
  text: string;
}

function parseReleaseBody(body: string): ParsedLine[] {
  const lines: ParsedLine[] = [];

  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    // Strip leading list markers like "- ", "* ", "• "
    const cleaned = line.replace(/^[-*•]\s*/, "");
    if (!cleaned) continue;

    // Detect badge from common patterns
    const lower = cleaned.toLowerCase();
    let badge: BadgeType = "Improved";

    if (
      lower.startsWith("feat") ||
      lower.startsWith("add") ||
      lower.startsWith("new") ||
      lower.includes("introduce") ||
      lower.startsWith("implement")
    ) {
      badge = "New";
    } else if (
      lower.startsWith("fix") ||
      lower.startsWith("bug") ||
      lower.startsWith("patch") ||
      lower.startsWith("hotfix") ||
      lower.startsWith("resolve")
    ) {
      badge = "Fixed";
    }

    // Strip conventional commit prefix like "feat: ", "fix(scope): "
    const withoutPrefix = cleaned.replace(
      /^(feat|fix|chore|refactor|perf|style|test|docs|patch|ci|build)(\([^)]*\))?:\s*/i,
      ""
    );

    // Capitalize first letter
    const text =
      withoutPrefix.charAt(0).toUpperCase() + withoutPrefix.slice(1);

    // Skip markdown headings, blank-ish lines, and "full changelog" links
    if (text.startsWith("#") || text.startsWith("**Full Changelog") || text.length < 3) continue;

    lines.push({ badge, text });
  }

  return lines;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Fallback hardcoded releases in case GitHub API is unavailable
const fallbackReleases = [
  {
    date: "March 2026",
    tag: null as string | null,
    url: null as string | null,
    changes: [
      { badge: "Improved" as BadgeType, text: "AI Summaries v2 with context awareness" },
      { badge: "New" as BadgeType, text: "Drag-to-reorder poll options" },
      { badge: "New" as BadgeType, text: "Mobile hamburger navigation" },
      { badge: "Improved" as BadgeType, text: "Theme preview in settings" },
    ],
  },
  {
    date: "February 2026",
    tag: null as string | null,
    url: null as string | null,
    changes: [
      { badge: "New" as BadgeType, text: "Enterprise SSO (SAML) support" },
      { badge: "Improved" as BadgeType, text: "Audit log filtering and CSV export" },
      { badge: "New" as BadgeType, text: "Device testing for mic/camera" },
      { badge: "New" as BadgeType, text: "GDPR data export" },
    ],
  },
  {
    date: "January 2026",
    tag: null as string | null,
    url: null as string | null,
    changes: [
      { badge: "New" as BadgeType, text: "Joint channels between Boxes" },
      { badge: "New" as BadgeType, text: "Advanced search filters (from:, in:, has:, before:)" },
      { badge: "Improved" as BadgeType, text: "Thread panel sidebar view" },
    ],
  },
];

export default async function ChangelogPage() {
  const ghReleases = await fetchReleases();

  const releases =
    ghReleases.length > 0
      ? ghReleases.map((r) => ({
          date: formatDate(r.published_at),
          tag: r.tag_name,
          url: r.html_url,
          title: r.name || r.tag_name,
          changes: r.body ? parseReleaseBody(r.body) : [],
          prerelease: r.prerelease,
        }))
      : fallbackReleases.map((r) => ({
          ...r,
          title: r.date,
          prerelease: false,
        }));

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
                Changelog
              </p>
              <h1 className="mb-6 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[48px]">
                What&apos;s new
              </h1>
              <p className="text-[17px] leading-[28px] text-[#777]">
                {ghReleases.length > 0
                  ? "Release notes pulled directly from our GitHub repository."
                  : "Product updates, improvements, and bug fixes shipped by our team."}
              </p>
              {ghReleases.length > 0 && (
                <a
                  href={`https://github.com/${GITHUB_REPO}/releases`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-[#555] transition-colors hover:text-white"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  View on GitHub
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="pb-24 lg:pb-28">
          <div className="mx-auto max-w-3xl px-6">
            <div className="relative">
              {/* Timeline bar */}
              <div className="absolute left-0 top-0 hidden h-full w-px bg-white/[0.06] md:block" />

              <div className="space-y-8">
                {releases.map((release) => (
                  <div key={release.tag || release.date} className="relative md:pl-10">
                    {/* Timeline dot */}
                    <div className="absolute left-[-4px] top-1 hidden h-2 w-2 rounded-full bg-[#444] md:block" />

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <h2 className="text-[18px] font-bold text-white">
                          {release.title}
                        </h2>
                        {release.tag && (
                          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-mono text-[#888]">
                            {release.tag}
                          </span>
                        )}
                        {release.prerelease && (
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                            Pre-release
                          </span>
                        )}
                      </div>
                      <p className="mb-6 text-[12px] text-[#555]">
                        {release.date}
                      </p>

                      {release.changes.length > 0 ? (
                        <ul className="space-y-3">
                          {release.changes.map((change, j) => (
                            <li key={j} className="flex items-start gap-3">
                              <span
                                className={`mt-0.5 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeColors[change.badge]}`}
                              >
                                {change.badge}
                              </span>
                              <span className="text-[14px] leading-[22px] text-[#999]">
                                {change.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[13px] text-[#666]">
                          See the full release notes on GitHub.
                        </p>
                      )}

                      {release.url && (
                        <a
                          href={release.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-[#555] transition-colors hover:text-white"
                        >
                          View full release notes
                          <ArrowRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {ghReleases.length > 0 && (
              <div className="mt-8 text-center">
                <a
                  href={`https://github.com/${GITHUB_REPO}/releases`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-[13px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
                >
                  View all releases on GitHub
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/[0.06] py-20">
          <div className="mx-auto max-w-xl px-6 text-center">
            <h2 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-white">
              Ready to get started?
            </h2>
            <p className="mb-8 text-[15px] leading-[24px] text-[#777]">
              Try Chatterbox free and see these features in action.
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
