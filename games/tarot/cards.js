/* Deck definition: 78 cards of French Tarot. */
(function (T) {
  'use strict';

  const SUITS = ['S', 'H', 'C', 'D'];
  const tr = window.Core.t;
  const fr = () => window.Core.lang === 'fr';
  const SUIT_INFO = {
    S: { sym: '♠', color: 'black', en: 'Spades', fr: 'Pique' },
    H: { sym: '♥', color: 'red', en: 'Hearts', fr: 'Cœur' },
    C: { sym: '♣', color: 'black', en: 'Clubs', fr: 'Trèfle' },
    D: { sym: '♦', color: 'red', en: 'Diamonds', fr: 'Carreau' },
    T: { sym: '★', color: 'gold', en: 'Trumps', fr: 'Atouts' },
    X: { sym: '🃏', color: 'gold', en: 'Excuse', fr: 'Excuse' },
  };
  // localized name, read at render time
  Object.values(SUIT_INFO).forEach(i => Object.defineProperty(i, 'name', { get: () => (fr() ? i.fr : i.en), enumerable: true }));
  // rank -> [label EN, label FR, name EN, name FR, points]
  const FACE = {
    11: ['J', 'V', 'Jack (Valet)', 'Valet', 1.5],
    12: ['C', 'C', 'Knight (Cavalier)', 'Cavalier', 2.5],
    13: ['Q', 'D', 'Queen (Dame)', 'Dame', 3.5],
    14: ['K', 'R', 'King (Roi)', 'Roi', 4.5],
  };

  const DECK = [];
  const BY_ID = {};

  function add(suit, rank) {
    const c = { id: suit + rank, suit, rank, points: 0.5, oudler: false, order: DECK.length };
    const face = FACE[rank];
    const def = (k, get) => Object.defineProperty(c, k, { get, enumerable: true });
    if (suit === 'X') {
      c.points = 4.5;
      c.oudler = true;
      def('label', () => 'Ex');
      def('name', () => tr('The Excuse (Fool)', 'L\'Excuse'));
      def('text', () => 'Excuse');
    } else if (suit === 'T') {
      c.oudler = rank === 1 || rank === 21;
      if (c.oudler) c.points = 4.5;
      def('label', () => String(rank));
      def('name', () => (rank === 1 ? tr('Trump 1 (the Petit)', 'Atout 1 (le Petit)') : rank === 21 ? tr('Trump 21 (the Monde)', 'Atout 21 (le Monde)') : tr('Trump ', 'Atout ') + rank));
      def('text', () => rank + '★');
    } else {
      if (face) c.points = face[4];
      def('label', () => (face ? (fr() ? face[1] : face[0]) : String(rank)));
      def('name', () => (fr() ? `${face ? face[3] : rank} de ${SUIT_INFO[suit].fr.toLowerCase()}` : `${face ? face[2] : rank} of ${SUIT_INFO[suit].en}`));
      def('text', () => c.label + SUIT_INFO[suit].sym);
    }
    DECK.push(c);
    BY_ID[c.id] = c;
  }

  SUITS.forEach(s => { for (let r = 1; r <= 14; r++) add(s, r); });
  for (let r = 1; r <= 21; r++) add('T', r);
  add('X', 0);

  function shuffle(arr, rng) {
    rng = rng || Math.random;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function sortHand(cards) {
    return cards.slice().sort((a, b) => a.order - b.order);
  }

  function sumPoints(cards) {
    return cards.reduce((s, c) => s + c.points, 0);
  }

  Object.assign(T, {
    SUITS, SUIT_INFO, FACE, DECK, BY_ID, shuffle, sortHand, sumPoints,
    card: id => BY_ID[id],
    isFace: c => c.suit !== 'T' && c.suit !== 'X' && c.rank > 10,
  });
})(window.Tarot = window.Tarot || {});
