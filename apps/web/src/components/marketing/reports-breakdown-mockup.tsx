import { BrowserFrame } from "./browser-frame";

const ROWS = [
  { symbol: "XAU/USD", trades: 42, winRate: "58.1%", netPnl: "+$3,210.40", positive: true },
  { symbol: "NVDA", trades: 18, winRate: "50.0%", netPnl: "+$612.80", positive: true },
  { symbol: "EUR/USD", trades: 15, winRate: "46.7%", netPnl: "-$284.10", positive: false },
  { symbol: "BTC/USD", trades: 9, winRate: "66.7%", netPnl: "+$1,404.20", positive: true },
];

export function ReportsBreakdownMockup() {
  return (
    <BrowserFrame url="app.mndjournal.com/reports">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Breakdown — by Symbol</span>
        <span className="text-[11px] text-[#7d879e]">19 dimensi tersedia</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="text-[#7d879e]">
            <tr>
              {["Symbol", "Trades", "Win %", "Net P&L"].map((h) => (
                <th key={h} className="border-b border-[#2a3245] px-2 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.symbol}>
                <td className="border-b border-[#2a3245] px-2 py-2 text-white">{row.symbol}</td>
                <td className="border-b border-[#2a3245] px-2 py-2 text-[#c3cad9]">{row.trades}</td>
                <td className="border-b border-[#2a3245] px-2 py-2 text-[#c3cad9]">{row.winRate}</td>
                <td
                  className={`border-b border-[#2a3245] px-2 py-2 font-medium tabular-nums ${
                    row.positive ? "text-[#4d8dff]" : "text-[#e05555]"
                  }`}
                >
                  {row.netPnl}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BrowserFrame>
  );
}
