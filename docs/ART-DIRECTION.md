# Art direction: felt craft

Brief: figurative, tactile craft
collage, not abstract watercolour. Designed for young writers (about 6–12).

## 1. Philosophy

A page is a **craft board**: cream cardstock with the day's words on a glued lined note, the
title on a cut cardstock banner, the date on a tag, and ONE collage scene made of real cut
pieces — felt, cotton print, cardstock, cellophane. The avatar, the companion and the mascot are
recurring felt figures; scenes *place* them so they are identical every day. Charm comes from
few pieces, clean hand-cut edges, real layer shadows and a stitch or two. The words stay flat,
near-black and readable; the craft happens around them, never on them.

## 2. Material vocabulary (`data-material`)

| material | feel | use for | avoid for |
|---|---|---|---|
| felt | soft, matt, slight fuzz | sky strips, ground, animals, bodies, hair, clothes, puddles, clouds, boots | anything that needs a sharp corner |
| cardstock | crisp, flat, clean corners | houses, roofs, boats, kites, banners, stars, windows, doors, umbrellas | soft creatures |
| cotton (+pattern) | printed fabric | ONE printed piece per drawing: a top, a bowl cloth, a blanket, the mascot's belly | more than one print per scene |
| cellophane | translucent, wet, iridescent | rain drops, puddle sheen, water in the boot, bubbles, glass, rainbows | solids |
| burlap | coarse weave | earth, sand, baskets, tree trunks, doormats | faces, sky |
| denim | heavy blue weave | jeans, bags, one big sea | small pieces |
| paper | thin, plain | tiny bits: a letter, a ticket, a note in a scene | large areas |

Rule of thumb: felt for what is soft or alive, cardstock for what is built, cellophane for
what is wet or shiny. A scene should use 2–4 materials, not all seven.

## 3. Colour (palette.roles, tuned to felt)

Felt is warm and a little dusty — never plastic-saturated. Board `paper` #F3EBDB (cream card).
- `ink` #4A3B30 dark-brown thread / dark felt (roofs, soles, tree trunks)
- `inkSoft` #8C7A68 taupe felt (roads, roofs) · `pencil` #C4B8A4 pale stone cardstock (houses, kerbs)
- `title` #3A2F28 handwriting on banner · `titleShadow` #E8C36A mustard
- `accentWarm` #D9534A tomato-red felt — THE emphasis (boots, collar, umbrella)
- `accentCool` #3F6E99 deep denim blue felt (puddles, sea, a door)
- `washWarm` #F2C94C yellow felt (raincoat, lit windows) · `washCool` #9FB4C7 grey-blue felt (sky, rain cellophane)
- `washGreen` #8DAF6E moss felt (grass, trees, a door) · `highlight` #F6E27F text marker
- `palette.text` #2B2622 near-black for handwriting. Title banner cardstock #EBC46A.

One colour leads per page (red boots / yellow coat / one blue sea); the rest are dusty neutrals.
≤ 4 brief roles + ink/inkSoft/pencil/paper.

## 4. Piece budgets (fill paths = cut pieces)

hero ≤ 45 · character pose ≤ 18 · spot ≤ 15 · lines (thread) ≤ 3 per drawing · maxPaths 70.
Fewer is better: the reference guide's INCORRECT examples are all "too many layers".

## 5. Characters

**The avatar (`characters/avatar`, 12–15 pieces/pose).** Chestnut felt bob with a
straight fringe cut as ONE piece (a U with a fringe edge, laid over the face). Round peach felt
face, two button eyes, rosy felt cheeks, stitched smile (open felt smile when jumping). Everyday:
sage cotton dot-print top, denim-blue felt skirt, lilac tights, dark shoes; a running stitch on
the hem. Rain (`jump`, `splash`): yellow felt raincoat with a stitched placket and two button
fastenings, red felt wellies, `splash` adds three cellophane drops. Poses face the reader; flip
freely. Recolour by palette keys only — never redraw her.
**The companion (`characters/companion`, 9–10 pieces).** the companion-tan felt bean body + round
head, ONE darker floppy ear, cream muzzle patch, button eye and nose, rosy cheek, red felt
collar, four stubby legs, tail up, a running-stitch seam along the back. Side view, faces right.
**The mascot (`characters/mascot`, 5–6 pieces).** v3 silhouette kept exactly (round head,
two-lobed fluke, fin as hand). Dusty-blue felt body, cream cotton belly with a running stitch
along its top, button eye, felt cheek, 2–3 pale cellophane spout drops that droop when tired.
Umbrella = red cardstock canopy on a twine handle.

