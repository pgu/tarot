/* Rami rendering helpers. */
(function (R, P) {
  'use strict';
  const el = window.Core.el;

  function cardEl(card, opts) {
    opts = opts || {};
    if (opts.back || !card) return el('div', { class: 'card back ' + (opts.cls || '') });
    if (card.joker) {
      const e = el('div', { class: 'card joker ' + (opts.cls || ''), title: 'Joker', 'data-id': card.id },
        el('span', { class: 'corner' }, '★'), el('span', { class: 'center' }, '🃏'));
      if (opts.onclick) { e.classList.add('clickable'); e.addEventListener('click', () => opts.onclick(card, e)); }
      return e;
    }
    return P.cardEl(card, opts);
  }

  const cardsRow = (cards, opts) => el('div', { class: 'cards-row' }, cards.map(c => cardEl(c, opts)));
  const meldName = an => (an.type === 'run' ? 'suite' : an.cards.length === 3 ? 'brelan' : 'carré');
  const lab = cards => cards.map(c => c.text).join(' ');
  const Settings = {
    defaults: { hints: true, explain: true, players: 4, rounds: 5 },
    get() {
      try { return Object.assign({}, this.defaults, JSON.parse(localStorage.getItem('rami.settings') || '{}')); }
      catch (e) { return Object.assign({}, this.defaults); }
    },
    set(s) { try { localStorage.setItem('rami.settings', JSON.stringify(s)); } catch (e) { /* ignore */ } },
  };

  /** Build physical cards from a map faceId -> count (faceId like "14S" or "JK"). */
  function cardsFromCounts(counts) {
    const out = [];
    Object.entries(counts).forEach(([face, n]) => {
      for (let k = 0; k < n; k++) out.push(face === 'JK' ? R.card('JK' + k) : R.card(`${k}${face}`));
    });
    return R.sortHand(out);
  }

  Object.assign(R, { el, cardEl, cardsRow, meldName, lab, Settings, cardsFromCounts });
})(window.Rami = window.Rami || {}, window.Poker);
