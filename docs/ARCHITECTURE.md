# ARCHITECTURE

Status: **Accepted for vertical slice** (see DECISIONS.md for every individual decision).

## 1. The shape of the system

```
 ┌──────────── client (browser, Vite + React + TS) ─────────────┐
 │  Shell (React): desk, notebook, entry editor, page view       │
 │        │                                                      │
 │        ▼                                                      │
 │  Renderer (framework-agnostic TS)                             │
 │    Stage: paper canvas | paint canvas | ink canvas | DOM text │
 │    Timeline clock → element progress → replay recorded ops    │
 │    Marks: ink line, wash/bloom, brush, painter, decorations   │
 └───────────────▲───────────────────────────────┬───────────────┘
                 │ RenderPlan + asset URLs        │ entry text
                 │ (SSE status events)            ▼
 ┌──────────── server (Node, Hono, TS) ─────────────────────────┐
 │  Pipeline (sequential, no agents):                            │
 │   1 Interpreter (LLM, structured) → JournalAnalysis           │
 │   2 Director    (LLM, structured) → PageSpec                  │
 │   3 Assets      (image model)     → AssetRefs (content hash)  │
 │   4 Compiler    (pure TS)         → RenderPlan                │
 │  Repository (filesystem JSON + asset blobs)                   │
 └───────────────────────────────────────────────────────────────┘
 content/  (data, not code): styles/, mascots/, worlds/, prompts/, quotes/
```

## 2. The key abstraction boundary

The AI decides **what** and **how it should feel**. The code decides **where** and **how to draw it**.

```
journal text
  → JournalAnalysis   (semantic: moments, motifs, moods, verbatim phrases)      [AI]
  → PageSpec          (directorial: composition id, hero brief, mascot pose,    [AI]
                       decorations, title, highlights, atmosphere, pacing)
                       NO coordinates, NO colours in hex, NO code
  → Assets            (images for illustration briefs, content-addressed)      [image model]
  → RenderPlan        (resolved: boxes in page units, hex colours, seeds,       [compiler, pure]
                       painter plans, fonts, timeline with start/duration)
  → pixels            (canvas + DOM, progressive)                               [renderer]
```

We add a third contract, `RenderPlan`, between the user's proposed `PageSpec` and the renderer. This is the most important refinement to the original brief:

- `PageSpec` is what an LLM can reliably produce: choices from enumerated menus the style offers (composition ids, slot ids, pose ids, decoration kinds, colour *roles*) plus short free text (illustration subject, title).
- `RenderPlan` is what a renderer can draw with no judgement at all. The **compiler** that maps one to the other is deterministic, pure, runs in Node and in tests, and is where layout rules live.
- The renderer never reads `PageSpec`, the style prose, or the analysis. It only reads `RenderPlan`.

This lets lower-tier agents build the renderer against fixture RenderPlans without any AI, and lets us tune AI prompts without touching drawing code.

## 3. Why not one big generated image

Rejected (ADR-002). A single image can't hold the user's verbatim text legibly. It can't stay consistent across days (style and mascot drift). It can't be animated as a *making* process. It can't be edited or reproduced, and it's the "AI image" feeling we're trying to avoid. Image generation is used only for **illustrations of arbitrary subjects** (the café cat), which code can't draw generically. Those images are then *repainted* in-browser by the stroke Painter, so they share the page's paper and marks and can be painted progressively.

## 4. Rendering stack (ADR-003)

One page = a fixed logical coordinate space of **520 × 740 page units** (≈ A6 1:1.42). It is scaled to the viewport with a CSS transform, and canvases render at `devicePixelRatio × scale`.

Layers, bottom to top:

| # | Layer | Tech | Contents |
|---|---|---|---|
| 0 | paper | Canvas 2D (static after first draw) | paper colour, grain, fibres, grid, printed header cell |
| 1 | paint | Canvas 2D, `multiply` compositing | washes, blooms, painter strokes (illustrations), mascot fills |
| 2 | ink | Canvas 2D | ink lines, mascot outlines, decorations |
| 3 | text | DOM (absolutely positioned, handwriting webfonts) | date, title, journal text, highlights, captions, quote |
| 4 | live | Canvas 2D (optional, later) | ambient animation (rain shimmer, blinking) |

- Text is DOM so it is real, selectable, accessible, searchable and crisp. Handwriting uses OFL webfonts (self-hosted). The "writing" reveal is a per-word clip-path wipe driven by the timeline.
- SVG is an **authoring format** (mascot poses, props). It is not a display layer. Pose SVG paths are sampled and drawn through the same ink/wash marks as everything else, so the mascot looks painted in the same hand.
- WebGL is not used in the slice. It's allowed later only for the page-turn (ADR-010).

## 5. Progressive painting model (ADR-004)

Borrowed in concept from the Hobonichi experiment (re-implemented, not copied):

