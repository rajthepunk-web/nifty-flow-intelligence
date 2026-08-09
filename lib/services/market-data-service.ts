import type {
  MarketSnapshot,
  OptionsChain,
  SpotQuote,
  FuturesQuote,
  VixQuote,
} from '@/lib/types/market';

export interface MarketDataService {
  getSnapshot(): Promise<MarketSnapshot>;
  getSpot(): Promise<SpotQuote>;
  getFutures(): Promise<FuturesQuote>;
  getVix(): Promise<VixQuote>;
  getOptionsChain(expiry?: string): Promise<OptionsChain>;
  subscribe(cb: (snapshot: MarketSnapshot) => void): () => void;
}

export const MARKET_DATA_SERVICE = Symbol('MarketDataService');
