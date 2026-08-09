'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleHelp,
  Minus,
  MoveDown,
  MoveUp,
  RefreshCw,
  ShieldAlert,
  Target,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { TradingTerminal } from '@/components/trading-terminal';
import { mockMarketDataService } from '@/lib/services/mock-market-data';
import { analyzeSnapshot } from '@/lib/analytics/setup-score';
import type {
  BiasDirection,
  GammaRegime,
  MarketSnapshot,
  SetupAssessment,
  VolatilityRegime,
} from '@/lib/types/market';
import { cn } from '@/lib/utils';

function formatNumber(value: number, decimals = 2) {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

type PillValue = BiasDirection | GammaRegime | VolatilityRegime;

function BiasPill({ value }: { value: PillValue }) {
  const positive = value === 'bullish' || value === 'positive-gamma';
  const negative =
    value === 'bearish' ||
    value === 'negative-gamma' ||
    value === 'high' ||
    value === 'extreme';
  return (
    <span
      className={cn(
        'rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider',
        positive
          ? 'bg-teal-400/10 text-teal-300'
          : negative
          ? 'bg-red-400/10 text-red-300'
          : 'bg-slate-700/60 text-slate-400'
      )}
    >
      {value.replaceAll('-', ' ')}
    </span>
  );
}

function Metric({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  change?: number;
  icon: typeof TrendingUp;
}) {
  return (
    <div className="border-l border-slate-800 pl-4 first:border-l-0 first:pl-0">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-600" />
        {label}
      </div>
      <div className="font-mono text-xl font-semibold tracking-tight text-slate-100">
        {value}
      </div>
      {change !== undefined && (
        <div
          className={cn(
            'mt-1 flex items-center gap-1 font-mono text-[11px]',
            change >= 0 ? 'text-teal-400' : 'text-red-400'
          )}
        >
          {change >= 0 ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {change >= 0 ? '+' : ''}
          {formatNumber(change)}%
        </div>
      )}
    </div>
  );
}

function ScoreRing({ score, verdict }: { score: number; verdict: string }) {
  const color =
    verdict === 'TRADE' ? '#2dd4bf' : verdict === 'WATCH' ? '#fbbf24' : '#64748b';
  return (
    <div
      className="relative flex h-40 w-40 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${score * 3.6}deg, #1e293b 0deg)`,
      }}
    >
      <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#101827]">
        <span className="font-mono text-4xl font-bold text-slate-100">{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          out of 100
        </span>
      </div>
    </div>
  );
}

function BiasRow({ label, value }: { label: string; value: PillValue }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/80 py-3 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <BiasPill value={value} />
    </div>
  );
}

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);

  useEffect(() => {
    mockMarketDataService.getSnapshot().then(setSnapshot);
    return mockMarketDataService.subscribe(setSnapshot);
  }, []);

  const assessment: SetupAssessment | null = useMemo(
    () => (snapshot ? analyzeSnapshot(snapshot) : null),
    [snapshot]
  );

  if (!snapshot || !assessment) {
    return (
      <TradingTerminal>
        <div className="flex min-h-[70vh] items-center justify-center text-sm text-slate-500">
          Loading market snapshot...
        </div>
      </TradingTerminal>
    );
  }

  const { spot, futures, vix } = snapshot;
  const { bias, regime, gamma, flow, structure, primary } = assessment;

  return (
    <TradingTerminal>
      <div className="terminal-grid min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-[1600px] p-4 md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-400">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                Market intelligence terminal
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 md:text-3xl">
                NIFTY 50 <span className="font-normal text-slate-500">/ Decision context</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-500">
                A structured read of price, positioning, flow, and volatility. No automated signals.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Mock data <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
                Session{' '}
                <span className="ml-2 font-semibold uppercase text-teal-300">
                  {snapshot.session}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-slate-800 bg-slate-800 md:grid-cols-4">
            <div className="bg-[#101827] p-4">
              <Metric label="NIFTY spot" value={formatNumber(spot.price)} change={spot.changePercent} icon={TrendingUp} />
            </div>
            <div className="bg-[#101827] p-4">
              <Metric label="NIFTY futures" value={formatNumber(futures.price)} change={futures.changePercent} icon={BarChart3} />
            </div>
            <div className="bg-[#101827] p-4">
              <Metric label="India VIX" value={formatNumber(vix.value)} change={vix.changePercent} icon={Waves} />
            </div>
            <div className="bg-[#101827] p-4">
              <Metric label="Spot vs VWAP" value={`${spot.price >= spot.vwap ? '+' : ''}${formatNumber(spot.price - spot.vwap)}`} icon={Target} />
            </div>
          </div>

          <div className="mb-4 grid gap-4 xl:grid-cols-[1fr_320px]">
            <div className="rounded-md border border-slate-800 bg-[#101827]">
              <div className="flex items-center justify-between border-b border-slate-800 p-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">Environment assessment</h2>
                  <p className="mt-1 text-xs text-slate-500">Calculated intelligence from observed mock inputs</p>
                </div>
                <span className="rounded border border-amber-400/20 bg-amber-400/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-300">Not a recommendation</span>
              </div>
              <div className="grid gap-6 p-5 lg:grid-cols-[190px_1fr]">
                <div className="flex flex-col items-center justify-center">
                  <ScoreRing score={assessment.overallScore} verdict={primary.verdict} />
                  <div className={cn('mt-4 rounded px-4 py-2 text-xs font-bold tracking-[0.25em]', primary.verdict === 'TRADE' ? 'bg-teal-400 text-[#08121c]' : primary.verdict === 'WATCH' ? 'bg-amber-400 text-[#17120a]' : 'bg-slate-700 text-slate-200')}>{primary.verdict}</div>
                  <span className="mt-2 text-[10px] uppercase tracking-widest text-slate-600">environment verdict</span>
                </div>
                <div className="grid gap-x-10 gap-y-1 sm:grid-cols-2">
                  <BiasRow label="Market bias" value={bias.marketBias} />
                  <BiasRow label="Flow bias" value={bias.flowBias} />
                  <BiasRow label="Futures bias" value={bias.futuresBias} />
                  <BiasRow label="Gamma regime" value={bias.gammaRegime} />
                  <BiasRow label="Volatility regime" value={bias.volatilityRegime} />
                  <BiasRow label="Structure bias" value={bias.structureBias} />
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-800 bg-[#101827] p-5">
              <div className="mb-5 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-slate-200">Regime filter</h2>
              </div>
              <div className="mb-5 rounded border border-slate-800 bg-slate-900/60 p-3">
                <div className="text-[10px] uppercase tracking-widest text-slate-600">Current market regime</div>
                <div className="mt-2 text-sm font-semibold uppercase text-slate-200">{regime.marketRegime.replaceAll('-', ' ')}</div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{regime.description}</p>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Trend strength</span><span className="font-mono text-slate-300">{formatNumber(regime.trendStrength, 0)}%</span></div>
                <div className="h-1 rounded-full bg-slate-800"><div className="h-1 rounded-full bg-teal-400" style={{ width: `${regime.trendStrength}%` }} /></div>
                <div className="flex justify-between"><span className="text-slate-500">VIX percentile</span><span className="font-mono text-slate-300">{formatNumber(regime.vixPercentile, 0)}%</span></div>
                <div className="h-1 rounded-full bg-slate-800"><div className="h-1 rounded-full bg-amber-400" style={{ width: `${regime.vixPercentile}%` }} /></div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-md border border-slate-800 bg-[#101827] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">Setup context</h2>
                <CircleHelp className="h-4 w-4 text-slate-600" />
              </div>
              <div className="mb-4 flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded bg-slate-800', primary.type === 'CALL' ? 'text-teal-300' : primary.type === 'PUT' ? 'text-red-300' : 'text-slate-400')}>
                  {primary.type === 'CALL' ? <MoveUp className="h-5 w-5" /> : primary.type === 'PUT' ? <MoveDown className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{primary.type === 'NONE' ? 'No directional setup' : `${primary.type} environment`}</div>
                  <div className="text-xs text-slate-500">{primary.confidence}% model confidence</div>
                </div>
              </div>
              <ul className="space-y-2">
                {primary.rationale.map((r) => (
                  <li key={r} className="flex gap-2 text-xs leading-relaxed text-slate-500">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />{r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-slate-800 bg-[#101827] p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-200">Key levels</h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">VWAP</span><span className="font-mono text-slate-200">{formatNumber(spot.vwap)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Gamma flip</span><span className="font-mono text-amber-300">{formatNumber(gamma.gammaFlipPoint, 0)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Max pain</span><span className="font-mono text-slate-200">{formatNumber(gamma.maxPainStrike, 0)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Futures basis</span><span className="font-mono text-teal-300">{formatNumber(futures.basis, 2)}%</span></div>
              </div>
            </div>

            <div className="rounded-md border border-slate-800 bg-[#101827] p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-200">Positioning snapshot</h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Put / Call ratio</span><span className="font-mono text-slate-200">{formatNumber(flow.pcr, 2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Dealer gamma</span><span className="font-mono text-slate-200">{formatCompact(gamma.totalDealerGamma)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Range position</span><span className="font-mono text-slate-200">{formatNumber(structure.rangePosition * 100, 0)}%</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Futures OI change</span><span className="font-mono text-teal-300">+{formatCompact(futures.oiChange)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TradingTerminal>
  );
}
