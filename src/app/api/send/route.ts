import { getTranslations } from "next-intl/server";
import { handleContactPost } from "@/lib/contact/handle-contact";
import { sendResendEmail } from "@/lib/email/send-resend";
import { readContactEnv } from "@/lib/email/mail-mode";
import { resolveRequestLocale } from "@/lib/i18n/request-locale";
import { contactRateLimiter } from "@/lib/security/rate-limit";

/**
 * Node.js : le limiteur en mémoire n'est pas partagé entre isolates Edge.
 * Le proxy (`src/proxy.ts`) exclut `/api` et ne porte pas cette garde.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = await getTranslations({ locale, namespace: "contact.errors" });

  return handleContactPost(request, (key) => t(key), {
    env: readContactEnv(),
    limiter: contactRateLimiter,
    send: sendResendEmail,
  });
}
