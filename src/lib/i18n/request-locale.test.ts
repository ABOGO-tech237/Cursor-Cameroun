import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRequestLocale } from "./request-locale";

describe("resolveRequestLocale", () => {
  it("priorise x-locale puis le cookie puis Accept-Language", () => {
    const header = new Request("http://localhost/api/send", {
      headers: { "x-locale": "en", cookie: "NEXT_LOCALE=fr", "accept-language": "fr" },
    });
    assert.equal(resolveRequestLocale(header), "en");

    const cookie = new Request("http://localhost/api/send", {
      headers: { cookie: "NEXT_LOCALE=en", "accept-language": "fr" },
    });
    assert.equal(resolveRequestLocale(cookie), "en");

    const accept = new Request("http://localhost/api/send", {
      headers: { "accept-language": "en-US,en;q=0.9" },
    });
    assert.equal(resolveRequestLocale(accept), "en");
    assert.equal(resolveRequestLocale(new Request("http://localhost/api/send")), "fr");
  });
});
