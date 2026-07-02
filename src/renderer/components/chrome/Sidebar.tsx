import {
  Bookmark, History, Download, Settings, Puzzle, Palette, Sparkles,
  User, BookOpen, Code, Play,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useWorkspaceStore } from '../../stores/settingsStore';
import { useTabStore } from '../../stores/tabStore';
import {
  BOOKMARKS_URL,
  DOWNLOADS_URL,
  EXTENSIONS_URL,
  HISTORY_URL,
  SETTINGS_URL,
  THEMES_URL,
  getInternalPageId,
} from '@shared/types';
import { openInternalPage } from '../../lib/internal-nav';

const SIDEBAR_ITEMS = [
  { url: BOOKMARKS_URL, icon: <Bookmark size={18} />, label: 'Bookmarks' },
  { url: HISTORY_URL, icon: <History size={18} />, label: 'History' },
  { url: DOWNLOADS_URL, icon: <Download size={18} />, label: 'Downloads' },
  { url: THEMES_URL, icon: <Palette size={18} />, label: 'Themes' },
  { url: SETTINGS_URL, icon: <Settings size={18} />, label: 'Settings' },
  { url: EXTENSIONS_URL, icon: <Puzzle size={18} />, label: 'Extensions' },
  { url: 'uxxxiii://ai', icon: <Sparkles size={18} />, label: 'AI Assistant' },
] as const;

const WORKSPACE_ICONS: Record<string, React.ReactNode> = {
  user: <User size={14} />,
  'book-open': <BookOpen size={14} />,
  code: <Code size={14} />,
  play: <Play size={14} />,
};

export function Sidebar() {
  const { workspaces, activeWorkspaceId, switchWorkspace } = useWorkspaceStore();
  const activeTab = useTabStore((s) => s.getActiveTab());
  const activeInternalId = activeTab ? getInternalPageId(activeTab.url) : null;

  const handleNavigate = (url: string) => {
    if (url === 'uxxxiii://ai') {
      openInternalPage(EXTENSIONS_URL);
      return;
    }
    openInternalPage(url);
  };

  return (
    <div className="fixed left-0 top-[calc(2.5rem+2.75rem+3rem)] bottom-0 w-12 flex flex-col items-center py-3 gap-1 z-40 chrome-ui bg-surface-secondary/80 border-r border-border-subtle backdrop-blur-sm">
      {SIDEBAR_ITEMS.map((item) => {
        const itemId = getInternalPageId(item.url);
        const isActive = itemId !== null && itemId === activeInternalId;

        return (
          <button
            key={item.url}
            onClick={() => handleNavigate(item.url)}
            title={item.label}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all no-drag',
              isActive
                ? 'bg-accent text-white shadow-glow'
                : 'text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary'
            )}
          >
            {item.icon}
          </button>
        );
      })}

      <div className="flex-1" />

      <div className="flex flex-col gap-1">
        {workspaces.map((ws) => (
          <button
            key={ws.id}
            onClick={() => switchWorkspace(ws.id)}
            title={ws.name}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all no-drag',
              activeWorkspaceId === ws.id
                ? 'ring-2 ring-offset-1 ring-offset-surface'
                : 'opacity-60 hover:opacity-100'
            )}
            style={{
              backgroundColor: ws.color + '30',
              color: ws.color,
            } as React.CSSProperties}
          >
            {WORKSPACE_ICONS[ws.icon] || <User size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
}
