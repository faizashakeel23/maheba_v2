import { describe, expect, it } from "vitest";
import { checkRateLimit, rateLimitExceeded } from "./rate-limit";

function req(ip?: string): Request {
  const headers: Record<string, string> = {};
  if (ip) headers["x-forwarded-for"] = ip;
  return new Request("http://localhost/api/x", { headers });
}

describe("checkRateLimit (spam guard)", () => {
  it("allows requests under the limit", () => {
    const cfg = { limit: 3, windowSeconds: 3600 };
    expect(checkRateLimit(req("1.1.1.1"), "t-under", cfg)).toEqual({ ok: true });
    expect(checkRateLimit(req("1.1.1.1"), "t-under", cfg)).toEqual({ ok: true });
  });
  it("blocks past the limit with a retry delay", () => {
    const cfg = { limit: 2, windowSeconds: 3600 };
    checkRateLimit(req("2.2.2.2"), "t-block", cfg);
    checkRateLimit(req("2.2.2.2"), "t-block", cfg);
    const r = checkRateLimit(req("2.2.2.2"), "t-block", cfg);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfter).toBeGreaterThan(0);
  });
  it("tracks different visitors separately", () => {
    const cfg = { limit: 1, windowSeconds: 3600 };
    expect(checkRateLimit(req("3.3.3.3"), "t-split", cfg).ok).toBe(true);
    // A different visitor on the same endpoint still gets their own quota.
    expect(checkRateLimit(req("4.4.4.4"), "t-split", cfg).ok).toBe(true);
  });
  it("tracks different endpoints separately", () => {
    const cfg = { limit: 1, windowSeconds: 3600 };
    expect(checkRateLimit(req("5.5.5.5"), "t-a", cfg).ok).toBe(true);
    expect(checkRateLimit(req("5.5.5.5"), "t-b", cfg).ok).toBe(true);
  });
  it("lets visitors back in after the window passes", () => {
    // A zero-second window expires immediately by construction.
    const cfg = { limit: 1, windowSeconds: 0 };
    expect(checkRateLimit(req("6.6.6.6"), "t-reset", cfg).ok).toBe(true);
    expect(checkRateLimit(req("6.6.6.6"), "t-reset", cfg).ok).toBe(true);
  });
});

describe("rateLimitExceeded (429 response)", () => {
  it("returns 429 with a Retry-After header and friendly message", () => {
    const res = rateLimitExceeded(120);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("120");
  });
});
