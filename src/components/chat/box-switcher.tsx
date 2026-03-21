"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDownIcon as ChevronDown, CheckIcon as Check, PlusIcon as Plus, PersonAddIcon as UserPlus, GearIcon as Settings, CommandPaletteIcon as Keyboard, MoonIcon as Moon, SunIcon as Sun, PeopleIcon as Users, CommentDiscussionIcon as MessageSquare, AlertIcon as Alert } from "@primer/octicons-react";
import type { BoxData } from "@/lib/chat-helpers";
import { useSettingsStore } from "@/stores/settings-store";
import { FeedbackModal } from "@/components/modals/feedback-modal";

interface BoxSwitcherProps {
  boxes: BoxData[];
  currentBox: BoxData;
  memberCount?: number;
  onInvite?: () => void;
}

export function BoxSwitcher({ boxes, currentBox, memberCount, onInvite }: BoxSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { settings, updateSetting } = useSettingsStore();

  const isDark = settings.theme !== "light";
  const [feedbackMode, setFeedbackMode] = useState<"feedback" | "report" | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const boxInitials = currentBox.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const planLabel = currentBox.plan === "pro" ? "Pro" : currentBox.plan === "enterprise" ? "Enterprise" : "Free";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-full items-center gap-2.5 border-b border-[#1a1a1a] px-4 transition-colors hover:bg-[#111]"
      >
        {currentBox.icon_url ? (
          <img
            src={currentBox.icon_url}
            alt=""
            className="h-7 w-7 rounded-[5px]"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-white text-[9px] font-bold text-black">
            {boxInitials}
          </div>
        )}
        <span className="truncate text-[14px] font-semibold text-white">
          {currentBox.name}
        </span>
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 shrink-0 text-[#555] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 w-[280px] rounded-b-[10px] border border-t-0 border-[#1a1a1a] bg-[#111] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Workspace list */}
          <div className="py-1">
            <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
              Workspaces
            </div>
            {boxes.map((b) => {
              const isCurrent = b.short_id === currentBox.short_id;
              const initials = b.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const bPlan = b.plan === "pro" ? "Pro" : b.plan === "enterprise" ? "Enterprise" : "Free";
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setOpen(false);
                    if (!isCurrent) router.push(`/box/${b.short_id}`);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${isCurrent ? "bg-[#1a1a1a]" : "hover:bg-[#1a1a1a]"}`}
                >
                  {b.icon_url ? (
                    <img
                      src={b.icon_url}
                      alt=""
                      className="h-8 w-8 rounded-[5px]"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-white text-[9px] font-bold text-black">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-white">
                      {b.name}
                    </div>
                    <div className="text-[11px] text-[#555]">
                      {bPlan}{isCurrent && memberCount ? ` · ${memberCount} Members` : ""}
                    </div>
                  </div>
                  {isCurrent && (
                    <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Create new */}
          <div className="border-t border-[#1a1a1a] py-1">
            <Link
              href="/create/box"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Create new workspace
            </Link>
          </div>

          {/* Actions */}
          <div className="border-t border-[#1a1a1a] py-1">
            {onInvite && (
              <button
                onClick={() => {
                  setOpen(false);
                  onInvite();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              >
                <UserPlus className="h-4 w-4" />
                Invite your team
              </button>
            )}
            <Link
              href={`/box/${currentBox.short_id}/settings`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <Settings className="h-4 w-4" />
              <span className="flex-1">Settings & members</span>
              <kbd className="rounded bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] text-[#444]">S</kbd>
            </Link>
          </div>

          {/* Preferences */}
          <div className="border-t border-[#1a1a1a] py-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <Keyboard className="h-4 w-4" />
              <span className="flex-1">Keyboard shortcuts</span>
              <kbd className="rounded bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] text-[#444]">?</kbd>
            </Link>
            <button
              onClick={() => {
                updateSetting("theme", isDark ? "light" : "dark");
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="flex-1">Dark mode</span>
              <div
                className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${
                  isDark ? "bg-white" : "bg-[#333]"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full transition-transform ${
                    isDark ? "translate-x-[14px] bg-black" : "translate-x-0 bg-[#666]"
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Feedback & Report */}
          <div className="border-t border-[#1a1a1a] py-1">
            <button
              onClick={() => {
                setOpen(false);
                setFeedbackMode("feedback");
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              Send feedback
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setFeedbackMode("report");
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-[#de1135]"
            >
              <Alert className="h-4 w-4" />
              Report a problem
            </button>
          </div>

          {/* Plan badge */}
          <div className="border-t border-[#1a1a1a] px-3 py-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#444]">
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                <span>{planLabel} plan</span>
              </div>
              {currentBox.plan === "free" && (
                <Link
                  href={`/checkout?box=${currentBox.short_id}&plan=pro`}
                  onClick={() => setOpen(false)}
                  className="text-[#276ef1] transition-colors hover:text-[#4a8af5]"
                >
                  Upgrade
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback / Report modal */}
      <FeedbackModal
        open={feedbackMode !== null}
        onClose={() => setFeedbackMode(null)}
        mode={feedbackMode ?? "feedback"}
      />
    </div>
  );
}
