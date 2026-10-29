/* Hand Advisor: enter your real cards, get bidding / discard / lead advice. */
(function (T) {
  'use strict';
  const { el, cardEl, fmt, contractName } = T;

  function commentary(ev) {
    const out = [];
    const need = T.requiredPoints(ev.oudlers);
    out.push(`${ev.oudlers} oudler(s) in hand: you would need ${need} points to win.`);
    if (ev.trumps >= 8) out.push(`${ev.trumps} trumps is a lot: you can control the deal and protect your kings.`);
    else if (ev.trumps >= 6) out.push(`${ev.trumps} trumps is decent.`);
    else out.push(`Only ${ev.trumps} trump(s): defenders will be able to cut your kings and queens.`);
    if (ev.kings === 0) out.push('No kings: you will struggle to collect points.');
    else out.push(`${ev.kings} king(s): each one is a likely 4.5 points.`);
    if (ev.voids.length && ev.trumps >= 4) out.push(`Void in ${ev.voids.map(s => T.SUIT_INFO[s].name).join(', ')}: you can trump when it is led.`);
    const long = T.SUITS.filter(s => ev.counts[s] >= 6);
    if (long.length) out.push(`Long suit${long.length > 1 ? 's' : ''} (${long.map(s => T.SUIT_INFO[s].name).join(', ')}): others may run out and be forced to trump.`);
    return out;
  }

  function advisorScreen(root) {
    const hand = new Set();
    const dog = new Set();
    let target = 'hand';
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const modeRow = el('div', { class: 'btn-row' });

    const byId = ids => T.sortHand([...ids].map(id => T.card(id)));

    function refreshPicker() {
      picker.innerHTML = '';
      const guide = T.deckGuide();
      guide.querySelectorAll('.card').forEach(node => {
        const id = node.getAttribute('data-id');
        if (hand.has(id)) node.classList.add('picked');
        if (dog.has(id)) node.classList.add('in-dog');
        node.style.cursor = 'pointer';
        node.addEventListener('click', () => {
          const mine = target === 'hand' ? hand : dog;
          const other = target === 'hand' ? dog : hand;
          const max = target === 'hand' ? 18 : 6;
          if (other.has(id)) return;
          if (mine.has(id)) mine.delete(id);
          else if (mine.size < max) mine.add(id);
          update();
        });
      });
      picker.append(guide);
    }

    function adviceBlock(title, cards, extra) {
      const ev = T.Bots.evaluateHand(cards);
      const box = el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, title));
      box.append(el('div', { class: 'hand flat' }, cards.map(c => cardEl(c))));
      box.append(el('p', {}, 'Hand strength ', el('strong', {}, fmt(ev.score)), '. Suggested bid: ',
        el('strong', {}, ev.level ? contractName(ev.level) : 'Pass')),
      T.Drills.evalTable(ev),
      el('ul', {}, commentary(ev).map(t => el('li', {}, t))));
      if (extra) box.append(extra);
      return box;
    }

    function leadAdvice(cards) {
      const r = T.Bots.choosePlay({ hand: cards, trick: [], player: 0, taker: 0, trickNo: 0 });
      return el('div', { class: 'coach-box' }, el('strong', {}, 'Opening lead (as taker): '), cardEl(r.card), ' ', r.reason);
    }

    function renderResults() {
      results.innerHTML = '';
      if (hand.size !== 18) return;
      const cards = byId(hand);
      const ev = T.Bots.evaluateHand(cards);
      results.append(adviceBlock('1 · Bidding advice', cards,
        el('p', { class: 'muted' }, ev.level
          ? `If nobody has bid higher, ${contractName(ev.level)} looks reasonable. Always bid one level above the previous bid, and remember the multiplier: ×${T.CONTRACTS[ev.level].mult}.`
          : 'This hand is better defended than played: pass.')));
      if (dog.size === 6) {
        const full = T.sortHand(cards.concat(byId(dog)));
        const d = T.Bots.chooseDiscard(full);
        const kept = full.filter(c => !d.cards.includes(c));
        results.append(el('div', { class: 'panel', style: 'margin-top:14px' },
          el('h3', {}, '2 · After taking the dog'),
          el('p', {}, 'Your 24 cards: '), el('div', { class: 'hand flat' }, full.map(c => cardEl(c, { cls: d.cards.includes(c) ? 'dim' : '' }))),
          el('p', {}, el('strong', {}, 'Suggested discard (greyed): '), d.reason),
          el('div', { class: 'cards-row' }, d.cards.map(c => cardEl(c))),
          adviceBlock('3 · Your hand after the discard', kept, leadAdvice(kept))));
      } else {
        results.append(el('div', { class: 'panel', style: 'margin-top:14px' },
          el('h3', {}, '2 · Taking the dog?'),
          el('p', { class: 'muted' }, 'If you win the bid with a Petite or a Garde, switch to “The dog” above, mark the 6 dog cards, and I will suggest the discard and your opening lead.'),
          leadAdvice(cards)));
      }
    }

    function update() {
      status.textContent = `Your hand: ${hand.size}/18 cards · Dog: ${dog.size}/6 cards`;
      modeRow.querySelectorAll('button').forEach(b => b.classList.toggle('primary', b.dataset.mode === target));
      refreshPicker();
      renderResults();
    }

    function randomHand() {
      const deck = T.shuffle(T.DECK.slice());
      hand.clear(); dog.clear();
      deck.slice(0, 18).forEach(c => hand.add(c.id));
      target = 'hand';
      update();
    }

    modeRow.append(
      el('button', { class: 'btn', 'data-mode': 'hand', onclick: () => { target = 'hand'; update(); } }, 'Marking: my hand (18)'),
      el('button', { class: 'btn', 'data-mode': 'dog', onclick: () => { target = 'dog'; update(); } }, 'Marking: the dog (6)'),
      el('button', { class: 'btn', onclick: randomHand }, '🎲 Random hand'),
      el('button', { class: 'btn', onclick: () => { hand.clear(); dog.clear(); target = 'hand'; update(); } }, 'Clear'));

    root.append(el('div', { class: 'panel' },
      el('h2', {}, 'Hand Advisor'),
      el('p', { class: 'muted' }, 'Playing a real game with real cards? Tap the cards you were dealt (18 for 4 players). You get a hand evaluation, a bid suggestion and, if you take the dog, the cards to discard and what to lead first.'),
      modeRow, status, picker), results);
    update();
  }

  T.Screens = Object.assign(T.Screens || {}, { advisor: advisorScreen });
})(window.Tarot = window.Tarot || {});
