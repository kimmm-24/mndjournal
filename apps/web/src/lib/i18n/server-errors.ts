import { PLAN_NOT_INCLUDED_MESSAGE } from "../ai-quota";
import {
  PLAYBOOKS_NOT_INCLUDED_MESSAGE,
  PROP_FIRM_NOT_INCLUDED_MESSAGE,
  READ_ONLY_MESSAGE,
  SYNC_IMPORT_NOT_INCLUDED_MESSAGE,
} from "../plan";
import type { Locale } from "./locale";

/**
 * The server speaks English: API errors, sync errors and import skip reasons
 * are stable English strings (tests and logs rely on them). They're
 * translated here, in the browser, on their way to the screen — every API
 * error already passes through lib/use-api.ts's postJson or
 * lib/api-request.ts's acquireJson, which call this.
 *
 * A message with no entry is shown as-is (English), which is the right
 * fallback for text from outside the app (broker/provider error details).
 * When adding a user-facing server message, add its Indonesian here; keying
 * on the shared constants (not copies of their text) keeps the two in step.
 */
const EXACT: Record<string, string> = {
  [READ_ONLY_MESSAGE]:
    "Paket Anda telah berakhir, jadi jurnal Anda sekarang hanya-baca. Pilih paket di halaman Billing untuk melanjutkan journaling.",
  [PLAYBOOKS_NOT_INCLUDED_MESSAGE]:
    "Playbook tidak termasuk dalam paket Anda. Upgrade ke Pro atau Elite untuk membuat dan menggunakan playbook.",
  [PROP_FIRM_NOT_INCLUDED_MESSAGE]:
    "Tracking prop firm tidak termasuk dalam paket Anda. Upgrade ke Pro atau Elite untuk menambahkan akun prop firm.",
  [SYNC_IMPORT_NOT_INCLUDED_MESSAGE]:
    "Broker sync dan import file tidak termasuk dalam paket Anda. Upgrade ke Pro atau Elite, atau tambahkan akun manual.",
  [PLAN_NOT_INCLUDED_MESSAGE]:
    "Fitur AI tidak termasuk dalam paket Anda. Upgrade ke Pro atau Elite untuk menggunakannya.",

  Unauthorized: "Sesi Anda telah berakhir. Silakan masuk kembali.",
  "Unknown action": "Aksi tidak dikenal.",
  "Save failed": "Gagal menyimpan.",
  "Enter valid settings.": "Masukkan pengaturan yang valid.",
  "Enter a valid IANA statement timezone.": "Masukkan zona waktu IANA yang valid untuk statement.",

  "Account not found": "Akun tidak ditemukan.",
  "Account not found.": "Akun tidak ditemukan.",
  "Destination account not found": "Akun tujuan tidak ditemukan.",
  "Trade not found": "Trade tidak ditemukan.",
  "Trade not found.": "Trade tidak ditemukan.",
  "Note not found": "Catatan tidak ditemukan.",
  "Playbook not found": "Playbook tidak ditemukan.",
  "Attachment not found": "Lampiran tidak ditemukan.",
  "Entry not found.": "Entri tidak ditemukan.",
  "Prop account not found.": "Akun prop tidak ditemukan.",
  "Order not found": "Order tidak ditemukan.",
  "Account limit reached (2,000).": "Batas jumlah akun tercapai (2,000).",

  "Broker connection failed": "Gagal terhubung ke broker.",
  "Account is not broker-connected": "Akun ini tidak terhubung ke broker.",
  "This account is already syncing.": "Akun ini sedang disinkronkan.",
  "Sync was interrupted by a server restart.":
    "Sinkronisasi terputus karena server dimulai ulang. Akan dicoba lagi otomatis.",
  "MetaTrader connection failed": "Gagal terhubung ke MetaTrader.",
  "MetaTrader sync isn't configured on this server.":
    "Sinkronisasi MetaTrader belum dikonfigurasi di server ini.",
  "Choose MT4 or MT5.": "Pilih MT4 atau MT5.",
  "Enter your broker's MetaTrader server name.": "Masukkan nama server MetaTrader broker Anda.",
  "Enter your investor password.": "Masukkan investor password Anda.",
  "The MetaTrader login is your account number (digits only).":
    "Login MetaTrader adalah nomor akun Anda (hanya angka).",
  "MetaTrader is taking too long to recognize this broker server. Check the server name and try again in a minute.":
    "MetaTrader terlalu lama mengenali server broker ini. Periksa nama server dan coba lagi dalam satu menit.",
  "Couldn't log in to your MetaTrader account. If you changed the investor password, reconnect the account.":
    "Gagal masuk ke akun MetaTrader Anda. Jika Anda mengganti investor password, hubungkan ulang akun ini.",
  "MetaTrader didn't connect in time. It will retry on the next sync.":
    "MetaTrader tidak terhubung tepat waktu. Akan dicoba lagi pada sinkronisasi berikutnya.",

  "Payments aren't configured on this server yet.": "Pembayaran belum dikonfigurasi di server ini.",
  "Unknown plan": "Paket tidak dikenal.",
  "Unknown billing interval": "Periode tagihan tidak dikenal.",

  "No closed trades on this day to recap":
    "Tidak ada trade yang ditutup pada hari ini untuk dibuatkan recap.",
  "The journal is empty — import trades first":
    "Jurnal masih kosong — import trade terlebih dahulu.",
  "You don't have any playbooks yet — create one first to get a suggestion.":
    "Anda belum punya playbook — buat satu dulu untuk mendapatkan saran.",
  "AI billing: check your provider account's credits and quota.":
    "Tagihan AI: periksa kredit dan kuota akun provider Anda.",
  "AI rate limit: please try again shortly.":
    "Batas penggunaan AI tercapai: coba lagi sebentar lagi.",
  "AI request failed. Check your provider settings or try again shortly.":
    "Permintaan AI gagal. Periksa pengaturan provider atau coba lagi sebentar lagi.",
  "AI returned no text. Check the model or try again.":
    "AI tidak mengembalikan teks. Periksa model atau coba lagi.",
  "Choose Anthropic or OpenAI.": "Pilih Anthropic atau OpenAI.",

  "Notes are too long.": "Catatan terlalu panjang.",
  "Enter a folder name.": "Masukkan nama folder.",
  "Folder names must be 100 characters or fewer.": "Nama folder maksimal 100 karakter.",
  "Supported files: PNG, JPEG, WebP and PDF.": "File yang didukung: PNG, JPEG, WebP, dan PDF.",
  "No executions to import": "Tidak ada eksekusi untuk diimport.",
  "Import 1–1,000 rows at a time.": "Import 1–1,000 baris sekaligus.",
  "Image export failed.": "Ekspor gambar gagal.",
  "Image export is unavailable in this browser.": "Ekspor gambar tidak tersedia di browser ini.",
  "Could not load the PDF font.": "Gagal memuat font PDF.",

  "Market replay is available for closed trades only.":
    "Market replay hanya tersedia untuk trade yang sudah ditutup.",
  "Add a market data API key in Settings first.":
    "Tambahkan API key market data di Pengaturan terlebih dahulu.",
  "Upload market candles in Settings first.": "Upload data candle di Pengaturan terlebih dahulu.",
  "Enable this public market data source in Settings first.":
    "Aktifkan sumber market data publik ini di Pengaturan terlebih dahulu.",
  "Market data rate limit reached. Try again later.":
    "Batas permintaan market data tercapai. Coba lagi nanti.",
  "Market data request failed or timed out. Try again.":
    "Permintaan market data gagal atau timeout. Coba lagi.",
  "Save this provider's credentials again in Settings.":
    "Simpan ulang kredensial provider ini di Pengaturan.",
  "Choose a market data provider.": "Pilih provider market data.",
  "Choose an available market data provider.": "Pilih provider market data yang tersedia.",
  "Enter the required connection fields.": "Isi kolom koneksi yang wajib.",
  "Choose a CSV file.": "Pilih file CSV.",
  "CSV must be 2 MB or smaller.": "Ukuran CSV maksimal 2 MB.",
  "Use a CSV smaller than 5 MB.": "Gunakan CSV yang lebih kecil dari 5 MB.",
  "CSV must contain 1–50,000 candle rows.": "CSV harus berisi 1–50,000 baris candle.",
  "Remove an unused dataset before adding more (50-file limit).":
    "Hapus dataset yang tidak dipakai sebelum menambah lagi (batas 50 file).",
  "Duplicate candle timestamps. Remove duplicates before importing.":
    "Ada timestamp candle duplikat. Hapus duplikatnya sebelum mengimport.",
  "Choose a dataset.": "Pilih dataset.",
  "Choose a candle resolution.": "Pilih resolusi candle.",
  "Choose a supported candle resolution.": "Pilih resolusi candle yang didukung.",

  "Enter an amount greater than zero.": "Masukkan jumlah lebih dari nol.",
  "Enter a nonnegative decimal amount.": "Masukkan jumlah desimal yang tidak negatif.",
  "Amount is too large.": "Jumlah terlalu besar.",
  "Restore this entry before editing it.": "Pulihkan entri ini sebelum mengubahnya.",
  "A reversal cannot exceed the money received by that date.":
    "Pembalikan tidak boleh melebihi uang yang diterima sampai tanggal tersebut.",
  "Select one currency before combining cash amounts.":
    "Pilih satu mata uang sebelum menggabungkan jumlah kas.",
  "Choose a supported three-letter currency code.":
    "Pilih kode mata uang tiga huruf yang didukung.",

  "Breakeven must be a nonnegative amount or percentage.":
    "Breakeven harus berupa jumlah atau persentase yang tidak negatif.",
  "Fees must be nonnegative.": "Fee tidak boleh negatif.",
  "Stop and target distances must be positive.": "Jarak stop dan target harus positif.",
  "Invalid default account or symbol.": "Akun atau simbol default tidak valid.",

  // Import / sync skip reasons.
  "Execution is missing.": "Data eksekusi tidak ada.",
  "An execution has no symbol.": "Ada eksekusi tanpa simbol.",
};

