# SVG conventions

Every source SVG in this library is **data, not a picture**: colours are palette keys and every fill path is one cut
piece of a material. A felt renderer reads these attributes; the flat files in `svg/` folders are the same drawings
with colours baked in, for tools that just want an image.

## File shape

- Only `<path>` elements inside named groups. No rect/circle/transform/style/text; convert shapes to paths
  (circles as four cubic curves; arc commands are not used).
- `viewBox`: characters `0 0 100 100` (ground line at y = 94, facing right); items `0 0 200 200`; scenes `0 0 300 200`.
- Groups, in glue order (back to front):
  1. `<g id="fill">`: closed paths, each **one cut piece**.
  2. `<g id="shade">` (optional): a soft ground shadow under characters.
  3. `<g id="line">`: thread. At most 3 per drawing.
  4. `<g id="face">` (characters): eyes, cheeks, mouth. Small dark round fills become sewn-on buttons.
  5. `<g id="cast">` (scenes): places characters, see below.
  6. `<g id="anchors">` (optional): named points for labels and moving bits: `<path data-anchor="rain" d="M x y"/>`.

## Attributes

| attribute | on | values | meaning |
|---|---|---|---|
| `data-color` | every path | a palette key (characters: their own `palette`; items/scenes: a colour role or `paper`) | which colour |
| `data-material` | fill | `felt` `cotton` `cardstock` `burlap` `denim` `cellophane` `paper` | what it is cut from |
| `data-pattern` + `data-pattern-color` | cotton fill | `dots` `floral` `gingham` `stripes` + a colour key | a printed fabric (one per drawing) |
| `data-layer="front"` | fill | `front` | glued after the characters (splash, grass tuft) |
| `data-motion` | fill | `fall` `bob` `sway` | keeps moving once the page is made (rain drops fall, a boat bobs) |
| `data-stitch` | line | `running` `cross` `blanket` `twine` | draw as stitches or twine instead of a line |
| `data-w` | line | 0.2 – 4 | thread width multiplier |
| `data-stroke="1"` | face | | stroke instead of fill (a smile) |

## Placing characters in a scene

```svg
<g id="cast">
  <path data-character="avatar" data-pose="splash" data-scale="122" data-flip="0" d="M158 184"/>
</g>
```

`d="M x y"` is where the feet touch the ground, `data-scale` the character's height in viewBox units (avatar about
0.45 of the scene height, companion about 0.55 of the avatar), `data-flip="1"` mirrors it. Characters are never
redrawn inside a scene: placing them keeps them identical on every page.

## Budgets

Scene ≤ 45 pieces, item ≤ 15, character pose ≤ 18; lines ≤ 3. Fewer is better.
