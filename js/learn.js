/* Tutorial lessons + Practice screen + Reference screen. */
(function (T) {
  'use strict';
  const { el, cardEl, fmt } = T;

  const LESSONS = [
    {
      title: 'The big picture',
      body: () => el('div', { html: `
        <p>This site teaches <strong>French Tarot</strong> (<em>Tarot français</em>), the card game played with a 78-card tarot deck.
        It is a <strong>trick-taking game</strong>, a bit like Bridge or Hearts. Here we use the classic <strong>4-player</strong> version.</p>
        <ul>
          <li>Each player gets <strong>18 cards</strong>. 6 cards are put aside face-down: the <strong>dog</strong> (<em>chien</em>).</li>
          <li>Players <strong>bid</strong>: who is confident enough to play alone against the other three?</li>
          <li>The winner of the bidding is the <strong>taker</strong> (<em>preneur</em>). They play <strong>alone</strong> against 3 <strong>defenders</strong> who team up.</li>
          <li>The deal is played in <strong>18 tricks</strong>. In each trick every player plays one card; the best card wins it.</li>
          <li>Won cards are worth points. The taker must collect <strong>enough points</strong> to fulfil their contract.</li>
        </ul>
        <div class="note">Don't worry about memorising everything. The next lessons go one step at a time, with small exercises, and in the <a href="#/play">Play</a> mode a coach can highlight legal cards and suggest moves.</div>` }),
    },
    {
      title: 'The 78 cards',
      body: () => {
        const d = el('div', {});
        d.append(el('div', { html: `
          <p>The deck has three kinds of cards:</p>
          <ul>
            <li><strong>4 suits</strong> (♠ ♥ ♣ ♦) of 14 cards each: 1 to 10, then <strong>J</strong>ack (<em>Valet</em>), Knight (<em>Cavalier</em>, shown as <strong>C</strong>), <strong>Q</strong>ueen (<em>Dame</em>) and <strong>K</strong>ing (<em>Roi</em>). The King is the highest.</li>
            <li><strong>21 trumps</strong> (<em>atouts</em>), numbered 1 to 21. Higher beats lower. Trumps beat all suit cards.</li>
            <li><strong>The Excuse</strong> (<em>l'Excuse</em>, the Fool): a special card that never wins a trick but lets you skip following suit.</li>
          </ul>
          <p>Cards with a <span class="tag">gold ring</span> are the three <strong>oudlers</strong> (<em>bouts</em>): trump 1 (the <em>Petit</em>), trump 21 (the <em>Monde</em>) and the Excuse. They are the most important cards in the game.</p>` }));
        d.append(T.deckGuide());
        return d;
      },
    },
    {
      title: 'Points & contracts',
      body: () => {
        const d = el('div', { html: `
          <p>Only some cards carry points. Total in the deck: <strong>91 points</strong>.</p>
          <table class="t"><tr><th>Card</th><th>Points</th></tr>
            <tr><td>King</td><td>4.5</td></tr><tr><td>Queen</td><td>3.5</td></tr>
            <tr><td>Knight (Cavalier)</td><td>2.5</td></tr><tr><td>Jack (Valet)</td><td>1.5</td></tr>
            <tr><td>Each oudler (Excuse, Petit, 21)</td><td>4.5</td></tr>
            <tr><td>Every other card</td><td>0.5</td></tr></table>
          <p>The more oudlers the taker holds at the end, the fewer points they need:</p>
          <table class="t"><tr><th>Oudlers</th><th>0</th><th>1</th><th>2</th><th>3</th></tr>
            <tr><td>Points needed</td><td>56</td><td>51</td><td>41</td><td>36</td></tr></table>
          <p>If the taker reaches the target, they <strong>win the contract</strong>. Otherwise they lose it. Let's practise counting:</p>` });
        const box = el('div', {});
        T.Drills.count.fn(box);
        d.append(box);
        return d;
      },
    },
    {
      title: 'Bidding',
      body: () => {
        const d = el('div', { html: `
          <p>Starting with the player right after the dealer, each player speaks <strong>once</strong>: either <strong>pass</strong> or make a bid higher than the previous one.
          The highest bid wins and that player becomes the taker. If everybody passes, the cards are re-dealt.</p>
          <table class="t"><tr><th>Bid</th><th>Multiplier</th><th>The dog…</th></tr>
            <tr><td><strong>Petite</strong> (small)</td><td>×1</td><td>shown to all; the taker adds it to their hand and discards 6 cards</td></tr>
            <tr><td><strong>Garde</strong> (guard)</td><td>×2</td><td>same as Petite</td></tr>
            <tr><td><strong>Garde Sans</strong> (without)</td><td>×4</td><td>not used; its points count for the taker</td></tr>
            <tr><td><strong>Garde Contre</strong> (against)</td><td>×6</td><td>not used; its points count for the defenders</td></tr></table>
          <p>The multiplier scales your score: a bigger risk means a bigger reward (or penalty).</p>
          <h3>What makes a good hand?</h3>
          <ul>
            <li><strong>Trumps</strong>: 6 or more is a good sign, 8+ is strong. They also protect your kings.</li>
            <li><strong>Oudlers</strong>: each one lowers the target. The Petit alone with few trumps is fragile though.</li>
            <li><strong>Kings</strong> (and Queens): points that usually come home.</li>
            <li><strong>High trumps</strong> (15–21) win late tricks.</li>
            <li><strong>Voids</strong>: having no card in a suit lets you cut it with a trump.</li>
          </ul>
          <p>Try a few hands. The coach gives you the reasoning after each guess:</p>` });
        const box = el('div', {});
        T.Drills.bid.fn(box);
        d.append(box);
        return d;
      },
    },
    {
      title: 'The dog',
      body: () => el('div', { html: `
        <p>After a <strong>Petite</strong> or <strong>Garde</strong>, the 6 dog cards are turned face up. The taker adds them to their hand (24 cards), then <strong>discards 6 cards</strong> face down. These discards count as part of the taker's points at the end.</p>
        <p>Discard rules:</p>
        <ul>
          <li>You may <strong>never</strong> discard an oudler or a King.</li>
          <li>You may discard a trump <strong>only</strong> if you cannot find 6 other cards. The defenders then see which trumps you discarded.</li>
        </ul>
        <p><strong>Strategy tip:</strong> discard low cards of your shortest suits. If you empty a suit completely (a <em>void</em>), you can trump it later. In the Play mode, the coach can suggest your discards.</p>
        <p>With <strong>Garde Sans</strong> or <strong>Garde Contre</strong>, nobody looks at the dog during the game.</p>` }),
    },
    {
      title: 'Playing a trick',
      body: () => {
        const d = el('div', { html: `
          <p>The player after the dealer leads the first trick, then the <strong>winner of each trick leads the next</strong>. Play goes counter-clockwise.</p>
          <p>When you play to a trick you have to respect, in this order:</p>
          <ol>
            <li><strong>Follow suit</strong>: if you have a card of the suit led, you must play one.</li>
            <li>If you can't follow, you <strong>must trump</strong> (play a trump).</li>
            <li>If a trump is already in the trick, you must play a <strong>higher trump</strong> if you can. If not, any trump.</li>
            <li>If you have no trump either, play <strong>any card</strong> (this is called discarding).</li>
            <li>When <strong>trump</strong> is led, the same logic applies: you must go higher if you can.</li>
          </ol>
          <p>The <strong>Excuse</strong> is always playable, whatever the rules say.</p>
          <p>The trick is won by the <strong>highest trump</strong> if there is one, otherwise by the <strong>highest card of the suit led</strong>.</p>
          <p>Practise the "which cards are legal?" rule until it feels natural:</p>` });
        const a = el('div', {}); T.Drills.legal.fn(a);
        const b = el('div', {}); T.Drills.winner.fn(b);
        d.append(a, el('p', {}, 'Now, who wins?'), b);
        return d;
      },
    },
    {
      title: 'The Excuse',
      body: () => el('div', { html: `
        <p>The Excuse is the odd one out:</p>
        <ul>
          <li>It <strong>never wins</strong> a trick, and never loses its value: the player who played it <strong>keeps it</strong> in their camp (the camp hands over a 0.5-point card in exchange).</li>
          <li>If you <strong>lead</strong> it, the next card played decides the suit of the trick.</li>
          <li>It saves you from being forced to follow suit or to trump. A classic use is to avoid giving away a valuable card.</li>
          <li><strong>Special case:</strong> if you play it in the very last trick, it goes to whoever wins that trick.</li>
        </ul>
        <p>Because it's an oudler, losing it is costly: never keep it too long hoping for a perfect moment!</p>` }),
    },
    {
      title: 'Scoring a deal',
      body: () => {
        const name = 'Garde', pts = 47, mult = 2;
        const need = 41, diff = pts - need, base = 25 + diff, per = base * mult;
        return el('div', { html: `
          <p>When all 18 tricks are played, each camp counts the points of the cards they won (the taker includes the dog discards).</p>
          <ol>
            <li>Count the taker's <strong>oudlers</strong> to find the points needed.</li>
            <li>Compute the <strong>difference</strong> between the points made and the points needed (rounded up to a whole number).</li>
            <li>Score = (<strong>25 + difference</strong>) × contract multiplier. It's positive if the taker made the contract, negative if not.</li>
            <li>The taker scores it <strong>three times</strong> (once for each defender). Each defender scores the opposite once. The deal is therefore zero-sum.</li>
          </ol>
          <div class="note"><strong>Example.</strong> The taker bid a <strong>${name}</strong> (×${mult}), finished with <strong>2 oudlers</strong> (needs ${need}) and collected <strong>${pts}</strong> points.
            Difference: ${pts} − ${need} = <strong>+${diff}</strong>. Score: (25 + ${diff}) × ${mult} = <strong>${per}</strong>.
            The taker gets <strong>+${per * 3}</strong>, each defender gets <strong>−${per}</strong>.</div>
          <p><strong>Petit au bout</strong> (“Petit at the end”): if the Petit (trump 1) is played in the <em>last</em> trick and its camp wins that trick, that camp gets a bonus of <strong>10 points × the multiplier</strong>. Risky but rewarding: protect your Petit until the very end!</p>
          <p class="muted">Not in this first version: <em>Poignée</em> (announcing a big trump hand), <em>Chelem</em> (winning all tricks), 3- and 5-player variants.</p>` });
      },
    },
    {
      title: 'First strategy tips',
      body: () => el('div', { html: `
        <h3>As a defender</h3>
        <ul>
          <li>You have <strong>two partners</strong> even though you can't talk. If a partner is winning the trick, <strong>feed it</strong>: give high-value cards when you're sure no one behind you can win.</li>
          <li>The taker's oudlers and kings are your targets. Cut kings with trumps when the taker leads them.</li>
          <li>Try to lead short suits so you become void and can trump.</li>
          <li>Keep the <strong>Petit</strong> for the last trick only if you also hold the right to win it. Otherwise it is easily captured by the 21.</li>
        </ul>
        <h3>As the taker</h3>
        <ul>
          <li>With many trumps, <strong>draw them</strong> early by leading high trumps so the defenders can't cut your kings.</li>
          <li>Cash your kings early, before the defenders become void in the suit.</li>
          <li>Count points: you only need roughly half of the 91 points.</li>
        </ul>
        <h3>Everybody</h3>
        <ul>
          <li>Don't waste high trumps on tricks worth almost nothing.</li>
          <li>When you can't win a trick, give away your <strong>least valuable</strong> card.</li>
          <li>Keep count of which trumps have been played.</li>
        </ul>
        <p>Ready? Head to <a href="#/play">Play</a> with the learning aids on, or try the <a href="#/advisor">Hand Advisor</a>.</p>` }),
    },
  ];

  /* ---------- Learn screen ---------- */
  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1
        ? el('a', { class: 'btn primary', href: `#/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/play' }, 'Play a game →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  /* ---------- Practice screen ---------- */
  function practiceScreen(root, params) {
    const keys = Object.keys(T.Drills).filter(k => k !== 'evalTable');
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const tabs = el('div', { class: 'btn-row' }, keys.map(k =>
      el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/practice/${k}` }, T.Drills[k].title)));
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Practice drills'),
      el('p', { class: 'muted' }, 'Short, endless exercises on one skill at a time.'), tabs, box));
    T.Drills[cur].fn(box);
  }

  /* ---------- Reference screen ---------- */
  function referenceScreen(root) {
    const gloss = [
      ['Atout', 'Trump. One of the 21 numbered cards that beat any suit card.'],
      ['Bout / Oudler', 'The 21, the Petit (trump 1) and the Excuse. Each is worth 4.5 points and lowers the taker\'s target.'],
      ['Chien / Dog', 'The 6 cards put aside at the deal.'],
      ['Coupe / Ruff', 'Playing a trump on a suit you cannot follow.'],
      ['Défenseur', 'One of the 3 players opposing the taker.'],
      ['Écart / Discard', 'The 6 cards the taker puts aside after taking the dog.'],
      ['Excuse', 'The Fool. Never wins a trick, always playable.'],
      ['Monde', 'Trump 21, the highest trump.'],
      ['Petit', 'Trump 1, the lowest trump (an oudler).'],
      ['Petit au bout', 'Petit played in the last trick by the camp that wins it: 10 point bonus × multiplier.'],
      ['Poignée', 'Announcing 10+ trumps for a bonus (coming in a later version).'],
      ['Chelem / Slam', 'Winning all 18 tricks (coming in a later version).'],
      ['Preneur / Taker', 'The highest bidder, who plays alone against the 3 defenders.'],
      ['Pli / Trick', 'One card from each player; one winner.'],
      ['Renonce / Void', 'Having no card in a given suit.'],
      ['Surcouper / Overtrump', 'Playing a trump higher than a trump already in the trick.'],
    ];
    root.append(el('div', { class: 'panel' },
      el('h2', {}, 'Reference'),
      el('h3', {}, 'The deck'), T.deckGuide(),
      el('h3', {}, 'Contracts & scoring'),
      el('table', { class: 't' },
        el('tr', {}, el('th', {}, 'Bid'), el('th', {}, '×'), el('th', {}, 'Dog')),
        T.CONTRACT_ORDER.map(k => el('tr', {}, el('td', {}, T.CONTRACTS[k].name), el('td', {}, '×' + T.CONTRACTS[k].mult), el('td', {}, T.CONTRACTS[k].dog)))),
      el('p', {}, el('strong', {}, 'Points needed: '), '0 oudlers → 56 · 1 → 51 · 2 → 41 · 3 → 36.'),
      el('p', {}, el('strong', {}, 'Card values: '), 'K 4.5 · Q 3.5 · C 2.5 · J 1.5 · oudlers 4.5 · others 0.5 (total 91).'),
      el('p', {}, el('strong', {}, 'Score: '), '(25 + |points − needed|) × multiplier, positive if made, negative if failed; ±10×multiplier for Petit au bout. The taker scores ×3, each defender scores the opposite.'),
      el('h3', {}, 'Glossary'),
      el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications in this version'),
      el('ul', {}, [
        'Only the 4-player game. No Poignée, no Chelem announcements.',
        'The Excuse exchange is automatic: the camp that keeps the Excuse gives away 0.5 points instead of a specific card.',
        'If the Excuse is the first card of a trick, the next card played sets the suit.',
        'If everyone passes, the cards are simply re-dealt.',
      ].map(t => el('li', {}, t)))));
  }

  T.Screens = Object.assign(T.Screens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
})(window.Tarot = window.Tarot || {});
