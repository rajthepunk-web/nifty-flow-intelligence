import type { OptionsChain, GammaExposure, GammaProfile, GammaRegime } from '@/lib/types/market';

const CONTRACT_SIZE = 75;
const SPOT_REF = 24200;

export function analyzeGamma(chain: OptionsChain): GammaExposure {
  const profiles: GammaProfile[] = [];
  let cumulative = 0;
  const sorted = [...chain.strikes].sort((a, b) => a.strike - b.strike);

  for (const strike of new Set(sorted.map((s) => s.strike))) {
    const call = chain.strikes.find((s) => s.strike === strike && s.type === 'CE');
    const put = chain.strikes.find((s) => s.strike === strike && s.type === 'PE');
    if (!call || !put) continue;

    const callGamma = call.gamma * call.openInterest * CONTRACT_SIZE * SPOT_REF * 0.01;
    const putGamma = put.gamma * put.openInterest * CONTRACT_SIZE * SPOT_REF * 0.01;
    const dealerGamma = callGamma - putGamma;
    cumulative += dealerGamma;

    profiles.push({
      strike,
      callGamma,
      putGamma,
      netGamma: callGamma - putGamma,
      dealerGamma,
      cumulativeGamma: cumulative,
    });
  }

  const totalDealerGamma = profiles.reduce((sum, p) => sum + p.dealerGamma, 0);
  const gammaFlipPoint = findFlipPoint(profiles, chain.spotPrice);
  const positiveGammaLevels = profiles.filter((p) => p.dealerGamma > 0).map((p) => p.strike);
  const negativeGammaLevels = profiles.filter((p) => p.dealerGamma < 0).map((p) => p.strike);

  const regime: GammaRegime = totalDealerGamma > 1.5e9
    ? 'positive-gamma'
    : totalDealerGamma < -1.5e9
    ? 'negative-gamma'
    : 'neutral-gamma';

  return {
    strikes: profiles,
    totalDealerGamma,
    gammaFlipPoint,
    positiveGammaLevels,
    negativeGammaLevels,
    regime,
    maxPainStrike: computeMaxPain(chain),
  };
}

function findFlipPoint(profiles: GammaProfile[], spot: number): number {
  let prev = profiles[0];
  for (const p of profiles) {
    if ((prev.cumulativeGamma < 0 && p.cumulativeGamma >= 0) ||
        (prev.cumulativeGamma > 0 && p.cumulativeGamma <= 0)) {
      const t = Math.abs(prev.cumulativeGamma) /
        (Math.abs(prev.cumulativeGamma) + Math.abs(p.cumulativeGamma));
      return prev.strike + (p.strike - prev.strike) * t;
    }
    prev = p;
  }
  return spot;
}

function computeMaxPain(chain: OptionsChain): number {
  const strikes = Array.from(new Set(chain.strikes.map((s) => s.strike))).sort((a, b) => a - b);
  let minPain = Infinity;
  let maxPainStrike = chain.atmStrike;
  for (const expiryStrike of strikes) {
    let pain = 0;
    for (const s of strikes) {
      const call = chain.strikes.find((x) => x.strike === s && x.type === 'CE');
      const put = chain.strikes.find((x) => x.strike === s && x.type === 'PE');
      if (!call || !put) continue;
      if (expiryStrike > s) pain += (expiryStrike - s) * call.openInterest;
      if (expiryStrike < s) pain += (s - expiryStrike) * put.openInterest;
    }
    if (pain < minPain) {
      minPain = pain;
      maxPainStrike = expiryStrike;
    }
  }
  return maxPainStrike;
}
