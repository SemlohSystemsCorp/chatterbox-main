"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

interface MarkdownProps {
  children: string;
  className?: string;
  /** Map of handle → display name for rendering @mentions */
  mentionNames?: Record<string, string>;
}

const components: Components = {
  p: ({ children }) => (
    <p className="whitespace-pre-wrap break-words text-[#dcddde] [&:not(:first-child)]:mt-1">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-[#5b9bf5] hover:underline"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <code className={`block text-[13px] ${className ?? ""}`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded-[3px] bg-[#1a1a1a] px-[5px] py-[2px] text-[13px] text-[#e06c75]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-1 max-w-full overflow-x-auto rounded-[6px] bg-[#111] border border-[#1a1a1a] p-3 text-[13px] leading-[20px] text-[#ccc]">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-1 border-l-[3px] border-[#444] pl-3 text-[#999]">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="my-1 list-disc pl-5 text-[#dcddde]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 list-decimal pl-5 text-[#dcddde]">{children}</ol>
  ),
  li: ({ children }) => <li className="mt-0.5">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mb-1 mt-2 text-[18px] font-bold text-white">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1 mt-2 text-[16px] font-bold text-white">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-1.5 text-[15px] font-semibold text-white">
      {children}
    </h3>
  ),
  hr: () => <hr className="my-2 border-[#1a1a1a]" />,
  table: ({ children }) => (
    <div className="my-1 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-[#1a1a1a] bg-[#111] px-3 py-1.5 text-left font-semibold text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[#1a1a1a] px-3 py-1.5 text-[#ccc]">
      {children}
    </td>
  ),
};

export function Markdown({ children, className, mentionNames }: MarkdownProps) {
  // Replace <@handle> with styled inline HTML before markdown parsing
  const processed = mentionNames
    ? children.replace(/<@([a-zA-Z0-9._-]+)>/g, (_, handle: string) => {
        const name = mentionNames[handle];
        return `<span class="mention-tag">@${name || handle}</span>`;
      })
    : children;

  return (
    <div className={`overflow-hidden break-words ${className ?? ""} [&_.mention-tag]:rounded-[3px] [&_.mention-tag]:bg-[#276ef1]/15 [&_.mention-tag]:px-[3px] [&_.mention-tag]:py-[1px] [&_.mention-tag]:font-semibold [&_.mention-tag]:text-[#5b9bf5]`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

// ── Content segmentation for pages with media embeds ──

export type ContentSegment =
  | { type: "text"; content: string }
  | { type: "media"; url: string; mediaType: "image" | "video" | "audio" };

export function segmentContent(
  content: string,
  detectMedia: (url: string) => "image" | "video" | "audio" | null,
): ContentSegment[] {
  const lines = content.split("\n");
  const segments: ContentSegment[] = [];
  let textBuffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const mediaType = trimmed.startsWith("http")
      ? detectMedia(trimmed)
      : null;
    const isStorageUrl =
      trimmed.startsWith("http") &&
      trimmed.includes("/storage/v1/object/public/attachments/");

    if (mediaType || (isStorageUrl && !mediaType)) {
      if (textBuffer.length) {
        segments.push({ type: "text", content: textBuffer.join("\n") });
        textBuffer = [];
      }
      segments.push({
        type: "media",
        url: trimmed,
        mediaType: mediaType || "image",
      });
    } else {
      textBuffer.push(line);
    }
  }

  if (textBuffer.length) {
    segments.push({ type: "text", content: textBuffer.join("\n") });
  }

  return segments;
}
