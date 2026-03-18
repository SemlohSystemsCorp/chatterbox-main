import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "./helpers";

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { GET, POST, DELETE } from "@/app/api/messages/pin/route";
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

describe("GET /api/messages/pin", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/messages/pin?channel_id=ch-1");
    const res = await GET(req as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns 400 when neither channel_id nor conversation_id provided", async () => {
    const req = makeRequest("http://localhost:3000/api/messages/pin");
    const res = await GET(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("channel_id or conversation_id required");
  });

  it("returns empty pins array when no pins exist", async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }));

    const req = makeRequest("http://localhost:3000/api/messages/pin?channel_id=ch-1");
    const res = await GET(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.pins).toEqual([]);
  });
});

describe("POST /api/messages/pin", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/messages/pin", {
      method: "POST",
      body: { message_id: "msg-1", channel_id: "ch-1" },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing message_id", async () => {
    const req = makeRequest("http://localhost:3000/api/messages/pin", {
      method: "POST",
      body: { channel_id: "ch-1" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("message_id");
  });

  it("returns 409 when message is already pinned", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "channels") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { box_id: "box-1" } }),
            }),
          }),
        };
      }
      if (table === "box_members") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "m-1" } }),
              }),
            }),
          }),
        };
      }
      if (table === "pinned_messages") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: "pin-existing" } }),
            }),
          }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/messages/pin", {
      method: "POST",
      body: { message_id: "msg-1", channel_id: "ch-1" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error).toContain("already pinned");
  });
});

describe("DELETE /api/messages/pin", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/messages/pin?message_id=msg-1");
    const res = await DELETE(req as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing message_id", async () => {
    const req = makeRequest("http://localhost:3000/api/messages/pin");
    const res = await DELETE(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("message_id");
  });

  it("deletes a pinned message successfully", async () => {
    mockSupabase.from.mockImplementation(() => ({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }));

    const req = makeRequest(
      "http://localhost:3000/api/messages/pin?message_id=msg-1"
    );
    const res = await DELETE(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
