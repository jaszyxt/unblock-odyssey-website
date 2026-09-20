# Unblock Odyssey — Project Website

A standalone companion website for the **Unblock Odyssey** Android game. It showcases the game and lets anyone **play real sample puzzles** from the game's own level data directly in the browser.

This project is fully self-contained inside `website/` and never modifies the Android game. All puzzle content is **generated from the game's canonical data** — when the game changes, one command refreshes the website.

## Scope: an advert + test bench, not the full game

The site publishes **the first level of the first 10 packs of each track (5 puzzles × 70 packs = 350 playable samples)** so people can test every kind of challenge. The full library (7,000 puzzles across 140 packs) lives in the app, and every screen says so — the home page reads "70 of 140 packs playable". Publish scope is set in `tools/sync_config.json`; see [docs/UPDATING.md](docs/UPDATING.md).

## Highlights

- 🎮 **Real, playable puzzles** — the actual game rules (drag to slide, snap to cells, static walls, exit gate, drive-out win) implemented as a faithful web port, running the game's own level files.
- 🧠 **True Par** — the site computes each puzzle's real optimal move count with a built-in A* solver and warns that the game's authored metadata can differ (the generator's BFS allows jumping; the site does not).
- 🔄 **Data-driven by design** — pages, stats, featured puzzles, and the sample library all render from JSON in `data/`. No puzzle content is ever hard-coded.
- 🌍 **World theming** — City Cars, Magic Forest, Space Explorer, and Clearspace palettes, gradients, and heroes mirror the game's visual identity.
- 🗣️ **Bilingual (EN / FIL)** — matches the game's localization; toggle with the language button in the header. Track/world taglines carry Filipino variants in `data/theme.json`; synced pack titles fall back to English when the game data has no Filipino text yet.
- ♿ **Kid-friendly & accessible** — big touch targets, keyboard play (arrow keys), high-contrast mode, reduced-motion mode, light/dark themes, fully responsive down to small phones.
- 🧪 **Self-testing** — an in-browser test suite validates the engine and every synced pack.

## Run it locally

```bash
cd website
python tools/serve.py 8123     # serves with caching disabled (best for development)
# or: python -m http.server 8080
```

Then open <http://127.0.0.1:8080> (or the port you chose).

> ES modules + `fetch` require `http://` — opening `index.html` directly via `file://` will not work.
> The site is also host-ready for any static host (GitHub Pages, Netlify, etc.) — deploy the `website/` folder as-is.

## Update the website when the game changes

```bash
python website/tools/sync_from_game.py
```

That single command re-reads `app/src/main/assets/levels/` (catalog + all packs), regenerates `website/data/`, validates every file against the web schema, and rebuilds the manifest (stats, track structure, featured samples). Commit the refreshed `data/` and the site is up to date — **no code changes needed**.

Full details: [docs/UPDATING.md](docs/UPDATING.md) · Design system: [docs/DESIGN.md](docs/DESIGN.md) · Hosting: [docs/HOSTING.md](docs/HOSTING.md)

## Layout

```
website/
├── index.html            # app shell (single-page, hash-routed)
├── data/                 # GENERATED from the game (committed)
│   ├── manifest.json     # content manifest + featured samples
│   ├── theme.json        # brand + world theming (curated mirror of the game)
│   └── levels/           # verbatim copy of game catalog + packs
├── src/
│   ├── styles/           # design tokens, base, components, world theming
│   └── js/
│       ├── engine/       # schema contract, rules, A* solver (game-faithful)
│       ├── game/         # board rendering, exit gate, session, audio
│       ├── ui/           # screens: home, browse, player, worlds, about
│       ├── data/         # manifest/pack store (fetch + cache)
│       └── main.js       # router + bootstrap
├── tools/
│   ├── sync_from_game.py # one-command content sync + validation
│   └── sync_config.json  # publish scope (levels per pack, packs per track)
├── tests/
│   └── engine-tests.html # in-browser engine tests + full-library validation
└── docs/                 # design system + update runbook + hosting notes
```

## Testing

Open <http://127.0.0.1:8080/tests/engine-tests.html> while the local server is running. It runs engine assertions (rules, solver, schema validation) and validates **every synced pack** against the web schema.

## Relationship to the game

| Area | Rule |
|---|---|
| Game source (`app/`, `game-engine/`, `content-authoring/`) | Read-only input. Never modified by this project. |
| Puzzle data | Copied verbatim from `app/src/main/assets/levels/` by the sync script. |
| Visual theming | Curated in `data/theme.json`, mirroring the game's `GameThemeCatalog`. |
| Rules fidelity | Mirrors `game-engine` `GameRules.kt` / `LevelSolver.kt` semantics. |
