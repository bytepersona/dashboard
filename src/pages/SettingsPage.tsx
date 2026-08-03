import { useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Server, Bell, Key, Eye, EyeOff, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'general' | 'thresholds' | 'api-keys';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'general',    label: 'General',    icon: Server },
  { id: 'thresholds', label: 'Thresholds', icon: Bell   },
  { id: 'api-keys',   label: 'API Keys',   icon: Key    },
];

// Slider component (no radix dep needed for simple mockup)
function Slider({ label, value, min, max, unit, color }: {
  label: string; value: number; min: number; max: number; unit: string; color: string;
}) {
  const [val, setVal] = useState(value);
  const pct = ((val - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold" style={{ color }}>
          {val}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted"
        style={{
          background: `linear-gradient(to right, ${color} ${pct}%, hsl(var(--muted)) ${pct}%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

const API_KEYS = [
  { id: 'ak1', name: 'Production Gateway',    key: 'bp_live_xK9mP2qR...f8Tz',  created: '2026-01-15', lastUsed: '2 min ago',  scopes: ['inference','models'] },
  { id: 'ak2', name: 'Monitoring Dashboard',  key: 'bp_live_aB3nW7vS...j2Qx',  created: '2026-03-22', lastUsed: '1 hour ago', scopes: ['read'] },
  { id: 'ak3', name: 'CI/CD Pipeline',        key: 'bp_test_cD5oX1uT...k4Ry',  created: '2026-06-01', lastUsed: '1 day ago',  scopes: ['inference'] },
  { id: 'ak4', name: 'Dev Workstation',       key: 'bp_test_eF7pY3wU...l6Sz',  created: '2026-07-20', lastUsed: 'never',      scopes: ['inference','admin'] },
];

function GeneralTab() {
  const [saved, setSaved] = useState(false);
  const handle = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2"><CardTitle>Server Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Hostname',     value: 'bp-inference-01',          placeholder: 'hostname' },
            { label: 'FQDN',         value: 'bp-inference-01.prod.bytepersona.io', placeholder: 'fqdn' },
            { label: 'Environment',  value: 'production',               placeholder: 'environment' },
            { label: 'Region',       value: 'eu-central-1',             placeholder: 'region' },
          ].map((f) => (
            <div key={f.label} className="grid grid-cols-3 gap-4 items-center">
              <label className="text-xs text-muted-foreground col-span-1">{f.label}</label>
              <Input defaultValue={f.value} className="col-span-2 h-8 text-xs font-mono" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Time &amp; Retention</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Timezone',           value: 'Europe/Berlin' },
            { label: 'Log retention (days)', value: '90' },
            { label: 'Metrics resolution', value: '2s' },
            { label: 'Alert cooldown',      value: '5m' },
          ].map((f) => (
            <div key={f.label} className="grid grid-cols-3 gap-4 items-center">
              <label className="text-xs text-muted-foreground col-span-1">{f.label}</label>
              <Input defaultValue={f.value} className="col-span-2 h-8 text-xs font-mono" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Slack Webhook', value: 'https://hooks.slack.com/services/T0…' },
            { label: 'PagerDuty Key', value: 'pd_xxxxxxxxxxxxxxxxxxx' },
            { label: 'SMTP Host',     value: 'smtp.bytepersona.io:587' },
          ].map((f) => (
            <div key={f.label} className="grid grid-cols-3 gap-4 items-center">
              <label className="text-xs text-muted-foreground col-span-1">{f.label}</label>
              <Input defaultValue={f.value} className="col-span-2 h-8 text-xs font-mono" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handle} className="text-sm">
          {saved ? '✓ Saved' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

function ThresholdsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2"><CardTitle>CPU Thresholds</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Slider label="CPU Warning"  value={75} min={50} max={95} unit="%" color="#fbbf24" />
          <Slider label="CPU Critical" value={90} min={60} max={99} unit="%" color="#f87171" />
          <Slider label="Core Temp Warning (°C)"  value={80} min={60} max={90} unit="°C" color="#fbbf24" />
          <Slider label="Core Temp Critical (°C)" value={88} min={70} max={95} unit="°C" color="#f87171" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Memory Thresholds</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Slider label="RAM Warning"  value={75} min={50} max={95} unit="%" color="#fbbf24" />
          <Slider label="RAM Critical" value={90} min={60} max={99} unit="%" color="#f87171" />
          <Slider label="VRAM Warning"  value={80} min={50} max={95} unit="%" color="#fbbf24" />
          <Slider label="VRAM Critical" value={92} min={60} max={99} unit="%" color="#f87171" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Inference Thresholds</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Slider label="P99 Latency Warning (ms)"  value={500}  min={100}  max={2000} unit="ms" color="#fbbf24" />
          <Slider label="P99 Latency Critical (ms)" value={1000} min={200}  max={5000} unit="ms" color="#f87171" />
          <Slider label="Queue Depth Warning"  value={8}  min={2}  max={20} unit="" color="#fbbf24" />
          <Slider label="Queue Depth Critical" value={15} min={5}  max={30} unit="" color="#f87171" />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="text-sm">Save Thresholds</Button>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setVisible((v) => ({ ...v, [id]: !v[id] }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{API_KEYS.length} keys configured</p>
        <Button size="sm" className="text-xs gap-1.5">
          <Key className="w-3 h-3" /> New API Key
        </Button>
      </div>

      <div className="space-y-3">
        {API_KEYS.map((k) => (
          <Card key={k.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{k.name}</span>
                    {k.scopes.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {visible[k.id] ? k.key.replace('…', 'XmK9pQ3rT7vZ') : k.key}
                    </code>
                    <button onClick={() => toggle(k.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {visible[k.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Created {k.created} · Last used {k.lastUsed}
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-red-400 transition-colors mt-0.5 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-amber-400">Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">Revoke all keys</p>
              <p className="text-xs text-muted-foreground">Immediately invalidates all API keys. This action cannot be undone.</p>
            </div>
            <Button variant="destructive" size="sm" className="shrink-0">Revoke All</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsPage() {
  const params = useParams<{ tab?: string }>();
  const activeTab: Tab = (params.tab as Tab) ?? 'general';

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Server configuration and preferences</p>
        </div>

        {/* Tab nav */}
        <div className="flex rounded-md border border-border overflow-hidden text-xs w-fit">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <NavLink
                key={t.id}
                to={`/settings/${t.id}`}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 font-medium transition-colors border-r border-border last:border-0',
                  activeTab === t.id
                    ? 'bg-primary/15 text-primary'
                    : 'hover:bg-accent text-muted-foreground'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </NavLink>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'general'    && <GeneralTab />}
        {activeTab === 'thresholds' && <ThresholdsTab />}
        {activeTab === 'api-keys'   && <ApiKeysTab />}
      </div>
    </DashboardLayout>
  );
}
