/* El Cinquillo drills. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const SEQ = S.CINQ_SEQ;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Next exercise →');
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, (ok ? '✔ ' : '✘ ') + text);

  /** A random mid-game situation: which cards are on the table, and a hand. */
  function scenario(handSize) {
    const table = { O: null, C: null, E: null, B: null };
    const used = new Set();
    S.SUITS.forEach(s => {
      if (Math.random() < 0.15) return;
      const lo = rint(0, 4); const hi = rint(4, 9);
      table[s] = { lo, hi };
      for (let i = lo; i <= hi; i++) used.add(s + SEQ[i]);
    });
    const pool = S.shuffle(S.DECK.filter(c => !used.has(c.id)));
    return { table, hand: S.sortCards(pool.slice(0, handSize)), used };
  }

  /** The cards of the table, one row per suit (compact). */
  function tableView(table) {
    return el('div', { class: 'cinq-board' }, S.SUITS.map(s => el('div', { class: 'cinq-row' },
      el('span', { class: 'cinq-label' }, S.icon(s)),
      ...SEQ.map((r, i) => {
        const t = table[s];
        return t && i >= t.lo && i <= t.hi ? cardEl(S.card(s + r)) : el('div', { class: 'cinq-slot' }, r === 1 ? 'A' : r >= 10 ? ({ 10: 'S', 11: 'C', 12: 'R' })[r] : String(r));
      }))));
  }

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }

  function legalDrill(box) {
    shell(box, '¿Qué puedes jugar?', 'Click every card of your hand that you may play now. A card is playable if it is a 5 of a suit that has not started, or if it continues a suit on the table (one step up or down).', (body, run) => {
      const { table, hand } = scenario(8);
      const legal = new Set(S.cinquilloLegal(hand, table, false).map(c => c.id));
      const sel = new Set(); const nodes = {};
      let done = false;
      const fb = el('div', { class: 'feedback' });
      const check = el('button', { class: 'btn primary', onclick: () => {
        done = true; check.disabled = true;
        hand.forEach(c => { nodes[c.id].classList.remove('selected'); nodes[c.id].classList.add(legal.has(c.id) ? 'right' : sel.has(c.id) ? 'wrong' : 'dim'); });
        const ok = hand.every(c => legal.has(c.id) === sel.has(c.id));
        fb.append(verdict(ok, ok ? '¡Correcto!' : 'No exactamente: green cards are the playable ones.'),
          legal.size ? el('p', {}, 'Playable: ' + hand.filter(c => legal.has(c.id)).map(c => c.text).join(' ')) : el('p', {}, 'Nothing is playable: you would have to pass (without paying anything).'), nextBtn(run));
      } }, 'Check');
      body.append(tableView(table), el('div', {}, el('strong', {}, 'Your hand:')),
        el('div', { class: 'hand flat' }, hand.map(c => { const n = cardEl(c, { onclick: (_, e) => { if (done) return; if (sel.has(c.id)) { sel.delete(c.id); e.classList.remove('selected'); } else { sel.add(c.id); e.classList.add('selected'); } } }); nodes[c.id] = n; return n; })),
        el('div', { class: 'btn-row' }, check), fb);
    });
  }

  function playDrill(box) {
    shell(box, '¿Qué juegas?', 'Several cards are playable. Which one is the best play?', (body, run) => {
      let sc; let opts;
      for (let t = 0; t < 100; t++) { sc = scenario(7); opts = S.cinquilloLegal(sc.hand, sc.table, false); if (opts.length >= 2) break; }
      const best = S.CinquilloBots.choose({ hand: sc.hand, table: sc.table, first: false });
      const fb = el('div', { class: 'feedback' });
      let done = false; const nodes = {};
      body.append(tableView(sc.table), el('div', {}, el('strong', {}, 'Your hand (click the card you play):')),
        el('div', { class: 'hand flat' }, sc.hand.map(c => {
          const n = cardEl(c, { onclick: () => {
            if (done || !opts.includes(c)) return; done = true;
            const ok = c === best.card;
            nodes[best.card.id].classList.add('right'); if (!ok) nodes[c.id].classList.add('wrong');
            fb.append(verdict(ok, ok ? 'Same as the coach!' : 'The coach would play another card.'), el('p', {}, el('strong', {}, best.card.text), ' – ', best.reason),
              el('p', { class: 'muted' }, 'Other plays can be fine: this is a rule of thumb.'), nextBtn(run));
          } });
          if (!opts.includes(c)) n.classList.add('dim');
          nodes[c.id] = n; return n;
        })), fb);
    });
  }

  S.CinquilloDrills = { legal: { title: '¿Qué puedes jugar?', fn: legalDrill }, play: { title: '¿Qué juegas?', fn: playDrill } };
  S.cinquilloTableView = tableView;
})(window.Spanish = window.Spanish || {});
