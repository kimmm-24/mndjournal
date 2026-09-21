"use client";

import { BrowserFrame } from "./browser-frame";
import { CountUp } from "./count-up";
import { useInView } from "./use-in-view";

const STATS = [
  { label: "NET P&L", value: 18.4, decimals: 1, prefix: "+", suffix: "R", tone: "profit" as const },
  { label: "WIN RATE", value: 54.5, decimals: 1, suffix: "%", tone: "neutral" as const },
  { label: "PROFIT FACTOR", value: 1.62, decimals: 2, tone: "neutral" as const },
  { label: "STREAK", value: 3, decimals: 0, suffix: " days", tone: "neutral" as const },
];

export function DashboardMockup() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="mx-auto -mt-4 max-w-4xl px-4 sm:-mt-6 sm:px-6">
      <BrowserFrame>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-[#2a3245] bg-[#141820] px-4 py-4"
            >
              <div className="text-[11px] font-medium tracking-wide text-[#7d879e]">
                {stat.label}
              </div>
              <div
                className="mt-1.5 font-mono text-xl font-semibold tabular-nums sm:text-2xl"
                style={{ color: stat.tone === "profit" ? "#4d8dff" : "#f4f4f2" }}
              >
                <CountUp
                  active={inView}
                  value={stat.value}
                  decimals={stat.decimals}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </div>
            </div>
          ))}
        </div>
      </BrowserFrame>
    </div>
  );
}
