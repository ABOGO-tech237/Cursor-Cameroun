import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { honeypotTripped, protectPublicForm } from "./form-guard";
import { createMemoryRateLimiter } from "./rate-limit";

function request(ip = "203.0.113.5") {
  return new Request("http://localhost/api/send", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("honeypotTripped", () => {
  it("ignore un champ vide et réagit à une valeur", () => {
    assert.equal(honeypotTripped({ hp: "" }), false);
    assert.equal(honeypotTripped({ hp: "   " }), false);
    assert.equal(honeypotTripped({}), false);
    assert.equal(honeypotTripped({ hp: "https://spam.example" }), true);
    assert.equal(honeypotTripped({ hp: ["x"] }), true);
  });
});

describe("protectPublicForm", () => {
  it("laisse passer sans Turnstile", async () => {
    const result = await protectPublicForm({
      request: request(),
      body: { hp: "" },
      limiter: createMemoryRateLimiter({ limit: 5, windowMs: 60_000 }),
    });
    assert.deepEqual(result, { action: "continue" });
  });

  it("répond en silence si le honeypot est rempli", async () => {
    const result = await protectPublicForm({
      request: request(),
      body: { hp: "robot" },
      limiter: createMemoryRateLimiter({ limit: 5, windowMs: 60_000 }),
    });
    assert.deepEqual(result, { action: "silence" });
  });

  it("limite par IP", async () => {
    const limiter = createMemoryRateLimiter({ limit: 1, windowMs: 60_000 });
    await protectPublicForm({ request: request(), body: {}, limiter });
    const blocked = await protectPublicForm({ request: request(), body: {}, limiter });
    assert.equal(blocked.action, "reject");
    if (blocked.action === "reject") {
      assert.equal(blocked.status, 429);
      assert.equal(blocked.code, "rateLimited");
    }
  });

  it("exige un jeton valable quand Turnstile est configuré", async () => {
    const limiter = createMemoryRateLimiter({ limit: 5, windowMs: 60_000 });
    const missing = await protectPublicForm({
      request: request("203.0.113.8"),
      body: {},
      limiter,
      turnstileSiteKey: "site",
      turnstileSecretKey: "secret",
      verifyTurnstile: async () => true,
    });
    assert.equal(missing.action, "reject");
    if (missing.action === "reject") assert.equal(missing.status, 403);

    const ok = await protectPublicForm({
      request: request("203.0.113.9"),
      body: { turnstileToken: "token" },
      limiter: createMemoryRateLimiter({ limit: 5, windowMs: 60_000 }),
      turnstileSiteKey: "site",
      turnstileSecretKey: "secret",
      verifyTurnstile: async (token, secret) => token === "token" && secret === "secret",
    });
    assert.equal(ok.action, "continue");
  });

  it("refuse si une seule clé Turnstile est définie", async () => {
    const result = await protectPublicForm({
      request: request("203.0.113.10"),
      body: { turnstileToken: "token" },
      limiter: createMemoryRateLimiter({ limit: 5, windowMs: 60_000 }),
      turnstileSiteKey: "site",
    });
    assert.equal(result.action, "reject");
    if (result.action === "reject") assert.equal(result.status, 503);
  });
});
