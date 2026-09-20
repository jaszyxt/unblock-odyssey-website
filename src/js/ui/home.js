// Home screen: hero with a live playable demo, stats, featured samples.

import { store } from '../data/store.js';
import { Board } from '../game/board.js';
import { renderMiniBoard } from '../game/mini.js';
import { sfx } from '../game/audio.js';
import { el, esc, diffDots } from './dom.js';
import { t, getLang, trackDisplay, worldDisplay, packTitleDisplay } from '../i18n.js';

const puzzleRoute = (f) => `#/puzzle/${f.packId}/${f.journeyPosition.level}/${f.journeyPosition.puzzle}`;

const brandLine = (theme, key) => (getLang() === 'fil' && theme.brand[key]) || theme.brand[key.replace('Fil', '')];

export async function renderHome(app, { navigate }) {
  const [manifest, theme] = await Promise.all([store.getManifest(), store.getTheme()]);
  const featured = manifest.featured;
  const first = featured[0];
  const firstWorld = store.worldForTrack(theme, first.track);

  const screen = el(`
    <section class="screen">
      <div class="wrap">
        <div class="hero">
          <span class="float-block b1"></span>
          <span class="float-block b2"></span>
          <span class="float-block b3"></span>
          <div class="hero-grid">
            <div>
              <span class="hero-kicker">${t('homeKicker')}</span>
              <h1>${esc(brandLine(theme, 'taglineFil'))}</h1>
              <p class="sub">${esc(brandLine(theme, 'supportFil'))}</p>
              <div class="cta-row">
                <a class="btn btn-primary" href="${puzzleRoute(first)}">${t('homeCta1')}</a>
                <a class="btn btn-soft" href="#/play">${t('homeCta2', { n: manifest.stats.puzzles })}</a>
              </div>
            </div>
            <div class="hero-demo">
              <div class="demo-label"><span class="live-dot"></span> ${t('demoLabel')}</div>
              <div class="demo-mount"></div>
            </div>
          </div>
        </div>

        <section class="section" aria-label="Game stats">
          <div class="stats-band">
            <div class="card stat-card"><div class="stat-num">${manifest.stats.tracks}</div><div class="stat-label">${t('statTracks')}</div></div>
            <div class="card stat-card"><div class="stat-num">${manifest.stats.packs}</div><div class="stat-label">${t('statPacksPlayable', { n: manifest.stats.packsDeclared ?? manifest.stats.packs })}</div></div>
            <div class="card stat-card"><div class="stat-num">${manifest.stats.puzzles}</div><div class="stat-label">${t('statSamples')}</div></div>
            <div class="card stat-card"><div class="stat-num">${manifest.stats.puzzlesInGame.toLocaleString()}</div><div class="stat-label">${t('statFull')}</div></div>
          </div>
        </section>

        <section class="section" aria-label="Sample puzzles">
          <div class="section-head">
            <h2>${t('samplesHead')}</h2>
            <span class="muted">${t('samplesSub')}</span>
          </div>
          <div class="grid-cards"></div>
        </section>

        <section class="section" aria-label="How it works">
          <div class="section-head"><h2>${t('howHead')}</h2></div>
          <div class="grid-cards">
            <div class="card card-hover" style="padding:24px">
              <div style="font-size:2.2rem">🧩</div>
              <h3>${t('how1t')}</h3>
              <p class="muted">${t('how1p')}</p>
            </div>
            <div class="card card-hover" style="padding:24px">
              <div style="font-size:2.2rem">👆</div>
              <h3>${t('how2t')}</h3>
              <p class="muted">${t('how2p')}</p>
            </div>
            <div class="card card-hover" style="padding:24px">
              <div style="font-size:2.2rem">🚦</div>
              <h3>${t('how3t')}</h3>
              <p class="muted">${t('how3p')}</p>
            </div>
          </div>
        </section>

        <section class="section" aria-label="Worlds preview">
          <div class="section-head">
            <h2>${t('worldsHead')}</h2>
            <a class="see-all" href="#/worlds">${t('seeAll')}</a>
          </div>
          <div class="grid-cards"></div>
        </section>

        <section class="section" aria-label="Data freshness">
          <div class="card" style="padding:22px 26px; display:flex; gap:14px; align-items:center; flex-wrap:wrap;">
            <span style="font-size:1.8rem">🔄</span>
            <div style="flex:1; min-width:240px;">
              <strong>${t('freshTitle')}</strong>
              <div class="muted">${t('freshText', { date: esc(new Date(manifest.generatedAt).toLocaleDateString()), samples: manifest.stats.puzzles, packs: manifest.stats.packs, full: manifest.stats.puzzlesInGame.toLocaleString() })}</div>
            </div>
            <a class="btn btn-soft btn-sm" href="#/about">${t('freshCta')}</a>
          </div>
        </section>
      </div>
    </section>
  `);

  // Attach the screen to the document BEFORE creating the board so the
  // board's layout pass sees real element sizes.
  app.replaceChildren(screen);

  // Live playable demo in the hero.
  const mount = screen.querySelector('.demo-mount');
  const board = new Board(mount, {
    puzzle: first.puzzle,
    world: firstWorld,
    worldId: firstWorld.id,
    sfx,
    onWin: () => {
      mount.innerHTML = `
        <div class="demo-solved">
          <div class="big">${firstWorld.hero.emoji}</div>
          <h3>${t('demoSolvedTitle')}</h3>
          <p class="muted">${t('demoSolvedText')}</p>
          <a class="btn btn-primary" href="${puzzleRoute(first)}">${t('demoSolvedCta')}</a>
        </div>`;
    },
  });

  // Featured sample cards.
  const cards = screen.querySelector('[aria-label="Sample puzzles"] .grid-cards');
  for (const f of featured) {
    const world = store.worldForTrack(theme, f.track);
    const info = trackDisplay(theme, f.track);
    const card = el(`
      <article class="card card-hover featured-card" data-world="${world.id}">
        <div class="fc-stage">
          <span class="fc-emoji" aria-hidden="true">${world.hero.emoji}</span>
          <div class="mini-mount"></div>
        </div>
        <div class="fc-body">
          <span class="fc-kicker">${esc(info.emoji)} ${esc(info.name)}</span>
          <h3 class="fc-title">${esc(packTitleDisplay(f))}</h3>
          <div class="fc-meta">
            ${diffDots(f.puzzle.metadata.authoredDifficulty)}
            <span class="chip">${f.puzzle.gridSize}×${f.puzzle.gridSize}</span>
            <a class="btn btn-primary btn-sm" style="margin-left:auto" href="${puzzleRoute(f)}">▶ Play</a>
          </div>
        </div>
      </article>
    `);
    const miniCell = Math.max(12, Math.floor(96 / f.puzzle.gridSize));
    renderMiniBoard(card.querySelector('.mini-mount'), f.puzzle, world.id, world, { cell: miniCell });
    cards.appendChild(card);
  }

  // Worlds preview cards.
  const worldCards = screen.querySelector('[aria-label="Worlds preview"] .grid-cards');
  for (const [id, worldRaw] of Object.entries(theme.worlds)) {
    const world = worldDisplay(worldRaw);
    const card = el(`
      <a class="card card-hover" href="#/worlds" style="text-decoration:none;color:inherit">
        <div class="ws-head" data-world="${id}" style="padding:22px">
          <div class="ws-title">
            <span class="ws-hero-emoji">${world.hero.emoji}</span>
            <h3 style="margin:0">${esc(world.displayName)}</h3>
          </div>
        </div>
        <div style="padding:16px 20px">
          <p class="muted" style="margin:0">${esc(world.displayTagline)}</p>
        </div>
      </a>
    `);
    worldCards.appendChild(card);
  }

  return () => board.destroy();
}
