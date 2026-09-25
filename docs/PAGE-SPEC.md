# PAGE-SPEC — PageSpec (AI) and RenderPlan (resolved)

Two contracts. **PageSpec** is produced by the Director. **RenderPlan** is produced by the Compiler and is the only thing the renderer reads. Zod files: `src/shared/schemas/page-spec.ts` and `src/shared/schemas/render-plan.ts`. All objects are `.strict()`.

---

## 1. PageSpec (Director output)

The Director **chooses from menus** given in its context (see AI-PIPELINE.md §4). It never outputs coordinates, hex colours or quote text (ADR-013).

```ts
type DecorationKind =
  | "washi-tape" | "raindrops" | "sparkles" | "stars" | "tiny-heart"
  | "leaf-sprig" | "doodle-arrow" | "stamp-word" | "wave-line" | "bubbles";

interface PageSpec {
  schemaVersion: 1;
  compositionId: Id;                       // ∈ style.compositions[].id
  title: {
    text: string;                          // 1..40 chars
    source: "entry" | "written";           // entry = verbatim substring of entry text (preferred)
  };                                       // written = ≤ 5 words, lowercase-friendly, in the user's register
  hero: IllustrationBrief;                 // slotId must be the composition's "hero" slot
  spots: IllustrationBrief[];              // 0..2, each in a distinct slot with role "spot"
  mascot: {
    poseId: Id;                            // ∈ mascot.poses[].id
    slotId: Id;                            // slot with role "mascot" (or "spot" if composition allows)
    facing: "left" | "right";
    caption?: string;                      // 0..48, the mascot's tiny speech/thought, optional
    intent: string;                        // 1..120, why this pose (debug only, not rendered)
  };
  highlights: {                            // 0..3 marks on the journal text
    text: string;                          // verbatim substring of entry
    mark: "underline" | "highlight" | "circle";
  }[];
  decorations: {                           // 0..6
    kind: DecorationKind;                  // ∈ style.decorations.allowed
    slotId?: Id;                           // slot with role "decor" | or omitted → compiler picks
    colorRole: ColorRole;
    word?: string;                         // only for "stamp-word", 1..8 chars, from entry or date
  }[];
  atmosphere: {
    weather: WeatherKind;
    washRoles: ColorRole[];                // 1..3, first is dominant
    intensity: Unit;                       // overall wash strength
    warmth: Signed;                        // -1 cool .. +1 warm
  };
  quoteId?: Id;                            // ∈ supplied quote candidates (Phase 9)
  pacing: Pacing;
  rationale: string;                       // 1..400, debug only
}

interface IllustrationBrief {
  id: Id;                                  // "hero", "spot-1", "spot-2"
  slotId: Id;
  subject: string;                         // 1..220, concrete: "an orange cat sitting on the wet pavement outside a small café, warm light from the window"
  composition: string;                     // 1..120, framing: "wide scene, cat small in lower third, café window on the right"
  mood: string;                            // 1..80
  momentId?: Id;                           // ∈ analysis.moments
  colorRoles: ColorRole[];                 // 1..4, which palette roles should dominate
}
```

### Semantic validation — `validatePageSpec(spec, ctx)`

`ctx = { entryText, analysis, style, mascot }`. Returns a list of `{ path, message }`, which is empty when the spec is valid. Rules:

1. `compositionId` exists. Every `slotId` exists in that composition and has the right role. No slot is used twice (except `decor` slots, which can take up to 2 decorations).
2. `hero.slotId` is the composition's hero slot.
3. `mascot.poseId` exists. If the pose declares `slotRoles`, the slot's role is in it.
4. `title.source === "entry"` means the text is a verbatim substring. `"written"` means ≤ 5 words.
5. Every `highlights[].text` is a verbatim substring, and highlights don't overlap each other.
6. Each `decorations[].kind` is in `style.decorations.allowed`. There are ≤ `style.decorations.maxPerPage`. `word` appears only for `stamp-word`.
7. `momentId`s exist in the analysis.
8. `quoteId` is present only if quotes are enabled and the id was in the candidates.

Verbatim matching normalises `’‘“”` to `'"` and collapses runs of whitespace, in both strings.

---

## 2. RenderPlan (Compiler output)

Everything is resolved: page units, hex colours, seeds, fonts, timeline. The renderer makes **no decisions**. It only draws.

