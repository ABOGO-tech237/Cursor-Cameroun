import { escapeHtml, sanitizeHeader } from "./escape-html";

export type ContactEmailInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
  from: string;
  to: string;
};

export type ContactEmail = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Construit le message de contact.
 * Chaque valeur utilisateur insérée dans le HTML passe par `escapeHtml`.
 * Le `replyTo` reste l'adresse de la personne qui écrit.
 */
export function buildContactEmail(input: ContactEmailInput): ContactEmail {
  const name = escapeHtml(input.name);
  const email = escapeHtml(input.email);
  const subject = escapeHtml(input.subject);
  const message = escapeHtml(input.message);

  return {
    from: sanitizeHeader(input.from),
    to: sanitizeHeader(input.to),
    replyTo: sanitizeHeader(input.email),
    subject: sanitizeHeader(`[Contact] ${input.subject}`),
    text: [
      `Nom : ${input.name}`,
      `Email : ${input.email}`,
      `Objet : ${input.subject}`,
      "",
      input.message,
    ].join("\n"),
    html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; color: #000000;">
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 12px;">Nouveau message de contact</h2>
          <p><strong>Nom :</strong> ${name}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Objet :</strong> ${subject}</p>
          <div style="margin-top: 24px; padding: 16px; background-color: #f5f5f5; border-radius: 4px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 32px; font-size: 12px; color: #555555; border-top: 1px solid #e5e5e5; padding-top: 16px;">
            Ce message a été envoyé depuis le site Cursor Cameroun.
          </p>
        </div>
      `,
  };
}
