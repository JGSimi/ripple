/** prefers-reduced-motion + frame-budget gates for Nice juice. */

let cached: boolean | null = null;
/** Last frame dt (ms); used as cheap frame-budget signal */
let lastDtMs = 16;
/** Skip Nice spawns if frame slower than ~45fps */
const FRAME_BUDGET_MS = 22;

function readReduced(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function reducedMotion(): boolean {
  if (cached === null) cached = readReduced();
  return cached;
}

export function noteFrameDt(dtMs: number): void {
  lastDtMs = dtMs;
}

export function frameBudgetOk(): boolean {
  return lastDtMs < FRAME_BUDGET_MS;
}

/** Nice juice gate: motion OK + frame budget OK */
export function allowNice(): boolean {
  return !reducedMotion() && frameBudgetOk();
}

export function allowParticles(): boolean {
  return allowNice();
}

if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => {
    cached = mq.matches;
  };
  mq.addEventListener?.('change', sync);
}
