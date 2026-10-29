/* Poker drills. */
(function (P) {
  'use strict';
  const { el, cardEl, money } = P;
  const pct = P.Bots.pct;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[rint(0, arr.length - 1)];

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Next exercise →');
  const deal = n => P.shuffle(P.DECK.slice()).slice(0, n);
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, ok ? '✔ ' + text : '✘ ' + text);

  /* ----- build a 5-card hand of a given category ----- */
  function handOfCategory(cat) {
    const deck = P.DECK;
    const byRank = r => deck.filter(c => c.rank === r);
    if (cat === 8) {
      const s = pick(P.SUITS); const hi = rint(5, 13);
      return [0, 1, 2, 3, 4].map(k => P.BY_ID[(hi - k < 2 ? 14 : hi - k) + s]);
    }
    if (cat === 7) {
      const r = rint(2, 14);
      const kick = pick(deck.filter(c => c.rank !== r));
      return P.shuffle(byRank(r).concat(kick));
    }
    if (cat === 6) {
      const a = rint(2, 14); let b;
      do { b = rint(2, 14); } while (b === a);
      return P.shuffle(P.shuffle(byRank(a)).slice(0, 3).concat(P.shuffle(byRank(b)).slice(0, 2)));
    }
    for (let i = 0; i < 20000; i++) {
      const h = deal(5);
      if (P.evaluate5(h) >= 0 && P.categoryOf(P.evaluate5(h)) === cat) return h;
    }
    return deal(5);
  }

  /* ----- 1. name the hand ----- */
  function nameDrill(box) {
    shell(box, 'Name this hand', 'Which category is this 5-card hand?', (body, run) => {
      const cat = pick([0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8]);
      const hand = P.sortHand(handOfCategory(cat));
      const real = P.categoryOf(P.evaluate5(hand));
      const fb = el('div', { class: 'feedback' });
      const buttons = P.CATEGORIES.map((n, i) => ({ n, i })).reverse().map(({ n, i }) => el('button', { class: 'btn', onclick: () => {
        buttons.forEach(b => { b.disabled = true; });
        fb.append(verdict(i === real, i === real ? 'Correct!' : `Not quite, it is ${P.CATEGORIES[real].toLowerCase()}.`),
          el('p', {}, el('strong', {}, P.handName(P.evaluate5(hand))), '. ', P.EXAMPLES.find(e => e[0] === P.CATEGORIES[real])[1]),
          nextBtn(run));
      } }, n));
      body.append(el('div', { class: 'hand flat' }, hand.map(c => cardEl(c))), el('div', { class: 'btn-row' }, buttons), fb);
    });
  }

  /* ----- 2. who wins? ----- */
  function winnerDrill(box) {
    shell(box, 'Who wins the showdown?', 'Both players use the best five of their two cards plus the five shared cards.', (body, run) => {
      let a, b, board;
      for (;;) {
        const d = deal(9);
        a = d.slice(0, 2); b = d.slice(2, 4); board = d.slice(4, 9);
        const ha = P.bestHand(a.concat(board)); const hb = P.bestHand(b.concat(board));
        // avoid trivial cases where the board plays for both
        if (ha.value !== hb.value || Math.random() < 0.15) { break; }
      }
      const ha = P.bestHand(a.concat(board)); const hb = P.bestHand(b.concat(board));
      const truth = ha.value > hb.value ? 'A' : hb.value > ha.value ? 'B' : 'tie';
      const fb = el('div', { class: 'feedback' });
      const ans = (k, label) => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(x => { x.disabled = true; });
        const same = P.categoryOf(ha.value) === P.categoryOf(hb.value);
        fb.append(verdict(k === truth, k === truth ? 'Correct!' : 'Not quite.'),
          el('p', {}, el('strong', {}, 'Player A: '), ha.name, ' – ', el('strong', {}, 'Player B: '), hb.name,
            truth === 'tie' ? '. Identical five-card hands: the pot is split.' : same ? '. Same category: the higher ranks (or kicker) decide.' : '. The higher category wins.'),
          el('div', { class: 'trick-line' }, [['A', ha], ['B', hb]].map(([n, h]) => el('div', { class: 'slot' }, el('div', { class: 'hand flat' }, h.cards.map(c => cardEl(c))), 'best five of ' + n)))
          , nextBtn(run));
      } }, label);
      const row = el('div', { class: 'btn-row' }, ans('A', 'Player A wins'), ans('B', 'Player B wins'), ans('tie', 'Split pot'));
      body.append(el('div', {}, el('strong', {}, 'Board:')), el('div', { class: 'hand flat' }, board.map(c => cardEl(c))),
        el('div', { class: 'trick-line' },
          el('div', { class: 'slot' }, el('div', { class: 'hand flat' }, P.sortHand(a).map(c => cardEl(c))), 'Player A'),
          el('div', { class: 'slot' }, el('div', { class: 'hand flat' }, P.sortHand(b).map(c => cardEl(c))), 'Player B')),
        row, fb);
    });
  }

  /* ----- 3. best five of seven ----- */
  function bestFiveDrill(box) {
    shell(box, 'Find the best five', 'You have 7 cards (2 yours + 5 on the board). Select the 5 that make your best hand.', (body, run) => {
      const cards = P.sortHand(deal(7));
      const best = P.bestHand(cards);
      const sel = new Set();
      const fb = el('div', { class: 'feedback' });
      const nodes = {};
      let done = false;
      const handEl = el('div', { class: 'hand flat' }, cards.map(c => {
        const n = cardEl(c, { onclick: (card, e) => {
          if (done) return;
          if (sel.has(c.id)) { sel.delete(c.id); e.classList.remove('selected'); }
          else if (sel.size < 5) { sel.add(c.id); e.classList.add('selected'); }
          check.disabled = sel.size !== 5;
        } });
        nodes[c.id] = n; return n;
      }));
      const check = el('button', { class: 'btn primary', disabled: true, onclick: () => {
        done = true; check.disabled = true;
        const mine = P.evaluate5(cards.filter(c => sel.has(c.id)));
        const ok = mine === best.value;
        cards.forEach(c => { nodes[c.id].classList.remove('selected'); nodes[c.id].classList.add(best.cards.includes(c) ? 'right' : 'dim'); });
        fb.append(verdict(ok, ok ? `Yes: ${best.name}.` : `Not the best. The best five make: ${best.name} (green cards). You chose ${P.handName(mine)}.`), nextBtn(run));
      } }, 'Check');
      body.append(handEl, el('div', { class: 'btn-row' }, check), fb);
    });
  }

  /* ----- 4. outs and pot odds ----- */
  function buildDraw() {
    for (let t = 0; t < 400; t++) {
      const kind = pick(['flush', 'oesd', 'gutshot']);
      const suits = () => P.SUITS.slice();
      let hole, board;
      if (kind === 'flush') {
        const s = pick(P.SUITS);
        const off = P.SUITS.filter(x => x !== s);
        const rs = P.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]).slice(0, 6);
        hole = [P.BY_ID[rs[0] + s], P.BY_ID[rs[1] + s]];
        board = [P.BY_ID[rs[2] + s], P.BY_ID[rs[3] + s], P.BY_ID[rs[4] + pick(off)], P.BY_ID[rs[5] + pick(off)]];
      } else {
        const r = kind === 'oesd' ? rint(4, 9) : rint(3, 9);
        const mk = rr => P.BY_ID[rr + pick(suits())];
        hole = [mk(r), mk(r + 1)];
        board = kind === 'oesd' ? [mk(r + 2), mk(r + 3)] : [mk(r + 3), mk(r + 4)];
        const blanks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].filter(x => Math.abs(x - r - 1.5) > 3.5);
        P.shuffle(blanks).slice(0, 2).forEach(b => board.push(mk(b)));
      }
      const all = hole.concat(board);
      if (new Set(all.map(c => c.id)).size !== 6) continue;
      const draw = P.outsToStraightOrBetter(hole, board);
      if (!draw || draw.made || draw.outs < 3) continue;
      if (kind !== 'flush' && P.SUITS.some(s => all.filter(c => c.suit === s).length >= 4)) continue;
      return { hole, board, draw, kind };
    }
    return null;
  }

  function outsDrill(box) {
    shell(box, 'Outs and pot odds', 'You are on the turn and your hand is not yet made. Count your outs, then decide whether calling is profitable.', (body, run) => {
      const sc = buildDraw();
      if (!sc) { run(); return; }
      const potBefore = pick([100, 150, 200, 300, 400]);
      const bet = Math.round(potBefore * pick([0.5, 0.66, 1]) / 10) * 10;
      const pot = potBefore + bet;
      const need = bet / (pot + bet);
      const eq = sc.draw.outs * 2 / 100;
      const call = eq >= need;
      const fb = el('div', { class: 'feedback' });
      const input = el('input', { type: 'number', min: 0, max: 30, placeholder: 'outs' });
      const step2 = el('div', {});
      const check = el('button', { class: 'btn primary', onclick: () => {
        if (input.value === '') return;
        check.disabled = true; input.disabled = true;
        const ok = parseInt(input.value, 10) === sc.draw.outs;
        fb.append(verdict(ok, ok ? `Yes, ${sc.draw.outs} outs.` : `It is ${sc.draw.outs} outs.`),
          el('p', {}, 'Outs are the unseen cards that complete a straight or better: ', P.cardsRow(sc.draw.cards.slice(0, 15), {})),
          el('p', {}, el('strong', {}, 'Rule of 2: '), `with one card to come, each out is worth about 2%. ${sc.draw.outs} × 2 ≈ ${pct(eq)} to hit.`),
          el('p', {}, `The pot is ${money(pot)} after your opponent bets ${money(bet)}. Calling costs ${money(bet)}, so you need `,
            el('strong', {}, `${money(bet)} ÷ (${money(pot)} + ${money(bet)}) = ${pct(need)}`), ' to break even.'),
          el('div', {}, el('strong', {}, 'Call or fold?')));
        const row = el('div', { class: 'btn-row' }, ['Call', 'Fold'].map(a => el('button', { class: 'btn', onclick: () => {
          row.querySelectorAll('button').forEach(x => { x.disabled = true; });
          const right = (a === 'Call') === call;
          step2.append(verdict(right, right ? 'Correct!' : 'Not quite.'),
            el('p', {}, `Your ~${pct(eq)} chance ${call ? 'is higher than' : 'is lower than'} the ${pct(need)} you need, so ${call ? 'calling is profitable in the long run' : 'folding is better'}.`),
            el('p', { class: 'muted' }, 'In real games also consider the money you can win on later streets (implied odds).'), nextBtn(run));
        } }, a)));
        step2.append(row);
      } }, 'Check');
      body.append(el('div', {}, el('strong', {}, 'Your hand:')), el('div', { class: 'hand flat' }, sc.hole.map(c => cardEl(c))),
        el('div', {}, el('strong', {}, 'Board (turn):')), el('div', { class: 'hand flat' }, sc.board.map(c => cardEl(c))),
        el('p', {}, 'How many cards would give you a straight or better? ', input, ' ', check), fb, step2);
    });
  }

  /* ----- 5. preflop decisions ----- */
  function preflopDrill(box) {
    shell(box, 'Preflop: fold, call or raise?', 'You are first to act and nobody has bet yet. Would you fold, call the blind, or raise?', (body, run) => {
      const hole = deal(2);
      const ch = P.chen(hole[0], hole[1]);
      const right = ch.score >= 9 ? 'Raise' : ch.score >= 5 ? 'Call' : 'Fold';
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, ['Fold', 'Call', 'Raise'].map(a => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(x => { x.disabled = true; });
        const order = ['Fold', 'Call', 'Raise'];
        const diff = Math.abs(order.indexOf(a) - order.indexOf(right));
        fb.append(diff === 0 ? verdict(true, 'Matches the coach.') : diff === 1 ? el('div', { class: 'ok' }, '≈ Close: defensible.') : verdict(false, 'Far from the coach.'),
          el('p', {}, el('strong', {}, P.holeLabel(hole[0], hole[1])), ` scores ${ch.score} (Chen formula) → coach says `, el('strong', {}, right), '.'),
          el('table', { class: 't' }, el('tbody', {}, ch.steps.map(s => el('tr', {}, el('td', {}, s[0]), el('td', {}, (s[1] >= 0 ? '+' : '') + s[1]))))),
          el('p', { class: 'muted' }, '9+ raise · 5–8 call · below 5 fold. A beginner-friendly rule of thumb; in real games position and opponents matter a lot.'), nextBtn(run));
      } }, a)));
      body.append(el('div', { class: 'hand flat' }, hole.map(c => cardEl(c))), row, fb);
    });
  }

  P.Drills = {
    name: { title: 'Name the hand', fn: nameDrill },
    winner: { title: 'Who wins?', fn: winnerDrill },
    best5: { title: 'Best five of seven', fn: bestFiveDrill },
    outs: { title: 'Outs & pot odds', fn: outsDrill },
    preflop: { title: 'Preflop decisions', fn: preflopDrill },
  };
})(window.Poker = window.Poker || {});
