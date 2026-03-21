import type * as THREE from "three";
import type { QualityLevel } from "../../types/Quality";

export class PerformanceMonitor {
  private enabled = false;
  private overlay: HTMLDivElement;
  private accumulatorMs = 0;
  private frameCount = 0;
  private lastSampleTs = 0;

  constructor(container: HTMLElement) {
    this.overlay = document.createElement("div");
    this.overlay.className = "perf-overlay";
    this.overlay.style.display = "none";
    container.appendChild(this.overlay);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.overlay.style.display = enabled ? "block" : "none";
  }

  public update(
    frameMs: number,
    timestamp: number,
    renderer: THREE.WebGLRenderer,
    quality: QualityLevel
  ): void {
    if (!this.enabled) {
      return;
    }

    this.accumulatorMs += frameMs;
    this.frameCount += 1;

    if (timestamp - this.lastSampleTs < 350) {
      return;
    }

    const avgFrameMs = this.accumulatorMs / Math.max(1, this.frameCount);
    const fps = 1000 / Math.max(1, avgFrameMs);

    this.overlay.textContent =
      `FPS ${fps.toFixed(1)}\n` +
      `Frame ${avgFrameMs.toFixed(2)} ms\n` +
      `Quality ${quality}\n` +
      `Draws ${renderer.info.render.calls}\n` +
      `Tris ${renderer.info.render.triangles}`;

    this.lastSampleTs = timestamp;
    this.accumulatorMs = 0;
    this.frameCount = 0;
  }
}
