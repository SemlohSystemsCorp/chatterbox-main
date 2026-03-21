import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon as ArrowLeft } from "@primer/octicons-react";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ── Hardcoded article data (fallback) ──

interface Article {
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  authorRole: string;
  readTime: string;
  excerpt: string;
  content: string;
}

const articles: Record<string, Article> = {
  "chatterbox-2": {
    slug: "chatterbox-2",
    title: "Chatterbox 2.0: The biggest update yet",
    category: "Product",
    date: "March 18, 2026",
    author: "Jordan Hayes",
    authorRole: "CEO & Co-founder",
    readTime: "6 min read",
    excerpt:
      "A complete redesign, AI-powered threads, and the fastest real-time engine we've ever built.",
    content: `When we started Chatterbox three years ago, we had a simple thesis: team communication tools were broken in predictable ways. Notifications were noisy, search was slow, and catching up after a day off took an hour. We set out to fix that.

Today, we're shipping Chatterbox 2.0 — the most significant update we've ever made.

## A redesigned interface

We rebuilt the entire UI from scratch. The new design is faster, cleaner, and more information-dense without feeling cramped. Every pixel has been reconsidered.

The sidebar now adapts to your workflow. Channels you visit frequently float to the top. Unread counts are smarter — they distinguish between "someone mentioned you" and "the channel has new messages." And the new split-pane view lets you keep a conversation open while browsing channels, something our power users have been asking for since day one.

We also shipped a proper dark mode and light mode with instant toggling and a live preview so you can see exactly what you're getting before committing. Small detail, but it matters.

## AI that actually helps

Every team chat app is bolting on AI features right now. Most of them feel like demos. We wanted ours to feel like a teammate.

**AI Summaries v2** is the headliner. When you've been away, you can now get a context-aware summary of any channel. It doesn't just list what happened — it understands threads, identifies decisions, and highlights action items. In testing, our own team went from spending 30 minutes on Monday morning catch-up to about 3 minutes.

**Smart search** now understands natural language. Instead of remembering exact filter syntax, you can type "what did the design team decide about the new onboarding flow last week" and get a real answer with source messages linked.

**Thread suggestions** gently nudge conversations into threads when they start drifting off-topic. It's subtle, non-intrusive, and you can turn it off. But in our beta, teams that kept it on saw 40% fewer "sorry, wrong channel" messages.

## The fastest engine we've ever built

Under the hood, we rewrote our real-time message delivery pipeline. Messages now arrive in under 50ms on average — that's faster than most people can perceive. Typing indicators are smoother. Presence updates are instant.

We also rebuilt search from the ground up. The old system worked fine up to about 10,000 teams. At 50,000, it started showing cracks. The new engine uses a custom inverted index backed by Postgres, and it returns results in under 50ms regardless of how much history you have.

For the technically curious: we wrote a detailed engineering blog post about [how we built real-time search at scale](/blog/real-time-search-at-scale).

## Voice and video, leveled up

Calls got a major upgrade. Screen sharing is now instantaneous with no quality degradation. We added noise suppression that actually works in coffee shops. Background blur runs locally so your video never leaves your device unprocessed.

The biggest addition: you can now test your mic and camera from Settings before joining a call. No more "can you hear me?" dance.

## What's next

Chatterbox 2.0 is the foundation for everything we're building next. Joint channels between organizations ship next month. Our mobile apps are getting the same redesign treatment. And we're working on something new around async video that we're not ready to talk about yet — but we're excited.

If you're already on Chatterbox, 2.0 is rolling out to all teams this week. If you haven't tried us yet, [there's never been a better time to start](/signup).

We build Chatterbox for teams that ship. Thanks for shipping with us.`,
  },

  "ai-summaries": {
    slug: "ai-summaries",
    title: "Introducing AI Summaries: Never miss a conversation again",
    category: "Product",
    date: "March 15, 2026",
    author: "Priya Sharma",
    authorRole: "CTO & Co-founder",
    readTime: "5 min read",
    excerpt:
      "Our new AI-powered summaries distill long threads into concise takeaways so you can catch up in seconds.",
    content: `We've all been there. You step away from your computer for a few hours — a meeting, a focus block, a dentist appointment — and come back to 200 unread messages across six channels. You know most of it is irrelevant to you, but buried somewhere in that wall of text is a decision, an action item, or a question with your name on it.

Catching up shouldn't feel like work. That's why we built AI Summaries.

## How it works

Open any channel or thread and tap the summary icon. In about two seconds, you'll get a concise digest of everything that happened while you were away. Not a transcript — a summary that understands context.

The AI identifies:
- **Decisions made** — "The team agreed to use Postgres for the new service"
- **Action items** — "Marcus volunteered to write the migration script by Friday"
- **Open questions** — "No one answered Priya's question about the API rate limits"
- **Key links and files** — Anything shared gets surfaced with context

## Context-aware, not just keyword-aware

Most AI summary tools work by extracting keywords and stitching together sentences. Ours understands threads. If someone asks a question at 9am and gets an answer at 2pm with three tangents in between, the summary connects the question to the answer and ignores the tangents.

It also respects channel norms. In #engineering, it emphasizes technical decisions and code links. In #random, it keeps things light. This isn't hand-coded — the model picks up on conversational patterns.

## Privacy first

Your messages never leave your Chatterbox workspace. Summaries are generated using our own fine-tuned models running on infrastructure we control. We don't send your conversations to third-party AI providers, and we don't use your data to train models. Period.

You can also disable AI features per-channel or per-workspace from Settings.

## Real results

During our beta, we tracked how long it took teams to catch up after being away for 4+ hours:

- **Before AI Summaries:** 28 minutes average
- **After AI Summaries:** 4 minutes average

That's 24 minutes saved every time you step away. Over a week, over a month — it adds up to hours of reclaimed focus time.

## Try it today

AI Summaries are available now on all Pro and Enterprise plans. Free plan users get 10 summaries per month to try it out.

Open any channel, click the sparkle icon in the header, and see what you missed. We think you'll wonder how you ever caught up without it.`,
  },

  "real-time-search-at-scale": {
    slug: "real-time-search-at-scale",
    title: "How we built real-time search at scale",
    category: "Engineering",
    date: "March 8, 2026",
    author: "Elena Rodriguez",
    authorRole: "Head of Engineering",
    readTime: "8 min read",
    excerpt:
      "A deep dive into the architecture behind sub-50ms search across billions of messages.",
    content: `Search in a team chat app sounds simple. Users type words, you find messages containing those words. How hard can it be?

At 100 teams, it's trivial. At 1,000 teams, it's still easy. At 50,000 teams sending 2 million messages per day, it becomes one of the hardest problems in the system.

This is the story of how we rebuilt Chatterbox search from scratch to handle our current scale — and the next 10x beyond it.

## The old system

Our original search was powered by Postgres full-text search with \`tsvector\` columns and GIN indexes. It worked beautifully for our first 18 months. Queries returned in 20-50ms, the index was compact, and we didn't need any additional infrastructure.

The cracks appeared around 10,000 teams. Query times started creeping up — not for simple queries, but for complex ones with filters. A search like \`from:elena in:engineering before:2025-01-01 has:link database\` would sometimes take 2-3 seconds. Unacceptable.

The root cause: Postgres full-text search is excellent for single-table queries, but when you need to join against channel memberships, conversation participants, and permission checks while also filtering by sender and date, the query planner starts making bad decisions.

## What we needed

Our requirements:
1. **Sub-50ms p95 latency** for any query, regardless of history size
2. **Real-time indexing** — messages should be searchable within 1 second of being sent
3. **Permission-aware** — users should only see messages they have access to
4. **Rich filters** — from:, in:, before:, after:, has:link/image/file
5. **No new infrastructure** — we didn't want to run Elasticsearch or Meilisearch

That last requirement was controversial on the team. But we're a small engineering team, and every piece of infrastructure we add is something we have to operate, monitor, and debug at 3am. If we could solve this inside Postgres, we would.

## The new architecture

The solution has three layers:

### 1. Inverted index in Postgres

We built a custom inverted index table:

\`\`\`sql
CREATE TABLE search_index (
  term TEXT NOT NULL,
  message_id UUID NOT NULL,
  channel_id UUID,
  conversation_id UUID,
  sender_id UUID NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL,
  has_link BOOLEAN DEFAULT FALSE,
  has_image BOOLEAN DEFAULT FALSE,
  has_file BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (term, message_id)
);
\`\`\`

When a message is sent, we tokenize it and insert one row per unique term. The key insight: by denormalizing \`channel_id\`, \`sender_id\`, and the \`has_*\` flags directly into the index, we eliminate all joins at query time.

### 2. Async indexing pipeline

Messages are indexed asynchronously via Supabase Realtime subscriptions. A background worker listens for new messages, tokenizes them, and batch-inserts into the search index. The typical indexing latency is 200-400ms — well under our 1-second target.

### 3. Permission filtering at the edge

The trickiest part. We can't just return any message matching the search terms — we need to verify the user has access. But checking permissions per-result is too slow.

Our solution: we precompute a user's "search scope" — the set of channel and conversation IDs they can access — and include it as an \`IN\` clause in the search query. This set is cached in-memory and invalidated when permissions change.

## Results

After the migration:
- **p50 latency:** 12ms (down from 80ms)
- **p95 latency:** 38ms (down from 1,200ms)
- **p99 latency:** 72ms (down from 4,800ms)
- **Index size:** 40% smaller than the old tsvector approach
- **Indexing latency:** 300ms average (was synchronous before, blocking message sends)

The best part: it's all just Postgres. No new services, no new monitoring, no new on-call runbooks.

## Lessons learned

**Denormalize aggressively in read-heavy systems.** Our instinct was to normalize and join. Wrong. When your read-to-write ratio is 100:1, duplicating data into the index is worth it.

**Custom beats general-purpose.** Postgres full-text search is a great general-purpose tool. But when you know your exact query patterns, a purpose-built index will always win.

**Measure before you migrate.** We spent two weeks profiling the old system before writing a single line of new code. That profiling told us exactly which queries were slow and why, which made the new design almost obvious.

If you're building search for a product with complex permissions, I hope this is useful. And if you want to work on problems like this — [we're hiring](/careers).`,
  },

  "async-communication-habits": {
    slug: "async-communication-habits",
    title: "5 async communication habits that actually work",
    category: "Guide",
    date: "February 28, 2026",
    author: "Marcus Chen",
    authorRole: "Head of Design",
    readTime: "4 min read",
    excerpt:
      "Practical tips from teams that have mastered async-first workflows without losing speed.",
    content: `We talk to hundreds of teams every month. The ones that move fastest aren't the ones in meetings all day — they're the ones that have mastered asynchronous communication. Here are the five habits we see again and again.

## 1. Write decisions, not discussions

The highest-leverage async habit is deceptively simple: when a decision is made, write it down in the channel where it was discussed. Not in a Google Doc. Not in a Notion page. Right there, in the conversation.

\`\`\`
✅ Decision: We're going with Option B (Postgres) for the new service.
   Reason: Better query flexibility, team already has expertise.
   Owner: Elena
   Timeline: Migration script by Friday
\`\`\`

This one message saves every future reader from scrolling through 47 messages of debate. And with Chatterbox's pinning feature, you can pin it so it's always one click away.

## 2. Use threads aggressively

If your reply is only relevant to the person who wrote the original message, put it in a thread. If your message changes the topic even slightly, start a new thread.

Teams that adopt this habit see their channel noise drop by 40-60%. Threads keep the main channel scannable while preserving detailed discussions for people who need them.

The mental model: the main channel is a newspaper front page. Threads are the full articles.

## 3. Set status, not availability

Instead of "Available" or "In a meeting," use your status to tell your team what you're working on:

- 🎯 Deep work on search refactor — back at 2pm
- 📝 Writing Q1 planning doc — slow to respond today
- 🏥 Doctor's appointment — back tomorrow

This gives people context to decide whether to wait for you or find someone else. It's a small thing that eliminates hundreds of "hey, are you there?" messages per week.

## 4. Batch your messages

Don't send five messages in a row. Write one message with everything.

Bad:
\`\`\`
hey
quick question
about the API
what's the rate limit?
also is it authenticated?
\`\`\`

Good:
\`\`\`
Quick question about the API: what's the rate limit, and does it require authentication?
\`\`\`

Batching is respectful of other people's attention. Every message sends a notification. Five notifications for one question trains people to ignore your messages.

## 5. Default to public channels

If you're having a conversation that a third person might benefit from reading someday, have it in a public channel. Not a DM.

This is the hardest habit to build because DMs feel safe and low-stakes. But every DM is knowledge that only two people have. Public channels build a searchable, permanent knowledge base that helps people you haven't even hired yet.

The exception: sensitive topics, personal matters, and genuine 1:1 feedback. Those belong in DMs.

## The compound effect

None of these habits are revolutionary on their own. But together, they compound. A team that pins decisions, threads discussions, sets clear statuses, batches messages, and defaults to public channels is a team that spends dramatically less time in communication overhead and more time doing actual work.

That's the kind of team we're building Chatterbox for.`,
  },
};

