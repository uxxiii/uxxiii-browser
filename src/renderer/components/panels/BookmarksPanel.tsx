import { useEffect } from 'react';
import { Star, Trash2, ExternalLink, FolderPlus } from 'lucide-react';
import { useBookmarkStore } from '../../stores/dataStore';
import { formatDate, getDomain } from '../../lib/utils';

export function BookmarksPanel() {
  const { bookmarks, load, remove } = useBookmarkStore();

  useEffect(() => { load(); }, []);

  return (
    <div className="p-3 space-y-1">
      {bookmarks.length === 0 ? (
        <div className="text-center py-8 text-text-tertiary text-sm">
          No bookmarks yet
        </div>
      ) : (
        bookmarks.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-surface-tertiary group transition-colors"
          >
            {b.favicon ? (
              <img src={b.favicon} alt="" className="w-4 h-4 rounded-sm shrink-0" />
            ) : (
              <Star size={14} className="text-yellow-400 shrink-0" />
            )}
            <button
              onClick={() => window.uxxxiii.tabs.create({ url: b.url, activate: true })}
              className="flex-1 min-w-0 text-left"
            >
              <div className="text-sm text-text-primary truncate">{b.title}</div>
              <div className="text-xs text-text-tertiary truncate">{getDomain(b.url)}</div>
            </button>
            <button
              onClick={() => remove(b.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-elevated transition-all"
            >
              <Trash2 size={12} className="text-text-tertiary" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
