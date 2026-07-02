import { create } from 'zustand';
import type { Tab } from '@shared/types';

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  tabOrder: string[];
  setTabs: (tabs: Tab[]) => void;
  setActiveTab: (tabId: string) => void;
  reorderTabs: (tabIds: string[]) => void;
  getActiveTab: () => Tab | undefined;
  getPinnedTabs: () => Tab[];
  getUnpinnedTabs: () => Tab[];
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  tabOrder: [],

  setTabs: (tabs) => {
    const currentOrder = get().tabOrder;
    const tabIds = tabs.map((t) => t.id);
    const newOrder = [
      ...currentOrder.filter((id) => tabIds.includes(id)),
      ...tabIds.filter((id) => !currentOrder.includes(id)),
    ];
    set({ tabs, tabOrder: newOrder });
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  reorderTabs: (tabIds) => {
    set({ tabOrder: tabIds });
    window.uxxxiii.tabs.reorder(tabIds);
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId);
  },

  getPinnedTabs: () => {
    const { tabs, tabOrder } = get();
    return tabOrder
      .map((id) => tabs.find((t) => t.id === id))
      .filter((t): t is Tab => !!t && t.isPinned);
  },

  getUnpinnedTabs: () => {
    const { tabs, tabOrder } = get();
    return tabOrder
      .map((id) => tabs.find((t) => t.id === id))
      .filter((t): t is Tab => !!t && !t.isPinned);
  },
}));
