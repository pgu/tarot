/* El Mus AI and coach: mus/corte decision, discard, and bets from Monte Carlo win chances. */
(function (S) {
  'use strict';
  const mr = S.musRank;
  const pct = x => Math.round(x * 100) + '%';

  function features(h) {
    const pa = S.pares(h);
    const sum = S.juegoSum(h);
    return {
      reyes: h.filter(c => mr(c) === 12).length, ases: h.filter(c => mr(c) === 1).length,
      pares: pa, sum, juego: sum >= 31,
    };
  }

  /** Cut ("no hay mus") or ask for mus? */
  function musDecision(game, p, opts) {
    const rnd = (opts && opts.deterministic) ? () => 0.5 : Math.random;
    const h = game.hands[p];
    const f = features(h);
    const strong = f.pares.type >= 2 || f.sum === 31 || f.reyes >= 3 || (f.reyes >= 2 && f.pares.type >= 1) || f.sum === 32;
    const decent = f.pares.type >= 1 && f.reyes >= 2;
    const late = game.musRounds >= 3 && (decent || f.reyes >= 2 || f.pares.type >= 1) && rnd() < 0.6;
    if (strong || late) {
      return { mus: false, reason: f.pares.type >= 2 ? `You hold ${f.pares.label}: a hand worth playing as it is.` : f.sum === 31 ? 'Exactly 31 is the best juego: no need to change cards.' : f.reyes >= 3 ? 'Three or more reyes make a strong grande.' : 'Good enough to play as it is.' };
    }
    return { mus: true, reason: 'Nothing special yet: ask for mus to improve your cards.' };
  }

  /** Which cards to throw away when everybody says mus. */
  function chooseDiscard(game, p) {
    const h = game.hands[p];
    const count = {};
    h.forEach(c => { count[mr(c)] = (count[mr(c)] || 0) + 1; });
    let keep = h.filter(c => mr(c) === 12 || count[mr(c)] >= 2);
    let why;
    if (!keep.length) {
      const best = h.slice().sort((a, b) => S.musPower(b) - S.musPower(a))[0];
      keep = [best];
      why = `Keep your best card (${best.text}) and swap the rest.`;
    } else {
      why = 'Keep reyes and pairs; swap the cards that do not combine.';
    }
    const sum = S.juegoSum(h);
    if (sum === 31 || sum === 32) return { discard: [], reason: `${sum} is a very good juego: keep everything.` };
    return { discard: h.filter(c => !keep.includes(c)), reason: why };
  }

  /** Probability that the couple of seat p wins the current lance (hidden hands sampled consistently with what was declared). */
  function teamWinProb(game, p, iters, rnd) {
    const L = game.lance;
    rnd = rnd || Math.random;
    const own = new Set(game.hands[p].map(c => c.id));
    const pool = S.DECK.filter(c => !own.has(c.id));
    const others = [0, 1, 2, 3].filter(q => q !== p);
    const consistent = (q, hand) => {
      if (L.name === 'pares') return (S.pares(hand).type > 0) === !!L.declared[q];
      if (L.name === 'juego') return S.hasJuego(hand) === !!L.declared[q];
      return true;
    };
    let wins = 0; let done = 0;
    for (let it = 0; it < iters; it++) {
      const bag = pool.slice();
      const hands = [];
      hands[p] = game.hands[p];
      let ok = true;
      for (const q of others) {
        let h = null;
        for (let t = 0; t < 25 && !h; t++) {
          for (let i = 0; i < 4; i++) { const j = i + Math.floor(rnd() * (bag.length - i)); const x = bag[i]; bag[i] = bag[j]; bag[j] = x; }
          const cand = bag.slice(0, 4);
          if (consistent(q, cand)) h = cand;
        }
        if (!h) { ok = false; break; }
        hands[q] = h;
        bag.splice(0, 4);
      }
      if (!ok) continue;
      done++;
      const w = S.lanceWinner(L.kind, hands, L.participants);
      if (w % 2 === p % 2) wins++;
    }
    return done ? wins / done : 0.5;
  }

  /** Choose a bet action. Returns {type, amount?, reason, prob}. */
  function lanceAction(game, p, opts) {
    opts = opts || {};
    const rnd = opts.deterministic ? () => 0.5 : Math.random;
    const L = game.lance;
    const prob = teamWinProb(game, p, opts.iters || 220);
    const info = `win chance ≈ ${pct(prob)}`;
    if (L.stage === 'open') {
      const theirs = game.scores[1 - p % 2];
      if (prob >= 0.96 && rnd() < 0.2 && L.kind !== 'chica') return { type: 'ordago', reason: `${info}: an almost sure winner, go for the órdago!`, prob };
      if (prob >= 0.88) return { type: 'envido', amount: 5, reason: `${info}: very strong, envido 5.`, prob };
      if (prob >= 0.68) return { type: 'envido', amount: 2, reason: `${info}: a good hand, envido 2.`, prob };
      if (prob >= 0.52 && rnd() < 0.2 && theirs < 34) return { type: 'envido', amount: 2, reason: `${info}: a small bluff to win the lance.`, prob };
      return { type: 'paso', reason: `${info}: not enough to bet, paso.`, prob };
    }
    const B = L.bet;
    if (B.ordago) {
      return prob >= 0.8 ? { type: 'quiero', reason: `${info}: strong enough to accept the órdago.`, prob } : { type: 'no', reason: `${info}: too risky to accept the órdago.`, prob };
    }
    if (prob >= 0.9 && B.amount <= 5 && rnd() < 0.7) return { type: 'subo', amount: rnd() < 0.5 ? 5 : 2, reason: `${info}: very strong, raise.`, prob };
    const need = 0.42 + 0.015 * B.amount;
    if (prob >= need) return { type: 'quiero', reason: `${info} (needed ${pct(need)} for a bet of ${B.amount}): quiero.`, prob };
    return { type: 'no', reason: `${info} (needed ${pct(need)} for a bet of ${B.amount}): no quiero.`, prob };
  }

  S.MusBots = { features, musDecision, chooseDiscard, teamWinProb, lanceAction, pct };
})(window.Spanish = window.Spanish || {});
