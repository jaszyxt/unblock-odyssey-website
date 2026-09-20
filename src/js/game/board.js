// Interactive puzzle board: rendering, drag-to-slide with snapping, keyboard
// play, thematic exit gate, and the drive-out win animation. Mirrors the
// game's interaction model (drag any distance = 1 move; tap the hero to exit
// once the path is clear; a second tap boosts the exit).

import { allowedRange, applySlide, canSlideTo, findTarget, isPathClear } from '../engine/rules.js';
import { cellsOf } from '../engine/schema.js';

const div = (cls) => {
  const el = document.createElement('div');
  el.className = cls;
  return el;
};

export class Board {
  constructor(root, { puzzle, world, worldId, interactive = true, onMove, onPathClear, onWin, sfx }) {
    this.root = root;
    this.puzzle = puzzle;
    this.world = world;
    this.worldId = worldId;
    this.interactive = interactive;
    this.sfx = sfx;
    this.onMove = onMove || (() => {});
    this.onPathClear = onPathClear || (() => {});
    this.onWin = onWin || (() => {});

    this.blocks = puzzle.blocks.map((b) => ({ ...b }));
    this.els = new Map();
    this.selectedId = null;
    this.pathClear = false;
    this.exiting = false;
    this.won = false;
    this.cell = 60;
    this.rim = 14;

    this._build();
    this._layout();
    this._render();

    this._ro = new ResizeObserver(() => this._layout());
    this._ro.observe(this.stage);
    // Fallback: if the mount was detached at construction (or ResizeObserver
    // is throttled), keep retrying until the stage has real size.
    this._laidOut = this.frame.style.width !== '';
    if (!this._laidOut) this._ensureLayout(40);
  }

  _ensureLayout(retries) {
    if (this._laidOut || retries <= 0) return;
    if (this.stage.isConnected && this.stage.clientWidth >= 40) {
      this._layout();
      if (this.frame.style.width) { this._laidOut = true; return; }
    }
    setTimeout(() => this._ensureLayout(retries - 1), 120);
  }

  // ---------- DOM construction ----------

  _build() {
    this.stage = div('board-stage');
    this.stage.dataset.world = this.worldId;
    this.stage.dataset.track = this.puzzle.metadata?.track || 'EXPLORER';
    this.frame = div('board-frame');
    this.grid = div('board-grid');
    this.gapEl = div('exit-gap');
    this.grid.appendChild(this.gapEl);
    this.frame.appendChild(this.grid);

    // Canonical City Car Driving gate: dual-lens light box on a pole above
    // the frame, catch bracket at the top corner, barrier cabinet below the
    // gap, and a full-height striped arm pivoting at the cabinet hub.
    this.gate = div('gate');
    this.lightbox = div('gate-lightbox');
    this.lightbox.append(div('lens red'), div('lens green'));
    this.cabinet = div('gate-cabinet');
    this.arm = div('gate-arm');
    this.gate.append(this.lightbox, this.cabinet, this.arm);
    this.runway = div('runway');
    // Magic Forest / Space Explorer / Clearspace use themed portals instead
    // of the City Cars toll gate (worlds.css styles them per world).
    this.portal = div('exit-portal');
    this.frame.append(this.gate, this.runway, this.portal);

    this.stage.appendChild(this.frame);
    this.root.appendChild(this.stage);

    if (this.interactive) {
      // Some embedded browsers only deliver mouse events — support both.
      this._downEvt = window.PointerEvent ? 'pointerdown' : 'mousedown';
      this._moveEvt = window.PointerEvent ? 'pointermove' : 'mousemove';
      this._upEvt = window.PointerEvent ? 'pointerup' : 'mouseup';
      this.grid.addEventListener(this._downEvt, (e) => this._onDown(e));
      this.grid.addEventListener('keydown', (e) => this._onKeyDown(e));
      this.laneHint = div('lane-hint');
      this.grid.appendChild(this.laneHint);
    }
  }

  // ---------- Layout ----------

