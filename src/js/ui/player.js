// Puzzle player screen: board, HUD, undo/reset/hint, win flow.

import { store, findPuzzle, nextPuzzle } from '../data/store.js';
import { Board } from '../game/board.js';
import { sfx } from '../game/audio.js';
import { solve, hint } from '../engine/solver.js';
import { confetti, starsHtml } from './effects.js';
import { el, esc, diffDots } from './dom.js';
import { t, trackDisplay, packTitleDisplay, worldDisplay } from '../i18n.js';

const playerRoute = (packId, pos) => `#/puzzle/${packId}/${pos.level}/${pos.puzzle}`;

export async function renderPlayer(app, { params, navigate }) {
  const [manifest, theme] = await Promise.all([store.getManifest(), store.getTheme()]);
  const found = await store.getPack(params.packId);
  if (!found) { navigate('#/play'); return; }
  const { pack, track, json } = found;

  const level = Number(params.level);
  const puzzleNo = Number(params.puzzle);
  const puzzle = findPuzzle(json, level, puzzleNo);
  if (!puzzle) { navigate(`#/pack/${pack.id}`); return; }

  const info = trackDisplay(theme, track.id);
  let world = store.worldForTrack(theme, track.id);
  document.body.dataset.ambience = world.id;
  const meta = puzzle.metadata;
  const skillNames = (meta.skills || []).map((s) => theme.skills[s] || s);

  // Compute the true interactive Par: the fewest slides that really solve
  // this board (the game's authored metadata allows jumping, so it can drift
  // from real play). Falls back to the authored value on very deep boards.
  const optimal = solve(puzzle, puzzle.blocks, { optimal: true });
  const par = optimal.found ? optimal.moves : meta.expectedMinimumMoves;
  const next = nextPuzzle(json, level, puzzleNo);

  const screen = el(`
    <section class="screen screen-player">
      <div class="wrap">
        <div class="page-hero">
          <div class="crumbs">
            <a href="#/play">${t('crumbsAll')}</a> ·
            <a href="#/pack/${esc(pack.id)}">${esc(packTitleDisplay(pack))}</a>
          </div>
          <h1 style="font-size:clamp(1.5rem,3vw,2.1rem)">${t('playerLevel', { l: level, q: puzzleNo })}</h1>
          <div class="badge-row">
            <span class="chip chip-primary">${info.emoji} ${esc(info.name)}</span>
            <span class="chip">${esc(pack.title)}</span>
            <span class="chip">${puzzle.gridSize}×${puzzle.gridSize}</span>
            <span class="chip">${diffDots(meta.authoredDifficulty)} ${t('chipDifficulty', { d: meta.authoredDifficulty })}</span>
          </div>
          <div class="badge-row" style="margin-top:8px">
            ${skillNames.map((s) => `<span class="chip chip-teal">${esc(s)}</span>`).join('')}
          </div>
        </div>

        <div class="player-layout">
          <div>
            <div id="board-mount"></div>
            <p class="sample-note muted">${t('webSampleNote')}</p>
          </div>
          <div>
            <div class="card hud-card world-switcher">
              <span class="hud-label">${t('worldPick')}</span>
              <div class="world-chips">
                ${Object.entries(theme.worlds).map(([id, w]) => `
                  <button class="world-chip${id === world.id ? ' active' : ''}" data-world-id="${id}" aria-pressed="${id === world.id}">
                    ${w.hero.emoji} ${esc(worldDisplay(w).displayName)}
                  </button>`).join('')}
              </div>
            </div>
            <div class="card hud-card">
              <div class="hud-row">
                <span class="hud-label">${t('hudMoves')}</span>
                <span class="hud-value" id="hud-moves">0</span>
              </div>
              <div class="hud-row">
                <span class="hud-label">${t('hudPar')}</span>
                <span class="hud-value">${par}${t(par > 1 ? 'parUnits' : 'parUnit')}</span>
              </div>
              <div class="hud-row">
                <span class="hud-label">${t('hudGate')}</span>
                <span class="hud-value" id="hud-gate">${t('gateBlocked')}</span>
              </div>
              <p class="muted" id="hud-status" style="margin:12px 0 0" aria-live="polite">
                ${t('statusStart')}
              </p>
              <div class="action-row">
                <button class="btn btn-soft btn-sm" id="btn-undo" disabled>${t('btnUndo')}</button>
                <button class="btn btn-soft btn-sm" id="btn-reset">${t('btnReset')}</button>
                <button class="btn btn-soft btn-sm" id="btn-hint">${t('btnHint')}</button>
              </div>
              <div class="hint-note" id="hint-note"></div>
              <div class="kbd-tips">
                <kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> ${t('kbdMove')} ·
                <kbd>Enter</kbd> ${t('kbdExit')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `);

  app.replaceChildren(screen);

  // ----- session state (one move = one slide, matching Par) -----
  const original = puzzle.blocks.map((b) => ({ ...b }));
  let history = [{ blocks: original, steps: 1 }];
  let moves = 0;

  const hudMoves = screen.querySelector('#hud-moves');
  const hudGate = screen.querySelector('#hud-gate');
  const hudStatus = screen.querySelector('#hud-status');
  const btnUndo = screen.querySelector('#btn-undo');
  const hintNote = screen.querySelector('#hint-note');

  const refresh = () => {
    hudMoves.textContent = String(moves);
    btnUndo.disabled = history.length <= 1;
  };
  const mount = screen.querySelector('#board-mount');
  let board = null;
  const mountBoard = (worldObj) => {
    world = worldObj;
    document.body.dataset.ambience = world.id;
    history = [{ blocks: original, steps: 1 }];
    moves = 0;
    board?.destroy();
    board = new Board(mount, {
      puzzle,
      world,
      worldId: world.id,
      sfx,
      onMove(blocks) {
        history.push({ blocks: blocks.map((b) => ({ ...b })), steps: 1 });
        moves += 1;
        refresh();
        hudMoves.classList.remove('moves-pulse');
        void hudMoves.offsetWidth;
        hudMoves.classList.add('moves-pulse');
        hintNote.classList.remove('show');
      },
      onPathClear(clear) {
        hudGate.textContent = clear ? t('gateOpen') : t('gateBlocked');
        hudStatus.textContent = clear
          ? t('statusClear', { emoji: world.hero.emoji })
          : t('statusStart');
      },
      onWin() { showWin(); },
    });
    history = [{ blocks: board.blocks.map((b) => ({ ...b })), steps: 1 }];
    refresh();
    hudGate.textContent = t('gateBlocked');
    hudStatus.textContent = t('statusStart');
  };
  mountBoard(world);

  screen.querySelectorAll('.world-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.worldId;
      if (id === world.id) return;
      const wObj = { id, ...theme.worlds[id] };
      mountBoard(wObj);
      screen.querySelectorAll('.world-chip').forEach((c) => {
        const active = c.dataset.worldId === id;
        c.classList.toggle('active', active);
        c.setAttribute('aria-pressed', String(active));
      });
      sfx.select();
    });
  });

  // ----- actions -----
  btnUndo.addEventListener('click', () => {
    if (history.length <= 1) return;
    const removed = history.pop();
    moves = Math.max(0, moves - removed.steps);
    board.setBlocks(history[history.length - 1].blocks);
    refresh();
    sfx.select();
  });

  const resetBoard = () => {
    history = [{ blocks: original, steps: 0 }];
    moves = 0;
    board.setBlocks(original);
    board.won = false;
    board.exiting = false;
    refresh();
    hudGate.textContent = '🔒 Blocked';
  };

  screen.querySelector('#btn-reset').addEventListener('click', () => {
    resetBoard();
    hudStatus.textContent = t('statusReset');
    sfx.select();
  });

  screen.querySelector('#btn-hint').addEventListener('click', () => {
    const move = hint(puzzle, board.blocks);
    hintNote.classList.remove('show');
    if (board.pathClear) {
      hintNote.textContent = t('hintClear', { emoji: world.hero.emoji });
    } else if (!move) {
      hintNote.textContent = '🧠 This one is a real brain-buster — no hint available. Take your time, you\'ve got this!';
    } else {
      const blockEl = board.els.get(move.id);
      if (blockEl) {
        blockEl.classList.remove('hint-flash');
        void blockEl.offsetWidth;
        blockEl.classList.add('hint-flash');
        setTimeout(() => blockEl.classList.remove('hint-flash'), 1800);
      }
      hintNote.textContent = '💡 Move the glowing piece — that\'s the next step toward a shortest solution.';
    }
    void hintNote.offsetWidth;
    hintNote.classList.add('show');
  });

  // ----- win flow -----
  function showWin() {
    const stars = moves <= par ? 3 : moves <= par + 2 ? 2 : 1;
    confetti();
    const backdrop = el(`
      <div class="dialog-backdrop" role="dialog" aria-modal="true" aria-label="Level complete">
        <div class="dialog">
          <div class="win-emoji">${world.hero.emoji}</div>
          <h2>${t('winTitle')}</h2>
          <p class="muted" style="margin:0">${t('winOf', { l: level, q: puzzleNo, pack: esc(pack.title) })}</p>
          <div class="win-stats">
            ${starsHtml(stars)}
            <span class="chip">${t(moves !== 1 ? 'winMovesPlural' : 'winMoves', { m: moves, p: par })}</span>
            ${moves === par ? `<span class="chip chip-gold">${t('winPerfect')}</span>` : ''}
          </div>
          <div class="actions">
            <button class="btn btn-soft" id="win-replay">${t('winReplay')}</button>
            ${next
              ? `<button class="btn btn-primary" id="win-next">${t('winNext')}</button>`
              : `<a class="btn btn-primary" href="#/pack/${esc(pack.id)}" id="win-next">${t('winBack')}</a>`}
          </div>
        </div>
      </div>
    `);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
    backdrop.querySelector('#win-replay').addEventListener('click', () => {
      backdrop.remove();
      resetBoard();
      hudStatus.textContent = t('statusReplay');
    });
    backdrop.querySelector('#win-next')?.addEventListener('click', (e) => {
      backdrop.remove();
      if (e.currentTarget.tagName === 'BUTTON') navigate(playerRoute(pack.id, next));
    });
    document.body.appendChild(backdrop);
    const onEscape = (e) => {
      if (e.key === 'Escape') { backdrop.remove(); document.removeEventListener('keydown', onEscape); }
    };
    document.addEventListener('keydown', onEscape);
    backdrop.querySelector('.btn-primary')?.focus();
  }

  refresh();
  return () => board.destroy();
}
