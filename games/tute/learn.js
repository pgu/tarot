/* El Tute: lessons, practice, reference. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const drillBox = key => { const b = el('div', {}); S.TuteDrills[key].fn(b); return b; };

  const LESSONS = [
    {
      title: 'La idea',
      body: () => el('div', { html: `
        <p><strong>El Tute</strong> is the great Spanish trick-taking game. This site teaches the <strong>tute arrastrado</strong> in its two-player version.</p>
        <p>Each player gets <strong>6 cards</strong>. A card is turned face up: its suit is the <strong>triunfo</strong> (triumph, also called <em>pinta</em>). Players play <strong>20 tricks</strong> (<em>bazas</em>); the cards won are worth points, and you also score extra points for <strong>cantes</strong> (singing a king + knight pair) and for winning the last trick (<strong>diez de últimas</strong>). The player with <strong>more points</strong> wins the hand.</p>
        <div class="note">Rare jackpot: <strong>cuatro reyes</strong> or <strong>cuatro caballos</strong> in your hand = <strong>¡Tute!</strong> and you win the hand immediately.</div>` }),
    },
    {
      title: 'La baraja: orden y puntos',
      body: () => {
        const d = el('div', { html: `
          <p>The order of the cards is special. From the <strong>strongest</strong> to the weakest:</p>
          <p style="font-size:1.1rem"><strong>As · Tres · Rey · Caballo · Sota · 7 · 6 · 5 · 4 · 2</strong></p>
          <table class="t"><tr><th>Card</th><th>As</th><th>Tres</th><th>Rey</th><th>Caballo</th><th>Sota</th><th>Others</th></tr><tr><th>Points</th><td>11</td><td>10</td><td>4</td><td>3</td><td>2</td><td>0</td></tr></table>
          <p>Each suit is worth <strong>30</strong> points, so the whole deck is worth <strong>120</strong> points. Practise counting:</p>` });
        d.append(drillBox('count'));
        return d;
      },
    },
    {
      title: 'Las bazas',
      body: () => {
        const d = el('div', { html: `
          <h3>Preparation</h3>
          <p>6 cards are dealt to each player and the next card is turned face up (the <strong>pinta</strong>). The rest is the <strong>monte</strong> (stock); the pinta lies at the bottom of it and is drawn last. The player who is not the dealer leads the first trick.</p>
          <h3>Winning a trick</h3>
          <ul>
            <li>If the reply is the <strong>same suit</strong>, the <strong>higher</strong> card wins.</li>
            <li>A <strong>triunfo</strong> (triumph) beats every card of another suit.</li>
            <li>A card of another suit (not triumph) never wins.</li>
          </ul>
          <p>The winner takes both cards and <strong>leads the next trick</strong>. While there are cards in the monte, after each trick <strong>the winner draws first</strong>, then the loser. <strong>Until the monte runs out, nobody has to follow suit or win the trick.</strong></p>
          <p>Try it:</p>` });
        d.append(drillBox('winner'));
        return d;
      },
    },
    {
      title: 'El arrastre',
      body: () => {
        const d = el('div', { html: `
          <p>When the monte is empty (after 14 tricks) the last 6 tricks are the <strong>arrastre</strong>, and strict obligations start:</p>
          <ol>
            <li><strong>Asistir:</strong> you must follow the suit led if you can.</li>
            <li><strong>Montar:</strong> and you must play a <strong>higher</strong> card of that suit if you have one.</li>
            <li><strong>Fallar:</strong> if you have no card of that suit, you <strong>must play a triumph</strong>.</li>
            <li>If you have neither, play anything.</li>
          </ol>
          <p>The person leading is always free to play any card.</p>
          <p>Practise the obligations:</p>` });
        d.append(drillBox('arrastre'));
        return d;
      },
    },
    {
      title: 'Cantes, el 7 y las últimas',
      body: () => {
        const d = el('div', { html: `
          <h3>Cantar</h3>
          <p>Right after you <strong>win a trick</strong> (and before you lead the next one), if you hold the <strong>Rey and the Caballo of the same suit</strong> you may <strong>cantar</strong>:</p>
          <ul>
            <li><strong>Las veinte:</strong> a pair in any suit: <strong>20</strong> points.</li>
            <li><strong>Las cuarenta:</strong> the pair of the triumph suit: <strong>40</strong> points.</li>
          </ul>
          <p>Each suit can be sung once. Your rival then knows you hold those cards.</p>
          <h3>Cambiar el siete</h3>
          <p>After winning a trick, if you hold the <strong>7 of triumph</strong> you may swap it for the face-up pinta while the monte still has cards. It is a great trade when the pinta is an As, a Tres or a Rey.</p>
          <h3>Diez de últimas</h3>
          <p>Whoever wins the <strong>last trick</strong> gets <strong>10</strong> extra points.</p>
          <h3>Tute</h3>
          <p>Four reyes or four caballos in your hand: ¡tute! You win the hand at once.</p>
          <p>How many points could this hand sing?</p>` });
        d.append(drillBox('cantes'));
        return d;
      },
    },
    {
      title: 'Estrategia',
      body: () => el('div', { html: `
        <ul>
          <li><strong>Before the arrastre</strong> nobody is forced to follow, so leading an As or a Tres is dangerous: the rival can simply win it with any triumph. <strong>Lead low cards</strong> (2, 4, 5, 6, 7 of non-triumph suits) and let the rival spend theirs.</li>
          <li><strong>Win the tricks that carry points.</strong> Both cards go to the winner, so when the rival leads a Rey, taking it with your cheapest winning card is almost free.</li>
          <li><strong>Don't waste triumphs</strong> on tricks with no points, unless you need the initiative to sing a cante.</li>
          <li><strong>Keep your Rey + Caballo pairs</strong> until you have won a trick and can sing them.</li>
          <li><strong>Plan the arrastre.</strong> At the end, keep triumphs and cards that are the highest left in their suit. Count which As and Tres have been played.</li>
          <li><strong>Win the last trick</strong>: the 10 de últimas often decides a close hand.</li>
        </ul>
        <p>Now <a href="#/tute/play">play a hand</a> with the coach on.</p>` }),
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/tute/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/tute/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1 ? el('a', { class: 'btn primary', href: `#/tute/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/tute/play' }, 'Play a hand →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(S.TuteDrills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Practice drills'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/tute/practice/${k}` }, S.TuteDrills[k].title))), box));
    S.TuteDrills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Baza', 'A trick: one card from each player.'],
      ['Triunfo / pinta', 'The triumph suit, set by the face-up card. Beats every other suit.'],
      ['Monte', 'The stock. While it has cards, nobody has to follow suit.'],
      ['Arrastre', 'The last six tricks, once the monte is empty. You must asistir, montar or fallar.'],
      ['Asistir / montar / fallar', 'Follow suit / play higher / play a triumph.'],
      ['Cantar', 'Announce a Rey + Caballo pair after winning a trick: 20, or 40 in triumph.'],
      ['Cambiar el siete', 'Swap your 7 of triumph for the face-up pinta.'],
      ['Diez de últimas', '10 points for the last trick.'],
      ['Tute', 'Four reyes or four caballos: wins the hand.'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Reference'),
      el('h3', {}, 'Order and points'), el('p', {}, 'As 11 · Tres 10 · Rey 4 · Caballo 3 · Sota 2 · 7, 6, 5, 4, 2: 0 points. Strength: As > Tres > Rey > Caballo > Sota > 7 > 6 > 5 > 4 > 2. Total 120 points + cantes + 10 de últimas.'),
      el('h3', {}, 'A hand in 6 lines'),
      el('ol', {}, ['Deal 6 cards each; turn up the pinta (the triumph).', 'The winner of each trick draws first and leads next.', 'After a win you may cantar, cambiar el siete, or declare tute.', 'Until the monte is empty you may play any card.', 'In the arrastre: asistir, montar, fallar.', 'Count points: cards + cantes + 10 de últimas. More points wins.'].map(t => el('li', {}, t))),
      el('h3', {}, 'Glossary'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications in this version'),
      el('ul', {}, ['Tute arrastrado for 2 players only (the 4-player pairs game and tute subastado are not here yet).', 'You are not forced to lead a card of the suit you just sang.', 'Swapping the 2 of triumph (some tables allow it) is not included.', 'A hand is won by whoever has more points; each win counts one game point.'].map(t => el('li', {}, t)))));
  }

  S.TuteScreens = Object.assign(S.TuteScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
  void cardEl;
})(window.Spanish = window.Spanish || {});
