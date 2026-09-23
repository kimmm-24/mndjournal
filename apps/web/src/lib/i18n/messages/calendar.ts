import { defineMessages } from "../define";

/** P&L calendar grid, calendar page and its insights. */
export const calendar = defineMessages({
  en: {
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    weekdayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    week: "Week",
    weekTotal: "Week total",
    tradingDays: (n: number) => `${n} trading days`,
    green: (n: number) => `· ${n} green`,
    month: "Month:",
    multipleCurrencies: "Multiple currencies",
    pnlHidden: "P&L hidden",
    trades: (n: number) => `${n} trade${n === 1 ? "" : "s"}`,
    page: {
      title: "Calendar",
      previous: "Previous month",
      next: "Next month",
      tryAgain: "Try again",
      loading: "Loading calendar",
      loadingInsights: "Loading performance insights",
    },
    insights: {
      loadingChart: "Loading daily performance chart",
      title: "Performance insights",
      scope: (zone: string) =>
        `Visible month × active filters · Closed trades, after fees · ${zone}`,
      viewTrades: "View matching trades",
      emptyTitle: "No closed trades in this view",
      emptyBody:
        "Choose another month or adjust your account and filters. Open positions and days without trades aren’t included in performance insights.",
      mixed: (currencies: string) =>
        `These trades use ${currencies}. Select accounts with one currency to compare monetary performance; no exchange-rate conversion is applied.`,
      netPnl: "Net P&L",
      netPnlDetail: (days: number, currency: string | null) =>
        `${days} trading day${days === 1 ? "" : "s"}${currency ? ` · ${currency}` : ""}`,
      netPnlHint:
        "Sum of net P&L for closed trades in this month and filter selection. Includes fees. No currency conversion.",
      avgDaily: "Average daily P&L",
      avgDailyDetail: "Per day with closed trades",
      avgDailyHint:
        "Net P&L divided by trading days. Days without closed trades are excluded; break-even trading days are included.",
      winRate: "Trade win rate",
      winRateDetail: (w: number, l: number, be: number) =>
        `${w} wins · ${l} losses · ${be} break-even`,
      winRateHint:
        "Winning closed trades divided by all closed trades, including break-even trades. Uses your journal's configured break-even rule.",
      total: "Total closed trades",
      totalDetail: "Round-trip trades, not executions",
      totalHint:
        "Counts completed trades whose closing day falls in the visible month and selected date range, with all other filters applied.",
      bestWorst: "Best & worst day",
      best: "Best day",
      worst: "Worst day",
      oneDay: "One trading day; both extrema are the same.",
      extremes: "Highest and lowest daily net P&L.",
      avgGreenRed: "Average green & red day",
      profitableDays: (n: number) => `${n} profitable days`,
      losingDays: (n: number) => `${n} losing days`,
      ownGroup: "Each average uses only its own group.",
      consistency: "Day consistency",
      consistencyDetail: (pos: number, neg: number, flat: number) =>
        `${pos} positive · ${neg} negative · ${flat} flat days`,
      consistencyHint:
        "Share of trading days with strictly positive net P&L. This is a profitable-day rate, not a risk-adjusted score or a prediction. Flat days stay in the denominator.",
      daily: "Daily performance",
      dailyScope: (currency: string, average: boolean) =>
        `Net P&L by closing day · ${currency}${average ? " · Dashed line: 5-trading-day average" : ""}`,
      needMoreDays: "A trend needs more than one day",
      closedTrades: (n: number) => `${n} closed trades`,
      earlierMonth: "Explore an earlier month with more trading history.",
      dailyValues: (n: number) => `Daily values & trade links (${n})`,
      dailyCaption: "Daily results for the current month and filters",
      closingDay: "Closing day",
      tradesColumn: "Trades",
      netColumn: "Net P&L",
      byWeekday: "Performance by weekday",
      byWeekdayScope: (currency: string) => `Closing-day net P&L · ${currency} · Select a row`,
      mostProfitable: "Most profitable weekday",
      noProfitable: "No profitable weekday yet",
      weekdayHint: (days: number, trades: number, pnl: string) =>
        `${days} trading days · ${trades} closed trades · ${pnl}`,
      weekdayLabel: (day: string, trades: number, pnl: string | null) =>
        `${day}: ${trades} trades${pnl ? `, ${pnl}` : ""}. Inspect closing days.`,
      selectedDays: (day: string, trades: number, days: number) =>
        `${day} · ${trades} trades across ${days} days`,
      tradesSuffix: (n: number) => `· ${n} trades`,
      smallSample: (n: number) =>
        `Small sample: ${n} trading day${n === 1 ? "" : "s"}. Weekday results and consistency describe this selection only.`,
    },
  },
  id: {
    weekdays: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
    weekdayNames: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    week: "Minggu",
    weekTotal: "Total minggu",
    tradingDays: (n: number) => `${n} hari trading`,
    green: (n: number) => `· ${n} hari profit`,
    month: "Bulan:",
    multipleCurrencies: "Beberapa mata uang",
    pnlHidden: "P&L disembunyikan",
    trades: (n: number) => `${n} trade`,
    page: {
      title: "Kalender",
      previous: "Bulan sebelumnya",
      next: "Bulan berikutnya",
      tryAgain: "Coba lagi",
      loading: "Memuat kalender",
      loadingInsights: "Memuat insight performa",
    },
    insights: {
      loadingChart: "Memuat grafik performa harian",
      title: "Insight performa",
      scope: (zone: string) =>
        `Bulan yang ditampilkan × filter aktif · Trade yang ditutup, setelah fee · ${zone}`,
      viewTrades: "Lihat trade yang cocok",
      emptyTitle: "Tidak ada trade yang ditutup di tampilan ini",
      emptyBody:
        "Pilih bulan lain atau ubah akun dan filter Anda. Posisi terbuka dan hari tanpa trade tidak termasuk dalam insight performa.",
      mixed: (currencies: string) =>
        `Trade ini memakai ${currencies}. Pilih akun dengan satu mata uang untuk membandingkan performa nominal; tidak ada konversi kurs yang diterapkan.`,
      netPnl: "Net P&L",
      netPnlDetail: (days: number, currency: string | null) =>
        `${days} hari trading${currency ? ` · ${currency}` : ""}`,
      netPnlHint:
        "Jumlah net P&L trade yang ditutup pada bulan dan filter ini. Termasuk fee. Tanpa konversi mata uang.",
      avgDaily: "Rata-rata P&L harian",
      avgDailyDetail: "Per hari dengan trade yang ditutup",
      avgDailyHint:
        "Net P&L dibagi jumlah hari trading. Hari tanpa trade yang ditutup tidak dihitung; hari trading breakeven tetap dihitung.",
      winRate: "Win rate trade",
      winRateDetail: (w: number, l: number, be: number) => `${w} win · ${l} loss · ${be} breakeven`,
      winRateHint:
        "Trade profit dibagi semua trade yang ditutup, termasuk breakeven. Memakai aturan breakeven yang Anda atur di jurnal.",
      total: "Total trade ditutup",
      totalDetail: "Trade round-trip, bukan eksekusi",
      totalHint:
        "Menghitung trade selesai yang hari penutupannya ada di bulan dan rentang tanggal yang dipilih, dengan semua filter lain diterapkan.",
      bestWorst: "Hari terbaik & terburuk",
      best: "Hari terbaik",
      worst: "Hari terburuk",
      oneDay: "Hanya satu hari trading; hari terbaik dan terburuk sama.",
      extremes: "Net P&L harian tertinggi dan terendah.",
      avgGreenRed: "Rata-rata hari profit & loss",
      profitableDays: (n: number) => `${n} hari profit`,
      losingDays: (n: number) => `${n} hari loss`,
      ownGroup: "Setiap rata-rata hanya memakai kelompoknya sendiri.",
      consistency: "Konsistensi harian",
      consistencyDetail: (pos: number, neg: number, flat: number) =>
        `${pos} positif · ${neg} negatif · ${flat} hari flat`,
      consistencyHint:
        "Persentase hari trading dengan net P&L positif. Ini adalah rasio hari profit, bukan skor yang disesuaikan risiko atau prediksi. Hari flat tetap dihitung sebagai pembagi.",
      daily: "Performa harian",
      dailyScope: (currency: string, average: boolean) =>
        `Net P&L per hari penutupan · ${currency}${average ? " · Garis putus-putus: rata-rata 5 hari trading" : ""}`,
      needMoreDays: "Tren memerlukan lebih dari satu hari",
      closedTrades: (n: number) => `${n} trade ditutup`,
      earlierMonth: "Lihat bulan sebelumnya dengan riwayat trading yang lebih banyak.",
      dailyValues: (n: number) => `Nilai harian & link trade (${n})`,
      dailyCaption: "Hasil harian untuk bulan dan filter saat ini",
      closingDay: "Hari penutupan",
      tradesColumn: "Trades",
      netColumn: "Net P&L",
      byWeekday: "Performa per hari",
      byWeekdayScope: (currency: string) =>
        `Net P&L per hari penutupan · ${currency} · Pilih satu baris`,
      mostProfitable: "Hari paling profit",
      noProfitable: "Belum ada hari yang profit",
      weekdayHint: (days: number, trades: number, pnl: string) =>
        `${days} hari trading · ${trades} trade ditutup · ${pnl}`,
      weekdayLabel: (day: string, trades: number, pnl: string | null) =>
        `${day}: ${trades} trade${pnl ? `, ${pnl}` : ""}. Lihat hari penutupan.`,
      selectedDays: (day: string, trades: number, days: number) =>
        `${day} · ${trades} trade dalam ${days} hari`,
      tradesSuffix: (n: number) => `· ${n} trade`,
      smallSample: (n: number) =>
        `Sampel kecil: ${n} hari trading. Hasil per hari dan konsistensi hanya menggambarkan pilihan ini.`,
    },
  },
});
