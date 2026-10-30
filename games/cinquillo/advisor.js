/* El Cinquillo Hand Advisor: mark the cards on the table and your hand. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const SEQ = S.CINQ_SEQ;

  function advisorScreen(root) {
    const lists = { hand: [], table: [] };
    let target = 'hand';
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const modeRow = el('div', { class: 'btn-row' });

    function refreshPicker() {
      picker.innerHTML = '';
      const g = S.deckGuide();
      g.querySelectorAll('.card').forEach(n => {
        const id = n.getAttribute('data-id');
        if (lists.hand.includes(id)) n.classList.add('picked'); else if (lists.table.includes(id)) n.classList.add('in-dog');
        n.style.cursor = 'pointer';
        n.addEventListener('click', () => {
          if (Object.keys(lists).some(k => k !== target && lists[k].includes(id))) return;
          const mine = lists[target]; const k = mine.indexOf(id);
          if (k >= 0) mine.splice(k, 1); else mine.push(id);
          update();
        });
      });
      picker.append(g);
    }

    /** Table state from the marked cards (a suit is open when its 5 is marked). */
    function tableState() {
      const table = { O: null, C: null, E: null, B: null };
      S.SUITS.forEach(s => {
        const ids = lists.table.filter(id => id[0] === s).map(id => SEQ.indexOf(+id.slice(1)));
        if (ids.includes(4)) {
          let lo = 4; let hi = 4;
          while (ids.includes(lo - 1)) lo--;
          while (ids.includes(hi + 1)) hi++;
          table[s] = { lo, hi };
        }
      });
      return table;
    }

    function renderResults() {
      results.innerHTML = '';
      if (!lists.hand.length) { results.append(el('p', { class: 'muted' }, 'Mark your cards, then the cards already on the table.')); return; }
      const hand = S.sortCards(lists.hand.map(S.card));
      const table = tableState();
      const first = !lists.table.length && hand.some(c => c.id === 'O5');
      const legal = S.cinquilloLegal(hand, table, first);
      const pick = S.CinquilloBots.choose({ hand, table, first });
      results.append(el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, 'Advice'),
        S.cinquilloTableView(table),
        legal.length ? el('div', { class: 'coach-box' }, el('strong', {}, `Play ${pick.card.text}`), el('div', {}, pick.reason)) : el('div', { class: 'coach-box' }, el('strong', {}, 'Paso'), el('div', {}, pick.reason)),
        el('div', { class: 'hand flat' }, hand.map(c => cardEl(c, { cls: c === pick.card ? 'hint' : legal.includes(c) ? 'legal' : 'dim' }))),
        el('p', { class: 'muted' }, 'Green = playable now; the orange card is the suggestion.')));
    }

    function update() {
      status.textContent = `Hand: ${lists.hand.length} cards · Table: ${lists.table.length} cards`;
      modeRow.querySelectorAll('button[data-mode]').forEach(b => b.classList.toggle('primary', b.dataset.mode === target));
      refreshPicker(); renderResults();
    }

    [['hand', 'My hand'], ['table', 'Cards on the table']].forEach(([k, l]) => modeRow.append(el('button', { class: 'btn', 'data-mode': k, onclick: () => { target = k; update(); } }, 'Marking: ' + l)));
    modeRow.append(el('button', { class: 'btn', onclick: () => { lists.hand.length = 0; lists.table.length = 0; S.shuffle(S.DECK.slice()).slice(0, 8).forEach(c => lists.hand.push(c.id)); ['O5', 'O6', 'O4', 'C5'].filter(id => !lists.hand.includes(id)).forEach(id => lists.table.push(id)); target = 'hand'; update(); } }, '🎲 Random'),
      el('button', { class: 'btn', onclick: () => { lists.hand.length = 0; lists.table.length = 0; update(); } }, 'Clear'));

    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Hand Advisor · El Cinquillo'),
      el('p', { class: 'muted' }, 'Playing with a real deck? Mark your hand and the cards already on the table (blue = hand, orange = table): you get the playable cards and the best play.'),
      modeRow, status, picker), results);
    update();
  }

  S.CinquilloScreens = Object.assign(S.CinquilloScreens || {}, { advisor: advisorScreen });
})(window.Spanish = window.Spanish || {});
