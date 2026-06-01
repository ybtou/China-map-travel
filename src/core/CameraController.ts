function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function linear(t: number): number {
  return t;
}

/**
 * 阻尼：控制动画的过冲/衰减
 * damping = 1.0 → 原始曲线
 * damping < 1.0 → 过冲回弹（< 0.5 强烈回弹）
 * damping > 1.0 → 过阻尼（更缓慢衰减）
 */
function applyDamping(t: number, damping: number): number {
  if (damping >= 1) {
    // 过阻尼：衰减更慢
    return 1 - Math.pow(1 - t, 1 / damping);
  }
  // 欠阻尼：过冲 + 回弹
  const amplitude = (1 - damping) * 0.8;
  const period = 0.4 + damping * 0.3;
  return 1 - Math.pow(1 - t, 2 * damping) * Math.cos(t * Math.PI / period) * (1 - amplitude * (1 - t));
}

const EASING_MAP: Record<string, (t: number) => number> = {
  easeInOutCubic,
  easeOutCubic,
  easeInCubic,
  linear,
};

export function getEasingFunction(type: string): (t: number) => number {
  return EASING_MAP[type] || easeInOutCubic;
}

export interface CameraState {
  center: [number, number];
  zoom: number;
  pitch?: number;
  rotation?: number;
}

export class CameraController {
  private map: any;
  private animationId: number | null = null;
  private _isAnimating = false;
  private _resolve: (() => void) | null = null;
  private _easingFn: (t: number) => number;
  private _damping: number;

  constructor(map: any, easingType?: string, damping?: number) {
    this.map = map;
    this._easingFn = getEasingFunction(easingType || 'easeInOutCubic');
    this._damping = damping ?? 1.15;
  }

  setEasing(type: string): void {
    this._easingFn = getEasingFunction(type);
  }

  setDamping(damping: number): void {
    this._damping = damping;
  }

  get isAnimating(): boolean {
    return this._isAnimating;
  }

  animateTo(
    target: CameraState,
    duration: number = 600,
    onUpdate?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      this.cancel();
      this._isAnimating = true;
      this._resolve = resolve;

      const startCenter = this.map.getCenter();
      const startZoom = this.map.getZoom();
      const startLng = startCenter.getLng();
      const startLat = startCenter.getLat();
      const easingFn = this._easingFn;
      const damping = this._damping;

      const start = performance.now();

      const frame = (now: number) => {
        const elapsed = now - start;
        const raw = Math.min(elapsed / duration, 1);
        const eased = easingFn(raw);
        // damping ≠ 1 时应用阻尼曲线
        const t = damping !== 1 ? applyDamping(eased, damping) : eased;

        const lng = startLng + (target.center[0] - startLng) * t;
        const lat = startLat + (target.center[1] - startLat) * t;
        const zoom = startZoom + (target.zoom - startZoom) * t;

        this.map.setZoomAndCenter(zoom, [lng, lat], false);

        if (onUpdate) onUpdate(t);

        if (raw < 1) {
          this.animationId = requestAnimationFrame(frame);
        } else {
          this._isAnimating = false;
          this.animationId = null;
          this._resolve = null;
          resolve();
        }
      };

      this.animationId = requestAnimationFrame(frame);
    });
  }

  cancel(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      this._isAnimating = false;
      this._resolve?.();
      this._resolve = null;
    }
  }

  destroy(): void {
    this.cancel();
    this.map = null;
  }
}