// ── Helpers ──

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function getArticle(slug: string): Promise<Article | null> {
  // Try database first
  try {
    const { data: post } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (post) {
      return {
        slug: post.slug,
        title: post.title,
        category: post.category,
        date: post.published_at ? formatDate(post.published_at) : "",
        author: post.author_name,
        authorRole: post.author_role,
        readTime: post.read_time,
        excerpt: post.excerpt,
        content: post.content,
      };
    }
  } catch {
    // Fall through to hardcoded
  }

  // Fallback to hardcoded articles
  return articles[slug] ?? null;
}

async function getRelatedPosts(currentSlug: string) {
  // Try database first
  try {
    const { data: dbPosts } = await supabaseAdmin
      .from("blog_posts")
      .select("slug, title, category, excerpt")
      .eq("published", true)
      .neq("slug", currentSlug)
      .order("published_at", { ascending: false })
      .limit(3);

    if (dbPosts && dbPosts.length > 0) {
      return dbPosts;
    }
  } catch {
    // Fall through
  }

  return Object.values(articles)
    .filter((a) => a.slug !== currentSlug)
    .slice(0, 3);
}

// ── Metadata ──

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Not Found" };

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.date,
      authors: [article.author],
    },
  };
}

// ── Simple markdown-to-JSX renderer ──

