# RENDERER

`src/renderer/` is framework-agnostic TypeScript. It reads a `RenderPlan` (PAGE-SPEC.md §2) and asset images and draws the page. It makes **no layout or aesthetic decisions**: everything comes from the plan (ADR-003/004/005). The only randomness is `rng(element.seed)`.

## 1. Public API (`src/renderer/index.ts`)

```ts
interface PageRendererOptions {
  container: HTMLElement;          // renderer creates its stage inside
  plan: RenderPlan;
  assets: Map<Id, HTMLImageElement | ImageBitmap>;   // briefId → decoded image (may arrive later)
  mascots: Map<Id, LoadedMascot>;  // parsed pose SVGs (see §6)
  mode: "live" | "finished";       // finished = draw everything instantly
  speed?: 1 | 2;
  reducedMotion?: boolean;
  onComplete?: () => void;
}

interface PageRenderer {
  ready: Promise<void>;            // fonts loaded, elements built (except gated)
  play(): void; pause(): void;
  setSpeed(s: 1 | 2): void;
  skipToEnd(): void;
  renderAt(t: number): Promise<void>;  // deterministic seek (clears & replays); for tests
  provideAsset(briefId: Id, img: HTMLImageElement | ImageBitmap): void;  // opens a gate
  resize(): void;                  // refit to container
  destroy(): void;
}
function createPageRenderer(o: PageRendererOptions): PageRenderer;
```

A dev/test hook is exposed at `window.__diaryPage = { renderAt, state }`. It's used by Playwright only when `import.meta.env.DEV` or `?test=1`.

## 2. Stage (`stage.ts`)

