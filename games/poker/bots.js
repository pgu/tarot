/* Poker AI and the coach's advice (same brain; the coach is deterministic). */
(function (P) {
  'use strict';

  const pct = x => Math.round(x * 100) + '%';
  const roundTo = (x, unit) => Math.round(x / unit) * unit;

  /**
   * Decide what player `i` does. opts: {deterministic, iters}.
   * Returns {type: fold|check|call|raise, to?, reason, info}. `info` carries numbers for the coach UI.
   */
  function decide(game, i, opts) {
    opts = opts || {};
    const rnd = opts.deterministic ? () => 0.5 : Math.random;
    const p = game.players[i];
    const lg = game.legal(i);
    const style = p.style || { loose: 0, aggr: 0 };
    const opps = game.remaining().length - 1;
    const pot = game.pot;
    const bb = game.bb;
    const stackBB = (p.chips + p.bet) / bb;
    const toCall = lg.toCall;
    const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
    const info = { toCall, pot, potOdds };

    let want; // {type, to, reason}
    const raiseTo = x => ({ type: 'raise', to: Math.max(lg.minRaiseTo, Math.min(lg.maxRaiseTo, roundTo(x, game.sb))) });

    if (game.phase === 'preflop') {
      const ch = P.chen(p.hole[0], p.hole[1]);
      const s = ch.score + style.loose;
      info.chen = ch;
      info.strength = s;
      const level = game.currentBet / bb;
      const tag = `${P.holeLabel(p.hole[0], p.hole[1])} scores ${ch.score} on the Chen scale`;
      if (stackBB <= 12 && s >= 8) {
        want = { ...raiseTo(lg.maxRaiseTo), reason: `${tag} and the stack is short: push all-in.` };
      } else if (level <= 1) { // nobody raised yet
        if (s >= 9) want = { ...raiseTo(bb * (3 + (rnd() < 0.3 ? 1 : 0)) ), reason: `${tag}: a strong hand, so raise to build the pot.` };
        else if (toCall === 0) want = { type: 'check', reason: `${tag}: nothing to pay, see the flop for free.` };
        else if (s >= 5) want = { type: 'call', reason: `${tag}: playable, so call the blind.` };
        else want = { type: 'fold', reason: `${tag}: too weak to pay for.` };
      } else {
        const need = level <= 3 ? 7 : level <= 6 ? 9 : level <= 12 ? 11 : 13;
        if (s >= need + 4 && lg.canRaise) {
          want = { ...raiseTo(game.currentBet * 3), reason: `${tag}: much stronger than the raise needs, so re-raise.` };
        } else if (s >= need) want = { type: 'call', reason: `${tag}: good enough to call a raise to ${level.toFixed(1)} big blinds.` };
        else want = { type: 'fold', reason: `${tag}: not enough against a raise to ${level.toFixed(1)} big blinds.` };
      }
    } else {
      const eq = P.equity(p.hole, game.board, opps, opts.iters || 400);
      const e = eq.equity;
      info.equity = e;
      const best = P.bestHand(p.hole.concat(game.board));
      const base = `${best.name}; about ${pct(e)} to win against ${opps} opponent${opps > 1 ? 's' : ''}`;
      if (toCall === 0) {
        if (e >= 0.62 - style.aggr) {
          want = { ...raiseTo(game.currentBet + pot * (0.5 + rnd() * 0.25)), reason: `${base}: bet for value.` };
        } else if (e >= 0.45 && rnd() < 0.35 + style.aggr) {
          want = { ...raiseTo(game.currentBet + pot * 0.33), reason: `${base}: a small bet to take the pot or get information.` };
        } else if (opps <= 2 && rnd() < 0.07 + style.aggr / 2) {
          want = { ...raiseTo(game.currentBet + pot * 0.5), reason: `${base}: a bluff, hoping everybody folds.` };
        } else want = { type: 'check', reason: `${base}: check and see the next card for free.` };
      } else {
        const adj = e * 0.92; // opponents who bet are stronger than random hands
        if (adj >= 0.8 && lg.canRaise && rnd() < 0.6) {
          want = { ...raiseTo(game.currentBet + toCall + pot * 0.75), reason: `${base}: very strong, so raise for value.` };
        } else if (adj >= potOdds + 0.03) {
          want = { type: 'call', reason: `${base} vs ${pct(potOdds)} needed (pot odds): calling is profitable.` };
        } else {
          want = { type: 'fold', reason: `${base} but ${pct(potOdds)} is needed (pot odds): folding saves chips.` };
        }
      }
    }

    // legalise
    if (want.type === 'raise' && !lg.canRaise) want = { type: toCall > 0 ? 'call' : 'check', reason: want.reason };
    if (want.type === 'check' && !lg.canCheck) want = { type: 'fold', reason: want.reason };
    if (want.type === 'call' && toCall === 0) want = { type: 'check', reason: want.reason };
    if (want.type === 'fold' && toCall === 0) want = { type: 'check', reason: want.reason };
    return Object.assign(want, { info });
  }

  /** Name the player's current hand / draw in plain words for the coach. */
  function describe(hole, board) {
    if (!board.length) {
      const ch = P.chen(hole[0], hole[1]);
      return { text: `${P.holeLabel(hole[0], hole[1])}  (Chen score ${ch.score})`, chen: ch };
    }
    const best = P.bestHand(hole.concat(board));
    const draw = P.outsToStraightOrBetter(hole, board);
    let text = best.name;
    if (draw && !draw.made && draw.outs >= 4) text += ` · draw to a straight/flush: ${draw.outs} outs`;
    return { text, best, draw };
  }

  P.Bots = { decide, describe, pct };
  P.STYLES = [{ loose: 0, aggr: 0 }, { loose: 0, aggr: 0.05 }, { loose: 1.5, aggr: 0.12 }, { loose: -1, aggr: -0.04 }];
})(window.Poker = window.Poker || {});

