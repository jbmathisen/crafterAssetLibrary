# DECISIONS (ADRs)

Rules for this file:
- An **Accepted** decision is binding. Implementation agents must not contradict it. If a task can't be done within an accepted decision, **stop and escalate** (write an `ESCALATION:` note in the task report). Don't redesign on your own.
- Only the lead architect (high-tier model) changes a status or adds ADRs.
- Format: Context → Decision → Reason → Consequences → Status.

---

## ADR-001 — Vite + React + TypeScript client, Hono Node server, single package

**Decision.** One npm package. The client is Vite + React 18 + TS (strict). The server is Hono on Node 20+ (`@hono/node-server`), run with `tsx` in dev. Shared code lives in `src/shared`. No Next.js.
**Reason.** The product is one interactive client view plus a small API that must hold secret keys. Next.js adds SSR/routing concepts we don't need. React is only the shell; the renderer is framework-agnostic TS.
**Consequences.** `npm run dev` starts both (concurrently). Vite proxies `/api` to the server.
**Status.** Accepted.

## ADR-002 — No single generated page image; hybrid pipeline

**Decision.** The page is rendered deterministically from a RenderPlan. Image models are used only for illustrations of entry-specific subjects.
**Reason.** We need verbatim legible text, cross-day consistency, progressive "making" animation, reproducibility, and editability. One image gives none of these.
**Status.** Accepted.

## ADR-003 — Layered stage: Canvas 2D for paper/paint/ink, DOM for text, SVG only as authoring format

**Decision.** Fixed 520×740 page-unit space. The layers are paper canvas, paint canvas (multiply), ink canvas, DOM text, and an optional live canvas. SVG is not displayed directly. Mascot/prop SVG paths are sampled and drawn with the ink/wash marks. No WebGL in the slice.
**Reason.** DOM text is selectable, accessible and crisp for user content. Canvas 2D gives painterly procedural marks and cheap op replay. Drawing SVG through our marks keeps one "hand".
**Status.** Accepted.

## ADR-004 — Recorded-op replay driven by a single timeline clock

**Decision.** Every canvas element builds a `Replayable` (`count()`, `playRange(ctx,a,b)`) once. One clock drives all elements (canvas and DOM). `renderAt(t)` is supported. No GSAP / Framer Motion / CSS keyframe animation for page content.
**Reason.** Deterministic, seekable and testable (screenshots at exact t). It produces the "accumulating paint" feel. One clock means speed changes and skips are trivial.
**Consequences.** The UI shell may use CSS transitions for chrome; page content must not.
**Status.** Accepted.

## ADR-005 — Determinism: seeded RNG only, versioned records

**Decision.** `Math.random`, `Date.now`, `performance.now` (except in the clock) and `crypto.randomUUID` are banned in `src/compiler` and `src/renderer` (ESLint `no-restricted-properties`/`no-restricted-globals`). Use `rng(seed)` (sfc32) and `hashSeed(...parts)` (cyrb53 → uint32) from `src/shared/rng.ts`. PageRecord stores the RenderPlan and every version string.
**Status.** Accepted.

## ADR-006 — Sequential pipeline, no multi-agent system

**Decision.** Interpreter (LLM) → Director (LLM) → Assets (image model, parallel per brief) → Compiler (pure). Each LLM stage is one structured-output call with Zod validation, one repair retry that includes the validation errors, then a deterministic fallback.
**Reason.** The data flow is a straight line. Agents or tool loops would add latency, cost and nondeterminism with nothing gained. Interpreter and Director stay separate so analysis can be reused (quotes, memory, variety) and each can be tested alone.
**Status.** Accepted.

## ADR-007 — Style system as data files validated by Zod; prose for AI beside tokens

**Decision.** `content/styles/<id>/style.json` holds tokens for the renderer/compiler and `director.md` / `illustration.md` hold prose for the AI. The renderer only knows *mark types* and *decoration kinds*. Styles only parameterise them.
**Reason.** New styles can be added without code, following Katagami's "knowledge in files".
**Status.** Accepted.

## ADR-008 — Mascot = hand-authored vector pose library

