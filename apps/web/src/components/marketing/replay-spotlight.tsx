import { ReplayMockup } from "./replay-mockup";
import { PlanNote } from "./plan-note";

export function ReplaySpotlight() {
  return (
    <section className="bg-[#141820] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <PlanNote tone="pro">Perlu paket Pro atau lebih tinggi</PlanNote>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Replay. Analisa. Perbaiki.
          </h2>
          <p className="mt-3 text-[#9aa4b8]">
            Putar ulang price action candlestick di sekitar entry dan exit setiap trade Anda —
            scrubber interaktif dengan kecepatan 1x/2x/4x, lihat persis apa yang terjadi sebelum
            Anda menarik trigger.
          </p>
        </div>

        <div className="mt-14 mx-auto max-w-3xl">
          <ReplayMockup />
        </div>
      </div>
    </section>
  );
}
