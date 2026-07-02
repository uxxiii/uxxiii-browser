import {
  BrowserView,
  BrowserWindow,
  session,
  ipcMain,
  WebContents,
  Menu,
  clipboard,
  nativeImage,
  shell,
} from 'electron';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  Tab,
  NTP_URL,
  isInternalUrl,
  getFaviconUrl,
  getInternalPageTitle,
  sanitizeTabUrl,
  getInternalPageId,
} from '@shared/types';
import {
  CHROME_HEIGHT,
  CHROME_WITH_BOOKMARKS,
  SIDEBAR_WIDTH,
  getPreloadPath,
  getRendererUrl,
} from '@shared/constants';
import { persistence } from './store/persistence';

interface TabView {
  tab: Tab;
  view: BrowserView;
}

export class TabManager {
  private window: BrowserWindow;
  private tabs: Map<string, TabView> = new Map();
  private activeTabId: string | null = null;
  private isIncognito: boolean;
  private workspaceId: string;
  private showBookmarksBar: boolean;

  constructor(
    window: BrowserWindow,
    options: { isIncognito?: boolean; workspaceId?: string; showBookmarksBar?: boolean } = {}
  ) {
    this.window = window;
    this.isIncognito = options.isIncognito ?? false;
    this.workspaceId = options.workspaceId ?? 'personal';
    this.showBookmarksBar = options.showBookmarksBar ?? true;

    this.window.on('resize', () => this.updateAllBounds());
    this.window.on('maximize', () => this.updateAllBounds());
    this.window.on('unmaximize', () => this.updateAllBounds());
  }

  private getChromeHeight(): number {
    return this.showBookmarksBar ? CHROME_WITH_BOOKMARKS : CHROME_HEIGHT;
  }

  private getPartition(): string {
    return this.isIncognito ? `incognito-${uuidv4()}` : 'persist:main';
  }

