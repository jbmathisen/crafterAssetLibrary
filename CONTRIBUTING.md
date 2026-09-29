# Contributing

New felt pieces are very welcome. By contributing you agree to release your work under CC0.

## Adding an item

1. **Check first.** Search `manifest.json`. If something close exists, improve it rather than adding a near-duplicate.
2. **Draw it in the conventions.** Write `items/source/<id>.svg` following
   [docs/SVG-CONVENTIONS.md](docs/SVG-CONVENTIONS.md): `viewBox="0 0 200 200"`, one path per cut piece, palette roles
   from `tokens/felt-craft.json`, at most 15 pieces and 3 thread lines. Hand-drawn or LLM-generated
   ([docs/GENERATING.md](docs/GENERATING.md)) are both fine.
3. **Describe it.** Add an entry to `items/items.json` and `manifest.json` with an `id`, a one-line `description`
   (what a search would look for) and 2–5 `tags`.
4. **Bake and preview.** Run `node scripts/bake-flat.mjs` to create the flat SVG. Add a PNG preview
   (600×600, transparent) if you can render one.
5. **Open a pull request** with a screenshot.

## Review checklist

- Reads as cut felt, card or cellophane, not a vector illustration: simple closed shapes, no gradients.
- One leading colour; four roles at most, plus ink, inkSoft, pencil and paper.
- No text, logos, brands, real people or frames.
- Kid-friendly and kind.
