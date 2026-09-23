import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PricingCards } from "./pricing-cards";
import { TRIAL_DAYS } from "@/lib/plan";

export function PricingTeaser() {
  return (
    <section id="harga" className="scroll-mt-16 bg-[#141820] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Harga</h2>
          <p className="mt-3 text-[#9aa4b8]">
            Coba gratis {TRIAL_DAYS} hari, lalu pilih paket. Bayar bulanan atau tahunan, tanpa
            perpanjangan otomatis.
          </p>
        </div>

        <div className="mt-14">
          <PricingCards billing="monthly" />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4d8dff] hover:underline"
          >
            Lihat perbandingan lengkap
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
