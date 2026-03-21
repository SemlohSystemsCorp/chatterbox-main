import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/blog — public endpoint for fetching published blog posts
// GET /api/blog?slug=some-slug — fetch a single published post by slug
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (slug) {
    const { data: post } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  }

  // List all published posts (no content, for index page)
  const { data: posts } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, title, category, excerpt, author_name, read_time, featured, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  return NextResponse.json({ posts: posts ?? [] });
}
