import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Set env before import
process.env.NEXT_PUBLIC_GIPHY_API_KEY = "test-giphy-key";

import { GET } from "@/app/api/giphy/search/route";

describe("GET /api/giphy/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_GIPHY_API_KEY = "test-giphy-key";
  });

  it("returns 500 when API key is not configured", async () => {
    process.env.NEXT_PUBLIC_GIPHY_API_KEY = "";

    const req = { url: "http://localhost:3000/api/giphy/search?q=cats" } as Request;
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toContain("API key not configured");
  });

  it("searches Giphy with the query parameter", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: [
          {
            title: "Funny Cat",
            images: {
              original: { url: "https://giphy.com/cat.gif", width: "200", height: "200" },
            },
          },
        ],
      }),
    });

    const req = { url: "http://localhost:3000/api/giphy/search?q=cats" } as Request;
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.url).toBe("https://giphy.com/cat.gif");
    expect(body.title).toBe("Funny Cat");
  });

  it('uses "funny" as default query', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: [
          {
            title: "Funny GIF",
            images: { original: { url: "https://giphy.com/funny.gif", width: "100", height: "100" } },
          },
        ],
      }),
    });

    const req = { url: "http://localhost:3000/api/giphy/search" } as Request;
    await GET(req);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("q=funny"));
  });

  it("returns 404 when no GIFs found", async () => {
    mockFetch.mockResolvedValue({ json: async () => ({ data: [] }) });

    const req = { url: "http://localhost:3000/api/giphy/search?q=asdfghjkl" } as Request;
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toContain("No GIFs found");
  });

  it("returns 500 on fetch error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const req = { url: "http://localhost:3000/api/giphy/search?q=test" } as Request;
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toContain("Failed to search Giphy");
  });
});
