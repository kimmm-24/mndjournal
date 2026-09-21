import { NotebookPen, LayoutDashboard, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: NotebookPen,
    title: "Journal Trading Manual",
    body: "Catat setiap trade secara manual dengan tagging setup, emosi, dan kondisi market. Bangun riwayat lengkap dari setiap keputusan trading Gold Anda.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard & Analytics Lengkap",
    body: "Pantau win rate, R-multiple, profit factor, dan kalender performa harian dalam satu dashboard yang mudah dibaca.",
  },
  {
    icon: Sparkles,
    title: "AI Reflection",
    body: "Dapatkan review otomatis dari AI setelah setiap sesi trading — temukan pola kesalahan dan area yang perlu diperbaiki tanpa analisa manual.",
  },
];

export function FeaturesSection() {
  return (
    <section id="fitur" className="scroll-mt-16 bg-[#141820] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Semua yang Anda Butuhkan untuk Trading Gold yang Lebih Disiplin
          </h2>
          <p className="mt-3 text-[#9aa4b8]">
            Dirancang khusus untuk trader XAU/USD harian — bukan jurnal generik yang dipaksakan
            untuk semua instrumen.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
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
