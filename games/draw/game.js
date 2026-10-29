/* Five-card draw: 5 private cards, bet, draw (swap up to 3), bet, showdown. Reuses the Hold'em betting engine. */
(function (P) {
  'use strict';

  const MAX_DRAW = 3;

  class DrawTable extends P.Table {
    constructor(opts) {
      super(opts);
      this.holeSize = 5;
      this.firstPhase = 'predraw';
      this.bettingPhases = ['predraw', 'postdraw'];
      this.drawn = {};
    }

    isLastBettingRound() { return this.phase === 'postdraw'; }

    startHand() {
      this.drawn = {};
      return super.startHand();
    }

    /** Called by the betting engine when the first round is over. */
    dealStreet() {
      this.phase = 'draw';
      this.pendingRunout = false;
      this.drawOrder = [];
      let from = this.button;
      for (let k = 0; k < this.players.length; k++) {
        const id = this.nextSeat(from, p => p.inHand && !p.folded && !this.drawOrder.includes(p.id));
        if (id < 0) break;
        this.drawOrder.push(id); from = id;
      }
      this.toAct = this.drawOrder[0];
    }

    /** Replace the cards at `indices` of player i's hand. Returns the new cards. */
    drawCards(i, indices) {
      if (this.phase !== 'draw' || this.toAct !== i) throw new Error('Not your turn to draw');
      const uniq = [...new Set(indices)];
      if (uniq.length > MAX_DRAW) throw new Error(`You can swap at most ${MAX_DRAW} cards`);
      if (uniq.some(k => k < 0 || k > 4)) throw new Error('Bad card index');
      const p = this.players[i];
      const fresh = uniq.map(() => this.deck.pop());
      uniq.forEach((k, n) => { p.hole[k] = fresh[n]; });
      this.drawn[i] = uniq.length;
      const next = this.drawOrder[this.drawOrder.indexOf(i) + 1];
      if (next != null) { this.toAct = next; return fresh; }
      this.finishDraw();
      return fresh;
    }

    finishDraw() {
      this.phase = 'postdraw';
      if (this.bettors().length < 2) { this.toAct = null; this.showdown(); return; }
      this.toAct = this.nextSeat(this.button, p => p.inHand && !p.folded && !p.allIn);
    }
  }

  DrawTable.MAX_DRAW = MAX_DRAW;
  P.DrawTable = DrawTable;
})(window.Poker = window.Poker || {});
