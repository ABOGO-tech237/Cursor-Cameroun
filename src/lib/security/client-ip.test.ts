import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientIp } from "./client-ip";

describe("clientIp", () => {
  it("prend le premier saut de x-forwarded-for", () => {
    const request = new Request("http://localhost/api/send", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    assert.equal(clientIp(request), "203.0.113.5");
  });

  it("retombe sur x-real-ip puis unknown", () => {
    const real = new Request("http://localhost/api/send", {
      headers: { "x-real-ip": "198.51.100.8" },
    });
    assert.equal(clientIp(real), "198.51.100.8");
    assert.equal(clientIp(new Request("http://localhost/api/send")), "unknown");
  });
});
