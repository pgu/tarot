/* Deck definition: 78 cards of French Tarot. */
(function (T) {
  'use strict';

  const SUITS = ['S', 'H', 'C', 'D'];
  const SUIT_INFO = {
    S: { name: 'Spades', sym: '♠', color: 'black' },
    H: { name: 'Hearts', sym: '♥', color: 'red' },
    C: { name: 'Clubs', sym: '♣', color: 'black' },
    D: { name: 'Diamonds', sym: '♦', color: 'red' },
    T: { name: 'Trumps', sym: '★', color: 'gold' },
    X: { name: 'Excuse', sym: '🃏', color: 'gold' },
  };
  const FACE = {
    11: ['J', 'Jack (Valet)', 1.5],
    12: ['C', 'Knight (Cavalier)', 2.5],
    13: ['Q', 'Queen (Dame)', 3.5],
    14: ['K', 'King (Roi)', 4.5],
  };

  const DECK = [];
  const BY_ID = {};

  function add(suit, rank) {
    const c = { id: suit + rank, suit, rank, points: 0.5, oudler: false, order: DECK.length };
    if (suit === 'X') {
      c.points = 4.5;
      c.oudler = true;
      c.label = 'Ex';
      c.name = 'The Excuse (Fool)';
      c.text = 'Excuse';
    } else if (suit === 'T') {
      c.label = String(rank);
      c.oudler = rank === 1 || rank === 21;
      if (c.oudler) c.points = 4.5;
      c.name = rank === 1 ? 'Trump 1 (the Petit)' : rank === 21 ? 'Trump 21 (the Monde)' : 'Trump ' + rank;
      c.text = rank + '★';
    } else {
      const face = FACE[rank];
      if (face) c.points = face[2];
      c.label = face ? face[0] : String(rank);
      c.name = (face ? face[1] : rank) + ' of ' + SUIT_INFO[suit].name;
      c.text = c.label + SUIT_INFO[suit].sym;
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
