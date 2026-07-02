import { create } from 'zustand';
import type { Bookmark, BookmarkFolder, HistoryEntry, DownloadItem } from '@shared/types';

interface BookmarkStore {
  bookmarks: Bookmark[];
  folders: BookmarkFolder[];
  load: () => Promise<void>;
  add: (data: Omit<Bookmark, 'id' | 'createdAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkStore>((set, get) => ({
  bookmarks: [],
  folders: [],

  load: async () => {
    const [bookmarks, folders] = await Promise.all([
      window.uxxxiii.bookmarks.getAll(),
      window.uxxxiii.bookmarks.getFolders(),
    ]);
    set({ bookmarks, folders });
  },

  add: async (data) => {
    await window.uxxxiii.bookmarks.add(data);
    await get().load();
  },

  remove: async (id) => {
    await window.uxxxiii.bookmarks.remove(id);
    await get().load();
  },
}));

interface HistoryStore {
  entries: HistoryEntry[];
  load: () => Promise<void>;
  clear: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  search: (query: string) => Promise<HistoryEntry[]>;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: [],

  load: async () => {
    const entries = await window.uxxxiii.history.getAll();
    set({ entries });
  },

  clear: async () => {
    await window.uxxxiii.history.clear();
    set({ entries: [] });
  },

  remove: async (id) => {
    await window.uxxxiii.history.remove(id);
    await get().load();
  },

  search: async (query) => {
    return window.uxxxiii.history.search(query);
  },
}));

interface DownloadStore {
  downloads: DownloadItem[];
  load: () => Promise<void>;
  cancel: (id: string) => Promise<void>;
  open: (id: string) => Promise<void>;
  showInFolder: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloads: [],

  load: async () => {
    const downloads = await window.uxxxiii.downloads.getAll();
    set({ downloads });
  },

  cancel: async (id) => {
    await window.uxxxiii.downloads.cancel(id);
    await get().load();
  },

  open: async (id) => {
    await window.uxxxiii.downloads.open(id);
  },

  showInFolder: async (id) => {
    await window.uxxxiii.downloads.showInFolder(id);
  },

  clear: async () => {
    await window.uxxxiii.downloads.clear();
    set({ downloads: [] });
  },
}));
