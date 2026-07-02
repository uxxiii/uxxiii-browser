import { useEffect, useRef } from 'react';
import { useTabStore } from '../stores/tabStore';
import { useNavigationStore } from '../stores/navigationStore';
import { useSettingsStore, useUIStore, useWorkspaceStore, useBackgroundStore } from '../stores/settingsStore';
import { useBookmarkStore, useHistoryStore, useDownloadStore } from '../stores/dataStore';
import { isInternalUrl, SETTINGS_URL, HISTORY_URL, DOWNLOADS_URL } from '@shared/types';
import { openInternalPage } from '../lib/internal-nav';

export function useBrowserInit() {
  const setTabs = useTabStore((s) => s.setTabs);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const setAddressBarValue = useNavigationStore((s) => s.setAddressBarValue);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const setShowBookmarksBar = useUIStore((s) => s.setShowBookmarksBar);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const loadBackground = useBackgroundStore((s) => s.load);
  const loadBookmarks = useBookmarkStore((s) => s.load);
  const loadHistory = useHistoryStore((s) => s.load);
  const loadDownloads = useDownloadStore((s) => s.load);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        loadSettings(),
        loadWorkspaces(),
        loadBackground(),
        loadBookmarks(),
        loadHistory(),
        loadDownloads(),
      ]);

      const [tabs, activeTabId, settings] = await Promise.all([
        window.uxxxiii.tabs.getAll(),
        window.uxxxiii.tabs.getActive(),
        window.uxxxiii.settings.get(),
      ]);

      setTabs(tabs);
      if (activeTabId) {
        setActiveTab(activeTabId);
        const activeTab = tabs.find((t) => t.id === activeTabId);
        if (activeTab) {
          setAddressBarValue(isInternalUrl(activeTab.url) ? '' : activeTab.url);
        }
      }
      setShowBookmarksBar(settings.showBookmarksBar);
    };

    init();

    const unsubTabs = window.uxxxiii.tabs.onUpdated((tabs) => {
      setTabs(tabs);
    });

    const unsubActivated = window.uxxxiii.tabs.onActivated((tabId) => {
      setActiveTab(tabId);
      const tab = useTabStore.getState().tabs.find((t) => t.id === tabId);
      if (tab) {
        setAddressBarValue(isInternalUrl(tab.url) ? '' : tab.url);
      }
    });

    const unsubSettings = window.uxxxiii.settings.onUpdated((settings) => {
      useSettingsStore.setState({ settings });
      setShowBookmarksBar(settings.showBookmarksBar);
    });

    const unsubBackground = window.uxxxiii.background.onUpdated((background) => {
      useBackgroundStore.setState({ settings: background });
    });

    const unsubHistory = window.uxxxiii.history.onUpdated(() => {
      loadHistory();
    });

    const unsubDownloads = window.uxxxiii.downloads.onUpdated((downloads) => {
      useDownloadStore.setState({ downloads });
    });

    return () => {
      unsubTabs();
      unsubActivated();
      unsubSettings();
      unsubBackground();
      unsubHistory();
      unsubDownloads();
    };
  }, []);
}

export function useKeyboardShortcuts() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setShowFindBar = useUIStore((s) => s.setShowFindBar);
  const zoomLevelsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      const applyZoom = (delta: number) => {
        if (!activeTabId) return;
        const currentLevel = zoomLevelsRef.current[activeTabId] ?? 100;
        const nextLevel = Math.min(300, Math.max(50, currentLevel + delta));
        zoomLevelsRef.current[activeTabId] = nextLevel;
        window.uxxxiii.browser.zoom(activeTabId, nextLevel);
      };

      if (ctrl && e.key === 't') {
        e.preventDefault();
        window.uxxxiii.tabs.create({ activate: true });
      }
      if (ctrl && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) window.uxxxiii.tabs.close(activeTabId);
      }
      if (ctrl && e.key === ',') {
        e.preventDefault();
        openInternalPage(SETTINGS_URL);
      }
      if (ctrl && e.key === 'h') {
        e.preventDefault();
        openInternalPage(HISTORY_URL);
      }
      if (ctrl && e.key === 'j') {
        e.preventDefault();
        openInternalPage(DOWNLOADS_URL);
      }
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        window.uxxxiii.window.newWindow();
      }
      if (ctrl && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        window.uxxxiii.window.newWindow({ incognito: true });
      }
      if (ctrl && e.key === 'r') {
        e.preventDefault();
        if (activeTabId) window.uxxxiii.nav.reload(activeTabId, e.shiftKey);
      }
      if (ctrl && e.key === 'f') {
        e.preventDefault();
        setShowFindBar(true);
      }
      if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        applyZoom(10);
      }
      if (ctrl && e.key === '-') {
        e.preventDefault();
        applyZoom(-10);
      }
      if (e.key === 'F12') {
        e.preventDefault();
        if (activeTabId) window.uxxxiii.browser.devtools(activeTabId);
      }
      if (e.key === 'F11') {
        e.preventDefault();
        window.uxxxiii.window.fullscreen();
      }
      if (ctrl && e.key === 'l') {
        e.preventDefault();
        const input = document.querySelector('[data-address-bar]') as HTMLInputElement;
        input?.focus();
        input?.select();
      }
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        const tab = useTabStore.getState().getActiveTab();
        if (tab && !isInternalUrl(tab.url)) {
          window.uxxxiii.bookmarks.add({
            title: tab.title,
            url: tab.url,
            favicon: tab.favicon,
            workspaceId: tab.workspaceId,
          });
        }
      }
      if (ctrl && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        // Restore closed tab - would need closed tab stack
        window.uxxxiii.tabs.create({ activate: true });
      }
      if (ctrl && e.key === 'Tab') {
        e.preventDefault();
        const { tabs, activeTabId: currentId, tabOrder } = useTabStore.getState();
        if (tabs.length <= 1) return;
        const currentIndex = tabOrder.indexOf(currentId!);
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + tabOrder.length) % tabOrder.length
          : (currentIndex + 1) % tabOrder.length;
        window.uxxxiii.tabs.activate(tabOrder[nextIndex]);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTabId, setShowFindBar]);
}
