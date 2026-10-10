import type { PartnerOffer } from "@/lib/schemas/partner";

/**
 * Vitrine des partenaires.
 *
 * La liste est vide tant que les accords ne sont pas conclus.
 * `logoAuthorization` doit être rempli (date, signataire, ou référence de
 * l'accord) pour qu'un logo puisse s'afficher. `logo` est un chemin public
 * `.svg` ou `.webp` de moins de 30 Ko. Ne pas inventer de logos.
 */
export type Partner = {
  name: string;
  city: string;
  sector: string;
  href: string;
  offers: readonly PartnerOffer[];
  logoAuthorization: string;
  logo?: string;
};

export const partners: readonly Partner[] = [];
