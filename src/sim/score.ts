/** Run score + combo. Combo increments on any hit; resets only end of run. */

export type ScoreState = {
  score: number;
  combo: number;
};

export type ScoreApi = {
  onHit: (grade: 'perfect' | 'good') => { points: number; combo: number; score: number };
  reset: () => void;
  get: () => ScoreState;
};

export function createScore(): ScoreApi {
  let score = 0;
  let combo = 0;

  return {
    onHit(grade) {
      const mult = 1 + Math.min(combo, 8) * 0.1;
      const base = grade === 'perfect' ? 100 : 60;
      const points = Math.round(base * mult);
      score += points;
      combo += 1;
      return { points, combo, score };
    },
    reset() {
      score = 0;
      combo = 0;
    },
    get() {
      return { score, combo };
    },
  };
}
