import { z } from "zod";

/** Limites partagées par le formulaire et `POST /api/send`. */
export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  subject: { min: 5, max: 120 },
  message: { min: 10, max: 5000 },
} as const;

export type ContactValidationKey =
  | "nameMin"
  | "nameMax"
  | "email"
  | "emailMax"
  | "subjectMin"
  | "subjectMax"
  | "messageMin"
  | "messageMax"
  | "consent";

export type ContactTranslator = (key: ContactValidationKey) => string;

/**
 * Schéma unique du formulaire de contact.
 * Les messages viennent de next-intl (FR/EN) via `t`, côté client et serveur.
 */
export function createContactSchema(t: ContactTranslator) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(CONTACT_LIMITS.name.min, t("nameMin"))
      .max(CONTACT_LIMITS.name.max, t("nameMax")),
    email: z
      .string()
      .trim()
      .max(CONTACT_LIMITS.email.max, t("emailMax"))
      .email(t("email")),
    subject: z
      .string()
      .trim()
      .min(CONTACT_LIMITS.subject.min, t("subjectMin"))
      .max(CONTACT_LIMITS.subject.max, t("subjectMax")),
    message: z
      .string()
      .trim()
      .min(CONTACT_LIMITS.message.min, t("messageMin"))
      .max(CONTACT_LIMITS.message.max, t("messageMax")),
    consent: z.boolean().refine((value) => value === true, t("consent")),
  });
}

export type ContactFormValues = z.infer<ReturnType<typeof createContactSchema>>;

export function contactFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}
