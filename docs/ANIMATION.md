# ANIMATION — progressive painting

The page must look like **someone is physically making it**: tactile, slow, organic, intentional, imperfect. It must never look like a loader.

## 1. Principles
1. **One hand at a time, mostly.** Like Hobonichi's score, usually only one place on the page is being worked. Small overlaps are allowed (a wash can begin to bloom while the last words are written), but there's never a "everything fades in together" moment.
2. **Materials in physical order.** Paper, then printed grid, then ink date, then words, then water/wash, then paint, then ink details over paint, then small things, then the quote. Ink details on a painting come *after* its paint.
3. **Paint accumulates, it never tweens.** Nothing slides, scales, or bounces. Canvas content only appears through appended ops. DOM text only appears through wipes.
4. **Ease like a hand.** Each element uses `easeInOut` over its ops: it starts carefully, speeds up and finishes carefully. The painter uses `easeOut` (big strokes first feel fast, details slow down).
5. **Pauses are content.** A short beat (0.3–0.6 s) between phases, as if the hand lifts.
6. **The user is in control.** Speed 1×/2× (remembered). Click or tap the page (or press Space) to finish instantly. Reduced motion shows the finished page with a 600 ms opacity fade.
7. **Draw once.** Live drawing happens only on the first view of a generation. After that, `mode: "finished"`.

## 2. Timeline compilation (compiler, `src/compiler/timeline.ts`)

The style supplies an `AnimationPreset` per pacing:

```ts
interface AnimationPreset {
  phaseOrder: Phase[];                   // order of phases
  gap: number;                           // seconds between phases
  durations: {
    paper: number; header: number;
    textCharsPerSecond: number; textMin: number; textMax: number;
    title: number; wash: number;
    heroPaint: number; spotPaint: number;
    mascot: number; decoration: number; highlight: number;
    caption: number; quote: number;
  };
  overlaps: Partial<Record<Phase, number>>;  // seconds this phase may start before the previous ends
}
type Phase = "paper" | "header" | "title" | "text" | "wash" | "hero" | "highlights"
           | "spots" | "mascot" | "decorations" | "caption" | "quote";
```

`techo-watercolor` presets (transcribe into style.json):

| pacing | order | gap | paper | header | text cps (min–max s) | title | wash | hero | spot | mascot | decor (each) | highlight | caption | quote | overlaps |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gentle | paper, header, title, text, wash, hero, highlights, spots, mascot, decorations, caption, quote | 0.4 | 0.8 | 1.0 | 38 (3–9) | 1.6 | 1.8 | 8.0 | 3.0 | 2.6 | 0.6 | 0.5 | 1.0 | 2.0 | wash: 1.0, highlights: 0.2 |
| slow | same | 0.6 | 1.0 | 1.3 | 28 (4–12) | 2.0 | 2.4 | 10.0 | 3.6 | 3.2 | 0.8 | 0.7 | 1.3 | 2.6 | wash: 1.2 |
| lively | same | 0.25 | 0.6 | 0.8 | 55 (2–6) | 1.2 | 1.4 | 6.0 | 2.4 | 2.0 | 0.45 | 0.4 | 0.8 | 1.6 | wash: 0.8, spots: 0.6 |

Rules:
- Within a multi-element phase (decorations, spots, highlights), elements run **sequentially** in plan order, each with its own duration.
- `text` duration = `clamp(chars / cps, textMin, textMax)`.
- Hero and spot illustration entries get `gate: { assetBriefId }`.
- Missing elements (no quote, no caption) remove their phase with no gap.
- `totalDuration` = the end of the last entry. For the gentle preset and the reference entry, expect ~26 s.

## 3. Clock and gating (renderer, `src/renderer/timeline.ts`)

```ts
class Clock { t: number; speed: 1 | 2; running: boolean; tick(dtMs: number): void }
```
- `t` advances by `dt × speed` while running. `skipToEnd` sets `t = ∞`.
- **Live gating.** An entry with a gate whose asset isn't provided yet is *held*. When the clock reaches the entry's start, the clock itself **does not stop**. Instead, the gated entry and **all later entries** shift by the wait (`delay += dt`) until the asset arrives. Before holding, the renderer lets ambient elements idle (no new ops). This way nothing after the painting draws before the painting, and the order of making is preserved.
  While held for more than 2 s, a subtle "the pen is resting" cue appears: a tiny ink dot pulses in the hero box at alpha 0.2–0.35, using the live layer.
- `renderAt(t)` ignores gates (assets must be present) and uses planned times. It's deterministic.
- Compound elements (mascot, header) split their one timeline window between sub-replayables with a fixed split (mascot: fills 0–0.4, ink 0.4–1.0; header: lines 0–0.6, numerals 0.5–1.0).

## 4. Before the plan exists (submission → PageSpec)

This is AI time (~5–12 s), and it is not empty. As soon as the entry is submitted:
1. The page shows fresh paper (paper layer drawn with the style defaults and date-based seed) and inks the header date (1 s).
2. Then a "breath": the pen rests (the pulsing dot bottom-right). No text says "thinking".
3. When the `spec` event arrives, the renderer is created with the full plan, and paper/header are already done (`t` starts at the end of the header phase).

## 5. Ambient life (Phase 10, optional)
After completion, a `live` layer may run very subtle loops: mascot blink every 4–7 s, faint rain shimmer on rainy pages. These are additive only and must never alter the painted layers.

## 6. Acceptance for "feels made by hand" (gate G1 review questions)
- Can you tell the order a person would have made this page in?
- Is anything moving that paint wouldn't move?
- Does the painting emerge coarse-to-fine, and is it recognisable by about 40% of its time?
- Does the text feel written (a word-by-word cadence) rather than typed (character by character, uniform)?
- At 2× does it still feel like a hand, just a quicker one?
