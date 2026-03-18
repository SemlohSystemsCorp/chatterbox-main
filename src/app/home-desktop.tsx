"use client";

import Link from "next/link";
import { CommentDiscussionIcon as MessageSquare } from "@primer/octicons-react";

export default function HomeDesktop() {
  return (
    <div className="flex h-screen flex-col bg-[var(--cb-bg)]">
      {/* Top bar — drag region for Tauri */}
      <div className="flex h-10 shrink-0 items-center justify-center" data-tauri-drag-region>
        <span className="text-[12px] font-medium text-[var(--cb-text-faint)]">Chatterbox</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--cb-text)] shadow-lg">
          <MessageSquare className="h-10 w-10 text-[var(--cb-bg)]" />
        </div>

        <h1 className="mb-2 text-[28px] font-semibold tracking-[-0.01em] text-[var(--cb-text)]">
          Welcome to Chatterbox
        </h1>
        <p className="mb-10 max-w-md text-center text-[14px] leading-[22px] text-[var(--cb-text-muted)]">
          Sign in or create an account to connect with your team.
        </p>

        {/* Sign in button — primary */}
        <Link
          href="/login"
          className="mb-3 flex h-11 w-72 items-center justify-center rounded-lg bg-[var(--cb-text)] text-[14px] font-semibold text-[var(--cb-bg)] transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Sign in
        </Link>

        {/* Sign up link */}
        <p className="text-[13px] text-[var(--cb-text-faint)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[var(--cb-text-secondary)] hover:text-[var(--cb-text)] transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-[var(--cb-border)] px-6 py-3">
        <span className="text-[11px] text-[var(--cb-text-faint)]">
          &copy; {new Date().getFullYear()} Chatterbox
        </span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="text-[11px] text-[var(--cb-text-faint)] transition-colors hover:text-[var(--cb-text-muted)]">
            Privacy
          </Link>
          <Link href="/terms" className="text-[11px] text-[var(--cb-text-faint)] transition-colors hover:text-[var(--cb-text-muted)]">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
