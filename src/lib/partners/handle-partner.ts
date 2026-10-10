import { resolveMailMode, type MailEnv } from "../email/mail-mode";
import type { OutboundEmail } from "../email/send-resend";
import { createPartnerSchema, partnerFieldErrors } from "../schemas/partner";
import { protectPublicForm } from "../security/form-guard";
import type { RateLimiter } from "../security/rate-limit";
import { verifyTurnstileToken } from "../security/turnstile";
import {
  buildPartnerAckEmail,
  buildPartnerTeamEmail,
  partnerMessages,
  type PartnerMailCopy,
} from "./partner-email";

export type PartnerErrorCode =
  | "invalid"
  | "rateLimited"
  | "turnstile"
  | "unavailable"
  | "sendFailed";

type Translator = (key: string) => string;

export type PartnerHandlerDeps = {
  env: MailEnv & {
    turnstileSiteKey?: string;
    turnstileSecretKey?: string;
  };
  limiter: RateLimiter;
  send: (apiKey: string, email: OutboundEmail) => Promise<{ ok: boolean }>;
  verifyTurnstile?: (token: string, secret: string, ip: string) => Promise<boolean>;
  locale: string;
  copy: PartnerMailCopy;
};

function errorResponse(
  status: number,
  code: PartnerErrorCode,
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
 * Traitement de `POST /api/partners`.
 * Rien n'est écrit en base : un e-mail part vers l'équipe, puis un accusé
 * vers le partenaire, dans la langue de la requête, seulement si l'envoi
 * à l'équipe a vraiment réussi.
 */
export async function handlePartnerPost(
  request: Request,
  t: Translator,
  deps: PartnerHandlerDeps,
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

  const parsed = createPartnerSchema((key) => t(key)).safeParse(body);
  if (!parsed.success) {
    const fieldErrors = partnerFieldErrors(parsed.error);
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
    console.info("Partenaires : envoi simulé (développement, RESEND_API_KEY absente).");
    return Response.json({ success: true, mock: true });
  }

  const message = partnerMessages(parsed.data, deps.copy, deps.locale);
  const team = buildPartnerTeamEmail({
    from: mode.from,
    to: mode.to,
    replyTo: parsed.data.email,
    subject: message.teamSubject,
    intro: message.teamIntro,
    rows: message.rows,
  });
  const ack = buildPartnerAckEmail({
    from: mode.from,
    to: parsed.data.email,
    replyTo: mode.to,
    subject: message.ackSubject,
    greeting: message.ackGreeting,
    body: message.ackBody,
    delay: message.ackDelay,
    whatsappLead: message.ackWhatsapp,
    whatsappUrl: message.whatsappUrl,
  });

  try {
    const sent = await deps.send(mode.apiKey, team);
    if (!sent.ok) return errorResponse(502, "sendFailed", t);

    const acked = await deps.send(mode.apiKey, ack);
    if (!acked.ok) return errorResponse(502, "sendFailed", t);
  } catch (error) {
    console.error("Partenaires : échec d'envoi", error);
    return errorResponse(502, "sendFailed", t);
  }

  return Response.json({ success: true });
}
