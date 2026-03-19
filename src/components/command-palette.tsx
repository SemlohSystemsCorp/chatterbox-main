"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  SearchIcon as Search,
  HomeFillIcon as Home,
  GearIcon as Settings,
  PlusIcon as Plus,
  LinkIcon,
  PeopleIcon as Users,
  HashIcon as Hash,
  CommentDiscussionIcon as MessageSquare,
  PersonAddIcon as UserPlus,
  ShieldIcon as Shield,
  TelescopeIcon as Telescope,
  PlugIcon as Plug,
  ArrowRightIcon as ArrowRight,
  CommandPaletteIcon as Terminal,
  KeyIcon as Keyboard,
} from "@primer/octicons-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  section: string;
}

interface CommandPaletteProps {
  boxes: { id: string; short_id: string; name: string; icon_url?: string | null }[];
  activeBoxId?: string;
  onOpenSearch?: () => void;
}

export function CommandPalette({ boxes, activeBoxId, onOpenSearch }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeBox = boxes.find((b) => b.short_id === activeBoxId);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIdx(0);
    setShowShortcuts(false);
  }, []);

  // Build command list
  const commands: CommandItem[] = [];

  // Navigation
  commands.push({
    id: "go-dashboard",
    label: "Go to Dashboard",
    icon: Home,
    shortcut: "G D",
    action: () => { close(); router.push("/dashboard"); },
    section: "Navigation",
  });
  commands.push({
    id: "go-settings",
    label: "Go to Settings",
    icon: Settings,
    shortcut: "G S",
    action: () => { close(); router.push("/settings"); },
    section: "Navigation",
  });
  commands.push({
    id: "go-messages",
    label: "Go to Messages",
    icon: MessageSquare,
    shortcut: "G M",
    action: () => { close(); router.push("/dashboard/messages"); },
    section: "Navigation",
  });

  // Box-specific commands
  if (activeBox) {
    const bp = `/box/${activeBox.short_id}`;
    commands.push({
      id: "box-channels",
      label: `${activeBox.name} — Channels`,
      icon: Hash,
      action: () => { close(); router.push(bp); },
      section: activeBox.name,
    });
    commands.push({
      id: "box-members",
      label: `${activeBox.name} — Members`,
      icon: Users,
      action: () => { close(); router.push(`${bp}/members`); },
      section: activeBox.name,
    });
    commands.push({
      id: "box-settings",
      label: `${activeBox.name} — Settings`,
      icon: Settings,
      action: () => { close(); router.push(`${bp}/settings`); },
      section: activeBox.name,
    });
    commands.push({
      id: "box-admin",
      label: `${activeBox.name} — Admin`,
      icon: Shield,
      action: () => { close(); router.push(`${bp}/admin`); },
      section: activeBox.name,
    });
    commands.push({
      id: "box-sherlock",
      label: `${activeBox.name} — Sherlock`,
      icon: Telescope,
      action: () => { close(); router.push(`${bp}/sherlock`); },
      section: activeBox.name,
    });
    commands.push({
      id: "box-integrations",
      label: `${activeBox.name} — Integrations`,
      icon: Plug,
      action: () => { close(); router.push(`${bp}/integrations`); },
      section: activeBox.name,
    });
  }

  // Switch to box
  for (const box of boxes) {
    if (box.short_id === activeBoxId) continue;
    commands.push({
      id: `switch-box-${box.id}`,
      label: `Switch to ${box.name}`,
      icon: ArrowRight,
      action: () => { close(); router.push(`/box/${box.short_id}`); },
      section: "Switch Box",
    });
  }

  // Actions
  commands.push({
    id: "search-messages",
    label: "Search Messages",
    icon: Search,
    shortcut: "⌘ F",
    action: () => { close(); onOpenSearch?.(); },
    section: "Actions",
  });
  commands.push({
    id: "create-box",
    label: "Create New Box",
    icon: Plus,
    action: () => { close(); router.push("/create/box"); },
    section: "Actions",
  });
  commands.push({
    id: "join-box",
    label: "Join a Box",
    icon: LinkIcon,
    action: () => { close(); router.push("/join"); },
    section: "Actions",
  });
  commands.push({
    id: "show-shortcuts",
    label: "Keyboard Shortcuts",
    icon: Keyboard,
    action: () => { setShowShortcuts(true); },
    section: "Actions",
  });

  // Filter commands
  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          (c.description?.toLowerCase().includes(query.toLowerCase()))
      )
    : commands;

  // Group by section
  const sections = new Map<string, CommandItem[]>();
  for (const cmd of filtered) {
    const list = sections.get(cmd.section) ?? [];
    list.push(cmd);
    sections.set(cmd.section, list);
  }

  // Flat list for keyboard nav
  const flatList = filtered;

  // Global keyboard listener
  useEffect(() => {
    let gPressed = false;
    let gTimeout: ReturnType<typeof setTimeout> | null = null;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // Cmd+K / Ctrl+K opens palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Cmd+F / Ctrl+F opens search (override browser find)
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        close();
        onOpenSearch?.();
        return;
      }

      // Don't handle other shortcuts when in an input
      if (isInput) return;

      // Escape closes palette
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
        return;
      }

      // G + key sequences
      if (e.key === "g" && !open) {
        gPressed = true;
        gTimeout = setTimeout(() => { gPressed = false; }, 500);
        return;
      }

      if (gPressed && !open) {
        gPressed = false;
        if (gTimeout) clearTimeout(gTimeout);

        switch (e.key) {
          case "d":
            e.preventDefault();
            router.push("/dashboard");
            break;
          case "s":
            e.preventDefault();
            router.push("/settings");
            break;
          case "m":
            e.preventDefault();
            router.push("/dashboard/messages");
            break;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close, router, onOpenSearch]);

  // Focus input on open
  useEffect(() => {
    if (open && !showShortcuts) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, showShortcuts]);

  // Reset selection on filter change
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && flatList[selectedIdx]) {
      e.preventDefault();
      flatList[selectedIdx].action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  if (!open) return null;

  const shortcuts = [
    { keys: ["⌘", "K"], label: "Open command palette" },
    { keys: ["⌘", "F"], label: "Search messages" },
    { keys: ["G", "D"], label: "Go to Dashboard" },
    { keys: ["G", "S"], label: "Go to Settings" },
    { keys: ["G", "M"], label: "Go to Messages" },
    { keys: ["Esc"], label: "Close modal / palette" },
    { keys: ["↑", "↓"], label: "Navigate list" },
    { keys: ["Enter"], label: "Select item" },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[15vh]"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.6)]">
        {showShortcuts ? (
          <>
            {/* Shortcuts view */}
            <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-[#555]" />
                <span className="text-[14px] font-semibold text-white">Keyboard Shortcuts</span>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-[12px] text-[#555] hover:text-white transition-colors"
              >
                Back
              </button>
            </div>
            <div className="max-h-[400px] overflow-auto p-2">
              {shortcuts.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between rounded-[8px] px-3 py-2.5"
                >
                  <span className="text-[13px] text-[#aaa]">{s.label}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="flex h-6 min-w-[24px] items-center justify-center rounded-[4px] bg-[#0a0a0a] border border-[#222] px-1.5 text-[11px] text-[#666]"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#1a1a1a] px-4 py-2">
              <span className="text-[11px] text-[#444]">
                Press <kbd className="rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#555]">Esc</kbd> to close
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Command palette view */}
            <div className="flex items-center gap-3 border-b border-[#1a1a1a] px-4 py-3">
              <Terminal className="h-4 w-4 shrink-0 text-[#555]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[#555] focus:outline-none"
              />
              <kbd className="rounded bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] text-[#444]">ESC</kbd>
            </div>

            <div className="max-h-[400px] overflow-auto p-2">
              {flatList.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-[#555]">
                  No commands found
                </div>
              ) : (
                <>
                  {Array.from(sections.entries()).map(([section, items]) => (
                    <div key={section}>
                      <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                        {section}
                      </div>
                      {items.map((cmd) => {
                        const idx = flatList.indexOf(cmd);
                        const isSelected = idx === selectedIdx;
                        const Icon = cmd.icon;

                        return (
                          <button
                            key={cmd.id}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelectedIdx(idx)}
                            className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left transition-colors ${
                              isSelected ? "bg-[#1a1a1a] text-white" : "text-[#aaa] hover:bg-[#141414]"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate text-[13px]">{cmd.label}</span>
                            {cmd.shortcut && (
                              <div className="flex items-center gap-1">
                                {cmd.shortcut.split(" ").map((k) => (
                                  <kbd
                                    key={k}
                                    className="flex h-5 min-w-[20px] items-center justify-center rounded-[3px] bg-[#0a0a0a] border border-[#222] px-1 text-[10px] text-[#555]"
                                  >
                                    {k}
                                  </kbd>
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#1a1a1a] px-4 py-2 text-[11px] text-[#444]">
              <kbd className="rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#555]">↑↓</kbd>{" "}
              navigate{" "}
              <kbd className="ml-2 rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#555]">Enter</kbd>{" "}
              select
            </div>
          </>
        )}
      </div>
    </div>
  );
}
