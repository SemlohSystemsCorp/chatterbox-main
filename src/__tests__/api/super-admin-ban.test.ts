import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainable, makeRequest } from "./helpers";
import type { NextRequest } from "next/server";

// ── Mocks ──

const { mockCreateClient, mockSupabaseAdmin, mockIsSuperAdmin } = vi.hoisted(
  () => {
    return {
      mockCreateClient: vi.fn(),
      mockSupabaseAdmin: {
        auth: {
          admin: {
            updateUserById: vi.fn(),
            getUserById: vi.fn(),
          },
        },
        from: vi.fn(),
      },
      mockIsSuperAdmin: vi.fn(),
    };
  }
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

vi.mock("@/lib/super-admin", () => ({
  isSuperAdmin: mockIsSuperAdmin,
}));

import { PATCH } from "@/app/api/super-admin/route";

function makeMockSupabase(
  user: { id: string; email: string } | null = {
    id: "admin-1",
    email: "admin@test.com",
  }
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
  };
}

describe("PATCH /api/super-admin (ban actions)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(makeMockSupabase());
    mockIsSuperAdmin.mockReturnValue(true);
  });

  it("returns 401 when not authenticated", async () => {
    mockCreateClient.mockResolvedValue(makeMockSupabase(null));

    const req = makeRequest("http://localhost:3000/api/super-admin", {
      method: "PATCH",
      body: { action: "ban_user", userId: "user-1", reason: "Test", duration: "24h" },
    });

    const res = await PATCH(req as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns 403 when not a super admin", async () => {
    mockIsSuperAdmin.mockReturnValue(false);

    const req = makeRequest("http://localhost:3000/api/super-admin", {
      method: "PATCH",
      body: { action: "ban_user", userId: "user-1", reason: "Test", duration: "24h" },
    });

    const res = await PATCH(req as NextRequest);
    expect(res.status).toBe(403);
  });

  // ── Ban User ──

  it("bans a user with 24h duration", async () => {
    mockSupabaseAdmin.auth.admin.updateUserById.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const profileChain = createChainable({ data: null, error: null });
    mockSupabaseAdmin.from.mockReturnValue(profileChain);

    const req = makeRequest("http://localhost:3000/api/super-admin", {
      method: "PATCH",
      body: { action: "ban_user", userId: "user-1", reason: "Spamming", duration: "24h" },
    });

    const res = await PATCH(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Check updateUserById was called with correct ban_duration
    expect(mockSupabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        ban_duration: "24h",
        user_metadata: expect.objectContaining({
          banned: true,
          ban_reason: "Spamming",
        }),
      })
    );
  });

  it("bans a user permanently (876000h)", async () => {
    mockSupabaseAdmin.auth.admin.updateUserById.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const profileChain = createChainable({ data: null, error: null });
    mockSupabaseAdmin.from.mockReturnValue(profileChain);

    const req = makeRequest("http://localhost:3000/api/super-admin", {
      method: "PATCH",
      body: { action: "ban_user", userId: "user-1", reason: "TOS violation", duration: "permanent" },
    });

    const res = await PATCH(req as NextRequest);
    expect(res.status).toBe(200);

    expect(mockSupabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        ban_duration: "876000h",
      })
    );
  });

  it("returns 400 when userId is missing for ban_user", async () => {
    const req = makeRequest("http://localhost:3000/api/super-admin", {
      method: "PATCH",
      body: { action: "ban_user", reason: "Test", duration: "24h" },
    });

    const res = await PATCH(req as NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 500 when Supabase ban fails", async () => {
    mockSupabaseAdmin.auth.admin.updateUserById.mockResolvedValue({
      data: null,
      error: { message: "Internal error" },
    });

    const req = makeRequest("http://localhost:3000/api/super-admin", {
      method: "PATCH",
      body: { action: "ban_user", userId: "user-1", reason: "Test", duration: "1h" },
    });

    const res = await PATCH(req as NextRequest);
    expect(res.status).toBe(500);
  });

  // ── Unban User ──

  it("unbans a user", async () => {
    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: { user: { id: "user-1", user_metadata: { banned: true, ban_reason: "Spamming" } } },
    });

    mockSupabaseAdmin.auth.admin.updateUserById.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const req = makeRequest("http://localhost:3000/api/super-admin", {
      method: "PATCH",
      body: { action: "unban_user", userId: "user-1" },
    });

    const res = await PATCH(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Check updateUserById was called with ban_duration: "none"
    expect(mockSupabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        ban_duration: "none",
        user_metadata: expect.objectContaining({
          banned: false,
          ban_reason: null,
        }),
      })
    );
  });

  it("returns 400 when userId is missing for unban_user", async () => {
    const req = makeRequest("http://localhost:3000/api/super-admin", {
      method: "PATCH",
      body: { action: "unban_user" },
    });

    const res = await PATCH(req as NextRequest);
    expect(res.status).toBe(400);
  });

  // ── Force Signout ──

  it("force signs out a user", async () => {
    mockSupabaseAdmin.auth.admin.updateUserById.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const profileChain = createChainable({ data: null, error: null });
    mockSupabaseAdmin.from.mockReturnValue(profileChain);

    const req = makeRequest("http://localhost:3000/api/super-admin", {
      method: "PATCH",
      body: { action: "force_signout", userId: "user-1" },
    });

    const res = await PATCH(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  // ── Reset Password ──

  it("resets a user password", async () => {
    mockSupabaseAdmin.auth.admin.updateUserById.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const req = makeRequest("http://localhost:3000/api/super-admin", {
      method: "PATCH",
      body: { action: "reset_password", userId: "user-1", newPassword: "newpass123" },
    });

    const res = await PATCH(req as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    expect(mockSupabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
      "user-1",
      { password: "newpass123" }
    );
  });

  it("returns 400 when newPassword is missing for reset_password", async () => {
    const req = makeRequest("http://localhost:3000/api/super-admin", {
      method: "PATCH",
      body: { action: "reset_password", userId: "user-1" },
    });

    const res = await PATCH(req as NextRequest);
    expect(res.status).toBe(400);
  });
});
