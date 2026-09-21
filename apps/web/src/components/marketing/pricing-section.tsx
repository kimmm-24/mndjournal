import Link from "next/link";
import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Starter",
    price: "Rp 49.000",
    period: "/bulan",
    description: "Untuk trader yang baru mulai membangun kebiasaan journaling.",
    features: [
      "Trade terbatas (hingga 50/bulan)",
      "Dashboard & analytics dasar",
      "Kalender jurnal harian",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Rp 99.000",
    period: "/bulan",
    description: "Untuk trader aktif yang ingin analisa dan refleksi penuh.",
    features: [
      "Unlimited trades",
      "Dashboard & analytics penuh, termasuk performance trends",
      "AI reflection setelah setiap sesi",
      "Import CSV & sinkronisasi broker",
      "Playbooks & strategy library",
      "1 akun prop firm",
    ],
    highlighted: true,
  },
  {
    name: "Elite / Prop Trader",
    price: "Rp 199.000",
    period: "/bulan",
    description: "Untuk trader prop firm yang mengelola banyak akun.",
    features: [
      "Semua fitur di Pro",
      "Multi-akun prop firm tanpa batas",
      "Export laporan",
      "Kuota AI reflection lebih banyak",
    ],
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="harga" className="scroll-mt-16 bg-[#141820] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Harga</h2>
          <p className="mt-3 text-[#9aa4b8]">
            Mulai gratis, upgrade kapan saja. Harga bulanan, tanpa kontrak jangka panjang.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl border p-6 ${
                tier.highlighted
                  ? "border-[#4d8dff] bg-[#1c2230] ring-1 ring-[#4d8dff]/40"
                  : "border-[#2a3245] bg-[#1c2230]"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full bg-[#4d8dff] px-3 py-1 text-[11px] font-semibold text-white">
                  Paling Populer
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-white">{tier.price}</span>
                <span className="text-sm text-[#7d879e]">{tier.period}</span>
              </div>
              <p className="mt-2 text-sm text-[#9aa4b8]">{tier.description}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-[#c3cad9]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4d8dff]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`mt-7 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  tier.highlighted
                    ? "bg-[#4d8dff] text-white hover:bg-[#3d7aef]"
                    : "border border-[#2a3245] bg-[#141820] text-white hover:bg-[#242c40]"
                }`}
              >
                Mulai dengan {tier.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
