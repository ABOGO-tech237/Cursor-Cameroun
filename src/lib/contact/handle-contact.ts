import { buildContactEmail, type ContactEmail } from "../email/contact-email";
import { resolveMailMode, type MailEnv } from "../email/mail-mode";
import { contactFieldErrors, createContactSchema } from "../schemas/contact";
import { protectPublicForm } from "../security/form-guard";
import type { RateLimiter } from "../security/rate-limit";
import { verifyTurnstileToken } from "../security/turnstile";

export type ContactErrorCode =
  | "invalid"
  | "rateLimited"
  | "turnstile"
  | "unavailable"
  | "sendFailed";

type Translator = (key: string) => string;

export type ContactHandlerDeps = {
  env: MailEnv & {
    turnstileSiteKey?: string;
    turnstileSecretKey?: string;
  };
  limiter: RateLimiter;
  send: (apiKey: string, email: ContactEmail) => Promise<{ ok: boolean }>;
  verifyTurnstile?: (token: string, secret: string, ip: string) => Promise<boolean>;
};

function errorResponse(
  status: number,
  code: ContactErrorCode,
  t: Translator,
  init?: { retryAfterSeconds?: number; fieldErrors?: Record<string, string> },
) {
  const headers = new Headers();
  if (init?.retryAfterSeconds) {
    headers.set("Retry-After", String(init.retryAfterSeconds));
  }

  return Response.json(
    {
      code,
      error: t(code),
      ...(init?.fieldErrors ? { fieldErrors: init.fieldErrors } : {}),
    },
    { status, headers },
  );
}

/**
 * Traitement de `POST /api/send`, séparé de la route pour être testable
 * et pour réutiliser la garde (débit, honeypot, Turnstile) telle quelle.
 */
export async function handleContactPost(
  request: Request,
  t: Translator,
  deps: ContactHandlerDeps,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "invalid", t);
  }

  const protection = await protectPublicForm({
    request,
    body,
    limiter: deps.limiter,
    turnstileSiteKey: deps.env.turnstileSiteKey,
    turnstileSecretKey: deps.env.turnstileSecretKey,
    verifyTurnstile: deps.verifyTurnstile ?? verifyTurnstileToken,
  });

  if (protection.action === "silence") {
    return Response.json({ success: true });
  }

  if (protection.action === "reject") {
    return errorResponse(protection.status, protection.code, t, {
      retryAfterSeconds: protection.retryAfterSeconds,
    });
  }

  const parsed = createContactSchema((key) => t(key)).safeParse(body);
  if (!parsed.success) {
    const fieldErrors = contactFieldErrors(parsed.error);
    const first = Object.values(fieldErrors)[0] ?? t("invalid");
    return Response.json(
      { code: "invalid", error: first, fieldErrors },
      { status: 400 },
    );
  }

  const mode = resolveMailMode(deps.env);
  if (mode.kind === "unavailable") {
    return errorResponse(503, "unavailable", t);
  }

  if (mode.kind === "simulate") {
    console.info("Contact : envoi simulé (développement, RESEND_API_KEY absente).");
    return Response.json({ success: true, mock: true });
  }

  const email = buildContactEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    from: mode.from,
    to: mode.to,
  });

  try {
    const sent = await deps.send(mode.apiKey, email);
    if (!sent.ok) return errorResponse(502, "sendFailed", t);
  } catch (error) {
    console.error("Contact : échec d'envoi", error);
    return errorResponse(502, "sendFailed", t);
  }

  return Response.json({ success: true });
}
