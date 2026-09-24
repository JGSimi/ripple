# RIPPLE — Performance notes (M5)

**Atualizado:** 2026-09-23 · America/Sao_Paulo

## Lighthouse

Lighthouse **não foi executado** neste ambiente (sem Chrome/DevTools headless confiável no box de build Eng Soft). Critério DoD do tech-breakdown: *Performance ≥ 90 **ou** justificativa escrita aqui*.

## Expectativa ≥ 90 (justificativa)

| Fator | Por quê ajuda |
|---|---|
| Bundle JS gzip **6.82 KB** (`dist/assets/index-*.js`, build 2026-09-23) | Muito abaixo do teto ~100KB; TBT/FCP favoráveis |
| Vite estático, zero runtime framework | Sem React/Vue hydration; HTML mínimo + 1 entry |
| Canvas 2D only | Sem WebGL, sem texturas, sem post-process |
| Sem deps de runtime (sem GSAP/Howler/Phaser) | Parse/compile mínimos |
| Caps ≤8 ripples / ≤24 particles | Bound no custo por frame |
| Nice gated por `prefers-reduced-motion` + frame budget (~45fps) | Evita spawn de juice sob jank |
| Sem blur/shadow por frame no canvas | Evita caminho CPU caro no mobile |
| Áudio procedural Web Audio | Sem decode de assets de som |
| `localStorage` só best/mute/flags | Sem rede no hot path |

## Como medir depois (Plataforma / local)

```bash
npm run build && npm run preview
# Chrome DevTools → Lighthouse → Mobile Performance
```

Se cair &lt;90: checar DPR×canvas size, partículas com budget, e third-party no host Vercel.

## Cap / a11y

- `src/a11y/motion.ts`: `allowParticles()` / `allowNice()` = `!reducedMotion && dt &lt; 22ms`
- `src/render/particles.ts`: pool com `PARTICLE_CAP = 24`
- Ripples: cap no sim (`≤8`)

*— Eng Soft · M5 Nice + prod DoD*
