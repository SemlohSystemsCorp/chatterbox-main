import { vi } from "vitest";

// Helper to create a chainable Supabase query mock
export function createChainable(resolveValue: { data: unknown; error: unknown } = { data: null, error: null }) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
    maybeSingle: vi.fn().mockResolvedValue(resolveValue),
    textSearch: vi.fn().mockReturnThis(),
  };
  return chain;
}

// Helper to make a mock Next.js Request
export function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
) {
  const { method = "GET", body, headers = {} } = options;

  const request = {
    method,
    url,
    nextUrl: new URL(url, "http://localhost:3000"),
    json: vi.fn().mockResolvedValue(body ?? {}),
    formData: vi.fn(),
    headers: new Headers(headers),
  };

  return request as unknown;
}
