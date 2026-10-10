import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/FadeIn";
import { PartnerDirectory } from "@/components/PartnerDirectory";
import { PartnerForm } from "@/components/PartnerForm";
import { PartnerOffers } from "@/components/PartnerOffers";

export async function generateMetadata() {
  const t = await getTranslations("partners");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function PartnersPage() {
  const t = await getTranslations("partners");

  return (
    <div className="flex flex-col gap-16">
      <FadeIn>
        <header className="rounded-xl border border-border bg-bg-2 p-8 md:p-12">
          <h1 className="text-4xl font-semibold tracking-tight text-text md:text-5xl">
            {t("introTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-text-2">{t("introLead")}</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-text-2">{t("introBody")}</p>
        </header>
      </FadeIn>

      <FadeIn delay={0.05}>
        <PartnerDirectory />
      </FadeIn>

      <FadeIn delay={0.1}>
        <PartnerOffers />
      </FadeIn>

      <FadeIn delay={0.15}>
        <section id="partner-form" className="scroll-mt-24" aria-labelledby="partner-form-title">
          <h2 id="partner-form-title" className="text-2xl font-semibold tracking-tight text-text">
            {t("formTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-2">{t("formIntro")}</p>
          <div className="mt-6">
            <PartnerForm />
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
