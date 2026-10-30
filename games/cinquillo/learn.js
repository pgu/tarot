/* El Cinquillo: lessons, practice, reference. */
(function (S) {
  'use strict';
  const { el } = S;
  const drillBox = key => { const b = el('div', {}); S.CinquilloDrills[key].fn(b); return b; };

  const LESSONS = [
    {
      title: 'La idea',
      body: () => el('div', { html: `
        <p><strong>El Cinquillo</strong> is a game of <strong>patience and blocking</strong>: you build the four suits on the table, starting from the <strong>5</strong> of each suit, and the first player to <strong>get rid of all his cards</strong> wins the round.</p>
        <p>The whole 40-card deck is dealt (10 cards each with 4 players). The player who holds the <strong>5 de oros</strong> starts by playing it. Then each player, in turn, adds <strong>one card</strong> to the table.</p>
        <div class="note">This site uses the classic rule: you may pass <strong>only if you cannot play</strong>, and passing costs nothing.</div>` }),
    },
    {
      title: 'Cómo se juega',
      body: () => {
        const d = el('div', { html: `
          <p>The order of a suit in the Spanish deck is <strong>As · 2 · 3 · 4 · 5 · 6 · 7 · Sota · Caballo · Rey</strong> (no 8 or 9). The <strong>5</strong> is the card that opens the suit, and the suit grows in <strong>both directions</strong>:</p>
          <ul>
            <li><strong>Up:</strong> 6, 7, Sota, Caballo, Rey.</li>
            <li><strong>Down:</strong> 4, 3, 2, As.</li>
          </ul>
          <p>On your turn you may play:</p>
          <ul>
            <li>a <strong>5</strong> of a suit that is not on the table yet (it opens that suit), or</li>
            <li>the card just <strong>above or below</strong> a suit that is already open.</li>
          </ul>
          <p>You <strong>must play</strong> a card if you can. Only when you have no playable card do you say <strong>"paso"</strong> and the turn goes on.</p>
          <p>Here is the board; which cards can you play?</p>` });
        d.append(drillBox('legal'));
        return d;
      },
    },
    {
      title: 'Fin de la mano y puntos',
      body: () => el('div', { html: `
        <p>The round ends as soon as a player has no cards left. The others count the cards they still hold, and the winner scores <strong>one point per card left in the opponents' hands</strong>.</p>
        <p>The first player to reach <strong>30 points</strong> wins the game.</p>
        <p class="muted">Variants exist where passing costs a chip, or where the loser pays. Ours is the classic rule without paying to pass.</p>` }),
    },
    {
      title: 'Estrategia',
      body: () => {
        const d = el('div', { html: `
          <ul>
            <li><strong>Don't open for free.</strong> Playing a 5 lets everybody continue on both sides. Do it when you also hold cards next to it.</li>
            <li><strong>Hold the keys.</strong> If you keep the 6 of a suit whose 5 is on the table, nobody can go up in that suit until you decide. Blocking is the heart of the game.</li>
            <li><strong>Close the ends.</strong> Playing a Rey (end of the line) or an As gives nothing to the others: a safe card to play.</li>
            <li><strong>Plan your runs.</strong> If you hold 5-6-7 of the same suit, playing in order will let you shed them without help.</li>
            <li><strong>Get rid of the isolated cards</strong> first: a Sota alone costs a lot of turns if you wait until the end.</li>
          </ul>
          <p>What would you play?</p>` });
        d.append(drillBox('play'));
        d.append(el('p', {}, 'Then ', el('a', { href: '#/cinquillo/play' }, 'play a game'), '.'));
        return d;
      },
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/cinquillo/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/cinquillo/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1 ? el('a', { class: 'btn primary', href: `#/cinquillo/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/cinquillo/play' }, 'Play a game →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(S.CinquilloDrills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Practice drills'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/cinquillo/practice/${k}` }, S.CinquilloDrills[k].title))), box));
    S.CinquilloDrills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Paso', 'Passing: allowed only when you have no playable card; free in this version.'], ['Abrir', 'Playing the 5 of a suit that is not on the table.'],
      ['Extremo', 'The ends of a suit on the table (where it can still grow).'], ['Llave', 'A card that blocks the others because you keep it.'],
      ['5 de oros', 'The card that starts the round: its owner plays first.'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Reference'),
      el('h3', {}, 'Order of a suit'), el('p', {}, 'As · 2 · 3 · 4 · 5 · 6 · 7 · Sota · Caballo · Rey. The 5 opens the suit; it grows up and down.'),
      el('h3', {}, 'A round in 5 lines'),
      el('ol', {}, ['Deal the whole deck (10 cards each with 4 players, 14/13/13 with 3).', 'The owner of the 5 de oros starts with it.', 'In turn, play a card that opens a suit (a 5) or continues one.', 'If you cannot play, pass.', 'The first to empty his hand wins and scores one point per card left in the others\' hands; 30 points win the game.'].map(t => el('li', {}, t))),
      el('h3', {}, 'Glossary'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications in this version'),
      el('ul', {}, ['3 or 4 players. No chip is paid when passing (classic rule).', 'Scoring: points per card left in the others\' hands, to 30.'].map(t => el('li', {}, t)))));
  }

  S.CinquilloScreens = Object.assign(S.CinquilloScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
})(window.Spanish = window.Spanish || {});
