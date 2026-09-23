import { defineMessages } from "../define";

/** Import page: file upload, broker sync, manual entry tab. */
export const importer = defineMessages({
  en: {
    title: "Import trades",
    tabs: { file: "File upload", sync: "Broker sync", manual: "Manual" },
    manualTitle: "Add executions manually",
    previewFailed: "Import preview failed",
    importFailed: "Import failed",
    skippedNote: (n: number, reason: string) => ` ${n} invalid rows were skipped: ${reason}`,
    imported: (inserted: number, duplicates: number, note: string) =>
      `Imported ${inserted} executions (${duplicates} duplicates skipped).${note}`,
    uploadTitle: "Upload a statement or export",
    statementTimezone: "Statement timezone (IANA)",
    statementTimezoneShort: "Statement timezone",
    statementHelp: (zone: string) =>
      `Choose the timezone used by your broker's statement. Timestamps with an explicit offset keep that offset. Your journal displays times in ${zone}.`,
    invalidTimezone: "Enter a valid IANA timezone, such as Asia/Jakarta.",
    dropFile: "Drop or choose a CSV / HTML statement",
    autoDetected: (formats: string) =>
      `Auto-detected: ${formats} — anything else via column mapping.`,
    reading: "Reading…",
    previewFile: "Preview file",
    symbol: "Symbol",
    symbolPlaceholder: "XAUUSD, EURUSD…",
    preview: "Preview",
    unrecognized: "Format not recognized — map your columns (nothing is guessed silently):",
    mappingFields: {
      symbol: "Symbol",
      side: "Side",
      quantity: "Quantity",
      price: "Price",
      fee: "Fee (optional)",
      timestamp: "Timestamp",
    },
    column: "column",
    previewMapping: "Preview with mapping",
    executions: (n: number) => `${n} executions`,
    symbols: (n: number) => `· ${n} symbols`,
    rowsSkipped: (n: number) => `· ${n} rows skipped`,
    zones: (statement: string, display: string) =>
      `Statement timezone: ${statement}. Preview times: ${display}.`,
    firstFive: "Showing the first 5 executions.",
    correcting:
      "Correcting a previous import? Remove the affected trades before importing again with a different timezone to avoid duplicates. Back up your data first.",
    importing: "Importing…",
    import: "Import",
    broker: {
      connectFailed: "Connection failed",
      title: "Connect a broker (read-only access, stored encrypted)",
      label: "Broker / exchange",
      choose: "Choose a broker",
      accountName: "Account name",
      connecting: "Connecting…",
      connect: "Connect & sync",
      /** Form text for connectors whose server-side copy is English-only. */
      overrides: {
        metatrader: {
          setup:
            "Use your INVESTOR password — it can only read your history, never place trades. Find or set it in MetaTrader under Tools → Options → Server → Change (investor). The server name is the one you pick on MetaTrader's login screen, e.g. \"MonexInvestindo-Live\". mndjournal passes the password to its MetaTrader provider once to connect and doesn't store it.",
          fields: {
            platform: "Platform",
            login: "Account number (login)",
            password: "Investor (read-only) password",
            server: "Broker server (as on the MT login screen)",
          },
        },
      } as Record<string, { setup?: string; fields?: Record<string, string> }>,
    },
  },
  id: {
    title: "Import trade",
    tabs: { file: "Upload file", sync: "Broker sync", manual: "Manual" },
    manualTitle: "Tambah eksekusi secara manual",
    previewFailed: "Pratinjau import gagal",
    importFailed: "Import gagal",
    skippedNote: (n: number, reason: string) => ` ${n} baris tidak valid dilewati: ${reason}`,
    imported: (inserted: number, duplicates: number, note: string) =>
      `Berhasil mengimport ${inserted} eksekusi (${duplicates} duplikat dilewati).${note}`,
    uploadTitle: "Upload statement atau file ekspor",
    statementTimezone: "Zona waktu statement (IANA)",
    statementTimezoneShort: "Zona waktu statement",
    statementHelp: (zone: string) =>
      `Pilih zona waktu yang dipakai statement broker Anda. Timestamp yang sudah punya offset tetap memakai offset tersebut. Jurnal Anda menampilkan waktu dalam ${zone}.`,
    invalidTimezone: "Masukkan zona waktu IANA yang valid, misalnya Asia/Jakarta.",
    dropFile: "Letakkan atau pilih statement CSV / HTML",
    autoDetected: (formats: string) =>
      `Terdeteksi otomatis: ${formats} — format lain lewat pemetaan kolom.`,
    reading: "Membaca…",
    previewFile: "Pratinjau file",
    symbol: "Simbol",
    symbolPlaceholder: "XAUUSD, EURUSD…",
    preview: "Pratinjau",
    unrecognized: "Format tidak dikenali — petakan kolom Anda (tidak ada yang ditebak diam-diam):",
    mappingFields: {
      symbol: "Simbol",
      side: "Sisi",
      quantity: "Kuantitas",
      price: "Harga",
      fee: "Fee (opsional)",
      timestamp: "Timestamp",
    },
    column: "kolom",
    previewMapping: "Pratinjau dengan pemetaan",
    executions: (n: number) => `${n} eksekusi`,
    symbols: (n: number) => `· ${n} simbol`,
    rowsSkipped: (n: number) => `· ${n} baris dilewati`,
    zones: (statement: string, display: string) =>
      `Zona waktu statement: ${statement}. Waktu pratinjau: ${display}.`,
    firstFive: "Menampilkan 5 eksekusi pertama.",
    correcting:
      "Memperbaiki import sebelumnya? Hapus trade yang terdampak sebelum mengimport ulang dengan zona waktu berbeda agar tidak ada duplikat. Backup data Anda terlebih dahulu.",
    importing: "Mengimport…",
    import: "Import",
    broker: {
      connectFailed: "Koneksi gagal",
      title: "Hubungkan broker (akses read-only, disimpan terenkripsi)",
      label: "Broker / exchange",
      choose: "Pilih broker",
      accountName: "Nama akun",
      connecting: "Menghubungkan…",
      connect: "Hubungkan & sinkronkan",
      overrides: {
        metatrader: {
          setup:
            'Gunakan INVESTOR password — password ini hanya bisa membaca riwayat, tidak bisa membuka trade. Cari atau atur di MetaTrader lewat Tools → Options → Server → Change (investor). Nama server adalah yang Anda pilih di layar login MetaTrader, misalnya "MonexInvestindo-Live". mndjournal hanya meneruskan password ke provider MetaTrader sekali untuk menghubungkan akun dan tidak menyimpannya.',
          fields: {
            platform: "Platform",
            login: "Nomor akun (login)",
            password: "Investor password (read-only)",
            server: "Server broker (seperti di layar login MT)",
          },
        },
      },
    },
  },
});
