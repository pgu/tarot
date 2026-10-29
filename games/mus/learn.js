/* El Mus: lessons, practice, reference. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const drillBox = key => { const b = el('div', {}); S.MusDrills[key].fn(b); return b; };

  const LESSONS = [
    {
      title: 'La idea',
      body: () => el('div', { html: `
        <p><strong>El Mus</strong> is Spain's most social card game (especially in the north and the Basque Country). It is played by <strong>two couples</strong> (<em>parejas</em>) sitting crosswise: your partner is the player opposite you. You share the points, but you can't show your cards to each other (real players use <strong>señas</strong>, secret signs).</p>
        <p>Each player gets <strong>4 cards</strong>. Before betting, players can <strong>change cards</strong> ("mus"). Then the hand is played in <strong>four lances</strong> (rounds): <strong>Grande</strong>, <strong>Chica</strong>, <strong>Pares</strong> and <strong>Juego</strong> (or <strong>Punto</strong>). In each lance you can bet (<em>envidar</em>) that your couple has the best hand. The couple that reaches <strong>40 piedras</strong> (points) first wins the game.</p>
        <div class="note">Mus is a game of <strong>bluff</strong>: you win many points without even showing your cards, just by making the rivals say "no quiero".</div>` }),
    },
    {
      title: 'Las cartas',
      body: () => {
        const d = el('div', { html: `
          <p>The Spanish deck has 40 cards. The most common version is <strong>mus a 8 reyes</strong>, the one used here:</p>
          <ul>
            <li>The <strong>3</strong> counts as a <strong>rey</strong> and the <strong>2</strong> counts as an <strong>as</strong>. (That makes 8 reyes and 8 ases.)</li>
            <li><strong>Values</strong> (for the juego): rey, caballo, sota and the 3 = <strong>10</strong>; as and the 2 = <strong>1</strong>; the 4, 5, 6 and 7 as printed.</li>
            <li><strong>Order</strong> (from the highest card): rey (3) · caballo · sota · 7 · 6 · 5 · 4 · as (2).</li>
          </ul>
          <p>The small tag on a 3 (<strong>=R</strong>) or a 2 (<strong>=A</strong>) reminds you of this.</p>` });
        d.append(S.deckGuide());
        return d;
      },
    },
    {
      title: 'El mus y el descarte',
      body: () => el('div', { html: `
        <p>The player to the right of the dealer is the <strong>mano</strong> (the first to speak); the role moves one seat every hand.</p>
        <p>Each player, starting with the mano, says either <strong>"mus"</strong> (I want to change cards) or <strong>"no hay mus"</strong> (I cut).</p>
        <ul>
          <li>If <strong>everybody</strong> says mus, each player discards <strong>any number of cards</strong> (0 to 4) and receives the same number from the deck. Then it is asked again.</li>
          <li>As soon as <strong>one player</strong> says "no hay mus", the changing ends and the lances begin with the cards you have.</li>
        </ul>
        <p>You cut when your hand is good (a pair of reyes, 31, three reyes…). You ask for mus when your hand is weak and you hope to improve it.</p>
        <p>Practise the decision:</p>` }),
    },
    {
      title: 'Grande y Chica',
      body: () => {
        const d = el('div', { html: `
          <p>The first two lances are the simplest and everybody takes part:</p>
          <ul>
            <li><strong>Grande:</strong> the <strong>highest</strong> hand wins. Compare the best card of each hand, then the second, and so on. (Rey > caballo > sota > 7 > 6 > 5 > 4 > as.)</li>
            <li><strong>Chica:</strong> the <strong>lowest</strong> hand wins. Compare the lowest card of each hand first (as, then 4, …).</li>
          </ul>
          <p>If two hands tie, the one closest to the <strong>mano</strong> (in playing order) wins.</p>
          <p>Try it:</p>` });
        d.append(drillBox('compare'));
        return d;
      },
    },
    {
      title: 'Pares y Juego',
      body: () => {
        const d = el('div', { html: `
          <h3>Pares</h3>
          <p>Before betting, each player says whether he has <strong>pares</strong> ("sí" or "no tengo"). Only players with pares take part:</p>
          <ul>
            <li><strong>Par:</strong> two cards of the same number (1 point).</li>
            <li><strong>Medias:</strong> three of the same number (2 points).</li>
            <li><strong>Duples:</strong> two pairs, or four of the same number (3 points).</li>
          </ul>
          <p>Duples beat medias, and medias beat a par. The couple that wins the lance gets the pares points of <strong>both</strong> its players on top of the bets. If only one couple has pares, there is no betting: it just scores.</p>
          <h3>Juego y Punto</h3>
          <p>Add up the values of your four cards. With <strong>31 or more</strong> you have <strong>juego</strong>. The order: <strong>31</strong> (best) > 32 > 40 > 37 > 36 > 35 > 34 > 33. Winning juego gives 3 points for a 31 and 2 for the others (per player of the winning couple that has juego).</p>
          <p>If <strong>nobody</strong> has juego, the lance is <strong>punto</strong>: the closest to 30 wins (1 point).</p>
          <p>Practise:</p>` });
        d.append(drillBox('pares'), drillBox('juego'));
        return d;
      },
    },
    {
      title: 'Envites y órdago',
      body: () => el('div', { html: `
        <p>In each lance the players speak in order, starting with the mano:</p>
        <ul>
          <li><strong>Paso:</strong> I don't bet.</li>
          <li><strong>Envido:</strong> I bet. Here: <strong>envido 2</strong> or <strong>envido 5</strong> piedras.</li>
          <li><strong>Órdago:</strong> I bet <strong>the whole game</strong>. If accepted, the winner of the lance wins the game.</li>
        </ul>
        <p>The rivals then answer: <strong>quiero</strong> (I accept), <strong>no quiero</strong> (I refuse) or <strong>subo</strong> (I raise). Both rivals have to say "no quiero" to refuse; if one of them says "quiero", the bet is accepted.</p>
        <ul>
          <li>If the bet is <strong>refused</strong>, the couple that bet wins what was previously accepted: <strong>1 piedra</strong> for a first envite. The cards are not shown.</li>
          <li>If it is <strong>accepted</strong>, the cards are compared at the end; the winning couple scores the bet (plus pares/juego points).</li>
          <li>If everybody passes: 1 piedra for grande, chica and punto; the pares and juego points are still scored.</li>
        </ul>
        <p>After the four lances there is the <strong>recuento</strong>: points are counted lance by lance in order. The first couple to reach <strong>40 piedras</strong> wins.</p>` }),
    },
    {
      title: 'Consejos',
      body: () => el('div', { html: `
        <ul>
          <li><strong>Bluff with Grande and Chica.</strong> If you pass, your rivals may think you are weak; a well-timed envido makes them say "no quiero" and you win a piedra.</li>
          <li><strong>Pares and juego are known.</strong> The "sí / no tengo" tells everybody who can win, so bet when your couple clearly has the best cards.</li>
          <li><strong>Trust your partner.</strong> If your partner bets, he usually has something; support him if you hold good cards.</li>
          <li><strong>Near 40, think about the órdago.</strong> When your rivals are close to winning, you may bet everything on a strong hand.</li>
          <li><strong>Señas.</strong> Real players tell their partner what they hold with secret signs. Here your partner is a bot, so there are no señas.</li>
        </ul>
        <p>Ready? <a href="#/mus/play">Play a game</a>.</p>` }),
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/mus/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/mus/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1 ? el('a', { class: 'btn primary', href: `#/mus/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/mus/play' }, 'Play a game →'));
    const body = lesson.body();
    if (idx === 2) body.append(drillBox('mus'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), body, pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(S.MusDrills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Practice drills'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/mus/practice/${k}` }, S.MusDrills[k].title))), box));
    S.MusDrills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Mano', 'The first player to speak in the hand; wins ties.'], ['Pareja', 'A couple: you and the player opposite you.'],
      ['Mus / No hay mus', 'Ask to change cards / cut the changing and start the lances.'], ['Descarte', 'Cards thrown away to receive new ones.'],
      ['Lance', 'One of the four rounds: grande, chica, pares, juego (or punto).'], ['Envido', 'A bet (here 2 or 5 piedras).'],
      ['Subo / Quiero / No quiero', 'Raise / accept / refuse.'], ['Órdago', 'A bet for the whole game.'],
      ['Piedras', 'The points (to 40).'], ['Recuento', 'The counting of the points after the four lances.'],
      ['Par / Medias / Duples', 'A pair / three of a kind / two pairs or four of a kind.'], ['Señas', 'Secret signs between partners (not in this version).'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Reference'),
      el('h3', {}, 'Cards (8 reyes)'), el('p', {}, 'Order: rey (and 3) > caballo > sota > 7 > 6 > 5 > 4 > as (and 2). Values: rey/3, caballo, sota = 10 · as/2 = 1 · 4, 5, 6, 7 as printed.'),
      el('h3', {}, 'Points in the recuento'),
      el('table', { class: 't' }, el('tr', {}, el('th', {}, 'Lance'), el('th', {}, 'If all pass'), el('th', {}, 'Extras for the winning couple')),
        el('tr', {}, el('td', {}, 'Grande'), el('td', {}, '1'), el('td', {}, '—')), el('tr', {}, el('td', {}, 'Chica'), el('td', {}, '1'), el('td', {}, '—')),
        el('tr', {}, el('td', {}, 'Pares'), el('td', {}, '0'), el('td', {}, 'par 1 · medias 2 · duples 3, for each player of the couple who has them')),
        el('tr', {}, el('td', {}, 'Juego'), el('td', {}, '0'), el('td', {}, '31 → 3 · other juegos → 2, for each player of the couple who has it')),
        el('tr', {}, el('td', {}, 'Punto'), el('td', {}, '1'), el('td', {}, '—'))),
      el('p', {}, 'Accepted bets add their stake to the winner. A refused bet gives the bettors what was previously accepted (1 for the first envite) and the cards are not shown.'),
      el('h3', {}, 'Glossary'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications in this version'),
      el('ul', {}, ['Mus a 8 reyes, single game to 40 piedras (no "vacas").', 'Bets are 2 or 5 piedras, plus órdago; raises of +2 or +5.', 'No señas: your partner is a bot.', 'Mus is asked until somebody cuts ("mus corrido" without the cutting restrictions).'].map(t => el('li', {}, t)))));
  }

  S.MusScreens = Object.assign(S.MusScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
  void cardEl;
})(window.Spanish = window.Spanish || {});
