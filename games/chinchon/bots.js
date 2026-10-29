/* Chinchón AI + coaching. */
(function (S) {
  'use strict';
  const pts = S.chinchonPoints;
  const points = pts;
  const seq = S.chinchonSeqIdx;

  /** How many of the other cards could combine with `c` soon (pair of same rank / near neighbour of same suit). */
  function potential(card, others) {
    let p = 0;
    others.forEach(o => {
      if (o === card) return;
      if (o.rank === card.rank) p += 1;
      else if (o.suit === card.suit && Math.abs(seq(o) - seq(card)) === 1) p += 1;
      else if (o.suit === card.suit && Math.abs(seq(o) - seq(card)) === 2) p += 0.5;
    });
    return p;
  }

  /**
   * Best card to throw from an 8-card hand: fewest unmatched points first, then keep the cards that can still
   * become combinations. `shake` (default 15%) is the chance to break a pair instead: otherwise four passive bots
   * can freeze the same few cards forever.
   */
  function chooseDiscard(hand8, forbidden, shake) {
    const all = S.discardOptions(hand8).filter(o => o.card !== forbidden);
    const min = Math.min(...all.map(o => o.points));
    const rnd = shake == null ? 0.15 : shake;
    let pool = all.filter(o => o.points === min);
    let reason = null;
    if (Math.random() < rnd) {
      pool = all.filter(o => o.points <= min + 4);
      reason = 'Changing plans: keeping options open.';
    }
    let best = null;
    pool.forEach(o => {
      const pot = o.arrangement.deadwood.reduce((sum, c) => sum + potential(c, o.rest), 0);
      const score = reason ? Math.random() : pot * 10 + points(o.card);
      if (!best || score > best.score) best = { ...o, score };
    });
    if (!reason) {
      const dead = best.arrangement.deadwood;
      reason = best.points === 0
        ? `With ${best.card.text} out, all seven cards are in combinations.`
        : `Throwing ${best.card.text} leaves ${best.points} point${best.points > 1 ? 's' : ''} unmatched, the best you can do while keeping useful pairs (${dead.map(c => c.text).join(' ')}).`;
    }
    return { ...best, reason };
  }

  /** Should we take the visible discard instead of drawing from the stock? */
  function wantsDiscard(hand7, top, forbidden) {
    const before = S.bestArrangement(hand7).points;
    const opts = S.discardOptions(hand7.concat(top)).filter(o => o.card !== top);
    const after = Math.min(...opts.map(o => o.points));
    return { take: after < before - 0.01 || (after === 0), before, after,
      reason: after < before ? `Taking ${top.text} lowers your unmatched points from ${before} to ${after}.` : `${top.text} does not improve your hand (${before} unmatched points): draw from the stock.` };
  }

  function decideClose(hand8, rnd) {
    const opts = S.discardOptions(hand8).filter(o => o.canClose);
    if (!opts.length) return null;
    const best = opts[0];
    if (best.points <= 3 || (rnd || Math.random)() < 0.6) return best;
    return null;
  }

  S.ChinchonBots = { chooseDiscard, wantsDiscard, decideClose, potential };
})(window.Spanish = window.Spanish || {});
