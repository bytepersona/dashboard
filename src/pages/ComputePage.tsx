import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useServerStore } from '@/stores/serverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GaugeBar } from '@/components/ui/gauges';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { Cpu, Thermometer, Power, Zap } from 'lucide-react';
import { statusColor } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
} from '@/components/ui/context-menu';
import { toast } from 'sonner';

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

export function ComputePage() {
  const s = useServerStore();
  const killCore = useServerStore((s) => s.killCore);
  const cpuAvg = s.cores.reduce((a, b) => a + b.usage, 0) / s.cores.length;
  const histSlice = s.systemHistory.slice(-60);

  const handleKillCore = (coreId: number) => {
    killCore(coreId);
    toast.success(`Killed processes on core ${coreId}`, { description: 'Usage dropped to 0%' });
  };

  const handleThrottle = (coreId: number) => {
    toast.info(`Throttle core ${coreId} to 80%`, { description: 'Not implemented in mock' });
  };

  const handleViewThreads = (coreId: number) => {
    toast.info(`View threads on core ${coreId}`, { description: 'Not implemented in mock' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">Compute</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{s.cpuModel}</p>
        </div>

        {/* Summary KPIs */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'CPU Avg',    value: `${cpuAvg.toFixed(1)}%`,           sub: 'all cores' },
            { label: 'Load 1m',    value: s.loadAvg1.toFixed(2),              sub: `5m: ${s.loadAvg5.toFixed(2)}` },
            { label: 'Load 15m',   value: s.loadAvg15.toFixed(2),             sub: 'long-term' },
            { label: 'Avg Freq',   value: `${(s.cores.reduce((a,b)=>a+b.freq,0)/s.cores.length/1000).toFixed(2)} GHz`, sub: 'across cores' },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="text-2xl font-bold font-mono mt-1">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Per-core heatmap + bars */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                Per-Core Utilisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={s.cores.map(c => ({ name: `c${c.id}`, usage: parseFloat(c.usage.toFixed(1)) }))}
                  margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <YAxis domain={[0,100]} tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="usage" name="Usage %" radius={[2,2,0,0]}>
                    {s.cores.map((c) => (
                      <Cell key={c.id}
                        fill={c.usage >= 90 ? '#f87171' : c.usage >= 75 ? '#fbbf24' : '#34d399'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Temperature */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
                Core Temperatures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={s.cores.map(c => ({ name: `c${c.id}`, temp: parseFloat(c.temp.toFixed(1)) }))}
                  margin={{ left: -10, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <YAxis domain={[30,95]} tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} unit="°" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="temp" name="Temp °C" radius={[2,2,0,0]}>
                    {s.cores.map((c) => (
                      <Cell key={c.id}
                        fill={c.temp >= 85 ? '#f87171' : c.temp >= 70 ? '#fbbf24' : '#60a5fa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Load average history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>CPU Utilisation History (2 min)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={histSlice} margin={{ left: -20, right: 4 }}>
                <defs>
                  <linearGradient id="grad-cpu2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0,100]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cpuAvg" name="CPU %" stroke="#3b82f6" fill="url(#grad-cpu2)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Core table */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Core Detail</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              {s.cores.map((c) => (
                <ContextMenu key={c.id}>
                  <ContextMenuTrigger asChild>
                    <div className="rounded-md border bg-muted/30 p-2.5 space-y-1.5 cursor-pointer hover:border-cyan-500/30 transition-colors">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-mono">Core {c.id}</span>
                        <span className={statusColor(c.usage) + ' font-mono font-semibold'}>{c.usage.toFixed(1)}%</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${c.usage >= 90 ? 'bg-red-500' : c.usage >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${c.usage}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{(c.freq / 1000).toFixed(2)} GHz</span>
                        <span className={c.temp >= 85 ? 'text-red-400' : c.temp >= 70 ? 'text-amber-400' : 'text-blue-400'}>
                          {c.temp.toFixed(0)}°C
                        </span>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuLabel>Core {c.id}</ContextMenuLabel>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => handleKillCore(c.id)}>
                      <Power className="w-3 h-3 mr-2 text-red-400" />
                      Kill Processes
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleThrottle(c.id)}>
                      <Zap className="w-3 h-3 mr-2 text-amber-400" />
                      Throttle to 80%
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => handleViewThreads(c.id)}>
                      View Running Threads
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => toast.info('CPU flamegraph', { description: 'Not implemented in mock' })}>
                      CPU Flamegraph
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
