# STYLE SYSTEM

A **style** is a diary-specific design language, modelled on Katagami's structure (philosophy → tokens → rules → layout → guidance) but aimed at *notebook pages* instead of UI.

It has two audiences:
- **Renderer / compiler** read `style.json` tokens: numbers, hex, ids.
- **AI** (Director, image model) reads `philosophy`, `rules`, `director.md`, and the `illustration` recipe.

Adding a style means adding `content/styles/<id>/` and needs no code. The renderer implements a fixed set of *mark types* and *decoration kinds*. A style only parameterises and selects from them. If a style needs a new mark or decoration, that's a renderer feature (escalate).

Layout of a style folder:
```
content/styles/<id>/
  style.json        tokens + compositions (validated by StyleDefinitionSchema)
  director.md       prose guidance injected into the Director prompt
  illustration.md   human notes on the image recipe (the recipe itself lives in style.json)
```

## 1. Schema (`src/shared/schemas/style.ts`)

```ts
interface StyleDefinition {
  schemaVersion: 1;
  id: Id; version: SemVer; name: string; description: string;   // description ≤ 300, for Director
  philosophy: { believes: string[]; rejects: string[]; lineage: string[] };  // 1..8 each
  palette: { paper: Hex; roles: Record<ColorRole, Hex>; header: { ink: Hex; print: Hex } };
  typography: {
    hand:  { family: string; weight: number; size: { max: number; min: number }; lineHeight: number };
    title: { family: string; weight: number; size: number; shadowOffset: [number, number] };
    print: { family: string; weight: number; size: number };
  };
  paper: { grain: Unit; fibers: Unit; edgeShade: Unit;
           grid: { kind: "square" | "dot" | "none"; spacing: number; color: Hex; alpha: Unit; box: Box } };
  compositions: CompositionTemplate[];                             // ≥ 1
  marks: {
    ink: { width: number; wobble: Unit; breaks: number };          // breaks = pen skips per long line
    wash: { alpha: Unit; rough: Unit; layers: number; rim: Unit };
    painter: { hero: PainterPlan; spot: PainterPlan };
  };
  illustration: {
    promptTemplate: string;          // slots: {subject} {composition} {palette} {mood}
    negativePrompt: string;
    paletteWords: Partial<Record<ColorRole, string>>;   // role → words for {palette}, e.g. washCool: "soft rain blue"
    sizes: { landscape: [number, number]; portrait: [number, number]; square: [number, number] };
  };
  decorations: { allowed: DecorationKind[]; maxPerPage: number };
  animation: Record<Pacing, AnimationPreset>;          // see ANIMATION.md
  imperfection: { rotateJitterDeg: number; positionJitter: number };
  rules: { do: string[]; dont: string[] };              // injected into Director prompt verbatim
}

interface PainterPlan { workWidth: number; passes: PainterPass[] }

interface CompositionTemplate {
  id: Id; name: string;
  description: string;               // ≤ 240, for Director: when to use it
  heroAspect: "landscape" | "portrait" | "square";
  heroEdge: "cutout" | "vignette";
  slots: Slot[];
}

interface Slot {
  id: Id;
  role: "header" | "title" | "text" | "hero" | "spot" | "mascot" | "quote" | "decor";
  box: Box;
  allowsOverlapWith?: Slot["role"][];
  captionBox?: Box;                  // mascot slots only
  description?: string;              // for Director (decor/spot slots)
}
```

## 2. The slice style: `techo-watercolor` (v1.0.0)

Transcribe this into `content/styles/techo-watercolor/style.json`. Values are **starting points** for tuning at review gates. Only the lead changes them.

### Philosophy
- believes: "a page is made, not generated"; "the user's words are the spine of the page"; "one painted moment, a few small witnesses"; "paper white is a colour"; "ink over paint, never paint over words"; "small imperfections are proof of a hand"
- rejects: "stock-illustration polish"; "filling every gap"; "gradients and drop shadows"; "photorealism"; "inspirational-poster sentiment"; "UI chrome on the page"
- lineage: "Japanese techo stationery", "urban sketching (ink and wash)", "travel journals", "picture-book watercolour"

