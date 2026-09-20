# Update Runbook — "The game changed, now what?"

The website renders everything from JSON. Puzzle content is **never hard-coded**, so almost every
game change is handled by re-running one command.

## Level content changed (levels, packs, catalog, new track packs)

```bash
python website/tools/sync_from_game.py
```

The script:

1. Reads `app/src/main/assets/levels/catalog.json` and every pack file it references.
2. Validates **every** catalog pack against the web schema (grid size, exit, block overlaps, one
   target, etc.) — even packs the site does not publish, so a broken file is always reported.
3. Copies the packs inside the publish scope into `website/data/levels/` (removing packs that no
   longer exist) and writes a catalog describing exactly those packs.
4. Regenerates `website/data/manifest.json`: track → pack structure, titles, puzzle counts,
   grid/difficulty stats, and the featured sample puzzles.

Then commit the refreshed `website/data/` folder. Reload the site — done.

### Publish scope: `tools/sync_config.json`

The website is an **advert + test bench**, not a mirror of the whole library, so it publishes a
capped slice. That cap lives in the config file, which means the one-command refresh above keeps
the agreed scope even as the game's library keeps growing:

```json
{
  "levelsPerPack": 1,
  "maxPacksPerTrack": 10
}
```

- **`levelsPerPack`** — how many levels of each pack become playable samples (1 level = 5 puzzles).
- **`maxPacksPerTrack`** — publish only the first N packs of each track in catalog order. `0` = no cap.

Both can be overridden per run: `python website/tools/sync_from_game.py --max-packs-per-track 20`.

The manifest always reports the true size of the game alongside what the site publishes
(`stats.packs` vs `stats.packsDeclared`, `stats.puzzles` vs `stats.puzzlesInGame`), and the UI reads
those to say e.g. "70 of 140 packs playable". So when the game grows again, re-running the sync
updates those numbers automatically with no code change.

**Exit codes**: `0` = synced (warnings possible), `1` = hard failure (catalog missing/unreadable).
Validation failures are reported per pack; failed packs are **excluded** from the manifest so the
site never breaks, and are listed in the script output.

## Track set changed (a track added/renamed/removed)

Handled automatically for packs (the manifest is rebuilt from the catalog). Only two curated edits
are needed in `website/data/theme.json`:

- `trackWorld`: map the new track id to a world id (`city-cars`, `magic-forest`, `space-explorer`,
  `clearspace`).
- `trackInfo`: display name + tagline for the new track.

## Visual brand or worlds changed (colors, heroes, new world)

Edit `website/data/theme.json` (single curated file — source values live in the game's
`design/GameThemeCatalog.kt` and `ui/theme/Color.kt`). Palette tokens for the site chrome itself are
in `website/src/styles/tokens.css` (mirroring `ui/theme`).

## Puzzle rules / schema contract changed (rare)

Update **one file**: `website/src/js/engine/schema.js` (constants + validator, mirroring
`LevelContentSchema.kt`), then `rules.js` / `solver.js` if movement semantics changed, then re-run
the sync script so validation re-checks all content. Run the in-browser test page
(`/tests/engine-tests.html`) after any engine change.

## Checklist for any game change

1. `python website/tools/sync_from_game.py` → expect `Sync complete` with 0 failed packs, and the
   printed publish settings to match `tools/sync_config.json`.
2. Serve (`python -m http.server 8080` from `website/`) and spot-check Home stats + one puzzle.
3. Open `/tests/engine-tests.html` → all green.
4. Commit `website/data/` (and any theme edit) — the game folder stays untouched.
