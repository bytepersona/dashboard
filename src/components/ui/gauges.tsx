import { cn, statusDotColor, statusColor } from '@/lib/utils';

interface GaugeBarProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  className?: string;
}

/** Horizontal progress bar with colour-coded fill */
export function GaugeBar({ label, value, max, unit = '', className }: GaugeBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const dotCls = statusDotColor(pct);
  const textCls = statusColor(pct);

  const fillColor =
    pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <span className={cn('w-1.5 h-1.5 rounded-full', dotCls)} />
          {label}
        </span>
        <span className={cn('font-mono font-semibold', textCls)}>
          {value.toFixed(1)}{unit} / {max}{unit} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', fillColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  className?: string;
}

import React from 'react';

/** Simple KPI card */
export function StatCard({ label, value, sub, icon, className }: StatCardProps) {
  return (
    <div className={cn('rounded border bg-card p-3 space-y-1 relative overflow-hidden', className)}>
      <div className="absolute inset-0 opacity-5 terminal-grid pointer-events-none" />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">{label}</span>
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
      </div>
      <div className="text-2xl font-bold font-mono tabular-nums relative z-10">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground font-mono relative z-10">{sub}</div>}
    </div>
  );
}

/** Coloured dot indicator */
export function StatusDot({ pct, className }: { pct: number; className?: string }) {
  return (
    <span className={cn('inline-block w-2 h-2 rounded-full', statusDotColor(pct), className)} />
  );
}
