'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, ChartNoAxesCombined, ChevronDown, FlaskConical, Gauge, LayoutDashboard, LineChart, ListFilter, Menu, Settings2, Waves, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/options-chain', label: 'Options Chain', icon: ListFilter },
  { href: '/flow', label: 'Premium Flow', icon: Waves },
  { href: '/gamma', label: 'Gamma Exposure', icon: Gauge },
  { href: '/market', label: 'Market Structure', icon: LineChart },
  { href: '/setups', label: 'Setups', icon: ChartNoAxesCombined },
  { href: '/backtest', label: 'Backtest Lab', icon: FlaskConical },
  { href: '/journal', label: 'Trade Journal', icon: BookOpen },
];

export function TradingTerminal({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100">
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/90 bg-[#0d1424] transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-16 items-center justify-between border-b border-slate-800/90 px-5">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-400 text-[#08121c]"><BarChart3 className="h-5 w-5" /></div>
            <div><div className="text-sm font-bold tracking-wide text-slate-100">NIFTY FLOW</div><div className="text-[10px] font-mono tracking-[0.22em] text-teal-400">INTELLIGENCE</div></div>
          </Link>
          <button className="text-slate-500 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-4 py-5"><div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Workspace</div><nav className="space-y-1">{nav.map(({ href, label, icon: Icon }) => { const active = pathname === href; return <Link key={href} href={href} onClick={() => setOpen(false)} className={cn('group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors', active ? 'bg-teal-400/10 text-teal-300' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200')}><Icon className={cn('h-4 w-4', active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300')} />{label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400" />}</Link>; })}</nav></div>
        <div className="mt-auto border-t border-slate-800/90 p-4"><Link href="/settings" onClick={() => setOpen(false)} className={cn('flex items-center gap-3 rounded-md px-3 py-2.5 text-sm', pathname === '/settings' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300')}><Settings2 className="h-4 w-4" />Settings</Link><div className="mt-4 rounded-md border border-slate-800 bg-slate-900/50 p-3"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Mock data mode</div><p className="mt-2 text-[11px] leading-relaxed text-slate-600">Market data is simulated until a live feed is connected.</p></div></div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu overlay" />}
      <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/90 bg-[#0b1120]/95 px-4 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button className="text-slate-400 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button><div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><span>NIFTY 50</span><ChevronDown className="h-3 w-3" /><span className="text-slate-300">28 NOV 2024</span></div></div><div className="flex items-center gap-4"><div className="hidden items-center gap-2 text-[11px] text-slate-500 md:flex"><span className="h-1.5 w-1.5 rounded-full bg-teal-400" />Live simulation <span className="font-mono text-slate-600">09:42:18 IST</span></div><div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300">NF</div></div></header><main className="min-h-[calc(100vh-4rem)]">{children}</main></div>
    </div>
  );
}
