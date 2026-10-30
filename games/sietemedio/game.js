/* El Siete y medio: values, win-chance maths, game state. No DOM. */
(function (S) {
  'use strict';

  const value = c => (c.rank >= 10 ? 0.5 : c.rank);   // 1-7 as printed, figures (sota, caballo, rey) = 0.5
  const total = cards => cards.reduce((s, c) => s + value(c), 0);
  const MAX = 7.5;
  const isNatural = cards => cards.length === 2 && total(cards) === MAX; // "siete y medio real"

  /* ---- maths (infinite-deck approximation, values in half points) ---- */
  const HMAX = 15;                                       // 7.5 in halves
  const PROB = (() => { const p = {}; p[1] = 12 / 40; for (let n = 1; n <= 7; n++) p[2 * n] = 4 / 40; return p; })();
  const bustProb = h => Object.entries(PROB).reduce((s, [v, p]) => (h + +v > HMAX ? s + p : s), 0);
  const drawVal = rnd => { let r = (rnd || Math.random)(); for (const [v, p] of Object.entries(PROB)) { r -= p; if (r <= 0) return +v; } return 14; };

  /* ---- game ---- */
  class SieteMedio {
    constructor(opts) {
      opts = opts || {};
      this.n = opts.players || 4;
      this.names = opts.names || ['You', 'Ana', 'Bruno', 'Carla'].slice(0, this.n);
      this.target = opts.target || 12;
      this.scores = Array(this.n).fill(0);
      this.bank = opts.bank == null ? 1 : opts.bank;
      this.limits = [11, 11, 10, 12].slice(0, this.n); // where each bot stands (in halves): 5½, 5½, 5, 6
      this.round = 0;
      this.winner = null;
      this.newRound(true);
    }

    newRound(first) {
      this.round++;
      if (!first) this.bank = (this.bank + 1) % this.n;
      this.deck = S.shuffle(S.DECK.slice());
      this.hands = Array.from({ length: this.n }, () => [this.deck.pop()]);
      this.order = [];
      for (let k = 1; k <= this.n; k++) this.order.push((this.bank + k) % this.n); // players first, the bank last
      this.idx = 0;
      this.state = Array(this.n).fill('playing'); // 'playing' | 'stand' | 'bust'
      this.phase = 'play';
      this.result = null;
    }

    get turn() { return this.phase === 'play' ? this.order[this.idx] : null; }
    total(p) { return total(this.hands[p]); }

    hit(p) {
      this.check(p);
      this.hands[p].push(this.deck.pop());
      if (this.total(p) > MAX) { this.state[p] = 'bust'; this.advance(); }
      else if (this.total(p) === MAX) { this.state[p] = 'stand'; this.advance(); } // nothing better than 7.5
    }
    stand(p) { this.check(p); this.state[p] = 'stand'; this.advance(); }
    check(p) { if (this.phase !== 'play' || this.turn !== p) throw new Error('Not your turn'); }

    advance() {
      this.idx++;
      if (this.idx >= this.order.length) this.resolve();
    }

    /** Number of players (not the bank) still alive. */
    survivors() { return this.order.filter(p => p !== this.bank && this.state[p] !== 'bust').length; }

    resolve() {
      const b = this.bank;
      const bt = this.total(b); const bBust = this.state[b] === 'bust'; const bNat = isNatural(this.hands[b]);
      const duels = [];
      this.order.filter(p => p !== b).forEach(p => {
        const pt = this.total(p); const pBust = this.state[p] === 'bust'; const pNat = isNatural(this.hands[p]);
        let playerWins;
        if (pBust) playerWins = false;
        else if (bBust) playerWins = true;
        else if (pt > bt) playerWins = true;
        else if (pt === bt && pt === MAX && pNat && !bNat) playerWins = true;
        else playerWins = false;
        const winner = playerWins ? p : b;
        const natural = playerWins ? pNat : (!bBust && bNat);
        const points = natural ? 2 : 1;
        this.scores[winner] += points;
        duels.push({ player: p, total: pt, bust: pBust, natural: pNat, winner, points });
      });
      this.result = { bank: b, bankTotal: bt, bankBust: bBust, bankNatural: bNat, duels };
      const best = Math.max(...this.scores);
      if (best >= this.target && this.scores.filter(s => s === best).length === 1) { this.phase = 'gameover'; this.winner = this.scores.indexOf(best); } else this.phase = 'roundover';
    }

    nextRound() { this.newRound(false); }
  }

  Object.assign(S, {
    SieteMedio, smValue: value, smTotal: total, smNatural: isNatural, smMax: MAX,
    SM: { PROB, HMAX, bustProb, drawVal },
  });
})(window.Spanish = window.Spanish || {});
