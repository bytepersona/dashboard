import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useServerStore, LogEntry } from '@/stores/serverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollText, Search, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

type Level = 'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_COLORS: Record<string, string> = {
  DEBUG: 'text-muted-foreground/60',
  INFO:  'text-blue-400',
  WARN:  'text-amber-400',
  ERROR: 'text-red-400',
};

export function LogsPage() {
  const logs = useServerStore((s) => s.logs);
  const [level, setLevel]     = useState<Level>('ALL');
  const [search, setSearch]   = useState('');
  const [paused, setPaused]   = useState(false);
  const [frozen, setFrozen]   = useState<LogEntry[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // When paused, snapshot the current logs
  useEffect(() => {
    if (paused) {
      setFrozen(logs);
    }
  }, [paused]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = (paused ? frozen : logs).filter((l) => {
    if (level !== 'ALL' && l.level !== level) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase()) &&
        !l.service.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Auto-scroll
  useEffect(() => {
    if (!paused) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayed.length, paused]);

  const counts = {
    DEBUG: logs.filter((l) => l.level === 'DEBUG').length,
    INFO:  logs.filter((l) => l.level === 'INFO').length,
    WARN:  logs.filter((l) => l.level === 'WARN').length,
    ERROR: logs.filter((l) => l.level === 'ERROR').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live system log stream</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Level filter */}
          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            {(['ALL','DEBUG','INFO','WARN','ERROR'] as Level[]).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={cn(
                  'px-2.5 py-1.5 font-mono transition-colors',
                  level === l
                    ? l === 'ERROR' ? 'bg-red-500/20 text-red-400'
                    : l === 'WARN'  ? 'bg-amber-500/20 text-amber-400'
                    : l === 'INFO'  ? 'bg-blue-500/20 text-blue-400'
                    : l === 'DEBUG' ? 'bg-muted text-muted-foreground'
                    : 'bg-muted text-foreground'
                    : 'hover:bg-accent text-muted-foreground'
                )}
              >
                {l}
                {l !== 'ALL' && (
                  <span className="ml-1 text-[10px] opacity-60">{counts[l as keyof typeof counts]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter logs…"
              className="pl-8 h-8 text-xs font-mono"
            />
          </div>

          {/* Pause/resume */}
          <Button
            variant={paused ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {paused ? 'Resume' : 'Pause'}
          </Button>

          <span className="text-xs text-muted-foreground ml-auto">
            {displayed.length} lines {paused && <span className="text-amber-400">(paused)</span>}
          </span>
        </div>

        {/* Log terminal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="w-3.5 h-3.5 text-muted-foreground" />
              Log Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] overflow-y-auto scrollbar-thin bg-black/40 rounded-b-lg p-3 font-mono text-[11px] space-y-0.5">
              {displayed.slice(-200).map((l) => (
                <div key={l.id} className="flex items-start gap-2 leading-relaxed hover:bg-white/5 px-1 rounded">
                  <span className="text-muted-foreground/50 shrink-0 select-none">{l.ts}</span>
                  <span className={cn('shrink-0 w-12 text-right', LEVEL_COLORS[l.level])}>{l.level}</span>
                  <span className="text-violet-400/70 shrink-0 hidden sm:inline">{l.service}</span>
                  <span className="text-foreground/80 break-all">{l.message}</span>
                </div>
              ))}
              {displayed.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No log entries match the current filter.</p>
              )}
              <div ref={endRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
