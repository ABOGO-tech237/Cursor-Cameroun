import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryRateLimiter } from "./rate-limit";

describe("createMemoryRateLimiter", () => {
  it("bloque au-delà du seuil puis se rouvre à la fenêtre suivante", () => {
    let now = 1_000;
    const limiter = createMemoryRateLimiter({
      limit: 2,
      windowMs: 10_000,
      now: () => now,
    });

    assert.equal(limiter.check("203.0.113.5").ok, true);
    assert.equal(limiter.check("203.0.113.5").ok, true);
    const blocked = limiter.check("203.0.113.5");
    assert.equal(blocked.ok, false);
    assert.equal(blocked.retryAfterSeconds, 10);

    assert.equal(limiter.check("203.0.113.9").ok, true);

    now += 10_000;
    assert.equal(limiter.check("203.0.113.5").ok, true);
  });
});
