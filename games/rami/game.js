/* Le Rami game state: 2-4 players, 13 cards each, opening at 51 points. No DOM. */
(function (R, P) {
  'use strict';

  const HAND = 13;
  const UNOPENED_PENALTY = 100;
  const MAX_TURNS_PER_PLAYER = 45;

  class Rami {
    constructor(opts) {
      opts = opts || {};
      this.n = opts.players || 4;
      this.names = opts.names || ['Vous', 'Ana', 'Bruno', 'Chloé'].slice(0, this.n);
      this.rounds = opts.rounds || 5;
      this.scores = Array(this.n).fill(0);
      this.round = 0;
      this.dealer = this.n - 1;
      this.nextId = 1;
      this.newRound();
    }

    newRound() {
      this.round++;
      this.dealer = (this.dealer + 1) % this.n;
      const deck = P.shuffle(R.DECK.slice());
      this.hands = Array.from({ length: this.n }, () => R.sortHand(deck.splice(0, HAND)));
      this.discardPile = [deck.pop()];
      this.stock = deck;
      this.table = [];
      this.opened = Array(this.n).fill(false);
      this.turn = (this.dealer + 1) % this.n;
      this.phase = 'draw';
      this.taken = null;
      this.turns = 0;
      this.result = null;
    }

    top() { return this.discardPile[this.discardPile.length - 1]; }

    refill() {
      if (this.stock.length) return;
      const keep = this.discardPile.pop();
      this.stock = P.shuffle(this.discardPile);
      this.discardPile = [keep];
    }

    check(p, phase) { if (this.phase !== phase || this.turn !== p) throw new Error('Ce n\'est pas votre tour.'); }

    drawStock(p) {
      this.check(p, 'draw');
      this.refill();
      const c = this.stock.pop();
      this.hands[p] = R.sortHand(this.hands[p].concat(c));
      this.phase = 'play'; this.taken = null;
      return c;
    }

    drawDiscard(p) {
      this.check(p, 'draw');
      const c = this.discardPile.pop();
      this.hands[p] = R.sortHand(this.hands[p].concat(c));
      this.phase = 'play'; this.taken = c;
      return c;
    }

    /** Validate groups (arrays of cards from hand) for laying down. Returns {error, analyses, points}. */
    checkLay(p, groups) {
      const hand = this.hands[p];
      const used = new Set();
      const analyses = [];
      for (const g of groups) {
        for (const c of g) {
          if (!hand.includes(c) || used.has(c)) return { error: 'Les cartes doivent venir de votre main, chacune une seule fois.' };
          used.add(c);
        }
        const an = R.analyze(g);
        if (!an) return { error: 'L\'un de ces groupes n\'est pas une combinaison valide.' };
        analyses.push(an);
      }
      if (!analyses.length) return { error: 'Rien à poser.' };
      const points = analyses.reduce((s, a) => s + a.points, 0);
      if (!this.opened[p]) {
        if (!analyses.some(a => a.type === 'run' && a.pure)) return { error: 'Pour ouvrir, il faut au moins une suite sans joker.' };
        if (points < R.OPEN_MIN) return { error: `Pour ouvrir, il faut ${R.OPEN_MIN} points ; vous en avez ${points}.` };
      }
      return { analyses, points };
    }

    layDown(p, groups) {
      this.check(p, 'play');
      const r = this.checkLay(p, groups);
      if (r.error) throw new Error(r.error);
      const used = new Set(groups.flat());
      this.hands[p] = this.hands[p].filter(c => !used.has(c));
      r.analyses.forEach(an => this.table.push({ id: this.nextId++, owner: p, an, cards: an.cards }));
      this.opened[p] = true;
      if (!this.hands[p].length) this.endRound(p);
      return r;
    }

    /** Would adding `cards` to table meld `meldId` be valid? Returns the new analysis or null. */
    checkExtend(p, meldId, cards) {
      const m = this.table.find(x => x.id === meldId);
      if (!m || !this.opened[p] || !cards.length || !cards.every(c => this.hands[p].includes(c))) return null;
      return R.analyze(m.cards.concat(cards));
    }

    extend(p, meldId, cards) {
      this.check(p, 'play');
      const an = this.checkExtend(p, meldId, cards);
      if (!an) throw new Error('Ces cartes ne vont pas dans cette combinaison (ou vous n\'avez pas encore ouvert).');
      const m = this.table.find(x => x.id === meldId);
      m.an = an; m.cards = an.cards;
      this.hands[p] = this.hands[p].filter(c => !cards.includes(c));
      if (!this.hands[p].length) this.endRound(p);
    }

    swapJoker(p, meldId, card) {
      this.check(p, 'play');
      const m = this.table.find(x => x.id === meldId);
      if (!m || !this.opened[p] || !this.hands[p].includes(card) || !R.canReplaceJoker(m.an, card)) throw new Error('Cette carte ne permet pas de récupérer le joker.');
      const joker = m.cards.find(c => c.joker);
      const an = R.analyze(m.cards.map(c => (c === joker ? card : c)));
      if (!an) throw new Error('Remplacement invalide.');
      m.an = an; m.cards = an.cards;
      this.hands[p] = R.sortHand(this.hands[p].filter(c => c !== card).concat(joker));
    }

    discard(p, card) {
      this.check(p, 'play');
      if (!this.hands[p].includes(card)) throw new Error('Cette carte n\'est pas dans votre main.');
      if (card.joker && this.hands[p].some(c => !c.joker)) throw new Error('On ne peut pas défausser un joker.');
      if (card === this.taken && this.hands[p].some(c => c !== card && !c.joker)) throw new Error('Vous ne pouvez pas rejeter la carte que vous venez de prendre dans la défausse.');
      this.hands[p] = this.hands[p].filter(c => c !== card);
      this.discardPile.push(card);
      if (!this.hands[p].length) { this.endRound(p); return; }
      this.turn = (p + 1) % this.n;
      this.phase = 'draw'; this.taken = null;
      if (++this.turns >= MAX_TURNS_PER_PLAYER * this.n) this.endRound(null);
    }

    /** winner = player who went out, or null when the round is void (nobody can finish). */
    endRound(winner) {
      const pen = [...Array(this.n).keys()].map(i => {
        if (i === winner) return 0;
        return this.opened[i] ? this.hands[i].reduce((s, c) => s + R.penalty(c), 0) : UNOPENED_PENALTY;
      });
      pen.forEach((v, i) => { this.scores[i] += v; });
      this.result = { winner, penalties: pen, stalemate: winner == null };
      this.phase = this.round >= this.rounds ? 'gameover' : 'roundover';
      this.turn = null;
    }

    nextRound() { this.newRound(); }
  }

  Object.assign(R, { Rami, RAMI_HAND: HAND, UNOPENED_PENALTY });
})(window.Rami = window.Rami || {}, window.Poker);
