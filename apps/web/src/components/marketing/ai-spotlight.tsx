import { Sparkles, MessageCircleQuestion, ClipboardCheck, Tags } from "lucide-react";
import { PlanNote } from "./plan-note";

const AI_FEATURES = [
  {
    icon: Sparkles,
    title: "AI Recap",
    body: "Ringkasan otomatis performa harian Anda — apa yang berjalan baik, apa yang perlu diperbaiki.",
  },
  {
    icon: ClipboardCheck,
    title: "Critique this trade",
    body: "Review AI untuk satu trade spesifik — eksekusi, timing, dan kualitas keputusan Anda.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Ask your journal",
    body: "Tanyakan apa saja ke data trading Anda sendiri — dijawab berdasarkan histori nyata.",
  },
  {
    icon: Tags,
    title: "AI Auto-Tagger",
    body: "Saran otomatis playbook mana yang paling cocok untuk setiap trade Anda.",
  },
];

export function AiSpotlight() {
  return (
    <section className="relative overflow-hidden bg-[#0b0d13] py-20 sm:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-50"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(77,141,255,0.14) 0%, rgba(11,13,19,0) 70%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <PlanNote tone="pro">
            Perlu paket Pro (kuota bulanan) — Elite dapat kuota lebih besar
          </PlanNote>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Rekan trading AI Anda
          </h2>
          <p className="mt-3 text-[#9aa4b8]">
            AI yang benar-benar membaca data trading Anda — bukan chatbot generik. Setiap jawaban
            didasarkan pada trade, statistik, dan catatan Anda sendiri.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AI_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[#2a3245] bg-[#141820] p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4d8dff]/15">
                <feature.icon className="h-5 w-5 text-[#4d8dff]" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{feature.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#9aa4b8]">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
