import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPartnerSchema, partnerFieldErrors } from "./partner";

const t = (key: string) => key;
const schema = createPartnerSchema(t);

const valid = {
  organization: "Hub Test",
  contactName: "Ada Lovelace",
  whatsapp: "+237 677 00 00 00",
  contactPreference: "whatsapp",
  email: "ada@example.com",
  city: "yaounde",
  country: "",
  link: "",
  sector: "startup",
  offers: ["visibility"],
  capacity: "",
  wifi: "",
  power: "",
  av: "",
  availability: "",
  details: "Précision utile.",
  consent: true,
};

describe("createPartnerSchema", () => {
  it("accepte une proposition sans salle et sans logo", () => {
    const parsed = schema.safeParse({ ...valid, logo: "/logos/fake.svg" });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal("logo" in parsed.data, false);
    }
  });

  it("exige le pays pour la diaspora et l'ignore pour une ville du Cameroun", () => {
    const missing = schema.safeParse({ ...valid, city: "diaspora", country: " " });
    assert.equal(missing.success, false);
    if (!missing.success) {
      assert.equal(partnerFieldErrors(missing.error).country, "countryMin");
    }

    const cameroon = schema.safeParse({ ...valid, city: "limbe", country: "" });
    assert.equal(cameroon.success, true);
  });

  it("demande les précisions de salle uniquement si l'offre est cochée", () => {
    const missing = schema.safeParse({ ...valid, offers: ["venue"] });
    assert.equal(missing.success, false);
    if (!missing.success) {
      const fields = partnerFieldErrors(missing.error);
      assert.equal(fields.capacity, "capacity");
      assert.equal(fields.wifi, "wifi");
      assert.equal(fields.power, "power");
      assert.equal(fields.av, "av");
      assert.equal(fields.availability, "availability");
    }

    const complete = schema.safeParse({
      ...valid,
      offers: ["venue", "catering"],
      capacity: "40",
      wifi: "Fibre, 50 Mb/s",
      power: "generator",
      av: "Projecteur et sono",
      availability: "Samedis après-midi",
    });
    assert.equal(complete.success, true);
  });

  it("refuse un WhatsApp sans indicatif, un lien invalide et un consentement décoché", () => {
    const parsed = schema.safeParse({
      ...valid,
      whatsapp: "677000000",
      link: "javascript:alert(1)",
      consent: false,
      offers: [],
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      const fields = partnerFieldErrors(parsed.error);
      assert.equal(fields.whatsapp, "whatsapp");
      assert.equal(fields.link, "link");
      assert.equal(fields.consent, "consent");
      assert.equal(fields.offers, "offersMin");
    }
  });
});
