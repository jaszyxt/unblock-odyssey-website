#!/usr/bin/env python3
"""Sync website content from the game's canonical level data.

Reads  app/src/main/assets/levels/  (catalog.json + referenced packs),
writes website/data/levels/ (verbatim copies) and website/data/manifest.json
(structure, stats, featured samples). Never modifies the game.

Usage:  python website/tools/sync_from_game.py [--game-levels PATH] [--out PATH]
Exit codes: 0 = synced (per-pack warnings possible), 1 = hard failure.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_GAME_LEVELS = REPO_ROOT / "app" / "src" / "main" / "assets" / "levels"
DEFAULT_OUT = REPO_ROOT / "website" / "data"
CONFIG_PATH = Path(__file__).resolve().parent / "sync_config.json"


def load_config() -> dict:
    """Publish settings live in sync_config.json so a plain one-command refresh
    keeps the site's agreed scope (a capped slice, not the whole library)."""
    if CONFIG_PATH.is_file():
        try:
            cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
            return {k: v for k, v in cfg.items() if not k.startswith("_")}
        except (json.JSONDecodeError, OSError) as exc:
            print(f"WARNING: could not read {CONFIG_PATH.name} ({exc}); using built-in defaults")
    return {}

TRACK_ORDER = [
    "EXPLORER", "BUILDER", "PLANNER", "STRATEGIST",
    "ARCHITECT", "INNOVATOR", "VISIONARY",
]
TRACK_ALIASES = {"PRODIGY": "VISIONARY"}
VALID_SKILLS = {
    "PATH_CLEARING", "ONE_STEP_PLANNING", "MULTI_STEP_PLANNING",
    "BLOCKING_RELATIONSHIPS", "SEQUENCING",
}
ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
FILE_RE = re.compile(r"^[a-z0-9]+([-_][a-z0-9]+)*\.json$")


def difficulty_for_minimum_moves(min_moves: int) -> int:
    """Mirror of TrackDifficultyPolicy.difficultyForMinimumMoves."""
    if min_moves <= 1:
        return 1
    if min_moves <= 3:
        return 2
    if min_moves <= 5:
        return 3
    if min_moves <= 8:
        return 4
    return 5


def norm_track(track: str | None) -> str | None:
    if track is None:
        return None
    t = TRACK_ALIASES.get(track, track)
    return t if t in TRACK_ORDER else None


def block_cells(block: dict) -> list[tuple[int, int]]:
    if block.get("orientation") == "VERTICAL":
        return [(block["x"], block["y"] + i) for i in range(block["length"])]
    return [(block["x"] + i, block["y"]) for i in range(block["length"])]


