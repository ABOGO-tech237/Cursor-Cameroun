import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { turnstileMode, verifyTurnstileToken } from "./turnstile";

describe("turnstileMode", () => {
  it("n'est actif que si les deux clés sont présentes", () => {
    assert.equal(turnstileMode({}), "off");
    assert.equal(turnstileMode({ siteKey: "site", secretKey: "secret" }), "on");
    assert.equal(turnstileMode({ siteKey: "site" }), "misconfigured");
    assert.equal(turnstileMode({ secretKey: "secret" }), "misconfigured");
  });
});

describe("verifyTurnstileToken", () => {
  it("accepte uniquement success: true", async () => {
    const ok = await verifyTurnstileToken("token", "secret", "203.0.113.5", async () =>
      Response.json({ success: true }),
    );
    const refused = await verifyTurnstileToken("token", "secret", "203.0.113.5", async () =>
      Response.json({ success: false }),
    );
    assert.equal(ok, true);
    assert.equal(refused, false);
  });
});
