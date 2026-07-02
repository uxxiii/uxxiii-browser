import { SettingsPanel } from '../components/panels/SettingsPanel';
import { InternalPageShell } from '../components/InternalPageShell';

export function SettingsPage() {
  return (
    <InternalPageShell title="Settings">
      <SettingsPanel />
    </InternalPageShell>
  );
}
