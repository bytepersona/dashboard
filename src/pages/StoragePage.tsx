import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useServerStore } from '@/stores/serverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GaugeBar } from '@/components/ui/gauges';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { HardDrive } from 'lucide-react';
import { statusColor } from '@/lib/utils';

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

export function StoragePage() {
  const s = useServerStore();

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">Storage</h1>
          <p className="text-xs text-muted-foreground mt-0.5">3 mount points · NVMe RAID-10</p>
        </div>

        {/* Mount overview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {s.storage.map((d) => {
            const pct = (d.usedGib / d.totalGib) * 100;
            const fillColor = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
            return (
              <Card key={d.mount}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 font-mono">
                    <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
                    {d.mount}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-black font-mono" style={{ color: pct >= 90 ? '#f87171' : pct >= 75 ? '#fbbf24' : '#34d399' }}>
                    {pct.toFixed(1)}<span className="text-base font-normal text-muted-foreground">%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${fillColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>{d.usedGib} GiB used</span>
                    <span>{(d.totalGib - d.usedGib)} GiB free</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Read</div>
                      <div className="text-xs font-mono font-semibold text-sky-400">{d.readMbps.toFixed(0)} <span className="text-muted-foreground">MB/s</span></div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Write</div>
                      <div className="text-xs font-mono font-semibold text-orange-400">{d.writeMbps.toFixed(0)} <span className="text-muted-foreground">MB/s</span></div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">IOPS</div>
                      <div className="text-xs font-mono font-semibold">{d.iops.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Throughput charts */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle>Read/Write Throughput (MB/s)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={s.storage.map(d => ({ mount: d.mount.split('/').pop() || '/', read: parseFloat(d.readMbps.toFixed(1)), write: parseFloat(d.writeMbps.toFixed(1)) }))}
                  margin={{ left: -10, right: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mount" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="read"  name="Read MB/s"  fill="#38bdf8" radius={[2,2,0,0]} />
                  <Bar dataKey="write" name="Write MB/s" fill="#fb923c" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle>IOPS by Mount</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={s.storage.map(d => ({ mount: d.mount.split('/').pop() || '/', iops: d.iops }))}
                  margin={{ left: -10, right: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mount" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="iops" name="IOPS" fill="#a78bfa" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Capacity gauges */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Capacity Overview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {s.storage.map((d) => (
              <GaugeBar
                key={d.mount}
                label={d.mount}
                value={d.usedGib}
                max={d.totalGib}
                unit=" GiB"
              />
            ))}
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>Total capacity</span>
                <span>{s.storage.reduce((a, d) => a + d.totalGib, 0).toLocaleString()} GiB</span>
              </div>
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>Total used</span>
                <span className={statusColor((s.storage.reduce((a,d)=>a+d.usedGib,0)/s.storage.reduce((a,d)=>a+d.totalGib,0))*100)}>
                  {s.storage.reduce((a, d) => a + d.usedGib, 0).toLocaleString()} GiB
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
