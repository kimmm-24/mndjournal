import { DashboardFlagshipMockup } from "./dashboard-flagship-mockup";
import { ReportsBreakdownMockup } from "./reports-breakdown-mockup";
import { PlanNote } from "./plan-note";
import { DISPLAY_H2, Eyebrow, Slant, TONE_DARK } from "./section-chrome";

export function AnalyticsSpotlight() {
  return (
    <section className="relative overflow-hidden bg-[#141820] pb-20 pt-28 sm:pb-28 sm:pt-36">
      <Slant from={TONE_DARK} low="right" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <Eyebrow n="04">Analytics</Eyebrow>
            <h2 className={`mt-5 ${DISPLAY_H2}`}>Analisa performa trading Anda</h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-[#9aa4b8]">
              Dashboard lengkap dengan win rate, R-multiple, profit factor, equity curve, dan
              kalender performa harian — plus reporting 19 dimensi untuk breakdown dan compare
              groups. Semua tanpa perlu upgrade.
            </p>
            <div className="mt-5">
              <PlanNote tone="all">Tersedia di semua paket, termasuk Starter</PlanNote>
            </div>
          </div>
        </div>

        <div className="relative mt-14">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-2xl bg-linear-to-tr from-[#4d8dff]/15 via-transparent to-transparent blur-2xl"
          />
          <div className="relative lg:mr-24">
            <DashboardFlagshipMockup />
          </div>
          <div className="relative mt-6 lg:-mt-40 lg:ml-auto lg:max-w-xl">
            <ReportsBreakdownMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
