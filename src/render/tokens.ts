/** Read design tokens from CSS variables (fallback to craft hex). */

export type Tokens = {
  bg: string;
  surface: string;
  ink: string;
  mute: string;
  accent: string;
  perfect: string;
  good: string;
  danger: string;
  ringGhost: string;
};

const FALLBACK: Tokens = {
  bg: '#0B1220',
  surface: '#121A2B',
  ink: '#E8EEF8',
  mute: '#8B97AD',
  accent: '#3DE0FF',
  perfect: '#F5FF8A',
  good: '#7CFFB2',
  danger: '#FF7A6E',
  ringGhost: '#3DE0FF33',
};

function readVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function readTokens(): Tokens {
  return {
    bg: readVar('--bg', FALLBACK.bg),
    surface: readVar('--surface', FALLBACK.surface),
    ink: readVar('--ink', FALLBACK.ink),
    mute: readVar('--mute', FALLBACK.mute),
    accent: readVar('--accent', FALLBACK.accent),
    perfect: readVar('--perfect', FALLBACK.perfect),
    good: readVar('--good', FALLBACK.good),
    danger: readVar('--danger', FALLBACK.danger),
    ringGhost: readVar('--ring-ghost', FALLBACK.ringGhost),
  };
}
