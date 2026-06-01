import { useEffect, useRef, useState, memo } from 'react';
import MapChart from './MapChart';
import { useMapStore } from '../stores/mapStore';
import type { TooltipInfo } from '../types/area';

const CHINA_CENTER: [number, number] = [104.5, 36];
const CHINA_ZOOM = 5;

const MapCanvas = memo(function MapCanvas() {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  const onTooltip = useMapStore((s) => s.setTooltip);

  const handleTooltip = (info: TooltipInfo) => onTooltip(info);

  useEffect(() => {
    if (mapRef.current) return;

    const initMap = () => {
      if (typeof window.AMap === 'undefined') {
        setTimeout(initMap, 200);
        return;
      }

      const map = new window.AMap.Map('amap-container', {
        zoom: CHINA_ZOOM,
        center: CHINA_CENTER,
        mapStyle: 'amap://styles/whitesmoke',
        viewMode: '2D',
        resizeEnable: true,
        zooms: [3, 18],
      });
      map.addControl(new window.AMap.Scale({ visible: false }));
      map.addControl(new window.AMap.ToolBar({ position: 'RB', visible: false }));

      mapRef.current = map;
      setMapReady(true);
    };

    initMap();
  }, []);

  return (
    <div className="w-full h-full relative" style={{ background: '#FFFFFF' }}>
      <div ref={containerRef} id="amap-container" className="w-full h-full" />
      {mapReady && mapRef.current && (
        <MapChart map={mapRef.current} onTooltip={handleTooltip} />
      )}
    </div>
  );
});

export default MapCanvas;