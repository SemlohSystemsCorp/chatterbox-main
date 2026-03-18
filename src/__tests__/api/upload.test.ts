import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { POST } from "@/app/api/upload/route";
import type { NextRequest } from "next/server";

function makeMockSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
      }),
    },
    from: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://example.com/file.png" },
        }),
      }),
    },
  };
}

function makeUploadRequest(file: File | null) {
  const formData = new FormData();
  if (file) formData.append("file", file);

  return {
    method: "POST",
    url: "http://localhost:3000/api/upload",
    nextUrl: new URL("http://localhost:3000/api/upload"),
    formData: vi.fn().mockResolvedValue(formData),
    json: vi.fn(),
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe("POST /api/upload", () => {
  let mockSupabase: ReturnType<typeof makeMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeMockSupabase();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const req = makeUploadRequest(new File(["test"], "test.png", { type: "image/png" }));
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when no file provided", async () => {
    const formData = new FormData();
    const req = {
      method: "POST",
      url: "http://localhost:3000/api/upload",
      nextUrl: new URL("http://localhost:3000/api/upload"),
      formData: vi.fn().mockResolvedValue(formData),
      json: vi.fn(),
      headers: new Headers(),
    } as unknown as NextRequest;

    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("No file provided");
  });

  it("returns 400 for file too large", async () => {
    const bigContent = new Uint8Array(11 * 1024 * 1024); // 11MB
    const file = new File([bigContent], "big.png", { type: "image/png" });
    const req = makeUploadRequest(file);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("too large");
  });

  it("returns 400 for disallowed file type", async () => {
    const file = new File(["test"], "script.exe", { type: "application/x-msdownload" });
    const req = makeUploadRequest(file);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("type not allowed");
  });

  it("uploads a valid file and returns URL", async () => {
    const storageMock = {
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: "https://supabase.example.com/attachments/user-1/file.png" },
      }),
    };
    mockSupabase.storage.from = vi.fn().mockReturnValue(storageMock);

    const file = new File(["test content"], "photo.png", { type: "image/png" });
    const req = makeUploadRequest(file);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain("https://");
    expect(body.file_name).toBe("photo.png");
    expect(body.file_type).toBe("image/png");
    expect(body.file_size).toBeGreaterThan(0);
  });

  it("returns 500 when upload fails", async () => {
    const storageMock = {
      upload: vi.fn().mockResolvedValue({ error: { message: "Storage full" } }),
      getPublicUrl: vi.fn(),
    };
    mockSupabase.storage.from = vi.fn().mockReturnValue(storageMock);

    const file = new File(["test"], "photo.png", { type: "image/png" });
    const req = makeUploadRequest(file);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toContain("Upload failed");
  });
});
