/** Continuous target spawn helpers. */

import { SPAWN_Y_MIN } from '../render/layout';
import type { TargetSim } from '../sim/targets';

const MARGIN_X = 56;
/** Frames spec ~28–36 */
export const TARGET_RADIUS = 32;
const TARGET_RADIUS_EARLY = 36;
const LEAD_MIN_MS = 800;
const LEAD_MAX_MS = 1150;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function spawnNextTarget(
  targets: TargetSim,
  now: number,
  width: number,
  height: number,
  opts?: { lifetimeHits?: number },
): void {
  const early = (opts?.lifetimeHits ?? 99) < 3;
  const radius = early ? TARGET_RADIUS_EARLY : TARGET_RADIUS;
  const yMin = SPAWN_Y_MIN + radius;
  const yMax = Math.max(yMin + 10, height - MARGIN_X);
  const xMin = MARGIN_X;
  const xMax = Math.max(xMin + 10, width - MARGIN_X);

  const x = rand(xMin, xMax);
  const y = rand(yMin, yMax);
  const lead = rand(LEAD_MIN_MS, LEAD_MAX_MS);
  targets.spawn({
    center: { x, y },
    radius,
    idealContactAt: now + lead,
  });
}
