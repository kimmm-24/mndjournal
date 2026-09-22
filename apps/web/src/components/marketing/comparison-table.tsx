import { Check, Minus } from "lucide-react";
import { COMPARISON, PRICING_TIERS, type FeatureValue } from "@/lib/pricing-data";

function Cell({ value }: { value: FeatureValue }) {
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-[#4a5268]" aria-label="Tidak termasuk" />;
  }
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-[#4d8dff]" aria-label="Termasuk" />;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[#c3cad9]">
      <Check className="h-4 w-4 shrink-0 text-[#4d8dff]" aria-hidden="true" />
      {value}
    </span>
  );
}

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#2a3245]">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#2a3245] bg-[#1c2230]">
            <th scope="col" className="px-4 py-3 font-medium text-[#9aa4b8]">
              Fitur
            </th>
            {PRICING_TIERS.map((tier) => (
              <th
                key={tier.id}
                scope="col"
                className={`px-4 py-3 text-center font-semibold ${
                  tier.highlighted ? "text-[#4d8dff]" : "text-white"
                }`}
              >
                {tier.name}
              </th>
            ))}
          </tr>
        </thead>
        {COMPARISON.map((group) => (
          <tbody key={group.title}>
            <tr className="border-b border-[#2a3245] bg-[#141820]">
              <th
                scope="colgroup"
                colSpan={PRICING_TIERS.length + 1}
                className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#7d879e]"
              >
                {group.title}
              </th>
            </tr>
            {group.rows.map((row) => (
              <tr key={row.label} className="border-b border-[#2a3245] last:border-0">
                <td className="px-4 py-3 text-[#c3cad9]">{row.label}</td>
                {PRICING_TIERS.map((tier) => (
                  <td key={tier.id} className="px-4 py-3 text-center">
                    <Cell value={row.values[tier.id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
