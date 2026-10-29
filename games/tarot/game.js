/* Game state machine for one deal (4 players, 18 cards each, 6-card dog). No DOM here. */
(function (T) {
  'use strict';

  const SEAT_NAMES = ['You', 'East', 'North', 'West'];
  const TOTAL_TRICKS = 18;

  class Game {
    constructor(opts) {
      opts = opts || {};
      this.dealer = opts.dealer == null ? 3 : opts.dealer;
      this.aggr = opts.aggr || [0, 1, 0, -1];
      this.newDeal();
    }

    newDeal() {
      const deck = T.shuffle(T.DECK.slice());
      this.hands = [0, 1, 2, 3].map(i => T.sortHand(deck.slice(i * 18, i * 18 + 18)));
      this.dog = T.sortHand(deck.slice(72));
      this.phase = 'bidding';
      this.bids = [];
      this.bidder = (this.dealer + 1) % 4;
      this.highest = null;
      this.taker = null;
      this.contract = null;
      this.discarded = [];
      this.trick = [];
      this.trickNo = 0;
      this.history = [];
      this.leader = null;
      this.turn = null;
      this.piles = { taker: [], def: [] };
      this.adjust = { taker: 0, def: 0 };
      this.result = null;
    }

    isTaker(p) { return p === this.taker; }
    team(p) { return p === this.taker ? 'taker' : 'def'; }

    /* ----- bidding ----- */

    canBid(contract) {
      return !this.highest || T.CONTRACTS[contract].level > T.CONTRACTS[this.highest.contract].level;
    }

    bid(player, contract) {
      if (this.phase !== 'bidding' || player !== this.bidder) throw new Error('Not your turn to bid');
      if (contract) {
        if (!this.canBid(contract)) throw new Error('Bid too low');
        this.highest = { player, contract };
      }
      this.bids.push({ player, contract: contract || null });
      if (this.bids.length === 4) this.endBidding();
      else this.bidder = (this.bidder + 1) % 4;
    }

    endBidding() {
      if (!this.highest) { this.phase = 'passed'; return; }
      this.taker = this.highest.player;
      this.contract = this.highest.contract;
      if (this.contract === 'petite' || this.contract === 'garde') {
        this.phase = 'dog';
      } else {
        (this.contract === 'sans' ? this.piles.taker : this.piles.def).push(...this.dog);
        this.startPlay();
      }
    }

    takeDog() {
      if (this.phase !== 'dog') throw new Error('No dog to take');
      this.hands[this.taker] = T.sortHand(this.hands[this.taker].concat(this.dog));
      this.phase = 'discard';
    }

    discard(cards) {
      if (this.phase !== 'discard') throw new Error('Not discarding');
      const err = T.validateDiscard(this.hands[this.taker], cards);
      if (err) throw new Error(err);
      this.hands[this.taker] = this.hands[this.taker].filter(c => !cards.includes(c));
      this.piles.taker.push(...cards);
      this.discarded = T.sortHand(cards);
      this.startPlay();
    }

    startPlay() {
      this.phase = 'play';
      this.leader = (this.dealer + 1) % 4;
      this.turn = this.leader;
      this.trick = [];
      this.trickNo = 0;
    }

    /* ----- play ----- */

    legalFor(player) { return T.legalInfo(this.hands[player], this.trick); }

    play(player, card) {
      if (this.phase !== 'play' || this.turn !== player) throw new Error('Not your turn');
      if (!this.hands[player].includes(card)) throw new Error('Card not in hand');
      if (!this.legalFor(player).cards.includes(card)) throw new Error('Illegal card');
      this.hands[player] = this.hands[player].filter(c => c !== card);
      this.trick.push({ player, card });
      this.turn = this.trick.length === 4 ? null : (player + 1) % 4;
    }

    get trickComplete() { return this.trick.length === 4; }

    collectTrick() {
      if (!this.trickComplete) throw new Error('Trick not complete');
      const idx = T.trickWinnerIndex(this.trick);
      const winner = this.trick[idx].player;
      const winTeam = this.team(winner);
      const last = this.trickNo === TOTAL_TRICKS - 1;
      let cards = this.trick.map(p => p.card);

      const ex = this.trick.find(p => p.card.suit === 'X');
      if (ex && !last) {
        // The Excuse stays with its owner's camp; a low card is handed over in exchange (0.5 pt).
        const ownTeam = this.team(ex.player);
        if (ownTeam !== winTeam) {
          this.piles[ownTeam].push(ex.card);
          this.adjust[ownTeam] -= 0.5;
          this.adjust[winTeam] += 0.5;
          cards = cards.filter(c => c !== ex.card);
        }
      }
      this.piles[winTeam].push(...cards);

      const record = {
        no: this.trickNo, cards: this.trick.slice(), winner,
        points: T.sumPoints(this.trick.map(p => p.card)),
      };
      this.history.push(record);
      if (last && this.trick.some(p => p.card.id === 'T1')) this.petitAuBout = winTeam;

      this.trickNo++;
      this.trick = [];
      if (this.trickNo === TOTAL_TRICKS) {
        this.phase = 'done';
        this.turn = null;
        this.result = this.computeResult();
      } else {
        this.leader = winner;
        this.turn = winner;
      }
      return record;
    }

    /* ----- scoring ----- */

    takerPointsSoFar() { return T.sumPoints(this.piles.taker) + this.adjust.taker; }
    takerOudlersSoFar() { return this.piles.taker.filter(c => c.oudler).length; }

    computeResult() {
      const takerPoints = this.takerPointsSoFar();
      const oudlers = this.takerOudlersSoFar();
      const required = T.requiredPoints(oudlers);
      const diff = takerPoints - required;
      const win = diff >= 0;
      const mult = T.CONTRACTS[this.contract].mult;
      const gap = Math.ceil(Math.abs(diff));
      const petit = this.petitAuBout ? (this.petitAuBout === 'taker' ? 10 : -10) : 0;
      const base = (win ? 1 : -1) * (25 + gap);
      const perDefender = (base + petit) * mult;
      const totals = [0, 0, 0, 0].map((_, p) => (p === this.taker ? perDefender * 3 : -perDefender));
      return {
        taker: this.taker, contract: this.contract, takerPoints, defPoints: 91 - takerPoints,
        oudlers, required, diff, win, gap, mult, base, petit, perDefender, totals,
        petitAuBout: this.petitAuBout || null,
      };
    }

    /* ----- bots ----- */

    /** Performs the current bot action. Returns an event describing it. */
    botStep() {
      if (this.phase === 'bidding') {
        const p = this.bidder;
        const r = T.Bots.chooseBid(this.hands[p], this.highest, this.aggr[p]);
        this.bid(p, r.contract);
        return { kind: 'bid', player: p, contract: r.contract, reason: r.reason };
      }
      if (this.phase === 'dog') {
        this.takeDog();
        return { kind: 'dog', player: this.taker };
      }
      if (this.phase === 'discard') {
        const p = this.taker;
        const r = T.Bots.chooseDiscard(this.hands[p]);
        this.discard(r.cards);
        return { kind: 'discard', player: p, cards: r.cards, reason: r.reason };
      }
      if (this.phase === 'play' && this.turn != null) {
        const p = this.turn;
        const r = this.suggest(p);
        this.play(p, r.card);
        return { kind: 'play', player: p, card: r.card, reason: r.reason };
      }
      throw new Error('Nothing for a bot to do in phase ' + this.phase);
    }

    suggest(player) {
      return T.Bots.choosePlay({
        hand: this.hands[player], trick: this.trick, player, taker: this.taker, trickNo: this.trickNo,
      });
    }
  }

  T.Game = Game;
  T.SEAT_NAMES = SEAT_NAMES;
  T.TOTAL_TRICKS = TOTAL_TRICKS;
})(window.Tarot = window.Tarot || {});
