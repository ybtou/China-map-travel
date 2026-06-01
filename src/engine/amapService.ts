import { getProgressForName } from '../data/progressData';

export const PROVINCES: Array<{ name: string; adcode: number; level: string }> = [
  { name: '北京市', adcode: 110000, level: 'province' },
  { name: '天津市', adcode: 120000, level: 'province' },
  { name: '河北省', adcode: 130000, level: 'province' },
  { name: '山西省', adcode: 140000, level: 'province' },
  { name: '内蒙古自治区', adcode: 150000, level: 'province' },
  { name: '辽宁省', adcode: 210000, level: 'province' },
  { name: '吉林省', adcode: 220000, level: 'province' },
  { name: '黑龙江省', adcode: 230000, level: 'province' },
  { name: '上海市', adcode: 310000, level: 'province' },
  { name: '江苏省', adcode: 320000, level: 'province' },
  { name: '浙江省', adcode: 330000, level: 'province' },
  { name: '安徽省', adcode: 340000, level: 'province' },
  { name: '福建省', adcode: 350000, level: 'province' },
  { name: '江西省', adcode: 360000, level: 'province' },
  { name: '山东省', adcode: 370000, level: 'province' },
  { name: '河南省', adcode: 410000, level: 'province' },
  { name: '湖北省', adcode: 420000, level: 'province' },
  { name: '湖南省', adcode: 430000, level: 'province' },
  { name: '广东省', adcode: 440000, level: 'province' },
  { name: '广西壮族自治区', adcode: 450000, level: 'province' },
  { name: '海南省', adcode: 460000, level: 'province' },
  { name: '重庆市', adcode: 500000, level: 'province' },
  { name: '四川省', adcode: 510000, level: 'province' },
  { name: '贵州省', adcode: 520000, level: 'province' },
  { name: '云南省', adcode: 530000, level: 'province' },
  { name: '西藏自治区', adcode: 540000, level: 'province' },
  { name: '陕西省', adcode: 610000, level: 'province' },
  { name: '甘肃省', adcode: 620000, level: 'province' },
  { name: '青海省', adcode: 630000, level: 'province' },
  { name: '宁夏回族自治区', adcode: 640000, level: 'province' },
  { name: '新疆维吾尔自治区', adcode: 650000, level: 'province' },
  { name: '台湾省', adcode: 710000, level: 'province' },
  { name: '香港特别行政区', adcode: 810000, level: 'province' },
  { name: '澳门特别行政区', adcode: 820000, level: 'province' },
];

const geoJsonCache = new Map<number, any>();

export async function fetchGeoJson(adcode: number): Promise<any> {
  if (geoJsonCache.has(adcode)) return geoJsonCache.get(adcode)!;
  const url = 'https://geo.datav.aliyun.com/areas_v3/bound/' + adcode + '_full.json';
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('HTTP ' + resp.status + ' for adcode ' + adcode);
  const data = await resp.json();
  geoJsonCache.set(adcode, data);
  return data;
}

export function geoJsonFeatureToAmpPaths(feature: any): any[][] {
  const geom = feature.geometry;
  if (!geom) return [];
  const rings: any[][] = [];
  if (geom.type === 'Polygon') {
    rings.push(geom.coordinates[0].map((c: number[]) => new window.AMap.LngLat(c[0], c[1])));
  } else if (geom.type === 'MultiPolygon') {
    for (const polygon of geom.coordinates) {
      rings.push(polygon[0].map((c: number[]) => new window.AMap.LngLat(c[0], c[1])));
    }
  }
  return rings;
}

