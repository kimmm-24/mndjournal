import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="bg-[#0e1119] py-20 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Mulai Journaling Trading Anda Hari Ini
        </h2>
        <p className="mt-3 text-[#9aa4b8]">
          Gratis untuk mulai. Tidak perlu kartu kredit.
        </p>
        <div className="mt-8">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#4d8dff] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#3d7aef]"
          >
            Daftar Gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