def validate_level(level: dict, pack_track: str | None, ctx: str) -> list[str]:
    """Web-side mirror of the game's LevelContentSchema + GameRules validity checks."""
    errors: list[str] = []

    level_id = level.get("id")
    if not isinstance(level_id, str) or not ID_RE.match(level_id):
        errors.append(f"{ctx}: bad level id {level_id!r}")
        return errors

    grid = level.get("gridSize", 4)
    if not isinstance(grid, int) or not (2 <= grid <= 12):
        errors.append(f"{ctx}: gridSize {grid!r} outside 2..12")
        return errors

    exit_ = level.get("exit") or {}
    side = exit_.get("side")
    index = exit_.get("index")
    if side != "RIGHT":
        errors.append(f"{ctx}: exit side must be RIGHT (got {side!r})")
    if not isinstance(index, int) or not (0 <= index < grid):
        errors.append(f"{ctx}: exit index {index!r} invalid for grid {grid}")

    blocks = level.get("blocks")
    if not isinstance(blocks, list) or not blocks:
        errors.append(f"{ctx}: blocks must be a non-empty list")
        return errors

    seen_ids: set[int] = set()
    occupied: dict[tuple[int, int], int] = {}
    targets = 0
    target_block = None

    for block in blocks:
        bid = block.get("id")
        if not isinstance(bid, int) or bid in seen_ids:
            errors.append(f"{ctx}: block id {bid!r} missing or duplicate")
            continue
        seen_ids.add(bid)

        orientation = block.get("orientation")
        if orientation not in ("HORIZONTAL", "VERTICAL"):
            errors.append(f"{ctx} block {bid}: bad orientation {orientation!r}")
            continue
        length = block.get("length")
        if not isinstance(length, int) or not (1 <= length <= grid):
            errors.append(f"{ctx} block {bid}: length {length!r} invalid for grid {grid}")
            continue
        x, y = block.get("x"), block.get("y")
        if not isinstance(x, int) or not isinstance(y, int):
            errors.append(f"{ctx} block {bid}: x/y must be integers")
            continue

        is_target = bool(block.get("target", False))
        is_static = bool(block.get("static", False))
        if is_target and is_static:
            errors.append(f"{ctx} block {bid}: target block cannot be static")

        # In-bounds check: the target may overflow only on its exit side (RIGHT).
        for cx, cy in block_cells({"x": x, "y": y, "length": length, "orientation": orientation}):
            in_bounds = 0 <= cx < grid and 0 <= cy < grid
            if not in_bounds:
                overflow_ok = is_target and orientation == "HORIZONTAL" and cy == y and cx >= grid
                if not overflow_ok:
                    errors.append(f"{ctx} block {bid}: cell ({cx},{cy}) out of bounds")
            elif (cx, cy) in occupied:
                errors.append(
                    f"{ctx} block {bid}: overlaps block {occupied[(cx, cy)]} at ({cx},{cy})"
                )
            else:
                occupied[(cx, cy)] = bid

        if is_target:
            targets += 1
            target_block = (block, orientation, y)

    if targets != 1:
        errors.append(f"{ctx}: exactly one target block required (found {targets})")
    elif target_block[1] != "HORIZONTAL" or target_block[2] != index:
        errors.append(f"{ctx}: target must be HORIZONTAL on the exit row (y == exit.index)")

    meta = level.get("metadata") or {}
    if norm_track(meta.get("track")) is None:
        errors.append(f"{ctx}: bad metadata track {meta.get('track')!r}")
    if pack_track is not None and meta.get("track") != pack_track:
        errors.append(f"{ctx}: level track {meta.get('track')!r} != pack track {pack_track!r}")

    skills = meta.get("skills")
    if not isinstance(skills, list) or not (1 <= len(skills) <= 8) or len(set(skills)) != len(skills) \
            or any(s not in VALID_SKILLS for s in skills):
        errors.append(f"{ctx}: invalid skills {skills!r}")

    min_moves = meta.get("expectedMinimumMoves")
    authored = meta.get("authoredDifficulty")
    if not isinstance(min_moves, int) or min_moves <= 0:
        errors.append(f"{ctx}: expectedMinimumMoves must be a positive int")
    elif authored != difficulty_for_minimum_moves(min_moves):
        errors.append(
            f"{ctx}: authoredDifficulty {authored!r} != band {difficulty_for_minimum_moves(min_moves)}"
        )

    return errors


def validate_pack(pack_json: dict, catalog_entry: dict, file_name: str) -> list[str]:
    errors: list[str] = []
    if pack_json.get("id") != catalog_entry["id"]:
        errors.append(f"{file_name}: pack id {pack_json.get('id')!r} != catalog id {catalog_entry['id']!r}")

    pack_track = pack_json.get("track")
    if pack_track is not None and norm_track(pack_track) is None:
        errors.append(f"{file_name}: bad pack track {pack_track!r}")
        pack_track = None

    structure = pack_json.get("structure")
    levels = pack_json.get("levels")
    if not isinstance(levels, list) or not (1 <= len(levels) <= 100):
        errors.append(f"{file_name}: levels must be a list of 1..100")
        return errors

    if structure is not None:
        lc, pp = structure.get("levelCount"), structure.get("puzzlesPerLevel")
        if not isinstance(lc, int) or not isinstance(pp, int) or lc * pp != len(levels):
            errors.append(f"{file_name}: structure {structure!r} != levels length {len(levels)}")

    for level in levels:
        errors.extend(validate_level(level, pack_track, f"{file_name}:{level.get('id', '?')}"))

    return errors


