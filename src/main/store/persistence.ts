import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import { app } from 'electron';
import {
  SessionData,
  DEFAULT_SETTINGS,
  DEFAULT_WORKSPACES,
  Tab,
  Bookmark,
  HistoryEntry,
  Workspace,
  WindowState,
  BrowserSettings,
  PinnedSite,
  QuickAccessSite,
  SitePermission,
  BookmarkFolder,
  NTP_URL,
  sanitizeTabUrl,
  getInternalPageTitle,
} from '@shared/types';

function createDefaultSession(): SessionData {
  let downloadPath = '';
  try {
    downloadPath = app.getPath('downloads');
  } catch {
    downloadPath = '';
  }

  return {
    windows: [],
    tabs: [],
    workspaces: DEFAULT_WORKSPACES.map((w) => ({ ...w, tabIds: [] })),
    bookmarks: [],
    bookmarkFolders: [],
    history: [],
    settings: {
      ...DEFAULT_SETTINGS,
      downloadPath,
    },
    pinnedSites: [
      { id: uuidv4(), title: 'GitHub', url: 'https://github.com' },
      { id: uuidv4(), title: 'YouTube', url: 'https://youtube.com' },
      { id: uuidv4(), title: 'Reddit', url: 'https://reddit.com' },
      { id: uuidv4(), title: 'Twitter', url: 'https://twitter.com' },
    ],
    quickAccess: [
      { id: uuidv4(), title: 'Google', url: 'https://google.com' },
      { id: uuidv4(), title: 'Wikipedia', url: 'https://wikipedia.org' },
      { id: uuidv4(), title: 'Stack Overflow', url: 'https://stackoverflow.com' },
      { id: uuidv4(), title: 'MDN', url: 'https://developer.mozilla.org' },
    ],
    sitePermissions: [],
  };
}

class PersistenceStore {
  private store: Store<SessionData>;

  constructor() {
    this.store = new Store<SessionData>({
      name: 'uxxxiii-browser',
      defaults: createDefaultSession(),
    });
  }

  getSession(): SessionData {
    return this.store.store;
  }

  getSettings(): BrowserSettings {
    const settings = this.store.get('settings', DEFAULT_SETTINGS) as BrowserSettings;
    const migratedSettings: BrowserSettings = {
      ...DEFAULT_SETTINGS,
      ...settings,
      homepage: settings.homepage === NTP_URL ? DEFAULT_SETTINGS.homepage : settings.homepage,
    };

    if (JSON.stringify(settings) !== JSON.stringify(migratedSettings)) {
      this.store.set('settings', migratedSettings);
    }

    return migratedSettings;
  }

