import { useEffect } from 'react';
import { Download, X, FolderOpen, ExternalLink, Trash2 } from 'lucide-react';
import { useDownloadStore } from '../../stores/dataStore';
import { formatBytes, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

export function DownloadsPanel() {
  const { downloads, load, cancel, open, showInFolder, clear } = useDownloadStore();

  useEffect(() => { load(); }, []);

  return (
    <div className="p-3">
      {downloads.length > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={clear}
            className="text-xs text-text-tertiary hover:text-red-400 transition-colors"
          >
            Clear list
          </button>
        </div>
      )}

      {downloads.length === 0 ? (
        <div className="text-center py-8">
          <Download size={32} className="mx-auto mb-3 text-text-tertiary" />
          <p className="text-sm text-text-tertiary">No downloads yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {downloads.map((dl) => (
            <div
              key={dl.id}
              className="p-3 rounded-xl bg-surface-tertiary/50 border border-border-subtle"
            >
              <div className="flex items-start gap-2">
                <Download size={16} className="text-accent shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">{dl.filename}</div>
                  <div className="text-xs text-text-tertiary mt-0.5">
                    {dl.state === 'progressing' && dl.totalBytes > 0
                      ? `${formatBytes(dl.receivedBytes)} / ${formatBytes(dl.totalBytes)}`
                      : dl.state === 'completed'
                      ? formatBytes(dl.totalBytes)
                      : dl.state}
                  </div>
                  {dl.state === 'progressing' && dl.totalBytes > 0 && (
                    <div className="mt-2 h-1 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${(dl.receivedBytes / dl.totalBytes) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {dl.state === 'progressing' && (
                    <button onClick={() => cancel(dl.id)} className="p-1 rounded hover:bg-surface-elevated">
                      <X size={14} className="text-text-tertiary" />
                    </button>
                  )}
                  {dl.state === 'completed' && (
                    <>
                      <button onClick={() => open(dl.id)} className="p-1 rounded hover:bg-surface-elevated" title="Open">
                        <ExternalLink size={14} className="text-text-tertiary" />
                      </button>
                      <button onClick={() => showInFolder(dl.id)} className="p-1 rounded hover:bg-surface-elevated" title="Show in folder">
                        <FolderOpen size={14} className="text-text-tertiary" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
