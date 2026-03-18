import "@testing-library/jest-dom/vitest";

// Mock Next.js modules
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/"),
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => {
        const status = init?.status ?? 200;
        return {
          status,
          json: async () => body,
          _body: body,
        };
      },
    },
  };
});

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Supabase browser client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));
