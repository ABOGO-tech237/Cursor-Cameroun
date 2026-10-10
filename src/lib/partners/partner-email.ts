import { LINKS } from "@/data/links";
import { escapeHtml, sanitizeHeader } from "../email/escape-html";
import type { OutboundEmail } from "../email/send-resend";
import type {
  PartnerCity,
  PartnerContactPreference,
  PartnerFormValues,
  PartnerOffer,
  PartnerPower,
  PartnerSector,
} from "../schemas/partner";

export type PartnerMailCopy = {
  teamSubject: string;
  teamIntro: string;
  ackSubject: string;
  ackGreeting: string;
  ackBody: string;
  ackDelay: string;
  ackWhatsapp: string;
  labels: {
    organization: string;
    contactName: string;
    whatsapp: string;
    preference: string;
    email: string;
    city: string;
    country: string;
    link: string;
    sector: string;
    offers: string;
    capacity: string;
    wifi: string;
    power: string;
    av: string;
    availability: string;
    details: string;
    locale: string;
    preferences: Record<PartnerContactPreference, string>;
    cities: Record<PartnerCity, string>;
    sectors: Record<PartnerSector, string>;
    offerNames: Record<PartnerOffer, string>;
    powerOptions: Record<PartnerPower, string>;
  };
};

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

/** Libellés déjà traduits (FR ou EN) pour les deux e-mails. */
export function partnerMailCopy(t: (key: string) => string): PartnerMailCopy {
  const preferences = ["whatsapp", "call", "email"] as const;
  const cities = [
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
  const sectors = [
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
  const offers = [
    "venue",
    "visibility",
    "catering",
    "equipment",
    "mentoring",
    "funding",
    "other",
  ] as const;
  const power = ["generator", "ups", "both", "none"] as const;

  return {
    teamSubject: t("email.teamSubject"),
    teamIntro: t("email.teamIntro"),
    ackSubject: t("email.ackSubject"),
    ackGreeting: t("email.ackGreeting"),
    ackBody: t("email.ackBody"),
    ackDelay: t("email.ackDelay"),
    ackWhatsapp: t("email.ackWhatsapp"),
    labels: {
      organization: t("fields.organization"),
      contactName: t("fields.contactName"),
      whatsapp: t("fields.whatsapp"),
      preference: t("fields.preference"),
      email: t("fields.email"),
      city: t("fields.city"),
      country: t("fields.country"),
      link: t("fields.link"),
      sector: t("fields.sector"),
      offers: t("fields.offers"),
      capacity: t("fields.capacity"),
      wifi: t("fields.wifi"),
      power: t("fields.power"),
      av: t("fields.av"),
      availability: t("fields.availability"),
      details: t("fields.details"),
      locale: t("fields.locale"),
      preferences: Object.fromEntries(preferences.map((key) => [key, t(`preferences.${key}`)])) as Record<
        PartnerContactPreference,
        string
      >,
      cities: Object.fromEntries(cities.map((key) => [key, t(`cities.${key}`)])) as Record<
        PartnerCity,
        string
      >,
      sectors: Object.fromEntries(sectors.map((key) => [key, t(`sectors.${key}`)])) as Record<
        PartnerSector,
        string
      >,
      offerNames: Object.fromEntries(offers.map((key) => [key, t(`offerNames.${key}`)])) as Record<
        PartnerOffer,
        string
      >,
      powerOptions: Object.fromEntries(power.map((key) => [key, t(`powerOptions.${key}`)])) as Record<
        PartnerPower,
        string
      >,
    },
  };
}

export function partnerEmailRows(
  data: PartnerFormValues,
  copy: PartnerMailCopy,
  locale: string,
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: copy.labels.organization, value: data.organization },
    { label: copy.labels.contactName, value: data.contactName },
    { label: copy.labels.whatsapp, value: data.whatsapp },
    {
      label: copy.labels.preference,
      value: copy.labels.preferences[data.contactPreference as PartnerContactPreference] ?? data.contactPreference,
    },
    { label: copy.labels.email, value: data.email },
    {
      label: copy.labels.city,
      value: copy.labels.cities[data.city as PartnerCity] ?? data.city,
    },
  ];

  if (data.city === "diaspora") {
    rows.push({ label: copy.labels.country, value: data.country });
  }
  if (data.link.trim()) {
    rows.push({ label: copy.labels.link, value: data.link.trim() });
  }
  rows.push({
    label: copy.labels.sector,
    value: copy.labels.sectors[data.sector as PartnerSector] ?? data.sector,
  });
  rows.push({
    label: copy.labels.offers,
    value: data.offers.map((offer) => copy.labels.offerNames[offer] ?? offer).join(", "),
  });

  if (data.offers.includes("venue")) {
    rows.push({ label: copy.labels.capacity, value: data.capacity });
    rows.push({ label: copy.labels.wifi, value: data.wifi });
    rows.push({
      label: copy.labels.power,
      value: copy.labels.powerOptions[data.power as PartnerPower] ?? data.power,
    });
    rows.push({ label: copy.labels.av, value: data.av });
    rows.push({ label: copy.labels.availability, value: data.availability });
  }

  if (data.details.trim()) {
    rows.push({ label: copy.labels.details, value: data.details.trim() });
  }

  rows.push({ label: copy.labels.locale, value: locale });
  return rows;
}

