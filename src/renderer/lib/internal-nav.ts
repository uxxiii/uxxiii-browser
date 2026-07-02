import { useTabStore } from '../stores/tabStore';

export function openInternalPage(url: string): void {
  const activeTabId = useTabStore.getState().activeTabId;
  if (activeTabId) {
    window.uxxxiii.nav.go(activeTabId, url);
  } else {
    window.uxxxiii.tabs.create({ url, activate: true });
  }
}
