"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon as X, SearchIcon as Search } from "@primer/octicons-react";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";

interface SearchResult {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  username: string | null;
}

interface NewDmModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}

export function NewDmModal({ open, onClose, currentUserId }: NewDmModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSearching(false);
      setStarting(null);
      setError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        setResults(data.users ?? []);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function handleStartDm(targetUserId: string) {
    setStarting(targetUserId);
    setError("");

    try {
      const res = await fetch("/api/conversations/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: targetUserId }),
      });
      const data = await res.json();
      if (data.short_id) {
        onClose();
        router.push(`/dm/${data.short_id}`);
      } else {
        setError("Could not start conversation");
        setStarting(null);
      }
    } catch {
      setError("Something went wrong");
      setStarting(null);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="flex w-full max-w-[480px] flex-col rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-5 py-4">
          <h2 className="text-[16px] font-bold text-white">New Message</h2>
          <Tooltip label="Close">
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or username..."
              className="h-10 w-full rounded-[8px] border border-[#1a1a1a] bg-[#0a0a0a] pl-10 pr-3 text-[14px] text-white placeholder:text-[#444] focus:border-[#333] focus:outline-none"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" className="text-[#555]" />
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-auto px-3 pb-3">
          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <p className="py-8 text-center text-[13px] text-[#555]">
              No users found
            </p>
          )}

          {query.trim().length < 2 && !searching && (
            <p className="py-8 text-center text-[13px] text-[#555]">
              Type at least 2 characters to search
            </p>
          )}

          {results.map((user) => {
            const initials = user.full_name
              ? user.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : user.email[0].toUpperCase();
            const isStarting = starting === user.id;

            return (
              <button
                key={user.id}
                onClick={() => handleStartDm(user.id)}
                disabled={starting !== null}
                className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors hover:bg-[#1a1a1a] disabled:opacity-50"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-black">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-white">
                    {user.full_name || user.email}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#555]">
                    {user.username && (
                      <span>@{user.username}</span>
                    )}
                    {user.username && user.full_name && (
                      <span className="text-[#333]">·</span>
                    )}
                    {user.full_name && (
                      <span className="truncate">{user.email}</span>
                    )}
                  </div>
                </div>
                {isStarting && (
                  <Spinner size="sm" className="shrink-0 text-[#555]" />
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="px-5 pb-3">
            <p className="text-[12px] text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
