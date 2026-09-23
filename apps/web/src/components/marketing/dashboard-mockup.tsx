"use client";

import { CircleDollarSign, Target, Scale, Flame } from "lucide-react";
import { BrowserFrame } from "./browser-frame";
import { CountUp } from "./count-up";
import { MockGauge } from "./mock-gauge";
import { useInView } from "./use-in-view";

export function DashboardMockup() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="mx-auto -mt-4 max-w-4xl px-4 sm:-mt-6 sm:px-6">
      <BrowserFrame>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-lg border border-[#2a3245] bg-[#141820] px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium tracking-wide text-[#7d879e]">NET P&L</div>
              <CircleDollarSign className="h-3.5 w-3.5 text-[#5b6478]" />
            </div>
            <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-[#4d8dff] sm:text-2xl">
              <CountUp active={inView} value={5743.98} decimals={2} prefix="+$" />
            </div>
            <div className="mt-1 text-[10px] text-[#7d879e]">110 closed trades</div>
          </div>

          <div className="rounded-lg border border-[#2a3245] bg-[#141820] px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium tracking-wide text-[#7d879e]">
                TRADE WIN %
              </div>
              <Target className="h-3.5 w-3.5 text-[#5b6478]" />
            </div>
            <div className="mt-1 flex justify-center">
              <MockGauge active={inView} value={0.536} size={64} />
            </div>
          </div>

          <div className="rounded-lg border border-[#2a3245] bg-[#141820] px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium tracking-wide text-[#7d879e]">
                PROFIT FACTOR
              </div>
              <Scale className="h-3.5 w-3.5 text-[#5b6478]" />
            </div>
            <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-white sm:text-2xl">
              <CountUp active={inView} value={1.73} decimals={2} />
            </div>
            <div className="mt-1 text-[10px] text-[#7d879e]">gross profit ÷ gross loss</div>
          </div>

          <div className="rounded-lg border border-[#2a3245] bg-[#141820] px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium tracking-wide text-[#7d879e]">STREAK</div>
              <Flame className="h-3.5 w-3.5 text-[#5b6478]" />
            </div>
            <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-white sm:text-2xl">
              <CountUp active={inView} value={3} suffix=" days" />
            </div>
            <div className="mt-1 text-[10px] text-[#7d879e]">current winning streak</div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}
