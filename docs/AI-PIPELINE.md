# AI PIPELINE

Sequential, no agents (ADR-006). Server-side in `src/server/pipeline/`.

```
entry → [1 Interpreter] → JournalAnalysis → [2 Director] → PageSpec
      → compile(no assets) → SSE "spec" → [3 Assets ∥] → SSE "asset"×N → compile(final) → PageRecord ready
```

## Stage contract (all LLM stages)
1. Load prompt `content/prompts/<stage>.md` (has a `version:` front-matter line).
2. Assemble context as JSON.
3. Call `TextModel.structured({ system, user, schema: z.toJSONSchema(Schema), name })`. The Anthropic adapter uses one forced tool whose `input_schema` is the JSON Schema.
4. Zod parse → semantic validate. On failure, retry **once**, appending the error list. If that also fails, use the **deterministic fallback** and push the name to `fallbacks`.
5. Timeouts: interpreter 20 s, director 30 s.

Env: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DIARY_MODEL_INTERPRETER` (default a fast Claude Sonnet-class id), `DIARY_MODEL_DIRECTOR` (default a Claude Sonnet/Opus-class id), `DIARY_IMAGE_MODEL` (default an OpenAI GPT Image id), `DIARY_AI=live|fixture`.

## 1 Interpreter
Input: entry text and date. Output: `JournalAnalysis`.
Prompt rules: be literal; extract, don't embellish; `notablePhrases` must be copied exactly; prefer concrete, drawable motifs; flag sensitivity honestly; never invent names.
Fallback: one moment = first sentence, mood "neutral", motifs = nouns found by a simple regex list, weather from keywords (rain/snow/sun).

## 2 Director
Context: analysis, entry text, style `{description, philosophy, rules, director.md, compositions (id, name, description, slot ids+roles+descriptions)}`, mascot `{description, character, poses (id, description, suits, avoid)}`, world `{description, motifs}`, `decorations.allowed`, personality, previous pages (last 3: compositionId, poseId, hero subject), quote candidates (Phase 9).
Output: `PageSpec` (PAGE-SPEC.md). The prompt restates the PRODUCT.md §3 heuristics.
Fallback: `hero-top`; hero = the highest-salience moment description; mascot `sit` (`umbrella` if rain, `sleep` if a "tired" mood); title = the first notable phrase or the weekday; raindrops if rain; no highlights.

## 3 Assets
Per brief (hero + spots), in parallel:
`prompt = fill(style.illustration.promptTemplate, {subject, composition, palette: words(colorRoles)+", off-white paper", mood})`. Size is chosen from the composition's `heroAspect` (spots use square). Call `ImageModel.generate({prompt, negativePrompt, size})` → PNG bytes → `repo.putAsset` (sha256) → `AssetRef`. One retry. On failure, the asset is `failed`, and the compiler drops that element (for the hero, it swaps in a larger atmosphere wash + the mascot in the hero slot).
**Only the brief goes to the image model, never the entry text.**

## 4 Compiler (pure, `src/compiler/`)
`compile({spec, analysis, style, mascot, world, assets, seed, date, entryText, rendererVersion}) → RenderPlan`:
- slots → boxes (+ imperfection jitter from `rng(hashSeed(seed, id))`);
- colour roles → hex; wash blooms: 3–6 blooms placed behind the hero box and the top of the text, colours from `washRoles`, count/alpha from `intensity`;
- highlight texts → char ranges (normalised matching);
- decorations without a slot → the first free decor slot;
- mascot facing toward the hero centre; caption into the `captionBox`;
- timeline per ANIMATION.md; ledger check → `validateRenderPlan`.
Called twice: at `spec` (asset sha256 null) and at final.

## 5 Fixture mode
`DIARY_AI=fixture`: the interpreter reads `fixtures/analyses/<key>.json`, the director reads `fixtures/pagespecs/<key>.json`, the image model returns `fixtures/assets/<briefId>.png`. The key is the sha256 prefix of the entry text, or `rain-cat` for the reference entry (with `default` as the fallback). Needed for UI/renderer work and tests.

## 6 Evaluation
`npm run eval` runs `fixtures/entries/*.txt` (8 varied entries: rain-cat, grief, busy work, party, quiet reading, travel, argument, "nothing happened") through the live pipeline. It writes `eval/<run>/<entry>/{analysis,pagespec,renderplan}.json` plus a Playwright screenshot, and a `contact-sheet.html`. The lead scores each on "feels like my day" (0–2) and the 8-dimension rubric.
