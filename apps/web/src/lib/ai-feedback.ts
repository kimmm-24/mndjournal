import { messagesFor, type Messages } from "./i18n";

export interface AiFeedback {
  title: string;
  description: string;
  tone: "info" | "error";
  action?: { label: string; href: string };
  retry?: boolean;
}

/**
 * Friendly, bounded copy: never echo provider payloads or credentials into the UI.
 * `message` may arrive in English (server text) or already translated to
 * Indonesian (lib/i18n/server-errors.ts), so each case matches both.
 */
export function aiFeedback(
  message: string,
  t: Messages<"ai"> = messagesFor("ai", "en"),
): AiFeedback {
  const f = t.feedback;
  if (/AI is not configured/i.test(message))
    return {
      title: f.notConfigured.title,
      description: f.notConfigured.description,
      tone: "info",
      action: { label: f.notConfigured.action, href: "/settings#ai-settings" },
    };
  if (/not included in your plan|tidak termasuk dalam paket/i.test(message))
    return {
      title: f.notIncluded.title,
      description: message,
      tone: "info",
      action: { label: f.notIncluded.action, href: "/billing" },
    };
  if (/AI quota for this month is used up|Kuota AI bulan ini sudah habis/i.test(message))
    return {
      title: f.quota.title,
      description: message,
      tone: "info",
    };
  if (
    /invalid.*(?:api.?key|x-api-key)|incorrect api key|authentication_error|invalid_api_key/i.test(
      message,
    )
  )
    return {
      title: f.auth.title,
      description: f.auth.description,
      tone: "error",
      action: { label: f.auth.action, href: "/settings#ai-settings" },
    };
  if (
    /credit balance|billing|insufficient.*(?:credit|quota)|exceeded your current quota|Tagihan AI/i.test(
      message,
    )
  )
    return {
      title: f.billing.title,
      description: f.billing.description,
      tone: "info",
    };
  if (/model unavailable|model_not_found/i.test(message))
    return {
      title: f.model.title,
      description: f.model.description,
      tone: "error",
      action: { label: f.model.action, href: "/settings#ai-settings" },
    };
  if (/rate.limit|too many requests|overloaded|Batas penggunaan AI/i.test(message))
    return {
      title: f.busy.title,
      description: f.busy.description,
      tone: "info",
      retry: true,
    };
  if (/don't have any playbooks yet|belum punya playbook/i.test(message))
    return {
      title: f.noPlaybooks.title,
      description: f.noPlaybooks.description,
      tone: "info",
      action: { label: f.noPlaybooks.action, href: "/playbooks" },
    };
  if (/journal is empty|Jurnal masih kosong/i.test(message))
    return {
      title: f.emptyJournal.title,
      description: f.emptyJournal.description,
      tone: "info",
      action: { label: f.emptyJournal.action, href: "/import" },
    };
  if (/No closed trades on this day|Tidak ada trade yang ditutup pada hari ini/i.test(message))
    return {
      title: f.noTradesToday.title,
      description: f.noTradesToday.description,
      tone: "info",
    };
  if (/Unauthorized|Sesi Anda telah berakhir/i.test(message))
    return {
      title: f.signIn.title,
      description: f.signIn.description,
      tone: "info",
      action: { label: f.signIn.action, href: "/login" },
    };
  if (/failed to fetch|network|timeout|timed out|connection|koneksi/i.test(message))
    return {
      title: f.network.title,
      description: f.network.description,
      tone: "error",
      retry: true,
    };
  return {
    title: f.generic.title,
    description: f.generic.description,
    tone: "error",
    retry: true,
  };
}
