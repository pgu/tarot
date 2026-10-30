/* La Podrida AI and coach: estimate the tricks of a hand, bid, then play to make exactly the bid. */
(function (S) {
  'use strict';
  const power = S.podridaPower;

  const TRUMP_W = { 10: 0.95, 9: 0.85, 8: 0.75, 7: 0.6, 6: 0.5, 5: 0.4, 4: 0.3, 3: 0.22, 2: 0.15, 1: 0.1 };
  const SUIT_W = { 10: 0.7, 9: 0.35, 8: 0.15, 7: 0.05 };

  /** Expected number of tricks of a hand, with the contribution of each card. */
  function estimate(hand, triumph, cards, n) {
    const parts = [];
    let total = 0;
    const scale = n <= 3 ? 1.15 : n >= 5 ? 0.9 : 1;
    hand.forEach(c => {
      const pw = power(c);
      let w = c.suit === triumph ? TRUMP_W[pw] : (SUIT_W[pw] || 0);
      if (c.suit !== triumph && cards >= 6) w *= 0.8; // with many cards, side-suit winners get ruffed more
      w *= scale;
      if (w > 0.12) parts.push({ card: c, w });
      total += w;
    });
    const trumps = hand.filter(c => c.suit === triumph).length;
    if (trumps) {
      const voids = S.SUITS.filter(s => s !== triumph && !hand.some(c => c.suit === s)).length;
      const bonus = Math.min(voids, trumps) * 0.3;
      if (bonus) parts.push({ note: `${voids} void suit(s) let you ruff`, w: bonus });
      total += bonus;
    }
    return { expected: total, parts };
  }

  /** Choose a bid (respecting the dealer's forbidden number). */
  function chooseBid(game, p) {
    const e = estimate(game.hands[p], game.triumph, game.cards, game.n);
    let bid = Math.max(0, Math.min(game.cards, Math.round(e.expected)));
    const forbidden = game.forbiddenBid(p);
    let note = '';
    if (forbidden === bid) {
      bid = e.expected >= bid ? Math.min(game.cards, bid + 1) : Math.max(0, bid - 1);
      if (bid === forbidden) bid = e.expected >= forbidden ? Math.max(0, forbidden - 1) : Math.min(game.cards, forbidden + 1);
      note = ` The dealer may not bid ${forbidden}, so ${bid} it is.`;
    }
    return { bid, expected: e.expected, parts: e.parts, forbidden, reason: `Your cards should win about ${e.expected.toFixed(1)} tricks.${note}` };
  }

  /** Choose a card. ctx from Podrida.ctxFor. */
  function choosePlay(ctx) {
    const { legal, trick, triumph, bid, won, left } = ctx;
    if (legal.length === 1) return { card: legal[0], reason: 'Only one legal card.' };
    const need = bid - won;
    const wantWin = need > 0; // still short of the bid: every trick helps (even if the bid is out of reach)
    const byPower = legal.slice().sort((a, b) => power(a) - power(b));
    const strength = c => power(c) + (c.suit === triumph ? 20 : 0);
    const best = trick.length ? trick[S.podridaWinner(trick, triumph)].card : null;
    const beats = c => !best || (c.suit === best.suit ? power(c) > power(best) : c.suit === triumph);
    const last = trick.length === ctx.n - 1;
    if (wantWin) {
      const winners = legal.filter(beats).sort((a, b) => strength(a) - strength(b));
      if (!trick.length) {
        const top = legal.slice().sort((a, b) => strength(b) - strength(a))[0];
        return { card: top, reason: `You still need ${need} trick${need > 1 ? 's' : ''}: lead your strongest card.` };
      }
      if (winners.length) return { card: winners[0], reason: `You still need ${need} trick${need > 1 ? 's' : ''}: win this one with the cheapest card that can${last ? ' (nobody plays after you)' : ''}.` };
      return { card: byPower.sort((a, b) => strength(a) - strength(b))[0], reason: 'You cannot win this trick: throw your weakest card and keep the good ones.' };
    }
    // bid reached (or bid 0): avoid winning more tricks
    const why = need === 0 ? (bid === 0 ? 'You bid 0: never win a trick.' : 'You have made your bid: now avoid winning more tricks.') : 'You already won more than you bid: avoid winning more.';
    if (!trick.length) {
      const low = legal.slice().sort((a, b) => strength(a) - strength(b))[0];
      return { card: low, reason: `${why} Lead your lowest card.` };
    }
    const losers = legal.filter(c => !beats(c)).sort((a, b) => strength(b) - strength(a));
    if (losers.length) return { card: losers[0], reason: `${why} Play the highest card that does not win the trick, to get rid of it.` };
    return { card: legal.slice().sort((a, b) => strength(a) - strength(b))[0], reason: `${why} Every legal card would win: use the lowest.` };
  }

  S.PodridaBots = { estimate, chooseBid, choosePlay };
  void 0;
})(window.Spanish = window.Spanish || {});
