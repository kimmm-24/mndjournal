import { Sparkles } from "lucide-react";
import { AppShellMockup } from "./app-shell-mockup";
import { PlanNote } from "./plan-note";
import { DISPLAY_H2, Eyebrow } from "./section-chrome";

const AI_FEATURES = [
  {
    title: "AI Recap",
    body: "Ringkasan otomatis performa harian Anda — apa yang berjalan baik, apa yang perlu diperbaiki.",
  },
  {
    title: "Critique this trade",
    body: "Review AI untuk satu trade spesifik — eksekusi, timing, dan kualitas keputusan Anda.",
  },
  {
    title: "Ask your journal",
    body: "Tanyakan apa saja ke data trading Anda sendiri — dijawab berdasarkan histori nyata.",
  },
  {
    title: "AI Auto-Tagger",
    body: "Saran otomatis playbook mana yang paling cocok untuk setiap trade Anda.",
  },
];

// Mirrors the real "Tanya jurnal Anda" card (components/ask-journal.tsx) on the Reports page.
// The answer is sample output, consistent with the dashboard mockup's 110 trades.
const SUGGESTIONS = [
  "Apa mistake saya yang paling mahal?",
  "Di hari apa sebaiknya saya berhenti trading?",
];

function AskJournalMockup() {
  return (
    <AppShellMockup title="Reports" active="Reports">
      <div className="rounded-lg border border-[#2a3245] bg-[#1c2230] p-4">
        <div className="text-sm font-semibold text-white">Tanya jurnal Anda</div>
        <div className="mt-3 flex gap-2">
          <div className="min-w-0 flex-1 truncate rounded-md border border-[#2a3245] bg-[#141820] px-3 py-2 text-xs text-white">
            Saya lebih bagus di long atau short?
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#4d8dff] px-3 py-2 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Tanya
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <span
              key={suggestion}
              className="rounded-full border border-[#2a3245] px-2.5 py-1 text-[11px] text-[#7d879e]"
            >
              {suggestion}
            </span>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t border-[#2a3245] pt-4 text-xs leading-relaxed text-[#c7cedb]">
          <p>
            Dari 110 trade tertutup, long Anda jauh lebih kuat: win rate{" "}
            <span className="font-mono text-[#4d8dff]">58%</span> (37 dari 64) dengan profit factor{" "}
            <span className="font-mono text-[#4d8dff]">2.10</span>.
          </p>
          <p>
            Short hanya <span className="font-mono text-[#e05555]">48%</span> (22 dari 46) dengan
            profit factor <span className="font-mono text-[#e05555]">0.90</span> — net masih rugi,
            dan sebagian besar loss-nya terjadi di hari Senin.
          </p>
          <p>Pertimbangkan membatasi short hanya ke setup yang ada di playbook Anda.</p>
        </div>
      </div>
    </AppShellMockup>
  );
}

export function AiSpotlight() {
  return (
    <section className="relative overflow-hidden bg-[#0b0d13] pb-20 pt-4 sm:pb-28 sm:pt-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 -z-0 h-[520px] w-[720px] opacity-50"
        style={{
          background: "radial-gradient(closest-side, rgba(77,141,255,0.16), rgba(11,13,19,0))",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 grid-cols-1 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <Eyebrow n="01">AI Journal</Eyebrow>
          <h2 className={`mt-5 ${DISPLAY_H2}`}>Rekan trading AI Anda</h2>
          <p className="mt-4 text-[#9aa4b8]">
            AI yang benar-benar membaca data trading Anda — bukan chatbot generik. Setiap jawaban
            didasarkan pada trade, statistik, dan catatan Anda sendiri.
          </p>
          <div className="mt-5">
            <PlanNote tone="pro">
              Perlu paket Pro (kuota bulanan) — Elite dapat kuota lebih besar
            </PlanNote>
          </div>

          <ol className="mt-8 divide-y divide-[#1f2636] border-y border-[#1f2636]">
            {AI_FEATURES.map((feature, i) => (
              <li key={feature.title} className="flex gap-4 py-4">
                <span className="w-6 shrink-0 pt-0.5 font-mono text-xs text-[#4d8dff]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#9aa4b8]">{feature.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative lg:col-span-7 lg:pt-10">
          <div
            aria-hidden
            className="absolute -inset-3 rounded-2xl bg-linear-to-br from-[#4d8dff]/25 via-transparent to-transparent blur-xl"
          />
          <div className="relative">
            <AskJournalMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
