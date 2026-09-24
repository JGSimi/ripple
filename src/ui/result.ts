/** Minimal result helpers — full overlay polish in M4. */

export function isRetryHit(_x: number, _y: number): boolean {
  // M2: tap-anywhere on result retries via state; keep API for M4 CTA box
  return true;
}
