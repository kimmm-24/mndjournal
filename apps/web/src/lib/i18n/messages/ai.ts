import { defineMessages } from "../define";

/** AI notices (friendly error copy) and the "Ask your journal" card. */
export const ai = defineMessages({
  en: {
    tryAgain: "Try again",
    dismiss: "Dismiss AI notice",
    feedback: {
      notConfigured: {
        title: "Set up AI to continue",
        description:
          "Connect an Anthropic or OpenAI API key in Settings to ask questions, generate recaps, and review trades.",
        action: "Set up AI",
      },
      notIncluded: { title: "Upgrade to use AI features", action: "See plans" },
      quota: { title: "Monthly AI quota reached" },
      trialQuota: { title: "Trial AI calls used up", action: "See plans" },
      tooFast: { title: "Slow down a little" },
      paused: { title: "AI is paused for today" },
      tooLong: { title: "Too much text for AI" },
      auth: {
        title: "Check your AI connection",
        description:
          "Your AI provider couldn’t verify your key or permissions. Review them in Settings, then try again.",
        action: "Review AI settings",
      },
      billing: {
        title: "Your AI account needs attention",
        description:
          "Check the billing, credit balance, or quota on your AI provider account, then try again.",
      },
      model: {
        title: "Check your AI model",
        description: "Check the model ID and your provider account’s access in Settings.",
        action: "Review AI settings",
      },
      busy: {
        title: "AI is temporarily busy",
        description: "Please wait a moment before trying again. Your journal data hasn’t changed.",
      },
      noPlaybooks: {
        title: "Create a playbook first",
        description: "A playbook suggestion needs at least one playbook to match against.",
        action: "Create a playbook",
      },
      emptyJournal: {
        title: "Add trades to get started",
        description:
          "AI insights use your journal history. Import your trades, then ask your question again.",
        action: "Import trades",
      },
      noTradesToday: {
        title: "No trades to recap yet",
        description:
          "A recap needs at least one closed trade on this day. You can still write your own day note.",
      },
      signIn: {
        title: "Please sign in again",
        description: "Your session may have expired. Sign in to continue using your journal.",
        action: "Sign in",
      },
      network: {
        title: "Couldn’t connect to AI",
        description: "Check your connection and try again. Your journal data hasn’t changed.",
      },
      generic: {
        title: "Couldn’t complete the AI request",
        description: "Please try again in a moment. If this continues, check your AI settings.",
      },
    },
    ask: {
      title: "Ask your journal",
      label: "Ask your journal a question",
      placeholder: "Why do my Monday shorts keep failing?",
      thinking: "Thinking…",
      submit: "Ask",
      failed: "Request failed",
      suggestions: [
        "What's my most expensive mistake?",
        "Which weekday should I stop trading?",
        "Am I better at longs or shorts?",
      ],
    },
  },
  id: {
    tryAgain: "Coba lagi",
    dismiss: "Tutup pemberitahuan AI",
    feedback: {
      notConfigured: {
        title: "Atur AI untuk melanjutkan",
        description:
          "Hubungkan API key Anthropic atau OpenAI di Pengaturan untuk bertanya, membuat recap, dan mereview trade.",
        action: "Atur AI",
      },
      notIncluded: { title: "Upgrade untuk memakai fitur AI", action: "Lihat paket" },
      quota: { title: "Kuota AI bulanan tercapai" },
      trialQuota: { title: "Jatah AI masa trial sudah habis", action: "Lihat paket" },
      tooFast: { title: "Pelan-pelan sedikit" },
      paused: { title: "AI dijeda untuk hari ini" },
      tooLong: { title: "Teks terlalu panjang untuk AI" },
      auth: {
        title: "Periksa koneksi AI Anda",
        description:
          "Provider AI Anda tidak bisa memverifikasi API key atau izin Anda. Periksa di Pengaturan, lalu coba lagi.",
        action: "Periksa pengaturan AI",
      },
      billing: {
        title: "Akun AI Anda perlu diperiksa",
        description:
          "Periksa tagihan, saldo kredit, atau kuota di akun provider AI Anda, lalu coba lagi.",
      },
      model: {
        title: "Periksa model AI Anda",
        description: "Periksa ID model dan akses akun provider Anda di Pengaturan.",
        action: "Periksa pengaturan AI",
      },
      busy: {
        title: "AI sedang sibuk",
        description: "Tunggu sebentar sebelum mencoba lagi. Data jurnal Anda tidak berubah.",
      },
      noPlaybooks: {
        title: "Buat playbook terlebih dahulu",
        description: "Saran playbook memerlukan minimal satu playbook untuk dicocokkan.",
        action: "Buat playbook",
      },
      emptyJournal: {
        title: "Tambahkan trade untuk memulai",
        description:
          "Insight AI memakai riwayat jurnal Anda. Import trade Anda, lalu ajukan pertanyaan lagi.",
        action: "Import trade",
      },
      noTradesToday: {
        title: "Belum ada trade untuk dibuatkan recap",
        description:
          "Recap memerlukan minimal satu trade yang ditutup pada hari ini. Anda tetap bisa menulis catatan harian sendiri.",
      },
      signIn: {
        title: "Silakan masuk kembali",
        description:
          "Sesi Anda mungkin sudah berakhir. Masuk untuk melanjutkan memakai jurnal Anda.",
        action: "Masuk",
      },
      network: {
        title: "Gagal terhubung ke AI",
        description: "Periksa koneksi Anda dan coba lagi. Data jurnal Anda tidak berubah.",
      },
      generic: {
        title: "Permintaan AI tidak bisa diselesaikan",
        description: "Coba lagi sebentar lagi. Jika masih terjadi, periksa pengaturan AI Anda.",
      },
    },
    ask: {
      title: "Tanya jurnal Anda",
      label: "Ajukan pertanyaan ke jurnal Anda",
      placeholder: "Kenapa short saya di hari Senin sering gagal?",
      thinking: "Menganalisis…",
      submit: "Tanya",
      failed: "Permintaan gagal",
      suggestions: [
        "Apa mistake saya yang paling mahal?",
        "Di hari apa sebaiknya saya berhenti trading?",
        "Saya lebih bagus di long atau short?",
      ],
    },
  },
});
