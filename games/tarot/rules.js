/* Rules: legal moves, trick winner, contracts. */
(function (T) {
  'use strict';

  const CONTRACTS = {
    petite: { key: 'petite', level: 1, name: 'Petite', mult: 1, dog: 'Taker sees the dog, takes it, discards 6 cards.' },
    garde: { key: 'garde', level: 2, name: 'Garde', mult: 2, dog: 'Taker sees the dog, takes it, discards 6 cards.' },
    sans: { key: 'sans', level: 3, name: 'Garde Sans', mult: 4, dog: 'Dog is not shown; it counts for the taker.' },
    contre: { key: 'contre', level: 4, name: 'Garde Contre', mult: 6, dog: 'Dog is not shown; it counts for the defenders.' },
  };
  const CONTRACT_ORDER = ['petite', 'garde', 'sans', 'contre'];

  const RULE_TEXT = {
    lead: 'You lead the trick: any card is allowed.',
    'excuse-led': 'The Excuse was led, so the next card played sets the suit. As the next player you may lead anything.',
    follow: 'You must follow the suit that was led. (The Excuse is always allowed too.)',
    overtrump: 'You must play a higher trump than the best trump already in the trick.',
    undertrump: 'You cannot beat the best trump, but you still must play a trump (any trump).',
    'must-trump': 'You have no card of the suit led, so you must play a trump.',
    'no-trump': 'Trump was led but you hold no trump, so you may play any card.',
    free: 'You have neither the suit led nor any trump, so you may play any card.',
  };

  function leadSuit(trick) {
    for (const p of trick) if (p.card.suit !== 'X') return p.card.suit;
    return null;
  }

  function topTrump(trick) {
    let m = 0;
    for (const p of trick) if (p.card.suit === 'T' && p.card.rank > m) m = p.card.rank;
    return m;
  }

  /** Returns {cards, rule}: playable cards and which rule applies. */
  function legalInfo(hand, trick) {
    if (!trick.length) return { cards: hand.slice(), rule: 'lead' };
    const lead = leadSuit(trick);
    if (lead === null) return { cards: hand.slice(), rule: 'excuse-led' };
    const excuse = hand.filter(c => c.suit === 'X');
    const top = topTrump(trick);
    const trumps = hand.filter(c => c.suit === 'T');
    const pickTrumps = (pool, forcedRule) => {
      const higher = pool.filter(c => c.rank > top);
      if (top > 0) {
        return higher.length
          ? { cards: higher.concat(excuse), rule: 'overtrump' }
          : { cards: pool.concat(excuse), rule: 'undertrump' };
      }
      return { cards: pool.concat(excuse), rule: forcedRule };
    };
    if (lead === 'T') {
      if (!trumps.length) return { cards: hand.slice(), rule: 'no-trump' };
      return pickTrumps(trumps, 'follow');
    }
    const follow = hand.filter(c => c.suit === lead);
    if (follow.length) return { cards: follow.concat(excuse), rule: 'follow' };
    if (trumps.length) return pickTrumps(trumps, 'must-trump');
    return { cards: hand.slice(), rule: 'free' };
  }

  const legalCards = (hand, trick) => legalInfo(hand, trick).cards;

  /** Index (in trick) of the card currently winning, or -1 if only the Excuse is down. */
  function trickWinnerIndex(trick) {
    let best = -1;
    trick.forEach((p, i) => {
      const c = p.card;
      if (c.suit === 'X') return;
      if (best < 0) { best = i; return; }
      const b = trick[best].card;
      if (c.suit === 'T' && (b.suit !== 'T' || c.rank > b.rank)) best = i;
      else if (c.suit === b.suit && c.suit !== 'T' && c.rank > b.rank) best = i;
    });
    return best;
  }

  const requiredPoints = oudlers => [56, 51, 41, 36][oudlers];

  /** Validate a discard of 6 cards from the 24-card hand. Returns error string or null. */
  function validateDiscard(hand, cards) {
    if (cards.length !== 6) return 'Choose exactly 6 cards.';
    if (cards.some(c => c.oudler)) return 'You may never discard an oudler (21, Petit, Excuse).';
    if (cards.some(c => c.suit !== 'T' && c.rank === 14)) return 'You may not discard a King.';
    const candidates = hand.filter(c => !c.oudler && c.suit !== 'T' && c.rank !== 14);
    const trumpCount = cards.filter(c => c.suit === 'T').length;
    if (trumpCount > Math.max(0, 6 - candidates.length)) {
      return 'You may only discard a trump if you cannot fill the 6 cards with other cards (no oudlers/kings).';
    }
    return null;
  }

  Object.assign(T, {
    CONTRACTS, CONTRACT_ORDER, RULE_TEXT,
    leadSuit, legalInfo, legalCards, trickWinnerIndex, requiredPoints, validateDiscard,
  });
})(window.Tarot = window.Tarot || {});
