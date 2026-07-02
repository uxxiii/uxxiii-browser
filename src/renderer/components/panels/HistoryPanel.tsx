import { useEffect } from 'react';
import { Clock, Trash2, Search } from 'lucide-react';
import { useHistoryStore } from '../../stores/dataStore';
import { formatDate, getDomain } from '../../lib/utils';
import { useState } from 'react';

export function HistoryPanel() {
  const { entries, load, clear, remove } = useHistoryStore();
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const filtered = search
    ? entries.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.url.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const grouped = filtered.reduce((acc, entry) => {
    const date = new Date(entry.visitedAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-tertiary">
          <Search size={14} className="text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
        </div>
        <button
          onClick={clear}
          className="px-2 py-1.5 text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="text-xs font-medium text-text-tertiary mb-1 px-1">{date}</div>
            {items.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-tertiary group transition-colors"
              >
                <Clock size={14} className="text-text-tertiary shrink-0" />
                <button
                  onClick={() => window.uxxxiii.tabs.create({ url: entry.url, activate: true })}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="text-sm text-text-primary truncate">{entry.title}</div>
                  <div className="text-xs text-text-tertiary truncate">{getDomain(entry.url)}</div>
                </button>
                <span className="text-[10px] text-text-tertiary">{formatDate(entry.visitedAt)}</span>
                <button
                  onClick={() => remove(entry.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-elevated"
                >
                  <Trash2 size={12} className="text-text-tertiary" />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
