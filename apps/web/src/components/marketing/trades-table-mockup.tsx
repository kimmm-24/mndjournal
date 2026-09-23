import { BrowserFrame } from "./browser-frame";

const ROWS = [
  { date: "2026-09-17", symbol: "AAPL", dir: "long", status: "loss", netPnl: "-$141.42" },
  { date: "2026-09-17", symbol: "NVDA", dir: "long", status: "loss", netPnl: "-$43.32" },
  { date: "2026-09-13", symbol: "ETH/USD", dir: "long", status: "win", netPnl: "+$217.44" },
  { date: "2026-09-11", symbol: "XAU/USD", dir: "short", status: "win", netPnl: "+$99.11" },
];

export function TradesTableMockup() {
  return (
    <BrowserFrame url="app.mndjournal.com/trades">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Trades</span>
        <span className="text-[11px] text-[#7d879e]">110 trades diimpor</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="text-[#7d879e]">
            <tr>
              {["Close date", "Symbol", "Status", "Net P&L"].map((h) => (
                <th key={h} className="border-b border-[#2a3245] px-2 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={`${row.date}-${row.symbol}`}>
                <td className="border-b border-[#2a3245] px-2 py-2 text-[#c3cad9]">{row.date}</td>
                <td className="border-b border-[#2a3245] px-2 py-2 text-white">
                  {row.symbol} <span className="text-[#7d879e]">{row.dir}</span>
                </td>
                <td className="border-b border-[#2a3245] px-2 py-2">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                      row.status === "win"
                        ? "bg-[#4d8dff]/15 text-[#4d8dff]"
                        : "bg-[#e05555]/15 text-[#e05555]"
                    }`}
                  >
                    {row.status === "win" ? "WIN" : "LOSS"}
                  </span>
                </td>
                <td
                  className={`border-b border-[#2a3245] px-2 py-2 font-medium tabular-nums ${
                    row.status === "win" ? "text-[#4d8dff]" : "text-[#e05555]"
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
