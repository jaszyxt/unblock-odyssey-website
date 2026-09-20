// Lightweight i18n for the website chrome. The game ships in English and
// Filipino, so the site does too. Pack/track data keeps its synced English
// titles when no Filipino variant exists in the data.

const dict = {
  en: {
    skip: 'Skip to content',
    brandTag: 'Companion website',
    menu: 'Menu',
    prefsGroup: 'Display preferences',
    langBtn: 'FIL',
    navHome: 'Home', navPlay: 'Play', navWorlds: 'Worlds', navAbout: 'About',
    footerRights: '© 2026 Unblock Odyssey. All rights reserved.',
    footerSync: 'Puzzles synced live from the game · this site never modifies the game.',
    footerHow: 'How syncing works',
    loading: 'Loading…',
    errorHead: 'Something got stuck in traffic',
    backHome: 'Back to home',

    homeKicker: '🎮 Playable web demo — live game data',
    homeCta1: '▶ Play a sample puzzle',
    homeCta2: 'Browse {n} sample puzzles',
    demoLabel: 'Try it right now — no download needed',
    demoSolvedTitle: 'You did it! 🎉',
    demoSolvedText: "That's a real level from the game's very first pack.",
    demoSolvedCta: 'Play more puzzles',
    statTracks: 'Skill tracks', statPacks: 'Puzzle packs',
    statPacksPlayable: 'of {n} packs playable',
    statSamples: 'Playable samples', statFull: 'In the full game',
    samplesHead: 'Sample puzzles',
    samplesSub: 'One from every skill track — straight from the game.',
    howHead: 'How it works',
    how1t: 'Pick a puzzle',
    how1p: 'One sample level from every pack — from gentle one-move warm-ups to 6×6 visionary brainteasers.',
    how2t: 'Slide the blocks',
    how2p: "Drag a piece along its lane — it snaps to the grid and can't jump over others.",
    how3t: 'Open the gate',
    how3p: "Clear the hero's path and the exit gate opens. Tap the hero to drive out. 🏁",
    worldsHead: 'Four worlds to explore',
    seeAll: 'See all worlds →',
    freshTitle: 'Synced from the game',
    freshText: 'Refreshed {date} · {samples} playable samples from {packs} packs · the full game has {full} puzzles.',
    freshCta: 'How updates work',

    playHead: 'Sample puzzles',
    playSub: 'One playable level from every pack in the game, organized by skill track — a tasting menu for testing and exploring. The full library lives in the app.',
    chipTracks: '{n} tracks', chipPacks: '{n} packs', chipPacksOf: '{n} of {d} packs playable',
    chipSamples: '{n} playable samples', chipFull: '{n} in the full game',
    chipSamplesShort: '{n} samples', chipGrids: '{g} grids',
    chipFree: '{n} free samples', chipInGame: '{n} in the game',
    cardNote: 'Levels 2–{last} live in the app — this site is the playable advert.',
    btnPlaySample: '▶ Play sample 1', btnAllSamples: 'All samples',
    crumbsAll: '← All puzzles',
    packSampleChip: '{n} website samples', packInGameChip: '{n} in the full game',
    packNote: "🎯 This is the website's playable sample (level 1 of {levels}). The complete pack with {total} puzzles lives in the Unblock Odyssey app.",

    playerLevel: 'Level {l} · Puzzle {q}',
    chipDifficulty: 'Difficulty {d}/5',
    hudMoves: 'Moves', hudPar: 'Par (best possible)',
    parUnit: ' move', parUnits: ' moves',
    hudGate: 'Gate', gateOpen: '🟢 Open', gateBlocked: '🔒 Blocked',
    statusStart: 'Slide the blocks and open a path to the exit on the right.',
    statusClear: 'Path clear! Tap or drag the {emoji} out through the gate.',
    statusReset: 'Back to the start. You can do it!',
    statusReplay: 'Replay — beat your par!',
    btnUndo: '↩ Undo', btnReset: '⟲ Reset', btnHint: '💡 Hint',
    hintClear: 'The path is already clear — tap or drag the {emoji} out!',
    hintNone: "🧠 This one is a real brain-buster — no hint available. Take your time, you've got this!",
    hintMove: "💡 Move the glowing piece — that's the next step toward a shortest solution.",
    kbdMove: 'move the selected piece — or tap a free cell in its lane', kbdExit: 'drive out when the gate is open',
    worldPick: 'Play in any world',
    winTitle: 'Path cleared!',
    winOf: 'Level {l} · Puzzle {q} — {pack}',
    winMoves: '{m} move · par {p}', winMovesPlural: '{m} moves · par {p}',
    winPerfect: '🏅 Perfect!',
    winReplay: '⟲ Replay', winNext: 'Next puzzle ▶', winBack: 'Back to levels',

    worldsHead: 'The worlds',
    conceptsHead: 'In development — world concepts',
    conceptsSub: 'Design concepts being explored for future worlds. They are not in the game yet.',
    conceptsNote: 'Owner-approved concept designs from the game project. No production code yet — whether these become real worlds is still an open decision.',
    conceptChip: 'CONCEPT',
    worldsSub: "Every skill track plays on one of five visual worlds. Palettes, board colors, and heroes mirror the game's theme catalog.",
    homeOf: 'Home of {names}', heroChip: 'Hero: {name}',

    aboutHead: 'About this website',
    aboutSub: 'A companion web experience for <strong>Unblock Odyssey</strong> — built as a separate project that reads the game\'s content without ever touching the game itself.',
    whatHead: '🎮 What is this?',
    whatP1: 'Every puzzle here is a <strong>real level from the game</strong>, played with the same rules: slide blocks along their lane, never jump over others, open the hero\'s path to the exit gate, then tap the hero to drive out. A built-in solver (using the same move rules as the game) powers the hints and the <em>Par</em> counter — the fewest moves a puzzle can be solved in.',
    whatP2: 'It exists so anyone can <strong>test and feel the gameplay in a browser</strong> — no install, no download.',
    syncHead: '🔄 How it stays up to date',
    syncP: "The site renders everything from JSON — no puzzle is hard-coded. When the game's content changes, one command refreshes the website:",
    syncStep1: 'The script reads the game\'s level catalog and packs (read-only) and copies the sample levels into <code>website/data/levels/</code>.',
    syncStep2: 'Every file is validated against the same rules the game enforces, so broken content never reaches the site.',
    syncStep3: 'A manifest with fresh stats, track structure, and featured samples is regenerated — pages, counts, and samples update automatically.',
    dataHead: '📦 Current game data',
    dataNote: 'The site publishes the first {levels} level of each pack as free samples — enough to learn and test every kind of challenge without giving the whole game away.',
    creditsHead: '💚 Credits',
    creditsP: 'Content &amp; design language © 2026 Unblock Odyssey. Type set in <strong>Atkinson Hyperlegible</strong> — the same accessibility-first font family the game uses.',
    webSampleNote: "🎨 Web sample for testing — a light recreation of the game's look. The app's premium artwork is the real thing.",
    creditsSub: "This website is a testing companion, not the product. Puzzle designs here are simplified web samples — the app's premium artwork, animations, and audio are the real thing.",
  },

  fil: {
    skip: 'Lumaktaw sa nilalaman',
    brandTag: 'Kasamang website',
    menu: 'Menu',
    prefsGroup: 'Mga kagustuhan sa itsura',
    langBtn: 'EN',
    navHome: 'Home', navPlay: 'Maglaro', navWorlds: 'Mga Mundo', navAbout: 'Tungkol',
    footerRights: '© 2026 Unblock Odyssey. Nakalaan lahat ng karapatan.',
    footerSync: 'Mga puzzle naka-sync mula sa laro · hindi binabago ng site ang laro.',
    footerHow: 'Paano gumagana ang pag-sync',
    loading: 'Naglo-load…',
    errorHead: 'May naipit sa kalsada',
    backHome: 'Bumalik sa home',

    homeKicker: '🎮 Playable na web demo — totoong game data',
    homeCta1: '▶ Maglaro ng sample puzzle',
    homeCta2: 'Tingnan ang {n} sample puzzle',
    demoLabel: 'Subukan ngayon — walang kailangang i-download',
    demoSolvedTitle: 'Kaya mo pala! 🎉',
    demoSolvedText: "Totoong level 'yan mula sa unang pack ng laro.",
    demoSolvedCta: 'Maglaro pa ng puzzles',
    statTracks: 'Mga skill track', statPacks: 'Mga puzzle pack',
    statPacksPlayable: 'sa {n} pack na maaaring laruin',
    statSamples: 'Mga sample na laro', statFull: 'Sa buong laro',
    samplesHead: 'Mga sample puzzle',
    samplesSub: 'Isa mula sa bawat skill track — galing mismo sa laro.',
    howHead: 'Paano ito gumagana',
    how1t: 'Pumili ng puzzle',
    how1p: 'Isang sample level mula sa bawat pack — mula sa mga madaling hakbang hanggang sa pinakamahirap na 6×6.',
    how2t: 'I-slide ang mga bloke',
    how2p: 'Hilahin ang piyesa sa sarili nitong linya — dumidikit ito sa grid at hindi lumalaktaw sa ibang bloke.',
    how3t: 'Buksan ang gate',
    how3p: 'Gawing malinaw ang daan ng bida at bubukas ang gate. Pindutin ang bida para tumakbo palabas. 🏁',
    worldsHead: 'Apat na mundo para tuklasin',
    seeAll: 'Tingnan lahat ng mundo →',
    freshTitle: 'Naka-sync mula sa laro',
    freshText: 'Na-update {date} · {samples} sample na laro mula sa {packs} pack · may {full} puzzle sa buong laro.',
    freshCta: 'Paano gumagana ang updates',

    playHead: 'Mga sample puzzle',
    playSub: 'Isang playable na level mula sa bawat pack ng laro, ayon sa skill track — pang-tikim para sa pagsubok at pag-explore. Ang buong library ay nasa app.',
    chipTracks: '{n} track', chipPacks: '{n} pack', chipPacksOf: '{n} sa {d} pack na maaaring laruin',
    chipSamples: '{n} sample na laro', chipFull: '{n} sa buong laro',
    chipSamplesShort: '{n} sample', chipGrids: '{g} grid',
    chipFree: '{n} libreng sample', chipInGame: '{n} sa laro',
    cardNote: 'Ang levels 2–{last} ay nasa app — ang site na ito ang playable na patalastas.',
    btnPlaySample: '▶ Laruin ang sample 1', btnAllSamples: 'Lahat ng sample',
    crumbsAll: '← Lahat ng puzzle',
    packSampleChip: '{n} sample ng website', packInGameChip: '{n} sa buong laro',
    packNote: '🎯 Ito ang playable na sample ng website (level 1 ng {levels}). Ang buong pack na may {total} puzzle ay nasa Unblock Odyssey app.',

    playerLevel: 'Level {l} · Puzzle {q}',
    chipDifficulty: 'Hirap {d}/5',
    hudMoves: 'Mga move', hudPar: 'Par (pinakamababa)',
    parUnit: ' move', parUnits: ' moves',
    hudGate: 'Gate', gateOpen: '🟢 Bukas', gateBlocked: '🔒 Sarado',
    statusStart: 'I-slide ang mga bloke at buksan ang daan papunta sa exit sa kanan.',
    statusClear: 'Malinaw na ang daan! Pindutin o hilahin ang {emoji} palabas sa gate.',
    statusReset: 'Balik sa simula. Kayá mo \'yan!',
    statusReplay: 'Ulitin — lampasan ang par!',
    btnUndo: '↩ Bawiin', btnReset: '⟲ Ulitin', btnHint: '💡 Tip',
    hintClear: 'Malinaw na ang daan — pindutin o hilahin ang {emoji} para lumabas!',
    hintNone: "🧠 Ang hirap nito — walang available na tip. Take your time, kayá mo 'yan!",
    hintMove: "💡 Ilipat ang kumikinang na piyesa — 'yan ang susunod na hakbang ng pinakamaikling solusyon.",
    kbdMove: 'gumalaw ng piniling piyesa — o pindutin ang malayang cell sa linya nito', kbdExit: 'patakbuhin palabas kapag bukas ang gate',
    worldPick: 'Maglaro sa kahit anong mundo',
    winTitle: 'Malinaw na ang daan!',
    winOf: 'Level {l} · Puzzle {q} — {pack}',
    winMoves: '{m} move · par {p}', winMovesPlural: '{m} moves · par {p}',
    winPerfect: '🏅 Perpekto!',
    winReplay: '⟲ Ulitin', winNext: 'Susunod na puzzle ▶', winBack: 'Balik sa mga level',

    worldsHead: 'Ang mga mundo',
    conceptsHead: 'Ginagawa pa — mga konsepto ng mundo',
    conceptsSub: 'Mga design concept na sinusuri para sa mga susunod na mundo. Wala pa ang mga ito sa laro.',
    conceptsNote: 'Mga aprubadong concept design mula sa game project. Wala pang production code — bukas pa ang desisyon kung magiging totoong mundo ang mga ito.',
    conceptChip: 'KONSEPTO',
    worldsSub: 'Bawat skill track ay naglalaro sa isa sa limang makulay na mundo. Ang mga kulay at bida ay tugma sa theme catalog ng laro.',
    homeOf: 'Tahanan ng {names}', heroChip: 'Bida: {name}',

    aboutHead: 'Tungkol sa website na ito',
    aboutSub: 'Isang kasamang web experience para sa <strong>Unblock Odyssey</strong> — hiwalay na proyekto na bumabasa ng content ng laro nang hindi kailanman binabago ang laro.',
    whatHead: '🎮 Ano ito?',
    whatP1: 'Bawat puzzle dito ay <strong>totoong level mula sa laro</strong>, na nilalaro sa parehong rules: i-slide ang mga bloke sa sariling linya, huwag lumaktaw sa iba, buksan ang daan ng bida papunta sa exit gate, tapos pindutin ang bida para tumakbo palabas. May built-in solver (pareho ng move rules ng laro) para sa mga tip at sa <em>Par</em> — ang pinakakaunting move na kayang lutasin ang puzzle.',
    whatP2: 'Umiiral ito para ma-<strong>subukan at maranasan ang gameplay sa browser</strong> — walang i-install, walang i-download.',
    syncHead: '🔄 Paano ito napapanahon',
    syncP: 'Galing lahat ng data ng site sa JSON — walang hard-coded na puzzle. Kapag nagbago ang content ng laro, isang command lang at fresh na ulit ang website:',
    syncStep1: 'Binabasa ng script ang level catalog at mga pack ng laro (read-only) at kinokopya ang mga sample level sa <code>website/data/levels/</code>.',
    syncStep2: 'Bawat file ay sine-validate sa parehong rules ng laro, kaya walang sirang content na nakakarating sa site.',
    syncStep3: 'Nire-generate ang manifest na may bagong stats, track structure, at mga featured sample — awtomatikong na-update ang mga pahina at bilang.',
    dataHead: '📦 Kasalukuyang game data',
    dataNote: 'Inilalathala ng site ang unang {levels} level ng bawat pack bilang libreng sample — sapat na para matutunan at ma-test ang bawat uri ng hamon nang hindi ibinubuta ang buong laro.',
    creditsHead: '💚 Mga credit',
    creditsP: 'Content at design language © 2026 Unblock Odyssey. Ginamit ang <strong>Atkinson Hyperlegible</strong> — parehong accessibility-first na font family ng laro.',
    webSampleNote: "🎨 Web sample ito para sa pagsubok — pinasimpleng bersyon ng itsura ng laro. Ang totoong premium artwork ay nasa app.",
    creditsSub: "Ang website na ito ay pang-test na kasama, hindi ang produkto. Ang mga disenyo dito ay pinasimpleng web sample — ang totoong premium artwork, animations, at audio ay nasa Android app.",
  },
};

