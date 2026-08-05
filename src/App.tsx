import { Routes, Route } from 'react-router-dom';
import { useServerTick } from '@/hooks/useServerTick';
import { Toaster } from '@/components/ui/sonner';
import { OverviewPage }   from '@/pages/OverviewPage';
import { ComputePage }    from '@/pages/ComputePage';
import { MemoryPage }     from '@/pages/MemoryPage';
import { StoragePage }    from '@/pages/StoragePage';
import { NetworkPage }    from '@/pages/NetworkPage';
import { InferencePage }  from '@/pages/InferencePage';
import { ModelsPage }     from '@/pages/ModelsPage';
import { QueuePage }      from '@/pages/QueuePage';
import { LogsPage }       from '@/pages/LogsPage';
import { AlertsPage }     from '@/pages/AlertsPage';
import { MetricsPage }    from '@/pages/MetricsPage';
import { SettingsPage }   from '@/pages/SettingsPage';

export default function App() {
  useServerTick(); // global 2-second tick

  return (
    <>
      <Routes>
        <Route path="/"          element={<OverviewPage />} />
        <Route path="/compute"   element={<ComputePage />} />
        <Route path="/memory"    element={<MemoryPage />} />
        <Route path="/storage"   element={<StoragePage />} />
        <Route path="/network"   element={<NetworkPage />} />
        <Route path="/inference" element={<InferencePage />} />
        <Route path="/models"    element={<ModelsPage />} />
        <Route path="/queue"     element={<QueuePage />} />
        <Route path="/logs"      element={<LogsPage />} />
        <Route path="/alerts"    element={<AlertsPage />} />
        <Route path="/metrics"   element={<MetricsPage />} />
        <Route path="/settings"  element={<SettingsPage />} />
        <Route path="/settings/:tab" element={<SettingsPage />} />
      </Routes>
      <Toaster />
    </>
  );
}
