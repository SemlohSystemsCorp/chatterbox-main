import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "./helpers";

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { GET, POST } from "@/app/api/polls/[pollId]/route";
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

const params = Promise.resolve({ pollId: "poll-1" });

describe("GET /api/polls/[pollId]", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/polls/poll-1");
    const res = await GET(req as NextRequest, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when poll not found", async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    }));

    const req = makeRequest("http://localhost:3000/api/polls/poll-1");
    const res = await GET(req as NextRequest, { params });
    expect(res.status).toBe(404);
  });

  it("returns poll with options and votes", async () => {
    const mockPoll = { id: "poll-1", question: "Best color?", allows_multiple: false };
    const mockOptions = [
      { id: "opt-1", label: "Red", position: 0 },
      { id: "opt-2", label: "Blue", position: 1 },
    ];
    const mockVotes = [{ id: "vote-1", option_id: "opt-1", user_id: "user-1" }];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "polls") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPoll }),
            }),
          }),
        };
      }
      if (table === "poll_options") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockOptions }),
            }),
          }),
        };
      }
      if (table === "poll_votes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockVotes }),
          }),
        };
      }
      return {};
    });

    const req = makeRequest("http://localhost:3000/api/polls/poll-1");
    const res = await GET(req as NextRequest, { params });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.poll).toEqual(mockPoll);
    expect(body.options).toEqual(mockOptions);
    expect(body.votes).toEqual(mockVotes);
  });
});

describe("POST /api/polls/[pollId] (vote)", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/polls/poll-1", {
      method: "POST",
      body: { option_id: "opt-1" },
    });

    const res = await POST(req as NextRequest, { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing option_id", async () => {
    const req = makeRequest("http://localhost:3000/api/polls/poll-1", {
      method: "POST",
      body: {},
    });

    const res = await POST(req as NextRequest, { params });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("option_id");
  });

  it("returns 404 when poll not found", async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }));

    const req = makeRequest("http://localhost:3000/api/polls/poll-1", {
      method: "POST",
      body: { option_id: "opt-1" },
    });

    const res = await POST(req as NextRequest, { params });
    expect(res.status).toBe(404);
  });

  it("returns 400 for expired poll", async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "poll-1",
              allows_multiple: false,
              expires_at: "2020-01-01T00:00:00Z",
            },
          }),
        }),
      }),
    }));

    const req = makeRequest("http://localhost:3000/api/polls/poll-1", {
      method: "POST",
      body: { option_id: "opt-1" },
    });

    const res = await POST(req as NextRequest, { params });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("expired");
  });
});
