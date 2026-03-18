import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "./helpers";

const { mockSupabaseClient } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  return {
    mockSupabaseClient: { from: mockFrom, select: mockSelect },
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue(mockSupabaseClient),
}));

import { POST } from "@/app/api/auth/resolve-username/route";
import type { NextRequest } from "next/server";

describe("POST /api/auth/resolve-username", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient.from.mockReturnValue({ select: mockSupabaseClient.select });
  });

  it("returns 400 for missing username", async () => {
    const req = makeRequest("http://localhost:3000/api/auth/resolve-username", {
      method: "POST",
      body: {},
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("Username is required");
  });

  it("returns 400 for non-string username", async () => {
    const req = makeRequest("http://localhost:3000/api/auth/resolve-username", {
      method: "POST",
      body: { username: 123 },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 404 when user not found", async () => {
    mockSupabaseClient.select.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }),
    });

    const req = makeRequest("http://localhost:3000/api/auth/resolve-username", {
      method: "POST",
      body: { username: "nonexistent" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toContain("User not found");
  });

  it("returns email when user found", async () => {
    mockSupabaseClient.select.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { email: "alice@example.com" },
        }),
      }),
    });

    const req = makeRequest("http://localhost:3000/api/auth/resolve-username", {
      method: "POST",
      body: { username: "alice" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.email).toBe("alice@example.com");
  });

  it("trims and lowercases the username", async () => {
    const eqMock = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { email: "alice@example.com" },
      }),
    });
    mockSupabaseClient.select.mockReturnValue({ eq: eqMock });

    const req = makeRequest("http://localhost:3000/api/auth/resolve-username", {
      method: "POST",
      body: { username: "  Alice  " },
    });

    await POST(req as NextRequest);
    expect(eqMock).toHaveBeenCalledWith("username", "alice");
  });
});
