/* La Escoba Hand Advisor: enter your hand and the table, see every play ranked. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const B = S.EscobaBots;

  function advisorScreen(root) {
    const hand = [];
    const table = [];
    const seen = []; // already-captured cards (optional, improves the danger estimate)
    let target = 'hand';
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const modeRow = el('div', { class: 'btn-row' });
    const lists = { hand, table, seen };
    const max = { hand: 3, table: 12, seen: 40 };

    function refreshPicker() {
      picker.innerHTML = '';
      const g = S.deckGuide();
      g.querySelectorAll('.card').forEach(n => {
        const id = n.getAttribute('data-id');
        if (hand.includes(id)) n.classList.add('picked');
        else if (table.includes(id)) n.classList.add('in-dog');
        else if (seen.includes(id)) n.classList.add('taken');
        n.style.cursor = 'pointer';
        n.addEventListener('click', () => {
          const mine = lists[target];
          const inOther = Object.keys(lists).some(k => k !== target && lists[k].includes(id));
          if (inOther) return;
          const k = mine.indexOf(id);
          if (k >= 0) mine.splice(k, 1); else if (mine.length < max[target]) mine.push(id);
          update();
        });
      });
      picker.append(g);
    }

    function renderResults() {
      results.innerHTML = '';
      if (!hand.length) { results.append(el('p', { class: 'muted' }, 'Pick the cards in your hand (1 to 3) and the cards on the table.')); return; }
      const h = S.sortCards(hand.map(S.card));
      const t = S.sortCards(table.map(S.card));
      const sn = seen.map(S.card);
      const g = new S.Escoba();
      g.hands = [h, [S.card('O1'), S.card('O1'), S.card('O1')]];
      g.table = t; g.piles = [sn, []]; g.deck = [1]; g.turn = 0; // 'deck' only needs to be non-empty
      const opts = B.options(g, 0);
      const best = opts[0];
      results.append(el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, 'Advice'),
        el('div', { class: 'coach-box' }, el('strong', {}, 'Best: ' + S.escobaDescribe(best)), el('div', {}, best.reason)),
        el('h4', {}, 'All plays, ranked'),
        el('table', { class: 't' }, opts.map((o, i) => el('tr', {}, el('td', {}, String(i + 1)), el('td', {}, S.escobaDescribe(o)), el('td', { class: 'muted' }, o.reason)))),
        el('p', { class: 'muted' }, 'Tip: also mark the cards already captured by either player ("Marking: captured cards") to sharpen the estimate of what your opponent can hold.')));
    }

    function update() {
      status.textContent = `Hand ${hand.length}/3 · Table ${table.length} · Captured/seen ${seen.length}`;
      modeRow.querySelectorAll('button[data-mode]').forEach(b => b.classList.toggle('primary', b.dataset.mode === target));
      refreshPicker();
      renderResults();
    }

    modeRow.append(
      el('button', { class: 'btn', 'data-mode': 'hand', onclick: () => { target = 'hand'; update(); } }, 'Marking: my hand'),
      el('button', { class: 'btn', 'data-mode': 'table', onclick: () => { target = 'table'; update(); } }, 'Marking: the table'),
      el('button', { class: 'btn', 'data-mode': 'seen', onclick: () => { target = 'seen'; update(); } }, 'Marking: captured cards'),
      el('button', { class: 'btn', onclick: () => { const d = S.shuffle(S.DECK.slice()); hand.length = table.length = seen.length = 0; d.slice(0, 3).forEach(c => hand.push(c.id)); d.slice(3, 7).forEach(c => table.push(c.id)); target = 'hand'; update(); } }, '🎲 Random'),
      el('button', { class: 'btn', onclick: () => { hand.length = table.length = seen.length = 0; target = 'hand'; update(); } }, 'Clear'));

    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Hand Advisor · La Escoba'),
      el('p', { class: 'muted' }, 'Playing with a real deck? Mark your hand and the table. Blue outline = your hand, orange = table, faded = already captured.'),
      modeRow, status, picker), results);
    update();
  }

  S.EscobaScreens = Object.assign(S.EscobaScreens || {}, { advisor: advisorScreen });
})(window.Spanish = window.Spanish || {});
