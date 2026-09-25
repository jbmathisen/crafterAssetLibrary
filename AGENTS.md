# AGENTS — rules for implementation agents

1. Read `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and the docs your task references before coding.
2. Do only your task in `docs/TASKS.md`. Respect its non-goals.
3. Accepted ADRs are binding. If you can't comply, stop and write `ESCALATION: <problem, options>` in your report. Don't redesign.
4. Schemas in `src/shared/schemas` are the contracts. Don't change a schema without an ESCALATION.
5. No `Math.random`/`Date.now` in `src/renderer` or `src/compiler`. Use `rng(seed)` and `hashSeed`.
6. Style/mascot/prompt values live in `content/`, never hard-coded in code.
7. Don't copy code from the Hobonichi page; reimplement from `docs/RENDERER.md`.
8. No new runtime dependency without saying why in your report.
9. Finish with `npm run typecheck && npm run lint && npm test` green, plus screenshots for visual work.
