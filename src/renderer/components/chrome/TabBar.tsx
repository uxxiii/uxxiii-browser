import { motion, Reorder, AnimatePresence } from 'framer-motion';
import React from 'react';
import { Plus, X, Pin, Volume2, VolumeX, Loader2 } from 'lucide-react';
import logoNoBg from '../../../../logo/logo without bg.png';
import { cn } from '../../lib/utils';
import { useTabStore } from '../../stores/tabStore';
import { isInternalUrl, getInternalPageTitle } from '@shared/types';
import type { Tab } from '@shared/types';

function TabItem({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.uxxxiii.tabs.close(tab.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    if (e.detail === 2 && e.button === 1) return;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Context menu handled via native or custom
  };

  return (
    <Reorder.Item
      value={tab.id}
      id={tab.id}
      className={cn(
        'group relative flex items-center gap-2 h-9 rounded-lg cursor-pointer transition-all no-drag',
        tab.isPinned ? 'min-w-[36px] max-w-[36px] px-0 justify-center' : 'px-3 min-w-[120px] max-w-[220px]',
        isActive
          ? 'bg-surface-elevated shadow-soft ring-1 ring-accent/40'
          : 'hover:bg-surface-tertiary/60',
        tab.isPinned && !isActive && 'opacity-80 hover:opacity-100',
      )}
      onClick={() => window.uxxxiii.tabs.activate(tab.id)}
      onMouseDown={handleDuplicate}
      onContextMenu={handleContextMenu}
      onAuxClick={(e: React.MouseEvent<HTMLElement>) => {
        if (e.button === 1) handleClose(e);
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {tab.isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-lg">
          <div className="tab-loading-bar h-full w-1/3 bg-accent rounded-full" />
        </div>
      )}

      {tab.isPinned ? (
        <Pin size={12} className={cn('shrink-0', isActive ? 'text-accent' : 'text-text-tertiary')} />
      ) : tab.favicon && !isInternalUrl(tab.url) ? (
        <img src={tab.favicon} alt="" className="w-4 h-4 shrink-0 rounded-sm" />
      ) : isInternalUrl(tab.url) ? (
        <img src={logoNoBg} alt="U" className="w-4 h-4 shrink-0 rounded-sm object-cover" />
      ) : (
        <div className="w-4 h-4 shrink-0 rounded-sm bg-surface-tertiary flex items-center justify-center">
          {tab.isLoading ? (
            <Loader2 size={10} className="animate-spin text-accent" />
          ) : (
            <span className="text-[8px] text-text-tertiary">U</span>
          )}
        </div>
      )}

      {!tab.isPinned && (
        <span className={cn(
          'text-xs truncate flex-1',
          isActive ? 'text-text-primary font-medium' : 'text-text-secondary'
        )}>
          {isInternalUrl(tab.url) ? getInternalPageTitle(tab.url) : tab.title || 'Loading...'}
        </span>
      )}

      {tab.isMuted && <VolumeX size={12} className="text-text-tertiary shrink-0" />}

      {!tab.isPinned && (
        <button
          onClick={handleClose}
          className={cn(
            'shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all',
            'opacity-0 group-hover:opacity-100 hover:bg-surface-tertiary',
            isActive && 'opacity-60'
          )}
        >
          <X size={12} className="text-text-secondary" />
        </button>
      )}
    </Reorder.Item>
  );
}

export function TabBar() {
  const { getPinnedTabs, getUnpinnedTabs, activeTabId, reorderTabs } = useTabStore();
  const pinnedTabs = getPinnedTabs();
  const unpinnedTabs = getUnpinnedTabs();
  const unpinnedIds = unpinnedTabs.map((t) => t.id);

  return (
    <div className="flex items-center gap-1 px-2 h-11 bg-surface-secondary border-b border-border-subtle chrome-ui">
      {/* Pinned tabs */}
      <div className="flex items-center gap-0.5">
        {pinnedTabs.map((tab) => (
          <TabItem key={tab.id} tab={tab} isActive={tab.id === activeTabId} />
        ))}
      </div>

      {pinnedTabs.length > 0 && unpinnedTabs.length > 0 && (
        <div className="w-px h-5 bg-border mx-1" />
      )}

      {/* Unpinned tabs - draggable */}
      <Reorder.Group
        axis="x"
        values={unpinnedIds}
        onReorder={(newOrder) => {
          const pinnedIds = pinnedTabs.map((t) => t.id);
          reorderTabs([...pinnedIds, ...newOrder]);
        }}
        className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none"
      >
        <AnimatePresence mode="popLayout">
          {unpinnedTabs.map((tab) => (
            <React.Fragment key={tab.id}>
              <TabItem tab={tab} isActive={tab.id === activeTabId} />
              {tab.id === activeTabId && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.uxxxiii.tabs.create({ activate: true })}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-tertiary transition-colors no-drag"
                >
                  <Plus size={16} className="text-text-secondary" />
                </motion.button>
              )}
            </React.Fragment>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}
