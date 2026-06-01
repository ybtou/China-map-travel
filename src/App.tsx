import { useState, useCallback } from 'react';
import MapCanvas from './components/MapCanvas';
import Tooltip from './components/Tooltip';
import BackButton from './components/BackButton';
import Breadcrumb from './components/Breadcrumb';
import ProgressPanel from './components/ProgressPanel';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorToast from './components/ErrorToast';
import SettingsPanel from './components/SettingsPanel';
import { useSettingsStore } from './stores/settingsStore';
import { useMapStore } from './stores/mapStore';

export default function App() {
  const tooltip = useMapStore(s => s.tooltip);

  const { sidebarWidth, sidebarVisible } = useSettingsStore();

  return (
    <div className="w-screen h-screen relative overflow-hidden" style={{ background: '#f0f4f8' }}>
      <div className="absolute inset-0">
        <MapCanvas />
      </div>

      {sidebarVisible && (
        <div className="absolute top-3 right-3 bottom-3 z-30" style={{ width: sidebarWidth }}>
          <ProgressPanel />
        </div>
      )}

      <Breadcrumb />
      <BackButton />
      <LoadingOverlay />
      <Tooltip info={tooltip} />
      <ErrorToast />
      <SettingsPanel />
    </div>
  );
}