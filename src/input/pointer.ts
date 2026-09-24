/** Unified pointer (mouse + touch) → CSS-pixel coords mapped with DPR. */

export type PointerPoint = {
  /** CSS pixels relative to canvas top-left */
  x: number;
  y: number;
  pointerId: number;
  now: number;
};

export type PointerHandlers = {
  onDown?: (p: PointerPoint) => void;
  onMove?: (p: PointerPoint) => void;
  onUp?: (p: PointerPoint) => void;
};

export type PointerHandle = {
  dispose: () => void;
};

function toCanvasCss(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.clientWidth;
  const y = ((clientY - rect.top) / rect.height) * canvas.clientHeight;
  return { x, y };
}

export function attachPointer(
  canvas: HTMLCanvasElement,
  handlers: PointerHandlers,
): PointerHandle {
  const map = (e: PointerEvent): PointerPoint => {
    const { x, y } = toCanvasCss(canvas, e.clientX, e.clientY);
    return { x, y, pointerId: e.pointerId, now: performance.now() };
  };

  const onDown = (e: PointerEvent) => {
    // Capture so move/up stay on canvas even if finger slides off
    canvas.setPointerCapture?.(e.pointerId);
    e.preventDefault();
    handlers.onDown?.(map(e));
  };
  const onMove = (e: PointerEvent) => {
    handlers.onMove?.(map(e));
  };
  const onUp = (e: PointerEvent) => {
    handlers.onUp?.(map(e));
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  return {
    dispose() {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    },
  };
}
