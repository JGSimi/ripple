/** Draw playfield: bg, targets, ripples, HUD juice, judgment, result. */

import { reducedMotion } from '../a11y/motion';
import type { Snapshot } from '../game/state';
import { JUDGMENT_RISE_PX, SCORE_POP_MS } from '../game/juice';
import type { CanvasSurface } from './canvas';
import { HUD_PAD_TOP, HUD_PAD_X } from './layout';
import { readTokens } from './tokens';
import { layoutResult } from '../ui/result';

const RESULT_ENTER_MS = 180;

export function draw(surface: CanvasSurface, snapshot: Snapshot, now: number): void {
  const { ctx, width, height } = surface;
  const t = readTokens();
  const clock = snapshot.clock;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, width, height);

  if (snapshot.phase === 'boot') {
    drawBoot(ctx, width, height, t.ink);
    return;
  }

  for (const target of snapshot.targets) {
    drawTarget(ctx, target, now, t);
  }

  const maxDim = Math.max(width, height) || 1;
  for (const wave of snapshot.ripples) {
    if (wave.spent) continue;
    const ageSec = Math.max(0, (clock - wave.bornAt) / 1000);
    const r = wave.speed * ageSec;
    if (r <= 0.5) continue;
    const fade = Math.max(0, 1 - r / (maxDim * 1.2));
    ctx.beginPath();
    ctx.arc(wave.origin.x, wave.origin.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(t.accent, 0.15 + fade * 0.85);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (snapshot.judgment) {
    const j = snapshot.judgment;
    const u = Math.min(1, (now - j.bornAt) / j.lifeMs);
    const rise = reducedMotion() ? 0 : JUDGMENT_RISE_PX * u;
    const alpha = 1 - u;
    ctx.fillStyle = withAlpha(j.kind === 'perfect' ? t.perfect : t.good, alpha);
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(j.text, j.x, j.y - 28 - rise);
  }

  if (snapshot.phase === 'playing' || snapshot.phase === 'result') {
    drawHud(ctx, width, snapshot, now, t);
  }

  if (snapshot.phase === 'result') {
    drawResult(ctx, width, height, snapshot, now, t);
  }
}

function drawBoot(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ink: string,
): void {
  ctx.fillStyle = ink;
  ctx.font = `700 ${Math.round(Math.min(width, height) * 0.08)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RIPPLE', width * 0.5, height * 0.5);
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  width: number,
  snapshot: Snapshot,
  now: number,
  t: ReturnType<typeof readTokens>,
): void {
  const top = HUD_PAD_TOP;
  const padX = HUD_PAD_X;

  drawMuteIcon(ctx, padX + 14, top + 14, snapshot.muted, t.mute);

  let scale = 1;
  if (snapshot.scorePop && !reducedMotion()) {
    const u = Math.min(
      1,
      (now - snapshot.scorePop.bornAt) / (snapshot.scorePop.lifeMs || SCORE_POP_MS),
    );
    scale = 1.08 - 0.08 * u;
  }

  ctx.save();
  ctx.translate(width * 0.5, top + 14);
  ctx.scale(scale, scale);
  ctx.fillStyle = t.ink;
  ctx.font = '800 28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(snapshot.displayScore), 0, 0);
  ctx.restore();

  if (snapshot.combo >= 2 && snapshot.phase === 'playing') {
    ctx.fillStyle = t.accent;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`×${snapshot.combo}`, width * 0.5, top + 32);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = t.mute;
  ctx.font = '500 12px system-ui, sans-serif';
  ctx.fillText('best', width - padX, top);
  ctx.fillStyle = snapshot.isNewBest && snapshot.phase === 'result' ? t.ink : t.mute;
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillText(String(snapshot.best), width - padX, top + 16);
}


function drawMuteIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  muted: boolean,
  stroke: string,
): void {
  ctx.strokeStyle = stroke;
  ctx.fillStyle = 'transparent';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 4);
  ctx.lineTo(cx - 3, cy - 4);
  ctx.lineTo(cx + 3, cy - 9);
  ctx.lineTo(cx + 3, cy + 9);
  ctx.lineTo(cx - 3, cy + 4);
  ctx.lineTo(cx - 8, cy + 4);
  ctx.closePath();
  ctx.stroke();

  if (!muted) {
    ctx.beginPath();
    ctx.arc(cx + 6, cy, 5, -0.7, 0.7);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 10);
    ctx.lineTo(cx + 12, cy - 10);
    ctx.stroke();
  }
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  target: Snapshot['targets'][number],
  wallNow: number,
  t: ReturnType<typeof readTokens>,
): void {
  const { x, y } = target.center;
  const animNow = wallNow;

  if (target.burst) {
    const u = Math.min(1, (animNow - target.burstAt) / 220);
    const r = target.radius * (1 + u * 0.55);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(t.danger, 1 - u);
    ctx.lineWidth = 3.5;
    ctx.stroke();
    if (u < 0.35) {
      ctx.beginPath();
      ctx.arc(x, y, target.radius * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = withAlpha(t.danger, (1 - u / 0.35) * 0.35);
      ctx.fill();
    }
    return;
  }

  if (target.resolved) {
    const color = target.resolvedGrade === 'perfect' ? t.perfect : t.good;
    const u = Math.min(1, (animNow - target.resolvedAt) / 180);
    if (target.resolvedGrade === 'perfect' && u < 0.4) {
      ctx.beginPath();
      ctx.arc(x, y, target.radius * (1.05 + u * 0.1), 0, Math.PI * 2);
      ctx.fillStyle = withAlpha(color, (1 - u / 0.4) * 0.45);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, target.radius * (1 + u * 0.1), 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(color, 1 - u);
    ctx.lineWidth = target.resolvedGrade === 'perfect' ? 3.5 : 2.5;
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.arc(x, y, target.radius, 0, Math.PI * 2);
  ctx.strokeStyle = t.ringGhost;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawResult(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  snapshot: Snapshot,
  now: number,
  t: ReturnType<typeof readTokens>,
): void {
  const enter = snapshot.resultBornAt
    ? Math.min(1, (now - snapshot.resultBornAt) / RESULT_ENTER_MS)
    : 1;
  const ease = reducedMotion() ? 1 : 1 - (1 - enter) * (1 - enter);

  ctx.fillStyle = withAlpha('#000000', 0.4 * ease);
  ctx.fillRect(0, 0, width, height);

  const L = layoutResult(width, height);
  const cyOff = reducedMotion() ? 0 : (1 - ease) * 12;

  ctx.save();
  ctx.globalAlpha = ease;
  ctx.translate(0, cyOff);

  ctx.fillStyle = t.surface;
  roundRect(ctx, L.cardX, L.cardY, L.cardW, L.cardH, 16);
  ctx.fill();

  const cx = L.cardX + L.cardW * 0.5;

  ctx.fillStyle = t.ink;
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(snapshot.score), cx, L.cardY + 52);

  ctx.fillStyle = snapshot.isNewBest ? t.ink : t.mute;
  ctx.font = '500 14px system-ui, sans-serif';
  ctx.fillText(`best  ${snapshot.best}`, cx, L.cardY + 92);

  if (snapshot.combo >= 2) {
    ctx.fillStyle = t.mute;
    ctx.font = '500 12px system-ui, sans-serif';
    ctx.fillText(`×${snapshot.combo}`, cx, L.cardY + 112);
  }

  // CTA de novo — filled accent, high contrast text
  ctx.fillStyle = t.accent;
  roundRect(ctx, L.ctaX, L.ctaY, L.ctaW, L.ctaH, 12);
  ctx.fill();
  ctx.fillStyle = t.bg;
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText('de novo', cx, L.ctaY + L.ctaH * 0.5);

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function withAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const n = Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');
  if (hex.length >= 7 && hex.startsWith('#')) {
    return `${hex.slice(0, 7)}${n}`;
  }
  return hex;
}
