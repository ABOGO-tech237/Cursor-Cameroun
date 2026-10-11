import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTranslator } from "use-intl/core";
import { LINKS } from "@/data/links";
import fr from "../../../messages/fr.json";
import en from "../../../messages/en.json";
import type { OutboundEmail } from "../email/send-resend";
import { createMemoryRateLimiter } from "../security/rate-limit";
import {
  PARTNER_CITIES,
  PARTNER_CONTACT_PREFERENCES,
  PARTNER_OFFERS,
  PARTNER_POWER,
  PARTNER_SECTORS,
} from "../schemas/partner";
import { handlePartnerPost, type PartnerHandlerDeps } from "./handle-partner";
import {
  partnerMailCopy,
  partnerMessages,
  readPartnerMessage,
  type PartnerMailCopy,
} from "./partner-email";

const valid = {
  organization: "Hub <b>Test</b>",
  contactName: "Ada Lovelace",
  whatsapp: "+237 677 00 00 00",
  contactPreference: "whatsapp",
  email: "ada@example.com",
  city: "yaounde",
  country: "",
  link: "https://example.com/hub",
  sector: "startup",
  offers: ["visibility"],
  capacity: "",
  wifi: "",
  power: "",
  av: "",
  availability: "",
  details: `Bonjour <script>alert(1)</script>`,
  consent: true,
  hp: "",
};

function names<T extends readonly string[]>(values: T): Record<T[number], string> {
  return Object.fromEntries(values.map((value) => [value, value])) as Record<T[number], string>;
}

function copy(overrides: Partial<PartnerMailCopy> = {}): PartnerMailCopy {
  return {
    teamSubject: "[Partenaires] {organization}",
    teamIntro: "Nouvelle proposition",
    ackSubject: "Accusé",
    ackGreeting: "Bonjour {name},",
    ackBody: "Proposition de {organization}.",
    ackDelay: "Nous vous répondons sous cinq jours ouvrés.",
    ackWhatsapp: "Vous pouvez aussi joindre la communauté sur WhatsApp.",
    labels: {
      organization: "Organisation",
      contactName: "Nom",
      whatsapp: "WhatsApp",
      preference: "Préférence",
      email: "E-mail",
      city: "Ville",
      country: "Pays",
      link: "Lien",
      sector: "Secteur",
      offers: "Offres",
      capacity: "Capacité",
      wifi: "Wifi",
      power: "Électricité",
      av: "Projecteur",
      availability: "Disponibilités",
      details: "Précisions",
      locale: "Langue",
      preferences: names(PARTNER_CONTACT_PREFERENCES),
      cities: names(PARTNER_CITIES),
      sectors: names(PARTNER_SECTORS),
      offerNames: names(PARTNER_OFFERS),
      powerOptions: names(PARTNER_POWER),
    },
    ...overrides,
  };
}

function request(body: unknown, ip = "203.0.113.40") {
  return new Request("http://localhost/api/partners", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      "x-real-ip": ip,
      "x-locale": "fr",
    },
    body: JSON.stringify(body),
  });
}

function deps(overrides: Partial<PartnerHandlerDeps> = {}): PartnerHandlerDeps & {
  sent: OutboundEmail[];
} {
  const sent: OutboundEmail[] = [];
  return {
    sent,
    env: { nodeEnv: "development" },
    limiter: createMemoryRateLimiter({ limit: 5, windowMs: 60_000 }),
    locale: "fr",
    copy: copy(),
    send: async (_apiKey, email) => {
      sent.push(email);
      return { ok: true };
    },
    ...overrides,
  };
}

const readyEnv = {
  nodeEnv: "production",
  resendApiKey: "re_test",
  resendFrom: "Cursor Cameroun <contact@example.com>",
  contactEmail: "equipe@example.com",
};

const t = (key: string) => key;

