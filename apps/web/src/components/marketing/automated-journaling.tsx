import { Import, FileSpreadsheet, Landmark } from "lucide-react";
import { PlanNote } from "./plan-note";
import { TradesTableMockup } from "./trades-table-mockup";
import { DISPLAY_H2, Eyebrow, Slant, TONE_LIGHT } from "./section-chrome";

const FORMATS = ["Interactive Brokers (IBKR)", "MetaTrader", "ThinkOrSwim", "CSV generik"];

export function AutomatedJournaling() {
  return (
    <section className="relative overflow-hidden bg-[#0b0d13] pb-20 pt-28 sm:pb-28 sm:pt-36">
      <Slant from={TONE_LIGHT} low="left" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 grid-cols-1 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          <Eyebrow n="03">Import & sync</Eyebrow>
          <h2 className={`mt-5 ${DISPLAY_H2}`}>Automated journaling</h2>
          <p className="mt-4 text-[#9aa4b8]">
            Berhenti mencatat trade satu per satu. Import langsung dari broker Anda lewat file CSV,
            atau sambungkan sinkronisasi otomatis — setiap fill masuk ke jurnal Anda tanpa entri
            manual.
          </p>
          <div className="mt-5">
            <PlanNote tone="pro">Perlu paket Pro atau lebih tinggi</PlanNote>
          </div>

          <ul className="mt-8 space-y-3">
            <li className="flex items-start gap-3 text-sm text-[#c3cad9]">
              <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-[#4d8dff]" />
              <span>
                Upload statement CSV dari broker Anda — deteksi otomatis untuk format umum, dengan
                mapping kolom manual bila diperlukan.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#c3cad9]">
              <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[#4d8dff]" />
              <span>
                Broker sync — hubungkan akun sekali, fill baru masuk otomatis ke jurnal. Auto sync
                MetaTrader 4/5 tersedia sebagai add-on.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#c3cad9]">
              <Import className="mt-0.5 h-5 w-5 shrink-0 text-[#4d8dff]" />
              <span>Deduplikasi otomatis — import ulang file yang sama tidak akan dobel.</span>
            </li>
          </ul>

          <div className="mt-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d879e]">
              Format yang didukung
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {FORMATS.map((format) => (
                <span
                  key={format}
                  className="rounded-full border border-[#2a3245] bg-[#1c2230] px-3 py-1 text-xs text-[#c3cad9]"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative lg:col-span-7">
          <div
            aria-hidden
            className="absolute -inset-3 rounded-2xl bg-linear-to-bl from-[#4d8dff]/20 via-transparent to-transparent blur-xl"
          />
          <div className="relative">
            <TradesTableMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
