import { DashboardFlagshipMockup } from "./dashboard-flagship-mockup";
import { ReportsBreakdownMockup } from "./reports-breakdown-mockup";
import { PlanNote } from "./plan-note";

export function AnalyticsSpotlight() {
  return (
    <section className="bg-[#141820] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <PlanNote tone="all">Tersedia di semua paket, termasuk Starter</PlanNote>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Analisa performa trading Anda
          </h2>
          <p className="mt-3 text-[#9aa4b8]">
            Dashboard lengkap dengan win rate, R-multiple, profit factor, equity curve, dan
            kalender performa harian — plus reporting 19 dimensi untuk breakdown dan compare
            groups. Semua tanpa perlu upgrade.
          </p>
        </div>

        <div className="mt-14">
          <DashboardFlagshipMockup />
        </div>

        <div className="mx-auto mt-6 max-w-3xl">
          <ReportsBreakdownMockup />
        </div>
      </div>
    </section>
  );
}