### Palette
| role | hex | use |
|---|---|---|
| paper | `#FBF8F0` | page |
| ink | `#2A2622` | lines, body text |
| inkSoft | `#5B544A` | secondary text |
| pencil | `#A59C88` | labels, small print |
| title | `#2E3F7C` | title lettering (indigo) |
| titleShadow | `#E8A84A` | title offset shadow (amber) |
| accentWarm | `#E2705E` | coral accents |
| accentCool | `#5E8FB0` | rain blue accents |
| washWarm | `#F2B950` | marigold wash |
| washCool | `#9CC3D9` | sky/rain wash |
| washGreen | `#9DBF9A` | leaf wash |
| highlight | `#F6D36A` | marker highlight |
| header.ink | `#908A37` | date numerals (olive) |
| header.print | `#A6A27A` | small print |

### Typography
- hand: `Kalam` 300, size max 17 / min 12.5, lineHeight 1.55 (multiplier). The lineHeight should come out close to a multiple of the 13-unit grid: at 17 px, 26.35 ≈ 2 rows.
- title: `Caveat` 700, size 44, shadowOffset [2.5, 2.5]
- print: `Jost` 300, size 10.5

### Paper
grain 0.5, fibers 0.3, edgeShade 0.25; grid square, spacing 13, color `#969468`, alpha 0.26, box `{x:26,y:22,w:468,h:692}`.

### Marks
- ink: width 1.6, wobble 0.35, breaks 1
- wash: alpha 0.18, rough 0.4, layers 4, rim 0.5
- painter.hero: workWidth 640, passes `[[4200,10,30,64,false],[5600,6,18,40,false],[6400,4,11,26,false],[6000,2.8,7,16,false],[3000,2,4.6,10,false],[8000,1.1,2.4,16,true]]` as `{strokes,wMin,wMax,len,ink}`
- painter.spot: workWidth 320, passes `[[1200,6,16,34,false],[1800,3.5,9,20,false],[2000,2,5,12,false],[2400,1,2,10,true]]`

### Compositions (page 520 × 740)

**`hero-top`**: "A wide painted scene across the top, words below. Use when the day has one clear place or scene." heroAspect landscape, heroEdge cutout.

| slot | role | box {x,y,w,h} | notes |
|---|---|---|---|
| header | header | 26,22,160,48 | |
| hero | hero | 26,80,468,272 | |
| title | title | 40,300,320,60 | allowsOverlapWith [hero] |
| text | text | 36,372,300,262 | |
| spot-1 | spot | 352,376,136,110 | "small object beside the text" |
| mascot | mascot | 372,518,112,112 | captionBox 344,492,146,24 |
| quote | quote | 36,650,448,62 | |
| decor-top | decor | 40,86,440,70 | allowsOverlapWith [hero]; "over the top of the painting (weather, sparkles)" |
| decor-corner | decor | 424,74,76,28 | allowsOverlapWith [hero]; "tape on the painting's corner" |
| decor-margin | decor | 6,380,26,240 | "left margin" |

**`hero-side`**: "Words on the left, a tall painted moment on the right. Use for a single figure, object or vertical scene (a tree, a person, a doorway)." heroAspect portrait, heroEdge cutout.

| slot | role | box | notes |
|---|---|---|---|
| header | header | 26,22,160,48 | |
| title | title | 36,80,448,60 | |
| text | text | 36,150,226,480 | |
| hero | hero | 272,146,222,330 | |
| spot-1 | spot | 290,488,110,100 | |
| mascot | mascot | 400,500,96,120 | captionBox 290,622,200,22 |
| quote | quote | 36,650,448,62 | |
| decor-top | decor | 272,146,222,60 | allowsOverlapWith [hero] |
| decor-corner | decor | 424,140,76,28 | allowsOverlapWith [hero] |
| decor-margin | decor | 6,150,26,470 | |

