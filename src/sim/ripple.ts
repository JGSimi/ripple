/** Expanding waves. Cap ≤8. radius(t) = speed * (now - bornAt) / 1000. */

import { WAVE_SPEED } from './timing';

export type Ripple = {
  id: number;
  origin: { x: number; y: number };
  bornAt: number;
  speed: number;
  /** Consumed after hitting one target */
  spent: boolean;
  /** Radius at end of previous frame (swept contact) */
  prevRadius: number;
};

export type RippleSim = {
  spawn: (origin: { x: number; y: number }, now: number) => Ripple | null;
  /** Prune waves with r > maxDim * 1.2; does not advance prevRadius */
  prune: (now: number, maxDim: number) => void;
  /** Call after contact tests each frame */
  commitRadii: (now: number) => void;
  active: () => readonly Ripple[];
  radiusAt: (wave: Ripple, now: number) => number;
  clear: () => void;
};

const MAX_WAVES = 8;

export function createRippleSim(): RippleSim {
  const waves: Ripple[] = [];
  let nextId = 1;

  function radiusAt(wave: Ripple, now: number): number {
    const sec = Math.max(0, (now - wave.bornAt) / 1000);
    return wave.speed * sec;
  }

  return {
    spawn(origin, now) {
      if (waves.length >= MAX_WAVES) {
        const dropIdx = waves.findIndex((w) => w.spent);
        if (dropIdx >= 0) waves.splice(dropIdx, 1);
        else waves.shift();
      }
      if (waves.length >= MAX_WAVES) return null;

      const wave: Ripple = {
        id: nextId++,
        origin: { x: origin.x, y: origin.y },
        bornAt: now,
        speed: WAVE_SPEED,
        spent: false,
        prevRadius: 0,
      };
      waves.push(wave);
      return wave;
    },

    prune(now, maxDim) {
      const killR = maxDim * 1.2;
      for (let i = waves.length - 1; i >= 0; i--) {
        if (radiusAt(waves[i]!, now) > killR) waves.splice(i, 1);
      }
    },

    commitRadii(now) {
      for (const w of waves) w.prevRadius = radiusAt(w, now);
    },

    active() {
      return waves;
    },

    radiusAt,

    clear() {
      waves.length = 0;
    },
  };
}

/** True if crest interval [r0,r1] intersects contact band around D. */
export function crestHitsDistance(
  r0: number,
  r1: number,
  distance: number,
  eps: number,
): boolean {
  const lo = Math.min(r0, r1);
  const hi = Math.max(r0, r1);
  return lo <= distance + eps && hi >= distance - eps;
}
