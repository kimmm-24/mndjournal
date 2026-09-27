import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TRIAL_DAYS } from "@/lib/plan";
import { Eyebrow, Slant, TONE_DARK } from "./section-chrome";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#141820] pb-24 pt-32 sm:pb-32 sm:pt-44">
      {/* Same faint grid and glow as the hero, so the page closes where it opened. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(154,164,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(154,164,184,0.07) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 70% at 70% 70%, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 70% at 70% 70%, black 20%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[560px] w-[760px] opacity-60"
        style={{
          background: "radial-gradient(closest-side, rgba(77,141,255,0.22), rgba(20,24,32,0))",
        }}
      />
      <Slant from={TONE_DARK} low="right" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Eyebrow n="08">Mulai</Eyebrow>
        <h2 className="mt-6 max-w-4xl text-5xl font-extrabold leading-[0.95] tracking-[-0.035em] text-white sm:text-7xl">
          Mulai Journaling Trading Anda Hari Ini
        </h2>
        <div className="mt-10 flex flex-col gap-6 border-t border-[#2a3245] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#9aa4b8] sm:text-lg">
            Coba gratis {TRIAL_DAYS} hari dengan fitur Pro. Tidak perlu kartu kredit.
          </p>
          <Link
            href="/signup"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#4d8dff] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#4d8dff]/25 transition-colors hover:bg-[#3d7aef]"
          >
            Daftar Gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
