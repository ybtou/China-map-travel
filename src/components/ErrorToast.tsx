import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../stores/mapStore';
import { useSettingsStore } from '../stores/settingsStore';

export default function ErrorToast() {
  const error = useMapStore(s => s.error);
  const setError = useMapStore(s => s.setError);
  const settings = useSettingsStore();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (error) {
      setMsg(error);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setError(null);
      }, 3000);
    }
    return () => {};
  }, [error]);

  const { toastBlur, toastOpacity, toastBorderRadius, toastBgColor } = settings;

  const hex = toastBgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 255;
  const g = parseInt(hex.substring(2, 4), 16) || 255;
  const b = parseInt(hex.substring(4, 6), 16) || 255;
  const bgColor = 'rgba(' + r + ',' + g + ',' + b + ',' + toastOpacity + ')';
  const blurVal = 'blur(' + toastBlur + 'px)';

  return (
    <AnimatePresence>
      {visible && msg && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
          }}
        >
          <div
            style={{
              borderRadius: toastBorderRadius + 'px',
              background: bgColor,
              backdropFilter: blurVal,
              WebkitBackdropFilter: blurVal,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              padding: '10px 24px',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>{msg}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}