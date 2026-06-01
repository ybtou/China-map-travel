import { useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../stores/settingsStore';
import type { TooltipInfo } from '../types/area';

interface TooltipProps {
  info: TooltipInfo;
}

const Tooltip = memo(function Tooltip({ info }: TooltipProps) {
  const tooltipBlur = useSettingsStore((s) => s.tooltipBlur);
  const tooltipOpacity = useSettingsStore((s) => s.tooltipOpacity);
  const tooltipRadius = useSettingsStore((s) => s.tooltipRadius);
  const tooltipOffsetX = useSettingsStore((s) => s.tooltipOffsetX);
  const tooltipOffsetY = useSettingsStore((s) => s.tooltipOffsetY);
  const tooltipMaxWidth = useSettingsStore((s) => s.tooltipMaxWidth);
  const tooltipFollowSpeed = useSettingsStore((s) => s.tooltipFollowSpeed);
  const tooltipShadowOpacity = useSettingsStore((s) => s.tooltipShadowOpacity);
  const tooltipBorderWidth = useSettingsStore((s) => s.tooltipBorderWidth);
  const tooltipBorderColor = useSettingsStore((s) => s.tooltipBorderColor);

  const posRef = useRef({ x: info.x, y: info.y });
  const rafRef = useRef<number>(0);
  const elRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: info.x, y: info.y });

  targetRef.current = { x: info.x, y: info.y };

  useEffect(() => {
    if (!info.visible) return;

    const animate = () => {
      const speed = tooltipFollowSpeed;
      posRef.current.x += (targetRef.current.x - posRef.current.x) * speed;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * speed;

      if (elRef.current) {
        let left = posRef.current.x + tooltipOffsetX;
        let top = posRef.current.y + tooltipOffsetY;

        const elW = elRef.current.offsetWidth || 200;
        const elH = elRef.current.offsetHeight || 100;
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // 自动边缘翻转
        if (left + elW > winW - 16) left = posRef.current.x - elW + tooltipOffsetX;
        if (top + elH > winH - 16) top = posRef.current.y - elH + tooltipOffsetY;
        if (top < 16) top = 16;
        if (left < 16) left = 16;

        elRef.current.style.left = left + 'px';
        elRef.current.style.top = top + 'px';
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [info.visible, tooltipOffsetX, tooltipOffsetY, tooltipFollowSpeed]);

  const percent =
    info.totalChildren > 0
      ? Math.round((info.visitedChildren / info.totalChildren) * 100)
      : 0;

  return (
    <AnimatePresence>
      {info.visible && info.name && (
        <div
          ref={elRef}
          style={{
            position: 'fixed',
            left: info.x + tooltipOffsetX,
            top: info.y + tooltipOffsetY,
            zIndex: 99999,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="select-none"
            style={{
              borderRadius: tooltipRadius,
              background: 'rgba(255, 255, 255, ' + tooltipOpacity + ')',
              backdropFilter: 'blur(' + tooltipBlur + 'px)',
              WebkitBackdropFilter: 'blur(' + tooltipBlur + 'px)',
              border: tooltipBorderWidth + 'px solid ' + tooltipBorderColor,
              boxShadow:
                '0 8px 32px rgba(0, 0, 0, ' + tooltipShadowOpacity + '), 0 0 0 1px rgba(255,255,255,0.15) inset',
              padding: '14px 18px',
              maxWidth: tooltipMaxWidth,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: info.visited ? '#2563EB' : '#cbd5e1',
                  boxShadow: info.visited ? '0 0 8px rgba(37,99,235,0.4)' : 'none',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                {info.name}
              </span>
            </div>
            {info.totalChildren > 0 && (
              <>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                  已抵达{' '}
                  <span style={{ color: '#2563EB', fontWeight: 600 }}>
                    {info.visitedChildren}
                  </span>{' '}
                  / {info.totalChildren} 城市
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    overflow: 'hidden',
                    background: 'rgba(148,163,184,0.2)',
                    marginBottom: 4,
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: percent + '%' }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #2563EB, #60A5FA)',
                      boxShadow: '0 0 8px rgba(37,99,235,0.3)',
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, textAlign: 'right', color: '#94a3b8' }}>
                  {percent}% 探索度
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

export default Tooltip;