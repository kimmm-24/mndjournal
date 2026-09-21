import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#141820] pb-20 pt-20 sm:pt-28">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(77,141,255,0.18) 0%, rgba(20,24,32,0) 70%)",
        }}
      />
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <span className="inline-flex items-center rounded-full border border-[#2a3245] bg-[#1c2230] px-3.5 py-1.5 text-xs font-medium text-[#9aa4b8]">
          Dibuat khusus untuk trader Gold/XAU Indonesia
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Catat dan Tingkatkan Performa Trading{" "}
          <span className="text-[#4d8dff]">XAU/USD</span> Anda
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base text-[#9aa4b8] sm:text-lg">
          Jurnal trading yang dirancang khusus untuk trader gold harian — catat setiap posisi,
          pahami pola kemenangan Anda, dan perbaiki strategi dengan data, bukan tebakan.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#4d8dff] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3d7aef] sm:w-auto"
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

        <p className="mt-5 text-sm text-[#7d879e]">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-[#4d8dff] hover:underline">
            Masuk →
          </Link>
        </p>
      </div>
    </section>
  );
}
