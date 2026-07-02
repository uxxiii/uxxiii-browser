import { create } from 'zustand';
import type { SearchSuggestion } from '@shared/types';

interface NavigationStore {
  addressBarValue: string;
  isAddressBarFocused: boolean;
  suggestions: SearchSuggestion[];
  isLoadingSuggestions: boolean;
  showSuggestions: boolean;
  setAddressBarValue: (value: string) => void;
  setAddressBarFocused: (focused: boolean) => void;
  setSuggestions: (suggestions: SearchSuggestion[]) => void;
  setShowSuggestions: (show: boolean) => void;
  fetchSuggestions: (query: string) => Promise<void>;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  addressBarValue: '',
  isAddressBarFocused: false,
  suggestions: [],
  isLoadingSuggestions: false,
  showSuggestions: false,

  setAddressBarValue: (value) => set({ addressBarValue: value }),
  setAddressBarFocused: (focused) => set({ isAddressBarFocused: focused, showSuggestions: focused }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setShowSuggestions: (show) => set({ showSuggestions: show }),

  fetchSuggestions: async (query) => {
    if (!query.trim()) {
      set({ suggestions: [], isLoadingSuggestions: false });
      return;
    }
    set({ isLoadingSuggestions: true });
    try {
      const suggestions = await window.uxxxiii.search.suggest(query);
      set({ suggestions, isLoadingSuggestions: false });
    } catch {
      set({ isLoadingSuggestions: false });
    }
  },
}));
