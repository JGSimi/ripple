/** FSM: boot → playing → result. Sims + score + juice + persist. */

import { reducedMotion } from '../a11y/motion';
import * as sfx from '../audio/sfx';
import {
  loadBest,
  loadFlags,
  loadMuted,
  saveBest,
  saveFlags,
  saveMuted,
  type Flags,
} from '../persist/best';
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
import { HIT_STOP_MS, JUDGMENT_MS, SCORE_POP_MS } from './juice';
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

export type ScorePop = {
  from: number;
  to: number;
  bornAt: number;
  lifeMs: number;
  points: number;
};

export type Snapshot = {
  phase: Phase;
  score: number;
  displayScore: number;
  scorePop: ScorePop | null;
  combo: number;
  best: number;
  isNewBest: boolean;
  muted: boolean;
  firstHintDone: boolean;
  bootStartedAt: number;
  resultBornAt: number;
  playfield: { width: number; height: number };
  ripples: readonly Ripple[];
  targets: readonly Target[];
  judgment: FloatingJudgment | null;
  lastGrade: 'perfect' | 'good' | 'miss' | null;
  clock: number;
  hitStopActive: boolean;
};

type Action =
  | { type: 'POINTER_DOWN'; x: number; y: number; now: number }
  | { type: 'FRAME'; now: number; dt: number }
  | { type: 'RESIZE'; width: number; height: number }
  | { type: 'RETRY'; now: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'VISIBILITY'; hidden: boolean };

const BOOT_MAX_MS = 800;

export type GameState = {
  dispatch: (action: Action) => void;
  getSnapshot: () => Snapshot;
};

function dingPitch(comboAfterHit: number): number {
  return 1 + Math.min(Math.max(comboAfterHit, 1), 8) * 0.05;
}

