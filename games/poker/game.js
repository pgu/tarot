/* Texas Hold'em, no-limit, cash-game style. Seats are clockwise; no DOM here. */
(function (P) {
  'use strict';

  class Table {
    constructor(opts) {
      opts = opts || {};
      const names = opts.names || ['You', 'Ada', 'Bruno', 'Chloé'];
      this.sb = opts.sb || 10;
      this.bb = opts.bb || 20;
      this.startChips = opts.chips || 1000;
      this.players = names.map((name, id) => ({
        id, name, chips: this.startChips, hole: [], bet: 0, total: 0,
        folded: false, allIn: false, acted: false, inHand: false,
      }));
      this.button = opts.button == null ? this.players.length - 1 : opts.button;
      this.handNo = 0;
      this.phase = 'idle';
    }

    /* ----- helpers ----- */
    get pot() { return this.players.reduce((s, p) => s + p.total, 0); }
    remaining() { return this.players.filter(p => p.inHand && !p.folded); }
    bettors() { return this.remaining().filter(p => !p.allIn); }
    activeCount() { return this.players.filter(p => p.chips > 0).length; }
    nextSeat(i, pred) {
      const n = this.players.length;
      for (let k = 1; k <= n; k++) {
        const p = this.players[(i + k) % n];
        if (pred(p)) return p.id;
      }
      return -1;
    }

    pay(p, amount) {
      const amt = Math.min(amount, p.chips);
      p.chips -= amt; p.bet += amt; p.total += amt;
      if (p.chips === 0) p.allIn = true;
      return amt;
    }

    /* ----- hand lifecycle ----- */
    startHand() {
      if (this.activeCount() < 2) { this.phase = 'gameover'; return false; }
      this.handNo++;
      this.deck = P.shuffle(P.DECK.slice());
      this.board = [];
      this.result = null;
      this.pendingRunout = false;
      this.players.forEach(p => {
        p.inHand = p.chips > 0; p.hole = []; p.bet = 0; p.total = 0;
        p.folded = false; p.allIn = false; p.acted = false;
      });
      this.button = this.nextSeat(this.button, p => p.inHand);
      const headsUp = this.remaining().length === 2;
      this.sbSeat = headsUp ? this.button : this.nextSeat(this.button, p => p.inHand);
      this.bbSeat = this.nextSeat(this.sbSeat, p => p.inHand);
      this.players.forEach(p => { if (p.inHand) p.hole = [this.deck.pop(), this.deck.pop()]; });
      this.pay(this.players[this.sbSeat], this.sb);
      this.pay(this.players[this.bbSeat], this.bb);
      this.currentBet = Math.max(this.players[this.sbSeat].bet, this.players[this.bbSeat].bet);
      this.lastRaise = this.bb;
      this.phase = 'preflop';
      this.toAct = this.nextSeat(this.bbSeat, p => p.inHand && !p.folded && !p.allIn);
      // blinds all-in edge case: nobody can act
      if (this.toAct < 0 || this.bettors().length < 2 && this.bettors().every(p => p.bet >= this.currentBet)) {
        this.closeRound();
      }
      return true;
    }

    /** What can player i do right now? */
    legal(i) {
      const p = this.players[i];
      const toCall = Math.max(0, this.currentBet - p.bet);
      const maxTo = p.bet + p.chips;
      const others = this.bettors().filter(q => q.id !== i);
      const canRaise = p.chips > toCall && others.length > 0;
      return {
        toCall, canCheck: toCall === 0, callAmount: Math.min(toCall, p.chips),
        canRaise, minRaiseTo: Math.min(this.currentBet + this.lastRaise, maxTo), maxRaiseTo: maxTo,
      };
    }

    act(i, action) {
      if (this.toAct !== i || !['preflop', 'flop', 'turn', 'river'].includes(this.phase)) throw new Error('Not your turn');
      const p = this.players[i];
      const lg = this.legal(i);
      switch (action.type) {
        case 'fold':
          p.folded = true;
          break;
        case 'check':
          if (!lg.canCheck) throw new Error('Cannot check');
          break;
        case 'call':
          this.pay(p, lg.toCall);
          break;
        case 'raise': {
          if (!lg.canRaise) throw new Error('Cannot raise');
          const to = Math.min(Math.round(action.to), lg.maxRaiseTo);
          if (to < lg.minRaiseTo) throw new Error('Raise too small');
          this.pay(p, to - p.bet);
          if (p.bet > this.currentBet) {
            const size = p.bet - this.currentBet;
            if (size >= this.lastRaise) this.lastRaise = size;
            this.currentBet = p.bet;
            this.players.forEach(q => { if (q.id !== i) q.acted = false; });
          }
          break;
        }
        default: throw new Error('Unknown action');
      }
      p.acted = true;
      this.afterAction(i);
    }

    afterAction(i) {
      const rem = this.remaining();
      if (rem.length === 1) { this.finishUncontested(rem[0]); return; }
      const need = q => !q.acted || q.bet < this.currentBet;
      const bett = this.bettors();
      const done = bett.every(q => !need(q)) ||
        (bett.length <= 1 && bett.every(q => q.bet >= this.currentBet));
      if (done) this.closeRound();
      else this.toAct = this.nextSeat(i, q => q.inHand && !q.folded && !q.allIn && need(q));
    }

    closeRound() {
      this.players.forEach(p => { p.bet = 0; p.acted = false; });
      this.currentBet = 0;
      this.lastRaise = this.bb;
      this.toAct = null;
      if (this.phase === 'river') { this.showdown(); return; }
      this.dealStreet();
    }

    dealStreet() {
      if (this.phase === 'preflop') { this.board.push(this.deck.pop(), this.deck.pop(), this.deck.pop()); this.phase = 'flop'; }
      else if (this.phase === 'flop') { this.board.push(this.deck.pop()); this.phase = 'turn'; }
      else if (this.phase === 'turn') { this.board.push(this.deck.pop()); this.phase = 'river'; }
      if (this.bettors().length < 2) {
        this.pendingRunout = true; // nobody can bet: UI deals the rest step by step
      } else {
        this.pendingRunout = false;
        this.toAct = this.nextSeat(this.button, p => p.inHand && !p.folded && !p.allIn);
      }
    }

    /** Deal the next street (or go to showdown) when all remaining players are all-in. */
    runoutStep() {
      if (!this.pendingRunout) throw new Error('No runout pending');
      if (this.phase === 'river') { this.pendingRunout = false; this.showdown(); } else this.dealStreet();
    }

    finishUncontested(winner) {
      const pot = this.pot;
      winner.chips += pot;
      this.result = { uncontested: true, pots: [{ amount: pot, winners: [winner.id], eligible: [winner.id] }], hands: {} };
      this.endHand();
    }

    sidePots() {
      const tot = this.players.filter(p => p.total > 0);
      const levels = [...new Set(tot.map(p => p.total))].sort((a, b) => a - b);
      const pots = [];
      let prev = 0;
      for (const lvl of levels) {
        const amount = tot.reduce((s, p) => s + Math.max(0, Math.min(p.total, lvl) - prev), 0);
        const eligible = this.remaining().filter(p => p.total >= lvl).map(p => p.id);
        if (!eligible.length && pots.length) pots[pots.length - 1].amount += amount;
        else pots.push({ amount, eligible, winners: [] });
        prev = lvl;
      }
      return pots;
    }

    showdown() {
      this.phase = 'showdown';
      const hands = {};
      this.remaining().forEach(p => { hands[p.id] = P.bestHand(p.hole.concat(this.board)); });
      const pots = this.sidePots();
      pots.forEach(pot => {
        let best = -1;
        pot.eligible.forEach(id => { if (hands[id].value > best) best = hands[id].value; });
        pot.winners = pot.eligible.filter(id => hands[id].value === best);
        const share = Math.floor(pot.amount / pot.winners.length);
        let rest = pot.amount - share * pot.winners.length;
        // odd chips go to the winners closest to the button's left
        const order = pot.winners.slice().sort((a, b) =>
          ((a - this.button + 8) % 8) - ((b - this.button + 8) % 8));
        order.forEach(id => { this.players[id].chips += share + (rest-- > 0 ? 1 : 0); });
      });
      this.result = { uncontested: false, pots, hands };
      this.endHand();
    }

    endHand() {
      this.phase = 'done';
      this.toAct = null;
      this.pendingRunout = false;
    }
  }

  P.Table = Table;
})(window.Poker = window.Poker || {});
