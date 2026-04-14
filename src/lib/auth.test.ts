// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const { createSession } = await import("./auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSession", () => {
  it("sets an httpOnly cookie named auth-token", async () => {
    await createSession("user-1", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name, , options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
    expect(options.sameSite).toBe("lax");
  });

  it("sets an expiry ~7 days in the future", async () => {
    await createSession("user-1", "test@example.com");

    const [, , options] = mockCookieStore.set.mock.calls[0];
    const diff = options.expires.getTime() - Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(diff).toBeGreaterThan(sevenDaysMs - 5000);
    expect(diff).toBeLessThanOrEqual(sevenDaysMs);
  });

  it("stores a valid signed JWT containing userId and email", async () => {
    await createSession("user-1", "test@example.com");

    const [, token] = mockCookieStore.set.mock.calls[0];
    expect(token.split(".")).toHaveLength(3);

    const { payload } = await jwtVerify(token, JWT_SECRET);
    expect(payload.userId).toBe("user-1");
    expect(payload.email).toBe("test@example.com");
  });
});
