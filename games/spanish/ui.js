/* Spanish deck rendering. */
(function (S) {
  'use strict';
  const el = window.Core.el;

  function cardEl(card, opts) {
    opts = opts || {};
    if (opts.back || !card) return el('div', { class: 'card back ' + (opts.cls || '') });
    const info = S.SUIT_INFO[card.suit];
    const face = card.rank >= 10;
    const e = el('div', { class: `card spanish ${info.cls} ${opts.cls || ''}`, title: `${card.name} · ${card.en}`, 'data-id': card.id },
      el('span', { class: 'corner' }, card.label, el('br'), info.sym),
      el('span', { class: 'center' }, face ? card.label : info.sym),
      face ? el('span', { class: 'badge sp-small' }, info.sym) : null);
    if (opts.onclick) {
      e.classList.add('clickable');
      e.addEventListener('click', () => opts.onclick(card, e));
    }
    return e;
  }

  const cardsRow = (cards, opts) => el('div', { class: 'cards-row' }, cards.map(c => cardEl(c, opts)));
  const ids = s => s.split(' ').map(x => S.card(x));

  function deckGuide() {
    const wrap = el('div', { class: 'deck-guide' });
    S.SUITS.forEach(s => wrap.append(el('div', { class: 'deck-group' },
      el('h4', {}, `${S.SUIT_INFO[s].sym} ${S.SUIT_INFO[s].name} `, el('small', {}, `(${S.SUIT_INFO[s].en})`)),
      cardsRow(S.DECK.filter(c => c.suit === s)))));
    return wrap;
  }

  function makeSettings(key, defaults) {
    return {
      get() {
        try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(key) || '{}')); }
        catch (e) { return Object.assign({}, defaults); }
      },
      set(s) { try { localStorage.setItem(key, JSON.stringify(s)); } catch (e) { /* ignore */ } },
    };
  }

  Object.assign(S, { el, cardEl, cardsRow, ids, deckGuide, makeSettings });
})(window.Spanish = window.Spanish || {});
