/* La Brisca, 2 players, Spanish deck. Uses the card order/points of the Tute (As 11, Tres 10, Rey 4, Caballo 3, Sota 2). No DOM. */
(function (S) {
  'use strict';

  const TRICKS = 20;
  const pts = S.tutePoints;
  const sum = S.tuteSum;

  class Brisca {
    constructor(opts) {
      opts = opts || {};
      this.names = opts.names || ['You', 'Bot'];
      this.matches = [0, 0];
      this.dealer = opts.dealer == null ? 1 : opts.dealer;
      this.newHand();
    }

    newHand() {
      const deck = S.shuffle(S.DECK.slice());
      this.hands = [S.sortCards(deck.splice(0, 3)), S.sortCards(deck.splice(0, 3))];
      this.stock = deck;                 // draw with pop(); stock[0] is the face-up triumph card (drawn last)
      this.pinta = this.stock[0];
      this.triumph = this.pinta.suit;
      this.piles = [[], []];
      this.trick = [];
      this.trickNo = 0;
      this.history = [];
      this.leader = (this.dealer + 1) % 2;
      this.turn = this.leader;
      this.phase = 'play';
      this.result = null;
    }

    get trickComplete() { return this.trick.length === 2; }
    get endgame() { return this.stock.length === 0; }

    /** No obligations in the brisca: any card may be played at any time. */
    play(p, card) {
      if (this.phase !== 'play' || this.turn !== p || this.trickComplete) throw new Error('Not your turn');
      if (!this.hands[p].includes(card)) throw new Error('Card not in hand');
      this.hands[p] = this.hands[p].filter(c => c !== card);
      this.trick.push({ player: p, card });
      this.turn = this.trick.length === 2 ? null : 1 - p;
    }

    collectTrick() {
      if (!this.trickComplete) throw new Error('Trick not complete');
      const [a, b] = this.trick;
      const w = S.tuteWinner(a.card, b.card, this.triumph) === 0 ? a.player : b.player;
      this.piles[w].push(a.card, b.card);
      const rec = { no: this.trickNo, cards: this.trick.slice(), winner: w, points: pts(a.card) + pts(b.card) };
      this.history.push(rec);
      this.trick = [];
      this.trickNo++;
      if (this.stock.length) { // winner draws first
        this.hands[w] = S.sortCards(this.hands[w].concat(this.stock.pop()));
        this.hands[1 - w] = S.sortCards(this.hands[1 - w].concat(this.stock.pop()));
      }
      if (this.trickNo === TRICKS) this.finish();
      else { this.leader = w; this.turn = w; }
      return rec;
    }

    finish() {
      this.phase = 'done';
      this.turn = null;
      const points = [sum(this.piles[0]), sum(this.piles[1])];
      const winner = points[0] > 60 ? 0 : points[1] > 60 ? 1 : null; // 60-60 is a draw
      this.result = { points, winner };
      if (winner != null) this.matches[winner]++;
    }

    nextHand() { this.dealer = 1 - this.dealer; this.newHand(); }

    /** Context for the shared trick-taking AI (see Spanish.TuteBots). */
    ctxFor(p) {
      const seen = new Set();
      this.piles[0].concat(this.piles[1], this.hands[p], this.trick.map(t => t.card)).forEach(c => seen.add(c.id));
      seen.add(this.pinta.id);
      return {
        hand: this.hands[p], legal: this.hands[p], led: this.trick.length ? this.trick[0].card : null,
        triumph: this.triumph, pinta: this.pinta, arrastre: this.endgame, stockLen: this.stock.length, seen,
        sung: S.SUITS.slice(), oppSung: [], singable: [], canSwap: false, canTute: null, trickNo: this.trickNo,
      };
    }
  }

  S.Brisca = Brisca;
})(window.Spanish = window.Spanish || {});
