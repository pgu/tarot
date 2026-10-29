/* La Escoba: lessons, practice, reference. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const drillBox = key => { const b = el('div', {}); S.EscobaDrills[key].fn(b); return b; };

  const LESSONS = [
    {
      title: 'The idea',
      body: () => el('div', { html: `
        <p><strong>La Escoba</strong> ("the broom") is Spain's most popular card game for beginners. Two players (or teams) take turns <strong>capturing cards from the table</strong>.</p>
        <p>The golden rule: play one card from your hand; if it <strong>plus some cards on the table adds up to exactly 15</strong>, you take all those cards. If you clear the whole table, you made an <strong>escoba</strong> (sweep) and score a bonus point.</p>
        <p>At the end of the round you count points for what you captured: most cards, most coins, sevens, the "velo", and sweeps. First to 15 points wins the game.</p>
        <div class="note">It looks like a maths game, but quick mental addition becomes automatic after a few rounds. The exercises below help.</div>` }),
    },
    {
      title: 'The Spanish deck',
      body: () => {
        const d = el('div', { html: `
          <p>The Spanish deck has <strong>40 cards</strong>: four suits of ten cards. There are no 8s, 9s or 10s printed; the figures are:</p>
          <ul>
            <li><strong>Sota</strong> (Jack, number 10)</li><li><strong>Caballo</strong> (Knight, number 11)</li><li><strong>Rey</strong> (King, number 12)</li>
          </ul>
          <p>The suits are <strong>Oros</strong> (coins 🪙), <strong>Copas</strong> (cups 🏆), <strong>Espadas</strong> (swords ⚔️) and <strong>Bastos</strong> (clubs 🌿). In this site: A = As (ace), S = Sota, C = Caballo, R = Rey.</p>
          <h3>Values in Escoba</h3>
          <table class="t"><tr><th>Card</th><th>As–7</th><th>Sota</th><th>Caballo</th><th>Rey</th></tr><tr><th>Value</th><td>1 to 7 as printed</td><td>8</td><td>9</td><td>10</td></tr></table>` });
        d.append(S.deckGuide());
        return d;
      },
    },
    {
      title: 'Making 15',
      body: () => {
        const d = el('div', { html: `
          <p>A round starts with <strong>4 cards face-up on the table</strong>, and <strong>3 cards in each hand</strong>. When both hands are empty, 3 new cards are dealt to each player, until the deck runs out. (The table is not re-dealt.)</p>
          <h3>Your turn</h3>
          <ol>
            <li>Choose a card from your hand and play it.</li>
            <li>If your card + some table cards add to <strong>15</strong>, you <strong>must capture</strong> them: they go into your pile. You can choose among several combinations if there are several.</li>
            <li>If it cannot make 15, the card is <strong>dropped</strong> on the table, where your opponent may use it.</li>
          </ol>
          <p>Example: you play a 7 of coins. The table has 5, 3 and a King (10). 7 + 5 + 3 = 15, so you take your 7, the 5 and the 3. (7 + the King = 17: no.)</p>
          <p>Try it:</p>` });
        d.append(drillBox('find15'));
        return d;
      },
    },
    {
      title: 'Escobas and the end of a round',
      body: () => el('div', { html: `
        <h3>Escoba (sweep)</h3>
        <p>If your capture <strong>clears the table completely</strong>, you made an <strong>escoba</strong>: set that card aside; it is worth <strong>1 point</strong>. Sweeping is the fastest way to score, and the reason a careful player never leaves a table that adds up to ≤ 15 with one card.</p>
        <p><strong>Exception:</strong> a sweep on the very last play of the round does not count.</p>
        <h3>End of the round</h3>
        <p>When the deck and both hands are empty, the cards still on the table go to the <strong>last player who made a capture</strong>. Then points are counted.</p>` }),
    },
    {
      title: 'Scoring',
      body: () => {
        const d = el('div', { html: `
          <p>After each round, you can score up to 5 types of points:</p>
          <table class="t"><tr><th>Point</th><th>Who gets it</th></tr>
            <tr><td><strong>Cartas</strong></td><td>the player with <strong>more cards</strong> (21+ of 40)</td></tr>
            <tr><td><strong>Oros</strong></td><td>the player with <strong>more coins</strong> (of the 10 in the deck)</td></tr>
            <tr><td><strong>Sietes</strong></td><td>the player with <strong>more sevens</strong>. If tied 2–2, whoever has more sixes.</td></tr>
            <tr><td><strong>Velo</strong> (<em>siete de velo</em>)</td><td>the player who has the <strong>7 of coins</strong></td></tr>
            <tr><td><strong>Escobas</strong></td><td>1 point for each sweep</td></tr></table>
          <p>Ties give nobody the point. The game goes on round after round until one player reaches <strong>15 points</strong> (in this site; 21 in some places).</p>
          <p>Practise scoring a round:</p>` });
        d.append(drillBox('score'));
        return d;
      },
    },
    {
      title: 'Strategy tips',
      body: () => {
        const d = el('div', { html: `
          <ul>
            <li><strong>Priorities:</strong> the 7 of coins is worth a point alone, so take it whenever you can. Then sevens, coins, and card count.</li>
            <li><strong>Avoid leaving easy sweeps.</strong> If the table adds up to 15 minus a card value your opponent probably holds, a sweep is coming. Leaving a big table (sum above 15) or a spread of cards is safer.</li>
            <li><strong>Think before you drop.</strong> Drop cards that are worth nothing and that don't help your opponent complete 15. Don't drop sevens or coins unless you have to.</li>
            <li><strong>Keep count</strong> of the cards already played, especially the sevens and the high cards, to estimate what your opponent can have.</li>
            <li><strong>Sweep possibilities:</strong> when the table has 2 or 3 cards, look for a card in your hand that clears it.</li>
            <li><strong>Mind the forced capture.</strong> A card that can capture must capture, so sometimes you play another card to avoid giving a sweep.</li>
          </ul>
          <p>Choose the best play in a few spots:</p>` });
        d.append(drillBox('best'));
        d.append(el('p', {}, 'Then ', el('a', { href: '#/escoba/play' }, 'play a real game'), ' with the coach on.'));
        return d;
      },
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/escoba/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/escoba/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1 ? el('a', { class: 'btn primary', href: `#/escoba/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/escoba/play' }, 'Play a game →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(S.EscobaDrills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Practice drills'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/escoba/practice/${k}` }, S.EscobaDrills[k].title))), box));
    S.EscobaDrills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Escoba', 'A sweep: capturing every card on the table. 1 point (not on the last play).'],
      ['Mesa', 'The table: cards face up in the middle.'],
      ['Cartas', 'Point for the most captured cards.'],
      ['Oros', 'Point for the most coins.'],
      ['Sietes', 'Point for the most sevens (tie: sixes).'],
      ['Siete de velo / velo', 'The 7 of coins, worth a point of its own.'],
      ['Sota, Caballo, Rey', 'The figures: 8, 9 and 10 in Escoba.'],
      ['Barajar / repartir', 'To shuffle / to deal.'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Reference'),
      el('h3', {}, 'A round in 6 lines'),
      el('ol', {}, ['Shuffle; put 4 cards on the table and deal 3 to each player.', 'Play a card: if it plus table cards makes 15, capture them (mandatory).', 'Otherwise drop the card on the table.', 'Clearing the table scores an escoba.', 'When hands are empty, deal 3 more each until the deck is gone.', 'Leftover table cards go to the last capturer; count the points.'].map(t => el('li', {}, t))),
      el('h3', {}, 'Values'), el('p', {}, 'As = 1 … 7 = 7 · Sota = 8 · Caballo = 9 · Rey = 10.'),
      el('h3', {}, 'The deck'), S.deckGuide(),
      el('h3', {}, 'Glossary'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications in this version'),
      el('ul', {}, ['Two players only; first to 15 points.', 'A card that can capture must capture.', 'Tie-break for sevens: sixes; no further tiebreak.'].map(t => el('li', {}, t)))));
  }

  S.EscobaScreens = Object.assign(S.EscobaScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
})(window.Spanish = window.Spanish || {});
