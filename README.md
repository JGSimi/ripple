# RIPPLE

Jogo web minimalista (toque → onda). Stack: **Vite + TypeScript + Canvas 2D**.

## Milestone atual: M2 — Core loop jogável

Loop jogável com física de hit (`docs/tech-breakdown.md` §2.2):

- Toque em **playing** spawna onda real (`sim/ripple`, cap ≤8)
- Alvos contínuos (`sim/targets`) com `idealContactAt`; spawn abaixo da faixa HUD (`spawnY > HUD_BOTTOM + 24`)
- Contato crista×alvo → Perfect ≤32ms / Good ≤72ms / Miss
- 1 miss (fora da janela **ou** expiry) encerra a run → result (score + `best` + **de novo**)
- Score + combo; HUD mute / score / best
- Log DEV de `errorMs` no hit; estouro `--danger` no expiry (sem texto de miss)
- Sem tutorial texto

**Copy lock (Design):** judgment `PERFECT` / `GOOD` · miss só flash · CTA **de novo** · label `best` — nunca “Quase!” / Perfeito/Bom.

**Ainda não (M3+):** juice completo, best persistente em `localStorage`, overlay polido.

## Como jogar (core)

1. Splash **RIPPLE** (≤800ms ou toque para pular).
2. Um alvo (anel ghost) aparece. Toque no playfield para criar uma onda.
3. Ajuste **quando** e **a que distância** toca: a crista deve cruzar o alvo perto do timing ideal.
4. **PERFECT** / **GOOD** → pontos + próximo alvo. Errou ou deixou expirar → result.
5. Toque em **de novo** (ou em qualquer lugar no result) para reiniciar.
6. Ícone top-left = mute (slash quando mutado).

## Preview

```bash
cd /workspace/ripple
npm install
npm run dev
```

URL do Vite (geralmente `http://localhost:5173`).

## Build

```bash
npm run build
```

Saída em `dist/`. Preview: `npm run preview`.

## Estrutura

Ver `docs/tech-breakdown.md`. Constantes em `src/sim/timing.ts`. Frames/copy: `/workspace/design/jogo-web/frames/spec-frames.md`.

## Restrições

Sem Phaser/Pixi/React/GSAP/Howler. Sem git push/deploy neste milestone.
