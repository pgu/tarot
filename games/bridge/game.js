/* Le Bridge: state machine for one deal (auction, play with dummy, result). No DOM here. */
(function (Br) {
  'use strict';
  const { side, partner } = Br;

  class Bridge {
    /** opts: {dealer, vul: [NS, EW]} */
    constructor(opts) {
      opts = opts || {};
      this.dealer = opts.dealer == null ? 0 : opts.dealer;
      this.vul = opts.vul || [false, false];
      this.newDeal();
    }

    newDeal() {
      const deck = Br.shuffle(Br.DECK.slice());
      this.hands = [0, 1, 2, 3].map(i => Br.sortHand(deck.slice(i * 13, i * 13 + 13)));
      this.auction = [];
      this.bidder = this.dealer;
      this.phase = 'bidding';
      this.contract = null; this.declarer = null; this.dummy = null;
      this.dummyVisible = false;
      this.trick = []; this.trickNo = 0; this.history = [];
      this.tricksWon = [0, 0];
      this.leader = null; this.turn = null;
      this.result = null;
    }

    /* ----- auction ----- */
    legal(call) { return Br.isLegalCall(this.auction, this.bidder, call); }

    call(seat, call) {
      if (this.phase !== 'bidding' || seat !== this.bidder) throw new Error('Ce n\'est pas votre tour d\'annoncer.');
      if (!Br.isLegalCall(this.auction, seat, call)) throw new Error('Enchère impossible.');
      this.auction.push({ seat, call });
      if (Br.auctionOver(this.auction)) {
        if (!this.auction.some(a => a.call.t !== 'p')) { this.phase = 'passedout'; return; }
        this.startPlay();
      } else this.bidder = (seat + 1) % 4;
    }

    startPlay() {
      const c = Br.finalContract(this.auction);
      this.contract = c;
      this.declarer = c.declarer;
      this.dummy = partner(c.declarer);
      this.trump = c.strain === 'N' ? null : c.strain;
      this.phase = 'play';
      this.leader = (c.declarer + 1) % 4;
      this.turn = this.leader;
      this.trick = []; this.trickNo = 0;
    }

    /* ----- play ----- */
    controller(seat) { return seat === this.dummy ? this.declarer : seat; }
    roleOf(seat) { return seat === this.declarer ? 'declarer' : seat === this.dummy ? 'dummy' : 'defender'; }
    legalFor(seat) { return Br.legalCards(this.hands[seat], this.trick); }
    get trickComplete() { return this.trick.length === 4; }
    trickWinnerIdx() { return Br.trickWinnerIndex(this.trick, this.trump); }

    play(seat, card) {
      if (this.phase !== 'play' || this.turn !== seat) throw new Error('Ce n\'est pas votre tour.');
      if (!this.hands[seat].includes(card)) throw new Error('Cette carte n\'est pas dans la main.');
      if (!this.legalFor(seat).includes(card)) throw new Error('Il faut fournir à la couleur demandée.');
      this.hands[seat] = this.hands[seat].filter(c => c !== card);
      this.trick.push({ player: seat, card });
      if (this.trickNo === 0 && this.trick.length === 1) this.dummyVisible = true; // dummy goes down after the opening lead
      this.turn = this.trick.length === 4 ? null : (seat + 1) % 4;
    }

    collectTrick() {
      if (!this.trickComplete) throw new Error('Le pli n\'est pas terminé.');
      const winner = this.trick[this.trickWinnerIdx()].player;
      this.tricksWon[side(winner)]++;
      const rec = { no: this.trickNo, cards: this.trick.slice(), winner };
      this.history.push(rec);
      this.trickNo++;
      this.trick = [];
      if (this.trickNo === 13) { this.phase = 'done'; this.turn = null; this.result = this.computeResult(); } else { this.leader = winner; this.turn = winner; }
      return rec;
    }

    computeResult() {
      const ds = side(this.declarer);
      const tricks = this.tricksWon[ds];
      const vul = this.vul[ds];
      const res = Br.scoreDeal(this.contract, tricks, vul);
      return { contract: this.contract, declarer: this.declarer, side: ds, tricks, vul, res };
    }

    /* ----- bots ----- */
    /** Hand visible to the player taking decisions (for AI): partner hand known only for the declaring side. */
    contextFor(seat) {
      const role = this.roleOf(seat);
      const declaring = role !== 'defender';
      return {
        hand: this.hands[seat], trick: this.trick, trump: this.trump, seat, role, trickNo: this.trickNo,
        played: this.history.flatMap(h => h.cards.map(x => x.card)).concat(this.trick.map(x => x.card)),
        partnerHand: declaring ? this.hands[partner(seat)] : null,
        dummyHand: !declaring && this.dummyVisible ? this.hands[this.dummy] : null,
      };
    }

    suggest(seat) { return Br.AI.choose(this.contextFor(seat)); }

    botStep() {
      if (this.phase === 'bidding') {
        const seat = this.bidder;
        const r = Br.Bid.choose(this.hands[seat], this.auction, seat);
        this.call(seat, r.call);
        return { kind: 'call', seat, call: r.call, reason: r.reason };
      }
      if (this.phase === 'play' && this.turn != null) {
        const seat = this.turn;
        const r = this.suggest(seat);
        this.play(seat, r.card);
        return { kind: 'play', seat, by: this.controller(seat), card: r.card, reason: r.reason };
      }
      throw new Error('Nothing for a bot to do in phase ' + this.phase);
    }
  }

  Br.Bridge = Bridge;
})(window.Bridge = window.Bridge || {});
