# DATA MODELS

Canonical TypeScript shapes. Implement them **exactly** as Zod schemas in `src/shared/schemas/*.ts`, exporting both the schema (`XSchema`) and the inferred type (`type X = z.infer<typeof XSchema>`). All objects are `.strict()` (unknown keys rejected). Bounds shown as comments are enforced.

PageSpec and RenderPlan are in **PAGE-SPEC.md**. StyleDefinition is in **STYLE-SYSTEM.md**. MascotDefinition is in **MASCOT-SYSTEM.md**.

## 1. Primitives (`src/shared/schemas/common.ts`)

```ts
type Id = string;          // /^[a-z0-9][a-z0-9-]{0,63}$/
type ISODate = string;     // /^\d{4}-\d{2}-\d{2}$/  (a valid calendar date)
type Timestamp = string;   // ISO 8601 datetime
type Hex = string;         // /^#[0-9a-fA-F]{6}$/
type Unit = number;        // 0..1 inclusive
type Signed = number;      // -1..1 inclusive
type Sha256 = string;      // /^[a-f0-9]{64}$/
type SemVer = string;      // /^\d+\.\d+\.\d+$/

interface Box { x: number; y: number; w: number; h: number; rotate?: number /* degrees, -30..30 */ }
// page units; page is 520 x 740; w,h > 0

type ColorRole =
  | "ink" | "inkSoft" | "pencil"
  | "title" | "titleShadow"
  | "accentWarm" | "accentCool"
  | "washWarm" | "washCool" | "washGreen"
  | "highlight";

type WeatherKind = "clear" | "cloudy" | "rain" | "snow" | "fog" | "wind" | "storm" | "heat" | "unknown";
type Personality = "quiet" | "playful" | "melancholic" | "whimsical" | "reflective";
type Pacing = "gentle" | "lively" | "slow";
```

## 2. Diary identity (`diary.ts`)

```ts
interface DiaryIdentity {
  schemaVersion: 1;
  id: Id;
  title: string;                     // 1..80
  styleId: Id;  styleVersion: SemVer;
  worldId: Id;
  mascotId: Id; mascotVersion: SemVer;
  mascotName: string;                // 1..30, e.g. "Mori"
  personality: Personality;
  preferences: { quotes: boolean; drawSpeed: 1 | 2 };
  createdAt: Timestamp;
}
```

Slice default (seed on first run): `{ id: "my-diary", title: "My Diary", styleId: "techo-watercolor", worldId: "ocean", mascotId: "whale", mascotName: "Mori", personality: "quiet", preferences: { quotes: false, drawSpeed: 1 } }`.

## 3. World (`world.ts`)

```ts
interface WorldDefinition {
  schemaVersion: 1;
  id: Id; version: SemVer; name: string;
  description: string;                       // for the Director
  motifs: string[];                          // 3..20 e.g. "small bubbles", "wave line", "shell"
  decorationBias: Partial<Record<DecorationKind, number>>; // weights 0..2, default 1
  accentRole?: ColorRole;                    // colour role the world leans on
}
```

## 4. Entry (`entry.ts`)

```ts
interface Entry {
  schemaVersion: 1;
  diaryId: Id;
  date: ISODate;
  text: string;          // 1..6000 chars, stored verbatim (no trimming beyond trailing whitespace)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 5. JournalAnalysis — Interpreter output (`analysis.ts`)

```ts
interface JournalAnalysis {
  schemaVersion: 1;
  language: string;                    // BCP-47, e.g. "en"
  summary: string;                     // 1..240, third person, factual, no embellishment
  timeOfDay: "morning" | "afternoon" | "evening" | "night" | "mixed" | "unknown";
  weather: { kind: WeatherKind; explicit: boolean };
  moments: Moment[];                   // 1..6, ordered as in the entry
  places: { name: string; kind: string; momentIds: Id[] }[];   // 0..8
  people: { label: string; relation?: string }[];              // 0..8; labels as written, never invented names
  moods: { label: string; intensity: Unit }[];                 // 1..4
  emotionalArc: string;                // 0..160, e.g. "tired → quietly content"
  themes: string[];                    // 0..5, single words or short phrases ("solitude", "small joys")
  visualMotifs: VisualMotif[];         // 1..10
  notablePhrases: { text: string; why: string }[];            // 0..6; text MUST be verbatim substring of entry
  sensitivity: { level: "none" | "low" | "high"; topics: string[] };
}

interface Moment {
  id: Id;                              // "m1", "m2", ...
  description: string;                 // 1..200, concrete and visual
  place?: string;
  objects: string[];                   // 0..8
  sensory: string[];                   // 0..6 ("rain on the hood", "warm café light")
  salience: Unit;                      // how central to the day's feeling
  valence: Signed;                     // -1 negative .. +1 positive
}

