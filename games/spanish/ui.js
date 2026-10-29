/* Spanish deck rendering. */
(function (S) {
  'use strict';
  const el = window.Core.el;

  /* Suit icons are drawn as SVG so they look the same everywhere:
     gold coin (oros), red cup (copas), steel sword (espadas), wooden club (bastos). */
  const ICONS = {
    O: '<circle cx="12" cy="12" r="10.5" fill="#f4c430" stroke="#9a6b00" stroke-width="1.4"/><circle cx="12" cy="12" r="7" fill="#fbdf6b" stroke="#b8860b" stroke-width="1"/><circle cx="12" cy="12" r="2.6" fill="#e0a800" stroke="#b8860b" stroke-width=".8"/>',
    C: '<path d="M4.5 3h15c0 7-3 10.5-7.5 10.5S4.5 10 4.5 3z" fill="#c9302c" stroke="#6d1410" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 5.5c.2 3 1.4 5 3 6" fill="none" stroke="#f08a84" stroke-width="1.2" stroke-linecap="round"/><rect x="11" y="13.3" width="2" height="5.2" fill="#8c1f1a"/><path d="M6.5 22l1.5-3.6h8l1.5 3.6z" fill="#a82723" stroke="#6d1410" stroke-width="1" stroke-linejoin="round"/>',
    E: '<path d="M12 .8l2.3 4.2v10.4H9.7V5z" fill="#b9c6d4" stroke="#33475b" stroke-width="1.1" stroke-linejoin="round"/><path d="M12 2.5v12.5" stroke="#7d92a8" stroke-width=".9"/><rect x="5.5" y="15.4" width="13" height="2.4" rx="1" fill="#33475b"/><rect x="10.8" y="17.8" width="2.4" height="4" fill="#7a4a21"/><circle cx="12" cy="22.3" r="1.3" fill="#33475b"/>',
    B: '<g transform="rotate(28 12 12)"><path d="M9.2 1.6c1.7-.9 3.9-.9 5.6 0l1.6 6.5c.4 4-.3 8.6-.9 12.4-.3 1.7-1.7 2.5-3.5 2.5s-3.2-.8-3.5-2.5c-.6-3.8-1.3-8.4-.9-12.4z" fill="#9b6a34" stroke="#4a2c0e" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="12" cy="8.5" rx="1.7" ry="1.1" fill="#5d3a18"/><ellipse cx="11.3" cy="14.5" rx="1.3" ry=".9" fill="#5d3a18"/><path d="M10.5 4c-.4 4-.2 8 .3 12" fill="none" stroke="#c99a62" stroke-width=".9" stroke-linecap="round"/></g>',
  };
  const icon = suit => el('span', { class: 'suit-icon', html: `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[suit]}</svg>` });

  /** Set by a game to show an extra small badge on a card (e.g. Escoba's 8/9/10 for figures). */
  S.badge = null;

  function cardEl(card, opts) {
    opts = opts || {};
    if (opts.back || !card) return el('div', { class: 'card back ' + (opts.cls || '') });
    const info = S.SUIT_INFO[card.suit];
    const face = card.rank >= 10;
    const extra = S.badge ? S.badge(card) : null;
    const e = el('div', { class: `card spanish ${info.cls} ${opts.cls || ''}`, title: `${card.name} · ${card.en}`, 'data-id': card.id },
      el('span', { class: 'corner' }, String(card.rank), el('br'), icon(card.suit)),
      face
        ? el('span', { class: 'center face' }, el('span', { class: 'fl' }, card.label), el('span', { class: 'fn' }, String(card.rank)))
        : el('span', { class: 'center' }, icon(card.suit)),
      extra ? el('span', { class: 'badge sp-small' }, extra) : null);
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
      el('h4', {}, icon(s), ` ${S.SUIT_INFO[s].name} `, el('small', {}, `(${S.SUIT_INFO[s].en})`)),
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

  Object.assign(S, { el, cardEl, cardsRow, ids, deckGuide, makeSettings, icon });
})(window.Spanish = window.Spanish || {});
