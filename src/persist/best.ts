/** localStorage best + hint flags — M4. Stub in M1. */

const BEST_KEY = 'ripple:best';

export function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const n = raw == null ? 0 : Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function saveBest(_n: number): void {
  // M4
}

export function loadFlags(): { firstHintDone: boolean } {
  return { firstHintDone: false };
}
