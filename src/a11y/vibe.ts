/** Progressive-enhancement vibration (Nice). */

import { allowNice } from './motion';

export function vibePerfect(): void {
  if (!allowNice()) return;
  try {
    navigator.vibrate?.(12);
  } catch {
    // unsupported / blocked
  }
}

export function vibeMiss(): void {
  if (!allowNice()) return;
  try {
    navigator.vibrate?.([10, 40, 10]);
  } catch {
    // unsupported / blocked
  }
}
