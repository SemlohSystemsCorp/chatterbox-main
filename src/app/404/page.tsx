import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--cb-bg)] px-4 text-center">
      <div className="max-w-md">
        <p className="text-[80px] font-bold leading-none text-white">404</p>
        <h1 className="mt-4 text-[24px] font-semibold text-white">
          Page not found
        </h1>
        <p className="mt-3 text-[16px] text-[#888]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
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
