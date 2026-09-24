# RIPPLE — Quebra técnica de produto (v1)

**Dono:** Tech Lead de Produto  
**Implementa:** Engenheiro de Software (editor único em `/workspace/ripple`)  
**Alinha:** CTO · HoP · Head of Design  
**Repo:** `JGSimi/ripple` (ainda NÃO criar/push)  
**Workdir:** `/workspace/ripple`  
**Design contrato:** `/workspace/design/jogo-web/direcao-visual-juice.md` (v0.2)  
**Atualizado:** 2026-09-23 23:18 -03 · **Baseline CTO:** aprovado · copy Design v0.2.1 + frames

---

## 1. Princípios de engenharia

- Stack congelada: Vite + TypeScript + Canvas 2D. Sem Phaser/Pixi/React/GSAP/Howler.
- Áudio: Web Audio API. Vibração: progressive enhancement.
- Clock de jogo: `performance.now()` + `dt` (não só rAF).
- Um editor por vez no workdir (Eng Soft). TL Product só review de desenho / merge mental via comments no doc ou mensagem — sem editar src em paralelo.
- Sem commit/push/deploy até CEO liberar Plataforma pós-jogável.

---

## 2. Contratos de módulos

Pastas sugeridas sob `src/`:

| Módulo | Responsabilidade | API pública (mínima) |
|---|---|---|
| `game/state.ts` | FSM: `boot → playing → result`. Score, combo, best, muted, firstHintDone. | `createState()`, `dispatch(action)`, `getSnapshot()` |
| `game/loop.ts` | rAF + dt; pausa em `document.hidden`; budget de frame. | `start(update, render)`, `stop()` |
| `input/pointer.ts` | Pointer unificado (mouse+touch); coords CSS→canvas (DPR). | `onPointerDown(cb)`, `dispose()` |
| `sim/ripple.ts` | Ondas: origin, bornAt, speed, radius(t), alive; **cap ≤8**. | `spawn(origin, now)`, `step(dt, now)`, `active()` |
| `sim/targets.ts` | Spawn/despawn de alvos; `idealContactAt`; hit radius. | `spawn(...)`, `step(now)`, `active()` |
| `sim/timing.ts` (ou `config.ts`) | Contato crista×alvo + julgamento; **todas** as janelas + `WAVE_SPEED` nomeadas aqui. | `judge(errorMs) → perfect\|good\|miss`, `PERFECT_MS`, `GOOD_MS`, `WAVE_SPEED` |
| `sim/score.ts` | Pontuação + combo. | `onHit(grade)`, `reset()` |
| `render/canvas.ts` | Resize, DPR, clear, layer order. | `resize()`, `withCtx(fn)` |
| `render/draw.ts` | Desenha bg, alvos, ondas, HUD, floating text, result. | `draw(snapshot, now)` |
| `audio/sfx.ts` | Bus Web Audio; unlock no 1º gesto; mute. | `unlock()`, `play(name, opts?)`, `setMuted(b)` |
| `ui/result.ts` | Overlay score-led + CTA **de novo** (canvas-only ok). | `isRetryHit(x,y)`, layout helpers |
| `persist/best.ts` | `localStorage` best + flag hint. | `loadBest()`, `saveBest(n)`, `loadFlags()` |
| `a11y/motion.ts` | `prefers-reduced-motion` + gates nice. | `reducedMotion()`, `allowParticles()` |

### 2.1 Timing (produto — Design locked)

| Grade | Janela \|errorMs\| | Flash token |
|---|---|---|
| Perfect | ≤ **32** ms | `--perfect` |
| Good | ≤ **72** ms | `--good` |
| Miss | > 72 ms | `--danger` → **fim de run** |

CTO sugeriu ±40/±90; **Design v0.2 prevalece** (±32/±72). Eng Soft não altera sem HoP+Design.

### 2.2 Física do hit (v1 — amarrado)

1. Alvo ativo: anel em `center` com `radius` visual e `idealContactAt` (ms absolutos do clock de jogo).
2. Pointer down em playing → `ripple.spawn(origin=pointer, now)` + SFX tick (≤40ms).
3. Cresta: `r(t) = speed * (now - bornAt)` (px). `WAVE_SPEED` default sugerido: **420 px/s** (afinar no playtest; expor constante).
4. **Contato** com alvo: primeira vez em que `|r - distance(origin, center)| ≤ CONTACT_EPS` (EPS ≈ metade do stroke, ~2–3px em CSS px).
5. `errorMs = abs(contactAt - idealContactAt)` → `timing.judge`.
6. Perfect/Good → score + combo; alvo resolve; próximo spawn.
7. Miss (contato fora da janela **ou** `now > idealContactAt + 72ms` sem contato) → fim de run. No expiry, alvo “estoura” visualmente mesmo sem pointer (draw mínimo no M2; juice no M3).
8. Uma onda pode acertar **um** alvo; ondas sem alvo somem ao `r > maxDim * 1.2`.

### 2.3 Score (v1)

- Perfect: **100** × (1 + min(combo, 8) * 0.1)
- Good: **60** × mesmo multiplicador
- Combo incrementa em hit; zera só no fim da run (não no Good).
- Best: max score em `localStorage` key `ripple:best`.

### 2.4 Estado / actions

```
boot | playing | result

Actions:
  POINTER_DOWN { x, y, now }
  FRAME { now, dt }
  RETRY
  TOGGLE_MUTE
  VISIBILITY { hidden }
```

