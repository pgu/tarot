/* Spanish 40-card deck, shared by La Escoba, Chinchón and El Tute. No DOM. */
(function (S) {
  'use strict';

  const SUITS = ['O', 'C', 'E', 'B'];
  const SUIT_INFO = {
    O: { name: 'Oros', en: 'Coins', sym: '🪙', cls: 'sp-O' },
    C: { name: 'Copas', en: 'Cups', sym: '🏆', cls: 'sp-C' },
    E: { name: 'Espadas', en: 'Swords', sym: '⚔️', cls: 'sp-E' },
    B: { name: 'Bastos', en: 'Clubs', sym: '🌿', cls: 'sp-B' },
  };
  const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const LABEL = { 1: 'A', 10: 'S', 11: 'C', 12: 'R' };
  const RANK_NAME = {
    1: 'As', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis', 7: 'Siete',
    10: 'Sota', 11: 'Caballo', 12: 'Rey',
  };
  const RANK_EN = { 1: 'Ace', 10: 'Jack (Sota)', 11: 'Knight (Caballo)', 12: 'King (Rey)' };

  const DECK = [];
  const BY_ID = {};
  SUITS.forEach(s => RANKS.forEach(r => {
    const c = {
      id: s + r, suit: s, rank: r, label: LABEL[r] || String(r), order: DECK.length,
      name: `${RANK_NAME[r]} de ${SUIT_INFO[s].name}`,
      en: `${RANK_EN[r] || r} of ${SUIT_INFO[s].en}`,
      text: (LABEL[r] || r) + SUIT_INFO[s].sym,
    };
    DECK.push(c);
    BY_ID[c.id] = c;
  }));

  function shuffle(arr, rng) {
    rng = rng || Math.random;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  Object.assign(S, {
    SUITS, SUIT_INFO, RANKS, DECK, BY_ID, shuffle,
    card: id => BY_ID[id],
    sortCards: cards => cards.slice().sort((a, b) => a.order - b.order),
  });
})(window.Spanish = window.Spanish || {});
