import type { LayerManager } from './LayerManager';

export class FocusManager {
  private layer: LayerManager;
  private _focusAdcode: string | null = null;
  private _hoverAdcode: string | null = null;

  constructor(layer: LayerManager) {
    this.layer = layer;
  }

  get focusAdcode(): string | null {
    return this._focusAdcode;
  }

  /** 即时焦点高亮（通过 adcode 设置所有 polygon 样式）*/
  setFocus(adcode: string): void {
    if (this._focusAdcode === adcode) return;

    // 重置旧焦点
    if (this._focusAdcode && this._focusAdcode !== adcode) {
      this.layer.resetNormalStyleAll(this._focusAdcode);
    }

    // 重置 hover
    if (this._hoverAdcode && this._hoverAdcode !== adcode) {
      this.layer.resetNormalStyleAll(this._hoverAdcode);
      this._hoverAdcode = null;
    }

    this._focusAdcode = adcode;
    this.layer.setFocusStyleAll(adcode);
  }

  /** hover 高亮（仅当非焦点时生效） */
  setHover(adcode: string): void {
    if (adcode === this._focusAdcode) return;
    if (this._hoverAdcode === adcode) return;

    // 重置旧 hover
    if (this._hoverAdcode && this._hoverAdcode !== this._focusAdcode) {
      this.layer.resetNormalStyleAll(this._hoverAdcode);
    }

    this._hoverAdcode = adcode;
    this.layer.setHoverStyleAll(adcode);
  }

  /** 清除 hover */
  clearHover(): void {
    if (this._hoverAdcode && this._hoverAdcode !== this._focusAdcode) {
      this.layer.resetNormalStyleAll(this._hoverAdcode);
    }
    this._hoverAdcode = null;
  }

  /** 层级切换时清空所有焦点状态 */
  clearFocus(): void {
    if (this._focusAdcode) {
      this.layer.resetNormalStyleAll(this._focusAdcode);
    }
    if (this._hoverAdcode && this._hoverAdcode !== this._focusAdcode) {
      this.layer.resetNormalStyleAll(this._hoverAdcode);
    }
    this._focusAdcode = null;
    this._hoverAdcode = null;
  }

  showBoundaryHighlight(feature: any): void {
    this.layer.showBoundary(feature);
  }

  hideBoundaryHighlight(): void {
    this.layer.hideBoundary();
  }

  destroy(): void {
    this.clearFocus();
    this.layer.hideBoundary();
  }
}