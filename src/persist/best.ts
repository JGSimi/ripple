/** localStorage best + onboarding flags. */

const BEST_KEY = 'ripple:best';
const FLAGS_KEY = 'ripple:flags';
const MUTE_KEY = 'ripple:muted';

export type Flags = {
  /** First Perfect/Good ever — ghost onboarding done */
  ghostDone: boolean;
  /** Hits lifetime (for larger early targets) */
  lifetimeHits: number;
};

const DEFAULT_FLAGS: Flags = { ghostDone: false, lifetimeHits: 0 };

export function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const n = raw == null ? 0 : Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function saveBest(n: number): void {
  try {
    const v = Math.max(0, Math.floor(n));
    localStorage.setItem(BEST_KEY, String(v));
  } catch {
    // private mode / quota
  }
}

export function loadFlags(): Flags {
  try {
    const raw = localStorage.getItem(FLAGS_KEY);
    if (!raw) return { ...DEFAULT_FLAGS };
    const parsed = JSON.parse(raw) as Partial<Flags>;
    return {
      ghostDone: Boolean(parsed.ghostDone),
      lifetimeHits:
        typeof parsed.lifetimeHits === 'number' && Number.isFinite(parsed.lifetimeHits)
          ? Math.max(0, Math.floor(parsed.lifetimeHits))
          : 0,
    };
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

export function saveFlags(flags: Flags): void {
  try {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
  } catch {
    // ignore
  }
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // ignore
  }
}
