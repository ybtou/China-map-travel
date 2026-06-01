import { create } from 'zustand';

export interface SettingsState {
  glassBlur: number;
  glassOpacity: number;
  glassBorderRadius: number;
  strokeColor: string;
  strokeWidth: number;
  hoverColor: string;
  highlightColor: string;
  crossfadeDuration: number;
  cameraDuration: number;
  highlightDuration: number;
  sidebarWidth: number;
  sidebarVisible: boolean;
  accentColor: string;
  bgPage: string;
  toastBlur: number;
  toastOpacity: number;
  toastBorderRadius: number;
  toastBgColor: string;
  loadingBlur: number;
  loadingOpacity: number;
  tooltipBlur: number;
  tooltipOpacity: number;
  tooltipRadius: number;
  tooltipOffsetX: number;
  tooltipOffsetY: number;
  tooltipMaxWidth: number;
  tooltipFollowSpeed: number;
  tooltipShadowOpacity: number;
  tooltipBorderWidth: number;
  tooltipBorderColor: string;
  drillDownAnimationDuration: number;
  returnAnimationDuration: number;
  focusStrokeColor: string;
  focusStrokeWidthExtra: number;
  focusFillOpacity: number;
  hoverStrokeWidthExtra: number;
  hoverFillOpacity: number;
  cameraEasingType: string;
  animationDamping: number;
  update: (partial: Partial<SettingsState>) => void;
  reset: () => void;
}

const DEFAULTS: Omit<SettingsState, 'update' | 'reset'> = {
  glassBlur: 32,
  glassOpacity: 0.42,
  glassBorderRadius: 24,
  strokeColor: '#C0C8D0',
  strokeWidth: 1.2,
  hoverColor: '#2563EB',
  highlightColor: '#3B82F6',
  crossfadeDuration: 400,
  cameraDuration: 600,
  highlightDuration: 180,
  sidebarWidth: 280,
  sidebarVisible: true,
  accentColor: '#2563EB',
  bgPage: '#f0f4f8',
  toastBlur: 24,
  toastOpacity: 0.5,
  toastBorderRadius: 16,
  toastBgColor: '#ffffff',
  loadingBlur: 12,
  loadingOpacity: 0.6,
  tooltipBlur: 20,
  tooltipOpacity: 0.85,
  tooltipRadius: 12,
  tooltipOffsetX: 16,
  tooltipOffsetY: -16,
  tooltipMaxWidth: 280,
  tooltipFollowSpeed: 0.15,
  tooltipShadowOpacity: 0.08,
  tooltipBorderWidth: 1,
  tooltipBorderColor: 'rgba(255, 255, 255, 0.5)',
  drillDownAnimationDuration: 600,
  returnAnimationDuration: 550,
  focusStrokeColor: '#111827',
  focusStrokeWidthExtra: 2.8,
  focusFillOpacity: 0.18,
  hoverStrokeWidthExtra: 1.3,
  hoverFillOpacity: 0.3,
  cameraEasingType: 'easeInOutCubic',
  animationDamping: 1.15,
};

function applyCssVars(s: Omit<SettingsState, 'update' | 'reset'>) {
  const r = document.documentElement.style;
  r.setProperty('--glass-blur', s.glassBlur + 'px');
  r.setProperty('--glass-opacity', String(s.glassOpacity));
  r.setProperty('--glass-radius', s.glassBorderRadius + 'px');
  r.setProperty('--accent', s.accentColor);
  r.setProperty('--bg-page', s.bgPage);
  r.setProperty('--toast-blur', s.toastBlur + 'px');
  r.setProperty('--toast-opacity', String(s.toastOpacity));
  r.setProperty('--toast-radius', s.toastBorderRadius + 'px');
  r.setProperty('--toast-bg', s.toastBgColor);
  r.setProperty('--loading-blur', s.loadingBlur + 'px');
  r.setProperty('--loading-opacity', String(s.loadingOpacity));
  r.setProperty('--tooltip-blur', s.tooltipBlur + 'px');
  r.setProperty('--tooltip-opacity', String(s.tooltipOpacity));
  r.setProperty('--tooltip-radius', s.tooltipRadius + 'px');
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = { ...DEFAULTS };
  return {
    ...initial,
    update: (partial) => {
      set(partial);
      applyCssVars({ ...get(), ...partial } as any);
    },
    reset: () => {
      set(DEFAULTS as any);
      applyCssVars(DEFAULTS);
    },
  };
});