describe("handlePartnerPost", () => {
  it("répond 503 en production sans clé Resend et n'envoie rien", async () => {
    const kit = deps({ env: { nodeEnv: "production" } });
    const response = await handlePartnerPost(request(valid), t, kit);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.code, "unavailable");
    assert.equal(kit.sent.length, 0);
  });

  it("simule en développement sans envoyer l'accusé", async () => {
    const kit = deps();
    const response = await handlePartnerPost(request(valid), t, kit);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.mock, true);
    assert.equal(kit.sent.length, 0);
  });

  it("écrit d'abord à l'équipe, puis l'accusé au partenaire si l'envoi a réussi", async () => {
    const kit = deps({ env: readyEnv, locale: "fr" });
    const response = await handlePartnerPost(request(valid), t, kit);
    assert.equal(response.status, 200);
    assert.equal(kit.sent.length, 2);

    const [team, ack] = kit.sent;
    assert.equal(team.to, "equipe@example.com");
    assert.equal(team.replyTo, "ada@example.com");
    assert.equal(ack.to, "ada@example.com");
    assert.equal(ack.replyTo, "equipe@example.com");
    assert.match(ack.text, /cinq jours ouvrés/);
    assert.match(ack.html, new RegExp(LINKS.whatsapp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(team.html.includes("<script>"), false);
    assert.equal(team.html.includes("<b>"), false);
    assert.match(team.html, /Hub &lt;b&gt;Test&lt;\/b&gt;/);
    assert.match(team.html, /&lt;script&gt;/);
    assert.equal(team.html.includes("/logos/"), false);
  });

  it("n'envoie pas l'accusé si le message à l'équipe échoue", async () => {
    const kit = deps({
      env: readyEnv,
      send: async (_apiKey, email) => {
        kit.sent.push(email);
        return { ok: false };
      },
    });
    const response = await handlePartnerPost(request(valid), t, kit);
    assert.equal(response.status, 502);
    assert.equal(kit.sent.length, 1);
    assert.equal(kit.sent[0].to, "equipe@example.com");
  });

  it("inclut la salle et le pays seulement quand ils sont demandés", async () => {
    const kit = deps({ env: readyEnv });
    await handlePartnerPost(
      request({
        ...valid,
        city: "diaspora",
        country: "France",
        offers: ["venue"],
        capacity: "80",
        wifi: "Fibre 100 Mb/s",
        power: "ups",
        av: "Projecteur",
        availability: "En semaine",
        organization: "Diaspora Hub",
      }),
      t,
      kit,
    );
    const team = kit.sent[0];
    assert.match(team.text, /France/);
    assert.match(team.text, /Fibre 100 Mb\/s/);
    assert.match(team.text, /ups/);

    const plain = deps({ env: readyEnv });
    await handlePartnerPost(request({ ...valid, organization: "Sans salle" }), t, plain);
    assert.equal(plain.sent[0].text.includes("Fibre"), false);
    assert.equal(plain.sent[0].text.includes("France"), false);
  });

  it("reste silencieux si le honeypot est rempli", async () => {
    const kit = deps({ env: readyEnv });
    const response = await handlePartnerPost(request({ ...valid, hp: "robot" }), t, kit);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(kit.sent.length, 0);
  });
});

describe("copies FR et EN", () => {
  it("annoncent un délai différent et le lien n'est pas dans la traduction", () => {
    assert.match(fr.partners.email.ackDelay, /jours/);
    assert.match(en.partners.email.ackDelay, /days/);
    assert.notEqual(fr.partners.email.ackDelay, en.partners.email.ackDelay);
    assert.equal(JSON.stringify(fr.partners).includes("re_"), false);
  });

  it("remplit les gabarits lus tels quels, sans interpolation ICU", () => {
    const translator = createTranslator({
      locale: "fr",
      messages: fr.partners,
    });
    const built = partnerMessages(
      valid,
      partnerMailCopy((key) => readPartnerMessage((rawKey) => translator.raw(rawKey), key)),
      "fr",
    );
    assert.equal(built.teamSubject, "[Partenaires] Hub <b>Test</b>");
    assert.equal(built.ackGreeting, "Bonjour Ada Lovelace,");
    assert.match(built.ackBody, /Hub <b>Test<\/b>/);
    assert.match(built.ackDelay, /cinq jours ouvrés/);
    assert.equal(built.whatsappUrl, LINKS.whatsapp);

    const english = createTranslator({ locale: "en", messages: en.partners });
    assert.match(String(english.raw("email.ackGreeting")), /\{name\}/);
    assert.match(String(english.raw("email.ackBody")), /\{organization\}/);
  });
});
