/* El Cinquillo (classic: you may only pass when you cannot play, and passing is free). 3-4 players. No DOM. */
(function (S) {
  'use strict';

  const SEQ = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]; // the order of a suit; the 5 (index 4) opens it
  const idx = c => SEQ.indexOf(c.rank);
  const OPEN = 4;

  /** table: {O:{lo,hi}|null, ...}. Cards playable from `hand`. */
  function legalCards(hand, table, first) {
    if (first) return hand.filter(c => c.id === 'O5');
    return hand.filter(c => {
      const t = table[c.suit];
      if (!t) return idx(c) === OPEN;
      return idx(c) === t.hi + 1 || idx(c) === t.lo - 1;
    });
  }

  class Cinquillo {
    constructor(opts) {
      opts = opts || {};
      this.n = opts.players || 4;
      this.names = opts.names || ['You', 'Ana', 'Bruno', 'Carla'].slice(0, this.n);
      this.target = opts.target || 30;
      this.scores = Array(this.n).fill(0);
      this.round = 0;
      this.winner = null;
      this.newRound();
    }

    newRound() {
      this.round++;
      const deck = S.shuffle(S.DECK.slice());
      this.hands = Array.from({ length: this.n }, () => []);
      deck.forEach((c, i) => { this.hands[i % this.n].push(c); });
      this.hands = this.hands.map(S.sortCards);
      this.table = { O: null, C: null, E: null, B: null };
      this.first = true;
      this.turn = this.hands.findIndex(h => h.some(c => c.id === 'O5'));
      this.phase = 'play';
      this.result = null;
      this.passes = 0;
      this.history = [];
    }

    legal(p) { return legalCards(this.hands[p], this.table, this.first); }
    onTable(c) { const t = this.table[c.suit]; return !!t && idx(c) >= t.lo && idx(c) <= t.hi; }
    next(p) { return (p + 1) % this.n; }

    play(p, card) {
      if (this.phase !== 'play' || this.turn !== p) throw new Error('Not your turn');
      if (!this.legal(p).includes(card)) throw new Error('That card cannot be played now');
      this.hands[p] = this.hands[p].filter(c => c !== card);
      const t = this.table[card.suit];
      if (!t) this.table[card.suit] = { lo: idx(card), hi: idx(card) };
      else if (idx(card) > t.hi) t.hi = idx(card); else t.lo = idx(card);
      this.first = false;
      this.history.push({ player: p, card });
      if (!this.hands[p].length) { this.endRound(p); return; }
      this.turn = this.next(p);
    }

    pass(p) {
      if (this.phase !== 'play' || this.turn !== p) throw new Error('Not your turn');
      if (this.legal(p).length) throw new Error('You must play a card when you can');
      this.history.push({ player: p, pass: true });
      this.turn = this.next(p);
    }

    endRound(w) {
      const left = this.hands.map(h => h.length);
      const gained = left.reduce((s, n, i) => (i === w ? s : s + n), 0);
      this.scores[w] += gained;
      this.result = { winner: w, left, gained };
      this.turn = null;
      if (this.scores[w] >= this.target) { this.phase = 'gameover'; this.winner = w; } else this.phase = 'roundover';
    }

    nextRound() { this.newRound(); }
  }

  S.Cinquillo = Cinquillo;
  S.cinquilloLegal = legalCards;
  S.CINQ_SEQ = SEQ;
  S.cinqIdx = idx;
})(window.Spanish = window.Spanish || {});
