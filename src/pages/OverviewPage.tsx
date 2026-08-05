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
import { formatUptime, statusColor, cn } from '@/lib/utils';

const CHART_COLOR = {
  cpu:    '#06b6d4',
  ram:    '#8b5cf6',
  gpu:    '#10b981',
  rx:     '#06b6d4',
  tx:     '#f59e0b',
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
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border/50">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold font-mono tracking-tighter uppercase text-cyan-400">{s.hostname.split('.')[0]}</h1>
              <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 bg-muted rounded border border-border">
                {s.hostname.split('.').slice(1).join('.')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-[10px] font-mono">
              <div><span className="text-muted-foreground">OS:</span> <span className="text-foreground">{s.osVersion}</span></div>
              <div><span className="text-muted-foreground">KERN:</span> <span className="text-foreground">{s.kernelVersion}</span></div>
              <div><span className="text-muted-foreground">UPTIME:</span> <span className="text-emerald-400">{formatUptime(s.uptimeSeconds)}</span></div>
              <div><span className="text-muted-foreground">CPU:</span> <span className="text-foreground">{s.cores.length}c / {s.cpuModel.split(' ')[0]}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">System Health</div>
              <div className={`text-3xl font-black font-mono tabular-nums ${healthColor}`}>
                {healthScore.toFixed(0)}<span className="text-sm font-normal text-muted-foreground/60">/100</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded border-2 flex items-center justify-center ${
              healthScore >= 80 ? 'border-emerald-500/30 bg-emerald-500/5' :
              healthScore >= 60 ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'
            }`}>
              <Activity className={`w-6 h-6 ${healthColor}`} />
            </div>
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
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
          <StatCard
            label="CPU.AVG"
            value={`${cpuAvg.toFixed(1)}%`}
            sub={`load ${s.loadAvg1.toFixed(2)}`}
            icon={<Cpu className="w-3.5 h-3.5" />}
            className="bg-gradient-to-br from-card to-card/80 border-l-2 border-cyan-500/40"
          />
          <StatCard
            label="RAM"
            value={`${ramPct.toFixed(1)}%`}
            sub={`${s.ramUsedGib.toFixed(1)}/${s.ramTotalGib}G`}
            icon={<MemoryStick className="w-3.5 h-3.5" />}
            className="bg-gradient-to-br from-card to-card/80 border-l-2 border-violet-500/40"
          />
          <StatCard
            label="GPU.VRAM"
            value={`${vramPct.toFixed(1)}%`}
            sub={`${s.vramUsedGib.toFixed(1)}/${s.vramTotalGib}G`}
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            className="bg-gradient-to-br from-card to-card/80 border-l-2 border-emerald-500/40"
          />
          <StatCard
            label="TOK/S"
            value={lastInf ? lastInf.tokensPerSec.toFixed(0) : '—'}
            sub={`${s.activeRequests} active req`}
            icon={<Zap className="w-3.5 h-3.5" />}
            className="bg-gradient-to-br from-card to-card/80 border-l-2 border-amber-500/40"
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* System history */}
          <Card className="bg-black/40 border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wide">
                <Activity className="w-3 h-3 text-cyan-400" />
                System Utilisation (2m)
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="absolute inset-0 opacity-5 terminal-grid pointer-events-none" />
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={histSlice} margin={{ left: -20, right: 4 }}>
                  <defs>
                    {(['cpu','ram','gpu'] as const).map((k) => (
                      <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={CHART_COLOR[k]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLOR[k]} stopOpacity={0}    />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cpuAvg" name="CPU %" stroke={CHART_COLOR.cpu} fill={`url(#grad-cpu)`} strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="ramPct" name="RAM %" stroke={CHART_COLOR.ram} fill={`url(#grad-ram)`} strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="gpuPct" name="GPU %" stroke={CHART_COLOR.gpu} fill={`url(#grad-gpu)`} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground justify-center font-mono">
                {[['cpu','CPU'],['ram','RAM'],['gpu','VRAM']] .map(([k,l]) => (
                  <span key={k} className="flex items-center gap-1">
                    <span className="w-2 h-0.5 inline-block" style={{ background: CHART_COLOR[k as keyof typeof CHART_COLOR] }} />
                    {l}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Network */}
          <Card className="bg-black/40 border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wide">
                <Network className="w-3 h-3 text-cyan-400" />
                Network I/O (2m)
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="absolute inset-0 opacity-5 terminal-grid pointer-events-none" />
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={netSlice} margin={{ left: -20, right: 4 }}>
                  <defs>
                    <linearGradient id="grad-rx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLOR.rx} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLOR.rx} stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="grad-tx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLOR.tx} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLOR.tx} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }} tickLine={false} unit="M" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="rxMbps" name="RX Mbps" stroke={CHART_COLOR.rx} fill="url(#grad-rx)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="txMbps" name="TX Mbps" stroke={CHART_COLOR.tx} fill="url(#grad-tx)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground justify-center font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 inline-block" style={{ background: CHART_COLOR.rx }} />RX
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 inline-block" style={{ background: CHART_COLOR.tx }} />TX
                </span>
                {lastNet && (
                  <span className="ml-auto text-cyan-400">
                    ↓{lastNet.rxMbps.toFixed(0)} ↑{lastNet.txMbps.toFixed(0)}Mb/s
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent logs + alerts */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* Recent logs */}
          <Card className="bg-black/60 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-mono uppercase tracking-wide">System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5 font-mono text-[10px] max-h-48 overflow-y-auto scrollbar-thin leading-tight">
                {s.logs.slice(-10).reverse().map((l) => (
                  <div key={l.id} className="flex items-start gap-2 hover:bg-white/5 px-1 py-0.5 rounded">
                    <span className="text-muted-foreground/40 shrink-0 w-[52px]">{l.ts}</span>
                    <span className={cn('shrink-0 w-[40px] text-right',
                      l.level === 'ERROR' ? 'text-red-400' :
                      l.level === 'WARN'  ? 'text-amber-400' :
                      l.level === 'DEBUG' ? 'text-muted-foreground/40' :
                      'text-cyan-400'
                    )}>{l.level}</span>
                    <span className="text-muted-foreground/60 truncate flex-1">{l.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active alerts */}
          <Card className="bg-black/60 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wide">
                Active Alerts
                <Badge variant={activeAlerts.some(a=>a.severity==='critical') ? 'error' : 'warning'} className="font-mono text-[9px]">
                  {activeAlerts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {activeAlerts.slice(0, 6).map((a) => (
                  <div key={a.id} className={cn(
                    'flex items-start gap-2 text-[10px] p-1.5 rounded border',
                    a.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                    a.severity === 'warning'  ? 'border-amber-500/30 bg-amber-500/5' :
                    'border-cyan-500/30 bg-cyan-500/5'
                  )}>
                    <span className={cn('shrink-0 mt-0.5',
                      a.severity === 'critical' ? 'text-red-400' :
                      a.severity === 'warning'  ? 'text-amber-400' :
                      'text-cyan-400'
                    )}>●</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium font-mono leading-tight">{a.title}</p>
                      <p className="text-muted-foreground text-[9px] leading-tight mt-0.5">{a.message}</p>
                    </div>
                  </div>
                ))}
                {activeAlerts.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-6 font-mono">
                    <span className="text-emerald-400">●</span> No active alerts
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Storage quick view */}
        <Card className="bg-black/40 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wide">
              <HardDrive className="w-3 h-3 text-cyan-400" />
              Storage Volumes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {s.storage.map((d) => {
                const pct = (d.usedGib / d.totalGib) * 100;
                const fillColor = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
                return (
                  <div key={d.mount} className="space-y-1.5 p-2 rounded border border-border/50 bg-black/20">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-mono text-cyan-400">{d.mount}</span>
                      <span className={cn('font-mono font-semibold', statusColor(pct))}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-muted/50 rounded-sm overflow-hidden">
                      <div className={`h-full transition-all duration-700 ${fillColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                      <span>{d.usedGib}/{d.totalGib}G</span>
                      <span className="text-cyan-400/60">R{d.readMbps.toFixed(0)} W{d.writeMbps.toFixed(0)}</span>
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
