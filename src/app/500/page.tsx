import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Server Error",
};

export default function ServerErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--cb-bg)] px-4 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1a1a]">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#de1135"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="mt-6 text-[24px] font-semibold text-white">
          Something went wrong
        </h1>
        <p className="mt-3 text-[16px] text-[#888]">
          An unexpected error occurred on our end. Please try again later.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-[48px] items-center justify-center rounded-[8px] bg-white px-5 text-[16px] font-medium text-black transition-colors hover:bg-[#e0e0e0] active:bg-[#ccc]"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-[48px] items-center justify-center rounded-[8px] bg-[#1a1a1a] px-5 text-[16px] font-medium text-white transition-colors hover:bg-[#252525] active:bg-[#333]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
