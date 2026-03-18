"use client";

import { useEffect, useRef, useCallback } from "react";
import { XIcon as X, DownloadIcon as Download, ZoomInIcon as ZoomIn, ZoomOutIcon as ZoomOut } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";
import { useState } from "react";

export type MediaType = "image" | "video" | "audio";

interface MediaPreviewModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  type: MediaType;
  fileName?: string;
}

export function MediaPreviewModal({
  open,
  onClose,
  url,
  type,
  fileName,
}: MediaPreviewModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (open) setZoom(1);
  }, [open, url]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (type === "image") {
        if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 5));
        if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.25));
        if (e.key === "0") setZoom(1);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, type]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  const displayName = fileName || url.split("/").pop()?.split("?")[0] || "file";

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-3">
        <span className="max-w-[50%] truncate text-[13px] text-[#999]">
          {displayName}
        </span>
        <div className="flex items-center gap-1">
          {type === "image" && (
            <>
              <Tooltip label="Zoom in (+)">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 5))}
                  className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#888] transition-colors hover:bg-[#222] hover:text-white"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip label="Zoom out (-)">
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
                  className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#888] transition-colors hover:bg-[#222] hover:text-white"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
              </Tooltip>
              <span className="mx-1 text-[11px] text-[#555]">
                {Math.round(zoom * 100)}%
              </span>
            </>
          )}
          <Tooltip label="Download">
            <a
              href={url}
              download={displayName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#888] transition-colors hover:bg-[#222] hover:text-white"
            >
              <Download className="h-4 w-4" />
            </a>
          </Tooltip>
          <Tooltip label="Close (Esc)">
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#888] transition-colors hover:bg-[#222] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      <div className="flex max-h-[85vh] max-w-[90vw] items-center justify-center">
        {type === "image" && (
          <div className="overflow-auto" style={{ maxHeight: "85vh", maxWidth: "90vw" }}>
            <img
              src={url}
              alt={displayName}
              className="rounded-[4px] transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              draggable={false}
            />
          </div>
        )}

        {type === "video" && (
          <video
            src={url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-[8px]"
          >
            Your browser does not support video playback.
          </video>
        )}

        {type === "audio" && (
          <div className="flex flex-col items-center gap-4 rounded-[12px] bg-[#111] p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1a1a1a]">
              <svg className="h-10 w-10 text-[#555]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <span className="max-w-[300px] truncate text-[13px] text-[#999]">
              {displayName}
            </span>
            <audio src={url} controls autoPlay className="w-[320px]">
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to detect media type from URL
export function getMediaType(url: string): MediaType | null {
  const clean = url.split("?")[0].toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(clean)) return "image";
  if (/\.(mp4|webm|mov|ogg|ogv)$/.test(clean)) return "video";
  if (/\.(mp3|wav|ogg|flac|aac|m4a)$/.test(clean)) return "audio";
  // Giphy URLs are always images (GIFs)
  if (/^https?:\/\/(media\d*\.)?giphy\.com\//i.test(url) || /^https?:\/\/i\.giphy\.com\//i.test(url)) return "image";
  // Check for supabase storage URLs with known content
  if (url.includes("/storage/v1/object/public/attachments/")) {
    // Try to infer from URL patterns
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)\b/i.test(url)) return "image";
    if (/\.(mp4|webm|mov)\b/i.test(url)) return "video";
    if (/\.(mp3|wav|ogg|flac|aac|m4a)\b/i.test(url)) return "audio";
  }
  return null;
}

export function isMediaUrl(url: string): boolean {
  return getMediaType(url) !== null;
}

export function isImageUrl(url: string): boolean {
  return getMediaType(url) === "image";
}

export function isVideoUrl(url: string): boolean {
  return getMediaType(url) === "video";
}

export function isAudioUrl(url: string): boolean {
  return getMediaType(url) === "audio";
}