**`vignette`**: "Words first, then a soft round painted memory beneath. Use for quiet, reflective or indoor days, or when the moment is small." heroAspect square, heroEdge vignette.

| slot | role | box | notes |
|---|---|---|---|
| header | header | 26,22,160,48 | |
| title | title | 36,80,448,60 | |
| text | text | 36,148,448,176 | |
| hero | hero | 120,332,280,280 | |
| mascot | mascot | 40,512,100,110 | allowsOverlapWith [hero]; captionBox 36,624,160,22 |
| spot-1 | spot | 400,500,96,96 | |
| quote | quote | 36,650,448,62 | |
| decor-top | decor | 120,332,280,60 | allowsOverlapWith [hero] |
| decor-corner | decor | 380,330,76,28 | allowsOverlapWith [hero] |
| decor-margin | decor | 488,148,26,470 | "right margin" |

### Illustration recipe

```
promptTemplate:
A small hand-painted illustration for a personal diary page, loose transparent watercolour with fine ink linework. {subject}. {composition}. Soft watercolour washes with gentle blooms and visible paper white, confident slightly wobbly dark-brown ink lines, simple readable shapes, a little hand-made imperfection. Limited palette: {palette}. Mood: {mood}. The subject is isolated on a plain flat off-white paper background with generous empty margin on every side and does not touch the edges. No text, no letters, no signature, no frame, no border.

negativePrompt:
text, letters, words, watermark, signature, frame, border, photorealistic, photograph, 3d render, glossy, gradient background, drop shadow, busy background, cropped subject, dark background
```
- paletteWords: ink "warm dark-brown ink", washWarm "marigold", washCool "soft rain blue", washGreen "sage green", accentWarm "coral", accentCool "slate blue", highlight "pale yellow", title "indigo"
- sizes: landscape [1536,1024], portrait [1024,1536], square [1024,1024]
- `{palette}` = the brief's `colorRoles` mapped through paletteWords, joined with ", ", plus ", off-white paper".

### Decorations
allowed: washi-tape, raindrops, sparkles, stars, tiny-heart, leaf-sprig, doodle-arrow, stamp-word, wave-line, bubbles. maxPerPage 5.

### Imperfection
rotateJitterDeg 1.2 (applied to title, captions, decorations, spot boxes; not body text), positionJitter 2.

### Rules (injected into the Director prompt)
- do: "Choose the single most emotionally important concrete moment as the hero."; "Prefer a title taken from the user's own words."; "Let weather and mood decide wash colours; keep one warm accent on cool days and one cool accent on warm days."; "Keep the mascot small and in a supporting role; its pose should echo the user's day."; "Use at most two highlights, on the words that carry the feeling."; "Leave empty paper; restraint reads as care."
- dont: "Don't illustrate everything mentioned."; "Don't depict the user as a detailed person; if people matter, show them small, from behind or by an object."; "Don't add objects the entry doesn't suggest, except world motifs as decoration."; "Don't write captions that interpret or judge the user's feelings."; "Don't use sparkles or hearts on sad or sensitive pages."; "Don't use more decorations than the day can hold."

### director.md (write this file)
Short, practical guidance for the Director in this style: the three compositions and when to use each, how the painting sits (a cutout on paper, not a rectangle), that the title is hand-lettered and short, and that quiet days get the vignette. ≤ 60 lines. The lead reviews it.

## 3. How styles evolve
- Tokens are versioned (`version`). Existing pages keep their stored RenderPlan, so a style change never alters old pages.
- The visual review rubric (Katagami-derived), scored 0–2 each: medium/material, marks/edges, depiction grammar, tonal shading, colour roles, composition, signature details, exclusions. Used at review gates and in the eval contact sheet.
- Future styles: pencil sketchbook, botanical journal, gouache, Nordic minimal, ink, collage. Each needs only `style.json` plus prose, unless it needs a new mark type (e.g. pencil hatching, collage paper cutouts). Those are renderer features and need an ADR.
