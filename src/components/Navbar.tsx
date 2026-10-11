"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { BrandLockup } from "@/components/BrandLockup";
import { useTheme } from "@/components/ThemeProvider";
import { LINKS } from "@/data/links";
import { Sun, Moon, LogOut, ShieldCheck } from "lucide-react";
import { useEffect } from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2 4.5h14M2 9h14M2 13.5h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.75 3.75l10.5 10.5M14.25 3.75L3.75 14.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as Locale;
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Basic check for cookie on client side
    const checkAdmin = () => {
      setIsAdmin(document.cookie.includes("admin_session=true"));
    };
    checkAdmin();
    // Check every few seconds or on focus to stay in sync
    const interval = setInterval(checkAdmin, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdmin(false);
    router.push("/");
    router.refresh();
  }

  const themeLabel = mounted
    ? (resolvedTheme === "dark" ? t("nav.themeDark") : t("nav.themeLight"))
    : null;

  const items = useMemo(
    () => {
      const baseItems = [
        { href: "/", label: t("nav.home") },
        { href: "/learn", label: t("nav.learn") },
        { href: "/events", label: t("nav.events") },
        { href: "/gallery", label: t("nav.gallery") },
        { href: "/roadmap", label: t("nav.roadmap") },
        { href: "/community", label: t("nav.community") },
      ];

      if (isAdmin) {
        baseItems.push({ href: "/admin/events", label: "Admin" });
      }

      return baseItems;
    },
    [t, isAdmin],
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      {/* Barre principale */}
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          aria-label={t("meta.siteName")}
          className="flex items-center rounded-md px-2 py-1 hover:bg-surface-2"
        >
          <BrandLockup height={18} />
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {items.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cx(
                  "rounded-md px-3 py-2 text-sm text-text-2 hover:bg-surface-2 hover:text-text",
                  active && "bg-surface-2 text-text",
                )}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions desktop + bouton hamburger mobile */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="hidden rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-text hover:bg-surface-2 md:inline-flex"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label={t("nav.themeToggle")}
          >
            {mounted && (resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />)}
          </button>

          <select
            className="hidden rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-text hover:bg-surface-2 md:block"
            value={locale}
            onChange={(e) => {
              const next = e.target.value as Locale;
              router.replace(pathname, { locale: next });
            }}
            aria-label={t("nav.language")}
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>

          <a
            className="hidden items-center justify-center rounded-md bg-text px-3 py-2 text-sm font-medium text-bg hover:opacity-90 md:inline-flex"
            href={LINKS.whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            {t("nav.join")}
          </a>

          {isAdmin && (
            <button
              onClick={handleLogout}
              className="hidden items-center justify-center rounded-md border border-border bg-surface-1 p-2 text-text-2 hover:text-text hover:bg-surface-2 md:inline-flex"
              title="Déconnexion"
            >
              <LogOut size={18} />
            </button>
          )}

          {/* Hamburger — mobile uniquement */}
          <button
            type="button"
            className="rounded-md border border-border bg-surface-1 p-2 text-text hover:bg-surface-2 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t("nav.menuClose") : t("nav.menuOpen")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {mobileOpen && (
        <div className="border-t border-border bg-bg md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {items.map((it) => {
              const active = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cx(
                    "rounded-md px-3 py-2 text-sm text-text-2 hover:bg-surface-2 hover:text-text",
                    active && "bg-surface-2 text-text",
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <button
              type="button"
              className="rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-text hover:bg-surface-2"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={t("nav.themeToggle")}
            >
              {mounted && (resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />)}
            </button>
            <select
              className="rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-text hover:bg-surface-2"
              value={locale}
              onChange={(e) => {
                const next = e.target.value as Locale;
                router.replace(pathname, { locale: next });
              }}
              aria-label={t("nav.language")}
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
            {isAdmin && (
              <button
                onClick={handleLogout}
                className="rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-text-2 hover:text-text hover:bg-surface-2"
              >
                Déconnexion
              </button>
            )}
            <a
              className="ml-auto inline-flex items-center justify-center rounded-md bg-text px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
              href={LINKS.whatsapp}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.join")}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
