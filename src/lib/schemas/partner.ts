import { z } from "zod";

/** Limites partagées par le formulaire et `POST /api/partners`. */
export const PARTNER_LIMITS = {
  organization: { min: 2, max: 120 },
  contactName: { min: 2, max: 80 },
  whatsapp: { max: 32 },
  email: { max: 254 },
  country: { min: 2, max: 80 },
  link: { max: 300 },
  wifi: { min: 2, max: 120 },
  av: { min: 2, max: 160 },
  availability: { min: 2, max: 300 },
  details: { max: 5000 },
} as const;

export const PARTNER_CITIES = [
  "yaounde",
  "douala",
  "bafoussam",
  "buea",
  "bamenda",
  "limbe",
  "kribi",
  "garoua",
  "maroua",
  "ngaoundere",
  "bertoua",
  "ebolowa",
  "other",
  "diaspora",
] as const;

export const PARTNER_SECTORS = [
  "school",
  "coworking",
  "tech",
  "telecom",
  "finance",
  "media",
  "ngo",
  "startup",
  "international",
  "other",
] as const;

export const PARTNER_OFFERS = [
  "venue",
  "visibility",
  "catering",
  "equipment",
  "mentoring",
  "funding",
  "other",
] as const;

export const PARTNER_CONTACT_PREFERENCES = ["whatsapp", "call", "email"] as const;

export const PARTNER_POWER = ["generator", "ups", "both", "none"] as const;

export type PartnerCity = (typeof PARTNER_CITIES)[number];
export type PartnerSector = (typeof PARTNER_SECTORS)[number];
export type PartnerOffer = (typeof PARTNER_OFFERS)[number];
export type PartnerContactPreference = (typeof PARTNER_CONTACT_PREFERENCES)[number];
export type PartnerPower = (typeof PARTNER_POWER)[number];

export type PartnerValidationKey =
  | "organizationMin"
  | "organizationMax"
  | "contactNameMin"
  | "contactNameMax"
  | "whatsapp"
  | "whatsappMax"
  | "preference"
  | "email"
  | "emailMax"
  | "city"
  | "countryMin"
  | "countryMax"
  | "link"
  | "linkMax"
  | "sector"
  | "offersMin"
  | "offerUnknown"
  | "capacity"
  | "wifi"
  | "wifiMax"
  | "power"
  | "av"
  | "avMax"
  | "availability"
  | "availabilityMax"
  | "detailsMax"
  | "consent";

export type PartnerTranslator = (key: PartnerValidationKey) => string;

const CITY_SET = new Set<string>(PARTNER_CITIES);
const SECTOR_SET = new Set<string>(PARTNER_SECTORS);
const PREFERENCE_SET = new Set<string>(PARTNER_CONTACT_PREFERENCES);
const POWER_SET = new Set<string>(PARTNER_POWER);

export function canonicalWhatsapp(value: string): string {
  return value.replace(/[\s().-]/g, "");
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Schéma unique du formulaire « Devenir partenaire ».
 * Les messages viennent de next-intl (FR/EN) via `t`, côté client et serveur.
 * Le logo n'est pas un champ : il n'est ajouté qu'après accord, dans les données.
 */
export function createPartnerSchema(t: PartnerTranslator) {
  return z
    .object({
      organization: z
        .string()
        .trim()
        .min(PARTNER_LIMITS.organization.min, t("organizationMin"))
        .max(PARTNER_LIMITS.organization.max, t("organizationMax")),
      contactName: z
        .string()
        .trim()
        .min(PARTNER_LIMITS.contactName.min, t("contactNameMin"))
        .max(PARTNER_LIMITS.contactName.max, t("contactNameMax")),
      whatsapp: z.string().trim().max(PARTNER_LIMITS.whatsapp.max, t("whatsappMax")),
      contactPreference: z.string().trim(),
      email: z
        .string()
        .trim()
        .max(PARTNER_LIMITS.email.max, t("emailMax"))
        .email(t("email")),
      city: z.string().trim(),
      country: z.string().trim().max(PARTNER_LIMITS.country.max, t("countryMax")),
      link: z.string().trim().max(PARTNER_LIMITS.link.max, t("linkMax")),
      sector: z.string().trim(),
      offers: z.array(z.enum(PARTNER_OFFERS, { error: t("offerUnknown") })).min(1, t("offersMin")),
      capacity: z.string().trim().max(6, t("capacity")),
      wifi: z.string().trim().max(PARTNER_LIMITS.wifi.max, t("wifiMax")),
      power: z.string().trim(),
      av: z.string().trim().max(PARTNER_LIMITS.av.max, t("avMax")),
      availability: z.string().trim().max(PARTNER_LIMITS.availability.max, t("availabilityMax")),
      details: z.string().trim().max(PARTNER_LIMITS.details.max, t("detailsMax")),
      consent: z.boolean().refine((value) => value === true, t("consent")),
    })
    .superRefine((data, ctx) => {
      if (!/^\+[1-9]\d{7,14}$/.test(canonicalWhatsapp(data.whatsapp))) {
        ctx.addIssue({ code: "custom", path: ["whatsapp"], message: t("whatsapp") });
      }

      if (!PREFERENCE_SET.has(data.contactPreference)) {
        ctx.addIssue({ code: "custom", path: ["contactPreference"], message: t("preference") });
      }

      if (!CITY_SET.has(data.city)) {
        ctx.addIssue({ code: "custom", path: ["city"], message: t("city") });
      }

      if (data.city === "diaspora" && data.country.trim().length < PARTNER_LIMITS.country.min) {
        ctx.addIssue({ code: "custom", path: ["country"], message: t("countryMin") });
      }

      if (data.link && !isHttpUrl(data.link)) {
        ctx.addIssue({ code: "custom", path: ["link"], message: t("link") });
      }

      if (!SECTOR_SET.has(data.sector)) {
        ctx.addIssue({ code: "custom", path: ["sector"], message: t("sector") });
      }

      if (!data.offers.includes("venue")) return;

      if (!/^[1-9]\d{0,5}$/.test(data.capacity)) {
        ctx.addIssue({ code: "custom", path: ["capacity"], message: t("capacity") });
      }
      if (data.wifi.trim().length < PARTNER_LIMITS.wifi.min) {
        ctx.addIssue({ code: "custom", path: ["wifi"], message: t("wifi") });
      }
      if (!POWER_SET.has(data.power)) {
        ctx.addIssue({ code: "custom", path: ["power"], message: t("power") });
      }
      if (data.av.trim().length < PARTNER_LIMITS.av.min) {
        ctx.addIssue({ code: "custom", path: ["av"], message: t("av") });
      }
      if (data.availability.trim().length < PARTNER_LIMITS.availability.min) {
        ctx.addIssue({
          code: "custom",
          path: ["availability"],
          message: t("availability"),
        });
      }
    });
}

export type PartnerFormValues = z.infer<ReturnType<typeof createPartnerSchema>>;

export function partnerFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}
