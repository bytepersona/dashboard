import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useServerStore } from '@/stores/serverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GaugeBar } from '@/components/ui/gauges';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1 font-mono">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>{p.value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

export function MemoryPage() {
  const s = useServerStore();
  const ramPct  = (s.ramUsedGib / s.ramTotalGib) * 100;
  const swapPct = (s.swapUsedGib / s.swapTotalGib) * 100;
  const vramPct = (s.vramUsedGib / s.vramTotalGib) * 100;
  const histSlice = s.systemHistory.slice(-60);

  const free  = s.ramTotalGib - s.ramUsedGib - s.ramCachedGib;
  const breakdown = [
    { label: 'Used (RSS)',   value: s.ramUsedGib - s.ramCachedGib, color: '#a78bfa' },
    { label: 'Cached',       value: s.ramCachedGib,                 color: '#38bdf8' },
    { label: 'Free',         value: Math.max(0, free),              color: '#374151' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">Memory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">RAM + VRAM + Swap</p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'RAM Used',    value: `${s.ramUsedGib.toFixed(1)} GiB`, sub: `${ramPct.toFixed(1)}%` },
            { label: 'RAM Free',    value: `${(s.ramTotalGib - s.ramUsedGib).toFixed(1)} GiB`, sub: 'available' },
            { label: 'VRAM Used',   value: `${s.vramUsedGib.toFixed(1)} GiB`, sub: `${vramPct.toFixed(1)}%` },
            { label: 'Swap Used',   value: `${s.swapUsedGib.toFixed(1)} GiB`, sub: `of ${s.swapTotalGib} GiB` },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="text-2xl font-bold font-mono mt-1">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Gauges */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Utilisation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <GaugeBar label="System RAM"  value={s.ramUsedGib}   max={s.ramTotalGib}   unit=" GiB" />
            <GaugeBar label="GPU VRAM"    value={s.vramUsedGib}  max={s.vramTotalGib}  unit=" GiB" />
            <GaugeBar label="Swap"        value={s.swapUsedGib}  max={s.swapTotalGib}  unit=" GiB" />
          </CardContent>
        </Card>

        {/* RAM breakdown */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle>RAM Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {breakdown.map((b) => (
                  <div key={b.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-2 h-2 rounded-sm" style={{ background: b.color }} />
                        {b.label}
                      </span>
                      <span className="font-mono font-semibold" style={{ color: b.color }}>
                        {b.value.toFixed(1)} GiB
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${(b.value / s.ramTotalGib) * 100}%`, background: b.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{s.ramTotalGib} GiB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VRAM per model */}
          <Card>
            <CardHeader className="pb-2"><CardTitle>VRAM per Model</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {s.models.filter((m) => m.vramUsed > 0).map((m) => (
                  <div key={m.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[60%]">{m.name}</span>
                      <span className="font-mono font-semibold text-violet-400">{m.vramUsed.toFixed(1)} GiB</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500"
                        style={{ width: `${(m.vramUsed / s.vramTotalGib) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">VRAM Total</span>
                  <span>{s.vramUsedGib.toFixed(1)} / {s.vramTotalGib} GiB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>RAM &amp; VRAM History (2 min)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={histSlice} margin={{ left: -20, right: 4 }}>
                <defs>
                  <linearGradient id="gm-ram" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gm-gpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0,100]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ramPct" name="RAM %" stroke="#a78bfa" fill="url(#gm-ram)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="gpuPct" name="VRAM %" stroke="#34d399" fill="url(#gm-gpu)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
