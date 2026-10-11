import type { Metadata, Viewport } from "next";
import {
  getLocale,
  getMessages,
  getTimeZone,
  setRequestLocale,
} from "next-intl/server";
import "./globals.css";
import Providers from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    template: "%s · Cursor Cameroun",
    default: "Cursor Cameroun",
  },
  description:
    "Événements, roadmap territoriale et projets open source de la communauté Cursor Cameroun.",
  icons: {
    icon: [
      {
        url: "/brand/APP_ICON_25D_DARK.png",
        type: "image/png",
      },
      {
        url: "/brand/APP_ICON_25D_LIGHT.png",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/brand/APP_ICON_25D_DARK.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#14120b" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  setRequestLocale(locale);
  const [messages, timeZone] = await Promise.all([
    getMessages(),
    getTimeZone(),
  ]);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <Providers locale={locale} messages={messages} timeZone={timeZone}>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
