import { escapeHtml, sanitizeHeader } from "./escape-html";
import { resolveMailMode, type MailEnv } from "./mail-mode";
import { sendResendEmail, type OutboundEmail } from "./send-resend";

export type EventNotice = {
  slug: string;
  name: string;
  startDateISO: string;
  endDateISO: string;
  city: string;
  shortDescription: string;
};

/**
 * Notification interne après création d'un événement.
 * L'expéditeur et le destinataire viennent de `resolveMailMode`
 * (`RESEND_FROM`, `CONTACT_EMAIL`). Aucune adresse de repli n'est codée en dur.
 */
export function buildEventCreatedEmail(input: {
  event: EventNotice;
  from: string;
  to: string;
  eventUrl: string;
}): OutboundEmail {
  const name = escapeHtml(input.event.name);
  const city = escapeHtml(input.event.city);
  const description = escapeHtml(input.event.shortDescription);
  const when = escapeHtml(
    input.event.endDateISO && input.event.endDateISO !== input.event.startDateISO
      ? `${input.event.startDateISO} → ${input.event.endDateISO}`
      : input.event.startDateISO,
  );
  const eventUrl = escapeHtml(input.eventUrl);

  return {
    from: sanitizeHeader(input.from),
    to: sanitizeHeader(input.to),
    subject: sanitizeHeader(`[Admin] Nouvel événement créé : ${input.event.name}`),
    text: [
      "Nouvel événement ajouté",
      `Nom : ${input.event.name}`,
      `Date : ${input.event.startDateISO}${
        input.event.endDateISO !== input.event.startDateISO ? ` → ${input.event.endDateISO}` : ""
      }`,
      `Ville : ${input.event.city}`,
      `Description : ${input.event.shortDescription}`,
      "",
      input.eventUrl,
    ].join("\n"),
    html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; color: #000000;">
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 12px;">Nouvel événement ajouté</h2>
          <p><strong>Nom :</strong> ${name}</p>
          <p><strong>Date :</strong> ${when}</p>
          <p><strong>Ville :</strong> ${city}</p>
          <p><strong>Description :</strong> ${description}</p>
          <div style="margin-top: 24px; padding: 16px; background-color: #f5f5f5; border-radius: 4px;">
            <p style="margin: 0 0 12px 0;">L'événement a été ajouté avec succès à la base de données.</p>
            <a href="${eventUrl}" style="display: inline-block; padding: 10px 18px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
              Voir l'événement
            </a>
          </div>
        </div>
      `,
  };
}

export async function notifyEventCreated(input: {
  env: MailEnv;
  event: EventNotice;
  origin: string;
  send?: (apiKey: string, email: OutboundEmail) => Promise<{ ok: boolean }>;
}): Promise<"sent" | "simulated" | "skipped" | "failed"> {
  const send = input.send ?? sendResendEmail;
  const mode = resolveMailMode(input.env);

  if (mode.kind === "simulate") {
    console.info(
      "Événement : notification simulée (développement, RESEND_API_KEY absente).",
      input.event.name,
    );
    return "simulated";
  }

  if (mode.kind === "unavailable") {
    console.error(
      "Événement : notification non envoyée, l'envoi n'est pas configuré. Aucune adresse de repli.",
    );
    return "skipped";
  }

  const email = buildEventCreatedEmail({
    from: mode.from,
    to: mode.to,
    event: input.event,
    eventUrl: `${input.origin.replace(/\/$/, "")}/events/${encodeURIComponent(input.event.slug)}`,
  });

  try {
    const result = await send(mode.apiKey, email);
    if (!result.ok) {
      console.error("Événement : échec d'envoi de la notification.");
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("Événement : échec d'envoi de la notification.", error);
    return "failed";
  }
}
