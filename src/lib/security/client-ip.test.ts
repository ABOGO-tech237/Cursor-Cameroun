import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientIp } from "./client-ip";

function withVercel(value: string | undefined, run: () => void) {
  const previous = process.env.VERCEL;
  if (value === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = value;
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
}

describe("clientIp", () => {
  it("prend le premier saut de x-forwarded-for uniquement sur Vercel", () => {
    const request = new Request("http://localhost/api/send", {
      headers: {
        "x-forwarded-for": "203.0.113.5, 10.0.0.1",
        "x-real-ip": "198.51.100.8",
      },
    });

    withVercel("1", () => {
      assert.equal(clientIp(request), "203.0.113.5");
    });
  });

  it("ignore x-forwarded-for hors Vercel, même s'il est présent", () => {
    const request = new Request("http://localhost/api/send", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });

    withVercel(undefined, () => {
      assert.equal(clientIp(request), "unknown");
    });
  });

  it("hors Vercel, x-real-ip prime sur un x-forwarded-for forgé", () => {
    const request = new Request("http://localhost/api/send", {
      headers: {
        "x-forwarded-for": "203.0.113.5",
        "x-real-ip": "198.51.100.8",
      },
    });

    withVercel(undefined, () => {
      assert.equal(clientIp(request), "198.51.100.8");
    });
  });

  it("retombe sur unknown sans IP", () => {
    withVercel(undefined, () => {
      assert.equal(clientIp(new Request("http://localhost/api/send")), "unknown");
    });
  });
});
