# TASKS — vertical slice

Hackathon mode: few, fat tasks with parallel lanes. Each task ends with `npm run typecheck && npm test` passing and a short report (what changed, screenshots if visual, any `ESCALATION:`). Don't contradict DECISIONS.md.

```
T01 ─┬─ T02 ─┬─ T04 ─┬─ T05 ─┬─ T08 ── G1 ── T10 ── T11 ── T12 ── G3
     │       │       ├─ T06 ─┤
     │       │       └─ T07 ─┘
     │       └─ T03 (content) ─────────┘
     └─ T09 (server+AI, parallel after T02) ──────────┘
```
Lanes after T02: **A** renderer (T04–T07), **B** content (T03), **C** server/AI (T09).

---

### T01 Scaffold
**Objective** Runnable repo. **Deps** none.
**Files** `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `src/client/main.tsx`, `src/server/index.ts`, `.env.example`, `.gitignore` (incl. `data/`, `.env`).
**Details** Vite+React+TS strict; Hono + `@hono/node-server` via `tsx watch`; `concurrently` for `npm run dev`; Vite proxy `/api`→`:8787`; vitest; Playwright; `zod@^4`; `@fontsource/kalam`, `@fontsource/caveat`, `@fontsource/jost`; ESLint bans `Math.random`/`Date.now`/`crypto.randomUUID` in `src/renderer/**` and `src/compiler/**`.
**Accept** `npm run dev` shows a desk-coloured page and `/api/health` returns ok; lint rule fires on a test violation.
**Non-goals** any UI design.

### T02 Shared primitives + all schemas
**Deps** T01. **Files** `src/shared/{rng,hash,color,geometry,versions}.ts`, `src/shared/schemas/*.ts`, `src/shared/validate/*.ts`, tests.
**Details** sfc32 `rng(seed)`, cyrb53 `hashSeed(...parts)`; schemas exactly per DATA-MODELS.md, PAGE-SPEC.md, STYLE-SYSTEM.md §1, MASCOT-SYSTEM.md §2, ANIMATION.md §2; `validateAnalysis`, `validatePageSpec`, `validateRenderPlan` returning `{path,message}[]`; `normalizeForMatch`.
**Accept** Tests: valid fixtures pass; unknown keys, a non-verbatim title, a bad slot, and an overlapping text box are each rejected with a clear path; rng is identical across runs.
**Non-goals** compiler logic.

### T03 Content: style, whale, world, prompts, fixtures (creative, lead reviews)
**Deps** T02. **Files** `content/styles/techo-watercolor/{style.json,director.md,illustration.md}`, `content/mascots/whale/{mascot.json,poses/*.svg}`, `content/worlds/ocean.json`, `content/prompts/{interpreter,director}.md`, `fixtures/entries/*.txt` (8), `fixtures/pagespecs/rain-cat.json` (PAGE-SPEC §3), `fixtures/analyses/rain-cat.json`.
**Details** Transcribe the style values exactly. Author 5 whale poses to the MASCOT-SYSTEM §3 conventions (simple, round, charming; the file faces right). Write the prompts from AI-PIPELINE.md.
**Accept** All files validate via `npm run validate:content` (script added here); pose SVGs pass the convention checker.
**Non-goals** tuning values.

### T04 Stage, paper, replay, clock (renderer core)
**Deps** T02. **Files** `src/renderer/{index,stage,replay,timeline,page-renderer}.ts`, `src/renderer/paper.ts`, `src/renderer/header.ts`.
**Details** RENDERER §1–3, §9; ANIMATION §3 (clock, gating, speed, skip, `renderAt`); paper grain/fibres/grid/edge shade; header.
**Accept** `/dev/page/:fixture` renders a hand-written RenderPlan fixture's paper+header; `renderAt(t)` is repeatable (pixel-identical twice).

### T05 Marks + decorations + text layer
**Deps** T04. **Files** `src/renderer/marks/*`, `src/renderer/decor/*`, `src/renderer/text/*`.
**Details** RENDERER §4, §5, §7. `/dev/marks` gallery page showing every mark and decoration at 3 seeds.
**Accept** Gallery screenshot; text fits the box with no layout shift during reveal; highlights sit on the right words.

### T06 Painter
**Deps** T04. **Files** `src/renderer/painter/*`, tests.
**Details** RENDERER §8 exactly. `/dev/painter?img=` shows the painting live at the style's hero plan.
**Accept** Deterministic (same seed → same stroke count and checksum); the hero plan on a 1536×1024 fixture finishes ≤ 6 s; screenshot is recognisable and the background stays paper.

### T07 Mascot renderer
**Deps** T04, T05 (marks), T03 (poses). **Files** `src/renderer/mascot/*`.
**Details** RENDERER §6; convention checker shared with `validate:content`.
**Accept** `/dev/mascot` shows all poses at 48/112/200 units, both facings.

### T08 Compiler + fixture page end-to-end (no AI)
**Deps** T03–T07. **Files** `src/compiler/*`, tests, Playwright spec.
**Details** AI-PIPELINE §4 + ANIMATION §2. `/dev/page/rain-cat` = compile(fixture spec + fixture analysis + `fixtures/assets/hero.png`, `spot-1.png`) → live render.
**Accept** Golden RenderPlan snapshot; `validateRenderPlan` passes; Playwright screenshots at t=0,3,8,15,end.
→ **GATE G1 (lead):** visual + animation review against the ANIMATION §6 questions and the rubric. Tuning follow-ups are created here.

### T09 Server: repo, providers, pipeline, API, SSE
**Deps** T02 (parallel to lane A). **Files** `src/server/{app,index}.ts`, `src/server/repo/*`, `src/server/providers/{anthropic,openai-image,fixture}.ts`, `src/server/pipeline/*`.
**Details** DATA-MODELS §8–9; AI-PIPELINE §1–3, §5. The compiler is imported from `src/compiler` (use a stub until T08 lands).
**Accept** In fixture mode, `POST /api/pages/2026-09-25/generate` emits status→spec→asset→ready and writes a valid PageRecord; live mode works with keys (manual check); the raw entry is never in the image request (test).

### T10 Client: desk, entry writing, live page
**Deps** T08, T09. **Files** `src/client/**`.
**Details** A desk + notebook layout; today's page shows paper + date; the writing surface is a borderless textarea in Kalam on the page itself, with a quiet "done" pen-mark button; submit → ANIMATION §4 → SSE-driven renderer with `provideAsset`; click to finish; 1×/2× toggle; reduced motion.
**Accept** The reference entry becomes a fully drawn page in fixture mode, and in live mode with keys.
**Non-goals** navigation.

### T11 Persistence, revisit, regenerate
**Deps** T10. Reload shows the finished page instantly (`firstSeenAt`); a "draw again" control creates generation n+1 and draws it live; prev/next day arrows (simple, no page turn).
**Accept** Two days of entries survive a server restart.

### T12 Eval harness
**Deps** T09, T08. AI-PIPELINE §6.
**Accept** `npm run eval` produces a contact sheet for 8 entries.
→ **GATE G3 (lead):** the "that feels like my day" test on real entries.

## Post-slice backlog
Page-turn book navigation (Phase 8) · quote corpus + verification (ADR-015) · ambient life layer · a second style (pencil sketchbook) · onboarding (style/mascot/name) · stroke-glyph handwriting · Painter worker + stroke caching · sensitivity/crisis policy (OPEN-003).

## Review template (lead)
`T## — PASS | MINOR FIX | ARCHITECTURAL PROBLEM | PRODUCT PROBLEM` · checked: diff, tests, ADR compliance, screenshots, product fit · follow-ups: `T##a ...`
