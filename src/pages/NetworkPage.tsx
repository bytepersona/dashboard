import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useServerStore } from '@/stores/serverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Network, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { formatBytes, formatBps } from '@/lib/utils';

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
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value} Mbps
          </span>
        </div>
      ))}
    </div>
  );
};

export function NetworkPage() {
  const s = useServerStore();
  const netSlice = s.networkHistory.slice(-60);
  const last = s.networkHistory[s.networkHistory.length - 1];

  // Simulated endpoint latency table
  const endpoints = [
    { host: '10.0.1.1',       role: 'Gateway',          latMs: 0.3 + Math.random() * 0.2  },
    { host: '10.0.1.10',      role: 'Load Balancer',    latMs: 0.8 + Math.random() * 0.5  },
    { host: '10.0.1.20',      role: 'Model Registry',   latMs: 1.2 + Math.random() * 1.0  },
    { host: '10.0.1.30',      role: 'Object Store',     latMs: 2.1 + Math.random() * 1.5  },
    { host: 'metrics.bp.io',  role: 'Metrics Endpoint', latMs: 4.8 + Math.random() * 2.0  },
    { host: 'auth.bp.io',     role: 'Auth Service',     latMs: 6.2 + Math.random() * 3.0  },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">Network</h1>
          <p className="text-xs text-muted-foreground mt-0.5">eth0 · 25 GbE · bond0</p>
        </div>

        {/* KPI row */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <ArrowDownToLine className="w-3 h-3" /> RX Now
            </div>
            <div className="text-2xl font-bold font-mono text-sky-400">{last?.rxMbps.toFixed(0)} <span className="text-sm text-muted-foreground">Mbps</span></div>
            <div className="text-xs text-muted-foreground">{formatBytes(s.rxTotal)} total</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <ArrowUpFromLine className="w-3 h-3" /> TX Now
            </div>
            <div className="text-2xl font-bold font-mono text-orange-400">{last?.txMbps.toFixed(0)} <span className="text-sm text-muted-foreground">Mbps</span></div>
            <div className="text-xs text-muted-foreground">{formatBytes(s.txTotal)} total</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">Packets In</div>
            <div className="text-2xl font-bold font-mono">{(s.packetsIn / 1_000_000).toFixed(2)}M</div>
            <div className="text-xs text-muted-foreground">total received</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">Latency (RTT)</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">{s.latencyMs.toFixed(2)} <span className="text-sm text-muted-foreground">ms</span></div>
            <div className="text-xs text-muted-foreground">to gateway</div>
          </div>
        </div>

        {/* Throughput chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-muted-foreground" />
              Throughput (2 min window)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={netSlice} margin={{ left: -20, right: 4 }}>
                <defs>
                  <linearGradient id="gn-rx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gn-tx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} unit=" M" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="rxMbps" name="RX Mbps" stroke="#38bdf8" fill="url(#gn-rx)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="txMbps" name="TX Mbps" stroke="#fb923c" fill="url(#gn-tx)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Endpoint latency table */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Endpoint Latency</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-normal">Host</th>
                  <th className="text-left pb-2 font-normal">Role</th>
                  <th className="text-right pb-2 font-normal">RTT</th>
                  <th className="text-right pb-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {endpoints.map((e) => (
                  <tr key={e.host}>
                    <td className="py-2 font-mono text-muted-foreground">{e.host}</td>
                    <td className="py-2 text-foreground">{e.role}</td>
                    <td className="py-2 text-right font-mono">
                      <span className={e.latMs < 2 ? 'text-emerald-400' : e.latMs < 5 ? 'text-amber-400' : 'text-red-400'}>
                        {e.latMs.toFixed(1)} ms
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <span className="inline-flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${e.latMs < 2 ? 'bg-emerald-400' : e.latMs < 5 ? 'bg-amber-400' : 'bg-red-400'}`} />
                        <span className="text-muted-foreground">{e.latMs < 2 ? 'OK' : e.latMs < 5 ? 'Slow' : 'High'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
