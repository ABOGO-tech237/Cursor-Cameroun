import { Resend } from "resend";

/** Message passé à Resend. `replyTo` est facultatif (notification admin, accusé). */
export type OutboundEmail = {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendResendEmail(
  apiKey: string,
  email: OutboundEmail,
): Promise<{ ok: boolean }> {
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: email.from,
    to: [email.to],
    ...(email.replyTo ? { replyTo: email.replyTo } : {}),
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  if (error) {
    console.error("Resend API Error", error);
    return { ok: false };
  }

  return { ok: true };
}
