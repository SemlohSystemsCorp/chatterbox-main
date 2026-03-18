import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "./helpers";

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { POST } from "@/app/api/boxes/route";
import type { NextRequest } from "next/server";

function makeMockSupabase(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@test.com" } },
      }),
    },
    from: vi.fn(),
    ...overrides,
  };
}

describe("POST /api/boxes", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/boxes", {
      method: "POST",
      body: { name: "Test Box" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 for missing name", async () => {
    const req = makeRequest("http://localhost:3000/api/boxes", {
      method: "POST",
      body: { name: "" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("at least 2 characters");
  });

  it("returns 400 for name too short", async () => {
    const req = makeRequest("http://localhost:3000/api/boxes", {
      method: "POST",
      body: { name: "x" },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 400 for name too long", async () => {
    const req = makeRequest("http://localhost:3000/api/boxes", {
      method: "POST",
      body: { name: "a".repeat(51) },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("under 50 characters");
  });

  it("creates a box with owner and general channel on success", async () => {
    const mockBox = { id: "box-1", name: "Test", slug: "test" };

    let callCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "boxes") {
        callCount++;
        if (callCount === 1) {
          // Slug uniqueness check
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          };
        }
        // Insert box
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockBox, error: null }),
            }),
          }),
        };
      }
      if (table === "box_members") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "channels") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/boxes", {
      method: "POST",
      body: { name: "Test" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.box).toEqual(mockBox);
  });
});
