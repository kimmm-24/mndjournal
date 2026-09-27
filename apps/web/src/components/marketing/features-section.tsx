import {
  NotebookPen,
  LayoutDashboard,
  BookOpen,
  PlayCircle,
  Sparkles,
  Landmark,
} from "lucide-react";
import { DISPLAY_H2, Eyebrow, Slant, TONE_DARK } from "./section-chrome";

const FEATURES = [
  {
    icon: NotebookPen,
    title: "Journal Trading",
    body: "Catat setiap trade secara manual dengan tagging setup, emosi, dan kondisi market. Bangun riwayat lengkap dari setiap keputusan trading Anda.",
  },
  {
    icon: LayoutDashboard,
    title: "Analytics & Dashboard",
    body: "Win rate, R-multiple, profit factor, equity curve, dan drawdown — plus reporting 19 dimensi untuk breakdown dan compare groups.",
  },
  {
    icon: BookOpen,
    title: "Playbooks & Rule Adherence",
    body: "Definisikan strategi Anda sebagai playbook dengan checklist rules, lalu lacak seberapa disiplin Anda mengikutinya di setiap trade.",
  },
  {
    icon: PlayCircle,
    title: "Trade Replay",
    body: "Putar ulang price action candlestick di sekitar entry dan exit setiap trade — scrubber interaktif dengan kecepatan 1x/2x/4x.",
  },
  {
    icon: Sparkles,
    title: "AI Reflection",
    body: "Recap harian, critique per-trade, tanya jawab dengan jurnal Anda (ask your journal), dan AI Auto-Tagger yang menyarankan playbook otomatis.",
  },
  {
    icon: Landmark,
    title: "Prop-Firm Tracking",
    body: "Lacak akun evaluation dan funded Anda secara terpisah dari P&L journal — cash flow, fee, split, dan payout dalam satu dashboard.",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="fitur"
      className="relative scroll-mt-16 bg-[#141820] pb-20 pt-28 sm:pb-28 sm:pt-36"
    >
      <Slant from={TONE_DARK} low="right" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow n="02">Fitur</Eyebrow>
            <h2 className={`mt-5 ${DISPLAY_H2}`}>Semua yang Anda butuhkan, satu tempat</h2>
          </div>
          <p className="text-[#9aa4b8] lg:col-span-5">
            Dirancang untuk trader di semua instrumen — saham, forex, futures, crypto, gold, dan
            lainnya.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[#2a3245] bg-[#2a3245] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="bg-[#141820] p-6 transition-colors hover:bg-[#171c26] sm:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#4d8dff]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <feature.icon className="h-5 w-5 text-[#5b6478]" />
              </div>
              <h3 className="mt-8 text-lg font-semibold tracking-tight text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9aa4b8]">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
