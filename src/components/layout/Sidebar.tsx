import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, MemoryStick, HardDrive, Network,
  Zap, Bot, ListOrdered, ScrollText, Bell, BarChart3,
  Settings, ChevronDown, ChevronRight, X, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServerStore } from '@/stores/serverStore';

interface NavItem {
  name: string;
  path?: string;
  icon: React.ElementType;
  children?: { name: string; path: string; icon: React.ElementType }[];
}

const NAV: NavItem[] = [
  { name: 'Overview',        path: '/',               icon: LayoutDashboard },
  {
    name: 'Infrastructure',  icon: Cpu,
    children: [
      { name: 'Compute',     path: '/compute',   icon: Cpu },
      { name: 'Memory',      path: '/memory',    icon: MemoryStick },
      { name: 'Storage',     path: '/storage',   icon: HardDrive },
      { name: 'Network',     path: '/network',   icon: Network },
    ],
  },
  {
    name: 'AI Workloads',    icon: Bot,
    children: [
      { name: 'Inference',   path: '/inference', icon: Zap },
      { name: 'Models',      path: '/models',    icon: Bot },
      { name: 'Queue',       path: '/queue',     icon: ListOrdered },
    ],
  },
  {
    name: 'Monitoring',      icon: Activity,
    children: [
      { name: 'Logs',        path: '/logs',      icon: ScrollText },
      { name: 'Alerts',      path: '/alerts',    icon: Bell },
      { name: 'Metrics',     path: '/metrics',   icon: BarChart3 },
    ],
  },
  { name: 'Settings',        path: '/settings',       icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const alerts = useServerStore((s) => s.alerts);
  const activeAlerts = alerts.filter((a) => !a.resolved).length;

  // Which groups are expanded — default open all
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Infrastructure: true,
    'AI Workloads': true,
    Monitoring: true,
  });

  const toggle = (name: string) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  const isChildActive = (children: { path: string }[]) =>
    children.some((c) => location.pathname === c.path);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'flex flex-col h-screen bg-card border-r border-border w-60 fixed left-0 top-0 z-50',
          'transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0 bg-black/30">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Activity className="w-3 h-3 text-cyan-400" />
            </div>
            <div>
              <div className="text-[11px] font-bold font-mono text-cyan-400 leading-none tracking-tighter uppercase">BytePersona</div>
              <div className="text-[9px] text-muted-foreground leading-none mt-0.5 font-mono tracking-wide">Infrastructure Mon</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-accent rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
          <ul className="space-y-0.5 px-2">
            {NAV.map((item) => {
              if (item.path && !item.children) {
                // Leaf item
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between gap-2 px-3 py-1.5 rounded text-[11px] font-medium transition-colors font-mono uppercase tracking-wide',
                          isActive
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center gap-2">
                            <item.icon className="w-3.5 h-3.5 shrink-0" />
                            {item.name}
                          </span>
                          {item.name === 'Alerts' && activeAlerts > 0 && (
                            <span className={cn(
                              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                              isActive ? 'bg-primary/30 text-primary' : 'bg-red-500/20 text-red-400'
                            )}>
                              {activeAlerts}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              }

              if (item.children) {
                const open = expanded[item.name] ?? true;
                const childActive = isChildActive(item.children);
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => toggle(item.name)}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors',
                        childActive
                          ? 'text-foreground'
                          : 'text-muted-foreground/70 hover:text-muted-foreground hover:bg-accent/50'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        {item.name}
                      </span>
                      {open
                        ? <ChevronDown className="w-3 h-3" />
                        : <ChevronRight className="w-3 h-3" />
                      }
                    </button>
                    {open && (
                      <ul className="mt-0.5 ml-3 pl-2 border-l border-border space-y-0.5">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              onClick={onClose}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                                  isActive
                                    ? 'bg-primary/15 text-primary border border-primary/20'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                )
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <span className="flex items-center gap-2">
                                    <child.icon className="w-3 h-3 shrink-0" />
                                    {child.name}
                                  </span>
                                  {child.name === 'Alerts' && activeAlerts > 0 && (
                                    <span className={cn(
                                      'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                                      isActive ? 'bg-primary/30 text-primary' : 'bg-red-500/20 text-red-400'
                                    )}>
                                      {activeAlerts}
                                    </span>
                                  )}
                                </>
                              )}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return null;
            })}
          </ul>
        </nav>

        {/* Server status footer */}
        <ServerStatusFooter />
      </aside>
    </>
  );
}

function ServerStatusFooter() {
  const { hostname, uptimeSeconds } = useServerStore((s) => ({
    hostname: s.hostname,
    uptimeSeconds: s.uptimeSeconds,
  }));

  const d = Math.floor(uptimeSeconds / 86400);
  const h = Math.floor((uptimeSeconds % 86400) / 3600);

  return (
    <div className="p-3 border-t border-border shrink-0">
      <div className="flex items-center gap-2 px-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse2 shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-foreground font-mono truncate">{hostname.split('.')[0]}</p>
          <p className="text-[10px] text-muted-foreground">up {d}d {h}h</p>
        </div>
      </div>
    </div>
  );
}
