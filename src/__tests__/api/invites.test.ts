import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "./helpers";

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { POST } from "@/app/api/invites/route";
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

describe("POST /api/invites", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/invites", {
      method: "POST",
      body: { box_id: "box-1" },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing box_id", async () => {
    const req = makeRequest("http://localhost:3000/api/invites", {
      method: "POST",
      body: {},
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("box_id");
  });

  it("returns 403 when user is not admin/owner", async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: "member" },
            }),
          }),
        }),
      }),
    }));

    const req = makeRequest("http://localhost:3000/api/invites", {
      method: "POST",
      body: { box_id: "box-1" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toContain("admins");
  });

  it("returns 403 when user has no membership", async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    }));

    const req = makeRequest("http://localhost:3000/api/invites", {
      method: "POST",
      body: { box_id: "box-1" },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(403);
  });

  it("creates invite when user is owner", async () => {
    const mockInvite = { id: "inv-1", code: "abc12345", role: "member" };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "box_members") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { role: "owner" },
                }),
              }),
            }),
          }),
        };
      }
      if (table === "invites") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockInvite,
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/invites", {
      method: "POST",
      body: { box_id: "box-1" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.invite).toBeDefined();
  });
});