  _layout() {
    const n = this.puzzle.gridSize;
    // Measure the CONTENT box: the padding written below changes clientWidth,
    // so including padding in the measurement feeds back into the next pass
    // and makes the board oscillate (the visible "shaking").
    const cs = getComputedStyle(this.stage);
    const availW = this.stage.clientWidth
      - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
    if (!(availW >= 40) || this.exiting) return;

    // Phones: slim margins and a shorter runway so the board fills the width.
    const phone = availW < 480;
    const base = Math.round(phone
      ? Math.min(16, Math.max(8, availW * 0.028))
      : Math.min(34, Math.max(16, availW * 0.05)));
    // One shared width budget: grid cells + slim rim + reserved runway strip.
    const runwayFactor = phone ? 0.95 : 1.3;
    let cell = Math.floor((availW - base * 2) / (n + 0.3 + runwayFactor));
    cell = Math.max(34, Math.min(cell, 84));
    const rim = Math.round(Math.min(16, Math.max(9, cell * 0.15)));
    const frameW = cell * n + rim * 2;

    const exitRow = this.puzzle.exit.index;
    const padTop = Math.max(base, exitRow === 0 ? Math.round(cell * 1.15) : 0);
    const padBottom = base + Math.round(cell * 0.15);

    // Early exit when nothing would change — kills any resize feedback loop.
    const layoutKey = [cell, rim, padTop, padBottom, frameW].join('|');
    if (layoutKey === this._layoutKey) return;
    this._layoutKey = layoutKey;

    this.cell = cell;
    this.rim = rim;
    this.runwayW = Math.round(cell * runwayFactor);

    const gapTop = this.rim + exitRow * cell;
    const frameH = cell * n + this.rim * 2;
    this.stage.style.paddingTop = `${padTop}px`;
    const cabBelow = Math.max(0, Math.round(gapTop + cell * 1.62 - frameH));
    const cityPad = this.worldId === 'city-cars'
      ? Math.max(Math.round(cell * 0.62) - Math.max(0, padTop - base), cabBelow)
      : 0;
    this.stage.style.paddingBottom = `${Math.max(padBottom, base + cityPad)}px`;
    this.stage.style.paddingLeft = `${base}px`;
    this.stage.style.paddingRight = `${base}px`;

    this.frame.style.setProperty('--cell', `${cell}px`);
    this.frame.style.setProperty('--exit-row', String(exitRow));
    this.frame.style.width = `${frameW}px`;
    this.grid.style.width = `${cell * n}px`;
    this.grid.style.height = `${cell * n}px`;

    // Gate assembly coordinates (relative to the frame), matched to the real
    // app: a COMPACT assembly centered on the exit cell — small dual-lens
    // light just above the gap, striped arm spanning the gap area, cabinet
    // right below, checkered runway at the gap row.
    const armW = Math.max(5, Math.round(cell * 0.09));
    const lightW = Math.max(11, Math.round(cell * 0.2));
    const lightH = Math.max(18, Math.round(cell * 0.42));

    // Traffic light box: sits directly on top of the exit gap.
    Object.assign(this.lightbox.style, {
      left: `${frameW + Math.round(cell * 0.07)}px`,
      top: `${gapTop - Math.round(cell * 0.52)}px`,
      width: `${lightW}px`, height: `${lightH}px`,
    });
    // Barrier arm: spans the gap area, pivoting at the cabinet hub below.
    const armTop = gapTop - Math.round(cell * 0.14);
    const armLen = Math.round(cell * 1.42);
    Object.assign(this.arm.style, {
      left: `${frameW + Math.round(cell * 0.13) - Math.floor(armW / 2)}px`,
      top: `${armTop}px`,
      width: `${armW}px`, height: `${armLen}px`,
    });
    // Barrier cabinet: right below the arm, housing the hub.
    const cabTop = armTop + armLen - Math.round(cell * 0.06);
    Object.assign(this.cabinet.style, {
      left: `${frameW + Math.round(cell * 0.06)}px`,
      top: `${cabTop}px`,
      width: `${Math.round(cell * 0.26)}px`, height: `${Math.round(cell * 0.26)}px`,
    });
    Object.assign(this.runway.style, {
      left: `${frameW + Math.round(cell * 0.14)}px`, top: `${gapTop}px`,
      width: `${Math.round(cell * 1.05)}px`, height: `${cell}px`,
    });
    Object.assign(this.portal.style, {
      left: `${frameW}px`, top: `${gapTop}px`,
      width: `${this.runwayW}px`, height: `${cell}px`,
    });
    this.gapEl.style.top = `${exitRow * cell}px`;
    this.gapEl.style.height = `${cell}px`;

    this._laidOut = true;
    this._render();
  }

