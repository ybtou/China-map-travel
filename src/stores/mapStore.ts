import { create } from 'zustand';
import type { TooltipInfo, NavigationEntry } from '../types/area';

interface MapState {
  currentName: string;
  currentLevel: number;
  currentAdcode: string;
  navigationStack: NavigationEntry[];
  isLoading: boolean;
  error: string | null;
  tooltip: TooltipInfo;

  setCurrentName: (name: string) => void;
  setCurrentLevel: (level: number) => void;
  setCurrentAdcode: (adcode: string) => void;
  setNavigationStack: (stack: NavigationEntry[]) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setTooltip: (t: Partial<TooltipInfo>) => void;
  siblingFeatures: Array<{ name: string; adcode: string }>;
  setSiblingFeatures: (f: Array<{ name: string; adcode: string }>) => void;
}

export const useMapStore = create<MapState>((set) => ({
  currentName: '中国',
  currentLevel: 0,
  currentAdcode: '100000',
  navigationStack: [],
  isLoading: false,
  error: null,
  tooltip: { visible: false, x: 0, y: 0, name: '', visited: false, totalChildren: 0, visitedChildren: 0 },

  setCurrentName: (name) => set({ currentName: name }),
  setCurrentLevel: (level) => set({ currentLevel: level }),
  setCurrentAdcode: (adcode) => set({ currentAdcode: adcode }),
  setNavigationStack: (stack) => set({ navigationStack: stack }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  setTooltip: (t) => set((s) => ({ tooltip: { ...s.tooltip, ...t } })),
  siblingFeatures: [],
  setSiblingFeatures: (f) => set({ siblingFeatures: f }),
}));