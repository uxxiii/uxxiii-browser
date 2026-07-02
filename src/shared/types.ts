export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isPinned: boolean;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isMuted: boolean;
  workspaceId: string;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  folderId?: string;
  workspaceId: string;
  createdAt: number;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string;
  workspaceId: string;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  visitedAt: number;
  visitCount: number;
  workspaceId: string;
}

export interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  path: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  startTime: number;
  endTime?: number;
  mimeType?: string;
}

export const SEARCH_ENGINES = {
  google: {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=%s',
    suggestUrl: 'https://suggestqueries.google.com/complete/search?client=firefox&q=%s',
  },
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=%s',
    suggestUrl: 'https://duckduckgo.com/ac/?q=%s&type=list',
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=%s',
    suggestUrl: 'https://api.bing.com/osjson.aspx?query=%s',
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    url: 'https://www.google.com/search?q=%s',
  },
} as const;

export type SearchEngine = keyof typeof SEARCH_ENGINES;

export type ThemeId =
  | 'light'
  | 'dark'
  | 'oled'
  | 'minimal'
  | 'glass'
  | 'nord'
  | 'tokyo-night'
  | 'solarized'
  | 'dracula';

export interface SearchEngineConfig {
  id: SearchEngine;
  name: string;
  url: string;
  suggestUrl?: string;
}


export interface ThemeConfig {
  id: ThemeId;
  name: string;
  colors: {
    surface: string;
    surfaceSecondary: string;
    surfaceTertiary: string;
    surfaceElevated: string;
    border: string;
    borderSubtle: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    accent: string;
    accentHover: string;
    accentMuted: string;
  };
  isDark: boolean;
}

export interface CustomThemeSettings {
  accentColor: string;
  backgroundBlur: number;
  transparency: number;
  cornerRadius: number;
  sidebarWidth: number;
  animationSpeed: number;
}

export interface BackgroundSettings {
  type: 'default' | 'gradient' | 'image';
  imagePath?: string;
  blur: number;
  brightness: number;
  opacity: number;
  position: 'center' | 'top' | 'bottom' | 'cover';
  scaling: 'cover' | 'contain' | 'fill';
  overlayEnabled?: boolean;
  overlayOpacity?: number;
  overlayColor?: string;
  accessibilityMode?: 'auto' | 'overlay' | 'none';
  highContrast?: boolean;
  // solid or gradient colors for non-image backgrounds
  solidColor?: string;
  gradientColors?: string[];
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  tabIds: string[];
  themeId: ThemeId;
  background: BackgroundSettings;
  createdAt: number;
}

export interface PinnedSite {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

export interface QuickAccessSite {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

export interface BrowserSettings {
  searchEngine: SearchEngine;
  customSearchUrl: string;
  homepage: string;
  downloadPath: string;
  askDownloadLocation: boolean;
  hardwareAcceleration: boolean;
  blockTrackers: boolean;
  blockThirdPartyCookies: boolean;
  doNotTrack: boolean;
  clearOnExit: boolean;
  restoreSession: boolean;
  startupBehavior: 'new-tab' | 'restore' | 'homepage';
  language: string;
  fontSize: number;
  fontFamily: string;
  defaultZoom: number;
  showBookmarksBar: boolean;
  sidebarCollapsed: boolean;
  theme: ThemeId;
  customTheme: CustomThemeSettings;
  background: BackgroundSettings;
  keyboardShortcuts: Record<string, string>;
}

export interface WindowState {
  id: string;
  isIncognito: boolean;
  workspaceId: string;
  activeTabId: string | null;
  tabIds: string[];
  bounds: { x: number; y: number; width: number; height: number };
  isMaximized: boolean;
  isFullScreen: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'history' | 'bookmark' | 'search' | 'url';
  url?: string;
}

export interface SitePermission {
  origin: string;
  notifications: 'allow' | 'deny' | 'ask';
  geolocation: 'allow' | 'deny' | 'ask';
  camera: 'allow' | 'deny' | 'ask';
  microphone: 'allow' | 'deny' | 'ask';
}

export interface SessionData {
  windows: WindowState[];
  tabs: Tab[];
  workspaces: Workspace[];
  bookmarks: Bookmark[];
  bookmarkFolders: BookmarkFolder[];
  history: HistoryEntry[];
  settings: BrowserSettings;
  pinnedSites: PinnedSite[];
  quickAccess: QuickAccessSite[];
  sitePermissions: SitePermission[];
}

export type SidebarPanel =
  | 'bookmarks'
  | 'history'
  | 'downloads'
  | 'settings'
  | 'extensions'
  | 'themes'
  | 'ai'
  | null;

export interface IPCChannels {
  // Window
  'window:minimize': void;
  'window:maximize': void;
  'window:close': void;
  'window:new': { incognito?: boolean; workspaceId?: string };
  'window:get-state': WindowState;

