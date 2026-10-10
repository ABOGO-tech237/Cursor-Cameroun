import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n/routing";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "as-needed",
});

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protège les routes admin (/admin ou /fr/admin selon la locale).
  const isAdminRoute = pathname.includes("/admin");

  if (isAdminRoute) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const valid = await verifySessionToken(token);

    // Session absente ou signature/expiration invalide -> retour au login.
    if (!valid) {
      const locale = locales.find((l) => pathname.startsWith(`/${l}/`)) || defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // `/api` est exclu : la limite de débit et Turnstile vivent dans les routes.
  // Le proxy ne partage pas leur mémoire, et ne doit pas porter cet état.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