def summarize_pack(pack_json: dict, included: list[dict]) -> dict:
    levels = pack_json["levels"]  # full pack — used for advertising stats
    grids: dict[int, int] = {}
    min_moves: list[int] = []
    for level in levels:
        grids[level.get("gridSize", 4)] = grids.get(level.get("gridSize", 4), 0) + 1
        mm = (level.get("metadata") or {}).get("expectedMinimumMoves")
        if isinstance(mm, int):
            min_moves.append(mm)

    sample_min_moves = [
        (l.get("metadata") or {}).get("expectedMinimumMoves")
        for l in included
        if isinstance((l.get("metadata") or {}).get("expectedMinimumMoves"), int)
    ]

    first = included[0]
    pos = first.get("journeyPosition") or {
        "level": (first.get("metadata") or {}).get("levelNumber", 1),
        "puzzle": (first.get("metadata") or {}).get("puzzleIndex", 1),
    }
    return {
        "puzzleCount": len(levels),
        "sampleCount": len(included),
        "gridSizes": sorted(grids),
        "gridHistogram": {str(k): v for k, v in sorted(grids.items())},
        "difficultyRange": [
            min((l.get("metadata") or {}).get("authoredDifficulty", 1) for l in levels),
            max((l.get("metadata") or {}).get("authoredDifficulty", 1) for l in levels),
        ],
        "minMovesRange": [min(min_moves), max(min_moves)] if min_moves else None,
        "sampleParRange": [min(sample_min_moves), max(sample_min_moves)] if sample_min_moves else None,
        "firstPuzzle": {
            "levelId": first["id"],
            "journeyPosition": pos,
            "puzzle": first,
        },
    }


