import { defineMessages } from "../define";

/** Notes editor, dictation, attachments, review export, rule checklist and adherence report. */
export const editor = defineMessages({
  en: {
    placeholder: "Write your review…",
    edit: "Edit",
    preview: "Preview",
    bold: "Bold",
    italic: "Italic",
    heading: "Heading",
    bulletList: "Bullet list",
    list: "List",
    checklist: "Checklist",
    linkTrade: "Link trade",
    insertTemplateLabel: "Insert note template",
    insertTemplate: "Insert template…",
    templates: "Note templates",
    nameTemplate: "Name this note template",
    saveTemplate: "Save template",
    findTrade: "Find trade by symbol, date or account",
    findTradePlaceholder: "Search symbol, date or account",
    loadingTrades: "Loading trades…",
    noMatchingTrades: "No matching trades.",
    latest50: "Showing the latest 50 matches. Search by date or account to find older trades.",
    nothingYet: "Nothing written yet.",
    notesLabel: "Review notes",
    builtIns: {
      pre: {
        name: "Pre-market plan",
        content:
          "## Market context\n\n## Setups to watch\n\n## Risk limits\n- [ ] Confirm daily risk limit\n- [ ] Check scheduled events\n\n## My intention\n",
      },
      review: {
        name: "Trade review",
        content: "## Setup and thesis\n\n## Execution\n\n## What worked\n\n## What I will change\n",
      },
      weekly: {
        name: "Weekly review",
        content:
          "## Wins this week\n\n## Repeated mistakes\n\n## Rules I followed\n\n## One improvement for next week\n",
      },
    },
    voice: {
      unsupported:
        "This browser does not support speech recognition. Open the journal in Chrome, or use keyboard dictation below.",
      dictate: "Dictate",
      dictateHint: "Dictate your note",
      stop: "Stop dictation",
      starting: "Starting…",
      listening: "Listening · Stop",
      help: "Dictation help",
      keyboardHelp:
        "Keyboard dictation types directly into your note. Use your keyboard’s microphone key or your system’s dictation shortcut. On Mac, enable Dictation in System Settings → Keyboard.",
      useKeyboard: "Use keyboard dictation",
      dismiss: "Dismiss",
      ready: "Note ready. Press your keyboard’s microphone key or dictation shortcut to speak.",
      errors: {
        blocked:
          "Microphone or speech access was blocked. Allow microphone access in your browser and system settings, then try again.",
        noMic: "No microphone is available. Connect or enable a microphone, then try again.",
        noSpeech: "No speech was detected. Try again and speak after the button says Listening.",
        network:
          "This browser could not reach its speech recognition service. Try Chrome with an internet connection, or use keyboard dictation below.",
        language:
          "This browser does not support dictation in your current language. Use keyboard dictation below.",
        start:
          "Speech recognition could not start in this browser. Try Chrome, or use keyboard dictation below.",
      },
    },
    attachments: {
      uploading: "Uploading…",
      add: "Add attachment",
      limits: "Images or PDF · up to 8 MB each",
      upload: "Upload attachment",
      failed: "Upload failed.",
      remove: (name: string) => `Remove ${name}`,
      confirmRemove: (name: string) => `Remove ${name}?`,
    },
    export: {
      failed: "Export failed.",
      pdf: "Export PDF",
      png: "Export PNG",
      privacy: "Turn off privacy mode to export financial figures.",
      title: "Review export",
      download: (kind: string) => `Download ${kind}`,
      pdfNote: "Review text · download the PDF for the paginated document.",
      imageAlt: "Exported journal review",
    },
    rules: {
      title: "Strategy rule review",
      followedPct: (pct: number) => `${pct}% followed · `,
      assessed: (done: number, total: number) => `${done}/${total} rules assessed`,
      addRules: "Add rules to this playbook to review adherence.",
      notAssessed: "Not assessed",
      followed: "Followed",
      broken: "Broken",
      assign: "Assign a playbook to check its rules for this trade.",
    },
    adherence: {
      title: "Rule adherence",
      summary: (evaluated: number, possible: number, total: number, unassessed: number) =>
        `${evaluated}/${possible} rule assessments across ${total} filtered closed trades. ${unassessed} trades still need assessment.`,
      allFollowed: "All rules followed",
      oneBroken: "At least one broken",
      tradesWin: (trades: number, win: string) => `${trades} trades · ${win} win`,
      mixed: "P&L hidden for mixed currencies.",
      byRule: "Performance by rule",
      ruleFollowed: (pct: string, n: number) => `${pct} followed · ${n} assessments`,
      split: (ft: number, fw: string, bt: number, bw: string) =>
        `Followed: ${ft} trades / ${fw} win · Broken: ${bt} / ${bw} win`,
      netPnl: "Net P&L:",
      followedWord: " followed / ",
      brokenWord: " broken ",
    },
  },
  id: {
    placeholder: "Tulis review Anda…",
    edit: "Ubah",
    preview: "Pratinjau",
    bold: "Tebal",
    italic: "Miring",
    heading: "Judul",
    bulletList: "Daftar poin",
    list: "Daftar",
    checklist: "Checklist",
    linkTrade: "Tautkan trade",
    insertTemplateLabel: "Sisipkan template catatan",
    insertTemplate: "Sisipkan template…",
    templates: "Template catatan",
    nameTemplate: "Beri nama template catatan ini",
    saveTemplate: "Simpan template",
    findTrade: "Cari trade berdasarkan simbol, tanggal, atau akun",
    findTradePlaceholder: "Cari simbol, tanggal, atau akun",
    loadingTrades: "Memuat trade…",
    noMatchingTrades: "Tidak ada trade yang cocok.",
    latest50:
      "Menampilkan 50 hasil terbaru. Cari berdasarkan tanggal atau akun untuk menemukan trade lama.",
    nothingYet: "Belum ada tulisan.",
    notesLabel: "Catatan review",
    builtIns: {
      pre: {
        name: "Rencana pre-market",
        content:
          "## Kondisi market\n\n## Setup yang dipantau\n\n## Batas risiko\n- [ ] Pastikan batas risiko harian\n- [ ] Cek jadwal rilis berita\n\n## Niat saya hari ini\n",
      },
      review: {
        name: "Review trade",
        content:
          "## Setup dan alasan\n\n## Eksekusi\n\n## Yang berjalan baik\n\n## Yang akan saya ubah\n",
      },
      weekly: {
        name: "Review mingguan",
        content:
          "## Pencapaian minggu ini\n\n## Mistake yang berulang\n\n## Aturan yang saya patuhi\n\n## Satu perbaikan untuk minggu depan\n",
      },
    },
    voice: {
      unsupported:
        "Browser ini tidak mendukung pengenalan suara. Buka jurnal di Chrome, atau gunakan dikte keyboard di bawah.",
      dictate: "Dikte",
      dictateHint: "Diktekan catatan Anda",
      stop: "Hentikan dikte",
      starting: "Memulai…",
      listening: "Mendengarkan · Stop",
      help: "Bantuan dikte",
      keyboardHelp:
        "Dikte keyboard mengetik langsung ke catatan Anda. Gunakan tombol mikrofon di keyboard atau shortcut dikte sistem. Di Mac, aktifkan Dictation di System Settings → Keyboard.",
      useKeyboard: "Gunakan dikte keyboard",
      dismiss: "Tutup",
      ready: "Catatan siap. Tekan tombol mikrofon keyboard atau shortcut dikte untuk mulai bicara.",
      errors: {
        blocked:
          "Akses mikrofon atau suara diblokir. Izinkan akses mikrofon di pengaturan browser dan sistem, lalu coba lagi.",
        noMic: "Tidak ada mikrofon. Sambungkan atau aktifkan mikrofon, lalu coba lagi.",
        noSpeech:
          "Tidak ada suara yang terdeteksi. Coba lagi dan bicara setelah tombol menunjukkan Mendengarkan.",
        network:
          "Browser ini tidak bisa menjangkau layanan pengenalan suaranya. Coba Chrome dengan koneksi internet, atau gunakan dikte keyboard di bawah.",
        language:
          "Browser ini tidak mendukung dikte dalam bahasa Anda saat ini. Gunakan dikte keyboard di bawah.",
        start:
          "Pengenalan suara tidak bisa dimulai di browser ini. Coba Chrome, atau gunakan dikte keyboard di bawah.",
      },
    },
    attachments: {
      uploading: "Mengupload…",
      add: "Tambah lampiran",
      limits: "Gambar atau PDF · maks 8 MB per file",
      upload: "Upload lampiran",
      failed: "Upload gagal.",
      remove: (name: string) => `Hapus ${name}`,
      confirmRemove: (name: string) => `Hapus ${name}?`,
    },
    export: {
      failed: "Ekspor gagal.",
      pdf: "Ekspor PDF",
      png: "Ekspor PNG",
      privacy: "Matikan mode privasi untuk mengekspor angka keuangan.",
      title: "Ekspor review",
      download: (kind: string) => `Unduh ${kind}`,
      pdfNote: "Teks review · unduh PDF untuk dokumen dengan halaman.",
      imageAlt: "Review jurnal yang diekspor",
    },
    rules: {
      title: "Review aturan strategi",
      followedPct: (pct: number) => `${pct}% dipatuhi · `,
      assessed: (done: number, total: number) => `${done}/${total} aturan dinilai`,
      addRules: "Tambahkan aturan ke playbook ini untuk mereview kepatuhan.",
      notAssessed: "Belum dinilai",
      followed: "Dipatuhi",
      broken: "Dilanggar",
      assign: "Pilih playbook untuk memeriksa aturannya pada trade ini.",
    },
    adherence: {
      title: "Kepatuhan aturan",
      summary: (evaluated: number, possible: number, total: number, unassessed: number) =>
        `${evaluated}/${possible} penilaian aturan dari ${total} trade tertutup yang terfilter. ${unassessed} trade masih perlu dinilai.`,
      allFollowed: "Semua aturan dipatuhi",
      oneBroken: "Minimal satu dilanggar",
      tradesWin: (trades: number, win: string) => `${trades} trade · win ${win}`,
      mixed: "P&L disembunyikan karena mata uang campuran.",
      byRule: "Performa per aturan",
      ruleFollowed: (pct: string, n: number) => `${pct} dipatuhi · ${n} penilaian`,
      split: (ft: number, fw: string, bt: number, bw: string) =>
        `Dipatuhi: ${ft} trade / win ${fw} · Dilanggar: ${bt} / win ${bw}`,
      netPnl: "Net P&L:",
      followedWord: " dipatuhi / ",
      brokenWord: " dilanggar ",
    },
  },
});