  // ---------- Rendering ----------

  _blockPos(b) {
    const horizontal = b.orientation === 'HORIZONTAL';
    const along = horizontal ? b.x : b.y;
    return { along, horizontal };
  }

  _render() {
    const gap = Math.max(4, Math.round(this.cell * 0.09));
    const n = this.puzzle.gridSize;
    const seen = new Set();

    for (const b of this.blocks) {
      const { along, horizontal } = this._blockPos(b);
      let el = this.els.get(b.id);
      if (!el) {
        el = div('block');
        el.dataset.id = String(b.id);
        if (b.target) {
          const emoji = document.createElement('span');
          emoji.className = 'hero-emoji';
          emoji.textContent = this.world.hero.emoji;
          el.append(emoji);
        }
        this.grid.appendChild(el);
        this.els.set(b.id, el);
      }
      el.className = 'block'
        + (b.target ? ' target' : '')
        + (b.static ? ' static-block' : '')
        + (this.pathClear && b.target ? ' path-clear' : '')
        + (this.selectedId === b.id ? ' selected' : '');
      el.dataset.cells = String(b.length);
      el.dataset.orient = b.orientation === 'HORIZONTAL' ? 'h' : 'v';
      if (!b.target && !b.static) {
        el.style.setProperty('--c', this.world.blockers[b.id % this.world.blockers.length]);
      }
      el.style.left = `${(horizontal ? along : b.x) * this.cell + gap / 2}px`;
      el.style.top = `${(horizontal ? b.y : along) * this.cell + gap / 2}px`;
      el.style.width = `${(horizontal ? b.length * this.cell : this.cell) - gap}px`;
      el.style.height = `${(horizontal ? this.cell : b.length * this.cell) - gap}px`;
      if (!el.classList.contains('exiting')) el.style.transform = '';
      el.tabIndex = this.interactive && !b.static && !this.exiting ? 0 : -1;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', this._ariaLabel(b));
      seen.add(b.id);
    }
    for (const [id, el] of this.els) {
      if (!seen.has(id)) { el.remove(); this.els.delete(id); }
    }
    this._updateLaneHint();
  }

  _ariaLabel(b) {
    const cells = cellsOf(b);
    const [x0, y0] = cells[0];
    const kind = b.target ? `${this.world.hero.name} (target)` : (b.static ? 'Wall block' : 'Block');
    return `${kind}: row ${y0 + 1}, column ${x0 + 1}, ${b.orientation.toLowerCase()}, ${b.length} cell${b.length > 1 ? 's' : ''}`;
  }

  // ---------- State in / state out ----------

  setBlocks(blocks) {
    this.blocks = blocks.map((b) => ({ ...b }));
    this._checkClear(true);
    this._render();
  }

  _checkClear(silent = false) {
    const clear = this.won ? true : isPathClear(this.puzzle, this.blocks);
    if (clear === this.pathClear) return;
    this.pathClear = clear;
    this.gate.classList.toggle('open', clear);
    // Game timing: the light flips green 400ms after the path clears; the
    // arm then swings open (CSS: 800ms + 100ms delay on .ready).
    clearTimeout(this._readyTimer);
    if (clear) {
      this._readyTimer = window.setTimeout(() => this.gate.classList.add('ready'), 400);
    } else {
      this.gate.classList.remove('ready');
    }
    const t = this.els.get(findTarget(this.blocks)?.id);
    if (t) t.classList.toggle('path-clear', clear);
    if (clear && !silent) {
      this.sfx.gate();
      this.onPathClear(true);
    } else if (!clear) {
      this.onPathClear(false);
    }
  }

  _commit(b, pos) {
    const next = applySlide(this.puzzle, this.blocks, b.id, pos);
    if (!next) return false;
    this.blocks = next;
    this._render();
    this._checkClear();
    this.onMove(this.blocks);
    return true;
  }

  select(id) {
    if (this.selectedId === id) { this._updateLaneHint(); return; }
    this.selectedId = id;
    this._render();
    this._updateLaneHint();
    if (id != null) this.sfx.select();
  }

