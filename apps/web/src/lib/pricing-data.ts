export const formatRupiah = (amount: number): string => `Rp${amount.toLocaleString("id-ID")}`;

export type PlanId = "starter" | "pro" | "elite";

export interface PricingTier {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  highlighted?: boolean;
  bullets: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 49_000,
    yearlyPrice: 441_000,
    description: "Untuk trader yang baru mulai membangun kebiasaan journaling.",
    bullets: [
      "1 akun trading",
      "Dashboard & analytics lengkap",
      "Kalender jurnal harian",
      "Reporting 19 dimensi",
      "Input trade manual",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 99_000,
    yearlyPrice: 891_000,
    description: "Untuk trader aktif yang ingin analisa dan refleksi penuh.",
    highlighted: true,
    bullets: [
      "Sampai 10 akun trading",
      "Import CSV & broker sync",
      "Add-on auto sync MetaTrader",
      "Playbooks & rule adherence",
      "Trade replay interaktif",
      "AI Reflection (kuota bulanan)",
      "1 akun prop firm",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    monthlyPrice: 199_000,
    yearlyPrice: 1_791_000,
    description: "Untuk trader prop firm yang mengelola banyak akun.",
    bullets: [
      "Semua fitur di Pro",
      "Unlimited akun trading",
      "Unlimited akun prop firm",
      "Kuota AI Reflection lebih besar",
    ],
  },
];

export type FeatureValue = boolean | string;

export interface ComparisonRow {
  label: string;
  values: Record<PlanId, FeatureValue>;
}

export interface ComparisonGroup {
  title: string;
  rows: ComparisonRow[];
}

export const COMPARISON: ComparisonGroup[] = [
  {
    title: "Akun & Data",
    rows: [
      {
        label: "Jumlah akun trading",
        values: { starter: "1 akun", pro: "Sampai 10 akun", elite: "Unlimited" },
      },
      {
        label: "Import CSV / broker sync (IBKR, MetaTrader, ThinkOrSwim)",
        values: { starter: false, pro: true, elite: true },
      },
      {
        label: "Auto sync MetaTrader 4/5 (add-on, sekali sehari Senin–Jumat)",
        values: { starter: false, pro: "Rp89.000/akun/bulan", elite: "Rp89.000/akun/bulan" },
      },
      { label: "Commissions & fees tracking", values: { starter: true, pro: true, elite: true } },
      { label: "Multi-currency (tampilan)", values: { starter: true, pro: true, elite: true } },
      { label: "Breakeven settings", values: { starter: true, pro: true, elite: true } },
    ],
  },
  {
    title: "Journal & Analytics",
    rows: [
      { label: "Dashboard analytics lengkap", values: { starter: true, pro: true, elite: true } },
      { label: "Kalender jurnal harian", values: { starter: true, pro: true, elite: true } },
      { label: "Notebook & template", values: { starter: true, pro: true, elite: true } },
      {
        label: "Risk management (stop/target, planned R)",
        values: { starter: true, pro: true, elite: true },
      },
      { label: "P&L & drawdown tracking", values: { starter: true, pro: true, elite: true } },
      { label: "Filter lanjutan (14+ dimensi)", values: { starter: true, pro: true, elite: true } },
      {
        label: "Reporting — 19 dimensi breakdown + compare groups",
        values: { starter: true, pro: true, elite: true },
      },
      { label: "Log missed trades", values: { starter: true, pro: true, elite: true } },
      { label: "Image upload / attachments", values: { starter: true, pro: true, elite: true } },
    ],
  },
  {
    title: "Playbooks & Strategi",
    rows: [
      {
        label: "Playbooks + rule adherence checklist",
        values: { starter: false, pro: true, elite: true },
      },
      {
        label: "Analitik performa per-strategi",
        values: { starter: false, pro: true, elite: true },
      },
    ],
  },
  {
    title: "Trade Replay",
    rows: [
      {
        label: "Replay candlestick interaktif (scrubber, 1x/2x/4x)",
        values: { starter: false, pro: true, elite: true },
      },
    ],
  },
  {
    title: "AI Reflection",
    rows: [
      {
        label: "AI Recap harian",
        values: { starter: false, pro: "Kuota bulanan", elite: "Kuota lebih besar" },
      },
      {
        label: "Critique this trade",
        values: { starter: false, pro: "Kuota bulanan", elite: "Kuota lebih besar" },
      },
      {
        label: "Ask your journal",
        values: { starter: false, pro: "Kuota bulanan", elite: "Kuota lebih besar" },
      },
      {
        label: "AI Auto-Tagger (saran playbook)",
        values: { starter: false, pro: "Kuota bulanan", elite: "Kuota lebih besar" },
      },
    ],
  },
  {
    title: "Prop-Firm Tracking",
    rows: [
      {
        label: "Prop-firm account dashboard",
        values: { starter: false, pro: "1 akun", elite: "Unlimited" },
      },
    ],
  },
];
