import { defineMessages } from "../define";

/** Accounts page. */
export const accounts = defineMessages({
  en: {
    title: "Accounts",
    syncSkipped: (inserted: number, skipped: number, reasons: string) =>
      `Sync finished with ${inserted} new fills. ${skipped} broker record(s) were skipped: ${reasons}`,
    syncFailed: "Sync failed",
    empty: "No accounts yet — create one on the Import page.",
    kinds: { sync: "sync", import: "import", manual: "manual" },
    syncNow: "Sync now",
    archive: "Archive",
    unarchive: "Unarchive",
    delete: "Delete account",
    confirmDelete: (name: string) => `Delete "${name}" and ALL its trades? This cannot be undone.`,
    syncing: "Syncing…",
    syncingMetaTrader: " Connecting to MetaTrader can take a minute or two.",
    lastFailed: (reason: string) => `Last sync failed: ${reason}`,
    equity: "Broker equity:",
    positionsSynced: (n: number, when: string) => `${n} open positions · synced ${when}`,
    initialBalance: "Initial balance (anchors drawdown %)",
    profitCalc: "Profit calculation",
    weightedAverage: "Weighted average",
    confirmClear: (name: string) => `Clear ALL trades from "${name}"? The account stays.`,
    clear: "Clear trades",
    noOther: "No other account to transfer into.",
    transferPrompt: (list: string) =>
      `Transfer all data into which account?\n${list}\n\nEnter a number:`,
    transfer: "Transfer data",
  },
  id: {
    title: "Akun",
    syncSkipped: (inserted: number, skipped: number, reasons: string) =>
      `Sinkronisasi selesai dengan ${inserted} fill baru. ${skipped} data broker dilewati: ${reasons}`,
    syncFailed: "Sinkronisasi gagal",
    empty: "Belum ada akun — buat akun di halaman Import.",
    kinds: { sync: "sync", import: "import", manual: "manual" },
    syncNow: "Sinkronkan sekarang",
    archive: "Arsipkan",
    unarchive: "Batalkan arsip",
    delete: "Hapus akun",
    confirmDelete: (name: string) =>
      `Hapus "${name}" beserta SEMUA trade-nya? Tindakan ini tidak bisa dibatalkan.`,
    syncing: "Menyinkronkan…",
    syncingMetaTrader: " Menghubungkan ke MetaTrader bisa memakan waktu satu atau dua menit.",
    lastFailed: (reason: string) => `Sinkronisasi terakhir gagal: ${reason}`,
    equity: "Equity di broker:",
    positionsSynced: (n: number, when: string) => `${n} posisi terbuka · disinkronkan ${when}`,
    initialBalance: "Saldo awal (acuan % drawdown)",
    profitCalc: "Perhitungan profit",
    weightedAverage: "Rata-rata tertimbang",
    confirmClear: (name: string) => `Hapus SEMUA trade dari "${name}"? Akunnya tetap ada.`,
    clear: "Hapus trade",
    noOther: "Tidak ada akun lain untuk tujuan pemindahan.",
    transferPrompt: (list: string) =>
      `Pindahkan semua data ke akun mana?\n${list}\n\nMasukkan nomor:`,
    transfer: "Pindahkan data",
  },
});
