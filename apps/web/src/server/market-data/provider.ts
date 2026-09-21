import type { MarketHistory, Resolution } from "@/lib/market-data";

export interface HistoryRequest {
  symbol: string;
  dataset?: string;
  resolution: Resolution;
  from: number;
  to: number;
  signal?: AbortSignal;
  /** Only the market-csv provider uses this, to scope its dataset lookup. */
  userId?: string;
}

/** Adapters supply data only. Chart rendering and analytics do not depend on an adapter. */
export interface MarketDataProvider {
  id: string;
  name: string;
  environmentKey: string;
  history(request: HistoryRequest, apiKey: string): Promise<MarketHistory>;
  /** userId is only meaningful to the market-csv provider, to scope its dataset lookup. */
  test(apiKey: string, userId?: string): Promise<void>;
}

export class MarketDataError extends Error {}
