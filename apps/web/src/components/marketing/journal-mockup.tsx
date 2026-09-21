"use client";

import { BrowserFrame } from "./browser-frame";
import { useInView } from "./use-in-view";

// Fixed pseudo-random-looking pattern of daily results for the calendar preview.
const DAYS: Array<"profit" | "loss" | "neutral"> = [
  "neutral", "profit", "profit", "loss", "profit", "neutral", "neutral",
  "profit", "profit", "loss", "profit", "profit", "neutral", "profit",
  "loss", "profit", "profit", "profit", "loss", "neutral", "profit",
  "profit", "loss", "profit", "profit", "profit", "neutral", "profit",
];

const TONE_BG: Record<(typeof DAYS)[number], string> = {
  profit: "bg-[#4d8dff]/15 text-[#4d8dff] border-[#4d8dff]/30",
  loss: "bg-[#e05555]/15 text-[#e05555] border-[#e05555]/30",
  neutral: "bg-[#141820] text-[#5b6478] border-[#2a3245]",
};

export function JournalMockup() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="mx-auto max-w-4xl px-4 sm:px-6">
      <BrowserFrame url="app.mndjournal.com/journal">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-white">Jurnal — September 2026</div>
          <div className="text-xs text-[#7d879e]">27 hari trading tercatat</div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAYS.map((tone, i) => (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-md border text-[10px] font-medium sm:text-xs ${TONE_BG[tone]}`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-[#2a3245] pt-4">
          <div className="flex items-center justify-between text-xs text-[#9aa4b8]">
            <span>Progress target bulanan</span>
            <span className="font-medium text-white">72%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#141820]">
            <div
              className="h-full rounded-full bg-[#4d8dff] transition-[width] duration-[1200ms] ease-out"
              style={{ width: inView ? "72%" : "0%" }}
            />
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}
