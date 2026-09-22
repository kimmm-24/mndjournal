"use client";

import { Pause, RotateCcw, SkipForward } from "lucide-react";
import { BrowserFrame } from "./browser-frame";
import { useInView } from "./use-in-view";

// Fixed pseudo-candle heights/tones so the reveal animation is deterministic.
const CANDLES: Array<{ h: number; tone: "profit" | "loss" }> = [
  { h: 40, tone: "profit" }, { h: 55, tone: "profit" }, { h: 35, tone: "loss" },
  { h: 60, tone: "profit" }, { h: 48, tone: "loss" }, { h: 70, tone: "profit" },
  { h: 52, tone: "profit" }, { h: 30, tone: "loss" }, { h: 65, tone: "profit" },
  { h: 58, tone: "profit" }, { h: 42, tone: "loss" }, { h: 75, tone: "profit" },
  { h: 50, tone: "profit" }, { h: 38, tone: "loss" }, { h: 62, tone: "profit" },
  { h: 45, tone: "loss" }, { h: 68, tone: "profit" }, { h: 55, tone: "profit" },
];

export function ReplayMockup() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref}>
      <BrowserFrame url="app.mndjournal.com/trades/xauusd-2401">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Historical candles — XAU/USD</div>
          <div className="text-xs text-[#7d879e]">M5 · 18 candles</div>
        </div>

        <div className="relative mt-4 h-32 overflow-hidden rounded-lg border border-[#2a3245] bg-[#141820]">
          <div className="absolute inset-0 flex items-end gap-1.5 p-3">
            {CANDLES.map((candle, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all duration-500 ease-out ${
                  candle.tone === "profit" ? "bg-[#4d8dff]" : "bg-[#e05555]"
                }`}
                style={{
                  height: inView ? `${candle.h}%` : "4%",
                  opacity: inView ? 1 : 0.25,
                  transitionDelay: `${i * 60}ms`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#2a3245] bg-[#141820] text-[#9aa4b8]"
            aria-hidden="true"
            tabIndex={-1}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#4d8dff] text-white"
            aria-hidden="true"
            tabIndex={-1}
          >
            <Pause className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#2a3245] bg-[#141820] text-[#9aa4b8]"
            aria-hidden="true"
            tabIndex={-1}
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
          <div className="ml-1 flex overflow-hidden rounded-md border border-[#2a3245]">
            {["1x", "2x", "4x"].map((speed) => (
              <span
                key={speed}
                className={`px-2.5 py-1 text-xs font-medium ${
                  speed === "2x" ? "bg-[#4d8dff] text-white" : "bg-[#141820] text-[#7d879e]"
                }`}
              >
                {speed}
              </span>
            ))}
          </div>
        </div>

        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#141820]"
          role="img"
          aria-label="Replay scrubber"
        >
          <div
            className="h-full rounded-full bg-[#4d8dff] transition-[width] duration-[1400ms] ease-out"
            style={{ width: inView ? "62%" : "0%" }}
          />
        </div>
      </BrowserFrame>
    </div>
  );
}
