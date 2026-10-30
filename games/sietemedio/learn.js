/* El Siete y medio: lessons, practice, reference. */
(function (S) {
  'use strict';
  const { el } = S;
  const M = S.SM;
  const drillBox = key => { const b = el('div', {}); S.SMDrills[key].fn(b); return b; };

  const riskTable = () => el('table', { class: 't' }, el('tr', {}, el('th', {}, 'You have'), el('th', {}, 'Risk of going over on the next card'), el('th', {}, 'Usual decision')),
    [3, 4, 4.5, 5, 5.5, 6, 6.5, 7].map(t => {
      const r = M.bustProb(Math.round(t * 2));
      return el('tr', {}, el('td', {}, S.smFmt(t)), el('td', {}, Math.round(r * 100) + '%'), el('td', {}, t <= 4.5 ? 'Carta' : t >= 5.5 ? 'Me planto' : 'A toss-up'));
    }));

  const LESSONS = [
    {
      title: 'La idea',
      body: () => el('div', { html: `
        <p><strong>El Siete y medio</strong> is the Spanish "blackjack": get as close as possible to <strong>7½ without going over</strong>.</p>
        <p>One player is the <strong>banca</strong> (the bank) and the others play <strong>against the bank</strong>, each one on his own. Every player gets a card, then asks for more cards one by one (<strong>"carta"</strong>) or stops (<strong>"me planto"</strong>). If you go over 7½ you are out (<strong>"me paso"</strong>). Finally the bank plays, and each player is compared with it.</p>
        <p>Here we play <strong>without chips</strong>: every duel you win against the bank is a point for you (and every duel the bank wins is a point for the bank). The role of bank changes every round. The first to reach <strong>12 points</strong> wins.</p>` }),
    },
    {
      title: 'Las cartas',
      body: () => {
        const d = el('div', { html: `
          <p>The values are simple:</p>
          <ul>
            <li><strong>As to 7:</strong> their number (1, 2, … 7).</li>
            <li><strong>Sota, Caballo and Rey:</strong> <strong>half a point</strong> (½).</li>
          </ul>
          <p>The best hand is <strong>7½</strong>. A 7½ made with <strong>two cards only</strong> (a 7 and a figure) is the <strong>"siete y medio real"</strong>: it beats any other 7½ and is worth <strong>2 points</strong>.</p>
          <p>Practise the addition:</p>` });
        d.append(drillBox('sum'));
        return d;
      },
    },
    {
      title: 'La banca y el duelo',
      body: () => {
        const d = el('div', { html: `
          <ol>
            <li>Every player (and the bank) receives <strong>one card</strong>, which only he sees.</li>
            <li>In turn, each player (starting with the one after the bank) asks for cards or stands. The <strong>bank plays last</strong>.</li>
            <li>Then each player is compared with the bank:
              <ul>
                <li>If you <strong>went over</strong>, you lose, even if the bank also goes over (the bank gets it first).</li>
                <li>If the bank went over and you did not, <strong>you win</strong>.</li>
                <li>Otherwise the <strong>higher total</strong> wins, and <strong>ties go to the bank</strong>.</li>
              </ul></li>
          </ol>
          <p>The bank has the advantage: ties and the player who goes over. In exchange, it plays last and knows how many players are still in.</p>
          <p>Try the duel:</p>` });
        d.append(drillBox('duel'));
        return d;
      },
    },
    {
      title: 'Estrategia',
      body: () => {
        const d = el('div', { html: `
          <p>The key number is the <strong>risk of going over</strong> with the next card. Figures only add ½, so low totals are safe:</p>` });
        d.append(riskTable(), el('div', { html: `
          <ul>
            <li><strong>Up to 4½:</strong> ask for another card.</li>
            <li><strong>From 5½:</strong> stand: you would go over one time in two.</li>
            <li><strong>With 5:</strong> it depends: against many players the bank is more likely to go over; if you are the bank, think about how many are still in.</li>
            <li><strong>As the bank:</strong> if everybody went over, don't draw. If several players are still in, they usually stand on 5½–7½, so you need to keep drawing.</li>
          </ul>
          <p>Decide:</p>` }), drillBox('hit'), el('p', {}, 'Then ', el('a', { href: '#/sietemedio/play' }, 'play a round'), '.'));
        return d;
      },
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/sietemedio/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/sietemedio/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1 ? el('a', { class: 'btn primary', href: `#/sietemedio/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/sietemedio/play' }, 'Play a game →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(S.SMDrills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Practice drills'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/sietemedio/practice/${k}` }, S.SMDrills[k].title))), box));
    S.SMDrills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Banca', 'The player everybody plays against; plays last.'], ['Carta', 'Ask for another card.'], ['Me planto', 'I stand: no more cards.'],
      ['Me paso', 'I went over 7½: I am out.'], ['Siete y medio real', 'A 7½ made with two cards: beats any other 7½ (2 points).'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Reference'),
      el('h3', {}, 'Values'), el('p', {}, 'As to 7: their number · sota, caballo, rey: ½. The goal is 7½ without going over.'),
      el('h3', {}, 'A round in 5 lines'),
      el('ol', {}, ['One card each, face down. The bank changes every round.', 'Each player asks for cards or stands; going over means out.', 'The bank plays last.', 'Each player is compared with the bank: higher total wins, ties go to the bank.', 'Each duel won is 1 point (2 with a "siete y medio real"). First to 12 wins.'].map(t => el('li', {}, t))),
      el('h3', {}, 'Risk of going over'), riskTable(),
      el('h3', {}, 'Glossary'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications in this version'),
      el('ul', {}, ['No chips or bets: only rounds (duels) won.', 'Stopping at 7½ is automatic.', 'The bank rotates every round.', 'Hands are hidden until the end of the round.'].map(t => el('li', {}, t)))));
  }

  S.SMScreens = Object.assign(S.SMScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
})(window.Spanish = window.Spanish || {});