  // Tabs
  'tabs:create': { url?: string; workspaceId?: string; activate?: boolean };
  'tabs:close': { tabId: string };
  'tabs:activate': { tabId: string };
  'tabs:duplicate': { tabId: string };
  'tabs:pin': { tabId: string; pinned: boolean };
  'tabs:reorder': { tabIds: string[] };
  'tabs:get-all': Tab[];
  'tabs:update': Partial<Tab> & { id: string };

  // Navigation
  'nav:go': { tabId: string; url: string };
  'nav:back': { tabId: string };
  'nav:forward': { tabId: string };
  'nav:reload': { tabId: string; hard?: boolean };
  'nav:stop': { tabId: string };
  'nav:home': { tabId: string };

  // Search
  'search:suggest': { query: string };
  'search:get-history': HistoryEntry[];

  // Bookmarks
  'bookmarks:get-all': Bookmark[];
  'bookmarks:add': Omit<Bookmark, 'id' | 'createdAt'>;
  'bookmarks:remove': { id: string };
  'bookmarks:update': Partial<Bookmark> & { id: string };
  'bookmarks:get-folders': BookmarkFolder[];
  'bookmarks:add-folder': Omit<BookmarkFolder, 'id'>;
  'bookmarks:remove-folder': { id: string };

  // History
  'history:get-all': HistoryEntry[];
  'history:clear': { workspaceId?: string };
  'history:remove': { id: string };
  'history:search': { query: string };

  // Downloads
  'downloads:get-all': DownloadItem[];
  'downloads:cancel': { id: string };
  'downloads:open': { id: string };
  'downloads:show-in-folder': { id: string };
  'downloads:clear': void;

  // Settings
  'settings:get': BrowserSettings;
  'settings:update': Partial<BrowserSettings>;
  'settings:clear-cache': void;
  'settings:clear-cookies': void;
  'settings:reset': void;
  'settings:export': string;
  'settings:import': { data: string };

  // Workspaces
  'workspaces:get-all': Workspace[];
  'workspaces:create': Omit<Workspace, 'id' | 'createdAt' | 'tabIds'>;
  'workspaces:switch': { workspaceId: string };
  'workspaces:update': Partial<Workspace> & { id: string };
  'workspaces:delete': { id: string };

  // Browser features
  'browser:zoom': { tabId: string; level: number };
  'browser:find': { tabId: string; text: string; forward?: boolean };
  'browser:find-stop': { tabId: string };
  'browser:print': { tabId: string };
  'browser:devtools': { tabId: string };
  'browser:inspect': { tabId: string; x: number; y: number };
  'browser:save-page': { tabId: string };
  'browser:fullscreen': void;
  'browser:pip': { tabId: string };

  // Background
  'background:select-image': string | null;
  'background:update': Partial<BackgroundSettings>;

  // Dialogs
  'dialog:open-file': string[] | null;
  'dialog:select-folder': string | null;

