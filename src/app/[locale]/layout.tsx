import { notFound } from "next/navigation";
import { getMessages, getTimeZone, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { DocumentLang } from "@/components/DocumentLang";
import { Navbar } from "@/components/Navbar";
import { locales, type Locale } from "@/i18n/routing";
import Providers from "../providers";

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const [messages, timeZone] = await Promise.all([getMessages(), getTimeZone()]);

  return (
    <Providers locale={locale} messages={messages} timeZone={timeZone}>
      <DocumentLang locale={locale} />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">{children}</main>
      <Footer />
    </Providers>
  );
}