  // ---------- Pointer / mouse / tap interaction ----------

  // Down: start a drag on a block, or remember a tap on an empty lane cell
  // (tap-to-move: with a block selected, tapping a free cell in its lane
  // slides it there — a guaranteed fallback when drag gestures are flaky).
  _onDown(e) {
    if (this.exiting || this.won) return;
    const el = e.target.closest('.block');
    const b = el ? this.blocks.find((o) => o.id === Number(el.dataset.id)) : null;
    if (el && (!b || b.static)) { this.sfx.blocked(); return; }
    if (el) {
      e.preventDefault();
      this.select(b.id);
      try { el.setPointerCapture?.(e.pointerId); } catch { /* synthetic pointers */ }
    }

    const range = b ? allowedRange(this.puzzle, this.blocks, b.id) : null;
    if (b && !range) return;
    const horizontal = b ? b.orientation === 'HORIZONTAL' : false;
    // With the path clear, the hero can be dragged past the right edge
    // through the open gate — same as the game's tap-or-drag exit.
    const exitDrag = !!b && b.target && this.pathClear && horizontal;
    const startCoord = horizontal ? e.clientX : e.clientY;
    const startPx = range ? range.current * this.cell : 0;
    let moved = false;

    const onMove = (ev) => {
      if (!b) return;
      const delta = (horizontal ? ev.clientX : ev.clientY) - startCoord;
      const maxPx = (range.max + (exitDrag ? 1 : 0)) * this.cell;
      const px = Math.min(maxPx, Math.max(range.min * this.cell, startPx + delta));
      if (Math.abs(delta) > 4) moved = true;
      el.classList.add('dragging');
      el.classList.remove('selected');
      if (horizontal) el.style.left = `${px + this.cell * 0.045}px`;
      else el.style.top = `${px + this.cell * 0.045}px`;
    };

    const onUp = (ev) => {
      window.removeEventListener(this._moveEvt, onMove);
      window.removeEventListener(this._upEvt, onUp);
      window.removeEventListener('pointercancel', onUp);
      el?.classList.remove('dragging');

      if (!moved) {
        // Tap: on the selected hero → drive out. On an empty lane cell with a
        // block selected → slide it there. On a block → (re)select it.
        if (b) {
          this._render();
          if (b.target && this.pathClear) this._exit();
          return;
        }
        if (this.selectedId != null) {
          const rect = this.grid.getBoundingClientRect();
          const cx = Math.floor((ev.clientX - rect.left) / this.cell);
          const cy = Math.floor((ev.clientY - rect.top) / this.cell);
          this._tapMoveTo(cx, cy);
        }
        return;
      }

      const delta = (horizontal ? ev.clientX : ev.clientY) - startCoord;
      const raw = startPx + delta;
      if (exitDrag && raw >= (range.max + 0.7) * this.cell) {
        this._exit(); // dragged the hero through the gate — drive out from here
        return;
      }
      const pos = Math.min(range.max, Math.max(range.min, Math.round(raw / this.cell)));
      if (pos !== range.current) {
        this.sfx.move();
        this._commit(b, pos);
      } else {
        this._render();
      }
    };

    window.addEventListener(this._moveEvt, onMove);
    window.addEventListener(this._upEvt, onUp);
    window.addEventListener('pointercancel', onUp);
  }

  // Slide the selected block to the tapped cell (must be along its lane).
  _tapMoveTo(cx, cy) {
    const b = this.blocks.find((o) => o.id === this.selectedId);
    if (!b || b.static || this.exiting || this.won) return;
    const horizontal = b.orientation === 'HORIZONTAL';
    const pos = horizontal ? cx : cy;
    const fixed = horizontal ? b.y : b.x;
    const current = horizontal ? b.x : b.y;
    if ((horizontal ? cy : cx) !== fixed || pos === current) return;
    if (!canSlideTo(this.puzzle, this.blocks, b.id, pos)) { this.sfx.blocked(); return; }
    this.sfx.move();
    this._commit(b, pos);
  }

