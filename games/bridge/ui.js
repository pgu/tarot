/* Le Bridge rendering helpers and settings. */
(function (Br, P) {
  'use strict';
  const el = window.Core.el;

  const cardEl = (card, opts) => P.cardEl(card, opts);
  const cardsRow = (cards, opts) => el('div', { class: 'cards-row' }, cards.map(c => cardEl(c, opts)));
  const NAMES = ['Vous', 'Ouest', 'Nord', 'Est'];
  const seatName = s => NAMES[s];
  const suitTag = s => Br.SYM[s] + ' ' + Br.SUIT_FR[s];
  const redSuit = s => s === 'H' || s === 'D';

  /** HTML-ish text of a call with coloured suit symbol. */
  function callEl(call) {
    if (call.t === 'b' && call.strain !== 'N') return el('span', {}, String(call.level), el('span', { class: redSuit(call.strain) ? 'bad-suit' : '' }, Br.SYM[call.strain]));
    return el('span', {}, Br.callText(call));
  }

  /** A hand shown face up, one row per suit (compact). opts: {onclick(card), legal: Set of ids, hint: card} */
  function suitRows(hand, opts) {
    opts = opts || {};
    const box = el('div', { class: 'bhand' });
    Br.SUITS.forEach(s => {
      const cs = hand.filter(c => c.suit === s);
      box.append(el('div', { class: 'cards-row' }, el('span', { class: 'suit-tag ' + (redSuit(s) ? 'bad-suit' : '') }, Br.SYM[s]),
        cs.length ? cs.map(c => {
          let cls = '';
          if (opts.legal) cls = opts.legal.has(c.id) ? 'legal' : 'dim';
          if (opts.hint && opts.hint === c) cls += ' hint';
          return cardEl(c, { cls, onclick: opts.onclick && (!opts.legal || opts.legal.has(c.id)) ? opts.onclick : null });
        }) : el('span', { class: 'muted', style: 'color:#cfe;font-size:.75rem' }, '—')));
    });
    return box;
  }

  const Settings = {
    defaults: { highlight: true, hints: true, explain: true, showAll: false },
    get() {
      try { return Object.assign({}, this.defaults, JSON.parse(localStorage.getItem('bridge.settings') || '{}')); }
      catch (e) { return Object.assign({}, this.defaults); }
    },
    set(s) { try { localStorage.setItem('bridge.settings', JSON.stringify(s)); } catch (e) { /* ignore */ } },
  };

  /** The 52 cards by suit, for lessons and the advisor picker. */
  function deckGuide() {
    const wrap = el('div', { class: 'deck-guide' });
    Br.SUITS.forEach(s => wrap.append(el('div', { class: 'deck-group' }, el('h4', {}, suitTag(s)), cardsRow(Br.DECK.filter(c => c.suit === s)))));
    return wrap;
  }

  /** Free-form hand description: "A R 7 3 ♠ · ..." */
  const shapeText = ev => ev.shape.join('-');
  const ids = s => s.split(' ').map(x => Br.card(x));

  Object.assign(Br, { el, cardEl, cardsRow, seatName, suitTag, callEl, suitRows, Settings, deckGuide, shapeText, ids, NAMES, redSuit });
})(window.Bridge = window.Bridge || {}, window.Poker);
