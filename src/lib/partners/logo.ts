import { statSync } from "node:fs";
import path from "node:path";
import type { Partner } from "@/data/partners";

/** Moins de 30 Ko. */
export const PARTNER_LOGO_MAX_BYTES = 30 * 1024;

const PUBLIC_LOGO = /^\/[A-Za-z0-9/_\-.]+?\.(svg|webp)$/i;

/**
 * Chemin public autorisé, ou `null` si l'accord est vide ou si le fichier
 * n'est ni SVG ni WebP local.
 */
export function partnerLogoPublicPath(
  partner: Pick<Partner, "logo" | "logoAuthorization">,
): string | null {
  if (!partner.logoAuthorization?.trim()) return null;
  const logo = partner.logo?.trim() ?? "";
  if (!logo || logo.includes("..")) return null;
  const pathname = logo.split(/[?#]/)[0] ?? "";
  if (!PUBLIC_LOGO.test(pathname)) return null;
  return pathname;
}

export function displayablePartnerLogo(
  partner: Pick<Partner, "logo" | "logoAuthorization">,
  sizeInBytes: (publicPath: string) => number | null,
): string | null {
  const publicPath = partnerLogoPublicPath(partner);
  if (!publicPath) return null;
  const size = sizeInBytes(publicPath);
  if (size == null || size < 1 || size >= PARTNER_LOGO_MAX_BYTES) return null;
  return publicPath;
}

/** Taille d'un fichier sous `public/`, ou `null` s'il est absent. */
export function publicFileSize(publicPath: string): number | null {
  const relative = publicPath.replace(/^\/+/, "");
  if (!relative || relative.includes("..")) return null;
  const root = path.join(process.cwd(), "public");
  const full = path.resolve(root, relative);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  try {
    const stat = statSync(full);
    return stat.isFile() ? stat.size : null;
  } catch {
    return null;
  }
}
