import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { useUIStore } from '../../stores/settingsStore';
import { useTabStore } from '../../stores/tabStore';

export function FindBar() {
  const { showFindBar, findText, setShowFindBar, setFindText } = useUIStore();
  const activeTabId = useTabStore((s) => s.activeTabId);

  const handleFind = (forward = true) => {
    if (!activeTabId || !findText) return;
    window.uxxxiii.browser.find(activeTabId, findText, forward);
  };

  const handleClose = () => {
    setShowFindBar(false);
    setFindText('');
    if (activeTabId) window.uxxxiii.browser.findStop(activeTabId);
  };

  return (
    <AnimatePresence>
      {showFindBar && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="absolute top-[calc(2.5rem+2.75rem+3rem+0.25rem)] right-4 z-50 flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border rounded-xl shadow-elevated chrome-ui no-drag"
        >
          <input
            type="text"
            value={findText}
            onChange={(e) => {
              setFindText(e.target.value);
              if (activeTabId) window.uxxxiii.browser.find(activeTabId, e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFind(!e.shiftKey);
              if (e.key === 'Escape') handleClose();
            }}
            placeholder="Find in page..."
            autoFocus
            className="w-48 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <button onClick={() => handleFind(false)} className="p-1 rounded hover:bg-surface-tertiary">
            <ChevronUp size={14} className="text-text-secondary" />
          </button>
          <button onClick={() => handleFind(true)} className="p-1 rounded hover:bg-surface-tertiary">
            <ChevronDown size={14} className="text-text-secondary" />
          </button>
          <button onClick={handleClose} className="p-1 rounded hover:bg-surface-tertiary">
            <X size={14} className="text-text-secondary" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
