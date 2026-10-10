import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMailMode } from "./mail-mode";

describe("resolveMailMode", () => {
  it("simule uniquement en développement sans clé", () => {
    assert.deepEqual(
      resolveMailMode({ nodeEnv: "development" }),
      { kind: "simulate" },
    );
  });

  it("refuse l'envoi hors développement si la clé manque", () => {
    for (const nodeEnv of ["production", "test", undefined]) {
      assert.equal(resolveMailMode({ nodeEnv }).kind, "unavailable");
    }
  });

  it("exige RESEND_FROM et CONTACT_EMAIL dès qu'une clé est présente", () => {
    assert.equal(
      resolveMailMode({
        nodeEnv: "development",
        resendApiKey: "re_test",
        resendFrom: "Cursor <contact@example.com>",
      }).kind,
      "unavailable",
    );
    assert.deepEqual(
      resolveMailMode({
        nodeEnv: "production",
        resendApiKey: " re_test ",
        resendFrom: " Cursor Cameroun <contact@example.com> ",
        contactEmail: " hello@example.com ",
      }),
      {
        kind: "send",
        apiKey: "re_test",
        from: "Cursor Cameroun <contact@example.com>",
        to: "hello@example.com",
      },
    );
  });
});
