import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 150_000;

interface OgData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
  url: string;
  type: string | null;
  video: string | null;
  provider: string | null;
}

// ── YouTube helpers ──

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function getYouTubeId(url: string): string | null {
  const m = url.match(YOUTUBE_REGEX);
  return m ? m[1] : null;
}

async function fetchYouTubeOg(url: string, videoId: string): Promise<OgData> {
  // Use YouTube's public oEmbed endpoint — always works, no API key needed
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || null,
        description: null,
        image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        siteName: "YouTube",
        favicon: "https://www.youtube.com/favicon.ico",
        url,
        type: "video",
        video: `https://www.youtube.com/embed/${videoId}`,
        provider: "youtube",
      };
    }
  } catch {}

  // Fallback — construct from video ID alone
  return {
    title: null,
    description: null,
    image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    siteName: "YouTube",
    favicon: "https://www.youtube.com/favicon.ico",
    url,
    type: "video",
    video: `https://www.youtube.com/embed/${videoId}`,
    provider: "youtube",
  };
}

// ── Vimeo helpers ──

const VIMEO_REGEX = /vimeo\.com\/(\d+)/;

function getVimeoId(url: string): string | null {
  const m = url.match(VIMEO_REGEX);
  return m ? m[1] : null;
}

async function fetchVimeoOg(url: string, videoId: string): Promise<OgData> {
  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || null,
        description: data.description || null,
        image: data.thumbnail_url || null,
        siteName: "Vimeo",
        favicon: "https://vimeo.com/favicon.ico",
        url,
        type: "video",
        video: `https://player.vimeo.com/video/${videoId}`,
        provider: "vimeo",
      };
    }
  } catch {}

  return {
    title: null,
    description: null,
    image: null,
    siteName: "Vimeo",
    favicon: "https://vimeo.com/favicon.ico",
    url,
    type: "video",
    video: `https://player.vimeo.com/video/${videoId}`,
    provider: "vimeo",
  };
}

// ── Main handler ──

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const cacheHeaders = {
    "Cache-Control": "public, max-age=86400, s-maxage=86400",
  };

  // ── Special providers (oEmbed) ──
  const ytId = getYouTubeId(url);
  if (ytId) {
    const og = await fetchYouTubeOg(url, ytId);
    return NextResponse.json(og, { headers: cacheHeaders });
  }

  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    const og = await fetchVimeoOg(url, vimeoId);
    return NextResponse.json(og, { headers: cacheHeaders });
  }

  // ── Generic HTML scrape ──
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Chatterbox/1.0; +https://chatterbox.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    clearTimeout(timer);

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      return NextResponse.json({ error: "Not an HTML page" }, { status: 422 });
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "No body" }, { status: 422 });
    }

    let html = "";
    const decoder = new TextDecoder();
    let bytesRead = 0;

    while (bytesRead < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.length;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    const og = parseOgTags(html, url);
    return NextResponse.json(og, { headers: cacheHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// ── HTML parser ──

function parseOgTags(html: string, pageUrl: string): OgData {
  const metaTags: { attrs: Record<string, string> }[] = [];
  const metaRegex = /<meta\s+([^>]*?)\/?>/gi;
  let metaMatch;
  while ((metaMatch = metaRegex.exec(html)) !== null) {
    const attrStr = metaMatch[1];
    const attrs: Record<string, string> = {};
    const attrRegex = /([a-zA-Z_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
      attrs[attrMatch[1].toLowerCase()] = decodeEntities(
        attrMatch[2] ?? attrMatch[3]
      );
    }
    metaTags.push({ attrs });
  }

  function getMeta(key: string): string | null {
    for (const tag of metaTags) {
      const prop = tag.attrs.property || tag.attrs.name || "";
      if (prop.toLowerCase() === key.toLowerCase() && tag.attrs.content) {
        return tag.attrs.content;
      }
    }
    return null;
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleTag = titleMatch ? decodeEntities(titleMatch[1]).trim() : null;

  let favicon: string | null = null;
  const iconPatterns = [
    /<link[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']*)["']/i,
    /<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut\s+)?icon["']/i,
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["']/i,
  ];
  for (const pattern of iconPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      favicon = resolveUrl(match[1], pageUrl);
      break;
    }
  }
  if (!favicon) {
    try {
      favicon = `${new URL(pageUrl).origin}/favicon.ico`;
    } catch {}
  }

  const image =
    getMeta("og:image") ||
    getMeta("twitter:image") ||
    getMeta("twitter:image:src");
  const ogType = getMeta("og:type");

  // Check for video embed URL
  const videoUrl =
    getMeta("og:video:secure_url") ||
    getMeta("og:video:url") ||
    getMeta("og:video");

  // Detect provider from domain
  let provider: string | null = null;
  try {
    const host = new URL(pageUrl).hostname;
    if (host.includes("twitter.com") || host.includes("x.com")) provider = "twitter";
    else if (host.includes("github.com")) provider = "github";
    else if (host.includes("reddit.com")) provider = "reddit";
  } catch {}

  return {
    title: getMeta("og:title") || getMeta("twitter:title") || titleTag || null,
    description:
      getMeta("og:description") ||
      getMeta("twitter:description") ||
      getMeta("description") ||
      null,
    image: image ? resolveUrl(image, pageUrl) : null,
    siteName: getMeta("og:site_name") || extractDomain(pageUrl),
    favicon,
    url: getMeta("og:url") || pageUrl,
    type: ogType,
    video: videoUrl ? resolveUrl(videoUrl, pageUrl) : null,
    provider,
  };
}

function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
