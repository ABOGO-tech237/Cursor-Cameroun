import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONTACT_LIMITS, contactFieldErrors, createContactSchema } from "./contact";

const t = (key: string) => key;
const schema = createContactSchema(t);

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Sujet valide",
  message: "Un message assez long.",
  consent: true,
};

describe("createContactSchema", () => {
  it("accepte un formulaire complet", () => {
    assert.equal(schema.safeParse(valid).success, true);
  });

  it("refuse le consentement absent ou non coché", () => {
    const missing = schema.safeParse({ ...valid, consent: false });
    assert.equal(missing.success, false);
    if (!missing.success) {
      assert.equal(contactFieldErrors(missing.error).consent, "consent");
    }
  });

  it("applique les longueurs maximales et les messages traduits", () => {
    const parsed = schema.safeParse({
      ...valid,
      name: "A".repeat(CONTACT_LIMITS.name.max + 1),
      email: `${"a".repeat(CONTACT_LIMITS.email.max)}@example.com`,
      subject: "S".repeat(CONTACT_LIMITS.subject.max + 1),
      message: "M".repeat(CONTACT_LIMITS.message.max + 1),
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      const fields = contactFieldErrors(parsed.error);
      assert.equal(fields.name, "nameMax");
      assert.equal(fields.email, "emailMax");
      assert.equal(fields.subject, "subjectMax");
      assert.equal(fields.message, "messageMax");
    }
  });

  it("rejette un e-mail invalide et les champs trop courts", () => {
    const parsed = schema.safeParse({
      name: "A",
      email: "pas-un-email",
      subject: "Hi",
      message: "Court",
      consent: true,
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      const fields = contactFieldErrors(parsed.error);
      assert.equal(fields.name, "nameMin");
      assert.equal(fields.email, "email");
      assert.equal(fields.subject, "subjectMin");
      assert.equal(fields.message, "messageMin");
    }
  });
});
