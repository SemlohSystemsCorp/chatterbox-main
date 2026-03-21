import { NextRequest, NextResponse } from "next/server";

const GITHUB_REPO = "SemlohSystemsCorp/chatterbox-main";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  assets: GitHubAsset[];
  html_url: string;
}

/** Map platform+arch to a substring that must appear in the asset filename. */
const ASSET_PATTERNS: Record<string, string[]> = {
  "mac-arm64": ["aarch64.dmg"],
  "mac-x64": ["x64.dmg", "x86_64.dmg"],
  "windows-x64": ["x64-setup.exe"],
  "windows-msi": ["x64_en-US.msi"],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform"); // mac, windows
  const arch = searchParams.get("arch"); // arm64, x64

  if (!platform || !arch) {
    // Redirect to releases page
    return NextResponse.redirect(
      `https://github.com/${GITHUB_REPO}/releases/latest`
    );
  }

  const key = `${platform}-${arch}`;
  const patterns = ASSET_PATTERNS[key];
  if (!patterns) {
    return NextResponse.redirect(
      `https://github.com/${GITHUB_REPO}/releases/latest`
    );
  }

  try {
    const res = await fetch(GITHUB_API, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 300 }, // cache 5 minutes
    });

    if (!res.ok) {
      return NextResponse.redirect(
        `https://github.com/${GITHUB_REPO}/releases/latest`
      );
    }

    const releases: GitHubRelease[] = await res.json();
    if (!releases.length) {
      return NextResponse.redirect(
        `https://github.com/${GITHUB_REPO}/releases/latest`
      );
    }

    // Find the first release that has matching assets
    for (const release of releases) {
      for (const asset of release.assets) {
        const name = asset.name.toLowerCase();
        if (patterns.some((p) => name.includes(p))) {
          return NextResponse.redirect(asset.browser_download_url);
        }
      }
    }

    // No matching asset found, redirect to releases page
    return NextResponse.redirect(
      `https://github.com/${GITHUB_REPO}/releases/latest`
    );
  } catch {
    return NextResponse.redirect(
      `https://github.com/${GITHUB_REPO}/releases/latest`
    );
  }
}
