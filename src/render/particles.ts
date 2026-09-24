/** Lightweight particle pool. Cap ≤24. No blur/shadow. */

import { PARTICLE_CAP, PARTICLE_LIFE_MS } from '../game/juice';

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bornAt: number;
  lifeMs: number;
  color: string;
  size: number;
  kind: 'spark' | 'confetti';
};

export type ParticleSim = {
  burstPerfect: (x: number, y: number, now: number, color: string) => void;
  burstConfetti: (x: number, y: number, now: number, colors: string[]) => void;
  step: (now: number, dt: number) => void;
  active: () => readonly Particle[];
  clear: () => void;
};

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

export function createParticleSim(): ParticleSim {
  const list: Particle[] = [];

  function push(p: Particle): void {
    while (list.length >= PARTICLE_CAP) list.shift();
    list.push(p);
  }

  return {
    burstPerfect(x, y, now, color) {
      const n = 8;
      for (let i = 0; i < n; i++) {
        const ang = (Math.PI * 2 * i) / n + rand(-0.2, 0.2);
        const spd = rand(40, 120);
        push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          bornAt: now,
          lifeMs: PARTICLE_LIFE_MS,
          color,
          size: rand(1.5, 3),
          kind: 'spark',
        });
      }
    },

    burstConfetti(x, y, now, colors) {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const ang = rand(-Math.PI, 0); // upward-ish
        const spd = rand(60, 180);
        push({
          x: x + rand(-20, 20),
          y: y + rand(-8, 8),
          vx: Math.cos(ang) * spd * 0.6,
          vy: Math.sin(ang) * spd,
          bornAt: now,
          lifeMs: PARTICLE_LIFE_MS + 120,
          color: colors[i % colors.length]!,
          size: rand(2, 4),
          kind: 'confetti',
        });
      }
    },

    step(now, dt) {
      const sec = dt / 1000;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i]!;
        if (now - p.bornAt >= p.lifeMs) {
          list.splice(i, 1);
          continue;
        }
        p.x += p.vx * sec;
        p.y += p.vy * sec;
        if (p.kind === 'confetti') p.vy += 220 * sec; // gravity
        else {
          p.vx *= 0.98;
          p.vy *= 0.98;
        }
      }
    },

    active() {
      return list;
    },

    clear() {
      list.length = 0;
    },
  };
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: readonly Particle[],
  now: number,
): void {
  for (const p of particles) {
    const u = Math.min(1, (now - p.bornAt) / p.lifeMs);
    const a = 1 - u;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    if (p.kind === 'confetti') {
      ctx.fillRect(p.x - p.size, p.y - p.size * 0.5, p.size * 2, p.size);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
