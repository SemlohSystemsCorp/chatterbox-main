"use client";

import { useState, useRef, useEffect } from "react";
import { ClockIcon as Clock, XIcon as X, ChevronRightIcon as ChevronRight } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";

interface SchedulePickerProps {
  onSchedule: (date: Date) => void;
  disabled?: boolean;
}

function getQuickOptions(): { label: string; date: Date }[] {
  const now = new Date();

  const in30 = new Date(now.getTime() + 30 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const tomorrow9am = new Date(now);
  tomorrow9am.setDate(tomorrow9am.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);

  const monday9am = new Date(now);
  const daysUntilMonday = ((1 - now.getDay() + 7) % 7) || 7;
  monday9am.setDate(monday9am.getDate() + daysUntilMonday);
  monday9am.setHours(9, 0, 0, 0);

  const options = [
    { label: "In 30 minutes", date: in30 },
    { label: "In 1 hour", date: in1h },
    { label: "In 2 hours", date: in2h },
    { label: "Tomorrow at 9:00 AM", date: tomorrow9am },
  ];

  // Only show "Next Monday" if today isn't already Monday morning
  if (daysUntilMonday > 1) {
    options.push({ label: "Next Monday at 9:00 AM", date: monday9am });
  }

  return options;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Convert Date to local datetime-local input value
function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SchedulePicker({ onSchedule, disabled }: SchedulePickerProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCustom(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  function handleQuickOption(date: Date) {
    onSchedule(date);
    setOpen(false);
    setShowCustom(false);
  }

  function handleCustomSubmit() {
    if (!customValue) return;
    const date = new Date(customValue);
    if (date <= new Date()) return;
    onSchedule(date);
    setOpen(false);
    setShowCustom(false);
    setCustomValue("");
  }

  // Minimum datetime: 5 minutes from now
  const minDatetime = toLocalDatetimeString(
    new Date(Date.now() + 5 * 60 * 1000)
  );

  return (
    <div className="relative" ref={ref}>
      <Tooltip label="Schedule message">
        <button
          onClick={() => {
            setOpen(!open);
            setShowCustom(false);
          }}
          disabled={disabled}
          className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      </Tooltip>

      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-[260px] overflow-hidden rounded-[10px] border border-[#1a1a1a] bg-[#111] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="border-b border-[#1a1a1a] px-3 py-2.5">
            <span className="text-[13px] font-medium text-white">
              Schedule message
            </span>
          </div>

          {!showCustom ? (
            <>
              {getQuickOptions().map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleQuickOption(opt.date)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-[#ccc] transition-colors hover:bg-[#1a1a1a]"
                >
                  <span>{opt.label}</span>
                  <span className="text-[11px] text-[#555]">
                    {formatDateTime(opt.date)}
                  </span>
                </button>
              ))}
              <button
                onClick={() => {
                  setShowCustom(true);
                  setCustomValue(
                    toLocalDatetimeString(
                      new Date(Date.now() + 60 * 60 * 1000)
                    )
                  );
                }}
                className="flex w-full items-center justify-between border-t border-[#1a1a1a] px-3 py-2 text-left text-[13px] text-[#ccc] transition-colors hover:bg-[#1a1a1a]"
              >
                <span>Custom time...</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#555]" />
              </button>
            </>
          ) : (
            <div className="p-3">
              <input
                type="datetime-local"
                value={customValue}
                min={minDatetime}
                onChange={(e) => setCustomValue(e.target.value)}
                className="mb-2 w-full rounded-[6px] border border-[#2a2a2a] bg-[#0a0a0a] px-2.5 py-2 text-[13px] text-white focus:border-[#444] focus:outline-none [color-scheme:dark]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 rounded-[6px] bg-[#1a1a1a] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#252525]"
                >
                  Back
                </button>
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customValue || new Date(customValue) <= new Date()}
                  className="flex-1 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-[#e0e0e0] disabled:bg-[#333] disabled:text-[#666]"
                >
                  Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Inline badge showing scheduled message info with cancel
export function ScheduledBanner({
  scheduledFor,
  onCancel,
}: {
  scheduledFor: Date;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[6px] bg-[#1a1a1a] px-3 py-1.5">
      <Clock className="h-3.5 w-3.5 shrink-0 text-[#888]" />
      <span className="text-[12px] text-[#aaa]">
        Scheduled for {formatDateTime(scheduledFor)}
      </span>
      <button
        onClick={onCancel}
        className="ml-auto flex h-4 w-4 items-center justify-center rounded-full text-[#555] hover:text-white"
        title="Cancel schedule"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
