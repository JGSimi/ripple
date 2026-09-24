/** prefers-reduced-motion + gates for nice juice (M3+/M5). */

let cached: boolean | null = null;

function readReduced(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function reducedMotion(): boolean {
  if (cached === null) cached = readReduced();
  return cached;
}

export function allowParticles(): boolean {
  return !reducedMotion();
}

if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => {
    cached = mq.matches;
  };
  mq.addEventListener?.('change', sync);
}
