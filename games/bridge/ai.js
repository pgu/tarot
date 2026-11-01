/* Le Bridge: card play AI (opening lead, declarer, dummy, defence). No DOM. */
(function (Br) {
  'use strict';
  const { SUITS, side } = Br;

  const lowest = cards => cards.slice().sort((a, b) => a.rank - b.rank)[0];
  const highest = cards => cards.slice().sort((a, b) => b.rank - a.rank)[0];
  const ofSuit = (hand, s) => hand.filter(c => c.suit === s);
  const sn = s => Br.SUIT_FR[s];

  /** Highest rank of `suit` that nobody has seen yet (not in the visible hands nor played). */
  function topUnseen(suit, seen) {
    for (let r = 14; r >= 2; r--) if (!seen.has(r + suit)) return r;
    return 0;
  }

  /** Cards touching in rank form a sequence (K Q, Q J 10...). Returns the top card of the best sequence in the suit. */
  function sequenceTop(cards) {
    const rs = cards.map(c => c.rank).sort((a, b) => b - a);
    for (let i = 0; i + 1 < rs.length; i++) if (rs[i] >= 10 && rs[i] - rs[i + 1] === 1) return cards.find(c => c.rank === rs[i]);
    return null;
  }

  function openingLead(hand, trump) {
    const nonTrump = SUITS.filter(s => s !== trump);
    // top of a solid sequence (or A from A-K)
    for (const s of nonTrump.slice().sort((x, y) => ofSuit(hand, y).length - ofSuit(hand, x).length)) {
      const cs = ofSuit(hand, s);
      if (cs.length >= 2) {
        const top = sequenceTop(cs);
        if (top) return { card: top, reason: `Entame classique : le haut d'une séquence de ${sn(s)} (${top.name.toLowerCase()}).` };
      }
    }
    if (trump) { // short suit: a singleton can bring a ruff
      const single = nonTrump.find(s => ofSuit(hand, s).length === 1 && ofSuit(hand, s)[0].rank !== 14);
      if (single) return { card: ofSuit(hand, single)[0], reason: `Entame d'un singleton à ${sn(single)} : une coupe est peut-être possible.` };
    }
    const cands = nonTrump.filter(s => ofSuit(hand, s).length).sort((x, y) => ofSuit(hand, y).length - ofSuit(hand, x).length);
    const s = cands.find(x => !(ofSuit(hand, x).length <= 3 && ofSuit(hand, x).some(c => c.rank === 14) && !trump === false)) || cands[0];
    const cs = ofSuit(hand, s).sort((a, b) => b.rank - a.rank);
    if (cs.length >= 4) return { card: cs[3], reason: `Entame de la 4e meilleure de votre plus longue couleur (${sn(s)}) : classique contre un contrat à ${trump ? 'l\'atout' : 'SA'}.` };
    return { card: cs[cs.length - 1], reason: `Entame d'une petite carte de ${sn(s)}.` };
  }

  /**
   * ctx: {hand, partnerHand (or null if unknown), trick: [{player, card}], trump, seat, role: 'declarer'|'dummy'|'defender',
   *       played: [cards], dummyHand (visible dummy or null), trickNo}
   */
  function choose(ctx) {
    const { hand, trick, trump, seat, role } = ctx;
    const legal = Br.legalCards(hand, trick);
    if (legal.length === 1) return { card: legal[0], reason: 'Carte unique.' };
    const seen = new Set(ctx.played.map(c => c.id));
    hand.forEach(c => seen.add(c.id));
    (ctx.partnerHand || []).forEach(c => seen.add(c.id));
    if (ctx.dummyHand) ctx.dummyHand.forEach(c => seen.add(c.id));
    const isMaster = c => c.rank >= topUnseen(c.suit, seen);

    if (!trick.length) {
      if (role === 'defender' && ctx.trickNo === 0) return openingLead(hand, trump);
      const declaring = role !== 'defender';
      if (declaring && trump) {
        const mine = ofSuit(hand, trump); const ours = mine.length + (ctx.partnerHand ? ofSuit(ctx.partnerHand, trump).length : 0);
        const played = ctx.played.filter(c => c.suit === trump).length;
        const out = 13 - ours - played;
        if (out > 0 && mine.length && ours >= 6) {
          const top = highest(mine);
          const pick = top.rank >= 12 ? top : lowest(mine);
          return { card: pick, reason: top.rank >= 12 ? 'On tire les atouts adverses avec les honneurs.' : 'On joue petit atout pour que le partenaire garde la main avec ses honneurs.' };
        }
      }
      const masters = legal.filter(c => c.suit !== trump && isMaster(c) && ofSuit(hand, c.suit).length >= 1);
      if (masters.length) {
        const m = masters.sort((a, b) => ofSuit(hand, b.suit).length - ofSuit(hand, a.suit).length || b.rank - a.rank)[0];
        return { card: m, reason: `${m.name} est maître : un pli sûr.` };
      }
      const suits = SUITS.filter(s => s !== trump && ofSuit(hand, s).length).sort((x, y) => ofSuit(hand, y).length - ofSuit(hand, x).length);
      if (suits.length) {
        const cs = ofSuit(hand, suits[0]).sort((a, b) => a.rank - b.rank);
        const top = sequenceTop(cs);
        return top && role === 'defender' ? { card: top, reason: `On entame le haut d'une séquence à ${sn(suits[0])}.` } : { card: cs[0], reason: `On joue petit dans la couleur la plus longue (${sn(suits[0])}).` };
      }
      return { card: lowest(legal), reason: 'Il ne reste que des atouts.' };
    }

    const led = trick[0].card.suit;
    const wi = Br.trickWinnerIndex(trick, trump);
    const win = trick[wi].card;
    const partnerWinning = side(trick[wi].player) === side(seat);
    const pos = trick.length; // 1 = second hand, 2 = third, 3 = fourth
    const follows = hand.filter(c => c.suit === led);
    if (follows.length) {
      const beating = win.suit === led ? follows.filter(c => c.rank > win.rank) : [];
      if (pos === 3) return partnerWinning ? { card: lowest(follows), reason: 'Votre camp gagne déjà le pli : jouez petit.' }
        : beating.length ? { card: lowest(beating), reason: 'Dernier à jouer : prenez le pli avec la plus petite carte gagnante.' } : { card: lowest(follows), reason: 'Vous ne pouvez pas gagner : jouez petit.' };
      if (pos === 2) {
        if (partnerWinning && isMaster(win)) return { card: lowest(follows), reason: 'Le partenaire a déjà une carte maîtresse : jouez petit.' };
        if (beating.length) return { card: lowest(beating), reason: 'Troisième à jouer : essayez de gagner le pli avec la plus petite carte suffisante.' };
        return { card: lowest(follows), reason: 'Vous ne pouvez pas gagner : jouez petit.' };
      }
      if (win.rank >= 11 && beating.length && !partnerWinning) return { card: lowest(beating), reason: 'On couvre un honneur par un honneur.' };
      return { card: lowest(follows), reason: 'Deuxième à jouer : jouez petit.' };
    }
    const trumps = trump ? ofSuit(hand, trump) : [];
    if (trumps.length && !partnerWinning) {
      if (win.suit === trump) {
        const over = trumps.filter(c => c.rank > win.rank);
        if (over.length) return { card: lowest(over), reason: 'Surcoupe avec le plus petit atout suffisant.' };
      } else return { card: lowest(trumps), reason: 'Vous n\'avez pas la couleur : coupez avec un petit atout.' };
    }
    const discards = hand.filter(c => c.suit !== trump);
    const pool = discards.length ? discards : hand;
    const len = s => pool.filter(c => c.suit === s).length;
    const d = pool.slice().sort((a, b) => a.rank - b.rank || len(b.suit) - len(a.suit))[0];
    return { card: d, reason: 'Défausse de la carte la moins utile.' };
  }

  Br.AI = { choose, openingLead };
})(window.Bridge = window.Bridge || {});
