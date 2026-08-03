import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useServerStore } from '@/stores/serverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';

function statusBadge(status: string) {
  switch (status) {
    case 'running': return <Badge variant="info">▶ Running</Badge>;
    case 'queued':  return <Badge variant="secondary">⏳ Queued</Badge>;
    case 'done':    return <Badge variant="success">✓ Done</Badge>;
    case 'failed':  return <Badge variant="error">✗ Failed</Badge>;
    default:        return <Badge variant="secondary">{status}</Badge>;
  }
}

export function QueuePage() {
  const queue = useServerStore((s) => s.queue);

  const running = queue.filter((j) => j.status === 'running').length;
  const queued  = queue.filter((j) => j.status === 'queued').length;
  const done    = queue.filter((j) => j.status === 'done').length;
  const failed  = queue.filter((j) => j.status === 'failed').length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold">Job Queue</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Live inference job status</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Badge variant="info">{running} running</Badge>
            <Badge variant="secondary">{queued} queued</Badge>
            <Badge variant="success">{done} done</Badge>
            {failed > 0 && <Badge variant="error">{failed} failed</Badge>}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Running',  value: running, color: 'text-blue-400' },
            { label: 'Queued',   value: queued,  color: 'text-muted-foreground' },
            { label: 'Done',     value: done,    color: 'text-emerald-400' },
            { label: 'Failed',   value: failed,  color: 'text-red-400' },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className={cn('text-3xl font-black font-mono mt-1', k.color)}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Job table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="w-3.5 h-3.5 text-muted-foreground" />
              Jobs (most recent first)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-2 font-normal">Job ID</th>
                    <th className="text-left pb-2 font-normal">Model</th>
                    <th className="text-left pb-2 font-normal">Status</th>
                    <th className="text-right pb-2 font-normal">Tokens</th>
                    <th className="text-right pb-2 font-normal">Wait</th>
                    <th className="text-right pb-2 font-normal">Infer</th>
                    <th className="text-right pb-2 font-normal">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queue.map((j) => (
                    <tr key={j.id} className={j.status === 'running' ? 'bg-blue-500/5' : j.status === 'failed' ? 'bg-red-500/5' : ''}>
                      <td className="py-2 font-mono text-muted-foreground">{j.id}</td>
                      <td className="py-2 font-medium">{j.model}</td>
                      <td className="py-2">{statusBadge(j.status)}</td>
                      <td className="py-2 text-right font-mono">{j.tokens.toLocaleString()}</td>
                      <td className="py-2 text-right font-mono text-amber-400">{j.waitMs}ms</td>
                      <td className="py-2 text-right font-mono text-sky-400">
                        {j.status === 'done' || j.status === 'running' ? `${j.inferMs}ms` : '—'}
                      </td>
                      <td className="py-2 text-right font-mono text-muted-foreground">{j.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Wait time histogram */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Wait Time Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-24">
              {Array.from({ length: 16 }, (_, i) => {
                const bucketMin = i * 50;
                const bucketMax = bucketMin + 50;
                const count = queue.filter((j) => j.waitMs >= bucketMin && j.waitMs < bucketMax).length;
                const maxCount = Math.max(1, ...Array.from({ length: 16 }, (_, ii) => {
                  const bMin = ii * 50;
                  const bMax = bMin + 50;
                  return queue.filter((j) => j.waitMs >= bMin && j.waitMs < bMax).length;
                }));
                const height = Math.round((count / maxCount) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className={cn(
                        'w-full rounded-t transition-all duration-700',
                        i < 4 ? 'bg-emerald-500' : i < 10 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                      title={`${bucketMin}-${bucketMax}ms: ${count} jobs`}
                    />
                    {i % 4 === 0 && (
                      <span className="text-[9px] text-muted-foreground">{bucketMin}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1">Wait time (ms)</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
