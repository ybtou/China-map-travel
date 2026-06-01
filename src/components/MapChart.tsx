import { useEffect, useRef, useCallback, memo } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useSettingsStore } from '../stores/settingsStore';
import {
  fetchGeoJson,
  calculateFitBounds,
  getProgressForFeature,
} from '../engine/amapService';
import { CameraController } from '../core/CameraController';
import { LayerManager } from '../core/LayerManager';
import { AnimationManager } from '../core/AnimationManager';
import { FocusManager } from '../core/FocusManager';
import {
  createInitialState,
  enterLevel,
  leaveLevel,
  replaceCurrentNode,
  NavigationType,
} from '../core/hierarchyEngine';
import type { TooltipInfo } from '../types/area';
import type { HierarchyState } from '../core/hierarchyEngine';

interface MapChartProps {
  map: any;
  onTooltip: (info: TooltipInfo) => void;
}

const MAX_DEPTH = 3;

function getFeatureBbox(feature: any): { center: [number, number]; zoom: number } | null {
  const geom = feature.geometry;
  if (!geom || !geom.coordinates) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  const pc = (c: number[]) => {
    if (c[0] < minLng) minLng = c[0];
    if (c[1] < minLat) minLat = c[1];
    if (c[0] > maxLng) maxLng = c[0];
    if (c[1] > maxLat) maxLat = c[1];
  };
  if (geom.type === 'Polygon') {
    for (const ring of geom.coordinates) for (const c of ring) pc(c);
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) for (const ring of poly) for (const c of ring) pc(c);
  }
  if (minLng === Infinity) return null;
  const center: [number, number] = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
  const lngSpan = Math.max(maxLng - minLng, 0.01);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const SAFE_RATIO = 0.95;
  const zLng = Math.log2(vw * SAFE_RATIO * 360 / (lngSpan * 256));
  const zLat = Math.log2(vh * SAFE_RATIO * 360 / (latSpan * 256));
  const zoom = Math.max(3, Math.min(18, Math.min(zLng, zLat) - 0.32));
  return { center, zoom };
}

