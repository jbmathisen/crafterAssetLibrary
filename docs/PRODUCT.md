# PRODUCT — Personal Visual Diary

> "A book that remembers your life in pictures."

## 1. The one sentence

The user writes about their day. The diary turns it into an illustrated notebook page that **paints itself in front of them**, and keeps it, in a book that looks and feels like *theirs*.

## 2. What the product is (and is not)

The product is the **artifact**: a persistent, illustrated diary page.

| It is | It is not |
|---|---|
| a physical-feeling notebook | a chatbot |
| a page that is *made* while you watch | an AI image with text pasted on |
| one consistent book across days | a gallery of unrelated AI images |
| quiet, personal, slow | a productivity / journaling SaaS dashboard |

The AI is not the product. We don't show chat, sparkle icons, "generating..." bars, or model names. The AI's work shows up only as the page.

## 3. Emotional success criterion (the only one that matters for the MVP)

The user writes something real and sees a page that makes them say:

> **"That feels like my day."**

Heuristics that serve this (these are product rules, used by the Page Director):

1. **Their words, verbatim.** The journal text is shown exactly as written. The page title and highlights are taken from the user's own phrases wherever possible. We never rewrite the entry.
2. **One hero, a few witnesses.** Each page has ONE dominant image: the most emotionally salient *concrete* moment of the day (e.g. "the orange cat outside the café in the rain"). Up to two small spot drawings and a few decorations act as witnesses. A collage of everything mentioned is a failure.
3. **The feeling, not only the facts.** Mood sets palette temperature, wash intensity, mascot pose and pacing. "Exhausted but strangely happy" means a warm lamp-light accent against cool rain, and a tired but content mascot.
4. **Specific over generic.** "Orange cat outside a café" beats "a cat". "Walked home in the rain" beats "rain".
5. **The same book.** Style, paper, handwriting, palette family and mascot stay the same across days. Only the day changes.
6. **Made by hand.** Imperfection, slowness and order: paper, then ink, then paint. Never a spinner.

## 4. Core concepts

- **Diary**: one book. It has a persistent **Visual Identity**:
  - **Style**: medium, typography, palette, paper, grid, marks, composition templates, animation feel (e.g. *Techo Watercolour*).
  - **World**: a motif vocabulary and accent bias (ocean, forest, city, botanical, dreamlike). It flavours decorations and backgrounds, never the entry's facts.
  - **Mascot**: a persistent companion *character* (whale, cat, owl...). It appears on every page in a pose chosen for the day.
  - **Personality**: quiet / playful / melancholic / whimsical / reflective. It biases the Director's choices of pose, pacing and decoration density.
- **Entry**: the raw text the user wrote for a date.
- **Page**: the illustrated artifact for a date. A page is **reproducible** and doesn't change when reopened. The user can explicitly **Regenerate**, which creates a new *generation* and keeps the old ones.
- **Quote/Reflection** (later, optional): "Something the day reminded you of". Only real quotations, correctly attributed, from a verified corpus. Never generated.

## 5. User journey (vertical slice)

1. Open the diary. A notebook on a desk. (Slice: identity is preset. Later: onboarding to choose style and mascot.)
2. Today's page is blank paper with the date. The user writes in a paper-like text area, not a form.
3. They close the entry ("put the pen down").
4. The page begins to make itself immediately: paper settles, the date is inked, the words are written in, washes bloom, the hero illustration is painted stroke by stroke, the mascot is drawn, then small decorations, then the optional quote. About 20–30 s. It can be sped up (2×) or skipped by clicking.
5. The finished page stays. Reopening it shows the finished page instantly; it only draws itself the first time.
6. (Phase 8) Turn back through previous days like a book.

## 6. Scope of the first vertical slice

ONE style (`techo-watercolor`) + ONE mascot (`whale`, named "Mori") + ONE entry flow + ONE page + ONE progressive animation.

Reference entry:

> "Today I walked home in the rain and saw an orange cat outside a café. I was exhausted but strangely happy."

Expected page: date header, the verbatim text in handwriting, a title drawn from the user's words (e.g. *"strangely happy"*), a painted hero of the orange cat outside a warm-lit café in rain, cool rain washes with one warm accent, Mori the whale holding an umbrella, raindrop and washi decorations, an optional small quote, all revealed progressively.

## 7. Non-goals for the slice

Multi-user accounts, auth, sync, mobile apps, multiple styles, custom mascots, onboarding, page-turn navigation (Phase 8), quotes (Phase 9 unless cheap), sharing/export, sound.

## 8. Principles for sensitive entries

Diaries contain grief, illness, conflict, and sometimes crisis. The Interpreter flags `sensitivity`. When it is `high`, the Director must:
- choose a gentle pose (sit, sleep) and slow pacing, with no whimsy props;
- illustrate a symbolic, calm subject (a window, a cup, a tree) rather than depicting pain;
- never caption or editorialise the user's feelings;
- skip quotes unless one is clearly consoling and from the corpus.

(Crisis-resource handling is a product decision and still open. See DECISIONS.md, OPEN-003.)

## 9. Privacy

Entries are sent to third-party AI providers (text model, image model). The only thing sent to the image model is the **illustration brief** (subject, composition, mood), never the raw entry. Keys live server-side. Data is stored locally for the slice. This must be disclosed in the UI before first use (post-slice).