- The container gets a `div.page` of 520×740 CSS px, scaled by `transform: scale(k)` to fit (k = min(availW/520, availH/740)).
- Canvases `paper`, `paint`, `ink` and `live` sit absolutely on top of each other, with backing size `520·k·dpr × 740·k·dpr`. The context transform is set so drawing uses page units. `paint` draws with `globalCompositeOperation = "multiply"` for washes and painter strokes.
- `div.text` holds the DOM text elements, positioned in page units (the parent scale handles zoom).
- On resize, rebuild the backing stores and replay to the current `t` (it's cheap).
- The page has a soft desk shadow and a very slight paper edge (CSS on `div.page`, not canvas).

## 3. Replayable & build (`replay.ts`)

```ts
interface Replayable { count(): number; playRange(ctx: CanvasRenderingContext2D, from: number, to: number): void }

class Recording implements Replayable { ops: ((c: CanvasRenderingContext2D) => void)[] }
function record(build: (emit: Emit) => void): Recording;
type Emit = (op: (c: CanvasRenderingContext2D) => void) => void;
```

Every canvas element kind has a builder: `build<Kind>(el, deps) → { paint?: Replayable; ink?: Replayable }`. Builders compute all geometry and randomness up front. Ops are closures over precomputed numbers, and **ops never call rng**. Granularity matters because it is what the user watches: one op ≈ one dab / one short ink segment (≈ 8 samples) / one decoration part / one painter stroke.

The DOM text elements implement `DomRevealable { units(): number; reveal(n: number): void }` (see §4).

## 4. Text layer (`text/`)

- **TextEl.** A `div` with `font-family: Kalam; font-weight: 300; color`, a box from the plan, and `line-height = size × lineHeight`. Words are wrapped in `<span class="w">` (whitespace preserved; `\n` becomes `<br>`). **Fit:** start at `size.max` and step −0.5 until `scrollHeight ≤ box.h` or `size.min` is reached. Below the min, clip and add a 24-unit bottom fade mask. This runs once after `document.fonts.ready`.
- Reveal: word *i* is visible when `n > i`. The current word gets an animated `clip-path: inset(0 X% 0 0)` wipe and a colour ink-in (from 60% to 100% opacity). Unrevealed words are `visibility: hidden` so layout never shifts.
- **TitleEl.** Two stacked spans: the shadow copy (colour `shadowColor`, translated by `shadowOffset`) and the main copy. It is rotated by `box.rotate`. The reveal is a per-letter wipe.
- **HeaderEl.** Canvas ink draws the date cell (two short ruled lines and a small box) with `inkLine`. DOM `Jost` draws the numerals and weekday. The reveal fades the numerals in after the lines.
- **Caption / Quote.** Per-word reveal like TextEl. The quote uses `print` font, `framing` in pencil colour above, and `— attribution` below.
- **HighlightEl.** After fitting, measure the target range with a DOM `Range.getClientRects()`, convert to page units, and build marks on the paint layer (highlight = 2–3 overlapping marker `brush` strokes at alpha 0.55) or the ink layer (underline = one wobbly `inkLine` per rect with a slight upward curve; circle = a loose ellipse `inkLine` overshooting its start by 15%).

## 5. Marks (`marks/`)

Reimplemented from the published Hobonichi concepts (reference only, **do not copy code**). Each mark takes `(emit, params, rng)`.

- **`inkLine(pts, {width, color, alpha, wobble, breaks, taper})`.** Resample the polyline every 1.25 units (Catmull-Rom if `smooth`). Pressure profile `p(t) = 0.22 + 0.78·sin(π·t^0.78)^0.72`, times `(1 + 0.12·sin(9t+φ) + (rng−.5)·0.2·wobble)`. Build left and right offset ribbons with half-width `max(0.22, width·0.5·p)`. Skip `breaks` short gaps at random t ∈ [0.2, 0.8]. Scatter ~10% tiny dry specks in paper colour. Emit one op per 8 samples, each filling its ribbon segment.
- **`bloom(cx, cy, r, color, {alpha, rough, layers, rim})`.** For each layer, build a noisy closed polygon (28 points, radius modulated by three sine harmonics with random phases times `rough`). Fill with a radial gradient: centre alpha·0.55, edge alpha·(1+rim), which gives the dried pigment rim. Offset each layer by up to r·0.08. Multiply layer. One op per layer.
- **`brush(pts, color, {w, alpha, dry})`.** A series of rotated elliptical dabs along the path, with swelling pressure `0.26 + 0.74·sin(π·t^0.85)`, slight colour variation (±lighten/darken 5–10%), and chalky specks. One op per ~6 dabs.
- **`field(poly, color, {brush, dense, alpha})`.** A boustrophedon scrubbing of elliptical dabs clipped to the polygon, used for gouache fills (mascot body). One op per pass row.
- **`washi(box, color, pattern)`.** Jagged torn ends, alpha 0.66, pattern stripe/dot/wave, and a faint outline. One op.

Colour helpers live in `src/shared/color.ts`: `hexToRgb`, `rgba`, `mix`, `lighten`, `darken`.

## 6. Mascot (`mascot/`)

- `loadMascot(def, fetchSvg) → LoadedMascot`: parse each pose SVG with `DOMParser`. Validate the conventions (MASCOT-SYSTEM.md §3) and throw a clear error listing every violation. For each path, sample points with a detached `SVGPathElement.getPointAtLength` every 1 unit, and keep the `d` for `Path2D` fills.
- `buildMascot(el, loaded)`: transform viewBox→box (mirror if facing left). **paint:** each `fill` path → `field` (in `colors[data-color]`, alpha 0.95) plus one `bloom` clipped to the path (the lighter variant); `shade` paths → wash at alpha 0.25. **ink:** each `line` path → `inkLine`, width `el.ink.width × data-w` scaled by box size / 100 and clamped to [0.8, 2.4]. **face** is drawn last.
- Draw order in the timeline: paint fills during the first 40% of the element's duration, ink during the remaining 60% (two replayables sharing one timeline entry; see ANIMATION.md §3).

## 7. Decorations (`decor/`)

One builder per `DecorationKind`, all seeded, all fitting inside `box`:

| kind | layer | drawing |
|---|---|---|
| washi-tape | paint | one strip across the box diagonal, rotation ±8° |
| raindrops | ink + paint | 10–18 short slanted ink dashes (70°) plus 4–6 tiny teardrop washes |
| sparkles | ink | 3–5 four-point stars (two crossed tapered lines) with dots |
| stars | paint + ink | 3–5 small five-point stars, wash fill plus outline |
| tiny-heart | paint + ink | one heart, wash fill plus wobbly outline |
| leaf-sprig | paint + ink | a curved stem with 4–6 leaves, green wash |
| doodle-arrow | ink | a curved arrow with a hand-drawn head |
| stamp-word | ink | a double-ruled rough circle plus the word in `print` font drawn to canvas (`fillText`) at 75% alpha, multiply |
| wave-line | ink | a sine wave line across the box |
| bubbles | ink + paint | 4–7 circles of varied size, light wash with a highlight dot |

## 8. Painter (`painter/`), the core of illustration

`new Painter(image, { workWidth, passes, seed, inside })`, where `step(ms)` works incrementally. The result is `strokes: Float32Array` records `[x0,y0,x1,y1,w,r,g,b,a]` in work-image pixels. `StrokeReplay(painter, box)` implements `Replayable` with the Painter's current strokes and maps work pixels to the box (fit contain, centred).

Algorithm (reimplementation of greedy stroke-based painting):
1. Draw the image to an offscreen canvas at `workWidth` (keep the aspect ratio). Read the pixels as the target `T`. Sample the paper colour from the image corners (median of 4 corner 8×8 patches).
2. The canvas estimate `C` starts as paper colour. The ink map is `ink[i] = |T−paper|₁`. **Background:** flood-fill from the border across 4×4 cells whose pixels all have `ink < 30`. Those cells are background and are never painted. When `inside: true`, enclosed pale areas count as subject.
3. Compute luminance gradients (central differences) `gx, gy, gm`.
4. Error grid: 8×8 blocks summing `|T−C|₁`. Pixels with `ink < 30` are weighted ×0.05. Keep a prefix sum for weighted sampling.
5. For each pass `{strokes, wMin, wMax, len, ink}` and each attempt: pick a block weighted by error, then a random pixel in it, and skip background. Colour = `T` at the pixel. For ink passes, require `gm ≥ 7`, sample the darker side of the edge and multiply by 0.82. Width `w` is lerped from wMin to wMax (smaller near edges). The angle follows the edge tangent `atan2(gx, −gy)` when `gm > 2.5`, otherwise random. Try **3 candidates** (angle ± spread, length `len·(0.6..1.6)`, alpha 0.6–1.0). Pick the one with the largest error reduction. Commit if the reduction is below −2 (or −0.5 for ink passes). Rebuild the error grid between passes.
6. All randomness comes from the Painter's own sfc32 seeded with `el.seed`. The same image bytes, plan and seed give the same strokes.
7. **Replay rendering of a stroke:** if `w < 1.5`, draw a pen line (a two-quadratic lens shape). Otherwise draw 3–8 parallel "bristle" lines across the width with jittered starts and ends (0–16%), ±16 colour jitter, and a slight bow. Per-stroke randomness comes from a hash of the stroke index, so it's deterministic.
8. Budget: `step(8)` per frame, interleaved with the rest. If the timeline wants more strokes than have been computed so far, the element simply waits (progress is capped at computed strokes). Target: a 640-wide hero finishes computing in ≤ 6 s on a mid laptop. If it doesn't, move it to a Web Worker (same class, `OffscreenCanvas`) and report back (no ADR change needed).
9. `edge: "vignette"`: after replay, apply a radial `destination-in` mask on a per-element offscreen canvas before compositing. This means illustration elements paint into their own offscreen canvas, which is composited onto `paint` each frame while active and then flattened.

## 9. Frame loop (`page-renderer.ts`)

Each rAF: advance the clock (ANIMATION.md), then for each element compute its target count and `playRange` the delta onto its layer. Update DOM reveals. Run the Painter budget. Once all elements are at 100% and the painters are done, call `onComplete`, stop the loop, and keep the canvases. `renderAt(t)` clears the paint/ink canvases and DOM reveals, then replays every element to its count at `t`. Painters must be completed first; `renderAt` awaits them.

## 10. Performance targets

60 fps on a 2020 laptop during drawing. First paint (paper + header) under 300 ms after the plan arrives. Finished-mode render under 1.5 s including the painter.

## 11. Tests

- Unit (vitest + `@napi-rs/canvas` or jsdom-free pure functions): rng determinism, bloom polygons, inkLine ribbon sample counts, and Painter on a 64×64 fixture (same seed gives the same strokes; error decreases).
- Visual (Playwright): `/dev/page/rain-cat?test=1` screenshots at t = 0, 3, 8, 15, end. Compare against baselines with a 2% pixel tolerance. The baselines are **approved by the lead** at gate G1.
