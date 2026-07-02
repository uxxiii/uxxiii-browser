import { BrowserWindow, app, screen } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { TabManager, tabManagers } from './tab-manager';
import { persistence } from './store/persistence';
import { getPreloadPath, getRendererUrl } from '@shared/constants';
import { WindowState } from '@shared/types';

export class WindowManager {
  private windows: Map<number, BrowserWindow> = new Map();

  createWindow(options: {
    incognito?: boolean;
    workspaceId?: string;
    restoreTabs?: boolean;
  } = {}): BrowserWindow {
    const settings = persistence.getSettings();
    const workspaceId = options.workspaceId ?? 'personal';
    const isIncognito = options.incognito ?? false;

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const win = new BrowserWindow({
      width: Math.min(1400, width),
      height: Math.min(900, height),
      minWidth: 800,
      minHeight: 600,
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#0f0f14',
      show: false,
      webPreferences: {
        preload: getPreloadPath(),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    const tabManager = new TabManager(win, {
      isIncognito,
      workspaceId,
      showBookmarksBar: settings.showBookmarksBar,
    });

    tabManagers.set(win.id, tabManager);
    this.windows.set(win.id, win);

    win.loadURL(getRendererUrl());

    win.once('ready-to-show', () => {
      win.show();

      if (options.restoreTabs) {
        const savedWindows = persistence.getWindows();
        const savedWindow = savedWindows.find((w) => w.workspaceId === workspaceId);
        if (savedWindow && savedWindow.tabIds.length > 0) {
          for (const tabId of savedWindow.tabIds) {
            const tab = persistence.getTab(tabId);
            if (tab) {
              tabManager.createTab({ url: tab.url, tabId: tab.id, activate: false });
            }
          }
          if (savedWindow.activeTabId) {
            tabManager.activateTab(savedWindow.activeTabId);
          }
        } else {
          tabManager.createTab({ activate: true });
        }
      } else {
        tabManager.createTab({ activate: true });
      }
    });

    win.on('closed', () => {
      tabManager.destroy();
      tabManagers.delete(win.id);
      this.windows.delete(win.id);
      this.saveSession();
    });

    win.on('resize', () => this.saveSession());
    win.on('move', () => this.saveSession());

    return win;
  }

  getWindow(id: number): BrowserWindow | undefined {
    return this.windows.get(id);
  }

  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values());
  }

  saveSession(): void {
    const settings = persistence.getSettings();
    if (!settings.restoreSession) return;

    const windows: WindowState[] = [];
    for (const [id, win] of this.windows) {
      const tabManager = tabManagers.get(id);
      if (!tabManager) continue;

      const bounds = win.getBounds();
      windows.push({
        id: String(id),
        isIncognito: false,
        workspaceId: tabManager.getWorkspaceId(),
        activeTabId: tabManager.getActiveTabId(),
        tabIds: tabManager.getAllTabs().map((t) => t.id),
        bounds,
        isMaximized: win.isMaximized(),
        isFullScreen: win.isFullScreen(),
      });
    }
    persistence.saveWindows(windows);
  }

  restoreSession(): void {
    const settings = persistence.getSettings();
    if (settings.restoreSession && settings.startupBehavior === 'restore') {
      const savedWindows = persistence.getWindows();
      if (savedWindows.length > 0) {
        for (const savedWindow of savedWindows) {
          this.createWindow({ restoreTabs: true, workspaceId: savedWindow.workspaceId });
        }
        return;
      }
    }
    this.createWindow();
  }
}

export const windowManager = new WindowManager();
