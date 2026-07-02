import { create } from 'zustand';
import type { BrowserSettings, ThemeId, BackgroundSettings } from '@shared/types';
import { THEMES } from '@shared/types';

interface SettingsStore {
  settings: BrowserSettings | null;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<BrowserSettings>) => Promise<void>;
  applyTheme: (themeId: ThemeId) => void;
  applyCustomTheme: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  isLoaded: false,

  loadSettings: async () => {
    const settings = await window.uxxxiii.settings.get();
    set({ settings, isLoaded: true });
    get().applyTheme(settings.theme);
    get().applyCustomTheme();
  },

  updateSettings: async (partial) => {
    const updated = await window.uxxxiii.settings.update(partial);
    set({ settings: updated });
    if (partial.theme) get().applyTheme(partial.theme);
    if (partial.customTheme || partial.theme) get().applyCustomTheme();
  },

  applyTheme: (themeId) => {
    const theme = THEMES[themeId];
    if (!theme) return;
    const root = document.documentElement;
    const c = theme.colors;
    root.style.setProperty('--color-surface', c.surface);
    root.style.setProperty('--color-surface-secondary', c.surfaceSecondary);
    root.style.setProperty('--color-surface-tertiary', c.surfaceTertiary);
    root.style.setProperty('--color-surface-elevated', c.surfaceElevated);
    root.style.setProperty('--color-border', c.border);
    root.style.setProperty('--color-border-subtle', c.borderSubtle);
    root.style.setProperty('--color-text-primary', c.textPrimary);
    root.style.setProperty('--color-text-secondary', c.textSecondary);
    root.style.setProperty('--color-text-tertiary', c.textTertiary);
    root.style.setProperty('--color-accent', c.accent);
    root.style.setProperty('--color-accent-hover', c.accentHover);
    root.style.setProperty('--color-accent-muted', c.accentMuted);
    root.classList.toggle('dark', theme.isDark);
  },

  applyCustomTheme: () => {
    const { settings } = get();
    if (!settings) return;
    const { customTheme } = settings;
    const root = document.documentElement;
    root.style.setProperty('--color-accent', customTheme.accentColor);
    root.style.setProperty('--radius-window', `${customTheme.cornerRadius}px`);
    root.style.setProperty('--radius-card', `${Math.max(customTheme.cornerRadius - 2, 4)}px`);
    root.style.setProperty('--radius-button', `${Math.max(customTheme.cornerRadius - 4, 4)}px`);
    root.style.setProperty('--blur-amount', `${customTheme.backgroundBlur}px`);
    root.style.setProperty('--animation-speed', `${customTheme.animationSpeed}s`);
    root.style.setProperty('--sidebar-width', `${customTheme.sidebarWidth}px`);
  },
}));

interface SidebarStore {
  isOpen: boolean;
  activePanel: import('@shared/types').SidebarPanel;
  toggle: () => void;
  open: (panel: import('@shared/types').SidebarPanel) => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  isOpen: false,
  activePanel: null,

  toggle: () => {
    const { isOpen } = get();
    set({ isOpen: !isOpen, activePanel: !isOpen ? get().activePanel : null });
  },

  open: (panel) => set({ isOpen: true, activePanel: panel }),

  close: () => set({ isOpen: false, activePanel: null }),
}));

interface UIStore {
  showFindBar: boolean;
  findText: string;
  showBookmarksBar: boolean;
  isMaximized: boolean;
  setShowFindBar: (show: boolean) => void;
  setFindText: (text: string) => void;
  setShowBookmarksBar: (show: boolean) => void;
  setIsMaximized: (maximized: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  showFindBar: false,
  findText: '',
  showBookmarksBar: true,
  isMaximized: false,

  setShowFindBar: (show) => set({ showFindBar: show }),
  setFindText: (text) => set({ findText: text }),
  setShowBookmarksBar: (show) => set({ showBookmarksBar: show }),
  setIsMaximized: (maximized) => set({ isMaximized: maximized }),
}));

interface WorkspaceStore {
  workspaces: import('@shared/types').Workspace[];
  activeWorkspaceId: string;
  loadWorkspaces: () => Promise<void>;
  switchWorkspace: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  activeWorkspaceId: 'personal',

  loadWorkspaces: async () => {
    const workspaces = await window.uxxxiii.workspaces.getAll();
    set({ workspaces });
  },

  switchWorkspace: async (id) => {
    await window.uxxxiii.workspaces.switch(id);
    set({ activeWorkspaceId: id });
  },
}));

function normalizeImagePath(path: string): string {
  const normalizedPath = path.replace(/\\/g, '/');
  if (normalizedPath.startsWith('file://')) {
    return normalizedPath.replace(/^file:\/\/+/, 'file:///');
  }

  try {
    return new URL(normalizedPath, 'file:///').href;
  } catch {
    return normalizedPath;
  }
}

interface BackgroundStore {
  settings: BackgroundSettings | null;
  load: () => Promise<void>;
  update: (partial: Partial<BackgroundSettings>) => Promise<void>;
  selectImage: () => Promise<void>;
}

export const useBackgroundStore = create<BackgroundStore>((set, get) => ({
  settings: null,

  load: async () => {
    const settings = await window.uxxxiii.settings.get();
    set({ settings: settings.background });
  },

  update: async (partial) => {
    const updated = await window.uxxxiii.background.update(partial);
    set({ settings: updated });
  },

  selectImage: async () => {
    const selectedPath = await window.uxxxiii.background.selectImage();
    if (selectedPath) {
      const imagePath = normalizeImagePath(selectedPath);
      await get().update({ type: 'image', imagePath });
    }
  },
}));
