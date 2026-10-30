/* La Brisca Hand Advisor. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;

  function advisorScreen(root) {
    const lists = { hand: [], pinta: [], led: [], seen: [] };
    const max = { hand: 3, pinta: 1, led: 1, seen: 40 };
    let target = 'hand';
    let endgame = false;
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const modeRow = el('div', { class: 'btn-row' });

    function refreshPicker() {
      picker.innerHTML = '';
      const g = S.deckGuide();
      g.querySelectorAll('.card').forEach(n => {
        const id = n.getAttribute('data-id');
        if (lists.hand.includes(id)) n.classList.add('picked'); else if (lists.pinta.includes(id)) n.classList.add('in-dog');
        else if (lists.led.includes(id)) n.classList.add('chosen'); else if (lists.seen.includes(id)) n.classList.add('taken');
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

    function renderResults() {
      results.innerHTML = '';
      if (!lists.hand.length || !lists.pinta.length) { results.append(el('p', { class: 'muted' }, 'Mark your cards and the pinta to get advice.')); return; }
      const hand = S.sortCards(lists.hand.map(S.card));
      const pinta = S.card(lists.pinta[0]);
      const led = lists.led.length ? S.card(lists.led[0]) : null;
      const seen = new Set(lists.hand.concat(lists.seen, lists.led, lists.pinta));
      const ctx = { hand, legal: hand, led, triumph: pinta.suit, pinta, arrastre: endgame, stockLen: endgame ? 0 : 10, seen, sung: S.SUITS.slice(), oppSung: [], singable: [], canSwap: false, canTute: null, trickNo: 5 };
      const pick = S.TuteBots.chooseCard(ctx);
      results.append(el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, 'Advice'),
        el('p', {}, el('strong', {}, 'Triunfo: '), S.SUIT_INFO[pinta.suit].name),
        el('div', { class: 'coach-box' }, el('strong', {}, 'Play ' + pick.card.text), el('div', {}, pick.reason)),
        el('div', { class: 'hand flat' }, hand.map(c => cardEl(c, { cls: c === pick.card ? 'hint' : '' })))));
    }

    function update() {
      status.textContent = `Hand ${lists.hand.length}/3 · Pinta ${lists.pinta.length}/1 · Rival's card ${lists.led.length}/1 · Played ${lists.seen.length}`;
      modeRow.querySelectorAll('button[data-mode]').forEach(b => b.classList.toggle('primary', b.dataset.mode === target));
      refreshPicker(); renderResults();
    }

    [['hand', 'My hand'], ['pinta', 'The pinta'], ['led', "Rival's led card"], ['seen', 'Cards already played']].forEach(([k, l]) =>
      modeRow.append(el('button', { class: 'btn', 'data-mode': k, onclick: () => { target = k; update(); } }, 'Marking: ' + l)));
    modeRow.append(el('button', { class: 'btn', onclick: () => { const d = S.shuffle(S.DECK.slice()); Object.values(lists).forEach(l => { l.length = 0; }); d.slice(0, 3).forEach(c => lists.hand.push(c.id)); lists.pinta.push(d[3].id); target = 'hand'; update(); } }, '🎲 Random'),
      el('button', { class: 'btn', onclick: () => { Object.values(lists).forEach(l => { l.length = 0; }); target = 'hand'; update(); } }, 'Clear'));

    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Hand Advisor · La Brisca'),
      el('p', { class: 'muted' }, 'Playing with a real deck? Mark your hand, the pinta, the card your rival led (empty if you lead) and, if you like, the cards already played.'),
      modeRow, el('label', {}, el('input', { type: 'checkbox', onchange: e => { endgame = e.target.checked; renderResults(); } }), ' The monte is empty (last tricks)'),
      status, picker), results);
    update();
  }

  S.BriscaScreens = Object.assign(S.BriscaScreens || {}, { advisor: advisorScreen });
})(window.Spanish = window.Spanish || {});
