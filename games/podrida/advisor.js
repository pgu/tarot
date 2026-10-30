/* La Podrida Hand Advisor: how many tricks to bid. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;

  function advisorScreen(root) {
    const lists = { hand: [], trump: [] };
    const max = { hand: 9, trump: 1 };
    let target = 'hand';
    let players = 4;
    let isDealer = false;
    let othersBids = 0;
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const modeRow = el('div', { class: 'btn-row' });

    function refreshPicker() {
      picker.innerHTML = '';
      const g = S.deckGuide();
      g.querySelectorAll('.card').forEach(n => {
        const id = n.getAttribute('data-id');
        if (lists.hand.includes(id)) n.classList.add('picked'); else if (lists.trump.includes(id)) n.classList.add('in-dog');
        n.style.cursor = 'pointer';
        n.addEventListener('click', () => {
          if (Object.keys(lists).some(k => k !== target && lists[k].includes(id))) return;
          const mine = lists[target]; const k = mine.indexOf(id);
          if (k >= 0) mine.splice(k, 1); else if (mine.length < max[target]) mine.push(id);
          update();
        });
      });
      picker.append(g);
    }

    function renderResults() {
      results.innerHTML = '';
      if (!lists.hand.length || !lists.trump.length) { results.append(el('p', { class: 'muted' }, 'Mark your cards and the triumph card.')); return; }
      const hand = S.sortCards(lists.hand.map(S.card));
      const tc = S.card(lists.trump[0]);
      const k = hand.length;
      const e = S.PodridaBots.estimate(hand, tc.suit, k, players);
      let bid = Math.max(0, Math.min(k, Math.round(e.expected)));
      let note = '';
      if (isDealer) {
        const forb = k - othersBids;
        if (forb >= 0 && forb <= k) {
          note = `As the dealer you cannot bid ${forb}.`;
          if (bid === forb) { bid = e.expected >= forb ? Math.min(k, forb + 1) : Math.max(0, forb - 1); note += ` Bid ${bid} instead.`; }
        }
      }
      results.append(el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, `Suggested bid: ${bid}`),
        el('p', {}, `Your cards should win about ${e.expected.toFixed(1)} tricks out of ${k}. ${note}`),
        el('ul', {}, e.parts.map(p => el('li', {}, p.card ? `${p.card.text}: ≈ ${p.w.toFixed(2)} trick` : `${p.note}: +${p.w.toFixed(1)}`))),
        el('div', { class: 'hand flat' }, hand.map(c => cardEl(c)))));
    }

    function update() {
      status.textContent = `Hand: ${lists.hand.length} cards · Triumph card: ${lists.trump.length}/1`;
      modeRow.querySelectorAll('button[data-mode]').forEach(b => b.classList.toggle('primary', b.dataset.mode === target));
      refreshPicker(); renderResults();
    }

    [['hand', 'My hand'], ['trump', 'The triumph card']].forEach(([k, l]) => modeRow.append(el('button', { class: 'btn', 'data-mode': k, onclick: () => { target = k; update(); } }, 'Marking: ' + l)));
    modeRow.append(
      el('label', {}, 'Players: ', el('select', { onchange: e => { players = +e.target.value; renderResults(); } }, [3, 4, 5].map(n => el('option', { value: n, selected: n === players ? true : null }, n)))), ' ',
      el('label', {}, el('input', { type: 'checkbox', onchange: e => { isDealer = e.target.checked; renderResults(); } }), ' I am the dealer'), ' ',
      el('label', {}, 'Sum of the other bids: ', el('input', { type: 'number', min: 0, value: 0, style: 'width:60px', onchange: e => { othersBids = +e.target.value || 0; renderResults(); } })),
      el('button', { class: 'btn', onclick: () => { lists.hand.length = 0; lists.trump.length = 0; const k = 3 + Math.floor(Math.random() * 4); const d = S.shuffle(S.DECK.slice()); d.slice(0, k).forEach(c => lists.hand.push(c.id)); lists.trump.push(d[k].id); target = 'hand'; update(); } }, '🎲 Random'),
      el('button', { class: 'btn', onclick: () => { lists.hand.length = 0; lists.trump.length = 0; update(); } }, 'Clear'));

    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Hand Advisor · La Podrida'),
      el('p', { class: 'muted' }, 'Playing with a real deck? Mark your hand and the card turned up for the triumph: you get the number of tricks to bid.'),
      modeRow, status, picker), results);
    update();
  }

  S.PodridaScreens = Object.assign(S.PodridaScreens || {}, { advisor: advisorScreen });
})(window.Spanish = window.Spanish || {});
