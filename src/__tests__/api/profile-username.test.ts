import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "./helpers";

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { PATCH } from "@/app/api/profile/username/route";

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

describe("PATCH /api/profile/username", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest("http://localhost:3000/api/profile/username", {
      method: "PATCH",
      body: { username: "test" },
    });

    const res = await PATCH(req as Request);
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing username", async () => {
    const req = makeRequest("http://localhost:3000/api/profile/username", {
      method: "PATCH",
      body: {},
    });

    const res = await PATCH(req as Request);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("Username is required");
  });

  it("returns 400 for invalid username format", async () => {
    const req = makeRequest("http://localhost:3000/api/profile/username", {
      method: "PATCH",
      body: { username: "a" }, // too short
    });

    const res = await PATCH(req as Request);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("2-30 characters");
  });

  it("returns 400 for username with special characters", async () => {
    const req = makeRequest("http://localhost:3000/api/profile/username", {
      method: "PATCH",
      body: { username: "test@user!" },
    });

    const res = await PATCH(req as Request);
    expect(res.status).toBe(400);
  });

  it("returns 409 when username is taken", async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "other-user" },
            }),
          }),
        }),
      }),
    }));

    const req = makeRequest("http://localhost:3000/api/profile/username", {
      method: "PATCH",
      body: { username: "taken-name" },
    });

    const res = await PATCH(req as Request);
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error).toContain("already taken");
  });

  it("updates username successfully", async () => {
    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }),
        };
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    });

    const req = makeRequest("http://localhost:3000/api/profile/username", {
      method: "PATCH",
      body: { username: "NewUser" },
    });

    const res = await PATCH(req as Request);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.username).toBe("newuser");
  });

  it("accepts valid username formats", async () => {
    const validUsernames = ["ab", "test-user", "test.user", "test_user", "abc123"];

    for (const username of validUsernames) {
      vi.clearAllMocks();
      mockSupabase = makeMockSupabase();
      mockCreateClient.mockResolvedValue(mockSupabase);

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      const req = makeRequest("http://localhost:3000/api/profile/username", {
        method: "PATCH",
        body: { username },
      });

      const res = await PATCH(req as Request);
      expect(res.status).toBe(200);
    }
  });
});
