import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { BrandLockup } from "@/components/BrandLockup";
import { CameroonMap } from "@/components/CameroonMap";
import { LINKS } from "@/data/links";
import { getPastEvents, getUpcomingEvents } from "@/data/events";
import { CITY_POINTS } from "@/data/roadmap";

function formatEventDateRange(startDateISO: string, endDateISO: string) {
  return startDateISO === endDateISO ? startDateISO : `${startDateISO} → ${endDateISO}`;
}

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: t("nav.home"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.siteName"),
      description: t("meta.description"),
    },
  };
}

export default async function Home() {
  const t = await getTranslations();
  const [upcomingAll, pastAll] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);
  const upcoming = upcomingAll.slice(0, 3);
  const past = pastAll.slice(0, 2);

  const members = CITY_POINTS.reduce((acc, c) => acc + (c.members ?? 0), 0);
  const eventsCount = upcoming.length + pastAll.length;
  const citiesCovered = CITY_POINTS.filter((c) => c.kind === "active").length;

  return (
    <div className="flex flex-col gap-16">
      <section className="brand-field motion-rise rounded-xl border border-border bg-bg-2 p-8 md:p-12">
          <div className="relative z-[1] flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <BrandLockup variant="25d" height={40} priority />
              <p className="mt-6 text-sm font-medium text-text-2">{t("meta.tagline")}</p>
              <span className="motion-rule mt-4 block h-px w-16 bg-text" />
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-text md:text-5xl">
                {t("home.heroTitle")}
              </h1>
              <p className="mt-4 text-lg leading-8 text-text-2">
                {t("home.heroSubtitle")}
              </p>
            </div>

            <a
              className="inline-flex items-center justify-center rounded-md bg-text px-5 py-3 text-sm font-medium text-bg hover:opacity-90"
              href={LINKS.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              {t("home.heroCta")}
            </a>
          </div>

          <div className="relative z-[1] mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface-1 p-5">
              <div className="text-2xl font-semibold text-text">
                <AnimatedNumber value={members} />
              </div>
              <div className="mt-1 text-sm text-text-2">{t("home.statsMembers")}</div>
            </div>
            <div className="rounded-lg border border-border bg-surface-1 p-5">
              <div className="text-2xl font-semibold text-text">
                <AnimatedNumber value={eventsCount} />
              </div>
              <div className="mt-1 text-sm text-text-2">{t("home.statsEvents")}</div>
            </div>
            <div className="rounded-lg border border-border bg-surface-1 p-5">
              <div className="text-2xl font-semibold text-text">
                <AnimatedNumber value={citiesCovered} />
              </div>
              <div className="mt-1 text-sm text-text-2">{t("home.statsCities")}</div>
            </div>
          </div>
        </section>

      <section className="motion-rise grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-10" style={{ animationDelay: "80ms" }}>
          <div className="rounded-lg border border-border bg-surface-1 p-8">
            <h2 className="text-xl font-semibold tracking-tight text-text">
              {t("home.sectionAboutTitle")}
            </h2>
            <p className="mt-3 leading-7 text-text-2">{t("home.sectionAboutBody")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/learn"
                className="inline-flex items-center justify-center rounded-md bg-text px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
              >
                {t("nav.learn")}
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center justify-center rounded-md border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text hover:bg-surface-2"
              >
                {t("nav.community")}
              </Link>
            </div>
          </div>

          <CameroonMap points={CITY_POINTS} />
        </section>

      <section className="motion-rise" style={{ animationDelay: "140ms" }}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-text">
                {t("home.sectionNextEventsTitle")}
              </h2>
              <p className="mt-1 text-sm text-text-2">
                {upcoming.length ? t("home.upcomingHintSome") : t("home.upcomingHintNone")}
              </p>
            </div>
            <Link
              href="/events"
              className="text-sm font-medium text-text underline decoration-border hover:decoration-text"
            >
              {t("nav.events")}
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {upcoming.map((e) => (
              <div
                key={e.slug}
                className="rounded-lg border border-border bg-surface-1 p-6 hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-text">{e.name}</h3>
                  <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-text-2">
                    {t("events.statusUpcoming")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-2">
                  {e.city} · {formatEventDateRange(e.startDateISO, e.endDateISO)}
                  {e.participants ? ` · ${e.participants} ${t("events.participants")}` : ""}
                </p>
                <p className="mt-4 text-sm leading-6 text-text">{e.shortDescription}</p>
                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/events/${e.slug}`}
                    className="inline-flex items-center justify-center rounded-md border border-border bg-surface-1 px-3 py-2 text-sm font-medium text-text hover:bg-surface-2"
                  >
                    {t("events.viewDetails")}
                  </Link>
                  {e.lumaUrl ? (
                    <a
                      className="inline-flex items-center justify-center rounded-md bg-text px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
                      href={e.lumaUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("events.register")}
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

      <section className="motion-rise" style={{ animationDelay: "200ms" }}>
          <h2 className="text-xl font-semibold tracking-tight text-text">
            {t("home.sectionPastHighlightsTitle")}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {past.map((e) => (
              <div
                key={e.slug}
                className="rounded-lg border border-border bg-surface-1 p-6 hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-text">{e.name}</h3>
                  <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-text-2">
                    {t("events.statusPast")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-2">
                  {e.city} · {formatEventDateRange(e.startDateISO, e.endDateISO)}
                  {e.participants ? ` · ${e.participants} ${t("events.participants")}` : ""}
                </p>
                <p className="mt-4 text-sm leading-6 text-text">{e.shortDescription}</p>
                <div className="mt-5">
                  <Link
                    href={`/events/${e.slug}`}
                    className="inline-flex items-center justify-center rounded-md border border-border bg-surface-1 px-3 py-2 text-sm font-medium text-text hover:bg-surface-2"
                  >
                    {t("events.viewDetails")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

      <section className="motion-rise rounded-xl border border-border bg-bg-2 p-8 md:p-12" style={{ animationDelay: "240ms" }}>
          <h2 className="text-2xl font-semibold tracking-tight text-text">
            {t("home.closingCtaTitle")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-text-2">
            {t("home.closingCtaBody")}
          </p>
          <div className="mt-6">
            <a
              className="inline-flex items-center justify-center rounded-md bg-text px-5 py-3 text-sm font-medium text-bg hover:opacity-90"
              href={LINKS.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              {t("home.closingCtaButton")}
            </a>
          </div>
        </section>
    </div>
  );
}
