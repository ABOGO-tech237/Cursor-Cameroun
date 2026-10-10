/**
 * Adresse utilisée comme clé de limite de débit.
 * Sur Vercel, le premier saut de `x-forwarded-for` est l'IP cliente posée
 * par la plateforme. Sans proxy de confiance, cet en-tête peut être forgé :
 * la limite est un frein, pas une preuve d'identité.
 * Sans IP, toutes les requêtes partagent le seau `unknown`.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}
