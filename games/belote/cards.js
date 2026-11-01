/* La Belote: 32-card deck, card order and points depending on the trump, legal cards, trick winner. No DOM. */
(function (B, P) {
  'use strict';

  const SUITS = ['S', 'H', 'C', 'D'];
  const SUIT_FR = { S: 'pique', H: 'cœur', C: 'trèfle', D: 'carreau' };
  const SUIT_SYM = { S: '♠', H: '♥', C: '♣', D: '♦' };
  const RANK_FR = { 7: 'sept', 8: 'huit', 9: 'neuf', 10: 'dix', 11: 'valet', 12: 'dame', 13: 'roi', 14: 'as' };
  const LABEL = { 11: 'V', 12: 'D', 13: 'R', 14: 'A' };
  const PLAIN_ORDER = [7, 8, 9, 11, 12, 13, 10, 14]; // weakest -> strongest
  const TRUMP_ORDER = [7, 8, 12, 13, 10, 14, 9, 11];
  const PLAIN_POINTS = { 7: 0, 8: 0, 9: 0, 10: 10, 11: 2, 12: 3, 13: 4, 14: 11 };
  const TRUMP_POINTS = { 7: 0, 8: 0, 9: 14, 10: 10, 11: 20, 12: 3, 13: 4, 14: 11 };

  const DECK = [];
  const BY_ID = {};
  SUITS.forEach(s => PLAIN_ORDER.slice().sort((a, b) => a - b).forEach(r => {
    const c = {
      id: r + s, suit: s, rank: r, label: LABEL[r] || String(r), text: (LABEL[r] || r) + SUIT_SYM[s],
      name: `${RANK_FR[r][0].toUpperCase()}${RANK_FR[r].slice(1)} de ${SUIT_FR[s]}`,
    };
    DECK.push(c);
    BY_ID[c.id] = c;
  }));

  const isTrump = (c, trump) => c.suit === trump;
  /** Strength used to compare two cards (trumps always above plain cards). */
  const strength = (c, trump) => (c.suit === trump ? 100 + TRUMP_ORDER.indexOf(c.rank) : PLAIN_ORDER.indexOf(c.rank));
  const points = (c, trump) => (c.suit === trump ? TRUMP_POINTS[c.rank] : PLAIN_POINTS[c.rank]);
  const sumPoints = (cards, trump) => cards.reduce((s, c) => s + points(c, trump), 0);

  /** Display order: trump first, then alternating colours; strongest first inside a suit. */
  function sortHand(cards, trump) {
    const order = trump ? [trump, ...['S', 'H', 'C', 'D'].filter(s => s !== trump)] : SUITS;
    if (trump) { // alternate colours: after the trump, put a suit of the other colour next
      const red = s => s === 'H' || s === 'D';
      const others = SUITS.filter(s => s !== trump);
      const opposite = others.filter(s => red(s) !== red(trump));
      const same = others.filter(s => red(s) === red(trump));
      order.splice(0, order.length, trump, opposite[0], same[0], opposite[1]);
    }
    return cards.slice().sort((a, b) => (order.indexOf(a.suit) - order.indexOf(b.suit)) || (strength(b, trump) - strength(a, trump)));
  }

  function shuffle(arr, rng) { return P.shuffle(arr, rng); }

  /** Index (in the trick) of the winning card. trick = [{player, card}], first entry led. */
  function trickWinnerIndex(trick, trump) {
    const lead = trick[0].card.suit;
    let best = 0;
    trick.forEach((p, i) => {
      if (i === 0) return;
      const c = p.card; const b = trick[best].card;
      if (c.suit === trump) { if (b.suit !== trump || strength(c, trump) > strength(b, trump)) best = i; }
      else if (c.suit === lead && b.suit !== trump && strength(c, trump) > strength(b, trump)) best = i;
    });
    return best;
  }

  /** {cards, rule}: playable cards for `player` and the rule that applies. */
  function legalInfo(hand, trick, trump, player) {
    if (!trick.length) return { cards: hand.slice(), rule: 'lead' };
    const lead = trick[0].card.suit;
    const trumpsIn = trick.filter(p => p.card.suit === trump).map(p => strength(p.card, trump));
    const top = trumpsIn.length ? Math.max(...trumpsIn) : -1;
    const myTrumps = hand.filter(c => c.suit === trump);
    const higher = myTrumps.filter(c => strength(c, trump) > top);
    if (lead === trump) {
      if (!myTrumps.length) return { cards: hand.slice(), rule: 'no-trump' };
      return higher.length ? { cards: higher, rule: 'overtrump' } : { cards: myTrumps, rule: 'undertrump' };
    }
    const follow = hand.filter(c => c.suit === lead);
    if (follow.length) return { cards: follow, rule: 'follow' };
    const winner = trick[trickWinnerIndex(trick, trump)].player;
    if (winner === (player + 2) % 4) return { cards: hand.slice(), rule: 'partner' };
    if (!myTrumps.length) return { cards: hand.slice(), rule: 'free' };
    if (top < 0) return { cards: myTrumps, rule: 'must-cut' };
    return higher.length ? { cards: higher, rule: 'overcut' } : { cards: myTrumps, rule: 'undercut' };
  }

  const RULE_TEXT = {
    lead: 'Vous entamez : toutes les cartes sont permises.',
    follow: 'Vous devez fournir à la couleur demandée.',
    overtrump: 'On a demandé de l\'atout : vous devez monter, c\'est-à-dire jouer un atout plus fort que le meilleur atout du pli.',
    undertrump: 'On a demandé de l\'atout et vous ne pouvez pas monter : vous devez quand même jouer un atout.',
    'no-trump': 'On a demandé de l\'atout mais vous n\'en avez pas : vous pouvez jouer n\'importe quelle carte.',
    partner: 'Vous n\'avez pas la couleur demandée mais votre partenaire est maître du pli : vous n\'êtes pas obligé de couper, jouez ce que vous voulez.',
    'must-cut': 'Vous n\'avez pas la couleur demandée et votre partenaire n\'est pas maître : vous devez couper avec un atout.',
    overcut: 'Un adversaire a déjà coupé : vous devez surcouper, c\'est-à-dire jouer un atout plus fort que le sien.',
    undercut: 'Un adversaire a déjà coupé plus fort que vous ne pouvez : vous devez tout de même jouer un atout (sous-couper).',
    free: 'Vous n\'avez ni la couleur demandée ni d\'atout : jouez la carte que vous voulez.',
  };

  Object.assign(B, {
    SUITS, SUIT_FR, SUIT_SYM, RANK_FR, PLAIN_ORDER, TRUMP_ORDER, PLAIN_POINTS, TRUMP_POINTS, DECK,
    card: id => BY_ID[id],
    isTrump, strength, points, sumPoints, sortHand, shuffle, trickWinnerIndex, legalInfo, RULE_TEXT,
    legalCards: (hand, trick, trump, player) => legalInfo(hand, trick, trump, player).cards,
  });
})(window.Belote = window.Belote || {}, window.Poker);
