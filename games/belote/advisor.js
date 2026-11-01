/* La Belote, Conseiller : indiquez vos 5 cartes et la retourne, voyez s'il faut prendre. */
(function (B) {
  'use strict';
  const { el, cardEl } = B;

  function advisorScreen(root) {
    const hand = new Set();
    let turned = null;
    let target = 'hand';
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const modeRow = el('div', { class: 'btn-row' });
    const byId = ids => B.sortHand([...ids].map(id => B.card(id)), null);

    function refreshPicker() {
      picker.innerHTML = '';
      const guide = B.deckGuide();
      guide.querySelectorAll('.card').forEach(node => {
        const id = node.getAttribute('data-id');
        if (hand.has(id)) node.classList.add('picked');
        if (turned === id) node.classList.add('in-dog');
        node.style.cursor = 'pointer';
        node.addEventListener('click', () => {
          if (target === 'hand') {
            if (turned === id) return;
            if (hand.has(id)) hand.delete(id); else if (hand.size < 5) hand.add(id);
          } else {
            if (hand.has(id)) return;
            turned = turned === id ? null : id;
          }
          update();
        });
      });
      picker.append(guide);
    }

    function renderResults() {
      results.innerHTML = '';
      if (hand.size !== 5 || !turned) return;
      const cards = byId(hand); const up = B.card(turned);
      const r1 = B.Bots.chooseBid(cards, up, 1, 0, false);
      const r2 = B.Bots.chooseBid(cards, up, 2, 0, false);
      const best1 = r1.options[0];
      results.append(el('div', { class: 'panel', style: 'margin-top:14px' },
        el('h3', {}, `1 · Premier tour : prendre à ${B.suitTag(up.suit)} ?`),
        el('div', { class: 'hand flat' }, cards.map(c => cardEl(c)), cardEl(up, { cls: 'in-dog' })),
        el('p', {}, 'Force de la main avec la retourne : ', el('strong', {}, best1.ev.score.toFixed(1)), ` (seuil ${r1.limit.toFixed(1)}). Conseil : `,
          el('strong', {}, r1.suit ? `prendre à ${B.suitTag(r1.suit)}` : 'passer')),
        B.evalTable(best1.ev),
        el('p', { class: 'muted' }, r1.suit ? 'Vous recevrez la retourne et 2 cartes de plus. Entamez votre valet d\'atout si vous l\'avez.' : 'Si tout le monde passe, on passe au second tour : vous pourrez alors prendre une autre couleur.')),
      el('div', { class: 'panel', style: 'margin-top:14px' },
        el('h3', {}, '2 · Second tour : une autre couleur ?'),
        el('table', { class: 't' }, el('tr', {}, el('th', {}, 'Couleur'), el('th', {}, 'Force'), el('th', {}, 'Atouts')),
          r2.options.map(o => el('tr', {}, el('td', {}, B.suitTag(o.suit)), el('td', {}, o.ev.score.toFixed(1)), el('td', {}, String(o.ev.trumps))))),
        el('p', {}, `Seuil au second tour : ${r2.limit.toFixed(1)}. Conseil : `, el('strong', {}, r2.suit ? `prendre à ${B.suitTag(r2.suit)}` : 'passer')),
        el('p', { class: 'muted' }, 'La retourne vous revient quelle que soit la couleur choisie : elle est comptée dans la force.')));
    }

    function update() {
      status.textContent = `Votre main : ${hand.size}/5 cartes · Retourne : ${turned ? B.card(turned).text : 'aucune'}`;
      modeRow.querySelectorAll('button[data-mode]').forEach(b => b.classList.toggle('primary', b.dataset.mode === target));
      refreshPicker();
      renderResults();
    }

    modeRow.append(
      el('button', { class: 'btn', 'data-mode': 'hand', onclick: () => { target = 'hand'; update(); } }, 'Je marque : ma main (5)'),
      el('button', { class: 'btn', 'data-mode': 'up', onclick: () => { target = 'up'; update(); } }, 'Je marque : la retourne'),
      el('button', { class: 'btn', onclick: () => { const d = B.shuffle(B.DECK.slice()); hand.clear(); d.slice(0, 5).forEach(c => hand.add(c.id)); turned = d[20].id; target = 'hand'; update(); } }, '🎲 Main au hasard'),
      el('button', { class: 'btn', onclick: () => { hand.clear(); turned = null; target = 'hand'; update(); } }, 'Effacer'));

    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Conseiller · La Belote'),
      el('p', { class: 'muted' }, 'Vous jouez avec de vraies cartes ? Touchez les 5 cartes que vous avez reçues, puis la retourne (carte retournée par le donneur) : vous saurez s\'il faut prendre ou passer, au premier et au second tour.'),
      modeRow, status, picker), results);
    update();
  }

  B.BeloteScreens = Object.assign(B.BeloteScreens || {}, { advisor: advisorScreen });
})(window.Belote = window.Belote || {});
