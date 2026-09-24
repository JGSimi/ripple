/** rAF game loop with performance.now() + dt; pauses when document.hidden. */

export type LoopHandlers = {
  update: (now: number, dt: number) => void;
  render: (now: number) => void;
};

export type LoopHandle = {
  start: () => void;
  stop: () => void;
};

const MAX_DT_MS = 50; // clamp spiral-of-death / long tab away

export function createLoop(handlers: LoopHandlers): LoopHandle {
  let rafId = 0;
  let running = false;
  let lastNow = 0;
  let paused = typeof document !== 'undefined' ? document.hidden : false;

  const onVisibility = () => {
    paused = document.hidden;
    if (!paused) {
      // Reset dt baseline so we don't dump a huge frame after resume
      lastNow = performance.now();
    }
  };

  const frame = (now: number) => {
    if (!running) return;
    rafId = requestAnimationFrame(frame);

    if (paused) {
      lastNow = now;
      return;
    }

    if (lastNow === 0) lastNow = now;
    let dt = now - lastNow;
    lastNow = now;
    if (dt < 0) dt = 0;
    if (dt > MAX_DT_MS) dt = MAX_DT_MS;

    handlers.update(now, dt);
    handlers.render(now);
  };

  return {
    start() {
      if (running) return;
      running = true;
      lastNow = 0;
      document.addEventListener('visibilitychange', onVisibility);
      paused = document.hidden;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
