/* La Podrida drills. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Next exercise →');
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, (ok ? '✔ ' : '✘ ') + text);
  const handRow = h => el('div', { class: 'hand flat' }, h.map(c => cardEl(c)));
  const triumphLine = c => el('p', {}, 'Triunfo: ', S.icon(c.suit), ' ', el('strong', {}, S.SUIT_INFO[c.suit].name), ` (${c.text} turned up)`);

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }

  function bidDrill(box) {
    shell(box, '¿Cuántas bazas apuestas?', 'Look at your cards and the triumph: how many tricks will you win? You must win exactly your bid.', (body, run) => {
      const k = rint(3, 6);
      const d = S.shuffle(S.DECK.slice());
      const hand = S.sortCards(d.slice(0, k));
      const tc = d[k];
      const est = S.PodridaBots.estimate(hand, tc.suit, k, 4);
      const target = Math.max(0, Math.min(k, Math.round(est.expected)));
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, [...Array(k + 1).keys()].map(n => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(x => { x.disabled = true; });
        const diff = Math.abs(n - est.expected);
        fb.append(n === target ? verdict(true, 'Matches the coach.') : diff <= 1 ? el('div', { class: 'ok' }, '≈ Close: defensible.') : verdict(false, 'Far from the estimate.'),
          el('p', {}, `The coach estimates about ${est.expected.toFixed(1)} tricks, so it would bid ${target}.`),
          el('ul', {}, est.parts.map(p => el('li', {}, p.card ? `${p.card.text}: ≈ ${p.w.toFixed(2)} trick` : `${p.note}: +${p.w.toFixed(1)}`))), nextBtn(run));
      } }, String(n))));
      body.append(handRow(hand), triumphLine(tc), el('p', {}, `${k} cards each, 4 players. Your bid:`), row, fb);
    });
  }

  function forbiddenDrill(box) {
    shell(box, 'La apuesta prohibida', 'The dealer speaks last and cannot make the bids add up to the number of tricks. Which bid is forbidden to the dealer?', (body, run) => {
      const k = rint(3, 8);
      const others = [rint(0, Math.min(k, 3)), rint(0, Math.min(k, 3)), rint(0, Math.min(k, 3))];
      const sum = others.reduce((a, b) => a + b, 0);
      const forbidden = k - sum;
      const input = el('input', { type: 'number', min: -5, max: 10, placeholder: 'bid' });
      const fb = el('div', { class: 'feedback' });
      const go = () => {
        if (input.value === '') return;
        input.disabled = true; btn.disabled = true;
        const ok = parseInt(input.value, 10) === forbidden;
        fb.append(verdict(ok, ok ? '¡Correcto!' : `The forbidden bid is ${forbidden}.`),
          el('p', {}, forbidden >= 0 && forbidden <= k ? `${k} tricks − (${others.join(' + ')}) = ${forbidden}: if the dealer bid ${forbidden}, the bids would add up to ${k}, so at least one player would fail.` : `${k} − ${sum} = ${forbidden}: that is not a possible bid, so the dealer may bid anything.`), nextBtn(run));
      };
      const btn = el('button', { class: 'btn primary', onclick: go }, 'Check');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      body.append(el('p', {}, `${k} cards each, so ${k} tricks. The three other players bid: ${others.join(', ')}.`), el('div', { class: 'btn-row' }, input, btn), fb);
    });
  }

  function legalDrill(box) {
    shell(box, '¿Qué puedes jugar?', 'Follow suit if you can; otherwise you must play a triumph if you have one; otherwise any card. Click every card you may play.', (body, run) => {
      const d = S.shuffle(S.DECK.slice());
      const hand = S.sortCards(d.slice(0, 5));
      const trick = d.slice(5, 5 + rint(1, 2)).map((card, i) => ({ player: i, card }));
      const tc = d[8];
      const info = S.podridaLegal(hand, trick, tc.suit);
      const sel = new Set(); const nodes = {};
      let done = false;
      const fb = el('div', { class: 'feedback' });
      const rule = { follow: 'You have the suit led: you must follow it.', trump: 'You have no card of the suit led but you hold a triumph: you must play a triumph.', free: 'You have neither the suit led nor a triumph: any card.', lead: 'You lead: any card.' }[info.rule];
      const check = el('button', { class: 'btn primary', onclick: () => {
        done = true; check.disabled = true;
        const ids = new Set(info.cards.map(c => c.id));
        hand.forEach(c => { nodes[c.id].classList.remove('selected'); nodes[c.id].classList.add(ids.has(c.id) ? 'right' : sel.has(c.id) ? 'wrong' : 'dim'); });
        const ok = hand.every(c => ids.has(c.id) === sel.has(c.id));
        fb.append(verdict(ok, ok ? '¡Correcto!' : 'Not quite: green cards are the legal ones.'), el('p', {}, rule), nextBtn(run));
      } }, 'Check');
      body.append(triumphLine(tc), el('div', {}, el('strong', {}, 'On the table: ')), el('div', { class: 'hand flat' }, trick.map(t => cardEl(t.card))),
        el('div', {}, el('strong', {}, 'Your hand:')), el('div', { class: 'hand flat' }, hand.map(c => { const n = cardEl(c, { onclick: (_, e) => { if (done) return; if (sel.has(c.id)) { sel.delete(c.id); e.classList.remove('selected'); } else { sel.add(c.id); e.classList.add('selected'); } } }); nodes[c.id] = n; return n; })),
        el('div', { class: 'btn-row' }, check), fb);
    });
  }

  function pointsDrill(box) {
    shell(box, 'Los puntos', 'Exactly your bid: 10 points + 2 for each trick bid. Otherwise you lose 2 points for each trick of difference. How many points?', (body, run) => {
      const bid = rint(0, 4);
      const won = Math.random() < 0.4 ? bid : Math.max(0, bid + rint(-2, 2));
      const pts = S.podridaPoints(bid, won);
      const input = el('input', { type: 'number', placeholder: 'points' });
      const fb = el('div', { class: 'feedback' });
      const go = () => {
        if (input.value === '') return;
        input.disabled = true; btn.disabled = true;
        const ok = parseInt(input.value, 10) === pts;
        fb.append(verdict(ok, ok ? '¡Correcto!' : `It is ${pts} points.`),
          el('p', {}, bid === won ? `Exact: 10 + 2 × ${bid} = ${pts}.` : `Missed by ${Math.abs(bid - won)}: −2 × ${Math.abs(bid - won)} = ${pts}.`), nextBtn(run));
      };
      const btn = el('button', { class: 'btn primary', onclick: go }, 'Check');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      body.append(el('p', {}, `You bid ${bid} and won ${won} trick${won === 1 ? '' : 's'}.`), el('div', { class: 'btn-row' }, input, btn), fb);
    });
  }

  S.PodridaDrills = {
    bid: { title: '¿Cuántas bazas?', fn: bidDrill },
    forbidden: { title: 'La apuesta prohibida', fn: forbiddenDrill },
    legal: { title: '¿Qué puedes jugar?', fn: legalDrill },
    points: { title: 'Los puntos', fn: pointsDrill },
  };
})(window.Spanish = window.Spanish || {});
