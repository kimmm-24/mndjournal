import {
  NotebookPen,
  LayoutDashboard,
  BookOpen,
  PlayCircle,
  Sparkles,
  Landmark,
} from "lucide-react";

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
    <section id="fitur" className="scroll-mt-16 bg-[#141820] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Semua yang Anda butuhkan, satu tempat
          </h2>
          <p className="mt-3 text-[#9aa4b8]">
            Dirancang untuk trader di semua instrumen — saham, forex, futures, crypto, gold, dan
            lainnya.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[#2a3245] bg-[#1c2230] p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#4d8dff]/15">
                <feature.icon className="h-5 w-5 text-[#4d8dff]" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9aa4b8]">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
