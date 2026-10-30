/* Siete y medio AI and coach: the classic rules of thumb, with the exact risk of going over. */
(function (S) {
  'use strict';
  const M = S.SM;
  const half = t => Math.round(t * 2);
  const pct = x => Math.round(x * 100) + '%';

  /** Chance that the next card brings the total to exactly 7½. */
  const exactProb = h => (M.PROB[M.HMAX - h] || 0);
  /** Players: hit while the risk is small; each bot has its own limit (5, 5½ or 6). */
  const playerHits = (h, limit) => h < limit;
  /** The bank has to beat the players still in, so it draws more when several are left. */
  const bankHits = (h, m) => (m === 0 ? false : m === 1 ? h < 11 : h < 12);

  /** Decide for player/bank p. Returns {hit, reason, bust, exact}. */
  function decide(game, p) {
    const h = half(game.total(p));
    const bust = M.bustProb(h);
    const exact = exactProb(h);
    if (p === game.bank) {
      const m = game.survivors();
      if (m === 0) return { hit: false, reason: 'Everybody else has gone over 7½: the bank wins without drawing.', bust, exact };
      const hit = bankHits(h, m);
      return {
        hit,
        reason: `With ${h / 2} against ${m} player${m > 1 ? 's' : ''} still in, the bank ${hit ? 'keeps drawing: it must beat them (and wins ties)' : 'stands'}. Risk of going over: ${pct(bust)}.`,
        bust, exact,
      };
    }
    const limit = (game.limits && game.limits[p]) || 11;
    const hit = playerHits(h, limit);
    return {
      hit,
      reason: `With ${h / 2} the risk of going over on the next card is ${pct(bust)}: ${hit ? 'worth the risk, hit' : 'too risky, stand'}.`,
      bust, exact,
    };
  }

  /** Coach advice for the human (limit 5½: the classic rule). */
  function advise(game, p) { return decide(game, p); }

  S.SMBots = { decide, advise, pct, exactProb, playerHits, bankHits };
})(window.Spanish = window.Spanish || {});
