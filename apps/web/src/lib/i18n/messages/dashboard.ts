import { defineMessages } from "../define";

/** Dashboard page and its widgets. */
export const dashboard = defineMessages({
  en: {
    title: "Dashboard",
    loadFailed: "Could not load the dashboard.",
    tryAgain: "Try again",
    noMatch: "No trades match these filters. Clear or adjust Filters to see more results.",
    about: (title: string) => `About ${title}`,
    netPnl: {
      label: "Net P&L",
      hint: "Realized profit and loss net of fees, over the selected range.",
      vsPrior: "vs prior 7d",
      closedTrades: (n: number) => `${n} closed trades`,
      feesBefore: "",
      feesAfter: " fees",
    },
    tradeWin: {
      label: "Trade win %",
      hint: "Winning trades divided by all closed trades, including breakevens.",
      gauge: "Trade win rate",
    },
    profitFactor: {
      label: "Profit factor",
      hint: "Gross profit ÷ gross loss. Above 1 means the wins outweigh the losses.",
      sub: "gross profit ÷ gross loss",
    },
    dayWin: {
      label: "Day win %",
      hint: "Green trading days ÷ all trading days in the selected range.",
      gauge: "Day win rate",
      days: (n: number) => `${n} days`,
    },
    avgWinLoss: {
      label: "Avg win / loss",
      hint: "Average winning trade ÷ average losing trade. The bar shows the two to scale.",
      bar: "Average win vs average loss, to scale",
      avgWin: " avg win · ",
      avgLoss: " avg loss",
    },
    edge: {
      label: "Edge Score",
      help: "A 0–100 score combining win rate, profit factor, average win/loss, drawdown, recovery, and consistency. Requires at least five closed trades.",
      needs: "Needs 5+ closed trades.",
    },
    cumulative: {
      label: "Cumulative P&L",
      title: "Daily net cumulative P&L",
      help: "Running total of net profit and loss over the selected period. The drawdown bars below show declines from the running equity peak.",
    },
    daily: {
      label: "Daily P&L",
      title: "Net daily P&L",
      help: "Net profit or loss for each trading day. Bars above zero are profitable; bars below zero are losses.",
    },
    calendar: { label: "Calendar", full: "Full calendar" },
    activity: {
      label: "Activity",
      recent: "Recent trades",
      open: "Open positions",
      noClosed: "No closed trades yet",
      flat: "Flat — no open positions",
    },
    maxDrawdown: {
      label: "Max drawdown",
      hint: "Largest peak-to-trough drop of the cumulative P&L curve.",
      setBalance: "set an initial balance for %",
      recovery: (x: string) => ` · recovery ${x}x`,
    },
    streaks: {
      label: "Streaks",
      hint: "Current run of consecutive wins (W) or losses (L), with the best and worst runs.",
      bestWorst: (best: number, worst: number) => `best ${best}W · worst ${worst}L`,
    },
    expectancy: {
      label: "Expectancy / trade",
      hint: "Average net P&L per closed trade: what one more trade is worth on your numbers.",
      avgR: (r: string, n: number) => `avg ${r}R over ${n} risk-tagged trades`,
      tagStops: "tag stop-losses to unlock R multiples",
    },
    avgDuration: {
      label: "Avg duration",
      hint: "Average time from first entry fill to final exit.",
      sub: "winners vs losers in Reports",
    },
    bestWorstDay: {
      label: "Best / worst day",
      hint: "Highest and lowest single-day net P&L in the selected range.",
    },
    timePerformance: {
      label: "Trade time performance",
      help: "Trades grouped by their opening hour. The upper chart shows net P&L; the lower chart shows trade count.",
    },
    empty: {
      title: "Your journal is empty",
      body: "Connect a broker for automatic sync, upload a statement from 10+ platforms (including your TradeZella export), or add trades manually.",
      import: "Import your first trades",
      loadDemo: "Load demo data",
      loading: "Loading…",
      demoNote: "Demo data lands in its own account; delete it anytime under Accounts.",
    },
  },
  id: {
    title: "Dashboard",
    loadFailed: "Gagal memuat dashboard.",
    tryAgain: "Coba lagi",
    noMatch:
      "Tidak ada trade yang cocok dengan filter ini. Hapus atau ubah Filter untuk melihat hasil lain.",
    about: (title: string) => `Tentang ${title}`,
    netPnl: {
      label: "Net P&L",
      hint: "Profit dan loss yang sudah terealisasi setelah fee, dalam rentang yang dipilih.",
      vsPrior: "vs 7 hari sebelumnya",
      closedTrades: (n: number) => `${n} trade ditutup`,
      feesBefore: "fee ",
      feesAfter: "",
    },
    tradeWin: {
      label: "Trade win %",
      hint: "Trade yang profit dibagi semua trade yang sudah ditutup, termasuk breakeven.",
      gauge: "Win rate trade",
    },
    profitFactor: {
      label: "Profit factor",
      hint: "Gross profit ÷ gross loss. Di atas 1 berarti total profit lebih besar dari total loss.",
      sub: "gross profit ÷ gross loss",
    },
    dayWin: {
      label: "Day win %",
      hint: "Hari trading yang profit ÷ semua hari trading dalam rentang yang dipilih.",
      gauge: "Win rate harian",
      days: (n: number) => `${n} hari`,
    },
    avgWinLoss: {
      label: "Rata-rata win / loss",
      hint: "Rata-rata trade profit ÷ rata-rata trade loss. Bar menunjukkan perbandingan keduanya.",
      bar: "Rata-rata win dibanding rata-rata loss, sesuai skala",
      avgWin: " rata-rata win · ",
      avgLoss: " rata-rata loss",
    },
    edge: {
      label: "Edge Score",
      help: "Skor 0–100 yang menggabungkan win rate, profit factor, rata-rata win/loss, drawdown, recovery, dan konsistensi. Memerlukan minimal lima trade yang sudah ditutup.",
      needs: "Perlu 5+ trade yang sudah ditutup.",
    },
    cumulative: {
      label: "P&L kumulatif",
      title: "Net P&L kumulatif harian",
      help: "Total berjalan dari net profit dan loss selama periode yang dipilih. Bar drawdown di bawahnya menunjukkan penurunan dari puncak equity.",
    },
    daily: {
      label: "P&L harian",
      title: "Net P&L harian",
      help: "Net profit atau loss untuk setiap hari trading. Bar di atas nol berarti profit; di bawah nol berarti loss.",
    },
    calendar: { label: "Kalender", full: "Kalender lengkap" },
    activity: {
      label: "Aktivitas",
      recent: "Trade terbaru",
      open: "Posisi terbuka",
      noClosed: "Belum ada trade yang ditutup",
      flat: "Flat — tidak ada posisi terbuka",
    },
    maxDrawdown: {
      label: "Max drawdown",
      hint: "Penurunan terbesar dari puncak ke titik terendah pada kurva P&L kumulatif.",
      setBalance: "isi saldo awal untuk melihat %",
      recovery: (x: string) => ` · recovery ${x}x`,
    },
    streaks: {
      label: "Streak",
      hint: "Rentetan win (W) atau loss (L) berturut-turut saat ini, beserta rentetan terbaik dan terburuk.",
      bestWorst: (best: number, worst: number) => `terbaik ${best}W · terburuk ${worst}L`,
    },
    expectancy: {
      label: "Expectancy / trade",
      hint: "Rata-rata net P&L per trade yang ditutup: nilai satu trade berikutnya berdasarkan data Anda.",
      avgR: (r: string, n: number) => `rata-rata ${r}R dari ${n} trade dengan stop loss`,
      tagStops: "isi stop loss untuk melihat R multiple",
    },
    avgDuration: {
      label: "Rata-rata durasi",
      hint: "Rata-rata waktu dari fill entry pertama sampai exit terakhir.",
      sub: "bandingkan win vs loss di Laporan",
    },
    bestWorstDay: {
      label: "Hari terbaik / terburuk",
      hint: "Net P&L harian tertinggi dan terendah dalam rentang yang dipilih.",
    },
    timePerformance: {
      label: "Performa per jam trading",
      help: "Trade dikelompokkan berdasarkan jam pembukaannya. Grafik atas menunjukkan net P&L; grafik bawah menunjukkan jumlah trade.",
    },
    empty: {
      title: "Jurnal Anda masih kosong",
      body: "Hubungkan broker untuk sinkronisasi otomatis, upload statement dari 10+ platform (termasuk ekspor TradeZella Anda), atau tambahkan trade secara manual.",
      import: "Import trade pertama Anda",
      loadDemo: "Muat data demo",
      loading: "Memuat…",
      demoNote: "Data demo masuk ke akun terpisah; hapus kapan saja di menu Akun.",
    },
  },
});