  private createBrowserView(tab: Tab): BrowserView {
    const partition = this.getPartition();
    const ses = session.fromPartition(partition);

    const view = new BrowserView({
      webPreferences: {
        preload: getPreloadPath(),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        partition,
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
    });

    this.setupViewEvents(view, tab);
    this.loadUrl(view, tab.url);
    return view;
  }

  private setupViewEvents(view: BrowserView, tab: Tab): void {
    const wc = view.webContents;

    wc.on('did-start-loading', () => {
      this.updateTabState(tab.id, { isLoading: true });
    });

    wc.on('did-stop-loading', () => {
      this.updateTabState(tab.id, {
        isLoading: false,
        canGoBack: wc.canGoBack(),
        canGoForward: wc.canGoForward(),
      });
    });

    wc.on('page-title-updated', (_e, title) => {
      this.updateTabState(tab.id, { title });
    });

    wc.on('page-favicon-updated', (_e, favicons) => {
      if (favicons.length > 0) {
        this.updateTabState(tab.id, { favicon: favicons[0] });
      }
    });

    wc.on('did-navigate', (_e, url) => {
      if (url === 'about:blank') return;
      const current = this.tabs.get(tab.id);
      if (!current || isInternalUrl(current.tab.url)) return;
      this.handleNavigation(tab.id, url, wc.getTitle());
    });

    wc.on('did-navigate-in-page', (_e, url) => {
      if (url === 'about:blank') return;
      const current = this.tabs.get(tab.id);
      if (!current || isInternalUrl(current.tab.url)) return;
      this.updateTabState(tab.id, {
        url,
        canGoBack: wc.canGoBack(),
        canGoForward: wc.canGoForward(),
      });
    });

    wc.on('new-window', (e, url) => {
      e.preventDefault();
      this.createTab({ url, activate: true });
    });

    // Handle target=_blank links
    wc.setWindowOpenHandler(({ url }) => {
      this.createTab({ url, activate: true });
      return { action: 'deny' };
    });

    wc.on('context-menu', (_e, params) => {
      this.showContextMenu(wc, params);
    });

    wc.on('certificate-error', (event, _url, _error, _cert, callback) => {
      // In production, you'd show a warning. For now, proceed.
      event.preventDefault();
      callback(true);
    });

    wc.on('media-started-playing', () => {
      // Track media for PiP
    });
  }

  private handleNavigation(tabId: string, url: string, title: string): void {
    this.updateTabState(tabId, {
      url,
      title,
      favicon: getFaviconUrl(url),
      canGoBack: this.tabs.get(tabId)?.view.webContents.canGoBack() ?? false,
      canGoForward: this.tabs.get(tabId)?.view.webContents.canGoForward() ?? false,
    });

    if (!isInternalUrl(url) && !this.isIncognito) {
      persistence.addHistoryEntry({
        id: uuidv4(),
        url,
        title,
        favicon: getFaviconUrl(url),
        visitedAt: Date.now(),
        visitCount: 1,
        workspaceId: this.workspaceId,
      });
    }

    this.window.webContents.send('history:updated');
  }

  private loadUrl(view: BrowserView, url: string): void {
    if (isInternalUrl(url)) {
      // Internal pages render in the React shell — do not load BrowserView
      return;
    }
    view.webContents.loadURL(url);
  }

  private updateTabState(tabId: string, partial: Partial<Tab>): void {
    const tabView = this.tabs.get(tabId);
    if (!tabView) return;

    tabView.tab = { ...tabView.tab, ...partial };
    persistence.updateTab(tabId, partial);
    this.window.webContents.send('tabs:updated', this.getAllTabs());
  }

  private updateAllBounds(): void {
    const bounds = this.window.getContentBounds();

    for (const [id, { view, tab }] of this.tabs) {
      if (id === this.activeTabId) {
        // Only include bookmarks bar height when bookmarks are visible for this tab
        const showBookmarksForTab = isInternalUrl(tab.url) && getInternalPageId(tab.url) === 'newtab';
        const chromeHeight = showBookmarksForTab ? CHROME_WITH_BOOKMARKS : CHROME_HEIGHT;

        // Sidebar has been removed — render BrowserView at full width
        view.setBounds({
          x: 0,
          y: chromeHeight,
          width: Math.max(0, bounds.width),
          height: bounds.height - chromeHeight,
        });
      }
    }
  }

  createTab(options: { url?: string; activate?: boolean; tabId?: string } = {}): Tab {
    const tab = options.tabId
      ? persistence.getTab(options.tabId) ?? persistence.createDefaultTab(this.workspaceId)
      : persistence.createDefaultTab(this.workspaceId);

    if (options.url) {
      tab.url = options.url;
    }

    const view = this.createBrowserView(tab);
    this.tabs.set(tab.id, { tab, view });
    persistence.addTab(tab);

    if (options.activate !== false) {
      this.activateTab(tab.id);
    }

    this.window.webContents.send('tabs:updated', this.getAllTabs());
    return tab;
  }

  activateTab(tabId: string): void {
    const tabView = this.tabs.get(tabId);
    if (!tabView) return;

    // Recover tabs corrupted by prior about:blank navigations
    const sanitizedUrl = sanitizeTabUrl(tabView.tab.url);
    if (sanitizedUrl !== tabView.tab.url) {
      tabView.tab.url = sanitizedUrl;
      tabView.tab.title = getInternalPageTitle(sanitizedUrl);
      persistence.updateTab(tabId, { url: sanitizedUrl, title: tabView.tab.title });
    }

    // Hide current active tab's BrowserView
    if (this.activeTabId) {
      const current = this.tabs.get(this.activeTabId);
      if (current) {
        this.window.removeBrowserView(current.view);
      }
    }

    this.activeTabId = tabId;

    // Only show BrowserView for external URLs; internal pages render in the shell
    if (!isInternalUrl(tabView.tab.url)) {
      this.window.addBrowserView(tabView.view);
      this.updateAllBounds();
      tabView.view.webContents.focus();
    }

    this.window.webContents.send('tabs:activated', tabId);
    this.window.webContents.send('tabs:updated', this.getAllTabs());
  }

  closeTab(tabId: string): void {
    const tabView = this.tabs.get(tabId);
    if (!tabView) return;

    if (this.activeTabId === tabId) {
      this.window.removeBrowserView(tabView.view);
      this.activeTabId = null;
    }

    tabView.view.webContents.close();
    this.tabs.delete(tabId);
    persistence.removeTab(tabId);

    // Activate another tab if available
    if (this.activeTabId === null && this.tabs.size > 0) {
      const nextTab = Array.from(this.tabs.keys()).pop()!;
      this.activateTab(nextTab);
    }

    this.window.webContents.send('tabs:updated', this.getAllTabs());

    if (this.tabs.size === 0) {
      this.window.close();
    }
  }

  duplicateTab(tabId: string): Tab {
    const original = this.tabs.get(tabId);
    if (!original) return this.createTab();

    return this.createTab({
      url: original.tab.url,
      activate: true,
    });
  }

  pinTab(tabId: string, pinned: boolean): void {
    this.updateTabState(tabId, { isPinned: pinned });
  }

  reorderTabs(tabIds: string[]): void {
    // Tab order is managed in renderer state; sync here
    this.window.webContents.send('tabs:reordered', tabIds);
  }

  navigate(tabId: string, url: string): void {
    const tabView = this.tabs.get(tabId);
    if (!tabView) return;

    tabView.tab.url = url;
    persistence.updateTab(tabId, { url });

    if (isInternalUrl(url)) {
      this.window.removeBrowserView(tabView.view);
      this.updateTabState(tabId, {
        url,
        title: getInternalPageTitle(url),
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
      });
    } else {
      if (this.activeTabId === tabId) {
        this.window.addBrowserView(tabView.view);
        this.updateAllBounds();
      }
      tabView.view.webContents.loadURL(url);
    }
  }

  goBack(tabId: string): void {
    const tabView = this.tabs.get(tabId);
    if (tabView?.view.webContents.canGoBack()) {
      tabView.view.webContents.goBack();
    }
  }

  goForward(tabId: string): void {
    const tabView = this.tabs.get(tabId);
    if (tabView?.view.webContents.canGoForward()) {
      tabView.view.webContents.goForward();
    }
  }

  reload(tabId: string, hard = false): void {
    const tabView = this.tabs.get(tabId);
    if (!tabView || isInternalUrl(tabView.tab.url)) return;
    if (hard) {
      tabView.view.webContents.reloadIgnoringCache();
    } else {
      tabView.view.webContents.reload();
    }
  }

  stop(tabId: string): void {
    const tabView = this.tabs.get(tabId);
    tabView?.view.webContents.stop();
  }

  getActiveTabId(): string | null {
    return this.activeTabId;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getActiveWebContents(): WebContents | null {
    if (!this.activeTabId) return null;
    return this.tabs.get(this.activeTabId)?.view.webContents ?? null;
  }

  getTabWebContents(tabId: string): WebContents | null {
    return this.tabs.get(tabId)?.view.webContents ?? null;
  }

  getAllTabs(): Tab[] {
    return Array.from(this.tabs.values()).map((tv) => {
      const url = sanitizeTabUrl(tv.tab.url);
      if (url !== tv.tab.url) {
        tv.tab.url = url;
        tv.tab.title = getInternalPageTitle(url);
      }
      return tv.tab;
    });
  }

  setZoom(tabId: string, level: number): void {
    const tabView = this.tabs.get(tabId);
    if (tabView) {
      tabView.view.webContents.setZoomFactor(level / 100);
    }
  }

  findInPage(tabId: string, text: string, forward = true): void {
    const tabView = this.tabs.get(tabId);
    if (tabView) {
      tabView.view.webContents.findInPage(text, { forward, findNext: true });
    }
  }

  stopFind(tabId: string): void {
    const tabView = this.tabs.get(tabId);
    tabView?.view.webContents.stopFindInPage('clearSelection');
  }

  openDevTools(tabId: string): void {
    const tabView = this.tabs.get(tabId);
    tabView?.view.webContents.openDevTools({ mode: 'detach' });
  }

  inspectElement(tabId: string, x: number, y: number): void {
    const tabView = this.tabs.get(tabId);
    tabView?.view.webContents.inspectElement(x, y);
  }

  print(tabId: string): void {
    const tabView = this.tabs.get(tabId);
    tabView?.view.webContents.print({});
  }

  savePage(tabId: string): void {
    const tabView = this.tabs.get(tabId);
    if (!tabView) return;
    const url = tabView.tab.url;
    if (!isInternalUrl(url)) {
      tabView.view.webContents.savePage(
        path.join(require('electron').app.getPath('downloads'), `${tabView.tab.title}.html`),
        'HTMLComplete'
      );
    }
  }

  setBookmarksBarVisible(visible: boolean): void {
    this.showBookmarksBar = visible;
    this.updateAllBounds();
  }

  isTabInternal(tabId: string): boolean {
    const tab = this.tabs.get(tabId);
    return tab ? isInternalUrl(tab.tab.url) : false;
  }

  private showContextMenu(wc: WebContents, params: Electron.ContextMenuParams): void {
    const menu = Menu.buildFromTemplate([
      { role: 'undo', enabled: params.editFlags.canUndo },
      { role: 'redo', enabled: params.editFlags.canRedo },
      { type: 'separator' },
      { role: 'cut', enabled: params.editFlags.canCut },
      { role: 'copy', enabled: params.editFlags.canCopy },
      { role: 'paste', enabled: params.editFlags.canPaste },
      { role: 'selectAll', enabled: params.editFlags.canSelectAll },
      { type: 'separator' },
      {
        label: 'Inspect Element',
        click: () => wc.inspectElement(params.x, params.y),
      },
      {
        label: 'Copy Link Address',
        visible: params.linkURL.length > 0,
        click: () => clipboard.writeText(params.linkURL),
      },
      {
        label: 'Open Link in New Tab',
        visible: params.linkURL.length > 0,
        click: () => this.createTab({ url: params.linkURL, activate: true }),
      },
      {
        label: 'Save Image As...',
        visible: params.mediaType === 'image',
        click: () => {
          wc.downloadURL(params.srcURL);
        },
      },
      {
        label: 'Copy Image',
        visible: params.mediaType === 'image',
        click: () => {
          wc.copyImageAt(params.x, params.y);
        },
      },
    ]);
    menu.popup();
  }

  destroy(): void {
    for (const [, { view }] of this.tabs) {
      view.webContents.close();
    }
    this.tabs.clear();
  }
}

export const tabManagers = new Map<number, TabManager>();

export function getTabManager(windowId: number): TabManager | undefined {
  return tabManagers.get(windowId);
}
