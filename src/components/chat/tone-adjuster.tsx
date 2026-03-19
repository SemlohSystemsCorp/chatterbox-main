"use client";

import { useState, useRef, useEffect } from "react";
import { SparkleIcon as Wand2, UndoIcon as Undo2 } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";

interface ToneAdjusterProps {
  text: string;
  onRewrite: (text: string) => void;
}

const TONES = [
  { key: "formal", label: "More formal" },
  { key: "casual", label: "More casual" },
  { key: "shorter", label: "Shorter" },
  { key: "friendlier", label: "Friendlier" },
] as const;

export function ToneAdjuster({ text, onRewrite }: ToneAdjusterProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalText, setOriginalText] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleTone(tone: string) {
    if (!text.trim() || loading) return;

    setOpen(false);
    setLoading(true);
    if (!originalText) setOriginalText(text);

    try {
      const res = await fetch("/api/messages/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), tone }),
      });
      const data = await res.json();
      if (data.rewritten) {
        onRewrite(data.rewritten);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleUndo() {
    if (originalText !== null) {
      onRewrite(originalText);
      setOriginalText(null);
    }
  }

  if (!text.trim()) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1">
        {originalText !== null && (
          <button
            onClick={handleUndo}
            className="flex h-6 items-center gap-1 rounded-[4px] px-1.5 text-[10px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            title="Undo rewrite"
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </button>
        )}
        <Tooltip label="Adjust tone">
          <button
            onClick={() => setOpen(!open)}
            disabled={loading}
            className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
          >
            {loading ? (
              <Spinner size="xs" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
          </button>
        </Tooltip>
      </div>

      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-[140px] rounded-[8px] border border-[#1a1a1a] bg-[#111] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {TONES.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTone(t.key)}
              className="flex w-full items-center px-3 py-1.5 text-[12px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
