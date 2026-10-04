# Project Zero-Day: Syndicate — Playable MVP

A retro Windows-98-style corporate desktop ("OmniDesk 98") where the player social-engineers AI-driven OmniCorp employees to extract a guarded secret in each of 4 levels.

## What gets built

**The desktop shell**
- Full-screen beige desktop with a single draggable window: "OmniDesk Enterprise Messenger v2.1" — beveled grey chrome (#C0C0C0), navy gradient title bar (#000080), chunky minimize/maximize/close buttons, retro scrollbars, monospace type.
- Top bar: system menu, "OmniWAN-Corp" network badge, token-budget battery meter, and an [F12: ADMIN] button (F12 key also opens it).
- Three tabs: OmniChat, Dossier & Intel, Admin Control.
- Mobile: the window fills the screen, sidebar and inspector collapse into toggleable drawers.

**OmniChat**
- Left: channel directory (#it-support, #helpdesk, #hr-internal, #exec-incidents) plus active targets for the current level.
- Center: message feed with sender badge, timestamp, and typewriter text output; system/security lines in terminal green on dark.
- Right: live Trust / Panic / Suspicion gauges for the active character, colour-shifting toward amber/red as suspicion climbs.
- Bottom "injection deck": identity-spoof dropdown (per-level allowed aliases), multiline input, live token cost preview, "Execute Injection" button.

**Game loop**
- All 4 levels from the supplied dataset: Onboarding Sandbox, The Panicked Intern, The Overworked HR Specialist, The Executive Cold War (two characters in one channel, both react to each message).
- Each send deducts tokens. Characters reply in character and return hidden stat changes plus one of: reply, compliance challenge, alert security, leak secret.
- Win: the secret appears → modal "SECURITY COMPROMISED // LEVEL COMPLETE" with the educational takeaway and a next-level button.
- Lose: suspicion ≥ 80 or tokens exhausted → "INTRUSION DETECTED // AUDIT FAILED" with retry.

**Dossier & Intel tab**
- Level briefing, objective, and leaked artifacts rendered as retro document windows.

**Admin Control ("God mode")**
- Jump to any level; sliders to override Trust/Panic/Suspicion; view of the character's hidden internal thought for each turn; force-win button; toggle between the real AI engine and an offline mock evaluator; temperature control.

**Saving**
- Levels completed, best token scores, and the engine/admin toggles persist in this browser. A "Reset audit" action clears them.

## Technical notes

- Level data typed exactly per the supplied `NPCState` / `LevelDossier` / `GameLevel` interfaces, stored in `src/game/levels.ts`.
- Turn engine: a server function (`src/lib/agent.functions.ts`) builds the master system prompt from the character's persona plus current stats and calls Lovable AI (default `openai/gpt-6-astra`) with a strict JSON schema: `internal_thought`, `stat_changes`, `action`, `message_body`. Handles rate-limit/credit errors with in-world system messages.
- Mock evaluator (`src/game/mockEvaluator.ts`) implements the same contract with keyword/identity heuristics so the game is fully playable and demo-safe without any API call; admin toggle chooses the path.
- Game state in a reducer + context (`src/game/store.ts`), persisted to browser storage behind a hydration-safe hook.
- Retro look implemented as design tokens in `src/styles.css` (grey canvas, navy, terminal green, amber/red) plus small bevel utilities; no hardcoded colours in components.
- Routes: `/` (the desktop shell with tabs). Per-route head metadata set for the game.

## Not in this build

HEX_ROOT hint bot, OmniMap intel graph, bribery/dark-store economy, and the shareable incident-report card — all layered on later without reworking the core.
