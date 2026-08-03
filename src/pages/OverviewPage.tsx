import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useServerStore } from '@/stores/serverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/gauges';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Cpu, MemoryStick, Zap, Activity, AlertTriangle,
  TrendingUp, HardDrive, Network,
} from 'lucide-react';
import { formatUptime, statusColor } from '@/lib/utils';

const CHART_COLOR = {
  cpu:    '#3b82f6',
  ram:    '#a78bfa',
  gpu:    '#34d399',
  rx:     '#38bdf8',
  tx:     '#fb923c',
};

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
            {p.name?.includes('Mbps') ? ' Mbps' : p.name?.includes('%') ? '%' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export function OverviewPage() {
  const s = useServerStore();
  const cpuAvg = s.cores.reduce((a, b) => a + b.usage, 0) / s.cores.length;
  const ramPct  = (s.ramUsedGib / s.ramTotalGib) * 100;
  const vramPct = (s.vramUsedGib / s.vramTotalGib) * 100;
  const lastNet = s.networkHistory[s.networkHistory.length - 1];
  const lastInf = s.inferenceHistory[s.inferenceHistory.length - 1];
  const activeAlerts = s.alerts.filter((a) => !a.resolved);

  // Health score (0-100): penalise high usage, alerts
  const healthScore = Math.max(
    0,
    100
      - (cpuAvg > 85 ? 20 : cpuAvg > 70 ? 10 : 0)
      - (vramPct > 90 ? 25 : vramPct > 75 ? 12 : 0)
      - activeAlerts.filter((a) => a.severity === 'critical').length * 15
      - activeAlerts.filter((a) => a.severity === 'warning').length * 5
  );

  const healthColor =
    healthScore >= 80 ? 'text-emerald-400' : healthScore >= 60 ? 'text-amber-400' : 'text-red-400';

  const histSlice = s.systemHistory.slice(-60);
  const netSlice  = s.networkHistory.slice(-60);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">{s.hostname}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {s.osVersion} · {s.kernelVersion} · up {formatUptime(s.uptimeSeconds)}
            </p>
          </div>
          <div className={`text-3xl font-black font-mono ${healthColor}`}>
            {healthScore.toFixed(0)}<span className="text-base font-normal text-muted-foreground">/100</span>
            <div className="text-xs text-muted-foreground font-sans font-normal text-right">health score</div>
          </div>
        </div>

        {/* Active alert banner */}
        {activeAlerts.some((a) => a.severity === 'critical') && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>{activeAlerts.filter((a) => a.severity === 'critical').length}</strong> critical alert(s) active —
              {' '}{activeAlerts.find((a) => a.severity === 'critical')?.title}
            </span>
          </div>
        )}

        {/* KPI row */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <StatCard
            label="CPU avg"
            value={`${cpuAvg.toFixed(1)}%`}
            sub={`load avg ${s.loadAvg1.toFixed(2)}`}
            icon={<Cpu className="w-4 h-4" />}
          />
          <StatCard
            label="RAM"
            value={`${ramPct.toFixed(1)}%`}
            sub={`${s.ramUsedGib.toFixed(1)} / ${s.ramTotalGib} GiB`}
            icon={<MemoryStick className="w-4 h-4" />}
          />
          <StatCard
            label="GPU VRAM"
            value={`${vramPct.toFixed(1)}%`}
            sub={`${s.vramUsedGib.toFixed(1)} / ${s.vramTotalGib} GiB`}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <StatCard
            label="Tokens / s"
            value={lastInf ? lastInf.tokensPerSec.toFixed(0) : '—'}
            sub={`${s.activeRequests} active requests`}
            icon={<Zap className="w-4 h-4" />}
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* System history */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                System Utilisation (2 min)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={histSlice} margin={{ left: -20, right: 4 }}>
                  <defs>
                    {(['cpu','ram','gpu'] as const).map((k) => (
                      <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={CHART_COLOR[k]} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={CHART_COLOR[k]} stopOpacity={0}    />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cpuAvg" name="CPU %" stroke={CHART_COLOR.cpu} fill={`url(#grad-cpu)`} strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="ramPct" name="RAM %" stroke={CHART_COLOR.ram} fill={`url(#grad-ram)`} strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="gpuPct" name="GPU %" stroke={CHART_COLOR.gpu} fill={`url(#grad-gpu)`} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground justify-center">
                {[['cpu','CPU'],['ram','RAM'],['gpu','GPU VRAM']] .map(([k,l]) => (
                  <span key={k} className="flex items-center gap-1">
                    <span className="w-2 h-0.5 inline-block rounded" style={{ background: CHART_COLOR[k as keyof typeof CHART_COLOR] }} />
                    {l}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Network */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-muted-foreground" />
                Network Throughput (2 min)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={netSlice} margin={{ left: -20, right: 4 }}>
                  <defs>
                    <linearGradient id="grad-rx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLOR.rx} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={CHART_COLOR.rx} stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="grad-tx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLOR.tx} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={CHART_COLOR.tx} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} unit=" M" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="rxMbps" name="RX Mbps" stroke={CHART_COLOR.rx} fill="url(#grad-rx)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="txMbps" name="TX Mbps" stroke={CHART_COLOR.tx} fill="url(#grad-tx)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground justify-center">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 inline-block rounded" style={{ background: CHART_COLOR.rx }} />RX
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 inline-block rounded" style={{ background: CHART_COLOR.tx }} />TX
                </span>
                {lastNet && (
                  <span className="ml-auto text-muted-foreground">
                    ↓ {lastNet.rxMbps.toFixed(0)} / ↑ {lastNet.txMbps.toFixed(0)} Mbps
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent logs + alerts */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* Recent logs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 font-mono text-[11px] max-h-48 overflow-y-auto scrollbar-thin">
                {s.logs.slice(-10).reverse().map((l) => (
                  <div key={l.id} className="flex items-start gap-2">
                    <span className="text-muted-foreground shrink-0">{l.ts}</span>
                    <span className={
                      l.level === 'ERROR' ? 'text-red-400 shrink-0' :
                      l.level === 'WARN'  ? 'text-amber-400 shrink-0' :
                      l.level === 'DEBUG' ? 'text-muted-foreground/50 shrink-0' :
                      'text-blue-400 shrink-0'
                    }>{l.level}</span>
                    <span className="text-muted-foreground truncate">{l.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                Active Alerts
                <Badge variant={activeAlerts.some(a=>a.severity==='critical') ? 'error' : 'warning'}>
                  {activeAlerts.length} active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {activeAlerts.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <span className={
                      a.severity === 'critical' ? 'w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0' :
                      a.severity === 'warning'  ? 'w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0' :
                      'w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0'
                    } />
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-muted-foreground text-[11px]">{a.message}</p>
                    </div>
                  </div>
                ))}
                {activeAlerts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No active alerts ✓</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Storage quick view */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {s.storage.map((d) => {
                const pct = (d.usedGib / d.totalGib) * 100;
                const fillColor = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
                return (
                  <div key={d.mount} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono text-muted-foreground">{d.mount}</span>
                      <span className={statusColor(pct) + ' font-mono font-semibold'}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${fillColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{d.usedGib} / {d.totalGib} GiB</span>
                      <span>↑{d.writeMbps.toFixed(0)} ↓{d.readMbps.toFixed(0)} MB/s</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
