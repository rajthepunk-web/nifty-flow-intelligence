import type { SetupAssessment, SetupSignal, SetupType } from '@/lib/types/market';
import { assessBias } from './bias';
import { analyzeFlow } from './flow';
import { analyzeGamma } from './gamma';
import { analyzeRegime } from './regime';
import { analyzeStructure } from './structure';
import type { MarketSnapshot } from '@/lib/types/market';

export function analyzeSnapshot(snapshot: MarketSnapshot): SetupAssessment {
  const flow = analyzeFlow(snapshot.chain);
  const gamma = analyzeGamma(snapshot.chain);
  const regime = analyzeRegime(snapshot.spot, snapshot.vix);
  const structure = analyzeStructure(snapshot.spot, snapshot.futures);
  const bias = assessBias(snapshot.spot, snapshot.futures, flow, gamma, regime, structure);
  const primary = buildSetup(snapshot, bias, flow, gamma, regime, structure);

  return {
    overallScore: primary.score,
    primary,
    verdict: primary.verdict,
    bias,
    regime,
    gamma,
    flow,
    structure,
    timestamp: snapshot.timestamp,
  };
}

function buildSetup(
  snapshot: MarketSnapshot,
  bias: SetupAssessment['bias'],
  flow: SetupAssessment['flow'],
  gamma: SetupAssessment['gamma'],
  regime: SetupAssessment['regime'],
  structure: SetupAssessment['structure']
): SetupSignal {
  const aligned = [
    bias.marketBias !== 'neutral',
    bias.flowBias === bias.marketBias,
    bias.futuresBias === bias.marketBias,
    bias.structureBias === bias.marketBias,
    regime.marketRegime === 'trending-up' || regime.marketRegime === 'trending-down',
    regime.volatilityRegime !== 'extreme',
  ];
  const score = Math.round(35 + (aligned.filter(Boolean).length / aligned.length) * 58);
  const isTradeable = score >= 72 && regime.volatilityRegime !== 'extreme';
  const isWatch = score >= 55;
  const type: SetupType = bias.marketBias === 'bullish' ? 'CALL' : bias.marketBias === 'bearish' ? 'PUT' : 'NONE';
  const verdict = isTradeable ? 'TRADE' : isWatch ? 'WATCH' : 'NO TRADE';
  const entry = snapshot.spot.price;
  const range = regime.atr;
  const stop = type === 'CALL' ? entry - range * 0.65 : entry + range * 0.65;
  const target = type === 'CALL' ? entry + range * 1.15 : entry - range * 1.15;
  const rrRatio = Math.abs(target - entry) / Math.abs(entry - stop);

  return {
    type,
    verdict,
    score,
    confidence: Math.min(92, Math.round(score * 0.88)),
    entry,
    stop,
    target,
    rrRatio,
    rationale: [
      regime.description,
      gamma.regime === 'positive-gamma' ? 'Positive gamma suggests movement may stay contained.' : 'Gamma profile allows for faster directional movement.',
      flow.flowBias === 'neutral' ? 'Premium flow is mixed; no clear options-side dominance.' : `${flow.flowBias === 'bullish' ? 'Put' : 'Call'} side is showing stronger premium flow.`,
    ],
    conditions: [
      { label: 'Market regime supports directional trade', met: regime.marketRegime === 'trending-up' || regime.marketRegime === 'trending-down' },
      { label: 'Options flow confirms direction', met: bias.flowBias === bias.marketBias && bias.marketBias !== 'neutral' },
      { label: 'Futures positioning confirms direction', met: bias.futuresBias === bias.marketBias && bias.marketBias !== 'neutral' },
      { label: 'Spot structure is aligned', met: structure.structureBias === bias.marketBias && bias.marketBias !== 'neutral' },
      { label: 'Volatility is not extreme', met: regime.volatilityRegime !== 'extreme' },
    ],
  };
}
