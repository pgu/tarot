/* Five-card draw Hand Advisor: pick your 5 cards, see what to keep and the odds. */
(function (P) {
  'use strict';
  const { el, cardEl } = P;
  const D = P.DrawBots;
  const pct = P.Bots.pct;

  function advisorScreen(root) {
    const picked = [];
    let opps = 3;
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});

    function refreshPicker() {
      picker.innerHTML = '';
      const g = P.deckGuide();
      g.querySelectorAll('.card').forEach(n => {
        const id = n.getAttribute('data-id');
        if (picked.includes(id)) n.classList.add('picked');
        n.style.cursor = 'pointer';
        n.addEventListener('click', () => {
          const k = picked.indexOf(id);
          if (k >= 0) picked.splice(k, 1); else if (picked.length < 5) picked.push(id);
          update();
        });
      });
      picker.append(g);
    }

    function renderResults() {
      results.innerHTML = '';
      if (picked.length !== 5) { results.append(el('p', { class: 'muted' }, 'Pick the 5 cards you were dealt.')); return; }
      const hand = picked.map(P.card);
      const best = P.bestHand(hand);
      const c = D.chooseDiscards(hand);
      const odds = D.drawOdds(hand, c.keep, 4000);
      const tier = D.preTier(hand);
      const eq = D.equityFive(hand, opps, 3000);
      const rows = odds.map((p, cat) => [P.CATEGORIES[cat], p]).filter(r => r[1] >= 0.005).reverse();
      results.append(el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, 'Advice'),
        el('p', {}, el('strong', {}, best.name), ` (${tier.label}). Right now it beats about ${pct(D.percentile(P.evaluate5(hand)))} of random hands and wins ≈ ${pct(eq)} of the time against ${opps} random hand${opps > 1 ? 's' : ''}.`),
        el('div', { class: 'coach-box' }, el('strong', {}, c.discard.length ? `Swap ${c.discard.length} card${c.discard.length > 1 ? 's' : ''}` : 'Stand pat'), el('div', {}, c.reason)),
        el('div', { class: 'hand flat' }, hand.map((card, i) => cardEl(card, { cls: c.discard.includes(i) ? 'dim' : 'right' }))),
        el('p', { class: 'muted' }, 'Green = keep, grey = swap.'),
        c.discard.length ? el('div', {}, el('p', {}, 'After the draw, your final hand will be:'),
          el('table', { class: 't eval-table' }, el('tbody', {}, rows.map(r => el('tr', {}, el('td', {}, r[0]), el('td', {}, pct(r[1]))))))) : null,
        el('p', {}, el('strong', {}, 'Before the draw: '), tier.tier >= 2 ? 'raise or call a raise.' : tier.tier === 1 ? 'a marginal hand: call a small bet, fold to a big raise.' : 'fold unless it is free.')));
    }

    function update() {
      status.textContent = `Cards: ${picked.length}/5`;
      refreshPicker();
      renderResults();
    }

    root.append(el('div', { class: 'panel' },
      el('h2', {}, 'Hand Advisor · 5-card draw'),
      el('p', { class: 'muted' }, 'Playing with real cards? Tap the five cards you were dealt. You get what to keep, the odds of what you will end up with, and a first betting suggestion.'),
      el('div', { class: 'btn-row', style: 'align-items:center' },
        el('button', { class: 'btn', onclick: () => { picked.length = 0; P.shuffle(P.DECK.slice()).slice(0, 5).forEach(c => picked.push(c.id)); update(); } }, '🎲 Random hand'),
        el('button', { class: 'btn', onclick: () => { picked.length = 0; update(); } }, 'Clear'),
        el('label', {}, 'Opponents ', el('select', { style: 'font:inherit;padding:4px', onchange: e => { opps = +e.target.value; renderResults(); } },
          [1, 2, 3, 4, 5].map(n => el('option', { value: n, selected: n === opps ? true : null }, n))))),
      status, picker), results);
    update();
  }

  P.DrawScreens = Object.assign(P.DrawScreens || {}, { advisor: advisorScreen });
})(window.Poker = window.Poker || {});
