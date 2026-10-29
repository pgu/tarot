/* Chinchón Hand Advisor. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const B = S.ChinchonBots;
  const meldName = m => (m.every(c => c.rank === m[0].rank) ? (m.length === 3 ? 'trío' : 'cuarteto') : 'escalera');

  function advisorScreen(root) {
    const hand = [];
    const top = [];
    let target = 'hand';
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const modeRow = el('div', { class: 'btn-row' });
    const lists = { hand, top };
    const max = { hand: 8, top: 1 };

    function refreshPicker() {
      picker.innerHTML = '';
      const g = S.deckGuide();
      g.querySelectorAll('.card').forEach(n => {
        const id = n.getAttribute('data-id');
        if (hand.includes(id)) n.classList.add('picked'); else if (top.includes(id)) n.classList.add('in-dog');
        n.style.cursor = 'pointer';
        n.addEventListener('click', () => {
          const mine = lists[target];
          if (Object.keys(lists).some(k => k !== target && lists[k].includes(id))) return;
          const k = mine.indexOf(id);
          if (k >= 0) mine.splice(k, 1); else if (mine.length < max[target]) mine.push(id);
          update();
        });
      });
      picker.append(g);
    }

    const showArr = a => el('div', {},
      a.melds.map(m => el('div', { style: 'margin:4px 0' }, el('strong', {}, meldName(m) + ': '), m.map(c => c.text).join(' '))),
      el('div', {}, el('strong', {}, `Unmatched (${a.points} pts): `), a.deadwood.map(c => c.text).join(' ') || 'nothing'));

    function renderResults() {
      results.innerHTML = '';
      const h = S.sortCards(hand.map(S.card));
      if (h.length !== 7 && h.length !== 8) { results.append(el('p', { class: 'muted' }, 'Pick 7 cards (before drawing) or 8 cards (after drawing).')); return; }
      const panel = el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, 'Advice'));
      if (h.length === 7) {
        const a = S.bestArrangement(h);
        panel.append(el('p', {}, el('strong', {}, 'Your combinations'), showArr(a)));
        if (top.length) {
          const w = B.wantsDiscard(h, S.card(top[0]));
          panel.append(el('div', { class: 'coach-box' }, el('strong', {}, w.take ? `Take ${S.card(top[0]).text} from the descarte` : 'Draw from the mazo'), el('div', {}, w.reason)));
        } else panel.append(el('p', { class: 'muted' }, 'Mark the visible top card of the descarte (mode "descarte") to know whether to take it.'));
      } else {
        const opts = S.discardOptions(h);
        const best = B.chooseDiscard(h, null, 0);
        const can = opts.find(o => o.canClose);
        panel.append(el('div', { class: 'coach-box' }, el('strong', {}, can ? `You can CERRAR: put ${can.card.text} face down (${can.points} pts left${can.points === 0 ? ', −10 bonus!' : ''})` : `Discard ${best.card.text}`), el('div', {}, can ? 'Closing now ends the round before the others improve.' : best.reason)),
          el('h4', {}, 'After that throw, your hand is:'), showArr((can || best).arrangement || best.arrangement),
          el('h4', {}, 'All options'),
          el('table', { class: 't' }, opts.map(o => el('tr', {}, el('td', {}, 'Discard ' + o.card.text), el('td', {}, `${o.points} pts left`), el('td', {}, o.canClose ? 'can close' : '')))));
      }
      results.append(panel);
    }

    function update() {
      status.textContent = `Hand ${hand.length}/8 · Descarte ${top.length}/1`;
      modeRow.querySelectorAll('button[data-mode]').forEach(b => b.classList.toggle('primary', b.dataset.mode === target));
      refreshPicker(); renderResults();
    }

    modeRow.append(
      el('button', { class: 'btn', 'data-mode': 'hand', onclick: () => { target = 'hand'; update(); } }, 'Marking: my hand'),
      el('button', { class: 'btn', 'data-mode': 'top', onclick: () => { target = 'top'; update(); } }, 'Marking: top of the descarte'),
      el('button', { class: 'btn', onclick: () => { const d = S.shuffle(S.DECK.slice()); hand.length = top.length = 0; d.slice(0, 7).forEach(c => hand.push(c.id)); top.push(d[7].id); target = 'hand'; update(); } }, '🎲 Random hand'),
      el('button', { class: 'btn', onclick: () => { hand.length = top.length = 0; target = 'hand'; update(); } }, 'Clear'));

    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Hand Advisor · Chinchón'),
      el('p', { class: 'muted' }, 'Playing with a real deck? Mark your 7 cards (and the visible card of the descarte) to know whether to take it, or your 8 cards after drawing to know what to throw and whether you can close. Blue = hand, orange = descarte.'),
      modeRow, status, picker), results);
    update();
  }

  S.ChinchonScreens = Object.assign(S.ChinchonScreens || {}, { advisor: advisorScreen });
})(window.Spanish = window.Spanish || {});
