import type {
  Tab,
  Bookmark,
  BookmarkFolder,
  HistoryEntry,
  DownloadItem,
  BrowserSettings,
  Workspace,
  SearchSuggestion,
  BackgroundSettings,
  SitePermission,
  PinnedSite,
  QuickAccessSite,
} from './types';

export interface UxxiiiAPI {
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    newWindow: (options?: { incognito?: boolean; workspaceId?: string }) => Promise<void>;
    fullscreen: () => Promise<void>;
  };
  tabs: {
    create: (options?: { url?: string; activate?: boolean }) => Promise<Tab>;
    close: (tabId: string) => Promise<void>;
    activate: (tabId: string) => Promise<void>;
    duplicate: (tabId: string) => Promise<Tab>;
    pin: (tabId: string, pinned: boolean) => Promise<void>;
    reorder: (tabIds: string[]) => Promise<void>;
    getAll: () => Promise<Tab[]>;
    getActive: () => Promise<string | null>;
    onUpdated: (callback: (tabs: Tab[]) => void) => () => void;
    onActivated: (callback: (tabId: string) => void) => () => void;
  };
  nav: {
    go: (tabId: string, url: string) => Promise<void>;
    back: (tabId: string) => Promise<void>;
    forward: (tabId: string) => Promise<void>;
    reload: (tabId: string, hard?: boolean) => Promise<void>;
    stop: (tabId: string) => Promise<void>;
    home: (tabId: string) => Promise<void>;
  };
  search: {
    suggest: (query: string) => Promise<SearchSuggestion[]>;
  };
  bookmarks: {
    getAll: () => Promise<Bookmark[]>;
    add: (data: Omit<Bookmark, 'id' | 'createdAt'>) => Promise<Bookmark>;
    remove: (id: string) => Promise<void>;
    update: (data: Partial<Bookmark> & { id: string }) => Promise<void>;
    getFolders: () => Promise<BookmarkFolder[]>;
    addFolder: (data: Omit<BookmarkFolder, 'id'>) => Promise<BookmarkFolder>;
    removeFolder: (id: string) => Promise<void>;
  };
  history: {
    getAll: () => Promise<HistoryEntry[]>;
    clear: (workspaceId?: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
    search: (query: string) => Promise<HistoryEntry[]>;
    onUpdated: (callback: () => void) => () => void;
  };
  downloads: {
    getAll: () => Promise<DownloadItem[]>;
    cancel: (id: string) => Promise<void>;
    open: (id: string) => Promise<void>;
    showInFolder: (id: string) => Promise<void>;
    clear: () => Promise<void>;
    onUpdated: (callback: (downloads: DownloadItem[]) => void) => () => void;
  };
  settings: {
    get: () => Promise<BrowserSettings>;
    update: (partial: Partial<BrowserSettings>) => Promise<BrowserSettings>;
    clearCache: () => Promise<void>;
    clearCookies: () => Promise<void>;
    reset: () => Promise<void>;
    export: () => Promise<string>;
    import: (data: string) => Promise<void>;
    onUpdated: (callback: (settings: BrowserSettings) => void) => () => void;
  };
  workspaces: {
    getAll: () => Promise<Workspace[]>;
    create: (data: Omit<Workspace, 'id' | 'createdAt' | 'tabIds'>) => Promise<Workspace>;
    switch: (workspaceId: string) => Promise<void>;
    update: (data: Partial<Workspace> & { id: string }) => Promise<void>;
    delete: (id: string) => Promise<void>;
    onSwitched: (callback: (workspaceId: string) => void) => () => void;
  };
  browser: {
    zoom: (tabId: string, level: number) => Promise<void>;
    find: (tabId: string, text: string, forward?: boolean) => Promise<void>;
    findStop: (tabId: string) => Promise<void>;
    print: (tabId: string) => Promise<void>;
    devtools: (tabId: string) => Promise<void>;
    inspect: (tabId: string, x: number, y: number) => Promise<void>;
    savePage: (tabId: string) => Promise<void>;
  };
  background: {
    selectImage: () => Promise<string | null>;
    update: (partial: Partial<BackgroundSettings>) => Promise<BackgroundSettings>;
    getImageData: (imagePath: string) => Promise<string | null>;
    onUpdated: (callback: (bg: BackgroundSettings) => void) => () => void;
  };
  dialog: {
    openFile: () => Promise<string[] | null>;
    selectFolder: () => Promise<string | null>;
  };
  ntp: {
    getPinned: () => Promise<PinnedSite[]>;
    setPinned: (sites: PinnedSite[]) => Promise<void>;
    getQuickAccess: () => Promise<QuickAccessSite[]>;
    setQuickAccess: (sites: QuickAccessSite[]) => Promise<void>;
  };
  clipboard: {
    read: () => Promise<string>;
    write: (text: string) => Promise<void>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  permissions: {
    getAll: () => Promise<SitePermission[]>;
    update: (permission: SitePermission) => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
    getPath: (name: string) => Promise<string>;
  };
  onNotification: (callback: (data: { filename: string; path: string }) => void) => () => void;
}

declare global {
  interface Window {
    uxxxiii: UxxiiiAPI;
  }
}
