/* Five-card draw drills. */
(function (P) {
  'use strict';
  const { el, cardEl } = P;
  const pct = P.Bots.pct;
  const D = P.DrawBots;
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Next exercise →');
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, (ok ? '✔ ' : '✘ ') + text);
  const deal = n => P.shuffle(P.DECK.slice()).slice(0, n);

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }

  function winnerDrill(box) {
    shell(box, 'Which hand wins?', 'Two players show five cards each at the showdown.', (body, run) => {
      let a, b;
      do { [a, b] = [deal(5), null]; b = deal(10).filter(c => !a.includes(c)).slice(0, 5); } while (P.categoryOf(P.evaluate5(a)) < 1 && Math.random() < 0.7);
      const va = P.evaluate5(a); const vb = P.evaluate5(b);
      const truth = va > vb ? 'A' : vb > va ? 'B' : 'tie';
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, [['A', 'Player A wins'], ['B', 'Player B wins'], ['tie', 'Split pot']].map(([k, l]) =>
        el('button', { class: 'btn', onclick: () => {
          row.querySelectorAll('button').forEach(x => { x.disabled = true; });
          const same = P.categoryOf(va) === P.categoryOf(vb);
          fb.append(verdict(k === truth, k === truth ? 'Correct!' : 'Not quite.'),
            el('p', {}, el('strong', {}, 'A: '), P.handName(va), ' · ', el('strong', {}, 'B: '), P.handName(vb),
              truth === 'tie' ? '. Equal hands: split.' : same ? '. Same category: compare the ranks of the cards that make the hand, then the kickers.' : '. The higher category wins.'), nextBtn(run));
        } }, l)));
      body.append(el('div', { class: 'trick-line' },
        el('div', { class: 'slot' }, el('div', { class: 'hand flat' }, P.sortHand(a).map(c => cardEl(c))), 'Player A'),
        el('div', { class: 'slot' }, el('div', { class: 'hand flat' }, P.sortHand(b).map(c => cardEl(c))), 'Player B')), row, fb);
    });
  }

  function keepDrill(box) {
    shell(box, 'What would you keep?', 'You have this hand before the draw. Click the cards you keep (the others are swapped, up to 3 swaps), then check.', (body, run) => {
      const hand = deal(5);
      const sel = new Set();
      const nodes = [];
      let done = false;
      const fb = el('div', { class: 'feedback' });
      const check = el('button', { class: 'btn primary', onclick: () => {
        done = true; check.disabled = true;
        const keep = [0, 1, 2, 3, 4].filter(i => sel.has(i));
        const coach = D.chooseDiscards(hand);
        const mine = D.keepScore(hand, keep);
        const best = D.keepScore(hand, coach.keep);
        const same = keep.length === coach.keep.length && keep.every(k => coach.keep.includes(k));
        coach.keep.forEach(i => nodes[i].classList.add('right'));
        keep.filter(i => !coach.keep.includes(i)).forEach(i => nodes[i].classList.add('wrong'));
        const diff = best - mine;
        fb.append(
          same || diff < 0.015 ? verdict(true, same ? 'Same as the coach.' : 'Just as good as the coach\'s choice.')
            : diff < 0.05 ? el('div', { class: 'ok' }, '≈ Reasonable, but slightly weaker.') : verdict(false, 'The coach would play it differently.'),
          el('p', {}, el('strong', {}, 'Coach: '), coach.reason),
          el('p', {}, `On average your final hand would beat ${pct(mine)} of random hands; the coach's choice, ${pct(best)}.`),
          nextBtn(run));
      } }, 'Check');
      const handEl = el('div', { class: 'hand flat' }, hand.map((c, i) => {
        const n = cardEl(c, { onclick: (_, e) => {
          if (done) return;
          if (sel.has(i)) { sel.delete(i); e.classList.remove('selected'); }
          else { sel.add(i); e.classList.add('selected'); }
          check.disabled = 5 - sel.size > P.DrawTable.MAX_DRAW;
        } });
        nodes.push(n); return n;
      }));
      check.disabled = true;
      body.append(handEl, el('div', { class: 'btn-row' }, check, el('span', { class: 'muted' }, 'Keep at least 2 cards (maximum 3 swaps).')), fb);
    });
  }

  P.DrawDrills = {
    name: { title: 'Name the hand', fn: P.Drills.name.fn },
    winner: { title: 'Which hand wins?', fn: winnerDrill },
    keep: { title: 'What to keep?', fn: keepDrill },
  };
})(window.Poker = window.Poker || {});
