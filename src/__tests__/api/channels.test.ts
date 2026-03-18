import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "./helpers";

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { POST } from "@/app/api/channels/route";
import type { NextRequest } from "next/server";

function makeMockSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
      }),
    },
    from: vi.fn(),
  };
}

describe("POST /api/channels", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/channels", {
      method: "POST",
      body: { box_id: "box-1", name: "test" },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing box_id", async () => {
    const req = makeRequest("http://localhost:3000/api/channels", {
      method: "POST",
      body: { name: "test" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("box_id");
  });

  it("returns 400 for missing channel name", async () => {
    const req = makeRequest("http://localhost:3000/api/channels", {
      method: "POST",
      body: { box_id: "box-1", name: "" },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 400 for name over 80 characters", async () => {
    const req = makeRequest("http://localhost:3000/api/channels", {
      method: "POST",
      body: { box_id: "box-1", name: "a".repeat(81) },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("80 characters");
  });

  it("returns 403 when user is not a box member", async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    }));

    const req = makeRequest("http://localhost:3000/api/channels", {
      method: "POST",
      body: { box_id: "box-1", name: "test-channel" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toContain("not a member");
  });

  it("returns 409 for duplicate channel name", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "box_members") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { role: "member" },
                }),
              }),
            }),
          }),
        };
      }
      if (table === "channels") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "23505", message: "duplicate" },
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/channels", {
      method: "POST",
      body: { box_id: "box-1", name: "general" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error).toContain("already exists");
  });
});
