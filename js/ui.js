/* Small DOM helpers and card rendering shared by all screens. */
(function (T) {
  'use strict';

  function el(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    const append = k => {
      if (k == null || k === false) return;
      if (Array.isArray(k)) k.forEach(append);
      else e.append(k.nodeType ? k : document.createTextNode(String(k)));
    };
    kids.forEach(append);
    return e;
  }

  /** Render one card. opts: {back, onclick, cls, mini} */
  function cardEl(card, opts) {
    opts = opts || {};
    if (opts.back || !card) return el('div', { class: 'card back ' + (opts.cls || '') });
    const info = T.SUIT_INFO[card.suit];
    const face = T.isFace(card);
    const cls = ['card', 'c-' + info.color, card.suit === 'T' ? 'trump' : '', card.suit === 'X' ? 'excuse' : '',
      card.oudler ? 'oudler' : '', opts.cls || ''].join(' ');
    let center;
    if (card.suit === 'X') center = '🃏';
    else if (card.suit === 'T') center = String(card.rank);
    else center = face ? card.label : info.sym;
    const e = el('div', { class: cls, title: card.name + ' – ' + T.Bots.fmt(card.points) + ' pts', 'data-id': card.id },
      el('span', { class: 'corner' }, card.suit === 'X' ? 'Ex' : card.label, el('br'), card.suit === 'X' ? '' : info.sym),
      el('span', { class: 'center' }, center),
      card.oudler ? el('span', { class: 'badge' }, '4.5') : null,
    );
    if (opts.onclick) {
      e.classList.add('clickable');
      e.addEventListener('click', () => opts.onclick(card, e));
    }
    return e;
  }

  const cardsRow = (cards, opts) => el('div', { class: 'cards-row' }, cards.map(c => cardEl(c, opts)));

  const fmt = T.Bots.fmt;
  const contractName = k => (k ? T.CONTRACTS[k].name : 'Pass');

  /** Persisted settings */
  const Settings = {
    defaults: { highlight: true, hints: true, explain: true, count: false },
    get() {
      try { return Object.assign({}, this.defaults, JSON.parse(localStorage.getItem('tarot.settings') || '{}')); }
      catch (e) { return Object.assign({}, this.defaults); }
    },
    set(s) { try { localStorage.setItem('tarot.settings', JSON.stringify(s)); } catch (e) { /* ignore */ } },
  };

  /** Table of the whole deck grouped by suit, used in the lessons and the reference. */
  function deckGuide() {
    const wrap = el('div', { class: 'deck-guide' });
    const groups = [...T.SUITS, 'T', 'X'];
    groups.forEach(s => {
      const cards = T.DECK.filter(c => c.suit === s);
      wrap.append(el('div', { class: 'deck-group' },
        el('h4', {}, `${T.SUIT_INFO[s].sym} ${T.SUIT_INFO[s].name} `,
          el('small', {}, s === 'T' ? '21 cards (1–21)' : s === 'X' ? '1 card' : '14 cards: 1–10 + J, C, Q, K')),
        cardsRow(cards)));
    });
    return wrap;
  }

  Object.assign(T, { el, cardEl, cardsRow, fmt, contractName, Settings, deckGuide });
})(window.Tarot = window.Tarot || {});
