import { defineMessages } from "../define";

/** Billing page: plans, checkout, payment history. */
export const billing = defineMessages({
  en: {
    title: "Billing",
    snapLoadFailed: "Midtrans checkout failed to load",
    snapUnreachable: "Couldn't load Midtrans checkout. Check your connection and try again.",
    status: {
      paid: "Paid",
      pending: "Waiting for payment",
      failed: "Failed",
      expired: "Expired",
      refunded: "Refunded",
    },
    received: (plan: string, until: string | null) =>
      `Payment received. ${plan} is active${until ? ` until ${until}` : ""}.`,
    waiting:
      "Waiting for your payment. Once you've paid (bank transfer, QRIS or e-wallet), it usually shows up within a minute — use “Check status” below if it doesn't.",
    notThrough: "That payment didn't go through. You can try again.",
    checkFailed: "Couldn't check the payment status.",
    checkoutFailed: "Couldn't start the checkout.",
    sandbox:
      "Sandbox mode: payments go through Midtrans's test environment and no real money is charged.",
    notConfigured:
      "Payments aren't configured on this server yet (MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY).",
    currentPlan: "Current plan",
    extendOrChange: "Extend or change your plan",
    choosePlan: "Choose a plan",
    billingPeriod: "Billing period",
    monthly: "Monthly",
    yearly: "Yearly (3 months free)",
    extendTier: (tier: string) => `Extend ${tier}`,
    switchTier: (tier: string) => `Switch to ${tier}`,
    chooseTier: (tier: string) => `Choose ${tier}`,
    current: "Current",
    perMonth: " / month",
    perYear: " / year",
    openingCheckout: "Opening checkout…",
    switchNote: (from: string, to: string) =>
      `Your unused ${from} time is converted to ${to} days at the price ratio.`,
    trialNote: "Paid time starts after your trial ends — you keep your remaining trial days.",
    history: "Payment history",
    columns: { date: "Date", plan: "Plan", amount: "Amount", method: "Method", status: "Status" },
    oneMonth: "1 month",
    oneYear: "1 year",
    continuePayment: "Continue payment",
    checking: "Checking…",
    checkStatus: "Check status",
    trialTitle: (plan: string) => `Free trial · ${plan} features`,
    trialBody: (left: number, total: number, ends: string) =>
      `${left} of ${total} days left — ends ${ends}. Choose a plan before then to keep adding trades and notes.`,
    paidThrough: (ends: string, left: number) =>
      `Paid through ${ends} (${left} days left). Plans don't renew automatically — extend any time and the new period is added on top.`,
    complimentary: "Complimentary plan — no expiry.",
    trialEnded: "Your free trial has ended",
    planEnded: (plan: string) => `Your ${plan} plan has ended`,
    readOnly:
      "Your journal is read-only: everything is still here to view and export, but adding or editing needs an active plan.",
    addon: {
      title: "MetaTrader auto sync add-on",
      body: (price: string) =>
        `Syncs each MetaTrader 4/5 account once a day, Monday to Friday — automatically, or by hand when you want it sooner. ${price} per MetaTrader account per month, on Pro or Elite. CSV import and other brokers' sync stay included in your plan.`,
      status: (slots: number, connected: number) =>
        `Slots: ${slots} · MetaTrader accounts connected: ${connected}`,
      addNow: (price: string, until: string) => `Add 1 slot now — ${price} until ${until}`,
      nextPeriod: "MetaTrader slots in your next payment",
      decrease: "Fewer MetaTrader slots",
      increase: "More MetaTrader slots",
      hint: "Applies to the Pro and Elite buttons below. It can't be lower than your connected MetaTrader accounts.",
      trialHint:
        "During the trial, add MetaTrader slots together with a plan below — they work as soon as it's paid.",
      withSlots: (slots: number, price: string) =>
        `+ ${slots} MetaTrader slot${slots === 1 ? "" : "s"} (${price})`,
      history: (slots: number) => `MetaTrader add-on · ${slots} slot${slots === 1 ? "" : "s"}`,
      historySuffix: (slots: number) => ` + ${slots} MetaTrader`,
    },
  },
  id: {
    title: "Billing",
    snapLoadFailed: "Checkout Midtrans gagal dimuat",
    snapUnreachable: "Gagal memuat checkout Midtrans. Periksa koneksi Anda dan coba lagi.",
    status: {
      paid: "Lunas",
      pending: "Menunggu pembayaran",
      failed: "Gagal",
      expired: "Kedaluwarsa",
      refunded: "Dikembalikan",
    },
    received: (plan: string, until: string | null) =>
      `Pembayaran diterima. ${plan} aktif${until ? ` sampai ${until}` : ""}.`,
    waiting:
      "Menunggu pembayaran Anda. Setelah Anda membayar (transfer bank, QRIS, atau e-wallet), biasanya muncul dalam satu menit — klik “Cek status” di bawah jika belum muncul.",
    notThrough: "Pembayaran tersebut tidak berhasil. Silakan coba lagi.",
    checkFailed: "Gagal memeriksa status pembayaran.",
    checkoutFailed: "Gagal memulai checkout.",
    sandbox:
      "Mode sandbox: pembayaran melalui lingkungan uji Midtrans dan tidak ada uang sungguhan yang ditagih.",
    notConfigured:
      "Pembayaran belum dikonfigurasi di server ini (MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY).",
    currentPlan: "Paket saat ini",
    extendOrChange: "Perpanjang atau ganti paket",
    choosePlan: "Pilih paket",
    billingPeriod: "Periode tagihan",
    monthly: "Bulanan",
    yearly: "Tahunan (gratis 3 bulan)",
    extendTier: (tier: string) => `Perpanjang ${tier}`,
    switchTier: (tier: string) => `Ganti ke ${tier}`,
    chooseTier: (tier: string) => `Pilih ${tier}`,
    current: "Saat ini",
    perMonth: " / bulan",
    perYear: " / tahun",
    openingCheckout: "Membuka checkout…",
    switchNote: (from: string, to: string) =>
      `Sisa waktu ${from} Anda dikonversi menjadi hari ${to} sesuai perbandingan harga.`,
    trialNote:
      "Masa berbayar dimulai setelah uji coba berakhir — sisa hari uji coba Anda tidak hilang.",
    history: "Riwayat pembayaran",
    columns: {
      date: "Tanggal",
      plan: "Paket",
      amount: "Jumlah",
      method: "Metode",
      status: "Status",
    },
    oneMonth: "1 bulan",
    oneYear: "1 tahun",
    continuePayment: "Lanjutkan pembayaran",
    checking: "Memeriksa…",
    checkStatus: "Cek status",
    trialTitle: (plan: string) => `Uji coba gratis · fitur ${plan}`,
    trialBody: (left: number, total: number, ends: string) =>
      `Sisa ${left} dari ${total} hari — berakhir ${ends}. Pilih paket sebelum itu agar tetap bisa menambah trade dan catatan.`,
    paidThrough: (ends: string, left: number) =>
      `Dibayar sampai ${ends} (sisa ${left} hari). Paket tidak diperpanjang otomatis — perpanjang kapan saja dan periode baru ditambahkan di atasnya.`,
    complimentary: "Paket gratis khusus — tanpa masa berlaku.",
    trialEnded: "Masa uji coba gratis Anda telah berakhir",
    planEnded: (plan: string) => `Paket ${plan} Anda telah berakhir`,
    readOnly:
      "Jurnal Anda sekarang hanya-baca: semua data masih bisa dilihat dan diekspor, tetapi menambah atau mengubah data memerlukan paket aktif.",
    addon: {
      title: "Add-on auto sync MetaTrader",
      body: (price: string) =>
        `Setiap akun MetaTrader 4/5 disinkronkan sekali sehari, Senin–Jumat — otomatis, atau manual kalau Anda ingin lebih cepat. ${price} per akun MetaTrader per bulan, untuk paket Pro atau Elite. Import CSV dan sync broker lain tetap termasuk dalam paket Anda.`,
      status: (slots: number, connected: number) =>
        `Slot: ${slots} · Akun MetaTrader terhubung: ${connected}`,
      addNow: (price: string, until: string) => `Tambah 1 slot sekarang — ${price} sampai ${until}`,
      nextPeriod: "Slot MetaTrader di pembayaran berikutnya",
      decrease: "Kurangi slot MetaTrader",
      increase: "Tambah slot MetaTrader",
      hint: "Berlaku untuk tombol Pro dan Elite di bawah. Tidak bisa kurang dari jumlah akun MetaTrader yang terhubung.",
      trialHint:
        "Selama uji coba, tambahkan slot MetaTrader bersama paket di bawah — slot langsung aktif setelah dibayar.",
      withSlots: (slots: number, price: string) => `+ ${slots} slot MetaTrader (${price})`,
      history: (slots: number) => `Add-on MetaTrader · ${slots} slot`,
      historySuffix: (slots: number) => ` + ${slots} MetaTrader`,
    },
  },
});
