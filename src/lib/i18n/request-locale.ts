import { defaultLocale, locales, type Locale } from "@/i18n/routing";

/** En-tête posé par le formulaire pour traduire les erreurs de l'API. */
export const LOCALE_HEADER = "x-locale";

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function readCookie(request: Request, name: string): string | undefined {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;
  for (const part of cookie.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        // Cookie tronqué ou mal échappé : on ignore cette valeur.
        return undefined;
      }
    }
  }
  return undefined;
}

/**
 * Locale des messages d'erreur d'une route API (hors proxy next-intl,
 * dont le matcher exclut `/api`).
 * Ordre : en-tête `x-locale`, cookie `NEXT_LOCALE`, `Accept-Language`, français.
 */
export function resolveRequestLocale(request: Request): Locale {
  const header = request.headers.get(LOCALE_HEADER)?.toLowerCase();
  if (header && isLocale(header)) return header;

  const cookie = readCookie(request, "NEXT_LOCALE")?.toLowerCase();
  if (cookie && isLocale(cookie)) return cookie;

  const accept = request.headers.get("accept-language") ?? "";
  const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("en")) return "en";

  return defaultLocale;
}
