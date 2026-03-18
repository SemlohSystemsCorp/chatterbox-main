import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "./helpers";

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { GET, PATCH } from "@/app/api/notifications/route";
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

describe("GET /api/notifications", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/notifications");
    const res = await GET(req as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns notifications list with unread count", async () => {
    const mockNotifications = [
      {
        id: "n-1",
        type: "mention",
        title: "You were mentioned",
        body: "Hello @user",
        actor_id: "user-2",
        read: false,
        created_at: "2024-06-15T12:00:00Z",
        box_id: null,
        channel_id: null,
        conversation_id: null,
        message_id: null,
      },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "notifications") {
        return {
          select: vi.fn().mockImplementation((_fields: string, opts?: Record<string, unknown>) => {
            if (opts?.count) {
              return {
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ count: 1 }),
                }),
              };
            }
            return {
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockNotifications,
                    error: null,
                  }),
                }),
              }),
            };
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "user-2",
                  full_name: "Bob",
                  email: "bob@test.com",
                  avatar_url: null,
                },
              ],
            }),
          }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/notifications");
    const res = await GET(req as NextRequest);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.notifications).toBeDefined();
    expect(body.unread_count).toBeDefined();
  });
});

describe("PATCH /api/notifications", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/notifications", {
      method: "PATCH",
      body: { mark_all: true },
    });

    const res = await PATCH(req as NextRequest);
    expect(res.status).toBe(401);
  });

  it("marks all notifications as read", async () => {
    mockSupabase.from.mockImplementation(() => ({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }));

    const req = makeRequest("http://localhost:3000/api/notifications", {
      method: "PATCH",
      body: { mark_all: true },
    });

    const res = await PATCH(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("marks specific notifications as read", async () => {
    mockSupabase.from.mockImplementation(() => ({
      update: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }));

    const req = makeRequest("http://localhost:3000/api/notifications", {
      method: "PATCH",
      body: { notification_ids: ["n-1", "n-2"] },
    });

    const res = await PATCH(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
