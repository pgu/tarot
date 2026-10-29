/* Chinchón (Spanish rummy, 40-card deck, 7 cards each, 2-4 players). Rules + game state, no DOM. */
(function (S) {
  'use strict';

  const SEQ = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]; // in a run, the 7 is followed by the Sota
  const seqIdx = c => SEQ.indexOf(c.rank);
  /** Points of a card when left unmatched: As..7 as printed, figures 10. */
  const points = c => (c.rank >= 10 ? 10 : c.rank);
  const sumPoints = cards => cards.reduce((s, c) => s + points(c), 0);
  const LIMIT = 100;
  const CLOSE_MAX = 5;
  const STALEMATE_TURNS = 60;

  /** Every valid combination (as arrays of indices into `cards`). */
  function candidateMelds(cards) {
    const out = [];
    // sets: 3 or 4 cards of the same rank
    const byRank = {};
    cards.forEach((c, i) => { (byRank[c.rank] = byRank[c.rank] || []).push(i); });
    Object.values(byRank).forEach(idx => {
      if (idx.length < 3) return;
      if (idx.length === 3) out.push(idx.slice());
      if (idx.length === 4) {
        out.push(idx.slice());
        for (let skip = 0; skip < 4; skip++) out.push(idx.filter((_, k) => k !== skip));
      }
    });
    // runs: 3+ consecutive cards of the same suit
    S.SUITS.forEach(s => {
      const bySeq = {};
      cards.forEach((c, i) => { if (c.suit === s) bySeq[seqIdx(c)] = i; });
      for (let a = 0; a < SEQ.length; a++) {
        const run = [];
        for (let b = a; b < SEQ.length && bySeq[b] != null; b++) {
          run.push(bySeq[b]);
          if (run.length >= 3) out.push(run.slice());
        }
      }
    });
    return out;
  }

  /** Best way to group `cards` into combinations (fewest points left over). */
  function bestArrangement(cards) {
    const melds = candidateMelds(cards).map(m => ({ idx: m, mask: m.reduce((x, i) => x | (1 << i), 0) }));
    const pts = cards.map(points);
    let best = { left: Infinity, chosen: [] };
    const total = pts.reduce((a, b) => a + b, 0);
    const rec = (start, mask, chosen, melded) => {
      const left = total - melded;
      if (left < best.left || (left === best.left && chosen.length < best.chosen.length)) best = { left, chosen: chosen.slice() };
      for (let j = start; j < melds.length; j++) {
        if (melds[j].mask & mask) continue;
        const add = melds[j].idx.reduce((s, i) => s + pts[i], 0);
        chosen.push(j);
        rec(j + 1, mask | melds[j].mask, chosen, melded + add);
        chosen.pop();
      }
    };
    rec(0, 0, [], 0);
    const used = new Set();
    const groups = best.chosen.map(j => melds[j].idx.map(i => { used.add(i); return cards[i]; }));
    const dead = cards.filter((_, i) => !used.has(i));
    return { melds: groups, deadwood: dead, points: sumPoints(dead) };
  }

  /** 7 cards in one run of the same suit. */
  function isChinchon(cards) {
    if (cards.length !== 7) return false;
    const a = bestArrangement(cards);
    return a.melds.length === 1 && a.melds[0].length === 7;
  }

  /** With 8 cards: for each possible discard, how good is the remaining hand? Best first. */
  function discardOptions(hand8) {
    return hand8.map((card, i) => {
      const rest = hand8.filter((_, k) => k !== i);
      const arr = bestArrangement(rest);
      return { card, rest, arrangement: arr, points: arr.points, canClose: arr.points <= CLOSE_MAX };
    }).sort((a, b) => a.points - b.points || points(b.card) - points(a.card));
  }

  /** Is a candidate meld valid? Used by drills. */
  function isMeld(cards) {
    if (cards.length < 3) return false;
    if (cards.every(c => c.rank === cards[0].rank)) return cards.length <= 4 && new Set(cards.map(c => c.suit)).size === cards.length;
    if (!cards.every(c => c.suit === cards[0].suit)) return false;
    const idx = cards.map(seqIdx).sort((a, b) => a - b);
    return idx.every((v, k) => k === 0 || v === idx[k - 1] + 1);
  }

  class Chinchon {
    constructor(opts) {
      opts = opts || {};
      this.n = opts.players || 4;
      this.names = opts.names || ['You', 'Ana', 'Bruno', 'Carla'].slice(0, this.n);
      this.scores = Array(this.n).fill(0);
      this.out = Array(this.n).fill(false);
      this.dealer = this.n - 1;
      this.winner = null;
      this.round = 0;
      this.newRound();
    }

    active() { return [...Array(this.n).keys()].filter(i => !this.out[i]); }
    nextActive(i) { for (let k = 1; k <= this.n; k++) { const j = (i + k) % this.n; if (!this.out[j]) return j; } return i; }

    newRound() {
      this.round++;
      this.dealer = this.nextActive(this.dealer);
      const deck = S.shuffle(S.DECK.slice());
      this.hands = Array.from({ length: this.n }, () => []);
      this.active().forEach(i => { this.hands[i] = S.sortCards(deck.splice(0, 7)); });
      this.discardPile = [deck.pop()];
      this.stock = deck;
      this.turn = this.nextActive(this.dealer);
      this.phase = 'draw';
      this.taken = null; // card just taken from the discard pile (cannot be thrown straight back)
      this.roundResult = null;
      this.lastEvent = null;
      this.turnsPlayed = 0;
    }

    top() { return this.discardPile[this.discardPile.length - 1]; }

    refillStock() {
      if (this.stock.length) return;
      const keep = this.discardPile.pop();
      this.stock = S.shuffle(this.discardPile);
      this.discardPile = [keep];
    }

    drawStock(p) {
      this.check(p, 'draw');
      this.refillStock();
      const c = this.stock.pop();
      this.hands[p] = S.sortCards(this.hands[p].concat(c));
      this.phase = 'discard'; this.taken = null;
      return c;
    }

    drawDiscard(p) {
      this.check(p, 'draw');
      const c = this.discardPile.pop();
      this.hands[p] = S.sortCards(this.hands[p].concat(c));
      this.phase = 'discard'; this.taken = c;
      return c;
    }

    check(p, phase) {
      if (this.phase !== phase || this.turn !== p) throw new Error(`Not your turn to ${phase}`);
    }

    discard(p, card) {
      this.check(p, 'discard');
      if (!this.hands[p].includes(card)) throw new Error('Card not in hand');
      if (card === this.taken) throw new Error('You cannot throw back the card you just took from the discard pile');
      this.hands[p] = this.hands[p].filter(c => c !== card);
      this.discardPile.push(card);
      this.turn = this.nextActive(p);
      this.phase = 'draw'; this.taken = null;
      if (++this.turnsPlayed >= STALEMATE_TURNS) this.stalemate();
    }

    /** Nobody can close (the same cards keep going round): the round is void and nobody scores. */
    stalemate() {
      this.roundResult = { stalemate: true, closer: null, arrangements: {}, deltas: Array(this.n).fill(0) };
      this.active().forEach(i => { this.roundResult.arrangements[i] = bestArrangement(this.hands[i]); });
      this.phase = 'roundover';
      this.turn = null;
    }

    /** Close the round by putting `card` face down. Valid when the other 7 leave at most 5 points. */
    canClose(p, card) {
      if (this.phase !== 'discard' || this.turn !== p) return false;
      const rest = this.hands[p].filter(c => c !== card);
      return rest.length === 7 && bestArrangement(rest).points <= CLOSE_MAX;
    }

    close(p, card) {
      if (!this.canClose(p, card)) throw new Error('You cannot close with this hand');
      const rest = this.hands[p].filter(c => c !== card);
      this.hands[p] = rest;
      this.closedCard = card;
      const arrangements = {};
      this.active().forEach(i => { arrangements[i] = bestArrangement(this.hands[i]); });
      const chinchon = isChinchon(rest);
      const deltas = Array(this.n).fill(0);
      this.active().forEach(i => { deltas[i] = arrangements[i].points; });
      let bonus = 0;
      if (arrangements[p].points === 0 && !chinchon) { bonus = -10; deltas[p] = -10; }
      this.roundResult = { closer: p, arrangements, deltas, chinchon, bonus, closedCard: card };
      if (chinchon) {
        this.winner = p;
        this.phase = 'gameover';
      } else {
        this.active().forEach(i => {
          this.scores[i] += deltas[i];
          if (this.scores[i] > LIMIT) this.out[i] = true;
        });
        const left = this.active();
        if (left.length <= 1 || this.out[0]) {
          this.phase = 'gameover';
          this.winner = left.length === 1 ? left[0] : left.sort((a, b) => this.scores[a] - this.scores[b])[0];
          if (left.length === 0) this.winner = [...Array(this.n).keys()].sort((a, b) => this.scores[a] - this.scores[b])[0];
        } else this.phase = 'roundover';
      }
      this.turn = null;
      return this.roundResult;
    }
  }

  Object.assign(S, {
    Chinchon, chinchonPoints: points, chinchonSeq: SEQ, bestArrangement, discardOptions, isChinchonHand: isChinchon,
    isMeld, CHINCHON_LIMIT: LIMIT, CHINCHON_CLOSE_MAX: CLOSE_MAX, chinchonSeqIdx: seqIdx,
  });
})(window.Spanish = window.Spanish || {});
