// Shared pieces of the landing page's section style: numbered eyebrow, display heading and
// the angled hand-off between sections. Sections alternate between these two tones.
export const TONE_LIGHT = "#141820";
export const TONE_DARK = "#0b0d13";

export const DISPLAY_H2 =
  "text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-white sm:text-5xl";

export function Eyebrow({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d879e]">
      <span className="font-mono text-[#4d8dff]">{n}</span>
      <span className="h-px w-8 bg-[#2a3245]" />
      {children}
    </p>
  );
}

/**
 * Angled top edge: a wedge in the previous section's tone, with a faint accent hairline along
 * the cut; `low` is the side where the cut sits lower. Place it first inside a `relative`
 * section that has enough top padding to clear it.
 */
export function Slant({ from, low = "left" }: { from: string; low?: "left" | "right" }) {
  const [a, b] = low === "left" ? [10, 0] : [0, 10];
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-0 h-12 w-full sm:h-20"
    >
      <polygon points={`0,0 100,0 100,${b} 0,${a}`} fill={from} />
      <line
        x1="0"
        y1={a}
        x2="100"
        y2={b}
        stroke="#4d8dff"
        strokeOpacity="0.35"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
