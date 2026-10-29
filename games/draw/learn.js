/* Five-card draw: lessons, practice, reference. */
(function (P) {
  'use strict';
  const { el, cardEl } = P;
  const D = P.DrawBots;
  const drillBox = key => { const b = el('div', {}); P.DrawDrills[key].fn(b); return b; };

  const rankingTable = () => el('table', { class: 't' },
    el('tr', {}, el('th', {}, '#'), el('th', {}, 'Hand'), el('th', {}, 'Example'), el('th', {}, 'What it is')),
    P.EXAMPLES.map((e, i) => el('tr', {}, el('td', {}, String(i + 1)), el('th', {}, e[0]),
      el('td', {}, el('div', { class: 'cards-row mini' }, P.ids(e[2]).map(c => cardEl(c)))), el('td', {}, e[1]))));

  /** Live simulation: chance to hit the target with a typical draw. */
  function oddsTable() {
    const scen = [
      ['One pair, draw 3', '9S 9H KD 5C 2D', [0, 1], 'Two pair or better', 2],
      ['Three of a kind, draw 2', '8S 8H 8D KC 2D', [0, 1, 2], 'Full house or four of a kind', 6],
      ['Two pair, draw 1', 'JS JH 4D 4C 9D', [0, 1, 2, 3], 'Full house', 6],
      ['Four to a flush, draw 1', '2H 7H 9H KH 4C', [0, 1, 2, 3], 'Flush', 5],
      ['Four to an open straight, draw 1', '5S 6H 7D 8C KD', [0, 1, 2, 3], 'Straight', 4],
      ['Nothing, keep 2 high cards, draw 3', 'AS KH 7D 4C 2S', [0, 1], 'A pair or better', 1],
    ];
    const tbl = el('table', { class: 't' }, el('tr', {}, el('th', {}, 'Situation'), el('th', {}, 'Example hand'), el('th', {}, 'Goal'), el('th', {}, 'Chance')));
    scen.forEach(([name, h, keep, goal, cat]) => {
      const hand = P.ids(h);
      const odds = D.drawOdds(hand, keep, 4000);
      const p = odds.slice(cat).reduce((s, x) => s + x, 0);
      tbl.append(el('tr', {}, el('td', {}, name), el('td', {}, el('div', { class: 'cards-row mini' }, hand.map(c => cardEl(c)))), el('td', {}, goal), el('td', {}, P.Bots.pct(p))));
    });
    return tbl;
  }

  const LESSONS = [
    {
      title: 'What is five-card draw?',
      body: () => el('div', { html: `
        <p><strong>Five-card draw</strong> is the classic home-game poker, the one you see in old western movies. It is simpler than Texas Hold'em:</p>
        <ul>
          <li>Each player gets <strong>5 private cards</strong>. There are <strong>no community cards</strong>.</li>
          <li>There is a <strong>first round of betting</strong>.</li>
          <li>Then comes <strong>the draw</strong>: each player may <strong>swap up to 3 cards</strong> for new ones from the deck.</li>
          <li>A <strong>second round of betting</strong>, then the <strong>showdown</strong>: the best five-card hand wins the pot. If everyone else folds, you win without showing.</li>
        </ul>
        <p>The hand rankings are exactly the same as in Hold'em. The new skill is deciding <strong>which cards to keep</strong>, and <strong>reading what your opponents' draws tell you</strong>: the number of cards each player swaps is visible to everybody.</p>
        <div class="note">Already know Texas Hold'em? You can skim the lessons about rankings and betting; the draw and the strategy are what differ.</div>` }),
    },
    {
      title: 'Hand rankings',
      body: () => {
        const d = el('div', { html: '<p>Same ranking as in all poker games, from strongest to weakest. In draw poker the hands you make are a bit weaker on average than in Hold\'em: <strong>a pair of Jacks or better</strong> is often enough to win a pot.</p>' });
        d.append(rankingTable(), el('p', {}, 'Practise naming hands:'), drillBox('name'), el('p', {}, 'And comparing two hands:'), drillBox('winner'));
        return d;
      },
    },
    {
      title: 'Betting and the draw',
      body: () => el('div', { html: `
        <h3>Blinds and button</h3>
        <p>As in Hold'em, the player left of the dealer <strong>button</strong> posts the <strong>small blind</strong> ($10) and the next player the <strong>big blind</strong> ($20). Betting starts with the player left of the big blind.</p>
        <h3>Actions</h3>
        <p><strong>Fold</strong> (give up), <strong>check</strong> (pass when nobody has bet), <strong>call</strong> (match the bet), <strong>raise</strong> (bet more). A round ends when everybody still in has put in the same amount.</p>
        <h3>The draw</h3>
        <p>Starting left of the button, each player still in the hand says how many cards they discard (0 to 3) and receives the same number from the deck. Taking <strong>no cards</strong> is called <strong>standing pat</strong>: it announces you already hold a made hand (or want others to think so!).</p>
        <p>After the draw, a second betting round takes place, starting left of the button. With only two betting rounds, pots are decided quickly.</p>
        <div class="note">Some tables allow 4 cards if you keep an ace. Here the maximum is <strong>3 cards</strong>.</div>` }),
    },
    {
      title: 'What to keep',
      body: () => {
        const d = el('div', { html: `
          <p>The key question of the game: <strong>which cards do I keep?</strong> A simple guide:</p>
          <table class="t"><tr><th>You have</th><th>Do</th></tr>
            <tr><td>Straight, flush, full house or better</td><td><strong>Stand pat</strong>: swap nothing.</td></tr>
            <tr><td>Three of a kind</td><td>Keep the three, swap 2.</td></tr>
            <tr><td>Two pair</td><td>Keep both pairs, swap 1.</td></tr>
            <tr><td>One pair</td><td>Keep the pair, swap 3.</td></tr>
            <tr><td>Four to a flush or an open-ended straight (no pair)</td><td>Keep the four, swap 1.</td></tr>
            <tr><td>Nothing</td><td>Keep your two highest cards, swap 3.</td></tr></table>
          <p>How likely is the draw to work? These figures are simulated live in your browser:</p>` });
        d.append(oddsTable(), el('p', { class: 'muted' }, 'Notice that a flush draw hits about one time in five, and a pair improves about one time in three. Drawing is a gamble: that is why pot odds still matter (see the Texas Hold\'em lessons).'),
          el('p', {}, 'Try it yourself:'), drillBox('keep'));
        return d;
      },
    },
    {
      title: 'Reading and strategy',
      body: () => el('div', { html: `
        <ul>
          <li><strong>Count the draws.</strong> A player who draws <strong>3</strong> cards most likely holds just a pair (or a bluff). One who draws <strong>1</strong> has two pair or a four-card draw. One who <strong>stands pat</strong> has a made hand: straight or better (or is bluffing).</li>
          <li><strong>Be wary of pat hands.</strong> If an opponent stands pat and bets big after the draw, a single pair is rarely good. The coach lowers your win chance accordingly.</li>
          <li><strong>Open with strength.</strong> Before the draw, raise with a pair of Jacks or better, and fold weak hands when someone raises.</li>
          <li><strong>Position helps:</strong> the last player to draw has seen everyone else's number of swapped cards.</li>
          <li><strong>A pair of Aces, Kings or Queens</strong> can win without improving, but most pots need two pair.</li>
          <li><strong>Bluffing:</strong> standing pat (or drawing one card) while holding nothing is the classic bluff. It works best against few opponents.</li>
        </ul>
        <p>Time to play: in <a href="#/draw/play">Play</a>, the coach tells you what to keep, how likely your draw is to hit, and what the bets mean.</p>` }),
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/draw/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/draw/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1
        ? el('a', { class: 'btn primary', href: `#/draw/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/draw/play' }, 'Play a game →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(P.DrawDrills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Practice drills'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/draw/practice/${k}` }, P.DrawDrills[k].title))), box));
    P.DrawDrills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Draw', 'Swapping cards from your hand for new ones from the deck.'],
      ['Stand pat', 'Keep all five cards (draw zero).'],
      ['Discard', 'A card you throw away at the draw.'],
      ['Made hand', 'A hand that is already good (straight or better) and needs no draw.'],
      ['Draw to a flush / straight', 'Keep four cards of a flush or an open straight and swap the fifth.'],
      ['Blinds', 'Forced bets by the two players left of the button.'],
      ['Showdown', 'Remaining players reveal their cards; best five-card hand wins.'],
      ['Kicker', 'An unpaired side card that breaks ties.'],
      ['Pot odds', 'The price to call compared with the pot.'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Reference'),
      el('h3', {}, 'A hand in 5 lines'),
      el('ol', {}, ['Post blinds, deal 5 cards to each player.', 'First betting round.', 'The draw: each player swaps 0–3 cards.', 'Second betting round.', 'Showdown: best five-card hand wins.'].map(t => el('li', {}, t))),
      el('h3', {}, 'Hand rankings'), rankingTable(),
      el('h3', {}, 'Glossary'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications in this version'),
      el('ul', {}, ['No-limit with fixed blinds ($10/$20), 4 seats, no antes.', 'Maximum 3 cards per draw.', 'A short all-in raise reopens the betting.'].map(t => el('li', {}, t)))));
  }

  P.DrawScreens = Object.assign(P.DrawScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
})(window.Poker = window.Poker || {});
