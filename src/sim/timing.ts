/** Timing windows + wave constants (Design v0.2 — locked). */

export const WAVE_SPEED = 420; // px/s (CSS pixels)

/** Perfect if |errorMs| <= this */
export const PERFECT_WINDOW_MS = 32;
/** Good if |errorMs| <= this (and > Perfect) */
export const GOOD_WINDOW_MS = 72;

export const PERFECT_MS = PERFECT_WINDOW_MS;
export const GOOD_MS = GOOD_WINDOW_MS;

export const CONTACT_EPS = 2.5; // CSS px

export type Grade = 'perfect' | 'good' | 'miss';

export function judge(errorMs: number): Grade {
  const abs = Math.abs(errorMs);
  if (abs <= PERFECT_WINDOW_MS) return 'perfect';
  if (abs <= GOOD_WINDOW_MS) return 'good';
  return 'miss';
}
