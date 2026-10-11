import { getTranslations } from "next-intl/server";
import { sendResendEmail } from "@/lib/email/send-resend";
import { readContactEnv } from "@/lib/email/mail-mode";
import { resolveRequestLocale } from "@/lib/i18n/request-locale";
import { handlePartnerPost } from "@/lib/partners/handle-partner";
import { partnerMailCopy, readPartnerMessage } from "@/lib/partners/partner-email";
import { partnerRateLimiter } from "@/lib/security/rate-limit";

/**
 * Node.js : le limiteur en mémoire n'est pas partagé entre isolates Edge.
 * Le proxy (`src/proxy.ts`) exclut `/api` et ne porte pas cette garde.
 * Aucune écriture en base.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = await getTranslations({ locale, namespace: "partners" });
  const text = (key: string) => readPartnerMessage((rawKey) => t.raw(rawKey as never), key);

  return handlePartnerPost(request, (key) => t(`errors.${key}` as never), {
    env: readContactEnv(),
    limiter: partnerRateLimiter,
    send: sendResendEmail,
    locale,
    copy: partnerMailCopy(text),
  });
}
