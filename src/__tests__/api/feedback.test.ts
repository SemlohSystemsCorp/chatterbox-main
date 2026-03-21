import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainable, makeRequest } from "./helpers";

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { POST } from "@/app/api/feedback/route";

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

describe("POST /api/feedback", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: { type: "feedback", message: "Great app!" },
    });

    const res = await POST(req as Request);
    expect(res.status).toBe(401);
  });

  it("returns 400 when message is missing", async () => {
    const req = makeRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: { type: "feedback" },
    });

    const res = await POST(req as Request);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Message is required");
  });

  it("returns 400 when message is empty string", async () => {
    const req = makeRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: { type: "feedback", message: "   " },
    });

    const res = await POST(req as Request);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Message is required");
  });

  it("returns 400 when message is not a string", async () => {
    const req = makeRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: { type: "feedback", message: 123 },
    });

    const res = await POST(req as Request);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid type", async () => {
    const req = makeRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: { type: "invalid", message: "test" },
    });

    const res = await POST(req as Request);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid type");
  });

  it("accepts 'feedback' type and inserts", async () => {
    const insertChain = createChainable({ data: null, error: null });
    mockSupabase.from.mockReturnValue(insertChain);

    const req = makeRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: { type: "feedback", message: "Great app!", email: "test@test.com" },
    });

    const res = await POST(req as Request);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith("feedback");
    expect(insertChain.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      type: "feedback",
      message: "Great app!",
      email: "test@test.com",
    });
  });

  it("accepts 'report' type and inserts", async () => {
    const insertChain = createChainable({ data: null, error: null });
    mockSupabase.from.mockReturnValue(insertChain);

    const req = makeRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: { type: "report", message: "Bug found" },
    });

    const res = await POST(req as Request);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(insertChain.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      type: "report",
      message: "Bug found",
      email: null,
    });
  });

  it("truncates message to 5000 chars", async () => {
    const insertChain = createChainable({ data: null, error: null });
    mockSupabase.from.mockReturnValue(insertChain);

    const longMessage = "a".repeat(6000);
    const req = makeRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: { type: "feedback", message: longMessage },
    });

    await POST(req as Request);
    const insertArg = (insertChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.message.length).toBe(5000);
  });

  it("truncates email to 255 chars", async () => {
    const insertChain = createChainable({ data: null, error: null });
    mockSupabase.from.mockReturnValue(insertChain);

    const longEmail = "a".repeat(300) + "@test.com";
    const req = makeRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: { type: "feedback", message: "test", email: longEmail },
    });

    await POST(req as Request);
    const insertArg = (insertChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.email.length).toBe(255);
  });

  it("sets email to null when empty", async () => {
    const insertChain = createChainable({ data: null, error: null });
    mockSupabase.from.mockReturnValue(insertChain);

    const req = makeRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: { type: "feedback", message: "test", email: "" },
    });

    await POST(req as Request);
    const insertArg = (insertChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.email).toBeNull();
  });
});
