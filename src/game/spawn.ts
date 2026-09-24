/** Continuous target spawn helpers for M2. */

import { SPAWN_Y_MIN } from '../render/layout';
import type { TargetSim } from '../sim/targets';

const MARGIN_X = 56;
const TARGET_RADIUS = 40;
const LEAD_MIN_MS = 850;
const LEAD_MAX_MS = 1250;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function spawnNextTarget(
  targets: TargetSim,
  now: number,
  width: number,
  height: number,
): void {
  const yMin = SPAWN_Y_MIN + TARGET_RADIUS;
  const yMax = Math.max(yMin + 10, height - MARGIN_X);
  const xMin = MARGIN_X;
  const xMax = Math.max(xMin + 10, width - MARGIN_X);

  const x = rand(xMin, xMax);
  const y = rand(yMin, yMax);
  const lead = rand(LEAD_MIN_MS, LEAD_MAX_MS);
  targets.spawn({
    center: { x, y },
    radius: TARGET_RADIUS,
    idealContactAt: now + lead,
  });
}
