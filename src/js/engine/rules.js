// Puzzle rules — web mirror of game-engine GameRules.kt semantics:
// blocks slide only along their orientation, cannot pass through each other,
// a drag of any distance counts as one move, and the board is "solved" when
// the target's path to the RIGHT exit is free of other blocks.

import { cellsOf } from './schema.js';

export function occupancyKey(x, y) {
  return `${x},${y}`;
}

export function occupancyOf(blocks, exceptId = null) {
  const occ = new Map();
  for (const b of blocks) {
    if (exceptId !== null && b.id === exceptId) continue;
    for (const [cx, cy] of cellsOf(b)) occ.set(occupancyKey(cx, cy), b.id);
  }
  return occ;
}

export function findTarget(blocks) {
  return blocks.find((b) => b.target === true) || null;
}

// Solved-board condition (GameRules): no non-target block occupies any cell
// on the exit row at x >= target.x + target.length.
export function isPathClear(puzzle, blocks) {
  const t = findTarget(blocks);
  if (!t) return false;
  const occ = occupancyOf(blocks, t.id);
  const row = puzzle.exit.index;
  for (let x = t.x + t.length; x < puzzle.gridSize; x++) {
    if (occ.has(occupancyKey(x, row))) return false;
  }
  return true;
}

// Contiguous legal range from the block's current position. The walk is
// cell-by-cell so a block can never jump over another block.
export function allowedRange(puzzle, blocks, id) {
  const b = blocks.find((o) => o.id === id);
  if (!b || b.static) return null;
  const occ = occupancyOf(blocks, id);
  const hi = puzzle.gridSize - b.length;
  const along = b.orientation === 'HORIZONTAL' ? b.x : b.y;

  const free = (pos) => {
    for (let i = 0; i < b.length; i++) {
      const cx = b.orientation === 'HORIZONTAL' ? pos + i : b.x;
      const cy = b.orientation === 'VERTICAL' ? pos + i : b.y;
      if (occ.has(occupancyKey(cx, cy))) return false;
    }
    return true;
  };

  let min = along;
  while (min - 1 >= 0 && free(min - 1)) min--;
  let max = along;
  while (max + 1 <= hi && free(max + 1)) max++;
  return { axis: b.orientation === 'HORIZONTAL' ? 'x' : 'y', min, max, current: along };
}

export function canSlideTo(puzzle, blocks, id, pos) {
  const r = allowedRange(puzzle, blocks, id);
  return !!r && pos >= r.min && pos <= r.max;
}

// Returns a new blocks array (original untouched) or null if illegal.
export function applySlide(puzzle, blocks, id, pos) {
  if (!canSlideTo(puzzle, blocks, id, pos)) return null;
  return blocks.map((b) => (b.id === id
    ? (b.orientation === 'HORIZONTAL' ? { ...b, x: pos } : { ...b, y: pos })
    : { ...b }));
}

export function stateKey(blocks) {
  return blocks.map((b) => `${b.id}:${b.x},${b.y}`).sort().join('|');
}
