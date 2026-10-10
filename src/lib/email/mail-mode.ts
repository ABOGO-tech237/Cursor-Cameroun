export type MailEnv = {
  nodeEnv?: string;
  resendApiKey?: string;
  resendFrom?: string;
  contactEmail?: string;
};

export type MailMode =
  | { kind: "send"; apiKey: string; from: string; to: string }
  | { kind: "simulate" }
  | { kind: "unavailable" };

function filled(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Sans `RESEND_API_KEY`, l'envoi n'est simulé qu'en développement.
 * En production (ou si `NODE_ENV` n'est pas `development`), la route doit
 * répondre 503. Avec une clé, l'expéditeur (`RESEND_FROM`) et le destinataire
 * (`CONTACT_EMAIL`) sont obligatoires : pas de repli codé en dur.
 */
export function resolveMailMode(env: MailEnv): MailMode {
  const apiKey = filled(env.resendApiKey);
  const from = filled(env.resendFrom);
  const to = filled(env.contactEmail);

  if (!apiKey) {
    return env.nodeEnv === "development" ? { kind: "simulate" } : { kind: "unavailable" };
  }

  if (!from || !to) {
    return { kind: "unavailable" };
  }

  return { kind: "send", apiKey, from, to };
}

export function readContactEnv(source: NodeJS.ProcessEnv = process.env): MailEnv & {
  turnstileSiteKey?: string;
  turnstileSecretKey?: string;
} {
  return {
    nodeEnv: source.NODE_ENV,
    resendApiKey: source.RESEND_API_KEY,
    resendFrom: source.RESEND_FROM,
    contactEmail: source.CONTACT_EMAIL,
    turnstileSiteKey: source.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    turnstileSecretKey: source.TURNSTILE_SECRET_KEY,
  };
}