function renderMarkdown(content: string) {
  const blocks: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let blockIndex = 0;

  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        blocks.push(
          <pre
            key={blockIndex++}
            className="my-6 overflow-x-auto rounded-xl bg-[#0a0a0a] border border-white/[0.06] p-4 text-[13px] leading-[22px] text-[#ccc]"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Blank line
    if (!line.trim()) continue;

    // Heading
    if (line.startsWith("## ")) {
      blocks.push(
        <h2
          key={blockIndex++}
          className="mb-4 mt-10 text-[22px] font-bold tracking-[-0.01em] text-white"
        >
          {line.slice(3)}
        </h2>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h3
          key={blockIndex++}
          className="mb-3 mt-8 text-[17px] font-semibold text-white"
        >
          {line.slice(4)}
        </h3>
      );
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s/.test(line.trim())) {
      blocks.push(
        <li
          key={blockIndex++}
          className="ml-5 list-decimal text-[16px] leading-[28px] text-[#bbb]"
        >
          {renderInline(line.trim().replace(/^\d+\.\s/, ""))}
        </li>
      );
      continue;
    }

    // List item
    if (line.trim().startsWith("- ")) {
      blocks.push(
        <li
          key={blockIndex++}
          className="ml-5 list-disc text-[16px] leading-[28px] text-[#bbb]"
        >
          {renderInline(line.trim().slice(2))}
        </li>
      );
      continue;
    }

    // Regular paragraph
    blocks.push(
      <p
        key={blockIndex++}
        className="mb-5 text-[16px] leading-[28px] text-[#bbb]"
      >
        {renderInline(line)}
      </p>
    );
  }

  return blocks;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold**, `code`, and [link](url)
  const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold
      parts.push(
        <strong key={match.index} className="font-semibold text-white">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Inline code
      parts.push(
        <code
          key={match.index}
          className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[14px] text-[#ddd]"
        >
          {match[4]}
        </code>
      );
    } else if (match[5]) {
      // Link
      parts.push(
        <Link
          key={match.index}
          href={match[7]}
          className="text-white underline decoration-white/30 underline-offset-2 transition-colors hover:decoration-white/60"
        >
          {match[6]}
        </Link>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

// ── Category colors ──

const categoryColors: Record<string, string> = {
  Product: "bg-blue-500/10 text-blue-400",
  Engineering: "bg-emerald-500/10 text-emerald-400",
  Guide: "bg-amber-500/10 text-amber-400",
  Culture: "bg-purple-500/10 text-purple-400",
};

// ── Page ──

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) notFound();

  const related = await getRelatedPosts(slug);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        {/* Article header */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <Link
              href="/blog"
              className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-[#555] transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to blog
            </Link>

            <span
              className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${categoryColors[article.category]}`}
            >
              {article.category}
            </span>

            <h1 className="mt-5 text-[32px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[42px]">
              {article.title}
            </h1>

            <p className="mt-4 text-[17px] leading-[28px] text-[#777]">
              {article.excerpt}
            </p>

            <div className="mt-6 flex items-center gap-4 border-b border-white/[0.06] pb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-[14px] font-bold text-white">
                {article.author
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </div>
              <div>
                <div className="text-[14px] font-medium text-white">
                  {article.author}
                </div>
                <div className="text-[12px] text-[#555]">
                  {article.authorRole}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-3 text-[13px] text-[#555]">
                <span>{article.date}</span>
                <span className="text-[#333]">&middot;</span>
                <span>{article.readTime}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Article body */}
        <section className="pb-20">
          <div className="mx-auto max-w-3xl px-6">
            <article className="prose-custom">
              {renderMarkdown(article.content)}
            </article>
          </div>
        </section>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="border-t border-white/[0.06] bg-[#0d0d0d] py-20">
            <div className="mx-auto max-w-6xl px-6">
              <h2 className="mb-8 text-[20px] font-bold text-white">
                More from the blog
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {related.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group block"
                  >
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
