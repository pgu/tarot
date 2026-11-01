/* La Belote classique: state machine for one deal (4 players, 2 teams, 8 tricks). No DOM here. */
(function (B) {
  'use strict';

  const TRICKS = 8;
  const NEED = 82; // the taker's team needs at least 82 of the 162 points
  const team = p => p % 2;

  class Belote {
    constructor(opts) {
      opts = opts || {};
      this.dealer = opts.dealer == null ? 3 : opts.dealer;
      this.aggr = opts.aggr || [0, 0.4, 0, -0.4];
      this.newDeal();
    }

    newDeal() {
      const deck = B.shuffle(B.DECK.slice());
      this.hands = [0, 1, 2, 3].map(i => B.sortHand(deck.slice(i * 5, i * 5 + 5), null));
      this.turned = deck[20];
      this.stock = deck.slice(21);
      this.phase = 'bid1';
      this.bidder = (this.dealer + 1) % 4;
      this.bids = [];
      this.trump = null;
      this.taker = null;
      this.trick = [];
      this.trickNo = 0;
      this.history = [];
      this.won = [[], []];
      this.tricksWon = [0, 0];
      this.lastTeam = null;
      this.belote = null; // {player, played}
      this.beloteTeam = null;
      this.result = null;
      this.leader = null;
      this.turn = null;
    }

    /* ----- bidding: round 1 takes the turned suit, round 2 any other suit ----- */

    /** suit: the suit taken (round 1: must be the turned suit), or null to pass. */
    bid(player, suit) {
      if ((this.phase !== 'bid1' && this.phase !== 'bid2') || player !== this.bidder) throw new Error('Ce n\'est pas votre tour d\'annoncer.');
      if (suit) {
        if (this.phase === 'bid1' && suit !== this.turned.suit) throw new Error('Au premier tour, on ne peut prendre que la couleur de la retourne.');
        if (this.phase === 'bid2' && suit === this.turned.suit) throw new Error('Au second tour, on ne peut pas reprendre la couleur de la retourne.');
        this.bids.push({ player, suit, round: this.phase });
        this.take(player, suit);
        return;
      }
      this.bids.push({ player, suit: null, round: this.phase });
      const n = this.bids.filter(b => b.round === this.phase).length;
      if (n === 4) {
        if (this.phase === 'bid1') { this.phase = 'bid2'; this.bidder = (this.dealer + 1) % 4; } else this.phase = 'allpass';
      } else this.bidder = (this.bidder + 1) % 4;
    }

    take(player, suit) {
      this.taker = player;
      this.trump = suit;
      // the taker gets the turned card + 2 more; the others 3 each
      const k = this.stock.slice();
      this.hands[player] = this.hands[player].concat(this.turned, k.splice(0, 2));
      for (let i = 1; i < 4; i++) { const p = (player + i) % 4; this.hands[p] = this.hands[p].concat(k.splice(0, 3)); }
      this.stock = [];
      this.hands = this.hands.map(h => B.sortHand(h, suit));
      this.phase = 'play';
      this.leader = (this.dealer + 1) % 4;
      this.turn = this.leader;
      // belote-rebelote: one player holding both king and queen of the trump
      for (let p = 0; p < 4; p++) {
        const h = this.hands[p];
        if (h.some(c => c.suit === suit && c.rank === 13) && h.some(c => c.suit === suit && c.rank === 12)) this.belote = { player: p, played: 0 };
      }
    }

    /* ----- play ----- */

    legalFor(player) { return B.legalInfo(this.hands[player], this.trick, this.trump, player); }

    /** Plays a card. Returns {announce: 'belote' | 'rebelote' | null}. */
    play(player, card) {
      if (this.phase !== 'play' || this.turn !== player) throw new Error('Ce n\'est pas votre tour.');
      if (!this.hands[player].includes(card)) throw new Error('Cette carte n\'est pas dans votre main.');
      if (!this.legalFor(player).cards.includes(card)) throw new Error('Carte interdite.');
      this.hands[player] = this.hands[player].filter(c => c !== card);
      this.trick.push({ player, card });
      this.turn = this.trick.length === 4 ? null : (player + 1) % 4;
      let announce = null;
      if (this.belote && this.belote.player === player && card.suit === this.trump && (card.rank === 13 || card.rank === 12)) {
        this.belote.played++;
        announce = this.belote.played === 1 ? 'belote' : 'rebelote';
        if (announce === 'rebelote') this.beloteTeam = team(player);
      }
      return { announce };
    }

    get trickComplete() { return this.trick.length === 4; }
    trickWinnerIdx() { return B.trickWinnerIndex(this.trick, this.trump); }

    collectTrick() {
      if (!this.trickComplete) throw new Error('Le pli n\'est pas terminé.');
      const winner = this.trick[this.trickWinnerIdx()].player;
      const t = team(winner);
      const cards = this.trick.map(p => p.card);
      this.won[t].push(...cards);
      this.tricksWon[t]++;
      const rec = { no: this.trickNo, cards: this.trick.slice(), winner, points: B.sumPoints(cards, this.trump) };
      this.history.push(rec);
      this.trickNo++;
      this.trick = [];
      if (this.trickNo === TRICKS) {
        this.lastTeam = t;
        this.phase = 'done';
        this.turn = null;
        this.result = this.computeResult();
      } else { this.leader = winner; this.turn = winner; }
      return rec;
    }

    /* ----- scoring ----- */

    /** Points the team has banked so far (cards only). */
    pointsSoFar(t) { return B.sumPoints(this.won[t], this.trump); }

    computeResult() {
      const tt = team(this.taker); const dt = 1 - tt;
      const raw = [0, 1].map(t => this.pointsSoFar(t) + (this.lastTeam === t ? 10 : 0));
      const capotTeam = this.tricksWon[0] === TRICKS ? 0 : this.tricksWon[1] === TRICKS ? 1 : null;
      if (capotTeam != null) raw[capotTeam] += 90;
      const bel = [0, 0]; if (this.beloteTeam != null) bel[this.beloteTeam] = 20;
      const takerTotal = raw[tt] + bel[tt];
      const made = takerTotal >= NEED && (capotTeam == null || capotTeam === tt);
      const scores = [0, 0];
      if (made) { scores[tt] = raw[tt] + bel[tt]; scores[dt] = raw[dt] + bel[dt]; }
      else { scores[tt] = bel[tt]; scores[dt] = (capotTeam === dt ? 252 : 162) + bel[dt]; }
      return {
        taker: this.taker, takerTeam: tt, trump: this.trump, raw, capot: capotTeam, belote: bel, takerTotal, need: NEED, made, scores,
        lastTeam: this.lastTeam,
      };
    }

    /* ----- bots ----- */

    botStep() {
      if (this.phase === 'bid1' || this.phase === 'bid2') {
        const p = this.bidder;
        const round = this.phase === 'bid1' ? 1 : 2;
        const r = B.Bots.chooseBid(this.hands[p], this.turned, round, this.aggr[p], p === this.dealer);
        this.bid(p, r.suit);
        return { kind: 'bid', player: p, suit: r.suit, round, reason: r.reason };
      }
      if (this.phase === 'play' && this.turn != null) {
        const p = this.turn;
        const r = this.suggest(p);
        const { announce } = this.play(p, r.card);
        return { kind: 'play', player: p, card: r.card, reason: r.reason, announce };
      }
      throw new Error('Nothing for a bot to do in phase ' + this.phase);
    }

    suggest(player) {
      return B.Bots.choosePlay({
        hand: this.hands[player], trick: this.trick, player, trump: this.trump, taker: this.taker,
        trickNo: this.trickNo, played: this.history.flatMap(h => h.cards.map(x => x.card)).concat(this.trick.map(x => x.card)),
      });
    }
  }

  B.Belote = Belote;
  B.TRICKS = TRICKS;
  B.NEED = NEED;
  B.teamOf = team;
})(window.Belote = window.Belote || {});
