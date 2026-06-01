import { useSettingsStore } from '../stores/settingsStore';

export interface LayerConfig {
  strokeColor: string;
  strokeWeight: number;
  strokeOpacity: number;
  fillColor: string;
  fillOpacity: number;
}

export interface FeaturePolygons {
  feature: any;
  polygons: any[];
}

const DEFAULT_CONFIG: LayerConfig = {
  strokeColor: '#C0C8D0',
  strokeWeight: 1.2,
  strokeOpacity: 0.8,
  fillColor: 'transparent',
  fillOpacity: 0,
};

export class LayerManager {
  private map: any;
  private activePolygons: any[] = [];
  private featureIndex: Map<string, FeaturePolygons> = new Map();
  private boundaryPolygon: any = null;

  constructor(map: any) {
    this.map = map;
  }

  /** 彻底销毁 Polygon：移除事件、从地图删除、清空路径 */
  private destroyPolygon(polygon: any): void {
    try {
      try { polygon.clearEvents(); } catch (_) {}
      try { polygon.setMap(null); } catch (_) {}
      try { polygon.setPath([]); } catch (_) {}
      delete (polygon as any)._featureName;
      delete (polygon as any)._featureAdcode;
      delete (polygon as any)._featureLevel;
    } catch (_) {}
  }

  /**
   * 渲染 features，MultiPolygon 拆分为多个独立 Polygon 实例。
   * 返回 FeaturePolygons[]，每个 feature 可能对应 1~N 个 polygon。
   */
  renderFeatures(
    features: any[],
    level: number,
    config?: Partial<LayerConfig>
  ): FeaturePolygons[] {
    const s = useSettingsStore.getState();
    const cfg = { ...DEFAULT_CONFIG, ...config, strokeColor: s.strokeColor, strokeWeight: s.strokeWidth };

    const result: FeaturePolygons[] = [];
    for (const f of features) {
      const name = f.properties?.name || '';
      const adcode = String(f.properties?.adcode || '');
      const paths = this.featureToPaths(f);
      if (paths.length === 0) continue;

      const polygons: any[] = [];
      for (const path of paths) {
        const polygon = new window.AMap.Polygon();
        polygon.setPath(path);
        polygon.setOptions({
          strokeColor: cfg.strokeColor,
          strokeWeight: cfg.strokeWeight,
          strokeOpacity: cfg.strokeOpacity,
          fillColor: cfg.fillColor,
          fillOpacity: cfg.fillOpacity,
          cursor: 'pointer',
          zIndex: 10,
          lineJoin: 'round',
          lineCap: 'round',
        });

        (polygon as any)._featureName = name;
        (polygon as any)._featureAdcode = adcode;
        (polygon as any)._featureLevel = level;

        this.map.add(polygon);
        this.activePolygons.push(polygon);
        polygons.push(polygon);
      }

      if (polygons.length > 0 && adcode) {
        this.featureIndex.set(adcode, { feature: f, polygons });
      }
      result.push({ feature: f, polygons });
    }

    return result;
  }

  getPolygonsByAdcode(adcode: string): any[] {
    const entry = this.featureIndex.get(adcode);
    return entry ? entry.polygons : [];
  }

  getFeatureByAdcode(adcode: string): any | null {
    const entry = this.featureIndex.get(adcode);
    return entry ? entry.feature : null;
  }

  getPolygonLevel(polygon: any): number {
    return (polygon as any)._featureLevel ?? -1;
  }

  /* ---------- Focus style ---------- */

  setFocusStyle(polygon: any): void {
    const s = useSettingsStore.getState();
    try {
      polygon.setOptions({
        strokeColor: s.focusStrokeColor,
        strokeWeight: s.strokeWidth + s.focusStrokeWidthExtra,
        fillOpacity: s.focusFillOpacity,
        fillColor: s.focusStrokeColor,
        strokeOpacity: 1,
        zIndex: 999,
      });
    } catch (_) {}
  }

  setFocusStyleAll(adcode: string): void {
    const polygons = this.getPolygonsByAdcode(adcode);
    for (const p of polygons) this.setFocusStyle(p);
  }

  setHoverStyle(polygon: any): void {
    const s = useSettingsStore.getState();
    try {
      polygon.setOptions({
        strokeColor: s.hoverColor,
        strokeWeight: s.strokeWidth + s.hoverStrokeWidthExtra,
        fillOpacity: s.hoverFillOpacity,
        fillColor: s.hoverColor,
        strokeOpacity: 1,
        zIndex: 100,
      });
    } catch (_) {}
  }

  setHoverStyleAll(adcode: string): void {
    const polygons = this.getPolygonsByAdcode(adcode);
    for (const p of polygons) this.setHoverStyle(p);
  }

  resetNormalStyle(polygon: any): void {
    const s = useSettingsStore.getState();
    try {
      polygon.setOptions({
        strokeColor: s.strokeColor,
        strokeWeight: s.strokeWidth,
        fillOpacity: 0,
        fillColor: 'transparent',
        strokeOpacity: 0.8,
        zIndex: 10,
      });
    } catch (_) {}
  }

  resetNormalStyleAll(adcode: string): void {
    const polygons = this.getPolygonsByAdcode(adcode);
    for (const p of polygons) this.resetNormalStyle(p);
  }

  /* ---------- Boundary Highlight ---------- */

  showBoundary(feature: any): void {
    if (!feature) return;
    this.hideBoundary();
    const paths = this.featureToPaths(feature);
    if (paths.length === 0) return;

    const s = useSettingsStore.getState();
    const boundary = new window.AMap.Polygon({
      path: paths,
      strokeColor: s.focusStrokeColor,
      strokeWeight: s.strokeWidth + s.focusStrokeWidthExtra,
      strokeOpacity: 1,
      fillColor: 'transparent',
      fillOpacity: 0,
      zIndex: 9999,
      lineJoin: 'round',
      lineCap: 'round',
      cursor: 'default',
    });
    this.map.add(boundary);
    this.boundaryPolygon = boundary;
  }

  hideBoundary(): void {
    if (this.boundaryPolygon) {
      try {
        this.map.remove(this.boundaryPolygon);
        try { this.boundaryPolygon.clearEvents(); } catch (_) {}
      } catch (_) {}
      this.boundaryPolygon = null;
    }
  }

  getBoundary(): any {
    return this.boundaryPolygon;
  }

  clearActive(): void {
    for (const p of this.activePolygons) {
      this.destroyPolygon(p);
    }
    this.activePolygons = [];
    this.featureIndex.clear();
  }

  getActivePolygons(): any[] {
    return this.activePolygons;
  }

  /**
   * 为每个 feature 生成独立 path 数组。
   * Polygon → 1 个 path（外环）
   * MultiPolygon → N 个 path（每个 polygon 的外环各自独立）
   */
  private featureToPaths(feature: any): any[][] {
    const geom = feature.geometry;
    if (!geom || !geom.coordinates) return [];
    const result: any[][] = [];

    if (geom.type === 'Polygon') {
      if (geom.coordinates[0]) {
        result.push(
          geom.coordinates[0].map((c: number[]) => new window.AMap.LngLat(c[0], c[1]))
        );
      }
    } else if (geom.type === 'MultiPolygon') {
      for (const polygon of geom.coordinates) {
        if (polygon && polygon[0]) {
          result.push(
            polygon[0].map((c: number[]) => new window.AMap.LngLat(c[0], c[1]))
          );
        }
      }
    }
    return result;
  }

  destroy(): void {
    this.hideBoundary();
    this.clearActive();
    this.map = null;
  }
}