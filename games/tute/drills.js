/* El Tute drills. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const power = S.tutePower;
  const pts = S.tutePoints;
  const fmt = S.TuteBots.fmt;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[rint(0, a.length - 1)];
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Next exercise →');
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, (ok ? '✔ ' : '✘ ') + text);
  const deal = n => S.shuffle(S.DECK.slice()).slice(0, n);
  const suitName = s => S.SUIT_INFO[s].name.toLowerCase();

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }
  const triumphBadge = s => el('p', {}, 'Triunfo (pinta): ', S.icon(s), ' ', el('strong', {}, S.SUIT_INFO[s].name));

  /* ----- 1. who wins ----- */
  function winnerDrill(box) {
    shell(box, '¿Quién gana la baza?', 'The first card was led, the second answered. Order of strength: As > Tres > Rey > Caballo > Sota > 7 > 6 > 5 > 4 > 2.', (body, run) => {
      const triumph = pick(S.SUITS);
      let a, b;
      do { [a, b] = deal(2); } while (Math.random() < 0.6 && a.suit !== b.suit && b.suit !== triumph && a.suit !== triumph);
      const w = S.tuteWinner(a, b, triumph);
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, [['First card (led)', 0], ['Second card', 1]].map(([l, v]) => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(x => { x.disabled = true; });
        let why;
        if (b.suit === a.suit) why = `Same suit: the higher card wins (${(w ? b : a).text}).`;
        else if (b.suit === triumph) why = 'The second card is a triumph and the first is not: triumphs beat every other suit.';
        else why = 'The second card is neither the suit led nor a triumph, so it cannot win.';
        fb.append(verdict(v === w, v === w ? 'Correct!' : 'Not quite.'), el('p', {}, why), nextBtn(run));
      } }, l)));
      body.append(triumphBadge(triumph), el('div', { class: 'trick-line' }, el('div', { class: 'slot' }, cardEl(a), 'led'), el('div', { class: 'slot' }, cardEl(b), 'reply')), row, fb);
    });
  }

  /* ----- 2. count points ----- */
  function countDrill(box) {
    shell(box, 'Cuenta los puntos', 'As 11 · Tres 10 · Rey 4 · Caballo 3 · Sota 2 · the rest 0. Add up this pile.', (body, run) => {
      const pile = S.sortCards(deal(rint(6, 10)));
      const total = S.tuteSum(pile);
      const input = el('input', { type: 'number', min: 0, placeholder: 'points' });
      const fb = el('div', { class: 'feedback' });
      const go = () => {
        if (input.value === '') return;
        input.disabled = true; btn.disabled = true;
        const ok = parseInt(input.value, 10) === total;
        fb.append(verdict(ok, ok ? 'Correct!' : `The pile is worth ${total}.`),
          el('p', {}, pile.filter(c => pts(c)).map(c => `${c.text} ${pts(c)}`).join(' + ') + ` = ${total}`), nextBtn(run));
      };
      const btn = el('button', { class: 'btn primary', onclick: go }, 'Check');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      body.append(S.cardsRow(pile), el('div', { class: 'btn-row' }, input, btn), fb);
    });
  }

  /* ----- 3. obligations in the arrastre ----- */
  function arrastreDrill(box) {
    shell(box, 'El arrastre: ¿qué puedes jugar?', 'The monte (stock) is empty, so you must follow suit (asistir), beat the card if you can (montar), or trump (fallar). Click every card you may legally play.', (body, run) => {
      const triumph = pick(S.SUITS);
      const d = deal(5);
      const lead = d[0];
      const hand = S.sortCards(d.slice(1));
      const info = S.tuteArrastreLegal(hand, lead, triumph);
      const sel = new Set(); const nodes = {};
      let done = false;
      const fb = el('div', { class: 'feedback' });
      const check = el('button', { class: 'btn primary', onclick: () => {
        done = true; check.disabled = true;
        const ids = new Set(info.cards.map(c => c.id));
        hand.forEach(c => { nodes[c.id].classList.remove('selected'); nodes[c.id].classList.add(ids.has(c.id) ? 'right' : (sel.has(c.id) ? 'wrong' : 'dim')); });
        const ok = hand.every(c => ids.has(c.id) === sel.has(c.id));
        fb.append(verdict(ok, ok ? 'Correct!' : 'Not quite: green cards are the legal ones.'), el('p', {}, S.TUTE_RULES[info.rule === 'libre' ? 'libre2' : info.rule]), nextBtn(run));
      } }, 'Check');
      body.append(triumphBadge(triumph), el('div', {}, el('strong', {}, 'The rival leads: ')), el('div', { class: 'hand flat' }, cardEl(lead)), el('div', {}, el('strong', {}, 'Your hand:')),
        el('div', { class: 'hand flat' }, hand.map(c => { const n = cardEl(c, { onclick: (_, e) => { if (done) return; if (sel.has(c.id)) { sel.delete(c.id); e.classList.remove('selected'); } else { sel.add(c.id); e.classList.add('selected'); } } }); nodes[c.id] = n; return n; })),
        el('div', { class: 'btn-row' }, check), fb);
    });
  }

  /* ----- 4. cantes ----- */
  function cantesDrill(box) {
    shell(box, 'Los cantes', 'With the Rey and Caballo of one suit you can sing "las veinte" (20 points), or "las cuarenta" (40) in the triumph suit. How many points of cantes does this hand allow in total?', (body, run) => {
      const triumph = pick(S.SUITS);
      let hand;
      do {
        const d = deal(6);
        if (Math.random() < 0.7) { const s = pick(S.SUITS); d[0] = S.card(s + 12); d[1] = S.card(s + 11); }
        if (Math.random() < 0.2) { const s = pick(S.SUITS); d[2] = S.card(s + 12); d[3] = S.card(s + 11); }
        hand = [...new Map(d.map(c => [c.id, c])).values()];
      } while (hand.length < 6);
      hand = S.sortCards(hand);
      let total = 0; const found = [];
      S.SUITS.forEach(s => { if (hand.some(c => c.suit === s && c.rank === 12) && hand.some(c => c.suit === s && c.rank === 11)) { const v = s === triumph ? 40 : 20; total += v; found.push(`${suitName(s)} (${v})`); } });
      const input = el('input', { type: 'number', min: 0, step: 20, placeholder: 'points' });
      const fb = el('div', { class: 'feedback' });
      const go = () => {
        if (input.value === '') return;
        input.disabled = true; btn.disabled = true;
        const ok = parseInt(input.value, 10) === total;
        fb.append(verdict(ok, ok ? 'Correct!' : `The answer is ${total}.`),
          el('p', {}, found.length ? 'Pairs: ' + found.join(', ') + '.' : 'No suit has both the Rey and the Caballo.'),
          el('p', { class: 'muted' }, 'Remember: you can only sing right after winning a trick, once per suit.'), nextBtn(run));
      };
      const btn = el('button', { class: 'btn primary', onclick: go }, 'Check');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      body.append(triumphBadge(triumph), el('div', { class: 'hand flat' }, hand.map(c => cardEl(c))), el('div', { class: 'btn-row' }, input, btn), fb);
    });
  }

  S.TuteDrills = {
    winner: { title: '¿Quién gana?', fn: winnerDrill },
    count: { title: 'Cuenta los puntos', fn: countDrill },
    arrastre: { title: 'El arrastre', fn: arrastreDrill },
    cantes: { title: 'Los cantes', fn: cantesDrill },
  };
  void power; void fmt;
})(window.Spanish = window.Spanish || {});
