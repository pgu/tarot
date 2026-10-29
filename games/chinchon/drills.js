/* Chinchón drills. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const pts = S.chinchonPoints;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[rint(0, a.length - 1)];
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Next exercise →');
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, (ok ? '✔ ' : '✘ ') + text);
  const handRow = (cards, onclick) => el('div', { class: 'hand flat' }, cards.map(c => cardEl(c, { onclick })));

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }

  const deal = n => S.shuffle(S.DECK.slice()).slice(0, n);

  /** Random hand that contains some structure so drills are interesting. */
  function interestingHand(n) {
    for (let t = 0; t < 200; t++) {
      const h = S.sortCards(deal(n));
      const a = S.bestArrangement(h.slice(0, 7));
      if (a.melds.length >= 1 && a.points <= 25) return h;
    }
    return S.sortCards(deal(n));
  }

  function whyNot(cards) {
    if (cards.length < 3) return 'A combination needs at least 3 cards.';
    if (cards.every(c => c.rank === cards[0].rank)) {
      if (new Set(cards.map(c => c.suit)).size !== cards.length) return 'A set cannot repeat a suit.';
      return null;
    }
    if (!cards.every(c => c.suit === cards[0].suit)) return 'Cards of different ranks must be of the same suit to form a run (escalera).';
    return 'The cards of a run must be consecutive. Remember: after the 7 comes the Sota (there is no 8 or 9), and the Rey does not connect to the As.';
  }

  /* ----- 1. valid combination? ----- */
  function validDrill(box) {
    shell(box, '¿Es una combinación válida?', 'A combination is a trío/cuarteto (3–4 cards of the same number) or an escalera (3+ consecutive cards of the same suit).', (body, run) => {
      let cards;
      const valid = Math.random() < 0.5;
      if (valid) {
        if (Math.random() < 0.4) {
          const r = pick(S.RANKS); const ss = S.shuffle(S.SUITS.slice()).slice(0, rint(3, 4));
          cards = ss.map(s => S.card(s + r));
        } else {
          const s = pick(S.SUITS); const len = rint(3, 5); const a = rint(0, S.chinchonSeq.length - len);
          cards = S.chinchonSeq.slice(a, a + len).map(r => S.card(s + r));
        }
      } else {
        const kind = rint(0, 3);
        if (kind === 0) { // run with a gap
          const s = pick(S.SUITS); const a = rint(0, 6);
          cards = [a, a + 1, a + 3].map(k => S.card(s + S.chinchonSeq[k]));
        } else if (kind === 1) { // run with a foreign suit
          const [s1, s2] = S.shuffle(S.SUITS.slice());
          const a = rint(0, 6);
          cards = [S.card(s1 + S.chinchonSeq[a]), S.card(s1 + S.chinchonSeq[a + 1]), S.card(s2 + S.chinchonSeq[a + 2])];
        } else if (kind === 2) { // pair only
          const r = pick(S.RANKS); const [s1, s2] = S.shuffle(S.SUITS.slice());
          cards = [S.card(s1 + r), S.card(s2 + r)];
        } else { // wrap-around rey-as-dos
          const s = pick(S.SUITS);
          cards = [S.card(s + 11), S.card(s + 12), S.card(s + 1)];
        }
      }
      cards = S.shuffle(cards.slice());
      const ok = S.isMeld(cards);
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, [['Sí, es válida', true], ['No', false]].map(([l, v]) => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(b => { b.disabled = true; });
        fb.append(verdict(v === ok, v === ok ? 'Correct!' : 'Not quite.'),
          el('p', {}, ok ? 'Yes: ' + (cards.every(c => c.rank === cards[0].rank) ? 'same number, different suits.' : 'consecutive cards of the same suit.') : whyNot(cards)), nextBtn(run));
      } }, l)));
      body.append(handRow(cards), row, fb);
    });
  }

  /* ----- 2. count the unmatched points ----- */
  function deadwoodDrill(box) {
    shell(box, 'Cuenta los puntos sueltos', 'Group the 7 cards into the best combinations. How many points are left over? (As–7 count as printed, Sota/Caballo/Rey count 10.)', (body, run) => {
      const hand = interestingHand(7);
      const arr = S.bestArrangement(hand);
      const input = el('input', { type: 'number', min: 0, max: 70, placeholder: 'points' });
      const fb = el('div', { class: 'feedback' });
      const go = () => {
        if (input.value === '') return;
        input.disabled = true; btn.disabled = true;
        const ok = parseInt(input.value, 10) === arr.points;
        fb.append(verdict(ok, ok ? 'Correct!' : `The best you can do leaves ${arr.points} points.`),
          arr.melds.length ? el('p', {}, 'Combinations: ', arr.melds.map(m => m.map(c => c.text).join(' ')).join('  |  ')) : el('p', {}, 'No combination at all.'),
          el('p', {}, arr.deadwood.length ? 'Left over: ' + arr.deadwood.map(c => `${c.text} (${pts(c)})`).join(' + ') + ` = ${arr.points}` : 'Everything is combined: 0 points!'),
          arr.points <= 5 ? el('p', { class: 'ok' }, 'With 5 points or fewer you could close the round (cerrar) after drawing!') : null, nextBtn(run));
      };
      const btn = el('button', { class: 'btn primary', onclick: go }, 'Check');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      body.append(handRow(hand), el('div', { class: 'btn-row' }, input, btn), fb);
    });
  }

  /* ----- 3. which card to throw ----- */
  function discardDrill(box) {
    shell(box, '¿Qué descartas?', 'You drew a card and now hold 8. Click the card you throw away.', (body, run) => {
      const hand = interestingHand(8);
      const opts = S.discardOptions(hand);
      const best = opts[0].points;
      const fb = el('div', { class: 'feedback' });
      let done = false;
      const nodes = new Map();
      const row = el('div', { class: 'hand flat' }, hand.map(c => {
        const n = cardEl(c, { onclick: () => {
          if (done) return; done = true;
          const mine = opts.find(o => o.card === c);
          const ok = mine.points === best;
          opts.filter(o => o.points === best).forEach(o => nodes.get(o.card.id).classList.add('right'));
          if (!ok) nodes.get(c.id).classList.add('wrong');
          const arr = opts[0].arrangement;
          fb.append(verdict(ok, ok ? `Yes: only ${best} points left over.` : `That leaves ${mine.points} points. The best throw leaves ${best}.`),
            el('p', {}, `Best: throw ${opts.filter(o => o.points === best).map(o => o.card.text).join(' or ')}. Then your combinations are: `,
              arr.melds.length ? arr.melds.map(m => m.map(x => x.text).join(' ')).join(' | ') : '—', arr.deadwood.length ? ` and ${arr.deadwood.map(x => x.text).join(' ')} left over.` : ' and nothing is left over!'),
            best <= 5 ? el('p', { class: 'ok' }, 'You could even close the round with that throw.') : null, nextBtn(run));
        } });
        nodes.set(c.id, n); return n;
      }));
      body.append(row, fb);
    });
  }

  /* ----- 4. can you close? ----- */
  function closeDrill(box) {
    shell(box, '¿Puedes cerrar?', 'You hold 8 cards. Closing means throwing one card face down so that the other 7 leave 5 points or fewer.', (body, run) => {
      let hand, opts;
      for (let t = 0; t < 300; t++) {
        hand = interestingHand(8); opts = S.discardOptions(hand);
        const can = opts[0].points <= 5;
        if (can === (Math.random() < 0.5)) break;
      }
      const can = opts[0].points <= 5;
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, [['Sí, puedo cerrar', true], ['No todavía', false]].map(([l, v]) => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(b => { b.disabled = true; });
        fb.append(verdict(v === can, v === can ? 'Correct!' : 'Not quite.'),
          el('p', {}, can ? `Throw ${opts[0].card.text} and only ${opts[0].points} point${opts[0].points === 1 ? '' : 's'} remain: closing is allowed${opts[0].points === 0 ? ' (and with 0 you get −10!)' : ''}.`
            : `The best throw (${opts[0].card.text}) still leaves ${opts[0].points} points, more than 5.`), nextBtn(run));
      } }, l)));
      body.append(handRow(hand), row, fb);
    });
  }

  S.ChinchonDrills = {
    valid: { title: '¿Combinación válida?', fn: validDrill },
    deadwood: { title: 'Puntos sueltos', fn: deadwoodDrill },
    discard: { title: '¿Qué descartas?', fn: discardDrill },
    close: { title: '¿Puedes cerrar?', fn: closeDrill },
  };
})(window.Spanish = window.Spanish || {});
