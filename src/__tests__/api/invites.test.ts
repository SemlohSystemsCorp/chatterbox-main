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

  it("creates invite with custom role", async () => {
    let insertedData: Record<string, unknown> = {};

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
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            insertedData = data;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "inv-1", code: "abc12345", role: "admin" },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/invites", {
      method: "POST",
      body: { box_id: "box-1", role: "admin" },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(201);
    expect(insertedData.role).toBe("admin");
  });

  it("creates invite with max_uses", async () => {
    let insertedData: Record<string, unknown> = {};

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "box_members") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { role: "admin" },
                }),
              }),
            }),
          }),
        };
      }
      if (table === "invites") {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            insertedData = data;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "inv-2", code: "def45678", role: "member", max_uses: 10 },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/invites", {
      method: "POST",
      body: { box_id: "box-1", max_uses: 10 },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(201);
    expect(insertedData.max_uses).toBe(10);
  });

  it("creates invite with custom expiration", async () => {
    let insertedData: Record<string, unknown> = {};

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
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            insertedData = data;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "inv-3", code: "ghi78901" },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/invites", {
      method: "POST",
      body: { box_id: "box-1", expires_in_hours: 24 },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(201);
    expect(insertedData.expires_at).toBeDefined();
    // Verify expiration is roughly 24 hours from now
    const expiresAt = new Date(insertedData.expires_at as string).getTime();
    const expectedMs = Date.now() + 24 * 3600000;
    expect(Math.abs(expiresAt - expectedMs)).toBeLessThan(5000);
  });

  it("creates invite with no expiration when expires_in_hours is 0", async () => {
    let insertedData: Record<string, unknown> = {};

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
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            insertedData = data;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "inv-4", code: "jkl01234" },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/invites", {
      method: "POST",
      body: { box_id: "box-1", expires_in_hours: 0 },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(201);
    expect(insertedData.expires_at).toBeNull();
  });

  it("defaults role to member when not specified", async () => {
    let insertedData: Record<string, unknown> = {};

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
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            insertedData = data;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "inv-5", code: "mno56789" },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/invites", {
      method: "POST",
      body: { box_id: "box-1" },
    });

    await POST(req as NextRequest);
    expect(insertedData.role).toBe("member");
  });

  it("returns 500 when insert fails", async () => {
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
                data: null,
                error: { message: "DB error" },
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
    expect(res.status).toBe(500);
    expect(body.error).toBe("DB error");
  });
});