export function createState(now = performance.now()): GameState {
  const ripples = createRippleSim();
  const targets = createTargetSim();
  const scoreApi = createScore();

  let flags: Flags = loadFlags();
  let phase: Phase = 'boot';
  let bootStartedAt = now;
  let best = loadBest();
  let isNewBest = false;
  let muted = loadMuted();
  let firstHintDone = flags.ghostDone;
  let playfield = { width: 0, height: 0 };
  let judgment: FloatingJudgment | null = null;
  let lastGrade: Snapshot['lastGrade'] = null;
  let runStarted = false;
  let scorePop: ScorePop | null = null;
  let hitStopUntil = 0;
  let frozenClock = now;
  let resultBornAt = 0;

  sfx.setMuted(muted);

  function displayScoreAt(wallNow: number): number {
    const s = scoreApi.get().score;
    if (!scorePop) return s;
    const u = Math.min(1, Math.max(0, (wallNow - scorePop.bornAt) / scorePop.lifeMs));
    const e = 1 - (1 - u) * (1 - u);
    return Math.round(scorePop.from + (scorePop.to - scorePop.from) * e);
  }

  function snapshot(wallNow = performance.now()): Snapshot {
    const s = scoreApi.get();
    const hitStopActive = wallNow < hitStopUntil;
    return {
      phase,
      score: s.score,
      displayScore: displayScoreAt(wallNow),
      scorePop,
      combo: s.combo,
      best,
      isNewBest,
      muted,
      firstHintDone,
      bootStartedAt,
      resultBornAt,
      playfield: { ...playfield },
      ripples: ripples.active(),
      targets: targets.active(),
      judgment,
      lastGrade,
      clock: hitStopActive ? frozenClock : wallNow,
      hitStopActive,
    };
  }

  function clearWorld(): void {
    ripples.clear();
    targets.clear();
    judgment = null;
    lastGrade = null;
    scorePop = null;
    hitStopUntil = 0;
    isNewBest = false;
  }

  function spawnOpts() {
    return { lifetimeHits: flags.lifetimeHits };
  }

  function beginPlaying(at: number): void {
    phase = 'playing';
    scoreApi.reset();
    clearWorld();
    runStarted = true;
    frozenClock = at;
    resultBornAt = 0;
    if (playfield.width > 0 && playfield.height > 0) {
      spawnNextTarget(targets, at, playfield.width, playfield.height, spawnOpts());
    }
  }

  function endRun(at: number): void {
    phase = 'result';
    resultBornAt = at;
    const s = scoreApi.get();
    if (s.score > best) {
      best = s.score;
      isNewBest = true;
      saveBest(best);
    } else {
      isNewBest = false;
    }
    lastGrade = 'miss';
    hitStopUntil = 0;
    sfx.play('sting');
  }

  function noteHitSuccess(): void {
    flags = {
      ghostDone: true,
      lifetimeHits: flags.lifetimeHits + 1,
    };
    firstHintDone = true;
    saveFlags(flags);
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

  function startScorePop(from: number, to: number, points: number, at: number): void {
    scorePop = { from, to, bornAt: at, lifeMs: SCORE_POP_MS, points };
  }

  function ensureFirstTarget(at: number): void {
    if (targets.live().length === 0 && playfield.width > 0) {
      spawnNextTarget(targets, at, playfield.width, playfield.height, spawnOpts());
    }
  }

  function spawnWave(x: number, y: number, at: number): void {
    ripples.spawn({ x, y }, at);
    sfx.play('tick');
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
          if (phase === 'playing' && action.now < hitStopUntil) break;

          if (phase === 'boot') {
            sfx.unlock();
            beginPlaying(action.now);
            spawnWave(action.x, action.y, action.now);
            firstHintDone = true;
            break;
          }
          if (phase === 'playing') {
            sfx.unlock();
            spawnWave(action.x, action.y, action.now);
            firstHintDone = true;
            break;
          }
          if (phase === 'result') {
            // Restart <1s: accept immediately (tap-anywhere)
            sfx.unlock();
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
          if (scorePop && now - scorePop.bornAt >= scorePop.lifeMs) {
            scorePop = null;
          }

          if (phase === 'playing' && now < hitStopUntil) {
            targets.step(now);
            break;
          }

          const clock = now;
          frozenClock = clock;
          targets.step(now);

          if (phase !== 'playing') {
            const maxDim = Math.max(playfield.width, playfield.height);
            ripples.prune(clock, maxDim || 1);
            ripples.commitRadii(clock);
            break;
          }

          ensureFirstTarget(clock);

          const maxDim = Math.max(playfield.width, playfield.height) || 1;
          const live = targets.live();
          const hits = detectHits(ripples, live, clock);

          for (const hit of hits) {
            hit.wave.spent = true;
            if (hit.grade === 'miss') {
              markBurst(hit.target, clock);
              sfx.play('thud');
              endRun(clock);
              break;
            }

            const before = scoreApi.get().score;
            const { points, combo, score } = scoreApi.onHit(hit.grade);
            markResolved(hit.target, hit.grade, clock);
            lastGrade = hit.grade;
            pushJudgment(hit.grade, hit.target.center.x, hit.target.center.y, now);
            startScorePop(before, score, points, now);
            noteHitSuccess();

            if (hit.grade === 'perfect' && !reducedMotion()) {
              hitStopUntil = now + HIT_STOP_MS;
              frozenClock = clock;
              sfx.play('ding', { pitch: dingPitch(combo) * 1.08 });
            } else {
              sfx.play('ding', { pitch: dingPitch(combo) });
            }

            spawnNextTarget(
              targets,
              clock,
              playfield.width,
              playfield.height,
              spawnOpts(),
            );
          }

          if (phase === 'playing') {
            for (const t of targets.live()) {
              if (clock > t.idealContactAt + GOOD_WINDOW_MS) {
                markBurst(t, clock);
                if (import.meta.env.DEV) {
                  console.debug(
                    `[ripple] expiry miss ideal=${t.idealContactAt.toFixed(0)} now=${clock.toFixed(0)}`,
                  );
                }
                sfx.play('thud');
                endRun(clock);
                break;
              }
            }
          }

          ripples.prune(clock, maxDim);
          ripples.commitRadii(clock);
          break;
        }

        case 'RETRY': {
          beginPlaying(action.now);
          break;
        }

        case 'TOGGLE_MUTE': {
          muted = !muted;
          sfx.setMuted(muted);
          saveMuted(muted);
          break;
        }

        case 'VISIBILITY': {
          sfx.setSuspended(action.hidden);
          break;
        }

        default:
          break;
      }
    },

    getSnapshot: () => snapshot(),
  };
}
