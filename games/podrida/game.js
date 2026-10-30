/* La Podrida: 3-5 players, a different number of cards each round, exact-tricks bidding. No DOM. */
(function (S) {
  'use strict';

  // As is the highest card, then Rey, Caballo, Sota, 7 ... 2
  const POWER = { 1: 10, 12: 9, 11: 8, 10: 7, 7: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 };
  const power = c => POWER[c.rank];

  /** Cards per round: 1, 2, ..., max, ..., 2, 1 */
  function schedule(n, maxCards) {
    const cap = Math.min(maxCards, Math.floor(39 / n)); // one card is turned up for the triumph
    const up = []; for (let k = 1; k <= cap; k++) up.push(k);
    return up.concat(up.slice(0, -1).reverse());
  }

  /** Points of a round for one player: exact bid scores 10 + 2 per trick bid, otherwise -2 per trick of difference. */
  const roundPoints = (bid, won) => (bid === won ? 10 + 2 * bid : -2 * Math.abs(bid - won));

  /** Which cards may be played: follow suit; if you cannot, play a triumph if you have one; otherwise anything. */
  function legalCards(hand, trick, triumph) {
    if (!trick.length) return { cards: hand.slice(), rule: 'lead' };
    const lead = trick[0].card.suit;
    const same = hand.filter(c => c.suit === lead);
    if (same.length) return { cards: same, rule: 'follow' };
    const tr = hand.filter(c => c.suit === triumph);
    if (tr.length) return { cards: tr, rule: 'trump' };
    return { cards: hand.slice(), rule: 'free' };
  }

  /** Index in `trick` of the winning card. */
  function trickWinner(trick, triumph) {
    let best = 0;
    for (let i = 1; i < trick.length; i++) {
      const a = trick[best].card; const b = trick[i].card;
      if (b.suit === a.suit ? power(b) > power(a) : b.suit === triumph) best = i;
    }
    return best;
  }

  class Podrida {
    constructor(opts) {
      opts = opts || {};
      this.n = opts.players || 4;
      this.names = opts.names || ['You', 'Ana', 'Bruno', 'Carla', 'Diego'].slice(0, this.n);
      this.rounds = schedule(this.n, opts.maxCards || 5);
      this.roundIdx = -1;
      this.dealer = opts.dealer == null ? this.n - 1 : opts.dealer;
      this.totals = Array(this.n).fill(0);
      this.history = [];
      this.nextRound();
    }

    get cards() { return this.rounds[this.roundIdx]; }

    nextRound() {
      this.roundIdx++;
      this.dealer = (this.dealer + 1) % this.n;
      const k = this.cards;
      const deck = S.shuffle(S.DECK.slice());
      this.hands = Array.from({ length: this.n }, () => []);
      for (let p = 0; p < this.n; p++) this.hands[p] = S.sortCards(deck.splice(0, k));
      this.triumphCard = deck.pop();
      this.triumph = this.triumphCard.suit;
      this.bids = Array(this.n).fill(null);
      this.won = Array(this.n).fill(0);
      this.mano = (this.dealer + 1) % this.n;
      this.bidder = this.mano;
      this.phase = 'bidding';
      this.trick = [];
      this.turn = null;
      this.leader = this.mano;
      this.points = null;
    }

    /** The bid the dealer (last to bid) may not make. */
    forbiddenBid(p) {
      if (p !== this.dealer) return null;
      const sum = this.bids.reduce((s, b) => s + (b == null ? 0 : b), 0);
      const f = this.cards - sum;
      return f >= 0 && f <= this.cards ? f : null;
    }

    bid(p, k) {
      if (this.phase !== 'bidding' || this.bidder !== p) throw new Error('Not your turn to bid');
      if (!Number.isInteger(k) || k < 0 || k > this.cards) throw new Error('Bid out of range');
      if (this.forbiddenBid(p) === k) throw new Error(`The dealer cannot bid ${k}: the bids would add up to the ${this.cards} tricks`);
      this.bids[p] = k;
      if (p === this.dealer) { this.phase = 'play'; this.turn = this.leader; } else this.bidder = (p + 1) % this.n;
    }

    legal(p) { return legalCards(this.hands[p], this.trick, this.triumph); }
    get trickComplete() { return this.trick.length === this.n; }

    play(p, card) {
      if (this.phase !== 'play' || this.turn !== p || this.trickComplete) throw new Error('Not your turn');
      if (!this.hands[p].includes(card)) throw new Error('Card not in hand');
      if (!this.legal(p).cards.includes(card)) throw new Error('Illegal card');
      this.hands[p] = this.hands[p].filter(c => c !== card);
      this.trick.push({ player: p, card });
      this.turn = this.trick.length === this.n ? null : (p + 1) % this.n;
    }

    collectTrick() {
      if (!this.trickComplete) throw new Error('Trick not complete');
      const w = this.trick[trickWinner(this.trick, this.triumph)].player;
      this.won[w]++;
      const rec = { winner: w, cards: this.trick.slice() };
      this.trick = [];
      if (this.hands[0].length === 0) this.endRound();
      else { this.leader = w; this.turn = w; }
      return rec;
    }

    endRound() {
      this.points = this.bids.map((b, p) => roundPoints(b, this.won[p]));
      this.points.forEach((v, p) => { this.totals[p] += v; });
      this.history.push({ cards: this.cards, bids: this.bids.slice(), won: this.won.slice(), points: this.points.slice() });
      this.turn = null;
      this.phase = this.roundIdx === this.rounds.length - 1 ? 'gameover' : 'roundover';
    }

    /** Context for the AI. */
    ctxFor(p) {
      return {
        hand: this.hands[p], trick: this.trick, triumph: this.triumph, cards: this.cards, n: this.n, player: p,
        bid: this.bids[p], won: this.won[p], left: this.hands[p].length, legal: this.legal(p).cards,
      };
    }

    nextRoundStart() { this.nextRound(); }
  }

  Object.assign(S, { Podrida, podridaPower: power, podridaSchedule: schedule, podridaPoints: roundPoints, podridaLegal: legalCards, podridaWinner: trickWinner });
})(window.Spanish = window.Spanish || {});
