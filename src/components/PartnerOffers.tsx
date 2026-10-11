import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LINKS } from "@/data/links";

const LOCAL_OFFERS = ["venue", "visibility", "support"] as const;

/**
 * La carte « sponsor international » garde son contact en anglais
 * sur les deux locales : le texte vient de `messages/en.json`.
 */
export async function PartnerOffers() {
  const t = await getTranslations("partners");
  const tEn = await getTranslations({
    locale: "en",
    namespace: "partners.offers.international",
  });

  return (
    <section aria-labelledby="partner-offers-title">
      <h2 id="partner-offers-title" className="text-2xl font-semibold tracking-tight text-text">
        {t("offersTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-text-2">{t("offersIntro")}</p>
      <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {LOCAL_OFFERS.map((key) => (
          <li key={key}>
            <article className="flex h-full flex-col rounded-xl border border-border bg-surface-1 p-6">
              <h3 className="text-lg font-semibold text-text">{t(`offers.${key}.title`)}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-text-2">{t(`offers.${key}.body`)}</p>
              <Link
                href="/partners#partner-form"
                className="mt-5 inline-flex text-sm font-medium text-text underline decoration-border hover:decoration-text"
              >
                {t("cardCta")}
              </Link>
            </article>
          </li>
        ))}
        <li>
          <article className="flex h-full flex-col rounded-xl border border-border bg-surface-1 p-6">
            <h3 className="text-lg font-semibold text-text">{t("offers.international.title")}</h3>
            <p className="mt-3 text-sm leading-6 text-text-2">{t("offers.international.body")}</p>
            <div className="mt-4 rounded-md border border-border bg-bg px-4 py-3">
              <p className="text-sm font-medium text-text">{tEn("contactTitle")}</p>
              <p className="mt-1 text-sm leading-6 text-text-2">{tEn("contactBody")}</p>
              <div className="mt-3 flex flex-col items-start gap-2">
                <Link
                  href="/partners#partner-form"
                  locale="en"
                  className="text-sm font-medium text-text underline decoration-border hover:decoration-text"
                >
                  {tEn("formCta")}
                </Link>
                <a
                  href={LINKS.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-text underline decoration-border hover:decoration-text"
                >
                  {tEn("whatsappCta")}
                </a>
              </div>
            </div>
          </article>
        </li>
      </ul>
    </section>
  );
}
