import { InternalPageShell } from '../components/InternalPageShell';
import { BookmarksPanel } from '../components/panels/BookmarksPanel';

export function BookmarksPage() {
  return (
    <InternalPageShell title="Bookmarks">
      <BookmarksPanel />
    </InternalPageShell>
  );
}
