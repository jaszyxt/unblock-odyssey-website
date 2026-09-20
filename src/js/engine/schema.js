// Level schema contract — web mirror of the game's LevelContentSchema.kt /
// TrackDifficultyPolicy.kt. This is the single file to update if the game's
// content contract changes (see website/docs/UPDATING.md).

export const GRID_MIN = 2;
export const GRID_MAX = 12;

export const TRACKS = [
  'EXPLORER', 'BUILDER', 'PLANNER', 'STRATEGIST',
  'ARCHITECT', 'INNOVATOR', 'VISIONARY',
];

export const TRACK_ALIASES = { PRODIGY: 'VISIONARY' };

export const SKILLS = [
  'PATH_CLEARING', 'ONE_STEP_PLANNING', 'MULTI_STEP_PLANNING',
  'BLOCKING_RELATIONSHIPS', 'SEQUENCING',
];

export function normalizeTrack(track) {
  if (!track) return null;
  const t = TRACK_ALIASES[track] || track;
  return TRACKS.includes(t) ? t : null;
}

export function difficultyForMinimumMoves(minMoves) {
  if (minMoves <= 1) return 1;
  if (minMoves <= 3) return 2;
  if (minMoves <= 5) return 3;
  if (minMoves <= 8) return 4;
  return 5;
}

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function cellsOf(block) {
  const cells = [];
  for (let i = 0; i < block.length; i++) {
    cells.push(block.orientation === 'VERTICAL'
      ? [block.x, block.y + i]
      : [block.x + i, block.y]);
  }
  return cells;
}

// Mirrors GameRules.isValidPuzzle + the loader's per-field checks.
export function validateLevel(level) {
  const errors = [];
  if (!level || typeof level !== 'object') return ['level must be an object'];
  if (typeof level.id !== 'string' || !ID_RE.test(level.id)) {
    errors.push(`bad level id: ${JSON.stringify(level.id)}`);
    return errors;
  }

  const grid = level.gridSize ?? 4;
  if (!Number.isInteger(grid) || grid < GRID_MIN || grid > GRID_MAX) {
    errors.push(`gridSize ${grid} outside ${GRID_MIN}..${GRID_MAX}`);
    return errors;
  }

  const exit = level.exit || {};
  if (exit.side !== 'RIGHT') errors.push(`exit side must be RIGHT (got ${JSON.stringify(exit.side)})`);
  if (!Number.isInteger(exit.index) || exit.index < 0 || exit.index >= grid) {
    errors.push(`exit index ${exit.index} invalid for grid ${grid}`);
  }

  if (!Array.isArray(level.blocks) || level.blocks.length === 0) {
    errors.push('blocks must be a non-empty list');
    return errors;
  }

  const seenIds = new Set();
  const occupied = new Map();
  let targets = 0;
  let targetOk = false;

  for (const b of level.blocks) {
    if (!Number.isInteger(b.id) || seenIds.has(b.id)) {
      errors.push(`block id ${JSON.stringify(b.id)} missing or duplicate`);
      continue;
    }
    seenIds.add(b.id);

    if (b.orientation !== 'HORIZONTAL' && b.orientation !== 'VERTICAL') {
      errors.push(`block ${b.id}: bad orientation ${JSON.stringify(b.orientation)}`);
      continue;
    }
    if (!Number.isInteger(b.length) || b.length < 1 || b.length > grid) {
      errors.push(`block ${b.id}: length ${b.length} invalid for grid ${grid}`);
      continue;
    }
    if (!Number.isInteger(b.x) || !Number.isInteger(b.y)) {
      errors.push(`block ${b.id}: x/y must be integers`);
      continue;
    }
    const isTarget = b.target === true;
    const isStatic = b.static === true;
    if (isTarget && isStatic) errors.push(`block ${b.id}: target block cannot be static`);

    for (const [cx, cy] of cellsOf(b)) {
      const inBounds = cx >= 0 && cx < grid && cy >= 0 && cy < grid;
      if (!inBounds) {
        const overflowOk = isTarget && b.orientation === 'HORIZONTAL' && cy === b.y && cx >= grid;
        if (!overflowOk) errors.push(`block ${b.id}: cell (${cx},${cy}) out of bounds`);
      } else if (occupied.has(`${cx},${cy}`)) {
        errors.push(`block ${b.id}: overlaps block ${occupied.get(`${cx},${cy}`)} at (${cx},${cy})`);
      } else {
        occupied.set(`${cx},${cy}`, b.id);
      }
    }
    if (isTarget) {
      targets++;
      targetOk = b.orientation === 'HORIZONTAL' && b.y === exit.index;
    }
  }

  if (targets !== 1) errors.push(`exactly one target block required (found ${targets})`);
  else if (!targetOk) errors.push('target must be HORIZONTAL on the exit row (y == exit.index)');

  const meta = level.metadata || {};
  if (normalizeTrack(meta.track) === null) {
    errors.push(`bad metadata track ${JSON.stringify(meta.track)}`);
  }
  const skills = meta.skills;
  if (!Array.isArray(skills) || skills.length < 1 || skills.length > 8 ||
      new Set(skills).size !== skills.length || skills.some((s) => !SKILLS.includes(s))) {
    errors.push(`invalid skills ${JSON.stringify(skills)}`);
  }
  const minMoves = meta.expectedMinimumMoves;
  if (!Number.isInteger(minMoves) || minMoves <= 0) {
    errors.push('expectedMinimumMoves must be a positive int');
  } else if (meta.authoredDifficulty !== difficultyForMinimumMoves(minMoves)) {
    errors.push(
      `authoredDifficulty ${meta.authoredDifficulty} != band ${difficultyForMinimumMoves(minMoves)}`,
    );
  }

  return errors;
}
