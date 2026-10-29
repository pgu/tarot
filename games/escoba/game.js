/* La Escoba (de 15), 2 players. Rules + game state, no DOM. */
(function (S) {
  'use strict';

  const TARGET_SUM = 15;
  /** Escoba values: 1-7 as printed, Sota 8, Caballo 9, Rey 10. */
  const value = c => (c.rank >= 10 ? c.rank - 2 : c.rank);

  /** All subsets of `table` that add up to 15 together with `card`. */
  function findCaptures(card, table) {
    const need = TARGET_SUM - value(card);
    const out = [];
    const n = table.length;
    for (let mask = 1; mask < (1 << n); mask++) {
      let sum = 0;
      const subset = [];
      for (let i = 0; i < n; i++) if (mask & (1 << i)) { sum += value(table[i]); subset.push(table[i]); }
      if (sum === need) out.push(subset);
    }
    return out;
  }

  /** Points for each category given both piles. Returns {categories:[...], points:[p0,p1]}. */
  function scorePiles(piles, escobas) {
    const count = (pile, f) => pile.filter(f).length;
    const pts = [0, 0];
    const cats = [];
    const cmp = (name, a, b, note) => {
      let w = -1;
      if (a > b) w = 0; else if (b > a) w = 1;
      if (w >= 0) pts[w]++;
      cats.push({ name, values: [a, b], winner: w, note });
    };
    cmp('Cartas (most cards)', piles[0].length, piles[1].length);
    cmp('Oros (most coins)', count(piles[0], c => c.suit === 'O'), count(piles[1], c => c.suit === 'O'));
    let s = [count(piles[0], c => c.rank === 7), count(piles[1], c => c.rank === 7)];
    let note;
    if (s[0] === s[1]) { s = [count(piles[0], c => c.rank === 6), count(piles[1], c => c.rank === 6)]; note = 'sevens tied: sixes decide'; }
    cmp('Sietes (most sevens)', s[0], s[1], note);
    const velo = piles.map(p => (p.some(c => c.id === 'O7') ? 1 : 0));
    cmp('Velo (7 de Oros)', velo[0], velo[1]);
    cats.push({ name: 'Escobas (sweeps)', values: escobas.slice(), winner: -1, each: true });
    pts[0] += escobas[0]; pts[1] += escobas[1];
    return { categories: cats, points: pts };
  }

  class Escoba {
    constructor(opts) {
      opts = opts || {};
      this.target = opts.target || 15;
      this.names = opts.names || ['You', 'Bot'];
      this.scores = [0, 0];
      this.dealer = opts.dealer == null ? 1 : opts.dealer;
      this.newRound();
    }

    newRound() {
      this.deck = S.shuffle(S.DECK.slice());
      this.hands = [[], []];
      this.piles = [[], []];
      this.escobas = [0, 0];
      this.table = this.deck.splice(0, 4);
      this.lastCapturer = null;
      this.history = [];
      this.roundResult = null;
      this.phase = 'play';
      this.turn = (this.dealer + 1) % 2;
      this.dealHands();
    }

    dealHands() {
      for (let k = 0; k < 3; k++) for (let p = 0; p < 2; p++) this.hands[p].push(this.deck.pop());
      this.hands = this.hands.map(S.sortCards);
    }

    capturesFor(player, card) { return findCaptures(card, this.table); }

    /** Play `card`; `capture` is the array of table cards taken, or null to drop. */
    play(player, card, capture) {
      if (this.phase !== 'play' || this.turn !== player) throw new Error('Not your turn');
      if (!this.hands[player].includes(card)) throw new Error('Card not in hand');
      const options = findCaptures(card, this.table);
      let escoba = false;
      let taken = [];
      if (options.length) {
        if (!capture) throw new Error('You must capture when you can');
        const ok = options.some(o => o.length === capture.length && o.every(c => capture.includes(c)));
        if (!ok) throw new Error('Those cards do not add up to 15');
        taken = capture;
      } else if (capture && capture.length) throw new Error('Those cards do not add up to 15');

      this.hands[player] = this.hands[player].filter(c => c !== card);
      if (taken.length) {
        this.table = this.table.filter(c => !taken.includes(c));
        this.piles[player].push(card, ...taken);
        this.lastCapturer = player;
        const lastPlay = this.hands[0].length === 0 && this.hands[1].length === 0 && this.deck.length === 0;
        if (this.table.length === 0 && !lastPlay) { escoba = true; this.escobas[player]++; }
      } else {
        this.table.push(card);
      }
      const ev = { player, card, taken, escoba };
      this.history.push(ev);

      if (this.hands[0].length === 0 && this.hands[1].length === 0) {
        if (this.deck.length) { this.dealHands(); this.turn = (this.dealer + 1) % 2; ev.dealt = true; }
        else this.endRound();
      } else this.turn = 1 - player;
      return ev;
    }

    endRound() {
      if (this.table.length && this.lastCapturer != null) {
        this.piles[this.lastCapturer].push(...this.table);
        this.leftover = { to: this.lastCapturer, cards: this.table };
        this.table = [];
      }
      const res = scorePiles(this.piles, this.escobas);
      this.scores[0] += res.points[0];
      this.scores[1] += res.points[1];
      this.roundResult = res;
      const best = Math.max(...this.scores);
      this.phase = best >= this.target && this.scores[0] !== this.scores[1] ? 'gameover' : 'roundover';
    }

    nextRound() {
      this.dealer = 1 - this.dealer;
      this.newRound();
    }

    /** Cards nobody can see from `player`'s point of view: not in their hand, on the table or in any pile. */
    unseen(player) {
      const seen = new Set(this.hands[player].concat(this.table, this.piles[0], this.piles[1]).map(c => c.id));
      return S.DECK.filter(c => !seen.has(c.id));
    }
  }

  S.Escoba = Escoba;
  S.escobaValue = value;
  S.findCaptures = findCaptures;
  S.scorePiles = scorePiles;
})(window.Spanish = window.Spanish || {});
