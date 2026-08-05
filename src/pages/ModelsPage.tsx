import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useServerStore } from '@/stores/serverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Cpu, Clock, Zap, Power, RefreshCw, ArrowRightLeft } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
} from '@/components/ui/context-menu';
import { toast } from 'sonner';

function statusBadge(status: string) {
  switch (status) {
    case 'loaded':    return <Badge variant="success">● Loaded</Badge>;
    case 'loading':   return <Badge variant="info">● Loading</Badge>;
    case 'unloading': return <Badge variant="warning">● Unloading</Badge>;
    case 'error':     return <Badge variant="error">● Error</Badge>;
    default:          return <Badge variant="secondary">{status}</Badge>;
  }
}

export function ModelsPage() {
  const models = useServerStore((s) => s.models);
  const vramTotal = useServerStore((s) => s.vramTotalGib);
  const unloadModel = useServerStore((s) => s.unloadModel);
  const reloadModel = useServerStore((s) => s.reloadModel);

  const loaded    = models.filter((m) => m.status === 'loaded').length;
  const totalReqs = models.reduce((a, m) => a + m.reqPerSec, 0);

  const handleUnload = (modelId: string, modelName: string) => {
    unloadModel(modelId);
    toast.success(`Unloading ${modelName}`, { description: 'VRAM will be freed in ~2s' });
  };

  const handleReload = (modelId: string, modelName: string) => {
    reloadModel(modelId);
    toast.info(`Reloading ${modelName}`, { description: 'Model will be available shortly' });
  };

  const handleMigrate = (modelId: string, modelName: string, targetDevice: string) => {
    toast.info(`Migrating ${modelName} to ${targetDevice}`, { description: 'Not implemented in mock' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold">Models</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loaded} of {models.length} loaded · {totalReqs.toFixed(1)} req/s combined
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="success">{loaded} loaded</Badge>
            <Badge variant="error">{models.filter(m => m.status === 'error').length} error</Badge>
          </div>
        </div>

        {/* Model cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {models.map((m) => {
            const vramPct = (m.vramUsed / vramTotal) * 100;
            const vramBarPct = (m.vramUsed / m.vramTotal) * 100;
            return (
              <ContextMenu key={m.id}>
                <ContextMenuTrigger>
                  <Card className={m.status === 'error' ? 'border-red-500/30 cursor-pointer' : 'cursor-pointer hover:border-cyan-500/30 transition-colors'}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="truncate">{m.name}</CardTitle>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{m.family} · {m.params} params</p>
                        </div>
                        {statusBadge(m.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* VRAM bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">VRAM</span>
                          <span className="font-mono font-semibold text-violet-400">
                            {m.vramUsed.toFixed(1)} / {m.vramTotal} GiB
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              vramBarPct >= 90 ? 'bg-red-500' : vramBarPct >= 75 ? 'bg-amber-500' : 'bg-violet-500'
                            }`}
                            style={{ width: `${vramBarPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border text-center">
                        <div>
                          <div className="flex justify-center mb-0.5">
                            <Zap className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <div className="text-xs font-mono font-semibold">
                            {m.status === 'loaded' ? m.reqPerSec.toFixed(1) : '—'}
                          </div>
                          <div className="text-[10px] text-muted-foreground">req/s</div>
                        </div>
                        <div>
                          <div className="flex justify-center mb-0.5">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <div className="text-xs font-mono font-semibold">
                            {m.status === 'loaded' ? `${m.avgLatencyMs}ms` : '—'}
                          </div>
                          <div className="text-[10px] text-muted-foreground">avg latency</div>
                        </div>
                        <div>
                          <div className="flex justify-center mb-0.5">
                            <Cpu className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <div className="text-[10px] font-mono font-semibold truncate px-1">{m.device}</div>
                          <div className="text-[10px] text-muted-foreground">device</div>
                        </div>
                      </div>

                      <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
                        <span>Last used: {m.lastUsed}</span>
                        <span className="font-mono">{(vramPct).toFixed(1)}% of GPU pool</span>
                      </div>
                    </CardContent>
                  </Card>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuLabel>Model: {m.name}</ContextMenuLabel>
                  <ContextMenuSeparator />
                  {m.status === 'loaded' && (
                    <ContextMenuItem onClick={() => handleUnload(m.id, m.name)}>
                      <Power className="w-3 h-3 mr-2" />
                      Unload Model
                    </ContextMenuItem>
                  )}
                  {(m.status === 'unloading' || m.status === 'error') && (
                    <ContextMenuItem onClick={() => handleReload(m.id, m.name)}>
                      <RefreshCw className="w-3 h-3 mr-2" />
                      Reload Model
                    </ContextMenuItem>
                  )}
                  <ContextMenuItem onClick={() => handleMigrate(m.id, m.name, 'cuda:1')}>
                    <ArrowRightLeft className="w-3 h-3 mr-2" />
                    Migrate to cuda:1
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => toast.info('Request log', { description: 'Not implemented in mock' })}>
                    View Request Log
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => toast.info('Shard details', { description: 'Not implemented in mock' })}>
                    Show Shard Details
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>

        {/* Summary table */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Model Summary</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-normal">Model</th>
                  <th className="text-left pb-2 font-normal">Status</th>
                  <th className="text-right pb-2 font-normal">VRAM</th>
                  <th className="text-right pb-2 font-normal">Req/s</th>
                  <th className="text-right pb-2 font-normal">P50 lat.</th>
                  <th className="text-right pb-2 font-normal hidden sm:table-cell">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {models.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 font-medium">{m.name}</td>
                    <td className="py-2">{statusBadge(m.status)}</td>
                    <td className="py-2 text-right font-mono text-violet-400">{m.vramUsed.toFixed(1)} GiB</td>
                    <td className="py-2 text-right font-mono">{m.status === 'loaded' ? m.reqPerSec.toFixed(1) : '—'}</td>
                    <td className="py-2 text-right font-mono">{m.status === 'loaded' ? `${m.avgLatencyMs}ms` : '—'}</td>
                    <td className="py-2 text-right font-mono text-muted-foreground hidden sm:table-cell">{m.device}</td>
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