## 6. Layering

Draw order = glue order, back → front: sky strip → far pieces (clouds, houses) → ground strips →
puddle/props → cast characters (compiler inserts them here) → `data-layer="front"` pieces
(splash, grass tufts, a table edge). Essential layers only: a house is body + roof + 1–2 windows +
door (≤ 5). No piece exists just to outline another. No shading pieces; the renderer's shadow
gives depth (`shade` group only for the small ground ellipse under characters).

## 7. Stitches and thread (`data-stitch`)

Thread is decoration you can count: `running` along one seam (hem, belly, kerb, back), `cross`
for a window pane or two, `blanket` on a blanket edge, `twine` for a handle, ladder or kite
string. Max 3 line paths per drawing; plain (un-stitched) lines only for a window cross.

## 8. Craft-board page

Board: cardstock surface, fine tooth, no paper curl. Title on a cut banner strip (mustard card),
slightly rotated. Date on a small tag top-left. Words on a glued lined note, drawn a little
larger than the text box, with a tape or glue shadow — **nothing may overlap the note**.
Compositions: `scene-board` (hero 340×236 top, three tag labels right + one under the scene's left
edge for low anchors like boots/puddle, banner, note below-left, spot + the mascot right) and `note-first` (banner, wide note, hero below-left, labels/spot column, the mascot
bottom-right). The hero is the star and gets the largest slot; text is second and generous.

## 9. Labels and particles

Labels are small paper tags placed in the label slots BESIDE the hero, thread arrow to an anchor
that exists in the SVG; ≤ 28 chars, the child's words; never on a drawing or the note.
Particles are felt-world objects: rain = small cellophane drops falling over `rain`, splash =
cellophane chips at `splash`, steam = pale felt curls, snow = white felt dots, bubbles =
cellophane rings. ≤ 2 per page, never glows.

## 10. DO / DON'T

DO: one scene a kid could build in ten minutes · place the avatar (and the companion if named) with a
pose that matches the action · one leading colour · clean simple closed shapes · cream board
showing around and between pieces (≈5% margin) · 2–4 anchors · a single stitch seam.
DON'T: redraw cast · multi-piece hair, fur or frayed edges · bulky stacks, outline pieces,
gradients, glows · text/letters/arrows/frames in SVGs · labels/tape on drawings or the note ·
stars/hearts on sad pages · more than 3 labels or 3 decorations · realistic faces or perspective.

## 11. Rubric (8 dimensions, 0–2; 13+ ships, 10–12 revise once, < 10 rebuild)

| dimension | 2 | 1 | 0 |
|---|---|---|---|
| medium_material | reads as cut felt/card/cellophane with lift | mostly, some flat-vector feel | painterly, glossy, photographic |
| cut_edges | clean hand-cut closed shapes, few pieces | tidy but fussy or slightly ragged | frayed, shredded, outline pieces |
| depiction_grammar | figurative kid-simple: hair one shape, button eyes, house = box + triangle | simple with adult detail creeping in | abstract blobs or realistic anatomy |
| layer_depth | clear back→front stack, essential layers only, cast in the right plane | one muddled overlap | bulky stacks or no depth |
| color_roles | ≤ 4 roles, one leading colour, dusty felt hues | 5 roles or muddled emphasis | saturated plastic / wrong roles |
| composition | board shows, one clear subject, anchors sensible, cast well placed and scaled | slightly cramped or two subjects | fills the box, cast floating |
| signature_details | 2–3 charming pieces (lit windows, collar, spout drops) | 1 or too many | none or fussy texture |
| exclusions | no text/frames/faces on scenery/glows, nothing on note | one minor slip | any hard DON'T |

