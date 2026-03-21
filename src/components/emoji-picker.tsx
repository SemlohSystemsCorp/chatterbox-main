"use client";

import { useEffect, useRef, useState } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function EmojiPicker({ onSelect, onOpenChange, children }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function setOpenState(value: boolean) {
    setOpen(value);
    onOpenChange?.(value);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenState(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpenState(!open)}>{children}</div>
      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-2">
          <Picker
            data={data}
            onEmojiSelect={(emoji: { native: string }) => {
              onSelect(emoji.native);
              setOpenState(false);
            }}
            theme="dark"
            previewPosition="none"
            skinTonePosition="none"
            set="native"
            perLine={8}
            maxFrequentRows={3}
            navPosition="top"
            categories={["frequent", "people", "nature", "foods", "activity", "places", "objects", "symbols", "flags"]}
          />
        </div>
      )}
    </div>
  );
}
