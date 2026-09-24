import './styles.css';
import { createLoop } from './game/loop';
import { createState } from './game/state';
import { attachPointer } from './input/pointer';
import { createCanvasSurface } from './render/canvas';
import { draw } from './render/draw';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('#game canvas missing');

const surface = createCanvasSurface(canvas);
const state = createState(performance.now());

state.dispatch({
  type: 'RESIZE',
  width: surface.width,
  height: surface.height,
});

attachPointer(canvas, {
  onDown: (p) => {
    // Mute hit target ≥44×44 top-left (spec-frames)
    if (p.x <= 44 && p.y <= 44) {
      state.dispatch({ type: 'TOGGLE_MUTE' });
      return;
    }
    state.dispatch({ type: 'POINTER_DOWN', x: p.x, y: p.y, now: p.now });
  },
});

const loop = createLoop({
  update(now, dt) {
    state.dispatch({ type: 'FRAME', now, dt });
  },
  render(now) {
    if (
      surface.width !== canvas.clientWidth ||
      surface.height !== canvas.clientHeight
    ) {
      surface.resize();
      state.dispatch({
        type: 'RESIZE',
        width: surface.width,
        height: surface.height,
      });
    }
    draw(surface, state.getSnapshot(), now);
  },
});

loop.start();
