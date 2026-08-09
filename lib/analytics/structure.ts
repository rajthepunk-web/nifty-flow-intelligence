import type { SpotQuote, FuturesQuote, VixQuote, MarketStructure, BiasDirection } from '@/lib/types/market';

export function analyzeStructure(spot: SpotQuote, futures: FuturesQuote): MarketStructure {
  const rangeHigh = Math.max(spot.dayHigh, spot.prevClose + 80);
  const rangeLow = Math.min(spot.dayLow, spot.prevClose - 80);
  const rangePosition = (spot.price - rangeLow) / (rangeHigh - rangeLow);

  let trend: BiasDirection = 'neutral';
  if (spot.price > spot.vwap && spot.change > 0) trend = 'bullish';
  else if (spot.price < spot.vwap && spot.change < 0) trend = 'bearish';

  let vwapPosition: 'above' | 'below' | 'at' = 'at';
  if (spot.price > spot.vwap * 1.0008) vwapPosition = 'above';
  else if (spot.price < spot.vwap * 0.9992) vwapPosition = 'below';

  let structureBias: BiasDirection = 'neutral';
  if (trend === 'bullish' && vwapPosition === 'above' && rangePosition > 0.5) structureBias = 'bullish';
  else if (trend === 'bearish' && vwapPosition === 'below' && rangePosition < 0.5) structureBias = 'bearish';

  return {
    trend,
    vwapPosition,
    rangeHigh,
    rangeLow,
    rangePosition,
    supportLevels: [rangeLow, spot.prevClose - 40, spot.vwap - 20],
    resistanceLevels: [rangeHigh, spot.prevClose + 40, spot.vwap + 20],
    structureBias,
  };
}
