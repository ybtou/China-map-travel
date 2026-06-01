import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../stores/mapStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { NavigationEntry } from '../types/area';

const Breadcrumb = memo(function Breadcrumb() {
  const navStack = useMapStore(s => s.navigationStack);
  const currentName = useMapStore(s => s.currentName);
  const currentLevel = useMapStore(s => s.currentLevel);
  const currentAdcode = useMapStore(s => s.currentAdcode);
  const isLoading = useMapStore(s => s.isLoading);
  const { glassBlur, glassOpacity, glassBorderRadius } = useSettingsStore();

  const entries: NavigationEntry[] = [
    ...navStack,
    { name: currentName, level: currentLevel, adcode: currentAdcode },
  ];

  const handleClick = useCallback((entry: NavigationEntry, index: number) => {
    if (isLoading) return;
    if (index === entries.length - 1) return;
    // 传递完整祖先链（到点击项为止），确保 navigateToLevel 能重建正确的栈
    const ancestors = entries.slice(0, index).map(e => ({ name: e.name, level: e.level, adcode: e.adcode }));
    window.dispatchEvent(
      new CustomEvent('map:jumpTo', {
        detail: { name: entry.name, level: entry.level, adcode: entry.adcode, ancestors },
      })
    );
  }, [isLoading, entries.length]);

  if (entries.length <= 1) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        className="absolute top-4 left-4 z-40 flex items-center gap-1 px-4 py-2"
        style={{
          borderRadius: glassBorderRadius,
          background: 'rgba(255, 255, 255, ' + glassOpacity + ')',
          backdropFilter: 'blur(' + glassBlur + 'px)',
          WebkitBackdropFilter: 'blur(' + glassBlur + 'px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        }}
      >
        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1;
          return (
            <div key={entry.adcode + '-' + index} className="flex items-center">
              {index > 0 && (
                <svg className="w-3.5 h-3.5 mx-1.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              <button
                onClick={() => handleClick(entry, index)}
                className="text-sm font-medium px-2 py-1 rounded-lg transition-all duration-200"
                style={{
                  color: isLast ? '#1e293b' : '#64748b',
                  cursor: isLast ? 'default' : 'pointer',
                }}
                disabled={isLast || isLoading}
              >
                {entry.name}
              </button>
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
});

export default Breadcrumb;