interface VisualMotif {
  id: Id;
  motif: string;                       // 1..80 "orange cat", "café window glow"
  source: "explicit" | "inferred";
  salience: Unit;
  drawability: "high" | "medium" | "low";   // can this be a clear small picture?
  momentId?: Id;
}
```

**Semantic validation** (`validateAnalysis(analysis, entryText)`), run after Zod:
- each `notablePhrases[].text` is an exact substring of `entryText` (case-sensitive; after normalising curly quotes to straight in both);
- every `momentId` reference exists; moment ids are unique;
- at least one moment has `salience ≥ 0.6`.

## 6. Assets (`asset.ts`)

```ts
interface AssetRef {
  briefId: Id;                         // IllustrationBrief.id
  sha256: Sha256;
  url: string;                         // "/api/assets/<sha256>.png"
  width: number; height: number;
  status: "ready" | "failed";
}

interface AssetMeta {
  schemaVersion: 1;
  sha256: Sha256;
  mime: "image/png";
  width: number; height: number;
  kind: "illustration";
  prompt: string;                      // the exact filled prompt sent
  negativePrompt?: string;
  provider: string;                    // "openai" | "fixture" | ...
  model: string | null;                // actual model id reported, or null
  providerRequestId: string | null;
  createdAt: Timestamp;
}
```

## 7. PageRecord (`page-record.ts`)

```ts
interface PageRecord {
  schemaVersion: 1;
  diaryId: Id;
  date: ISODate;
  generation: number;                  // 1, 2, ... (regenerate increments)
  status: "pending" | "interpreting" | "directing" | "generating-assets" | "ready" | "failed";
  error?: { stage: string; message: string };
  entrySnapshot: { text: string; sha256: Sha256 };
  seed: number;                        // uint32 = hashSeed(diaryId, date, generation)
  analysis?: JournalAnalysis;
  pageSpec?: PageSpec;
  assets: AssetRef[];
  renderPlan?: RenderPlan;
  versions: {
    renderer: SemVer; compiler: SemVer;
    style: SemVer; mascot: SemVer; world: SemVer;
    prompts: { interpreter: SemVer; director: SemVer; illustration: SemVer };
  };
  models: { interpreter: string | null; director: string | null; image: string | null };
  fallbacks: string[];                 // e.g. ["director:fallback-spec"], for eval visibility
  firstSeenAt?: Timestamp;             // set when the page finishes its first live draw
  createdAt: Timestamp;
}
```

The **current page** for a date is the highest generation with `status: "ready"`.

## 8. Repository interface (`src/server/repo/types.ts`)

```ts
interface Repository {
  getDiary(id: Id): Promise<DiaryIdentity | null>;
  putDiary(d: DiaryIdentity): Promise<void>;
  getEntry(diaryId: Id, date: ISODate): Promise<Entry | null>;
  putEntry(e: Entry): Promise<void>;
  listPages(diaryId: Id): Promise<{ date: ISODate; generation: number; status: PageRecord["status"] }[]>;
  getPage(diaryId: Id, date: ISODate, generation?: number): Promise<PageRecord | null>; // default latest ready
  putPage(p: PageRecord): Promise<void>;           // atomic write (tmp + rename)
  putAsset(bytes: Uint8Array, meta: Omit<AssetMeta, "sha256" | "width" | "height">): Promise<AssetMeta>;
  getAsset(sha256: Sha256): Promise<{ bytes: Uint8Array; meta: AssetMeta } | null>;
}
```

## 9. API (`src/server/app.ts`)

| Method | Path | Body / Result |
|---|---|---|
| GET | `/api/diary` | `DiaryIdentity` (seeds default if missing) |
| GET | `/api/pages` | `listPages` result |
| GET | `/api/pages/:date` | `PageRecord` (latest ready, else latest) or 404 |
| PUT | `/api/entries/:date` | `{ text }` → `Entry` |
| POST | `/api/pages/:date/generate` | `{ regenerate?: boolean }` → `{ generation }`, starts pipeline |
| GET | `/api/pages/:date/events?generation=n` | SSE stream of `PipelineEvent` |
| POST | `/api/pages/:date/seen` | `{ generation }` → sets `firstSeenAt` |
| GET | `/api/assets/:sha256.png` | image bytes, `Cache-Control: immutable` |

```ts
type PipelineEvent =
  | { type: "status"; status: PageRecord["status"] }
  | { type: "spec"; renderPlan: RenderPlan }          // text & non-asset elements can start
  | { type: "asset"; asset: AssetRef }               // gated elements can start
  | { type: "ready"; page: PageRecord }
  | { type: "error"; stage: string; message: string };
```
