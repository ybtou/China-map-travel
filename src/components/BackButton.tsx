import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../stores/mapStore';
import { useSettingsStore } from '../stores/settingsStore';

const BackButton = memo(function BackButton() {
  const navStack = useMapStore(s => s.navigationStack);
  const isLoading = useMapStore(s => s.isLoading);
  const { glassBlur, glassOpacity, glassBorderRadius } = useSettingsStore();
  const canGoBack = navStack.length > 0;
  const parentName = canGoBack ? navStack[navStack.length - 1].name : '';
  const handleClick = useCallback(() => {
    if (isLoading || !canGoBack) return;
    window.dispatchEvent(new CustomEvent('map:exit'));
  }, [isLoading, canGoBack]);
  return (
    <AnimatePresence>
      {canGoBack && (
        <motion.button
          initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          onClick={handleClick}
          disabled={isLoading}
          className="absolute top-4 right-4 z-40 flex items-center gap-2 text-sm font-medium px-4 py-2.5 transition-all duration-200 active:scale-95 disabled:opacity-50"
          style={{
            borderRadius: glassBorderRadius,
            background: `rgba(255, 255, 255, ${glassOpacity})`,
            backdropFilter: `blur(${glassBlur}px)`,
            WebkitBackdropFilter: `blur(${glassBlur}px)`,
            border: '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            color: '#334155',
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回{parentName}
        </motion.button>
      )}
    </AnimatePresence>
  );
});

export default BackButton;