Boot: splash RIPPLE ≤800ms **ou** skip no 1º pointer (vira playing + unlock audio).  
Primeiro gesto em playing = jogada real (sem tutorial).

### 2.5 Tokens de cor

Usar nomes do Design (`--bg`, `--accent`, …). Hex craft do md de Design no código; lock formal via CEO depois.

---

## 3. Milestones + ownership

| ID | Escopo | Dono código | Review TL Product | Exit criteria |
|---|---|---|---|---|
| **M1** Skeleton | Vite/TS, canvas full-bleed+DPR, loop+dt, pointer, state boot/playing, 1 círculo debug | Eng Soft | OK estrutura pastas + loop | `npm run dev` sobe; toque desenha algo; README draft |
| **M2** Core loop jogável | ripple + targets + timing + miss=end + score na run + spawn contínuo; log DEV `errorMs`; expiry visual mínimo | Eng Soft | OK física/timing vs §2 | Dá pra falhar e sentir a janela; 1 miss encerra |
| **M3** Juice must | Tabela must do Design (flashes, hit-stop 2f, floating, combo chip, SFX) | Eng Soft | Feel pass vs Design | Perfect/Good/Miss cores distintas; feedback &lt;100ms |
| **M4** Result/retry + best + mute | Overlay score-led + **de novo** &lt;1s, best persist, mute; copy Design §6 | Eng Soft | Copy + UX vs frames | Retry &lt;1s; sem “Quase!”; localStorage |
| **M5** Nice + prod DoD | Partículas/vibra com gates; `npm run build`; Lighthouse; cap; reduced-motion | Eng Soft | Checklist §4 | Bundle gzip JS &lt;~100KB; ping CEO |

Paralelo permitido: Design (frames) não bloqueia M1–M2. Hex craft já no Design md.

### Ordem de implementação (Eng Soft)

1. Scaffold Vite+TS+canvas+README  
2. `loop` + `state` + `pointer`  
3. `ripple` + draw onda  
4. `targets` + `timing` + miss  
5. `score` + HUD mínimo  
6. (M3+) audio/juice/result/persist

---

## 4. Critérios “jogável” (handoff CEO → Plataforma)

Antes de pedir push/repo/Vercel, **tudo** abaixo:

**Produto**
- [ ] Toque cria ripple; crista vs alvo julga Perfect/Good/Miss
- [ ] 1 miss → Result (score + best) → **de novo** &lt;1s (sem “Quase!”)
- [ ] Combo + score; best em localStorage
- [ ] Sem tutorial texto; boot→play &lt;3s; 1º gesto = jogada
- [ ] Copy: **PERFECT** / **GOOD** · miss só flash · CTA **de novo** · label `best` — nunca “Você perdeu” / “Quase!”

**Técnico**
- [ ] ~60fps caminho feliz em mobile médio (justificar se edge)
- [ ] Lighthouse Performance ≥ 90 **ou** justificativa escrita em `docs/perf.md`
- [ ] Bundle JS gzip &lt; ~100KB sem assets pesados
- [ ] Pointer unificado; DPR correto; safe-area
- [ ] `prefers-reduced-motion` digno (sem shake/partículas; cor+SFX ok)
- [ ] Cap ≤8 ripples / ≤24 partículas
- [ ] Clock com `performance.now`/dt
- [ ] `npm run build` → `dist/` estático; README com run/build/controles

**Processo**
- [ ] TL Product confirma M2+ feel mínimo  
- [ ] CTO ciente  
- [ ] CEO libera Plataforma para repo público + Vercel

---

## 5. Reportes

- **M1 fechado** → Tech Lead → CTO + CEO (priority), 5 linhas: o que sobe, como rodar, riscos.
- **M2 fechado** → idem + link/path + “pronto pra juice?” 
- Eng Soft pinga TL Product ao fechar cada M (não precisa pingar Leoncio).

---

## 6. Fora de escopo v1

- Contas, leaderboard online, multiplayer, PWA install prompt agressivo, engine externa, custom fonts, i18n além de pt-BR.

*— Tech Lead de Produto · cascata CTO GO DE BUILD*

---

## 7. Notas CTO (baseline — não bloqueiam M1–M2)

1. **Constantes nomeadas:** expor `WAVE_SPEED` e janelas Perfect/Good num único arquivo (`src/sim/timing.ts` ou `src/config.ts`). Playtest afina sem caça a magic number.
2. **Dev-only no M2:** logar `errorMs` no hit (só em DEV) para calibrar feel antes do M3.
3. **Miss por expiry:** no M2 o alvo deve “estourar” visualmente mesmo sem pointer (legibilidade). Draw mínimo ok; juice completo no M3.

---

## 8. Frames / copy lock (Design v0.2.1)

Fonte Eng: `/workspace/design/jogo-web/frames/spec-frames.md`  
Direção: `/workspace/design/jogo-web/direcao-visual-juice.md`  
Preview (só referência): `/workspace/design/jogo-web/frames/preview/` — **seguir o spec, não o HTML**.

| Lock | Valor |
|---|---|
| Judgment | `PERFECT` / `GOOD` (não Perfeito/Bom) |
| Miss | flash `--danger` sem textão |
| Result | score + best + CTA **de novo** — **sem** “Quase!” |
| HUD | mute TL / score TC / best TR; `spawnY > HUD_BOTTOM + 24` |
| Mute | stroke sempre `--mute`; muted = slash (nunca accent) |

Em conflito de copy: direção §6 + spec-frames vencem over drafts antigos (incl. tech-breakdown pré-v0.2.1).
