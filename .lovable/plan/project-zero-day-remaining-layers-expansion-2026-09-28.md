# Project Zero-Day: Remaining Layers Expansion

Build the remaining planned systems while preserving the current menu, guided tutorial, retro-OS styling, and live/offline evaluator setup.

## Scope

### Intel page upgrades
- Make Intel feel like the investigation hub, not a static document page.
- Add a HEX_ROOT guide chatbox inside Intel.
  - One guide conversation per case.
  - No saved guide history after reload or case change.
  - Guidance only: it can explain concepts, point attention to relevant evidence, and warn about risky behavior, but it must not provide the exact solution text or secret.
- Add richer spoofable identity details:
  - What each identity represents.
  - Why the identity matters in OmniCorp's network.
  - Which target may recognize, fear, trust, or distrust it.
- Add a toggleable “General approaches” panel.
  - Hidden by default.
  - Shows broad strategy categories and risk notes without giving a direct answer.
- Expand level Intel with more usable context and non-text evidence:
  - Relationship cards, org/network map, simple charts, calendar blocks, incident cards, and redacted documents.
  - Keep evidence useful for solving while avoiding one-click spoilers.

### Layer 3: Intel graph + HEX_ROOT
- Add an OmniMap-style relationship graph to Intel using the game’s own level data.
- Show targets, spoofable identities, channels, reporting lines, pressure points, and trust/conflict links.
- Add HEX_ROOT guide behavior as a local, spoiler-safe assistant rather than a second live LLM call.

### Layer 4: Social exploit toolkit + economy
- Add Bit-Credits to the current run and saved progress.
- Add a Dark Store / exploit deck with a small set of playable tools:
  - Perk / gift-card distraction.
  - Emergency maintenance broadcast.
  - Spoof-signature support.
- Tools cost credits and apply transparent, bounded effects to Trust, Panic, or Suspicion.
- Keep the tools educational: each explains the defensive lesson after use.

### Layer 5: Incident report image card
- Add a downloadable retro incident-report image card on win or loss.
- Include case name, outcome, asset status, tokens used, exploit tools used, final target state, and the security takeaway.
- User choice: image card only, not PDF.

### Admin additions
- Add controls for the new systems where useful:
  - Enable/disable HEX_ROOT hints.
  - Add credits for testing.
  - Show exploit-use history.
- Keep the current live AI / mock evaluator selector.

## Technical notes

- Extend `GameLevel` data with Intel-specific fields: identity profiles, relationship graph nodes/edges, approach hints, and visual evidence blocks.
- Extend the game store with credits, exploit history, hint history, and actions for guide/tool use.
- Keep all new UI in the existing retro token system and shared controls.
- Do not add account-based storage or database-backed guide history.
- Do not reveal exact win phrases or secrets in HEX_ROOT or the approach panel.
- Add the incident card as a client-side generated image download from a visible report panel.

## Implementation order

1. Update roadmap and data types for Intel, economy, exploit tools, and reports.
2. Enrich all four levels with identity profiles, network relationships, approach categories, and non-text evidence blocks.
3. Rebuild Intel around briefing, OmniMap, evidence, identities, approach toggles, and HEX_ROOT.
4. Add credits and exploit-tool actions to the game store and mock/live turn flow.
5. Add Dark Store UI and integrate it into the desktop tabs.
6. Add incident-report card UI and image download from the outcome screen.
7. Update Admin controls for HEX_ROOT/tools/credits.
8. Verify desktop and mobile flows across all four levels.
