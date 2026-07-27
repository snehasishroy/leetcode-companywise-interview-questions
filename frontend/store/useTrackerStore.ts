import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface TrackerState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
  
  dashboardSort: 'alphabetical' | 'most-complete' | 'least-complete' | 'most-remaining';
  setDashboardSort: (sort: 'alphabetical' | 'most-complete' | 'least-complete' | 'most-remaining') => void;
  
  dashboardFilter: 'all' | 'completed' | 'in-progress' | 'not-started';
  setDashboardFilter: (filter: 'all' | 'completed' | 'in-progress' | 'not-started') => void;
  
  selectedProblemId: number | null;
  setSelectedProblemId: (id: number | null) => void;
  
  // Custom Toast system
  toasts: Toast[];
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useTrackerStore = create<TrackerState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  globalSearch: '',
  setGlobalSearch: (search) => set({ globalSearch: search }),
  
  dashboardSort: 'most-complete',
  setDashboardSort: (sort) => set({ dashboardSort: sort }),
  
  dashboardFilter: 'all',
  setDashboardFilter: (filter) => set({ dashboardFilter: filter }),
  
  selectedProblemId: null,
  setSelectedProblemId: (id) => set({ selectedProblemId: id }),
  
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    // Auto-remove after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
