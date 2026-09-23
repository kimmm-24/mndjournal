import { defineMessages } from "../define";

/** Reports page: overview, trends, explorer, breakdowns, cross-analysis, comparison. */
export const reports = defineMessages({
  en: {
    title: "Reports",
    loadingExplorer: "Loading trade explorer…",
    loadingTrends: "Loading performance trends…",
    modes: {
      overview: "Overview",
      trends: "Performance trends",
      explorer: "Trade explorer",
      breakdown: "Breakdowns",
      cross: "Cross-analysis",
      compare: "Compare groups",
    },
    /** Names of the breakdown dimensions (keys from the core package's DIMENSIONS). */
    dimensions: {
      symbol: "Symbol",
      playbook: "Strategy",
      tag: "Tag",
      mistake: "Mistake",
      direction: "Direction",
      assetClass: "Asset class",
      weekday: "Weekday",
      month: "Month",
      entryHour: "Entry hour",
      exitHour: "Exit hour",
      entry15: "Entry · 15 minutes",
      exit15: "Exit · 15 minutes",
      duration: "Holding time",
      quantity: "Position size",
      entryPrice: "Entry price",
      exitPrice: "Exit price",
      realizedR: "Realized R",
      plannedR: "Planned R",
      outcome: "Outcome",
    },
    /** Bucket names the server sends as data; anything not listed is shown as-is. */
    buckets: {
      Untagged: "Untagged",
      None: "None",
      Unassigned: "Unassigned",
      Unspecified: "Unspecified",
      Open: "Open",
      Sun: "Sun",
      Mon: "Mon",
      Tue: "Tue",
      Wed: "Wed",
      Thu: "Thu",
      Fri: "Fri",
      Sat: "Sat",
    } as Record<string, string>,
    summary: {
      closedTrades: "Closed trades",
      netPnl: "Net P&L",
      winRate: "Win rate",
      profitFactor: "Profit factor",
      volume: "Entry volume",
      holding: "Avg holding time",
      plannedR: "Avg planned R",
      realizedR: "Avg realized R",
    },
    groupBy: "Group by",
    thenBy: "Then by",
    tradesWin: (trades: number, win: string) => `${trades} trades · Win rate ${win}`,
    noTrades: "No trades",
    cellNote: (currency: string | null) =>
      `Cell values are net P&L in ${currency ?? "account currency"}.`,
    columns: {
      trades: "Trades",
      win: "Win %",
      netPnl: "Net P&L",
      volume: "Entry volume",
      plannedR: "Avg planned R",
      realizedR: "Avg realized R",
      duration: "Avg duration",
    },
    noMatch: "No closed trades match these filters.",
    loadingReport: "Loading report…",
    mixed: (currencies: string) =>
      `These accounts use different currencies (${currencies}). Select accounts with the same currency in Filters to compare monetary results.`,
    crossTitle: (a: string, b: string) => `${a} × ${b}`,
    byTitle: (dimension: string) => `Performance by ${dimension.toLowerCase()}`,
    footnote: (zone: string | null) =>
      `Closed trades only. Dates use the closing day; weekday and entry time use the opening time in ${zone ?? "your journal timezone"}. Volume is total entry quantity. R uses weighted entry and total entry quantity; missing or invalid risk inputs are excluded from R averages. Derivatives require a configured multiplier for realized R. Multiple tags or mistakes can place a trade in more than one group, so those group totals can overlap.`,
    export: {
      byTitle: (a: string, b: string) => `${a} by ${b}`,
      performance: (dimension: string) => `${dimension} performance`,
      accountCurrency: "Account currency",
      filters: (text: string) => `Filters: ${text}`,
      totals: (trades: number, net: string, win: string) =>
        `Closed trades: ${trades} | Net P&L: ${net} | Win rate: ${win}`,
      row: (
        label: string,
        trades: number,
        pnl: string,
        win: string,
        planned: string,
        realized: string,
        volume: string,
        holding: string,
      ) =>
        `${label}: ${trades} trades | P&L ${pnl} | Win ${win} | Planned ${planned}R | Realized ${realized}R | Volume ${volume} | Holding time ${holding}`,
    },
    compare: {
      longTrades: "Long trades",
      shortTrades: "Short trades",
      intro:
        "Each group has its own filters. Compare strategies, accounts, periods, or trade characteristics. Groups may overlap.",
      mixed:
        "Select accounts with the same currency in both groups. Currency conversion is not applied.",
      groupName: (key: string) => `Group ${key} name`,
      editFilters: "Edit filters",
      loading: "Loading…",
      difference: (b: string, a: string) => `${b} minus ${a}:`,
      netPnlTrades: (trades: string) => ` net P&L · ${trades} trades`,
      exportTitle: (a: string, b: string) => `${a} vs ${b}`,
      groupFilters: (key: string, text: string) => `Group ${key}: ${text}`,
      tradesLine: (trades: number, pnl: string, currency: string) =>
        `Trades: ${trades} | P&L: ${pnl} ${currency}`,
      rateLine: (win: string, planned: string, realized: string) =>
        `Win rate: ${win} | Planned R: ${planned} | Realized R: ${realized}`,
      dialog: (key: string) => `Group ${key} filters`,
      clear: "Clear",
      apply: "Apply to group",
    },
    overview: {
      mixed: (currencies: string) =>
        `These accounts use different currencies (${currencies}). Select accounts with the same currency in Filters to compare monetary results.`,
      title: "Trading overview",
      scope: (zone: string, currency: string) => `Trading overview · ${zone} · ${currency}`,
      hourSection: "Trade time performance (opening hour)",
      hourLine: (hour: string, trades: number, pnl: string) =>
        `${hour}:00: ${trades} trades | Net P&L ${pnl}`,
      bucketLine: (label: string, trades: number, win: string, pnl: string) =>
        `${label}: ${trades} trades | Win ${win} | Net P&L ${pnl}`,
      timePerformance: "Trade time performance",
      sections: {
        symbol: { title: "By symbol", column: "Symbol" },
        direction: { title: "Long vs short", column: "Direction" },
        weekday: { title: "By weekday", column: "Weekday" },
        duration: { title: "By holding time", column: "Holding time" },
        tag: { title: "By tag", column: "Tag" },
        mistake: { title: "By mistake", column: "Mistake" },
        playbook: { title: "By playbook", column: "Playbook" },
      },
      annotate: "Annotate trades to unlock this breakdown.",
      noData: "No data yet.",
      footnote:
        "Weekday and hour use trade opening times. Overview trade counts include open positions; win rates use closed trades. Holding time requires a closed trade. Tags and mistakes can overlap. By symbol shows the top 20 by net P&L; Breakdowns includes every symbol and additional metrics for closed trades.",
    },
    trends: {
      loadingChart: "Loading trend chart",
      loading: "Loading performance trends",
      failed: "Unable to load performance trends.",
      tryAgain: "Try again",
      title: "Performance trends",
      scope: (count: number, zone: string, currency: string | null) =>
        `${count} closed trades · Active account and filters · Closing order · ${zone}${currency ? ` · ${currency}` : ""}`,
      emptyTitle: "No closed trades in this selection",
      emptyBody:
        "Change the date range or filters to explore your trading history. Open positions are excluded.",
      mixed: (currencies: string) =>
        `These trades use different currencies (${currencies}). Win rate is available; select accounts with one currency to compare P&L and largest trades. No currency conversion is applied.`,
      winTrend: "Win-rate trend",
      pnlTrend: "Average trade P&L trend",
      last20: (rate: boolean) =>
        `Last 20 closed trades at each point${rate ? " · Breakevens included" : " · After fees"}`,
      latest: "Latest full window",
      selectedPeriod: (rate: boolean) => `Selected-period ${rate ? "win rate" : "average"}`,
      sequence: (rate: boolean) =>
        `Closed-trade sequence · Dashed line: selected-period ${rate ? "win rate" : "average"}`,
      moreNeeded: (n: number) =>
        `${n} more closed ${n === 1 ? "trade is" : "trades are"} needed for the first full 20-trade window.`,
      latestOnly:
        "Latest window available. A line chart appears at 27 closed trades, when there are 8 full windows to compare.",
      largest: "Largest winning and losing trade",
      largestNote:
        "Individual closed trades, after fees—not daily totals. Uses your journal’s win/loss classification.",
      largestWinner: "Largest winner",
      largestLoser: "Largest loser",
      noWinning: "No winning trades in this selection.",
      noLosing: "No losing trades in this selection.",
      explore: "Explore window values and trades",
      caption: (zone: string) =>
        `Each row covers 20 trades ending at the linked trade. Dates use ${zone}.`,
      window: "Window / closing trade",
      winRate: "Win rate",
      avgNet: "Avg net P&L",
      footnote:
        "Only trades within your selection are used; earlier trades are not borrowed to fill a window. Rolling windows overlap and describe recent results—not a forecast. Small samples can change sharply.",
    },
    explorer: {
      loadingScatter: "Loading scatter plot",
      loading: "Loading trade explorer",
      failed: "Unable to load trade explorer.",
      tryAgain: "Try again",
      duration: "Duration (minutes)",
      entryTime: (zone: string) => `Entry time (${zone})`,
      estimated: (what: string, currency: string) => `Estimated ${what} (${currency})`,
      netPnl: (currency: string) => `Net P&L (${currency})`,
      realizedR: "Realized R",
      minutes: (n: string) => `${n} min`,
      caption: (n: number) =>
        `All ${n} comparable trades, newest close first. Each link opens the original trade.`,
      tradeClosed: "Trade / closed",
      previous: "Previous",
      next: "Next",
      page: (page: number, pages: number) => `Page ${page} of ${pages}`,
      title: "Trade explorer",
      scope: (zone: string) =>
        `Compare individual trades, not group averages · Active account and filters · ${zone}`,
      presets: "Scatter plot presets",
      presetLabels: {
        holding: "Holding time",
        maePnl: "MAE vs net P&L",
        mfePnl: "MFE vs net P&L",
        maeMfe: "MAE vs MFE",
      },
      versus: (x: string, y: string) => `${x} vs ${y}`,
      outcomesBy: (holding: boolean) =>
        `Trade outcomes by ${holding ? "holding time" : "entry time"}`,
      closedTrades: (n: number) => `${n} closed trades`,
      comparable: (shown: number, total: number) => `${shown} of ${total} closed trades comparable`,
      onePoint: " · One point per trade · ",
      grossNote: "Gross excursion estimates; net P&L after fees",
      afterFees: "After fees",
      xAxis: "X axis",
      yAxis: "Y axis",
      options: {
        duration: "Duration (minutes)",
        entryTime: "Entry time",
        mae: "Estimated MAE",
        mfe: "Estimated MFE",
        netPnl: "Net P&L",
        realizedR: "Realized R",
      },
      emptyTitle: "No closed trades in this selection",
      emptyBody:
        "Change the date range or filters to explore your history. Open positions are excluded.",
      mixed: (currencies: string) =>
        `These trades use different currencies (${currencies}). Select accounts with one currency for monetary axes, or use Duration and Realized R to compare risk-normalized outcomes. No currency conversion is applied.`,
      excluded: (n: number) => `${n} trades excluded: `,
      needsStop:
        "realized R requires a valid planned stop-loss and any required contract multiplier; ",
      needsEstimates: "MAE/MFE require saved, current market-data estimates. ",
      bothAxes: "Both axes require valid values and timestamps.",
      rExplained:
        "R = net P&L ÷ planned risk from your stop-loss. Uses weighted entry and total entry quantity; it does not measure maximum intratrade risk.",
      positive: "Positive net P&L",
      negative: "Negative net P&L",
      zero: "Zero net P&L",
      selectHint:
        "Select a point to inspect its trade. Overlapping points remain individually accessible in the table.",
      closed: (date: string) => `Closed ${date}`,
      openTrade: "Open trade ↗",
      dismiss: "Dismiss",
      noData:
        "No trades have the data required for these axes. Try another axis or adjust your filters.",
      fewer:
        "Fewer than 8 comparable trades. Review the exact values below, or widen your filters to reveal a useful scatter plot.",
      smallSample:
        "Small sample: treat apparent patterns cautiously until more trades are available.",
      comparableTrades: "Comparable trades",
      exploreAll: (n: number) => `Explore all ${n} trades`,
      footnote:
        "Duration is elapsed time from first entry to final exit, including overnight hours. Entry time uses the journal timezone; midnight neighbors appear at opposite ends of that axis. Patterns describe this selection, not causation or a recommended holding time.",
    },
    estimates: {
      calculating: (n: number, total: number, symbol: string) =>
        `Calculating ${n} of ${total} · ${symbol}`,
      historyFailed: "History request failed.",
      unavailable: "Estimate unavailable.",
      done: (stopped: boolean, saved: number, failed: number, skipped: number) =>
        `${stopped ? "Stopped. " : ""}${saved} estimates saved · ${failed} unavailable · ${skipped} not processed.`,
      title: "MAE & MFE estimates",
      intro: (saved: number, total: number) =>
        `${saved} of ${total} closed trades have saved estimates. Estimated gross excursions exclude fees; MAE is shown as a positive adverse amount. Missing values are excluded from plots, never counted as zero.`,
      calculateMissing: "Calculate missing estimates",
      help: (resolution: string) =>
        `Loads ${resolution} candles for this selection using each trade’s recorded symbol. This uses your provider allowance and may take several minutes. For custom symbols or a specific CSV dataset, load and save estimates from the individual trade.`,
      provider: "Estimate data provider",
      chooseSource: "Choose a data source",
      resolution: "Estimate candle resolution",
      dataset: "Estimate dataset",
      confirm: (currencies: string) =>
        `I confirm these symbols, price adjustments and quote currencies match the fills and account currency (${currencies || "none"}).`,
      oneCurrency: "Select accounts with one currency to calculate estimates together.",
      calculate: (n: number) => `Calculate ${n} missing estimates`,
      connect: "Connect a market data provider in Settings",
      stop: "Stop calculation",
    },
  },
  id: {
    title: "Laporan",
    loadingExplorer: "Memuat trade explorer…",
    loadingTrends: "Memuat tren performa…",
    modes: {
      overview: "Ringkasan",
      trends: "Tren performa",
      explorer: "Trade explorer",
      breakdown: "Breakdown",
      cross: "Analisis silang",
      compare: "Bandingkan grup",
    },
    dimensions: {
      symbol: "Simbol",
      playbook: "Strategi",
      tag: "Tag",
      mistake: "Mistake",
      direction: "Arah",
      assetClass: "Kelas aset",
      weekday: "Hari",
      month: "Bulan",
      entryHour: "Jam entry",
      exitHour: "Jam exit",
      entry15: "Entry · 15 menit",
      exit15: "Exit · 15 menit",
      duration: "Durasi hold",
      quantity: "Ukuran posisi",
      entryPrice: "Harga entry",
      exitPrice: "Harga exit",
      realizedR: "Realized R",
      plannedR: "Planned R",
      outcome: "Hasil",
    },
    buckets: {
      Untagged: "Tanpa tag",
      None: "Tidak ada",
      Unassigned: "Tanpa playbook",
      Unspecified: "Tidak diisi",
      Open: "Terbuka",
      Sun: "Min",
      Mon: "Sen",
      Tue: "Sel",
      Wed: "Rab",
      Thu: "Kam",
      Fri: "Jum",
      Sat: "Sab",
    },
    summary: {
      closedTrades: "Trade ditutup",
      netPnl: "Net P&L",
      winRate: "Win rate",
      profitFactor: "Profit factor",
      volume: "Volume entry",
      holding: "Rata-rata durasi hold",
      plannedR: "Rata-rata planned R",
      realizedR: "Rata-rata realized R",
    },
    groupBy: "Kelompokkan berdasarkan",
    thenBy: "Lalu berdasarkan",
    tradesWin: (trades: number, win: string) => `${trades} trade · Win rate ${win}`,
    noTrades: "Tidak ada trade",
    cellNote: (currency: string | null) =>
      `Nilai sel adalah net P&L dalam ${currency ?? "mata uang akun"}.`,
    columns: {
      trades: "Trades",
      win: "Win %",
      netPnl: "Net P&L",
      volume: "Volume entry",
      plannedR: "Rata-rata planned R",
      realizedR: "Rata-rata realized R",
      duration: "Rata-rata durasi",
    },
    noMatch: "Tidak ada trade yang ditutup yang cocok dengan filter ini.",
    loadingReport: "Memuat laporan…",
    mixed: (currencies: string) =>
      `Akun ini memakai mata uang berbeda (${currencies}). Pilih akun dengan mata uang yang sama di Filter untuk membandingkan hasil nominal.`,
    crossTitle: (a: string, b: string) => `${a} × ${b}`,
    byTitle: (dimension: string) => `Performa per ${dimension.toLowerCase()}`,
    footnote: (zone: string | null) =>
      `Hanya trade yang sudah ditutup. Tanggal memakai hari penutupan; hari dan jam entry memakai waktu pembukaan dalam ${zone ?? "zona waktu jurnal Anda"}. Volume adalah total kuantitas entry. R memakai rata-rata harga entry dan total kuantitas entry; data risiko yang kosong atau tidak valid tidak dihitung dalam rata-rata R. Derivatif memerlukan multiplier yang diatur untuk realized R. Beberapa tag atau mistake bisa memasukkan satu trade ke lebih dari satu grup, jadi total grup bisa tumpang tindih.`,
    export: {
      byTitle: (a: string, b: string) => `${a} per ${b}`,
      performance: (dimension: string) => `Performa ${dimension}`,
      accountCurrency: "Mata uang akun",
      filters: (text: string) => `Filter: ${text}`,
      totals: (trades: number, net: string, win: string) =>
        `Trade ditutup: ${trades} | Net P&L: ${net} | Win rate: ${win}`,
      row: (
        label: string,
        trades: number,
        pnl: string,
        win: string,
        planned: string,
        realized: string,
        volume: string,
        holding: string,
      ) =>
        `${label}: ${trades} trade | P&L ${pnl} | Win ${win} | Planned ${planned}R | Realized ${realized}R | Volume ${volume} | Durasi hold ${holding}`,
    },
    compare: {
      longTrades: "Trade long",
      shortTrades: "Trade short",
      intro:
        "Setiap grup punya filternya sendiri. Bandingkan strategi, akun, periode, atau karakteristik trade. Grup bisa tumpang tindih.",
      mixed:
        "Pilih akun dengan mata uang yang sama di kedua grup. Tidak ada konversi mata uang yang diterapkan.",
      groupName: (key: string) => `Nama grup ${key}`,
      editFilters: "Ubah filter",
      loading: "Memuat…",
      difference: (b: string, a: string) => `${b} dikurangi ${a}:`,
      netPnlTrades: (trades: string) => ` net P&L · ${trades} trade`,
      exportTitle: (a: string, b: string) => `${a} vs ${b}`,
      groupFilters: (key: string, text: string) => `Grup ${key}: ${text}`,
      tradesLine: (trades: number, pnl: string, currency: string) =>
        `Trades: ${trades} | P&L: ${pnl} ${currency}`,
      rateLine: (win: string, planned: string, realized: string) =>
        `Win rate: ${win} | Planned R: ${planned} | Realized R: ${realized}`,
      dialog: (key: string) => `Filter grup ${key}`,
      clear: "Hapus",
      apply: "Terapkan ke grup",
    },
    overview: {
      mixed: (currencies: string) =>
        `Akun ini memakai mata uang berbeda (${currencies}). Pilih akun dengan mata uang yang sama di Filter untuk membandingkan hasil nominal.`,
      title: "Ringkasan trading",
      scope: (zone: string, currency: string) => `Ringkasan trading · ${zone} · ${currency}`,
      hourSection: "Performa per jam (jam pembukaan)",
      hourLine: (hour: string, trades: number, pnl: string) =>
        `${hour}:00: ${trades} trade | Net P&L ${pnl}`,
      bucketLine: (label: string, trades: number, win: string, pnl: string) =>
        `${label}: ${trades} trade | Win ${win} | Net P&L ${pnl}`,
      timePerformance: "Performa per jam trading",
      sections: {
        symbol: { title: "Per simbol", column: "Simbol" },
        direction: { title: "Long vs short", column: "Arah" },
        weekday: { title: "Per hari", column: "Hari" },
        duration: { title: "Per durasi hold", column: "Durasi hold" },
        tag: { title: "Per tag", column: "Tag" },
        mistake: { title: "Per mistake", column: "Mistake" },
        playbook: { title: "Per playbook", column: "Playbook" },
      },
      annotate: "Beri anotasi pada trade untuk membuka breakdown ini.",
      noData: "Belum ada data.",
      footnote:
        "Hari dan jam memakai waktu pembukaan trade. Jumlah trade di ringkasan termasuk posisi terbuka; win rate memakai trade yang sudah ditutup. Durasi hold memerlukan trade yang sudah ditutup. Tag dan mistake bisa tumpang tindih. Per simbol menampilkan 20 teratas berdasarkan net P&L; Breakdown mencakup semua simbol dan metrik tambahan untuk trade yang ditutup.",
    },
    trends: {
      loadingChart: "Memuat grafik tren",
      loading: "Memuat tren performa",
      failed: "Gagal memuat tren performa.",
      tryAgain: "Coba lagi",
      title: "Tren performa",
      scope: (count: number, zone: string, currency: string | null) =>
        `${count} trade ditutup · Akun dan filter aktif · Urutan penutupan · ${zone}${currency ? ` · ${currency}` : ""}`,
      emptyTitle: "Tidak ada trade yang ditutup di pilihan ini",
      emptyBody:
        "Ubah rentang tanggal atau filter untuk melihat riwayat trading Anda. Posisi terbuka tidak dihitung.",
      mixed: (currencies: string) =>
        `Trade ini memakai mata uang berbeda (${currencies}). Win rate tetap tersedia; pilih akun dengan satu mata uang untuk membandingkan P&L dan trade terbesar. Tidak ada konversi mata uang yang diterapkan.`,
      winTrend: "Tren win rate",
      pnlTrend: "Tren rata-rata P&L per trade",
      last20: (rate: boolean) =>
        `20 trade terakhir yang ditutup di setiap titik${rate ? " · Termasuk breakeven" : " · Setelah fee"}`,
      latest: "Window penuh terakhir",
      selectedPeriod: (rate: boolean) => `${rate ? "Win rate" : "Rata-rata"} periode yang dipilih`,
      sequence: (rate: boolean) =>
        `Urutan trade yang ditutup · Garis putus-putus: ${rate ? "win rate" : "rata-rata"} periode yang dipilih`,
      moreNeeded: (n: number) =>
        `Perlu ${n} trade ditutup lagi untuk window penuh 20 trade pertama.`,
      latestOnly:
        "Window terakhir tersedia. Grafik garis muncul setelah 27 trade ditutup, saat ada 8 window penuh untuk dibandingkan.",
      largest: "Trade profit dan loss terbesar",
      largestNote:
        "Trade individual yang ditutup, setelah fee—bukan total harian. Memakai klasifikasi win/loss jurnal Anda.",
      largestWinner: "Win terbesar",
      largestLoser: "Loss terbesar",
      noWinning: "Tidak ada trade profit di pilihan ini.",
      noLosing: "Tidak ada trade loss di pilihan ini.",
      explore: "Lihat nilai window dan trade",
      caption: (zone: string) =>
        `Setiap baris mencakup 20 trade yang berakhir di trade yang ditautkan. Tanggal memakai ${zone}.`,
      window: "Window / trade penutup",
      winRate: "Win rate",
      avgNet: "Rata-rata net P&L",
      footnote:
        "Hanya trade dalam pilihan Anda yang dipakai; trade sebelumnya tidak dipinjam untuk mengisi window. Window bergulir saling tumpang tindih dan menggambarkan hasil terkini—bukan prediksi. Sampel kecil bisa berubah drastis.",
    },
    explorer: {
      loadingScatter: "Memuat scatter plot",
      loading: "Memuat trade explorer",
      failed: "Gagal memuat trade explorer.",
      tryAgain: "Coba lagi",
      duration: "Durasi (menit)",
      entryTime: (zone: string) => `Waktu entry (${zone})`,
      estimated: (what: string, currency: string) => `Estimasi ${what} (${currency})`,
      netPnl: (currency: string) => `Net P&L (${currency})`,
      realizedR: "Realized R",
      minutes: (n: string) => `${n} mnt`,
      caption: (n: number) =>
        `Semua ${n} trade yang bisa dibandingkan, penutupan terbaru lebih dulu. Setiap link membuka trade aslinya.`,
      tradeClosed: "Trade / ditutup",
      previous: "Sebelumnya",
      next: "Berikutnya",
      page: (page: number, pages: number) => `Halaman ${page} dari ${pages}`,
      title: "Trade explorer",
      scope: (zone: string) =>
        `Bandingkan trade individual, bukan rata-rata grup · Akun dan filter aktif · ${zone}`,
      presets: "Preset scatter plot",
      presetLabels: {
        holding: "Durasi hold",
        maePnl: "MAE vs net P&L",
        mfePnl: "MFE vs net P&L",
        maeMfe: "MAE vs MFE",
      },
      versus: (x: string, y: string) => `${x} vs ${y}`,
      outcomesBy: (holding: boolean) =>
        `Hasil trade berdasarkan ${holding ? "durasi hold" : "waktu entry"}`,
      closedTrades: (n: number) => `${n} trade ditutup`,
      comparable: (shown: number, total: number) =>
        `${shown} dari ${total} trade ditutup bisa dibandingkan`,
      onePoint: " · Satu titik per trade · ",
      grossNote: "Estimasi excursion gross; net P&L setelah fee",
      afterFees: "Setelah fee",
      xAxis: "Sumbu X",
      yAxis: "Sumbu Y",
      options: {
        duration: "Durasi (menit)",
        entryTime: "Waktu entry",
        mae: "Estimasi MAE",
        mfe: "Estimasi MFE",
        netPnl: "Net P&L",
        realizedR: "Realized R",
      },
      emptyTitle: "Tidak ada trade yang ditutup di pilihan ini",
      emptyBody:
        "Ubah rentang tanggal atau filter untuk melihat riwayat Anda. Posisi terbuka tidak dihitung.",
      mixed: (currencies: string) =>
        `Trade ini memakai mata uang berbeda (${currencies}). Pilih akun dengan satu mata uang untuk sumbu nominal, atau gunakan Durasi dan Realized R untuk membandingkan hasil yang dinormalisasi risiko. Tidak ada konversi mata uang yang diterapkan.`,
      excluded: (n: number) => `${n} trade dikecualikan: `,
      needsStop:
        "realized R memerlukan stop loss yang valid dan contract multiplier jika diperlukan; ",
      needsEstimates: "MAE/MFE memerlukan estimasi market data yang tersimpan dan terbaru. ",
      bothAxes: "Kedua sumbu memerlukan nilai dan timestamp yang valid.",
      rExplained:
        "R = net P&L ÷ risiko yang direncanakan dari stop loss Anda. Memakai rata-rata entry dan total kuantitas entry; tidak mengukur risiko maksimum selama trade berjalan.",
      positive: "Net P&L positif",
      negative: "Net P&L negatif",
      zero: "Net P&L nol",
      selectHint:
        "Pilih satu titik untuk melihat trade-nya. Titik yang saling menumpuk tetap bisa diakses satu per satu di tabel.",
      closed: (date: string) => `Ditutup ${date}`,
      openTrade: "Buka trade ↗",
      dismiss: "Tutup",
      noData:
        "Tidak ada trade dengan data yang diperlukan untuk sumbu ini. Coba sumbu lain atau ubah filter Anda.",
      fewer:
        "Kurang dari 8 trade yang bisa dibandingkan. Lihat nilai persisnya di bawah, atau perluas filter untuk scatter plot yang lebih berguna.",
      smallSample: "Sampel kecil: hati-hati menarik pola sampai tersedia lebih banyak trade.",
      comparableTrades: "Trade yang bisa dibandingkan",
      exploreAll: (n: number) => `Lihat semua ${n} trade`,
      footnote:
        "Durasi adalah waktu dari entry pertama sampai exit terakhir, termasuk jam di luar sesi. Waktu entry memakai zona waktu jurnal; trade sekitar tengah malam muncul di ujung sumbu yang berlawanan. Pola menggambarkan pilihan ini, bukan sebab-akibat atau rekomendasi durasi hold.",
    },
    estimates: {
      calculating: (n: number, total: number, symbol: string) =>
        `Menghitung ${n} dari ${total} · ${symbol}`,
      historyFailed: "Permintaan data historis gagal.",
      unavailable: "Estimasi tidak tersedia.",
      done: (stopped: boolean, saved: number, failed: number, skipped: number) =>
        `${stopped ? "Dihentikan. " : ""}${saved} estimasi tersimpan · ${failed} tidak tersedia · ${skipped} belum diproses.`,
      title: "Estimasi MAE & MFE",
      intro: (saved: number, total: number) =>
        `${saved} dari ${total} trade yang ditutup punya estimasi tersimpan. Estimasi excursion gross tidak termasuk fee; MAE ditampilkan sebagai nilai adverse positif. Nilai yang kosong tidak dimasukkan ke grafik, tidak pernah dihitung nol.`,
      calculateMissing: "Hitung estimasi yang belum ada",
      help: (resolution: string) =>
        `Memuat candle ${resolution} untuk pilihan ini memakai simbol yang tercatat di setiap trade. Ini memakai kuota provider Anda dan bisa memakan waktu beberapa menit. Untuk simbol khusus atau dataset CSV tertentu, muat dan simpan estimasi dari masing-masing trade.`,
      provider: "Provider data untuk estimasi",
      chooseSource: "Pilih sumber data",
      resolution: "Resolusi candle untuk estimasi",
      dataset: "Dataset untuk estimasi",
      confirm: (currencies: string) =>
        `Saya mengonfirmasi simbol, penyesuaian harga, dan mata uang kuotasi ini sesuai dengan fill dan mata uang akun (${currencies || "tidak ada"}).`,
      oneCurrency: "Pilih akun dengan satu mata uang untuk menghitung estimasi bersamaan.",
      calculate: (n: number) => `Hitung ${n} estimasi yang belum ada`,
      connect: "Hubungkan provider market data di Pengaturan",
      stop: "Hentikan perhitungan",
    },
  },
});
