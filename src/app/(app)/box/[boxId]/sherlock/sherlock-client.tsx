"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PaperAirplaneIcon as Send, SmileyIcon as Smile, HubotIcon as Bot, SparklesFillIcon as Sparkles, OrganizationIcon as Building2, GlobeIcon as Globe, PlusIcon as Plus, TrashIcon as Trash, SidebarCollapseIcon as PanelLeft } from "@primer/octicons-react";
import { Markdown } from "@/components/ui/markdown";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { InviteModal } from "@/components/modals/invite-modal";
import { GroupDmModal } from "@/components/modals/group-dm-modal";
import { ChatSidebar, type SidebarCall, type SidebarConversation } from "@/components/chat/chat-sidebar";
import { usePresence } from "@/hooks/use-presence";
import type {
  BoxData,
  SidebarChannel,
  MemberData,
  UserData,
} from "@/lib/chat-helpers";

// ── Types ──

interface SherlockMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SherlockChat {
  id: string;
  title: string;
  mode: string;
  created_at: string;
  updated_at: string;
}

interface SherlockClientProps {
  user: UserData;
  boxes: BoxData[];
  box: BoxData & { description?: string | null };
  channels: SidebarChannel[];
  members: MemberData[];
  conversations: SidebarConversation[];
  activeCalls: SidebarCall[];
}

// ── Tabs ──

type SherlockTab = "workspace" | "general";

// ── Sherlock greeting ──

const SHERLOCK_GREETINGS = [
  "Elementary, my dear friend. How may I assist you today?",
  "Ah, a new case! What mystery shall we unravel?",
  "The game is afoot! What brings you to me?",
  "I've been expecting you. What's on your mind?",
  "At your service. Every puzzle has a solution — let's find yours.",
];

const GENERAL_GREETINGS = [
  "What can I help you with today?",
  "Ready to assist — ask me anything!",
  "At your service. What shall we work on?",
  "Fire away — I'm all ears.",
  "What's on your mind?",
];

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatChatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getGreeting(tab: SherlockTab) {
  const list = tab === "general" ? GENERAL_GREETINGS : SHERLOCK_GREETINGS;
  return list[Math.floor(Math.random() * list.length)];
}

// ── Component ──

