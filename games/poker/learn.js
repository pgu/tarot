/* Poker: lessons, practice and reference screens. */
(function (P) {
  'use strict';
  const { el, cardEl } = P;

  const drillBox = key => { const b = el('div', {}); P.Drills[key].fn(b); return b; };

  function rankingTable() {
    return el('table', { class: 't' },
      el('tr', {}, el('th', {}, '#'), el('th', {}, 'Hand'), el('th', {}, 'Example'), el('th', {}, 'What it is')),
      P.EXAMPLES.map((e, i) => el('tr', {}, el('td', {}, String(i + 1)), el('th', {}, e[0]),
        el('td', {}, el('div', { class: 'cards-row mini' }, P.ids(e[2]).map(c => cardEl(c)))), el('td', {}, e[1]))));
  }

  const LESSONS = [
    {
      title: 'What is poker?',
      body: () => el('div', { html: `
        <p>Poker is a <strong>betting game</strong>. Unlike most card games, you don't need to win "tricks" or collect points. You win <strong>chips</strong> from a shared pile called the <strong>pot</strong>.</p>
        <p>You can win a hand in two ways:</p>
        <ol>
          <li><strong>Showdown:</strong> after all the betting, remaining players show their cards and the <strong>best hand</strong> takes the pot.</li>
          <li><strong>Everyone else folds:</strong> if all your opponents give up, you win the pot <em>without showing anything</em>. This is why <strong>bluffing</strong> exists.</li>
        </ol>
        <p>There are many poker variants. This site teaches <strong>Texas Hold'em</strong>, the most popular one by far (casinos, online, tournaments, TV). We play <strong>no-limit</strong> cash-game style: a bet can be any amount up to all your chips.</p>
        <div class="note">Poker mixes <strong>maths</strong> (probabilities and odds), <strong>psychology</strong> (reading opponents) and <strong>discipline</strong> (folding bad hands). We start with the rules, then the maths.</div>` }),
    },
    {
      title: 'Hand rankings',
      body: () => {
        const d = el('div', { html: '<p>A poker hand is <strong>five cards</strong>. These are the categories, from strongest to weakest. Memorise this table first: everything else builds on it.</p>' });
        d.append(rankingTable(), el('div', { html: `<p><strong>Ties inside a category:</strong> compare the cards that make the hand, highest first (a pair of Kings beats a pair of Queens). Then compare the remaining cards, called <strong>kickers</strong>. Suits never break ties: if the five cards are equal in rank, the pot is split.</p>
          <p>Practise naming hands:</p>` }), drillBox('name'));
        return d;
      },
    },
    {
      title: 'How a Hold\'em hand works',
      body: () => el('div', { html: `
        <p>Each player gets <strong>2 private cards</strong> (the <strong>hole cards</strong>). Five <strong>community cards</strong> are dealt face-up in the middle, shared by everyone. You make your best five-card hand from <strong>any 5 of the 7 cards</strong> (your 2 + the 5 on the board). You may use both hole cards, one, or none (if the board plays).</p>
        <p>There are <strong>four betting rounds</strong>:</p>
        <table class="t"><tr><th>Round</th><th>Cards</th></tr>
          <tr><td><strong>Preflop</strong></td><td>You have your 2 hole cards only.</td></tr>
          <tr><td><strong>Flop</strong></td><td>3 community cards are dealt.</td></tr>
          <tr><td><strong>Turn</strong></td><td>A 4th community card.</td></tr>
          <tr><td><strong>River</strong></td><td>The 5th and last community card. Then the showdown.</td></tr></table>
        <p>After each round of betting, the remaining players continue to the next one. As soon as only one player is left, they win.</p>` }),
    },
    {
      title: 'Betting: blinds and actions',
      body: () => el('div', { html: `
        <h3>Blinds and the button</h3>
        <p>To make sure there is always something to win, two players post forced bets <strong>before</strong> seeing their cards:</p>
        <ul>
          <li>The <strong>small blind</strong> (SB), sitting left of the dealer button, posts a half bet.</li>
          <li>The <strong>big blind</strong> (BB), next to the SB, posts a full bet (here: $10 and $20).</li>
        </ul>
        <p>The <strong>dealer button</strong> (D) moves one seat clockwise each hand. Being <em>late</em> in the betting order (close to the button) is an advantage: you see what others do before you act.</p>
        <h3>Your actions</h3>
        <table class="t">
          <tr><th>Action</th><th>When</th><th>Meaning</th></tr>
          <tr><td><strong>Fold</strong></td><td>any time</td><td>Give up your hand and lose what you put in.</td></tr>
          <tr><td><strong>Check</strong></td><td>nobody has bet</td><td>Pass without betting.</td></tr>
          <tr><td><strong>Bet / Raise</strong></td><td>any time</td><td>Put in more chips. A raise must be at least the size of the previous bet or raise.</td></tr>
          <tr><td><strong>Call</strong></td><td>someone has bet</td><td>Match the current bet.</td></tr>
          <tr><td><strong>All-in</strong></td><td>any time</td><td>Bet all your chips. If you win, you can only win from each opponent as much as you put in ("side pots").</td></tr>
        </table>
        <p>A betting round ends when everyone still in the hand has put the same amount in the pot (or is all-in).</p>
        <p>The first action preflop is the player left of the big blind. In later rounds the first player left of the button acts first.</p>` }),
    },
    {
      title: 'The showdown',
      body: () => {
        const d = el('div', { html: `<p>At the showdown each remaining player's <strong>best five of seven</strong> cards counts. Try finding the best five yourself:</p>` });
        d.append(drillBox('best5'), el('p', {}, 'Now compare two players:'), drillBox('winner'));
        return d;
      },
    },
    {
      title: 'Odds and outs',
      body: () => {
        const d = el('div', { html: `
          <p>Poker is a game of <strong>incomplete information</strong>, so good players think in probabilities.</p>
          <h3>Outs</h3>
          <p>When you hold an unfinished hand (a <strong>draw</strong>), the unseen cards that complete it are your <strong>outs</strong>.</p>
          <ul>
            <li><strong>Flush draw</strong> (4 cards of a suit): <strong>9 outs</strong>.</li>
            <li><strong>Open-ended straight draw</strong> (4 in a row, open both ends): <strong>8 outs</strong>.</li>
            <li><strong>Gutshot</strong> (one inside card missing): <strong>4 outs</strong>.</li>
            <li>Two overcards to the board: about 6 outs to pair one.</li>
          </ul>
          <h3>The rule of 2 and 4</h3>
          <p>Multiply your outs by <strong>2</strong> to estimate your % chance to hit on the next card, or by <strong>4</strong> if you will see both the turn and the river.</p>
          <h3>Pot odds</h3>
          <p>If an opponent bets and you must call <em>$C</em> into a pot of <em>$P</em> (including their bet), you need to win at least <strong>C ÷ (P + C)</strong> of the time to break even. If your chance to hit is higher, calling is profitable in the long run; if it is lower, fold.</p>
          <p>Example: the pot is $100 and you must call $25: you need 25 ÷ 125 = <strong>20%</strong>.</p>
          <p>Try it:</p>` });
        d.append(drillBox('outs'));
        return d;
      },
    },
    {
      title: 'Starting hands',
      body: () => {
        const d = el('div', { html: `
          <p>There are 1,326 possible hole-card combinations, but only the strongest are worth playing. <strong>Beginners lose mostly by playing too many weak hands.</strong></p>
          <p>Rule of thumb on hand value:</p>
          <ul>
            <li><strong>Pairs</strong> are strong (AA and KK are the best hands; even 22 can win with a lucky 3rd card).</li>
            <li><strong>High cards</strong> (A, K, Q, J, 10) win more often.</li>
            <li><strong>Suited</strong> cards (same suit) are a little better (flush chances).</li>
            <li><strong>Connected</strong> cards (like 8-9) have straight chances.</li>
          </ul>
          <p>A quick scoring system is the <strong>Chen formula</strong>: it adds points for high cards, pairs, suitedness and connectedness. Here we use: <strong>9+ raise · 5–8 call · under 5 fold</strong>. The coach shows the score for every hand you get.</p>
          <p>Notation: <strong>AKs</strong> = Ace-King suited, <strong>AKo</strong> = offsuit, <strong>77</strong> = pair of sevens.</p>
          <p>Practise:</p>` });
        d.append(drillBox('preflop'));
        return d;
      },
    },
    {
      title: 'Beginner strategy',
      body: () => el('div', { html: `
        <ul>
          <li><strong>Play fewer hands, play them aggressively.</strong> Folding is not boring: it is the cheapest way to avoid losing.</li>
          <li><strong>Betting beats calling.</strong> When you bet, you can win two ways (they fold, or you have the best hand). When you only call, you win one way.</li>
          <li><strong>Use position.</strong> Act last whenever possible: you see what others do first. Play more hands on the button and fewer in early seats.</li>
          <li><strong>Count pot odds</strong> before calling a draw (lesson 6).</li>
          <li><strong>Don't fall in love with one pair.</strong> If the betting gets big, a single pair is often beaten.</li>
          <li><strong>Mind your stack.</strong> With fewer than ~12 big blinds, push all-in with decent hands rather than calling around.</li>
          <li><strong>Bluff rarely and with a plan</strong>: against few opponents, with a story that makes sense.</li>
          <li><strong>Don't chase losses.</strong> Each hand is independent. Bad luck is part of the game.</li>
        </ul>
        <p>Now play: in <a href="#/poker/play">Play</a> the coach shows your win chance, the pot odds, and a suggested action for every decision.</p>` }),
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/poker/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/poker/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1
        ? el('a', { class: 'btn primary', href: `#/poker/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/poker/play' }, 'Play a game →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(P.Drills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Practice drills'),
      el('p', { class: 'muted' }, 'Short, endless exercises on one skill at a time.'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/poker/practice/${k}` }, P.Drills[k].title))), box));
    P.Drills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Blinds', 'Forced bets posted by the two players left of the button (small blind and big blind).'],
      ['Button (D)', 'Marks the dealer. The best seat: you act last after the flop.'],
      ['Board', 'The community cards.'],
      ['Check', 'Pass without betting (only if nobody has bet).'],
      ['Call', 'Match the current bet.'],
      ['Raise', 'Increase the current bet.'],
      ['Fold', 'Give up your hand.'],
      ['All-in', 'Bet all your chips.'],
      ['Flop / Turn / River', 'The 3rd, 4th and 5th community cards (also the names of the betting rounds).'],
      ['Showdown', 'Remaining players reveal their cards; the best five-card hand wins.'],
      ['Kicker', 'An unpaired side card that breaks ties between equal hands.'],
      ['Outs', 'Unseen cards that would complete your draw.'],
      ['Pot odds', 'The price you pay to call compared with the pot.'],
      ['Equity', 'Your chance to win the pot (counting half for ties).'],
      ['Draw', 'An unfinished hand that needs a card to complete (flush draw, straight draw).'],
      ['Side pot', 'When a player is all-in for less, extra bets from others go in a separate pot they cannot win.'],
      ['Bluff', 'Betting a weak hand to make better hands fold.'],
      ['Position', 'Your place in the betting order. Later is better.'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Reference'),
      el('h3', {}, 'Hand rankings'), rankingTable(),
      el('h3', {}, 'A Hold\'em hand in 5 lines'),
      el('ol', {}, ['Post blinds, deal 2 hole cards each.', 'Preflop betting.', 'Flop (3 cards) + betting.', 'Turn (1 card) + betting.', 'River (1 card) + betting, then showdown: best 5 of 7 wins.'].map(t => el('li', {}, t))),
      el('h3', {}, 'Quick maths'),
      el('ul', {}, [
        'Flush draw = 9 outs · open-ended straight draw = 8 · gutshot = 4.',
        'Chance to hit ≈ outs × 2 % (one card to come) or outs × 4 % (two cards).',
        'Pot odds: you need C ÷ (pot + C) to call a bet of C.',
      ].map(t => el('li', {}, t))),
      el('h3', {}, 'Glossary'),
      el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications in this version'),
      el('ul', {}, [
        'Texas Hold\'em no-limit cash game with fixed blinds ($10/$20) and 4 seats.',
        'A short all-in raise reopens the betting for everyone (real rules only do so for a full raise).',
        'No time bank, straddles, antes or rake. No tournaments yet.',
      ].map(t => el('li', {}, t)))));
  }

  P.Screens = Object.assign(P.Screens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
})(window.Poker = window.Poker || {});
