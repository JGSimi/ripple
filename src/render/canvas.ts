/** Canvas resize + devicePixelRatio handling. */

export type CanvasSurface = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** CSS pixel size */
  width: number;
  height: number;
  dpr: number;
  resize: () => void;
  withCtx: (fn: (ctx: CanvasRenderingContext2D) => void) => void;
  dispose: () => void;
};

export function createCanvasSurface(canvas: HTMLCanvasElement): CanvasSurface {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const surface: CanvasSurface = {
    canvas,
    ctx,
    width: 0,
    height: 0,
    dpr: 1,
    resize() {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
      const cssW = canvas.clientWidth || window.innerWidth;
      const cssH = canvas.clientHeight || window.innerHeight;
      const bw = Math.max(1, Math.round(cssW * dpr));
      const bh = Math.max(1, Math.round(cssH * dpr));

      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }

      // Draw in CSS pixel space
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      surface.width = cssW;
      surface.height = cssH;
      surface.dpr = dpr;
    },
    withCtx(fn) {
      fn(ctx);
    },
    dispose() {
      window.removeEventListener('resize', onResize);
    },
  };

  const onResize = () => surface.resize();
  window.addEventListener('resize', onResize);
  surface.resize();

  return surface;
}
