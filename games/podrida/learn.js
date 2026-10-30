/* La Podrida: lessons, practice, reference. */
(function (S) {
  'use strict';
  const { el } = S;
  const drillBox = key => { const b = el('div', {}); S.PodridaDrills[key].fn(b); return b; };

  const LESSONS = [
    {
      title: 'La idea',
      body: () => el('div', { html: `
        <p><strong>La Podrida</strong> is a trick-taking game where winning many tricks is <strong>not</strong> the goal: you must win <strong>exactly</strong> the number of tricks you announced. Win one too many or one too few and you "rot" (<em>te pudres</em>).</p>
        <p>The game is played in several rounds. In the first round everybody gets <strong>1 card</strong>, in the second <strong>2 cards</strong>, and so on up to a maximum, then it goes back down to 1. In each round you first <strong>bid</strong> how many tricks (<em>bazas</em>) you will win, then you play the tricks. Points depend on how well you kept your word.</p>
        <p>After all the rounds, the player with the <strong>most points</strong> wins.</p>` }),
    },
    {
      title: 'Cartas y triunfo',
      body: () => el('div', { html: `
        <ul>
          <li><strong>Order of the cards</strong> (from the highest): <strong>As · Rey · Caballo · Sota · 7 · 6 · 5 · 4 · 3 · 2</strong>.</li>
          <li>After dealing, the next card of the deck is turned up: its suit is the <strong>triunfo</strong> (triumph) of the round.</li>
          <li>A triumph beats every card of another suit; among triumphs, the highest wins.</li>
        </ul>
        <p>The player to the dealer's right is the <strong>mano</strong>: he speaks first and leads the first trick. After each trick, the winner leads the next one.</p>` }),
    },
    {
      title: 'Las apuestas',
      body: () => {
        const d = el('div', { html: `
          <p>Starting with the mano, each player announces <strong>how many tricks he will win</strong> (from 0 to the number of cards he holds). A hand with an As and some triumphs can bid several tricks; a hand of low cards will bid 0.</p>
          <div class="note"><strong>The dealer speaks last and may not bid the number that makes the total of all bids equal to the number of tricks.</strong> That way somebody always fails.</div>
          <p>Estimate your tricks:</p>` });
        d.append(drillBox('bid'), el('p', {}, 'And the forbidden bid:'), drillBox('forbidden'));
        return d;
      },
    },
    {
      title: 'El juego de las bazas',
      body: () => {
        const d = el('div', { html: `
          <p>The obligations are simple:</p>
          <ol>
            <li>You must <strong>follow the suit led</strong> if you can (you are <em>not</em> forced to play a higher card).</li>
            <li>If you cannot follow, you must play a <strong>triumph</strong> if you have one.</li>
            <li>If you have neither, you may play <strong>any card</strong>.</li>
          </ol>
          <p>The art of the game: if you still need tricks, play to win them; once you have made your bid, you must <strong>avoid</strong> winning more, and throw away your high cards.</p>
          <p>Which cards can you play?</p>` });
        d.append(drillBox('legal'));
        return d;
      },
    },
    {
      title: 'Puntos y estrategia',
      body: () => {
        const d = el('div', { html: `
          <p><strong>Scoring of each round:</strong></p>
          <ul>
            <li>You win <strong>exactly</strong> your bid: <strong>10 points + 2 per trick bid</strong> (a bid of 0 achieved gives 10).</li>
            <li>Otherwise you <strong>lose 2 points for each trick</strong> of difference.</li>
          </ul>
          <p>Strategy:</p>
          <ul>
            <li><strong>Bid honestly, not greedily.</strong> A bid of 0 is worth 10 points if you can keep losing all the tricks.</li>
            <li><strong>As the dealer,</strong> use your last-to-speak advantage: you know what the others bid.</li>
            <li><strong>Keep control.</strong> Once you reached your bid, get rid of the aces and triumphs by playing them when someone else will beat them.</li>
            <li><strong>Count the triumphs</strong> played to know when your high cards are safe.</li>
          </ul>
          <p>A calculation:</p>` });
        d.append(drillBox('points'), el('p', {}, 'Ready? ', el('a', { href: '#/podrida/play' }, 'Play a game'), '.'));
        return d;
      },
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/podrida/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/podrida/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1 ? el('a', { class: 'btn primary', href: `#/podrida/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/podrida/play' }, 'Play a game →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(S.PodridaDrills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Practice drills'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/podrida/practice/${k}` }, S.PodridaDrills[k].title))), box));
    S.PodridaDrills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Baza', 'A trick.'], ['Triunfo', 'The trump suit: the suit of the card turned up after dealing.'], ['Mano', 'The player to the dealer\'s right: speaks and leads first.'],
      ['Apuesta', 'The number of tricks you announce.'], ['Podrida', 'A failed bid ("rotten").'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Reference'),
      el('h3', {}, 'Card order'), el('p', {}, 'As > Rey > Caballo > Sota > 7 > 6 > 5 > 4 > 3 > 2.'),
      el('h3', {}, 'A round in 5 lines'),
      el('ol', {}, ['Deal the round\'s number of cards (1, 2, 3 … then back down); turn one card up for the triumph.', 'Starting with the mano, everybody bids a number of tricks; the dealer cannot make the bids add up to the number of tricks.', 'Play the tricks: follow suit, else play a triumph if you have one, else anything.', 'Count: exact bid = 10 + 2 per trick bid; otherwise −2 per trick of difference.', 'After the last round, the highest total wins.'].map(t => el('li', {}, t))),
      el('h3', {}, 'Glossary'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications in this version'),
      el('ul', {}, ['3 to 5 players; a short game (1→5→1) or a longer one (up to 9 cards).', 'Scoring as described above (the most common one); other tables score differently.', 'You are never forced to play a higher card than the one winning the trick.'].map(t => el('li', {}, t)))));
  }

  S.PodridaScreens = Object.assign(S.PodridaScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
})(window.Spanish = window.Spanish || {});
