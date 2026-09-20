// Solver — web mirror of game-engine GameRules.kt interactive semantics:
// a "move" is one slide of a block to any reachable position along its axis
// (no jumping over other blocks), and the goal is a clear path for the target
// to the RIGHT exit — exactly how a player's drag behaves.
//
// NOTE: the game's authored `expectedMinimumMoves` metadata comes from the
// content generator's BFS, which allows blocks to jump over each other, so it
// can differ from the true interactive optimum. The website therefore
// computes Par itself with `solve(puzzle, blocks, { optimal: true })` and only
// falls back to the authored value if the search hits its node budget.
//
//   optimal: true  → uniform-cost A* (Dijkstra), minimum slide count.
//   default (w=4)  → weighted A*; fast, used for the Hint button.
//
// States are stored compactly (one position per movable block) so budgets of
// 1M+ nodes stay memory-safe. Very deep boards may exceed the budget —
// callers must treat `found: false` as "no hint available", never as error.

import { allowedRange, findTarget, isPathClear } from './rules.js';

class Heap {
  constructor() { this.a = []; }
  push(item) {
    const a = this.a;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    if (!a.length) return undefined;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

// Admissible (in steps): every distinct block standing on the target's exit
// path must move at least one cell.
function pathBlockerCount(puzzle, blocks) {
  const t = findTarget(blocks);
  const occ = new Set();
  for (const b of blocks) {
    if (b.target) continue;
    for (let i = 0; i < b.length; i++) {
      occ.add(b.orientation === 'VERTICAL' ? `${b.x},${b.y + i}` : `${b.x + i},${b.y}`);
    }
  }
  let n = 0;
  for (let x = t.x + t.length; x < puzzle.gridSize; x++) {
    if (occ.has(`${x},${puzzle.exit.index}`)) n++;
  }
  return n;
}

export function solve(puzzle, startBlocks, { maxNodes = 1200000, optimal = false } = {}) {
  if (isPathClear(puzzle, startBlocks)) return { found: true, moves: 0, path: [] };

  const base = startBlocks.map((b) => ({ ...b }));
  const movable = base.filter((b) => !b.static);
  const pos0 = new Int8Array(movable.length);
  movable.forEach((b, i) => { pos0[i] = b.orientation === 'HORIZONTAL' ? b.x : b.y; });

  // Mutating `base` in place is safe: every use re-writes fresh positions
  // from the node's compact state before computing ranges or goals.
  const layout = (pos) => {
    for (let i = 0; i < movable.length; i++) {
      const b = movable[i];
      if (b.orientation === 'HORIZONTAL') b.x = pos[i]; else b.y = pos[i];
    }
    return base;
  };
  const keyOf = (pos) => pos.join(' ');

  const w = optimal ? 1 : 4;
  const start = { pos: pos0, parent: null, move: null, g: 0, key: keyOf(pos0) };
  const heap = new Heap();
  heap.push([w * pathBlockerCount(puzzle, layout(pos0)), start]);
  // Mirror the game's LevelSolver.kt exactly: a best-cost map with reopening
  // (a state popped with a stale cost is skipped; cheaper re-discoveries win).
  const bestCost = new Map([[start.key, 0]]);
  let nodes = 1;

  while (heap.size && nodes < maxNodes) {
    const [, node] = heap.pop();
    if (node.g > (bestCost.get(node.key) ?? Infinity)) continue; // stale entry
    for (let i = 0; i < movable.length; i++) {
      // Restore the node's layout before EACH block: expansions below mutate
      // the shared base layout, so a stale layout would corrupt the ranges.
      const blocks = layout(node.pos);
      const b = movable[i];
      const range = allowedRange(puzzle, blocks, b.id);
      if (!range) continue;
      for (let p = range.min; p <= range.max; p++) {
        if (p === range.current) continue;
        const pos = node.pos.slice();
        pos[i] = p;
        const key = keyOf(pos);
        const g = node.g + 1; // one slide = one move (drag semantics)
        if (g >= (bestCost.get(key) ?? Infinity)) continue;
        bestCost.set(key, g);
        nodes++;
        const move = { id: b.id, x: b.orientation === 'HORIZONTAL' ? p : b.x, y: b.orientation === 'VERTICAL' ? p : b.y };
        const child = { pos, parent: node, move, g, key };
        if (isPathClear(puzzle, layout(pos))) {
          const path = [];
          for (let n = child; n.move; n = n.parent) path.unshift(n.move);
          return { found: true, moves: g, path };
        }
        heap.push([g + w * pathBlockerCount(puzzle, layout(pos)), child]);
      }
    }
  }
  return { found: false, moves: -1, path: [] };
}

// Best next move from an arbitrary (mid-play) state.
export function hint(puzzle, blocks) {
  const result = solve(puzzle, blocks);
  return result.found && result.path.length ? result.path[0] : null;
}
