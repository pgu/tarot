/* El Siete y medio drills. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const M = S.SM;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Next exercise →');
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, (ok ? '✔ ' : '✘ ') + text);
  const fmt = t => (Number.isInteger(t) ? String(t) : String(t).replace('.', ',')); // 5,5 like in Spain
  const handRow = h => el('div', { class: 'hand flat' }, h.map(c => cardEl(c)));

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }

  /** A hand of 1-4 cards that has not gone over 7½ (or does, if allowBust). */
  function randomHand(allowBust) {
    for (;;) {
      const h = S.shuffle(S.DECK.slice()).slice(0, rint(1, 4));
      const t = S.smTotal(h);
      if (allowBust || t <= 7.5) return h;
    }
  }

  function sumDrill(box) {
    shell(box, 'La suma', 'As to 7 count as printed; sota, caballo and rey count half a point. What is the total?', (body, run) => {
      const h = randomHand(true);
      const total = S.smTotal(h);
      const input = el('input', { type: 'number', step: '0.5', min: 0, placeholder: 'total' });
      const fb = el('div', { class: 'feedback' });
      const go = () => {
        if (input.value === '') return;
        input.disabled = true; btn.disabled = true;
        const ok = parseFloat(input.value) === total;
        fb.append(verdict(ok, ok ? '¡Correcto!' : `The total is ${fmt(total)}.`),
          el('p', {}, h.map(c => `${c.text} = ${fmt(S.smValue(c))}`).join(' + ') + ` = ${fmt(total)}`),
          el('p', {}, total > 7.5 ? 'More than 7½: you would be out ("me paso").' : total === 7.5 ? (S.smNatural(h) ? '¡Siete y medio real! Two cards making 7½ beat any other 7½.' : '¡Siete y medio!') : 'You are still in the game.'), nextBtn(run));
      };
      const btn = el('button', { class: 'btn primary', onclick: go }, 'Check');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      body.append(handRow(h), el('div', { class: 'btn-row' }, input, btn), fb);
    });
  }

  function hitDrill(box) {
    shell(box, '¿Carta o me planto?', 'You have this hand. Do you ask for another card, or stand?', (body, run) => {
      const h = randomHand(false);
      const t = S.smTotal(h);
      const hh = Math.round(t * 2);
      const risk = M.bustProb(hh);
      const best = risk <= 0.4 ? 'hit' : risk >= 0.55 ? 'stand' : 'either';
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, [['hit', 'Carta'], ['stand', 'Me planto']].map(([k, l]) => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(x => { x.disabled = true; });
        const ok = best === 'either' || best === k;
        fb.append(verdict(ok, ok ? (best === 'either' ? 'Both are defensible here.' : '¡Correcto!') : 'Not the usual choice.'),
          el('p', {}, `Total ${fmt(t)}: the risk of going over on the next card is ${Math.round(risk * 100)}%. `,
            best === 'hit' ? 'That is low enough to take the risk.' : best === 'stand' ? 'That is too high: stand.' : 'A borderline case (around 5): it depends on the table.'),
          el('p', { class: 'muted' }, 'Rule of thumb: ask for a card up to 4½, stand from 5½. With 5 it is a toss-up.'), nextBtn(run));
      } }, l)));
      body.append(handRow(h), el('p', {}, `Your total: ${fmt(t)}`), row, fb);
    });
  }

  function duelDrill(box) {
    shell(box, 'El duelo con la banca', 'You are a player. Compare your hand with the bank\'s. The bank wins ties, a 7½ made with two cards ("real") beats a normal 7½, and going over loses.', (body, run) => {
      let p; let b;
      for (let t = 0; t < 100; t++) {
        p = randomHand(Math.random() < 0.2); b = randomHand(Math.random() < 0.2);
        if (Math.random() < 0.4) { const x = S.smTotal(p); if (S.smTotal(b) !== x && x <= 7.5) continue; }
        break;
      }
      const pt = S.smTotal(p); const bt = S.smTotal(b);
      let win; let why;
      if (pt > 7.5) { win = false; why = 'You went over 7½: you lose.'; }
      else if (bt > 7.5) { win = true; why = 'The bank went over 7½: you win.'; }
      else if (pt > bt) { win = true; why = `${fmt(pt)} beats ${fmt(bt)}.`; }
      else if (pt === bt && pt === 7.5 && S.smNatural(p) && !S.smNatural(b)) { win = true; why = 'Both have 7½, but yours is "real" (two cards): you win.'; }
      else if (pt === bt) { win = false; why = 'A tie: the bank wins.'; }
      else { win = false; why = `${fmt(bt)} beats ${fmt(pt)}.`; }
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, [[true, 'I win'], [false, 'The bank wins']].map(([k, l]) => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(x => { x.disabled = true; });
        fb.append(verdict(k === win, k === win ? '¡Correcto!' : 'Not quite.'), el('p', {}, why), nextBtn(run));
      } }, l)));
      body.append(el('div', { class: 'trick-line' }, el('div', { class: 'slot' }, handRow(p), `You: ${fmt(pt)}`), el('div', { class: 'slot' }, handRow(b), `Bank: ${fmt(bt)}`)), row, fb);
    });
  }

  S.SMDrills = {
    sum: { title: 'La suma', fn: sumDrill },
    hit: { title: '¿Carta o me planto?', fn: hitDrill },
    duel: { title: 'El duelo', fn: duelDrill },
  };
  S.smFmt = fmt;
})(window.Spanish = window.Spanish || {});
