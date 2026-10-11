import { getTranslations } from "next-intl/server";
import { LEARN_COURSE_URL, learnPaths } from "@/data/learn";

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: t("learn.title"),
    description: t("learn.description"),
    openGraph: {
      title: t("learn.title"),
      description: t("learn.description"),
    },
  };
}

export default async function LearnPage() {
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-12">
      <header className="brand-field motion-rise rounded-xl border border-border bg-bg-2 p-8 md:p-12">
        <div className="relative z-[1] max-w-2xl">
          <p className="text-sm font-medium text-text-2">{t("learn.kicker")}</p>
          <span className="motion-rule mt-4 block h-px w-16 bg-text" />
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-text md:text-5xl">
            {t("learn.title")}
          </h1>
          <p className="mt-4 text-lg leading-8 text-text-2">{t("learn.intro")}</p>
          <p className="mt-4 text-sm leading-6 text-text-2">{t("learn.note")}</p>
        </div>
      </header>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {learnPaths.map((path, index) => (
          <li
            key={path.id}
            className="motion-rise"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <article className="flex h-full flex-col rounded-lg border border-border bg-surface-1 p-6">
              <p className="text-xs font-medium tracking-widest text-text-2">{path.step}</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-text">
                {t(`learn.paths.${path.id}.title`)}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-7 text-text-2">
                {t(`learn.paths.${path.id}.body`)}
              </p>
              <a
                className="mt-6 inline-flex items-center justify-center self-start rounded-md bg-text px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
                href={LEARN_COURSE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("learn.openCourse")}
              </a>
              <p className="mt-3 text-xs text-text-2">cursor.com/learn</p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