  updateSettings(partial: Partial<BrowserSettings>): BrowserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    this.store.set('settings', updated);
    return updated;
  }

  getTabs(): Tab[] {
    return this.store.get('tabs', []);
  }

  getTab(id: string): Tab | undefined {
    const tab = this.getTabs().find((t) => t.id === id);
    if (!tab) return undefined;
    const url = sanitizeTabUrl(tab.url);
    if (url !== tab.url) {
      return this.updateTab(id, { url, title: getInternalPageTitle(url) }) ?? { ...tab, url, title: getInternalPageTitle(url) };
    }
    return tab;
  }

  addTab(tab: Tab): void {
    const tabs = this.getTabs();
    tabs.push(tab);
    this.store.set('tabs', tabs);
  }

  updateTab(id: string, partial: Partial<Tab>): Tab | undefined {
    const tabs = this.getTabs();
    const index = tabs.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
    tabs[index] = { ...tabs[index], ...partial };
    this.store.set('tabs', tabs);
    return tabs[index];
  }

  removeTab(id: string): void {
    const tabs = this.getTabs().filter((t) => t.id !== id);
    this.store.set('tabs', tabs);
  }

  getBookmarks(): Bookmark[] {
    return this.store.get('bookmarks', []);
  }

  addBookmark(bookmark: Bookmark): void {
    const bookmarks = this.getBookmarks();
    bookmarks.push(bookmark);
    this.store.set('bookmarks', bookmarks);
  }

  removeBookmark(id: string): void {
    this.store.set('bookmarks', this.getBookmarks().filter((b) => b.id !== id));
  }

  updateBookmark(id: string, partial: Partial<Bookmark>): void {
    const bookmarks = this.getBookmarks();
    const index = bookmarks.findIndex((b) => b.id === id);
    if (index !== -1) {
      bookmarks[index] = { ...bookmarks[index], ...partial };
      this.store.set('bookmarks', bookmarks);
    }
  }

  getBookmarkFolders(): BookmarkFolder[] {
    return this.store.get('bookmarkFolders', []);
  }

  addBookmarkFolder(folder: BookmarkFolder): void {
    const folders = this.getBookmarkFolders();
    folders.push(folder);
    this.store.set('bookmarkFolders', folders);
  }

  removeBookmarkFolder(id: string): void {
    this.store.set('bookmarkFolders', this.getBookmarkFolders().filter((f) => f.id !== id));
  }

  getHistory(): HistoryEntry[] {
    return this.store.get('history', []);
  }

  addHistoryEntry(entry: HistoryEntry): void {
    const history = this.getHistory();
    const existing = history.find((h) => h.url === entry.url && h.workspaceId === entry.workspaceId);
    if (existing) {
      existing.visitCount++;
      existing.visitedAt = entry.visitedAt;
      existing.title = entry.title;
    } else {
      history.unshift(entry);
    }
    // Keep last 10000 entries
    if (history.length > 10000) history.length = 10000;
    this.store.set('history', history);
  }

  clearHistory(workspaceId?: string): void {
    if (workspaceId) {
      this.store.set('history', this.getHistory().filter((h) => h.workspaceId !== workspaceId));
    } else {
      this.store.set('history', []);
    }
  }

  removeHistoryEntry(id: string): void {
    this.store.set('history', this.getHistory().filter((h) => h.id !== id));
  }

  getWorkspaces(): Workspace[] {
    return this.store.get('workspaces', []);
  }

  addWorkspace(workspace: Workspace): void {
    const workspaces = this.getWorkspaces();
    workspaces.push(workspace);
    this.store.set('workspaces', workspaces);
  }

  updateWorkspace(id: string, partial: Partial<Workspace>): void {
    const workspaces = this.getWorkspaces();
    const index = workspaces.findIndex((w) => w.id === id);
    if (index !== -1) {
      workspaces[index] = { ...workspaces[index], ...partial };
      this.store.set('workspaces', workspaces);
    }
  }

  removeWorkspace(id: string): void {
    this.store.set('workspaces', this.getWorkspaces().filter((w) => w.id !== id));
  }

  getWindows(): WindowState[] {
    return this.store.get('windows', []);
  }

  saveWindows(windows: WindowState[]): void {
    this.store.set('windows', windows);
  }

  getPinnedSites(): PinnedSite[] {
    return this.store.get('pinnedSites', []);
  }

  setPinnedSites(sites: PinnedSite[]): void {
    this.store.set('pinnedSites', sites);
  }

  getQuickAccess(): QuickAccessSite[] {
    return this.store.get('quickAccess', []);
  }

  setQuickAccess(sites: QuickAccessSite[]): void {
    this.store.set('quickAccess', sites);
  }

  getSitePermissions(): SitePermission[] {
    return this.store.get('sitePermissions', []);
  }

  updateSitePermission(permission: SitePermission): void {
    const permissions = this.getSitePermissions();
    const index = permissions.findIndex((p) => p.origin === permission.origin);
    if (index !== -1) {
      permissions[index] = permission;
    } else {
      permissions.push(permission);
    }
    this.store.set('sitePermissions', permissions);
  }

  exportData(): string {
    return JSON.stringify(this.store.store, null, 2);
  }

  importData(json: string): void {
    const data = JSON.parse(json) as SessionData;
    this.store.set(data);
  }

  reset(): void {
    this.store.clear();
    this.store.set(createDefaultSession());
  }

  createDefaultTab(workspaceId: string): Tab {
    return {
      id: uuidv4(),
      url: NTP_URL,
      title: 'New Tab',
      isPinned: false,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isMuted: false,
      workspaceId,
      createdAt: Date.now(),
    };
  }
}

export const persistence = new PersistenceStore();
