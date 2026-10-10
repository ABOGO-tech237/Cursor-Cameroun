import { Resend } from "resend";
import type { ContactEmail } from "./contact-email";

export async function sendResendEmail(
  apiKey: string,
  email: ContactEmail,
): Promise<{ ok: boolean }> {
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: email.from,
    to: [email.to],
    replyTo: email.replyTo,
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
