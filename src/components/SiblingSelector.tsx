import { memo, useCallback, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../stores/mapStore';
import { useSettingsStore } from '../stores/settingsStore';

interface SiblingInfo {
  name: string;
  adcode: string;
}

interface SiblingSelectorProps {
  siblings: SiblingInfo[];
  currentAdcode: string;
}

const SiblingSelector = memo(function SiblingSelector({ siblings, currentAdcode }: SiblingSelectorProps) {
  const isLoading = useMapStore(s => s.isLoading);
  const { glassBlur, glassOpacity, glassBorderRadius } = useSettingsStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    el.addEventListener('scroll', checkScroll);
    return () => { ro.disconnect(); el.removeEventListener('scroll', checkScroll); };
  }, [checkScroll, siblings.length]);

  // 自动滚动到当前选中项
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector('[data-active="true"]') as HTMLElement;
    if (active) {
      const containerRect = el.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      if (activeRect.left < containerRect.left || activeRect.right > containerRect.right) {
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentAdcode]);

  const handleClick = useCallback((sibling: SiblingInfo) => {
    if (isLoading || sibling.adcode === currentAdcode) return;
    window.dispatchEvent(
      new CustomEvent('map:switchSibling', {
        detail: { name: sibling.name, adcode: sibling.adcode },
      })
    );
  }, [isLoading, currentAdcode]);

  const scrollBy = useCallback((delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  if (siblings.length <= 1) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-14 left-4 z-40 flex items-center gap-1"
        style={{ maxWidth: 'calc(100vw - 120px)' }}
      >
        {canScrollLeft && (
          <button
            onClick={() => scrollBy(-120)}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-opacity"
            style={{
              background: `rgba(255,255,255,${glassOpacity})`,
              backdropFilter: `blur(${glassBlur}px)`,
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {siblings.map((s) => {
            const isActive = s.adcode === currentAdcode;
            return (
              <button
                key={s.adcode}
                data-active={isActive}
                onClick={() => handleClick(s)}
                disabled={isLoading}
                className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50"
                style={{
                  borderRadius: glassBorderRadius,
                  background: isActive
                    ? 'rgba(37, 99, 235, 0.9)'
                    : `rgba(255, 255, 255, ${glassOpacity})`,
                  backdropFilter: `blur(${glassBlur}px)`,
                  WebkitBackdropFilter: `blur(${glassBlur}px)`,
                  border: isActive
                    ? '1px solid rgba(37, 99, 235, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.35)',
                  boxShadow: isActive
                    ? '0 2px 12px rgba(37, 99, 235, 0.25)'
                    : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  color: isActive ? '#fff' : '#475569',
                }}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scrollBy(120)}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-opacity"
            style={{
              background: `rgba(255,255,255,${glassOpacity})`,
              backdropFilter: `blur(${glassBlur}px)`,
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

export default SiblingSelector;