let lang = 'en';
try {
  const saved = localStorage.getItem('uo_lang');
  if (saved && dict[saved]) lang = saved;
} catch (e) { /* storage unavailable */ }

export function getLang() { return lang; }

export function setLang(next) {
  if (!dict[next]) return;
  lang = next;
  try { localStorage.setItem('uo_lang', lang); } catch (e) { /* ignore */ }
}

// Translate a key, optionally filling {placeholders}.
export function t(key, vars) {
  let s = dict[lang]?.[key] ?? dict.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

// Apply translations to static shell elements (index.html) via data-i18n.
export function applyStatic() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  document.documentElement.lang = lang === 'fil' ? 'fil' : 'en';
}

// Localized display info for a track (name/tagline from theme.json, with
// optional *Fil variants curated there).
export function trackDisplay(theme, trackId) {
  const info = theme.trackInfo[trackId] || { name: trackId, emoji: '🧩', tagline: '' };
  return {
    emoji: info.emoji,
    name: (lang === 'fil' && info.nameFil) || info.name,
    tagline: (lang === 'fil' && info.taglineFil) || info.tagline,
  };
}

export function packTitleDisplay(pack) {
  return (lang === 'fil' && pack.titleFil) || pack.title;
}

export function conceptDisplay(concept) {
  const fil = lang === 'fil';
  return {
    ...concept,
    displaySet: (fil && concept.setFil) || concept.set,
    displayName: (fil && concept.nameFil) || concept.name,
    displayTagline: (fil && concept.taglineFil) || concept.tagline,
    displayMotifs: (fil && concept.motifsFil) || concept.motifs,
  };
}

export function worldDisplay(world) {
  return {
    ...world,
    displayName: (lang === 'fil' && world.nameFil) || world.name,
    displayTagline: (lang === 'fil' && world.taglineFil) || world.tagline,
  };
}
