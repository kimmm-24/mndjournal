import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PricingCards } from "./pricing-cards";
import { TRIAL_DAYS } from "@/lib/plan";
import { DISPLAY_H2, Eyebrow, Slant, TONE_LIGHT } from "./section-chrome";

export function PricingTeaser() {
  return (
    <section
      id="harga"
      className="relative scroll-mt-16 bg-[#0b0d13] pb-20 pt-28 sm:pb-28 sm:pt-36"
    >
      <Slant from={TONE_LIGHT} low="left" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow n="07">Paket</Eyebrow>
            <h2 className={`mt-5 ${DISPLAY_H2}`}>Harga</h2>
          </div>
          <p className="text-[#9aa4b8] lg:col-span-5">
            Coba gratis {TRIAL_DAYS} hari, lalu pilih paket. Bayar bulanan atau tahunan, tanpa
            perpanjangan otomatis.
          </p>
        </div>

        <div className="mt-14">
          <PricingCards billing="monthly" />
        </div>

        <div className="mt-8">
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
