/* Five-card draw AI and coaching: what to keep, how to bet, odds of improving. */
(function (P) {
  'use strict';
  const pct = P.Bots.pct;
  const roundTo = (x, unit) => Math.round(x / unit) * unit;

  /** Chance that `hole` (5 cards) beats `opps` random 5-card hands. */
  function equityFive(hole, opps, iters, rng) {
    rng = rng || Math.random;
    iters = iters || 800;
    const known = new Set(hole.map(c => c.id));
    const rest = P.DECK.filter(c => !known.has(c.id));
    const mine = P.evaluate5(hole);
    const need = opps * 5;
    let score = 0;
    for (let it = 0; it < iters; it++) {
      for (let i = 0; i < need; i++) {
        const j = i + Math.floor(rng() * (rest.length - i));
        const t = rest[i]; rest[i] = rest[j]; rest[j] = t;
      }
      let best = -1; let ties = 0;
      for (let o = 0; o < opps; o++) {
        const v = P.evaluate5(rest.slice(o * 5, o * 5 + 5));
        if (v > best) { best = v; ties = 1; } else if (v === best) ties++;
      }
      if (mine > best) score++; else if (mine === best) score += 1 / (ties + 1);
    }
    return score / iters;
  }

  /** Distribution (by category) of the final hand if you keep `keepIdx` and draw the rest. */
  function drawOdds(hand, keepIdx, iters, rng) {
    rng = rng || Math.random;
    iters = iters || 3000;
    const known = new Set(hand.map(c => c.id));
    const rest = P.DECK.filter(c => !known.has(c.id));
    const kept = keepIdx.map(k => hand[k]);
    const n = 5 - kept.length;
    const counts = Array(9).fill(0);
    for (let it = 0; it < iters; it++) {
      for (let i = 0; i < n; i++) {
        const j = i + Math.floor(rng() * (rest.length - i));
        const t = rest[i]; rest[i] = rest[j]; rest[j] = t;
      }
      counts[P.categoryOf(P.evaluate5(kept.concat(rest.slice(0, n))))]++;
    }
    return counts.map(c => c / iters);
  }

  /** Which cards to keep. Returns {keep:[idx], discard:[idx], reason}. */
  function chooseDiscards(hand) {
    const all = [0, 1, 2, 3, 4];
    const cat = P.categoryOf(P.evaluate5(hand));
    const name = P.bestHand(hand).name;
    const byRank = {};
    hand.forEach((c, i) => { (byRank[c.rank] = byRank[c.rank] || []).push(i); });
    const done = (keep, reason) => ({ keep, discard: all.filter(i => !keep.includes(i)), reason });

    if (cat >= 4) return done(all, `${name}: already a made hand. Stand pat (swap nothing).`);
    const groups = Object.values(byRank).sort((a, b) => b.length - a.length);
    if (cat === 3) return done(groups[0], 'Three of a kind: keep the three, swap the other two hoping for a fourth or a full house.');
    if (cat === 2) return done(groups[0].concat(groups[1]), 'Two pair: keep both pairs and swap the odd card (one chance in 11 to make a full house).');
    if (cat === 1) return done(groups[0], 'One pair: keep the pair and swap the other three cards.');

    const suitIdx = {};
    hand.forEach((c, i) => { (suitIdx[c.suit] = suitIdx[c.suit] || []).push(i); });
    const four = Object.values(suitIdx).find(a => a.length === 4);
    if (four) return done(four, 'Four cards to a flush: keep them and swap one (9 of 47 cards complete the flush).');

    const has = r => hand.findIndex(c => c.rank === r || (r === 1 && c.rank === 14));
    for (let r = 2; r <= 10; r++) {
      const idx = [r, r + 1, r + 2, r + 3].map(has);
      if (idx.every(k => k >= 0)) return done(idx, 'Four cards in a row with both ends open: keep them and swap one (8 outs to a straight).');
    }
    const sorted = all.slice().sort((a, b) => hand[b].rank - hand[a].rank);
    return done(sorted.slice(0, 2), 'Nothing yet: keep your two highest cards and swap three. A pair of them would beat most hands.');
  }

  /** Strength tier before the draw. */
  function preTier(hand) {
    const cat = P.categoryOf(P.evaluate5(hand));
    if (cat >= 3) return { tier: 3, label: 'a very strong hand' };
    if (cat === 2) return { tier: 3, label: 'two pair' };
    if (cat === 1) {
      const rank = P.decode(P.evaluate5(hand)).ranks[0];
      return rank >= 11 ? { tier: 2, label: 'a good pair' } : { tier: 1, label: 'a low pair' };
    }
    const d = chooseDiscards(hand);
    if (d.keep.length === 4) return { tier: 1, label: 'a four-card draw' };
    return { tier: 0, label: 'a weak hand' };
  }

  function decide(game, i, opts) {
    opts = opts || {};
    const rnd = opts.deterministic ? () => 0.5 : Math.random;
    const p = game.players[i];
    const lg = game.legal(i);
    const style = p.style || { loose: 0, aggr: 0 };
    const opps = game.remaining().length - 1;
    const pot = game.pot;
    const bb = game.bb;
    const toCall = lg.toCall;
    const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
    const raiseTo = x => ({ type: 'raise', to: Math.max(lg.minRaiseTo, Math.min(lg.maxRaiseTo, roundTo(x, game.sb))) });
    const info = { toCall, pot, potOdds };
    let want;

    if (game.phase === 'predraw') {
      const t = preTier(p.hole);
      const tier = t.tier + (style.loose > 1 ? 0.5 : style.loose < 0 ? -0.5 : 0);
      info.tier = t;
      const level = game.currentBet / bb;
      const tag = `You hold ${t.label}`;
      const myTag = `${p.name} has ${t.label}`;
      const why = s => `${opts.coach ? tag : myTag}: ${s}`;
      if (level <= 1) {
        if (tier >= 2) want = { ...raiseTo(bb * 3), reason: why('open with a raise.') };
        else if (toCall === 0) want = { type: 'check', reason: why('nothing to pay, take the draw for free.') };
        else if (tier >= 1) want = { type: 'call', reason: why('worth calling the blind to draw.') };
        else want = { type: 'fold', reason: why('too weak to pay for.') };
      } else {
        const need = level <= 3 ? 1 : level <= 6 ? 2 : 3;
        if (tier >= 3 && lg.canRaise) want = { ...raiseTo(game.currentBet * 3), reason: why('strong enough to re-raise.') };
        else if (tier >= need) want = { type: 'call', reason: why(`good enough to call a raise to ${level.toFixed(1)} big blinds.`) };
        else want = { type: 'fold', reason: why(`not enough against a raise to ${level.toFixed(1)} big blinds.`) };
      }
    } else {
      const best = P.bestHand(p.hole);
      let e = equityFive(p.hole, opps, opts.iters || 500);
      // Players who kept all five cards ("stood pat") usually have a made hand.
      const pat = game.remaining().filter(q => q.id !== i && game.drawn[q.id] === 0).length;
      if (pat) e *= Math.pow(0.85, pat);
      info.equity = e; info.pat = pat;
      const base = `${best.name}; roughly ${pct(e)} to win${pat ? ` (lowered because ${pat} opponent${pat > 1 ? 's' : ''} stood pat)` : ''}`;
      if (toCall === 0) {
        if (e >= 0.62 - style.aggr) want = { ...raiseTo(pot * (0.5 + rnd() * 0.25)), reason: `${base}: bet for value.` };
        else if (e >= 0.45 && rnd() < 0.3 + style.aggr) want = { ...raiseTo(pot * 0.33), reason: `${base}: a small bet to take the pot.` };
        else if (opps <= 2 && rnd() < 0.06 + style.aggr / 2) want = { ...raiseTo(pot * 0.5), reason: `${base}: a bluff.` };
        else want = { type: 'check', reason: `${base}: check.` };
      } else {
        const adj = e * 0.92;
        if (adj >= 0.8 && lg.canRaise && rnd() < 0.6) want = { ...raiseTo(game.currentBet + toCall + pot * 0.75), reason: `${base}: very strong, raise.` };
        else if (adj >= potOdds + 0.03) want = { type: 'call', reason: `${base} vs ${pct(potOdds)} needed (pot odds): call.` };
        else want = { type: 'fold', reason: `${base} but ${pct(potOdds)} is needed (pot odds): fold.` };
      }
    }
    if (want.type === 'raise' && !lg.canRaise) want = { type: toCall > 0 ? 'call' : 'check', reason: want.reason };
    if (want.type === 'check' && !lg.canCheck) want = { type: 'fold', reason: want.reason };
    if (want.type === 'call' && toCall === 0) want = { type: 'check', reason: want.reason };
    if (want.type === 'fold' && toCall === 0) want = { type: 'check', reason: want.reason };
    return Object.assign(want, { info });
  }

  P.DrawBots = { equityFive, drawOdds, chooseDiscards, preTier, decide };
})(window.Poker = window.Poker || {});

