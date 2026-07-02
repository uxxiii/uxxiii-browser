import { contextBridge, ipcRenderer } from 'electron';
import type { UxxiiiAPI } from '@shared/api';

function createListener<T>(channel: string, callback: (data: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, data: T) => callback(data);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const api: UxxiiiAPI = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    newWindow: (options) => ipcRenderer.invoke('window:new', options),
    fullscreen: () => ipcRenderer.invoke('window:fullscreen'),
  },

  tabs: {
    create: (options) => ipcRenderer.invoke('tabs:create', options),
    close: (tabId) => ipcRenderer.invoke('tabs:close', { tabId }),
    activate: (tabId) => ipcRenderer.invoke('tabs:activate', { tabId }),
    duplicate: (tabId) => ipcRenderer.invoke('tabs:duplicate', { tabId }),
    pin: (tabId, pinned) => ipcRenderer.invoke('tabs:pin', { tabId, pinned }),
    reorder: (tabIds) => ipcRenderer.invoke('tabs:reorder', { tabIds }),
    getAll: () => ipcRenderer.invoke('tabs:get-all'),
    getActive: () => ipcRenderer.invoke('tabs:get-active'),
    onUpdated: (callback) => createListener('tabs:updated', callback),
    onActivated: (callback) => createListener('tabs:activated', callback),
  },

  nav: {
    go: (tabId, url) => ipcRenderer.invoke('nav:go', { tabId, url }),
    back: (tabId) => ipcRenderer.invoke('nav:back', { tabId }),
    forward: (tabId) => ipcRenderer.invoke('nav:forward', { tabId }),
    reload: (tabId, hard) => ipcRenderer.invoke('nav:reload', { tabId, hard }),
    stop: (tabId) => ipcRenderer.invoke('nav:stop', { tabId }),
    home: (tabId) => ipcRenderer.invoke('nav:home', { tabId }),
  },

  search: {
    suggest: (query) => ipcRenderer.invoke('search:suggest', { query }),
  },

  bookmarks: {
    getAll: () => ipcRenderer.invoke('bookmarks:get-all'),
    add: (data) => ipcRenderer.invoke('bookmarks:add', data),
    remove: (id) => ipcRenderer.invoke('bookmarks:remove', { id }),
    update: (data) => ipcRenderer.invoke('bookmarks:update', data),
    getFolders: () => ipcRenderer.invoke('bookmarks:get-folders'),
    addFolder: (data) => ipcRenderer.invoke('bookmarks:add-folder', data),
    removeFolder: (id) => ipcRenderer.invoke('bookmarks:remove-folder', { id }),
  },

  history: {
    getAll: () => ipcRenderer.invoke('history:get-all'),
    clear: (workspaceId) => ipcRenderer.invoke('history:clear', { workspaceId }),
    remove: (id) => ipcRenderer.invoke('history:remove', { id }),
    search: (query) => ipcRenderer.invoke('history:search', { query }),
    onUpdated: (callback) => createListener('history:updated', callback),
  },

  downloads: {
    getAll: () => ipcRenderer.invoke('downloads:get-all'),
    cancel: (id) => ipcRenderer.invoke('downloads:cancel', { id }),
    open: (id) => ipcRenderer.invoke('downloads:open', { id }),
    showInFolder: (id) => ipcRenderer.invoke('downloads:show-in-folder', { id }),
    clear: () => ipcRenderer.invoke('downloads:clear'),
    onUpdated: (callback) => createListener('downloads:updated', callback),
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (partial) => ipcRenderer.invoke('settings:update', partial),
    clearCache: () => ipcRenderer.invoke('settings:clear-cache'),
    clearCookies: () => ipcRenderer.invoke('settings:clear-cookies'),
    reset: () => ipcRenderer.invoke('settings:reset'),
    export: () => ipcRenderer.invoke('settings:export'),
    import: (data) => ipcRenderer.invoke('settings:import', { data }),
    onUpdated: (callback) => createListener('settings:updated', callback),
  },

  workspaces: {
    getAll: () => ipcRenderer.invoke('workspaces:get-all'),
    create: (data) => ipcRenderer.invoke('workspaces:create', data),
    switch: (workspaceId) => ipcRenderer.invoke('workspaces:switch', { workspaceId }),
    update: (data) => ipcRenderer.invoke('workspaces:update', data),
    delete: (id) => ipcRenderer.invoke('workspaces:delete', { id }),
    onSwitched: (callback) => createListener('workspace:switched', callback),
  },

  browser: {
    zoom: (tabId, level) => ipcRenderer.invoke('browser:zoom', { tabId, level }),
    find: (tabId, text, forward) => ipcRenderer.invoke('browser:find', { tabId, text, forward }),
    findStop: (tabId) => ipcRenderer.invoke('browser:find-stop', { tabId }),
    print: (tabId) => ipcRenderer.invoke('browser:print', { tabId }),
    devtools: (tabId) => ipcRenderer.invoke('browser:devtools', { tabId }),
    inspect: (tabId, x, y) => ipcRenderer.invoke('browser:inspect', { tabId, x, y }),
    savePage: (tabId) => ipcRenderer.invoke('browser:save-page', { tabId }),
  },

  background: {
    selectImage: () => ipcRenderer.invoke('background:select-image'),
    update: (partial) => ipcRenderer.invoke('background:update', partial),
    getImageData: (imagePath) => ipcRenderer.invoke('background:get-image-data', imagePath),
    onUpdated: (callback) => createListener('background:updated', callback),
  },

  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:open-file'),
    selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  },

  ntp: {
    getPinned: () => ipcRenderer.invoke('ntp:get-pinned'),
    setPinned: (sites) => ipcRenderer.invoke('ntp:set-pinned', sites),
    getQuickAccess: () => ipcRenderer.invoke('ntp:get-quick-access'),
    setQuickAccess: (sites) => ipcRenderer.invoke('ntp:set-quick-access', sites),
  },

  clipboard: {
    read: () => ipcRenderer.invoke('clipboard:read'),
    write: (text) => ipcRenderer.invoke('clipboard:write', text),
  },

  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  },

  permissions: {
    getAll: () => ipcRenderer.invoke('permissions:get-all'),
    update: (permission) => ipcRenderer.invoke('permissions:update', permission),
  },

  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPath: (name) => ipcRenderer.invoke('app:get-path', name),
  },

  onNotification: (callback) => createListener('notification:download-complete', callback),
};

contextBridge.exposeInMainWorld('uxxxiii', api);
