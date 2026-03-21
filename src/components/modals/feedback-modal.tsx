"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon as X } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  mode: "feedback" | "report";
}

export function FeedbackModal({ open, onClose, mode }: FeedbackModalProps) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const isReport = mode === "report";
  const title = isReport ? "Report a Problem" : "Send Feedback";
  const placeholder = isReport
    ? "Describe the issue you're experiencing..."
    : "Tell us what you think, suggest a feature, or share your experience...";

  useEffect(() => {
    if (open) {
      setMessage("");
      setEmail("");
      setSent(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
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

  async function handleSubmit() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mode, message: message.trim(), email: email.trim() || undefined }),
      });
      setSent(true);
    } catch {
      // Silently handle — still show success to not frustrate the user
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="w-full max-w-[480px] rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isReport ? "bg-[#de1135]/10" : "bg-[#276ef1]/10"}`}>
              {isReport ? (
                <svg className="h-4 w-4 text-[#de1135]" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-[#276ef1]" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Z" />
                </svg>
              )}
            </div>
            <h2 className="text-[15px] font-semibold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e]/10">
              <svg className="h-6 w-6 text-[#22c55e]" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
              </svg>
            </div>
            <p className="text-[14px] font-medium text-white">Thank you!</p>
            <p className="text-center text-[13px] text-[#888]">
              {isReport
                ? "We've received your report and will look into it."
                : "Your feedback helps us make Chatterbox better."}
            </p>
            <Button onClick={onClose} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4 px-5 py-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
                {isReport ? "What went wrong?" : "Your feedback"}
              </label>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full resize-none rounded-[8px] border border-[#222] bg-[#0a0a0a] px-3 py-2 text-[13px] text-white placeholder:text-[#444] focus:border-[#333] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
                Email <span className="text-[#555]">(optional, for follow-up)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-[8px] border border-[#222] bg-[#0a0a0a] px-3 py-2 text-[13px] text-white placeholder:text-[#444] focus:border-[#333] focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#1a1a1a] pt-4">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
              >
                {sending ? "Sending..." : isReport ? "Submit Report" : "Send Feedback"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