```ts
interface RenderPlan {
  schemaVersion: 1;
  rendererVersion: SemVer;                 // renderer major must match to render
  compilerVersion: SemVer;
  page: { width: 520; height: 740 };
  seed: number;                            // uint32
  paper: {
    color: Hex;
    grain: Unit;                           // speckle density
    fibers: Unit;
    grid: { kind: "square" | "dot" | "none"; spacing: number; color: Hex; alpha: Unit; box: Box };
    edgeShade: Unit;                       // subtle darkening at page edges
  };
  fonts: Record<"hand" | "title" | "print", { family: string; weight: number }>;
  elements: RenderElement[];               // z-order = array order within a layer
  timeline: TimelineEntry[];               // exactly one per element
  totalDuration: number;                   // seconds at speed 1
  a11y: { label: string };                 // aria-label for the page image
}

interface TimelineEntry {
  elementId: Id;
  start: number;                           // seconds
  duration: number;                        // > 0 seconds
  easing: "linear" | "easeInOut" | "easeOut";
  gate?: { assetBriefId: Id };             // live mode: waits for this asset
}

type Layer = "paper" | "paint" | "ink" | "text";

type RenderElement =
  | HeaderEl | TextEl | TitleEl | IllustrationEl | WashEl
  | MascotEl | DecorationEl | HighlightEl | CaptionEl | QuoteEl;

interface Base { id: Id; layer: Layer; seed: number }

interface HeaderEl extends Base {          // layer "ink" (lines) + "text" (numerals) — renderer splits
  kind: "header"; box: Box;
  date: ISODate; weekdayLabel: string;     // "TUE"
  monthLabel: string; dayLabel: string;    // "9", "22"
  inkColor: Hex; printColor: Hex;
}

interface TextEl extends Base {            // layer "text"
  kind: "text"; box: Box;
  text: string;                            // verbatim entry
  font: "hand"; size: { max: number; min: number }; lineHeight: number;  // renderer fits max→min in 0.5 steps
  color: Hex;
  overflow: "shrink-then-fade";            // below min: clip last line with a fade (Phase 8: continue page)
}

interface TitleEl extends Base {           // layer "text"
  kind: "title"; box: Box; text: string;
  font: "title"; size: number; color: Hex; shadowColor: Hex; shadowOffset: [number, number];
}

interface HighlightEl extends Base {       // layer "paint" (highlight) or "ink" (underline/circle)
  kind: "highlight"; targetElementId: Id;  // the TextEl
  range: [number, number];                 // char offsets into TextEl.text
  mark: "underline" | "highlight" | "circle"; color: Hex;
}
// Rects for a range are measured from the DOM after text layout. The renderer resolves them at build time.

interface IllustrationEl extends Base {    // layer "paint"
  kind: "illustration"; box: Box;
  asset: { briefId: Id; sha256: Sha256 | null; url: string | null };  // null until asset event
  painter: { workWidth: number; passes: PainterPass[]; inside: boolean };
  alpha: Unit;
  edge: "cutout" | "vignette";             // vignette = soft radial fade mask on the painted result
}

interface PainterPass {                    // see RENDERER.md §5
  strokes: number;                         // attempts in this pass
  wMin: number; wMax: number;              // brush width range (work-image px)
  len: number;                             // base stroke length (work-image px)
  ink: boolean;                            // edge-following dark line pass
}

interface WashEl extends Base {            // layer "paint"
  kind: "wash";
  blooms: { cx: number; cy: number; r: number; color: Hex; alpha: Unit; rough: Unit; layers: number; rim: Unit }[];
}

interface MascotEl extends Base {          // layer "paint" (fills) + "ink" (lines) — renderer splits
  kind: "mascot"; box: Box;
  mascotId: Id; poseId: Id; facing: "left" | "right";
  colors: Record<string, Hex>;             // mascot palette key → hex (body, belly, cheek, ink, prop...)
  ink: { width: number; wobble: Unit };
}

interface DecorationEl extends Base {      // layer per kind (see RENDERER.md §7)
  kind: "decoration"; decor: DecorationKind; box: Box; color: Hex;
  word?: string;
}

interface CaptionEl extends Base {         // layer "text"
  kind: "caption"; box: Box; text: string; font: "hand"; size: number; color: Hex;
  bubble: "none" | "speech" | "thought"; tailTo?: [number, number];
}

interface QuoteEl extends Base {           // layer "text"
  kind: "quote"; box: Box; framing: string; text: string; attribution: string;
  font: "print"; size: number; color: Hex;
}
```

### Invariants (checked by `validateRenderPlan`)
- Element ids are unique. Every element has exactly one timeline entry, and every timeline entry refers to an element.
- Every box lies within the page (`0 ≤ x`, `x + w ≤ 520`, ...).
- `totalDuration ≥ max(start + duration)`.
- `HighlightEl.range` lies within the target text.
- **Ledger rule:** `text`, `title`, `caption` and `quote` boxes don't overlap each other. Other overlaps are allowed only if the composition slot declares `allowsOverlapWith`.

---

## 3. Worked example (reference entry)

Entry: *"Today I walked home in the rain and saw an orange cat outside a café. I was exhausted but strangely happy."*

```json
{
  "schemaVersion": 1,
  "compositionId": "hero-top",
  "title": { "text": "strangely happy", "source": "entry" },
  "hero": {
    "id": "hero", "slotId": "hero",
    "subject": "an orange cat sitting on wet pavement outside a small café at dusk, warm yellow light spilling from the café window, light rain",
    "composition": "wide street scene, cat small and central in the lower third, café window on the right, puddle reflections",
    "mood": "tired, quiet, secretly glad",
    "momentId": "m2",
    "colorRoles": ["washCool", "washWarm", "accentWarm"]
  },
  "spots": [
    { "id": "spot-1", "slotId": "spot-1",
      "subject": "a single wet umbrella leaning closed, droplets",
      "composition": "single object, clear silhouette", "mood": "end of the walk",
      "momentId": "m1", "colorRoles": ["washCool", "ink"] }
  ],
  "mascot": { "poseId": "umbrella", "slotId": "mascot", "facing": "left",
              "caption": "wet, but worth it", "intent": "companion walked home in the rain too" },
  "highlights": [ { "text": "orange cat", "mark": "highlight" },
                  { "text": "strangely happy", "mark": "underline" } ],
  "decorations": [ { "kind": "raindrops", "slotId": "decor-top", "colorRole": "accentCool" },
                   { "kind": "washi-tape", "slotId": "decor-corner", "colorRole": "accentWarm" },
                   { "kind": "tiny-heart", "slotId": "decor-margin", "colorRole": "accentWarm" } ],
  "atmosphere": { "weather": "rain", "washRoles": ["washCool", "washWarm"], "intensity": 0.6, "warmth": -0.2 },
  "pacing": "gentle",
  "rationale": "The cat is the brightest moment of a tiring rainy walk: warm light against cool rain."
}
```

The file `fixtures/pagespecs/rain-cat.json` must contain exactly this (TASK-014).
