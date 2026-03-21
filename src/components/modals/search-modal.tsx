"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SearchIcon as Search, XIcon as X, HashIcon as Hash, CommentDiscussionIcon as MessageSquare, SparklesFillIcon as Sparkles, ArrowRightIcon as ArrowRight, ClockIcon as Clock } from "@primer/octicons-react";
import { Markdown } from "@/components/ui/markdown";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";

interface SearchResult {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_avatar_url: string | null;
  channel_id: string | null;
  conversation_id: string | null;
  channel_name: string | null;
  channel_short_id: string | null;
  box_short_id: string | null;
  box_name: string | null;
}

interface AskSource {
  id: string;
  content: string;
  sender_name: string;
  channel_name: string | null;
  created_at: string;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  boxShortId?: string;
  boxId?: string;
}

type Mode = "search" | "ask";

interface ParsedQuery {
  text: string;
  from: string | null;
  in: string | null;
  before: string | null;
  has: string | null;
}

function parseSearchQuery(raw: string): ParsedQuery {
  let text = raw;
  let from: string | null = null;
  let inCh: string | null = null;
  let before: string | null = null;
  let has: string | null = null;

  // Extract from:username
  const fromMatch = text.match(/\bfrom:(\S+)/i);
  if (fromMatch) {
    from = fromMatch[1];
    text = text.replace(fromMatch[0], "");
  }

  // Extract in:channel
  const inMatch = text.match(/\bin:(\S+)/i);
  if (inMatch) {
    inCh = inMatch[1];
    text = text.replace(inMatch[0], "");
  }

  // Extract before:date
  const beforeMatch = text.match(/\bbefore:(\S+)/i);
  if (beforeMatch) {
    before = beforeMatch[1];
    text = text.replace(beforeMatch[0], "");
  }

  // Extract has:link/image/file
  const hasMatch = text.match(/\bhas:(\S+)/i);
  if (hasMatch) {
    has = hasMatch[1];
    text = text.replace(hasMatch[0], "");
  }

  return { text: text.trim(), from, in: inCh, before, has };
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="bg-white/15 text-white rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const RECENT_SEARCHES_KEY = "cb_recent_searches";
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const existing = getRecentSearches();
  const filtered = existing.filter((s) => s !== trimmed);
  const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

function truncateAround(text: string, query: string, maxLen = 120) {
  const firstWord = query.trim().split(/\s+/)[0]?.toLowerCase();
  if (!firstWord || text.length <= maxLen) return text;

  const idx = text.toLowerCase().indexOf(firstWord);
  if (idx === -1) return text.slice(0, maxLen) + "...";

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + maxLen - 40);
  return (start > 0 ? "..." : "") + text.slice(start, end) + (end < text.length ? "..." : "");
}

