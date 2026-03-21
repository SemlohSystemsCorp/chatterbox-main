import type { Metadata } from "next";
import { CommentDiscussionIcon as MessageSquare } from "@primer/octicons-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your email address to complete your Chatterbox account setup.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <header className="h-16 shrink-0 bg-[#111] border-b border-[#1a1a1a] px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-[1440px] items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="logo-glass flex h-7 w-7 items-center justify-center rounded-md bg-white">
              <MessageSquare className="h-4 w-4 text-black" />
            </div>
            <span className="text-[18px] font-bold text-white">Chatterbox</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-6 pt-12 pb-16 lg:pt-20">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
