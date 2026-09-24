/** Web Audio bus — procedural SFX. Unlock on first gesture; mute silences gain. */

export type SfxName = 'tick' | 'ding' | 'thud' | 'sting';

type PlayOpts = { pitch?: number };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlocked = false;
let muted = false;

function ensureGraph(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.35;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlock(): void {
  const c = ensureGraph();
  if (!c) return;
  if (c.state === 'suspended') {
    void c.resume();
  }
  unlocked = true;
}

export function isUnlocked(): boolean {
  return unlocked;
}

export function setMuted(next: boolean): void {
  muted = next;
  if (master && ctx) {
    const g = master.gain;
    const t = ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(muted ? 0 : 0.35, t + 0.03);
  }
}

export function getMuted(): boolean {
  return muted;
}

/** Silence bus while tab hidden; restore on visible if not user-muted. */
export function setSuspended(hidden: boolean): void {
  if (!ctx) return;
  if (hidden) {
    if (ctx.state === 'running') void ctx.suspend();
  } else if (!muted && unlocked) {
    void ctx.resume();
  }
}

export function play(name: SfxName, opts: PlayOpts = {}): void {
  if (!unlocked || muted) return;
  const c = ensureGraph();
  if (!c || !master) return;
  if (c.state === 'suspended') void c.resume();

  const pitch = opts.pitch ?? 1;
  const t0 = c.currentTime;

  switch (name) {
    case 'tick':
      blip(c, master, t0, 880 * pitch, 0.03, 0.12, 'square');
      break;
    case 'ding':
      blip(c, master, t0, 1200 * pitch, 0.045, 0.18, 'sine');
      blip(c, master, t0 + 0.01, 1800 * pitch, 0.03, 0.1, 'sine');
      break;
    case 'thud':
      blip(c, master, t0, 120 * pitch, 0.08, 0.22, 'triangle');
      blip(c, master, t0, 60 * pitch, 0.1, 0.15, 'sine');
      break;
    case 'sting':
      blip(c, master, t0, 220 * pitch, 0.06, 0.12, 'sawtooth');
      blip(c, master, t0 + 0.05, 165 * pitch, 0.08, 0.18, 'triangle');
      break;
    default:
      break;
  }
}

function blip(
  c: AudioContext,
  dest: AudioNode,
  t0: number,
  freq: number,
  attack: number,
  dur: number,
  type: OscillatorType,
): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(40, freq), t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.9, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}