export function SearchModal({ open, onClose, boxShortId, boxId }: SearchModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ask AI state
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiSources, setAiSources] = useState<AskSource[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Active filters parsed from query
  const [activeFilters, setActiveFilters] = useState<ParsedQuery>({ text: "", from: null, in: null, before: null, has: null });

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
      setAiAnswer("");
      setAiSources([]);
      setMode("search");
      setActiveFilters({ text: "", from: null, in: null, before: null, has: null });
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Debounced search
  const doSearch = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const parsed = parseSearchQuery(q);
      setActiveFilters(parsed);

      if (parsed.text.length < 2 && !parsed.from && !parsed.in && !parsed.has) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        const params = new URLSearchParams();
        if (parsed.text) params.set("q", parsed.text);
        else params.set("q", q.replace(/\b(from|in|before|has):\S+/gi, "").trim() || "*");
        if (boxId) params.set("box_id", boxId);
        if (parsed.from) params.set("from", parsed.from);
        if (parsed.in) params.set("in", parsed.in);
        if (parsed.before) params.set("before", parsed.before);
        if (parsed.has) params.set("has", parsed.has);

        const res = await fetch(`/api/messages/search?${params}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setSelectedIdx(0);
        setLoading(false);
      }, 300);
    },
    [boxId]
  );

  async function askAI() {
    const q = query.trim();
    if (q.length < 3 || aiLoading) return;

    setAiLoading(true);
    setAiAnswer("");
    setAiSources([]);

    try {
      const res = await fetch("/api/messages/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, box_id: boxId }),
      });
      const data = await res.json();
      setAiAnswer(data.answer ?? "No answer available.");
      setAiSources(data.sources ?? []);
    } catch {
      setAiAnswer("Something went wrong. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (mode === "search") {
      doSearch(val);
    }
  }

  function navigateToResult(result: SearchResult) {
    saveRecentSearch(query);
    setRecentSearches(getRecentSearches());
    onClose();
    if (result.channel_id && result.channel_short_id && result.box_short_id) {
      router.push(`/box/${result.box_short_id}/c/${result.channel_short_id}`);
    } else if (result.conversation_id) {
      const base = `/dm/${result.conversation_id}`;
      router.push(boxShortId ? `${base}?box=${boxShortId}` : base);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (mode === "search") {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIdx]) {
          navigateToResult(results[selectedIdx]);
        } else if (query.trim().length >= 2) {
          saveRecentSearch(query);
          setRecentSearches(getRecentSearches());
        }
      }
    } else if (mode === "ask") {
      if (e.key === "Enter") {
        e.preventDefault();
        askAI();
      }
    }
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setResults([]);
    setAiAnswer("");
    setAiSources([]);
    if (newMode === "search" && query.trim().length >= 2) {
      doSearch(query);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function insertFilter(filter: string) {
    const val = query + (query && !query.endsWith(" ") ? " " : "") + filter;
    setQuery(val);
    inputRef.current?.focus();
    if (mode === "search") {
      doSearch(val);
    }
  }

  if (!open) return null;

  const hasActiveFilters = activeFilters.from || activeFilters.in || activeFilters.before || activeFilters.has;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[560px] overflow-hidden rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.6)]">
        {/* Mode tabs */}
        <div className="flex border-b border-[#1a1a1a]">
          <button
            onClick={() => switchMode("search")}
            className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-colors ${
              mode === "search"
                ? "border-b-2 border-white text-white"
                : "text-[#555] hover:text-[#888]"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </button>
          <button
            onClick={() => switchMode("ask")}
            className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-colors ${
              mode === "ask"
                ? "border-b-2 border-white text-white"
                : "text-[#555] hover:text-[#888]"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask AI
          </button>
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 border-b border-[#1a1a1a] px-4 py-3">
          {mode === "search" ? (
            <Search className="h-4 w-4 shrink-0 text-[#555]" />
          ) : (
            <Sparkles className="h-4 w-4 shrink-0 text-[#555]" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "search"
                ? "Search messages... (try from:name in:channel before:date has:link)"
                : "Ask a question about your conversations..."
            }
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[#555] focus:outline-none"
          />
          {query && (
            <Tooltip label="Clear search">
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setAiAnswer("");
                  setAiSources([]);
                  setActiveFilters({ text: "", from: null, in: null, before: null, has: null });
                  inputRef.current?.focus();
                }}
                className="flex h-5 w-5 items-center justify-center rounded text-[#555] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          )}
          {mode === "ask" && query.trim().length >= 3 && (
            <Tooltip label="Ask AI">
              <button
                onClick={askAI}
                disabled={aiLoading}
                className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-white text-black transition-colors hover:bg-[#e0e0e0] disabled:bg-[#333] disabled:text-[#666]"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          )}
          <kbd className="rounded bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] text-[#444]">ESC</kbd>
        </div>

        {/* Active filter pills */}
        {mode === "search" && hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 border-b border-[#1a1a1a] px-4 py-2">
            {activeFilters.from && (
              <span className="rounded-full bg-[#276ef1]/15 px-2 py-0.5 text-[11px] text-[#276ef1]">
                from:{activeFilters.from}
              </span>
            )}
            {activeFilters.in && (
              <span className="rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[11px] text-[#22c55e]">
                in:{activeFilters.in}
              </span>
            )}
            {activeFilters.before && (
              <span className="rounded-full bg-[#f59e0b]/15 px-2 py-0.5 text-[11px] text-[#f59e0b]">
                before:{activeFilters.before}
              </span>
            )}
            {activeFilters.has && (
              <span className="rounded-full bg-[#a855f7]/15 px-2 py-0.5 text-[11px] text-[#a855f7]">
                has:{activeFilters.has}
              </span>
            )}
          </div>
        )}

        {/* Content area */}
        <div className="max-h-[400px] overflow-auto">
          {/* ── Search mode ── */}
          {mode === "search" && (
            <>
              {loading && results.length === 0 && (
                <div className="px-4 py-8 text-center text-[13px] text-[#555]">
                  Searching...
                </div>
              )}

              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <div className="px-4 py-8 text-center text-[13px] text-[#555]">
                  No messages found
                </div>
              )}

              {query.trim().length < 2 && !hasActiveFilters && (
                <div className="px-4 py-6">
                  {/* Recent searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                          Recent searches
                        </span>
                        <button
                          onClick={() => {
                            clearRecentSearches();
                            setRecentSearches([]);
                          }}
                          className="text-[11px] text-[#444] transition-colors hover:text-[#888]"
                        >
                          Clear history
                        </button>
                      </div>
                      <div className="space-y-0.5">
                        {recentSearches.map((term) => (
                          <div
                            key={term}
                            className="group flex items-center gap-2.5 rounded-[6px] px-2 py-1.5 transition-colors hover:bg-[#1a1a1a]"
                          >
                            <Clock className="h-3.5 w-3.5 shrink-0 text-[#444]" />
                            <button
                              onClick={() => {
                                setQuery(term);
                                doSearch(term);
                                inputRef.current?.focus();
                              }}
                              className="min-w-0 flex-1 truncate text-left text-[13px] text-[#888] transition-colors hover:text-white"
                            >
                              {term}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = recentSearches.filter((s) => s !== term);
                                setRecentSearches(updated);
                                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
                              }}
                              className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[#333] opacity-0 transition-all hover:text-[#888] group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-center text-[13px] text-[#555]">
                    Type at least 2 characters to search
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {[
                      { label: "from:", example: "from:john" },
                      { label: "in:", example: "in:general" },
                      { label: "before:", example: "before:2025-01-01" },
                      { label: "has:link", example: "has:link" },
                    ].map((f) => (
                      <button
                        key={f.label}
                        onClick={() => insertFilter(f.example)}
                        className="rounded-full border border-[#1a1a1a] px-2.5 py-1 text-[11px] text-[#555] transition-colors hover:border-[#333] hover:text-[#888]"
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.map((result, i) => {
                const isSelected = i === selectedIdx;
                const time = new Date(result.created_at).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                });
                const senderInitials = result.sender_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <button
                    key={result.id}
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    className={`flex w-full gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? "bg-[#1a1a1a]" : "hover:bg-[#141414]"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {result.sender_avatar_url ? (
                        <img
                          src={result.sender_avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#222] text-[10px] font-bold text-white">
                          {senderInitials}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-white">
                          {result.sender_name}
                        </span>
                        <span className="text-[11px] text-[#444]">{time}</span>
                        {result.channel_name && (
                          <span className="ml-auto flex items-center gap-1 text-[11px] text-[#444]">
                            <Hash className="h-3 w-3" />
                            {result.channel_name}
                          </span>
                        )}
                        {result.conversation_id && !result.channel_id && (
                          <span className="ml-auto flex items-center gap-1 text-[11px] text-[#444]">
                            <MessageSquare className="h-3 w-3" />
                            DM
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[13px] leading-[20px] text-[#888]">
                        {highlightMatch(truncateAround(result.content, activeFilters.text || query), activeFilters.text || query)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* ── Ask AI mode ── */}
          {mode === "ask" && (
            <>
              {!aiLoading && !aiAnswer && (
                <div className="px-4 py-8 text-center">
                  <Sparkles className="mx-auto mb-3 h-8 w-8 text-[#333]" />
                  <p className="text-[13px] text-[#555]">
                    Ask a question about your conversations
                  </p>
                  <p className="mt-1 text-[11px] text-[#444]">
                    e.g. &quot;What did we decide on the budget?&quot;
                  </p>
                </div>
              )}

              {aiLoading && (
                <div className="px-4 py-8">
                  <Spinner size="sm" label="Thinking..." center className="text-[#555]" />
                </div>
              )}

              {aiAnswer && !aiLoading && (
                <div className="px-4 py-4">
                  {/* Answer */}
                  <div className="rounded-[8px] bg-[#0a0a0a] p-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#888]" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#555]">
                        AI Answer
                      </span>
                    </div>
                    <Markdown className="text-[13px] leading-[20px]">
                      {aiAnswer}
                    </Markdown>
                  </div>

                  {/* Sources */}
                  {aiSources.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                        Based on {aiSources.length} message{aiSources.length > 1 ? "s" : ""}
                      </span>
                      <div className="mt-1.5 space-y-1">
                        {aiSources.map((source) => {
                          const time = new Date(source.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          });
                          return (
                            <div
                              key={source.id}
                              className="rounded-[6px] bg-[#141414] px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-medium text-[#888]">
                                  {source.sender_name}
                                </span>
                                <span className="text-[10px] text-[#444]">{time}</span>
                                {source.channel_name && (
                                  <span className="ml-auto flex items-center gap-1 text-[10px] text-[#444]">
                                    <Hash className="h-2.5 w-2.5" />
                                    {source.channel_name}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[12px] leading-[18px] text-[#666]">
                                {source.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {mode === "search" && results.length > 0 && (
          <div className="border-t border-[#1a1a1a] px-4 py-2 text-[11px] text-[#444]">
            <kbd className="rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#555]">↑↓</kbd>{" "}
            navigate{" "}
            <kbd className="ml-2 rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#555]">Enter</kbd>{" "}
            open
          </div>
        )}
        {mode === "ask" && !aiLoading && !aiAnswer && query.trim().length >= 3 && (
          <div className="border-t border-[#1a1a1a] px-4 py-2 text-[11px] text-[#444]">
            <kbd className="rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#555]">Enter</kbd>{" "}
            to ask
          </div>
        )}
      </div>
    </div>
  );
}