  // Session
  'session:restore': void;
  'session:save': void;
}

export const DEFAULT_SETTINGS: BrowserSettings = {
  searchEngine: 'google',
  customSearchUrl: 'https://www.google.com/search?q=%s',
  homepage: 'https://www.google.com',
  downloadPath: '',
  askDownloadLocation: false,
  hardwareAcceleration: true,
  blockTrackers: true,
  blockThirdPartyCookies: false,
  doNotTrack: true,
  clearOnExit: false,
  restoreSession: true,
  startupBehavior: 'restore',
  language: 'en',
  fontSize: 14,
  fontFamily: 'Inter',
  defaultZoom: 100,
  showBookmarksBar: true,
  sidebarCollapsed: false,
  theme: 'dark',
  customTheme: {
    accentColor: '#6366f1',
    backgroundBlur: 20,
    transparency: 0.85,
    cornerRadius: 12,
    sidebarWidth: 280,
    animationSpeed: 0.3,
  },
  background: {
    type: 'gradient',
    blur: 0,
    brightness: 100,
    opacity: 100,
    position: 'center',
    scaling: 'cover',
    overlayEnabled: false,
    overlayOpacity: 40,
    overlayColor: '#000000',
    accessibilityMode: 'auto',
    highContrast: false,
    solidColor: '#0f172a',
    gradientColors: ['#667eea', '#764ba2', '#f093fb'],
  },
  keyboardShortcuts: {
    'new-tab': 'Ctrl+T',
    'close-tab': 'Ctrl+W',
    'new-window': 'Ctrl+N',
    'incognito': 'Ctrl+Shift+N',
    'reload': 'Ctrl+R',
    'hard-reload': 'Ctrl+Shift+R',
    'find': 'Ctrl+F',
    'devtools': 'F12',
    'back': 'Alt+Left',
    'forward': 'Alt+Right',
    'fullscreen': 'F11',
  },
};

export const DEFAULT_WORKSPACES: Omit<Workspace, 'tabIds'>[] = [
  { id: 'personal', name: 'Personal', icon: 'user', color: '#6366f1', themeId: 'dark', background: DEFAULT_SETTINGS.background, createdAt: Date.now() },
  { id: 'study', name: 'Study', icon: 'book-open', color: '#10b981', themeId: 'nord', background: DEFAULT_SETTINGS.background, createdAt: Date.now() },
  { id: 'coding', name: 'Coding', icon: 'code', color: '#f59e0b', themeId: 'tokyo-night', background: DEFAULT_SETTINGS.background, createdAt: Date.now() },
  { id: 'entertainment', name: 'Entertainment', icon: 'play', color: '#ec4899', themeId: 'dracula', background: DEFAULT_SETTINGS.background, createdAt: Date.now() },
];

export const THEMES: Record<ThemeId, ThemeConfig> = {
  light: {
    id: 'light',
    name: 'Light',
    isDark: false,
    colors: {
      surface: '#ffffff',
      surfaceSecondary: '#f8f9fa',
      surfaceTertiary: '#f1f3f5',
      surfaceElevated: '#ffffff',
      border: '#e9ecef',
      borderSubtle: '#f1f3f5',
      textPrimary: '#1a1a2e',
      textSecondary: '#495057',
      textTertiary: '#868e96',
      accent: '#6366f1',
      accentHover: '#4f46e5',
      accentMuted: 'rgba(99, 102, 241, 0.15)',
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    isDark: true,
    colors: {
      surface: '#0f0f14',
      surfaceSecondary: '#16161d',
      surfaceTertiary: '#1e1e28',
      surfaceElevated: '#252530',
      border: '#2a2a38',
      borderSubtle: '#1e1e28',
      textPrimary: '#f0f0f5',
      textSecondary: '#a0a0b0',
      textTertiary: '#606070',
      accent: '#6366f1',
      accentHover: '#818cf8',
      accentMuted: 'rgba(99, 102, 241, 0.2)',
    },
  },
  oled: {
    id: 'oled',
    name: 'OLED',
    isDark: true,
    colors: {
      surface: '#000000',
      surfaceSecondary: '#0a0a0a',
      surfaceTertiary: '#111111',
      surfaceElevated: '#1a1a1a',
      border: '#222222',
      borderSubtle: '#111111',
      textPrimary: '#ffffff',
      textSecondary: '#999999',
      textTertiary: '#666666',
      accent: '#6366f1',
      accentHover: '#818cf8',
      accentMuted: 'rgba(99, 102, 241, 0.25)',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    isDark: false,
    colors: {
      surface: '#fafafa',
      surfaceSecondary: '#f5f5f5',
      surfaceTertiary: '#eeeeee',
      surfaceElevated: '#ffffff',
      border: '#e0e0e0',
      borderSubtle: '#f0f0f0',
      textPrimary: '#212121',
      textSecondary: '#757575',
      textTertiary: '#9e9e9e',
      accent: '#424242',
      accentHover: '#616161',
      accentMuted: 'rgba(66, 66, 66, 0.1)',
    },
  },
  glass: {
    id: 'glass',
    name: 'Glass',
    isDark: true,
    colors: {
      surface: 'rgba(15, 15, 20, 0.6)',
      surfaceSecondary: 'rgba(22, 22, 29, 0.7)',
      surfaceTertiary: 'rgba(30, 30, 40, 0.8)',
      surfaceElevated: 'rgba(37, 37, 48, 0.85)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderSubtle: 'rgba(255, 255, 255, 0.04)',
      textPrimary: '#f0f0f5',
      textSecondary: '#a0a0b0',
      textTertiary: '#606070',
      accent: '#818cf8',
      accentHover: '#a5b4fc',
      accentMuted: 'rgba(129, 140, 248, 0.2)',
    },
  },
  nord: {
    id: 'nord',
    name: 'Nord',
    isDark: true,
    colors: {
      surface: '#2e3440',
      surfaceSecondary: '#3b4252',
      surfaceTertiary: '#434c5e',
      surfaceElevated: '#4c566a',
      border: '#4c566a',
      borderSubtle: '#3b4252',
      textPrimary: '#eceff4',
      textSecondary: '#d8dee9',
      textTertiary: '#81a1c1',
      accent: '#88c0d0',
      accentHover: '#8fbcbb',
      accentMuted: 'rgba(136, 192, 208, 0.2)',
    },
  },
  'tokyo-night': {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    isDark: true,
    colors: {
      surface: '#1a1b26',
      surfaceSecondary: '#24283b',
      surfaceTertiary: '#292e42',
      surfaceElevated: '#32364a',
      border: '#414868',
      borderSubtle: '#292e42',
      textPrimary: '#c0caf5',
      textSecondary: '#a9b1d6',
      textTertiary: '#565f89',
      accent: '#7aa2f7',
      accentHover: '#89b4fa',
      accentMuted: 'rgba(122, 162, 247, 0.2)',
    },
  },
  solarized: {
    id: 'solarized',
    name: 'Solarized',
    isDark: false,
    colors: {
      surface: '#fdf6e3',
      surfaceSecondary: '#eee8d5',
      surfaceTertiary: '#e6dfcc',
      surfaceElevated: '#fdf6e3',
      border: '#d6d0c0',
      borderSubtle: '#eee8d5',
      textPrimary: '#073642',
      textSecondary: '#586e75',
      textTertiary: '#839496',
      accent: '#268bd2',
      accentHover: '#2aa198',
      accentMuted: 'rgba(38, 139, 210, 0.15)',
    },
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    isDark: true,
    colors: {
      surface: '#282a36',
      surfaceSecondary: '#313244',
      surfaceTertiary: '#383a4a',
      surfaceElevated: '#44475a',
      border: '#44475a',
      borderSubtle: '#383a4a',
      textPrimary: '#f8f8f2',
      textSecondary: '#bd93f9',
      textTertiary: '#6272a4',
      accent: '#ff79c6',
      accentHover: '#ff92df',
      accentMuted: 'rgba(255, 121, 198, 0.2)',
    },
  },
};

export const NTP_URL = 'uxxxiii://newtab';
export const SETTINGS_URL = 'uxxxiii://settings';
export const HISTORY_URL = 'uxxxiii://history';
export const DOWNLOADS_URL = 'uxxxiii://downloads';
export const BOOKMARKS_URL = 'uxxxiii://bookmarks';
export const EXTENSIONS_URL = 'uxxxiii://extensions';
export const THEMES_URL = 'uxxxiii://themes';

export const INTERNAL_PAGES = {
  newtab: { url: NTP_URL, title: 'New Tab' },
  settings: { url: SETTINGS_URL, title: 'Settings' },
  history: { url: HISTORY_URL, title: 'History' },
  downloads: { url: DOWNLOADS_URL, title: 'Downloads' },
  bookmarks: { url: BOOKMARKS_URL, title: 'Bookmarks' },
  extensions: { url: EXTENSIONS_URL, title: 'Extensions' },
  themes: { url: THEMES_URL, title: 'Themes' },
} as const;

export type InternalPageId = keyof typeof INTERNAL_PAGES;

export function isInternalUrl(url: string): boolean {
  return url.startsWith('uxxxiii://');
}

export function getInternalPageId(url: string): InternalPageId | null {
  if (!isInternalUrl(url)) return null;
  const id = url.replace('uxxxiii://', '').split('/')[0].split('?')[0] as InternalPageId;
  return id in INTERNAL_PAGES ? id : null;
}

export function getInternalPageTitle(url: string): string {
  const id = getInternalPageId(url);
  if (id) return INTERNAL_PAGES[id].title;
  if (isInternalUrl(url)) return 'New Tab';
  return url;
}

/** Recover tabs whose URL was corrupted by BrowserView about:blank navigation */
export function sanitizeTabUrl(url: string): string {
  if (url === 'about:blank' || url === '') return NTP_URL;
  return url;
}

export function normalizeUrl(input: string, searchEngine: SearchEngine, customUrl?: string): string {
  const trimmed = input.trim();
  if (!trimmed) return NTP_URL;

  if (isInternalUrl(trimmed)) return trimmed;

  // Already a URL
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Looks like a domain
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(trimmed) && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }

  // Search query
  const engine = SEARCH_ENGINES[searchEngine];
  const searchUrl = searchEngine === 'custom' && customUrl ? customUrl : engine.url;
  return searchUrl.replace('%s', encodeURIComponent(trimmed));
}

export function getFaviconUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
  } catch {
    return '';
  }
}