  // Show where the selected block can slide (its free lane span).
  _updateLaneHint() {
    if (!this.laneHint) return;
    const b = this.blocks.find((o) => o.id === this.selectedId);
    if (!b || b.static || this.exiting || this.won) {
      this.laneHint.classList.remove('show');
      return;
    }
    const r = allowedRange(this.puzzle, this.blocks, b.id);
    if (!r) { this.laneHint.classList.remove('show'); return; }
    const gap = Math.max(4, Math.round(this.cell * 0.09));
    const span = (r.max - r.min + b.length) * this.cell - gap;
    if (b.orientation === 'HORIZONTAL') {
      Object.assign(this.laneHint.style, {
        left: `${r.min * this.cell + gap / 2}px`,
        top: `${b.y * this.cell + this.cell * 0.32}px`,
        width: `${span}px`,
        height: `${this.cell * 0.36}px`,
      });
    } else {
      Object.assign(this.laneHint.style, {
        left: `${b.x * this.cell + this.cell * 0.32}px`,
        top: `${r.min * this.cell + gap / 2}px`,
        width: `${this.cell * 0.36}px`,
        height: `${span}px`,
      });
    }
    this.laneHint.classList.add('show');
  }

  // ---------- Keyboard interaction ----------

  _onKeyDown(e) {
    if (e.key === 'Escape') { this.select(null); return; }
    if (this.exiting || this.won) return;
    const el = e.target.closest('.block');
    if (!el) return;
    const b = this.blocks.find((o) => o.id === Number(el.dataset.id));
    if (!b) return;

    if ((e.key === 'Enter' || e.key === ' ') && b.target && this.pathClear) {
      e.preventDefault();
      this._exit();
      return;
    }

    const range = allowedRange(this.puzzle, this.blocks, b.id);
    if (!range) return;
    const horizontal = b.orientation === 'HORIZONTAL';
    const negKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const posKey = horizontal ? 'ArrowRight' : 'ArrowDown';

    if (e.key !== negKey && e.key !== posKey) return;
    e.preventDefault();
    this.select(b.id);
    const pos = range.current + (e.key === posKey ? 1 : -1);
    if (pos < range.min || pos > range.max) { this.sfx.blocked(); return; }
    this.sfx.move();
    this._commit(b, pos, 1);
    this.els.get(b.id)?.focus();
  }

  // ---------- Exit & win ----------

  _exit() {
    if (this.exiting || this.won || !this.pathClear) return;
    this.exiting = true;
    this.sfx.move();
    const el = this.els.get(findTarget(this.blocks).id);
    const dist = this.cell * this.puzzle.gridSize + this.cell * 2;

    const finish = () => {
      if (this.won) return;
      this.won = true;
      this.exiting = false;
      clearTimeout(this._exitTimer);
      clearTimeout(this._fadeTimer);
      el.removeEventListener('transitionend', this._finishHandler);
      el.removeEventListener('pointerdown', this._boostHandler);
      this.sfx.win();
      this.onWin();
    };
    this._finishHandler = finish;
    el.addEventListener('transitionend', finish);
    // Game timings (GameBoard.kt): 5000ms grand drive, tap-again = 450ms boost.
    el.style.setProperty('--exit-dur', '5s');
    el.classList.add('exiting');
    el.style.transform = `translateX(${dist}px)`;
    // Vanish: past the board edge the hero fades + shrinks (600ms, game spec).
    this._fadeTimer = setTimeout(() => el.classList.add('vanish'), 4400);
    this._exitTimer = setTimeout(finish, 5100);

    // Second tap during the grand exit boosts the drive-out speed.
    this._boostHandler = () => {
      el.style.setProperty('--exit-dur', '0.45s');
      el.classList.add('fast');
      el.classList.remove('vanish');
      el.style.transform = `translateX(${dist + this.cell}px)`;
      clearTimeout(this._exitTimer);
      clearTimeout(this._fadeTimer);
      this._fadeTimer = setTimeout(() => el.classList.add('vanish'), Math.max(0, 450 - 350));
      this._exitTimer = setTimeout(finish, 850);
    };
    el.addEventListener('pointerdown', this._boostHandler, { once: true });
  }

  destroy() {
    this._ro?.disconnect();
    clearTimeout(this._exitTimer);
    clearTimeout(this._fadeTimer);
    clearTimeout(this._readyTimer);
    this.root.innerHTML = '';
  }
}
