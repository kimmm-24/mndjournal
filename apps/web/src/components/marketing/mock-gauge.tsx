"use client";

import { CountUp } from "./count-up";

/** Mirrors components/charts/gauge.tsx's semicircle arc for marketing mockups. */
export function MockGauge({
  active,
  value,
  size = 76,
}: {
  active: boolean;
  value: number;
  size?: number;
}) {
  const radius = size / 2 - 5;
  const circumference = Math.PI * radius;
  const ratio = Math.min(Math.max(value, 0), 1);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 6} viewBox={`0 0 ${size} ${size / 2 + 6}`}>
        <path
          d={`M 5 ${size / 2 + 1} A ${radius} ${radius} 0 0 1 ${size - 5} ${size / 2 + 1}`}
          fill="none"
          stroke="#2a3245"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <path
          d={`M 5 ${size / 2 + 1} A ${radius} ${radius} 0 0 1 ${size - 5} ${size / 2 + 1}`}
          fill="none"
          stroke="#4d8dff"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          className="transition-[stroke-dasharray] duration-1000 ease-out"
          style={!active ? { strokeDasharray: `0 ${circumference}` } : undefined}
        />
      </svg>
      <div className="-mt-3.5 text-sm font-semibold text-white tnum">
        <CountUp active={active} value={value * 100} decimals={1} suffix="%" />
      </div>
    </div>
  );
}
