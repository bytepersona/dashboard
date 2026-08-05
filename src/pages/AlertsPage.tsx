import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useServerStore } from '@/stores/serverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Info, CheckCircle, BellOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
} from '@/components/ui/context-menu';
import { toast } from 'sonner';

type Tab = 'active' | 'resolved';

export function AlertsPage() {
  const alerts = useServerStore((s) => s.alerts);
  const silenceAlert = useServerStore((s) => s.silenceAlert);
  const resolveAlert = useServerStore((s) => s.resolveAlert);
  const [tab, setTab] = useState<Tab>('active');

  const active   = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) =>  a.resolved);
  const shown    = tab === 'active' ? active : resolved;

  const handleSilence = (alertId: string, title: string, hours: number) => {
    silenceAlert(alertId, hours * 3600000);
    toast.success(`Silenced "${title}" for ${hours}h`);
  };

  const handleResolve = (alertId: string, title: string) => {
    resolveAlert(alertId);
    toast.success(`Resolved "${title}"`);
  };

  const severityIcon = (sev: string) => {
    if (sev === 'critical') return <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />;
    if (sev === 'warning')  return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
    return <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />;
  };

  const severityBadge = (sev: string) => {
    if (sev === 'critical') return <Badge variant="error">Critical</Badge>;
    if (sev === 'warning')  return <Badge variant="warning">Warning</Badge>;
    return <Badge variant="info">Info</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold">Alerts</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {active.filter((a) => a.severity === 'critical').length} critical ·{' '}
              {active.filter((a) => a.severity === 'warning').length} warning
            </p>
          </div>
          {active.length === 0 && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" /> All clear
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex rounded-md border border-border overflow-hidden text-xs w-fit">
          {(['active','resolved'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 font-medium capitalize transition-colors',
                tab === t ? 'bg-primary/15 text-primary' : 'hover:bg-accent text-muted-foreground'
              )}
            >
              {t}
              <span className="ml-1.5 text-[10px] opacity-60">
                {t === 'active' ? active.length : resolved.length}
              </span>
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div className="space-y-3">
          {shown.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No {tab} alerts
              </CardContent>
            </Card>
          )}
          {shown.map((a) => (
            <ContextMenu key={a.id}>
              <ContextMenuTrigger asChild>
                <Card className={cn(
                  'transition-colors cursor-pointer hover:border-cyan-500/20',
                  a.severity === 'critical' && !a.resolved ? 'border-red-500/40 bg-red-500/5' :
                  a.severity === 'warning'  && !a.resolved ? 'border-amber-500/30' : ''
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {severityIcon(a.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{a.title}</span>
                          {severityBadge(a.severity)}
                          {a.resolved && <Badge variant="success">Resolved</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{a.message}</p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Triggered: {a.triggeredAt}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuLabel>Alert: {a.title}</ContextMenuLabel>
                <ContextMenuSeparator />
                {!a.resolved && (
                  <>
                    <ContextMenuItem onClick={() => handleSilence(a.id, a.title, 1)}>
                      <BellOff className="w-3 h-3 mr-2" />
                      Silence for 1 hour
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleSilence(a.id, a.title, 24)}>
                      <BellOff className="w-3 h-3 mr-2" />
                      Silence for 24 hours
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleResolve(a.id, a.title)}>
                      <Check className="w-3 h-3 mr-2 text-emerald-400" />
                      Resolve Alert
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                  </>
                )}
                <ContextMenuItem onClick={() => toast.info('Create ticket', { description: 'Not implemented in mock' })}>
                  Create Jira Ticket
                </ContextMenuItem>
                <ContextMenuItem onClick={() => toast.info('View history', { description: 'Not implemented in mock' })}>
                  View Firing History
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>

        {/* Alert rules reference */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-muted-foreground" />
              Alert Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-normal">Rule</th>
                  <th className="text-left pb-2 font-normal">Condition</th>
                  <th className="text-right pb-2 font-normal">Severity</th>
                  <th className="text-right pb-2 font-normal">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { rule: 'VRAM Pressure',      cond: 'VRAM > 90% for 2m',       sev: 'critical', state: 'firing'  },
                  { rule: 'CPU Thermal',         cond: 'Any core temp > 85°C',    sev: 'warning',  state: 'firing'  },
                  { rule: 'Disk Space',          cond: '/data/models > 80% full', sev: 'warning',  state: 'firing'  },
                  { rule: 'Inference Timeout',   cond: '>2 req timeout in 5m',    sev: 'critical', state: 'ok'      },
                  { rule: 'Queue Overflow',      cond: 'Queue depth > 10 for 1m', sev: 'warning',  state: 'ok'      },
                  { rule: 'High CPU Load',       cond: 'load_avg_1m > 12',        sev: 'warning',  state: 'ok'      },
                  { rule: 'OOM Killer',          cond: 'OOM event in syslog',     sev: 'critical', state: 'ok'      },
                ].map((r) => (
                  <tr key={r.rule}>
                    <td className="py-2 font-medium">{r.rule}</td>
                    <td className="py-2 font-mono text-muted-foreground text-[10px]">{r.cond}</td>
                    <td className="py-2 text-right">
                      {r.sev === 'critical' ? <Badge variant="error">Critical</Badge> : <Badge variant="warning">Warning</Badge>}
                    </td>
                    <td className="py-2 text-right">
                      {r.state === 'firing'
                        ? <span className="flex items-center justify-end gap-1 text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse2" />Firing</span>
                        : <span className="flex items-center justify-end gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />OK</span>
                      }
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
