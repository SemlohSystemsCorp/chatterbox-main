"use client";

import { useState } from "react";
import Link from "next/link";
import { CommentDiscussionIcon as MessageSquare, ThreeBarsIcon as Menu, XIcon as X } from "@primer/octicons-react";

const navLinks = [
  { label: "Download", href: "/download" },
  { label: "Pricing", href: "/pricing" },
  { label: "Why Chatterbox?", href: "/why-chatterbox" },
  { label: "About", href: "/about" },
];

export function MarketingNav({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="logo-glass flex h-7 w-7 items-center justify-center rounded-lg bg-white">
              <MessageSquare className="h-3.5 w-3.5 text-black" />
            </div>
            <span className="text-[16px] font-bold tracking-[-0.01em] text-white">
              Chatterbox
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-[13px] text-[#777] transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-white px-4 py-1.5 text-[13px] font-medium text-black transition-colors hover:bg-[#e8e8e8]"
            >
              Open Chatterbox
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-1.5 text-[13px] font-medium text-[#999] transition-colors hover:text-white sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-white px-4 py-1.5 text-[13px] font-medium text-black transition-colors hover:bg-[#e8e8e8]"
              >
                Get started
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-[#777] transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-6xl space-y-1 px-6 py-4">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-[14px] text-[#999] transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            {!isLoggedIn && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-[14px] text-[#999] transition-colors hover:bg-white/[0.04] hover:text-white sm:hidden"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="logo-glass flex h-6 w-6 items-center justify-center rounded-md bg-white">
                <MessageSquare className="h-3 w-3 text-black" />
              </div>
              <span className="text-[15px] font-bold text-white">
                Chatterbox
              </span>
            </div>
            <p className="max-w-xs text-[13px] leading-[20px] text-[#555]">
              Team communication, done right.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-12">
            {[
              {
                title: "Product",
                links: [
                  { label: "Features", href: "/features" },
                  { label: "Download", href: "/download" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "Security", href: "/security" },
                  { label: "Changelog", href: "/changelog" },
                  { label: "Status", href: "/status" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About", href: "/about" },
                  { label: "Blog", href: "/blog" },
                  { label: "Careers", href: "/careers" },
                  { label: "Contact sales", href: "mailto:sales@getchatterbox.app" },
                  { label: "Contact", href: "/contact" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Privacy", href: "/privacy" },
                  { label: "Terms", href: "/terms" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#555]">
                  {col.title}
                </h4>
                <ul className="space-y-2 text-[13px] text-[#444]">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-white/[0.06] pt-10">
          <p className="text-[13px] text-[#444]">
            &copy; {new Date().getFullYear()} Chatterbox. All rights reserved.
          </p>
          <p className="mt-4 text-[72px] font-bold leading-none tracking-[-0.04em] text-[#1a1a1a] md:text-[96px] lg:text-[120px]">
            Chatterbox
          </p>
        </div>
      </div>
    </footer>
  );
}
