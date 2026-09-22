import { Import, FileSpreadsheet, Landmark } from "lucide-react";
import { PlanNote } from "./plan-note";

const FORMATS = ["Interactive Brokers (IBKR)", "MetaTrader", "ThinkOrSwim", "CSV generik"];

export function AutomatedJournaling() {
  return (
    <section className="bg-[#171c26] py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <PlanNote tone="pro">Perlu paket Pro atau lebih tinggi</PlanNote>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Automated journaling
          </h2>
          <p className="mt-3 text-[#9aa4b8]">
            Berhenti mencatat trade satu per satu. Import langsung dari broker Anda lewat file CSV,
            atau sambungkan sinkronisasi otomatis — setiap fill masuk ke jurnal Anda tanpa entri
            manual.
          </p>

          <ul className="mt-6 space-y-3">
            <li className="flex items-start gap-3 text-sm text-[#c3cad9]">
              <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-[#4d8dff]" />
              <span>
                Upload statement CSV dari broker Anda — deteksi otomatis untuk format umum, dengan
                mapping kolom manual bila diperlukan.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#c3cad9]">
              <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[#4d8dff]" />
              <span>Broker sync — hubungkan akun sekali, fill baru masuk otomatis ke jurnal.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#c3cad9]">
              <Import className="mt-0.5 h-5 w-5 shrink-0 text-[#4d8dff]" />
              <span>Deduplikasi otomatis — import ulang file yang sama tidak akan dobel.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-[#2a3245] bg-[#1c2230] p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#7d879e]">
            Format yang didukung
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {FORMATS.map((format) => (
              <div
                key={format}
                className="rounded-lg border border-[#2a3245] bg-[#141820] px-3 py-3 text-sm text-white"
              >
                {format}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#7d879e]">
            Tidak menemukan broker Anda? Import CSV generik menerima kolom apa pun lewat mapping
            manual.
          </p>
        </div>
      </div>
    </section>
  );
}
