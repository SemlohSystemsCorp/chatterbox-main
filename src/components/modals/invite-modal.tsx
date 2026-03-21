"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon as X, CopyIcon as Copy, CheckIcon as Check, LinkIcon, MailIcon as Mail, PlusIcon as Plus, ChevronDownIcon as ChevronDown, ShieldIcon as Shield, ClockIcon as Clock, PeopleIcon as People } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";

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

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expiresIn, setExpiresIn] = useState("168"); // 7 days in hours
  const [maxUses, setMaxUses] = useState(""); // unlimited
  const [inviteRole, setInviteRole] = useState("member");

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
      setShowAdvanced(false);
      setExpiresIn("168");
      setMaxUses("");
      setInviteRole("member");
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

  async function generateInvite(opts?: { expires?: string; uses?: string; role?: string }) {
    setLoading(true);
    setError("");
    const hours = parseInt(opts?.expires ?? expiresIn) || 168;
    const uses = parseInt(opts?.uses ?? maxUses) || undefined;
    const role = opts?.role ?? inviteRole;
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          box_id: boxId,
          expires_in_hours: hours,
          max_uses: uses,
          role,
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
    const link = `${process.env.NEXT_PUBLIC_APP_URL || "https://getchatterbox.app"}/invite/${inviteCode}`;
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
    ? `${process.env.NEXT_PUBLIC_APP_URL || "https://getchatterbox.app"}/invite/${inviteCode}`
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
            <div className="py-8">
              <Spinner center />
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
                        <Spinner size="xs" className="mr-1.5" />
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
                  Anyone with this link can join.
                  {" "}Expires in {expiresIn === "1" ? "1 hour" : expiresIn === "24" ? "1 day" : expiresIn === "168" ? "7 days" : expiresIn === "720" ? "30 days" : expiresIn === "0" ? "never" : `${expiresIn} hours`}.
                  {maxUses ? ` Limited to ${maxUses} use${maxUses === "1" ? "" : "s"}.` : ""}
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

              {/* Advanced settings */}
              <div className="rounded-[8px] border border-[#1a1a1a]">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-[13px] text-[#888] transition-colors hover:text-white"
                >
                  <span className="font-medium">Advanced settings</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                </button>

                {showAdvanced && (
                  <div className="space-y-3 border-t border-[#1a1a1a] px-3 py-3">
                    {/* Expiration */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[#888]">
                        <Clock className="h-3 w-3" />
                        Link expiration
                      </label>
                      <select
                        value={expiresIn}
                        onChange={(e) => setExpiresIn(e.target.value)}
                        className="w-full rounded-[6px] border border-[#222] bg-[#0a0a0a] px-2.5 py-2 text-[13px] text-white focus:border-[#333] focus:outline-none"
                      >
                        <option value="1">1 hour</option>
                        <option value="24">1 day</option>
                        <option value="168">7 days</option>
                        <option value="720">30 days</option>
                        <option value="0">Never</option>
                      </select>
                    </div>

                    {/* Max uses */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[#888]">
                        <People className="h-3 w-3" />
                        Max number of uses
                      </label>
                      <select
                        value={maxUses}
                        onChange={(e) => setMaxUses(e.target.value)}
                        className="w-full rounded-[6px] border border-[#222] bg-[#0a0a0a] px-2.5 py-2 text-[13px] text-white focus:border-[#333] focus:outline-none"
                      >
                        <option value="">No limit</option>
                        <option value="1">1 use</option>
                        <option value="5">5 uses</option>
                        <option value="10">10 uses</option>
                        <option value="25">25 uses</option>
                        <option value="50">50 uses</option>
                        <option value="100">100 uses</option>
                      </select>
                    </div>

                    {/* Role */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[#888]">
                        <Shield className="h-3 w-3" />
                        Default role for new members
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full rounded-[6px] border border-[#222] bg-[#0a0a0a] px-2.5 py-2 text-[13px] text-white focus:border-[#333] focus:outline-none"
                      >
                        <option value="member">Member — can send messages and join channels</option>
                        <option value="admin">Admin — can manage channels, members, and settings</option>
                      </select>
                    </div>

                    {/* Regenerate button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => generateInvite({ expires: expiresIn, uses: maxUses, role: inviteRole })}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? "Generating..." : "Generate new link with these settings"}
                    </Button>
                  </div>
                )}
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
