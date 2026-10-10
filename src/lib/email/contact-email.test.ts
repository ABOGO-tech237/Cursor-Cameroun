import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildContactEmail } from "./contact-email";

const payload = {
  name: `Ada <b>Lovelace</b>`,
  email: `ada@example.com`,
  subject: `Sujet <img src=x onerror=alert(1)>`,
  message: `Bonjour <script>alert("x")</script>`,
  from: "Cursor Cameroun <contact@example.com>",
  to: "hello@example.com",
};

describe("buildContactEmail", () => {
  it("échappe chaque champ inséré dans le HTML", () => {
    const email = buildContactEmail(payload);

    assert.equal(email.html.includes("<script>"), false);
    assert.equal(email.html.includes("<img"), false);
    assert.equal(email.html.includes("<b>"), false);
    assert.match(email.html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
    assert.match(email.html, /Ada &lt;b&gt;Lovelace&lt;\/b&gt;/);
    assert.match(email.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(email.html, /ada@example.com/);
  });

  it("garde le replyTo sur l'adresse de la personne et nettoie le sujet", () => {
    const email = buildContactEmail({
      ...payload,
      email: "ada@example.com\r\nBcc: evil@example.com",
      subject: "Hello\r\nBcc: evil@example.com",
    });

    assert.equal(email.replyTo.includes("\n"), false);
    assert.equal(email.replyTo.includes("\r"), false);
    assert.equal(email.subject.includes("\n"), false);
    assert.match(email.subject, /^\[Contact\] Hello/);
    assert.equal(email.from, payload.from);
    assert.equal(email.to, payload.to);
  });
});
