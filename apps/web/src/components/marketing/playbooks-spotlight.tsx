import { ListChecks, TrendingUp } from "lucide-react";
import { AppShellMockup } from "./app-shell-mockup";
import { PlanNote } from "./plan-note";
import { DISPLAY_H2, Eyebrow, Slant, TONE_LIGHT } from "./section-chrome";

export function PlaybooksSpotlight() {
  return (
    <section className="relative overflow-hidden bg-[#0b0d13] pb-20 pt-28 sm:pb-28 sm:pt-36">
      <Slant from={TONE_LIGHT} low="left" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 grid-cols-1 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="relative order-2 lg:order-1 lg:col-span-7">
          <div
            aria-hidden
            className="absolute -inset-3 rounded-2xl bg-linear-to-br from-[#4d8dff]/20 via-transparent to-transparent blur-xl"
          />
          <div className="relative">
            <AppShellMockup title="Playbooks" active="Playbooks">
              <div className="rounded-lg border border-[#2a3245] bg-[#1c2230] p-5">
                <div className="text-sm font-semibold text-white">Opening Range Breakout</div>
                <p className="mt-1 text-xs text-[#7d879e]">4 rules · 87% adherence</p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Hanya A+ setup",
                    "Risk maksimal 1R per trade",
                    "Tidak entry setelah jam 11:30",
                    "Konfirmasi volume sebelum entry",
                  ].map((rule, i) => (
                    <li
                      key={rule}
                      className="flex items-center justify-between rounded-lg border border-[#2a3245] bg-[#141820] px-3 py-2.5 text-sm"
                    >
                      <span className="text-[#c3cad9]">{rule}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          i === 2
                            ? "bg-[#e05555]/15 text-[#e05555]"
                            : "bg-[#4d8dff]/15 text-[#4d8dff]"
                        }`}
                      >
                        {i === 2 ? "BROKEN" : "FOLLOWED"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </AppShellMockup>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-5">
          <Eyebrow n="05">Playbooks</Eyebrow>
          <h2 className={`mt-5 ${DISPLAY_H2}`}>Punya strategi yang profitable?</h2>
          <p className="mt-4 text-[#9aa4b8]">
            Definisikan setup Anda sebagai playbook dengan checklist rules, tag setiap trade dengan
            playbook yang relevan, lalu lihat apakah Anda benar-benar disiplin mengikutinya.
          </p>
          <div className="mt-5">
            <PlanNote tone="pro">Perlu paket Pro atau lebih tinggi</PlanNote>
          </div>

          <ul className="mt-8 space-y-3">
            <li className="flex items-start gap-3 text-sm text-[#c3cad9]">
              <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-[#4d8dff]" />
              <span>
                Rule adherence checklist — tandai followed/broken di setiap trade, lihat persentase
                kepatuhan per playbook.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#c3cad9]">
              <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#4d8dff]" />
              <span>
                Analitik performa per-strategi di Reports — playbook mana yang benar-benar
                menghasilkan profit.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
