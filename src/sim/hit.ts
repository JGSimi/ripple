/** Contact crest × target → grade (DEV logs errorMs). */

import { crestHitsDistance, type Ripple, type RippleSim } from './ripple';
import type { Target } from './targets';
import { CONTACT_EPS, judge, type Grade } from './timing';

export type HitEvent = {
  wave: Ripple;
  target: Target;
  grade: Grade;
  errorMs: number;
  contactAt: number;
  distance: number;
};

function dist(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * First contact this frame between any unspent wave and live targets.
 * Geometric contactAt = bornAt + distance/speed*1000.
 */
export function detectHits(
  ripples: RippleSim,
  targets: readonly Target[],
  now: number,
): HitEvent[] {
  const events: HitEvent[] = [];

  for (const wave of ripples.active()) {
    if (wave.spent) continue;
    const r1 = ripples.radiusAt(wave, now);
    const r0 = wave.prevRadius;

    for (const target of targets) {
      const D = dist(wave.origin, target.center);
      if (!crestHitsDistance(r0, r1, D, CONTACT_EPS)) continue;

      const contactAt = wave.bornAt + (D / wave.speed) * 1000;
      const errorMs = Math.abs(contactAt - target.idealContactAt);
      const grade = judge(errorMs);

      if (import.meta.env.DEV) {
        console.debug(
          `[ripple] hit grade=${grade} errorMs=${errorMs.toFixed(1)} D=${D.toFixed(1)}`,
        );
      }

      events.push({ wave, target, grade, errorMs, contactAt, distance: D });
      break; // one target per wave
    }
  }

  return events;
}
