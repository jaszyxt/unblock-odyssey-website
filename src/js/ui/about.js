// About screen: what this project is and how it stays in sync with the game.

import { store } from '../data/store.js';
import { el, esc } from './dom.js';
import { t } from '../i18n.js';

export async function renderAbout(app) {
  const manifest = await store.getManifest();

  const screen = el(`
    <section class="screen">
      <div class="wrap" style="max-width:820px">
        <div class="page-hero">
          <h1>${t('aboutHead')}</h1>
          <p class="muted">${t('aboutSub')}</p>
        </div>

        <section class="section" style="padding-top:8px">
          <div class="card" style="padding:26px 28px; margin-bottom:20px">
            <h2 style="font-size:1.3rem">${t('whatHead')}</h2>
            <p>${t('whatP1')}</p>
            <p class="muted" style="margin:0">${t('whatP2')}</p>
          </div>

          <div class="card" style="padding:26px 28px; margin-bottom:20px">
            <h2 style="font-size:1.3rem">${t('syncHead')}</h2>
            <p>${t('syncP')}</p>
            <p><code style="background:var(--surface-2); padding:3px 10px; border-radius:8px; font-size:.95em">python website/tools/sync_from_game.py</code></p>
            <ul class="check-list">
              <li><span class="ic">1️⃣</span><span>${t('syncStep1')}</span></li>
              <li><span class="ic">2️⃣</span><span>${t('syncStep2')}</span></li>
              <li><span class="ic">3️⃣</span><span>${t('syncStep3')}</span></li>
            </ul>
          </div>

          <div class="card" style="padding:26px 28px; margin-bottom:20px">
            <h2 style="font-size:1.3rem">${t('dataHead')}</h2>
            <div class="badge-row" style="margin-bottom:12px">
              <span class="chip chip-primary">${manifest.stats.tracks} skill tracks</span>
              <span class="chip chip-teal">${manifest.stats.packs} packs</span>
              <span class="chip">${manifest.stats.puzzles} playable samples</span>
              <span class="chip">${manifest.stats.puzzlesInGame.toLocaleString()} puzzles in the game</span>
            </div>
            <p class="muted" style="margin:0">${t('dataNote', { levels: manifest.levelsPerPack })}<br>
            Source: <code>${esc(manifest.source)}</code><br>
            Synced: ${esc(new Date(manifest.generatedAt).toLocaleString())} · catalog schema v${esc(manifest.catalogSchemaVersion)}</p>
          </div>

          <div class="card" style="padding:26px 28px">
            <h2 style="font-size:1.3rem">${t('creditsHead')}</h2>
            <p style="margin-bottom:6px">${t('creditsP')}</p>
            <p class="muted" style="margin:0">${t('creditsSub')}</p>
          </div>
        </section>
      </div>
    </section>
  `);

  app.replaceChildren(screen);
}
