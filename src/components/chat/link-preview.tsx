"use client";

import { useEffect, useState, useCallback } from "react";
import { ExternalLink, Play } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";

// ── Types ──

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

// ── Simple shared cache (no listeners, no forceUpdate) ──

const ogCache = new Map<string, OgData | null>();

async function fetchOgData(url: string): Promise<OgData | null> {
  if (ogCache.has(url)) return ogCache.get(url)!;
  try {
    const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
    if (!res.ok) {
      ogCache.set(url, null);
      return null;
    }
    const data: OgData = await res.json();
    if (!data.title && !data.description && !data.image) {
      ogCache.set(url, null);
      return null;
    }
    ogCache.set(url, data);
    return data;
  } catch {
    ogCache.set(url, null);
    return null;
  }
}

// ── Helpers ──

/** Extract http/https URLs from text, skipping media and storage URLs. */
export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>\[\]"'`]+/gi) || [];
  const mediaExts = /\.(png|jpg|jpeg|gif|webp|svg|mp4|webm|mov|mp3|wav|ogg|m4a)(\?|$)/i;
  const storageUrl = /\/storage\/v1\/object\/public\/attachments\//;
  return [
    ...new Set(
      matches
        .map((u) => u.replace(/[).,;:!?]+$/, ""))
        .filter((u) => {
          if (mediaExts.test(u) || storageUrl.test(u)) return false;
          try { new URL(u); return true; } catch { return false; }
        })
    ),
  ];
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname + u.search;
    if (path.length <= 1) return host;
    if (path.length > 30) return `${host}${path.slice(0, 27)}\u2026`;
    return `${host}${path}`;
  } catch {
    return url.length > 50 ? url.slice(0, 47) + "\u2026" : url;
  }
}

function escMd(s: string): string {
  return s.replace(/[[\]()\\*_~`#>!|]/g, "\\$&");
}

// ── Provider accent colors ──

const ACCENT: Record<string, string> = {
  youtube: "#ff0000",
  vimeo: "#1ab7ea",
  twitter: "#1d9bf0",
  github: "#8b5cf6",
  reddit: "#ff4500",
};

// ── Preview card ──

function PreviewCard({ url, og }: { url: string; og: OgData }) {
  const [imgError, setImgError] = useState(false);
  const [playing, setPlaying] = useState(false);

  const play = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPlaying(true);
  }, []);

  const color = ACCENT[og.provider || ""] || "#5b9bf5";
  const isVideo = og.type === "video" && og.video;
  const hasImg = og.image && !imgError;

  if (playing && og.video) {
    return (
      <div className="mt-2 w-full max-w-[440px] overflow-hidden rounded-[8px] border border-[#1a1a1a] bg-black">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`${og.video}?autoplay=1`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (!hasImg && !og.description) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-2 block max-w-[440px] overflow-hidden rounded-[8px] border border-[#1a1a1a] bg-[#111] transition-colors hover:border-[#2a2a2a] hover:bg-[#131313]"
    >
      <div className="flex border-l-[3px]" style={{ borderColor: color }}>
        <div className="min-w-0 flex-1 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            {og.favicon && (
              <img
                src={og.favicon}
                alt=""
                className="h-4 w-4 shrink-0 rounded-sm"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <span className="truncate text-[11px] font-medium text-[#888]">{og.siteName}</span>
            <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-[#333] opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          {og.title && (
            <p className="mt-1 line-clamp-2 text-[14px] font-semibold leading-[18px] group-hover:underline" style={{ color }}>
              {og.title}
            </p>
          )}
          {og.description && (
            <p className="mt-1 line-clamp-3 text-[13px] leading-[18px] text-[#999]">{og.description}</p>
          )}
        </div>
        {hasImg && og.type === "article" && (
          <div className="m-2.5 h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[6px] bg-[#0a0a0a]">
            <img src={og.image!} alt="" className="h-full w-full object-cover" onError={() => setImgError(true)} />
          </div>
        )}
      </div>
      {hasImg && og.type !== "article" && (
        <div className="relative overflow-hidden border-t border-[#1a1a1a]">
          <img
            src={og.image!}
            alt=""
            className="w-full max-h-[240px] object-cover transition-transform group-hover:scale-[1.02]"
            onError={() => setImgError(true)}
          />
          {isVideo && (
            <button
              onClick={play}
              className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-110">
                <Play className="h-7 w-7 fill-white pl-0.5" />
              </div>
            </button>
          )}
        </div>
      )}
    </a>
  );
}

// ── Main export: text with inline titled links + preview cards ──

export function TextWithPreviews({
  text,
  mentionNames,
}: {
  text: string;
  mentionNames?: Record<string, string>;
}) {
  const [ogMap, setOgMap] = useState<Record<string, OgData | null>>({});

  // Extract URLs once from the raw text
  const urls = extractUrls(text);

  useEffect(() => {
    if (urls.length === 0) {
      void 0;
      return;
    }

    let cancelled = false;

    // Check cache first, fetch the rest
    const initial: Record<string, OgData | null> = {};
    const toFetch: string[] = [];

    for (const url of urls) {
      if (ogCache.has(url)) {
        initial[url] = ogCache.get(url)!;
      } else {
        toFetch.push(url);
      }
    }

    if (Object.keys(initial).length > 0) {
      setOgMap(initial);
    }

    if (toFetch.length === 0) {
      void 0;
      return;
    }

    Promise.all(
      toFetch.map((url) =>
        fetchOgData(url).then((data) => {
          if (!cancelled) {
            setOgMap((prev) => ({ ...prev, [url]: data }));
          }
        })
      )
    ).then(() => {
      if (!cancelled) void 0;
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // Build processed text: replace bare URLs with markdown titled links
  let processed = text;
  for (const url of urls) {
    const og = ogMap[url];
    if (og?.title) {
      processed = processed.replace(url, `[${escMd(og.title)}](${url})`);
    } else {
      processed = processed.replace(url, `[${shortenUrl(url)}](${url})`);
    }
  }

  // Collect URLs that have rich data worth showing a card for
  const cardUrls = urls.filter((url) => {
    const og = ogMap[url];
    return og && (og.image || og.description);
  });

  return (
    <div>
      <Markdown className="text-[14px] leading-[22px]" mentionNames={mentionNames}>
        {processed}
      </Markdown>
      {cardUrls.length > 0 && (
        <div className="flex flex-col">
          {cardUrls.slice(0, 5).map((url) => (
            <PreviewCard key={url} url={url} og={ogMap[url]!} />
          ))}
        </div>
      )}
    </div>
  );
}