export function featureToBounds(feature: any): any | null {
  const geom = feature.geometry;
  if (!geom) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  const processCoord = (c: number[]) => {
    if (c[0] < minLng) minLng = c[0];
    if (c[1] < minLat) minLat = c[1];
    if (c[0] > maxLng) maxLng = c[0];
    if (c[1] > maxLat) maxLat = c[1];
  };
  const processCoordArray = (coords: number[][]) => {
    for (const c of coords) processCoord(c);
  };
  if (geom.type === 'Polygon') {
    for (const ring of geom.coordinates) processCoordArray(ring);
  } else if (geom.type === 'MultiPolygon') {
    for (const polygon of geom.coordinates) {
      for (const ring of polygon) processCoordArray(ring);
    }
  }
  if (minLng === Infinity) return null;
  return new window.AMap.Bounds(
    new window.AMap.LngLat(minLng, minLat),
    new window.AMap.LngLat(maxLng, maxLat),
  );
}

export function allFeaturesToBounds(features: any[]): any | null {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const f of features) {
    const geom = f.geometry;
    if (!geom) continue;
    const processCoord = (c: number[]) => {
      if (c[0] < minLng) minLng = c[0];
      if (c[1] < minLat) minLat = c[1];
      if (c[0] > maxLng) maxLng = c[0];
      if (c[1] > maxLat) maxLat = c[1];
    };
    const processCoordArray = (coords: number[][]) => {
      for (const c of coords) processCoord(c);
    };
    if (geom.type === 'Polygon') {
      for (const ring of geom.coordinates) processCoordArray(ring);
    } else if (geom.type === 'MultiPolygon') {
      for (const polygon of geom.coordinates) {
        for (const ring of polygon) processCoordArray(ring);
      }
    }
  }
  if (minLng === Infinity) return null;
  return new window.AMap.Bounds(
    new window.AMap.LngLat(minLng, minLat),
    new window.AMap.LngLat(maxLng, maxLat),
  );
}

/**
 * 计算 fitBounds 所需的 center + zoom。
 *
 * AMap Web Mercator：zoom z 时，256 * 2^z 像素覆盖 360° 经度。
 * 所以 1° 经度 = 256 * 2^z / 360 像素。
 * 要把 lngSpan° 放入 viewportWidth * SAFE_RATIO 像素：
 *   2^z = viewportWidth * SAFE_RATIO * 360 / (lngSpan * 256)
 *   z = log2(viewportWidth * SAFE_RATIO * 360 / (lngSpan * 256))
 *
 * 纬度同理，取两者最小值确保都完整显示。
 */
export function calculateFitBounds(
  features: any[],
  viewportWidth: number,
  viewportHeight: number
): { center: [number, number]; zoom: number } | null {
  const bounds = allFeaturesToBounds(features);
  if (!bounds) return null;

  const center = bounds.getCenter();
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const lngSpan = Math.max(ne.getLng() - sw.getLng(), 0.01);
  const latSpan = Math.max(ne.getLat() - sw.getLat(), 0.01);

  const SAFE_RATIO = 0.95;
  const zLng = Math.log2(viewportWidth * SAFE_RATIO * 360 / (lngSpan * 256));
  const zLat = Math.log2(viewportHeight * SAFE_RATIO * 360 / (latSpan * 256));
  const zoom = Math.max(3, Math.min(18, Math.min(zLng, zLat) - 0.32));

  return { center: [center.getLng(), center.getLat()], zoom };
}

export function calculateZoomForBounds(bounds: any): number {
  if (!bounds) return 5;
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const lngSpan = ne.getLng() - sw.getLng();
  const latSpan = ne.getLat() - sw.getLat();
  const span = Math.max(lngSpan, latSpan);
  if (span > 60) return 4;
  if (span > 30) return 5;
  if (span > 15) return 6;
  if (span > 8) return 7;
  if (span > 4) return 8;
  if (span > 2) return 9;
  if (span > 1) return 10;
  if (span > 0.5) return 11;
  if (span > 0.2) return 12;
  if (span > 0.1) return 13;
  return 14;
}

export function getProgressForFeature(feature: any): { visited: number; total: number } {
  const name = feature.properties?.name || '';
  return getProgressForName(name);
}

export const ANIM_DURATION = 600;

export const COLORS = {
  fill: 'transparent',
  hover: 'transparent',
  stroke: '#8B99AB',
  strokeHover: '#1D4ED8',
  strokeInner: '#FFFFFF',
};