/* Percentile scoring: how much of the field does a final hand beat? */
(function (P) {
  'use strict';
  let table = null;
  function build() {
    const vals = [];
    for (let i = 0; i < 20000; i++) vals.push(P.evaluate5(P.shuffle(P.DECK.slice()).slice(0, 5)));
    table = vals.sort((a, b) => a - b);
  }
  /** Fraction (0..1) of random 5-card hands that this value beats. */
  function percentile(v) {
    if (!table) build();
    let lo = 0; let hi = table.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (table[m] < v) lo = m + 1; else hi = m; }
    return lo / table.length;
  }
  /** Average percentile of the final hand if you keep `keepIdx` and draw the others. */
  function keepScore(hand, keepIdx, iters) {
    iters = iters || 1500;
    const known = new Set(hand.map(c => c.id));
    const rest = P.DECK.filter(c => !known.has(c.id));
    const kept = keepIdx.map(k => hand[k]);
    const n = 5 - kept.length;
    let sum = 0;
    for (let it = 0; it < iters; it++) {
      for (let i = 0; i < n; i++) {
        const j = i + Math.floor(Math.random() * (rest.length - i));
        const t = rest[i]; rest[i] = rest[j]; rest[j] = t;
      }
      sum += percentile(P.evaluate5(kept.concat(rest.slice(0, n))));
    }
    return sum / iters;
  }
  P.DrawBots.percentile = percentile;
  P.DrawBots.keepScore = keepScore;
})(window.Poker);
