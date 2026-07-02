import { InternalPageShell } from '../components/InternalPageShell';
import { DownloadsPanel } from '../components/panels/DownloadsPanel';

export function DownloadsPage() {
  return (
    <InternalPageShell title="Downloads">
      <DownloadsPanel />
    </InternalPageShell>
  );
}
