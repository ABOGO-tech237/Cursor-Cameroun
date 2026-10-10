const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Échappe un texte avant de l'insérer dans du HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/**
 * Retire les retours ligne d'une valeur destinée à un en-tête d'e-mail
 * (sujet, expéditeur, reply-to) pour empêcher l'injection d'en-têtes.
 */
export function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n\u0000]/g, " ").replace(/[ \t]{2,}/g, " ").trim();
}
