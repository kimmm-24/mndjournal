import Link from "next/link";
import { Check } from "lucide-react";
import { formatRupiah, PRICING_TIERS } from "@/lib/pricing-data";

export function PricingCards({ billing }: { billing: "monthly" | "yearly" }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PRICING_TIERS.map((tier) => {
        const price = billing === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
        const period = billing === "monthly" ? "/bulan" : "/tahun";
        return (
          <div
            key={tier.id}
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
              <span className="text-3xl font-bold tracking-tight text-white">
                {formatRupiah(price)}
              </span>
              <span className="text-sm text-[#7d879e]">{period}</span>
            </div>
            <p className="mt-2 text-sm text-[#9aa4b8]">{tier.description}</p>

            <ul className="mt-6 flex-1 space-y-3">
              {tier.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-sm text-[#c3cad9]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4d8dff]" />
                  <span>{bullet}</span>
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
        );
      })}
    </div>
  );
}
