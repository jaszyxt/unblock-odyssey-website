// Browse screens: the full track → pack library, and a pack's level/puzzle grid.

import { store } from '../data/store.js';
import { el, esc, diffDots, starsRange } from './dom.js';
import { t, trackDisplay, packTitleDisplay } from '../i18n.js';

const playerRoute = (packId, pos) => `#/puzzle/${packId}/${pos.level}/${pos.puzzle}`;

export async function renderBrowse(app) {
  const [manifest, theme] = await Promise.all([store.getManifest(), store.getTheme()]);
  const tracks = store.tracksWithPacks(manifest);

  const screen = el(`
    <section class="screen">
      <div class="wrap">
        <div class="page-hero">
          <h1>Sample puzzles</h1>
          <p class="muted" style="max-width:62ch">${t('playSub')}</p>
          <div class="badge-row">
            <span class="chip chip-primary">${t('chipTracks', { n: manifest.stats.tracks })}</span>
            <span class="chip chip-teal">${manifest.stats.packsDeclared && manifest.stats.packsDeclared !== manifest.stats.packs
              ? t('chipPacksOf', { n: manifest.stats.packs, d: manifest.stats.packsDeclared })
              : t('chipPacks', { n: manifest.stats.packs })}</span>
            <span class="chip">${t('chipSamples', { n: manifest.stats.puzzles })}</span>
            <span class="chip">${t('chipFull', { n: manifest.stats.puzzlesInGame.toLocaleString() })}</span>
          </div>
        </div>
        <div class="tracks"></div>
      </div>
    </section>
  `);

  const tracksRoot = screen.querySelector('.tracks');
  for (const track of tracks) {
    const info = trackDisplay(theme, track.id);
    const world = store.worldForTrack(theme, track.id);
    const grids = [...new Set(track.packs.flatMap((p) => p.gridSizes))].sort().join(' / ');

    const section = el(`
      <div class="track-section">
        <div class="track-head">
          <span class="t-emoji" data-world="${world.id}">${info.emoji}</span>
          <h2>${esc(info.name)}</h2>
          <span class="chip chip-primary">${t('chipPacks', { n: track.packCount })}</span>
          <span class="chip">${t('chipSamplesShort', { n: track.sampleCount })}</span>
          <span class="chip">${t('chipGrids', { g: grids })}</span>
          <p class="t-tag">${esc(info.tagline)}</p>
        </div>
        <div class="grid-cards packs"></div>
      </div>
    `);

    const packsRoot = section.querySelector('.packs');
    for (const pack of track.packs) {
      const [dMin, dMax] = pack.difficultyRange;
      const gridBadge = pack.gridSizes.length === 1
        ? `${pack.gridSizes[0]}×${pack.gridSizes[0]}`
        : pack.gridSizes.map((g) => `${g}×${g}`).join(' · ');
      const card = el(`
        <article class="card card-hover pack-card" data-world="${world.id}">
          <div class="pc-top"><span>${esc(packTitleDisplay(pack))}</span><span>${gridBadge}</span></div>
          <div class="pc-body">
            <div class="badge-row">
              <span class="chip chip-teal">${t('chipFree', { n: pack.sampleCount })}</span>
              <span class="chip">${t('chipInGame', { n: pack.puzzleCount })}</span>
              ${starsRange(dMin, dMax)}
            </div>
            <div class="muted" style="font-size:.92rem">${pack.puzzlesPerLevel ? t('cardNote', { last: pack.levelCount ?? '?' }) : ''}</div>
            <div class="action-row" style="margin-top:auto">
              <a class="btn btn-primary btn-sm" href="${playerRoute(pack.id, pack.firstPuzzle.journeyPosition)}">${t('btnPlaySample')}</a>
              <a class="btn btn-soft btn-sm" href="#/pack/${esc(pack.id)}">${t('btnAllSamples')}</a>
            </div>
          </div>
        </article>
      `);
      packsRoot.appendChild(card);
    }
    tracksRoot.appendChild(section);
  }

  app.replaceChildren(screen);
}

export async function renderPack(app, { params, navigate }) {
  const [manifest, theme] = await Promise.all([store.getManifest(), store.getTheme()]);
  const found = await store.getPack(params.packId);
  if (!found) { navigate('#/play'); return; }
  const { pack, track, json } = found;
  const info = trackDisplay(theme, track.id);
  const world = store.worldForTrack(theme, track.id);

  const byLevel = new Map();
  for (const level of json.levels) {
    const lv = level.journeyPosition?.level ?? 1;
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    byLevel.get(lv).push(level);
  }
  const levelNums = [...byLevel.keys()].sort((a, b) => a - b);

  const screen = el(`
    <section class="screen">
      <div class="wrap">
        <div class="page-hero">
          <div class="crumbs"><a href="#/play">${t('crumbsAll')}</a> · ${esc(info.name)}</div>
          <h1>${esc(packTitleDisplay(pack))}</h1>
          <div class="badge-row">
            <span class="chip chip-primary">${info.emoji} ${esc(info.name)}</span>
            <span class="chip chip-teal">${t('packSampleChip', { n: json.levels.length })}</span>
            <span class="chip">${t('packInGameChip', { n: pack.puzzleCount })}</span>
            <span class="chip">${[...new Set(json.levels.map((l) => l.gridSize))].map((g) => `${g}×${g}`).join(' · ')}</span>
          </div>
          <p class="muted" style="margin-top:12px; max-width:60ch">${t('packNote', { levels: pack.levelCount ?? '?', total: pack.puzzleCount })}</p>
        </div>
        <div class="levels"></div>
      </div>
    </section>
  `);

  const levelsRoot = screen.querySelector('.levels');
  for (const lv of levelNums) {
    const puzzles = byLevel
      .get(lv)
      .sort((a, b) => (a.journeyPosition?.puzzle ?? 0) - (b.journeyPosition?.puzzle ?? 0));
    const group = el(`
      <div class="level-group card" style="padding:18px 20px; margin-bottom:16px">
        <h3>Level ${lv}</h3>
        <div class="puzzle-row"></div>
      </div>
    `);
    const row = group.querySelector('.puzzle-row');
    for (const puzzle of puzzles) {
      const q = puzzle.journeyPosition?.puzzle ?? 1;
      const btn = el(`
        <button class="puzzle-btn" aria-label="Puzzle ${q}, difficulty ${puzzle.metadata.authoredDifficulty} of 5">
          <span class="q-num">Puzzle ${q}</span>
          ${diffDots(puzzle.metadata.authoredDifficulty)}
          <span class="par">${puzzle.gridSize}×${puzzle.gridSize}</span>
        </button>
      `);
      btn.addEventListener('click', () => {
        navigate(playerRoute(pack.id, puzzle.journeyPosition ?? { level: lv, puzzle: q }));
      });
      row.appendChild(btn);
    }
    levelsRoot.appendChild(group);
  }

  app.replaceChildren(screen);
}
