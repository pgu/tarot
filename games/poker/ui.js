/* Poker rendering helpers and settings. */
(function (P) {
  'use strict';
  const el = window.Core.el;

  function cardEl(card, opts) {
    opts = opts || {};
    if (opts.back || !card) return el('div', { class: 'card back ' + (opts.cls || '') });
    const info = P.SUIT_INFO[card.suit];
    const center = card.rank >= 11 && card.rank <= 13 ? card.label : info.sym;
    const e = el('div', { class: `card c-${info.color} ${opts.cls || ''}`, title: card.name, 'data-id': card.id },
      el('span', { class: 'corner' }, card.label, el('br'), info.sym),
      el('span', { class: 'center' }, center));
    if (opts.onclick) {
      e.classList.add('clickable');
      e.addEventListener('click', () => opts.onclick(card, e));
    }
    return e;
  }

  const cardsRow = (cards, opts) => el('div', { class: 'cards-row' }, cards.map(c => cardEl(c, opts)));
  const LETTER = { J: 11, Q: 12, K: 13, A: 14 };
  const ids = s => s.split(' ').map(x => P.card((LETTER[x[0]] || parseInt(x, 10)) + x.slice(-1)));
  const money = n => '$' + n.toLocaleString('en-US');

  function deckGuide() {
    const wrap = el('div', { class: 'deck-guide' });
    P.SUITS.forEach(s => wrap.append(el('div', { class: 'deck-group' },
      el('h4', {}, `${P.SUIT_INFO[s].sym} ${P.SUIT_INFO[s].name} `),
      cardsRow(P.DECK.filter(c => c.suit === s).sort((a, b) => a.rank - b.rank)))));
    return wrap;
  }

  const Settings = {
    defaults: { hints: true, explain: true, showAll: false },
    get() {
      try { return Object.assign({}, this.defaults, JSON.parse(localStorage.getItem('poker.settings') || '{}')); }
      catch (e) { return Object.assign({}, this.defaults); }
    },
    set(s) { try { localStorage.setItem('poker.settings', JSON.stringify(s)); } catch (e) { /* ignore */ } },
  };

  /** Example hands for each category, best first. */
  const EXAMPLES = [
    ['Straight flush', 'Five cards in sequence, all of the same suit. A–K–Q–J–10 suited is the "royal flush".', '10H 9H 8H 7H 6H'],
    ['Four of a kind', 'Four cards of the same rank.', '9S 9H 9D 9C KD'],
    ['Full house', 'Three of a kind plus a pair.', 'QS QH QD 4C 4D'],
    ['Flush', 'Five cards of the same suit, not in sequence.', 'AD JD 8D 6D 2D'],
    ['Straight', 'Five cards in sequence, any suits. The ace can be high (10-J-Q-K-A) or low (A-2-3-4-5).', '5S 6H 7D 8C 9S'],
    ['Three of a kind', 'Three cards of the same rank.', '7S 7H 7D KC 2S'],
    ['Two pair', 'Two different pairs.', 'JS JH 3D 3C AS'],
    ['One pair', 'Two cards of the same rank.', '10S 10H AD 7C 3S'],
    ['High card', 'None of the above: your highest card plays.', 'AS JH 8D 5C 3S'],
  ];

  Object.assign(P, { el, cardEl, cardsRow, ids, money, deckGuide, Settings, EXAMPLES });
})(window.Poker = window.Poker || {});
