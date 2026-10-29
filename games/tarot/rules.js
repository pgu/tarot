/* Rules: legal moves, trick winner, contracts. */
(function (T) {
  'use strict';

  const tr = window.Core.t;
  const takerDog = () => tr('Taker sees the dog, takes it, discards 6 cards.', 'Le preneur voit le chien, le prend et écarte 6 cartes.');
  const CONTRACTS = {
    petite: { key: 'petite', level: 1, mult: 1, get name() { return 'Petite'; }, get dog() { return takerDog(); } },
    garde: { key: 'garde', level: 2, mult: 2, get name() { return 'Garde'; }, get dog() { return takerDog(); } },
    sans: { key: 'sans', level: 3, mult: 4, get name() { return tr('Garde Sans', 'Garde sans'); }, get dog() { return tr('Dog is not shown; it counts for the taker.', 'Le chien n\'est pas montré ; il compte pour le preneur.'); } },
    contre: { key: 'contre', level: 4, mult: 6, get name() { return tr('Garde Contre', 'Garde contre'); }, get dog() { return tr('Dog is not shown; it counts for the defenders.', 'Le chien n\'est pas montré ; il compte pour les défenseurs.'); } },
  };
  const CONTRACT_ORDER = ['petite', 'garde', 'sans', 'contre'];

  const RULE_TEXT = {
    get lead() { return tr('You lead the trick: any card is allowed.', 'Vous entamez le pli : n\'importe quelle carte est permise.'); },
    get 'excuse-led'() { return tr('The Excuse was led, so the next card played sets the suit. As the next player you may lead anything.', 'L\'Excuse a été jouée en premier : la carte suivante détermine la couleur du pli. Comme joueur suivant, vous pouvez entamer avec n\'importe quelle carte.'); },
    get follow() { return tr('You must follow the suit that was led. (The Excuse is always allowed too.)', 'Vous devez fournir à la couleur demandée. (L\'Excuse est toujours permise.)'); },
    get overtrump() { return tr('You must play a higher trump than the best trump already in the trick.', 'Vous devez jouer un atout plus fort que le meilleur atout déjà dans le pli (surcouper).'); },
    get undertrump() { return tr('You cannot beat the best trump, but you still must play a trump (any trump).', 'Vous ne pouvez pas battre le meilleur atout, mais vous devez quand même jouer un atout (n\'importe lequel).'); },
    get 'must-trump'() { return tr('You have no card of the suit led, so you must play a trump.', 'Vous n\'avez pas la couleur demandée : vous devez couper avec un atout.'); },
    get 'no-trump'() { return tr('Trump was led but you hold no trump, so you may play any card.', 'On a demandé de l\'atout mais vous n\'en avez pas : vous pouvez jouer n\'importe quelle carte.'); },
    get free() { return tr('You have neither the suit led nor any trump, so you may play any card.', 'Vous n\'avez ni la couleur demandée ni d\'atout : vous pouvez jouer n\'importe quelle carte.'); },
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
    if (cards.length !== 6) return tr('Choose exactly 6 cards.', 'Choisissez exactement 6 cartes.');
    if (cards.some(c => c.oudler)) return tr('You may never discard an oudler (21, Petit, Excuse).', 'On ne peut jamais écarter un bout (21, Petit, Excuse).');
    if (cards.some(c => c.suit !== 'T' && c.rank === 14)) return tr('You may not discard a King.', 'On ne peut pas écarter un roi.');
    const candidates = hand.filter(c => !c.oudler && c.suit !== 'T' && c.rank !== 14);
    const trumpCount = cards.filter(c => c.suit === 'T').length;
    if (trumpCount > Math.max(0, 6 - candidates.length)) {
      return tr('You may only discard a trump if you cannot fill the 6 cards with other cards (no oudlers/kings).', 'Vous ne pouvez écarter un atout que si vous ne pouvez pas compléter les 6 cartes avec d\'autres cartes (ni bouts, ni rois).');
    }
    return null;
  }

  Object.assign(T, {
    CONTRACTS, CONTRACT_ORDER, RULE_TEXT,
    leadSuit, legalInfo, legalCards, trickWinnerIndex, requiredPoints, validateDiscard,
  });
})(window.Tarot = window.Tarot || {});