- Every canvas element is **built once** into a list of recorded draw ops (`Recording`). The Painter produces a list of strokes with the same interface: `count()` and `playRange(ctx, from, to)`.
- A **timeline** assigns each element `[start, duration]`. At clock time *t*, element progress `u = clamp((t-start)/duration)`, and the element must have played `round(ease(u) * count)` ops. Ops only ever append, so the page accumulates like real paint.
- DOM text elements use the same clock: word *i* is revealed when `u ≥ i/words`.
- `renderAt(t)` is pure given the plan: it replays from zero up to *t*. This allows seeking, screenshots at exact times, and headless visual tests.
- A page draws itself only the **first time** it is seen. After that it is shown finished (`renderAt(∞)`).
- `prefers-reduced-motion`: finished page with a 600 ms fade.

## 6. Determinism (ADR-005)

`page = f(RenderPlan, asset bytes, rendererVersion)`. The RenderPlan already contains all seeds. `Math.random` and `Date.now` are banned in `src/renderer` and `src/compiler` (lint rule). All randomness comes from `rng(seed)` with seeds derived by `hashSeed(pageSeed, elementId)`. The stored `PageRecord` keeps entry snapshot, analysis, PageSpec, RenderPlan, asset hashes and all versions. Regenerate = a new generation with a new page seed and a new AI run. Old generations are kept.

## 7. AI orchestration (ADR-006)

A **sequential pipeline** of two structured LLM calls and N parallel image calls. There are **no agents** and no tool loops. Every stage is: prompt file (markdown in `content/prompts`) + context assembly + JSON-schema structured output + Zod validation + semantic validation + one repair retry + deterministic fallback. Details are in AI-PIPELINE.md.

**Latency masking.** The page starts drawing (paper, date) as soon as the entry is submitted. Text writing starts when PageSpec is ready (~10 s). Illustration elements are *gated* on their asset: in live mode they start at `max(scheduledStart, assetReadyAt)`. Image generation (20–60 s) mostly happens while the user watches their words being written.

## 8. Style, world, mascot as data (ADR-007, ADR-008)

`content/styles/<id>/style.json` (validated by Zod) holds renderer-consumable tokens: palette roles, typography, paper, grid, composition templates with slot boxes, mark parameters, painter plans, decoration allow-list, animation presets, and the illustration prompt recipe. Prose for the AI (`philosophy`, `do/don't`, `director.md`) sits beside it. Adding a style means adding a folder, not code. If a style needs a genuinely new mark or decoration, that's a renderer feature request (escalate).

Mascots are **vector pose libraries** (`content/mascots/<id>/poses/*.svg` + `mascot.json`). The Director picks a pose id. The renderer draws it. Consistency is guaranteed by construction.

## 9. Persistence (ADR-009)

Local-first and single-user for the slice. The server writes JSON + blobs to `./data` through a `Repository` interface, so SQLite or cloud storage can replace it later without touching callers.

```
data/diaries/<diaryId>/diary.json
data/diaries/<diaryId>/entries/<YYYY-MM-DD>.json
data/diaries/<diaryId>/pages/<YYYY-MM-DD>/gen-<n>.json      (PageRecord)
data/assets/<sha256>.png  +  <sha256>.json                    (AssetMeta)
```

## 10. Repository layout

```
docs/                      source of truth (this folder)
content/
  styles/techo-watercolor/ style.json, director.md, illustration.md
  mascots/whale/           mascot.json, poses/*.svg
  worlds/                  <id>.json
  prompts/                 interpreter.md, director.md
  quotes/                  quotes.json (Phase 9)
fixtures/
  entries/                 *.txt
  analyses/ pagespecs/ renderplans/   *.json
  assets/                  *.png
src/
  shared/                  schemas (zod), rng, hash, color, geometry, versions
  compiler/                PageSpec → RenderPlan (pure)
  renderer/                stage, timeline, marks/, painter/, text/, mascot/, decor/
  server/                  hono app, pipeline/, providers/, repo/
  client/                  react shell
tests/                     vitest unit + playwright visual
```

## 11. What we took from the references

| From | Adopted | Not adopted |
|---|---|---|
| Katagami | style as structured data (philosophy, tokens, rules, do/don't); art-style **prompt recipes with slots** `{subject}{composition}{palette}{mood}`; knowledge in files, not code (their ADR-0001); an 8-dimension visual review rubric (medium/material, marks/edges, depiction grammar, tonal shading, colour roles, composition, signature details, exclusions); never naming living artists in prompts | Temper/state machines, MCP server, multi-agent curation, OData, DESIGN.md (UI-oriented format), consuming Katagami at runtime (optional later: import art-style recipes via its read-only MCP) |
| Hobonichi experiment | page as a **score** of timed elements; recorded-op replay for progressive drawing; seeded determinism everywhere; stroke **Painter** that repaints a reference image; pressure-profile ink lines; multiply-layered watercolour blooms; mascot as authored **pose drawings, not a rig**; ink on top of paint; a layout ledger to detect overlaps; real attributed quotes at the foot; draw-once-then-persist; speed control; reduced motion | everything-on-one-canvas including text (we need real DOM text for user-written content); hand-authored per-page scores (ours are compiled from PageSpec); stroke-alphabet handwriting (fonts for now; see ADR-011); WebGL page turn and music in the slice; copying its code (no license stated, so reference only) |