const MapChart = memo(function MapChart({ map, onTooltip }: MapChartProps) {
  const cameraRef = useRef<CameraController | null>(null);
  const layerRef = useRef<LayerManager | null>(null);
  const animRef = useRef<AnimationManager | null>(null);
  const focusRef = useRef<FocusManager | null>(null);

  const navRef = useRef<HierarchyState>(createInitialState());
  const currentLevelRef = useRef(0);
  const currentFeaturesRef = useRef<any[]>([]);
  const currentAdcodeRef = useRef('100000');
  const chinaFeaturesRef = useRef<any[]>([]);
  const levelViewportRef = useRef<{ level: number; zoom: number }>({ level: 0, zoom: 5 });
  const currentFeatureRef = useRef<any>(null);
  const siblingFeaturesRef = useRef<any[]>([]);

  const {
    setLoading,
    setError,
    setCurrentName,
    setCurrentLevel,
    setCurrentAdcode,
    setNavigationStack,
  } = useMapStore();
  const setSiblingFeatures = useMapStore(s => s.setSiblingFeatures);

  const onTooltipRef = useRef(onTooltip);
  onTooltipRef.current = onTooltip;

  const getSettings = useCallback(() => useSettingsStore.getState(), []);

  const syncSiblings = useCallback((features: any[]) => {
    const siblings = features.map((f: any) => ({
      name: f.properties?.name || '',
      adcode: String(f.properties?.adcode || ''),
    }));
    setSiblingFeatures(siblings);
  }, [setSiblingFeatures]);

  const getViewport = useCallback(() => ({
    w: map.getContainer()?.clientWidth || window.innerWidth,
    h: map.getContainer()?.clientHeight || window.innerHeight,
  }), [map]);

  /* ---- Render + event binding ---- */

  const renderFeatures = useCallback(
    (features: any[], level: number) => {
      const layer = layerRef.current;
      if (!layer) return [];
      const pairs = layer.renderFeatures(features, level);
      for (const { feature, polygons } of pairs) {
        const name = feature.properties?.name || '';
        const adcode = String(feature.properties?.adcode || '');
        const progress = getProgressForFeature(feature);

        for (const polygon of polygons) {
          polygon.on('mouseover', (e: any) => {
            focusRef.current?.setHover(adcode);
            const px = e.pixel || {};
            onTooltipRef.current({
              visible: true, x: px.x ?? 0, y: px.y ?? 0,
              name, visited: progress.visited > 0,
              totalChildren: progress.total, visitedChildren: progress.visited,
            });
          });
          polygon.on('mouseout', () => {
            focusRef.current?.clearHover();
            onTooltipRef.current({
              visible: false, x: 0, y: 0, name: '', visited: false, totalChildren: 0, visitedChildren: 0,
            });
          });
          polygon.on('mousemove', (e: any) => {
            const px = e.pixel || {};
            onTooltipRef.current({
              visible: true, x: px.x ?? 0, y: px.y ?? 0,
              name, visited: progress.visited > 0,
              totalChildren: progress.total, visitedChildren: progress.visited,
            });
          });
          polygon.on('click', () => {
            if (animRef.current?.isLocked) return;
            const curLevel = currentLevelRef.current;

            const datavLevelMap: Record<string, number> = { province: 1, city: 2, district: 3, county: 3 };
            const featureNumLevel = datavLevelMap[feature.properties?.level] ?? -1;
            const isTerminal = featureNumLevel >= MAX_DEPTH;

            const isSibling = featureNumLevel === curLevel && currentFeaturesRef.current.some(
              (f: any) => f.properties?.adcode === feature.properties?.adcode
            );

            // 同级切换
            if (isSibling && adcode !== currentAdcodeRef.current) {
              if (isTerminal) {
                handleTerminalFocusRef.current(feature);
              } else {
                handleNavigateRef.current(name, adcode, NavigationType.SiblingSwitch, feature);
              }
              return;
            }

            // 终端节点（区县）：聚焦
            if (isTerminal) {
              handleTerminalFocusRef.current(feature);
              return;
            }

            // 正常下钻
            handleNavigateRef.current(name, adcode, NavigationType.DrillDown, feature);
          });
        }
      }
      return pairs;
    },
    []
  );

  /* ---- Terminal Focus ---- */

  const handleTerminalFocus = useCallback(
    async (feature: any) => {
      const camera = cameraRef.current;
      const focus = focusRef.current;
      const anim = animRef.current;
      if (!camera || !focus || !anim) return;
      if (anim.isLocked) return;

      const adcode = String(feature.properties?.adcode || '');
      const name = feature.properties?.name || '';
      if (!adcode) return;

      anim.forceAcquireLock();
      const token = anim.nextToken();

      try {
        const datavLevelMap: Record<string, number> = { province: 1, city: 2, district: 3, county: 3 };
        const featureNumLevel = datavLevelMap[feature.properties?.level] ?? -1;
        const nav = enterLevel(navRef.current, name, featureNumLevel, adcode);
        navRef.current = nav;
        setCurrentName(nav.currentName);
        setCurrentLevel(nav.currentLevel);
        setCurrentAdcode(nav.currentAdcode);
        setNavigationStack(nav.stack);

        console.log('[TerminalFocus]', { name, adcode, featureNumLevel, stack: nav.stack.map((v: any) => v.name), current: nav.currentName });

        const bbox = getFeatureBbox(feature);
        if (!bbox) return;

        currentLevelRef.current = featureNumLevel;
        currentAdcodeRef.current = adcode;
        currentFeatureRef.current = feature;

        focus.setFocus(adcode);

        const s = getSettings();
        await camera.animateTo({ center: bbox.center, zoom: bbox.zoom }, s.drillDownAnimationDuration);

        if (token !== animRef.current?.navigationToken) return;
      } catch (e) {
        console.error('[TerminalFocus] failed:', e);
      } finally {
        if (anim.navigationToken === token) {
          anim.releaseLock();
        }
      }
    },
    [map, getSettings, setCurrentName, setCurrentLevel, setCurrentAdcode, setNavigationStack]
  );

  const handleTerminalFocusRef = useRef(handleTerminalFocus);
  handleTerminalFocusRef.current = handleTerminalFocus;

  /* ---- Navigate (unified) ---- */

  const handleNavigate = useCallback(
    async (name: string, adcode: string, type: NavigationType, clickedFeature?: any) => {
      const anim = animRef.current;
      const camera = cameraRef.current;
      const layer = layerRef.current;
      const focus = focusRef.current;
      if (!anim || !camera || !layer || !focus) return;
      if (anim.isLocked) return;
      if (adcode === currentAdcodeRef.current) return;
      const token = anim.nextToken();
      anim.forceAcquireLock();

      try {
        let nav: HierarchyState;
        let nextLevel: number;

        if (type === NavigationType.SiblingSwitch) {
          // 同级切换：根据当前 features 判断目标层级，截断栈
          const sameLevelFeature = currentFeaturesRef.current.find((f: any) => String(f.properties?.adcode) === adcode);
          const datavLevelMap2: Record<string, number> = { province: 1, city: 2, district: 3, county: 3 };
          const targetLevel = sameLevelFeature ? (datavLevelMap2[sameLevelFeature.properties?.level] ?? currentLevelRef.current) : currentLevelRef.current;
          const truncatedStack = navRef.current.stack.filter((e: any) => e.level < targetLevel);
          nav = {
            currentName: name,
            currentLevel: targetLevel,
            currentAdcode: adcode,
            stack: truncatedStack,
          };
          nextLevel = targetLevel;
        } else {
          nextLevel = currentLevelRef.current + 1;
          nav = enterLevel(navRef.current, name, nextLevel, adcode);
        }

        navRef.current = nav;
        setCurrentName(nav.currentName);
        setCurrentLevel(nav.currentLevel);
        setCurrentAdcode(nav.currentAdcode);
        setNavigationStack(nav.stack);

        console.log('[Navigate]', { type, clickedName: name, clickedAdcode: adcode, nextLevel, stack: nav.stack.map((v: any) => v.name), current: nav.currentName, currentZoom: map.getZoom() });

        // 先显示边界高亮
        if (type !== NavigationType.SiblingSwitch && clickedFeature) {
          focus.showBoundaryHighlight(clickedFeature);
        }

        // 加载子级数据（可能 API 失败或无数据）
        let features: any[] = [];
        let fetchFailed = false;
        try {
          const geoJson = await fetchGeoJson(parseInt(adcode, 10));
          features = (geoJson.features || []).filter(
            (f: any) => f.properties?.adcode && f.properties?.name && f.properties?.level && String(f.properties.adcode) !== adcode
          );
        } catch (_e) {
          fetchFailed = true;
        }

        // 无子级数据（如台湾省）：聚焦 + 弹窗提示
        if (features.length === 0 && type !== NavigationType.SiblingSwitch) {
          const clickedBbox = clickedFeature ? getFeatureBbox(clickedFeature) : null;
          if (clickedBbox) {
            const s = getSettings();
            await camera.animateTo({ center: clickedBbox.center, zoom: clickedBbox.zoom }, s.drillDownAnimationDuration);
          }
          focus.hideBoundaryHighlight();
          // 不回退导航状态，保留 breadcrumb（中国 > 台湾省）
          // 同时更新 feature 引用以显示边界高亮
          currentFeatureRef.current = clickedFeature;
          if (clickedFeature) {
            focus.showBoundaryHighlight(clickedFeature);
          }
          setError('暂无当前行政区数据');
          return;
        }

        const s = getSettings();
        let cameraTarget: { center: [number, number]; zoom: number };

        if (type === NavigationType.SiblingSwitch) {
          // 同级切换：平移 + 根据目标区域大小调整缩放
          const resolvedFeature = clickedFeature || currentFeaturesRef.current.find((f: any) => String(f.properties?.adcode) === adcode);
          const clickedBbox = resolvedFeature ? getFeatureBbox(resolvedFeature) : null;
          if (!clickedBbox) return;
          cameraTarget = {
            center: clickedBbox.center,
            zoom: clickedBbox.zoom,
          };
        } else {
          // 正常下钻：DataV 规则缩放
          const clickedBbox = clickedFeature ? getFeatureBbox(clickedFeature) : null;
          if (!clickedBbox) return;

          const currentZoom = map.getZoom();
          cameraTarget = {
            center: clickedBbox.center,
            zoom: clickedBbox.zoom,
          };
          levelViewportRef.current = { level: nextLevel, zoom: cameraTarget.zoom };
        }

        await camera.animateTo(cameraTarget, s.drillDownAnimationDuration);

        if (token !== animRef.current?.navigationToken) return;

        focus.hideBoundaryHighlight();

        const oldPolygons = layer.getActivePolygons().slice();
        layer.clearActive();

        if (features.length > 0) {
          renderFeatures(features, nextLevel);
        }
        currentLevelRef.current = nextLevel;
        currentAdcodeRef.current = adcode;
        currentFeaturesRef.current = features;
        siblingFeaturesRef.current = features;
        syncSiblings(features);
        currentFeatureRef.current = clickedFeature;

        if (features.length > 0) {
          await anim.crossFade(oldPolygons, layer.getActivePolygons());
        }

        // 焦点最后设置（在 render + crossFade 之后）
        focus.setFocus(adcode);
      } catch (e) {
        console.error('[MapChart] Navigate failed:', e);
      } finally {
        if (anim.navigationToken === token) {
          anim.releaseLock();
        }
      }
    },
    [map, renderFeatures, setCurrentName, setCurrentLevel, setCurrentAdcode, setNavigationStack, setError, getSettings, getViewport]
  );

  const handleNavigateRef = useRef(handleNavigate);
  handleNavigateRef.current = handleNavigate;

  /* ---- Go Back ---- */

  const handleGoBack = useCallback(async () => {
    const anim = animRef.current;
    const camera = cameraRef.current;
    const layer = layerRef.current;
    const focus = focusRef.current;
    if (!anim || !camera || !layer || !focus) return;

    const result = leaveLevel(navRef.current);
    if (!result) return;
    if (anim.isLocked) return;

    const token = anim.nextToken();
    focus.clearFocus();
    focus.hideBoundaryHighlight();
    anim.forceAcquireLock();

    try {
      navRef.current = result;
      setCurrentName(result.currentName);
      setCurrentLevel(result.currentLevel);
      setCurrentAdcode(result.currentAdcode);
      setNavigationStack(result.stack);

      console.log('[GoBack]', { type: NavigationType.Back, stack: result.stack.map((v: any) => v.name), current: result.currentName });

      const geoJson = await fetchGeoJson(parseInt(result.currentAdcode, 10));
      const features = (geoJson.features || []).filter(
        (f: any) => f.properties?.adcode && f.properties?.name && f.properties?.level && String(f.properties.adcode) !== result.currentAdcode
      );
      if (features.length === 0) return;

      const vp = getViewport();
      const target = calculateFitBounds(features, vp.w, vp.h);
      if (!target) return;

      const s = getSettings();
      await camera.animateTo(target, s.returnAnimationDuration);

      if (token !== animRef.current?.navigationToken) return;

      const oldPolygons = layer.getActivePolygons().slice();
      layer.clearActive();
      renderFeatures(features, result.currentLevel);
      currentLevelRef.current = result.currentLevel;
      currentAdcodeRef.current = result.currentAdcode;
      currentFeaturesRef.current = features;
        siblingFeaturesRef.current = features;
        syncSiblings(features);

      await anim.crossFade(oldPolygons, layer.getActivePolygons());
    } catch (e) {
      console.error('[MapChart] Go back failed:', e);
    } finally {
      if (anim.navigationToken === token) {
        anim.releaseLock();
      }
    }
  }, [renderFeatures, setCurrentName, setCurrentLevel, setCurrentAdcode, setNavigationStack, getSettings, getViewport]);

  const handleGoBackRef = useRef(handleGoBack);
  handleGoBackRef.current = handleGoBack;

  /* ---- Go To Root ---- */

  const handleGoToRoot = useCallback(async () => {
    const anim = animRef.current;
    const camera = cameraRef.current;
    const layer = layerRef.current;
    const focus = focusRef.current;
    if (!anim || !camera || !layer || !focus) return;
    if (anim.isLocked) return;

    const token = anim.nextToken();
    focus.clearFocus();
    focus.hideBoundaryHighlight();
    anim.forceAcquireLock();

    try {
      navRef.current = createInitialState();
      setCurrentName('\u4E2D\u56FD');
      setCurrentLevel(0);
      setCurrentAdcode('100000');
      setNavigationStack([]);

      const features = chinaFeaturesRef.current;
      if (features.length === 0) return;

      const vp = getViewport();
      const target = calculateFitBounds(features, vp.w, vp.h);
      if (!target) return;

      const s = getSettings();
      await camera.animateTo(target, s.returnAnimationDuration);

      if (token !== animRef.current?.navigationToken) return;

      const oldPolygons = layer.getActivePolygons().slice();
      layer.clearActive();
      renderFeatures(features, 0);
      currentLevelRef.current = 0;
      currentAdcodeRef.current = '100000';
      currentFeaturesRef.current = features;
        siblingFeaturesRef.current = features;
        syncSiblings(features);

      await anim.crossFade(oldPolygons, layer.getActivePolygons());
    } catch (e) {
      console.error('[MapChart] Go to root failed:', e);
    } finally {
      if (anim.navigationToken === token) {
        anim.releaseLock();
      }
    }
  }, [renderFeatures, setCurrentName, setCurrentLevel, setCurrentAdcode, setNavigationStack, getSettings, getViewport]);

  const handleGoToRootRef = useRef(handleGoToRoot);
  handleGoToRootRef.current = handleGoToRoot;

  /* ---- Navigate To Level (breadcrumb) ---- */

  const navigateToLevel = useCallback(
    async (name: string, level: number, adcode: string, ancestors?: Array<{ name: string; level: number; adcode: string }>) => {
      if (level === 0) {
        handleGoToRootRef.current();
        return;
      }

      const anim = animRef.current;
      const camera = cameraRef.current;
      const layer = layerRef.current;
      const focus = focusRef.current;
      if (!anim || !camera || !layer || !focus) return;

      const token = anim.nextToken();
      focus.clearFocus();
      focus.hideBoundaryHighlight();

      anim.forceAcquireLock();

      try {
        // 使用面包屑传递的完整祖先链重建栈，确保层级严格正确
        const targetStack = ancestors
          ? ancestors.map(e => ({ name: e.name, level: e.level, adcode: e.adcode }))
          : (() => {
              // fallback: 从当前栈中查找
              const idx = navRef.current.stack.findIndex((e) => e.adcode === adcode);
              return idx >= 0 ? navRef.current.stack.slice(0, idx) : navRef.current.stack;
            })();

        const nav: HierarchyState = {
          currentName: name,
          currentLevel: level,
          currentAdcode: adcode,
          stack: targetStack,
        };

        navRef.current = nav;
        setCurrentName(nav.currentName);
        setCurrentLevel(nav.currentLevel);
        setCurrentAdcode(nav.currentAdcode);
        setNavigationStack(nav.stack);

        console.log('[Breadcrumb]', { name, adcode, level, stack: nav.stack.map((v: any) => v.name), current: nav.currentName });

        const geoJson = await fetchGeoJson(parseInt(adcode, 10));
        const features = (geoJson.features || []).filter(
          (f: any) => f.properties?.adcode && f.properties?.name && f.properties?.level && String(f.properties.adcode) !== adcode
        );
        if (features.length === 0) return;

        const vp = getViewport();
        const target = calculateFitBounds(features, vp.w, vp.h);
        if (!target) return;

        const s = getSettings();
        await camera.animateTo(target, s.drillDownAnimationDuration);

        if (token !== animRef.current?.navigationToken) return;

        const oldPolygons = layer.getActivePolygons().slice();
        layer.clearActive();
        renderFeatures(features, level);
        currentLevelRef.current = level;
        currentAdcodeRef.current = adcode;
        currentFeaturesRef.current = features;
        siblingFeaturesRef.current = features;
        syncSiblings(features);
        levelViewportRef.current = { level, zoom: target.zoom };

        await anim.crossFade(oldPolygons, layer.getActivePolygons());
      } catch (e) {
        console.error('[MapChart] Navigate to level failed:', e);
      } finally {
        if (anim.navigationToken === token) {
          anim.releaseLock();
        }
      }
    },
    [setCurrentName, setCurrentLevel, setCurrentAdcode, setNavigationStack, getSettings, getViewport]
  );

  const navigateToLevelRef = useRef(navigateToLevel);
  navigateToLevelRef.current = navigateToLevel;

  /* ---- Init ---- */

  useEffect(() => {
    const initSettings = useSettingsStore.getState();
    cameraRef.current = new CameraController(map, initSettings.cameraEasingType, initSettings.animationDamping);
    layerRef.current = new LayerManager(map);
    animRef.current = new AnimationManager(getSettings);
    focusRef.current = new FocusManager(layerRef.current);

    const unsubSettings = useSettingsStore.subscribe((state, prev) => {
      if (state.cameraEasingType !== prev.cameraEasingType) {
        cameraRef.current?.setEasing(state.cameraEasingType);
      }
      if (state.animationDamping !== prev.animationDamping) {
        cameraRef.current?.setDamping(state.animationDamping);
      }
    });

    (async () => {
      try {
        setLoading(true);
        const geoJson = await fetchGeoJson(100000);
        const features = (geoJson.features || []).filter(
          (f: any) => f.properties?.adcode && f.properties?.name && f.properties?.level && String(f.properties.adcode) !== '100000'
        );
        chinaFeaturesRef.current = features;
        renderFeatures(features, 0);
        currentFeaturesRef.current = features;
        siblingFeaturesRef.current = features;
        syncSiblings(features);

        const vp = getViewport();
        const target = calculateFitBounds(features, vp.w, vp.h);
        if (target) {
          map.setZoomAndCenter(target.zoom, target.center, false);
          levelViewportRef.current = { level: 0, zoom: target.zoom };
        }

        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : '\u521D\u59CB\u5316\u5931\u8D25');
        setLoading(false);
      }
    })();

    return () => unsubSettings();
  }, []);

  /* ---- Global event listeners ---- */

  useEffect(() => {
    const exitHandler = () => handleGoBackRef.current();
    const rootHandler = () => handleGoToRootRef.current();
    const jumpToHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.adcode) {
        navigateToLevelRef.current(detail.name, detail.level, detail.adcode, detail.ancestors);
      }
    };
    const switchSiblingHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.adcode) {
        handleNavigateRef.current(detail.name, detail.adcode, NavigationType.SiblingSwitch);
      }
    };
    window.addEventListener('map:exit', exitHandler);
    window.addEventListener('map:goToRoot', rootHandler);
    window.addEventListener('map:jumpTo', jumpToHandler);
    window.addEventListener('map:switchSibling', switchSiblingHandler);
    return () => {
      window.removeEventListener('map:exit', exitHandler);
      window.removeEventListener('map:goToRoot', rootHandler);
      window.removeEventListener('map:jumpTo', jumpToHandler);
      window.removeEventListener('map:switchSibling', switchSiblingHandler);
    };
  }, []);

  return null;
});

export default MapChart;