export function buildPartnerTeamEmail(input: {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  intro: string;
  rows: { label: string; value: string }[];
}): OutboundEmail {
  const rowsHtml = input.rows
    .map(
      (row) =>
        `<p><strong>${escapeHtml(row.label)} :</strong> ${escapeHtml(row.value)}</p>`,
    )
    .join("\n");
  const rowsText = input.rows.map((row) => `${row.label} : ${row.value}`).join("\n");

  return {
    from: sanitizeHeader(input.from),
    to: sanitizeHeader(input.to),
    replyTo: sanitizeHeader(input.replyTo),
    subject: sanitizeHeader(input.subject),
    text: `${input.intro}\n\n${rowsText}`,
    html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; color: #000000;">
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 12px;">${escapeHtml(input.intro)}</h2>
          ${rowsHtml}
        </div>
      `,
  };
}

export function buildPartnerAckEmail(input: {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  greeting: string;
  body: string;
  delay: string;
  whatsappLead: string;
  whatsappUrl: string;
}): OutboundEmail {
  const whatsappUrl = escapeHtml(input.whatsappUrl);

  return {
    from: sanitizeHeader(input.from),
    to: sanitizeHeader(input.to),
    replyTo: sanitizeHeader(input.replyTo),
    subject: sanitizeHeader(input.subject),
    text: [
      input.greeting,
      "",
      input.body,
      "",
      input.delay,
      "",
      `${input.whatsappLead} ${input.whatsappUrl}`,
    ].join("\n"),
    html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; color: #000000;">
          <p>${escapeHtml(input.greeting)}</p>
          <p>${escapeHtml(input.body)}</p>
          <p><strong>${escapeHtml(input.delay)}</strong></p>
          <p>${escapeHtml(input.whatsappLead)}</p>
          <p><a href="${whatsappUrl}" style="color: #000000;">${whatsappUrl}</a></p>
        </div>
      `,
  };
}

export function partnerMessages(data: PartnerFormValues, copy: PartnerMailCopy, locale: string) {
  return {
    teamSubject: fill(copy.teamSubject, { organization: data.organization }),
    teamIntro: copy.teamIntro,
    ackSubject: copy.ackSubject,
    ackGreeting: fill(copy.ackGreeting, { name: data.contactName }),
    ackBody: fill(copy.ackBody, { organization: data.organization }),
    ackDelay: copy.ackDelay,
    ackWhatsapp: copy.ackWhatsapp,
    rows: partnerEmailRows(data, copy, locale),
    whatsappUrl: LINKS.whatsapp,
  };
}
