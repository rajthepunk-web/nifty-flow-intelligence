import type {
  MarketSnapshot,
  OptionsChain,
  SpotQuote,
  FuturesQuote,
  VixQuote,
  OptionStrike,
  OptionType,
  TradingSessionStatus,
} from '@/lib/types/market';
import type { MarketDataService } from './market-data-service';

const SPOT_BASE = 24180;
const FUTURES_BASE = 24215;
const VIX_BASE = 13.4;
const ATM_STRIKE = 24200;
const STRIKE_STEP = 50;
const NUM_STRIKES = 21;

function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function jitter(base: number, pct: number): number {
  return base * (1 + (gaussian() * pct) / 100);
}

function getSessionStatus(date: Date): TradingSessionStatus {
  const ist = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();
  if (day === 0 || day === 6) return 'closed';
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  if (minutes >= 555 && minutes < 570) return 'pre-open';
  if (minutes >= 570 && minutes < 930) return 'open';
  if (minutes >= 930 && minutes < 945) return 'post-close';
  return 'closed';
}

function buildSpot(): SpotQuote {
  const price = jitter(SPOT_BASE, 0.18);
  const prevClose = SPOT_BASE - 42;
  const change = price - prevClose;
  return {
    symbol: 'NIFTY 50',
    price,
    change,
    changePercent: (change / prevClose) * 100,
    prevClose,
    dayHigh: Math.max(price, SPOT_BASE + 35),
    dayLow: Math.min(price, SPOT_BASE - 55),
    vwap: price - (change / 2.3),
    timestamp: Date.now(),
  };
}

function buildFutures(spot: SpotQuote): FuturesQuote {
  const price = jitter(FUTURES_BASE, 0.2);
  const prevClose = FUTURES_BASE - 38;
  const change = price - prevClose;
  return {
    symbol: 'NIFTY FUT',
    expiry: '28-Nov-2024',
    price,
    change,
    changePercent: (change / prevClose) * 100,
    prevClose,
    volume: 48_250_000 + Math.floor(Math.random() * 8_000_000),
    openInterest: 12_840_000 + Math.floor(Math.random() * 600_000),
    oiChange: 125_000 + Math.floor(Math.random() * 80_000),
    premium: price - spot.price,
    basis: ((price - spot.price) / spot.price) * 100,
    timestamp: Date.now(),
  };
}

function buildVix(): VixQuote {
  const value = jitter(VIX_BASE, 2.4);
  const prevClose = VIX_BASE - 0.6;
  const change = value - prevClose;
  return {
    value,
    change,
    changePercent: (change / prevClose) * 100,
    prevClose,
    timestamp: Date.now(),
  };
}

function bsDelta(spot: number, strike: number, type: OptionType, iv: number, t: number): number {
  const d1 = (Math.log(spot / strike) + (0.05 + (iv * iv) / 2) * t) / (iv * Math.sqrt(t));
  const nd1 = 0.5 * (1 + erf(d1 / Math.sqrt(2)));
  return type === 'CE' ? nd1 : nd1 - 1;
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function bsGamma(spot: number, strike: number, iv: number, t: number): number {
  const d1 = (Math.log(spot / strike) + (0.05 + (iv * iv) / 2) * t) / (iv * Math.sqrt(t));
  return Math.exp(-d1 * d1 / 2) / (spot * iv * Math.sqrt(2 * Math.PI * t));
}

function bsTheta(spot: number, strike: number, type: OptionType, iv: number, t: number): number {
  const d1 = (Math.log(spot / strike) + (0.05 + (iv * iv) / 2) * t) / (iv * Math.sqrt(t));
  const d2 = d1 - iv * Math.sqrt(t);
  const term = -(spot * Math.exp(-d1 * d1 / 2) * iv) / (2 * Math.sqrt(2 * Math.PI * t));
  return type === 'CE'
    ? term - 0.05 * strike * Math.exp(-0.05 * t) * (0.5 * (1 + erf(d2 / Math.sqrt(2))))
    : term + 0.05 * strike * Math.exp(-0.05 * t) * (0.5 * (1 - erf(d2 / Math.sqrt(2))));
}

function bsVega(spot: number, strike: number, iv: number, t: number): number {
  const d1 = (Math.log(spot / strike) + (0.05 + (iv * iv) / 2) * t) / (iv * Math.sqrt(t));
  return spot * Math.sqrt(t) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI) * 0.01;
}

