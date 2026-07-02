import { InternalPageShell } from '../components/InternalPageShell';
import { ThemesPanel } from '../components/panels/ThemesPanel';

export function ThemesPage() {
  return (
    <InternalPageShell title="Themes">
      <ThemesPanel />
    </InternalPageShell>
  );
}
