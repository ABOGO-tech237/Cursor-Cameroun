import Image from "next/image";

/**
 * Lockup horizontal officiel, octets non modifiés.
 * Source : https://cursor.com/brand
 * Archive : https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/brand/cursor-brand-assets.zip
 * La page indique : 2D par défaut, 2.5D pour les applications plus grandes,
 * lockup horizontal de préférence. Cube et wordmark ne sont pas recombinés.
 */
const LOCKUPS = {
  "2d": {
    light: "/brand/LOCKUP_HORIZONTAL_2D_LIGHT.svg",
    dark: "/brand/LOCKUP_HORIZONTAL_2D_DARK.svg",
  },
  "25d": {
    light: "/brand/LOCKUP_HORIZONTAL_25D_LIGHT.svg",
    dark: "/brand/LOCKUP_HORIZONTAL_25D_DARK.svg",
  },
} as const;

type BrandLockupProps = {
  variant?: keyof typeof LOCKUPS;
  /** Hauteur d'affichage. Le viewBox officiel est 2238.7 × 532.09. */
  height?: number;
  priority?: boolean;
};

export function BrandLockup({
  variant = "2d",
  height = 20,
  priority = false,
}: BrandLockupProps) {
  const width = Math.round(height * (2238.7 / 532.09));
  const sources = LOCKUPS[variant];

  return (
    <span className="inline-flex items-center" role="img" aria-label="Cursor">
      <Image
        src={sources.light}
        alt=""
        width={width}
        height={height}
        priority={priority}
        className="brand-logo-light h-auto w-auto"
        style={{ height, width }}
      />
      <Image
        src={sources.dark}
        alt=""
        width={width}
        height={height}
        priority={priority}
        className="brand-logo-dark h-auto w-auto"
        style={{ height, width }}
      />
    </span>
  );
}