function buildStrike(strike: number, type: OptionType, spot: number, atm: number): OptionStrike {
  const distance = Math.abs(strike - atm) / STRIKE_STEP;
  const iv = 11.5 + distance * 0.45 + (Math.random() - 0.5) * 0.8;
  const t = 6 / 365;
  const intrinsic = type === 'CE' ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
  const delta = bsDelta(spot, strike, type, iv / 100, t);
  const gamma = bsGamma(spot, strike, iv / 100, t);
  const theta = bsTheta(spot, strike, type, iv / 100, t);
  const vega = bsVega(spot, strike, iv / 100, t);
  const timeValue = Math.max(2, Math.abs(delta) * (atm - strike) * 0.4 + 18 - distance * 1.6);
  const ltp = intrinsic + timeValue;
  const prevLtp = ltp - (Math.random() - 0.45) * 6;
  const oiBase = Math.max(0, 1_800_000 - distance * 95_000);
  return {
    strike,
    type,
    ltp,
    change: ltp - prevLtp,
    changePercent: prevLtp > 0 ? ((ltp - prevLtp) / prevLtp) * 100 : 0,
    volume: Math.floor(oiBase * (0.4 + Math.random() * 0.6)),
    openInterest: Math.floor(oiBase * (0.8 + Math.random() * 0.5)),
    oiChange: Math.floor((Math.random() - 0.35) * oiBase * 0.18),
    impliedVolatility: iv,
    ivChange: (Math.random() - 0.5) * 1.2,
    delta,
    gamma,
    theta,
    vega,
    intrinsicValue: intrinsic,
    timeValue,
  };
}

function buildOptionsChain(spot: SpotQuote): OptionsChain {
  const atm = ATM_STRIKE;
  const strikes: OptionStrike[] = [];
  const start = atm - ((NUM_STRIKES - 1) / 2) * STRIKE_STEP;
  for (let i = 0; i < NUM_STRIKES; i++) {
    const strike = start + i * STRIKE_STEP;
    strikes.push(buildStrike(strike, 'CE', spot.price, atm));
    strikes.push(buildStrike(strike, 'PE', spot.price, atm));
  }
  return {
    underlying: 'NIFTY 50',
    expiry: '28-Nov-2024',
    spotPrice: spot.price,
    atmStrike: atm,
    strikes,
    timestamp: Date.now(),
  };
}

export class MockMarketDataService implements MarketDataService {
  private listeners = new Set<(s: MarketSnapshot) => void>();
  private interval: ReturnType<typeof setInterval> | null = null;

  async getSnapshot(): Promise<MarketSnapshot> { return this.current(); }
  async getSpot(): Promise<SpotQuote> { return (await this.current()).spot; }
  async getFutures(): Promise<FuturesQuote> { return (await this.current()).futures; }
  async getVix(): Promise<VixQuote> { return (await this.current()).vix; }
  async getOptionsChain(): Promise<OptionsChain> { return (await this.current()).chain; }

  subscribe(cb: (snapshot: MarketSnapshot) => void): () => void {
    this.listeners.add(cb);
    if (!this.interval) {
      this.interval = setInterval(() => {
        const snap = this.current();
        this.listeners.forEach((l) => l(snap));
      }, 4000);
    }
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0 && this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    };
  }

  private current(): MarketSnapshot {
    const spot = buildSpot();
    const futures = buildFutures(spot);
    const vix = buildVix();
    const chain = buildOptionsChain(spot);
    return { spot, futures, vix, chain, session: getSessionStatus(new Date()), timestamp: Date.now() };
  }
}

export const mockMarketDataService = new MockMarketDataService();
