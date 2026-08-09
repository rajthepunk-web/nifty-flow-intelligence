import type { OptionsChain, PremiumFlow, FlowData, BiasDirection } from '@/lib/types/market';

export function analyzeFlow(chain: OptionsChain): PremiumFlow {
  const perStrike: FlowData[] = [];
  let totalCallPremium = 0;
  let totalPutPremium = 0;
  let totalCallVol = 0;
  let totalPutVol = 0;
  let totalCallOi = 0;
  let totalPutOi = 0;
  let totalCallOiChange = 0;
  let totalPutOiChange = 0;

  const strikes = Array.from(new Set(chain.strikes.map((s) => s.strike))).sort((a, b) => a - b);
  for (const strike of strikes) {
    const call = chain.strikes.find((s) => s.strike === strike && s.type === 'CE');
    const put = chain.strikes.find((s) => s.strike === strike && s.type === 'PE');
    if (!call || !put) continue;

    const callPremium = call.ltp * call.volume;
    const putPremium = put.ltp * put.volume;
    const netPremium = callPremium - putPremium;
    const pcr = call.openInterest > 0 ? put.openInterest / call.openInterest : 0;

    totalCallPremium += callPremium;
    totalPutPremium += putPremium;
    totalCallVol += call.volume;
    totalPutVol += put.volume;
    totalCallOi += call.openInterest;
    totalPutOi += put.openInterest;
    totalCallOiChange += call.oiChange;
    totalPutOiChange += put.oiChange;

    perStrike.push({
      strike,
      callPremium,
      putPremium,
      netPremium,
      callVolume: call.volume,
      putVolume: put.volume,
      callOi: call.openInterest,
      putOi: put.openInterest,
      callOiChange: call.oiChange,
      putOiChange: put.oiChange,
      pcr,
    });
  }

  const netPremium = totalCallPremium - totalPutPremium;
  const pcr = totalCallOi > 0 ? totalPutOi / totalCallOi : 0;
  const callWrite = totalCallOiChange > 0 ? totalCallOiChange : 0;
  const putWrite = totalPutOiChange > 0 ? totalPutOiChange : 0;
  const unwinding = Math.abs(totalCallOiChange < 0 ? totalCallOiChange : 0) +
    Math.abs(totalPutOiChange < 0 ? totalPutOiChange : 0);

  let flowBias: BiasDirection = 'neutral';
  if (putWrite > callWrite * 1.25 && pcr > 1) flowBias = 'bullish';
  else if (callWrite > putWrite * 1.25 && pcr < 0.9) flowBias = 'bearish';

  return {
    totalCallPremium,
    totalPutPremium,
    netPremium,
    pcr,
    pcrChange: (Math.random() - 0.5) * 0.08,
    callWrite,
    putWrite,
    unwinding,
    flowBias,
    perStrike,
  };
}
