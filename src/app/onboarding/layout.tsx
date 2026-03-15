import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Welcome",
  description: "Set up your Chatterbox profile and get started.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <header className="h-16 shrink-0 bg-[#111] border-b border-[#1a1a1a] px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-[1440px] items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
              <MessageSquare className="h-4 w-4 text-black" />
            </div>
            <span className="text-[18px] font-bold text-white">Chatterbox</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-6 pt-12 pb-16 lg:pt-20">
        <div className="w-full max-w-[480px]">{children}</div>
      </main>
    </div>
  );
}
