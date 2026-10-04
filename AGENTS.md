<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the game menu and action-driven tutorial as client-side presentation state in the desktop shell; this lets players switch between the guided sandbox and any level without changing saved gameplay progress.
- Keep the retro-OS palette and physical borders/shadows in semantic CSS tokens and shared retro controls; this keeps every game window visually consistent.
- Keep the live character evaluator in a server function using the Lovable AI Gateway and keep the offline evaluator selectable in Admin; this protects the key and preserves an offline demo when the provider declines the scenario.
- Keep reply reveal progress in the game store and defer outcomes until it finishes; this makes typing continuous across tabs and lets players read the answer before a result appears.
- Keep HEX_ROOT guidance local, spoiler-safe, and session-only while persisting only the hint toggle and Bit-Credit wallet; this avoids leaking solutions or retaining guide conversations.
- Generate incident report images in the browser from game state; this keeps report export instant and independent of a server or account.

- Keep Intel badge metadata in level intel and render guide conversations with AI Elements while leaving guide answers local and spoiler-safe; this makes case reading scannable without changing progression.
- Keep difficulty as client-side presentation state in the desktop shell and fall back to curated suggested moves when the live model returns defensive advice; this keeps Rookie mode solvable.
- Keep Recon Swipe isolated in the Briefing tab with case cards in src/game/briefing.ts and a first-open full-screen overlay; this teaches only the essential solve facts without changing Intel.
