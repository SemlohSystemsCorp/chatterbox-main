"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon as X, CopyIcon as Copy, CheckIcon as Check, LinkIcon, MailIcon as Mail, PlusIcon as Plus, LoopIcon as Loader2 } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  boxId: string;
  boxName: string;
}

export function InviteModal({ open, onClose, boxId, boxName }: InviteModalProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Email invite state
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; total: number } | null>(null);
  const [sendError, setSendError] = useState("");

  const backdropRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setInviteCode(null);
      setCopied(false);
      setError("");
      setEmailInput("");
      setEmails([]);
      setSendResult(null);
      setSendError("");
      generateInvite();
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

  async function generateInvite() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          box_id: boxId,
          expires_in_hours: 168, // 7 days
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create invite");
      } else {
        setInviteCode(data.invite.code);
      }
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  function handleCopy() {
    if (!inviteCode) return;
    const link = `https://getchatterbox.app/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function addEmail() {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setSendError("Invalid email address");
      return;
    }
    if (emails.includes(trimmed)) {
      setSendError("Email already added");
      return;
    }
    if (emails.length >= 10) {
      setSendError("Maximum 10 emails at once");
      return;
    }
    setEmails((prev) => [...prev, trimmed]);
    setEmailInput("");
    setSendError("");
    emailInputRef.current?.focus();
  }

  function removeEmail(email: string) {
    setEmails((prev) => prev.filter((e) => e !== email));
  }

  function handleEmailKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
    if (e.key === "Backspace" && !emailInput && emails.length > 0) {
      setEmails((prev) => prev.slice(0, -1));
    }
  }

  async function handleSendEmails() {
    if (emails.length === 0) return;
    setSending(true);
    setSendError("");
    setSendResult(null);

    try {
      const res = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ box_id: boxId, emails }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "Failed to send invites");
      } else {
        setSendResult({ sent: data.sent, total: data.total });
        setEmails([]);
        setEmailInput("");
      }
    } catch {
      setSendError("Something went wrong");
    }
    setSending(false);
  }

  if (!open) return null;

  const inviteLink = inviteCode
    ? `https://getchatterbox.app/invite/${inviteCode}`
    : "";

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full max-w-[480px] rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-5 py-4">
          <h2 className="text-[16px] font-bold text-white">
            Invite people to {boxName}
          </h2>
          <Tooltip label="Close">
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {error && (
            <div className="rounded-[8px] bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-white" />
            </div>
          ) : inviteCode ? (
            <>
              {/* Email invite section */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#555]" />
                  <span className="text-[13px] font-medium text-white">Invite by email</span>
                </div>

                {/* Email chips + input */}
                <div className="rounded-[8px] border border-[#1a1a1a] bg-[#0a0a0a] p-2">
                  {emails.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {emails.map((email) => (
                        <span
                          key={email}
                          className="flex items-center gap-1 rounded-full bg-[#1a1a1a] px-2.5 py-1 text-[12px] text-[#ccc]"
                        >
                          {email}
                          <Tooltip label="Remove email">
                            <button
                              onClick={() => removeEmail(email)}
                              className="ml-0.5 text-[#555] hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Tooltip>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      ref={emailInputRef}
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setSendError("");
                      }}
                      onKeyDown={handleEmailKeyDown}
                      placeholder={emails.length > 0 ? "Add another email..." : "name@example.com"}
                      className="flex-1 bg-transparent text-[13px] text-white placeholder:text-[#444] focus:outline-none"
                    />
                    {emailInput.trim() && (
                      <Tooltip label="Add email">
                        <button
                          onClick={addEmail}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {sendError && (
                  <p className="mt-1.5 text-[12px] text-red-400">{sendError}</p>
                )}

                {sendResult && (
                  <p className="mt-1.5 text-[12px] text-[#22c55e]">
                    {sendResult.sent === sendResult.total
                      ? `${sendResult.sent} invite${sendResult.sent !== 1 ? "s" : ""} sent!`
                      : `${sendResult.sent} of ${sendResult.total} sent`}
                  </p>
                )}

                {emails.length > 0 && (
                  <Button
                    onClick={handleSendEmails}
                    disabled={sending}
                    size="sm"
                    className="mt-2.5 w-full"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-1.5 h-3.5 w-3.5" />
                        Send {emails.length} invite{emails.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#1a1a1a]" />
                <span className="text-[11px] text-[#444]">or share link</span>
                <div className="h-px flex-1 bg-[#1a1a1a]" />
              </div>

              {/* Link section */}
              <div>
                <p className="mb-2 text-[12px] text-[#555]">
                  Anyone with this link can join. Expires in 7 days.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-[8px] bg-[#0a0a0a] px-3 py-2.5">
                    <LinkIcon className="h-3.5 w-3.5 shrink-0 text-[#555]" />
                    <span className="truncate text-[12px] text-[#aaa]">
                      {inviteLink}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#1a1a1a] px-5 py-3">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