def featured_for_tracks(tracks: list[dict]) -> list[dict]:
    featured = []
    for track in tracks:
        if not track["packs"]:
            continue
        pack = track["packs"][0]
        featured.append({
            "track": track["id"],
            "packId": pack["id"],
            "packTitle": pack["title"],
            "levelId": pack["firstPuzzle"]["levelId"],
            "journeyPosition": pack["firstPuzzle"]["journeyPosition"],
            "puzzle": pack["firstPuzzle"]["puzzle"],
        })
    return featured


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game-levels", type=Path, default=DEFAULT_GAME_LEVELS)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    cfg = load_config()
    parser.add_argument(
        "--levels-per-pack", type=int, default=int(cfg.get("levelsPerPack", 1)),
        help="How many levels (of each pack's journey) to publish as playable samples. "
             "The site is an advert + test bench, so 1 level (5 puzzles) per pack is the default.",
    )
    parser.add_argument(
        "--max-packs-per-track", type=int, default=int(cfg.get("maxPacksPerTrack", 0)),
        help="Publish only the first N packs of each track (catalog order). 0 = no cap. "
             "Keeps the site a tasting menu even as the game's library keeps growing.",
    )
    args = parser.parse_args()

    game_levels: Path = args.game_levels
    out: Path = args.out
    levels_per_pack = max(1, args.levels_per_pack)
    max_packs_per_track = max(0, args.max_packs_per_track)
    catalog_path = game_levels / "catalog.json"

    if not catalog_path.is_file():
        print(f"HARD FAIL: catalog not found at {catalog_path}", file=sys.stderr)
        return 1

    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    packs = catalog.get("packs") or []
    print(f"Catalog: {len(packs)} packs, schemaVersion {catalog.get('schemaVersion')}")
    cap_text = f"first {max_packs_per_track} packs/track" if max_packs_per_track else "no pack cap"
    print(f"Publish settings: {levels_per_pack} level(s)/pack, {cap_text} (from sync_config.json)")

    out_levels = out / "levels"
    out_levels.mkdir(parents=True, exist_ok=True)

    tracks: dict[str, dict] = {
        t: {"id": t, "packs": []} for t in TRACK_ORDER
    }
    failed: list[tuple[str, str]] = []
    copied: set[str] = set()
    catalog_puzzles = 0          # every puzzle in the game's catalog
    total_samples = 0            # what the site actually publishes
    published_per_track: dict[str, int] = {t: 0 for t in TRACK_ORDER}
    catalog_packs_per_track: dict[str, int] = {t: 0 for t in TRACK_ORDER}

    for entry in packs:
        pack_id = entry.get("id", "?")
        file_name = entry.get("file", "")
        ctx = f"pack {pack_id}"
        if not FILE_RE.match(file_name):
            failed.append((pack_id, f"bad file name {file_name!r}"))
            continue
        src = game_levels / file_name
        if not src.is_file():
            failed.append((pack_id, f"referenced file missing: {file_name}"))
            continue
        try:
            pack_json = json.loads(src.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            failed.append((pack_id, f"unreadable JSON: {exc}"))
            continue

        errors = validate_pack(pack_json, entry, file_name)
        if errors:
            failed.append((pack_id, f"{len(errors)} validation error(s), first: {errors[0]}"))
            continue

        # Track resolution happens before publishing because the pack cap is
        # applied per track (catalog order decides which packs make the cut).
        track = norm_track(pack_json.get("track"))
        if track is None:
            level_tracks = {
                norm_track((l.get("metadata") or {}).get("track")) for l in pack_json["levels"]
            }
            track = next((t for t in level_tracks if t), None)
        track = track or "EXPLORER"

        # Catalog-wide totals stay honest even for packs the site does not publish.
        catalog_puzzles += len(pack_json["levels"])
        catalog_packs_per_track[track] += 1

        # The website is an advert + test bench: publish only the first
        # `max_packs_per_track` packs of each track (0 = no cap).
        if max_packs_per_track and published_per_track[track] >= max_packs_per_track:
            continue

        # ...and only the first N levels inside each published pack.
        included = [
            l for l in pack_json["levels"]
            if (l.get("journeyPosition") or {}).get("level", 1) <= levels_per_pack
        ]
        site_pack = dict(pack_json)
        site_pack["levels"] = included
        site_pack.pop("structure", None)
        (out_levels / file_name).write_text(
            json.dumps(site_pack, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8", newline="\n",
        )
        copied.add(file_name)
        published_per_track[track] += 1

        titles = (entry.get("presentation") or {}).get("title") or {}
        title = titles.get("en") or pack_id
        title_fil = titles.get("fil")

        summary = summarize_pack(pack_json, included)
        tracks[track]["packs"].append({
            "id": pack_id,
            "file": file_name,
            "title": title,
            "titleFil": title_fil,
            "required": bool(entry.get("required", True)),
            "levelCount": (pack_json.get("structure") or {}).get("levelCount"),
            "puzzlesPerLevel": (pack_json.get("structure") or {}).get("puzzlesPerLevel"),
            **summary,
        })
        total_samples += summary["sampleCount"]

    # Remove synced files the catalog no longer references.
    for stale in out_levels.glob("*.json"):
        if stale.name not in copied and stale.name != "catalog.json":
            stale.unlink()
            print(f"Removed stale pack: {stale.name}")
    # The published catalog describes exactly what the site publishes, so it
    # never references pack files that are not here. The full game's totals
    # live in manifest.json (packsDeclared / puzzlesInGame).
    site_catalog = dict(catalog)
    site_catalog["packs"] = [
        {**entry, "file": entry["file"]}
        for entry in packs
        if entry.get("file") in copied
    ]
    (out_levels / "catalog.json").write_text(
        json.dumps(site_catalog, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8", newline="\n"
    )

    track_list = []
    for t in TRACK_ORDER:
        packs_for_track = tracks[t]["packs"]
        track_list.append({
            "id": t,
            "packCount": len(packs_for_track),
            "packsInGame": catalog_packs_per_track[t],
            "puzzleCount": sum(p["puzzleCount"] for p in packs_for_track),
            "sampleCount": sum(p["sampleCount"] for p in packs_for_track),
            "packs": packs_for_track,
        })

    grid_histogram: dict[str, int] = {}
    for t in track_list:
        for p in t["packs"]:
            for g, n in p["gridHistogram"].items():
                grid_histogram[g] = grid_histogram.get(g, 0) + n

    manifest = {
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "source": str(game_levels),
        "catalogSchemaVersion": catalog.get("schemaVersion"),
        "levelsPerPack": levels_per_pack,
        "packsPerTrackLimit": max_packs_per_track,
        "stats": {
            "tracks": sum(1 for t in track_list if t["packCount"]),
            "packs": len(copied),
            "packsDeclared": len(packs),
            "puzzles": total_samples,
            "puzzlesInGame": catalog_puzzles,
            "gridHistogram": grid_histogram,
        },
        "tracks": track_list,
        "featured": featured_for_tracks(track_list),
    }
    (out / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n"
    )

    cap_note = f", capped to {max_packs_per_track}/track" if max_packs_per_track else ""
    print(f"Synced {len(copied)} of {len(packs)} catalog packs{cap_note} -> {out}")
    print(f"Playable samples: {total_samples} ({levels_per_pack} level(s)/pack) · "
          f"full game: {catalog_puzzles} puzzles")
    print(f"Featured samples: {len(manifest['featured'])}")
    for pack_id, reason in failed:
        print(f"FAILED PACK (excluded): {pack_id} — {reason}")
    print("Sync complete." if not failed else "Sync complete with excluded packs.")
    return 0 if copied else 1


if __name__ == "__main__":
    sys.exit(main())
