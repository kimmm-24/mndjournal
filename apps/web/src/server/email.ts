/**
 * Transactional email through Resend's HTTP API (plain fetch, no SDK).
 * HTTP rather than SMTP on purpose: Railway blocks outbound SMTP on its
 * Hobby/Trial plans.
 *
 * Unconfigured (no RESEND_API_KEY) is a supported mode, not an error: the
 * message is printed to the server log instead — which is how local
 * development gets verification/reset links — and server/auth.ts doesn't
 * require email verification, so signups keep working.
 */
const RESEND_URL = "https://api.resend.com/emails";

export const emailConfigured = (): boolean => Boolean(process.env.RESEND_API_KEY);

/** Sender; its domain must be verified in Resend (Domains → add mndjournal.com's DNS records). */
const sender = () => process.env.EMAIL_FROM || "mndjournal <no-reply@mndjournal.com>";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export const sendEmail = async (message: EmailMessage): Promise<void> => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(
      `[email] RESEND_API_KEY not set — not sent.\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`,
    );
    return;
  }
  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: sender(),
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  if (!response.ok) {
    const detail = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Resend rejected the email: ${detail.message ?? `HTTP ${response.status}`}`);
  }
};

/**
 * Fire-and-forget for auth flows: awaiting delivery would make "forgot
 * password" respond measurably slower for registered emails than unknown
 * ones, leaking which addresses have accounts. Failures are logged.
 */
export const deliver = (message: EmailMessage): void => {
  sendEmail(message).catch((error: unknown) => console.error("[email] send failed", error));
};
