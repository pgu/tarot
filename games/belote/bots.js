/* La Belote: heuristic AI. Also powers the coach (take / pass advice, card hints). */
(function (B) {
  'use strict';

  const fr = s => B.SUIT_FR[s];
  const TRUMP_VALUE = { 11: 3.5, 9: 2.5, 14: 1.5, 10: 1.2, 13: 0.8, 12: 0.6, 8: 0.3, 7: 0.3 };

  /**
   * Strength of `cards` if `suit` were trump. Returns {score, details:[{label, value, note}], trumps}.
   * For a take, `cards` already include the turned card (it goes to the taker).
   */
  function evaluateTrump(cards, suit) {
    const trumps = cards.filter(c => c.suit === suit);
    const details = [];
    let score = 0;
    const add = (label, value, note) => { if (value) { score += value; details.push({ label, value, note }); } };
    const has = r => trumps.some(c => c.rank === r);
    add('Valet d\'atout', has(11) ? 3.5 : 0, 'Le valet est la plus forte carte du jeu : 20 points et il gagne toujours à l\'atout.');
    add('Neuf d\'atout', has(9) ? (has(11) ? 2.5 : 2) : 0, 'Le 9 d\'atout est le deuxième atout (14 points).');
    add('As, dix, roi, dame d\'atout', trumps.filter(c => [14, 10, 13, 12].includes(c.rank)).reduce((s, c) => s + TRUMP_VALUE[c.rank], 0), 'Les autres figures d\'atout rapportent des points et des plis.');
    add('Petits atouts (7, 8)', trumps.filter(c => c.rank < 9).length * 0.3, 'Ils aident à fournir quand on joue atout.');
    add(`${trumps.length} atout(s) en tout`, Math.max(0, trumps.length - 2) * 0.9, 'Plus on a d\'atouts, plus on contrôle la donne.');
    add('Belote-rebelote', has(13) && has(12) ? 1 : 0, 'Roi + dame d\'atout : 20 points de prime.');
    const aces = cards.filter(c => c.suit !== suit && c.rank === 14);
    add(`${aces.length} as hors atout`, aces.length * 0.9, 'Un as hors atout gagne souvent son pli (11 points).');
    return { score, details, trumps: trumps.length };
  }

  const THRESHOLD = { 1: 6.2, 2: 5.2 };

  /** hand: the bot's 5 cards. round 1: may take turned.suit; round 2: any other suit. */
  function chooseBid(hand, turned, round, aggr, isLast) {
    const suits = round === 1 ? [turned.suit] : B.SUITS.filter(s => s !== turned.suit);
    const options = suits.map(s => ({ suit: s, ev: evaluateTrump(hand.concat(turned), s) }));
    options.sort((a, b) => b.ev.score - a.ev.score);
    const best = options[0];
    const limit = THRESHOLD[round] - (aggr || 0) - (round === 2 && isLast ? 0.6 : 0);
    const take = best.ev.score >= limit;
    return {
      suit: take ? best.suit : null,
      reason: take
        ? `Avec la retourne, ${fr(best.suit)} vaut ${best.ev.score.toFixed(1)} (seuil ${limit.toFixed(1)}) : ${best.ev.trumps} atout(s), ça vaut le coup de prendre.`
        : `Meilleure couleur : ${fr(best.suit)} à ${best.ev.score.toFixed(1)}, sous le seuil de ${limit.toFixed(1)} : je passe.`,
      options, limit,
    };
  }

  /* ---------- card play ---------- */

  const cheap = trump => (a, b) => (B.points(a, trump) - B.points(b, trump)) || (B.strength(a, trump) - B.strength(b, trump));

  /** ctx: {hand, trick, player, trump, taker, trickNo, played}. Returns {card, reason}. */
  function choosePlay(ctx) {
    const { hand, trick, player, trump, taker, played } = ctx;
    const legal = B.legalInfo(hand, trick, trump, player).cards;
    if (legal.length === 1) return { card: legal[0], reason: 'Une seule carte est permise.' };
    const mine = (player % 2) === (taker % 2);
    const cmp = cheap(trump);
    const isPlayed = (suit, rank) => played.some(c => c.suit === suit && c.rank === rank);
    const trumpsOut = 8 - played.filter(c => c.suit === trump).length - hand.filter(c => c.suit === trump).length;

    if (!trick.length) {
      const myTrumps = hand.filter(c => c.suit === trump).sort((a, b) => B.strength(b, trump) - B.strength(a, trump));
      const jack = myTrumps.find(c => c.rank === 11);
      const nine = myTrumps.find(c => c.rank === 9);
      if (mine && trumpsOut > 0) {
        if (jack) return { card: jack, reason: 'Vous avez le valet d\'atout : jouez-le pour faire tomber les atouts adverses.' };
        if (nine && isPlayed(trump, 11)) return { card: nine, reason: 'Le valet d\'atout est tombé : votre 9 est maintenant le maître atout.' };
        if (myTrumps.length >= 3) return { card: myTrumps[myTrumps.length - 1], reason: 'Vous avez beaucoup d\'atouts : jouez-en un petit pour épuiser ceux des adversaires.' };
      }
      const plain = hand.filter(c => c.suit !== trump);
      const masters = plain.filter(c => c.rank === 14 || (c.rank === 10 && isPlayed(c.suit, 14)));
      if (masters.length) {
        const m = masters.sort((a, b) => B.points(b, trump) - B.points(a, trump))[0];
        return { card: m, reason: `${m.name} est maître de sa couleur : un pli sûr.` };
      }
      if (plain.length) {
        const lens = {}; plain.forEach(c => { lens[c.suit] = (lens[c.suit] || 0) + 1; });
        const pick = plain.slice().sort((a, b) => (lens[a.suit] - lens[b.suit]) || cmp(a, b))[0];
        return { card: pick, reason: 'Aucun pli sûr : entamez une petite carte de votre couleur la plus courte.' };
      }
      return { card: myTrumps[myTrumps.length - 1], reason: 'Il ne vous reste que des atouts : jouez le plus petit.' };
    }

    const wi = B.trickWinnerIndex(trick, trump);
    const wp = trick[wi].player; const wc = trick[wi].card;
    const partnerWinning = wp === (player + 2) % 4;
    const last = trick.length === 3;
    const safe = last || (wc.suit === trump ? (wc.rank === 11 || (wc.rank === 9 && isPlayed(trump, 11))) : (wc.rank === 14 && trumpsOut === 0));
    if (partnerWinning) {
      if (safe) {
        const feed = legal.slice().sort((a, b) => B.points(b, trump) - B.points(a, trump) || cmp(a, b))[0];
        return { card: feed, reason: `Votre partenaire est sûr de gagner le pli : chargez-le avec votre carte la plus riche (${feed.name}).` };
      }
      return { card: legal.slice().sort(cmp)[0], reason: 'Votre partenaire gagne pour l\'instant : jouez petit et gardez vos bonnes cartes.' };
    }
    const winners = legal.filter(c => B.trickWinnerIndex(trick.concat({ player, card: c }), trump) === trick.length)
      .sort((a, b) => B.strength(a, trump) - B.strength(b, trump));
    const trickPts = B.sumPoints(trick.map(p => p.card), trump);
    if (winners.length) {
      const w = winners[0];
      const wasteTrump = w.suit === trump && trick[0].card.suit !== trump && trickPts < 2 && legal.some(c => c.suit !== trump);
      if (!wasteTrump) return { card: w, reason: `Un adversaire gagne (${trickPts} point(s) sur la table) : ${w.name} est la carte la moins chère qui prend le pli.` };
    }
    const dump = legal.slice().sort((a, b) => ((a.suit === trump) - (b.suit === trump)) || cmp(a, b))[0];
    return { card: dump, reason: 'Vous ne pouvez pas gagner ce pli : donnez votre carte la moins précieuse.' };
  }

  B.Bots = { evaluateTrump, chooseBid, choosePlay, THRESHOLD };
})(window.Belote = window.Belote || {});
