function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class AnimationManager {
  private lock = false;
  private cancelled = false;
  private getSettings: () => any;
  private _navigationToken = 0;

  constructor(getSettings: () => any) {
    this.getSettings = getSettings;
  }

  get isLocked(): boolean {
    return this.lock;
  }

  get navigationToken(): number {
    return this._navigationToken;
  }

  acquireLock(): boolean {
    if (this.lock) return false;
    this.lock = true;
    this.cancelled = false;
    return true;
  }

  forceAcquireLock(): void {
    this.lock = true;
    this.cancelled = false;
  }

  releaseLock(): void {
    this.lock = false;
    this.cancelled = false;
  }

  cancelPending(): void {
    this.cancelled = true;
  }

  nextToken(): number {
    this._navigationToken++;
    return this._navigationToken;
  }

  async crossFade(
    oldPolygons: any[],
    newPolygons: any[],
    duration?: number
  ): Promise<void> {
    const s = this.getSettings();
    const dur = duration ?? s.crossfadeDuration;
    if (oldPolygons.length === 0 && newPolygons.length === 0) return;

    return new Promise((resolve) => {
      const start = performance.now();
      const frame = (now: number) => {
        if (this.cancelled) {
          resolve();
          return;
        }
        const elapsed = now - start;
        const raw = Math.min(elapsed / dur, 1);
        const t = easeInOutCubic(raw);
        const oldVal = 0.8 * (1 - t);
        const newVal = 0.8 * t;

        for (const p of oldPolygons) {
          try { p.setOptions({ strokeOpacity: oldVal }); } catch (_) {}
        }
        for (const p of newPolygons) {
          try { p.setOptions({ strokeOpacity: newVal }); } catch (_) {}
        }

        if (raw < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
  }

  async fadeIn(polygons: any[], duration?: number): Promise<void> {
    const s = this.getSettings();
    const dur = duration ?? s.crossfadeDuration;
    if (polygons.length === 0) return;

    for (const p of polygons) {
      try { p.setOptions({ strokeOpacity: 0 }); } catch (_) {}
    }

    return new Promise((resolve) => {
      const start = performance.now();
      const frame = (now: number) => {
        if (this.cancelled) {
          resolve();
          return;
        }
        const elapsed = now - start;
        const raw = Math.min(elapsed / dur, 1);
        const t = easeInOutCubic(raw);
        const val = 0.8 * t;

        for (const p of polygons) {
          try { p.setOptions({ strokeOpacity: val }); } catch (_) {}
        }

        if (raw < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
  }

  async fadeOut(polygons: any[], duration?: number): Promise<void> {
    const s = this.getSettings();
    const dur = duration ?? s.crossfadeDuration;
    if (polygons.length === 0) return;

    return new Promise((resolve) => {
      const start = performance.now();
      const frame = (now: number) => {
        if (this.cancelled) {
          resolve();
          return;
        }
        const elapsed = now - start;
        const raw = Math.min(elapsed / dur, 1);
        const t = easeInOutCubic(raw);
        const val = 0.8 * (1 - t);

        for (const p of polygons) {
          try { p.setOptions({ strokeOpacity: val }); } catch (_) {}
        }

        if (raw < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
  }

  destroy(): void {
    this.lock = false;
    this.cancelled = false;
  }
}