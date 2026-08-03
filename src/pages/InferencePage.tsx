import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useServerStore } from '@/stores/serverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { Zap, Clock, TrendingUp, Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1 font-mono">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function InferencePage() {
  const s = useServerStore();
  const infSlice = s.inferenceHistory.slice(-60);
  const last = s.inferenceHistory[s.inferenceHistory.length - 1];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">Inference</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time request metrics across all models</p>
        </div>

        {/* KPI row */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Requests / s',   value: last ? last.reqPerSec.toFixed(1)    : '—', sub: 'current rate',     icon: Activity,   color: 'text-blue-400' },
            { label: 'Tokens / s',     value: last ? last.tokensPerSec.toFixed(0) : '—', sub: 'generated output', icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Queue Depth',    value: last ? String(last.queueDepth)       : '—', sub: 'pending jobs',     icon: Zap,        color: last && last.queueDepth > 8 ? 'text-red-400' : last && last.queueDepth > 4 ? 'text-amber-400' : 'text-emerald-400' },
            { label: 'Active Req',     value: String(s.activeRequests),              sub: 'in flight',            icon: Clock,      color: 'text-violet-400' },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-lg border bg-card p-4">
                <div className="flex justify-between items-start">
                  <div className="text-xs text-muted-foreground">{k.label}</div>
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className={`text-2xl font-bold font-mono mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Req/s + tokens/s chart */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle>Requests / s (2 min)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={infSlice} margin={{ left: -20, right: 4 }}>
                  <defs>
                    <linearGradient id="gi-req" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="reqPerSec" name="Req/s" stroke="#3b82f6" fill="url(#gi-req)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle>Tokens / s (2 min)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={infSlice} margin={{ left: -20, right: 4 }}>
                  <defs>
                    <linearGradient id="gi-tok" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="tokensPerSec" name="Tokens/s" stroke="#34d399" fill="url(#gi-tok)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Latency percentiles */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              Response Latency Percentiles (2 min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={infSlice} margin={{ left: -10, right: 4 }}>
                <defs>
                  {[['p50','#34d399'],['p95','#fbbf24'],['p99','#f87171']].map(([k,c]) => (
                    <linearGradient key={k} id={`gi-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} unit="ms" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="p50" name="P50 ms" stroke="#34d399" fill="url(#gi-p50)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="p95" name="P95 ms" stroke="#fbbf24" fill="url(#gi-p95)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="p99" name="P99 ms" stroke="#f87171" fill="url(#gi-p99)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground justify-center">
              {[['P50','#34d399'],['P95','#fbbf24'],['P99','#f87171']].map(([l,c]) => (
                <span key={l} className="flex items-center gap-1">
                  <span className="w-2 h-0.5 inline-block rounded" style={{ background: c }} />{l}
                </span>
              ))}
              {last && (
                <span className="ml-auto font-mono">
                  {last.p50.toFixed(0)} / {last.p95.toFixed(0)} / {last.p99.toFixed(0)} ms
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Queue depth */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Queue Depth (2 min)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={infSlice.slice(-30)} margin={{ left: -20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="queueDepth" name="Queue Depth" fill="#a78bfa" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
