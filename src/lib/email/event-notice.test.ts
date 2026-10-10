import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildEventCreatedEmail, notifyEventCreated, type EventNotice } from "./event-notice";
import type { OutboundEmail } from "./send-resend";

const event: EventNotice = {
  slug: "meetup-yaounde",
  name: "Meetup <script>",
  startDateISO: "2026-11-01",
  endDateISO: "2026-11-01",
  city: "Yaoundé",
  shortDescription: `Soirée <img src=x onerror=alert(1)>`,
};

describe("buildEventCreatedEmail", () => {
  it("échappe le HTML et n'invente pas de destinataire", () => {
    const email = buildEventCreatedEmail({
      event,
      from: "Cursor Cameroun <contact@example.com>",
      to: "equipe@example.com",
      eventUrl: "https://example.com/events/meetup-yaounde",
    });

    assert.equal(email.to, "equipe@example.com");
    assert.equal(email.html.includes("hello@cursor-cameroun.org"), false);
    assert.equal(email.html.includes("<script>"), false);
    assert.equal(email.html.includes("<img"), false);
    assert.match(email.html, /Meetup &lt;script&gt;/);
    assert.match(email.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  });
});

describe("notifyEventCreated", () => {
  it("n'envoie rien et n'utilise pas de repli quand l'envoi n'est pas configuré", async () => {
    const sent: OutboundEmail[] = [];
    const result = await notifyEventCreated({
      env: { nodeEnv: "production" },
      event,
      origin: "https://example.com",
      send: async (_apiKey, email) => {
        sent.push(email);
        return { ok: true };
      },
    });

    assert.equal(result, "skipped");
    assert.equal(sent.length, 0);
  });

  it("passe par le module d'envoi vers CONTACT_EMAIL", async () => {
    const sent: OutboundEmail[] = [];
    const result = await notifyEventCreated({
      env: {
        nodeEnv: "production",
        resendApiKey: "re_test",
        resendFrom: "Cursor Cameroun <contact@example.com>",
        contactEmail: "equipe@example.com",
      },
      event,
      origin: "https://example.com",
      send: async (_apiKey, email) => {
        sent.push(email);
        return { ok: true };
      },
    });

    assert.equal(result, "sent");
    assert.equal(sent.length, 1);
    assert.equal(sent[0].from, "Cursor Cameroun <contact@example.com>");
    assert.equal(sent[0].to, "equipe@example.com");
    assert.equal(sent[0].to.includes("hello@cursor-cameroun.org"), false);
    assert.match(sent[0].text, /https:\/\/example.com\/events\/meetup-yaounde/);
  });
});

describe("route événements", () => {
  it("ne contient plus le repli hello@cursor-cameroun.org", () => {
    const source = readFileSync(new URL("../../app/api/events/route.ts", import.meta.url), "utf8");
    assert.equal(source.includes("hello@cursor-cameroun.org"), false);
    assert.equal(source.includes("onboarding@resend.dev"), false);
    assert.match(source, /notifyEventCreated/);
  });
});
