"use client";

import { CircleDollarSign, Target, Scale, Flame } from "lucide-react";
import { BrowserFrame } from "./browser-frame";
import { CountUp } from "./count-up";
import { MockGauge } from "./mock-gauge";
import { useInView } from "./use-in-view";

// Fixed sample curve (running total per trading day), ending at the Net P&L card's value.
const CUMULATIVE = [
  0, 420, 310, 890, 1240, 1050, 1610, 2080, 1790, 2350, 2900, 2640, 3180, 3560, 3310, 3920, 4480,
  4150, 4870, 5320, 5100, 5743.98,
];
const CHART_W = 600;
const CHART_H = 140;
const POINTS = CUMULATIVE.map((value, i) => {
  const x = (i / (CUMULATIVE.length - 1)) * CHART_W;
  const y = CHART_H - 8 - (value / 6000) * (CHART_H - 16);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
});
const LINE = `M${POINTS.join(" L")}`;
const AREA = `${LINE} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;

export function DashboardMockup() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div className="relative -mt-24 sm:-mt-32">
      {/* Angled hand-off from the hero into the darker AI section below. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[#0b0d13]"
        style={{ clipPath: "polygon(0 72%, 100% 38%, 100% 100%, 0 100%)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-[#4d8dff]/0 via-[#4d8dff]/60 to-[#4d8dff]/0"
        style={{
          clipPath: "polygon(0 72%, 100% 38%, 100% calc(38% + 1px), 0 calc(72% + 1px))",
        }}
      />
      <div
        ref={ref}
        className="relative mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-24"
        style={{ perspective: "1600px" }}
      >
        <div className="origin-top sm:[transform:rotateX(6deg)]">
          <BrowserFrame>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div className="rounded-lg border border-[#2a3245] bg-[#141820] px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-medium tracking-wide text-[#7d879e]">
                    NET P&L
                  </div>
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

            <div className="mt-3 rounded-lg border border-[#2a3245] bg-[#141820] px-4 py-4 sm:mt-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium tracking-wide text-[#7d879e]">
                  DAILY NET CUMULATIVE P&L
                </div>
                <div className="font-mono text-[11px] tabular-nums text-[#4d8dff]">+$5,743.98</div>
              </div>
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                preserveAspectRatio="none"
                className="mt-3 h-28 w-full sm:h-36"
                aria-hidden
              >
                <defs>
                  <linearGradient id="mock-cumulative-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4d8dff" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4d8dff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((f) => (
                  <line
                    key={f}
                    x1="0"
                    x2={CHART_W}
                    y1={CHART_H * f}
                    y2={CHART_H * f}
                    stroke="#2a3245"
                    strokeDasharray="3 5"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <path d={AREA} fill="url(#mock-cumulative-fill)" />
                <path
                  d={LINE}
                  fill="none"
                  stroke="#4d8dff"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </BrowserFrame>
        </div>
      </div>
    </div>
  );
}
