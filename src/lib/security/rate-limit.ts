export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimiter = {
  check: (key: string) => RateLimitResult;
};

/**
 * Limiteur en mémoire, volontairement simple, réutilisable par route
 * (`/api/send` et `/api/partners`, chacun avec son seau).
 *
 * Limite en serverless : chaque instance (isolate Vercel, cold start) a sa
 * propre `Map`. Le compteur n'est pas global, il repart à zéro au redémarrage
 * de l'instance, et deux instances peuvent chacune accepter `limit` requêtes.
 * Ce n'est pas un quota partagé. Une table Postgres (Drizzle) ou un store
 * externe serait nécessaire pour une limite ferme entre instances. Le proxy
 * (`src/proxy.ts`) ne peut pas porter ce compteur : il exclut `/api` et son
 * runtime ne partage pas la mémoire des routes.
 */
export function createMemoryRateLimiter(options: {
  limit: number;
  windowMs: number;
  now?: () => number;
  store?: Map<string, Bucket>;
}): RateLimiter {
  const store = options.store ?? new Map<string, Bucket>();
  const now = options.now ?? Date.now;
  const { limit, windowMs } = options;

  return {
    check(key: string): RateLimitResult {
      const time = now();
      if (store.size > 1000) {
        for (const [storedKey, bucket] of store) {
          if (bucket.resetAt <= time) store.delete(storedKey);
        }
      }

      const current = store.get(key);
      if (!current || current.resetAt <= time) {
        store.set(key, { count: 1, resetAt: time + windowMs });
        return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
      }

      if (current.count >= limit) {
        return {
          ok: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - time) / 1000)),
        };
      }

      current.count += 1;
      return {
        ok: true,
        remaining: limit - current.count,
        retryAfterSeconds: 0,
      };
    },
  };
}

/**
 * 5 formulaires de contact / 10 minutes / IP / instance.
 * Seuil de départ, à ajuster si Emmanuel le souhaite.
 */
export const contactRateLimiter = createMemoryRateLimiter({
  limit: 5,
  windowMs: 10 * 60 * 1000,
});

/**
 * 5 propositions de partenariat / 10 minutes / IP / instance.
 * Seau distinct du contact, même seuil de départ.
 */
export const partnerRateLimiter = createMemoryRateLimiter({
  limit: 5,
  windowMs: 10 * 60 * 1000,
});
