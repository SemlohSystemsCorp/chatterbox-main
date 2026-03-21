"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DailyProvider,
  useDaily,
  useLocalParticipant,
  useParticipantIds,
  useScreenShare,
  useActiveSpeakerId,
  useAppMessage,
  useDailyEvent,
  DailyVideo,
  DailyAudio,
} from "@daily-co/daily-react";
import { UnmuteIcon as Mic, MuteIcon as MicOff, DeviceCameraVideoIcon as Video, EyeClosedIcon as VideoOff, NoEntryIcon as PhoneOff, DeviceDesktopIcon as Monitor, ScreenNormalIcon as MonitorOff, PeopleIcon as Users, CommentDiscussionIcon as MessageSquare, PaperAirplaneIcon as Send, XIcon as X } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";

interface CallData {
  id: string;
  room_name: string;
  room_url: string;
  channel_id: string | null;
  conversation_id: string | null;
  started_by: string;
  started_at: string;
}

interface CallPageClientProps {
  call: CallData;
  token: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  returnTo: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export function CallPageClient({
  call,
  token,
  userId,
  userName,
  userAvatar,
  returnTo,
}: CallPageClientProps) {
  return (
    <DailyProvider>
      <CallUI
        call={call}
        token={token}
        userId={userId}
        userName={userName}
        userAvatar={userAvatar}
        returnTo={returnTo}
      />
      <DailyAudio />
    </DailyProvider>
  );
}

// ── Elapsed timer ──

function useElapsedTime(startedAt: string) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    function update() {
      const diff = Date.now() - new Date(startedAt).getTime();
      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setElapsed(
        h > 0
          ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
          : `${m}:${String(s).padStart(2, "0")}`
      );
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

// ── Participant tile ──

function ParticipantTile({
  sessionId,
  isLocal,
  userName,
  avatarUrl,
  isActiveSpeaker,
  isVideoOff,
  isAudioOff,
  isSmall,
}: {
  sessionId: string;
  isLocal: boolean;
  userName: string;
  avatarUrl: string | null;
  isActiveSpeaker: boolean;
  isVideoOff: boolean;
  isAudioOff: boolean;
  isSmall?: boolean;
}) {
  const [avatarBroken, setAvatarBroken] = useState(false);

  const showAvatar = avatarUrl && !avatarBroken;

  return (
    <div
      className={`relative overflow-hidden rounded-[12px] bg-[#111] ${
        isActiveSpeaker ? "ring-2 ring-[#22c55e]" : ""
      }`}
    >
      {isVideoOff ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {showAvatar ? (
            <img
              src={avatarUrl}
              alt={userName}
              onError={() => setAvatarBroken(true)}
              className={`rounded-full object-cover ${
                isSmall ? "h-12 w-12" : "h-20 w-20"
              }`}
            />
          ) : (
            <div
              className={`flex items-center justify-center rounded-full bg-[#1a1a1a] font-bold text-white ${
                isSmall ? "h-12 w-12 text-[16px]" : "h-20 w-20 text-[24px]"
              }`}
            >
              {(userName || "?")[0].toUpperCase()}
            </div>
          )}
        </div>
      ) : (
        <DailyVideo
          automirror={isLocal}
          sessionId={sessionId}
          type="video"
          className="h-full w-full object-cover"
        />
      )}
      {/* Mute / camera-off indicators */}
      {(isAudioOff || isVideoOff) && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {isAudioOff && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"}
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
          )}
          {isVideoOff && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"}
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
              </svg>
            </div>
          )}
        </div>
      )}
      {/* Name badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1">
        {isActiveSpeaker && (
          <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
        )}
        <span className="text-[11px] font-medium text-white">
          {isLocal ? "You" : userName}
        </span>
      </div>
    </div>
  );
}

// ── Main call UI ──

function CallUI({
  call,
  token,
  userId,
  userName,
  userAvatar,
  returnTo,
}: {
  call: CallData;
  token: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  returnTo: string;
}) {
  const router = useRouter();
  const daily = useDaily();
  const localParticipant = useLocalParticipant();
  const remoteIds = useParticipantIds({ filter: "remote" });
  const activeSpeakerId = useActiveSpeakerId({ ignoreLocal: false });
  const { screens, isSharingScreen, startScreenShare, stopScreenShare } =
    useScreenShare();

  const [leaving, setLeaving] = useState(false);
  const [joinState, setJoinState] = useState<
    "idle" | "joining" | "joined" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const hasJoined = useRef(false);

  // Remote participant avatars fetched from Supabase
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const elapsed = useElapsedTime(call.started_at);

  const isMuted = !localParticipant?.audio;
  const isVideoOff = !localParticipant?.video;

  // Join the call once daily is ready
  useEffect(() => {
    if (!daily || joinState !== "idle") return;

    setJoinState("joining");
    daily
      .join({
        url: call.room_url,
        token,
        userName,
      })
      .then(() => {
        hasJoined.current = true;
        setJoinState("joined");
      })
      .catch((err) => {
        console.error("Failed to join call:", err);
        setJoinState("error");
        setError(err?.message || "Failed to join call");
      });
  }, [daily, joinState, call.room_url, token, userName]);

  // In-call chat
  const sendAppMessage = useAppMessage({
    onAppMessage(ev) {
      if (ev.data?.type === "chat") {
        const msg: ChatMessage = {
          id: `${ev.data.sender}-${Date.now()}`,
          sender: ev.data.senderName,
          text: ev.data.text,
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, msg]);
        if (!chatOpen) setUnreadCount((c) => c + 1);
      }
    },
  });

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useDailyEvent("left-meeting", () => {
    if (!leaving && hasJoined.current) {
      // Only redirect if we actually were in the call (kicked/disconnected)
      router.push(returnTo);
    }
  });

  useDailyEvent("error", (ev) => {
    console.error("[Daily error]", ev);
    if (joinState !== "joined") {
      setJoinState("error");
      setError(ev?.errorMsg || "Connection error");
    }
  });

  // Fetch avatars for remote participants from Supabase
  useEffect(() => {
    if (!daily || remoteIds.length === 0) return;
    const participants = daily.participants();
    const unknownIds: string[] = [];

    for (const sid of remoteIds) {
      const p = participants[sid];
      const uid = p?.user_id;
      if (uid && !(sid in avatars)) {
        unknownIds.push(uid);
      }
    }

    if (unknownIds.length === 0) return;

    // Fetch from Supabase
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      Promise.resolve(
        supabase
          .from("profiles")
          .select("id, avatar_url")
          .in("id", unknownIds)
      ).then(({ data }) => {
        if (!data) return;
        const map: Record<string, string | null> = {};
        const participants = daily.participants();
        for (const sid of remoteIds) {
          const p = participants[sid];
          const profile = data.find((d) => d.id === p?.user_id);
          if (profile) {
            map[sid] = profile.avatar_url;
          }
        }
        setAvatars((prev) => ({ ...prev, ...map }));
      }).catch((err) => {
          console.warn("Failed to fetch participant avatars:", err);
          // Set null for unknown IDs so they show initials
          const fallback: Record<string, string | null> = {};
          const participants = daily.participants();
          for (const sid of remoteIds) {
            if (!(sid in avatars)) {
              fallback[sid] = null;
            }
          }
          if (Object.keys(fallback).length > 0) {
            setAvatars((prev) => ({ ...prev, ...fallback }));
          }
        });
    }).catch((err) => {
      console.warn("Failed to load supabase client for avatars:", err);
      const fallback: Record<string, string | null> = {};
      for (const sid of remoteIds) {
        if (!(sid in avatars)) {
          fallback[sid] = null;
        }
      }
      if (Object.keys(fallback).length > 0) {
        setAvatars((prev) => ({ ...prev, ...fallback }));
      }
    });
  }, [daily, remoteIds, avatars]);

  // Get participant names from daily
  const getParticipantName = useCallback(
    (sessionId: string) => {
      if (!daily) return "Unknown";
      const p = daily.participants();
      if (sessionId === "local" || sessionId === localParticipant?.session_id) {
        return "You";
      }
      return p[sessionId]?.user_name || "Guest";
    },
    [daily, localParticipant?.session_id]
  );

  const getParticipantVideoOff = useCallback(
    (sessionId: string) => {
      if (!daily) return true;
      if (sessionId === localParticipant?.session_id) {
        return !localParticipant?.video;
      }
      const p = daily.participants();
      return !p[sessionId]?.video;
    },
    [daily, localParticipant?.session_id, localParticipant?.video]
  );

  const getParticipantAudioOff = useCallback(
    (sessionId: string) => {
      if (!daily) return true;
      if (sessionId === localParticipant?.session_id) {
        return !localParticipant?.audio;
      }
      const p = daily.participants();
      return !p[sessionId]?.audio;
    },
    [daily, localParticipant?.session_id, localParticipant?.audio]
  );

  const getParticipantAvatar = useCallback(
    (sessionId: string) => {
      if (sessionId === localParticipant?.session_id) {
        return userAvatar;
      }
      return avatars[sessionId] ?? null;
    },
    [localParticipant?.session_id, userAvatar, avatars]
  );

  const toggleAudio = useCallback(() => {
    daily?.setLocalAudio(!localParticipant?.audio);
  }, [daily, localParticipant?.audio]);

  const toggleVideo = useCallback(() => {
    daily?.setLocalVideo(!localParticipant?.video);
  }, [daily, localParticipant?.video]);

  const toggleScreen = useCallback(() => {
    if (isSharingScreen) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [isSharingScreen, startScreenShare, stopScreenShare]);

  const leaveCall = useCallback(async () => {
    setLeaving(true);
    try {
      await daily?.leave();
    } catch {
      // Already left
    }

    await fetch("/api/calls/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call_id: call.id }),
    });

    router.push(returnTo);
  }, [daily, call.id, returnTo, router]);

  const sendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    sendAppMessage(
      { type: "chat", text, sender: userId, senderName: userName },
      "*"
    );
    setChatMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, sender: "You", text, timestamp: Date.now() },
    ]);
    setChatInput("");
  }, [chatInput, sendAppMessage, userId, userName]);

  const toggleChat = useCallback(() => {
    setChatOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  // Keyboard shortcuts for call controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "d") {
          e.preventDefault();
          toggleAudio();
        } else if (e.key === "e") {
          e.preventDefault();
          toggleVideo();
        } else if (e.key === "s") {
          e.preventDefault();
          toggleScreen();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleAudio, toggleVideo, toggleScreen]);

  // Loading / error states
  if (joinState === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <p className="text-[14px] text-[#de1135]">{error}</p>
        <button
          onClick={() => router.push(returnTo)}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] text-white hover:bg-[#222]"
        >
          Go back
        </button>
      </div>
    );
  }

  if (joinState !== "joined") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#0a0a0a]">
        <Spinner size="lg" />
        <p className="text-[13px] text-[#888]">Joining call...</p>
      </div>
    );
  }

  const totalParticipants = remoteIds.length + 1;
  const hasScreenShare = screens.length > 0;

  // Build participant list for grid
  const allSessionIds = [
    ...(localParticipant ? [localParticipant.session_id] : []),
    ...remoteIds,
  ];

  // Grid cols when no screen share
  const gridCols =
    allSessionIds.length <= 1
      ? "grid-cols-1"
      : allSessionIds.length <= 4
        ? "grid-cols-2"
        : allSessionIds.length <= 9
          ? "grid-cols-3"
          : "grid-cols-4";

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#1a1a1a] px-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#22c55e]" />
          <span className="text-[13px] font-medium text-white">In call</span>
          <span className="font-mono text-[12px] text-[#555]">{elapsed}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[#555]" />
            <span className="text-[12px] text-[#555]">{totalParticipants}</span>
          </div>
          <button
            onClick={toggleChat}
            className="relative flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="text-[12px]">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#22c55e] text-[9px] font-bold text-black">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 overflow-hidden p-3">
          {hasScreenShare ? (
            /* Screen share layout: screen takes center, tiles on right */
            <div className="flex h-full gap-3">
              {/* Screen share main view */}
              <div className="flex-1 overflow-hidden rounded-[12px] bg-[#111]">
                <DailyVideo
                  sessionId={screens[0].session_id}
                  type="screenVideo"
                  className="h-full w-full object-contain"
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1">
                  <Monitor className="h-3 w-3 text-[#22c55e]" />
                  <span className="text-[11px] font-medium text-white">
                    {screens[0].local
                      ? "Your screen"
                      : `${getParticipantName(screens[0].session_id)}'s screen`}
                  </span>
                </div>
              </div>
              {/* Participant tiles sidebar */}
              <div className="flex w-48 flex-col gap-2">
                {allSessionIds.map((sid) => (
                  <div key={sid} className="h-32">
                    <ParticipantTile
                      sessionId={sid}
                      isLocal={sid === localParticipant?.session_id}
                      userName={
                        sid === localParticipant?.session_id
                          ? userName
                          : getParticipantName(sid)
                      }
                      avatarUrl={getParticipantAvatar(sid)}
                      isActiveSpeaker={activeSpeakerId === sid}
                      isVideoOff={getParticipantVideoOff(sid)}
                      isAudioOff={getParticipantAudioOff(sid)}
                      isSmall
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Regular grid layout */
            <div className={`grid ${gridCols} h-full gap-3`}>
              {allSessionIds.map((sid) => (
                <ParticipantTile
                  key={sid}
                  sessionId={sid}
                  isLocal={sid === localParticipant?.session_id}
                  userName={
                    sid === localParticipant?.session_id
                      ? userName
                      : getParticipantName(sid)
                  }
                  avatarUrl={getParticipantAvatar(sid)}
                  isActiveSpeaker={activeSpeakerId === sid}
                  isVideoOff={getParticipantVideoOff(sid)}
                  isAudioOff={getParticipantAudioOff(sid)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        {chatOpen && (
          <div className="flex w-80 flex-col border-l border-[#1a1a1a]">
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#1a1a1a] px-3">
              <span className="text-[13px] font-medium text-white">Chat</span>
              <Tooltip label="Close chat">
                <button
                  onClick={toggleChat}
                  className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] hover:bg-[#1a1a1a] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {chatMessages.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-[#444]">
                  No messages yet
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="mb-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[12px] font-semibold text-white">
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-[#444]">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[13px] leading-[18px] text-[#ccc]">
                      {msg.text}
                    </p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="shrink-0 border-t border-[#1a1a1a] p-2">
              <div className="flex items-center gap-2 rounded-[8px] border border-[#1a1a1a] bg-[#111] px-3 py-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                  placeholder="Send a message..."
                  className="flex-1 bg-transparent text-[13px] text-white placeholder-[#444] focus:outline-none"
                />
                <Tooltip label="Send message">
                  <button
                    onClick={sendChat}
                    disabled={!chatInput.trim()}
                    className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:text-white disabled:opacity-30"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex h-20 shrink-0 items-center justify-center gap-3 border-t border-[#1a1a1a]">
        <Tooltip label={isMuted ? "Unmute (⌘D)" : "Mute (⌘D)"}>
          <button
            onClick={toggleAudio}
            className={`group relative flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isMuted
                ? "bg-[#de1135] text-white"
                : "bg-[#1a1a1a] text-white hover:bg-[#222]"
            }`}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            <span className="absolute -bottom-5 text-[10px] text-[#555] opacity-0 transition-opacity group-hover:opacity-100">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </button>
        </Tooltip>

        <Tooltip label={isVideoOff ? "Turn on camera (⌘E)" : "Turn off camera (⌘E)"}>
          <button
            onClick={toggleVideo}
            className={`group relative flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isVideoOff
                ? "bg-[#de1135] text-white"
                : "bg-[#1a1a1a] text-white hover:bg-[#222]"
            }`}
          >
            {isVideoOff ? (
              <VideoOff className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
            <span className="absolute -bottom-5 text-[10px] text-[#555] opacity-0 transition-opacity group-hover:opacity-100">
              {isVideoOff ? "Turn on" : "Turn off"}
            </span>
          </button>
        </Tooltip>

        <Tooltip label={isSharingScreen ? "Stop sharing (⌘S)" : "Share screen (⌘S)"}>
          <button
            onClick={toggleScreen}
            className={`group relative flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isSharingScreen
                ? "bg-[#276ef1] text-white"
                : "bg-[#1a1a1a] text-white hover:bg-[#222]"
            }`}
          >
            {isSharingScreen ? (
              <MonitorOff className="h-5 w-5" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
            <span className="absolute -bottom-5 text-[10px] text-[#555] opacity-0 transition-opacity group-hover:opacity-100">
              Screen
            </span>
          </button>
        </Tooltip>

        <div className="mx-2 h-8 w-px bg-[#1a1a1a]" />

        <button
          onClick={leaveCall}
          disabled={leaving}
          className="group relative flex h-12 items-center gap-2 rounded-full bg-[#de1135] px-6 text-white transition-colors hover:bg-[#c50f2f] disabled:opacity-50"
        >
          <PhoneOff className="h-5 w-5" />
          <span className="text-[13px] font-medium">Leave</span>
        </button>
      </div>
    </div>
  );
}
