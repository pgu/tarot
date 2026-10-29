/* El Tute Hand Advisor: describe your spot, get cantes, swap and card advice. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const B = S.TuteBots;

  function advisorScreen(root) {
    const lists = { hand: [], pinta: [], led: [], seen: [] };
    const max = { hand: 6, pinta: 1, led: 1, seen: 40 };
    let target = 'hand';
    let arrastre = false;
    let won = false;
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const modeRow = el('div', { class: 'btn-row' });
    const optRow = el('div', { class: 'btn-row', style: 'align-items:center' });

    function refreshPicker() {
      picker.innerHTML = '';
      const g = S.deckGuide();
      g.querySelectorAll('.card').forEach(n => {
        const id = n.getAttribute('data-id');
        if (lists.hand.includes(id)) n.classList.add('picked');
        else if (lists.pinta.includes(id)) n.classList.add('in-dog');
        else if (lists.led.includes(id)) n.classList.add('chosen');
        else if (lists.seen.includes(id)) n.classList.add('taken');
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

    function buildCtx() {
      const hand = S.sortCards(lists.hand.map(S.card));
      const pinta = S.card(lists.pinta[0]);
      const led = lists.led.length ? S.card(lists.led[0]) : null;
      const tr = pinta.suit;
      const seen = new Set(lists.hand.concat(lists.seen, lists.led, lists.pinta));
      const singable = !led && won ? S.SUITS.filter(s => hand.some(c => c.suit === s && c.rank === 12) && hand.some(c => c.suit === s && c.rank === 11)) : [];
      const four = [12, 11].find(r => hand.filter(c => c.rank === r).length === 4) || null;
      const legal = led ? (arrastre ? S.tuteArrastreLegal(hand, led, tr).cards : hand) : hand;
      return {
        hand, led, triumph: tr, pinta, arrastre, stockLen: arrastre ? 0 : 10, seen, sung: [], oppSung: [],
        singable, canSwap: !led && won && !arrastre && pinta.rank !== 7 && hand.some(c => c.suit === tr && c.rank === 7),
        canTute: four, trickNo: 0, legal, oppHandSize: hand.length,
      };
    }

    function renderResults() {
      results.innerHTML = '';
      if (lists.hand.length < 1 || !lists.pinta.length) { results.append(el('p', { class: 'muted' }, 'Mark your cards and the pinta (the face-up triumph card) to get advice.')); return; }
      const ctx = buildCtx();
      const pl = B.plan(ctx);
      const pick = B.chooseCard(ctx);
      const panel = el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, 'Advice'),
        el('p', {}, el('strong', {}, 'Triunfo: '), `${S.SUIT_INFO[ctx.triumph].name}. `, el('strong', {}, 'Rule: '), S.TUTE_RULES[ctx.led ? (arrastre ? S.tuteArrastreLegal(ctx.hand, ctx.led, ctx.triumph).rule === 'libre' ? 'libre2' : S.tuteArrastreLegal(ctx.hand, ctx.led, ctx.triumph).rule : 'libre') : 'lead']));
      if (pl.acts.length) panel.append(el('div', { class: 'coach-box' }, el('strong', {}, 'First:'), el('ul', {}, pl.acts.map(a => el('li', {}, a)))));
      panel.append(el('div', { class: 'coach-box' }, el('strong', {}, 'Play ' + pick.card.text), el('div', {}, pick.reason)),
        el('div', { class: 'hand flat' }, ctx.hand.map(c => cardEl(c, { cls: c === pick.card ? 'hint' : ctx.legal.includes(c) ? '' : 'dim' }))));
      results.append(panel);
    }

    function update() {
      status.textContent = `Hand ${lists.hand.length}/6 · Pinta ${lists.pinta.length}/1 · Rival's card ${lists.led.length}/1 · Played ${lists.seen.length}`;
      modeRow.querySelectorAll('button[data-mode]').forEach(b => b.classList.toggle('primary', b.dataset.mode === target));
      refreshPicker(); renderResults();
    }

    [['hand', 'My hand'], ['pinta', 'The pinta'], ['led', "Rival's led card"], ['seen', 'Cards already played']].forEach(([k, l]) =>
      modeRow.append(el('button', { class: 'btn', 'data-mode': k, onclick: () => { target = k; update(); } }, 'Marking: ' + l)));
    modeRow.append(el('button', { class: 'btn', onclick: () => { const d = S.shuffle(S.DECK.slice()); Object.values(lists).forEach(l => { l.length = 0; }); d.slice(0, 6).forEach(c => lists.hand.push(c.id)); lists.pinta.push(d[6].id); target = 'hand'; update(); } }, '🎲 Random'),
      el('button', { class: 'btn', onclick: () => { Object.values(lists).forEach(l => { l.length = 0; }); target = 'hand'; update(); } }, 'Clear'));
    optRow.append(
      el('label', {}, el('input', { type: 'checkbox', onchange: e => { arrastre = e.target.checked; renderResults(); } }), ' Arrastre (monte empty)'), ' ',
      el('label', {}, el('input', { type: 'checkbox', onchange: e => { won = e.target.checked; renderResults(); } }), ' I just won the last trick (I can sing / swap)'));

    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Hand Advisor · El Tute'),
      el('p', { class: 'muted' }, 'Playing with a real deck (2 players)? Mark your hand, the pinta, and the card your rival led (leave empty if you lead). Blue = hand, orange = pinta.'),
      modeRow, optRow, status, picker), results);
    update();
  }

  S.TuteScreens = Object.assign(S.TuteScreens || {}, { advisor: advisorScreen });
})(window.Spanish = window.Spanish || {});
