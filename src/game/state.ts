/** FSM: boot → playing → result. Owns sims + score for the run. */

import { detectHits } from '../sim/hit';
import { createRippleSim, type Ripple } from '../sim/ripple';
import { createScore } from '../sim/score';
import {
  createTargetSim,
  markBurst,
  markResolved,
  type Target,
} from '../sim/targets';
import { GOOD_WINDOW_MS } from '../sim/timing';
import { spawnNextTarget } from './spawn';

export type Phase = 'boot' | 'playing' | 'result';

export type FloatingJudgment = {
  text: string;
  x: number;
  y: number;
  bornAt: number;
  lifeMs: number;
  kind: 'perfect' | 'good';
};

export type Snapshot = {
  phase: Phase;
  score: number;
  combo: number;
  best: number;
  muted: boolean;
  firstHintDone: boolean;
  bootStartedAt: number;
  playfield: { width: number; height: number };
  ripples: readonly Ripple[];
  targets: readonly Target[];
  judgment: FloatingJudgment | null;
  lastGrade: 'perfect' | 'good' | 'miss' | null;
};

type Action =
  | { type: 'POINTER_DOWN'; x: number; y: number; now: number }
  | { type: 'FRAME'; now: number; dt: number }
  | { type: 'RESIZE'; width: number; height: number }
  | { type: 'RETRY'; now: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'VISIBILITY'; hidden: boolean };

const BOOT_MAX_MS = 800;
const JUDGMENT_MS = 280;

export type GameState = {
  dispatch: (action: Action) => void;
  getSnapshot: () => Snapshot;
};

export function createState(now = performance.now()): GameState {
  const ripples = createRippleSim();
  const targets = createTargetSim();
  const scoreApi = createScore();

  let phase: Phase = 'boot';
  let bootStartedAt = now;
  let best = 0;
  let muted = false;
  let firstHintDone = false;
  let playfield = { width: 0, height: 0 };
  let judgment: FloatingJudgment | null = null;
  let lastGrade: Snapshot['lastGrade'] = null;
  let runStarted = false;

  function snapshot(): Snapshot {
    const s = scoreApi.get();
    return {
      phase,
      score: s.score,
      combo: s.combo,
      best,
      muted,
      firstHintDone,
      bootStartedAt,
      playfield: { ...playfield },
      ripples: ripples.active(),
      targets: targets.active(),
      judgment,
      lastGrade,
    };
  }

  function clearWorld(): void {
    ripples.clear();
    targets.clear();
    judgment = null;
    lastGrade = null;
  }

  function beginPlaying(at: number): void {
    phase = 'playing';
    scoreApi.reset();
    clearWorld();
    runStarted = true;
    if (playfield.width > 0 && playfield.height > 0) {
      spawnNextTarget(targets, at, playfield.width, playfield.height);
    }
  }

  function endRun(at: number, reason: 'miss'): void {
    void reason;
    phase = 'result';
    const s = scoreApi.get();
    if (s.score > best) best = s.score;
    lastGrade = 'miss';
    // Keep burst target visible; clear unspent waves soon via prune
    void at;
  }

  function pushJudgment(
    kind: 'perfect' | 'good',
    x: number,
    y: number,
    at: number,
  ): void {
    judgment = {
      text: kind === 'perfect' ? 'PERFECT' : 'GOOD',
      x,
      y,
      bornAt: at,
      lifeMs: JUDGMENT_MS,
      kind,
    };
  }

  function ensureFirstTarget(at: number): void {
    if (targets.live().length === 0 && playfield.width > 0) {
      spawnNextTarget(targets, at, playfield.width, playfield.height);
    }
  }

  return {
    dispatch(action: Action) {
      switch (action.type) {
        case 'RESIZE': {
          playfield = { width: action.width, height: action.height };
          if (phase === 'playing' && runStarted) ensureFirstTarget(performance.now());
          break;
        }

        case 'POINTER_DOWN': {
          if (phase === 'boot') {
            beginPlaying(action.now);
            // First gesture also counts as a real wave
            ripples.spawn({ x: action.x, y: action.y }, action.now);
            firstHintDone = true;
            break;
          }
          if (phase === 'playing') {
            ripples.spawn({ x: action.x, y: action.y }, action.now);
            firstHintDone = true;
            break;
          }
          if (phase === 'result') {
            // Tap-anywhere retry (M2 minimal; M4 polishes CTA)
            beginPlaying(action.now);
            break;
          }
          break;
        }

        case 'FRAME': {
          const { now } = action;

          if (phase === 'boot' && now - bootStartedAt >= BOOT_MAX_MS) {
            beginPlaying(now);
          }

          if (judgment && now - judgment.bornAt >= judgment.lifeMs) {
            judgment = null;
          }

          targets.step(now);

          if (phase !== 'playing') {
            const maxDim = Math.max(playfield.width, playfield.height);
            ripples.prune(now, maxDim || 1);
            ripples.commitRadii(now);
            break;
          }

          ensureFirstTarget(now);

          const maxDim = Math.max(playfield.width, playfield.height) || 1;

          // Hits before prune so crest still valid
          const live = targets.live();
          const hits = detectHits(ripples, live, now);

          for (const hit of hits) {
            hit.wave.spent = true;
            if (hit.grade === 'miss') {
              markBurst(hit.target, now);
              endRun(now, 'miss');
              break;
            }
            const { combo } = scoreApi.onHit(hit.grade);
            void combo;
            markResolved(hit.target, hit.grade, now);
            lastGrade = hit.grade;
            pushJudgment(hit.grade, hit.target.center.x, hit.target.center.y, now);
            spawnNextTarget(targets, now, playfield.width, playfield.height);
          }

          if (phase === 'playing') {
            // Expiry miss: idealContactAt + Good window without contact
            for (const t of targets.live()) {
              if (now > t.idealContactAt + GOOD_WINDOW_MS) {
                markBurst(t, now);
                if (import.meta.env.DEV) {
                  console.debug(
                    `[ripple] expiry miss ideal=${t.idealContactAt.toFixed(0)} now=${now.toFixed(0)}`,
                  );
                }
                endRun(now, 'miss');
                break;
              }
            }
          }

          ripples.prune(now, maxDim);
          ripples.commitRadii(now);
          break;
        }

        case 'RETRY': {
          beginPlaying(action.now);
          break;
        }

        case 'TOGGLE_MUTE': {
          muted = !muted;
          break;
        }

        case 'VISIBILITY': {
          void action.hidden;
          break;
        }

        default:
          break;
      }
    },

    getSnapshot: snapshot,
  };
}
