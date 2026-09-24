/** Result overlay layout + CTA hit testing (canvas-space). */

export type ResultLayout = {
  cardX: number;
  cardY: number;
  cardW: number;
  cardH: number;
  ctaX: number;
  ctaY: number;
  ctaW: number;
  ctaH: number;
};

const CARD_W = 280;
const CARD_H = 200;
const CTA_H = 52;
const PAD = 24;

export function layoutResult(width: number, height: number): ResultLayout {
  const cardW = Math.min(CARD_W, width - 32);
  const cardH = CARD_H;
  const cardX = (width - cardW) * 0.5;
  const cardY = (height - cardH) * 0.5;
  const ctaW = cardW - PAD * 2;
  const ctaH = CTA_H;
  const ctaX = cardX + PAD;
  const ctaY = cardY + cardH - PAD - ctaH;
  return { cardX, cardY, cardW, cardH, ctaX, ctaY, ctaW, ctaH };
}

/** CTA button hit; tap-anywhere also retries via state. */
export function isRetryHit(x: number, y: number, width: number, height: number): boolean {
  const L = layoutResult(width, height);
  return (
    x >= L.ctaX &&
    x <= L.ctaX + L.ctaW &&
    y >= L.ctaY &&
    y <= L.ctaY + L.ctaH
  );
}

/** Entire overlay accepts restart (<1s UX). */
export function isOverlayRetry(_x: number, _y: number): boolean {
  return true;
}
