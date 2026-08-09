import type {
  BiasAssessment,
  FuturesQuote,
  GammaExposure,
  MarketStructure,
  PremiumFlow,
  RegimeAnalysis,
  SpotQuote,
} from '@/lib/types/market';

export function assessBias(
  spot: SpotQuote,
  futures: FuturesQuote,
  flow: PremiumFlow,
  gamma: GammaExposure,
  regime: RegimeAnalysis,
  structure: MarketStructure
): BiasAssessment {
  const marketBias = structure.structureBias;
  const futuresBias = futures.change > 0 && futures.oiChange > 0
    ? 'bullish'
    : futures.change < 0 && futures.oiChange > 0
    ? 'bearish'
    : 'neutral';
  const gammaRegime = gamma.regime;

  const weights = { bullish: 1, bearish: -1, neutral: 0 } as const;
  const score = weights[marketBias] * 0.3 + weights[flow.flowBias] * 0.25 + weights[futuresBias] * 0.25 +
    (gammaRegime === 'positive-gamma' ? 0.1 : gammaRegime === 'negative-gamma' ? -0.1 : 0) +
    (regime.marketRegime === 'trending-up' ? 0.1 : regime.marketRegime === 'trending-down' ? -0.1 : 0);

  const overallBias = score > 0.18 ? 'bullish' : score < -0.18 ? 'bearish' : 'neutral';
  const reasons: string[] = [];
  if (spot.price > spot.vwap) reasons.push('Spot is holding above VWAP');
  else reasons.push('Spot is trading below VWAP');
  if (futures.oiChange > 0) reasons.push(`${futures.change >= 0 ? 'Long' : 'Short'} build-up in futures`);
  if (flow.pcr > 1) reasons.push('Put open interest dominates calls');
  if (flow.pcr < 0.9) reasons.push('Call open interest dominates puts');
  reasons.push(gammaRegime === 'positive-gamma' ? 'Positive dealer gamma may dampen movement' : gammaRegime === 'negative-gamma' ? 'Negative dealer gamma may amplify movement' : 'Gamma exposure is balanced');

  return {
    marketBias: overallBias,
    flowBias: flow.flowBias,
    futuresBias,
    gammaRegime,
    volatilityRegime: regime.volatilityRegime,
    structureBias: structure.structureBias,
    confidence: Math.min(95, Math.round(52 + Math.abs(score) * 150)),
    reasons,
  };
}
