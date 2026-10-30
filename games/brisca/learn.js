/* La Brisca: lessons, practice, reference. */
(function (S) {
  'use strict';
  const { el } = S;
  const drillBox = key => { const b = el('div', {}); S.BriscaDrills[key].fn(b); return b; };

  const LESSONS = [
    {
      title: 'La idea',
      body: () => el('div', { html: `
        <p><strong>La Brisca</strong> is the easiest trick-taking game with the Spanish deck, and the classic game of Spanish families. Here: <strong>one against one</strong>.</p>
        <p>Each player gets <strong>3 cards</strong>. The next card is turned up: its suit is the <strong>triunfo</strong> (also called <em>pinta</em>). Players take turns playing one card each (a <em>baza</em>, a trick); the winner takes both cards, then both draw back to 3 cards. When the deck is gone, you play out the last 3 tricks.</p>
        <p>Cards won are worth points. The deck has <strong>120 points</strong>: the first player to get <strong>more than 60</strong> wins (60–60 is a draw).</p>
        <div class="note">No obligations: you do <strong>not</strong> have to follow the suit or try to win. Any card may be played at any time. That is what makes it simple… and tricky.</div>` }),
    },
    {
      title: 'Las cartas',
      body: () => {
        const d = el('div', { html: `
          <p>From the <strong>strongest</strong> to the weakest: <strong>As · Tres · Rey · Caballo · Sota · 7 · 6 · 5 · 4 · 2</strong> (the 8 and 9 do not exist in the Spanish deck).</p>
          <table class="t"><tr><th>Card</th><th>As</th><th>Tres</th><th>Rey</th><th>Caballo</th><th>Sota</th><th>Others</th></tr><tr><th>Points</th><td>11</td><td>10</td><td>4</td><td>3</td><td>2</td><td>0</td></tr></table>
          <p>Each suit is worth 30 points, 120 for the whole deck. The As and the Tres are the cards everybody wants: the ones you must capture.</p>
          <p>Practise the count:</p>` });
        d.append(drillBox('count'));
        return d;
      },
    },
    {
      title: 'La partida',
      body: () => {
        const d = el('div', { html: `
          <ol>
            <li>The dealer deals <strong>3 cards</strong> to each player and turns the next card face up: the <strong>pinta</strong>. It goes under the <strong>monte</strong> (the stock) and is the last card to be drawn.</li>
            <li>The player who is not the dealer <strong>leads</strong> the first trick (plays a card); the other one answers with any card.</li>
            <li><strong>Who wins?</strong> If both cards are of the same suit, the higher one. A <strong>triunfo</strong> beats every card of another suit. Otherwise (a card of another suit that is not a triumph), the card led wins.</li>
            <li>The winner takes the two cards, <strong>draws first</strong> from the monte, and leads the next trick.</li>
            <li>When the monte is empty, you keep playing with the cards you have: the last three tricks.</li>
          </ol>
          <p>Try the question that matters most:</p>` });
        d.append(drillBox('winner'));
        return d;
      },
    },
    {
      title: 'Estrategia',
      body: () => {
        const d = el('div', { html: `
          <ul>
            <li><strong>Don't lead points.</strong> If you play an As or a Tres of a non-triumph suit, your rival can simply cut it with any triumph. Lead low cards (2, 4, 5, 6, 7) and let the rival spend theirs.</li>
            <li><strong>Win the tricks that have points</strong> (As, Tres, Rey) with the cheapest card that can. Both cards go to the winner, so the card you use is never lost.</li>
            <li><strong>Save your triunfos</strong> (called <em>briscas</em>) for tricks with points. Wasting a triumph on a trick of zeros is rarely worth it.</li>
            <li><strong>Count the cards.</strong> Which Ases and Tres of each suit are gone? A card is <em>sure</em> when all the higher ones have been played.</li>
            <li><strong>In the last tricks</strong>, lead your highest triunfos to <em>arrastrar</em> (drag out) those of your rival, then cash your sure cards.</li>
          </ul>
          <p>What would you play?</p>` });
        d.append(drillBox('play'));
        d.append(el('p', {}, 'Then ', el('a', { href: '#/brisca/play' }, 'play a hand'), '.'));
        return d;
      },
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/brisca/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/brisca/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1 ? el('a', { class: 'btn primary', href: `#/brisca/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/brisca/play' }, 'Play a hand →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(S.BriscaDrills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Practice drills'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/brisca/practice/${k}` }, S.BriscaDrills[k].title))), box));
    S.BriscaDrills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Baza', 'A trick: one card from each player.'], ['Triunfo / pinta', 'The trump suit, given by the face-up card. Its cards are called briscas.'],
      ['Monte', 'The stock you draw from.'], ['Cargar', 'To throw points (As, Tres) on a trick you are sure to win.'],
      ['Arrastrar', 'To lead triumphs to make the rival spend his.'], ['Mano', 'The player who leads (the one who is not the dealer in the first trick).'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Reference'),
      el('h3', {}, 'Order and points'), el('p', {}, 'As 11 · Tres 10 · Rey 4 · Caballo 3 · Sota 2 · 7, 6, 5, 4, 2: 0. Strength: As > Tres > Rey > Caballo > Sota > 7 > 6 > 5 > 4 > 2. Total 120.'),
      el('h3', {}, 'A hand in 5 lines'),
      el('ol', {}, ['Deal 3 cards each; turn up the pinta (the triumph).', 'The non-dealer leads; the other answers with any card.', 'Highest of the suit led wins, any triumph beats other suits.', 'The winner draws first and leads next.', 'More than 60 points wins; 60–60 is a draw.'].map(t => el('li', {}, t))),
      el('h3', {}, 'Glossary'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications in this version'),
      el('ul', {}, ['Two players only (the 4-player game in pairs with señas is not included).', 'No "cambiar el siete" (swapping the 7 of triumph for the pinta).'].map(t => el('li', {}, t)))));
  }

  S.BriscaScreens = Object.assign(S.BriscaScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
})(window.Spanish = window.Spanish || {});
