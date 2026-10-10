const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileMode = "off" | "on" | "misconfigured";

/**
 * Turnstile n'est actif que si la clé site publique ET le secret sont définis.
 * Une seule des deux clés est une mauvaise configuration : l'appelant doit
 * refuser l'envoi (503) plutôt que de laisser passer sans vérification.
 */
export function turnstileMode(env: {
  siteKey?: string;
  secretKey?: string;
}): TurnstileMode {
  const site = Boolean(env.siteKey?.trim());
  const secret = Boolean(env.secretKey?.trim());
  if (site && secret) return "on";
  if (!site && !secret) return "off";
  return "misconfigured";
}

export async function verifyTurnstileToken(
  token: string,
  secret: string,
  ip: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  try {
    const response = await fetchImpl(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("Turnstile : siteverify injoignable", error);
    return false;
  }
}
