// Worlds screen: showcase of the game's visual worlds.

import { store } from '../data/store.js';
import { el, esc } from './dom.js';
import { t, trackDisplay, worldDisplay, conceptDisplay } from '../i18n.js';

export async function renderWorlds(app) {
  const [manifest, theme] = await Promise.all([store.getManifest(), store.getTheme()]);
  const tracks = store.tracksWithPacks(manifest);
  const featuredByWorld = new Map();
  for (const f of manifest.featured) {
    const worldId = theme.trackWorld[f.track];
    if (!featuredByWorld.has(worldId)) featuredByWorld.set(worldId, f);
  }

  const screen = el(`
    <section class="screen">
      <div class="wrap">
        <div class="page-hero">
          <h1>${t('worldsHead')}</h1>
          <p class="muted" style="max-width:62ch">${t('worldsSub')}</p>
        </div>
        <div class="worlds"></div>
      </div>
    </section>
  `);

  const root = screen.querySelector('.worlds');
  for (const [id, world] of Object.entries(theme.worlds)) {
    const usedBy = tracks.filter((tr) => theme.trackWorld[tr.id] === id);
    const sample = featuredByWorld.get(id);
    const wd = worldDisplay(world);
    const swatches = [world.stage[0], world.stage[1], world.board.target, ...world.blockers.slice(0, 2)];

    const section = el(`
      <article class="card world-showcase" data-world="${id}">
        <div class="ws-head">
          <div class="ws-title">
            <span class="ws-hero-emoji" aria-hidden="true">${world.hero.emoji}</span>
            <div>
              <h2 style="margin:0">${esc(wd.displayName)}</h2>
              <p>${esc(wd.displayTagline)}</p>
            </div>
          </div>
          <div class="ws-swatches" aria-hidden="true">
            ${swatches.map((c) => `<i style="background:${c}"></i>`).join('')}
          </div>
        </div>
        <div class="ws-body">
          <div class="ws-roster">
            ${world.roster.map((r) => `<span class="roster-chip">${r.emoji} ${esc(r.name)}</span>`).join('')}
          </div>
          <div class="ws-meta">
            <span class="chip chip-primary">${t('homeOf', { names: usedBy.map((tr) => esc(trackDisplay(theme, tr.id).name)).join(', ') || '—' })}</span>
            <span class="chip">${t('heroChip', { name: esc(world.hero.name) })}</span>
            ${sample ? `<a class="btn btn-primary btn-sm" style="margin-left:auto" href="#/puzzle/${esc(sample.packId)}/${sample.journeyPosition.level}/${sample.journeyPosition.puzzle}">▶ Try a ${esc(world.name)} puzzle</a>` : ''}
          </div>
        </div>
      </article>
    `);
    root.appendChild(section);
  }

  // Concept designs: approved art direction that is NOT in the game yet, so
  // they are presented separately and marked, never as playable worlds.
  const concepts = theme.conceptWorlds || [];
  if (concepts.length) {
    const block = el(`
      <div class="concepts">
        <div class="concepts-head">
          <h2 style="margin:0">${t('conceptsHead')}</h2>
          <span class="chip chip-concept">${t('conceptChip')}</span>
        </div>
        <p class="muted" style="max-width:62ch; margin:.4em 0 1.2em">${t('conceptsSub')}</p>
        <div class="grid-cards concepts-grid"></div>
        <p class="muted concept-note">${t('conceptsNote')}</p>
      </div>
    `);
    const grid = block.querySelector('.concepts-grid');
    for (const raw of concepts) {
      const c = conceptDisplay(raw);
      const card = el(`
        <article class="card concept-card">
          <div class="ws-head concept-head" style="background:linear-gradient(150deg, ${esc(c.stage[0])}, ${esc(c.stage[1])})">
            <div class="ws-title">
              <span class="concept-set">${esc(c.displaySet)}</span>
              <div>
                <h3 style="margin:0">${esc(c.displayName)}</h3>
                <p>${esc(c.displayTagline)}</p>
              </div>
            </div>
            <div class="ws-swatches" aria-hidden="true">
              ${c.swatches.map((hex) => `<i style="background:${esc(hex)}"></i>`).join('')}
            </div>
          </div>
          <div class="ws-body">
            <p class="concept-motifs muted">${esc(c.displayMotifs)}</p>
            <div class="ws-meta">
              <span class="chip chip-concept">${t('conceptChip')}</span>
              <span class="chip">sheen ${c.sheen} · aura ${c.aura}</span>
            </div>
          </div>
        </article>
      `);
      grid.appendChild(card);
    }
    root.appendChild(block);
  }

  app.replaceChildren(screen);
}
