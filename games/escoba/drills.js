/* La Escoba drills. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const val = S.escobaValue;
  const B = S.EscobaBots;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Next exercise →');
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, (ok ? '✔ ' : '✘ ') + text);
  const sumOf = cards => cards.reduce((s, c) => s + val(c), 0);
  const label = cards => cards.map(c => c.text).join(' + ');

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }

  /* ----- 1. find the 15 ----- */
  function find15(box) {
    shell(box, 'Make 15', 'Your card plus the table cards you pick must add up to 15. Values: 1–7 as printed, Sota 8, Caballo 9, Rey 10.', (body, run) => {
      let card, table, caps;
      for (;;) {
        const d = S.shuffle(S.DECK.slice());
        card = d[0]; table = S.sortCards(d.slice(1, 1 + rint(4, 7)));
        caps = S.findCaptures(card, table);
        if (caps.length || Math.random() < 0.2) break;
      }
      const sel = new Set();
      const nodes = new Map();
      const info = el('span', { class: 'muted' });
      const fb = el('div', { class: 'feedback' });
      let done = false;
      const upd = () => {
        const chosen = table.filter(c => sel.has(c.id));
        info.textContent = chosen.length ? `${val(card)} + ${chosen.map(c => val(c)).join(' + ')} = ${val(card) + sumOf(chosen)}` : `Your card is worth ${val(card)}.`;
      };
      const show = (ok, text) => {
        done = true; check.disabled = true; none.disabled = true;
        caps.forEach(cp => cp.forEach(c => nodes.get(c.id).classList.add('capture')));
        fb.append(verdict(ok, text),
          caps.length ? el('p', {}, 'Possible captures: ', caps.map(cp => `${card.text} + ${label(cp)}`).join('  ·  '))
            : el('p', {}, `No combination of table cards adds up to ${15 - val(card)}, so you would have to drop the card.`),
          nextBtn(run));
      };
      const check = el('button', { class: 'btn primary', onclick: () => {
        const chosen = table.filter(c => sel.has(c.id));
        const ok = chosen.length > 0 && val(card) + sumOf(chosen) === 15;
        show(ok, ok ? 'Yes, that makes 15!' : `That adds up to ${val(card) + sumOf(chosen)}, not 15.`);
      } }, 'Capture');
      const none = el('button', { class: 'btn', onclick: () => show(!caps.length, !caps.length ? 'Right: no capture is possible.' : 'There was a capture available.') }, 'No capture possible');
      body.append(el('div', {}, el('strong', {}, 'Your card:')), el('div', { class: 'hand flat' }, cardEl(card)),
        el('div', {}, el('strong', {}, 'On the table (click to select):')),
        el('div', { class: 'hand flat' }, table.map(c => {
          const n = cardEl(c, { onclick: (_, e) => {
            if (done) return;
            if (sel.has(c.id)) { sel.delete(c.id); e.classList.remove('chosen'); } else { sel.add(c.id); e.classList.add('chosen'); }
            upd();
          } });
          nodes.set(c.id, n); return n;
        })), info, el('div', { class: 'btn-row' }, check, none), fb);
      upd();
    });
  }

  /* ----- 2. score a round ----- */
  function scoreDrill(box) {
    shell(box, 'Score the round', 'The round is over. Each player counted their captured cards. How many points does Player A score?', (body, run) => {
      const d = S.shuffle(S.DECK.slice());
      const n = rint(15, 25);
      const piles = [d.slice(0, n), d.slice(n)];
      const escobas = [rint(0, 3), rint(0, 3)];
      const res = S.scorePiles(piles, escobas);
      const cnt = (p, f) => p.filter(f).length;
      body.append(el('table', { class: 't' },
        el('tr', {}, el('th', {}), el('th', {}, 'Player A'), el('th', {}, 'Player B')),
        [['Cards', p => p.length], ['Oros (coins)', p => cnt(p, c => c.suit === 'O')], ['Sevens', p => cnt(p, c => c.rank === 7)], ['Sixes', p => cnt(p, c => c.rank === 6)], ['7 de Oros', p => (p.some(c => c.id === 'O7') ? 'yes' : '–')]]
          .map(([name, f]) => el('tr', {}, el('td', {}, name), el('td', {}, String(f(piles[0]))), el('td', {}, String(f(piles[1]))))),
        el('tr', {}, el('td', {}, 'Escobas (sweeps)'), el('td', {}, String(escobas[0])), el('td', {}, String(escobas[1])))));
      const input = el('input', { type: 'number', min: 0, max: 12, placeholder: 'points' });
      const fb = el('div', { class: 'feedback' });
      const go = () => {
        if (input.value === '') return;
        input.disabled = true; btn.disabled = true;
        const ok = parseInt(input.value, 10) === res.points[0];
        fb.append(verdict(ok, ok ? 'Correct!' : `Player A scores ${res.points[0]}.`),
          el('table', { class: 't' }, res.categories.map(c => el('tr', {}, el('td', {}, c.name),
            el('td', {}, c.each ? `A ${c.values[0]} · B ${c.values[1]}` : c.winner < 0 ? 'tie, nobody scores' + (c.note ? ` (${c.note})` : '') : `${c.winner === 0 ? 'Player A' : 'Player B'} +1${c.note ? ` (${c.note})` : ''}`)))),
          el('p', {}, `Totals: A ${res.points[0]}, B ${res.points[1]}.`), nextBtn(run));
      };
      const btn = el('button', { class: 'btn primary', onclick: go }, 'Check');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      body.append(el('div', { class: 'btn-row' }, input, btn), fb);
    });
  }

  /* ----- 3. best move ----- */
  function bestMove(box) {
    shell(box, 'What is the best play?', 'You hold three cards. Pick the play you like best; then see how the coach ranks it.', (body, run) => {
      const d = S.shuffle(S.DECK.slice());
      const g = new S.Escoba();
      g.hands = [S.sortCards(d.slice(0, 3)), S.sortCards(d.slice(3, 6))];
      g.table = S.sortCards(d.slice(6, 6 + rint(4, 6)));
      g.deck = d.slice(20); g.piles = [[], []]; g.turn = 0;
      const opts = B.options(g, 0);
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-col' });
      opts.forEach((o, k) => row.append(el('button', { class: 'btn', style: 'display:block;margin:4px 0;text-align:left', onclick: () => {
        row.querySelectorAll('button').forEach(b => { b.disabled = true; });
        const rank = k + 1;
        const gap = opts[0].score - o.score;
        fb.append(rank === 1 || gap < 0.4 ? verdict(true, rank === 1 ? 'The best play!' : 'Almost as good as the best play.') : verdict(false, `The coach ranks this play #${rank} of ${opts.length}.`),
          el('p', {}, el('strong', {}, 'Best: '), describe(opts[0]), ' ', opts[0].reason),
          el('p', { class: 'muted' }, 'The coach values sweeps, the 7 de Oros, sevens, coins and card count, and avoids leaving a table that gives the opponent an easy capture.'), nextBtn(run));
      } }, describe(o))));
      body.append(el('div', {}, el('strong', {}, 'Table:')), S.cardsRow(g.table),
        el('div', {}, el('strong', {}, 'Your hand:')), S.cardsRow(g.hands[0]), el('p', {}, el('strong', {}, 'Choose your play:')), row, fb);
    });
  }

  function describe(o) {
    return o.capture ? `Play ${o.card.text} and take ${label(o.capture)}` : `Drop ${o.card.text}`;
  }

  S.EscobaDrills = {
    find15: { title: 'Make 15', fn: find15 },
    score: { title: 'Score the round', fn: scoreDrill },
    best: { title: 'Best play', fn: bestMove },
  };
  S.escobaDescribe = describe;
})(window.Spanish = window.Spanish || {});
