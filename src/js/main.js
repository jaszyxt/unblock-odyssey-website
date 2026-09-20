// App bootstrap: preferences, mobile menu, hash router.

import { renderHome } from './ui/home.js';
import { renderBrowse, renderPack } from './ui/browse.js';
import { renderPlayer } from './ui/player.js';
import { renderWorlds } from './ui/worlds.js';
import { renderAbout } from './ui/about.js';
import { sfx } from './game/audio.js';
import { t, getLang, setLang, applyStatic } from './i18n.js';

const app = document.getElementById('app');
const html = document.documentElement;
let dispose = null;

// ---------- Preferences (persisted; applied early in index.html to avoid flash) ----------

const prefs = {
  theme: localStorage.getItem('uo_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  contrast: localStorage.getItem('uo_contrast') || 'normal',
  motion: localStorage.getItem('uo_motion') || (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full'),
  sound: localStorage.getItem('uo_sound') || 'off',
};

const prefButtons = {
  theme: { el: document.getElementById('pref-theme'), on: 'dark', off: 'light', icon: ['☀️', '🌙'] },
  contrast: { el: document.getElementById('pref-contrast'), on: 'high', off: 'normal', icon: ['◐', '◑'] },
  motion: { el: document.getElementById('pref-motion'), on: 'reduced', off: 'full', icon: ['🦋', '⚡'] },
  sound: { el: document.getElementById('pref-sound'), on: 'on', off: 'off', icon: ['🔇', '🔊'] },
};

function applyPrefs() {
  html.dataset.theme = prefs.theme;
  html.dataset.contrast = prefs.contrast;
  html.dataset.motion = prefs.motion;
  sfx.enabled = prefs.sound === 'on';
  document.getElementById('meta-theme-color').content =
    prefs.theme === 'dark' ? '#0F111A' : '#FAF9F6';
  for (const [key, btn] of Object.entries(prefButtons)) {
    const active = prefs[key] === btn.on;
    btn.el.setAttribute('aria-pressed', String(active));
    btn.el.textContent = active ? btn.icon[0] : btn.icon[1];
    btn.el.title = {
      theme: 'Toggle light/dark theme',
      contrast: 'Toggle high contrast',
      motion: 'Toggle reduced motion',
      sound: 'Toggle sound effects',
    }[key];
  }
  for (const [key, value] of Object.entries(prefs)) localStorage.setItem(`uo_${key}`, value);
}

for (const [key, btn] of Object.entries(prefButtons)) {
  btn.el.addEventListener('click', () => {
    prefs[key] = prefs[key] === btn.on ? btn.off : btn.on;
    applyPrefs();
  });
}
applyPrefs();

// ---------- Language (EN / FIL) ----------
const langBtn = document.getElementById('pref-lang');
const updateLangBtn = () => { langBtn.textContent = t('langBtn'); };
langBtn.addEventListener('click', () => {
  setLang(getLang() === 'en' ? 'fil' : 'en');
  applyStatic();
  updateLangBtn();
  render(); // re-render the current screen in the new language
});
applyStatic();
updateLangBtn();

// ---------- Mobile menu ----------

const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('site-nav');

function closeMenu() { nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); }
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
document.addEventListener('click', (e) => {
  if (!e.target.closest('.site-header')) closeMenu();
});

// ---------- Router ----------

const routes = [
  { re: /^#\/play\/?$/, fn: renderBrowse, nav: 'play', titleKey: 'playHead' },
  { re: /^#\/pack\/([a-z0-9-]+)\/?$/, fn: renderPack, params: ['packId'], nav: 'play', titleKey: 'navPlay' },
  { re: /^#\/puzzle\/([a-z0-9-]+)\/(\d+)\/(\d+)\/?$/, fn: renderPlayer, params: ['packId', 'level', 'puzzle'], nav: 'play', titleKey: 'navPlay' },
  { re: /^#\/worlds\/?$/, fn: renderWorlds, nav: 'worlds', titleKey: 'worldsHead' },
  { re: /^#\/about\/?$/, fn: renderAbout, nav: 'about', titleKey: 'aboutHead' },
  { re: /^#?\/?$/, fn: renderHome, nav: 'home', title: 'Make a path. Try a plan.' },
];

function setNav(name) {
  nav.querySelectorAll('a').forEach((a) => {
    if (a.dataset.nav === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

async function render() {
  closeMenu();
  // Win dialogs live on document.body; drop any left over from the previous
  // screen so they never stack across navigation.
  document.querySelectorAll('.dialog-backdrop').forEach((d) => d.remove());
  delete document.body.dataset.ambience; // screens re-set it (player only)
  const hash = location.hash || '#/';
  const route = routes.find((r) => r.re.test(hash)) || routes[routes.length - 1];
  const match = hash.match(route.re);
  const params = {};
  (route.params || []).forEach((k, i) => { params[k] = decodeURIComponent(match[i + 1]); });

  dispose?.();
  dispose = null;
  app.replaceChildren();
  app.appendChild((() => {
    const p = document.createElement('section');
    p.className = 'screen';
    p.innerHTML = `<div class="wrap"><p class="muted">${t('loading')}</p></div>`;
    return p;
  })());

  try {
    dispose = (await route.fn(app, { params, navigate: (h) => { location.hash = h; } })) || null;
  } catch (err) {
    console.error(err);
    app.replaceChildren();
    const error = document.createElement('section');
    error.className = 'screen';
    error.innerHTML = `
      <div class="wrap">
        <div class="card" style="padding:32px; margin-top:40px; text-align:center">
          <div style="font-size:2.6rem">🚧</div>
          <h2>${t('errorHead')}</h2>
          <p class="muted">${String(err && err.message || err)}</p>
          <a class="btn btn-primary" href="#/">${t('backHome')}</a>
        </div>
      </div>`;
    app.appendChild(error);
  }

  setNav(route.nav);
  document.title = `${route.titleKey ? t(route.titleKey) : route.title} · Unblock Odyssey`;
  window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', render);
render();
