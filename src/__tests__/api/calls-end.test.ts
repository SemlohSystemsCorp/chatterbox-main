import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainable, makeRequest } from "./helpers";

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

// Mock supabaseAdmin as a chainable object
const mockAdminFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: { from: (...args: unknown[]) => mockAdminFrom(...args) },
}));

vi.mock("@/lib/daily", () => ({
  deleteDailyRoom: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/calls/end/route";
import { deleteDailyRoom } from "@/lib/daily";
import type { NextRequest } from "next/server";

const CALL = {
  id: "call-1",
  room_name: "room-abc",
  started_by: "user-1",
  started_at: new Date(Date.now() - 300_000).toISOString(), // 5 min ago
  channel_id: "ch-1",
  conversation_id: null,
};

function makeMockSupabase(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@test.com" } },
      }),
    },
    ...overrides,
  };
}

describe("POST /api/calls/end", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/calls/end", {
      method: "POST",
      body: { call_id: "call-1" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when call_id is missing", async () => {
    const req = makeRequest("http://localhost:3000/api/calls/end", {
      method: "POST",
      body: {},
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("call_id required");
  });

  it("returns 404 when call is not found", async () => {
    const callsChain = createChainable({ data: null, error: null });
    mockAdminFrom.mockReturnValue(callsChain);

    const req = makeRequest("http://localhost:3000/api/calls/end", {
      method: "POST",
      body: { call_id: "nonexistent" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe("Call not found");
  });

  it("uses supabaseAdmin (not user client) for all DB operations", async () => {
    // calls → found
    const callsChain = createChainable({ data: CALL, error: null });
    // call_participants update → left_at
    const participantsUpdateChain = createChainable({ data: null, error: null });
    // call_participants count → 0 (no one left)
    const participantsCountChain = createChainable({ data: null, error: null });
    participantsCountChain.select = vi.fn().mockReturnValue({
      ...participantsCountChain,
      eq: vi.fn().mockReturnValue({
        ...participantsCountChain,
        is: vi.fn().mockResolvedValue({ count: 0, error: null }),
      }),
    });
    // calls update → ended
    const callsUpdateChain = createChainable({ data: { id: "call-1" }, error: null });
    // channel_events insert
    const eventsChain = createChainable({ data: null, error: null });
    // call_participants delete
    const participantsDeleteChain = createChainable({ data: null, error: null });

    let fromCallCount = 0;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "calls") {
        fromCallCount++;
        return fromCallCount === 1 ? callsChain : callsUpdateChain;
      }
      if (table === "call_participants") {
        fromCallCount++;
        // 1st = update left_at, 2nd = count, 3rd = delete
        if (fromCallCount === 2) return participantsUpdateChain;
        if (fromCallCount === 3) return participantsCountChain;
        return participantsDeleteChain;
      }
      if (table === "channel_events") return eventsChain;
      return createChainable();
    });

    const req = makeRequest("http://localhost:3000/api/calls/end", {
      method: "POST",
      body: { call_id: "call-1" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ended).toBe(true);
    // Verify admin client was used (mockAdminFrom was called, not mockSupabase.from)
    expect(mockAdminFrom).toHaveBeenCalled();
    expect(mockSupabase).not.toHaveProperty("from");
  });

  it("marks participant as left before checking count", async () => {
    const callsChain = createChainable({ data: CALL, error: null });

    const updateFn = vi.fn().mockReturnThis();
    const participantsChain = {
      ...createChainable(),
      update: updateFn,
    };

    // After update, count check returns 1 (someone still in call)
    const countChain = createChainable();
    countChain.select = vi.fn().mockReturnValue({
      ...countChain,
      eq: vi.fn().mockReturnValue({
        ...countChain,
        is: vi.fn().mockResolvedValue({ count: 1, error: null }),
      }),
    });

    let callIdx = 0;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "calls") return callsChain;
      if (table === "call_participants") {
        callIdx++;
        return callIdx === 1 ? participantsChain : countChain;
      }
      return createChainable();
    });

    const req = makeRequest("http://localhost:3000/api/calls/end", {
      method: "POST",
      body: { call_id: "call-1" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ended).toBe(false);
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ left_at: expect.any(String) })
    );
  });

  it("does not delete the call record when ending (keeps ended_at for realtime)", async () => {
    const callsChain = createChainable({ data: CALL, error: null });
    const callsUpdateChain = createChainable({ data: { id: "call-1" }, error: null });
    const eventsChain = createChainable({ data: null, error: null });

    const participantsUpdateChain = createChainable({ data: null, error: null });
    const participantsCountChain = createChainable();
    participantsCountChain.select = vi.fn().mockReturnValue({
      ...participantsCountChain,
      eq: vi.fn().mockReturnValue({
        ...participantsCountChain,
        is: vi.fn().mockResolvedValue({ count: 0, error: null }),
      }),
    });
    const participantsDeleteChain = createChainable({ data: null, error: null });

    const tablesAccessed: string[] = [];
    const operationsOnCalls: string[] = [];
    let participantIdx = 0;
    let callsIdx = 0;

    mockAdminFrom.mockImplementation((table: string) => {
      tablesAccessed.push(table);
      if (table === "calls") {
        callsIdx++;
        if (callsIdx === 1) return callsChain; // select
        // Track that update (not delete) is called on calls
        const tracked = {
          ...callsUpdateChain,
          update: vi.fn((...args: unknown[]) => {
            operationsOnCalls.push("update");
            return callsUpdateChain.update(...args);
          }),
          delete: vi.fn(() => {
            operationsOnCalls.push("delete");
            return callsUpdateChain;
          }),
        };
        return tracked;
      }
      if (table === "call_participants") {
        participantIdx++;
        if (participantIdx === 1) return participantsUpdateChain;
        if (participantIdx === 2) return participantsCountChain;
        return participantsDeleteChain;
      }
      if (table === "channel_events") return eventsChain;
      return createChainable();
    });

    const req = makeRequest("http://localhost:3000/api/calls/end", {
      method: "POST",
      body: { call_id: "call-1" },
    });

    await POST(req as NextRequest);

    // The call record should be updated (ended_at set), NOT deleted
    expect(operationsOnCalls).toContain("update");
    expect(operationsOnCalls).not.toContain("delete");
  });

  it("deletes the Daily room when call ends", async () => {
    const callsChain = createChainable({ data: CALL, error: null });
    const callsUpdateChain = createChainable({ data: { id: "call-1" }, error: null });
    const eventsChain = createChainable({ data: null, error: null });
    const participantsUpdateChain = createChainable({ data: null, error: null });
    const participantsCountChain = createChainable();
    participantsCountChain.select = vi.fn().mockReturnValue({
      ...participantsCountChain,
      eq: vi.fn().mockReturnValue({
        ...participantsCountChain,
        is: vi.fn().mockResolvedValue({ count: 0, error: null }),
      }),
    });
    const participantsDeleteChain = createChainable({ data: null, error: null });

    let participantIdx = 0;
    let callsIdx = 0;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "calls") {
        callsIdx++;
        return callsIdx === 1 ? callsChain : callsUpdateChain;
      }
      if (table === "call_participants") {
        participantIdx++;
        if (participantIdx === 1) return participantsUpdateChain;
        if (participantIdx === 2) return participantsCountChain;
        return participantsDeleteChain;
      }
      if (table === "channel_events") return eventsChain;
      return createChainable();
    });

    const req = makeRequest("http://localhost:3000/api/calls/end", {
      method: "POST",
      body: { call_id: "call-1" },
    });

    await POST(req as NextRequest);

    expect(deleteDailyRoom).toHaveBeenCalledWith("room-abc");
  });

  it("inserts channel_event with duration when call ends in a channel", async () => {
    const callsChain = createChainable({ data: CALL, error: null });
    const callsUpdateChain = createChainable({ data: { id: "call-1" }, error: null });
    const eventsInsert = vi.fn().mockReturnThis();
    const eventsChain = { ...createChainable(), insert: eventsInsert };
    const participantsUpdateChain = createChainable({ data: null, error: null });
    const participantsCountChain = createChainable();
    participantsCountChain.select = vi.fn().mockReturnValue({
      ...participantsCountChain,
      eq: vi.fn().mockReturnValue({
        ...participantsCountChain,
        is: vi.fn().mockResolvedValue({ count: 0, error: null }),
      }),
    });
    const participantsDeleteChain = createChainable({ data: null, error: null });

    let participantIdx = 0;
    let callsIdx = 0;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "calls") {
        callsIdx++;
        return callsIdx === 1 ? callsChain : callsUpdateChain;
      }
      if (table === "call_participants") {
        participantIdx++;
        if (participantIdx === 1) return participantsUpdateChain;
        if (participantIdx === 2) return participantsCountChain;
        return participantsDeleteChain;
      }
      if (table === "channel_events") return eventsChain;
      return createChainable();
    });

    const req = makeRequest("http://localhost:3000/api/calls/end", {
      method: "POST",
      body: { call_id: "call-1" },
    });

    await POST(req as NextRequest);

    expect(eventsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        channel_id: "ch-1",
        actor_id: "user-1",
        type: "call_ended",
        metadata: expect.objectContaining({
          call_id: "call-1",
          duration: expect.any(String),
        }),
      })
    );
  });

  it("does not insert channel_event for DM calls (no channel_id)", async () => {
    const dmCall = { ...CALL, channel_id: null, conversation_id: "conv-1" };
    const callsChain = createChainable({ data: dmCall, error: null });
    const callsUpdateChain = createChainable({ data: { id: "call-1" }, error: null });
    const participantsUpdateChain = createChainable({ data: null, error: null });
    const participantsCountChain = createChainable();
    participantsCountChain.select = vi.fn().mockReturnValue({
      ...participantsCountChain,
      eq: vi.fn().mockReturnValue({
        ...participantsCountChain,
        is: vi.fn().mockResolvedValue({ count: 0, error: null }),
      }),
    });
    const participantsDeleteChain = createChainable({ data: null, error: null });

    let participantIdx = 0;
    let callsIdx = 0;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "calls") {
        callsIdx++;
        return callsIdx === 1 ? callsChain : callsUpdateChain;
      }
      if (table === "call_participants") {
        participantIdx++;
        if (participantIdx === 1) return participantsUpdateChain;
        if (participantIdx === 2) return participantsCountChain;
        return participantsDeleteChain;
      }
      if (table === "channel_events") {
        throw new Error("Should not access channel_events for DM calls");
      }
      return createChainable();
    });

    const req = makeRequest("http://localhost:3000/api/calls/end", {
      method: "POST",
      body: { call_id: "call-1" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ended).toBe(true);
  });

  it("handles race condition: another request already ended the call", async () => {
    const callsChain = createChainable({ data: CALL, error: null });
    // maybeSingle returns null — another request already set ended_at
    const callsUpdateChain = createChainable({ data: null, error: null });
    const participantsUpdateChain = createChainable({ data: null, error: null });
    const participantsCountChain = createChainable();
    participantsCountChain.select = vi.fn().mockReturnValue({
      ...participantsCountChain,
      eq: vi.fn().mockReturnValue({
        ...participantsCountChain,
        is: vi.fn().mockResolvedValue({ count: 0, error: null }),
      }),
    });

    let participantIdx = 0;
    let callsIdx = 0;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "calls") {
        callsIdx++;
        return callsIdx === 1 ? callsChain : callsUpdateChain;
      }
      if (table === "call_participants") {
        participantIdx++;
        if (participantIdx === 1) return participantsUpdateChain;
        return participantsCountChain;
      }
      return createChainable();
    });

    const req = makeRequest("http://localhost:3000/api/calls/end", {
      method: "POST",
      body: { call_id: "call-1" },
    });

    const res = await POST(req as NextRequest);
    const body = await res.json();

    // Should still return success, not error
    expect(res.status).toBe(200);
    expect(body.ended).toBe(true);
    // Daily room should NOT be deleted since we didn't actually end it
    expect(deleteDailyRoom).not.toHaveBeenCalled();
  });
});