type Pattern = [RegExp, (match: RegExpMatchArray) => string];

const PATTERNS: Pattern[] = [
  [
    /^You've reached your plan's limit of (\d+) accounts?\. Upgrade to add more\.$/,
    (m) => `Anda sudah mencapai batas paket Anda: ${m[1]} akun. Upgrade untuk menambah lagi.`,
  ],
  [
    /^You've reached your plan's limit of (\d+) prop-firm accounts?\. Upgrade to add more\.$/,
    (m) =>
      `Anda sudah mencapai batas paket Anda: ${m[1]} akun prop firm. Upgrade untuk menambah lagi.`,
  ],
  [
    /^Your AI quota for this month is used up \((\d+)\/(\d+)\)\. It resets on (\S+)\.$/,
    (m) => `Kuota AI bulan ini sudah habis (${m[1]}/${m[2]}). Kuota direset pada ${m[3]}.`,
  ],
  [
    /^MetaTrader was synced moments ago — try again in (\d+) min\.$/,
    (m) => `MetaTrader baru saja disinkronkan — coba lagi dalam ${m[1]} menit.`,
  ],
  [/^Couldn't connect to MetaTrader: (.*)$/, (m) => `Gagal terhubung ke MetaTrader: ${m[1]}`],
  [/^Couldn't read MetaTrader history: (.*)$/, (m) => `Gagal membaca riwayat MetaTrader: ${m[1]}`],
  [
    /^Couldn't (deploy|undeploy) the MetaTrader connection: (.*)$/,
    (m) =>
      `Gagal ${m[1] === "deploy" ? "mengaktifkan" : "menonaktifkan"} koneksi MetaTrader: ${m[2]}`,
  ],
  [/^Midtrans rejected the checkout: (.*)$/, (m) => `Midtrans menolak checkout: ${m[1]}`],
  [/^(\w{3}) accepts (\d+) decimal places\.$/, (m) => `${m[1]} menerima ${m[2]} angka desimal.`],
  [/^Row (\d+): (.*)$/, (m) => `Baris ${m[1]}: ${localizeServerError(m[2]!, "id")}`],
  [
    /^(\d+) fill\(s\) had no usable timestamp\.$/,
    (m) => `${m[1]} fill tidak punya timestamp yang valid.`,
  ],
  [/^(.+): side must be buy or sell\.$/, (m) => `${m[1]}: sisi harus buy atau sell.`],
  [
    /^(.+): quantity must be a finite positive number\.$/,
    (m) => `${m[1]}: kuantitas harus berupa angka positif.`,
  ],
  [/^(.+): price must be a finite number\.$/, (m) => `${m[1]}: harga harus berupa angka.`],
  [/^(.+): fee must be a finite number\.$/, (m) => `${m[1]}: fee harus berupa angka.`],
  [
    /^(.+): timestamp is missing or invalid\.$/,
    (m) => `${m[1]}: timestamp tidak ada atau tidak valid.`,
  ],
  [/^Request failed \((\d+)\)$/, (m) => `Permintaan gagal (${m[1]}).`],
  [
    /^PDF font does not support these characters: (.*)\. Remove them for this export, or export a PNG review\.$/,
    (m) =>
      `Font PDF tidak mendukung karakter berikut: ${m[1]}. Hapus karakter tersebut untuk ekspor ini, atau ekspor sebagai PNG.`,
  ],
  [/^Use at most (\d+) defaults per type\.$/, (m) => `Gunakan maksimal ${m[1]} default per jenis.`],
];

export function localizeServerError(message: string, locale: Locale): string {
  if (locale === "en") return message;
  const exact = EXACT[message];
  if (exact) return exact;
  for (const [pattern, render] of PATTERNS) {
    const match = message.match(pattern);
    if (match) return render(match);
  }
  return message;
}

/** For non-React callers (fetch helpers): the language the page is currently rendered in. */
export const documentLocale = (): Locale =>
  typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "id";
