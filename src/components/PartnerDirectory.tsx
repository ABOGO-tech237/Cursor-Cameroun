import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { partners, type Partner } from "@/data/partners";
import { displayablePartnerLogo, publicFileSize } from "@/lib/partners/logo";
import { PARTNER_OFFERS, type PartnerOffer } from "@/lib/schemas/partner";

const OFFER_SET = new Set<string>(PARTNER_OFFERS);

function isOffer(value: string): value is PartnerOffer {
  return OFFER_SET.has(value);
}

function PartnerLogo({ src }: { src: string }) {
  if (/\.svg$/i.test(src)) {
    return (
      // SVG local déjà filtré (autorisation + poids). next/image n'accepte pas le SVG sans option globale.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={160}
        height={48}
        loading="lazy"
        decoding="async"
        className="mb-4 h-12 w-auto max-w-[10rem] object-contain"
      />
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={160}
      height={48}
      loading="lazy"
      className="mb-4 h-12 w-auto max-w-[10rem] object-contain"
    />
  );
}

export async function PartnerDirectory() {
  const t = await getTranslations("partners");
  const visit = t("visit");
  const offerLabel = (offer: PartnerOffer) => t(`offerNames.${offer}`);
  const published = partners.map((partner) => ({
    partner,
    logoSrc: displayablePartnerLogo(partner, publicFileSize),
  }));

  return (
    <section aria-labelledby="partner-directory-title">
      <h2 id="partner-directory-title" className="text-2xl font-semibold tracking-tight text-text">
        {t("directoryTitle")}
      </h2>
      {published.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-1 px-6 py-10">
          <p className="text-base font-medium text-text">{t("directoryEmptyTitle")}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-2">{t("directoryEmptyBody")}</p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {published.map(({ partner, logoSrc }) => (
            <li key={partner.name}>
              <PartnerCard partner={partner} logoSrc={logoSrc} visit={visit} offerLabel={offerLabel} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PartnerCard({
  partner,
  logoSrc,
  visit,
  offerLabel,
}: {
  partner: Partner;
  logoSrc: string | null;
  visit: string;
  offerLabel: (offer: PartnerOffer) => string;
}) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface-1 p-6">
      {logoSrc ? <PartnerLogo src={logoSrc} /> : null}
      <h3 className="text-base font-semibold text-text">{partner.name}</h3>
      <p className="mt-1 text-sm text-text-2">
        {partner.city}
        {partner.sector ? ` · ${partner.sector}` : ""}
      </p>
      {partner.offers.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {partner.offers.map((offer) => (
            <li
              key={offer}
              className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-text-2"
            >
              {isOffer(offer) ? offerLabel(offer) : offer}
            </li>
          ))}
        </ul>
      ) : null}
      {partner.href ? (
        <a
          href={partner.href}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-sm font-medium text-text underline decoration-border hover:decoration-text"
        >
          {visit}
        </a>
      ) : null}
    </article>
  );
}
