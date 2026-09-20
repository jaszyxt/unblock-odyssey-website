// Static mini board preview for cards (non-interactive).

export function renderMiniBoard(container, puzzle, worldId, world, { cell = 20 } = {}) {
  const n = puzzle.gridSize;
  const rim = Math.max(4, Math.round(cell * 0.2));
  const gap = 2;
  const size = n * cell;

  container.classList.add('mini-board');
  container.dataset.world = worldId;
  container.style.setProperty('--cell', `${cell}px`);
  container.style.setProperty('--exit-row', String(puzzle.exit.index));
  container.style.width = `${size + rim * 2}px`;

  const grid = document.createElement('div');
  grid.className = 'board-grid';
  grid.style.width = `${size}px`;
  grid.style.height = `${size}px`;

  const gapEl = document.createElement('div');
  gapEl.className = 'exit-gap';
  grid.appendChild(gapEl);

  for (const b of puzzle.blocks) {
    const el = document.createElement('div');
    el.className = 'block' + (b.target ? ' target' : '') + (b.static ? ' static-block' : '');
    if (!b.target && !b.static) {
      el.style.setProperty('--c', world.blockers[b.id % world.blockers.length]);
    }
    const horizontal = b.orientation === 'HORIZONTAL';
    el.style.left = `${b.x * cell + gap / 2}px`;
    el.style.top = `${b.y * cell + gap / 2}px`;
    el.style.width = `${(horizontal ? b.length * cell : cell) - gap}px`;
    el.style.height = `${(horizontal ? cell : b.length * cell) - gap}px`;
    grid.appendChild(el);
  }

  // The frame gets its own inline rim + width: the shared .board-frame rule
  // defines a --rim clamp that would otherwise override the container value
  // and make the grid overflow the frame.
  const frame = document.createElement('div');
  frame.className = 'board-frame';
  frame.style.setProperty('--rim', `${rim}px`);
  frame.style.width = `${size + rim * 2}px`;
  frame.style.padding = `${rim}px`;
  frame.appendChild(grid);
  container.appendChild(frame);
}
