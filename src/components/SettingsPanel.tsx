import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../stores/settingsStore';
import { useMapStore } from '../stores/mapStore';

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs" style={{ color: '#64748b' }}>{label}</span>
        <span className="text-xs font-mono" style={{ color: '#475569' }}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ background: 'linear-gradient(90deg, #2563EB ' + ((value - min) / (max - min) * 100) + '%, #e2e8f0 0%)' }}
      />
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs" style={{ color: '#64748b' }}>{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-7 h-7 rounded-lg border-0 cursor-pointer" style={{ background: 'transparent' }} />
        <span className="text-[10px] font-mono" style={{ color: '#94a3b8' }}>{value}</span>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs" style={{ color: '#64748b' }}>{label}</span>
      <button onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full transition-colors duration-200"
        style={{ background: value ? '#2563EB' : '#cbd5e1' }}>
        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }} />
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>{title}</h4>
      {children}
    </div>
  );
}

const SettingsPanel = memo(function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const s = useSettingsStore();
  const u = s.update;
  const setError = useMapStore(ss => ss.setError);

  const handleOpen = useCallback(() => setOpen(v => !v), []);

  const testToast = useCallback(() => {
    setError('Toast\u6D4B\u8BD5\u63D0\u793A - \u8C03\u8282\u6ED1\u5757\u540E\u70B9\u51FB\u9884\u89C8');
  }, [setError]);

  return (
    <>
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
        style={{
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.15)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 overflow-y-auto"
              style={{
                borderRadius: '24px 0 0 24px',
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                borderLeft: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '-8px 0 48px rgba(0,0,0,0.08)',
              }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold" style={{ color: '#1e293b' }}>{'\u8BBE\u7F6E'}</h2>
                  <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                <Section title={'\u5168\u5C40\u6BDB\u73BB\u7483'}>
                  <Slider label={'\u6A21\u7CCA\u5EA6'} value={s.glassBlur} min={0} max={60} step={1} unit="px" onChange={v => u({ glassBlur: v })} />
                  <Slider label={'\u900F\u660E\u5EA6'} value={s.glassOpacity} min={0} max={1} step={0.01} unit="" onChange={v => u({ glassOpacity: v })} />
                  <Slider label={'\u5706\u89D2'} value={s.glassBorderRadius} min={0} max={40} step={1} unit="px" onChange={v => u({ glassBorderRadius: v })} />
                  <div className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>{'\u9002\u7528\u4E8E\u8FD4\u56DE\u6309\u94AE\u3001\u9762\u5305\u5C51\u3001\u4FA7\u8FB9\u680F'}</div>
                </Section>

                <Section title={'Tooltip \u60AC\u6D6E\u63D0\u793A'}>
                  <Slider label={'\u6A21\u7CCA\u5EA6'} value={s.tooltipBlur} min={0} max={60} step={1} unit="px" onChange={v => u({ tooltipBlur: v })} />
                  <Slider label={'\u900F\u660E\u5EA6'} value={s.tooltipOpacity} min={0} max={1} step={0.01} unit="" onChange={v => u({ tooltipOpacity: v })} />
                  <Slider label={'\u5706\u89D2'} value={s.tooltipRadius} min={0} max={32} step={1} unit="px" onChange={v => u({ tooltipRadius: v })} />
                  <Slider label={'\u504F\u79FB\u91CF'} value={s.tooltipOffsetX} min={4} max={40} step={1} unit="px" onChange={v => u({ tooltipOffsetX: v })} />
                  <Slider label={'\u8DDF\u968F\u901F\u5EA6'} value={s.tooltipFollowSpeed} min={0.05} max={0.5} step={0.01} unit="" onChange={v => u({ tooltipFollowSpeed: v })} />
                </Section>

                <Section title={'Toast \u63D0\u793A'}>
                  <Slider label={'\u6A21\u7CCA\u5EA6'} value={s.toastBlur} min={0} max={60} step={1} unit="px" onChange={v => u({ toastBlur: v })} />
                  <Slider label={'\u900F\u660E\u5EA6'} value={s.toastOpacity} min={0} max={1} step={0.01} unit="" onChange={v => u({ toastOpacity: v })} />
                  <Slider label={'\u5706\u89D2'} value={s.toastBorderRadius} min={0} max={32} step={1} unit="px" onChange={v => u({ toastBorderRadius: v })} />
                  <ColorPicker label={'\u80CC\u666F\u8272'} value={s.toastBgColor} onChange={v => u({ toastBgColor: v })} />
                  <button
                    onClick={testToast}
                    className="w-full py-2 rounded-xl text-xs font-medium mt-1 transition-all duration-200 hover:opacity-80"
                    style={{ background: '#e0f2fe', color: '#0369a1' }}
                  >
                    {'\u9884\u89C8 Toast \u6548\u679C'}
                  </button>
                </Section>

                <Section title={'\u52A0\u8F7D\u906E\u7F69'}>
                  <Slider label={'\u6A21\u7CCA\u5EA6'} value={s.loadingBlur} min={0} max={40} step={1} unit="px" onChange={v => u({ loadingBlur: v })} />
                  <Slider label={'\u900F\u660E\u5EA6'} value={s.loadingOpacity} min={0} max={1} step={0.01} unit="" onChange={v => u({ loadingOpacity: v })} />
                </Section>

                <Section title={'\u5730\u56FE\u63CF\u8FB9'}>
                  <ColorPicker label={'\u63CF\u8FB9\u989C\u8272'} value={s.strokeColor} onChange={v => u({ strokeColor: v })} />
                  <Slider label={'\u63CF\u8FB9\u7C97\u7EC6'} value={s.strokeWidth} min={0.5} max={3} step={0.1} unit="px" onChange={v => u({ strokeWidth: v })} />
                  <ColorPicker label={'\u60AC\u505C\u989C\u8272'} value={s.hoverColor} onChange={v => u({ hoverColor: v })} />
                  <ColorPicker label={'\u9AD8\u4EAE\u989C\u8272'} value={s.highlightColor} onChange={v => u({ highlightColor: v })} />
                </Section>
                <Section title={'\u7126\u70B9\u9AD8\u4EAE'}>
                  <ColorPicker label={'\u7126\u70B9\u63CF\u8FB9\u8272'} value={s.focusStrokeColor} onChange={v => u({ focusStrokeColor: v })} />
                  <Slider label={'\u7126\u70B9\u63CF\u8FB9\u7C97\u589E\u91CF'} value={s.focusStrokeWidthExtra} min={0} max={6} step={0.1} unit="px" onChange={v => u({ focusStrokeWidthExtra: v })} />
                  <Slider label={'\u7126\u70B9\u586B\u5145\u900F\u660E\u5EA6'} value={s.focusFillOpacity} min={0} max={0.5} step={0.01} unit="" onChange={v => u({ focusFillOpacity: v })} />
                  <Slider label={'\u60AC\u505C\u63CF\u8FB9\u7C97\u589E\u91CF'} value={s.hoverStrokeWidthExtra} min={0} max={4} step={0.1} unit="px" onChange={v => u({ hoverStrokeWidthExtra: v })} />
                  <Slider label={'\u60AC\u505C\u586B\u5145\u900F\u660E\u5EA6'} value={s.hoverFillOpacity} min={0} max={0.5} step={0.01} unit="" onChange={v => u({ hoverFillOpacity: v })} />
                </Section>

                <Section title={'\u52A8\u753B'}>
                  <Slider label={'\u963B\u5C3C\u5F39\u6027'} value={s.animationDamping} min={0.3} max={1.5} step={0.05} unit='' onChange={v => u({ animationDamping: v })} />
                  <Slider label={'\u56FE\u5C42\u6E10\u53D8'} value={s.crossfadeDuration} min={100} max={1000} step={50} unit="ms" onChange={v => u({ crossfadeDuration: v })} />
                  <Slider label={'\u4E0B\u94BB\u52A8\u753B'} value={s.drillDownAnimationDuration} min={400} max={2000} step={100} unit="ms" onChange={v => u({ drillDownAnimationDuration: v })} />
                  <Slider label={'\u8FD4\u56DE\u52A8\u753B'} value={s.returnAnimationDuration} min={400} max={2000} step={100} unit="ms" onChange={v => u({ returnAnimationDuration: v })} />
                  <Slider label={'\u9AD8\u4EAE\u6301\u7EED'} value={s.highlightDuration} min={100} max={800} step={50} unit="ms" onChange={v => u({ highlightDuration: v })} />
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs" style={{ color: '#64748b' }}>{'\u7F29\u653E\u66F2\u7EBF\u7C7B\u578B'}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { key: 'easeInOutCubic', label: 'EaseInOut' },
                        { key: 'easeOutCubic', label: 'EaseOut' },
                        { key: 'easeInCubic', label: 'EaseIn' },
                        { key: 'linear', label: '\u7EBF\u6027' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => u({ cameraEasingType: opt.key })}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200"
                          style={{
                            background: s.cameraEasingType === opt.key ? '#2563EB' : '#f1f5f9',
                            color: s.cameraEasingType === opt.key ? '#fff' : '#64748b',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>

                <Section title={'\u4FA7\u8FB9\u680F'}>
                  <Slider label={'\u5BBD\u5EA6'} value={s.sidebarWidth} min={200} max={400} step={10} unit="px" onChange={v => u({ sidebarWidth: v })} />
                  <Toggle label={'\u663E\u793A\u4FA7\u8FB9\u680F'} value={s.sidebarVisible} onChange={v => u({ sidebarVisible: v })} />
                </Section>

                <Section title={'\u5168\u5C40'}>
                  <ColorPicker label={'\u4E3B\u9898\u8272'} value={s.accentColor} onChange={v => u({ accentColor: v })} />
                  <ColorPicker label={'\u9875\u9762\u80CC\u666F'} value={s.bgPage} onChange={v => u({ bgPage: v })} />
                </Section>

                <button
                  onClick={() => s.reset()}
                  className="w-full py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-80"
                  style={{ background: '#fee2e2', color: '#dc2626' }}
                >
                  {'\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

export default SettingsPanel;