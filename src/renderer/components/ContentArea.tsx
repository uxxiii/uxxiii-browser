import { useTabStore } from '../stores/tabStore';
import { isInternalUrl, getInternalPageId } from '@shared/types';
import { NewTabPage } from '../pages/NewTabPage';
import { SettingsPage } from '../pages/SettingsPage';
import { HistoryPage } from '../pages/HistoryPage';
import { DownloadsPage } from '../pages/DownloadsPage';
import { BookmarksPage } from '../pages/BookmarksPage';
import { ThemesPage } from '../pages/ThemesPage';
import { ExtensionsPage } from '../pages/ExtensionsPage';

export function ContentArea() {
  const activeTab = useTabStore((s) => s.getActiveTab());

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <div className="text-text-tertiary text-sm">No tab selected</div>
      </div>
    );
  }

  if (!isInternalUrl(activeTab.url)) {
    // External pages render via BrowserView in the main process
    return <div className="flex-1 bg-transparent" />;
  }

  switch (getInternalPageId(activeTab.url)) {
    case 'settings':
      return <SettingsPage />;
    case 'history':
      return <HistoryPage />;
    case 'downloads':
      return <DownloadsPage />;
    case 'bookmarks':
      return <BookmarksPage />;
    case 'themes':
      return <ThemesPage />;
    case 'extensions':
      return <ExtensionsPage />;
    case 'newtab':
    default:
      return <NewTabPage />;
  }
}
