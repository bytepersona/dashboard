import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset by sidebar width on lg */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-accent rounded-md transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <LiveIndicator />
        </header>

        {/* Page */}
        <main className={cn('flex-1 p-4 lg:p-6 overflow-auto', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}

function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 ml-auto">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse2" />
      <span className="text-xs text-muted-foreground font-mono">LIVE · 2s</span>
    </div>
  );
}