/* Standalone advice for a spot described by numbers (used by the Hand Advisor). */
(function (P) {
  'use strict';
  const pct = P.Bots.pct;
  /** spot: {hole, board, opps, pot, toCall, facing: 'none'|'small'|'big' (preflop only), iters} */
  P.Bots.adviseSpot = function (spot) {
    const { hole, board, opps, pot, toCall } = spot;
    const out = { action: null, reason: '', equity: null, potOdds: toCall > 0 ? toCall / (pot + toCall) : 0 };
    if (!board.length) {
      const ch = P.chen(hole[0], hole[1]);
      const [callAt, raiseAt] = { none: [5, 9], small: [7, 11], big: [9, 13] }[spot.facing || 'none'];
      out.chen = ch;
      out.equity = P.equity(hole, board, opps, spot.iters || 3000).equity;
      if (ch.score >= raiseAt) { out.action = 'Raise'; out.reason = `Chen score ${ch.score} is strong enough to raise${spot.facing && spot.facing !== 'none' ? ' (re-raise)' : ''}.`; }
      else if (ch.score >= callAt) { out.action = toCall > 0 ? 'Call' : 'Call / check'; out.reason = `Chen score ${ch.score} is playable here but not strong enough to raise.`; }
      else { out.action = toCall > 0 ? 'Fold' : 'Check (or fold if it costs chips)'; out.reason = `Chen score ${ch.score} is too weak for this situation.`; }
      return out;
    }
    const eq = P.equity(hole, board, opps, spot.iters || 3000);
    out.equity = eq.equity;
    const base = `About ${pct(eq.equity)} to win against ${opps} random hand${opps > 1 ? 's' : ''}`;
    if (toCall === 0) {
      if (eq.equity >= 0.62) { out.action = 'Bet for value'; out.reason = `${base}: you are likely ahead, so bet about half to three-quarters of the pot.`; }
      else if (eq.equity >= 0.45) { out.action = 'Check or small bet'; out.reason = `${base}: a medium hand. Check, or bet small to take the pot.`; }
      else { out.action = 'Check'; out.reason = `${base}: too weak to bet; see the next card for free.`; }
    } else {
      const adj = eq.equity * 0.92;
      if (adj >= 0.8) { out.action = 'Raise'; out.reason = `${base}: very strong. Raise for value.`; }
      else if (adj >= out.potOdds + 0.03) { out.action = 'Call'; out.reason = `${base}, and you only need ${pct(out.potOdds)} (pot odds): calling pays off.`; }
      else { out.action = 'Fold'; out.reason = `${base}, but you need ${pct(out.potOdds)} (pot odds): fold.`; }
    }
    return out;
  };
})(window.Poker);
