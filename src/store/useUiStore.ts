import { create } from 'zustand';

type UiState = {
  theme: 'light' | 'dark';
};

type UiActions = {
  toggleTheme: () => void;
};

export const useUiStore = create<UiState & UiActions>()((set) => ({
  theme: 'light',
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
}));
