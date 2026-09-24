/** Draw playfield: bg, targets, ripples, HUD, judgment, result stub. */

import type { Snapshot } from '../game/state';
import type { CanvasSurface } from './canvas';
import { HUD_PAD_TOP, HUD_PAD_X } from './layout';
import { readTokens } from './tokens';

export function draw(surface: CanvasSurface, snapshot: Snapshot, now: number): void {
  const { ctx, width, height } = surface;
  const t = readTokens();

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
    const ageSec = Math.max(0, (now - wave.bornAt) / 1000);
    const r = wave.speed * ageSec;
    if (r <= 0.5) continue;
    const fade = Math.max(0, 1 - r / (maxDim * 1.2));
    ctx.beginPath();
    ctx.arc(wave.origin.x, wave.origin.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(t.accent, 0.15 + fade * 0.85);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Floating judgment — PERFECT / GOOD only (miss = flash on target, no text)
  if (snapshot.judgment) {
    const j = snapshot.judgment;
    const u = Math.min(1, (now - j.bornAt) / j.lifeMs);
    const rise = 12 * u;
    const alpha = 1 - u;
    ctx.fillStyle = withAlpha(j.kind === 'perfect' ? t.perfect : t.good, alpha);
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(j.text, j.x, j.y - 28 - rise);
  }

  if (snapshot.phase === 'playing' || snapshot.phase === 'result') {
    drawHud(ctx, width, snapshot, t);
  }

  if (snapshot.phase === 'result') {
    drawResultStub(ctx, width, height, snapshot.score, snapshot.best, t);
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
  t: ReturnType<typeof readTokens>,
): void {
  const top = HUD_PAD_TOP;
  const padX = HUD_PAD_X;

  // Mute TL — stroke always --mute; muted = slash (never accent)
  drawMuteIcon(ctx, padX + 14, top + 14, snapshot.muted, t.mute);

  // Score TC
  ctx.fillStyle = t.ink;
  ctx.font = '800 28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(String(snapshot.score), width * 0.5, top);

  if (snapshot.combo > 1 && snapshot.phase === 'playing') {
    ctx.fillStyle = t.accent;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(`×${snapshot.combo}`, width * 0.5, top + 32);
  }

  // Best TR — label `best` + number
  ctx.textAlign = 'right';
  ctx.fillStyle = t.mute;
  ctx.font = '500 12px system-ui, sans-serif';
  ctx.fillText('best', width - padX, top);
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

  // Simple speaker
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
    // slash — same --mute stroke, never accent
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 10);
    ctx.lineTo(cx + 12, cy - 10);
    ctx.stroke();
  }
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  target: Snapshot['targets'][number],
  now: number,
  t: ReturnType<typeof readTokens>,
): void {
  const { x, y } = target.center;

  if (target.burst) {
    const u = Math.min(1, (now - target.burstAt) / 220);
    const r = target.radius * (1 + u * 0.55);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(t.danger, 1 - u);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, target.radius * (0.4 + u * 0.3), 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(t.danger, (1 - u) * 0.6);
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }

  if (target.resolved) {
    const color = target.resolvedGrade === 'perfect' ? t.perfect : t.good;
    const u = Math.min(1, (now - target.resolvedAt) / 180);
    ctx.beginPath();
    ctx.arc(x, y, target.radius * (1 + u * 0.08), 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(color, 1 - u);
    ctx.lineWidth = 3;
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.arc(x, y, target.radius, 0, Math.PI * 2);
  ctx.strokeStyle = t.ringGhost;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawResultStub(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  score: number,
  best: number,
  t: ReturnType<typeof readTokens>,
): void {
  // Dim 40% — no guilt title
  ctx.fillStyle = withAlpha('#000000', 0.4);
  ctx.fillRect(0, 0, width, height);

  const cx = width * 0.5;
  const cy = height * 0.5;

  ctx.fillStyle = t.surface;
  roundRect(ctx, cx - 120, cy - 78, 240, 156, 16);
  ctx.fill();

  ctx.fillStyle = t.ink;
  ctx.font = '800 36px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(score), cx, cy - 28);

  ctx.fillStyle = t.mute;
  ctx.font = '500 14px system-ui, sans-serif';
  ctx.fillText(`best  ${best}`, cx, cy + 8);

  ctx.fillStyle = t.accent;
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText('de novo', cx, cy + 44);
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
