import type { EmailMessage } from "./email";

/**
 * Auth emails, Indonesian first then English, in one message. Inline styles
 * and a light background only — email clients ignore <style> blocks and
 * many force light mode. Brand accent matches the app (#4d8dff).
 */

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

interface Section {
  greeting: string;
  body: string;
  button: string;
  fallback: string;
  ignore: string;
}

const section = (copy: Section, url: string) => `
  <p style="margin:0 0 12px;font-size:15px;color:#141820;">${copy.greeting}</p>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#141820;">${copy.body}</p>
  <p style="margin:0 0 20px;">
    <a href="${escapeHtml(url)}" style="display:inline-block;background:#4d8dff;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:8px;">${copy.button}</a>
  </p>
  <p style="margin:0 0 6px;font-size:12px;color:#5b6477;">${copy.fallback}</p>
  <p style="margin:0 0 16px;font-size:12px;word-break:break-all;"><a href="${escapeHtml(url)}" style="color:#4d8dff;">${escapeHtml(url)}</a></p>
  <p style="margin:0;font-size:12px;color:#5b6477;">${copy.ignore}</p>`;

const layout = (id: Section, en: Section, url: string) => `<!doctype html>
<html><body style="margin:0;padding:24px 12px;background:#f3f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e3e7ef;border-radius:12px;">
      <tr><td style="padding:20px 28px;border-bottom:1px solid #e3e7ef;font-size:16px;font-weight:700;color:#141820;">mndjournal</td></tr>
      <tr><td style="padding:24px 28px;">${section(id, url)}</td></tr>
      <tr><td style="padding:0 28px;"><hr style="border:none;border-top:1px solid #e3e7ef;margin:0;"></td></tr>
      <tr><td style="padding:24px 28px;">${section(en, url)}</td></tr>
    </table>
  </td></tr></table>
</body></html>`;

const plainSection = (copy: Section, url: string) =>
  `${copy.greeting}\n\n${copy.body}\n\n${url}\n\n${copy.ignore}`;

const message = (
  to: string,
  subject: string,
  id: Section,
  en: Section,
  url: string,
): EmailMessage => ({
  to,
  subject,
  html: layout(id, en, url),
  text: `${plainSection(id, url)}\n\n---\n\n${plainSection(en, url)}\n`,
});

const firstName = (name: string, email: string) => {
  const trimmed = name.trim();
  // Signup falls back to the email address as the name; don't greet people as one.
  return trimmed && trimmed !== email ? trimmed : "";
};

export const verificationEmail = (user: { name: string; email: string }, url: string) => {
  const name = escapeHtml(firstName(user.name, user.email));
  return message(
    user.email,
    "Verifikasi email Anda · Verify your email — mndjournal",
    {
      greeting: name ? `Halo ${name},` : "Halo,",
      body: "Terima kasih sudah mendaftar di mndjournal. Klik tombol di bawah untuk memverifikasi email Anda dan mulai masa uji coba gratis. Link ini berlaku selama 24 jam.",
      button: "Verifikasi email",
      fallback: "Jika tombol tidak berfungsi, salin link ini ke browser Anda:",
      ignore: "Jika Anda tidak mendaftar di mndjournal, abaikan email ini.",
    },
    {
      greeting: name ? `Hi ${name},` : "Hi,",
      body: "Thanks for signing up for mndjournal. Click the button below to verify your email and start your free trial. This link is valid for 24 hours.",
      button: "Verify email",
      fallback: "If the button doesn't work, copy this link into your browser:",
      ignore: "If you didn't sign up for mndjournal, you can ignore this email.",
    },
    url,
  );
};

export const resetPasswordEmail = (user: { name: string; email: string }, url: string) => {
  const name = escapeHtml(firstName(user.name, user.email));
  return message(
    user.email,
    "Reset password Anda · Reset your password — mndjournal",
    {
      greeting: name ? `Halo ${name},` : "Halo,",
      body: "Kami menerima permintaan untuk mereset password akun mndjournal Anda. Klik tombol di bawah untuk membuat password baru. Link ini berlaku selama 1 jam.",
      button: "Reset password",
      fallback: "Jika tombol tidak berfungsi, salin link ini ke browser Anda:",
      ignore:
        "Jika Anda tidak meminta reset password, abaikan email ini — password Anda tidak akan berubah.",
    },
    {
      greeting: name ? `Hi ${name},` : "Hi,",
      body: "We received a request to reset the password for your mndjournal account. Click the button below to choose a new password. This link is valid for 1 hour.",
      button: "Reset password",
      fallback: "If the button doesn't work, copy this link into your browser:",
      ignore:
        "If you didn't ask to reset your password, you can ignore this email — your password won't change.",
    },
    url,
  );
};
