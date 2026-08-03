import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useServerStore } from '@/stores/serverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

type MetricKey = 'cpuAvg' | 'ramPct' | 'gpuPct';

const METRIC_OPTIONS: { key: MetricKey; label: string; unit: string; color: string }[] = [
  { key: 'cpuAvg', label: 'CPU Utilisation',  unit: '%',   color: '#3b82f6' },
  { key: 'ramPct', label: 'RAM Usage',         unit: '%',   color: '#a78bfa' },
  { key: 'gpuPct', label: 'GPU VRAM Usage',    unit: '%',   color: '#34d399' },
];

type Range = '1m' | '2m' | '5m';

const RANGE_POINTS: Record<Range, number> = { '1m': 30, '2m': 60, '5m': 150 };

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1 font-mono">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="font-mono font-semibold" style={{ color: p.color }}>
            {p.value?.toFixed(2)}{unit}
          </span>
        </div>
      ))}
    </div>
  );
};

export function MetricsPage() {
  const systemHistory = useServerStore((s) => s.systemHistory);
  const inferenceHistory = useServerStore((s) => s.inferenceHistory);

  const [selected, setSelected] = useState<MetricKey>('cpuAvg');
  const [range, setRange] = useState<Range>('2m');

  const metric = METRIC_OPTIONS.find((m) => m.key === selected)!;
  const data = systemHistory.slice(-RANGE_POINTS[range]);

  // Compute stats
  const values = data.map((d) => d[selected]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const last = values[values.length - 1];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">Metrics Explorer</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Select a metric and time range to explore</p>
        </div>

        {/* Metric selector */}
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            {METRIC_OPTIONS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelected(m.key)}
                className={cn(
                  'px-3 py-2 font-medium transition-colors',
                  selected === m.key
                    ? 'bg-primary/15 text-primary border-r border-primary/20'
                    : 'hover:bg-accent text-muted-foreground border-r border-border last:border-0'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5" style={{ background: m.color }} />
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            {(['1m','2m','5m'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'px-3 py-2 font-medium font-mono transition-colors',
                  range === r ? 'bg-muted text-foreground' : 'hover:bg-accent text-muted-foreground'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid gap-3 grid-cols-4">
          {[
            { label: 'Current', value: last?.toFixed(2) ?? '—' },
            { label: 'Average', value: avg.toFixed(2) },
            { label: 'Min',     value: min.toFixed(2) },
            { label: 'Max',     value: max.toFixed(2) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
              <div className="text-xl font-bold font-mono mt-1" style={{ color: metric.color }}>
                {s.value}<span className="text-xs text-muted-foreground">{metric.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
              {metric.label} — last {range}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data} margin={{ left: -15, right: 8 }}>
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  unit={metric.unit}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} unit={metric.unit} />} />
                <Line
                  type="monotone"
                  dataKey={selected}
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: metric.color }}
                  filter="url(#glow)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inference metrics quick view */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle>Inference Req/s</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={inferenceHistory.slice(-RANGE_POINTS[range])} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip unit=" r/s" />} />
                  <Line type="monotone" dataKey="reqPerSec" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle>Tokens / s</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={inferenceHistory.slice(-RANGE_POINTS[range])} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip unit=" t/s" />} />
                  <Line type="monotone" dataKey="tokensPerSec" stroke="#34d399" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