**Decision.** Each mascot is `mascot.json` plus one SVG per pose that follows strict layer conventions (MASCOT-SYSTEM.md). The Director chooses `poseId`. No image generation for the mascot in the slice.
**Reason.** Consistency across days is guaranteed. Poses are cheap, animatable and deterministic. Image-generated characters drift.
**Consequences.** Pose count is limited (start with 5). Later, custom mascots go through an offline pose-sheet workflow (image model plus human curation, then traced or converted to pose SVG). The runtime stays vector.
**Status.** Accepted.

## ADR-009 — Local filesystem persistence behind a Repository interface

**Decision.** `Repository` interface (`src/server/repo/types.ts`) with an `FsRepository` implementation writing under `./data`. Assets are content-addressed by sha256.
**Status.** Accepted.

## ADR-010 — Page turn deferred; WebGL only if needed there

**Decision.** Phase 8 starts with a 2D Canvas/CSS 3D page turn. WebGL is allowed only for the page-curl, with an ADR amendment.
**Status.** Accepted.

## ADR-011 — Handwriting via OFL webfonts with wipe reveal (not stroke glyphs) for the slice

**Decision.** Body `Kalam` 300, title `Caveat` 700, print `Jost` 300, self-hosted via `@fontsource/*`. The reveal is a per-word left-to-right clip-path wipe plus an opacity ink-in.
**Reason.** It handles any text length and language quickly. Stroke-alphabet handwriting (like Hobonichi) looks better but is a large project. Revisit in Phase 10.
**Status.** Accepted.

## ADR-012 — Illustrations are repainted by the stroke Painter

**Decision.** Generated raster illustrations are never blitted. They are the *reference* for `Painter`, which produces seeded strokes replayed by the timeline. Background (paper-coloured regions reachable from the border) is left unpainted.
**Reason.** It unifies the look with the paper, gives true progressive painting, and hides generator artefacts.
**Consequences.** CPU cost goes up. Painter runs in chunks (≤ 8 ms per frame) and may move to a Worker. Stroke lists can be cached later (OPEN-004).
**Status.** Accepted.

## ADR-013 — AI never outputs coordinates, hex colours, or quote text

**Decision.** PageSpec only references ids from menus supplied in context (compositions, slots, poses, decoration kinds, colour roles, quote ids) plus short bounded free text (title, subject descriptions, caption). Titles and highlights must be verbatim substrings of the entry unless `source: "written"` (title only, ≤ 5 words).
**Reason.** This gives reliable validation, consistent visuals, no fabricated quotes, and the user's own voice.
**Status.** Accepted.

## ADR-014 — Model providers behind adapters; model ids from env

**Decision.** `TextModel` adapter (default Anthropic Claude via Messages API tool-use for structured JSON) and `ImageModel` adapter (default OpenAI image API). Model ids come from env (`DIARY_MODEL_INTERPRETER`, `DIARY_MODEL_DIRECTOR`, `DIARY_IMAGE_MODEL`) and are never hard-coded in logic. A `fixture` provider for each stage reads from `fixtures/` so the app runs with no keys.
**Status.** Accepted.

## ADR-015 — Quotes come only from a verified local corpus

**Decision.** `content/quotes/quotes.json`. Each entry has exact text, author, work, `sourceUrl` (primary or reputable), `kind: "exact"|"translation"` (+ translator), `license: "public-domain"|"short-quotation"`, and tags. The Director may only return a `quoteId`. Quotes are off by default until the corpus is verified by a high-tier review.
**Status.** Accepted (implementation Phase 9).

---

## Open questions

- **OPEN-001** Default provider/model choices and whether the user has keys (Anthropic, OpenAI). *Needs user input.*
- **OPEN-002** Mascot for the slice: whale "Mori" is assumed. *Confirm with user.*
- **OPEN-003** Crisis-content handling (resources, not illustrating). Product/ethics decision before any public testing.
- **OPEN-004** Cache Painter stroke lists server-side for exact cross-device reproducibility and faster reopen.
- **OPEN-005** Spread (two-page) layouts and hero illustrations crossing the gutter.
