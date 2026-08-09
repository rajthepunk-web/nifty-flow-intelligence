import type { SpotQuote, VixQuote, MarketRegime, VolatilityRegime, RegimeAnalysis } from '@/lib/types/market';

export function analyzeRegime(spot: SpotQuote, vix: VixQuote): RegimeAnalysis {
  const range = spot.dayHigh - spot.dayLow;
  const atr = Math.max(range, 40);
  const atrPercent = (atr / spot.price) * 100;
  const adx = 18 + Math.abs(spot.changePercent) * 2.4 + (vix.value > 16 ? 6 : 0);
  const vixPercentile = Math.min(100, Math.max(0, ((vix.value - 9) / (28 - 9)) * 100));

  let volatilityRegime: VolatilityRegime = 'normal';
  if (vix.value < 11) volatilityRegime = 'low';
  else if (vix.value < 16) volatilityRegime = 'normal';
  else if (vix.value < 22) volatilityRegime = 'high';
  else volatilityRegime = 'extreme';

  let marketRegime: MarketRegime = 'range-bound';
  const trendStrength = Math.min(100, Math.abs(spot.changePercent) * 12 + adx * 0.8);
  if (adx > 25 && spot.changePercent > 0.15) marketRegime = 'trending-up';
  else if (adx > 25 && spot.changePercent < -0.15) marketRegime = 'trending-down';
  else if (vix.value > 18 && atrPercent > 1.1) marketRegime = 'volatile';
  else if (adx > 20 && adx < 25) marketRegime = 'transition';

  const descriptions: Record<MarketRegime, string> = {
    'trending-up': 'Directional up-move with expanding range. Trend-following favored.',
    'trending-down': 'Directional down-move with expanding range. Trend-following favored.',
    'range-bound': 'Consolidation. Mean-reversion near extremes favored.',
    'volatile': 'Elevated volatility. Reduce size, widen stops, prefer premium-selling.',
    'transition': 'Regime shift in progress. Wait for confirmation before committing.',
  };

  return {
    marketRegime,
    volatilityRegime,
    trendStrength,
    adx,
    atr,
    atrPercent,
    vixPercentile,
    description: descriptions[marketRegime],
  };
}
