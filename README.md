# RIPPLE

Jogo web minimalista (toque → onda). Stack: **Vite + TypeScript + Canvas 2D + Web Audio**.

## Milestone atual: M5 — Nice + prod DoD

Core jogável (M2) + juice must (M3) + result/best/mute (M4) + Nice gated (M5).

### O que tem
- Onda no frame do toque; timing Perfect ≤32ms / Good ≤72ms / Miss
- Flashes distintos `--perfect` / `--good` / `--danger`
- Hit-stop ~32ms no Perfect (off se `prefers-reduced-motion`)
- Floating `PERFECT` / `GOOD`; score count-up + pop; combo `×N`
- SFX procedural (tick / ding / thud / sting); unlock no 1º gesto; mute persiste
- Result: score + `best` + CTA **de novo** (tap-anywhere &lt;1s); sem “Quase!”
- `best` e mute em `localStorage`; primeiros 3 hits da vida com alvo um pouco maior

### Nice (gates — M5)
- Perfect: 6–10 sparks na crista, fade ~300ms, cap ≤24 — `!prefers-reduced-motion` + frame budget (`allowParticles()`)
- Novo best: ~12 confetti + glow no `best`
- Combo ≥3: pulse leve no HUD
- Mobile: `vibePerfect` / `vibeMiss` quando `navigator.vibrate` existe
- Result CTA breathing 1.02 após idle &gt;8s (reduced-motion off)
- Caps ≤8 ripples / ≤24 particles; sem GSAP/Howler
- `docs/perf.md`: Lighthouse não rodado aqui; expectativa ≥90 justificada

## Como jogar

1. Splash **RIPPLE** ou toque para começar (1º gesto = onda + áudio).
2. Toque para criar ondas; acerte o alvo no timing.
3. Miss → result → **de novo** (ou toque em qualquer lugar).
4. Mute: ícone top-left (slash quando mutado).

## Preview

```bash
cd /workspace/ripple
npm install
npm run dev
```

## Build

```bash
npm run build
```

Saída em `dist/`. Ver tamanho gzip do JS no report de build / `docs/perf.md`.

## Copy lock

`PERFECT` / `GOOD` · miss só flash · CTA **de novo** · label `best`.

## Restrições

Sem Phaser/React/GSAP/Howler. Sem git push/deploy neste fluxo Eng Soft.
