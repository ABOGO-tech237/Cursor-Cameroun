import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";

const LAW_URL: Record<Locale, string> = {
  fr: "https://www.prc.cm/fr/multimedia/documents/10258-loi-n-2024-017-du-23-12-2024-web",
  en: "https://www.prc.cm/en/multimedia/documents/10271-law-n-2024-017-of-23-12-2024-web",
};

const TURNSTILE_PRIVACY_URL = "https://www.cloudflare.com/turnstile-privacy-policy/";

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function PendingNote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="mt-4 rounded-md border border-border bg-surface-2 px-4 py-3 text-sm leading-6 text-text">
      <span className="inline-flex rounded border border-border bg-bg px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
        {label}
      </span>
      <span className="mt-2 block">{children}</span>
    </p>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: t("privacy.title"),
    description: t("privacy.description"),
    openGraph: {
      title: t("privacy.title"),
      description: t("privacy.description"),
    },
  };
}

export default async function PrivacyPage() {
  const [t, localeValue] = await Promise.all([getTranslations(), getLocale()]);
  const locale = isLocale(localeValue) ? localeValue : defaultLocale;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8">
      <FadeIn>
        <header className="rounded-xl border border-border bg-bg-2 p-8 md:p-12">
          <h1 className="text-4xl font-semibold tracking-tight text-text md:text-5xl">
            {t("privacy.title")}
          </h1>
          <p className="mt-4 text-lg leading-8 text-text-2">{t("privacy.intro")}</p>
          <p className="mt-4 text-sm leading-6 text-text-2">{t("privacy.disclaimer")}</p>
          <p className="mt-4">
            <a
              href={LAW_URL[locale]}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-text underline decoration-border hover:decoration-text"
            >
              {t("privacy.lawLink")}
            </a>
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.05}>
        <p className="rounded-md border border-border bg-surface-1 px-4 py-3 text-sm leading-6 text-text">
          {t("privacy.pendingBanner")}
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <section className="rounded-xl border border-border bg-surface-1 p-6 md:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-text">
            {t("privacy.controllerTitle")}
          </h2>
          <p className="mt-3 leading-7 text-text-2">{t("privacy.controllerBody")}</p>
          <PendingNote label={t("privacy.pendingLabel")}>{t("privacy.controllerPending")}</PendingNote>
        </section>
      </FadeIn>

      <FadeIn delay={0.15}>
        <section className="rounded-xl border border-border bg-surface-1 p-6 md:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-text">
            {t("privacy.purposeTitle")}
          </h2>
          <p className="mt-3 leading-7 text-text-2">{t("privacy.purposeBody")}</p>
        </section>
      </FadeIn>

      <FadeIn delay={0.2}>
        <section className="rounded-xl border border-border bg-surface-1 p-6 md:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-text">
            {t("privacy.dataTitle")}
          </h2>
          <p className="mt-3 leading-7 text-text-2">{t("privacy.dataBody")}</p>
          <h3 className="mt-6 text-base font-semibold text-text">{t("privacy.technicalTitle")}</h3>
          <p className="mt-3 leading-7 text-text-2">{t("privacy.technicalBody")}</p>
          <p className="mt-4">
            <a
              href={TURNSTILE_PRIVACY_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-text underline decoration-border hover:decoration-text"
            >
              {t("privacy.turnstileLink")}
            </a>
          </p>
        </section>
      </FadeIn>

      <FadeIn delay={0.25}>
        <section className="rounded-xl border border-border bg-surface-1 p-6 md:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-text">
            {t("privacy.retentionTitle")}
          </h2>
          <p className="mt-3 leading-7 text-text-2">{t("privacy.retentionBody")}</p>
          <PendingNote label={t("privacy.pendingLabel")}>{t("privacy.retentionPending")}</PendingNote>
        </section>
      </FadeIn>

      <FadeIn delay={0.3}>
        <section className="rounded-xl border border-border bg-surface-1 p-6 md:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-text">
            {t("privacy.rightsTitle")}
          </h2>
          <p className="mt-3 leading-7 text-text-2">{t("privacy.rightsBody")}</p>
          <PendingNote label={t("privacy.pendingLabel")}>{t("privacy.rightsPending")}</PendingNote>
          <p className="mt-6">
            <Link
              href="/contact"
              className="text-sm font-medium text-text underline decoration-border hover:decoration-text"
            >
              {t("privacy.backToContact")}
            </Link>
          </p>
        </section>
      </FadeIn>
    </article>
  );
}
