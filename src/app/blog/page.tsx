import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Product updates, engineering stories, and team communication tips from the Chatterbox team.",
};

// ── Hardcoded fallback data ──

const fallbackFeatured = {
  slug: "chatterbox-2",
  category: "Product",
  title: "Chatterbox 2.0: The biggest update yet",
  excerpt:
    "A complete redesign, AI-powered threads, and the fastest real-time engine we've ever built. Here's everything new in Chatterbox 2.0 and what it means for your team.",
  date: "March 18, 2026",
  author: "Jordan Hayes",
};

const fallbackPosts = [
  {
    slug: "ai-summaries",
    category: "Product",
    title: "Introducing AI Summaries: Never miss a conversation again",
    excerpt:
      "Our new AI-powered summaries distill long threads into concise takeaways so you can catch up in seconds, not minutes.",
    date: "March 15, 2026",
    author: "Priya Sharma",
  },
  {
    slug: "real-time-search-at-scale",
    category: "Engineering",
    title: "How we built real-time search at scale",
    excerpt:
      "A deep dive into the architecture behind Chatterbox search — sub-50ms queries across billions of messages.",
    date: "March 8, 2026",
    author: "Elena Rodriguez",
  },
  {
    slug: "async-communication-habits",
    category: "Guide",
    title: "5 async communication habits that actually work",
    excerpt:
      "Practical tips from teams that have mastered async-first workflows without losing speed or connection.",
    date: "February 28, 2026",
    author: "Marcus Chen",
  },
  {
    slug: null as string | null,
    category: "Engineering",
    title: "What we learned scaling to 50,000 teams",
    excerpt:
      "From database sharding to edge caching — the infrastructure lessons that got us to our biggest milestone yet.",
    date: "February 20, 2026",
    author: "Elena Rodriguez",
  },
  {
    slug: null as string | null,
    category: "Product",
    title: "Announcing Chatterbox for Enterprise",
    excerpt:
      "SSO, advanced compliance controls, and dedicated infrastructure. Chatterbox is ready for the largest organizations.",
    date: "February 12, 2026",
    author: "Jordan Hayes",
  },
  {
    slug: null as string | null,
    category: "Engineering",
    title: "Why we chose Supabase over Firebase",
    excerpt:
      "An honest comparison of two real-time backends and why Postgres won for our use case.",
    date: "February 1, 2026",
    author: "Priya Sharma",
  },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const categoryColors: Record<string, string> = {
  Product: "bg-blue-500/10 text-blue-400",
  Engineering: "bg-emerald-500/10 text-emerald-400",
  Guide: "bg-amber-500/10 text-amber-400",
  Culture: "bg-purple-500/10 text-purple-400",
};

export default async function BlogPage() {
  // Try to fetch from database first
  let featuredPost = fallbackFeatured;
  let posts: typeof fallbackPosts = fallbackPosts;
  let usingDb = false;

  try {
    const { data: dbPosts } = await supabaseAdmin
      .from("blog_posts")
      .select("slug, title, category, excerpt, author_name, featured, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (dbPosts && dbPosts.length > 0) {
      usingDb = true;
      const featured = dbPosts.find((p) => p.featured) || dbPosts[0];
      const rest = dbPosts.filter((p) => p.slug !== featured.slug);

      featuredPost = {
        slug: featured.slug,
        category: featured.category,
        title: featured.title,
        excerpt: featured.excerpt,
        date: featured.published_at ? formatDate(featured.published_at) : "",
        author: featured.author_name,
      };

      posts = rest.map((p) => ({
        slug: p.slug,
        category: p.category,
        title: p.title,
        excerpt: p.excerpt,
        date: p.published_at ? formatDate(p.published_at) : "",
        author: p.author_name,
      }));
    }
  } catch {
    // Fall back to hardcoded data
  }

  // If using DB but only 1 post (the featured), show no grid posts
  const showFeatured = usingDb ? !!featuredPost : true;
  const gridPosts = usingDb ? posts : fallbackPosts;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
                Blog
              </p>
              <h1 className="mb-6 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[48px]">
                Blog
              </h1>
              <p className="text-[17px] leading-[28px] text-[#777]">
                Product updates, engineering stories, and team communication
                tips.
              </p>
            </div>
          </div>
        </section>

        {/* Featured post */}
        {showFeatured && (
          <section className="pb-16">
            <div className="mx-auto max-w-6xl px-6">
              <Link href={`/blog/${featuredPost.slug}`} className="group block">
                <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent p-8 transition-all hover:border-white/[0.1] md:p-12">
                  <div className="mx-auto max-w-2xl">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${categoryColors[featuredPost.category]}`}
                    >
                      {featuredPost.category}
                    </span>
                    <h2 className="mt-4 text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-white md:text-[32px]">
                      {featuredPost.title}
                    </h2>
                    <p className="mt-4 text-[15px] leading-[26px] text-[#999]">
                      {featuredPost.excerpt}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <span className="text-[13px] text-[#555]">
                        {featuredPost.date}
                      </span>
                      <span className="text-[13px] text-[#333]">&middot;</span>
                      <span className="text-[13px] text-[#555]">
                        {featuredPost.author}
                      </span>
                    </div>
                    <span className="mt-6 inline-flex text-[14px] font-medium text-white transition-colors group-hover:text-blue-400">
                      Read more &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Post grid */}
        {gridPosts.length > 0 && (
          <section className="border-t border-white/[0.06] bg-[#0d0d0d] py-24 lg:py-28">
            <div className="mx-auto max-w-6xl px-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post) => (
                  <Link key={post.title} href={post.slug ? `/blog/${post.slug}` : "/blog"} className="group block">
                    <div className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.1] hover:bg-white/[0.04]">
                      <span
                        className={`inline-block w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${categoryColors[post.category]}`}
                      >
                        {post.category}
                      </span>
                      <h3 className="mt-4 text-[15px] font-semibold leading-[1.4] text-white">
                        {post.title}
                      </h3>
                      <p className="mt-2 flex-1 text-[13px] leading-[20px] text-[#777]">
                        {post.excerpt}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[12px] text-[#555]">
                            {post.date}
                          </span>
                          <span className="text-[12px] text-[#333]">
                            &middot;
                          </span>
                          <span className="text-[12px] text-[#555]">
                            {post.author}
                          </span>
                        </div>
                      </div>
                      <span className="mt-4 text-[13px] font-medium text-[#555] transition-colors group-hover:text-white">
                        Read more &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <MarketingFooter />
    </div>
  );
}
