import {
  ipcMain,
  BrowserWindow,
  dialog,
  app,
  session,
  shell,
  clipboard,
} from 'electron';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { getTabManager } from '../tab-manager';
import { windowManager } from '../window-manager';
import { downloadHandler } from '../download-handler';
import { persistence } from '../store/persistence';
import {
  normalizeUrl,
  SearchSuggestion,
  NTP_URL,
  Bookmark,
  BookmarkFolder,
  Workspace,
} from '@shared/types';

function getSenderWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

function getTabManagerFromEvent(event: Electron.IpcMainInvokeEvent) {
  const win = getSenderWindow(event);
  if (!win) return null;
  return getTabManager(win.id);
}

export function registerIpcHandlers(): void {
  // Window controls
  ipcMain.handle('window:minimize', (event) => {
    getSenderWindow(event)?.minimize();
  });

  ipcMain.handle('window:maximize', (event) => {
    const win = getSenderWindow(event);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.handle('window:close', (event) => {
    getSenderWindow(event)?.close();
  });

  ipcMain.handle('window:is-maximized', (event) => {
    return getSenderWindow(event)?.isMaximized() ?? false;
  });

  ipcMain.handle('window:new', (_event, options: { incognito?: boolean; workspaceId?: string }) => {
    windowManager.createWindow({
      incognito: options?.incognito,
      workspaceId: options?.workspaceId,
    });
  });

  ipcMain.handle('window:fullscreen', (event) => {
    const win = getSenderWindow(event);
    win?.setFullScreen(!win.isFullScreen());
  });

  // Tabs
  ipcMain.handle('tabs:create', (event, options: { url?: string; activate?: boolean }) => {
    const tm = getTabManagerFromEvent(event);
    if (!tm) return null;
    const settings = persistence.getSettings();
    const url = options?.url
      ? normalizeUrl(options.url, settings.searchEngine, settings.customSearchUrl)
      : NTP_URL;
    return tm.createTab({ url, activate: options?.activate ?? true });
  });

  ipcMain.handle('tabs:close', (event, { tabId }: { tabId: string }) => {
    getTabManagerFromEvent(event)?.closeTab(tabId);
  });

  ipcMain.handle('tabs:activate', (event, { tabId }: { tabId: string }) => {
    getTabManagerFromEvent(event)?.activateTab(tabId);
  });

  ipcMain.handle('tabs:duplicate', (event, { tabId }: { tabId: string }) => {
    return getTabManagerFromEvent(event)?.duplicateTab(tabId);
  });

  ipcMain.handle('tabs:pin', (event, { tabId, pinned }: { tabId: string; pinned: boolean }) => {
    getTabManagerFromEvent(event)?.pinTab(tabId, pinned);
  });

  ipcMain.handle('tabs:reorder', (event, { tabIds }: { tabIds: string[] }) => {
    getTabManagerFromEvent(event)?.reorderTabs(tabIds);
  });

  ipcMain.handle('tabs:get-all', (event) => {
    return getTabManagerFromEvent(event)?.getAllTabs() ?? [];
  });

  ipcMain.handle('tabs:get-active', (event) => {
    return getTabManagerFromEvent(event)?.getActiveTabId() ?? null;
  });

  // Navigation
  ipcMain.handle('nav:go', (event, { tabId, url }: { tabId: string; url: string }) => {
    const tm = getTabManagerFromEvent(event);
    if (!tm) return;
    const settings = persistence.getSettings();
    const normalized = normalizeUrl(url, settings.searchEngine, settings.customSearchUrl);
    tm.navigate(tabId, normalized);
  });

  ipcMain.handle('nav:back', (event, { tabId }: { tabId: string }) => {
    getTabManagerFromEvent(event)?.goBack(tabId);
  });

  ipcMain.handle('nav:forward', (event, { tabId }: { tabId: string }) => {
    getTabManagerFromEvent(event)?.goForward(tabId);
  });

  ipcMain.handle('nav:reload', (event, { tabId, hard }: { tabId: string; hard?: boolean }) => {
    getTabManagerFromEvent(event)?.reload(tabId, hard);
  });

  ipcMain.handle('nav:stop', (event, { tabId }: { tabId: string }) => {
    getTabManagerFromEvent(event)?.stop(tabId);
  });

  ipcMain.handle('nav:home', (event, { tabId }: { tabId: string }) => {
    // Redirect Home to the New Tab Page instead of the user homepage
    getTabManagerFromEvent(event)?.navigate(tabId, NTP_URL);
  });

  // Search suggestions
  ipcMain.handle('search:suggest', async (_event, { query }: { query: string }) => {
    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // History matches
    const history = persistence.getHistory();
    const historyMatches = history
      .filter((h) => h.title.toLowerCase().includes(lowerQuery) || h.url.toLowerCase().includes(lowerQuery))
      .slice(0, 5)
      .map((h) => ({ text: h.title, type: 'history' as const, url: h.url }));

    suggestions.push(...historyMatches);

    // Bookmark matches
    const bookmarks = persistence.getBookmarks();
    const bookmarkMatches = bookmarks
      .filter((b) => b.title.toLowerCase().includes(lowerQuery) || b.url.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .map((b) => ({ text: b.title, type: 'bookmark' as const, url: b.url }));

    suggestions.push(...bookmarkMatches);

    // Search suggestion
    if (query.trim()) {
      suggestions.push({ text: query, type: 'search' });
    }

    return suggestions;
  });

  // Bookmarks
  ipcMain.handle('bookmarks:get-all', () => persistence.getBookmarks());

  ipcMain.handle('bookmarks:add', (_event, data: Omit<Bookmark, 'id' | 'createdAt'>) => {
    const bookmark: Bookmark = { ...data, id: uuidv4(), createdAt: Date.now() };
    persistence.addBookmark(bookmark);
    return bookmark;
  });

  ipcMain.handle('bookmarks:remove', (_event, { id }: { id: string }) => {
    persistence.removeBookmark(id);
  });

  ipcMain.handle('bookmarks:update', (_event, data: Partial<Bookmark> & { id: string }) => {
    persistence.updateBookmark(data.id, data);
  });

  ipcMain.handle('bookmarks:get-folders', () => persistence.getBookmarkFolders());

  ipcMain.handle('bookmarks:add-folder', (_event, data: Omit<BookmarkFolder, 'id'>) => {
    const folder: BookmarkFolder = { ...data, id: uuidv4() };
    persistence.addBookmarkFolder(folder);
    return folder;
  });

  ipcMain.handle('bookmarks:remove-folder', (_event, { id }: { id: string }) => {
    persistence.removeBookmarkFolder(id);
  });

  // History
  ipcMain.handle('history:get-all', () => persistence.getHistory());

  ipcMain.handle('history:clear', (_event, { workspaceId }: { workspaceId?: string }) => {
    persistence.clearHistory(workspaceId);
  });

  ipcMain.handle('history:remove', (_event, { id }: { id: string }) => {
    persistence.removeHistoryEntry(id);
  });

  ipcMain.handle('history:search', (_event, { query }: { query: string }) => {
    const lower = query.toLowerCase();
    return persistence.getHistory().filter(
      (h) => h.title.toLowerCase().includes(lower) || h.url.toLowerCase().includes(lower)
    );
  });

  // Downloads
  ipcMain.handle('downloads:get-all', () => downloadHandler.getAll());

  ipcMain.handle('downloads:cancel', (_event, { id }: { id: string }) => {
    downloadHandler.cancel(id);
  });

  ipcMain.handle('downloads:open', (_event, { id }: { id: string }) => {
    downloadHandler.open(id);
  });

  ipcMain.handle('downloads:show-in-folder', (_event, { id }: { id: string }) => {
    downloadHandler.showInFolder(id);
  });

  ipcMain.handle('downloads:clear', () => downloadHandler.clear());

  // Settings
  ipcMain.handle('settings:get', () => persistence.getSettings());

  ipcMain.handle('settings:update', (_event, partial) => {
    const updated = persistence.updateSettings(partial);
    // Notify all windows
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('settings:updated', updated);
      const tm = getTabManager(win.id);
      if (tm && partial.showBookmarksBar !== undefined) {
        tm.setBookmarksBarVisible(partial.showBookmarksBar);
      }
    }
    return updated;
  });

  ipcMain.handle('settings:clear-cache', async () => {
    await session.defaultSession.clearCache();
  });

  ipcMain.handle('settings:clear-cookies', async () => {
    await session.defaultSession.clearStorageData({ storages: ['cookies'] });
  });

  ipcMain.handle('settings:reset', () => {
    persistence.reset();
    app.relaunch();
    app.exit();
  });

  ipcMain.handle('settings:export', () => persistence.exportData());

  ipcMain.handle('settings:import', (_event, { data }: { data: string }) => {
    persistence.importData(data);
  });

  // Workspaces
  ipcMain.handle('workspaces:get-all', () => persistence.getWorkspaces());

  ipcMain.handle('workspaces:create', (_event, data: Omit<Workspace, 'id' | 'createdAt' | 'tabIds'>) => {
    const workspace: Workspace = {
      ...data,
      id: uuidv4(),
      tabIds: [],
      createdAt: Date.now(),
    };
    persistence.addWorkspace(workspace);
    return workspace;
  });

  ipcMain.handle('workspaces:switch', (event, { workspaceId }: { workspaceId: string }) => {
    const win = getSenderWindow(event);
    win?.webContents.send('workspace:switched', workspaceId);
  });

  ipcMain.handle('workspaces:update', (_event, data: Partial<Workspace> & { id: string }) => {
    persistence.updateWorkspace(data.id, data);
  });

  ipcMain.handle('workspaces:delete', (_event, { id }: { id: string }) => {
    persistence.removeWorkspace(id);
  });

  // Browser features
  ipcMain.handle('browser:zoom', (event, { tabId, level }: { tabId: string; level: number }) => {
    getTabManagerFromEvent(event)?.setZoom(tabId, level);
  });

  ipcMain.handle('browser:find', (event, { tabId, text, forward }: { tabId: string; text: string; forward?: boolean }) => {
    getTabManagerFromEvent(event)?.findInPage(tabId, text, forward);
  });

  ipcMain.handle('browser:find-stop', (event, { tabId }: { tabId: string }) => {
    getTabManagerFromEvent(event)?.stopFind(tabId);
  });

  ipcMain.handle('browser:print', (event, { tabId }: { tabId: string }) => {
    getTabManagerFromEvent(event)?.print(tabId);
  });

  ipcMain.handle('browser:devtools', (event, { tabId }: { tabId: string }) => {
    getTabManagerFromEvent(event)?.openDevTools(tabId);
  });

  ipcMain.handle('browser:inspect', (event, { tabId, x, y }: { tabId: string; x: number; y: number }) => {
    getTabManagerFromEvent(event)?.inspectElement(tabId, x, y);
  });

  ipcMain.handle('browser:save-page', (event, { tabId }: { tabId: string }) => {
    getTabManagerFromEvent(event)?.savePage(tabId);
  });

  // Background
  ipcMain.handle('background:select-image', async (event) => {
    const win = getSenderWindow(event);
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;

    const srcPath = result.filePaths[0];
    const destDir = path.join(app.getPath('userData'), 'backgrounds');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, path.basename(srcPath));
    fs.copyFileSync(srcPath, destPath);
    return destPath;
  });

  ipcMain.handle('background:update', (_event, partial) => {
    const settings = persistence.getSettings();
    const background = { ...settings.background, ...partial };
    persistence.updateSettings({ background });
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('background:updated', background);
    }
    return background;
  });

  ipcMain.handle('background:get-image-data', async (_event, imagePath: string) => {
    try {
      const normalizedPath = imagePath.replace(/^file:\/\/+/, '');
      const decodedPath = decodeURIComponent(normalizedPath.replace(/\//g, path.sep));
      if (!fs.existsSync(decodedPath)) return null;
      const mimeType = `image/${path.extname(decodedPath).slice(1).toLowerCase()}`;
      const data = fs.readFileSync(decodedPath, { encoding: 'base64' });
      return `data:${mimeType};base64,${data}`;
    } catch {
      return null;
    }
  });

  // Dialogs
  ipcMain.handle('dialog:open-file', async (event) => {
    const win = getSenderWindow(event);
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Web Pages', extensions: ['html', 'htm'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : result.filePaths;
  });

  ipcMain.handle('dialog:select-folder', async (event) => {
    const win = getSenderWindow(event);
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });

  // Pinned sites & quick access
  ipcMain.handle('ntp:get-pinned', () => persistence.getPinnedSites());
  ipcMain.handle('ntp:set-pinned', (_event, sites) => {
    persistence.setPinnedSites(sites);
  });
  ipcMain.handle('ntp:get-quick-access', () => persistence.getQuickAccess());
  ipcMain.handle('ntp:set-quick-access', (_event, sites) => {
    persistence.setQuickAccess(sites);
  });

  // Clipboard
  ipcMain.handle('clipboard:read', () => clipboard.readText());
  ipcMain.handle('clipboard:write', (_event, text: string) => clipboard.writeText(text));

  // Shell
  ipcMain.handle('shell:open-external', (_event, url: string) => shell.openExternal(url));

  // Session
  ipcMain.handle('session:save', () => windowManager.saveSession());

  // App info
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('app:get-path', (_event, name: string) => app.getPath(name as any));

  // Permissions
  ipcMain.handle('permissions:get-all', () => persistence.getSitePermissions());
  ipcMain.handle('permissions:update', (_event, permission) => {
    persistence.updateSitePermission(permission);
  });
}
