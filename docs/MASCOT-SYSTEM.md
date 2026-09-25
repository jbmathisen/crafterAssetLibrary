# MASCOT SYSTEM

The mascot is a **persistent character**, not an avatar. Every page, it is somewhere doing something that echoes the day. It is always recognisably the same creature (ADR-008).

## 1. Options considered

| Approach | Consistency | Pose range | Cost/latency | Controllability | Verdict |
|---|---|---|---|---|---|
| Image model each day, with reference images | drifts (proportions, markings, colours) | unlimited | +1 image call per page | low | rejected for runtime |
| Parametric rig (skeleton + parts) | perfect | medium | none | high, but hard to make charming | rejected: a rig looks puppet-like; Hobonichi's note: "poses are whole drawings, not a rig" |
| **Hand-authored vector pose library** | perfect | grows by adding files | none | high | **accepted** |
| Offline pose-sheet generation → curated → vectorised | good | grows | offline only | medium | **future path** for custom mascots |

## 2. Definition (`src/shared/schemas/mascot.ts`)

```ts
interface MascotDefinition {
  schemaVersion: 1;
  id: Id; version: SemVer;
  species: string;                         // "whale"
  defaultName: string;                     // "Mori"
  description: string;                     // ≤ 300, for the Director: look + character
  character: string[];                     // 2..6 traits: "unhurried", "curious", "a little shy"
  palette: Record<string, Hex>;            // keys used by pose SVGs via data-color
  poses: PoseDef[];                        // ≥ 4
}

interface PoseDef {
  id: Id;
  file: string;                            // relative: "poses/umbrella.svg"
  description: string;                     // ≤ 160, for the Director: what the mascot is doing
  suits: string[];                         // tags: "rain", "tired", "walking", "calm", "night", "joy"...
  avoid: string[];                         // tags where this pose is wrong: "grief", ...
  slotRoles: ("mascot" | "spot")[];
  anchor: "bottom" | "center";             // how it sits in its slot box
}
```

## 3. Pose SVG conventions (strict: the renderer depends on them)

- `viewBox="0 0 100 100"`. The character fits inside with ≥ 4 units margin. The ground line is at y = 94 for `anchor: bottom`.
- The facing in the file is **right**. The renderer mirrors for `facing: "left"`.
- Only `<path>` elements (no rect/circle/ellipse/transform/style/text). Convert shapes to paths.
- Groups, in render order:
  1. `<g id="fill">`: closed paths, each with `data-color="<palette key>"`. Rendered as a flat gouache field plus a wash bloom clipped to the path, on the **paint** layer.
  2. `<g id="shade">` (optional): closed paths, `data-color`, rendered as a low-alpha wash for the form shadow (light comes from the upper left).
  3. `<g id="line">`: open or closed paths. Rendered as pressure-profile ink lines on the **ink** layer. Optional `data-w` is a width multiplier (default 1).
  4. `<g id="face">`: eyes, cheeks, mouth. Paths with `data-color`, filled solid (eyes, blush) or stroked if `data-stroke="1"`. Drawn last.
- Ink is drawn in the order the paths appear (this is the drawing order the user watches). Order them like a person would draw: head outline → body → fins → details.
- A pose file is ≤ 40 paths. Keep it simple; charm comes from silhouette and face.

## 4. The slice mascot: `whale` / "Mori" (v1.0.0)

**Look.** A small, round, dusty-blue whale, about as tall as it is long when upright. It has a pale cream belly with three soft groove lines, a tiny dorsal bump, small pectoral fins that act as "hands", and a forked tail it can stand on. Two dot eyes with a white glint, coral blush cheeks, and a tiny curved smile. A small water-spout tuft on top is an optional expressive element: it droops when tired and sparkles when happy.

**Character.** Unhurried, curious, a little shy, a good listener.

**Palette.** `body #6F8FB8`, `belly #EFE6D2`, `cheek #E2705E`, `eye #2A2622`, `spout #9CC3D9`, `prop #E2705E`, `prop2 #F2B950`.

**Poses (slice set, 5).**

| id | description | suits | avoid | slotRoles | anchor |
|---|---|---|---|---|---|
| sit | sitting upright on its tail, fins resting, looking at the reader | calm, content, neutral, reading, quiet | none | mascot, spot | bottom |
| umbrella | standing on its tail under a small coral umbrella held in one fin, spout drooping | rain, walking, weather, tired | clear, heat | mascot | bottom |
| peek | only the top half visible, peeking up from the bottom edge of its box, eyes wide | curious, surprise, busy, playful | grief | mascot | bottom |
| sleep | lying curled on its side, eyes closed (curved lines), small "z z" | tired, night, rest, sick, sad | party, joy | mascot, spot | bottom |
| wave | upright, one fin raised in a wave, spout sparkling | joy, greeting, friends, celebration | grief, sensitive | mascot | bottom |

The lead reviews every pose at 3 sizes (48, 112, 200 units) on the actual renderer before it's accepted (TASK-011, gate G1).

## 5. Selection (Director) and placement (Compiler)

- Director picks `poseId` from the list (with descriptions/suits/avoid in context), `slotId`, `facing` and an optional `caption`.
- Heuristics in the prompt: mirror the day's *physical* state first (rain → umbrella, tired → sleep), then its *emotional* state. On sensitive pages use only sit or sleep, with no caption.
- Facing: turn the mascot **toward the hero** or toward the text. The compiler overrides `facing` if it would face off the page edge.
- The compiler fits the 100×100 viewBox into the slot box, keeping the aspect ratio. With `anchor: bottom`, the pose's ground line (y = 94) aligns to the slot bottom. Small jitter comes from `imperfection`.
- A caption (if any) goes in the slot's `captionBox` as a small handwritten note (bubble `none` in the slice).

## 6. Continuity across days (post-slice)

- The Director receives the last 3 pages' `poseId`s and must not repeat yesterday's pose unless the weather or mood strongly calls for it.
- Later: poses with *props* as separate SVGs attached at anchors (`hold`, `head`, `ground`). World-specific poses (ocean: swimming; city: on a tram). User-chosen names.
- Custom mascots (later): an offline pose-sheet workflow. Generate a turnaround with the image model, curate it with a human, trace or convert it into pose SVGs following §3, and store as a new mascot version.
