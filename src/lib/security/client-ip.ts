/**
 * Adresse utilisée comme clé de limite de débit.
 *
 * `x-forwarded-for` n'est lu que si `process.env.VERCEL` est défini.
 * Sur Vercel, la plateforme écrase cet en-tête : le premier saut est l'IP
 * cliente. Hors Vercel, le client peut le forger pour changer de seau et
 * contourner la limite, donc on l'ignore.
 *
 * On retombe ensuite sur `x-real-ip` (proxy local), puis sur le seau partagé
 * `unknown` s'il n'y a aucune IP. La limite est un frein, pas une preuve
 * d'identité.
 */
export function clientIp(request: Request): string {
  if (process.env.VERCEL) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}
