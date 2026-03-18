import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "./helpers";

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { POST } from "@/app/api/messages/react/route";
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

describe("POST /api/messages/react", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/messages/react", {
      method: "POST",
      body: { message_id: "msg-1", emoji: "👍" },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing message_id", async () => {
    const req = makeRequest("http://localhost:3000/api/messages/react", {
      method: "POST",
      body: { emoji: "👍" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("message_id and emoji are required");
  });

  it("returns 400 for missing emoji", async () => {
    const req = makeRequest("http://localhost:3000/api/messages/react", {
      method: "POST",
      body: { message_id: "msg-1" },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 404 when message not found", async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }));

    const req = makeRequest("http://localhost:3000/api/messages/react", {
      method: "POST",
      body: { message_id: "msg-nonexistent", emoji: "👍" },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(404);
  });

  it("removes existing reaction (toggle off)", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "messages") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { channel_id: "ch-1", conversation_id: null },
              }),
            }),
          }),
        };
      }
      if (table === "channels") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { box_id: "box-1" },
              }),
            }),
          }),
        };
      }
      if (table === "box_members") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "membership-1" },
                }),
              }),
            }),
          }),
        };
      }
      if (table === "reactions") {
        // Return an object with both select (for checking existing) and delete
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "reaction-1" },
                  }),
                }),
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/messages/react", {
      method: "POST",
      body: { message_id: "msg-1", emoji: "👍" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.action).toBe("removed");
  });
});
