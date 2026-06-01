import { memo } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useSettingsStore } from '../stores/settingsStore';
import { totalVisitedProvinces, totalProvinces, provinceProgress } from '../data/progressData';

const ProgressPanel = memo(function ProgressPanel() {
  const currentName = useMapStore(s => s.currentName);
  const currentLevel = useMapStore(s => s.currentLevel);
  const { glassBlur, glassOpacity, glassBorderRadius, sidebarWidth, sidebarVisible, accentColor } = useSettingsStore();

  const isNational = currentLevel === 0;

  const getProgress = () => {
    if (isNational) {
      return { title: '全国探索进度', visited: totalVisitedProvinces, total: totalProvinces, unit: '省' };
    }
    const p = provinceProgress[currentName] || { visited: 0, total: 0 };
    return { title: currentName + ' 探索进度', visited: p.visited, total: p.total, unit: '市' };
  };

  const progress = getProgress();
  const percent = progress.total > 0 ? Math.round((progress.visited / progress.total) * 100) : 0;

  if (!sidebarVisible) return null;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        borderRadius: glassBorderRadius,
        background: 'rgba(255, 255, 255, ' + glassOpacity + ')',
        backdropFilter: 'blur(' + glassBlur + 'px)',
        WebkitBackdropFilter: 'blur(' + glassBlur + 'px)',
        border: '1px solid rgba(255, 255, 255, 0.35)',
        boxShadow: '0 8px 48px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
      }}
    >
      <div className="p-5" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
        <h2 className="text-sm font-semibold mb-3 tracking-wide" style={{ color: '#1e293b' }}>{progress.title}</h2>
        <div className="flex items-baseline gap-2 mb-3">
          <span
            className="text-5xl font-bold"
            style={{
              color: accentColor,
              fontFamily: "'JetBrains Mono', monospace",
              textShadow: '0 2px 4px rgba(0,0,0,0.06)',
            }}
          >
            {progress.visited}
          </span>
          <span className="text-base" style={{ color: '#94a3b8' }}>/ {progress.total} {progress.unit}</span>
        </div>
        <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'rgba(148,163,184,0.12)' }}>
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{
              width: percent + '%',
              background: 'linear-gradient(90deg, ' + accentColor + ', #60A5FA)',
              boxShadow: '0 0 14px ' + accentColor + '59',
            }}
          />
        </div>
        <div className="text-[11px] mt-1.5 text-right" style={{ color: '#94a3b8' }}>{percent}% 完成</div>
      </div>

      {isNational && (
        <div className="flex-1 overflow-y-auto p-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-2.5 px-1" style={{ color: '#94a3b8' }}>各省进度</h3>
          <div className="space-y-0.5">
            {Object.entries(provinceProgress).map(([name, p]) => {
              const shortName = name.replace(/(省|市|自治区|特别行政区|壮族|回族|维吾尔|藏族)/g, '');
              const isComplete = p.visited === p.total && p.total > 0;
              return (
                <div
                  key={name}
                  className="flex items-center justify-between text-sm px-2.5 py-1.5 rounded-xl transition-all duration-200 hover:bg-white/40"
                  style={{ color: '#475569' }}
                >
                  <span className="truncate flex items-center gap-1.5 text-[13px]">
                    {isComplete && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accentColor, boxShadow: '0 0 6px ' + accentColor + '80' }} />
                    )}
                    {shortName}
                  </span>
                  <span
                    className="font-medium ml-2 flex-shrink-0"
                    style={{
                      color: isComplete ? accentColor : '#94a3b8',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                    }}
                  >
                    {p.visited}/{p.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isNational && (
        <div className="flex-1 p-4">
          <div className="text-sm text-center mt-8" style={{ color: '#94a3b8' }}>
            点击地图区域查看详细信息
          </div>
        </div>
      )}

      <div className="p-3" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.08)' }}>
        <div className="text-[10px] text-center" style={{ color: '#94a3b8' }}>
          数据来源: 高德地图 API
        </div>
      </div>
    </div>
  );
});

export default ProgressPanel;