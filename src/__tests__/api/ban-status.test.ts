import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──

const { mockCreateClient, mockSupabaseAdmin } = vi.hoisted(() => {
  return {
    mockCreateClient: vi.fn(),
    mockSupabaseAdmin: {
      auth: {
        admin: {
          getUserById: vi.fn(),
        },
      },
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

import { GET } from "@/app/api/auth/ban-status/route";

function makeMockSupabase(user: { id: string } | null = { id: "user-1" }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
  };
}

describe("GET /api/auth/ban-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(makeMockSupabase());
  });

  it("returns banned: false when not authenticated", async () => {
    mockCreateClient.mockResolvedValue(makeMockSupabase(null));

    const res = await GET();
    const body = await res.json();
    expect(body.banned).toBe(false);
  });

  it("returns banned: false when auth user not found in admin", async () => {
    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: { user: null },
    });

    const res = await GET();
    const body = await res.json();
    expect(body.banned).toBe(false);
  });

  it("returns banned: false when user is not banned", async () => {
    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          banned_until: null,
          user_metadata: {},
        },
      },
    });

    const res = await GET();
    const body = await res.json();
    expect(body.banned).toBe(false);
    expect(body.ban_reason).toBeNull();
    expect(body.banned_until).toBeNull();
  });

  it("returns banned: true with reason and expiry when user is banned", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          banned_until: futureDate,
          user_metadata: {
            banned: true,
            ban_reason: "Spamming",
          },
        },
      },
    });

    const res = await GET();
    const body = await res.json();
    expect(body.banned).toBe(true);
    expect(body.ban_reason).toBe("Spamming");
    expect(body.banned_until).toBe(futureDate);
  });

  it("returns banned: false when banned_until is in the past", async () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          banned_until: pastDate,
          user_metadata: {
            banned: true,
            ban_reason: "Expired ban",
          },
        },
      },
    });

    const res = await GET();
    const body = await res.json();
    expect(body.banned).toBe(false);
  });

  it("returns banned: false when banned_until is epoch zero", async () => {
    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          banned_until: "1970-01-01T00:00:00Z",
          user_metadata: {},
        },
      },
    });

    const res = await GET();
    const body = await res.json();
    expect(body.banned).toBe(false);
  });

  it("returns null ban_reason when no reason in metadata", async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          banned_until: futureDate,
          user_metadata: { banned: true },
        },
      },
    });

    const res = await GET();
    const body = await res.json();
    expect(body.banned).toBe(true);
    expect(body.ban_reason).toBeNull();
  });
});
