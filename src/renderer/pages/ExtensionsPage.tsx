import { Puzzle } from 'lucide-react';
import { InternalPageShell } from '../components/InternalPageShell';

export function ExtensionsPage() {
  return (
    <InternalPageShell title="Extensions">
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Puzzle size={48} className="mb-4 text-text-tertiary" />
        <h2 className="text-base font-medium text-text-primary mb-2">Extensions</h2>
        <p className="text-sm text-text-tertiary max-w-sm">
          Extension support is coming soon. Manage and install browser extensions from this page.
        </p>
      </div>
    </InternalPageShell>
  );
}
