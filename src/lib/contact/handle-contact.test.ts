import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleContactPost, type ContactHandlerDeps } from "./handle-contact";
import type { ContactEmail } from "../email/contact-email";
import { createMemoryRateLimiter } from "../security/rate-limit";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Sujet valide",
  message: "Un message assez long.",
  consent: true,
  hp: "",
};

function request(body: unknown, ip = "203.0.113.20") {
  return new Request("http://localhost/api/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      "x-locale": "fr",
    },
    body: JSON.stringify(body),
  });
}

function deps(overrides: Partial<ContactHandlerDeps> = {}): ContactHandlerDeps & {
  sent: ContactEmail[];
} {
  const sent: ContactEmail[] = [];
  return {
    sent,
    env: { nodeEnv: "development" },
    limiter: createMemoryRateLimiter({ limit: 5, windowMs: 60_000 }),
    send: async (_apiKey, email) => {
      sent.push(email);
      return { ok: true };
    },
    ...overrides,
  };
}

const t = (key: string) => key;

describe("handleContactPost", () => {
  it("répond 503 en production sans clé Resend", async () => {
    const kit = deps({ env: { nodeEnv: "production" } });
    const response = await handleContactPost(request(valid), t, kit);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.code, "unavailable");
    assert.equal(body.success, undefined);
    assert.equal(kit.sent.length, 0);
  });

  it("simule l'envoi en développement sans clé", async () => {
    const kit = deps();
    const response = await handleContactPost(request(valid), t, kit);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.mock, true);
    assert.equal(kit.sent.length, 0);
  });

  it("envoie un HTML échappé, depuis RESEND_FROM, vers CONTACT_EMAIL, replyTo = expéditeur", async () => {
    const kit = deps({
      env: {
        nodeEnv: "production",
        resendApiKey: "re_test",
        resendFrom: "Cursor Cameroun <contact@example.com>",
        contactEmail: "hello@example.com",
      },
    });
    const response = await handleContactPost(
      request({
        ...valid,
        name: "Ada <b>",
        message: `Bonjour <script>alert(1)</script> assez long`,
      }),
      t,
      kit,
    );
    assert.equal(response.status, 200);
    assert.equal(kit.sent.length, 1);
    const email = kit.sent[0];
    assert.equal(email.from, "Cursor Cameroun <contact@example.com>");
    assert.equal(email.to, "hello@example.com");
    assert.equal(email.replyTo, "ada@example.com");
    assert.equal(email.html.includes("<script>"), false);
    assert.match(email.html, /&lt;script&gt;/);
    assert.match(email.html, /Ada &lt;b&gt;/);
  });

  it("ne envoie rien si le honeypot est rempli", async () => {
    const kit = deps({
      env: {
        nodeEnv: "production",
        resendApiKey: "re_test",
        resendFrom: "Cursor Cameroun <contact@example.com>",
        contactEmail: "hello@example.com",
      },
    });
    const response = await handleContactPost(request({ ...valid, hp: "robot" }), t, kit);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(kit.sent.length, 0);
  });

  it("refuse un consentement non coché avec le message traduit", async () => {
    const kit = deps();
    const response = await handleContactPost(request({ ...valid, consent: false }), t, kit);
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.fieldErrors.consent, "consent");
    assert.equal(kit.sent.length, 0);
  });
});
