import { TitleBar } from './components/chrome/TitleBar';
import { TabBar } from './components/chrome/TabBar';
import { AddressBar } from './components/chrome/AddressBar';
import { BookmarksBar } from './components/chrome/BookmarksBar';
import { Sidebar } from './components/chrome/Sidebar';
import { FindBar } from './components/chrome/FindBar';
import { ContentArea } from './components/ContentArea';
import { DotMenu } from './components/chrome/DotMenu';
import { useBrowserInit, useKeyboardShortcuts } from './hooks/useBrowserInit';
import { useTabStore } from './stores/tabStore';
import { isInternalUrl } from '@shared/types';

export default function App() {
  useBrowserInit();
  useKeyboardShortcuts();

  const activeTab = useTabStore((s) => s.getActiveTab());
  const isInternal = activeTab && isInternalUrl(activeTab.url);

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      {/* Chrome UI - always on top */}
      <div className="relative z-50 flex flex-col shrink-0">
        <TitleBar />
        <TabBar />
        <AddressBar />
        <BookmarksBar />
      </div>

      {/* Content area — internal pages render here; external pages use BrowserView */}
      <div className="flex-1 relative overflow-hidden">
        {isInternal ? (
          <div className="absolute inset-0 z-10 overflow-auto">
            <ContentArea />
          </div>
        ) : (
          <ContentArea />
        )}
      </div>

      <div className="fixed right-3 top-[132px] z-50 no-drag">
        <DotMenu />
      </div>

      {/* Find bar */}
      <FindBar />
    </div>
  );
}
