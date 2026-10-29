/* Chinchón: lessons, practice, reference. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const drillBox = key => { const b = el('div', {}); S.ChinchonDrills[key].fn(b); return b; };
  const ex = (title, ids) => el('div', { class: 'slot' }, el('div', { class: 'hand flat', style: 'justify-content:flex-start' }, S.ids(ids).map(c => cardEl(c))), title);

  const LESSONS = [
    {
      title: 'La idea',
      body: () => el('div', { html: `
        <p><strong>Chinchón</strong> is the Spanish rummy. Each player gets <strong>7 cards</strong> and tries to arrange them into <strong>combinaciones</strong> (sets and runs). On your turn you <strong>draw</strong> a card and <strong>discard</strong> one. The round ends when a player <strong>cierra</strong> (closes) with almost all of the cards combined.</p>
        <p>At the end of the round, <strong>points are bad</strong>: you add up the cards you could <em>not</em> combine, and you want to stay <strong>under 100</strong> for as long as possible. Whoever goes over 100 is eliminated, and the last one standing wins.</p>
        <div class="note">Rare big finish: the <strong>Chinchón</strong> itself: all 7 cards in one single run of the same suit. It wins the whole game on the spot!</div>` }),
    },
    {
      title: 'Las combinaciones',
      body: () => {
        const d = el('div', { html: `
          <p>There are two kinds of combinations (you need at least <strong>3 cards</strong>):</p>
          <ul>
            <li><strong>Trío / cuarteto</strong>: 3 or 4 cards of the <strong>same number</strong>, all of different suits. Example: the 5 de oros, 5 de copas and 5 de espadas.</li>
            <li><strong>Escalera</strong> (run): 3 or more <strong>consecutive cards of the same suit</strong>.</li>
          </ul>
          <p><strong>Careful with the Spanish deck!</strong> It has no 8 or 9, so in a run the <strong>7 is followed by the Sota</strong> (10), then the Caballo (11) and the Rey (12). The Rey does <strong>not</strong> connect with the As.</p>` });
        d.append(el('div', { class: 'trick-line' }, ex('Trío', 'O5 C5 E5'), ex('Cuarteto', 'O12 C12 E12 B12'), ex('Escalera', 'E2 E3 E4 E5'), ex('Escalera 7–Sota–Caballo', 'B6 B7 B10 B11')),
          el('p', {}, 'Which of these is valid?'), drillBox('valid'));
        return d;
      },
    },
    {
      title: 'Robar y descartar',
      body: () => el('div', { html: `
        <p>The deck is shuffled, 7 cards are dealt to each player, and the next card is turned face up to start the <strong>descarte</strong> (discard pile). The rest is the <strong>mazo</strong> (stock). Play goes <strong>counter-clockwise</strong>.</p>
        <h3>Your turn</h3>
        <ol>
          <li><strong>Draw</strong> one card: either the top card of the <strong>mazo</strong> (unknown) or the top card of the <strong>descarte</strong> (visible).</li>
          <li>You now have 8 cards. <strong>Discard</strong> one face up on the pile (you may not throw back the card you just took from the pile), or <strong>close</strong> the round (next lesson).</li>
        </ol>
        <p>Take the visible card only if it helps (it makes a combination or gets you closer), because it also tells the others what you need!</p>` }),
    },
    {
      title: 'Cerrar',
      body: () => {
        const d = el('div', { html: `
          <p>When you hold 8 cards you can <strong>cerrar</strong> if, after discarding one card <strong>face down</strong>, the other 7 leave <strong>5 points or fewer</strong> unmatched.</p>
          <ul>
            <li>Closing with <strong>0 unmatched points</strong> (all 7 cards in combinations): you get <strong>−10</strong>!</li>
            <li>The <strong>Chinchón</strong> (7 cards in one run) wins the whole game immediately.</li>
          </ul>
          <p>When somebody closes, everyone reveals their cards and adds the points of the cards that cannot be combined. The closer adds theirs too (≤ 5).</p>
          <h3>Card points</h3>
          <p>As = 1 … 7 = 7 · Sota, Caballo, Rey = <strong>10</strong> each.</p>
          <p>Practise counting what is left over:</p>` });
        d.append(drillBox('deadwood'), el('p', {}, 'And decide when you may close:'), drillBox('close'));
        return d;
      },
    },
    {
      title: 'Estrategia',
      body: () => {
        const d = el('div', { html: `
          <ul>
            <li><strong>Get rid of the high cards first.</strong> Figures (10 points) hurt a lot if the round ends suddenly.</li>
            <li><strong>Keep pairs and neighbours</strong> (two cards of the same number, or consecutive cards of the same suit): they may become combinations.</li>
            <li><strong>Watch the descarte.</strong> If a rival takes the 5 de copas, they probably hold other 5s or a copas run. Do not feed them what they need.</li>
            <li><strong>Close early</strong> when you can: 5 points now is better than gambling for 0 and giving the others time.</li>
            <li><strong>Don't hold on to many separate runs</strong> that need exact cards. Two solid combinations plus a low card is the typical way to close.</li>
          </ul>
          <p>Discard practice:</p>` });
        d.append(drillBox('discard'), el('p', {}, 'Then ', el('a', { href: '#/chinchon/play' }, 'play a real game'), '.'));
        return d;
      },
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/chinchon/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/chinchon/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1 ? el('a', { class: 'btn primary', href: `#/chinchon/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/chinchon/play' }, 'Play a game →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(S.ChinchonDrills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Practice drills'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/chinchon/practice/${k}` }, S.ChinchonDrills[k].title))), box));
    S.ChinchonDrills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Mazo', 'The stock: face-down cards to draw from.'],
      ['Descarte', 'The discard pile; its top card is visible and may be taken.'],
      ['Trío / cuarteto', 'Three / four cards of the same number (different suits).'],
      ['Escalera', 'Run: 3+ consecutive cards of the same suit (…6, 7, Sota, Caballo, Rey).'],
      ['Cerrar', 'End the round by discarding face down with ≤ 5 points left unmatched.'],
      ['Chinchón', '7 cards in a single run of one suit: wins the game.'],
      ['Mano', 'The player who starts the round.'],
      ['Puntos sueltos', 'Points of the cards not in any combination.'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Reference'),
      el('h3', {}, 'A round in 5 lines'),
      el('ol', {}, ['Deal 7 cards each, turn one card up for the descarte.', 'Draw from the mazo or the descarte.', 'Discard one card (or close).', 'Close with ≤ 5 unmatched points (0 gives −10; a 7-card run wins the game).', 'Everyone adds their unmatched points; over 100 you are out.'].map(t => el('li', {}, t))),
      el('h3', {}, 'Card points'), el('p', {}, 'As–7: as printed · Sota, Caballo, Rey: 10.'),
      el('h3', {}, 'Run order'), el('p', {}, 'As · 2 · 3 · 4 · 5 · 6 · 7 · Sota · Caballo · Rey (the Rey does not connect with the As).'),
      el('h3', {}, 'Glossary'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications in this version'),
      el('ul', {}, ['No comodines (jokers): the deck has the usual 40 cards.', 'Closing when someone else has fewer points gives no extra penalty.', 'A round where nobody can close after 60 turns is void ("tablas").', '2 to 4 players; limit 100 points.'].map(t => el('li', {}, t)))));
  }

  S.ChinchonScreens = Object.assign(S.ChinchonScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
})(window.Spanish = window.Spanish || {});
