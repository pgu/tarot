/* La Belote rendering helpers and settings. */
(function (B, P) {
  'use strict';
  const el = window.Core.el;

  const cardEl = (card, opts) => P.cardEl(card, opts);
  const cardsRow = (cards, opts) => el('div', { class: 'cards-row' }, cards.map(c => cardEl(c, opts)));
  const SEATS = ['Vous', 'Est', 'Nord', 'Ouest'];
  const seatLabel = p => (p === 2 ? 'Nord (partenaire)' : SEATS[p]);
  const suitName = s => B.SUIT_FR[s];
  const suitTag = s => B.SUIT_SYM[s] + ' ' + B.SUIT_FR[s];
  const ids = s => s.split(' ').map(x => B.card(x));

  const Settings = {
    defaults: { highlight: true, hints: true, explain: true, count: false, target: 1000 },
    get() {
      try { return Object.assign({}, this.defaults, JSON.parse(localStorage.getItem('belote.settings') || '{}')); }
      catch (e) { return Object.assign({}, this.defaults); }
    },
    set(s) { try { localStorage.setItem('belote.settings', JSON.stringify(s)); } catch (e) { /* ignore */ } },
  };

  /** The 32 cards grouped by suit, for the lessons and the advisor picker. */
  function deckGuide() {
    const wrap = el('div', { class: 'deck-guide' });
    B.SUITS.forEach(s => wrap.append(el('div', { class: 'deck-group' },
      el('h4', {}, suitTag(s)),
      cardsRow(B.DECK.filter(c => c.suit === s).sort((a, b) => b.rank - a.rank)))));
    return wrap;
  }

  Object.assign(B, { el, cardEl, cardsRow, seatLabel, suitName, suitTag, ids, Settings, deckGuide, SEATS });
})(window.Belote = window.Belote || {}, window.Poker);
