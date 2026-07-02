import { InternalPageShell } from '../components/InternalPageShell';
import { HistoryPanel } from '../components/panels/HistoryPanel';

export function HistoryPage() {
  return (
    <InternalPageShell title="History">
      <HistoryPanel />
    </InternalPageShell>
  );
}
