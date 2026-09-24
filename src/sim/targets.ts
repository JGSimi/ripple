/** Target rings with idealContactAt (absolute game clock ms). */

export type Target = {
  id: number;
  center: { x: number; y: number };
  /** Visual ring radius (CSS px) */
  radius: number;
  idealContactAt: number;
  /** Resolved by hit (perfect/good) — remove after brief flash */
  resolved: boolean;
  resolvedAt: number;
  resolvedGrade: 'perfect' | 'good' | null;
  /** Expiry miss burst */
  burst: boolean;
  burstAt: number;
};

export type SpawnOpts = {
  center: { x: number; y: number };
  radius: number;
  idealContactAt: number;
};

export type TargetSim = {
  spawn: (opts: SpawnOpts) => Target;
  step: (now: number) => void;
  active: () => readonly Target[];
  /** Live (not resolved, not bursting-done) targets for gameplay */
  live: () => readonly Target[];
  remove: (id: number) => void;
  clear: () => void;
};

const RESOLVE_FLASH_MS = 180;
const BURST_MS = 220;

export function createTargetSim(): TargetSim {
  const targets: Target[] = [];
  let nextId = 1;

  return {
    spawn(opts) {
      const t: Target = {
        id: nextId++,
        center: { x: opts.center.x, y: opts.center.y },
        radius: opts.radius,
        idealContactAt: opts.idealContactAt,
        resolved: false,
        resolvedAt: 0,
        resolvedGrade: null,
        burst: false,
        burstAt: 0,
      };
      targets.push(t);
      return t;
    },

    step(now) {
      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i]!;
        if (t.resolved && now - t.resolvedAt >= RESOLVE_FLASH_MS) {
          targets.splice(i, 1);
          continue;
        }
        if (t.burst && now - t.burstAt >= BURST_MS) {
          targets.splice(i, 1);
        }
      }
    },

    active() {
      return targets;
    },

    live() {
      return targets.filter((t) => !t.resolved && !t.burst);
    },

    remove(id) {
      const i = targets.findIndex((t) => t.id === id);
      if (i >= 0) targets.splice(i, 1);
    },

    clear() {
      targets.length = 0;
    },
  };
}

export function markResolved(
  target: Target,
  grade: 'perfect' | 'good',
  now: number,
): void {
  target.resolved = true;
  target.resolvedAt = now;
  target.resolvedGrade = grade;
}

export function markBurst(target: Target, now: number): void {
  target.burst = true;
  target.burstAt = now;
}
