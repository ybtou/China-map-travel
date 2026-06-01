import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../stores/mapStore';
import { useSettingsStore } from '../stores/settingsStore';

const LoadingOverlay = memo(function LoadingOverlay() {
  const isLoading = useMapStore(s => s.isLoading);
  const { loadingBlur, loadingOpacity } = useSettingsStore();

  const bgColor = 'rgba(240, 244, 248, ' + loadingOpacity + ')';

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{
            background: bgColor,
            backdropFilter: 'blur(' + loadingBlur + 'px)',
            WebkitBackdropFilter: 'blur(' + loadingBlur + 'px)',
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: '3px solid rgba(37, 99, 235, 0.1)',
                }}
              />
              <div
                className="absolute inset-0 rounded-full animate-spin"
                style={{
                  border: '3px solid transparent',
                  borderTopColor: '#2563EB',
                  boxShadow: '0 0 12px rgba(37, 99, 235, 0.2)',
                }}
              />
            </div>
            <span className="text-sm font-medium" style={{ color: '#64748b' }}>加载地图数据...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default LoadingOverlay;