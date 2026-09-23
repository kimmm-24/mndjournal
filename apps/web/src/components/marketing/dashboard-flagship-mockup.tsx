"use client";

import { CircleDollarSign, Target, Scale, CalendarCheck2 } from "lucide-react";
import { AppShellMockup } from "./app-shell-mockup";
import { CountUp } from "./count-up";
import { MockGauge } from "./mock-gauge";
import { useInView } from "./use-in-view";

interface DayCell {
  date: number;
  pnl: number;
  trades: number;
}

// Fixed sample month — deterministic so the mockup renders the same every time.
const WEEKS: Array<Array<DayCell | null>> = [
  [null, null, { date: 1, pnl: 245, trades: 3 }, { date: 2, pnl: -120, trades: 2 }, { date: 3, pnl: 380, trades: 4 }, null, null],
  [{ date: 4, pnl: 90, trades: 1 }, { date: 5, pnl: -60, trades: 2 }, { date: 6, pnl: 510, trades: 5 }, { date: 7, pnl: 175, trades: 3 }, { date: 8, pnl: -210, trades: 2 }, null, null],
  [{ date: 9, pnl: 320, trades: 4 }, { date: 10, pnl: 140, trades: 2 }, { date: 11, pnl: -95, trades: 1 }, { date: 12, pnl: 260, trades: 3 }, { date: 13, pnl: 410, trades: 5 }, null, null],
  [{ date: 14, pnl: -180, trades: 2 }, { date: 15, pnl: 220, trades: 3 }, { date: 16, pnl: 150, trades: 2 }, { date: 17, pnl: -141, trades: 1 }, { date: 18, pnl: 335, trades: 4 }, null, null],
];

function intensityClass(pnl: number, maxAbs: number): string {
  const ratio = Math.abs(pnl) / maxAbs;
  const tier = ratio > 0.66 ? "30" : ratio > 0.33 ? "20" : "10";
  return pnl >= 0 ? `bg-[#4d8dff]/${tier}` : `bg-[#e05555]/${tier}`;
}

export function DashboardFlagshipMockup() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const maxAbs = Math.max(
    ...WEEKS.flat().map((d) => (d ? Math.abs(d.pnl) : 0)),
  );

  return (
    <div ref={ref}>
      <AppShellMockup
        title="Dashboard"
        actions={
          <span className="rounded-lg bg-[#4d8dff] px-3 py-1.5 text-xs font-semibold text-white">
            + Add trade
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg border border-[#2a3245] bg-[#1c2230] p-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-medium tracking-wide text-[#7d879e]">NET P&L</div>
              <CircleDollarSign className="h-3.5 w-3.5 text-[#5b6478]" />
            </div>
            <div className="mt-1.5 text-lg font-semibold tabular-nums text-[#4d8dff]">
              <CountUp active={inView} value={5743.98} decimals={2} prefix="+$" />
            </div>
            <div className="mt-1 text-[10px] text-[#7d879e]">110 closed trades</div>
          </div>

          <div className="rounded-lg border border-[#2a3245] bg-[#1c2230] p-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-medium tracking-wide text-[#7d879e]">
                TRADE WIN %
              </div>
              <Target className="h-3.5 w-3.5 text-[#5b6478]" />
            </div>
            <div className="mt-0.5 flex justify-center">
              <MockGauge active={inView} value={0.536} size={60} />
            </div>
          </div>

          <div className="rounded-lg border border-[#2a3245] bg-[#1c2230] p-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-medium tracking-wide text-[#7d879e]">
                PROFIT FACTOR
              </div>
              <Scale className="h-3.5 w-3.5 text-[#5b6478]" />
            </div>
            <div className="mt-1.5 text-lg font-semibold tabular-nums text-white">
              <CountUp active={inView} value={1.73} decimals={2} />
            </div>
            <div className="mt-1 text-[10px] text-[#7d879e]">gross profit ÷ gross loss</div>
          </div>

          <div className="rounded-lg border border-[#2a3245] bg-[#1c2230] p-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-medium tracking-wide text-[#7d879e]">
                DAY WIN %
              </div>
              <CalendarCheck2 className="h-3.5 w-3.5 text-[#5b6478]" />
            </div>
            <div className="mt-0.5 flex justify-center">
              <MockGauge active={inView} value={0.568} size={60} />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[#2a3245] bg-[#1c2230] p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Calendar</span>
            <span className="text-[10px] text-[#7d879e]">September 2026</span>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-[9px]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="pb-0.5 text-center text-[#7d879e]">
                {d}
              </div>
            ))}
            {WEEKS.flat().map((cell, i) =>
              cell ? (
                <div
                  key={i}
                  className={`aspect-square rounded-md border border-[#2a3245] p-1 ${intensityClass(cell.pnl, maxAbs)}`}
                >
                  <div className="text-[#7d879e]">{cell.date}</div>
                  <div
                    className={`mt-0.5 truncate font-medium tabular-nums ${cell.pnl >= 0 ? "text-[#4d8dff]" : "text-[#e05555]"}`}
                  >
                    {cell.pnl >= 0 ? "+" : "-"}${Math.abs(cell.pnl)}
                  </div>
                  <div className="hidden text-[#5b6478] sm:block">
                    {cell.trades} trade{cell.trades === 1 ? "" : "s"}
                  </div>
                </div>
              ) : (
                <div key={i} className="aspect-square rounded-md border border-transparent bg-[#141820]/40" />
              ),
            )}
          </div>
        </div>
      </AppShellMockup>
    </div>
  );
}
