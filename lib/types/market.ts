export type OptionType = 'CE' | 'PE';

export type TradingSessionStatus = 'pre-open' | 'open' | 'closed' | 'post-close';

export type MarketRegime =
  | 'trending-up'
  | 'trending-down'
  | 'range-bound'
  | 'volatile'
  | 'transition';

export type VolatilityRegime = 'low' | 'normal' | 'high' | 'extreme';

export type GammaRegime = 'positive-gamma' | 'negative-gamma' | 'neutral-gamma';

export type BiasDirection = 'bullish' | 'bearish' | 'neutral';

export type SetupVerdict = 'TRADE' | 'WATCH' | 'NO TRADE';

export type SetupType = 'CALL' | 'PUT' | 'NONE';

export interface SpotQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  vwap: number;
  timestamp: number;
}

export interface FuturesQuote {
  symbol: string;
  expiry: string;
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
  volume: number;
  openInterest: number;
  oiChange: number;
  premium: number;
  basis: number;
  timestamp: number;
}

export interface VixQuote {
  value: number;
  change: number;
  changePercent: number;
  prevClose: number;
  timestamp: number;
}

export interface OptionStrike {
  strike: number;
  type: OptionType;
  ltp: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  oiChange: number;
  impliedVolatility: number;
  ivChange: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  intrinsicValue: number;
  timeValue: number;
}

export interface OptionsChain {
  underlying: string;
  expiry: string;
  spotPrice: number;
  atmStrike: number;
  strikes: OptionStrike[];
  timestamp: number;
}

export interface GammaProfile {
  strike: number;
  callGamma: number;
  putGamma: number;
  netGamma: number;
  dealerGamma: number;
  cumulativeGamma: number;
}

export interface GammaExposure {
  strikes: GammaProfile[];
  totalDealerGamma: number;
  gammaFlipPoint: number;
  positiveGammaLevels: number[];
  negativeGammaLevels: number[];
  regime: GammaRegime;
  maxPainStrike: number;
}

export interface FlowData {
  strike: number;
  callPremium: number;
  putPremium: number;
  netPremium: number;
  callVolume: number;
  putVolume: number;
  callOi: number;
  putOi: number;
  callOiChange: number;
  putOiChange: number;
  pcr: number;
}

export interface PremiumFlow {
  totalCallPremium: number;
  totalPutPremium: number;
  netPremium: number;
  pcr: number;
  pcrChange: number;
  callWrite: number;
  putWrite: number;
  unwinding: number;
  flowBias: BiasDirection;
  perStrike: FlowData[];
}

export interface MarketStructure {
  trend: BiasDirection;
  vwapPosition: 'above' | 'below' | 'at';
  rangeHigh: number;
  rangeLow: number;
  rangePosition: number;
  supportLevels: number[];
  resistanceLevels: number[];
  structureBias: BiasDirection;
}

export interface RegimeAnalysis {
  marketRegime: MarketRegime;
  volatilityRegime: VolatilityRegime;
  trendStrength: number;
  adx: number;
  atr: number;
  atrPercent: number;
  vixPercentile: number;
  description: string;
}

export interface BiasAssessment {
  marketBias: BiasDirection;
  flowBias: BiasDirection;
  futuresBias: BiasDirection;
  gammaRegime: GammaRegime;
  volatilityRegime: VolatilityRegime;
  structureBias: BiasDirection;
  confidence: number;
  reasons: string[];
}

export interface SetupSignal {
  type: SetupType;
  verdict: SetupVerdict;
  score: number;
  confidence: number;
  entry: number;
  stop: number;
  target: number;
  rrRatio: number;
  rationale: string[];
  conditions: { label: string; met: boolean }[];
}

export interface SetupAssessment {
  overallScore: number;
  primary: SetupSignal;
  verdict: SetupVerdict;
  bias: BiasAssessment;
  regime: RegimeAnalysis;
  gamma: GammaExposure;
  flow: PremiumFlow;
  structure: MarketStructure;
  timestamp: number;
}

export interface MarketSnapshot {
  spot: SpotQuote;
  futures: FuturesQuote;
  vix: VixQuote;
  chain: OptionsChain;
  session: TradingSessionStatus;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  setupType: SetupType;
  verdict: SetupVerdict;
  entry: number;
  exit: number | null;
  stop: number;
  target: number;
  pnl: number | null;
  notes: string;
  bias: BiasDirection;
  score: number;
}

export interface BacktestTrade {
  id: string;
  date: string;
  setupType: SetupType;
  verdict: SetupVerdict;
  entry: number;
  exit: number;
  stop: number;
  target: number;
  pnl: number;
  pnlPercent: number;
  rr: number;
  holdBars: number;
  result: 'win' | 'loss' | 'breakeven';
}

export interface BacktestSummary {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgRr: number;
  maxDrawdown: number;
  profitFactor: number;
  expectancy: number;
  trades: BacktestTrade[];
  equityCurve: { date: string; equity: number }[];
}
