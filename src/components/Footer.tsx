import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LINKS } from "@/data/links";
import { Code, MessageCircle, MapPin, Mail, Globe } from "lucide-react";

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface-1/50 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand & Mission */}
          <div className="flex flex-col gap-6 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/brand/LOCKUP_HORIZONTAL_2D_LIGHT.svg"
                alt="Cursor"
                width={120}
                height={28}
                className="brand-logo-light"
              />
              <Image
                src="/brand/LOCKUP_HORIZONTAL_2D_DARK.svg"
                alt="Cursor"
                width={120}
                height={28}
                className="brand-logo-dark"
              />
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-text-2">
              {t("footer.description")}
            </p>
            <div className="flex items-center gap-4">
              <a href={LINKS.githubOrg} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-surface-2 text-text-2 hover:text-text hover:bg-border transition-all">
                <Code size={18} />
              </a>
              <a href={LINKS.whatsapp} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-surface-2 text-text-2 hover:text-text hover:bg-border transition-all">
                <MessageCircle size={18} />
              </a>
              {/* Add other social links if available in LINKS */}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text">{t("footer.community")}</h3>
            <nav className="flex flex-col gap-3">
              <Link href="/events" className="text-sm text-text-2 hover:text-text transition-colors">Événements</Link>
              <Link href="/gallery" className="text-sm text-text-2 hover:text-text transition-colors">Galerie</Link>
              <Link href="/roadmap" className="text-sm text-text-2 hover:text-text transition-colors">Roadmap</Link>
              <Link href="/community" className="text-sm text-text-2 hover:text-text transition-colors">Projets</Link>
            </nav>
          </div>

          {/* Contact & Info */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text">{t("footer.contact")}</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 text-sm text-text-2">
                <MapPin size={18} className="shrink-0 text-text" />
                <span>{t("footer.location")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-2">
                <Mail size={18} className="shrink-0 text-text" />
                <Link href="/contact" className="hover:text-text">{t("footer.writeUs")}</Link>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-2">
                <Globe size={18} className="shrink-0 text-text" />
                <span>cursor-cameroun.org</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 text-xs text-text-2 md:flex-row">
          <div className="flex items-center gap-2">
            <span>© {year} Cursor Cameroun. {t("footer.rights")}</span>
          </div>
          <div className="flex items-center gap-6">
            <span>{t("footer.line")}</span>
            <Link href="/privacy" className="hover:text-text transition-colors">{t("footer.privacy")}</Link>
            <Link href="/login" className="opacity-50 hover:opacity-100 transition-opacity">{t("footer.admin")}</Link>
          </div>
        </div>

        <p className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-text-2 md:justify-start">
          <span className="spacexai-mark">
            {/* SVG officiel servi tel quel : hauteur seule, aucune optimisation. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/spacexai-symbol-white.svg"
              alt={t("footer.spacexaiAlt")}
              height={16}
              decoding="async"
              className="spacexai-symbol"
            />
          </span>
          <span>{t("footer.spacexaiCredit")}</span>
        </p>
      </div>
    </footer>
  );
}
