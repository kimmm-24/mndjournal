import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#141820] pb-32 pt-16 sm:pb-44 sm:pt-24">
      {/* Faint grid, faded out toward the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(154,164,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(154,164,184,0.07) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 30% 20%, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 30% 20%, black 20%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[560px] w-[760px] opacity-60"
        style={{
          background: "radial-gradient(closest-side, rgba(77,141,255,0.22), rgba(20,24,32,0))",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d879e]">
          <span className="h-px w-8 bg-[#4d8dff]" />
          AI trading journal untuk trader Indonesia
        </p>

        <h1 className="mt-6 max-w-5xl text-5xl font-extrabold leading-[0.95] tracking-[-0.035em] text-white sm:text-7xl lg:text-[5.5rem]">
          Berhenti Menebak. <br className="hidden sm:block" />
          Biarkan AI Membongkar{" "}
          <span className="bg-linear-to-r from-[#4d8dff] to-[#9cc0ff] bg-clip-text text-transparent">
            Pola Trading Anda
          </span>
          .
        </h1>

        <div className="mt-10 flex flex-col gap-8 border-t border-[#2a3245] pt-8 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-xl text-base text-[#9aa4b8] sm:text-lg">
            AI yang membaca histori trading Anda sendiri — recap harian, review tiap trade, dan
            tanya jawab langsung dari data Anda. Untuk semua instrumen: saham, forex, futures,
            crypto, gold, dan lainnya.
          </p>

          <div className="shrink-0">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#4d8dff] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4d8dff]/25 transition-colors hover:bg-[#3d7aef] sm:w-auto"
              >
                Daftar Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#fitur"
                className="inline-flex w-full items-center justify-center rounded-lg border border-[#2a3245] bg-[#1c2230] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#242c40] sm:w-auto"
              >
                Lihat Fitur
              </a>
            </div>
            <p className="mt-4 text-sm text-[#7d879e]">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-medium text-[#4d8dff] hover:underline">
                Masuk →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
