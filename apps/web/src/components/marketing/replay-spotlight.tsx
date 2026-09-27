import { ReplayMockup } from "./replay-mockup";
import { PlanNote } from "./plan-note";
import { DISPLAY_H2, Eyebrow, Slant, TONE_DARK } from "./section-chrome";

export function ReplaySpotlight() {
  return (
    <section className="relative overflow-hidden bg-[#141820] pb-20 pt-28 sm:pb-28 sm:pt-36">
      <Slant from={TONE_DARK} low="right" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 grid-cols-1 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          <Eyebrow n="06">Trade replay</Eyebrow>
          <h2 className={`mt-5 ${DISPLAY_H2}`}>Replay. Analisa. Perbaiki.</h2>
          <p className="mt-4 text-[#9aa4b8]">
            Putar ulang price action candlestick di sekitar entry dan exit setiap trade Anda —
            scrubber interaktif dengan kecepatan 1x/2x/4x, lihat persis apa yang terjadi sebelum
            Anda menarik trigger.
          </p>
          <div className="mt-5">
            <PlanNote tone="pro">Perlu paket Pro atau lebih tinggi</PlanNote>
          </div>
        </div>

        <div className="relative lg:col-span-7">
          <div
            aria-hidden
            className="absolute -inset-3 rounded-2xl bg-linear-to-bl from-[#4d8dff]/20 via-transparent to-transparent blur-xl"
          />
          <div className="relative">
            <ReplayMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