export function SherlockClient({
  user,
  boxes,
  box,
  channels,
  members,
  conversations,
  activeCalls,
}: SherlockClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SherlockTab>("workspace");
  const [messages, setMessages] = useState<SherlockMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [dmLoading, setDmLoading] = useState<string | null>(null);

  // Chat persistence
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatList, setChatList] = useState<SherlockChat[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Modals
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [groupDmOpen, setGroupDmOpen] = useState(false);

  // Presence
  const { getStatus } = usePresence(box.id, user.id, user.fullName);

  // Load chat list for current tab
  const loadChatList = useCallback(async (mode: SherlockTab) => {
    try {
      const res = await fetch(`/api/ai/sherlock/chats?box_id=${box.id}&mode=${mode}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setChatList(data);
        return data as SherlockChat[];
      }
    } catch { /* ignore */ }
    return [];
  }, [box.id]);

  // Load messages for a specific chat
  const loadChatMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ai/sherlock/chats/${id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(
          data.map((m: { id: string; role: string; content: string; created_at: string }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.created_at,
          }))
        );
        setChatId(id);
      }
    } catch { /* ignore */ }
  }, []);

  // Create a new chat session
  const createNewChat = useCallback(async (mode: SherlockTab) => {
    try {
      const res = await fetch("/api/ai/sherlock/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ box_id: box.id, mode }),
      });
      const data = await res.json();
      if (data.id) {
        setChatId(data.id);
        setMessages([]);
        // Refresh the chat list
        loadChatList(mode);
        return data.id as string;
      }
    } catch { /* ignore */ }
    return null;
  }, [box.id, loadChatList]);

  // Initialize: load most recent chat or create one
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoadingChats(true);
      const chats = await loadChatList(activeTab);
      if (cancelled) return;
      if (chats.length > 0) {
        await loadChatMessages(chats[0].id);
      } else {
        const newId = await createNewChat(activeTab);
        if (newId && !cancelled) setChatId(newId);
      }
      setLoadingChats(false);
    }
    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSend() {
    const content = input.trim();
    if (!content || typing) return;

    // Ensure we have a chat session
    let activeChatId = chatId;
    if (!activeChatId) {
      activeChatId = await createNewChat(activeTab);
      if (!activeChatId) return;
    }

    const userMsg: SherlockMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      // Build conversation history (exclude the greeting message)
      const history = [...messages, userMsg]
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/sherlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          box_id: box.id,
          messages: history,
          mode: activeTab === "general" ? "general" : undefined,
          chat_id: activeChatId,
          user_content: content,
        }),
      });
      const data = await res.json();

      const assistantMsg: SherlockMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content || "I wasn't able to process that. Could you try rephrasing?",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh chat list to update title/ordering
      loadChatList(activeTab);
    } catch {
      const errorMsg: SherlockMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setTyping(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }

  async function handleNewChat() {
    const newId = await createNewChat(activeTab);
    if (newId) {
      setMessages([]);
      setChatId(newId);
      inputRef.current?.focus();
    }
  }

  async function handleSelectChat(id: string) {
    if (id === chatId) return;
    await loadChatMessages(id);
    setHistoryOpen(false);
    inputRef.current?.focus();
  }

  async function handleDeleteChat(id: string) {
    try {
      await fetch(`/api/ai/sherlock/chats/${id}`, { method: "DELETE" });
      const updated = chatList.filter((c) => c.id !== id);
      setChatList(updated);
      if (id === chatId) {
        if (updated.length > 0) {
          await loadChatMessages(updated[0].id);
        } else {
          const newId = await createNewChat(activeTab);
          if (newId) setMessages([]);
        }
      }
    } catch { /* ignore */ }
  }

  async function handleTabChange(tab: SherlockTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
  }

  async function startDm(targetUserId: string) {
    setDmLoading(targetUserId);
    try {
      const res = await fetch("/api/conversations/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: targetUserId }),
      });
      const data = await res.json();
      if (data.short_id) {
        router.push(`/dm/${data.short_id}?box=${box.short_id}`);
      }
    } finally {
      setDmLoading(null);
    }
  }

  const isNewChat = messages.length === 0;

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      <ChatSidebar
        user={user}
        boxes={boxes}
        box={box}
        channels={channels}
        members={members}
        currentUserId={user.id}
        getStatus={getStatus}
        onCreateChannel={() => setCreateChannelOpen(true)}
        onStartDm={startDm}
        onInvite={() => setInviteOpen(true)}
        activeCalls={activeCalls}
        dmLoading={dmLoading}
        conversations={conversations}
        onCreateGroupDm={() => setGroupDmOpen(true)}
        isSherlockActive
      />

      {/* Chat history panel */}
      {historyOpen && (
        <div className="flex w-[240px] shrink-0 flex-col border-r border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="flex h-12 items-center justify-between border-b border-[#1a1a1a] px-3">
            <span className="text-[13px] font-semibold text-white">Chat History</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewChat}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                title="New chat"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setHistoryOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                title="Close panel"
              >
                <PanelLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-2">
            {chatList.length === 0 && (
              <p className="px-3 py-4 text-center text-[12px] text-[#444]">No chats yet</p>
            )}
            {chatList.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 px-3 py-2 text-[13px] transition-colors cursor-pointer ${
                  chat.id === chatId
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#888] hover:bg-[#111] hover:text-white"
                }`}
                onClick={() => handleSelectChat(chat.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate">{chat.title}</div>
                  <div className="text-[10px] text-[#444]">{formatChatDate(chat.updated_at)}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#444] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#de1135]"
                  title="Delete chat"
                >
                  <Trash className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Sherlock header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#1a1a1a] px-4">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              title="Chat history"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#276ef1]">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-white">Sherlock</h1>
            </div>
            <span className="rounded bg-[#276ef1]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#276ef1]">
              AI Assistant
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="flex h-7 items-center gap-1.5 rounded-[6px] border border-[#1a1a1a] px-2 text-[12px] text-[#888] transition-colors hover:border-[#2a2a2a] hover:text-white"
            >
              <Plus className="h-3 w-3" />
              New Chat
            </button>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#276ef1]" />
              <span className="text-[11px] text-[#555]">Powered by Chatterbox AI</span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex shrink-0 border-b border-[#1a1a1a]">
          <button
            onClick={() => handleTabChange("workspace")}
            className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-colors ${
              activeTab === "workspace"
                ? "border-b-2 border-[#276ef1] text-white"
                : "text-[#555] hover:text-[#888]"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Workspace
          </button>
          <button
            onClick={() => handleTabChange("general")}
            className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-colors ${
              activeTab === "general"
                ? "border-b-2 border-[#276ef1] text-white"
                : "text-[#555] hover:text-[#888]"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            General
          </button>
        </div>

        {/* Messages */}
        <div className="relative flex-1 overflow-auto">
          <div className="px-4 py-4">
            {/* Welcome card — shown only for new/empty chats */}
            {isNewChat && (
              <div className="mb-6 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#276ef1]">
                    {activeTab === "general" ? (
                      <Globe className="h-6 w-6 text-white" />
                    ) : (
                      <Bot className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-white">
                      {activeTab === "general" ? "General Assistant" : "Meet Sherlock"}
                    </h2>
                    <p className="text-[12px] text-[#555]">
                      {activeTab === "general"
                        ? "Chat with Sherlock about anything"
                        : `Your AI assistant for ${box.name}`}
                    </p>
                  </div>
                </div>
                <p className="text-[13px] leading-[20px] text-[#888]">
                  {activeTab === "general"
                    ? "Ask me anything — brainstorm ideas, get coding help, draft emails, or just have a conversation. No workspace context here, just a general-purpose AI assistant."
                    : "I can help you brainstorm ideas, draft messages, answer questions about your workspace, and more. Just type a message below to get started."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(activeTab === "general"
                    ? [
                        "Help me brainstorm ideas",
                        "Explain a concept",
                        "Draft an email",
                        "Help me with code",
                      ]
                    : [
                        "Summarize today's activity",
                        "What decisions were made this week?",
                        "Draft an announcement",
                        "What can you help with?",
                      ]
                  ).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="rounded-full border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-1 text-[12px] text-[#666] transition-colors hover:border-[#2a2a2a] hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {loadingChats && messages.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <span className="text-[13px] text-[#555]">Loading chat...</span>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg) => (
              <div key={msg.id} className="mb-4 flex gap-3">
                {msg.role === "assistant" ? (
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#276ef1]">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="mt-0.5 h-8 w-8 shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1a] text-[10px] font-bold text-white">
                        {user.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || user.email[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-semibold text-white">
                      {msg.role === "assistant" ? "Sherlock" : user.fullName || user.email}
                    </span>
                    <span className="text-[10px] text-[#444]">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <Markdown className="mt-0.5 text-[14px] leading-[22px]">
                    {msg.content}
                  </Markdown>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="mb-4 flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#276ef1]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-1 pt-2">
                  <span className="text-[13px] font-semibold text-white">Sherlock</span>
                  <span className="ml-2 text-[12px] text-[#555]">is thinking</span>
                  <span className="ml-1 flex gap-0.5">
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[#555] [animation-delay:0ms]" />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[#555] [animation-delay:150ms]" />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[#555] [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message composer */}
        <div className="shrink-0 px-4 pb-4">
          <div className="rounded-[8px] border border-[#1a1a1a] bg-[#111] focus-within:border-[#2a2a2a]">
            <div className="flex items-end px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={activeTab === "general" ? "Ask anything..." : "Ask about your workspace..."}
                rows={1}
                className="max-h-[160px] min-h-[28px] flex-1 resize-none bg-transparent px-1 py-1 text-[14px] leading-[22px] text-white placeholder:text-[#555] focus:outline-none"
              />
              <button className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:text-white">
                <Smile className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-[#1a1a1a] px-3 py-1.5">
              <div className="text-[11px] text-[#444]">
                <kbd className="rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#555]">
                  Enter
                </kbd>{" "}
                to send ·{" "}
                <kbd className="rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#555]">
                  Shift+Enter
                </kbd>{" "}
                new line
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || typing}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#276ef1] text-white transition-colors hover:bg-[#1f5fd1] disabled:bg-[#1a1a1a] disabled:text-[#555]"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateChannelModal
        open={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        boxId={box.id}
        boxShortId={box.short_id}
      />
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        boxId={box.id}
        boxName={box.name}
      />
      <GroupDmModal
        open={groupDmOpen}
        onClose={() => setGroupDmOpen(false)}
        members={members}
        currentUserId={user.id}
        boxShortId={box.short_id}
      />
    </div>
  );
}
