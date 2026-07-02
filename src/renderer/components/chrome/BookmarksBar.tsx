import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn, truncate } from '../../lib/utils';
import { useBookmarkStore } from '../../stores/dataStore';
import { useEffect } from 'react';
import { useTabStore } from '../../stores/tabStore';
import { getInternalPageId } from '@shared/types';

export function BookmarksBar() {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const load = useBookmarkStore((s) => s.load);
  const activeTab = useTabStore((s) => s.getActiveTab());

  useEffect(() => {
    load();
  }, []);

  // Only show bookmarks bar on the New Tab internal page
  if (!activeTab || getInternalPageId(activeTab.url) !== 'newtab') return null;

  const barBookmarks = bookmarks.filter((b) => !b.folderId).slice(0, 20);

  return (
    <div className="flex items-center gap-0.5 px-3 h-9 bg-surface-secondary/50 border-b border-border-subtle overflow-x-auto chrome-ui">
      {barBookmarks.length === 0 ? (
        <span className="text-xs text-text-tertiary px-2">No bookmarks yet — press Ctrl+D to bookmark a page</span>
      ) : (
        barBookmarks.map((bookmark) => (
          <motion.button
            key={bookmark.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.uxxxiii.tabs.create({ url: bookmark.url, activate: true })}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs',
              'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors no-drag shrink-0'
            )}
          >
            {bookmark.favicon ? (
              <img src={bookmark.favicon} alt="" className="w-3.5 h-3.5 rounded-sm" />
            ) : (
              <Star size={12} className="text-text-tertiary" />
            )}
            {truncate(bookmark.title, 24)}
          </motion.button>
        ))
      )}
    </div>
  );
}
