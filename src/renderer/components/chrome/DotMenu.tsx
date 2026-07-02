import React from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { openInternalPage } from '../../lib/internal-nav';
import {
  BOOKMARKS_URL,
  DOWNLOADS_URL,
  EXTENSIONS_URL,
  HISTORY_URL,
  SETTINGS_URL,
  THEMES_URL,
} from '@shared/types';

const ITEMS = [
  { url: BOOKMARKS_URL, label: 'Bookmarks' },
  { url: HISTORY_URL, label: 'History' },
  { url: DOWNLOADS_URL, label: 'Downloads' },
  { url: THEMES_URL, label: 'Themes' },
  { url: SETTINGS_URL, label: 'Settings' },
  { url: EXTENSIONS_URL, label: 'Extensions' },
];

export function DotMenu() {
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const toggleMenu = () => {
    setOpen((s) => !s);
  };

  React.useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="relative z-50">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        title="Menu"
        className="no-drag w-10 h-10 flex items-center justify-center hover:bg-surface-tertiary transition-colors rounded-md"
      >
        <MoreVertical size={16} className="text-text-secondary" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-44 py-2 bg-surface-elevated border border-border rounded-xl shadow-elevated z-50 overflow-hidden pointer-events-auto"
        >
          {ITEMS.map((it) => (
            <button
              key={it.url}
              type="button"
              onClick={() => {
                openInternalPage(it.url);
                setOpen(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
              )}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
