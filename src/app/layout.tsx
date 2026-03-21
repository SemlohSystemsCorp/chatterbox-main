import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TauriGlass } from "@/components/tauri-glass";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const APP_NAME = "Chatterbox";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://getchatterbox.app";
const APP_DESCRIPTION =
  "Chatterbox is a modern team communication platform with real-time messaging, video calls, AI-powered features, and a beautiful UI.";

export const metadata: Metadata = {
  title: {
    default: "Chatterbox — The best way to communicate",
    template: "%s — Chatterbox",
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "team chat",
    "messaging",
    "communication",
    "slack alternative",
    "video calls",
    "real-time messaging",
    "AI chat",
    "team collaboration",
    "workspace",
    "channels",
    "direct messages",
  ],
  authors: [{ name: "Chatterbox" }],
  creator: "Chatterbox",
  publisher: "Chatterbox",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: "Chatterbox — The best way to communicate",
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Chatterbox — The best way to communicate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chatterbox — The best way to communicate",
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(window.__TAURI_INTERNALS__||window.__TAURI__)document.documentElement.setAttribute("data-tauri","")}catch(e){}`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[var(--cb-bg)] text-[var(--cb-text)]`}>
        <TauriGlass />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
