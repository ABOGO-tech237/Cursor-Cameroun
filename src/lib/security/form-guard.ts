import { clientIp } from "./client-ip";
import { HONEYPOT_FIELD, TURNSTILE_TOKEN_FIELD } from "./fields";
import type { RateLimiter } from "./rate-limit";
import { turnstileMode, verifyTurnstileToken } from "./turnstile";

export type PublicFormRejection = {
  action: "reject";
  status: 429 | 403 | 503;
  code: "rateLimited" | "turnstile" | "unavailable";
  retryAfterSeconds?: number;
};

export type PublicFormProtection =
  | { action: "continue" }
  | { action: "silence" }
  | PublicFormRejection;

/**
 * Garde réutilisable pour les formulaires publics (`/api/send`, puis
 * `/api/partners`) : limite de débit, honeypot, Turnstile.
 *
 * Le honeypot déclenché répond comme un succès (`silence`) sans rien envoyer,
 * pour ne pas indiquer au robot qu'il a été repéré.
 */
export function honeypotTripped(body: unknown, field = HONEYPOT_FIELD): boolean {
  if (!body || typeof body !== "object") return false;
  const value = (body as Record<string, unknown>)[field];
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function readTurnstileToken(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const value = (body as Record<string, unknown>)[TURNSTILE_TOKEN_FIELD];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export async function protectPublicForm(input: {
  request: Request;
  body: unknown;
  limiter: RateLimiter;
  turnstileSiteKey?: string;
  turnstileSecretKey?: string;
  verifyTurnstile?: (token: string, secret: string, ip: string) => Promise<boolean>;
}): Promise<PublicFormProtection> {
  const ip = clientIp(input.request);
  const limit = input.limiter.check(ip);
  if (!limit.ok) {
    return {
      action: "reject",
      status: 429,
      code: "rateLimited",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }

  if (honeypotTripped(input.body)) {
    return { action: "silence" };
  }

  const mode = turnstileMode({
    siteKey: input.turnstileSiteKey,
    secretKey: input.turnstileSecretKey,
  });

  if (mode === "off") return { action: "continue" };

  if (mode === "misconfigured") {
    console.error(
      "Turnstile mal configuré : NEXT_PUBLIC_TURNSTILE_SITE_KEY et TURNSTILE_SECRET_KEY doivent être définies ensemble.",
    );
    return { action: "reject", status: 503, code: "unavailable" };
  }

  const token = readTurnstileToken(input.body);
  const secret = input.turnstileSecretKey?.trim() ?? "";
  const verify = input.verifyTurnstile ?? verifyTurnstileToken;
  if (!token || !(await verify(token, secret, ip))) {
    return { action: "reject", status: 403, code: "turnstile" };
  }

  return { action: "continue" };
}
