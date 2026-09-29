# Generating new felt assets with an LLM

The library grows by generating only what is missing. Before drawing anything, look it up in `manifest.json`
(by id, tags or description). Reuse beats regeneration: it is free, instant and keeps every page consistent.

When something is genuinely new (a kite, a birthday cake, a bus), ask a capable model for **one SVG in the
conventions below**, validate it, render a preview, and add it to the library with tags.

## Prompt recipe

Give the model: the subject, the palette roles it may use (see `tokens/felt-craft.json`), the viewBox
(`0 0 200 200` for an item, `0 0 300 200` for a scene) and this brief:

> You are cutting and gluing a felt collage on a cream card board, not drawing. Every <path> in fill is ONE cut piece: give it data-material (felt for soft things, sky and animals; cardstock for houses, boats, stars and anything crisp; cotton with data-pattern dots|floral|gingham|stripes for one printed piece at most; cellophane for water, rain, bubbles, glass; burlap for earth, sand, baskets; paper for tiny bits). Build back to front: sky strip, ground strip, big background pieces, then the subject's pieces, last any splash or grass with data-layer="front". Pieces are simple closed shapes with clean outlines (a house is a rectangle and a triangle, a cloud is three bumps, a puddle is a flat oval): no inner detail lines, no texture, no gradients; the renderer adds the cut edge, the shadow and the fibre. Budget: hero <= 45 pieces, spot <= 15. Do not draw the avatar, companion or mascot: PLACE them with <g id="cast"><path data-character="avatar|companion" data-pose="..." data-scale="H" data-flip="0|1" d="M x y"/></g> where (x,y) is where their feet touch the ground in the scene and H is their height in viewBox units (avatar about 0.45 of scene height, the companion about 0.55 of the avatar). Lines are thread: use at most 3, as data-stitch="running|cross|blanket|twine" along one seam, a ladder or a kite string. Leave the cream board showing around the scene (about 5% margin) and between pieces; never fill the viewBox. Colours: only the brief's roles plus ink, inkSoft, pencil and paper. Add <g id="anchors"> with 2-4 named points (rain, splash, biscuit, boots, door) so labels and moving bits attach. No text, letters, arrows, frames or faces on scenery. Cut like a kid with scissors, not a machine: never a full-box rectangle for sky or ground; give big pieces a soft, uneven edge (a wavy hill top, a rounded sky patch) and let the board show around them. Pieces that keep moving once the page is made get data-motion: "fall" for felt rain drops or snow in the sky, "bob" for a boat or a balloon, "sway" for a flower or a kite.

Then ask for **only** the SVG. Check it against [SVG-CONVENTIONS.md](SVG-CONVENTIONS.md); if it breaks a rule, send
the errors back once and ask for a fix.

## Why this saves tokens

A full felt scene costs a few thousand output tokens. A library hit costs zero. Every new item you add makes the
next page cheaper, and every page built from shared pieces looks like it came from the same craft box.
